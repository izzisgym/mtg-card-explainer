"use client";

import { useState } from "react";

interface ExplainButtonProps {
  cardId: string;
  initialExplanation?: string | null;
}

export default function ExplainButton({
  cardId,
  initialExplanation,
}: ExplainButtonProps) {
  const [explanation, setExplanation] = useState<string | null>(
    initialExplanation ?? null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExplain = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cards/${cardId}/explain`, {
        method: "POST",
      });
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
      <div
        className="rounded-xl p-5"
        style={{
          background: "rgba(124, 58, 237, 0.1)",
          border: "1px solid rgba(124, 58, 237, 0.3)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-md"
            style={{ background: "var(--accent)", color: "white" }}
          >
            Claude AI
          </span>
          <span className="text-xs" style={{ color: "rgba(232,232,240,0.4)" }}>
            Plain-English Explanation
          </span>
        </div>
        <p className="text-base leading-relaxed">{explanation}</p>
        <button
          onClick={handleExplain}
          disabled={loading}
          className="mt-3 text-xs underline opacity-40 hover:opacity-70 transition-opacity"
        >
          Regenerate
        </button>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <p className="text-red-400 text-sm mb-3">Error: {error}</p>
      )}
      <button
        onClick={handleExplain}
        disabled={loading}
        className="w-full py-3 px-6 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
        style={{ background: "var(--accent)" }}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Asking Claude...
          </>
        ) : (
          <>✨ Explain this card</>
        )}
      </button>
    </div>
  );
}
