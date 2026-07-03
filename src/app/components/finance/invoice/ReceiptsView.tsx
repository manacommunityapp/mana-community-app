import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { StatCard } from "./ledgerShared";
import { ledgerFinanceService, type FinanceReceipt } from "../../../../services/ledgerFinanceService";

export function ReceiptsView({ onNewReceipt, canAdd = true }: { onNewReceipt: () => void; canAdd?: boolean }) {
  const [receiptsTab, setReceiptsTab] = useState<"invoice" | "advance" | "other">("invoice");
  const [invoiceReceipts, setInvoiceReceipts] = useState<FinanceReceipt[]>([]);
  const [advanceReceipts, setAdvanceReceipts] = useState<FinanceReceipt[]>([]);
  const [otherReceipts, setOtherReceipts] = useState<FinanceReceipt[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [inv, adv, oth] = await Promise.all([
          ledgerFinanceService.getReceipts("INVOICE"),
          ledgerFinanceService.getReceipts("ADVANCE"),
          ledgerFinanceService.getReceipts("OTHER"),
        ]);
        setInvoiceReceipts(inv);
        setAdvanceReceipts(adv);
        setOtherReceipts(oth);
      } catch {
        toast.error("Failed to load receipts.");
      }
    })();
  }, []);
  const [statusFilter, setStatusFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("All Time");
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const periodDropdownRef = useRef<HTMLDivElement>(null);

  const [otherPeriodFilter, setOtherPeriodFilter] = useState("All Time");
  const [isOtherPeriodOpen, setIsOtherPeriodOpen] = useState(false);
  const [otherSearchText, setOtherSearchText] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");

  const otherPeriodRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(event.target as Node)) {
        setIsPeriodDropdownOpen(false);
      }
      if (otherPeriodRef.current && !otherPeriodRef.current.contains(event.target as Node)) {
        setIsOtherPeriodOpen(false);
      }
    }
    if (isPeriodDropdownOpen || isOtherPeriodOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPeriodDropdownOpen, isOtherPeriodOpen]);

  return (
    <section className="view">
      <div className="masthead" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <p className="masthead-eyebrow">Income</p>
          <h1>Receipts</h1>
          <p className="masthead-desc">Manage and track all your receipts</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div className="tabs" style={{ margin: 0 }}>
            <button 
              type="button"
              className={`tab${receiptsTab === "invoice" ? " active" : ""}`} 
              onClick={() => setReceiptsTab("invoice")}
            >
              Invoice Receipts
            </button>
            <button 
              type="button"
              className={`tab${receiptsTab === "advance" ? " active" : ""}`} 
              onClick={() => setReceiptsTab("advance")}
            >
              Advance Receipts
            </button>
            <button 
              type="button"
              className={`tab${receiptsTab === "other" ? " active" : ""}`} 
              onClick={() => setReceiptsTab("other")}
            >
              Other Income
            </button>
          </div>

          {canAdd && (
            <button 
              type="button"
              className="btn btn-primary"
              onClick={onNewReceipt}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--income)", borderColor: "var(--income)", color: "#fff", fontWeight: 600, padding: "8px 16px" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              New Receipt
            </button>
          )}
        </div>
      </div>

      {receiptsTab === "invoice" && (
        <>
          <div className="stat-grid cols-3">
            <StatCard cls="c-total" label="Total Receipts" amt sub="0 receipts" />
            <StatCard cls="c-collected" label="Money Received" amt sub="Across 0 receipts" />
            <StatCard cls="c-settled" label="Customers" value="0" sub="Open customer summary" />
          </div>
          <div className="card table-card">
            <div className="card-head"><h2>Invoice Receipts</h2><span className="tag">0 results</span></div>
            <div className="search-row">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#5C6B60" strokeWidth="1.7" /><path d="m20 20-3.5-3.5" stroke="#5C6B60" strokeWidth="1.7" strokeLinecap="round" /></svg>
              <input type="text" placeholder="Search receipt no..." />
            </div>
            <div className="card-body">
              <div className="table-scroll">
                <table className="data">
                  <thead><tr>{["Receipt Number", "Receipt Date", "Received From", "Amount", "Payment Mode", "Project", "Actions"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {invoiceReceipts.length === 0 ? (
                      <tr className="empty-table-row"><td colSpan={7}>No Receipt vouchers present.</td></tr>
                    ) : invoiceReceipts.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600, color: "var(--ink)" }}>{r.code || `#${r.id}`}</td>
                        <td>{r.receiptDate}</td>
                        <td>{r.customerName || "—"}</td>
                        <td className="amount">₹{(r.amount ?? 0).toFixed(2)}</td>
                        <td>{r.paymentMode}</td>
                        <td>{r.reference || "—"}</td>
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

      {receiptsTab === "advance" && (
        <>
          <div className="stat-grid cols-3">
            <StatCard cls="c-total" label="Total Advances" value="INR 0" sub="0 entries" />
            <StatCard cls="c-pending" label="Unallocated" value="0" sub="Awaiting invoice allocation" />
            <StatCard cls="c-settled" label="Average Amount" value="INR 0" sub="Per receipt" />
          </div>
          <div className="card table-card">
            <div className="search-row" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginTop: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, flex: 1, minWidth: 200 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#5C6B60" strokeWidth="1.7" /><path d="m20 20-3.5-3.5" stroke="#5C6B60" strokeWidth="1.7" strokeLinecap="round" /></svg>
                <input type="text" placeholder="Search advance no..." style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "13.5px" }} />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    width: 150,
                    height: 34,
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    color: "#344050",
                    background: "#ffffff",
                    border: "1px solid var(--line)",
                    borderRadius: "6px",
                    padding: "0 8px",
                    outline: "none"
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="0">Unallocated</option>
                  <option value="1">Partially Allocated</option>
                  <option value="2">Allocated</option>
                </select>

                <div ref={periodDropdownRef} style={{ position: "relative" }}>
                  <button 
                    type="button"
                    onClick={() => setIsPeriodDropdownOpen(prev => !prev)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "0 12px",
                      fontWeight: 600,
                      background: "#ffffff",
                      border: "1px solid #d8e2ef",
                      borderRadius: "6px",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      width: 160,
                      height: 34,
                      fontSize: "12.5px",
                      textAlign: "left",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      color: "#344050"
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 448 512" fill="var(--income)" style={{ flexShrink: 0 }}><path d="M128 0c17.7 0 32 14.3 32 32V64H288V32c0-17.7 14.3-32 32-32s32 14.3 32 32V64h48c26.5 0 48 21.5 48 48v48H0V112C0 85.5 21.5 64 48 64H96V32c0-17.7 14.3-32 32-32zM0 192H448V464c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V192zm64 80v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V272c0-8.8-7.2-16-16-16H80c-8.8 0-16 7.2-16 16zm128 0v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V272c0-8.8-7.2-16-16-16H208c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V272c0-8.8-7.2-16-16-16H336zM64 400v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V400c0-8.8-7.2-16-16-16H80c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V400c0-8.8-7.2-16-16-16H208zm112 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V400c0-8.8-7.2-16-16-16H336c-8.8 0-16 7.2-16 16z"/></svg>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{periodFilter}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--muted-2)" strokeWidth="2.5" style={{ flexShrink: 0 }}><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  {isPeriodDropdownOpen && (
                    <ul 
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "100%",
                        marginTop: 6,
                        background: "#ffffff",
                        border: "1px solid rgb(226, 232, 240)",
                        borderRadius: "10px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                        zIndex: 100,
                        minWidth: 200,
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        padding: "8px",
                        margin: 0,
                        listStyle: "none"
                      }}
                    >
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            setPeriodFilter("All Time");
                            setIsPeriodDropdownOpen(false);
                          }}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            width: "100%",
                            padding: "8px 12px",
                            background: periodFilter === "All Time" ? "var(--bg)" : "none",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12.5px",
                            textAlign: "left",
                            cursor: "pointer",
                            fontWeight: 500,
                            color: "var(--ink)"
                          }}
                        >
                          <span>All Time</span>
                          {periodFilter === "All Time" && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--income)" strokeWidth="3"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          )}
                        </button>
                      </li>
                      <li>
                        <h6 style={{ margin: "10px 0 4px 12px", fontSize: "10px", textTransform: "uppercase", fontWeight: "bold", color: "var(--muted-2)", letterSpacing: "0.6px" }}>
                          Quick Range
                        </h6>
                      </li>
                      {["Today", "This Week", "This Month", "This Quarter"].map((range) => (
                        <li key={range}>
                          <button
                            type="button"
                            onClick={() => {
                              setPeriodFilter(range);
                              setIsPeriodDropdownOpen(false);
                            }}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              width: "100%",
                              padding: "8px 12px",
                              background: periodFilter === range ? "var(--bg)" : "none",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "12.5px",
                              textAlign: "left",
                              cursor: "pointer",
                              fontWeight: 500,
                              color: "var(--ink)"
                            }}
                          >
                            <span>{range}</span>
                            {periodFilter === range && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--income)" strokeWidth="3"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <span style={{ fontSize: "13px", color: "var(--muted)", whiteSpace: "nowrap" }}>0 results</span>
              </div>
            </div>

            <div className="card-body">
              <div className="table-scroll">
                <table className="data">
                  <thead><tr>{["Voucher Number", "Customer Name", "Receive Date", "Balance", "Status", "Actions"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {advanceReceipts.length === 0 ? (
                      <tr className="empty-table-row"><td colSpan={6}>No advance receipts present.</td></tr>
                    ) : advanceReceipts.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600, color: "var(--ink)" }}>{r.code || `#${r.id}`}</td>
                        <td>{r.customerName || "—"}</td>
                        <td>{r.receiptDate}</td>
                        <td className="amount">₹{(r.amount ?? 0).toFixed(2)}</td>
                        <td>Unallocated</td>
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

      {receiptsTab === "other" && (
        <>
          <div className="stat-grid cols-3" style={{ marginBottom: 20 }}>
            <div 
              className="stat-card" 
              style={{
                border: "1px solid var(--line)", 
                borderTop: "3px solid #7baaf7", 
                background: "linear-gradient(135deg, #ffffff 0%, #eef4ff 100%)",
                borderRadius: "14px",
                padding: "16px 20px"
              }}
            >
              <div className="stat-label" style={{ fontSize: "0.7rem", letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--muted-2)" }}>
                Total Entries
              </div>
              <div className="stat-amt" style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--ink)", marginTop: 4 }}>
                0
              </div>
              <p className="stat-sub" style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--muted)" }}>
                Number of income entries
              </p>
            </div>

            <div 
              className="stat-card" 
              style={{
                border: "1px solid var(--line)", 
                borderTop: "3px solid #4ade80", 
                background: "linear-gradient(135deg, #ffffff 0%, #f0fff4 100%)",
                borderRadius: "14px",
                padding: "16px 20px"
              }}
            >
              <div className="stat-label" style={{ fontSize: "0.7rem", letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--muted-2)" }}>
                Total Amount
              </div>
              <div className="stat-amt" style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1e7a52", marginTop: 4 }}>
                INR 0
              </div>
              <p className="stat-sub" style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--muted)" }}>
                Total income earned
              </p>
            </div>

            <div 
              className="stat-card" 
              style={{
                border: "1px solid var(--line)", 
                borderTop: "3px solid #94a3b8", 
                background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                borderRadius: "14px",
                padding: "16px 20px"
              }}
            >
              <div className="stat-label" style={{ fontSize: "0.7rem", letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--muted-2)" }}>
                Average Amount
              </div>
              <div className="stat-amt" style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#475569", marginTop: 4 }}>
                INR 0
              </div>
              <p className="stat-sub" style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--muted)" }}>
                Per entry
              </p>
            </div>
          </div>

          <div className="card table-card">
            <div 
              className="search-row" 
              style={{ 
                display: "flex", 
                flexWrap: "wrap", 
                alignItems: "center", 
                justifyContent: "space-between", 
                gap: 12, 
                marginTop: 18, 
                marginBottom: 16 
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div ref={otherPeriodRef} style={{ position: "relative" }}>
                  <button 
                    type="button"
                    onClick={() => setIsOtherPeriodOpen(prev => !prev)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "0 12px",
                      fontWeight: 600,
                      background: "#ffffff",
                      border: "1px solid #d8e2ef",
                      borderRadius: "6px",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      width: 180,
                      height: 34,
                      fontSize: "12.5px",
                      textAlign: "left",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      color: "#344050"
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 448 512" fill="var(--income)" style={{ flexShrink: 0 }}><path d="M128 0c17.7 0 32 14.3 32 32V64H288V32c0-17.7 14.3-32 32-32s32 14.3 32 32V64h48c26.5 0 48 21.5 48 48v48H0V112C0 85.5 21.5 64 48 64H96V32c0-17.7 14.3-32 32-32zM0 192H448V464c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V192zm64 80v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V272c0-8.8-7.2-16-16-16H80c-8.8 0-16 7.2-16 16zm128 0v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V272c0-8.8-7.2-16-16-16H208c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V272c0-8.8-7.2-16-16-16H336zM64 400v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V400c0-8.8-7.2-16-16-16H80c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V400c0-8.8-7.2-16-16-16H208zm112 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V400c0-8.8-7.2-16-16-16H336c-8.8 0-16 7.2-16 16z"/></svg>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{otherPeriodFilter}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--muted-2)" strokeWidth="2.5" style={{ flexShrink: 0 }}><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  {isOtherPeriodOpen && (
                    <ul 
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "100%",
                        marginTop: 6,
                        background: "#ffffff",
                        border: "1px solid rgb(226, 232, 240)",
                        borderRadius: "10px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                        zIndex: 100,
                        minWidth: 200,
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        padding: "8px",
                        margin: 0,
                        listStyle: "none"
                      }}
                    >
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            setOtherPeriodFilter("All Time");
                            setIsOtherPeriodOpen(false);
                          }}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            width: "100%",
                            padding: "8px 12px",
                            background: otherPeriodFilter === "All Time" ? "var(--bg)" : "none",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12.5px",
                            textAlign: "left",
                            cursor: "pointer",
                            fontWeight: 500,
                            color: "var(--ink)"
                          }}
                        >
                          <span>All Time</span>
                          {otherPeriodFilter === "All Time" && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--income)" strokeWidth="3"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          )}
                        </button>
                      </li>
                      <li>
                        <h6 style={{ margin: "10px 0 4px 12px", fontSize: "10px", textTransform: "uppercase", fontWeight: "bold", color: "var(--muted-2)", letterSpacing: "0.6px" }}>
                          Quick Range
                        </h6>
                      </li>
                      {["Today", "This Week", "This Month", "This Quarter"].map((range) => (
                        <li key={range}>
                          <button
                            type="button"
                            onClick={() => {
                              setOtherPeriodFilter(range);
                              setIsOtherPeriodOpen(false);
                            }}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              width: "100%",
                              padding: "8px 12px",
                              background: otherPeriodFilter === range ? "var(--bg)" : "none",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "12.5px",
                              textAlign: "left",
                              cursor: "pointer",
                              fontWeight: 500,
                              color: "var(--ink)"
                            }}
                          >
                            <span>{range}</span>
                            {otherPeriodFilter === range && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--income)" strokeWidth="3"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <span style={{ fontSize: "13px", color: "var(--muted)", whiteSpace: "nowrap" }}>0 results</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div 
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#ffffff",
                    border: "1px solid var(--line)",
                    borderRadius: "6px",
                    padding: "4px 10px",
                    height: 34,
                    width: 200
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted-2)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" /></svg>
                  <input 
                    type="text" 
                    placeholder="Search voucher no..." 
                    value={otherSearchText}
                    onChange={(e) => setOtherSearchText(e.target.value)}
                    style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "12.5px", color: "var(--ink)" }}
                  />
                </div>
                
                <button 
                  type="button"
                  onClick={() => setShowAdvancedFilters(prev => !prev)}
                  title="More Filters"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 34,
                    width: 34,
                    background: showAdvancedFilters ? "var(--bg)" : "#ffffff",
                    border: "1px solid var(--line)",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 12h6"/></svg>
                </button>
              </div>
            </div>

            {showAdvancedFilters && (
              <div style={{ padding: "0 22px 18px 22px", marginTop: -6 }}>
                <div style={{ border: "1px solid var(--line)", borderRadius: "10px", padding: 18, background: "#fafbfc" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <label style={{ fontSize: "11px", fontWeight: "bold", color: "var(--ink)", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase" }}>Customer Name</label>
                      <select 
                        value={selectedCustomer}
                        onChange={(e) => setSelectedCustomer(e.target.value)}
                        style={{
                          height: 34,
                          fontSize: "13px",
                          border: "1px solid var(--line)",
                          borderRadius: "6px",
                          padding: "0 8px",
                          background: "#fff",
                          outline: "none",
                          color: "var(--ink)"
                        }}
                      >
                        <option value="">All Customers</option>
                        <option value="discount">Discount on Purchase Account</option>
                        <option value="sales">Sales Account - default income</option>
                      </select>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <label style={{ fontSize: "11px", fontWeight: "bold", color: "var(--ink)", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase" }}>Amount</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input 
                          type="number" 
                          placeholder="Min" 
                          value={minAmount}
                          onChange={(e) => setMinAmount(e.target.value)}
                          style={{
                            height: 34,
                            width: "100%",
                            fontSize: "13px",
                            border: "1px solid var(--line)",
                            borderRadius: "6px",
                            padding: "0 8px",
                            outline: "none",
                            background: "#fff"
                          }}
                        />
                        <input 
                          type="number" 
                          placeholder="Max" 
                          value={maxAmount}
                          onChange={(e) => setMaxAmount(e.target.value)}
                          style={{
                            height: 34,
                            width: "100%",
                            fontSize: "13px",
                            border: "1px solid var(--line)",
                            borderRadius: "6px",
                            padding: "0 8px",
                            outline: "none",
                            background: "#fff"
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <label style={{ fontSize: "11px", fontWeight: "bold", color: "var(--ink)", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase" }}>Record Date</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input 
                          type="date" 
                          placeholder="From"
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                          style={{
                            height: 34,
                            width: "100%",
                            fontSize: "13px",
                            border: "1px solid var(--line)",
                            borderRadius: "6px",
                            padding: "0 8px",
                            outline: "none",
                            background: "#fff"
                          }}
                        />
                        <input 
                          type="date" 
                          placeholder="To"
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                          style={{
                            height: 34,
                            width: "100%",
                            fontSize: "13px",
                            border: "1px solid var(--line)",
                            borderRadius: "6px",
                            padding: "0 8px",
                            outline: "none",
                            background: "#fff"
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 18 }}>
                    <button 
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: "8px 18px", height: "auto", fontSize: "13px" }}
                    >
                      Search
                    </button>
                    <button 
                      type="button"
                      className="btn btn-outline"
                      onClick={() => {
                        setSelectedCustomer("");
                        setMinAmount("");
                        setMaxAmount("");
                        setFromDate("");
                        setToDate("");
                        setOtherSearchText("");
                      }}
                      style={{ padding: "8px 18px", height: "auto", fontSize: "13px" }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="card-body" style={{ padding: "0 0 8px 0" }}>
              <div className="table-scroll" style={{ padding: 0 }}>
                <table className="data" style={{ minWidth: "100%" }}>
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: 22 }}>Income Voucher Number</th>
                      <th>Record Date</th>
                      <th>Vendor Name</th>
                      <th>Balance</th>
                      <th>Payment Mode</th>
                      <th style={{ paddingRight: 22, textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otherReceipts.length === 0 ? (
                      <tr className="empty-table-row">
                        <td colSpan={6} style={{ textAlign: "center", padding: "40px 0" }}>No Income vouchers present.</td>
                      </tr>
                    ) : otherReceipts.map((r) => (
                      <tr key={r.id}>
                        <td style={{ paddingLeft: 22, fontWeight: 600, color: "var(--ink)" }}>{r.code || `#${r.id}`}</td>
                        <td>{r.receiptDate}</td>
                        <td>{r.customerName || "—"}</td>
                        <td className="amount">₹{(r.amount ?? 0).toFixed(2)}</td>
                        <td>{r.paymentMode}</td>
                        <td style={{ paddingRight: 22 }}></td>
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

