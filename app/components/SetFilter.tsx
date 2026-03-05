"use client";

import { useState, useEffect, useRef } from "react";

interface SetOption {
  code: string;
  name: string;
}

interface SetFilterProps {
  value: string;
  onChange: (code: string) => void;
  inputStyle: React.CSSProperties;
}

export default function SetFilter({ value, onChange, inputStyle }: SetFilterProps) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<SetOption[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When value is cleared externally, reset display
  useEffect(() => {
    if (!value) {
      setQuery("");
      setSelectedName("");
    }
  }, [value]);

  // Fetch matching sets on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/sets?q=${encodeURIComponent(query)}`);
      const data: SetOption[] = await res.json();
      setOptions(data);
    }, 200);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (opt: SetOption) => {
    setSelectedName(opt.name);
    setQuery(opt.name);
    setOpen(false);
    onChange(opt.code);
  };

  const handleClear = () => {
    setQuery("");
    setSelectedName("");
    onChange("");
  };

  return (
    <div ref={containerRef} style={{ position: "relative", minWidth: "200px" }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onChange("");
          }}
          onFocus={() => setOpen(true)}
          placeholder="FILTER BY SET..."
          style={{ ...inputStyle, paddingRight: value ? "36px" : undefined }}
        />
        {value && (
          <button
            onClick={handleClear}
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#000",
              fontSize: "18px",
              fontWeight: "800",
              lineHeight: 1,
              padding: "0 4px",
            }}
            title="Clear set filter"
          >
            ×
          </button>
        )}
      </div>

      {open && options.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 100,
            background: "#fff",
            border: "2px solid #000",
            borderTop: "none",
            maxHeight: "260px",
            overflowY: "auto",
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.code}
              onMouseDown={() => handleSelect(opt)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 14px",
                background: "none",
                border: "none",
                borderBottom: "1px solid #e5e5e5",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "14px",
                color: "#000",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <span style={{ fontWeight: "800" }}>
                {opt.code.toUpperCase()}
              </span>
              {" — "}
              {opt.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
