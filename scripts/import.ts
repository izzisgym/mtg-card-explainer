#!/usr/bin/env tsx
/**
 * Scryfall bulk import script.
 * Downloads the "Default Cards" bulk JSON from Scryfall, upserts cards into
 * the database, and optionally uploads card images to S3.
 *
 * Usage:
 *   npx tsx scripts/import.ts                 # import cards only
 *   npx tsx scripts/import.ts --with-images   # import + upload images to S3
 *   npx tsx scripts/import.ts --limit 1000    # only import first N cards
 */

import { createWriteStream, existsSync } from "fs";
import { unlink } from "fs/promises";
import { createReadStream } from "fs";
import * as readline from "readline";
import path from "path";
import os from "os";
import { PrismaClient } from "@prisma/client";
import {
  getBulkDataInfo,
  getCardImageUrl,
  type ScryfallCard,
} from "../lib/scryfall";
import { uploadImageToS3, imageExistsOnS3 } from "../lib/s3";

const prisma = new PrismaClient();

const BATCH_SIZE = 500;

async function downloadFile(url: string, dest: string): Promise<void> {
  console.log(`Downloading ${url}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);

  await new Promise<void>((resolve, reject) => {
    const stream = createWriteStream(dest);
    if (!res.body) return reject(new Error("No body"));
    const reader = res.body.getReader();

    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          stream.write(value);
        }
        stream.end();
        stream.on("finish", resolve);
      } catch (err) {
        reject(err);
      }
    };
    pump();
  });

  console.log(`Downloaded to ${dest}`);
}

function mapScryfallCard(card: ScryfallCard) {
  return {
    id: card.id,
    name: card.name,
    oracleText: card.oracle_text ?? null,
    typeLine: card.type_line,
    manaCost: card.mana_cost ?? null,
    colors: card.colors ?? card.color_identity ?? [],
    setCode: card.set,
    setName: card.set_name ?? null,
    rarity: card.rarity ?? null,
    imageUrl: getCardImageUrl(card) ?? null,
    scryfallUri: card.scryfall_uri,
    power: card.power ?? null,
    toughness: card.toughness ?? null,
    loyalty: card.loyalty ?? null,
    keywords: card.keywords ?? [],
  };
}

async function* streamJsonArray(
  filePath: string
): AsyncGenerator<ScryfallCard> {
  const rl = readline.createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity,
  });

  let buffer = "";
  let depth = 0;
  let inString = false;
  let escape = false;
  let started = false;

  for await (const chunk of rl) {
    for (const char of chunk + "\n") {
      if (escape) {
        escape = false;
        buffer += char;
        continue;
      }
      if (char === "\\" && inString) {
        escape = true;
        buffer += char;
        continue;
      }
      if (char === '"') inString = !inString;
      if (!inString) {
        if (char === "{") {
          depth++;
          started = true;
        }
        if (char === "}") depth--;
      }
      if (started) buffer += char;

      if (started && depth === 0 && buffer.trim()) {
        try {
          const obj = JSON.parse(buffer.trim().replace(/^,/, ""));
          yield obj as ScryfallCard;
        } catch {
          // skip malformed
        }
        buffer = "";
        started = false;
      }
    }
  }
}

async function importCards(
  filePath: string,
  withImages: boolean,
  limit?: number
) {
  let batch: ReturnType<typeof mapScryfallCard>[] = [];
  let count = 0;
  let skipped = 0;

  console.log("Starting card import...");

  for await (const card of streamJsonArray(filePath)) {
    if (limit && count >= limit) break;

    // Skip tokens, emblems, and art cards
    if (
      card.type_line?.toLowerCase().includes("token") ||
      card.type_line?.toLowerCase().includes("emblem") ||
      card.set?.startsWith("t")
    ) {
      skipped++;
      continue;
    }

    batch.push(mapScryfallCard(card));

    if (batch.length >= BATCH_SIZE) {
      await upsertBatch(batch, withImages);
      count += batch.length;
      console.log(`Imported ${count} cards...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await upsertBatch(batch, withImages);
    count += batch.length;
  }

  console.log(`\nImport complete. ${count} cards imported, ${skipped} skipped.`);
}

async function upsertBatch(
  cards: ReturnType<typeof mapScryfallCard>[],
  withImages: boolean
) {
  await prisma.$transaction(
    cards.map((card) =>
      prisma.card.upsert({
        where: { id: card.id },
        update: {
          name: card.name,
          oracleText: card.oracleText,
          typeLine: card.typeLine,
          manaCost: card.manaCost,
          colors: card.colors,
          setCode: card.setCode,
          setName: card.setName,
          rarity: card.rarity,
          imageUrl: card.imageUrl,
          scryfallUri: card.scryfallUri,
          power: card.power,
          toughness: card.toughness,
          loyalty: card.loyalty,
          keywords: card.keywords,
        },
        create: card,
      })
    )
  );

  if (withImages) {
    for (const card of cards) {
      if (!card.imageUrl) continue;
      try {
        const exists = await imageExistsOnS3(card.id);
        if (exists) continue;
        const s3Url = await uploadImageToS3(card.id, card.imageUrl);
        await prisma.card.update({
          where: { id: card.id },
          data: { imageUrl: s3Url },
        });
      } catch (err) {
        console.error(`Failed to upload image for ${card.name}:`, err);
      }
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const withImages = args.includes("--with-images");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1]) : undefined;

  const tmpFile = path.join(os.tmpdir(), "scryfall-bulk.json");

  try {
    console.log("Fetching Scryfall bulk data info...");
    const bulkData = await getBulkDataInfo();
    const defaultCards = bulkData.find((b) => b.type === "default_cards");
    if (!defaultCards) throw new Error("Could not find default_cards bulk data");

    console.log(`Bulk data last updated: ${defaultCards.updated_at}`);
    console.log(`File size: ${(defaultCards.size / 1024 / 1024).toFixed(0)}MB`);

    await downloadFile(defaultCards.download_uri, tmpFile);
    await importCards(tmpFile, withImages, limit);
  } finally {
    if (existsSync(tmpFile)) {
      await unlink(tmpFile);
      console.log("Cleaned up temp file.");
    }
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
