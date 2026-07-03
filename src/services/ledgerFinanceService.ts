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
  | "INVOICE" | "ESTIMATE" | "SALES_ORDER" | "CREDIT_NOTE" | "REFUND";

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

export const ledgerFinanceService = {
  // ── Customers ──
  getCustomers: () => apiClient.get<LedgerCustomer[]>("/finance/customers"),
  createCustomer: (c: LedgerCustomer) => apiClient.post<LedgerCustomer>("/finance/customers", c),
  updateCustomer: (id: number, c: LedgerCustomer) => apiClient.put<LedgerCustomer>(`/finance/customers/${id}`, c),
  deleteCustomer: (id: number) => apiClient.delete<void>(`/finance/customers/${id}`),

  // ── Documents (invoice / estimate / sales order / credit note / refund) ──
  getDocuments: (type: FinanceDocumentType) => apiClient.get<FinanceDocument[]>(`/finance/documents?type=${type}`),
  createDocument: (d: FinanceDocument) => apiClient.post<FinanceDocument>("/finance/documents", d),
  updateDocument: (id: number, d: FinanceDocument) => apiClient.put<FinanceDocument>(`/finance/documents/${id}`, d),
  deleteDocument: (id: number) => apiClient.delete<void>(`/finance/documents/${id}`),

  // ── Receipts (invoice / advance / other income) ──
  getReceipts: (type: ReceiptType) => apiClient.get<FinanceReceipt[]>(`/finance/receipts?type=${type}`),
  createReceipt: (r: FinanceReceipt) => apiClient.post<FinanceReceipt>("/finance/receipts", r),
  updateReceipt: (id: number, r: FinanceReceipt) => apiClient.put<FinanceReceipt>(`/finance/receipts/${id}`, r),
  deleteReceipt: (id: number) => apiClient.delete<void>(`/finance/receipts/${id}`),
};
