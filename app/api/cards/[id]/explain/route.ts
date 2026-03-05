import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { explainCard } from "@/lib/claude";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const card = await prisma.card.findUnique({ where: { id } });
    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Return cached explanation if already generated
    if (card.explanation) {
      return NextResponse.json({ explanation: card.explanation, cached: true });
    }

    const explanation = await explainCard({
      name: card.name,
      typeLine: card.typeLine,
      manaCost: card.manaCost,
      oracleText: card.oracleText,
      keywords: card.keywords,
      power: card.power,
      toughness: card.toughness,
      loyalty: card.loyalty,
    });

    const updated = await prisma.card.update({
      where: { id },
      data: { explanation, explainedAt: new Date() },
    });

    return NextResponse.json({ explanation: updated.explanation, cached: false });
  } catch (err) {
    console.error("Explain API error:", err);
    return NextResponse.json(
      { error: "Failed to generate explanation" },
      { status: 500 }
    );
  }
}
