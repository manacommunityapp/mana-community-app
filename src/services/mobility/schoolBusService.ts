import { apiClient } from "../common/apiClient";

export interface BusRoute {
  id: number;
  routeNumber: string;
  routeName: string;
  schoolName: string;
  driverName: string;
  driverPhone: string;
  attendantName: string;
  attendantPhone: string;
  busNumber: string;
  capacity: number;
  occupancy: number;
  status: "ON_TIME" | "DELAYED" | "AT_GATE" | "COMPLETED" | "IDLE";
  etaMinutes: number;
  speedKmph: number;
  currentStop: string;
  nextStop: string;
  morningPickupTime: string;
  afternoonDropTime: string;
  liveCoordinates: {
    lat: number;
    lng: number;
    progressPercent: number;
  };
}

export interface StudentPassenger {
  id: number;
  routeId: number;
  studentName: string;
  gradeClass: string;
  parentName: string;
  parentPhone: string;
  unitNumber: string;
  stopName: string;
  rfidCardNumber: string;
  boardingStatus: "BOARDED" | "DEBOARDED" | "ABSENT" | "EXPECTED";
  lastScanTimestamp?: string;
  temperature?: number;
}

export interface GeofenceAlertConfig {
  proximityMeters: number;
  notifyOnSchoolDeparture: boolean;
  notifyOnGateArrival: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
}

export interface BusStop {
  id: number;
  name: string;
  eta: string;
  reached: boolean;
}

export interface SchoolBus {
  id: number;
  busNumber: string;
  routeNumber: string;
  routeName?: string;
  schoolName: string;
  driverName: string;
  driverPhone: string;
  attendantName?: string;
  attendantPhone?: string;
  speedKmph?: number;
  currentSpeedKmph?: number;
  etaMinutes: number;
  capacity: number;
  currentOccupancy?: number;
  studentsOnboard?: number;
  status: string;
  currentLocation?: {
    lat: number;
    lng: number;
    speed?: number;
    updatedAt?: string;
  };
  currentAddress?: string;
  stops: BusStop[];
}

export interface RegisteredChild {
  id: number;
  name: string;
  grade: string;
  schoolName: string;
  stopName: string;
  busId?: number;
  assignedBusId?: number;
  busNumber?: string;
  rfidCardNumber?: string;
  status?: string;
}

export interface BusTripLog {
  id: number;
  childId: number;
  direction?: string;
  date?: string;
  tripDate?: string;
  tripType?: "MORNING_PICKUP" | "AFTERNOON_DROP";
  boardedAt?: string;
  deboardedAt?: string;
  pickedUpAt?: string;
  departureTime?: string;
  droppedOffAt?: string;
  arrivalTime?: string;
  status: "ON_BUS" | "REACHED_SCHOOL" | "REACHED_HOME" | "MISSED";
}

export interface RegisterChildRequest {
  name: string;
  grade: string;
  schoolName: string;
  stopName: string;
  busId?: number;
}

const MOCK_ROUTES: BusRoute[] = [
  {
    id: 1,
    routeNumber: "SB-01",
    routeName: "Route 1: DPS East & Sarjapur Corridor",
    schoolName: "Delhi Public School (DPS) East",
    driverName: "Raghavendra Gowda",
    driverPhone: "+91 98450 12849",
    attendantName: "Lakshmi Bai",
    attendantPhone: "+91 98450 99312",
    busNumber: "KA-01-MJ-8921",
    capacity: 34,
    occupancy: 28,
    status: "ON_TIME",
    etaMinutes: 8,
    speedKmph: 32,
    currentStop: "Wipro SEZ Gate 2",
    nextStop: "Mana Uber Verde - Main Gate",
    morningPickupTime: "07:15 AM",
    afternoonDropTime: "03:45 PM",
    liveCoordinates: {
      lat: 12.9128,
      lng: 77.6834,
      progressPercent: 78,
    },
  },
  {
    id: 2,
    routeNumber: "SB-04",
    routeName: "Route 4: Greenwood High & Varthur Link",
    schoolName: "Greenwood High International",
    driverName: "Murugan Pillai",
    driverPhone: "+91 97410 44821",
    attendantName: "Manjula S.",
    attendantPhone: "+91 97410 55193",
    busNumber: "KA-53-EG-4512",
    capacity: 40,
    occupancy: 36,
    status: "DELAYED",
    etaMinutes: 19,
    speedKmph: 18,
    currentStop: "Carmelaram Railway Bridge",
    nextStop: "Decathlon Sarjapur Junction",
    morningPickupTime: "07:30 AM",
    afternoonDropTime: "04:15 PM",
    liveCoordinates: {
      lat: 12.9084,
      lng: 77.6989,
      progressPercent: 54,
    },
  },
];

const MOCK_PASSENGERS: StudentPassenger[] = [
  {
    id: 101,
    routeId: 1,
    studentName: "Aarav Sharma",
    gradeClass: "Grade 5-B",
    parentName: "Vikram Sharma",
    parentPhone: "+91 98801 23456",
    unitNumber: "Tower A - 402",
    stopName: "Mana Uber Verde - Main Gate",
    rfidCardNumber: "RFID-88192-A",
    boardingStatus: "BOARDED",
    lastScanTimestamp: "03:15 PM (School Campus Exit)",
    temperature: 98.4,
  },
];

