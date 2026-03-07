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
    background: "var(--card-bg)",
    border: "2px solid var(--accent)",
    color: "var(--foreground)",
    outline: "none",
    padding: "12px 16px",
    fontSize: "16px",
    letterSpacing: "0.03em",
    width: "100%",
  };

  return (
    <div>
      {/* Search bar — mobile-optimised layout */}
      <form onSubmit={handleSearch} className="mb-6">
        {/* Search input: full width on all sizes */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cards..."
          style={{ ...inputStyle, marginBottom: "8px" }}
        />
        {/* Filters: 2-col grid on mobile, row on larger screens */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:flex-wrap mb-2">
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
          <div className="col-span-2 sm:col-span-1">
            <SetFilter
              value={set}
              onChange={(code) => handleFilterChange("set", code)}
              inputStyle={inputStyle}
            />
          </div>
        </div>
        {/* Search button: full width on mobile */}
        <button
          type="submit"
          style={{
            width: "100%",
            background: "var(--accent)",
            color: "#fff",
            border: "2px solid var(--accent)",
            padding: "14px 32px",
            fontWeight: "900",
            fontSize: "16px",
            letterSpacing: "0.15em",
            cursor: "pointer",
            textTransform: "uppercase",
            minHeight: "48px",
          }}
        >
          SEARCH
        </button>
      </form>

      {/* Count */}
      {initialTotal > 0 && (
        <p
          className="text-base uppercase tracking-widest mb-6 font-bold"
          style={{ color: "var(--accent-light)", borderLeft: "4px solid var(--accent)", paddingLeft: "12px" }}
        >
          {initialTotal.toLocaleString()} {initialTotal === 1 ? "card" : "cards"}
          {initialQuery && ` — "${initialQuery}"`}
        </p>
      )}

      {/* Loading */}
      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div
            className="px-8 py-4 text-base font-black uppercase tracking-widest"
            style={{ background: "var(--accent)", color: "#fff", border: "3px solid var(--accent-light)" }}
          >
            LOADING...
          </div>
        </div>
      )}

      {/* Grid */}
      {initialCards.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-3">
            {initialCards.map((card) => (
              <CardGridItem key={card.id} {...card} />
            ))}
          </div>
          <Pagination page={initialPage} totalPages={initialTotalPages} onPageChange={handlePageChange} />
        </>
      ) : (
        <div
          className="py-20 text-center"
          style={{ border: "3px solid var(--accent)" }}
        >
          <p className="text-4xl font-black mb-3" style={{ color: "var(--accent)" }}>—</p>
          <p className="text-base uppercase tracking-widest font-bold" style={{ color: "var(--muted-fg)" }}>No cards found</p>
        </div>
      )}
    </div>
  );
}
