import { useState, useMemo, useEffect } from "react";
import { type LineItem, emptyLine } from "./ledgerShared";
import { LEDGER_CSS } from "./ledgerStyles";
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
import { PlaceholderView } from "./PlaceholderView";
import { BusinessExpensesView } from "./expense/BusinessExpensesView";
import { NewExpenseView } from "./expense/NewExpenseView";
import { StockPurchasesView } from "./expense/StockPurchasesView";
import { NewPurchaseView } from "./expense/NewPurchaseView";
import { PurchaseOrdersView } from "./expense/PurchaseOrdersView";
import { DebitNotesView } from "./expense/DebitNotesView";
import { VendorsView } from "./expense/VendorsView";
import { NewVendorView } from "./expense/NewVendorView";
import { VendorPaymentsView } from "./expense/VendorPaymentsView";
import { NewVendorPaymentView } from "./expense/NewVendorPaymentView";
import { NewPurchaseOrderView } from "./expense/NewPurchaseOrderView";
import { useAuth } from "../../../contexts/AuthContext";
import { menuPermissionService } from "../../../services/menuPermissionService";
import type { MenuRolePermissionResponse } from "../../../types/api";

type View = "dashboard" | "invoices" | "receipts" | "new-invoice" | "import-invoice" | "new-receipt" | "new-advance-receipt" | "new-other-income" | "estimates" | "new-estimate" | "sales-orders" | "new-sales-order" | "credit-notes" | "new-credit-note" | "customers" | "import-customers" | "business-expenses" | "new-expense" | "stock-purchases" | "new-purchase" | "purchase-orders" | "new-purchase-order" | "debit-notes" | "vendors" | "new-vendor" | "vendor-payments" | "new-vendor-payment" | "new-advance-payment" | "new-other-payment" | "placeholder";

