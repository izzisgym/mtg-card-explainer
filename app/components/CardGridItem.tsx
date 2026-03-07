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

const RARITY_LABEL: Record<string, string> = {
  common: "C",
  uncommon: "U",
  rare: "R",
  mythic: "M",
  special: "S",
};

export function CardGridItem({ id, name, typeLine, manaCost, setCode, rarity, imageUrl }: CardGridItemProps) {
  return (
    <Link href={`/cards/${id}`} className="block">
      <div className="card-hover overflow-hidden cursor-pointer h-full" style={{ background: "var(--card-bg)" }}>
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
              <span className="text-3xl font-black opacity-20" style={{ color: "var(--accent)" }}>?</span>
            </div>
          )}
          {rarity && (
            <span
              className="absolute top-0 right-0 text-xs font-black px-1.5 py-0.5"
              style={{ background: "var(--accent)", color: "#fff", letterSpacing: "0.08em" }}
            >
              {RARITY_LABEL[rarity] ?? rarity[0].toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3" style={{ borderTop: "2px solid var(--accent)" }}>
          <h3
            className="font-black uppercase tracking-tight leading-tight truncate mb-1"
            style={{ fontSize: "clamp(0.7rem, 2.5vw, 0.85rem)", color: "var(--foreground)" }}
            title={name}
          >
            {name}
          </h3>
          <p className="truncate" style={{ fontSize: "0.7rem", color: "var(--muted-fg)" }}>
            {typeLine}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="font-black uppercase" style={{ fontSize: "0.7rem", color: "var(--accent-light)" }}>
              {setCode.toUpperCase()}
            </span>
            {manaCost && (
              <span className="font-bold" style={{ fontSize: "0.7rem", color: "var(--muted-fg)" }}>
                {manaCost.replace(/[{}]/g, "")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