const MOCK_CHILDREN: RegisteredChild[] = [
  {
    id: 1,
    name: "Aarav Sharma",
    grade: "Grade 5-B",
    schoolName: "Delhi Public School (DPS) East",
    stopName: "Mana Community Main Gate",
    busId: 1,
    assignedBusId: 1,
    busNumber: "KA-01-MJ-8921",
    rfidCardNumber: "RFID-88192-A",
    status: "ACTIVE",
  },
];

const MOCK_SCHOOL_BUSES: SchoolBus[] = [
  {
    id: 1,
    busNumber: "KA-01-MJ-8921",
    routeNumber: "SB-01",
    routeName: "Route 1: DPS East & Sarjapur Corridor",
    schoolName: "Delhi Public School (DPS) East",
    driverName: "Raghavendra Gowda",
    driverPhone: "+91 98450 12849",
    attendantName: "Lakshmi Bai",
    attendantPhone: "+91 98450 99312",
    speedKmph: 32,
    currentSpeedKmph: 32,
    etaMinutes: 8,
    capacity: 34,
    currentOccupancy: 28,
    studentsOnboard: 28,
    status: "EN_ROUTE_HOME",
    currentLocation: {
      lat: 12.9128,
      lng: 77.6834,
      speed: 32,
      updatedAt: new Date().toISOString(),
    },
    currentAddress: "Wipro SEZ Gate 2, Sarjapur Road",
    stops: [
      { id: 1, name: "DPS East Campus Gate", eta: "03:15 PM", reached: true },
      { id: 2, name: "Wipro SEZ Gate 2", eta: "03:35 PM", reached: true },
      { id: 3, name: "Carmelaram Station", eta: "03:42 PM", reached: false },
      { id: 4, name: "Mana Community Main Gate", eta: "03:50 PM", reached: false },
    ],
  },
];

const MOCK_TRIPS: BusTripLog[] = [
  {
    id: 1,
    childId: 1,
    direction: "TO_SCHOOL",
    date: new Date().toLocaleDateString("en-IN"),
    tripDate: new Date().toISOString().split("T")[0],
    tripType: "MORNING_PICKUP",
    boardedAt: "07:18 AM",
    deboardedAt: "07:48 AM",
    pickedUpAt: "07:18 AM",
    droppedOffAt: "07:48 AM",
    departureTime: "07:18 AM",
    arrivalTime: "07:48 AM",
    status: "REACHED_SCHOOL",
  },
];

export const schoolBusService = {
  async listRoutes(): Promise<BusRoute[]> {
    try {
      const res = await apiClient.get<BusRoute[]>("/mobility/school-bus/routes");
      return res && res.length > 0 ? res : MOCK_ROUTES;
    } catch {
      return MOCK_ROUTES;
    }
  },

  async getRoute(routeId: number): Promise<BusRoute> {
    try {
      return await apiClient.get<BusRoute>(`/mobility/school-bus/routes/${routeId}`);
    } catch {
      const found = MOCK_ROUTES.find((r) => r.id === routeId);
      if (!found) throw new Error("Route not found");
      return found;
    }
  },

  async getPassengers(routeId: number): Promise<StudentPassenger[]> {
    try {
      const res = await apiClient.get<StudentPassenger[]>(`/mobility/school-bus/routes/${routeId}/passengers`);
      return res && res.length > 0 ? res : MOCK_PASSENGERS;
    } catch {
      return MOCK_PASSENGERS.filter((p) => p.routeId === routeId || routeId === 1);
    }
  },

  async updateGeofenceAlerts(routeId: number, config: GeofenceAlertConfig): Promise<GeofenceAlertConfig> {
    try {
      return await apiClient.put<GeofenceAlertConfig>(`/mobility/school-bus/routes/${routeId}/geofence`, config);
    } catch {
      return config;
    }
  },

  async getMyChildren(): Promise<RegisteredChild[]> {
    try {
      const res = await apiClient.get<RegisteredChild[]>("/mobility/school-bus/my-children");
      return res && res.length > 0 ? res : MOCK_CHILDREN;
    } catch {
      return MOCK_CHILDREN;
    }
  },

  async getAvailableBuses(): Promise<SchoolBus[]> {
    try {
      const res = await apiClient.get<SchoolBus[]>("/mobility/school-bus/buses");
      return res && res.length > 0 ? res : MOCK_SCHOOL_BUSES;
    } catch {
      return MOCK_SCHOOL_BUSES;
    }
  },

  async getTripHistory(childId: number): Promise<BusTripLog[]> {
    try {
      const res = await apiClient.get<BusTripLog[]>(`/mobility/school-bus/children/${childId}/trips`);
      return res && res.length > 0 ? res : MOCK_TRIPS;
    } catch {
      return MOCK_TRIPS;
    }
  },

  async registerChild(req: RegisterChildRequest): Promise<RegisteredChild> {
    try {
      return await apiClient.post<RegisteredChild>("/mobility/school-bus/register-child", req);
    } catch {
      const newChild: RegisteredChild = {
        id: Date.now(),
        name: req.name,
        grade: req.grade,
        schoolName: req.schoolName,
        stopName: req.stopName,
        busId: req.busId || 1,
        assignedBusId: req.busId || 1,
        busNumber: "KA-01-MJ-8921",
        status: "ACTIVE",
      };
      return newChild;
    }
  },
};
