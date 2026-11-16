import { useState, useEffect, useRef } from "react";
import { manaVendorService, type ManaVendor } from "../../../../services/finance/manaVendorService";

interface Props {
  communityId: number;
  value: ManaVendor | null;
  onChange: (vendor: ManaVendor | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ManaVendorSelector({ communityId, value, onChange, placeholder = "Search vendor…", disabled }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ManaVendor[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleInput = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await manaVendorService.search(communityId, q);
        setResults(res.slice(0, 8));
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 280);
  };

  const handleSelect = (vendor: ManaVendor) => {
    onChange(vendor);
    setQuery(vendor.name);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery("");
    setResults([]);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          type="text"
          value={value ? value.name : query}
          onChange={(e) => { if (value) { onChange(null); } handleInput(e.target.value); }}
          onFocus={() => { if (!value && query === "") handleInput(""); }}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            flex: 1, padding: "9px 12px", borderRadius: 8,
            border: "1px solid #dfe4f5", fontSize: 13, outline: "none",
            background: disabled ? "#f8fafc" : "#fff",
          }}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 18, color: "#6b7094", padding: "0 4px" }}
          >
            ×
          </button>
        )}
      </div>

      {/* Selected vendor chip */}
      {value && (
        <div style={{
          marginTop: 6, padding: "6px 12px", background: "#f0f1ff",
          borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{value.name}</span>
            {value.gstin && <span style={{ marginLeft: 8, fontSize: 11, color: "#6b7094" }}>GST: {value.gstin}</span>}
            {value.phone && <span style={{ marginLeft: 8, fontSize: 11, color: "#6b7094" }}>{value.phone}</span>}
          </div>
          <span style={{ fontSize: 10, letterSpacing: ".05em", textTransform: "uppercase", color: "#8b8fc8" }}>
            {value.sourceModule}
          </span>
        </div>
      )}

      {/* Dropdown */}
      {open && !value && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: "#fff", border: "1px solid #dfe4f5", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,.12)", marginTop: 4, maxHeight: 280, overflowY: "auto",
        }}>
          {loading && (
            <div style={{ padding: "12px 16px", color: "#8b8fc8", fontSize: 13 }}>Searching…</div>
          )}
          {!loading && results.length === 0 && (
            <div style={{ padding: "12px 16px", color: "#8b8fc8", fontSize: 13 }}>No vendors found</div>
          )}
          {!loading && results.map((v) => (
            <div
              key={v.id}
              onClick={() => handleSelect(v)}
              style={{
                padding: "10px 16px", cursor: "pointer", borderBottom: "1px solid #f1f5f9",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            >
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{v.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7094" }}>
                  {[v.gstin && `GST: ${v.gstin}`, v.city, v.phone].filter(Boolean).join(" · ")}
                </p>
              </div>
              <span style={{
                fontSize: 10, letterSpacing: ".05em", textTransform: "uppercase",
                color: "#8b8fc8", border: "1px solid #dfe4f5", borderRadius: 999, padding: "2px 7px",
              }}>
                {v.sourceModule}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
