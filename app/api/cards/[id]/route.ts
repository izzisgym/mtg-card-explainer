import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCardById, getCardImageUrl, getCardOracleText } from "@/lib/scryfall";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Check DB first
    const dbCard = await prisma.card.findUnique({ where: { id } });
    if (dbCard) return NextResponse.json(dbCard);

    // Fall back to Scryfall
    const card = await getCardById(id);
    if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

    // Persist to DB for future requests
    const imageUrl = getCardImageUrl(card) ?? null;
    const oracleText = getCardOracleText(card);

    const created = await prisma.card.upsert({
      where: { id: card.id },
      update: {},
      create: {
        id: card.id,
        name: card.name,
        oracleText: oracleText || null,
        typeLine: card.type_line,
        manaCost: card.mana_cost ?? null,
        colors: card.colors ?? card.color_identity ?? [],
        setCode: card.set,
        setName: card.set_name ?? null,
        rarity: card.rarity ?? null,
        imageUrl,
        scryfallUri: card.scryfall_uri,
        power: card.power ?? null,
        toughness: card.toughness ?? null,
        loyalty: card.loyalty ?? null,
        keywords: card.keywords ?? [],
      },
    });

    return NextResponse.json(created);
  } catch (err) {
    console.error("Card fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch card" }, { status: 500 });
  }
}
