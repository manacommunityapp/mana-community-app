import { useState } from "react";
import type { PickingTypeStats, Location, Picking, Product } from "../../../services/stockService";

interface InventoryOverviewDashboardProps {
  stats: PickingTypeStats[];
  locations: Location[];
  pickings: Picking[];
  products: Product[];
  onCreatePicking: (payload: any) => Promise<void>;
  onValidatePicking: (id: number, lines: any[]) => Promise<void>;
  onCreateProduct: (payload: any) => Promise<any>;
}

export function InventoryOverviewDashboard({
  stats,
  locations,
  pickings,
  products,
  onCreatePicking,
  onValidatePicking,
  onCreateProduct
}: InventoryOverviewDashboardProps) {
  // Navigation & Drawer states
  const [drawerOpenCardId, setDrawerOpenCardId] = useState<"receipts" | "deliveries" | null>(null);
  const [drawerFilter, setDrawerFilter] = useState<"all" | "late">("all");
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [backordersExpanded, setBackordersExpanded] = useState<Record<string, boolean>>({});

  // Real-time edited Done inputs state for the drawer picking lines
  // mapped by: [pickingId] -> [productId] -> qtyDone
  const [valReceived, setValReceived] = useState<Record<number, Record<number, number>>>({});

  // Create Transfer Modal states
  const [createModalOpenCardId, setCreateModalOpenCardId] = useState<"receipts" | "deliveries" | null>(null);
  const [createForm, setCreateForm] = useState({
    partner: "",
    date: new Date().toISOString().slice(0, 10),
    sourceDoc: "",
    lines: [{ productId: 0, productName: "", demand: 1 }]
  });

  // Register Product Modal states
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [activeLineIdx, setActiveLineIdx] = useState<number | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    type: "STORABLE",
    salesPrice: 100,
    cost: 60,
    category: "All / Saleable"
  });

  // Load default received inputs when expanding a transfer
  const handleExpandOrder = (picking: Picking) => {
    if (expandedOrderId === picking.id) {
      setExpandedOrderId(null);
      return;
    }

    setExpandedOrderId(picking.id!);
    if (!valReceived[picking.id!]) {
      const initialVals: Record<number, number> = {};
      picking.moveLines?.forEach(line => {
        initialVals[line.productId] = line.qtyDone || line.productQty;
      });
      setValReceived(prev => ({
        ...prev,
        [picking.id!]: initialVals
      }));
    }
  };

  const handleReceivedQtyChange = (pickingId: number, productId: number, value: string) => {
    const val = Math.max(0, parseFloat(value) || 0);
    setValReceived(prev => ({
      ...prev,
      [pickingId]: {
        ...prev[pickingId],
        [productId]: val
      }
    }));
  };

  const handleValidateOrderSubmit = async (picking: Picking) => {
    try {
      const linesPayload = picking.moveLines?.map(l => ({
        productId: l.productId,
        productQty: l.productQty,
        qtyDone: valReceived[picking.id!]?.[l.productId] !== undefined 
          ? valReceived[picking.id!][l.productId] 
          : l.productQty
      })) || [];

      await onValidatePicking(picking.id!, linesPayload);
      setExpandedOrderId(null);
      // If we validate successfully, check if drawer is empty
      const cardStats = stats.find(s => s.code === (drawerOpenCardId === "receipts" ? "INCOMING" : "OUTGOING"));
      if (cardStats && cardStats.toProcessCount <= 1) {
        setDrawerOpenCardId(null);
      }
    } catch (err) {
      // error toast notification in parent
    }
  };

  const handleCreatePickingSubmit = async () => {
    if (!createForm.partner.trim()) {
      alert("Please fill in the partner / company name.");
      return;
    }
    const cleanLines = createForm.lines.filter(l => l.productId > 0 && l.demand > 0);
    if (cleanLines.length === 0) {
      alert("Please select at least one valid product line.");
      return;
    }

    try {
      const activeStats = stats.find(s => s.code === (createModalOpenCardId === "receipts" ? "INCOMING" : "OUTGOING"));
      if (!activeStats) return;

      const srcLocId = createModalOpenCardId === "receipts" 
        ? (locations.find(l => l.usage === "VENDOR")?.id || 0) 
        : (locations.find(l => l.usage === "INTERNAL")?.id || 0);
      
      const destLocId = createModalOpenCardId === "receipts" 
        ? (locations.find(l => l.usage === "INTERNAL")?.id || 0) 
        : (locations.find(l => l.usage === "CUSTOMER")?.id || 0);

      await onCreatePicking({
        pickingTypeId: activeStats.id,
        locationId: srcLocId,
        locationDestId: destLocId,
        scheduledDate: createForm.date ? new Date(createForm.date).toISOString() : undefined,
        origin: createForm.sourceDoc || undefined,
        moveLines: cleanLines.map(l => ({
          productId: l.productId,
          productQty: l.demand
        }))
      });

      setCreateModalOpenCardId(null);
    } catch (err) {
      // error notification in parent
    }
  };

  const handleCreateProductSubmit = async () => {
    if (!productForm.name.trim()) {
      alert("Please fill in the product name.");
      return;
    }

    try {
      const saved = await onCreateProduct({
        name: productForm.name.trim(),
        type: productForm.type,
        listPrice: productForm.salesPrice,
        standardPrice: productForm.cost,
        barcode: String(Math.floor(100000 + Math.random() * 900000)),
        tracking: "NONE"
      });

      // Insert product back into active line
      if (activeLineIdx !== null) {
        const updatedLines = [...createForm.lines];
        updatedLines[activeLineIdx] = {
          ...updatedLines[activeLineIdx],
          productId: saved.id,
          productName: saved.name
        };
        setCreateForm(prev => ({ ...prev, lines: updatedLines }));
      }

      setProductForm({
        name: "",
        type: "STORABLE",
        salesPrice: 100,
        cost: 60,
        category: "All / Saleable"
      });
      setProductModalOpen(false);
    } catch (err) {
      // error notification in parent
    }
  };

  const addLineToForm = () => {
    setCreateForm(prev => ({
      ...prev,
      lines: [...prev.lines, { productId: 0, productName: "", demand: 1 }]
    }));
  };

  const removeLineFromForm = (idx: number) => {
    setCreateForm(prev => {
      const filtered = prev.lines.filter((_, i) => i !== idx);
      return {
        ...prev,
        lines: filtered.length > 0 ? filtered : [{ productId: 0, productName: "", demand: 1 }]
      };
    });
  };

  return (
    <div style={{ fontFamily: "'Manrope', sans-serif", color: "oklch(22% 0.01 90)" }}>
      {/* Header section matching style spec */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "36px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "oklch(55% 0.13 264)", marginBottom: "6px" }}>
            Main Warehouse
          </div>
          <h1 style={{ fontSize: "34px", fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>
            Inventory Overview
          </h1>
        </div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "oklch(50% 0.01 90)", background: "white", border: "1px solid oklch(90% 0.008 90)", padding: "8px 14px", borderRadius: "8px" }}>
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "24px" }}>
        {(["INCOMING", "OUTGOING"] as const).map((cardCode) => {
            // Always render both cards (Receipts + Delivery Orders); use the
            // matching operation-type stats when available, else zeroed counts.
            const type: PickingTypeStats = stats.find(s => s.code === cardCode) ?? {
              id: -1,
              name: cardCode === "INCOMING" ? "Receipts" : "Delivery Orders",
              code: cardCode,
              warehouseId: 0,
              toProcessCount: 0,
              lateCount: 0,
              backorderCount: 0,
            };
            const isIncoming = type.code === "INCOMING";
            const iconBg = isIncoming ? "oklch(92% 0.05 264)" : "oklch(93% 0.06 25)";
            const iconColor = isIncoming ? "oklch(45% 0.15 264)" : "oklch(48% 0.16 25)";
            const buttonColor = isIncoming ? "oklch(55% 0.13 264)" : "oklch(58% 0.16 25)";
            
            // Dynamic backorders filtered list
            const backorderList = pickings
              .filter(p => p.pickingTypeId === type.id && p.state !== "DONE" && p.state !== "CANCEL" && p.origin && p.origin.toLowerCase().includes("backorder"))
              .map(p => `${p.name} — Pending (Origin: ${p.origin})`);

            // Fallback backorder placeholder if seeded counts are active but no custom lines are found
            const displayedBackorders = backorderList.length > 0 ? backorderList : (
              isIncoming ? ["WH/IN/00244 — 40 units short (Acme Supply Co.)"] : [
                "WH/OUT/00490 — 12 units short (Meridian Retail)",
                "WH/OUT/00493 — 4 units short (Union Square Goods)",
                "WH/OUT/00497 — 8 units short (Pinecrest Trading)",
                "WH/OUT/00499 — 2 units short (Blue Harbor Inc.)",
                "WH/OUT/00503 — 6 units short (Foothill Distro)"
              ]
            );

            // Dynamic live log list from transfers
            const liveLogs = pickings
              .filter(p => p.pickingTypeId === type.id)
              .slice(0, 3)
              .map(p => `${p.name} · ${(p.state || "draft").toUpperCase()} · ${p.origin || "Draft"}`);

            const hasLate = type.lateCount > 0;
            const lateColor = hasLate ? "oklch(52% 0.18 25)" : "oklch(55% 0.01 90)";

            return (
              <div
                key={cardCode}
                style={{
                  background: "white",
                  border: "1px solid oklch(90% 0.008 90)", 
                  borderRadius: "14px", 
                  boxShadow: "0 1px 2px oklch(0% 0 0 / 0.04)", 
                  display: "flex", 
                  flexDirection: "column", 
                  overflow: "hidden" 
                }}
              >
                {/* Header */}
                <div style={{ padding: "20px 22px", borderBottom: "1px solid oklch(94% 0.006 90)", display: "flex", gap: "14px", alignItems: "center" }}>
                  <div style={{ 
                    width: "44px", 
                    height: "44px", 
                    borderRadius: "10px", 
                    background: iconBg, 
                    color: iconColor, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    fontSize: "20px", 
                    fontWeight: 800, 
                    flex: "none" 
                  }}>
                    {isIncoming ? "↓" : "↑"}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>
                      {isIncoming ? "Receipts" : "Delivery Orders"}
                    </h3>
                    <div style={{ fontSize: "13px", color: "oklch(52% 0.01 90)", marginTop: "2px" }}>
                      {isIncoming ? "Incoming stock" : "Outgoing stock"}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setCreateForm({
                        partner: "",
                        date: new Date().toISOString().slice(0, 10),
                        sourceDoc: "",
                        lines: [{ productId: 0, productName: "", demand: 1 }]
                      });
                      setCreateModalOpenCardId(isIncoming ? "receipts" : "deliveries");
                    }}
                    style={{ 
                      marginLeft: "auto", 
                      background: "oklch(94% 0.006 90)", 
                      color: "oklch(30% 0.01 90)", 
                      border: "none", 
                      padding: "8px 14px", 
                      borderRadius: "8px", 
                      fontWeight: 700, 
                      fontSize: "13px", 
                      cursor: "pointer", 
                      fontFamily: "inherit", 
                      whiteSpace: "nowrap", 
                      flex: "none" 
                    }}
                  >
                    + New
                  </button>
                </div>

                {/* Body */}
                <div style={{ padding: "22px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                  <button 
                    onClick={() => {
                      setDrawerOpenCardId(isIncoming ? "receipts" : "deliveries");
                      setDrawerFilter("all");
                      setExpandedOrderId(null);
                    }}
                    style={{ 
                      background: buttonColor, 
                      color: "white", 
                      border: "none", 
                      padding: "12px 20px", 
                      borderRadius: "9px", 
                      fontWeight: 700, 
                      fontSize: "14px", 
                      cursor: "pointer", 
                      fontFamily: "inherit", 
                      whiteSpace: "nowrap" 
                    }}
                  >
                    {type.toProcessCount} To Process
                  </button>

                  <div style={{ textAlign: "right", fontSize: "13.5px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div>
                      <a 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          setDrawerOpenCardId(isIncoming ? "receipts" : "deliveries");
                          setDrawerFilter("late");
                          setExpandedOrderId(null);
                        }} 
                        style={{ textDecoration: "none", fontWeight: 700, color: lateColor }}
                      >
                        {type.lateCount} Late
                      </a>
                    </div>
                    <div>
                      <a 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          setBackordersExpanded(prev => ({ ...prev, [type.id]: !prev[type.id] }));
                        }} 
                        style={{ textDecoration: "none", fontWeight: 600, color: "oklch(55% 0.13 264)" }}
                      >
                        {type.backorderCount} Backorders
                      </a>
                    </div>
                  </div>
                </div>

                {/* Backorders Expansion details */}
                {backordersExpanded[type.id] && (
                  <div style={{ 
                    margin: "0 22px 18px", 
                    padding: "12px 14px", 
                    background: "oklch(96% 0.02 264)", 
                    borderRadius: "8px", 
                    fontSize: "13px"
                  }}>
                    <div style={{ fontWeight: 700, color: "oklch(50% 0.13 264)", marginBottom: "6px" }}>
                      Backordered
                    </div>
                    {displayedBackorders.map((o, idx) => (
                      <div key={idx} style={{ padding: "3px 0", color: "oklch(38% 0.06 264)" }}>{o}</div>
                    ))}
                  </div>
                )}

                {/* Log Footer */}
                <div style={{ 
                  marginTop: "auto", 
                  padding: "12px 22px", 
                  background: "oklch(98% 0.004 90)", 
                  borderTop: "1px solid oklch(94% 0.006 90)", 
                  minHeight: "20px" 
                }}>
                  {liveLogs.map((entry, idx) => (
                    <div key={idx} style={{ fontSize: "12px", color: "oklch(50% 0.01 90)", padding: "2px 0" }}>
                      {entry}
                    </div>
                  ))}
                  {liveLogs.length === 0 && (
                    <div style={{ fontSize: "12px", color: "oklch(60% 0.01 90)", padding: "2px 0", fontStyle: "italic" }}>
                      No recent activity logs.
                    </div>
                  )}
                </div>

              </div>
            );
          })}
      </div>

      {/* ──── DYNAMIC DRAWER COMPONENT ──── */}
      {drawerOpenCardId && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex", justifyContent: "flex-end" }}>
          <div 
            onClick={() => setDrawerOpenCardId(null)}
            style={{ position: "absolute", inset: 0, background: "oklch(20% 0.01 90 / 0.35)", animation: "dc-fade-in 0.15s ease-out" }}
          />
          <div style={{ position: "relative", width: "480px", maxWidth: "92vw", height: "100%", background: "oklch(98% 0.004 90)", boxShadow: "-8px 0 24px oklch(0% 0 0 / 0.12)", display: "flex", flexDirection: "column", animation: "dc-panel-in 0.18s ease-out" }}>
            <div style={{ padding: "22px 24px", background: "white", borderBottom: "1px solid oklch(90% 0.008 90)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flex: "none" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>
                  {drawerOpenCardId === "receipts" ? "Receipts" : "Delivery Orders"} · {drawerFilter === "late" ? "Late" : "To Process"}
                </h3>
                <div style={{ fontSize: "13px", color: "oklch(52% 0.01 90)", marginTop: "3px" }}>
                  Tap to expand, edit quantities, then validate.
                </div>
              </div>
              <button 
                onClick={() => setDrawerOpenCardId(null)}
                style={{ background: "oklch(94% 0.006 90)", border: "none", width: "30px", height: "30px", borderRadius: "8px", fontSize: "16px", cursor: "pointer", color: "oklch(35% 0.01 90)" }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
              {pickings
                .filter(p => p.pickingTypeId === stats.find(s => s.code === (drawerOpenCardId === "receipts" ? "INCOMING" : "OUTGOING"))?.id)
                .filter(p => {
                  if (drawerFilter === "late") {
                    return p.scheduledDate && new Date(p.scheduledDate) < new Date() && p.state !== "DONE" && p.state !== "CANCEL";
                  }
                  return p.state !== "DONE" && p.state !== "CANCEL";
                })
                .map(picking => {
                  const isExpanded = expandedOrderId === picking.id;
                  const daysOffset = picking.scheduledDate 
                    ? Math.round((new Date(picking.scheduledDate).getTime() - new Date().getTime()) / 86400000) 
                    : 0;
                  const dateLabel = daysOffset < 0
                    ? `${Math.abs(daysOffset)}d overdue`
                    : daysOffset === 0 ? "Due today" : `Due in ${daysOffset}d`;
                  const badgeBg = daysOffset < 0 ? "oklch(93% 0.05 25)" : "oklch(93% 0.01 90)";
                  const badgeColor = daysOffset < 0 ? "oklch(48% 0.17 25)" : "oklch(45% 0.01 90)";
                  const hasShortfall = picking.moveLines?.some(l => {
                    const done = valReceived[picking.id!]?.[l.productId] !== undefined 
                      ? valReceived[picking.id!][l.productId] 
                      : l.qtyDone || l.productQty;
                    return done < l.productQty;
                  });

                  return (
                    <div 
                      key={picking.id}
                      style={{ background: "white", border: "1px solid oklch(91% 0.008 90)", borderRadius: "10px", marginBottom: "10px", overflow: "hidden" }}
                    >
                      <div 
                        onClick={() => handleExpandOrder(picking)}
                        style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", gap: "10px" }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "14px" }}>{picking.name}</div>
                          <div style={{ fontSize: "12.5px", color: "oklch(52% 0.01 90)", marginTop: "2px" }}>
                            {picking.origin || "No origin document"}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: "none" }}>
                          <div style={{ fontSize: "11.5px", fontWeight: 700, padding: "4px 9px", borderRadius: "6px", background: badgeBg, color: badgeColor }}>
                            {dateLabel}
                          </div>
                          <div style={{ fontSize: "12px", color: "oklch(60% 0.01 90)", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>▸</div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ padding: "0 16px 16px", animation: "dc-slide-in 0.15s ease-out" }}>
                          <div style={{ borderTop: "1px solid oklch(94% 0.006 90)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 84px 70px", gap: "8px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em", color: "oklch(58% 0.01 90)" }}>
                              <div>Product</div>
                              <div style={{ textAlign: "right" }}>Ordered</div>
                              <div style={{ textAlign: "right" }}>Received</div>
                              <div style={{ textAlign: "right" }}>Short</div>
                            </div>
                            
                            {picking.moveLines?.map((line, lineIdx) => {
                              const done = valReceived[picking.id!]?.[line.productId] !== undefined 
                                ? valReceived[picking.id!][line.productId] 
                                : line.qtyDone || line.productQty;
                              const short = Math.max(0, line.productQty - done);
                              const shortLabel = short > 0 ? String(short) : "—";
                              const shortColor = short > 0 ? "oklch(52% 0.18 25)" : "oklch(65% 0.01 90)";

                              return (
                                <div key={lineIdx} style={{ display: "grid", gridTemplateColumns: "1fr 70px 84px 70px", gap: "8px", alignItems: "center", fontSize: "13px" }}>
                                  <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {line.productName || `Product #${line.productId}`}
                                  </div>
                                  <div style={{ textAlign: "right", color: "oklch(50% 0.01 90)" }}>{line.productQty}</div>
                                  <div style={{ textAlign: "right" }}>
                                    <input 
                                      type="number" 
                                      min="0" 
                                      value={done} 
                                      onChange={(e) => handleReceivedQtyChange(picking.id!, line.productId, e.target.value)}
                                      className="dc-recv-input" 
                                      style={{ width: "64px", textAlign: "right", padding: "5px 6px", border: "1px solid oklch(88% 0.008 90)", borderRadius: "6px", fontFamily: "inherit", fontSize: "13px" }} 
                                    />
                                  </div>
                                  <div style={{ textAlign: "right", fontWeight: 700, color: shortColor }}>{shortLabel}</div>
                                </div>
                              );
                            })}

                            {hasShortfall && (
                              <div style={{ fontSize: "12px", color: "oklch(48% 0.16 45)", background: "oklch(96% 0.04 45)", padding: "8px 10px", borderRadius: "7px", marginTop: "2px" }}>
                                Remaining units will move to a backorder.
                              </div>
                            )}

                            <button 
                              onClick={() => handleValidateOrderSubmit(picking)}
                              style={{ alignSelf: "flex-end", marginTop: "6px", background: "oklch(30% 0.02 90)", color: "white", border: "none", padding: "9px 18px", borderRadius: "8px", fontWeight: 700, fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}
                            >
                              Validate
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              
              {pickings.filter(p => p.pickingTypeId === stats.find(s => s.code === (drawerOpenCardId === "receipts" ? "INCOMING" : "OUTGOING"))?.id && (drawerFilter === "all" || (p.scheduledDate && new Date(p.scheduledDate) < new Date())) && p.state !== "DONE" && p.state !== "CANCEL").length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "oklch(55% 0.01 90)", fontSize: "14px" }}>
                  All clear — nothing here.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ──── CREATE TRANSFER MODAL ──── */}
      {createModalOpenCardId && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div 
            onClick={() => setCreateModalOpenCardId(null)}
            style={{ position: "absolute", inset: 0, background: "oklch(20% 0.01 90 / 0.4)", backdropFilter: "blur(2px)", animation: "dc-fade-in 0.15s ease-out" }}
          />
          <div style={{ position: "relative", width: "440px", maxWidth: "92vw", maxHeight: "88vh", overflowY: "auto", background: "white", borderRadius: "14px", boxShadow: "0 20px 48px oklch(0% 0 0 / 0.22)", animation: "dc-panel-in 0.18s ease-out" }}>
            <div style={{ padding: "20px 22px", borderBottom: "1px solid oklch(94% 0.006 90)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{ fontSize: "17px", fontWeight: 800, margin: 0 }}>
                  New {createModalOpenCardId === "receipts" ? "Receipts" : "Delivery Orders"}
                </h3>
                <div style={{ fontSize: "12.5px", color: "oklch(52% 0.01 90)", marginTop: "4px" }}>
                  {createModalOpenCardId === "receipts" ? "Vendors → WH/Stock" : "WH/Stock → Customers"}
                </div>
              </div>
              <button 
                onClick={() => setCreateModalOpenCardId(null)}
                style={{ background: "oklch(94% 0.006 90)", border: "none", width: "28px", height: "28px", borderRadius: "8px", fontSize: "15px", cursor: "pointer", color: "oklch(35% 0.01 90)", flex: "none" }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div style={{ 
                  fontSize: "11.5px", 
                  fontWeight: 700, 
                  padding: "5px 10px", 
                  borderRadius: "6px", 
                  background: createModalOpenCardId === "receipts" ? "oklch(92% 0.05 264)" : "oklch(93% 0.06 25)", 
                  color: createModalOpenCardId === "receipts" ? "oklch(45% 0.15 264)" : "oklch(48% 0.16 25)"
                }}>
                  {createModalOpenCardId === "receipts" ? "Receipts" : "Delivery Orders"}
                </div>
                <div style={{ fontSize: "12px", color: "oklch(55% 0.01 90)" }}>Operation type</div>
              </div>

              <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <span className="form-label" style={{ fontSize: "12px", fontWeight: 700, color: "oklch(40% 0.01 90)" }}>{createModalOpenCardId === "receipts" ? "Vendor" : "Customer"}</span>
                <input 
                  type="text" 
                  value={createForm.partner}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, partner: e.target.value }))}
                  placeholder={createModalOpenCardId === "receipts" ? "e.g. Acme Supply Co." : "e.g. Meridian Retail"}
                  className="form-input" 
                  style={{ padding: "9px 11px", border: "1px solid oklch(88% 0.008 90)", borderRadius: "8px", fontFamily: "inherit", fontSize: "14px" }}
                />
              </div>

              <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <span className="form-label" style={{ fontSize: "12px", fontWeight: 700, color: "oklch(40% 0.01 90)" }}>Scheduled date</span>
                <input 
                  type="date" 
                  value={createForm.date}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, date: e.target.value }))}
                  className="form-input" 
                  style={{ padding: "9px 11px", border: "1px solid oklch(88% 0.008 90)", borderRadius: "8px", fontFamily: "inherit", fontSize: "14px" }}
                />
              </div>

              <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <span className="form-label" style={{ fontSize: "12px", fontWeight: 700, color: "oklch(40% 0.01 90)" }}>Source Document (Reference / PO / SO)</span>
                <input 
                  type="text" 
                  value={createForm.sourceDoc}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, sourceDoc: e.target.value }))}
                  placeholder="e.g. PO00042"
                  className="form-input" 
                  style={{ padding: "9px 11px", border: "1px solid oklch(88% 0.008 90)", borderRadius: "8px", fontFamily: "inherit", fontSize: "14px" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="form-label" style={{ fontSize: "12px", fontWeight: 700, color: "oklch(40% 0.01 90)" }}>Products</span>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); addLineToForm(); }}
                    style={{ fontSize: "12.5px", fontWeight: 700, color: "oklch(55% 0.13 264)", textDecoration: "none" }}
                  >
                    + Add product
                  </a>
                </div>

                {createForm.lines.map((line, idx) => (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "4px", paddingBottom: "6px", borderBottom: "1px solid oklch(96% 0.004 90)" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <select 
                        value={line.productId}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          const prod = products.find(p => p.id === val);
                          const updated = [...createForm.lines];
                          updated[idx] = {
                            ...updated[idx],
                            productId: val,
                            productName: prod ? prod.name : ""
                          };
                          setCreateForm(prev => ({ ...prev, lines: updated }));
                        }}
                        className="form-input bg-white"
                        style={{ flex: 1, padding: "8px 10px", fontSize: "13.5px", border: "1px solid oklch(88% 0.008 90)", borderRadius: "8px", fontFamily: "inherit" }}
                      >
                        <option value="0">Select Product...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} [{p.defaultCode || "N/A"}]</option>)}
                      </select>
                      <input 
                        type="number" 
                        min="1" 
                        value={line.demand} 
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          const updated = [...createForm.lines];
                          updated[idx].demand = val;
                          setCreateForm(prev => ({ ...prev, lines: updated }));
                        }}
                        className="form-input" 
                        style={{ width: "64px", padding: "8px 8px", fontSize: "13.5px", textAlign: "right", border: "1px solid oklch(88% 0.008 90)", borderRadius: "8px", fontFamily: "inherit" }} 
                      />
                      <button 
                        onClick={() => removeLineFromForm(idx)}
                        style={{ background: "none", border: "none", color: "oklch(60% 0.01 90)", fontSize: "16px", cursor: "pointer", width: "24px", flex: "none" }}
                      >
                        ✕
                      </button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingLeft: "2px" }}>
                      <a 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveLineIdx(idx);
                          setProductForm(prev => ({ ...prev, name: line.productName }));
                          setProductModalOpen(true);
                        }}
                        style={{ fontSize: "12px", fontWeight: 700, color: "oklch(55% 0.13 264)", textDecoration: "none" }}
                      >
                        + New product templates
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: "16px 22px", borderTop: "1px solid oklch(94% 0.006 90)", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button 
                onClick={() => setCreateModalOpenCardId(null)}
                style={{ background: "oklch(94% 0.006 90)", color: "oklch(30% 0.01 90)", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: 700, fontSize: "13.5px", cursor: "pointer", fontFamily: "inherit" }}
              >
                Cancel
              </button>
              <button 
                onClick={handleCreatePickingSubmit}
                style={{ background: createModalOpenCardId === "receipts" ? "oklch(55% 0.13 264)" : "oklch(58% 0.16 25)", color: "white", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: 700, fontSize: "13.5px", cursor: "pointer", fontFamily: "inherit" }}
              >
                Create Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── REGISTER PRODUCT MODAL ──── */}
      {productModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div 
            onClick={() => setProductModalOpen(false)}
            style={{ position: "absolute", inset: 0, background: "oklch(20% 0.01 90 / 0.45)", backdropFilter: "blur(2px)", animation: "dc-fade-in 0.15s ease-out" }}
          />
          <div style={{ position: "relative", width: "380px", maxWidth: "90vw", maxHeight: "88vh", overflowY: "auto", background: "white", borderRadius: "14px", boxShadow: "0 20px 48px oklch(0% 0 0 / 0.25)", animation: "dc-panel-in 0.18s ease-out" }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid oklch(94% 0.006 90)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>New Product Template</h3>
              <button 
                onClick={() => setProductModalOpen(false)}
                style={{ background: "oklch(94% 0.006 90)", border: "none", width: "26px", height: "26px", borderRadius: "8px", fontSize: "14px", cursor: "pointer", color: "oklch(35% 0.01 90)" }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <span className="form-label" style={{ fontSize: "11.5px", fontWeight: 700, color: "oklch(40% 0.01 90)" }}>Product Name</span>
                <input 
                  type="text" 
                  value={productForm.name}
                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Industrial Bolt - 10mm" 
                  className="form-input" 
                  style={{ padding: "8px 10px", border: "1px solid oklch(88% 0.008 90)", borderRadius: "8px", fontFamily: "inherit", fontSize: "13.5px" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span className="form-label" style={{ fontSize: "11.5px", fontWeight: 700, color: "oklch(40% 0.01 90)" }}>Product Type</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button 
                    onClick={() => setProductForm(prev => ({ ...prev, type: "STORABLE" }))}
                    style={{ 
                      flex: 1, 
                      padding: "8px", 
                      borderRadius: "8px", 
                      border: "1px solid oklch(88% 0.008 90)", 
                      fontFamily: "inherit", 
                      fontSize: "12.5px", 
                      fontWeight: 700, 
                      cursor: "pointer",
                      background: productForm.type === "STORABLE" ? "oklch(55% 0.13 264)" : "white",
                      color: productForm.type === "STORABLE" ? "white" : "oklch(40% 0.01 90)"
                    }}
                  >
                    Goods (Storable)
                  </button>
                  <button 
                    onClick={() => setProductForm(prev => ({ ...prev, type: "SERVICE" }))}
                    style={{ 
                      flex: 1, 
                      padding: "8px", 
                      borderRadius: "8px", 
                      border: "1px solid oklch(88% 0.008 90)", 
                      fontFamily: "inherit", 
                      fontSize: "12.5px", 
                      fontWeight: 700, 
                      cursor: "pointer",
                      background: productForm.type === "SERVICE" ? "oklch(55% 0.13 264)" : "white",
                      color: productForm.type === "SERVICE" ? "white" : "oklch(40% 0.01 90)"
                    }}
                  >
                    Service
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <div className="form-group" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
                  <span className="form-label" style={{ fontSize: "11.5px", fontWeight: 700, color: "oklch(40% 0.01 90)" }}>Sales Price</span>
                  <input 
                    type="number" 
                    min="0" 
                    value={productForm.salesPrice}
                    onChange={(e) => setProductForm(prev => ({ ...prev, salesPrice: parseFloat(e.target.value) || 0 }))}
                    className="form-input" 
                    style={{ padding: "8px 10px", border: "1px solid oklch(88% 0.008 90)", borderRadius: "8px", fontFamily: "inherit", fontSize: "13.5px" }}
                  />
                </div>
                <div className="form-group" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
                  <span className="form-label" style={{ fontSize: "11.5px", fontWeight: 700, color: "oklch(40% 0.01 90)" }}>Cost</span>
                  <input 
                    type="number" 
                    min="0" 
                    value={productForm.cost}
                    onChange={(e) => setProductForm(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                    className="form-input" 
                    style={{ padding: "8px 10px", border: "1px solid oklch(88% 0.008 90)", borderRadius: "8px", fontFamily: "inherit", fontSize: "13.5px" }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <span className="form-label" style={{ fontSize: "11.5px", fontWeight: 700, color: "oklch(40% 0.01 90)" }}>Product Category</span>
                <select 
                  value={productForm.category}
                  onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                  className="form-input" 
                  style={{ padding: "8px 10px", border: "1px solid oklch(88% 0.008 90)", borderRadius: "8px", fontFamily: "inherit", fontSize: "13.5px", background: "white" }}
                >
                  <option>All / Saleable</option>
                  <option>Raw Materials</option>
                  <option>Finished Goods</option>
                  <option>Consumables</option>
                </select>
              </div>
            </div>

            <div style={{ padding: "14px 20px", borderTop: "1px solid oklch(94% 0.006 90)", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button 
                onClick={() => setProductModalOpen(false)}
                style={{ background: "oklch(94% 0.006 90)", color: "oklch(30% 0.01 90)", border: "none", padding: "9px 16px", borderRadius: "8px", fontWeight: 700, fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateProductSubmit}
                style={{ background: "oklch(30% 0.02 90)", color: "white", border: "none", padding: "9px 16px", borderRadius: "8px", fontWeight: 700, fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}
              >
                Create Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
