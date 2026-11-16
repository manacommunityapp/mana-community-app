import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  cfbosAccountingService,
  type JournalEntry,
  type JournalEntryStatus,
} from "../../../../services/finance/cfbosAccountingService";

const STATUS_COLOR: Record<JournalEntryStatus, { bg: string; text: string }> = {
  DRAFT: { bg: "#f1f5f9", text: "#64748b" },
  POSTED: { bg: "#dcfce7", text: "#16a34a" },
  REVERSED: { bg: "#fee2e2", text: "#dc2626" },
};

function fmt(n: number): string {
  if (!n && n !== 0) return "—";
  return `₹${Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function thirtyDaysAgoStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}

interface DetailModalProps {
  entry: JournalEntry;
  onClose: () => void;
  onReverse: (id: number) => void;
}

function DetailModal({ entry, onClose, onReverse }: DetailModalProps) {
  const [reason, setReason] = useState("");
  const [reversing, setReversing] = useState(false);

  const handleReverse = async () => {
    if (!reason.trim()) { toast.error("Reversal reason is required"); return; }
    setReversing(true);
    try {
      await cfbosAccountingService.reverseJournalEntry(entry.id, reason);
      toast.success("Journal entry reversed");
      onReverse(entry.id);
      onClose();
    } catch {
      toast.error("Failed to reverse journal entry");
    } finally {
      setReversing(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff", borderRadius: 16, padding: 28, maxWidth: 680,
          width: "100%", maxHeight: "90vh", overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "#8b8fc8" }}>
              Journal Entry
            </p>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{entry.entryNumber}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 22, color: "#6b7094" }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {[
            ["Date", entry.entryDate],
            ["Type", entry.entryType],
            ["Source Module", entry.sourceModule ?? "—"],
            ["Source Document", entry.sourceDocumentType ? `${entry.sourceDocumentType} #${entry.sourceDocumentId}` : "—"],
            ["Status", entry.status],
            ["Posted At", entry.postedAt ? new Date(entry.postedAt).toLocaleString() : "—"],
          ].map(([label, val]) => (
            <div key={label} style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 14px" }}>
              <p style={{ margin: "0 0 3px", fontSize: 11, color: "#8b8fc8", letterSpacing: ".07em", textTransform: "uppercase" }}>{label}</p>
              <p style={{ margin: 0, fontWeight: 600 }}>{String(val)}</p>
            </div>
          ))}
        </div>

        <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "#6b7094", fontStyle: "italic" }}>
          {entry.narration}
        </p>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
          <thead>
            <tr>
              {["Account Code", "Account Name", "Narration", "Debit", "Credit"].map((h) => (
                <th key={h} style={{
                  textAlign: h === "Debit" || h === "Credit" ? "right" : "left",
                  fontSize: 10.5, letterSpacing: ".07em", textTransform: "uppercase",
                  color: "#8b8fc8", borderBottom: "1px dashed #dfe4f5", padding: "8px 0 8px",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entry.lines.map((line) => (
              <tr key={line.id} style={{ borderBottom: "1px dashed #dfe4f5" }}>
                <td style={{ padding: "9px 0", fontSize: 13 }}>{line.accountCode}</td>
                <td style={{ padding: "9px 0", fontSize: 13 }}>{line.accountName}</td>
                <td style={{ padding: "9px 0", fontSize: 12, color: "#6b7094" }}>{line.narration}</td>
                <td style={{ padding: "9px 0", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#4f46e5", fontWeight: line.debitAmount > 0 ? 600 : 400 }}>
                  {line.debitAmount > 0 ? fmt(line.debitAmount) : "—"}
                </td>
                <td style={{ padding: "9px 0", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#dc2626", fontWeight: line.creditAmount > 0 ? 600 : 400 }}>
                  {line.creditAmount > 0 ? fmt(line.creditAmount) : "—"}
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={3} style={{ padding: "12px 0 4px", fontWeight: 700, fontSize: 13 }}>Totals</td>
              <td style={{ padding: "12px 0 4px", textAlign: "right", fontWeight: 700, color: "#4f46e5" }}>{fmt(entry.totalDebit)}</td>
              <td style={{ padding: "12px 0 4px", textAlign: "right", fontWeight: 700, color: "#dc2626" }}>{fmt(entry.totalCredit)}</td>
            </tr>
          </tbody>
        </table>

        {entry.status === "POSTED" && (
          <div style={{ borderTop: "1px solid #dfe4f5", paddingTop: 16, display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 12, color: "#6b7094", marginBottom: 6 }}>
                Reversal Reason <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State why this entry is being reversed"
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 8,
                  border: "1px solid #dfe4f5", fontSize: 13, outline: "none",
                }}
              />
            </div>
            <button
              type="button"
              disabled={reversing || !reason.trim()}
              onClick={handleReverse}
              style={{
                padding: "10px 20px", borderRadius: 8, border: "none",
                background: "#dc2626", color: "#fff", fontWeight: 600,
                fontSize: 13, cursor: "pointer", opacity: reversing ? .6 : 1,
              }}
            >
              {reversing ? "Reversing…" : "Reverse Entry"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function JournalLedgerView() {
  const [from, setFrom] = useState(thirtyDaysAgoStr());
  const [to, setTo] = useState(todayStr());
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<JournalEntry | null>(null);

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const res = await cfbosAccountingService.getJournalEntries(from, to, p, pageSize);
      setEntries(res.content ?? []);
      setTotalElements(res.totalElements ?? 0);
      setPage(p);
    } catch {
      toast.error("Failed to load journal entries");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { load(0); }, [load]);

  const totalPages = Math.ceil(totalElements / pageSize);

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Accounting</p>
          <h1>Journal Ledger</h1>
          <p className="masthead-desc">Double-entry journal entries posted across all modules</p>
        </div>
        <div className="masthead-actions">
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <label style={{ fontSize: 12, color: "#6b7094" }}>From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #dfe4f5", fontSize: 13 }}
            />
            <label style={{ fontSize: 12, color: "#6b7094" }}>To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #dfe4f5", fontSize: 13 }}
            />
            <button
              type="button"
              onClick={() => load(0)}
              style={{
                padding: "9px 20px", borderRadius: 8, border: "none",
                background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff",
                fontWeight: 600, fontSize: 13, cursor: "pointer",
              }}
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Entries ({totalElements.toLocaleString()})</h2>
          {loading && <span className="tag">Loading…</span>}
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: "13%" }}>Entry #</th>
                <th style={{ width: "10%" }}>Date</th>
                <th>Narration</th>
                <th style={{ width: "14%" }}>Source</th>
                <th style={{ width: "11%", textAlign: "right" }}>Debit</th>
                <th style={{ width: "11%", textAlign: "right" }}>Credit</th>
                <th style={{ width: "9%" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "#8b8fc8", padding: "32px 0" }}>
                    No entries in this date range
                  </td>
                </tr>
              ) : (
                entries.map((e) => {
                  const sc = STATUS_COLOR[e.status] ?? STATUS_COLOR.DRAFT;
                  return (
                    <tr
                      key={e.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelected(e)}
                    >
                      <td style={{ fontWeight: 600, color: "#4f46e5" }}>{e.entryNumber}</td>
                      <td style={{ color: "#6b7094" }}>{e.entryDate}</td>
                      <td style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {e.narration}
                      </td>
                      <td>
                        <span style={{ fontSize: 11, letterSpacing: ".05em", textTransform: "uppercase", color: "#8b8fc8" }}>
                          {e.sourceModule ?? e.entryType}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#4f46e5" }}>
                        {fmt(e.totalDebit)}
                      </td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#dc2626" }}>
                        {fmt(e.totalCredit)}
                      </td>
                      <td>
                        <span style={{
                          fontSize: 11, letterSpacing: ".04em", textTransform: "uppercase",
                          borderRadius: 999, padding: "3px 9px", fontWeight: 600,
                          background: sc.bg, color: sc.text,
                        }}>
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
          <button
            type="button"
            disabled={page === 0}
            onClick={() => load(page - 1)}
            style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid #dfe4f5", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, opacity: page === 0 ? .4 : 1 }}
          >
            ← Prev
          </button>
          <span style={{ padding: "7px 12px", fontSize: 13, color: "#6b7094" }}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => load(page + 1)}
            style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid #dfe4f5", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, opacity: page >= totalPages - 1 ? .4 : 1 }}
          >
            Next →
          </button>
        </div>
      )}

      {selected && (
        <DetailModal
          entry={selected}
          onClose={() => setSelected(null)}
          onReverse={() => { setSelected(null); load(page); }}
        />
      )}
    </section>
  );
}
