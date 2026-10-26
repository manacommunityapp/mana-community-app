import { apiClient } from "../common/apiClient";

export type BroadcastPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type BroadcastTarget = "ALL" | "RESIDENTS" | "OWNERS" | "TENANTS" | "STAFF";
export type BroadcastStatus = "SENT" | "SCHEDULED" | "CANCELLED";

export interface Broadcast {
  id: number;
  title: string;
  message: string;
  category?: string;
  priority: BroadcastPriority;
  target: BroadcastTarget;
  status: BroadcastStatus;
  scheduledAt?: string;
  createdAt?: string;
  createdBy?: string;
}

export interface SendBroadcastRequest {
  title: string;
  message: string;
  category?: string;
  priority?: BroadcastPriority;
  target?: BroadcastTarget;
  scheduledAt?: string;
}

export const broadcastService = {
  async getBroadcasts(): Promise<Broadcast[]> {
    return apiClient.get<Broadcast[]>("/admin/broadcasts");
  },

  async sendBroadcast(data: SendBroadcastRequest): Promise<Broadcast> {
    return apiClient.post<Broadcast>("/admin/broadcasts", data);
  },

  async deleteBroadcast(id: number): Promise<void> {
    return apiClient.delete(`/admin/broadcasts/${id}`);
  },
};
