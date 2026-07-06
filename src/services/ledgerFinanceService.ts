import { apiClient } from "./apiClient";

/* ──────────────────────────────────────────────────────────────────────────
   Income & Expense (Ledger) finance API.
   Backs the finance/invoice module: customers, unified financial documents
   (invoice / estimate / sales order / credit note / refund) and receipts.
   ────────────────────────────────────────────────────────────────────────── */

export interface LedgerCustomer {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  gstType?: string;
  gstin?: string;
  currency?: string;
  openingBalance?: number;
  balanceType?: string; // "Cr" | "Dr"
  startsFrom?: string;  // yyyy-MM-dd
  billAddr1?: string; billAddr2?: string; billCity?: string;
  billState?: string; billCountry?: string; billZipcode?: string;
  shipAddr1?: string; shipAddr2?: string; shipCity?: string;
  shipState?: string; shipCountry?: string; shipZipcode?: string;
  createdAt?: string;
}

export type FinanceDocumentType =
  | "INVOICE" | "ESTIMATE" | "SALES_ORDER" | "CREDIT_NOTE" | "REFUND"
  | "EXPENSE" | "PURCHASE" | "PURCHASE_RETURN" | "PURCHASE_ORDER" | "DEBIT_NOTE";

export interface FinanceDocumentLine {
  item?: string;
  description?: string;
  qty?: number;
  cost?: number;
  disc?: number;      // percent
  tax?: number;       // percent
  lineTotal?: number;
}

export interface FinanceDocument {
  id?: number;
  code?: string;
  type: FinanceDocumentType;
  status?: string;
  customerId?: number;
  customerName?: string;
  docDate?: string;   // yyyy-MM-dd
  dueDate?: string;   // yyyy-MM-dd
  notes?: string;
  terms?: string;
  taxInclusive?: boolean;
  currency?: string;
  subtotal?: number;
  discount?: number;
  tax?: number;
  otherCharges?: number;
  grandTotal?: number;
  items: FinanceDocumentLine[];
}

export interface Vendor {
  id?: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  gstin?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  status?: string; // "Active" | "Inactive"
  createdAt?: string;
}

export type VendorPaymentType = "PAID_BILL" | "ADVANCE" | "OTHER";

export interface VendorPayment {
  id?: number;
  code?: string;
  paymentType?: VendorPaymentType;
  vendorId?: number;
  vendorName?: string;
  paymentDate?: string; // yyyy-MM-dd
  amount?: number;
  paymentMode?: string;
  paidFrom?: string;
  reference?: string;
  status?: string;
  notes?: string;
  createdAt?: string;
}

export type ReceiptType = "INVOICE" | "ADVANCE" | "OTHER";

export interface FinanceReceipt {
  id?: number;
  code?: string;
  receiptType: ReceiptType;
  customerId?: number;
  customerName?: string;
  receiptDate?: string; // yyyy-MM-dd
  amount?: number;
  paymentMode?: string;
  reference?: string;
  notes?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   Each finance menu now has its OWN dedicated backend endpoint (one table per
   menu) instead of the shared /finance/documents?type=X. We route by type here
   so the view components keep using the same getDocuments/createDocument calls.

