import { apiClient } from "./apiClient";

export interface RetailProduct {
  id?: number;
  name: string;
  emoji?: string;
  category?: string;
  unitPrice: number;
  reorderLevel: number;
  unitsOrdered: number;
  unitsSold: number;
}

export interface Supplier {
  id?: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

export interface Customer {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
}

export type RetailOrderType = "PURCHASE" | "SALES";
export type RetailOrderStatus = "OPEN" | "PENDING" | "FULFILLED";

export interface RetailOrderLine {
  productId: number;
  qty: number;
  unitPrice: number;
}

export interface RetailOrder {
  id?: number;
  code?: string;
  type: RetailOrderType;
  partyId: number;
  orderDate: string; // yyyy-MM-dd
  status: RetailOrderStatus;
  items: RetailOrderLine[];
}

export const retailInventoryService = {
  // ── Products ──
  getProducts: () => apiClient.get<RetailProduct[]>("/retail/products"),
  createProduct: (p: RetailProduct) => apiClient.post<RetailProduct>("/retail/products", p),
  updateProduct: (id: number, p: RetailProduct) => apiClient.put<RetailProduct>(`/retail/products/${id}`, p),
  deleteProduct: (id: number) => apiClient.delete<void>(`/retail/products/${id}`),

  // ── Suppliers ──
  getSuppliers: () => apiClient.get<Supplier[]>("/retail/suppliers"),
  createSupplier: (s: Supplier) => apiClient.post<Supplier>("/retail/suppliers", s),
  updateSupplier: (id: number, s: Supplier) => apiClient.put<Supplier>(`/retail/suppliers/${id}`, s),
  deleteSupplier: (id: number) => apiClient.delete<void>(`/retail/suppliers/${id}`),

  // ── Customers ──
  getCustomers: () => apiClient.get<Customer[]>("/retail/customers"),
  createCustomer: (c: Customer) => apiClient.post<Customer>("/retail/customers", c),
  updateCustomer: (id: number, c: Customer) => apiClient.put<Customer>(`/retail/customers/${id}`, c),
  deleteCustomer: (id: number) => apiClient.delete<void>(`/retail/customers/${id}`),

  // ── Orders (Purchase + Sales) ──
  getOrders: (type: RetailOrderType) => apiClient.get<RetailOrder[]>(`/retail/orders?type=${type}`),
  createOrder: (o: RetailOrder) => apiClient.post<RetailOrder>("/retail/orders", o),
  updateOrder: (id: number, o: RetailOrder) => apiClient.put<RetailOrder>(`/retail/orders/${id}`, o),
  deleteOrder: (id: number) => apiClient.delete<void>(`/retail/orders/${id}`),
};
