#!/usr/bin/env tsx
/**
 * Scryfall bulk import script.
 * Downloads the "Default Cards" bulk JSON from Scryfall, upserts cards into
 * the database, and optionally uploads card images to S3.
 *
 * Usage:
 *   npx tsx scripts/import.ts                     # import cards only
 *   npx tsx scripts/import.ts --with-images       # import + upload images to S3
 *   npx tsx scripts/import.ts --limit=1000        # only import first N cards
 *   npx tsx scripts/import.ts --skip-download     # use existing /tmp/scryfall-bulk.json
 */

import { createWriteStream, existsSync, readFileSync } from "fs";
import { unlink } from "fs/promises";
import path from "path";
import os from "os";
import { PrismaClient } from "@prisma/client";
import { getBulkDataInfo, getCardImageUrl, type ScryfallCard } from "../lib/scryfall";
import { uploadImageToS3, imageExistsOnS3 } from "../lib/s3";

const prisma = new PrismaClient();
const BATCH_SIZE = 500;
const TMP_FILE = path.join(os.tmpdir(), "scryfall-bulk.json");

async function downloadFile(url: string, dest: string): Promise<void> {
  console.log(`Downloading ${url}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);

  const fileStream = createWriteStream(dest);
  const reader = res.body!.getReader();
  let downloaded = 0;

  await new Promise<void>((resolve, reject) => {
    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) { fileStream.end(); break; }
          downloaded += value.length;
          if (!fileStream.write(value)) {
            await new Promise<void>(r => fileStream.once("drain", r));
          }
          if (downloaded % (50 * 1024 * 1024) < value.length) {
            process.stdout.write(`  ${(downloaded / 1024 / 1024).toFixed(0)}MB downloaded...\r`);
          }
        }
        fileStream.on("finish", resolve);
        fileStream.on("error", reject);
      } catch (err) { reject(err); }
    };
    pump();
  });

  console.log(`\nDownloaded to ${dest} (${(downloaded / 1024 / 1024).toFixed(0)}MB)`);
}

function mapScryfallCard(card: ScryfallCard) {
  return {
    id: card.id,
    name: card.name,
    oracleText: card.oracle_text || null,
    typeLine: card.type_line || "Unknown",
    manaCost: card.mana_cost || null,
    colors: card.colors ?? card.color_identity ?? [],
    setCode: card.set || "???",
    setName: card.set_name || null,
    rarity: card.rarity || null,
    imageUrl: getCardImageUrl(card) ?? null,
    scryfallUri: card.scryfall_uri,
    power: card.power || null,
    toughness: card.toughness || null,
    loyalty: card.loyalty || null,
    keywords: card.keywords ?? [],
  };
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
        console.error(`  ⚠ Failed image for ${card.name}: ${err}`);
      }
    }
  }
}

async function importCards(filePath: string, withImages: boolean, limit?: number) {
  console.log("Parsing JSON...");
  const raw = readFileSync(filePath, "utf-8");
  const allCards: ScryfallCard[] = JSON.parse(raw);
  console.log(`Parsed ${allCards.length.toLocaleString()} total cards from Scryfall.`);

  let batch: ReturnType<typeof mapScryfallCard>[] = [];
  let count = 0;
  let skipped = 0;

  for (const card of allCards) {
    if (limit && count >= limit) break;

    // Skip tokens, emblems, art cards, or cards missing required fields
    if (
      !card.id ||
      !card.name ||
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
      console.log(`  Imported ${count} cards...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await upsertBatch(batch, withImages);
    count += batch.length;
  }

  console.log(`\nDone! ${count} cards imported, ${skipped} skipped.`);
}

async function main() {
  const args = process.argv.slice(2);
  const withImages = args.includes("--with-images");
  const skipDownload = args.includes("--skip-download");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1]) : undefined;

  const shouldCleanup = !skipDownload;

  try {
    if (skipDownload && existsSync(TMP_FILE)) {
      console.log(`Using existing file: ${TMP_FILE}`);
    } else {
      console.log("Fetching Scryfall bulk data info...");
      const bulkData = await getBulkDataInfo();
      const defaultCards = bulkData.find((b) => b.type === "default_cards");
      if (!defaultCards) throw new Error("Could not find default_cards bulk data");
      console.log(`Last updated: ${defaultCards.updated_at}`);
      console.log(`File size: ${(defaultCards.size / 1024 / 1024).toFixed(0)}MB`);
      await downloadFile(defaultCards.download_uri, TMP_FILE);
    }

    await importCards(TMP_FILE, withImages, limit);
  } finally {
    if (shouldCleanup && existsSync(TMP_FILE)) {
      await unlink(TMP_FILE);
      console.log("Cleaned up temp file.");
    }
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
