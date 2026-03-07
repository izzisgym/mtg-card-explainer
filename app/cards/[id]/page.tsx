import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCardById, getCardImageUrl, getCardOracleText } from "@/lib/scryfall";
import ExplainButton from "@/app/components/ExplainButton";
import ShareBar from "@/app/components/ShareBar";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

const COLOR_NAMES: Record<string, string> = {
  W: "WHITE", U: "BLUE", B: "BLACK", R: "RED", G: "GREEN",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const card = await prisma.card.findUnique({ where: { id } });
    if (card) {
      const title = `${card.name} | SpellCheck`;
      const description = card.oracleText?.slice(0, 160) ?? `Learn what ${card.name} does in plain English.`;
      const url = `https://magic.izzisgym.com/cards/${id}`;
      return {
        title,
        description,
        openGraph: {
          title,
          description,
          url,
          siteName: "SpellCheck",
          images: card.imageUrl ? [{ url: card.imageUrl, width: 488, height: 680, alt: card.name }] : [],
          type: "website",
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
          images: card.imageUrl ? [card.imageUrl] : [],
        },
      };
    }
  } catch {}
  return { title: "Card | What does this Magic card do?" };
}

export default async function CardDetailPage({ params }: Props) {
  const { id } = await params;

  let card: Awaited<ReturnType<typeof prisma.card.findUnique>> | null = null;

  try {
    card = await prisma.card.findUnique({ where: { id } });
  } catch {}

  if (!card) {
    try {
      const scryfallCard = await getCardById(id);
      if (!scryfallCard) notFound();
      const imageUrl = getCardImageUrl(scryfallCard) ?? null;
      const oracleText = getCardOracleText(scryfallCard);
      card = await prisma.card.upsert({
        where: { id: scryfallCard.id },
        update: {},
        create: {
          id: scryfallCard.id,
          name: scryfallCard.name,
          oracleText: oracleText || null,
          typeLine: scryfallCard.type_line,
          manaCost: scryfallCard.mana_cost ?? null,
          colors: scryfallCard.colors ?? scryfallCard.color_identity ?? [],
          setCode: scryfallCard.set,
          setName: scryfallCard.set_name ?? null,
          rarity: scryfallCard.rarity ?? null,
          imageUrl,
          scryfallUri: scryfallCard.scryfall_uri,
          power: scryfallCard.power ?? null,
          toughness: scryfallCard.toughness ?? null,
          loyalty: scryfallCard.loyalty ?? null,
          keywords: scryfallCard.keywords ?? [],
        },
      });
    } catch {
      notFound();
    }
  }

  if (!card) notFound();

  let otherVersions: { id: string; setName: string | null; setCode: string; rarity: string | null; imageUrl: string | null }[] = [];
  try {
    otherVersions = await prisma.card.findMany({
      where: { name: card.name, id: { not: card.id } },
      orderBy: { setCode: "asc" },
      select: { id: true, setName: true, setCode: true, rarity: true, imageUrl: true },
    });
  } catch {}

  return (
    <div>
      {/* Back */}
      <Link
        href="/"
        className="inline-block text-sm font-black uppercase tracking-widest mb-8"
        style={{ color: "var(--accent-light)", borderBottom: "2px solid var(--accent)" }}
      >
        ← BACK
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(300px,380px)_1fr] gap-10 lg:gap-16 items-start">
        {/* Image column */}
        <div className="md:sticky md:top-8">
          {/* On mobile: image + stats side by side */}
          <div className="flex gap-4 md:block">
            <div
              className="relative overflow-hidden shrink-0"
              style={{ aspectRatio: "5/7", border: "3px solid var(--accent)", width: "clamp(120px, 35vw, 380px)" }}
            >
              {card.imageUrl ? (
                <Image
                  src={card.imageUrl}
                  alt={card.name}
                  fill
                  priority
                  className="object-contain"
                  unoptimized
                  sizes="(max-width: 768px) 35vw, 380px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: "#1a1a1a" }}>
                  <span className="font-black text-4xl" style={{ color: "var(--accent)" }}>?</span>
                </div>
              )}
            </div>

            {/* Stats — visible beside image on mobile, below image on desktop */}
            <div className="flex-1 md:mt-4 flex flex-col gap-0">
              {card.manaCost && <StatRow label="Mana" value={card.manaCost.replace(/[{}]/g, "")} />}
              {card.power && card.toughness && <StatRow label="P / T" value={`${card.power} / ${card.toughness}`} />}
              {card.loyalty && <StatRow label="Loyalty" value={card.loyalty} />}
              {card.setName && <StatRow label="Set" value={`${card.setName} (${card.setCode.toUpperCase()})`} />}
              {card.rarity && <StatRow label="Rarity" value={card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)} />}

              {/* Color identity */}
              {card.colors.length > 0 && (
                <div className="mt-3 flex gap-1.5 flex-wrap">
                  {card.colors.map((c) => (
                    <span
                      key={c}
                      className="text-xs font-black px-2 py-0.5 uppercase tracking-widest"
                      style={{ border: "2px solid var(--accent)", color: "var(--foreground)" }}
                    >
                      {COLOR_NAMES[c] ?? c}
                    </span>
                  ))}
                </div>
              )}

              {/* Keywords */}
              {card.keywords.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {card.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="text-xs font-black px-2 py-0.5 uppercase tracking-wide"
                      style={{ background: "var(--accent)", color: "#fff" }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details — max line length ~75ch for readability */}
        <div className="flex flex-col gap-6" style={{ maxWidth: "72ch" }}>
          {/* Name + type */}
          <div style={{ borderBottom: "3px solid var(--accent)", paddingBottom: "20px" }}>
            <h1
              className="font-black uppercase"
              style={{ fontSize: "clamp(2rem, 5vw, 3rem)", letterSpacing: "-0.02em", lineHeight: 1.1 }}
            >
              {card.name}
            </h1>
            <p className="mt-2 text-lg font-bold uppercase tracking-wide" style={{ color: "var(--muted-fg)" }}>
              {card.typeLine}
            </p>
          </div>

          {/* Share */}
          <ShareBar cardName={card.name} cardUrl={`/cards/${card.id}`} />

          {/* Card oracle text */}          {card.oracleText && (
            <div style={{ borderLeft: "4px solid var(--accent)", paddingLeft: "20px" }}>
              <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "var(--accent-light)" }}>
                What the Card Says
              </p>
              <p
                className="leading-relaxed whitespace-pre-wrap"
                style={{ fontSize: "1.05rem", color: "var(--foreground)", opacity: 0.85 }}
              >
                {card.oracleText}
              </p>
            </div>
          )}

          {/* AI Explanation */}
          <ExplainButton cardId={card.id} initialExplanation={card.explanation} />
        </div>
      </div>

      {/* Other Versions */}
      {otherVersions.length > 0 && (
        <div className="mt-16">
          <h2 className="brutalist-heading text-base font-black uppercase tracking-widest mb-6">
            Other Versions ({otherVersions.length})
          </h2>
          <div className="flex flex-wrap gap-4">
            {otherVersions.map((v) => (
              <Link
                key={v.id}
                href={`/cards/${v.id}`}
                className="version-thumb flex flex-col items-center gap-2 p-2"
                style={{ border: "2px solid var(--accent)", width: "120px", background: "var(--card-bg)" }}
              >
                {v.imageUrl ? (
                  <div className="relative w-full overflow-hidden" style={{ aspectRatio: "5/7" }}>
                    <Image
                      src={v.imageUrl}
                      alt={v.setCode}
                      fill
                      className="object-contain"
                      unoptimized
                      sizes="120px"
                    />
                  </div>
                ) : (
                  <div
                    className="w-full flex items-center justify-center font-black"
                    style={{ aspectRatio: "5/7", background: "#1a1a1a", color: "var(--accent)" }}
                  >
                    ?
                  </div>
                )}
                <span className="text-xs font-black uppercase tracking-wide text-center" style={{ color: "var(--accent-light)" }}>
                  {v.setName ?? v.setCode.toUpperCase()}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-baseline justify-between gap-4 py-2 px-3"
      style={{ borderBottom: "1px solid var(--muted)" }}
    >
      <span className="text-xs font-black uppercase tracking-widest shrink-0" style={{ color: "var(--muted-fg)" }}>
        {label}
      </span>
      <span className="text-sm font-bold text-right" style={{ color: "var(--foreground)" }}>
        {value}
      </span>
    </div>
  );
}
