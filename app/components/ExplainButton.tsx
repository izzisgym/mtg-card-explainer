"use client";

import { useState } from "react";

interface ExplainButtonProps {
  cardId: string;
  initialExplanation?: string | null;
}

function parseExplanation(text: string): { whatItDoes: string; whyPlay: string } | null {
  const whatMatch = text.match(/What it does:\s*([\s\S]*?)(?=Why you'd play it:|$)/i);
  const whyMatch = text.match(/Why you'd play it:\s*([\s\S]*?)$/i);
  if (whatMatch && whyMatch) {
    return {
      whatItDoes: whatMatch[1].trim(),
      whyPlay: whyMatch[1].trim(),
    };
  }
  return null;
}

// Split text into sentences and render each as its own paragraph
function SentenceParagraphs({ text }: { text: string }) {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <>
      {sentences.map((sentence, i) => (
        <p key={i} className="text-lg leading-relaxed mb-3 last:mb-0">
          {sentence}
        </p>
      ))}
    </>
  );
}

export default function ExplainButton({ cardId, initialExplanation }: ExplainButtonProps) {
  const [explanation, setExplanation] = useState<string | null>(initialExplanation ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExplain = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cards/${cardId}/explain`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to get explanation");
      setExplanation(data.explanation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (explanation) {
    const parsed = parseExplanation(explanation);
    return (
      <div style={{ border: "2px solid var(--accent)" }}>
        {parsed ? (
          <>
            <div style={{ padding: "24px 28px", borderBottom: "2px solid var(--accent)" }}>
              <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: "var(--accent-light)" }}>
                What Does That Mean
              </p>
              <SentenceParagraphs text={parsed.whatItDoes} />
            </div>
            <div style={{ padding: "24px 28px" }}>
              <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: "var(--accent-light)" }}>
                Why Is That Important
              </p>
              <SentenceParagraphs text={parsed.whyPlay} />
            </div>
          </>
        ) : (
          <div style={{ padding: "24px 28px" }}>
            <SentenceParagraphs text={explanation} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {error && (
        <p
          className="text-sm font-black uppercase tracking-wide mb-3 p-3"
          style={{ color: "var(--accent-light)", border: "2px solid var(--accent)", background: "var(--card-bg)" }}
        >
          ERROR: {error}
        </p>
      )}
      <button
        onClick={handleExplain}
        disabled={loading}
        style={{
          width: "100%",
          padding: "18px",
          background: loading ? "var(--muted)" : "var(--accent)",
          color: "#fff",
          border: "2px solid var(--accent)",
          fontSize: "18px",
          fontWeight: "900",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "THINKING..." : "EXPLAIN THIS CARD"}
      </button>
    </div>
  );
}
