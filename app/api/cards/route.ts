import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { searchCards } from "@/lib/scryfall";

const PAGE_SIZE = 24;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const color = searchParams.get("color");
  const type = searchParams.get("type");
  const set = searchParams.get("set");

  const skip = (page - 1) * PAGE_SIZE;

  try {
    // If there's a search query or filters, check the DB first
    if (q || color || type || set) {
      const where: Record<string, unknown> = {};

      if (q) {
        where.name = { contains: q, mode: "insensitive" };
      }
      if (color) {
        where.colors = { has: color.toUpperCase() };
      }
      if (type) {
        where.typeLine = { contains: type, mode: "insensitive" };
      }
      if (set) {
        where.setCode = { equals: set.toLowerCase() };
      }

      const [cards, total] = await Promise.all([
        prisma.card.findMany({
          where,
          skip,
          take: PAGE_SIZE,
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            typeLine: true,
            manaCost: true,
            colors: true,
            setCode: true,
            setName: true,
            rarity: true,
            imageUrl: true,
            scryfallUri: true,
          },
        }),
        prisma.card.count({ where }),
      ]);

      // If DB has results, return them
      if (cards.length > 0 || !q) {
        return NextResponse.json({
          cards,
          total,
          page,
          pageSize: PAGE_SIZE,
          totalPages: Math.ceil(total / PAGE_SIZE),
        });
      }

      // Fall back to Scryfall live search for unknown cards
      const { cards: scryfallCards, totalCards } = await searchCards(q, page);
      return NextResponse.json({
        cards: scryfallCards.map((c) => ({
          id: c.id,
          name: c.name,
          typeLine: c.type_line,
          manaCost: c.mana_cost ?? null,
          colors: c.colors ?? [],
          setCode: c.set,
          setName: c.set_name ?? null,
          rarity: c.rarity ?? null,
          imageUrl:
            c.image_uris?.normal ??
            c.card_faces?.[0]?.image_uris?.normal ??
            null,
          scryfallUri: c.scryfall_uri,
        })),
        total: totalCards ?? 0,
        page,
        pageSize: PAGE_SIZE,
        totalPages: Math.ceil((totalCards ?? 0) / PAGE_SIZE),
        source: "scryfall",
      });
    }

    // No query: return a paginated list of all cards
    const [cards, total] = await Promise.all([
      prisma.card.findMany({
        skip,
        take: PAGE_SIZE,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          typeLine: true,
          manaCost: true,
          colors: true,
          setCode: true,
          setName: true,
          rarity: true,
          imageUrl: true,
          scryfallUri: true,
        },
      }),
      prisma.card.count(),
    ]);

    return NextResponse.json({
      cards,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (err) {
    console.error("Cards API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch cards" },
      { status: 500 }
    );
  }
}
