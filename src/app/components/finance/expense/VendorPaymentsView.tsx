import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ledgerFinanceService, type VendorPayment } from "../../../../services/ledgerFinanceService";

/* Payment Vouchers — list page (Expenses group → Vendor Payments). Converted from
   payment_vouchers.html into the shared .ledger-app theme; loads vendor payments
   split by paymentType into three tabs. */

type Tab = "paid" | "advance" | "other";

const statusPill = (status: string): React.CSSProperties => {
  const s = (status || "").toLowerCase();
  const tone = s.includes("unallocated")
    ? { background: "var(--expense-soft)", color: "var(--expense)" }
    : s.includes("partial")
      ? { background: "#FEF3C7", color: "#B45309" }
      : { background: "var(--income-soft)", color: "var(--income)" };
  return { display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, ...tone };
};

const isThisMonth = (iso?: string) => (iso || "").startsWith("2026-07");
const inr = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function VendorPaymentsView({ onNewPaidBill, onNewAdvance, onNewOther }: { onNewPaidBill: () => void; onNewAdvance: () => void; onNewOther: () => void }) {
  const [tab, setTab] = useState<Tab>("paid");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [advOpen, setAdvOpen] = useState(false);

  const [paidBills, setPaidBills] = useState<VendorPayment[]>([]);
  const [advances, setAdvances] = useState<VendorPayment[]>([]);
  const [others, setOthers] = useState<VendorPayment[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [paid, adv, oth] = await Promise.all([
          ledgerFinanceService.getVendorPayments("PAID_BILL"),
          ledgerFinanceService.getVendorPayments("ADVANCE"),
          ledgerFinanceService.getVendorPayments("OTHER"),
        ]);
        setPaidBills(paid); setAdvances(adv); setOthers(oth);
      } catch {
        toast.error("Failed to load payment vouchers.");
      }
    })();
  }, []);

  const applyFilters = (rows: VendorPayment[], useStatus: boolean) => rows.filter((p) => {
    if (useStatus && statusFilter && !(p.status || "").toLowerCase().includes(statusFilter.toLowerCase())) return false;
    if (search && !(p.code || "").toLowerCase().includes(search.toLowerCase()) && !(p.vendorName || "").toLowerCase().includes(search.toLowerCase())) return false;
    if (periodFilter === "month" && !isThisMonth(p.paymentDate)) return false;
    return true;
  });

  const paidMetrics = useMemo(() => {
    const total = paidBills.reduce((s, p) => s + (p.amount ?? 0), 0);
    const month = paidBills.filter((p) => isThisMonth(p.paymentDate)).reduce((s, p) => s + (p.amount ?? 0), 0);
    const byVendor = new Map<string, number>();
    for (const p of paidBills) byVendor.set(p.vendorName || "—", (byVendor.get(p.vendorName || "—") ?? 0) + (p.amount ?? 0));
    let topVendor = "—", topAmt = -1;
    for (const [v, a] of byVendor) if (a > topAmt) { topVendor = v; topAmt = a; }
    return { total, month, topVendor, avg: paidBills.length ? total / paidBills.length : 0 };
  }, [paidBills]);

  const advMetrics = useMemo(() => {
    const total = advances.reduce((s, p) => s + (p.amount ?? 0), 0);
    const unallocated = advances.filter((p) => (p.status || "").toLowerCase().includes("unallocated")).length;
    return { total, unallocated, avg: advances.length ? total / advances.length : 0 };
  }, [advances]);

  const otherMetrics = useMemo(() => {
    const total = others.reduce((s, p) => s + (p.amount ?? 0), 0);
    const month = others.filter((p) => isThisMonth(p.paymentDate)).reduce((s, p) => s + (p.amount ?? 0), 0);
    return { total, month, avg: others.length ? total / others.length : 0 };
  }, [others]);

  const clearFilters = () => { setStatusFilter(""); setPeriodFilter("all"); setSearch(""); };

  const filteredPaid = useMemo(() => applyFilters(paidBills, false), [paidBills, statusFilter, search, periodFilter]);
  const filteredAdv = useMemo(() => applyFilters(advances, true), [advances, statusFilter, search, periodFilter]);
  const filteredOther = useMemo(() => applyFilters(others, false), [others, statusFilter, search, periodFilter]);

  const activeCount = tab === "paid" ? filteredPaid.length : tab === "advance" ? filteredAdv.length : filteredOther.length;

  const periodSelect = (
    <select className="filter-select" value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)}>
      <option value="all">All Time</option>
      <option value="today">Today</option>
      <option value="week">This Week</option>
      <option value="month">This Month</option>
      <option value="quarter">This Quarter</option>
      <option value="fy">Financial Year 2026–27 (Current)</option>
    </select>
  );

  const searchBar = (placeholder: string) => (
    <div className="filter-right">
      <div className="search-row" style={{ margin: 0, width: 280 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#8b8fc8" strokeWidth="1.7" /><path d="m20 20-3.5-3.5" stroke="#8b8fc8" strokeWidth="1.7" strokeLinecap="round" /></svg>
        <input type="text" placeholder={placeholder} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <button type="button" className={`filter-toggle${advOpen ? " active" : ""}`} title="More Filters" onClick={() => setAdvOpen((v) => !v)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 6h4m4 0h8M4 12h10m4 0h2M4 18h6m4 0h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /><circle cx="10" cy="6" r="1.8" fill="currentColor" /><circle cx="16" cy="12" r="1.8" fill="currentColor" /><circle cx="12" cy="18" r="1.8" fill="currentColor" /></svg>
      </button>
    </div>
  );

  const advPanel = (
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
      </div>
      <div className="adv-actions">
        <button type="button" className="btn btn-primary">Search</button>
        <button type="button" className="btn btn-ghost" onClick={clearFilters}>Clear</button>
      </div>
    </div>
  );

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Expenses</p>
          <h1>Payment Vouchers</h1>
          <p className="masthead-desc">Track payments made to vendors and other accounts</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div className="tabs">
            <button className={`tab${tab === "paid" ? " active" : ""}`} onClick={() => { setTab("paid"); clearFilters(); }}>Paid Bills</button>
            <button className={`tab${tab === "advance" ? " active" : ""}`} onClick={() => { setTab("advance"); clearFilters(); }}>Advance Payments</button>
            <button className={`tab${tab === "other" ? " active" : ""}`} onClick={() => { setTab("other"); clearFilters(); }}>Other Payments</button>
          </div>
          {tab === "paid" && (
            <button type="button" className="btn btn-primary" onClick={onNewPaidBill} style={{ display: "inline-flex", alignItems: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: -2, marginRight: 5 }}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              New Payment
            </button>
          )}
          {tab === "advance" && (
            <button type="button" className="btn btn-primary" onClick={onNewAdvance} style={{ display: "inline-flex", alignItems: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: -2, marginRight: 5 }}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              New Advance Payment
            </button>
          )}
          {tab === "other" && (
            <button type="button" className="btn btn-primary" onClick={onNewOther} style={{ display: "inline-flex", alignItems: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: -2, marginRight: 5 }}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              New Other Payment
            </button>
          )}
        </div>
      </div>

      {/* ============ PAID BILLS ============ */}
      {tab === "paid" && (
        <>
          <div className="stat-grid">
            <div className="stat-card c-total"><p className="stat-label">Total Paid</p><p className="stat-amt"><span className="cur">INR</span>{inr(paidMetrics.total)}</p><p className="stat-sub">{paidBills.length} payments</p></div>
            <div className="stat-card c-collected"><p className="stat-label">This Month</p><p className="stat-amt"><span className="cur">INR</span>{inr(paidMetrics.month)}</p><p className="stat-sub">Paid this month</p></div>
            <div className="stat-card c-settled"><p className="stat-label">Top Vendor</p><p className="stat-amt" style={{ fontSize: "1.05rem" }}>{paidMetrics.topVendor}</p><p className="stat-sub">By total paid</p></div>
            <div className="stat-card c-pending"><p className="stat-label">Average Payment</p><p className="stat-amt"><span className="cur">INR</span>{inr(paidMetrics.avg)}</p><p className="stat-sub">Per voucher</p></div>
          </div>
          <div className="card table-card">
            <div className="card-head"><h2>Paid Bills</h2><span className="tag">{activeCount} results</span></div>
            <div className="filter-bar">
              <div className="filter-left">{periodSelect}<span className="results-count">{activeCount} results</span></div>
              {searchBar("Search voucher no...")}
            </div>
            {advPanel}
            <div className="card-body">
              <div className="table-scroll">
                <table className="data">
                  <thead><tr>{["Voucher Number", "Payment Date", "Payment To", "Amount", "Payment Mode", "Actions"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {filteredPaid.length === 0 ? (
                      <tr className="empty-table-row"><td colSpan={6}><div className="glyph"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 7h18v10H3zM3 11h18" stroke="#8b8fc8" strokeWidth="1.6" strokeLinejoin="round" /></svg></div>No Payment vouchers present.</td></tr>
                    ) : filteredPaid.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600, color: "var(--ink)" }}>{p.code || `#${p.id}`}</td>
                        <td>{p.paymentDate || ""}</td>
                        <td>{p.vendorName || "—"}</td>
                        <td className="amount">₹{inr(p.amount ?? 0)}</td>
                        <td>{p.paymentMode || "—"}</td>
                        <td></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============ ADVANCE PAYMENTS ============ */}
      {tab === "advance" && (
        <>
          <div className="stat-grid">
            <div className="stat-card c-total"><p className="stat-label">Total GST Advances</p><p className="stat-amt"><span className="cur">INR</span>{inr(advMetrics.total)}</p><p className="stat-sub">{advances.length} entries</p></div>
            <div className="stat-card c-pending"><p className="stat-label">Unallocated</p><p className="stat-amt">{advMetrics.unallocated}</p><p className="stat-sub">Awaiting bill allocation</p></div>
            <div className="stat-card c-settled"><p className="stat-label">Average Amount</p><p className="stat-amt"><span className="cur">INR</span>{inr(advMetrics.avg)}</p><p className="stat-sub">Per voucher</p></div>
          </div>
          <div className="card table-card">
            <div className="card-head"><h2>Advance Payments</h2><span className="tag">{activeCount} results</span></div>
            <div className="filter-bar">
              <div className="filter-left">
                <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="allocated">Allocated</option>
                  <option value="unallocated">Unallocated</option>
                  <option value="partial">Partially Allocated</option>
                </select>
                {periodSelect}
                <span className="results-count">{activeCount} results</span>
              </div>
              {searchBar("Search GST advance no...")}
            </div>
            {advPanel}
            <div className="card-body">
              <div className="table-scroll">
                <table className="data">
                  <thead><tr>{["Voucher Number", "Customer Name", "Record Date", "Balance", "Status", "Actions"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {filteredAdv.length === 0 ? (
                      <tr className="empty-table-row"><td colSpan={6}><div className="glyph"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 7h18v10H3zM3 11h18" stroke="#8b8fc8" strokeWidth="1.6" strokeLinejoin="round" /></svg></div>No GST advance payments present.</td></tr>
                    ) : filteredAdv.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600, color: "var(--ink)" }}>{p.code || `#${p.id}`}</td>
                        <td>{p.vendorName || "—"}</td>
                        <td>{p.paymentDate || ""}</td>
                        <td className="amount">₹{inr(p.amount ?? 0)}</td>
                        <td><span style={statusPill(p.status || "Unallocated")}>{p.status || "Unallocated"}</span></td>
                        <td></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============ OTHER PAYMENTS ============ */}
      {tab === "other" && (
        <>
          <div className="stat-grid">
            <div className="stat-card c-total"><p className="stat-label">Total Other</p><p className="stat-amt"><span className="cur">INR</span>{inr(otherMetrics.total)}</p><p className="stat-sub">{others.length} entries</p></div>
            <div className="stat-card c-collected"><p className="stat-label">This Month</p><p className="stat-amt"><span className="cur">INR</span>{inr(otherMetrics.month)}</p><p className="stat-sub">Spent this month</p></div>
            <div className="stat-card c-settled"><p className="stat-label">Average Amount</p><p className="stat-amt"><span className="cur">INR</span>{inr(otherMetrics.avg)}</p><p className="stat-sub">Per voucher</p></div>
          </div>
          <div className="card table-card">
            <div className="card-head"><h2>Other Payments</h2><span className="tag">{activeCount} results</span></div>
            <div className="filter-bar">
              <div className="filter-left">{periodSelect}<span className="results-count">{activeCount} results</span></div>
              {searchBar("Search voucher no...")}
            </div>
            {advPanel}
            <div className="card-body">
              <div className="table-scroll">
                <table className="data">
                  <thead><tr>{["Voucher Number", "Payment Date", "Payment To", "Amount", "Payment Mode", "Actions"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {filteredOther.length === 0 ? (
                      <tr className="empty-table-row"><td colSpan={6}><div className="glyph"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 7h18v10H3zM3 11h18" stroke="#8b8fc8" strokeWidth="1.6" strokeLinejoin="round" /></svg></div>No Other payment vouchers present.</td></tr>
                    ) : filteredOther.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600, color: "var(--ink)" }}>{p.code || `#${p.id}`}</td>
                        <td>{p.paymentDate || ""}</td>
                        <td>{p.vendorName || "—"}</td>
                        <td className="amount">₹{inr(p.amount ?? 0)}</td>
                        <td>{p.paymentMode || "—"}</td>
                        <td></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
