import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { ledgerFinanceService } from "../../../../services/ledgerFinanceService";

export function CreditNotesView({ onNewCreditNote, canAdd = true }: { onNewCreditNote: () => void; canAdd?: boolean }) {
  const [statusFilter, setStatusFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("All Time");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced Filters State
  const [customerFilter, setCustomerFilter] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [notes, setNotes] = useState<Array<{ id: string; date: string; customer: string; amount: number; status: string }>>([]);

  useEffect(() => {
    (async () => {
      try {
        const docs = await ledgerFinanceService.getDocuments("CREDIT_NOTE");
        setNotes(docs.map((d) => ({
          id: d.code || `#${d.id}`,
          date: d.docDate || "",
          customer: d.customerName || "—",
          amount: d.grandTotal ?? 0,
          status: d.status || "Open",
        })));
      } catch {
        toast.error("Failed to load credit notes.");
      }
    })();
  }, []);

  // Compute metrics dynamically
  const metrics = useMemo(() => {
    let total = 0;
    let open = 0;
    let allocated = 0;
    let thisMonth = 0;

    notes.forEach((cn) => {
      total += cn.amount;
      if (cn.status === "Open") open += cn.amount;
      if (cn.status === "Allocated") allocated += cn.amount;
      if (cn.date.startsWith("2026-07")) thisMonth += cn.amount;
    });

    return { total, open, allocated, thisMonth };
  }, [notes]);

  // Filter logic
  const filteredNotes = useMemo(() => {
    return notes.filter((cn) => {
      if (statusFilter && cn.status !== statusFilter) return false;
      if (searchQuery && !cn.id.toLowerCase().includes(searchQuery.toLowerCase()) && !cn.customer.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      // Period filter
      if (periodFilter === "This Month" && !cn.date.startsWith("2026-07")) return false;
      if (periodFilter === "Last Month" && !cn.date.startsWith("2026-06")) return false;

      // Advanced filters
      if (customerFilter && cn.customer !== customerFilter) return false;
      if (minAmount && cn.amount < parseFloat(minAmount)) return false;
      if (maxAmount && cn.amount > parseFloat(maxAmount)) return false;
      if (fromDate && cn.date < fromDate) return false;
      if (toDate && cn.date > toDate) return false;

      return true;
    });
  }, [notes, statusFilter, periodFilter, searchQuery, customerFilter, minAmount, maxAmount, fromDate, toDate]);

  // Unique list of customers for select filter
  const uniqueCustomers = useMemo(() => {
    return Array.from(new Set(notes.map(n => n.customer)));
  }, [notes]);

  const handleClearFilters = () => {
    setStatusFilter("");
    setPeriodFilter("All Time");
    setSearchQuery("");
    setCustomerFilter("");
    setMinAmount("");
    setMaxAmount("");
    setFromDate("");
    setToDate("");
    toast.success("Filters cleared successfully!");
  };

  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPeriodDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <section className="view">
      <div className="masthead" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p className="masthead-eyebrow">Income / Credit Notes</p>
          <h1>Credit Notes</h1>
          <p className="masthead-desc">Manage and track your customer GST credit notes</p>
        </div>
        <div>
          {canAdd && (
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={onNewCreditNote}
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
              New Credit Note
            </button>
          )}
        </div>
      </div>

      <div className="card mb-3 mt-2 shadow-sm" style={{ border: "1px solid #e2e8f0", borderRadius: "12px", background: "#fff", overflow: "hidden" }}>
        {/* Metric Cards block */}
        <div style={{ padding: "16px 20px 4px 20px" }}>
          <div className="stat-grid cols-4" style={{ gap: 16 }}>
            <div>
              <div className="rounded-3 h-100" style={{ border: "1px solid #e2e8f0", borderTop: "3px solid #7baaf7", background: "linear-gradient(135deg, #ffffff 0%, #eef4ff 100%)", padding: "12px 16px" }}>
                <div style={{ fontSize: "0.7rem", letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 600, color: "var(--muted-2)" }}>Total Credit Notes</div>
                <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: "var(--ink)", marginTop: 4 }}>INR {metrics.total.toFixed(2)}</div>
                <small style={{ fontSize: "11px", color: "var(--muted)" }}>{notes.length} notes</small>
              </div>
            </div>

            <div>
              <div className="rounded-3 h-100" style={{ border: "1px solid #e2e8f0", borderTop: "3px solid #fbbf24", background: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)", padding: "12px 16px" }}>
                <div style={{ fontSize: "0.7rem", letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 600, color: "var(--muted-2)" }}>Open</div>
                <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#d97706", marginTop: 4 }}>INR {metrics.open.toFixed(2)}</div>
                <small style={{ fontSize: "11px", color: "var(--muted)" }}>{notes.filter(n => n.status === "Open").length} pending</small>
              </div>
            </div>

            <div>
              <div className="rounded-3 h-100" style={{ border: "1px solid #e2e8f0", borderTop: "3px solid #4ade80", background: "linear-gradient(135deg, #ffffff 0%, #f0fff4 100%)", padding: "12px 16px" }}>
                <div style={{ fontSize: "0.7rem", letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 600, color: "var(--muted-2)" }}>Allocated</div>
                <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: "var(--income)", marginTop: 4 }}>INR {metrics.allocated.toFixed(2)}</div>
                <small style={{ fontSize: "11px", color: "var(--muted)" }}>{notes.filter(n => n.status === "Allocated").length} allocated</small>
              </div>
            </div>

            <div>
              <div className="rounded-3 h-100" style={{ border: "1px solid #e2e8f0", borderTop: "3px solid #a78bfa", background: "linear-gradient(135deg, #ffffff 0%, #f5f0ff 100%)", padding: "12px 16px" }}>
                <div style={{ fontSize: "0.7rem", letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 600, color: "var(--muted-2)" }}>This Month</div>
                <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#7c3aed", marginTop: 4 }}>INR {metrics.thisMonth.toFixed(2)}</div>
                <small style={{ fontSize: "11px", color: "var(--muted)" }}>{notes.filter(n => n.date.startsWith("2026-07")).length} notes</small>
              </div>
            </div>
          </div>
        </div>

        {/* Filter / Search Actions Area */}
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 15, flexWrap: "wrap", marginBottom: 15 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <select 
                className="form-select" 
                style={{ width: "180px", height: "38px", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", color: "#344050", background: "#fff", border: "1px solid #d8e2ef", borderRadius: "6px" }}
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Notes</option>
                <option value="open">Open</option>
                <option value="allocated">Allocated</option>
              </select>

              {/* Custom Period Dropdown */}
              <div ref={dropdownRef} style={{ position: "relative" }}>
                <button 
                  type="button" 
                  onClick={() => setIsPeriodDropdownOpen(prev => !prev)}
                  style={{
                    background: "#ffffff", 
                    border: "1px solid #d8e2ef", 
                    borderRadius: "6px", 
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)", 
                    width: "220px", 
                    height: "38px", 
                    fontSize: "0.875rem", 
                    textAlign: "left", 
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 12px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--income)" strokeWidth="2.5"><path d="M19 4H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {periodFilter}
                  </span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
                </button>

                {isPeriodDropdownOpen && (
                  <ul style={{ position: "absolute", zIndex: 100, top: "100%", left: 0, marginTop: 6, width: "260px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: 8, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", listStyle: "none", display: "flex", flexDirection: "column", gap: 2 }}>
                    <li>
                      <button 
                        type="button" 
                        onClick={() => { setPeriodFilter("All Time"); setIsPeriodDropdownOpen(false); }}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "8px 12px", background: periodFilter === "All Time" ? "var(--bg)" : "none", border: "none", borderRadius: "6px", fontSize: "12.5px", textAlign: "left", cursor: "pointer", fontWeight: 500, color: "var(--ink)" }}
                      >
                        <span>All Time</span>
                        {periodFilter === "All Time" && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--income)" strokeWidth="3"><path d="M20 6 9 17l-5-5" strokeLinecap="round"/></svg>}
                      </button>
                    </li>
                    <li style={{ borderTop: "1px solid #edf2f7", marginTop: 4, paddingTop: 4 }}>
                      <h6 style={{ margin: "4px 0 4px 12px", fontSize: "9px", textTransform: "uppercase", fontWeight: "bold", color: "var(--muted-2)", letterSpacing: "0.6px" }}>Quick Range</h6>
                    </li>
                    {["Today", "This Week", "This Month", "This Quarter"].map((r) => (
                      <li key={r}>
                        <button 
                          type="button" 
                          onClick={() => { setPeriodFilter(r); setIsPeriodDropdownOpen(false); }}
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "8px 12px", background: periodFilter === r ? "var(--bg)" : "none", border: "none", borderRadius: "6px", fontSize: "12.5px", textAlign: "left", cursor: "pointer", fontWeight: 500, color: "var(--ink)" }}
                        >
                          <span>{r}</span>
                          {periodFilter === r && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--income)" strokeWidth="3"><path d="M20 6 9 17l-5-5" strokeLinecap="round"/></svg>}
                        </button>
                      </li>
                    ))}
                    <li style={{ borderTop: "1px solid #edf2f7", marginTop: 4, paddingTop: 4 }}>
                      <h6 style={{ margin: "4px 0 4px 12px", fontSize: "9px", textTransform: "uppercase", fontWeight: "bold", color: "var(--muted-2)", letterSpacing: "0.6px" }}>Financial Year</h6>
                    </li>
                    <li>
                      <button 
                        type="button" 
                        onClick={() => { setPeriodFilter("2026-27"); setIsPeriodDropdownOpen(false); }}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "8px 12px", background: periodFilter === "2026-27" ? "var(--bg)" : "none", border: "none", borderRadius: "6px", fontSize: "12.5px", textAlign: "left", cursor: "pointer", fontWeight: 500, color: "var(--ink)" }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          2026-27 <span style={{ fontSize: "9px", padding: "1px 5px", background: "#def7ec", color: "#03543f", borderRadius: "4px", fontWeight: "bold" }}>Current</span>
                        </span>
                        {periodFilter === "2026-27" && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--income)" strokeWidth="3"><path d="M20 6 9 17l-5-5" strokeLinecap="round"/></svg>}
                      </button>
                    </li>
                  </ul>
                )}
              </div>

              <span style={{ fontSize: "13px", color: "var(--muted)", whiteSpace: "nowrap" }}>
                {filteredNotes.length} results
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="input-group" style={{ width: "280px", height: "38px" }}>
                <span className="input-group-text bg-white" style={{ borderRight: 0 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2.5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round"/></svg></span>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search credit notes..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ borderLeft: 0, height: "38px" }}
                />
              </div>

              <button 
                type="button" 
                className={`btn btn-light${showAdvanced ? " active" : ""}`}
                onClick={() => setShowAdvanced(p => !p)}
                style={{ width: "38px", height: "38px", padding: 0, display: "flex", alignItems: "center", justifySelf: "center", justifyContent: "center" }}
                title="More Filters"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" strokeLinecap="round"/></svg>
              </button>
            </div>
          </div>

          {/* Collapsible Advanced Filters */}
          {showAdvanced && (
            <div style={{ border: "1px solid var(--line)", borderRadius: "8px", padding: "16px 20px", background: "#fafbfc", marginBottom: 15, animation: "fadeIn 0.2s" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 15 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: "11px", fontWeight: "bold", color: "var(--ink)" }}>Customer Name</label>
                  <select 
                    value={customerFilter} 
                    onChange={(e) => setCustomerFilter(e.target.value)}
                    style={{ padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "6px", fontSize: "13px", background: "#fff" }}
                  >
                    <option value="">All Customers</option>
                    {uniqueCustomers.map(cust => (
                      <option key={cust} value={cust}>{cust}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: "11px", fontWeight: "bold", color: "var(--ink)" }}>Amount Range</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input 
                      type="number" 
                      placeholder="Min" 
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "6px", fontSize: "13px" }}
                    />
                    <input 
                      type="number" 
                      placeholder="Max" 
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "6px", fontSize: "13px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: "11px", fontWeight: "bold", color: "var(--ink)" }}>Record Date</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input 
                      type="date" 
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "6px", fontSize: "13px" }}
                    />
                    <input 
                      type="date" 
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "6px", fontSize: "13px" }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifySelf: "center", gap: 10, marginTop: 15 }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={handleClearFilters}
                  style={{ height: "auto", padding: "6px 16px" }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Table Ledger grid */}
          <div className="table-scroll" style={{ overflowX: "auto", marginTop: 10 }}>
            <table className="data" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Voucher Number</th>
                  <th>Credit Note Date</th>
                  <th>Customer Name</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotes.length === 0 ? (
                  <tr className="empty-table-row">
                    <td colSpan={6} style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
                      No Credit notes present.
                    </td>
                  </tr>
                ) : (
                  filteredNotes.map((cn) => (
                    <tr key={cn.id}>
                      <td style={{ fontWeight: 600, color: "var(--ink)" }}>{cn.id}</td>
                      <td>{cn.date}</td>
                      <td>{cn.customer}</td>
                      <td style={{ fontWeight: 600 }}>INR {cn.amount.toFixed(2)}</td>
                      <td>
                        <span 
                          style={{
                            display: "inline-flex",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            textTransform: "uppercase",
                            background: cn.status === "Allocated" ? "#def7ec" : cn.status === "Open" ? "#fde8e8" : "#f3f4f6",
                            color: cn.status === "Allocated" ? "#03543f" : cn.status === "Open" ? "#9b1c1c" : "#374151"
                          }}
                        >
                          {cn.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button 
                          type="button" 
                          className="btn btn-ghost" 
                          onClick={() => toast.info(`Viewing ${cn.id} details`)}
                          style={{ padding: "4px 8px", fontSize: "12px" }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

