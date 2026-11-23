import { apiClient } from "../common/apiClient";

export interface CarpoolRide {
  id: number;
  driverId: number;
  driverName: string;
  driverPhone: string;
  driverRating: number;
  unitNumber: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleColor: string;
  origin: string;
  destination: string;
  waypoints: string[];
  departureDate: string;
  departureTime: string;
  totalSeats: number;
  availableSeats: number;
  costPerSeat: number;
  ladiesOnly: boolean;
  smokingAllowed: boolean;
  acAvailable: boolean;
  recurringWeekdays: string[];
  status: "OPEN" | "FULL" | "IN_TRANSIT" | "COMPLETED" | "CANCELLED";
  notes?: string;
  passengers?: RideBooking[];
}

export interface RideBooking {
  id: number;
  rideId: number;
  passengerId: number;
  passengerName: string;
  passengerPhone: string;
  passengerUnit: string;
  seatsBooked: number;
  totalCost: number;
  status: "CONFIRMED" | "CANCELLED";
  bookedAt: string;
}

export interface CreateRideRequest {
  origin: string;
  destination: string;
  waypoints?: string[];
  departureDate: string;
  departureTime: string;
  totalSeats: number;
  costPerSeat: number;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleColor?: string;
  ladiesOnly?: boolean;
  recurringWeekdays?: string[];
  notes?: string;
}

export interface BookRideRequest {
  seats: number;
  pickupPoint?: string;
  notes?: string;
}

const MOCK_RIDES: CarpoolRide[] = [
  {
    id: 1,
    driverId: 101,
    driverName: "Arun Venkat",
    driverPhone: "+91 98451 89201",
    driverRating: 4.9,
    unitNumber: "Tower B - 1204",
    vehicleModel: "Hyundai Creta SX (Petrol)",
    vehiclePlate: "KA-03-NB-8821",
    vehicleColor: "Polar White",
    origin: "Mana Uber Verde Main Gate",
    destination: "EcoSpace Business Park, Outer Ring Road",
    waypoints: ["Sarjapur Signal", "Bellandur Flyover", "EcoSpace Main Gate"],
    departureDate: new Date().toISOString().split("T")[0],
    departureTime: "08:30 AM",
    totalSeats: 3,
    availableSeats: 2,
    costPerSeat: 80,
    ladiesOnly: false,
    smokingAllowed: false,
    acAvailable: true,
    recurringWeekdays: ["MON", "TUE", "WED", "THU", "FRI"],
    status: "OPEN",
    notes: "Leaving strictly at 8:30 AM from Tower B porch. AC on throughout.",
    passengers: [
      {
        id: 501,
        rideId: 1,
        passengerId: 202,
        passengerName: "Sneha Nair",
        passengerPhone: "+91 97412 11048",
        passengerUnit: "Tower A - 302",
        seatsBooked: 1,
        totalCost: 80,
        status: "CONFIRMED",
        bookedAt: "Yesterday 09:15 PM",
      },
    ],
  },
  {
    id: 2,
    driverId: 102,
    driverName: "Priyanka Sen",
    driverPhone: "+91 98802 44910",
    driverRating: 5.0,
    unitNumber: "Tower A - 701",
    vehicleModel: "Tata Nexon EV Max",
    vehiclePlate: "KA-01-EV-3142",
    vehicleColor: "Intensi Teal",
    origin: "Mana Uber Verde Main Gate",
    destination: "International Tech Park (ITPB), Whitefield",
    waypoints: ["Dommasandra Circle", "Varthur Kodi", "Hope Farm", "ITPB"],
    departureDate: new Date().toISOString().split("T")[0],
    departureTime: "08:45 AM",
    totalSeats: 3,
    availableSeats: 1,
    costPerSeat: 100,
    ladiesOnly: true,
    smokingAllowed: false,
    acAvailable: true,
    recurringWeekdays: ["MON", "WED", "FRI"],
    status: "OPEN",
    notes: "Ladies-only carpool for Whitefield techies. Quiet ride with soft music.",
    passengers: [
      {
        id: 502,
        rideId: 2,
        passengerId: 203,
        passengerName: "Deepika Rao",
        passengerPhone: "+91 99001 22891",
        passengerUnit: "Tower C - 804",
        seatsBooked: 1,
        totalCost: 100,
        status: "CONFIRMED",
        bookedAt: "Yesterday 10:30 PM",
      },
      {
        id: 503,
        rideId: 2,
        passengerId: 204,
        passengerName: "Ritika Das",
        passengerPhone: "+91 99003 44102",
        passengerUnit: "Tower B - 501",
        seatsBooked: 1,
        totalCost: 100,
        status: "CONFIRMED",
        bookedAt: "Today 07:10 AM",
      },
    ],
  },
  {
    id: 3,
    driverId: 103,
    driverName: "Manoj Deshmukh",
    driverPhone: "+91 97310 99412",
    driverRating: 4.8,
    unitNumber: "Tower D - 1403",
    vehicleModel: "Kia Seltos GTX+",
    vehiclePlate: "KA-51-MD-9041",
    vehicleColor: "Gravity Grey",
    origin: "Mana Uber Verde Main Gate",
    destination: "Electronic City Phase 1 (Infosys Gate 1)",
    waypoints: ["Hosa Road Junction", "Nice Road Entry", "E-City Toll Gate"],
    departureDate: new Date().toISOString().split("T")[0],
    departureTime: "09:00 AM",
    totalSeats: 3,
    availableSeats: 3,
    costPerSeat: 90,
    ladiesOnly: false,
    smokingAllowed: false,
    acAvailable: true,
    recurringWeekdays: ["TUE", "THU"],
    status: "OPEN",
    notes: "Smooth expressway drive via Nice Road.",
  },
];

