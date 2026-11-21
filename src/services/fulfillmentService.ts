import { apiClient } from "./common/apiClient";

export type FulfillmentEventType =
  | "PLACED"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "PICKED_UP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export interface FulfillmentEvent {
  id: number;
  orderId: string;
  eventType: FulfillmentEventType;
  actorRole?: string;
  note?: string;
  occurredAt: string;
}

export interface DeliveryAssignment {
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;
  estimatedArrival?: string;
  status: string;
}

export const fulfillmentService = {
  async getTimeline(orderId: string): Promise<FulfillmentEvent[]> {
    return apiClient.get<FulfillmentEvent[]>(`/api/orders/${orderId}/fulfillment/timeline`);
  },
  async getCurrentStatus(orderId: string): Promise<FulfillmentEventType> {
    const r = await apiClient.get<{ status: FulfillmentEventType }>(`/api/orders/${orderId}/fulfillment/status`);
    return r.status;
  },
  async getDeliveryAssignment(orderId: string): Promise<DeliveryAssignment | null> {
    try {
      return await apiClient.get<DeliveryAssignment>(`/api/orders/${orderId}/fulfillment/delivery`);
    } catch {
      return null;
    }
  },
};
