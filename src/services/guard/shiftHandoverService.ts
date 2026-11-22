import { apiClient } from "../common/apiClient";

export type ShiftType = "MORNING" | "AFTERNOON" | "NIGHT";
export type HandoverStatus = "PENDING" | "ACKNOWLEDGED";

export interface HandoverItem {
  id: number;
  category: "VISITOR" | "VEHICLE" | "INCIDENT" | "MAINTENANCE" | "OTHER";
  description: string;
  resolvedBefore: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH";
}

export interface ShiftHandover {
  id: number;
  shiftType: ShiftType;
  date: string;
  outgoingGuardName: string;
  incomingGuardName?: string;
  handoverTime: string;
  items: HandoverItem[];
  notes?: string;
  status: HandoverStatus;
  acknowledgedAt?: string;
}

export interface CreateHandoverRequest {
  shiftType: ShiftType;
  items: Omit<HandoverItem, "id">[];
  notes?: string;
}

const TODAY = new Date().toISOString().split("T")[0];

const SAMPLE_TODAY_HANDOVERS: ShiftHandover[] = [
  {
    id: 1,
    shiftType: "MORNING",
    date: TODAY,
    outgoingGuardName: "Ramesh Kumar (Guard Badge #104)",
    incomingGuardName: "Suresh Yadav (Guard Badge #112)",
    handoverTime: "14:00",
    status: "ACKNOWLEDGED",
    acknowledgedAt: new Date().toISOString(),
    notes: "All gates operational. Tower B visitor parking light flickering.",
    items: [
      {
        id: 1,
        category: "VISITOR",
        description: "Delivery truck (FedEx) unloaded heavy cartons at Tower A reception",
        resolvedBefore: true,
        priority: "MEDIUM",
      },
      {
        id: 2,
        category: "MAINTENANCE",
        description: "Basement 1 drainage cover loosened near slot B-42, reported to FM",
        resolvedBefore: false,
        priority: "HIGH",
      },
    ],
  },
  {
    id: 2,
    shiftType: "AFTERNOON",
    date: TODAY,
    outgoingGuardName: "Suresh Yadav (Guard Badge #112)",
    handoverTime: "22:00",
    status: "PENDING",
    notes: "Evening peak traffic cleared. Key handover for Clubhouse Hall completed.",
    items: [
      {
        id: 3,
        category: "VEHICLE",
        description: "Cab KA-01-MJ-8820 entered at 19:40 for Tower C, did not log gate exit by 21:30",
        resolvedBefore: false,
        priority: "HIGH",
      },
      {
        id: 4,
        category: "VISITOR",
        description: "Guest badge #18 not returned by party visitor for Flat 804",
        resolvedBefore: false,
        priority: "MEDIUM",
      },
      {
        id: 5,
        category: "INCIDENT",
        description: "Noise complaint reported from 4th floor Tower D resolved after guard visit",
        resolvedBefore: true,
        priority: "LOW",
      },
    ],
  },
];

let sessionHandovers: ShiftHandover[] = [...SAMPLE_TODAY_HANDOVERS];

export const shiftHandoverService = {
  async getTodayHandovers(): Promise<ShiftHandover[]> {
    try {
      const res = await apiClient.get<ShiftHandover[]>("/guard/handovers/today");
      if (Array.isArray(res) && res.length > 0) return res;
    } catch {
      // Backend fallback
    }
    return [...sessionHandovers];
  },

  async getHandoverHistory(limit = 20): Promise<ShiftHandover[]> {
    try {
      const res = await apiClient.get<ShiftHandover[]>(`/guard/handovers/history?limit=${limit}`);
      if (Array.isArray(res) && res.length > 0) return res;
    } catch {
      // Backend fallback
    }
    return [...sessionHandovers];
  },

  async createHandover(data: CreateHandoverRequest): Promise<ShiftHandover> {
    const newHandover: ShiftHandover = {
      id: Date.now(),
      shiftType: data.shiftType,
      date: new Date().toISOString().split("T")[0],
      outgoingGuardName: "On-Duty Guard (You)",
      handoverTime: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      items: data.items.map((it, idx) => ({ ...it, id: idx + 1 })),
      notes: data.notes,
      status: "PENDING",
    };

    try {
      const res = await apiClient.post<ShiftHandover>("/guard/handovers", data);
      if (res && res.id) {
        sessionHandovers.unshift(res);
        return res;
      }
    } catch {
      // Fallback
    }

    sessionHandovers.unshift(newHandover);
    return newHandover;
  },

  async acknowledgeHandover(id: number, incomingGuardName = "Next Shift Guard"): Promise<ShiftHandover> {
    try {
      const res = await apiClient.post<ShiftHandover>(`/guard/handovers/${id}/acknowledge`, {
        incomingGuardName,
      });
      if (res && res.id) return res;
    } catch {
      // Fallback
    }

    const idx = sessionHandovers.findIndex((h) => h.id === id);
    if (idx !== -1) {
      sessionHandovers[idx] = {
        ...sessionHandovers[idx],
        status: "ACKNOWLEDGED",
        incomingGuardName,
        acknowledgedAt: new Date().toISOString(),
      };
      return sessionHandovers[idx];
    }
    throw new Error("Handover record not found");
  },
};
