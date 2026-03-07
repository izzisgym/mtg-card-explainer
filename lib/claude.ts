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
  // Build a compact card summary — only include fields that add context
  const parts: string[] = [];
  parts.push(`Type: ${card.typeLine}`);
  if (card.manaCost) parts.push(`Cost: ${card.manaCost.replace(/[{}]/g, "")}`);
  if (card.power && card.toughness) parts.push(`P/T: ${card.power}/${card.toughness}`);
  if (card.loyalty) parts.push(`Loyalty: ${card.loyalty}`);
  if (card.oracleText) parts.push(`Text: ${card.oracleText}`);

  const cardDetails = parts.join("\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 300,
    system: "You explain Magic: The Gathering cards for new players. Be brief and plain. Never restate the card name. Use exactly these two headers on their own lines: \"What it does:\" and \"Why you'd play it:\". Each section: 2-3 sentences max.",
    messages: [
      {
        role: "user",
        content: cardDetails,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected Claude response type");
  return content.text;
}
