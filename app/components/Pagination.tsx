"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  const btnBase = {
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "0.05em",
    cursor: "pointer",
    fontFamily: "inherit",
    border: "2px solid var(--accent)",
    background: "transparent",
    color: "var(--foreground)",
  };

  return (
    <div className="flex items-center justify-center gap-1 mt-8 flex-wrap">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        style={{ ...btnBase, opacity: page <= 1 ? 0.3 : 1 }}
      >
        ←
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`e-${i}`} style={{ padding: "8px 4px", color: "var(--muted-fg)", fontSize: "12px" }}>…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            style={{
              ...btnBase,
              background: p === page ? "var(--accent)" : "transparent",
              color: p === page ? "#fff" : "var(--foreground)",
            }}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        style={{ ...btnBase, opacity: page >= totalPages ? 0.3 : 1 }}
      >
        →
      </button>
    </div>
  );
}
