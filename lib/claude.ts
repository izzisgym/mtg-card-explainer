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
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are an expert Magic: The Gathering player and deck builder. Given the following card, provide two things:

1. **What it does**: Explain what this card does in plain English for someone new to the game. Be clear and concise (2-3 sentences). Focus on the mechanics, not the flavor. Briefly explain any key terms.

2. **Why you'd play it**: Explain why a player would include this card in their deck. What strategies or archetypes does it fit into? What other cards or situations does it work well with? Keep this practical and specific (2-4 sentences).

Do NOT start by restating the card's name. Format your response with "What it does:" and "Why you'd play it:" as plain-text headers on their own lines.

${cardDetails}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected Claude response type");
  return content.text;
}
