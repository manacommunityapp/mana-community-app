import { useState, useMemo, useEffect } from "react";
import { type LineItem, emptyLine } from "./invoice/ledgerShared";
import { LEDGER_CSS } from "./invoice/ledgerStyles";
import { DashboardView } from "./invoice/DashboardView";
import { InvoicesView } from "./invoice/InvoicesView";
import { ImportInvoiceView } from "./invoice/ImportInvoiceView";
import { NewInvoiceView } from "./invoice/NewInvoiceView";
import { ReceiptsView } from "./invoice/ReceiptsView";
import { NewReceiptView } from "./invoice/NewReceiptView";
import { NewAdvanceReceiptView } from "./invoice/NewAdvanceReceiptView";
import { NewOtherIncomeView } from "./invoice/NewOtherIncomeView";
import { EstimatesView } from "./invoice/EstimatesView";
import { NewEstimateView } from "./invoice/NewEstimateView";
import { SalesOrdersView } from "./invoice/SalesOrdersView";
import { NewSalesOrderView } from "./invoice/NewSalesOrderView";
import { CreditNotesView } from "./invoice/CreditNotesView";
import { NewCreditNoteView } from "./invoice/NewCreditNoteView";
import { CustomersView } from "./invoice/CustomersView";
import { CustomerImportsView } from "./invoice/CustomerImportsView";
import { PlaceholderView } from "./invoice/PlaceholderView";
import { useAuth } from "../../../contexts/AuthContext";
import { menuPermissionService } from "../../../services/menuPermissionService";
import type { MenuRolePermissionResponse } from "../../../types/api";

type View = "dashboard" | "invoices" | "receipts" | "new-invoice" | "import-invoice" | "new-receipt" | "new-advance-receipt" | "new-other-income" | "estimates" | "new-estimate" | "sales-orders" | "new-sales-order" | "credit-notes" | "new-credit-note" | "customers" | "import-customers" | "placeholder";

