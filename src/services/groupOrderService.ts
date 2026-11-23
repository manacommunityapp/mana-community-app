import { apiClient } from "./common/apiClient";

export interface GroupOrder {
  id: number;
  title: string;
  category: string;
  itemName: string;
  unitPrice?: number;
  unitDescription?: string;
  minQuantity: number;
  totalCommitted: number;
  closesAt: string;
  status: "OPEN" | "FUNDED" | "CLOSED" | "CANCELLED";
  organizer?: string;
  communityId?: number;
}

export interface MyGroupOrderEntry {
  order: GroupOrder;
  quantity: number;
  paymentStatus: "PENDING" | "PAID" | "REFUNDED";
}

export const groupOrderService = {
  getOpen(communityId: number, category?: string): Promise<GroupOrder[]> {
    const params = category
      ? `?communityId=${communityId}&category=${category}`
      : `?communityId=${communityId}`;
    return apiClient.get<GroupOrder[]>(`/group-orders${params}`);
  },

  getMyJoined(): Promise<MyGroupOrderEntry[]> {
    return apiClient.get<MyGroupOrderEntry[]>("/group-orders/my");
  },

  create(data: Partial<GroupOrder> & { communityId: number }): Promise<GroupOrder> {
    return apiClient.post<GroupOrder>("/group-orders", data);
  },

  join(orderId: number, quantity: number): Promise<void> {
    return apiClient.post<void>(`/group-orders/${orderId}/join`, { quantity });
  },

  leave(orderId: number): Promise<void> {
    return apiClient.post<void>(`/group-orders/${orderId}/leave`, {});
  },
};
