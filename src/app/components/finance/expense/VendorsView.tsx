import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ledgerFinanceService, type Vendor } from "../../../../services/ledgerFinanceService";

/* Vendors — list page (Expenses group). Converted from vendor-react-pages/
   VendorList.jsx into the shared .ledger-app theme; loads vendors from the API. */

const statusPill = (status: string): React.CSSProperties => ({
  display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
  ...((status || "").toLowerCase() === "active"
    ? { background: "var(--income-soft)", color: "var(--income)" }
    : { background: "var(--bg)", color: "var(--muted)" }),
});

const isThisMonth = (iso?: string) => (iso || "").startsWith("2026-07");

export function VendorsView({ onNewVendor, canAdd = true }: { onNewVendor: () => void; canAdd?: boolean }) {
  const [search, setSearch] = useState("");
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setAllVendors(await ledgerFinanceService.getVendors());
      } catch {
        toast.error("Failed to load vendors.");
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const active = allVendors.filter((v) => (v.status || "").toLowerCase() === "active").length;
    const newThisMonth = allVendors.filter((v) => isThisMonth(v.createdAt)).length;
    return [
      { label: "Total Vendors", value: allVendors.length },
      { label: "New This Month", value: newThisMonth },
      { label: "Pending Payments", value: 0 },
      { label: "Active Vendors", value: active },
    ];
  }, [allVendors]);

  const vendors = useMemo(() => allVendors.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (v.name || "").toLowerCase().includes(q) || (v.email || "").toLowerCase().includes(q)
      || (v.gstin || "").toLowerCase().includes(q) || (v.city || "").toLowerCase().includes(q);
  }), [allVendors, search]);

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Expenses</p>
          <h1>Vendors</h1>
          <p className="masthead-desc">Manage and track all your vendors</p>
        </div>
        {canAdd && (
          <button type="button" className="btn btn-primary" onClick={onNewVendor} style={{ display: "inline-flex", alignItems: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: -2, marginRight: 5 }}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            Add Vendor
          </button>
        )}
      </div>

      {/* STAT CARDS */}
      <div className="stat-grid">
        {stats.map((s, i) => (
          <div key={s.label} className={`stat-card ${["c-total", "c-pending", "c-collected", "c-settled"][i]}`}>
            <p className="stat-label">{s.label}</p>
            <p className="stat-amt">{s.value}</p>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className="card table-card">
        <div className="card-head">
          <h2>All Vendors</h2>
          <span className="tag">{vendors.length} results</span>
        </div>

        <div className="filter-bar">
          <div className="filter-left">
            <span className="results-count">{vendors.length} results</span>
          </div>
          <div className="filter-right">
            <div className="search-row" style={{ margin: 0, width: 260 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#8b8fc8" strokeWidth="1.7" /><path d="m20 20-3.5-3.5" stroke="#8b8fc8" strokeWidth="1.7" strokeLinecap="round" /></svg>
              <input type="text" placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card-body">
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr>{["Name", "Email", "Phone", "GSTIN", "City", "Status"].map((h) => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {vendors.length === 0 ? (
                  <tr className="empty-table-row">
                    <td colSpan={6}>
                      <div className="glyph"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.2" stroke="#8b8fc8" strokeWidth="1.6" /><path d="M5 20c1.2-4 4.4-6 7-6s5.8 2 7 6" stroke="#8b8fc8" strokeWidth="1.6" strokeLinecap="round" /></svg></div>
                      No vendors present.
                    </td>
                  </tr>
                ) : vendors.map((v) => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600, color: "var(--ink)" }}>{v.name}</td>
                    <td>{v.email || "—"}</td>
                    <td>{v.phone || "—"}</td>
                    <td>{v.gstin || "—"}</td>
                    <td>{v.city || "—"}</td>
                    <td><span style={statusPill(v.status || "")}>{v.status || "—"}</span></td>
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
