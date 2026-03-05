import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface CardForExplanation {
  name: string;
  typeLine: string;
  manaCost?: string | null;
  oracleText?: string | null;
  keywords?: string[];
  power?: string | null;
  toughness?: string | null;
  loyalty?: string | null;
}

export async function explainCard(card: CardForExplanation): Promise<string> {
  const parts: string[] = [];

  parts.push(`Card Name: ${card.name}`);
  parts.push(`Type: ${card.typeLine}`);
  if (card.manaCost) parts.push(`Mana Cost: ${card.manaCost}`);
  if (card.power && card.toughness)
    parts.push(`Power/Toughness: ${card.power}/${card.toughness}`);
  if (card.loyalty) parts.push(`Loyalty: ${card.loyalty}`);
  if (card.keywords?.length) parts.push(`Keywords: ${card.keywords.join(", ")}`);
  if (card.oracleText) parts.push(`Card Text:\n${card.oracleText}`);

  const cardDetails = parts.join("\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `You are a helpful Magic: The Gathering expert. Explain what the following card does in plain English for someone new to the game. Be concise (2-4 sentences). Focus on what the card actually does mechanically, not flavor. Avoid jargon where possible, but briefly explain any key terms.

${cardDetails}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected Claude response type");
  return content.text;
}
