"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 9) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push(2);
    if (page > 4) pages.push("...");
    for (let i = Math.max(3, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) pages.push(i);
    if (page < totalPages - 3) pages.push("...");
    pages.push(totalPages - 1);
    pages.push(totalPages);
  }

  const btnBase: React.CSSProperties = {
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: "800",
    letterSpacing: "0.05em",
    cursor: "pointer",
    fontFamily: "inherit",
    border: "2px solid #000",
    background: "transparent",
    color: "#000",
  };

  return (
    <div className="flex items-center justify-center gap-1 mt-8 flex-wrap">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        style={{ ...btnBase, opacity: page <= 1 ? 0.25 : 1 }}
      >
        ←
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`e-${i}`} style={{ padding: "8px 6px", color: "#666", fontSize: "13px", fontWeight: "bold" }}>…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            style={{
              ...btnBase,
              background: p === page ? "#000" : "transparent",
              color: p === page ? "#fff" : "#000",
            }}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        style={{ ...btnBase, opacity: page >= totalPages ? 0.25 : 1 }}
      >
        →
      </button>
    </div>
  );
}