export function LedgerFinance({ section = "invoice" }: { section?: "invoice" | "expense" }) {
  const { user } = useAuth();
  const [view, setView] = useState<View>(section === "expense" ? "business-expenses" : "dashboard");
  const [placeholderTitle, setPlaceholderTitle] = useState("Section");
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
    window.scrollTo({ top: 0 });
  };

  const updateLine = (idx: number, patch: Partial<LineItem>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const addLine = () => setLines((prev) => [...prev, { ...emptyLine }]);
  const removeLine = (idx: number) => setLines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  // Reset the shared line-item state when entering any creation flow, so line
  // items typed into one document don't bleed into the next.
  const resetDoc = () => { setLines([{ ...emptyLine }]); setTaxInclusive(false); };

  const navPill = (label: string, navKey: string, onClick: () => void) => (
    <button
      type="button"
      className={`nav-pill${activeNav === navKey ? " active" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );

  return (
    <div className="ledger-app">
      <style>{LEDGER_CSS}</style>

      <div className="app">
        {/* ── Breadcrumb + page header ── */}
        <div className="page-head">
          <div className="crumbs">
            <span>Home</span>
            <span className="sep">›</span>
            <span className="cur">{section === "expense" ? "Expense" : "Income"}</span>
          </div>
          <div className="page-title">
            <div className="pt-text">
              <h2>{section === "expense" ? "Expenses" : "Income & Invoices"}</h2>
              <p>{section === "expense" ? "Bills, purchases & vendor payments" : "Invoices, receipts & customers"}</p>
            </div>
            <div className="pt-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 3h9l3 3v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M9 8.5h6M9 12h6M9 15.5h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
            </div>
          </div>
        </div>

        {/* ── Horizontal pill nav ── */}
        <div className="navbar">
          <nav className="topnav">
            {section === "invoice" && (
              <>
                {navPill("Dashboard", "dashboard", () => go("dashboard", "dashboard"))}
                {hasMenuPermission("invoices", "view") && navPill("Invoices", "invoices", () => go("invoices", "invoices"))}
                {hasMenuPermission("receipts", "view") && navPill("Receipts", "receipts", () => go("receipts", "receipts"))}
                {hasMenuPermission("estimates", "view") && navPill("Estimate", "estimates", () => go("estimates", "estimates"))}
                {hasMenuPermission("sales_orders", "view") && navPill("Sales Orders", "sales-orders", () => go("sales-orders", "sales-orders"))}
                {hasMenuPermission("credit_notes", "view") && navPill("Credit Notes", "credit-notes", () => go("credit-notes", "credit-notes"))}
                {hasMenuPermission("customers", "view") && navPill("Customers", "customers", () => go("customers", "customers"))}
              </>
            )}
            {section === "expense" && (
              <>
                {navPill("Business Expenses", "business-expenses", () => go("business-expenses", "business-expenses"))}
                {navPill("Stock Purchases", "stock-purchases", () => go("stock-purchases", "stock-purchases"))}
                {navPill("Purchase Orders", "purchase-orders", () => go("purchase-orders", "purchase-orders"))}
                {navPill("Vendor Payments", "vendor-payments", () => go("vendor-payments", "vendor-payments"))}
                {navPill("Debit Notes", "debit-notes", () => go("debit-notes", "debit-notes"))}
                {navPill("Vendors", "vendors", () => go("vendors", "vendors"))}
              </>
            )}
          </nav>
        </div>

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
            {view === "business-expenses" && (
              <BusinessExpensesView
                onNewExpense={() => go("new-expense", "business-expenses")}
                canAdd={hasMenuPermission("expenses", "add")}
              />
            )}
            {view === "new-expense" && (
              <NewExpenseView
                onCancel={() => go("business-expenses", "business-expenses")}
                onSave={() => go("business-expenses", "business-expenses")}
              />
            )}
            {view === "stock-purchases" && (
              <StockPurchasesView
                onNewPurchase={() => go("new-purchase", "stock-purchases")}
                canAdd={hasMenuPermission("stock_purchases", "add")}
              />
            )}
            {view === "new-purchase" && (
              <NewPurchaseView
                onCancel={() => go("stock-purchases", "stock-purchases")}
                onSave={() => go("stock-purchases", "stock-purchases")}
              />
            )}
            {view === "purchase-orders" && (
              <PurchaseOrdersView
                onNewPurchaseOrder={() => go("new-purchase-order", "purchase-orders")}
                canAdd={hasMenuPermission("purchase_orders", "add")}
              />
            )}
            {view === "new-purchase-order" && (
              <NewPurchaseOrderView
                onCancel={() => go("purchase-orders", "purchase-orders")}
                onSave={() => go("purchase-orders", "purchase-orders")}
              />
            )}
            {view === "debit-notes" && <DebitNotesView />}
            {view === "vendor-payments" && (
              <VendorPaymentsView
                onNewPaidBill={() => go("new-vendor-payment", "vendor-payments")}
                onNewAdvance={() => go("new-advance-payment", "vendor-payments")}
                onNewOther={() => go("new-other-payment", "vendor-payments")}
              />
            )}
            {(view === "new-vendor-payment" || view === "new-advance-payment" || view === "new-other-payment") && (
              <NewVendorPaymentView
                kind={view === "new-advance-payment" ? "advance" : view === "new-other-payment" ? "other" : "paid"}
                onSwitchKind={(k) => go(k === "advance" ? "new-advance-payment" : k === "other" ? "new-other-payment" : "new-vendor-payment", "vendor-payments")}
                onCancel={() => go("vendor-payments", "vendor-payments")}
                onSave={() => go("vendor-payments", "vendor-payments")}
              />
            )}
            {view === "vendors" && (
              <VendorsView
                onNewVendor={() => go("new-vendor", "vendors")}
                canAdd={hasMenuPermission("vendors", "add")}
              />
            )}
            {view === "new-vendor" && (
              <NewVendorView
                onCancel={() => go("vendors", "vendors")}
                onSave={() => go("vendors", "vendors")}
              />
            )}
            {view === "placeholder" && <PlaceholderView title={placeholderTitle} />}
          </div>
        </main>
      </div>
    </div>
  );
}
