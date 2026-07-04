import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ledgerFinanceService } from "../../../../services/ledgerFinanceService";

/* Debit Notes — list page (Expenses group). Converted from GST_Debit_Notes.html
   into the shared .ledger-app theme; loads DEBIT_NOTE documents. */

interface DebitNoteRow { id: string; date: string; vendor: string; gstin: string; amount: number; status: string }

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  unallocated: { background: "var(--expense-soft)", color: "var(--expense)" },
  allocated: { background: "var(--income-soft)", color: "var(--income)" },
};
const statusPill = (status: string): React.CSSProperties => ({
  display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
  ...(STATUS_STYLE[status.toLowerCase()] ?? { background: "var(--bg)", color: "var(--muted)" }),
});

export function DebitNotesView() {
  const [statusFilter, setStatusFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [advOpen, setAdvOpen] = useState(false);

  const [allNotes, setAllNotes] = useState<DebitNoteRow[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const docs = await ledgerFinanceService.getDocuments("DEBIT_NOTE");
        setAllNotes(docs.map((d) => ({
          id: d.code || `#${d.id}`,
          date: d.docDate || "",
          vendor: d.customerName || "—",
          gstin: "—",
          amount: d.grandTotal ?? 0,
          status: d.status || "Unallocated",
        })));
      } catch {
        toast.error("Failed to load debit notes.");
      }
    })();
  }, []);

  const metrics = useMemo(() => {
    let total = 0, unallocated = 0, allocated = 0, month = 0;
    let unallocatedCount = 0, allocatedCount = 0, monthCount = 0;
    for (const n of allNotes) {
      total += n.amount;
      if (n.status.toLowerCase() === "unallocated") { unallocated += n.amount; unallocatedCount++; }
      if (n.status.toLowerCase() === "allocated") { allocated += n.amount; allocatedCount++; }
      if (n.date.startsWith("2026-07")) { month += n.amount; monthCount++; }
    }
    return { total, unallocated, allocated, month, unallocatedCount, allocatedCount, monthCount };
  }, [allNotes]);

  const notes = useMemo(() => allNotes.filter((n) => {
    if (statusFilter && n.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (search && !n.id.toLowerCase().includes(search.toLowerCase()) && !n.vendor.toLowerCase().includes(search.toLowerCase())) return false;
    if (periodFilter === "month" && !n.date.startsWith("2026-07")) return false;
    return true;
  }), [allNotes, statusFilter, search, periodFilter]);

  const onCardClick = (filter: "all" | "unallocated" | "allocated" | "month") => {
    setStatusFilter(filter === "unallocated" || filter === "allocated" ? filter : "");
    if (filter === "month") setPeriodFilter("month");
  };

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Expenses</p>
          <h1>GST Debit Notes</h1>
          <p className="masthead-desc">Manage and track your GST debit notes</p>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="stat-grid">
        <div className="stat-card c-total clickable" onClick={() => onCardClick("all")}>
          <p className="stat-label">Total Debit Notes</p>
          <p className="stat-amt"><span className="cur">INR</span>{metrics.total.toFixed(2)}</p>
          <p className="stat-sub">{allNotes.length} notes</p>
        </div>
        <div className="stat-card c-pending clickable" onClick={() => onCardClick("unallocated")}>
          <p className="stat-label">Unallocated</p>
          <p className="stat-amt"><span className="cur">INR</span>{metrics.unallocated.toFixed(2)}</p>
          <p className="stat-sub">{metrics.unallocatedCount} pending</p>
        </div>
        <div className="stat-card c-collected clickable" onClick={() => onCardClick("allocated")}>
          <p className="stat-label">Allocated</p>
          <p className="stat-amt"><span className="cur">INR</span>{metrics.allocated.toFixed(2)}</p>
          <p className="stat-sub">{metrics.allocatedCount} allocated</p>
        </div>
        <div className="stat-card c-settled clickable" onClick={() => onCardClick("month")}>
          <p className="stat-label">This Month</p>
          <p className="stat-amt"><span className="cur">INR</span>{metrics.month.toFixed(2)}</p>
          <p className="stat-sub">{metrics.monthCount} notes</p>
        </div>
      </div>

      {/* TABLE */}
      <div className="card table-card">
        <div className="card-head">
          <h2>All Debit Notes</h2>
          <span className="tag">{notes.length} results</span>
        </div>

        <div className="filter-bar">
          <div className="filter-left">
            <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Notes</option>
              <option value="allocated">Allocated</option>
              <option value="unallocated">Unallocated</option>
            </select>
            <select className="filter-select" value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)}>
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="fy">Financial Year 2026–27 (Current)</option>
            </select>
            <span className="results-count">{notes.length} results</span>
          </div>
          <div className="filter-right">
            <div className="search-row" style={{ margin: 0, width: 260 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#5C6B60" strokeWidth="1.7" /><path d="m20 20-3.5-3.5" stroke="#5C6B60" strokeWidth="1.7" strokeLinecap="round" /></svg>
              <input type="text" placeholder="Search Debit Notes..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <button type="button" className={`filter-toggle${advOpen ? " active" : ""}`} title="More Filters" onClick={() => setAdvOpen((v) => !v)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 6h4m4 0h8M4 12h10m4 0h2M4 18h6m4 0h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /><circle cx="10" cy="6" r="1.8" fill="currentColor" /><circle cx="16" cy="12" r="1.8" fill="currentColor" /><circle cx="12" cy="18" r="1.8" fill="currentColor" /></svg>
            </button>
          </div>
        </div>

        {/* ADVANCED FILTERS */}
        <div className={`adv-filters${advOpen ? " open" : ""}`}>
          <div className="adv-grid">
            <div className="adv-field">
              <label>Vendor Name</label>
              <select><option>All Vendors</option></select>
            </div>
            <div className="adv-field">
              <label>Amount</label>
              <div className="adv-range">
                <input type="number" min={0} step="any" placeholder="Min" />
                <input type="number" min={0} step="any" placeholder="Max" />
              </div>
            </div>
            <div className="adv-field">
              <label>Note Date</label>
              <div className="adv-range">
                <input type="date" placeholder="From" />
                <input type="date" placeholder="To" />
              </div>
            </div>
          </div>
          <div className="adv-actions">
            <button type="button" className="btn btn-primary">Search</button>
            <button type="button" className="btn btn-ghost" onClick={() => { setStatusFilter(""); setPeriodFilter("all"); setSearch(""); }}>Clear</button>
          </div>
        </div>

        <div className="card-body">
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr>{["Debit Note No", "Date", "Vendor", "GSTIN", "Amount", "Status", "Actions"].map((h) => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {notes.length === 0 ? (
                  <tr className="empty-table-row">
                    <td colSpan={7}>
                      <div className="glyph"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 7a1 1 0 0 1 1-1h4l2 2h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7Z" stroke="#5C6B60" strokeWidth="1.6" strokeLinejoin="round" /></svg></div>
                      No debit notes present.
                    </td>
                  </tr>
                ) : notes.map((n) => (
                  <tr key={n.id}>
                    <td style={{ fontWeight: 600, color: "var(--ink)" }}>{n.id}</td>
                    <td>{n.date}</td>
                    <td>{n.vendor}</td>
                    <td>{n.gstin}</td>
                    <td className="amount">₹{n.amount.toFixed(2)}</td>
                    <td><span style={statusPill(n.status)}>{n.status}</span></td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
