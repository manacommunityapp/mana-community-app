import { apiClient } from "../common/apiClient";

export interface EventZoneDto {
  id: string;
  name: string;
  capacity: number;
  occupied: number;
  type: string;
  color: string;
}

export interface EventFacilityDto {
  name: string;
  status: "ok" | "warning" | "error";
  note: string;
}

export interface EventVenueConfigDto {
  id?: number;
  eventId?: number;
  communityId?: number;
  venueName?: string;
  zonesJson?: string;
  facilitiesJson?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_ZONES: EventZoneDto[] = [
  { id: "A", name: "Main Stage", capacity: 2000, occupied: 1650, type: "Stage", color: "#6366f1" },
  { id: "B", name: "Dining Hall", capacity: 500, occupied: 320, type: "Food", color: "#10b981" },
  { id: "C", name: "Registration Area", capacity: 100, occupied: 42, type: "Admin", color: "#0891b2" },
  { id: "D", name: "Amphitheatre", capacity: 800, occupied: 600, type: "Cultural", color: "#8b5cf6" },
  { id: "E", name: "Ground A", capacity: 300, occupied: 200, type: "Sports", color: "#4f46e5" },
  { id: "F", name: "Parking Lot", capacity: 400, occupied: 285, type: "Parking", color: "#d97706" },
  { id: "G", name: "Medical Camp", capacity: 20, occupied: 4, type: "Medical", color: "#be185d" },
  { id: "H", name: "VIP Lounge", capacity: 50, occupied: 28, type: "VIP", color: "#f59e0b" },
];

export const DEFAULT_FACILITIES: EventFacilityDto[] = [
  { name: "Power Supply", status: "ok", note: "Generator backup active" },
  { name: "WiFi Coverage", status: "ok", note: "6 access points deployed" },
  { name: "Medical Team", status: "ok", note: "2 doctors, 4 paramedics" },
  { name: "Security", status: "ok", note: "48 guards, 12 CCTV cams" },
  { name: "Parking", status: "warning", note: "71% capacity – monitor" },
  { name: "Air Cooling", status: "ok", note: "8 industrial fans active" },
];

export const eventVenueService = {
  async getVenueConfig(eventId?: number, communityId?: number): Promise<{
    id?: number;
    venueName: string;
    zones: EventZoneDto[];
    facilities: EventFacilityDto[];
  }> {
    try {
      const params = new URLSearchParams();
      if (eventId) params.append("eventId", String(eventId));
      if (communityId) params.append("communityId", String(communityId));

      const res = await apiClient.get<EventVenueConfigDto>(`/events/venues/config?${params.toString()}`);
      if (res && (res.zonesJson || res.facilitiesJson)) {
        return {
          id: res.id,
          venueName: res.venueName || "Main Community Grounds",
          zones: res.zonesJson ? JSON.parse(res.zonesJson) : DEFAULT_ZONES,
          facilities: res.facilitiesJson ? JSON.parse(res.facilitiesJson) : DEFAULT_FACILITIES,
        };
      }
    } catch (e) {
      console.warn("Could not fetch venue config from backend:", e);
    }
    return {
      venueName: "Main Community Grounds",
      zones: DEFAULT_ZONES,
      facilities: DEFAULT_FACILITIES,
    };
  },

  async saveVenueConfig(data: {
    id?: number;
    eventId?: number;
    communityId?: number;
    venueName?: string;
    zones: EventZoneDto[];
    facilities: EventFacilityDto[];
  }): Promise<EventVenueConfigDto> {
    const payload: EventVenueConfigDto = {
      id: data.id,
      eventId: data.eventId,
      communityId: data.communityId,
      venueName: data.venueName || "Main Community Grounds",
      zonesJson: JSON.stringify(data.zones),
      facilitiesJson: JSON.stringify(data.facilities),
    };
    try {
      return await apiClient.post<EventVenueConfigDto>("/events/venues/config", payload);
    } catch (e) {
      console.warn("Failed to save venue config to backend:", e);
      return payload;
    }
  },
};