export function LedgerFinance() {
  const { user } = useAuth();
  const [view, setView] = useState<View>("dashboard");
  const [placeholderTitle, setPlaceholderTitle] = useState("Section");
  const [incomeOpen, setIncomeOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [permissions, setPermissions] = useState<MenuRolePermissionResponse[]>([]);

  useEffect(() => {
    if (user?.roleId) {
      menuPermissionService.getViewableMenus(user.roleId)
        .then(setPermissions)
        .catch((err) => console.error("Failed to load viewable menus:", err));
    }
  }, [user?.roleId]);

  const hasMenuPermission = (menuKey: string, action: "view" | "add" | "update" | "delete"): boolean => {
    if (user?.role === "SUPER_ADMIN") return true;
    if (permissions.length === 0) {
      // Fallback: SUPER_ADMIN/ADMIN has full access, MEMBER has view-only on invoices/receipts
      if (user?.role === "MEMBER") {
        return action === "view" && ["invoices", "receipts"].includes(menuKey);
      }
      return true; // default fallback for admins
    }
    const perm = permissions.find((p) => p.menuKey === menuKey);
    if (!perm) return false;
    if (action === "view") return perm.canView;
    if (action === "add") return perm.canAdd;
    if (action === "update") return perm.canUpdate;
    if (action === "delete") return perm.canDelete;
    return false;
  };

  const [invoicesTab, setInvoicesTab] = useState<"invoices" | "refunds">("invoices");
  const [periodTab, setPeriodTab] = useState(0);

  // ── New invoice line items ──
  const [lines, setLines] = useState<LineItem[]>([{ ...emptyLine }]);
  const [taxInclusive, setTaxInclusive] = useState(false);
  const [invoiceType, setInvoiceType] = useState<"credit" | "cash">("credit");

  const totals = useMemo(() => {
    let subtotal = 0, discount = 0, tax = 0;
    const lineTotals = lines.map((l) => {
      const gross = l.qty * l.cost;
      const discAmt = gross * (l.disc / 100);
      const taxable = gross - discAmt;
      const taxAmt = taxable * (l.tax / 100);
      subtotal += gross; discount += discAmt; tax += taxAmt;
      return taxable + taxAmt;
    });
    return { subtotal, discount, tax, grand: subtotal - discount + tax, lineTotals };
  }, [lines]);

  const go = (v: View, navKey: string, title?: string) => {
    setView(v);
    setActiveNav(navKey);
    if (v === "placeholder") setPlaceholderTitle(title || "Section");
    setSidebarOpen(false);
    window.scrollTo({ top: 0 });
  };

  const updateLine = (idx: number, patch: Partial<LineItem>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const addLine = () => setLines((prev) => [...prev, { ...emptyLine }]);
  const removeLine = (idx: number) => setLines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  // Reset the shared line-item state when entering any creation flow, so line
  // items typed into one document don't bleed into the next.
  const resetDoc = () => { setLines([{ ...emptyLine }]); setTaxInclusive(false); };

  const navItem = (label: string, navKey: string, onClick: () => void, child = false) => (
    <button
      type="button"
      className={`nav-link${child ? " child" : ""}${activeNav === navKey ? " active" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );

  return (
    <div className="ledger-app">
      <style>{LEDGER_CSS}</style>

      {/* Mobile menu toggle + scrim */}
      <button className="menu-toggle" aria-label="Open menu" onClick={() => setSidebarOpen((v) => !v)}>
        <svg viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="#EFEBDD" strokeWidth="1.8" strokeLinecap="round" /></svg>
      </button>
      {sidebarOpen && <div className="scrim show" onClick={() => setSidebarOpen(false)} />}

      <div className="app">
        {/* ── Sidebar ── */}
        <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
          <nav className="menu">
            <button type="button" className={`nav-link${activeNav === "dashboard" ? " active" : ""}`} onClick={() => go("dashboard", "dashboard")}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none"><path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z" stroke="#DCE5DD" strokeWidth="1.5" strokeLinejoin="round" /></svg>
              Dashboard
            </button>

            {/* Income group */}
            <div className={`nav-group${incomeOpen ? " open" : ""}`}>
              <button type="button" className="nav-group-toggle" onClick={() => setIncomeOpen((v) => !v)}>
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none"><path d="M12 3v18M17 7.5c0-1.9-2.2-3-5-3s-5 1.3-5 3 2.2 2.6 5 3 5 1.3 5 3-2.2 3-5 3-5-1.1-5-3" stroke="#DCE5DD" strokeWidth="1.5" strokeLinecap="round" /></svg>
                Income
                <svg className="chev" width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="m9 6 6 6-6 6" stroke="#8CA391" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <div className="nav-children">
                {hasMenuPermission("invoices", "view") && navItem("Invoices", "invoices", () => go("invoices", "invoices"), true)}
                {hasMenuPermission("receipts", "view") && navItem("Receipts", "receipts", () => go("receipts", "receipts"), true)}
                {hasMenuPermission("estimates", "view") && navItem("Estimate", "estimates", () => go("estimates", "estimates"), true)}
                {hasMenuPermission("sales_orders", "view") && navItem("Sales Orders", "sales-orders", () => go("sales-orders", "sales-orders"), true)}
                {hasMenuPermission("credit_notes", "view") && navItem("Credit Notes", "credit-notes", () => go("credit-notes", "credit-notes"), true)}
                {hasMenuPermission("customers", "view") && navItem("Customers", "customers", () => go("customers", "customers"), true)}
              </div>
            </div>

          </nav>

          <div className="sidebar-foot">v2.4 · FY 2026–27</div>
        </aside>

        {/* ── Main ── */}
        <main className="main">
          <div className="wrap">
            {view === "dashboard" && <DashboardView periodTab={periodTab} setPeriodTab={setPeriodTab} />}
            {view === "invoices" && (
              <InvoicesView 
                tab={invoicesTab} 
                setTab={setInvoicesTab} 
                onNewInvoice={(type) => {
                  setInvoiceType(type);
                  resetDoc();
                  go("new-invoice", "invoices");
                }}
                onImportClick={() => go("import-invoice", "invoices")}
                canAdd={hasMenuPermission("invoices", "add")}
              />
            )}
            {view === "import-invoice" && (
              <ImportInvoiceView 
                onCancel={() => go("invoices", "invoices")}
                onSave={() => go("invoices", "invoices")}
              />
            )}
            {view === "receipts" && (
              <ReceiptsView 
                onNewReceipt={() => go("new-receipt", "receipts")}
                canAdd={hasMenuPermission("receipts", "add")}
              />
            )}
            {view === "new-receipt" && (
              <NewReceiptView 
                onCancel={() => go("receipts", "receipts")}
                onSave={() => go("receipts", "receipts")}
                onNavigateAdvance={() => go("new-advance-receipt", "receipts")}
                onNavigateOther={() => go("new-other-income", "receipts")}
              />
            )}
            {view === "new-advance-receipt" && (
              <NewAdvanceReceiptView 
                onCancel={() => go("receipts", "receipts")}
                onSave={() => go("receipts", "receipts")}
                onNavigateInvoice={() => go("new-receipt", "receipts")}
                onNavigateOther={() => go("new-other-income", "receipts")}
              />
            )}
            {view === "new-other-income" && (
              <NewOtherIncomeView 
                onCancel={() => go("receipts", "receipts")}
                onSave={() => go("receipts", "receipts")}
                onNavigateInvoice={() => go("new-receipt", "receipts")}
                onNavigateAdvance={() => go("new-advance-receipt", "receipts")}
              />
            )}
            {view === "new-invoice" && (
              <NewInvoiceView
                invoiceType={invoiceType}
                lines={lines} totals={totals} taxInclusive={taxInclusive} setTaxInclusive={setTaxInclusive}
                updateLine={updateLine} addLine={addLine} removeLine={removeLine}
                onCancel={() => go("invoices", "invoices")} onSave={() => go("invoices", "invoices")}
              />
            )}
            {view === "estimates" && (
              <EstimatesView 
                onNewEstimate={() => { resetDoc(); go("new-estimate", "estimates"); }}
                canAdd={hasMenuPermission("estimates", "add")}
              />
            )}
            {view === "new-estimate" && (
              <NewEstimateView 
                lines={lines} totals={totals} taxInclusive={taxInclusive} setTaxInclusive={setTaxInclusive}
                updateLine={updateLine} addLine={addLine} removeLine={removeLine}
                onCancel={() => go("estimates", "estimates")} onSave={() => go("estimates", "estimates")}
              />
            )}
            {view === "sales-orders" && (
              <SalesOrdersView 
                onNewSalesOrder={() => { resetDoc(); go("new-sales-order", "sales-orders"); }}
                canAdd={hasMenuPermission("sales_orders", "add")}
              />
            )}
            {view === "new-sales-order" && (
              <NewSalesOrderView 
                lines={lines} totals={totals} taxInclusive={taxInclusive} setTaxInclusive={setTaxInclusive}
                updateLine={updateLine} addLine={addLine} removeLine={removeLine}
                onCancel={() => go("sales-orders", "sales-orders")} onSave={() => go("sales-orders", "sales-orders")}
              />
            )}
            {view === "credit-notes" && (
              <CreditNotesView 
                onNewCreditNote={() => { resetDoc(); go("new-credit-note", "credit-notes"); }}
                canAdd={hasMenuPermission("credit_notes", "add")}
              />
            )}
            {view === "new-credit-note" && (
              <NewCreditNoteView 
                lines={lines} totals={totals} taxInclusive={taxInclusive} setTaxInclusive={setTaxInclusive}
                updateLine={updateLine} addLine={addLine} removeLine={removeLine}
                onCancel={() => go("credit-notes", "credit-notes")} onSave={() => go("credit-notes", "credit-notes")}
              />
            )}
            {view === "customers" && (
              <CustomersView 
                onImportCustomers={() => go("import-customers", "customers")}
                canAdd={hasMenuPermission("customers", "add")}
              />
            )}
            {view === "import-customers" && (
              <CustomerImportsView 
                onCancel={() => go("customers", "customers")}
                onSave={() => go("customers", "customers")}
              />
            )}
            {view === "placeholder" && <PlaceholderView title={placeholderTitle} />}
          </div>
        </main>
      </div>
    </div>
  );
}
