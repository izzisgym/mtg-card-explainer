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

const RARITY_COLORS: Record<string, string> = {
  common: "#aaaaaa",
  uncommon: "#c0c8d8",
  rare: "#f0c040",
  mythic: "#f07830",
  special: "#a060e0",
};

export function CardGridItem({ id, name, typeLine, manaCost, colors, setCode, rarity, imageUrl }: CardGridItemProps) {
  const rarityColor = rarity ? RARITY_COLORS[rarity] ?? "#aaaaaa" : "#aaaaaa";

  return (
    <Link href={`/cards/${id}`} className="block">
      <div
        className="card-hover overflow-hidden cursor-pointer h-full"
        style={{ background: "var(--card-bg)" }}
      >
        {/* Image */}
        <div className="relative aspect-[5/7] overflow-hidden" style={{ background: "#1a1a1a" }}>
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
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-3xl opacity-20 font-mono">?</span>
            </div>
          )}
          {rarity && (
            <span
              className="absolute top-0 right-0 text-xs font-bold uppercase px-1.5 py-0.5"
              style={{ background: "#000", color: rarityColor, letterSpacing: "0.08em" }}
            >
              {rarity[0]}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3" style={{ borderTop: "2px solid var(--accent)" }}>
          <h3 className="font-bold text-sm uppercase tracking-wide leading-tight truncate mb-1" title={name}>
            {name}
          </h3>
          <p className="text-xs truncate" style={{ color: "var(--muted-fg)" }}>
            {typeLine}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm uppercase font-bold" style={{ color: "var(--accent-light)" }}>
              {setCode}
            </span>
            {manaCost && (
              <span className="text-sm" style={{ color: "var(--muted-fg)" }}>
                {manaCost.replace(/[{}]/g, "")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
