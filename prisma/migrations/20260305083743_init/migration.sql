-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "oracleText" TEXT,
    "typeLine" TEXT NOT NULL,
    "manaCost" TEXT,
    "colors" TEXT[],
    "setCode" TEXT NOT NULL,
    "setName" TEXT,
    "rarity" TEXT,
    "imageUrl" TEXT,
    "scryfallUri" TEXT NOT NULL,
    "power" TEXT,
    "toughness" TEXT,
    "loyalty" TEXT,
    "keywords" TEXT[],
    "explanation" TEXT,
    "explainedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Card_name_idx" ON "Card"("name");

-- CreateIndex
CREATE INDEX "Card_setCode_idx" ON "Card"("setCode");

-- CreateIndex
CREATE INDEX "Card_colors_idx" ON "Card"("colors");
