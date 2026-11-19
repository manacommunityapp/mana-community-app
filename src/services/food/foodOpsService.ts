import { apiClient } from '../common/apiClient';

export type SlotStatus = 'OPEN' | 'FULL' | 'CUTOFF_PASSED' | 'CANCELLED';
export type BasketFrequency = 'DAILY' | 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY';
export type ColdChainType = 'AMBIENT' | 'CHILLED' | 'FROZEN';
export type RefundStatus = 'PENDING' | 'AUTO_APPROVED' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
export type RefundTrigger =
  | 'OUT_OF_STOCK' | 'SUBSTITUTION_REJECTED' | 'LATE_DELIVERY'
  | 'QUALITY_ISSUE' | 'WRONG_ITEM' | 'CANCELLED_BY_VENDOR' | 'MANUAL';

export interface SlotTemplateDto {
  id: number;
  dayOfWeek: number;
  slotStart: string;
  slotEnd: string;
  cutoffHours: number;
  capacity: number;
  active: boolean;
}

export interface DeliverySlotDto {
  id: number;
  slotDate: string;
  slotStart: string;
  slotEnd: string;
  cutoffAt: string;
  capacity: number;
  bookedCount: number;
  status: SlotStatus;
}

export interface StockItemDto {
  productId: number;
  productName: string;
  productType: string;
  inStock: boolean;
  restockDate?: string;
  substitutes: SubstituteDto[];
}

export interface SubstituteDto {
  id: number;
  substituteProductId: number;
  substituteProductName: string;
  priority: number;
}

export interface RecurringBasketItemDto {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  acceptSubstitute: boolean;
}

export interface RecurringBasketDto {
  id: number;
  name: string;
  frequency: BasketFrequency;
  nextOrderDate: string;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  items: RecurringBasketItemDto[];
  vendorId: number;
  vendorName: string;
  slotId?: number;
}

export interface BatchOrderDto {
  id: number;
  orderId: number;
  flatNumber: string;
  coldChain: ColdChainType;
  delivered: boolean;
  deliveredAt?: string;
}

export interface DeliveryBatchDto {
  id: number;
  towerName: string;
  orderCount: number;
  assignedTo?: string;
  assignedUserId?: number;
  orders: BatchOrderDto[];
}

export interface RefundDto {
  id: number;
  orderId: number;
  residentName: string;
  trigger: RefundTrigger;
  amount: number;
  status: RefundStatus;
  autoApproved: boolean;
  notes?: string;
  createdAt: string;
}

export interface PrepAnalyticsEntryDto {
  orderId: number;
  prepStartAt?: string;
  prepCompleteAt?: string;
  durationMinutes?: number;
  onTime: boolean;
  orderDate: string;
}

export interface PrepAnalyticsSummaryDto {
  avgPrepMinutes: number;
  onTimePercent: number;
  totalOrders: number;
  lateOrders: number;
  dailyStats: { date: string; orderCount: number; avgPrepMinutes: number }[];
  recentOrders: PrepAnalyticsEntryDto[];
}

export const foodOpsService = {
  // Slots
  getSlots: (vendorId: number, communityId: number, date?: string): Promise<DeliverySlotDto[]> => {
    const params = new URLSearchParams({ vendorId: String(vendorId), communityId: String(communityId) });
    if (date) params.set('date', date);
    return apiClient.get(`/food/slots?${params}`);
  },
  getSlotTemplates: (vendorId: number, communityId: number): Promise<SlotTemplateDto[]> =>
    apiClient.get(`/food/slots/templates?vendorId=${vendorId}&communityId=${communityId}`),
  createSlotTemplate: (body: Partial<SlotTemplateDto>): Promise<SlotTemplateDto> =>
    apiClient.post('/food/slots/templates', body),
  updateSlotTemplate: (id: number, body: Partial<SlotTemplateDto>): Promise<SlotTemplateDto> =>
    apiClient.put(`/food/slots/templates/${id}`, body),
  bookSlot: (slotId: number): Promise<void> =>
    apiClient.post(`/food/slots/${slotId}/book`),

  // Stock
  markOutOfStock: (vendorId: number, productId: number, productType: string, restockDate?: string): Promise<void> =>
    apiClient.post('/food/stock/out-of-stock', { vendorId, productId, productType, restockDate }),
  markInStock: (vendorId: number, productId: number, productType: string): Promise<void> =>
    apiClient.post('/food/stock/in-stock', { vendorId, productId, productType }),
  getSubstitutes: (vendorId: number, productId: number, productType: string): Promise<SubstituteDto[]> =>
    apiClient.get(`/food/stock/substitutes?vendorId=${vendorId}&productId=${productId}&productType=${productType}`),
  addSubstitute: (body: { vendorId: number; productId: number; productType: string; substituteProductId: number; priority: number }): Promise<SubstituteDto> =>
    apiClient.post('/food/stock/substitutes', body),
  removeSubstitute: (id: number): Promise<void> =>
    apiClient.delete(`/food/stock/substitutes/${id}`),

  // Baskets
  getBaskets: (): Promise<RecurringBasketDto[]> =>
    apiClient.get('/food/baskets'),
  createBasket: (body: Partial<RecurringBasketDto>): Promise<RecurringBasketDto> =>
    apiClient.post('/food/baskets', body),
  updateBasket: (id: number, body: Partial<RecurringBasketDto>): Promise<RecurringBasketDto> =>
    apiClient.put(`/food/baskets/${id}`, body),
  pauseBasket: (id: number): Promise<void> =>
    apiClient.post(`/food/baskets/${id}/pause`),
  resumeBasket: (id: number): Promise<void> =>
    apiClient.post(`/food/baskets/${id}/resume`),
  deleteBasket: (id: number): Promise<void> =>
    apiClient.delete(`/food/baskets/${id}`),

  // Batches
  createBatches: (slotId: number): Promise<DeliveryBatchDto[]> =>
    apiClient.post(`/food/batches/slot/${slotId}/create-batches`),
  getBatches: (slotId: number): Promise<DeliveryBatchDto[]> =>
    apiClient.get(`/food/batches/slot/${slotId}`),
  assignBatch: (batchId: number, userId: number, name: string): Promise<void> =>
    apiClient.put(`/food/batches/${batchId}/assign`, { userId, name }),
  markOrderDelivered: (batchOrderId: number): Promise<void> =>
    apiClient.put(`/food/batches/order/${batchOrderId}/delivered`),

  // Refunds
  createRefund: (body: { orderId: number; trigger: RefundTrigger; amount: number; notes?: string }): Promise<RefundDto> =>
    apiClient.post('/food/refunds', body),
  getRefunds: (communityId: number, status?: RefundStatus): Promise<RefundDto[]> => {
    const params = new URLSearchParams({ communityId: String(communityId) });
    if (status) params.set('status', status);
    return apiClient.get(`/food/refunds?${params}`);
  },
  reviewRefund: (id: number, approved: boolean, notes?: string): Promise<void> =>
    apiClient.put(`/food/refunds/${id}/review`, { approved, notes }),

  // Analytics
  startPrep: (orderId: number): Promise<void> =>
    apiClient.post(`/food/analytics/prep/${orderId}/start`),
  completePrep: (orderId: number): Promise<void> =>
    apiClient.post(`/food/analytics/prep/${orderId}/complete`),
  getPrepAnalytics: (vendorId: number, from: string, to: string): Promise<PrepAnalyticsSummaryDto> =>
    apiClient.get(`/food/analytics/prep?vendorId=${vendorId}&from=${from}&to=${to}`),
};
