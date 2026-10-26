import { apiClient } from "../common/apiClient";

export type BarrierAction = "OPEN" | "HOLD" | "DENY";

export interface AnprGateEventResponse {
  id: number;
  gateId: string;
  direction: "ENTRY" | "EXIT" | string;
  plateNumber: string | null;
  confidence: number | null;
  anprStatus: string | null;
  barrierAction: BarrierAction;
  matchedResidentName: string | null;
  matchedVehicleId: number | null;
  matchedVisitorPassId: number | null;
  processingMs: number | null;
  createdAt: string;
}

export interface AnprGateSummaryResponse {
  totalEventsToday: number;
  openCount: number;
  holdCount: number;
  denyCount: number;
  pendingAlerts: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const anprService = {
  async getEvents(gateId?: string, page = 0, size = 50): Promise<PageResponse<AnprGateEventResponse>> {
    const params = new URLSearchParams();
    if (gateId) params.append("gateId", gateId);
    params.append("page", page.toString());
    params.append("size", size.toString());
    return apiClient.get<PageResponse<AnprGateEventResponse>>(`/parking/anpr/events?${params.toString()}`);
  },

  async getPlateHistory(plate: string): Promise<AnprGateEventResponse[]> {
    return apiClient.get<AnprGateEventResponse[]>(`/parking/anpr/plates/${encodeURIComponent(plate)}/history`);
  },

  async getPendingAlerts(): Promise<AnprGateEventResponse[]> {
    return apiClient.get<AnprGateEventResponse[]>("/parking/anpr/alerts/pending");
  },

  async getSummary(): Promise<AnprGateSummaryResponse> {
    return apiClient.get<AnprGateSummaryResponse>("/parking/anpr/summary");
  }
};