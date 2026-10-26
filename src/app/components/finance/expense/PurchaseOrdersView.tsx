import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ledgerFinanceService, type FinanceDocument } from "../../../../services/finance/ledgerFinanceService";
import { stockService } from "../../../../services/inventory/stockService";

interface OrderRow {
  doc: FinanceDocument;
  id: string;
  date: string;
  vendor: string;
  amount: number;
  due: string;
  createdBy: string;
  status: string;
}

/* Purchase Orders — list page (Expenses group). Converted from
   purchase_orders.html into the shared .ledger-app theme; loads
   PURCHASE_ORDER documents. */
export function PurchaseOrdersView({ onNewPurchaseOrder, canAdd = true }: { onNewPurchaseOrder: () => void; canAdd?: boolean }) {
  const [statusFilter, setStatusFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [advOpen, setAdvOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);


  const [allOrders, setAllOrders] = useState<OrderRow[]>([]);

  const loadOrders = async () => {
    try {
      const docs = await ledgerFinanceService.getDocuments("PURCHASE_ORDER");
      setAllOrders(docs.map((d) => ({
        doc: d,
        id: d.code || `#${d.id}`,
        date: d.docDate || "",
        vendor: d.customerName || "—",
        amount: d.grandTotal ?? 0,
        due: d.dueDate || "",
        createdBy: "—",
        status: d.status || "Open",
      })));
    } catch {
      toast.error("Failed to load purchase orders.");
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleVerifyMatch = (_order: OrderRow) => {
    toast.info("Three-way matching is unavailable for ledger purchase orders until they are linked to vendor procurement invoices and receipts.");
  };

  const handleReceiveGoods = async (row: OrderRow) => {
    if (processingId) return;
    setProcessingId(row.id);
    try {
      // 1. Fetch picking types, locations, and products
      const [stats, locations, prods] = await Promise.all([
        stockService.getPickingTypeStats(),
        stockService.getLocations(),
        stockService.getProducts(),
      ]);

      const incomingType = stats.find(s => s.code === "INCOMING") || stats[0];
      const vendorLoc = locations.find(l => l.usage === "VENDOR") || locations[0];
      const internalLoc = locations.find(l => l.usage === "INTERNAL" && l.completeName.includes("Stock")) || locations.find(l => l.usage === "INTERNAL") || locations[0];

      if (!incomingType || !vendorLoc || !internalLoc) {
        toast.error("Warehouse locations or picking types not configured.");
        return;
      }

      // Map PO items to picking move lines without hardcoded fallback
      const moveLines: Array<{ productId: number; productQty: number }> = [];
      const missingItems: string[] = [];

      for (const item of (row.doc.items || [])) {
        const foundProd = prods.find(p => p.name.toLowerCase() === (item.item || "").toLowerCase());
        if (foundProd && foundProd.id) {
          moveLines.push({
            productId: foundProd.id,
            productQty: item.qty || 1,
          });
        } else {
          missingItems.push(item.item || "Unknown item");
        }
      }

      if (missingItems.length > 0) {
        if (prods.length === 0) {
          toast.error("No inventory products exist in warehouse catalog. Please create products first.");
          return;
        }
        toast.error(`Products not found in warehouse master: ${missingItems.join(", ")}. Please register products first.`);
        return;
      }

      if (moveLines.length === 0) {
        toast.error("Purchase order contains no line items to receive.");
        return;
      }

      // 2. Create incoming warehouse picking
      await stockService.createPicking({
        pickingTypeId: incomingType.id,
        locationId: vendorLoc.id,
        locationDestId: internalLoc.id,
        origin: `PO: ${row.id}`,
        scheduledDate: new Date().toISOString(),
        moveLines,
      });

      // The stock picking is the persisted warehouse receipt for this finance PO.
      // This ledger screen does not yet share IDs with VMS goods receipts.

      // 4. Update PO status in finance to "Purchased"
      if (row.doc.id) {
        await ledgerFinanceService.updateDocument(row.doc.id, {
          ...row.doc,
          status: "Purchased",
        });
      }

      toast.success(`Warehouse receipt created for ${row.id}; finance status updated to Purchased.`);
      loadOrders();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create incoming goods receipt.");
    } finally {
      setProcessingId(null);
    }
  };

  const metrics = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    let total = 0, open = 0, purchased = 0, month = 0;
    let openCount = 0, purchasedCount = 0, monthCount = 0;
    for (const o of allOrders) {
      total += o.amount;
      if (o.status.toLowerCase() === "open") { open += o.amount; openCount++; }
      if (o.status.toLowerCase() === "purchased") { purchased += o.amount; purchasedCount++; }
      if (o.date.startsWith(currentMonth)) { month += o.amount; monthCount++; }
    }
    return { total, open, purchased, month, openCount, purchasedCount, monthCount };
  }, [allOrders]);

  const orders = useMemo(() => allOrders.filter((o) => {
    if (statusFilter && o.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (search && !o.id.toLowerCase().includes(search.toLowerCase()) && !o.vendor.toLowerCase().includes(search.toLowerCase())) return false;
    if (periodFilter === "month" && !o.date.startsWith(new Date().toISOString().slice(0, 7))) return false;
    return true;
  }), [allOrders, statusFilter, search, periodFilter]);

  const onCardClick = (filter: "all" | "open" | "purchased" | "month") => {
    setStatusFilter(filter === "open" || filter === "purchased" ? filter : "");
    if (filter === "month") setPeriodFilter("month");
  };

  return (
    <section className="view">
      <div className="masthead">
        <div>
          <p className="masthead-eyebrow">Expenses</p>
          <h1>Purchase Orders</h1>
          <p className="masthead-desc">Manage and track all your purchase orders</p>
        </div>
        {canAdd && (
          <button type="button" className="btn btn-primary" onClick={onNewPurchaseOrder} style={{ display: "inline-flex", alignItems: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: -2, marginRight: 5 }}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            New Purchase Order
          </button>
        )}
      </div>

      {/* STAT CARDS */}
      <div className="stat-grid">
        <div className="stat-card c-total clickable" onClick={() => onCardClick("all")}>
          <p className="stat-label">Total POs</p>
          <p className="stat-amt"><span className="cur">INR</span>{metrics.total.toFixed(2)}</p>
          <p className="stat-sub">{allOrders.length} orders</p>
        </div>
        <div className="stat-card c-pending clickable" onClick={() => onCardClick("open")}>
          <p className="stat-label">Open</p>
          <p className="stat-amt"><span className="cur">INR</span>{metrics.open.toFixed(2)}</p>
          <p className="stat-sub">{metrics.openCount} pending</p>
        </div>
        <div className="stat-card c-collected clickable" onClick={() => onCardClick("purchased")}>
          <p className="stat-label">Purchased</p>
          <p className="stat-amt"><span className="cur">INR</span>{metrics.purchased.toFixed(2)}</p>
          <p className="stat-sub">{metrics.purchasedCount} completed</p>
        </div>
        <div className="stat-card c-settled clickable" onClick={() => onCardClick("month")}>
          <p className="stat-label">This Month</p>
          <p className="stat-amt"><span className="cur">INR</span>{metrics.month.toFixed(2)}</p>
          <p className="stat-sub">{metrics.monthCount} orders</p>
        </div>
      </div>

      {/* TABLE */}
      <div className="card table-card">
        <div className="card-head">
          <h2>All Purchase Orders</h2>
          <span className="tag">{orders.length} results</span>
        </div>

        <div className="filter-bar">
          <div className="filter-left">
            <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All POs</option>
              <option value="open">Open</option>
              <option value="purchased">Purchased</option>
            </select>
            <select className="filter-select" value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)}>
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="fy">Financial Year 2026–27 (Current)</option>
            </select>
            <span className="results-count">{orders.length} results</span>
          </div>
          <div className="filter-right">
            <div className="search-row" style={{ margin: 0, width: 260 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#8b8fc8" strokeWidth="1.7" /><path d="m20 20-3.5-3.5" stroke="#8b8fc8" strokeWidth="1.7" strokeLinecap="round" /></svg>
              <input type="text" placeholder="Search POs..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
                <tr>{["PO Number", "Record Date", "Vendor Name", "Amount", "Due Date", "Created By", "Status", "Actions"].map((h) => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr className="empty-table-row">
                    <td colSpan={8}>
                      <div className="glyph"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7 3h10a1 1 0 0 1 1 1v16l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1Z" stroke="#8b8fc8" strokeWidth="1.6" strokeLinejoin="round" /></svg></div>
                      No Purchase orders present.
                    </td>
                  </tr>
                ) : orders.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 600, color: "var(--ink)" }}>{o.id}</td>
                    <td>{o.date}</td>
                    <td>{o.vendor}</td>
                    <td className="amount">₹{o.amount.toFixed(2)}</td>
                    <td>{o.due}</td>
                    <td>{o.createdBy}</td>
                    <td>
                      <span className={`tag ${o.status.toLowerCase() === "purchased" ? "tag-green" : "tag-yellow"}`}>
                        {o.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        {o.status.toLowerCase() === "open" && (
                          <button
                            type="button"
                            onClick={() => handleReceiveGoods(o)}
                            disabled={processingId === o.id}
                            className="btn btn-sm btn-primary"
                            style={{ fontSize: 11, padding: "3px 8px" }}
                          >
                            {processingId === o.id ? "Receiving..." : "Receive Goods"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleVerifyMatch(o)}
                          className="btn btn-sm btn-ghost"
                          style={{ fontSize: 11, padding: "3px 8px", color: "#64748b", border: "1px solid currentColor", borderRadius: "6px" }}
                          title="Three-way matching is not wired to this finance ledger record yet"
                        >
                          Match unavailable
                        </button>
                      </div>
                    </td>
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
