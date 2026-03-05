const SCRYFALL_BASE = "https://api.scryfall.com";

const headers = {
  "User-Agent": "MTGCardExplainer/1.0",
  Accept: "application/json",
};

export interface ScryfallCard {
  id: string;
  name: string;
  oracle_text?: string;
  type_line: string;
  mana_cost?: string;
  colors?: string[];
  color_identity?: string[];
  set: string;
  set_name?: string;
  set_type?: string;
  layout?: string;
  rarity?: string;
  scryfall_uri: string;
  image_uris?: {
    small?: string;
    normal?: string;
    large?: string;
    png?: string;
  };
  card_faces?: Array<{
    name: string;
    oracle_text?: string;
    mana_cost?: string;
    image_uris?: {
      small?: string;
      normal?: string;
      large?: string;
    };
  }>;
  power?: string;
  toughness?: string;
  loyalty?: string;
  keywords?: string[];
}

export interface ScryfallBulkData {
  object: string;
  id: string;
  type: string;
  name: string;
  uri: string;
  download_uri: string;
  updated_at: string;
  size: number;
}

export async function getBulkDataInfo(): Promise<ScryfallBulkData[]> {
  const res = await fetch(`${SCRYFALL_BASE}/bulk-data`, { headers });
  if (!res.ok) throw new Error(`Scryfall bulk-data error: ${res.status}`);
  const data = await res.json();
  return data.data;
}

export async function searchCards(
  query: string,
  page = 1
): Promise<{ cards: ScryfallCard[]; hasMore: boolean; totalCards?: number }> {
  const params = new URLSearchParams({ q: query, page: String(page) });
  const res = await fetch(`${SCRYFALL_BASE}/cards/search?${params}`, {
    headers,
  });
  if (res.status === 404) return { cards: [], hasMore: false, totalCards: 0 };
  if (!res.ok) throw new Error(`Scryfall search error: ${res.status}`);
  const data = await res.json();
  return {
    cards: data.data,
    hasMore: data.has_more,
    totalCards: data.total_cards,
  };
}

export async function getCardById(id: string): Promise<ScryfallCard | null> {
  const res = await fetch(`${SCRYFALL_BASE}/cards/${id}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Scryfall card error: ${res.status}`);
  return res.json();
}

export function getCardImageUrl(card: ScryfallCard): string | undefined {
  if (card.image_uris?.normal) return card.image_uris.normal;
  if (card.card_faces?.[0]?.image_uris?.normal)
    return card.card_faces[0].image_uris.normal;
  return undefined;
}

export function getCardOracleText(card: ScryfallCard): string {
  if (card.oracle_text) return card.oracle_text;
  if (card.card_faces) {
    return card.card_faces
      .map((f) => `${f.name}: ${f.oracle_text ?? ""}`)
      .join("\n\n");
  }
  return "";
}
