"use client";

import { useState, useEffect } from "react";

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
        <p key={i} className="leading-relaxed mb-4 last:mb-0" style={{ fontSize: "1.1rem" }}>
          {sentence}
        </p>
      ))}
    </>
  );
}

function Section({ label, text }: { label: string; text: string }) {
  return (
    <div style={{ borderLeft: "4px solid var(--accent)", paddingLeft: "20px", paddingTop: "4px", paddingBottom: "4px" }}>
      <p
        className="text-xs font-black uppercase tracking-widest mb-3"
        style={{ color: "var(--accent-light)" }}
      >
        {label}
      </p>
      <SentenceParagraphs text={text} />
    </div>
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

  // Auto-explain on page load if no explanation exists yet
  useEffect(() => {
    if (!initialExplanation) {
      handleExplain();
    }
  // eslint-disable-next-line react-hooks/exhaustive_deps
  }, []);

  if (explanation) {
    const parsed = parseExplanation(explanation);
    return (
      <div>
        {parsed ? (
          <>
            <Section label="What Does That Mean" text={parsed.whatItDoes} />
            <div style={{ height: "1px", background: "var(--muted)", margin: "8px 0" }} />
            <Section label="Why Is That Important" text={parsed.whyPlay} />
          </>
        ) : (
          <div style={{ borderLeft: "4px solid var(--accent)", paddingLeft: "20px" }}>
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
      {loading ? (
        <div
          style={{
            width: "100%",
            padding: "18px",
            background: "var(--muted)",
            border: "2px solid var(--accent)",
            fontSize: "18px",
            fontWeight: "900",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontFamily: "inherit",
            color: "#fff",
            opacity: 0.7,
            textAlign: "center",
          }}
        >
          THINKING...
        </div>
      ) : (
        <button
          onClick={handleExplain}
          style={{
            width: "100%",
            padding: "18px",
            background: "var(--accent)",
            color: "#fff",
            border: "2px solid var(--accent)",
            fontSize: "18px",
            fontWeight: "900",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          EXPLAIN THIS CARD
        </button>
      )}
    </div>
  );
}
