import { apiClient } from "../common/apiClient";

export type BusStatus = "AT_SCHOOL" | "EN_ROUTE_HOME" | "EN_ROUTE_SCHOOL" | "ARRIVED" | "IDLE";
export type TripDirection = "TO_SCHOOL" | "FROM_SCHOOL";

export interface BusLocation {
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  updatedAt: string;
}

export interface BusStop {
  id: number;
  name: string;
  eta?: string;
  reached: boolean;
  reachedAt?: string;
  lat?: number;
  lng?: number;
}

export interface SchoolBus {
  id: number;
  busNumber: string;
  driverName: string;
  driverPhone?: string;
  attendantName?: string;
  attendantPhone?: string;
  schoolName: string;
  routeName: string;
  status: BusStatus;
  currentLocation?: BusLocation;
  stops: BusStop[];
  studentsOnboard?: number;
  capacity?: number;
}

export interface RegisteredChild {
  id: number;
  name: string;
  grade: string;
  schoolName: string;
  busId?: number;
  busNumber?: string;
  stopName?: string;
  residentId?: number;
  flatNumber?: string;
  photo?: string;
}

export interface BusTripLog {
  id: number;
  busId: number;
  direction: TripDirection;
  date: string;
  departureTime?: string;
  arrivalTime?: string;
  childPickedUp: boolean;
  pickedUpAt?: string;
  droppedOffAt?: string;
  notes?: string;
}

export interface RegisterChildRequest {
  name: string;
  grade: string;
  schoolName: string;
  busId?: number;
  stopName?: string;
}

export const schoolBusService = {
  async getMyChildren(): Promise<RegisteredChild[]> {
    try {
      const res = await apiClient.get<RegisteredChild[]>("/school-bus/my-children");
      return res || [];
    } catch {
      return [
        {
          id: 1,
          name: "Aarav Sharma",
          grade: "Grade 5-B",
          schoolName: "Delhi Public School (DPS)",
          busId: 101,
          busNumber: "KA-01-SB-4412",
          stopName: "Mana Community Main Gate",
          flatNumber: "Tower 2 - 402"
        }
      ];
    }
  },

  async getAvailableBuses(schoolName?: string): Promise<SchoolBus[]> {
    try {
      const query = schoolName ? `?schoolName=${encodeURIComponent(schoolName)}` : "";
      const res = await apiClient.get<SchoolBus[]>(`/school-bus/buses${query}`);
      return res || [];
    } catch {
      return [
        {
          id: 101,
          busNumber: "KA-01-SB-4412",
          driverName: "Ramesh Gowda",
          driverPhone: "+91 98450 12345",
          attendantName: "Sumitra Devi",
          attendantPhone: "+91 98450 54321",
          schoolName: "Delhi Public School (DPS)",
          routeName: "Route 14 - Sarjapur to Mana Residency",
          status: "EN_ROUTE_HOME",
          currentLocation: {
            lat: 12.9128,
            lng: 77.6835,
            speed: 28,
            heading: 180,
            updatedAt: new Date().toISOString()
          },
          studentsOnboard: 18,
          capacity: 32,
          stops: [
            { id: 1, name: "DPS Campus Gate 2", eta: "02:30 PM", reached: true, reachedAt: "02:35 PM" },
            { id: 2, name: "Carmelaram Junction", eta: "02:50 PM", reached: true, reachedAt: "02:52 PM" },
            { id: 3, name: "Kaikondrahalli Signal", eta: "03:10 PM", reached: false },
            { id: 4, name: "Mana Community Main Gate", eta: "03:25 PM", reached: false }
          ]
        }
      ];
    }
  },

  async getBusById(busId: number): Promise<SchoolBus> {
    const res = await apiClient.get<SchoolBus>(`/school-bus/buses/${busId}`);
    return res;
  },

  async getBusLiveLocation(busId: number): Promise<BusLocation> {
    const res = await apiClient.get<BusLocation>(`/school-bus/buses/${busId}/location`);
    return res;
  },

  async registerChild(data: RegisterChildRequest): Promise<RegisteredChild> {
    return apiClient.post<RegisteredChild>("/school-bus/register-child", data);
  },

  async getTripHistory(childId: number, params?: { limit?: number }): Promise<BusTripLog[]> {
    try {
      const query = params?.limit ? `?limit=${params.limit}` : "";
      const res = await apiClient.get<BusTripLog[]>(`/school-bus/children/${childId}/trips${query}`);
      return res || [];
    } catch {
      return [
        {
          id: 501,
          busId: 101,
          direction: "TO_SCHOOL",
          date: new Date().toISOString().split("T")[0],
          departureTime: "07:35 AM",
          arrivalTime: "08:15 AM",
          childPickedUp: true,
          pickedUpAt: "07:37 AM",
          droppedOffAt: "08:14 AM"
        }
      ];
    }
  },

  async getTodayTrip(childId: number): Promise<BusTripLog | null> {
    try {
      return await apiClient.get<BusTripLog | null>(`/school-bus/children/${childId}/trips/today`);
    } catch {
      return null;
    }
  }
};
