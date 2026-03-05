"use client";

import { useState } from "react";

interface ExplainButtonProps {
  cardId: string;
  initialExplanation?: string | null;
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
    return (
      <div style={{ border: "2px solid var(--accent)", padding: "16px" }}>
        <p
          className="text-xs font-bold uppercase tracking-widest mb-3"
          style={{
            color: "#fff",
            background: "var(--accent)",
            display: "inline-block",
            padding: "2px 8px",
            marginBottom: "10px",
          }}
        >
          AI Explanation
        </p>
        <p className="text-sm leading-relaxed">{explanation}</p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <p
          className="text-xs uppercase tracking-wide mb-3 p-2"
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
          fontSize: "13px",
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
