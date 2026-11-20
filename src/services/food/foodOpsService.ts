import { apiClient } from '@/services/common/apiClient';

export type SlotStatus = 'OPEN' | 'FULL' | 'CUTOFF' | 'CANCELLED';
export type BasketFrequency = 'DAILY' | 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY';
export type BasketStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';
export type RefundTrigger = 'OUT_OF_STOCK' | 'SUBSTITUTION_REJECTED' | 'DAMAGED' | 'NOT_DELIVERED' | 'WRONG_ITEM' | 'QUALITY_ISSUE' | 'MANUAL';
export type RefundStatus = 'INITIATED' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
export type ColdChainType = 'AMBIENT' | 'CHILLED' | 'FROZEN';

export interface DeliverySlotTemplate {
  id: number;
  communityId: number;
  vendorId: number;
  startTime: string;
  endTime: string;
  capacityPerSlot: number;
  cutoffMinutesBefore: number;
  activeDays: string;
  active: boolean;
}

export interface DeliverySlot {
  id: number;
  templateId: number;
  communityId: number;
  vendorId: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  status: SlotStatus;
  cutoffAt: string;
}

export interface RecurringBasket {
  id: number;
  communityId: number;
  userId: number;
  vendorId: number;
  name: string;
  frequency: BasketFrequency;
  status: BasketStatus;
  nextOrderDate: string;
  createdAt: string;
  items?: RecurringBasketItem[];
}

export interface RecurringBasketItem {
  id?: number;
  basketId?: number;
  productId: number;
  productType: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface DeliveryBatch {
  id: number;
  slotId: number;
  towerIdentifier: string;
  assignedUserId?: number;
  createdAt: string;
  orders?: DeliveryBatchOrder[];
}

export interface DeliveryBatchOrder {
  id: number;
  batchId: number;
  orderId: number;
  orderType: string;
  flatNumber: string;
  deliveredAt?: string;
  deliveryNotes?: string;
}

export interface OrderRefund {
  id: number;
  communityId: number;
  orderId: number;
  orderType: string;
  requestedBy: number;
  triggerType: RefundTrigger;
  amount: number;
  status: RefundStatus;
  autoApproved: boolean;
  itemDetails?: string;
  reviewedBy?: number;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorPrepSummary {
  vendorId: number;
  orderType: string;
  avgPrepMinutes: number;
  onTimePct: number;
  totalOrders: number;
}

const foodOpsService = {
  // Slots
  getSlotTemplates: (communityId: number): Promise<DeliverySlotTemplate[]> =>
    apiClient.get(`/api/food/slots/templates?communityId=${communityId}`),

  createSlotTemplate: (template: Partial<DeliverySlotTemplate>): Promise<DeliverySlotTemplate> =>
    apiClient.post('/api/food/slots/templates', template),

  getAvailableSlots: (communityId: number, date: string): Promise<DeliverySlot[]> =>
    apiClient.get(`/api/food/slots?communityId=${communityId}&date=${date}`),

  bookSlot: (slotId: number): Promise<void> =>
    apiClient.post(`/api/food/slots/${slotId}/book`, {}),

  // Stock
  markOutOfStock: (payload: { vendorId: number; productId: number; productType: string; communityId: number; updatedBy?: number; restockDate?: string }): Promise<void> =>
    apiClient.post('/api/food/stock/out-of-stock', payload),

  markInStock: (payload: { vendorId: number; productId: number; productType: string; updatedBy?: number }): Promise<void> =>
    apiClient.post('/api/food/stock/in-stock', payload),

  getSubstitutes: (vendorId: number, productId: number, productType: string): Promise<RecurringBasketItem[]> =>
    apiClient.get(`/api/food/stock/substitutes?vendorId=${vendorId}&productId=${productId}&productType=${productType}`),

  // Baskets
  getMyBaskets: (): Promise<RecurringBasket[]> =>
    apiClient.get('/api/food/baskets'),

  createBasket: (basket: Partial<RecurringBasket>): Promise<RecurringBasket> =>
    apiClient.post('/api/food/baskets', basket),

  updateBasket: (id: number, updates: Partial<RecurringBasket>): Promise<RecurringBasket> =>
    apiClient.put(`/api/food/baskets/${id}`, updates),

  pauseBasket: (id: number): Promise<void> =>
    apiClient.post(`/api/food/baskets/${id}/pause`, {}),

  resumeBasket: (id: number): Promise<void> =>
    apiClient.post(`/api/food/baskets/${id}/resume`, {}),

  cancelBasket: (id: number): Promise<void> =>
    apiClient.delete(`/api/food/baskets/${id}`),

  // Batches
  createBatches: (slotId: number, orders: DeliveryBatchOrder[]): Promise<DeliveryBatch[]> =>
    apiClient.post(`/api/food/batches/slot/${slotId}/create-batches`, orders),

  getBatchesForSlot: (slotId: number): Promise<DeliveryBatch[]> =>
    apiClient.get(`/api/food/batches/slot/${slotId}`),

  assignDeliveryPerson: (batchId: number, userId: number): Promise<void> =>
    apiClient.put(`/api/food/batches/${batchId}/assign`, { userId }),

  markOrderDelivered: (batchOrderId: number, notes?: string): Promise<void> =>
    apiClient.put(`/api/food/batches/order/${batchOrderId}/delivered`, { notes: notes ?? '' }),

  // Refunds
  initiateRefund: (payload: { orderId: number; orderType: string; triggerType: RefundTrigger; amount: number; itemDetails?: string }): Promise<OrderRefund> =>
    apiClient.post('/api/food/refunds', payload),

  getRefunds: (status?: string): Promise<OrderRefund[]> =>
    apiClient.get(`/api/food/refunds${status ? `?status=${status}` : ''}`),

  reviewRefund: (id: number, approve: boolean, notes?: string): Promise<OrderRefund> =>
    apiClient.put(`/api/food/refunds/${id}/review`, { approve, notes }),

  // Analytics
  getPrepAnalytics: (vendorId: number, from: string, to: string): Promise<VendorPrepSummary> =>
    apiClient.get(`/api/food/analytics/prep?vendorId=${vendorId}&from=${from}&to=${to}`),
};

export default foodOpsService;
