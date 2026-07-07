import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { StatCard } from "../ledgerShared";
import { ledgerFinanceService } from "../../../../services/ledgerFinanceService";

export function InvoicesView({ tab, setTab, onNewInvoice, onImportClick, canAdd = true }: { tab: "invoices" | "refunds"; setTab: (t: "invoices" | "refunds") => void; onNewInvoice: (type: "credit" | "cash") => void; onImportClick: () => void; canAdd?: boolean }) {
  const isInvoices = tab === "invoices";
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [invoices, setInvoices] = useState<Array<{ id: string; date: string; customer: string; due: string; amount: number; status: string }>>([]);

  useEffect(() => {
    (async () => {
      try {
        const docs = await ledgerFinanceService.getDocuments("INVOICE");
        setInvoices(docs.map((d) => ({
          id: d.code || `#${d.id}`,
          date: d.docDate || "",
          customer: d.customerName || "—",
          due: d.dueDate || "",
          amount: d.grandTotal ?? 0,
          status: d.status || "Unpaid",
        })));
      } catch {
        toast.error("Failed to load invoices.");
      }
    })();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Income</p>
          <h1>{isInvoices ? "Invoices" : "Refund Vouchers"}</h1>
          <p className="masthead-desc">{isInvoices ? "Manage and track all your invoices" : "Manage and track all your refunds"}</p>
        </div>
        <div className="masthead-actions">
          <div className="tabs">
            <button className={`tab${isInvoices ? " active" : ""}`} onClick={() => setTab("invoices")}>Invoices</button>
            <button className={`tab${!isInvoices ? " active" : ""}`} onClick={() => setTab("refunds")}>Refunds</button>
          </div>
          {canAdd && (
            <div ref={dropdownRef} className="dropdown-container" style={{ position: "relative", display: "inline-flex", borderRadius: "9px", overflow: "hidden" }}>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => onNewInvoice("credit")}
              style={{ display: "flex", alignItems: "center", gap: 5, borderTopRightRadius: 0, borderBottomRightRadius: 0, paddingRight: 12 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: -2 }}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              New Invoice
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => setIsDropdownOpen(prev => !prev)}
              style={{ 
                borderTopLeftRadius: 0, 
                borderBottomLeftRadius: 0, 
                paddingLeft: 8, 
                paddingRight: 8, 
                borderLeft: "1px solid rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: isDropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><path d="m6 9 6 6 6-6"/></svg>
            </button>
            {isDropdownOpen && (
              <div 
                className="dropdown-menu" 
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  marginTop: 6,
                  background: "#ffffff",
                  border: "1px solid var(--line)",
                  borderRadius: "10px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                  zIndex: 100,
                  minWidth: 180,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onNewInvoice("credit");
                  }}
                  style={{
                    padding: "10px 14px",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    fontSize: "13px",
                    color: "var(--ink)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontWeight: 500,
                    width: "100%",
                    transition: "background 0.15s"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  New Invoice (credit)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onNewInvoice("cash");
                  }}
                  style={{
                    padding: "10px 14px",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    fontSize: "13px",
                    color: "var(--ink)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontWeight: 500,
                    width: "100%",
                    borderTop: "1px dashed var(--line)",
                    transition: "background 0.15s"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  New Cash Invoice
                </button>
              </div>
            )}
            </div>
          )}
          {canAdd && (
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={onImportClick}
              style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: -1 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              Import
            </button>
          )}
        </div>
      </div>

      <div className="stat-grid">
        {isInvoices ? (
          <>
            <StatCard cls="c-total" label="Total Invoices" amt sub="0 invoices" />
            <StatCard cls="c-pending" label="Pending" amt sub="0 unpaid" />
            <StatCard cls="c-collected" label="Collected" amt sub="0 paid" />
            <StatCard cls="c-settled" label="Settled" amt sub="0 adjusted" />
          </>
        ) : (
          <>
            <StatCard cls="c-total" label="Total Refunds" amt sub="0 refunds" />
            <StatCard cls="c-settled" label="Average Refund" amt sub="Per refund" />
            <StatCard cls="c-collected" label="Paid" amt sub="0 completed" />
            <StatCard cls="c-pending" label="This Month" amt sub="0 refunds" />
          </>
        )}
      </div>

      <div className="card table-card">
        <div className="card-head"><h2>{isInvoices ? "All Invoices" : "Refund Vouchers"}</h2><span className="tag">{isInvoices ? invoices.length : 0} results</span></div>
        <div className="search-row">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#8b8fc8" strokeWidth="1.7" /><path d="m20 20-3.5-3.5" stroke="#8b8fc8" strokeWidth="1.7" strokeLinecap="round" /></svg>
          <input type="text" placeholder={isInvoices ? "Search invoice no. or customer..." : "Search refunds..."} />
        </div>
        <div className="card-body">
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr>
                  {(isInvoices
                    ? ["Invoice Number", "Record Date", "Customer Name", "Due Date", "Amount", "Status", "Actions"]
                    : ["Refund Number", "Date", "Customer Name", "Amount", "Status", "Created By", "Actions"]
                  ).map((h) => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {isInvoices && invoices.length > 0 ? (
                  invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 600, color: "var(--ink)" }}>{inv.id}</td>
                      <td>{inv.date}</td>
                      <td>{inv.customer}</td>
                      <td>{inv.due}</td>
                      <td className="amount">₹{inv.amount.toFixed(2)}</td>
                      <td>{inv.status}</td>
                      <td></td>
                    </tr>
                  ))
                ) : (
                  <tr className="empty-table-row">
                    <td colSpan={7}>
                      <div className="glyph"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7 3h10a1 1 0 0 1 1 1v16l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1Z" stroke="#8b8fc8" strokeWidth="1.6" strokeLinejoin="round" /></svg></div>
                      {isInvoices ? "No invoices present." : "No Refund vouchers present."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

