import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ledgerFinanceService } from "../../../../services/ledgerFinanceService";

interface PurchaseRow { id: string; date: string; vendor: string; due: string; amount: number; status: string }
interface ReturnRow { id: string; ref: string; date: string; vendor: string; amount: number; status: string }

/* Stock Purchases — list page (Expenses group). Converted from purchases.html
   into the shared .ledger-app theme; loads PURCHASE / PURCHASE_RETURN documents. */
export function StockPurchasesView({ onNewPurchase, canAdd = true }: { onNewPurchase: () => void; canAdd?: boolean }) {
  const [tab, setTab] = useState<"purchases" | "returns">("purchases");
  const [statusFilter, setStatusFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [advOpen, setAdvOpen] = useState(false);

  const [allPurchases, setAllPurchases] = useState<PurchaseRow[]>([]);
  const [returns, setReturns] = useState<ReturnRow[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [pur, ret] = await Promise.all([
          ledgerFinanceService.getDocuments("PURCHASE"),
          ledgerFinanceService.getDocuments("PURCHASE_RETURN"),
        ]);
        setAllPurchases(pur.map((d) => ({
          id: d.code || `#${d.id}`,
          date: d.docDate || "",
          vendor: d.customerName || "—",
          due: d.dueDate || "",
          amount: d.grandTotal ?? 0,
          status: d.status || "Unpaid",
        })));
        setReturns(ret.map((d) => ({
          id: d.code || `#${d.id}`,
          ref: "—",
          date: d.docDate || "",
          vendor: d.customerName || "—",
          amount: d.grandTotal ?? 0,
          status: d.status || "Open",
        })));
      } catch {
        toast.error("Failed to load purchases.");
      }
    })();
  }, []);

  const metrics = useMemo(() => {
    let total = 0, unpaid = 0, paid = 0, month = 0;
    for (const p of allPurchases) {
      total += p.amount;
      if (p.status.toLowerCase() === "unpaid") unpaid += p.amount;
      if (p.status.toLowerCase() === "paid") paid += p.amount;
      if (p.date.startsWith("2026-07")) month += p.amount;
    }
    return { total, unpaid, paid, month };
  }, [allPurchases]);

  const purchases = useMemo(() => allPurchases.filter((p) => {
    if (statusFilter && p.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (search && !p.id.toLowerCase().includes(search.toLowerCase()) && !p.vendor.toLowerCase().includes(search.toLowerCase())) return false;
    if (periodFilter === "month" && !p.date.startsWith("2026-07")) return false;
    return true;
  }), [allPurchases, statusFilter, search, periodFilter]);

  const onCardClick = (filter: "all" | "unpaid" | "paid" | "month") => {
    setStatusFilter(filter === "unpaid" || filter === "paid" ? filter : "");
    if (filter === "month") setPeriodFilter("month");
  };

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Expenses</p>
          <h1>Stock Purchases</h1>
          <p className="masthead-desc">Manage and track all your purchases</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div className="tabs">
            <button className={`tab${tab === "purchases" ? " active" : ""}`} onClick={() => setTab("purchases")}>All Purchases</button>
            <button className={`tab${tab === "returns" ? " active" : ""}`} onClick={() => setTab("returns")}>Purchase Returns</button>
          </div>
          {canAdd && (
            <button type="button" className="btn btn-primary" onClick={onNewPurchase} style={{ display: "inline-flex", alignItems: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: -2, marginRight: 5 }}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              New Purchase
            </button>
          )}
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="stat-grid">
        <div className="stat-card c-total clickable" onClick={() => onCardClick("all")}>
          <p className="stat-label">Total Purchases</p>
          <p className="stat-amt"><span className="cur">INR</span>{metrics.total.toFixed(2)}</p>
          <p className="stat-sub">{allPurchases.length} purchases</p>
        </div>
        <div className="stat-card c-pending clickable" onClick={() => onCardClick("unpaid")}>
          <p className="stat-label">Unpaid</p>
          <p className="stat-amt"><span className="cur">INR</span>{metrics.unpaid.toFixed(2)}</p>
          <p className="stat-sub">{allPurchases.filter((p) => p.status.toLowerCase() === "unpaid").length} pending</p>
        </div>
        <div className="stat-card c-collected clickable" onClick={() => onCardClick("paid")}>
          <p className="stat-label">Paid</p>
          <p className="stat-amt"><span className="cur">INR</span>{metrics.paid.toFixed(2)}</p>
          <p className="stat-sub">{allPurchases.filter((p) => p.status.toLowerCase() === "paid").length} fully paid</p>
        </div>
        <div className="stat-card c-settled clickable" onClick={() => onCardClick("month")}>
          <p className="stat-label">This Month</p>
          <p className="stat-amt"><span className="cur">INR</span>{metrics.month.toFixed(2)}</p>
          <p className="stat-sub">{allPurchases.filter((p) => p.date.startsWith("2026-07")).length} purchases</p>
        </div>
      </div>

      {/* ALL PURCHASES PANEL */}
      {tab === "purchases" && (
        <div className="card table-card">
          <div className="card-head">
            <h2>All Purchases</h2>
            <span className="tag">{purchases.length} results</span>
          </div>

          <div className="filter-bar">
            <div className="filter-left">
              <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Purchases</option>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="draft">Draft</option>
                <option value="settled">Settled</option>
                <option value="returned">Returned</option>
              </select>
              <select className="filter-select" value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)}>
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="fy">Financial Year 2026–27 (Current)</option>
              </select>
              <span className="results-count">{purchases.length} results</span>
            </div>
            <div className="filter-right">
              <div className="search-row" style={{ margin: 0, width: 260 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#5C6B60" strokeWidth="1.7" /><path d="m20 20-3.5-3.5" stroke="#5C6B60" strokeWidth="1.7" strokeLinecap="round" /></svg>
                <input type="text" placeholder="Search purchases..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
                <label>Record Date</label>
                <div className="adv-range">
                  <input type="date" placeholder="From" />
                  <input type="date" placeholder="To" />
                </div>
              </div>
              <div className="adv-field">
                <label>Due Date</label>
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
                  <tr>{["Purchase Number", "Record Date", "Vendor Name", "Due Date", "Amount", "Status", "Actions"].map((h) => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {purchases.length === 0 ? (
                    <tr className="empty-table-row">
                      <td colSpan={7}>
                        <div className="glyph"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7 3h10a1 1 0 0 1 1 1v16l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1Z" stroke="#5C6B60" strokeWidth="1.6" strokeLinejoin="round" /></svg></div>
                        No purchases present.
                      </td>
                    </tr>
                  ) : purchases.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: "var(--ink)" }}>{p.id}</td>
                      <td>{p.date}</td>
                      <td>{p.vendor}</td>
                      <td>{p.due}</td>
                      <td className="amount">₹{p.amount.toFixed(2)}</td>
                      <td>{p.status}</td>
                      <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PURCHASE RETURNS PANEL */}
      {tab === "returns" && (
        <div className="card table-card">
          <div className="card-head">
            <h2>Purchase Returns</h2>
            <span className="tag">{returns.length} results</span>
          </div>
          <div className="card-body" style={{ paddingTop: 20 }}>
            <div className="table-scroll">
              <table className="data">
                <thead>
                  <tr>{["Purchase Return Number", "Purchase Reference", "Record Date", "Vendor Name", "Amount", "Status", "Actions"].map((h) => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {returns.length === 0 ? (
                    <tr className="empty-table-row">
                      <td colSpan={7}>
                        <div className="glyph"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 14 4 9l5-5M4 9h11a5 5 0 0 1 5 5v1" stroke="#5C6B60" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                        No purchase returns present.
                      </td>
                    </tr>
                  ) : returns.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600, color: "var(--ink)" }}>{r.id}</td>
                      <td>{r.ref}</td>
                      <td>{r.date}</td>
                      <td>{r.vendor}</td>
                      <td className="amount">₹{r.amount.toFixed(2)}</td>
                      <td>{r.status}</td>
                      <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
