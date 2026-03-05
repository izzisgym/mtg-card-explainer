"use client";

import Image from "next/image";
import Link from "next/link";

interface CardGridItemProps {
  id: string;
  name: string;
  typeLine: string;
  manaCost?: string | null;
  colors: string[];
  setCode: string;
  rarity?: string | null;
  imageUrl?: string | null;
}

const COLOR_DOTS: Record<string, string> = {
  W: "bg-yellow-100",
  U: "bg-blue-400",
  B: "bg-gray-600",
  R: "bg-red-500",
  G: "bg-green-500",
};

const RARITY_COLORS: Record<string, string> = {
  common: "text-gray-400",
  uncommon: "text-slate-300",
  rare: "text-yellow-400",
  mythic: "text-orange-400",
  special: "text-purple-400",
};

export function CardGridItem({
  id,
  name,
  typeLine,
  manaCost,
  colors,
  setCode,
  rarity,
  imageUrl,
}: CardGridItemProps) {
  const rarityColor = rarity ? RARITY_COLORS[rarity] ?? "text-gray-400" : "text-gray-400";

  return (
    <Link href={`/cards/${id}`} className="block">
      <div
        className="card-hover rounded-xl overflow-hidden cursor-pointer h-full"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
        }}
      >
        <div className="relative aspect-[5/7] bg-gray-900 overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--card-border)" }}>
              <span className="text-4xl opacity-40">🃏</span>
            </div>
          )}
          {rarity && (
            <span
              className={`absolute top-2 right-2 text-xs font-semibold capitalize px-2 py-0.5 rounded-full ${rarityColor}`}
              style={{ background: "rgba(0,0,0,0.7)" }}
            >
              {rarity}
            </span>
          )}
        </div>

        <div className="p-3">
          <div className="flex items-start justify-between gap-1 mb-1">
            <h3 className="font-semibold text-sm leading-tight truncate" title={name}>
              {name}
            </h3>
            {colors.length > 0 && (
              <div className="flex gap-0.5 flex-shrink-0">
                {colors.slice(0, 5).map((c) => (
                  <span
                    key={c}
                    className={`w-3 h-3 rounded-full border border-white/20 ${COLOR_DOTS[c] ?? "bg-gray-400"}`}
                    title={c}
                  />
                ))}
              </div>
            )}
          </div>

          <p className="text-xs truncate" style={{ color: "rgba(232,232,240,0.5)" }}>
            {typeLine}
          </p>

          <div className="flex items-center justify-between mt-2">
            <span
              className="text-xs uppercase tracking-wide font-mono"
              style={{ color: "rgba(232,232,240,0.35)" }}
            >
              {setCode}
            </span>
            {manaCost && (
              <span
                className="text-xs font-mono"
                style={{ color: "var(--accent-light)" }}
              >
                {manaCost.replace(/[{}]/g, "").split("").slice(0, 8).join("")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
