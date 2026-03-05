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
      <div className="card-hover overflow-hidden cursor-pointer h-full" style={{ background: "#fff" }}>
        {/* Image */}
        <div className="relative aspect-[5/7] overflow-hidden" style={{ background: "#f0f0f0" }}>
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
              <span className="text-3xl font-black opacity-20">?</span>
            </div>
          )}
          {rarity && (
            <span
              className="absolute top-0 right-0 text-xs font-black px-1.5 py-0.5"
              style={{ background: "#000", color: "#fff", letterSpacing: "0.08em" }}
            >
              {RARITY_LABEL[rarity] ?? rarity[0].toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3" style={{ borderTop: "2px solid #000" }}>
          <h3 className="font-black text-sm uppercase tracking-tight leading-tight truncate mb-1" title={name}>
            {name}
          </h3>
          <p className="text-xs truncate" style={{ color: "#666" }}>
            {typeLine}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs uppercase font-bold" style={{ color: "#666" }}>
              {setCode.toUpperCase()}
            </span>
            {manaCost && (
              <span className="text-xs font-bold" style={{ color: "#000" }}>
                {manaCost.replace(/[{}]/g, "")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