   Expense-side documents store the counterparty as vendorId/vendorName on the
   backend, but the UI models everything as customerId/customerName — so we map
   the two directions for those. Types with no dedicated menu (PURCHASE_RETURN,
   REFUND) fall back to the legacy /finance/documents endpoint.
   ────────────────────────────────────────────────────────────────────────── */
const DEDICATED: Partial<Record<FinanceDocumentType, { path: string; vendor: boolean }>> = {
  INVOICE:        { path: "/finance/invoices",          vendor: false },
  ESTIMATE:       { path: "/finance/estimates",         vendor: false },
  SALES_ORDER:    { path: "/finance/sales-orders",      vendor: false },
  CREDIT_NOTE:    { path: "/finance/credit-notes",      vendor: false },
  EXPENSE:        { path: "/finance/business-expenses", vendor: true },
  PURCHASE:       { path: "/finance/purchases",         vendor: true },
  PURCHASE_ORDER: { path: "/finance/purchase-orders",   vendor: true },
  DEBIT_NOTE:     { path: "/finance/debit-notes",       vendor: true },
};

/** UI FinanceDocument → dedicated backend body (drop `type`; customer→vendor for vendor docs). */
function toBackend(d: FinanceDocument, vendor: boolean): Record<string, unknown> {
  const { type, customerId, customerName, ...rest } = d;
  return vendor ? { ...rest, vendorId: customerId, vendorName: customerName } : { ...rest };
}

/** Dedicated backend row → UI FinanceDocument (re-attach `type`; vendor→customer for vendor docs). */
function fromBackend(r: Record<string, unknown>, type: FinanceDocumentType, vendor: boolean): FinanceDocument {
  const base = { ...r, type } as unknown as FinanceDocument;
  if (vendor) {
    base.customerId = r.vendorId as number | undefined;
    base.customerName = r.vendorName as string | undefined;
  }
  return base;
}

export const ledgerFinanceService = {
  // ── Customers ──
  getCustomers: () => apiClient.get<LedgerCustomer[]>("/finance/customers"),
  createCustomer: (c: LedgerCustomer) => apiClient.post<LedgerCustomer>("/finance/customers", c),
  updateCustomer: (id: number, c: LedgerCustomer) => apiClient.put<LedgerCustomer>(`/finance/customers/${id}`, c),
  deleteCustomer: (id: number) => apiClient.delete<void>(`/finance/customers/${id}`),

  // ── Documents — routed to per-menu dedicated endpoints (fallback to legacy) ──
  getDocuments: (type: FinanceDocumentType) => {
    const d = DEDICATED[type];
    if (!d) return apiClient.get<FinanceDocument[]>(`/finance/documents?type=${type}`);
    return apiClient.get<Record<string, unknown>[]>(d.path)
      .then((rows) => rows.map((r) => fromBackend(r, type, d.vendor)));
  },
  createDocument: (doc: FinanceDocument) => {
    const d = DEDICATED[doc.type];
    if (!d) return apiClient.post<FinanceDocument>("/finance/documents", doc);
    return apiClient.post<Record<string, unknown>>(d.path, toBackend(doc, d.vendor))
      .then((r) => fromBackend(r, doc.type, d.vendor));
  },
  updateDocument: (id: number, doc: FinanceDocument) => {
    const d = DEDICATED[doc.type];
    if (!d) return apiClient.put<FinanceDocument>(`/finance/documents/${id}`, doc);
    return apiClient.put<Record<string, unknown>>(`${d.path}/${id}`, toBackend(doc, d.vendor))
      .then((r) => fromBackend(r, doc.type, d.vendor));
  },
  deleteDocument: (id: number, type?: FinanceDocumentType) => {
    const d = type ? DEDICATED[type] : undefined;
    return apiClient.delete<void>(d ? `${d.path}/${id}` : `/finance/documents/${id}`);
  },

  // ── Vendors (supplier side: purchases / purchase orders / debit notes) ──
  getVendors: () => apiClient.get<Vendor[]>("/finance/vendors"),
  createVendor: (v: Vendor) => apiClient.post<Vendor>("/finance/vendors", v),
  updateVendor: (id: number, v: Vendor) => apiClient.put<Vendor>(`/finance/vendors/${id}`, v),
  deleteVendor: (id: number) => apiClient.delete<void>(`/finance/vendors/${id}`),

  // ── Vendor payments (money paid to a vendor — outflow) ──
  getVendorPayments: (type?: VendorPaymentType) => apiClient.get<VendorPayment[]>(`/finance/vendor-payments${type ? `?type=${type}` : ""}`),
  createVendorPayment: (p: VendorPayment) => apiClient.post<VendorPayment>("/finance/vendor-payments", p),
  updateVendorPayment: (id: number, p: VendorPayment) => apiClient.put<VendorPayment>(`/finance/vendor-payments/${id}`, p),
  deleteVendorPayment: (id: number) => apiClient.delete<void>(`/finance/vendor-payments/${id}`),

  // ── Receipts (invoice / advance / other income) ──
  getReceipts: (type: ReceiptType) => apiClient.get<FinanceReceipt[]>(`/finance/receipts?type=${type}`),
  createReceipt: (r: FinanceReceipt) => apiClient.post<FinanceReceipt>("/finance/receipts", r),
  updateReceipt: (id: number, r: FinanceReceipt) => apiClient.put<FinanceReceipt>(`/finance/receipts/${id}`, r),
  deleteReceipt: (id: number) => apiClient.delete<void>(`/finance/receipts/${id}`),
};
