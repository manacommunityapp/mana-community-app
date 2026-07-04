import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ledgerFinanceService } from "../../../../services/ledgerFinanceService";

interface ExpenseRow { id: string; date: string; expense: string; paidFrom: string; amount: number; createdBy: string; status: string }

/* Business Expenses — list page (Expenses group). Converted from expenses.html
   into the shared .ledger-app theme; loads EXPENSE documents from the API. */
export function BusinessExpensesView({ onNewExpense, canAdd = true }: { onNewExpense: () => void; canAdd?: boolean }) {
  const [statusFilter, setStatusFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [advOpen, setAdvOpen] = useState(false);

  const [allExpenses, setAllExpenses] = useState<ExpenseRow[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const docs = await ledgerFinanceService.getDocuments("EXPENSE");
        setAllExpenses(docs.map((d) => ({
          id: d.code || `#${d.id}`,
          date: d.docDate || "",
          expense: d.items?.[0]?.item || "—",
          paidFrom: d.customerName || "—",
          amount: d.grandTotal ?? 0,
          createdBy: "—",
          status: d.status || "Unpaid",
        })));
      } catch {
        toast.error("Failed to load expenses.");
      }
    })();
  }, []);

  const expenses = useMemo(() => allExpenses.filter((e) => {
    if (statusFilter && e.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (search && !e.id.toLowerCase().includes(search.toLowerCase()) && !e.paidFrom.toLowerCase().includes(search.toLowerCase()) && !e.expense.toLowerCase().includes(search.toLowerCase())) return false;
    if (periodFilter === "month" && !e.date.startsWith("2026-07")) return false;
    return true;
  }), [allExpenses, statusFilter, search, periodFilter]);

  const metrics = useMemo(() => {
    let total = 0, unpaid = 0, paid = 0, month = 0;
    for (const e of allExpenses) {
      total += e.amount;
      if (e.status.toLowerCase() === "unpaid") unpaid += e.amount;
      if (e.status.toLowerCase() === "paid") paid += e.amount;
      if (e.date.startsWith("2026-07")) month += e.amount;
    }
    return { total, unpaid, paid, month };
  }, [allExpenses]);

  const onCardClick = (filter: "all" | "unpaid" | "paid" | "month") => {
    setStatusFilter(filter === "unpaid" || filter === "paid" ? filter : "");
    if (filter === "month") setPeriodFilter("month");
  };

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Expenses</p>
          <h1>Business Expenses</h1>
          <p className="masthead-desc">Manage and track all your business expenses</p>
        </div>
        {canAdd && (
          <button type="button" className="btn btn-primary" onClick={onNewExpense} style={{ display: "inline-flex", alignItems: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: -2, marginRight: 5 }}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            New Expense
          </button>
        )}
      </div>

      {/* STAT CARDS */}
      <div className="stat-grid">
        <div className="stat-card c-total clickable" onClick={() => onCardClick("all")}>
          <p className="stat-label">Total Expenses</p>
          <p className="stat-amt"><span className="cur">INR</span>{metrics.total.toFixed(2)}</p>
          <p className="stat-sub">{allExpenses.length} expenses</p>
        </div>
        <div className="stat-card c-pending clickable" onClick={() => onCardClick("unpaid")}>
          <p className="stat-label">Unpaid</p>
          <p className="stat-amt"><span className="cur">INR</span>{metrics.unpaid.toFixed(2)}</p>
          <p className="stat-sub">{allExpenses.filter((e) => e.status.toLowerCase() === "unpaid").length} pending</p>
        </div>
        <div className="stat-card c-collected clickable" onClick={() => onCardClick("paid")}>
          <p className="stat-label">Paid</p>
          <p className="stat-amt"><span className="cur">INR</span>{metrics.paid.toFixed(2)}</p>
          <p className="stat-sub">{allExpenses.filter((e) => e.status.toLowerCase() === "paid").length} fully paid</p>
        </div>
        <div className="stat-card c-settled clickable" onClick={() => onCardClick("month")}>
          <p className="stat-label">This Month</p>
          <p className="stat-amt"><span className="cur">INR</span>{metrics.month.toFixed(2)}</p>
          <p className="stat-sub">{allExpenses.filter((e) => e.date.startsWith("2026-07")).length} expenses</p>
        </div>
      </div>

      {/* EXPENSES TABLE */}
      <div className="card table-card">
        <div className="card-head">
          <h2>All Expenses</h2>
          <span className="tag">{expenses.length} results</span>
        </div>

        <div className="filter-bar">
          <div className="filter-left">
            <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Expenses</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
            <select className="filter-select" value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)}>
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="fy">Financial Year 2026–27 (Current)</option>
            </select>
            <span className="results-count">{expenses.length} results</span>
          </div>
          <div className="filter-right">
            <div className="search-row" style={{ margin: 0, width: 260 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#5C6B60" strokeWidth="1.7" /><path d="m20 20-3.5-3.5" stroke="#5C6B60" strokeWidth="1.7" strokeLinecap="round" /></svg>
              <input type="text" placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
              <label>Expense Type</label>
              <select>
                <option>All Types</option>
                <option>Purchase Account</option>
                <option>Travelling Allowance</option>
                <option>Payment Gateway Charges</option>
                <option>Shipping Charge</option>
                <option>Depreciation Account</option>
              </select>
            </div>
            <div className="adv-field">
              <label>Paid From</label>
              <select>
                <option>All Accounts</option>
                <option>Cash in hand</option>
                <option>Citi Bank</option>
                <option>SBI Bank</option>
                <option>Standard Chartered Bank</option>
              </select>
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
            <button type="button" className="btn btn-ghost" onClick={() => { setStatusFilter(""); setPeriodFilter("all"); setSearch(""); }}>Clear</button>
          </div>
        </div>

        <div className="card-body">
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr>
                  {["Expense Number", "Record Date", "Expense", "Paid From", "Amount", "Created By", "Status", "Actions"].map((h) => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr className="empty-table-row">
                    <td colSpan={8}>
                      <div className="glyph"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" stroke="#5C6B60" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                      No Expenses present.
                    </td>
                  </tr>
                ) : expenses.map((ex) => (
                  <tr key={ex.id}>
                    <td style={{ fontWeight: 600, color: "var(--ink)" }}>{ex.id}</td>
                    <td>{ex.date}</td>
                    <td>{ex.expense}</td>
                    <td>{ex.paidFrom}</td>
                    <td className="amount">₹{ex.amount.toFixed(2)}</td>
                    <td>{ex.createdBy}</td>
                    <td>{ex.status}</td>
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
