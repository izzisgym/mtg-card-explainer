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
            <div style={{ padding: "16px 20px", borderBottom: "2px solid var(--accent)" }}>
              <p
                className="text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: "var(--accent-light)" }}
              >
                What it does
              </p>
              <p className="text-base leading-relaxed">{parsed.whatItDoes}</p>
            </div>
            <div style={{ padding: "16px 20px" }}>
              <p
                className="text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: "var(--accent-light)" }}
              >
                Why you&apos;d play it
              </p>
              <p className="text-base leading-relaxed">{parsed.whyPlay}</p>
            </div>
          </>
        ) : (
          <div style={{ padding: "20px" }}>
            <p className="text-base leading-relaxed whitespace-pre-wrap">{explanation}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {error && (
        <p
          className="text-sm uppercase tracking-wide mb-3 p-2"
          style={{ color: "#ff4444", border: "2px solid #ff4444" }}
        >
          ERROR: {error}
        </p>
      )}
      <button
        onClick={handleExplain}
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px",
          background: loading ? "var(--muted)" : "var(--accent)",
          color: "#fff",
          border: "2px solid var(--accent)",
          fontSize: "15px",
          fontWeight: "bold",
          letterSpacing: "0.15em",
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
