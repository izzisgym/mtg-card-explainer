"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CardGridItem } from "./CardGridItem";
import { Pagination } from "./Pagination";
import SetFilter from "./SetFilter";

interface Card {
  id: string;
  name: string;
  typeLine: string;
  manaCost?: string | null;
  colors: string[];
  setCode: string;
  setName?: string | null;
  rarity?: string | null;
  imageUrl?: string | null;
}

interface CardBrowserProps {
  initialCards: Card[];
  initialTotal: number;
  initialTotalPages: number;
  initialPage: number;
  initialQuery: string;
  initialColor: string;
  initialType: string;
  initialSet: string;
}

const COLOR_OPTIONS = [
  { value: "", label: "ALL COLORS" },
  { value: "W", label: "WHITE" },
  { value: "U", label: "BLUE" },
  { value: "B", label: "BLACK" },
  { value: "R", label: "RED" },
  { value: "G", label: "GREEN" },
];

const TYPE_OPTIONS = [
  { value: "", label: "ALL TYPES" },
  { value: "Creature", label: "CREATURE" },
  { value: "Instant", label: "INSTANT" },
  { value: "Sorcery", label: "SORCERY" },
  { value: "Enchantment", label: "ENCHANTMENT" },
  { value: "Artifact", label: "ARTIFACT" },
  { value: "Planeswalker", label: "PLANESWALKER" },
  { value: "Land", label: "LAND" },
  { value: "Battle", label: "BATTLE" },
];

export default function CardBrowser({
  initialCards,
  initialTotal,
  initialTotalPages,
  initialPage,
  initialQuery,
  initialColor,
  initialType,
  initialSet,
}: CardBrowserProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(initialQuery);
  const [color, setColor] = useState(initialColor);
  const [type, setType] = useState(initialType);
  const [set, setSet] = useState(initialSet);

  const buildUrl = useCallback(
    (overrides: Record<string, string | number> = {}) => {
      const params = new URLSearchParams();
      const q = overrides.q !== undefined ? String(overrides.q) : query;
      const c = overrides.color !== undefined ? String(overrides.color) : color;
      const t = overrides.type !== undefined ? String(overrides.type) : type;
      const s = overrides.set !== undefined ? String(overrides.set) : set;
      const p = overrides.page !== undefined ? String(overrides.page) : "1";
      if (q) params.set("q", q);
      if (c) params.set("color", c);
      if (t) params.set("type", t);
      if (s) params.set("set", s);
      if (p !== "1") params.set("page", p);
      const qs = params.toString();
      return `/${qs ? `?${qs}` : ""}`;
    },
    [query, color, type, set]
  );

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      startTransition(() => router.push(buildUrl({ page: 1 })));
    },
    [buildUrl, router]
  );

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      if (key === "color") setColor(value);
      if (key === "type") setType(value);
      if (key === "set") setSet(value);
      startTransition(() => router.push(buildUrl({ [key]: value, page: 1 })));
    },
    [buildUrl, router]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      startTransition(() => router.push(buildUrl({ page })));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [buildUrl, router]
  );

  const inputStyle = {
    background: "#fff",
    border: "2px solid #000",
    color: "#000",
    outline: "none",
    padding: "12px 16px",
    fontSize: "15px",
    letterSpacing: "0.03em",
    width: "100%",
  };

  return (
    <div>
      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SEARCH CARDS..."
              style={inputStyle}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={color}
              onChange={(e) => handleFilterChange("color", e.target.value)}
              style={{ ...inputStyle, width: "auto", cursor: "pointer" }}
            >
              {COLOR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              style={{ ...inputStyle, width: "auto", cursor: "pointer" }}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <SetFilter
              value={set}
              onChange={(code) => handleFilterChange("set", code)}
              inputStyle={inputStyle}
            />
            <button
              type="submit"
              style={{
                background: "#000",
                color: "#fff",
                border: "2px solid #000",
                padding: "12px 28px",
                fontWeight: "800",
                fontSize: "14px",
                letterSpacing: "0.12em",
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              SEARCH
            </button>
          </div>
        </div>
      </form>

      {/* Count */}
      {initialTotal > 0 && (
        <p
          className="text-sm uppercase tracking-widest mb-4 font-bold"
          style={{ color: "#666", borderLeft: "3px solid #000", paddingLeft: "10px" }}
        >
          {initialTotal.toLocaleString()} {initialTotal === 1 ? "card" : "cards"}
          {initialQuery && ` — "${initialQuery}"`}
        </p>
      )}

      {/* Loading */}
      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div
            className="px-6 py-3 text-sm font-black uppercase tracking-widest"
            style={{ background: "#000", color: "#fff" }}
          >
            LOADING...
          </div>
        </div>
      )}

      {/* Grid */}
      {initialCards.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {initialCards.map((card) => (
              <CardGridItem key={card.id} {...card} />
            ))}
          </div>
          <Pagination page={initialPage} totalPages={initialTotalPages} onPageChange={handlePageChange} />
        </>
      ) : (
        <div
          className="py-20 text-center"
          style={{ border: "2px solid #000" }}
        >
          <p className="text-3xl font-black mb-2">—</p>
          <p className="text-sm uppercase tracking-widest font-bold" style={{ color: "#666" }}>No cards found</p>
        </div>
      )}
    </div>
  );
}