export const carpoolService = {
  async listRides(filter?: { destination?: string; date?: string; ladiesOnly?: boolean }): Promise<CarpoolRide[]> {
    try {
      const res = await apiClient.get<CarpoolRide[]>("/mobility/carpool/rides");
      if (res && res.length > 0) return res;
      return MOCK_RIDES;
    } catch {
      let filtered = [...MOCK_RIDES];
      if (filter?.destination) {
        filtered = filtered.filter(
          (r) =>
            r.destination.toLowerCase().includes(filter.destination!.toLowerCase()) ||
            r.waypoints.some((w) => w.toLowerCase().includes(filter.destination!.toLowerCase()))
        );
      }
      if (filter?.ladiesOnly) {
        filtered = filtered.filter((r) => r.ladiesOnly);
      }
      return filtered;
    }
  },

  async getRide(id: number): Promise<CarpoolRide> {
    try {
      return await apiClient.get<CarpoolRide>(`/mobility/carpool/rides/${id}`);
    } catch {
      const found = MOCK_RIDES.find((r) => r.id === id);
      if (!found) throw new Error("Ride not found");
      return found;
    }
  },

  async createRide(req: CreateRideRequest): Promise<CarpoolRide> {
    try {
      return await apiClient.post<CarpoolRide>("/mobility/carpool/rides", req);
    } catch {
      const newRide: CarpoolRide = {
        id: Date.now(),
        driverId: 999,
        driverName: "You (Resident)",
        driverPhone: "+91 98000 00000",
        driverRating: 5.0,
        unitNumber: "Your Apartment",
        vehicleModel: req.vehicleModel,
        vehiclePlate: req.vehiclePlate,
        vehicleColor: req.vehicleColor || "Silver",
        origin: req.origin,
        destination: req.destination,
        waypoints: req.waypoints || [],
        departureDate: req.departureDate,
        departureTime: req.departureTime,
        totalSeats: req.totalSeats,
        availableSeats: req.totalSeats,
        costPerSeat: req.costPerSeat,
        ladiesOnly: req.ladiesOnly ?? false,
        smokingAllowed: false,
        acAvailable: true,
        recurringWeekdays: req.recurringWeekdays || [],
        status: "OPEN",
        notes: req.notes,
        passengers: [],
      };
      return newRide;
    }
  },

  async bookSeat(rideId: number, req: BookRideRequest): Promise<RideBooking> {
    try {
      return await apiClient.post<RideBooking>(`/mobility/carpool/rides/${rideId}/book`, req);
    } catch {
      const ride = MOCK_RIDES.find((r) => r.id === rideId);
      const booking: RideBooking = {
        id: Date.now(),
        rideId,
        passengerId: 999,
        passengerName: "You (Resident)",
        passengerPhone: "+91 98000 00000",
        passengerUnit: "Your Apartment",
        seatsBooked: req.seats,
        totalCost: (ride?.costPerSeat || 80) * req.seats,
        status: "CONFIRMED",
        bookedAt: "Just now",
      };
      return booking;
    }
  },

  async cancelBooking(rideId: number, bookingId: number): Promise<{ success: boolean }> {
    try {
      return await apiClient.delete<{ success: boolean }>(`/mobility/carpool/rides/${rideId}/bookings/${bookingId}`);
    } catch {
      return { success: true };
    }
  },
};
