import { apiClient } from '../common/apiClient';

export type SlotStatus = 'OPEN' | 'FULL' | 'CUTOFF_PASSED' | 'CANCELLED' | 'CUTOFF';
export type BasketFrequency = 'DAILY' | 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY';
export type BasketStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';
export type ColdChainType = 'AMBIENT' | 'CHILLED' | 'FROZEN';
export type RefundStatus = 'PENDING' | 'AUTO_APPROVED' | 'APPROVED' | 'REJECTED' | 'PROCESSED' | 'INITIATED';
export type RefundTrigger =
  | 'OUT_OF_STOCK' | 'SUBSTITUTION_REJECTED' | 'LATE_DELIVERY'
  | 'QUALITY_ISSUE' | 'WRONG_ITEM' | 'CANCELLED_BY_VENDOR' | 'MANUAL'
// Runtime constants for bundler/Babel compatibility when imported as values
export const SlotStatus = {};
export const BasketFrequency = {};
export const BasketStatus = {};
export const ColdChainType = {};
export const RefundStatus = {};
export const RefundTrigger = {};
export const SlotTemplateDto = {};
export const DeliverySlotTemplate = {};
export const DeliverySlotDto = {};
export const DeliverySlot = {};
export const SubstituteDto = {};
export const StockItemDto = {};
export const RecurringBasketItemDto = {};
export const RecurringBasketItem = {};
export const RecurringBasketDto = {};
export const RecurringBasket = {};
export const BatchOrderDto = {};
export const DeliveryBatchOrder = {};
export const DeliveryBatchDto = {};
export const DeliveryBatch = {};
export const RefundDto = {};
export const OrderRefund = {};
export const PrepAnalyticsEntryDto = {};
export const PrepAnalyticsSummaryDto = {};
export const VendorPrepSummary = {};

export interface SlotTemplateDto {
  id: number;
  dayOfWeek?: number;
  slotStart?: string;
  slotEnd?: string;
  cutoffHours?: number;
  capacity?: number;
  active?: boolean;
  communityId?: number;
  vendorId?: number;
  startTime?: string;
  endTime?: string;
  capacityPerSlot?: number;
  cutoffMinutesBefore?: number;
  activeDays?: string;
}

export type DeliverySlotTemplate = SlotTemplateDto;

export interface DeliverySlotDto {
  id: number;
  slotDate: string;
  slotStart?: string;
  slotEnd?: string;
  startTime?: string;
  endTime?: string;
  cutoffAt?: string;
  capacity: number;
  bookedCount: number;
  status: SlotStatus;
  templateId?: number;
  communityId?: number;
  vendorId?: number;
}

export type DeliverySlot = DeliverySlotDto;

export interface SubstituteDto {
  id: number;
  substituteProductId: number;
  substituteProductName?: string;
  priority: number;
}

export interface StockItemDto {
  productId: number;
  productName: string;
  productType: string;
  inStock: boolean;
  restockDate?: string;
  substitutes: SubstituteDto[];
}

export interface RecurringBasketItemDto {
  id?: number;
  basketId?: number;
  productId: number;
  productName: string;
  productType?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  acceptSubstitute?: boolean;
}

export type RecurringBasketItem = RecurringBasketItemDto;

export interface RecurringBasketDto {
  id: number;
  name: string;
  frequency: BasketFrequency;
  nextOrderDate: string;
  status: BasketStatus;
  items?: RecurringBasketItemDto[];
  vendorId?: number;
  vendorName?: string;
  communityId?: number;
  userId?: number;
  slotId?: number;
  createdAt?: string;
}

export type RecurringBasket = RecurringBasketDto;

export interface BatchOrderDto {
  id: number;
  orderId: number;
  flatNumber: string;
  coldChain?: ColdChainType;
  delivered?: boolean;
  deliveredAt?: string;
  batchId?: number;
  orderType?: string;
  deliveryNotes?: string;
}

export type DeliveryBatchOrder = BatchOrderDto;

export interface DeliveryBatchDto {
  id: number;
  towerName?: string;
  towerIdentifier?: string;
  orderCount?: number;
  assignedTo?: string;
  assignedUserId?: number;
  orders?: BatchOrderDto[];
  slotId?: number;
  createdAt?: string;
}

export type DeliveryBatch = DeliveryBatchDto;

