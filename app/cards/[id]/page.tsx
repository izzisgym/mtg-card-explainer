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
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
};

const COLOR_STYLES: Record<string, { bg: string; text: string }> = {
  W: { bg: "rgba(249,228,183,0.15)", text: "#f9e4b7" },
  U: { bg: "rgba(170,224,250,0.15)", text: "#aae0fa" },
  B: { bg: "rgba(203,194,191,0.15)", text: "#cbc2bf" },
  R: { bg: "rgba(249,170,143,0.15)", text: "#f9aa8f" },
  G: { bg: "rgba(155,211,174,0.15)", text: "#9bd3ae" },
};

const RARITY_STYLES: Record<string, string> = {
  common: "#9ca3af",
  uncommon: "#cbd5e1",
  rare: "#fbbf24",
  mythic: "#f97316",
  special: "#a78bfa",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const card = await prisma.card.findUnique({ where: { id } });
    if (card) {
      return {
        title: `${card.name} | Magic Cards Explained`,
        description: card.oracleText?.slice(0, 160) ?? `Learn what ${card.name} does in plain English.`,
      };
    }
  } catch {}
  return { title: "Card | Magic Cards Explained" };
}

export default async function CardDetailPage({ params }: Props) {
  const { id } = await params;

  let card: Awaited<ReturnType<typeof prisma.card.findUnique>> | null = null;

  try {
    card = await prisma.card.findUnique({ where: { id } });
  } catch {}

  // If not in DB, fetch from Scryfall and cache
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

  const rarityColor = card.rarity ? RARITY_STYLES[card.rarity] ?? "#9ca3af" : "#9ca3af";

  return (
    <div>
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm mb-6 hover:opacity-80 transition-opacity"
        style={{ color: "var(--accent-light)" }}
      >
        ← Back to search
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-4xl items-start">
        {/* Card Image */}
        <div className="flex justify-center md:justify-start md:sticky md:top-8">
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: "5/7" }}>
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
              <div
                className="w-full h-full flex flex-col items-center justify-center gap-3"
                style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
              >
                <span className="text-6xl opacity-30">🃏</span>
                <span className="text-sm opacity-40">No image available</span>
              </div>
            )}
          </div>
        </div>

        {/* Card Details */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-3xl font-bold">{card.name}</h1>
              {card.rarity && (
                <span
                  className="text-xs font-semibold capitalize px-2.5 py-1 rounded-full"
                  style={{
                    background: `${rarityColor}20`,
                    color: rarityColor,
                    border: `1px solid ${rarityColor}40`,
                  }}
                >
                  {card.rarity}
                </span>
              )}
            </div>
            <p className="text-base" style={{ color: "rgba(232,232,240,0.6)" }}>
              {card.typeLine}
            </p>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-3">
            {card.manaCost && (
              <StatBadge label="Mana Cost" value={card.manaCost} />
            )}
            {card.power && card.toughness && (
              <StatBadge label="P/T" value={`${card.power}/${card.toughness}`} />
            )}
            {card.loyalty && (
              <StatBadge label="Loyalty" value={card.loyalty} />
            )}
            {card.setName && (
              <StatBadge label="Set" value={`${card.setName} (${card.setCode.toUpperCase()})`} />
            )}
          </div>

          {/* Colors */}
          {card.colors.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {card.colors.map((c) => (
                <span
                  key={c}
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{
                    background: COLOR_STYLES[c]?.bg ?? "rgba(255,255,255,0.1)",
                    color: COLOR_STYLES[c]?.text ?? "white",
                    border: `1px solid ${COLOR_STYLES[c]?.text ?? "white"}30`,
                  }}
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
                  className="text-xs px-2 py-1 rounded font-medium"
                  style={{
                    background: "rgba(124,58,237,0.15)",
                    color: "var(--accent-light)",
                    border: "1px solid rgba(124,58,237,0.3)",
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Oracle Text */}
          {card.oracleText && (
            <div
              className="rounded-xl p-4"
              style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "rgba(232,232,240,0.4)" }}>
                Card Text
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{card.oracleText}</p>
            </div>
          )}

          {/* AI Explanation */}
          <div>
            <ExplainButton cardId={card.id} initialExplanation={card.explanation} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="px-3 py-1.5 rounded-lg text-sm"
      style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
    >
      <span className="text-xs opacity-50 mr-1">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
