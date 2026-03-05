"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CardGridItem } from "./CardGridItem";
import { Pagination } from "./Pagination";

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
  { value: "", label: "All Colors" },
  { value: "W", label: "⚪ White" },
  { value: "U", label: "🔵 Blue" },
  { value: "B", label: "⚫ Black" },
  { value: "R", label: "🔴 Red" },
  { value: "G", label: "🟢 Green" },
];

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "Creature", label: "Creature" },
  { value: "Instant", label: "Instant" },
  { value: "Sorcery", label: "Sorcery" },
  { value: "Enchantment", label: "Enchantment" },
  { value: "Artifact", label: "Artifact" },
  { value: "Planeswalker", label: "Planeswalker" },
  { value: "Land", label: "Land" },
  { value: "Battle", label: "Battle" },
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
      startTransition(() =>
        router.push(buildUrl({ [key]: value, page: 1 }))
      );
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

  return (
    <div>
      {/* Search & Filter Bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
          {/* Search input */}
          <div className="flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cards by name..."
              className="w-full px-4 py-3 rounded-xl text-base outline-none transition-colors"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--card-border)",
                color: "var(--foreground)",
              }}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={color}
              onChange={(e) => handleFilterChange("color", e.target.value)}
              className="px-3 py-3 rounded-xl text-sm outline-none cursor-pointer"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--card-border)",
                color: "var(--foreground)",
              }}
            >
              {COLOR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              value={type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className="px-3 py-3 rounded-xl text-sm outline-none cursor-pointer"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--card-border)",
                color: "var(--foreground)",
              }}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
              style={{ background: "var(--accent)" }}
            >
              Search
            </button>
          </div>
        </div>
      </form>

      {/* Results info */}
      {initialTotal > 0 && (
        <p className="text-sm mb-4" style={{ color: "rgba(232,232,240,0.5)" }}>
          {initialTotal.toLocaleString()} card{initialTotal !== 1 ? "s" : ""}
          {initialQuery && ` matching "${initialQuery}"`}
        </p>
      )}

      {/* Loading overlay */}
      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div
            className="px-6 py-3 rounded-xl text-sm font-medium"
            style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
          >
            Loading...
          </div>
        </div>
      )}

      {/* Card Grid */}
      {initialCards.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {initialCards.map((card) => (
              <CardGridItem key={card.id} {...card} />
            ))}
          </div>
          <Pagination
            page={initialPage}
            totalPages={initialTotalPages}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold mb-2">No cards found</h2>
          <p style={{ color: "rgba(232,232,240,0.5)" }}>
            Try a different search term or adjust your filters.
          </p>
        </div>
      )}
    </div>
  );
}
