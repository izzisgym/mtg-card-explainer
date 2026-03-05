import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCardById, getCardImageUrl, getCardOracleText } from "@/lib/scryfall";
import ExplainButton from "@/app/components/ExplainButton";
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
      return {
        title: `${card.name} | What does this Magic card do?`,
        description: card.oracleText?.slice(0, 160) ?? `Learn what ${card.name} does in plain English.`,
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
        className="inline-block text-sm font-black uppercase tracking-widest mb-6"
        style={{ color: "#000", borderBottom: "2px solid #000" }}
      >
        ← BACK
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-4xl items-start">
        {/* Image */}
        <div className="md:sticky md:top-8">
          <div
            className="relative w-full max-w-sm overflow-hidden"
            style={{ aspectRatio: "5/7", border: "3px solid #000" }}
          >
            {card.imageUrl ? (
              <Image
                src={card.imageUrl}
                alt={card.name}
                fill
                priority
                className="object-contain"
                unoptimized
                sizes="(max-width: 768px) 90vw, 400px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: "#f0f0f0" }}>
                <span className="font-black text-4xl" style={{ color: "#000" }}>?</span>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5">
          {/* Name + rarity */}
          <div style={{ borderBottom: "3px solid #000", paddingBottom: "14px" }}>
            <h1 className="text-3xl font-black uppercase tracking-tight" style={{ letterSpacing: "-0.01em" }}>{card.name}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-base uppercase tracking-wide font-bold" style={{ color: "#666" }}>
                {card.typeLine}
              </span>
              {card.rarity && (
                <span
                  className="text-sm font-black uppercase px-2 py-0.5"
                  style={{ background: "#000", color: "#fff" }}
                >
                  {card.rarity}
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-2">
            {card.manaCost && <StatBadge label="MANA" value={card.manaCost.replace(/[{}]/g, "")} />}
            {card.power && card.toughness && <StatBadge label="P/T" value={`${card.power}/${card.toughness}`} />}
            {card.loyalty && <StatBadge label="LOYALTY" value={card.loyalty} />}
            {card.setName && <StatBadge label="SET" value={`${card.setName} — ${card.setCode.toUpperCase()}`} />}
          </div>

          {/* Colors */}
          {card.colors.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {card.colors.map((c) => (
                <span
                  key={c}
                  className="text-sm font-black px-3 py-1 uppercase tracking-widest"
                  style={{ border: "2px solid #000", color: "#000" }}
                >
                  {COLOR_NAMES[c] ?? c}
                </span>
              ))}
            </div>
          )}

          {/* Keywords */}
          {card.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {card.keywords.map((kw) => (
                <span
                  key={kw}
                  className="text-sm font-black px-3 py-1 uppercase tracking-wide"
                  style={{ background: "#000", color: "#fff" }}
                >
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Card text */}
          {card.oracleText && (
            <div style={{ border: "2px solid #e5e5e5", padding: "16px" }}>
              <p
                className="text-xs font-black uppercase tracking-widest mb-3"
                style={{ color: "#666" }}
              >
                Card Text
              </p>
              <p className="text-base leading-relaxed whitespace-pre-wrap">{card.oracleText}</p>
            </div>
          )}

          {/* Explain */}
          <ExplainButton cardId={card.id} initialExplanation={card.explanation} />
        </div>
      </div>

      {/* Other Versions */}
      {otherVersions.length > 0 && (
        <div className="mt-12 max-w-4xl">
          <h2
            className="text-sm font-black uppercase tracking-widest mb-4"
            style={{ borderLeft: "4px solid #000", paddingLeft: "10px" }}
          >
            Other Versions ({otherVersions.length})
          </h2>
          <div className="flex flex-wrap gap-3">
            {otherVersions.map((v) => (
              <Link
                key={v.id}
                href={`/cards/${v.id}`}
                className="flex flex-col items-center gap-1 p-2"
                style={{ border: "2px solid #000", width: "90px", background: "#fff", transition: "transform 0.1s" }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translate(-2px,-2px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
              >
                {v.imageUrl ? (
                  <div className="relative w-full overflow-hidden" style={{ aspectRatio: "5/7" }}>
                    <Image
                      src={v.imageUrl}
                      alt={v.setCode}
                      fill
                      className="object-contain"
                      unoptimized
                      sizes="90px"
                    />
                  </div>
                ) : (
                  <div
                    className="w-full flex items-center justify-center font-black"
                    style={{ aspectRatio: "5/7", background: "#f0f0f0", color: "#000" }}
                  >
                    ?
                  </div>
                )}
                <span
                  className="text-xs font-black uppercase tracking-wide text-center"
                  style={{ color: "#000" }}
                >
                  {v.setCode.toUpperCase()}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="text-sm px-3 py-1.5"
      style={{ border: "2px solid #000", background: "#fff" }}
    >
      <span className="font-bold uppercase tracking-wide" style={{ color: "#666" }}>{label}: </span>
      <span className="font-black">{value}</span>
    </div>
  );
}
