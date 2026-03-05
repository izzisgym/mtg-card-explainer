import { prisma } from "@/lib/db";
import CardBrowser from "./components/CardBrowser";

const PAGE_SIZE = 24;

interface SearchParams {
  q?: string;
  color?: string;
  type?: string;
  set?: string;
  page?: string;
}

export default async function HomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const color = sp.color ?? "";
  const type = sp.type ?? "";
  const set = sp.set ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1"));
  const skip = (page - 1) * PAGE_SIZE;

  const where: Record<string, unknown> = {};
  if (q) where.name = { contains: q, mode: "insensitive" };
  if (color) where.colors = { has: color.toUpperCase() };
  if (type) where.typeLine = { contains: type, mode: "insensitive" };
  if (set) where.setCode = { equals: set.toLowerCase() };

  type CardPreview = {
    id: string;
    name: string;
    typeLine: string;
    manaCost: string | null;
    colors: string[];
    setCode: string;
    setName: string | null;
    rarity: string | null;
    imageUrl: string | null;
    scryfallUri: string;
  };

  let cards: CardPreview[] = [];
  let total = 0;

  try {
    [cards, total] = await Promise.all([
      prisma.card.findMany({
        where,
        skip,
        take: PAGE_SIZE,
        orderBy: [{ releasedAt: { sort: "desc", nulls: "last" } }, { name: "asc" }],
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
  } catch {
    // DB not available yet
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="mb-10 pb-6" style={{ borderBottom: "4px solid var(--accent)" }}>
        <h1
          className="text-6xl sm:text-7xl font-black uppercase"
          style={{ letterSpacing: "-0.03em", lineHeight: 1.05 }}
        >
          What does this<br />
          <span style={{ color: "var(--accent)" }}>Magic card</span> do?
        </h1>
      </div>

      <CardBrowser
        initialCards={cards}
        initialTotal={total}
        initialTotalPages={totalPages}
        initialPage={page}
        initialQuery={q}
        initialColor={color}
        initialType={type}
        initialSet={set}
      />
    </div>
  );
}