export interface RefundDto {
  id: number;
  orderId: number;
  orderType?: string;
  residentName?: string;
  trigger?: RefundTrigger;
  triggerType?: RefundTrigger;
  amount: number;
  status: RefundStatus;
  autoApproved: boolean;
  notes?: string;
  itemDetails?: string;
  reviewedBy?: number;
  reviewNotes?: string;
  communityId?: number;
  requestedBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type OrderRefund = RefundDto;

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

export interface VendorPrepSummary {
  vendorId: number;
  orderType: string;
  avgPrepMinutes: number;
  onTimePct: number;
  totalOrders: number;
}

export const foodOpsService = {
  // Slots
  getSlots: (vendorId: number, communityId: number, date?: string): Promise<DeliverySlotDto[]> => {
    const params = new URLSearchParams({ vendorId: String(vendorId), communityId: String(communityId) });
    if (date) params.set('date', date);
    return apiClient.get(`/food/slots?${params}`);
  },

  getAvailableSlots: (communityId: number, date: string): Promise<DeliverySlotDto[]> =>
    apiClient.get(`/api/food/slots?communityId=${communityId}&date=${date}`),

  getSlotTemplates: (first: number, second?: number): Promise<SlotTemplateDto[]> => {
    if (second !== undefined) {
      return apiClient.get(`/food/slots/templates?vendorId=${first}&communityId=${second}`);
    }
    return apiClient.get(`/api/food/slots/templates?communityId=${first}`);
  },

  createSlotTemplate: (body: Partial<SlotTemplateDto>): Promise<SlotTemplateDto> =>
    apiClient.post('/food/slots/templates', body),

  updateSlotTemplate: (id: number, body: Partial<SlotTemplateDto>): Promise<SlotTemplateDto> =>
    apiClient.put(`/food/slots/templates/${id}`, body),

  bookSlot: (slotId: number): Promise<void> =>
    apiClient.post(`/food/slots/${slotId}/book`, {}),

  // Stock
  markOutOfStock: (arg1: any, arg2?: any, arg3?: any, arg4?: any): Promise<void> => {
    if (typeof arg1 === 'object') {
      return apiClient.post('/api/food/stock/out-of-stock', arg1);
    }
    return apiClient.post('/food/stock/out-of-stock', { vendorId: arg1, productId: arg2, productType: arg3, restockDate: arg4 });
  },

  markInStock: (arg1: any, arg2?: any, arg3?: any): Promise<void> => {
    if (typeof arg1 === 'object') {
      return apiClient.post('/api/food/stock/in-stock', arg1);
    }
    return apiClient.post('/food/stock/in-stock', { vendorId: arg1, productId: arg2, productType: arg3 });
  },

  getSubstitutes: (vendorId: number, productId: number, productType: string): Promise<any> =>
    apiClient.get(`/food/stock/substitutes?vendorId=${vendorId}&productId=${productId}&productType=${productType}`),

  addSubstitute: (body: { vendorId: number; productId: number; productType: string; substituteProductId: number; priority: number }): Promise<SubstituteDto> =>
    apiClient.post('/food/stock/substitutes', body),

  removeSubstitute: (id: number): Promise<void> =>
    apiClient.delete(`/food/stock/substitutes/${id}`),

  // Baskets
  getBaskets: (): Promise<RecurringBasketDto[]> =>
    apiClient.get('/food/baskets'),

  getMyBaskets: (): Promise<RecurringBasketDto[]> =>
    apiClient.get('/api/food/baskets'),

  createBasket: (body: Partial<RecurringBasketDto>): Promise<RecurringBasketDto> =>
    apiClient.post('/food/baskets', body),

  updateBasket: (id: number, body: Partial<RecurringBasketDto>): Promise<RecurringBasketDto> =>
    apiClient.put(`/food/baskets/${id}`, body),

  pauseBasket: (id: number): Promise<void> =>
    apiClient.post(`/food/baskets/${id}/pause`, {}),

  resumeBasket: (id: number): Promise<void> =>
    apiClient.post(`/food/baskets/${id}/resume`, {}),

  cancelBasket: (id: number): Promise<void> =>
    apiClient.delete(`/food/baskets/${id}`),

  deleteBasket: (id: number): Promise<void> =>
    apiClient.delete(`/food/baskets/${id}`),

  // Batches
  createBatches: (slotId: number, orders?: DeliveryBatchOrder[]): Promise<DeliveryBatchDto[]> => {
    if (orders) {
      return apiClient.post(`/api/food/batches/slot/${slotId}/create-batches`, orders);
    }
    return apiClient.post(`/food/batches/slot/${slotId}/create-batches`);
  },

  getBatches: (slotId: number): Promise<DeliveryBatchDto[]> =>
    apiClient.get(`/food/batches/slot/${slotId}`),

  getBatchesForSlot: (slotId: number): Promise<DeliveryBatchDto[]> =>
    apiClient.get(`/api/food/batches/slot/${slotId}`),

  assignBatch: (batchId: number, userId: number, name: string): Promise<void> =>
    apiClient.put(`/food/batches/${batchId}/assign`, { userId, name }),

  assignDeliveryPerson: (batchId: number, userId: number): Promise<void> =>
    apiClient.put(`/api/food/batches/${batchId}/assign`, { userId }),

  markOrderDelivered: (batchOrderId: number, notes?: string): Promise<void> =>
    apiClient.put(`/food/batches/order/${batchOrderId}/delivered`, { notes: notes ?? '' }),

  // Refunds
  createRefund: (body: { orderId: number; trigger: RefundTrigger; amount: number; notes?: string }): Promise<RefundDto> =>
    apiClient.post('/food/refunds', body),

  initiateRefund: (payload: { orderId: number; orderType: string; triggerType: RefundTrigger; amount: number; itemDetails?: string }): Promise<RefundDto> =>
    apiClient.post('/api/food/refunds', payload),

  getRefunds: (first?: any, second?: any): Promise<RefundDto[]> => {
    if (typeof first === 'number') {
      const params = new URLSearchParams({ communityId: String(first) });
      if (second) params.set('status', second);
      return apiClient.get(`/food/refunds?${params}`);
    }
    return apiClient.get(`/api/food/refunds${first ? `?status=${first}` : ''}`);
  },

  reviewRefund: (id: number, approve: boolean, notes?: string): Promise<any> =>
    apiClient.put(`/food/refunds/${id}/review`, { approved: approve, approve, notes }),

  // Analytics
  startPrep: (orderId: number): Promise<void> =>
    apiClient.post(`/food/analytics/prep/${orderId}/start`),

  completePrep: (orderId: number): Promise<void> =>
    apiClient.post(`/food/analytics/prep/${orderId}/complete`),

  getPrepAnalytics: (vendorId: number, from: string, to: string): Promise<any> =>
    apiClient.get(`/food/analytics/prep?vendorId=${vendorId}&from=${from}&to=${to}`),
};

export default foodOpsService;

