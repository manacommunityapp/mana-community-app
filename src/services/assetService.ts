import { apiClient } from "./apiClient";

export interface Asset {
  id: string;
  name: string;
  category: string;
  status: "AVAILABLE" | "BORROWED" | "MAINTENANCE";
  borrowedBy?: string;
  borrowedByFlat?: string;
  borrowedAt?: string;
  expectedReturn?: string;
  tco: number; // Total Cost of Ownership
}

export interface Expense {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  vendorName: string;
  totalAmount: number;
  category: "CapEx_Asset" | "OpEx_Consumable" | "OpEx_Maintenance" | "OpEx_Other";
  status: "PENDING" | "APPROVED" | "REJECTED";
  uploadedBy: string;
  receiptUrl: string;
  assetId?: string; // Linked Asset ID
  approvalNotes?: string;
  upiId?: string;
  bankDetails?: string;
}

export const assetService = {
  async getAssets(): Promise<Asset[]> {
    const raw = await apiClient.get<any[]>("/inventory/items");
    return raw.map(this.mapAsset);
  },

  async getAssetById(id: string): Promise<Asset | undefined> {
    try {
      const raw = await apiClient.get<any>(`/inventory/items/${id}`);
      return this.mapAsset(raw);
    } catch {
      return undefined;
    }
  },

  async getAssetByQrCode(qrCodeId: string): Promise<Asset | undefined> {
    try {
      const raw = await apiClient.get<any>(`/inventory/items/qr/${qrCodeId}`);
      return this.mapAsset(raw);
    } catch {
      return undefined;
    }
  },

  async checkoutAsset(id: string, userFullName: string, userFlat: string, duration: string): Promise<Asset | undefined> {
    try {
      const raw = await apiClient.post<any>(`/inventory/items/${id}/checkout`, {
        borrowedBy: userFullName,
        borrowedByFlat: userFlat,
        expectedReturnAt: duration
      });
      return this.mapAsset(raw);
    } catch {
      return undefined;
    }
  },

  async checkinAsset(id: string): Promise<Asset | undefined> {
    try {
      const raw = await apiClient.post<any>(`/inventory/items/${id}/checkin`);
      return this.mapAsset(raw);
    } catch {
      return undefined;
    }
  },

  async getExpenses(): Promise<Expense[]> {
    const raw = await apiClient.get<any[]>("/inventory/expenses");
    return raw.map(this.mapExpense);
  },

  async getExpenseById(id: string): Promise<Expense | undefined> {
    try {
      const raw = await apiClient.get<any>(`/inventory/expenses/${id}`);
      return this.mapExpense(raw);
    } catch {
      return undefined;
    }
  },

  async createExpense(expense: Omit<Expense, "id" | "status">): Promise<Expense> {
    const raw = await apiClient.post<any>("/inventory/expenses/upload", {
      invoiceNumber: expense.invoiceNumber,
      invoiceDate: expense.invoiceDate,
      vendorName: expense.vendorName,
      totalAmount: expense.totalAmount,
      uploadedBy: expense.uploadedBy,
      receiptUrl: expense.receiptUrl,
      upiId: expense.upiId,
      bankDetails: expense.bankDetails,
      assetId: expense.assetId ? parseInt(expense.assetId) : undefined,
      lineItems: [
        {
          description: expense.assetId ? `Procurement/Maintenance line items` : `General procurement`,
          unitPrice: expense.totalAmount,
          totalPrice: expense.totalAmount,
          expenseCategory: expense.category
        }
      ]
    });
    return this.mapExpense(raw);
  },

  async approveExpense(id: string, notes?: string): Promise<Expense | undefined> {
    try {
      const path = `/inventory/expenses/${id}/approve` + (notes ? `?notes=${encodeURIComponent(notes)}` : "");
      const raw = await apiClient.post<any>(path);
      return this.mapExpense(raw);
    } catch {
      return undefined;
    }
  },

  async rejectExpense(id: string, notes: string): Promise<Expense | undefined> {
    try {
      const path = `/inventory/expenses/${id}/reject` + `?notes=${encodeURIComponent(notes)}`;
      const raw = await apiClient.post<any>(path);
      return this.mapExpense(raw);
    } catch {
      return undefined;
    }
  },

  // Helper mappings
  mapAsset(raw: any): Asset {
    return {
      id: String(raw.id),
      name: raw.name,
      category: raw.category,
      status: raw.status,
      borrowedBy: raw.borrowedBy || undefined,
      borrowedByFlat: raw.borrowedByFlat || undefined,
      borrowedAt: raw.borrowedAt || undefined,
      expectedReturn: raw.expectedReturn || undefined,
      tco: Number(raw.tco)
    };
  },

  mapExpense(raw: any): Expense {
    // Check line items for linked asset
    const lineItemAssetId = raw.lineItems && raw.lineItems.length > 0 && raw.lineItems[0].item
      ? String(raw.lineItems[0].item.id)
      : undefined;

    return {
      id: String(raw.id),
      invoiceNumber: raw.invoiceNumber,
      invoiceDate: raw.invoiceDate,
      vendorName: raw.vendorName,
      totalAmount: Number(raw.totalAmount),
      category: raw.lineItems && raw.lineItems.length > 0
        ? raw.lineItems[0].expenseCategory
        : "OpEx_Maintenance",
      status: raw.status,
      uploadedBy: raw.uploadedBy,
      receiptUrl: raw.receiptUrl,
      assetId: lineItemAssetId,
      approvalNotes: raw.approvalNotes || undefined,
      upiId: raw.upiId || undefined,
      bankDetails: raw.bankDetails || undefined
    };
  }
};
