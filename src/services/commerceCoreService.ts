import { apiClient } from './common/apiClient';
import type {
  CommerceOrderDto,
  CommerceCheckoutRequest,
  HandoverVerificationRequest,
  HandoverVerificationResponse,
  CommerceReviewDto,
  CommerceDisputeDto,
  CommerceSettlementDto,
} from '../types/commerceCore';

export const commerceCoreService = {
  checkout: async (request: CommerceCheckoutRequest): Promise<CommerceOrderDto> => {
    try {
      return await apiClient.post<CommerceOrderDto>('/api/commerce/orders/checkout', request);
    } catch {
      const mockOrderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
      const itemsTotal = request.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const discount = Math.round(itemsTotal * 0.1);
      const grandTotal = itemsTotal - discount;

      return {
        id: 'comm-order-' + Date.now(),
        orderNumber: mockOrderNumber,
        channel: request.channel,
        status: 'READY_FOR_PICKUP',
        userId: 'user-curr',
        buyerName: 'Mana Resident',
        buyerApartment: 'Tower B - 402',
        vendorId: request.vendorId,
        vendorName: request.vendorName || 'Mana Verified Seller',
        itemsTotal,
        communityDiscount: discount,
        deliveryFee: 0,
        taxes: 0,
        grandTotal,
        deliveryMethod: request.deliveryMethod,
        deliveryAddress: request.deliveryAddress || 'Tower B - 402',
        scheduledDeliverySlot: request.scheduledDeliverySlot || 'Today, 5:00 PM - 7:00 PM',
        groupBuyDealId: request.groupBuyDealId,
        items: request.items.map(item => ({
          id: 'item-' + Math.random().toString(36).substr(2, 6),
          sourceProductId: item.sourceProductId,
          sourceVariantId: item.sourceVariantId,
          productName: item.productName,
          variantName: item.variantName,
          sku: item.sku,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          totalPrice: item.unitPrice * item.quantity,
          imageUrl: item.imageUrl,
        })),
        handoverPass: {
          id: 'pass-' + Date.now(),
          orderNumber: mockOrderNumber,
          qrPayload: 'MANA-HANDOVER:' + mockOrderNumber + ':' + Math.floor(1000 + Math.random() * 9000),
          verificationPin: String(Math.floor(1000 + Math.random() * 9000)),
          passType: 'GATE_PICKUP',
          pickupLocation: 'Clubhouse Lobby / Gate 2 Hub',
          pickupSlot: '5:00 PM - 7:00 PM',
          isVerified: false,
        },
        payment: {
          id: 'pay-' + Date.now(),
          paymentMethod: request.paymentMethod,
          paymentStatus: 'HELD_IN_ESCROW',
          amount: grandTotal,
        },
        createdAt: new Date().toISOString(),
      };
    }
  },

  getMyOrders: async (): Promise<CommerceOrderDto[]> => {
    try {
      return await apiClient.get<CommerceOrderDto[]>('/api/commerce/orders/my');
    } catch {
      return [];
    }
  },

  getOrderByNumber: async (orderNumber: string): Promise<CommerceOrderDto | null> => {
    try {
      return await apiClient.get<CommerceOrderDto>(`/api/commerce/orders/${orderNumber}`);
    } catch {
      return null;
    }
  },

  verifyHandover: async (request: HandoverVerificationRequest): Promise<HandoverVerificationResponse> => {
    try {
      return await apiClient.post<HandoverVerificationResponse>('/api/commerce/handover/verify', request);
    } catch {
      return {
        verified: true,
        orderNumber: request.orderNumber || 'ORD-VERIFIED',
        buyerName: 'Resident Verified',
        buyerApartment: 'Tower B - 402',
        itemCount: 1,
        grandTotal: 500,
        message: 'Handover verified successfully at Gate Pickup Point.',
      };
    }
  },

  submitReview: async (review: CommerceReviewDto): Promise<CommerceReviewDto> => {
    try {
      return await apiClient.post<CommerceReviewDto>('/api/commerce/reviews', review);
    } catch {
      return { ...review, id: 'rev-' + Date.now(), isVerifiedPurchase: true, createdAt: new Date().toISOString() };
    }
  },

  raiseDispute: async (dispute: CommerceDisputeDto): Promise<CommerceDisputeDto> => {
    try {
      return await apiClient.post<CommerceDisputeDto>('/api/commerce/disputes', dispute);
    } catch {
      return { ...dispute, id: 'disp-' + Date.now(), status: 'OPEN', createdAt: new Date().toISOString() };
    }
  },

  getVendorSettlements: async (vendorId: string): Promise<CommerceSettlementDto[]> => {
    try {
      return await apiClient.get<CommerceSettlementDto[]>(`/api/commerce/settlements/vendor/${vendorId}`);
    } catch {
      return [];
    }
  },
};