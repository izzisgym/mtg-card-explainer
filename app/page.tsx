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

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
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
  } catch {
    // DB not available yet (local dev without DB)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      {/* Hero */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-3" style={{ color: "var(--accent-light)" }}>
          Magic Cards Explained
        </h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: "rgba(232,232,240,0.65)" }}>
          Search any Magic: The Gathering card and get a plain-English
          explanation of what it does — powered by AI.
        </p>
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
