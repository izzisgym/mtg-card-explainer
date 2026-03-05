#!/usr/bin/env tsx
/**
 * Migrates card images from Scryfall CDN to S3.
 * Reads all cards whose imageUrl is NOT already on S3, downloads each image,
 * uploads to S3 in parallel batches, and updates the DB.
 *
 * Usage:
 *   railway run npx tsx scripts/migrate-images.ts
 *   railway run npx tsx scripts/migrate-images.ts --concurrency=20
 */

import { PrismaClient } from "@prisma/client";
import { uploadImageToS3, imageExistsOnS3, getS3ImageUrl, getS3ImageKey } from "../lib/s3";
import {
  S3Client,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

const prisma = new PrismaClient();
const BATCH_SIZE = 500;   // cards fetched from DB at a time
const DEFAULT_CONCURRENCY = 15; // parallel S3 uploads

async function migrateImages(concurrency: number) {
  console.log(`Starting image migration (concurrency=${concurrency})...`);

  const total = await prisma.card.count({
    where: {
      imageUrl: { not: null },
      NOT: { imageUrl: { startsWith: `https://${process.env.AWS_S3_BUCKET}` } },
    },
  });

  console.log(`${total.toLocaleString()} cards need image migration.`);
  if (total === 0) {
    console.log("Nothing to do!");
    return;
  }

  let migrated = 0;
  let failed = 0;
  let skip = 0;

  while (true) {
    const cards = await prisma.card.findMany({
      where: {
        imageUrl: { not: null },
        NOT: { imageUrl: { startsWith: `https://${process.env.AWS_S3_BUCKET}` } },
      },
      select: { id: true, name: true, imageUrl: true },
      take: BATCH_SIZE,
      skip,
    });

    if (cards.length === 0) break;

    // Process in parallel chunks of `concurrency`
    for (let i = 0; i < cards.length; i += concurrency) {
      const chunk = cards.slice(i, i + concurrency);
      await Promise.all(
        chunk.map(async (card) => {
          if (!card.imageUrl) return;
          try {
            const s3Url = await uploadImageToS3(card.id, card.imageUrl);
            await prisma.card.update({
              where: { id: card.id },
              data: { imageUrl: s3Url },
            });
            migrated++;
          } catch (err) {
            console.error(`  ⚠ Failed ${card.name}: ${err}`);
            failed++;
          }
        })
      );
    }

    const done = migrated + failed;
    const pct = ((done / total) * 100).toFixed(1);
    console.log(`  ${done.toLocaleString()} / ${total.toLocaleString()} (${pct}%) — migrated: ${migrated.toLocaleString()}, failed: ${failed}`);

    // Since we update imageUrl in the DB as we go, we don't need to advance skip —
    // the WHERE clause naturally excludes already-migrated cards on next fetch.
  }

  console.log(`\nDone! Migrated: ${migrated.toLocaleString()}, Failed: ${failed}`);
}

async function main() {
  const args = process.argv.slice(2);
  const concurrencyArg = args.find((a) => a.startsWith("--concurrency="));
  const concurrency = concurrencyArg
    ? parseInt(concurrencyArg.split("=")[1])
    : DEFAULT_CONCURRENCY;

  try {
    await migrateImages(concurrency);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
