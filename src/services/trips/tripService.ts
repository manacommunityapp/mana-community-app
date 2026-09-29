import { apiClient } from "../common/apiClient";

export type TripCategory = "TREKKING" | "PILGRIMAGE" | "OUTING" | "CAMPING" | "ADVENTURE" | "WELLNESS";
export type TripStatus = "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
export type BookingStatus = "CONFIRMED" | "WAITLISTED" | "CANCELLED" | "REFUNDED";

export interface ItinerarySlot {
  time: string;
  activity: string;
  location?: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  activities: string[];
  slots?: ItinerarySlot[];
}

export interface PassengerInfo {
  id: string;
  name: string;
  age: number;
  gender: "MALE" | "FEMALE" | "OTHER";
  emergencyPhone: string;
  bloodGroup?: string;
  medicalNotes?: string;
}

export interface TripReview {
  id: string;
  tripId: string;
  userId: string;
  userName: string;
  userFlat?: string;
  rating: number;
  comment: string;
  photos?: string[];
  createdAt: string;
}

export interface CancellationPolicy {
  freeCancellationBeforeDays: number;
  penaltyPercentAfterDeadline: number;
  policyNotes: string;
}

export interface Trip {
  id: string;
  title: string;
  category: TripCategory;
  description: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  departurePoint: string;
  pickupStops?: string[];
  totalSeats: number;
  bookedSeats: number;
  waitlistCount: number;
  maxWaitlist: number;
  pricePerPerson: number;
  hostId: string;
  host: string;
  hostFlatNumber: string;
  hostPhone: string;
  itinerary: ItineraryDay[];
  transport: string;
  transportDetails?: {
    vehicleType: string;
    vehicleNumber?: string;
    driverName?: string;
    driverPhone?: string;
  };
  accommodationDetails?: {
    hotelName: string;
    hotelAddress: string;
    roomTypes: string[];
  };
  emergencyMarshal?: {
    name: string;
    phone: string;
    firstAidCertified: boolean;
  };
  includes: string[];
  excludes: string[];
  cancellationPolicy: CancellationPolicy;
  status: TripStatus;
  imagePlaceholderColor: string;
  reviews?: TripReview[];
}

export interface TripBooking {
  id: string;
  tripId: string;
  tripTitle: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  userId: string;
  userName: string;
  userFlat: string;
  userPhone: string;
  participantCount: number;
  passengers: PassengerInfo[];
  selectedRoomType?: string;
  selectedPickupPoint?: string;
  totalAmount: number;
  payment: {
    status: "PAID" | "PENDING" | "REFUNDED";
    method: "UPI" | "CARD" | "NETBANKING";
    transactionId: string;
    paidAt: string;
  };
  status: BookingStatus;
  attendance: {
    checkedIn: boolean;
    checkedInAt?: string;
    checkedInBy?: string;
  };
  boardingPassQR: string;
  bookedAt: string;
  cancelledAt?: string;
  refundAmount?: number;
  cancellationReason?: string;
}

const TRIPS_STORAGE_KEY = "mana_community_trips_v2";
const BOOKINGS_STORAGE_KEY = "mana_trip_bookings_v2";

const INITIAL_TRIPS: Trip[] = [
  {
    id: "trip-001",
    title: "Kedarnath Pilgrimage Yatra",
    category: "PILGRIMAGE",
    description: "Sacred pilgrimage to Kedarnath temple with experienced guide and dedicated medical marshal. Helicopter option available for senior citizens.",
    destination: "Kedarnath, Uttarakhand",
    departureDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    returnDate: new Date(Date.now() + 36 * 86400000).toISOString(),
    departurePoint: "Society Main Clubhouse Gate",
    pickupStops: ["Clubhouse Gate", "Outer Ring Road Metro Junction"],
    totalSeats: 35,
    bookedSeats: 24,
    waitlistCount: 2,
    maxWaitlist: 10,
    pricePerPerson: 18500,
    hostId: "user-host-1",
    host: "Suresh Iyer",
    hostFlatNumber: "A-401",
    hostPhone: "+91 98450 11223",
    itinerary: [
      {
        day: 1,
        title: "Delhi to Haridwar",
        activities: ["Board AC Volvo at 9 PM", "Overnight journey with refreshments"],
        slots: [
          { time: "09:00 PM", activity: "Boarding at Society Gate", location: "Main Gate" },
          { time: "06:00 AM", activity: "Arrival in Haridwar", location: "Haridwar Camp" }
        ]
      },
      {
        day: 2,
        title: "Haridwar to Gaurikund",
        activities: ["Morning Ganga aarti", "Drive to Sonprayag", "Check-in at Gaurikund camp"],
      },
      {
        day: 3,
        title: "Trek to Kedarnath",
        activities: ["16 km guided trek / pony ride", "Evening temple darshan", "Night stay at base camp"],
      },
      {
        day: 4,
        title: "Kedarnath to Haridwar",
        activities: ["Morning prayers", "Descent trek", "Drive to Haridwar", "Hotel check-in"],
      },
      {
        day: 5,
        title: "Return Journey",
        activities: ["Haridwar local visit", "Evening departure"],
      },
    ],
    transport: "AC Volvo Bus",
    transportDetails: {
      vehicleType: "Volvo Multi-Axle B11R",
      vehicleNumber: "KA 01 F 9823",
      driverName: "Ram Singh",
      driverPhone: "+91 98765 43210",
    },
    accommodationDetails: {
      hotelName: "Gaurikund Eco Resort & Kedarnath Base Camps",
      hotelAddress: "Sonprayag Highway, Kedarnath Valley",
      roomTypes: ["Twin Sharing Camp", "Triple Sharing Room", "Family Suite (4 Bed)"],
    },
    emergencyMarshal: {
      name: "Dr. Arvind K (Flat B-302)",
      phone: "+91 98860 99881",
      firstAidCertified: true,
    },
    includes: ["Transport (AC Volvo)", "Accommodation (4 nights)", "Breakfast & Dinner", "Oxygen Cylinders & First Aid", "Temple Entry Pass"],
    excludes: ["Lunch", "Helicopter rides (₹8,500 extra)", "Pony / Porter charges", "Personal expenses"],
    cancellationPolicy: {
      freeCancellationBeforeDays: 7,
      penaltyPercentAfterDeadline: 30,
      policyNotes: "100% refund up to 7 days before departure. 70% refund up to 48 hours. No refund within 24 hours.",
    },
    status: "UPCOMING",
    imagePlaceholderColor: "#7c3aed",
    reviews: [
      {
        id: "rev-1",
        tripId: "trip-001",
        userId: "user-2",
        userName: "Meera Sharma",
        userFlat: "C-201",
        rating: 5,
        comment: "Extremely well organized! Having Dr. Arvind as marshal gave our family immense confidence.",
        createdAt: "2026-08-15T10:00:00Z",
      }
    ],
  },
  {
    id: "trip-002",
    title: "Coorg Coffee Trail & Waterfall Trek",
    category: "OUTING",
    description: "Relaxing 3-day weekend getaway to the Scotland of India. Coffee plantation estate tours, Abbey waterfalls, and traditional Kodava cuisine.",
    destination: "Coorg, Karnataka",
    departureDate: new Date(Date.now() + 14 * 86400000).toISOString(),
    returnDate: new Date(Date.now() + 16 * 86400000).toISOString(),
    departurePoint: "Society Main Clubhouse Gate",
    pickupStops: ["Main Gate", "Electronic City Flyover"],
    totalSeats: 20,
    bookedSeats: 19,
    waitlistCount: 1,
    maxWaitlist: 5,
    pricePerPerson: 7500,
    hostId: "user-host-2",
    host: "Ananya Rao",
    hostFlatNumber: "B-204",
    hostPhone: "+91 98450 33445",
    itinerary: [
      { day: 1, title: "Drive to Coorg", activities: ["Depart 5 AM", "Mysore breakfast stop", "Coffee estate walk", "Homestay check-in"] },
      { day: 2, title: "Explore & Trek", activities: ["Abbey Falls trek", "Mandalpatti 4x4 Jeep safari", "Campfire & Barbecue"] },
      { day: 3, title: "Golden Temple & Return", activities: ["Bylakuppe Tibetan Monastery", "Spice shopping", "Return by 9 PM"] },
    ],
    transport: "Force Urbania Luxury Van",
    transportDetails: {
      vehicleType: "Force Urbania 17-Seater",
      vehicleNumber: "KA 51 M 4412",
      driverName: "Manjunath K",
      driverPhone: "+91 99001 22334",
    },
    accommodationDetails: {
      hotelName: "Woodstock Heritage Estate Homestay",
      hotelAddress: "Madikeri Rural, Coorg",
      roomTypes: ["Estate Cottages (Twin)", "Heritage Villa (Triple)"],
    },
    emergencyMarshal: {
      name: "Rohit Nair (Flat A-105)",
      phone: "+91 97401 55667",
      firstAidCertified: true,
    },
    includes: ["Transport", "Estate Homestay Stay (2 nights)", "All Breakfasts & Campfire Dinners", "Jeep Safari Pass", "Guide"],
    excludes: ["Lunch stops", "Personal shopping", "Travel insurance"],
    cancellationPolicy: {
      freeCancellationBeforeDays: 5,
      penaltyPercentAfterDeadline: 25,
      policyNotes: "Full refund till 5 days before trip. 75% refund until 48 hours prior.",
    },
    status: "UPCOMING",
    imagePlaceholderColor: "#16a34a",
    reviews: [],
  },
  {
    id: "trip-003",
    title: "Kashid Beach Coastal Camping",
    category: "CAMPING",
    description: "Starlit beach camping on pristine Kashid Beach. Bonfire, beach volleyball, kayak adventures, and coastal barbecue feast.",
    destination: "Kashid Beach, Maharashtra",
    departureDate: new Date(Date.now() + 20 * 86400000).toISOString(),
    returnDate: new Date(Date.now() + 21 * 86400000).toISOString(),
    departurePoint: "Society Main Clubhouse Gate",
    pickupStops: ["Main Gate", "Vashi Plaza"],
    totalSeats: 25,
    bookedSeats: 25,
    waitlistCount: 4,
    maxWaitlist: 8,
    pricePerPerson: 4200,
    hostId: "user-host-3",
    host: "Karthik Menon",
    hostFlatNumber: "C-101",
    hostPhone: "+91 98200 44556",
    itinerary: [
      { day: 1, title: "Drive & Beach Camp", activities: ["Depart 6 AM", "Beach tent setup", "Kayaking & volleyball", "Seafood BBQ & acoustic music night"] },
      { day: 2, title: "Sunrise Yoga & Return", activities: ["Sunrise beach yoga", "Coastal breakfast", "Return journey by noon"] },
    ],
    transport: "AC Mini Coach",
    transportDetails: {
      vehicleType: "BharatBenz 28-Seater",
      vehicleNumber: "MH 04 AX 7810",
      driverName: "Sanjay Shinde",
      driverPhone: "+91 98191 66778",
    },
    accommodationDetails: {
      hotelName: "Silver Sands Beach Campsite",
      hotelAddress: "Kashid Beach Front, Alibaug",
      roomTypes: ["Beach Tents (Twin)", "Family Beach Canopy (4 person)"],
    },
    emergencyMarshal: {
      name: "Karthik Menon (Certified Lifeguard)",
      phone: "+91 98200 44556",
      firstAidCertified: true,
    },
    includes: ["Transport", "Weatherproof Beach Tents", "Dinner BBQ + Breakfast", "Kayaking equipment", "Bonfire"],
    excludes: ["Personal gear", "Alcoholic beverages"],
    cancellationPolicy: {
      freeCancellationBeforeDays: 3,
      penaltyPercentAfterDeadline: 50,
      policyNotes: "Full refund 3 days prior. 50% refund up to 24 hours before trip.",
    },
    status: "UPCOMING",
    imagePlaceholderColor: "#0ea5e9",
    reviews: [],
  },
];

function getStoredTrips(): Trip[] {
  try {
    const raw = localStorage.getItem(TRIPS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(INITIAL_TRIPS));
  return INITIAL_TRIPS;
}

function saveStoredTrips(trips: Trip[]) {
  try {
    localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
  } catch {}
}

function getStoredBookings(): TripBooking[] {
  try {
    const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveStoredBookings(bookings: TripBooking[]) {
  try {
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
  } catch {}
}

export const tripService = {
  getTrips(category?: string): Trip[] {
    const trips = getStoredTrips();
    if (!category || category === "ALL") return trips;
    return trips.filter((t) => t.category === category);
  },

  getTripById(id: string): Trip | undefined {
    return getStoredTrips().find((t) => t.id === id);
  },

  createTrip(
    payload: Omit<Trip, "id" | "bookedSeats" | "waitlistCount" | "status" | "reviews">,
    hostUser: { id: string; fullName: string; flatNo?: string; phone?: string }
  ): Trip {
    const newTrip: Trip = {
      ...payload,
      id: `trip-${Date.now().toString().slice(-4)}`,
      bookedSeats: 0,
      waitlistCount: 0,
      hostId: hostUser.id,
      host: hostUser.fullName,
      hostFlatNumber: hostUser.flatNo || "Flat A-101",
      hostPhone: hostUser.phone || "+91 98450 00000",
      status: "UPCOMING",
      reviews: [],
    };
    const trips = getStoredTrips();
    trips.unshift(newTrip);
    saveStoredTrips(trips);
    return newTrip;
  },

  bookTrip(
    tripId: string,
    bookingData: {
      passengers: PassengerInfo[];
      selectedRoomType?: string;
      selectedPickupPoint?: string;
      paymentMethod: "UPI" | "CARD" | "NETBANKING";
    },
    user: { id: string; fullName: string; flatNo?: string; phone?: string }
  ): TripBooking {
    const trips = getStoredTrips();
    const tripIdx = trips.findIndex((t) => t.id === tripId);
    if (tripIdx === -1) throw new Error("Trip not found");

    const trip = trips[tripIdx];
    const count = bookingData.passengers.length;
    const isSoldOut = trip.bookedSeats + count > trip.totalSeats;

    if (isSoldOut && trip.waitlistCount >= trip.maxWaitlist) {
      throw new Error("Trip is sold out and waitlist is full.");
    }

    const bookingStatus: BookingStatus = isSoldOut ? "WAITLISTED" : "CONFIRMED";
    const totalAmount = trip.pricePerPerson * count;

    if (bookingStatus === "CONFIRMED") {
      trip.bookedSeats += count;
    } else {
      trip.waitlistCount += count;
    }
    trips[tripIdx] = trip;
    saveStoredTrips(trips);

    const booking: TripBooking = {
      id: `bk-${Date.now().toString().slice(-6)}`,
      tripId,
      tripTitle: trip.title,
      destination: trip.destination,
      departureDate: trip.departureDate,
      returnDate: trip.returnDate,
      userId: user.id,
      userName: user.fullName,
      userFlat: user.flatNo || "Resident",
      userPhone: user.phone || "+91 98450 12345",
      participantCount: count,
      passengers: bookingData.passengers,
      selectedRoomType: bookingData.selectedRoomType,
      selectedPickupPoint: bookingData.selectedPickupPoint || trip.departurePoint,
      totalAmount,
      payment: {
        status: "PAID",
        method: bookingData.paymentMethod,
        transactionId: `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        paidAt: new Date().toISOString(),
      },
      status: bookingStatus,
      attendance: { checkedIn: false },
      boardingPassQR: `MANA-PASS-${tripId.toUpperCase()}-${Date.now().toString().slice(-4)}`,
      bookedAt: new Date().toISOString(),
    };

    const bookings = getStoredBookings();
    bookings.unshift(booking);
    saveStoredBookings(bookings);

    return booking;
  },

  getMyBookings(userId: string): TripBooking[] {
    const bookings = getStoredBookings();
    return bookings.filter((b) => b.userId === userId || userId === "super-admin");
  },

  cancelBooking(bookingId: string, reason?: string): { refundAmount: number; penaltyDeducted: number } {
    const bookings = getStoredBookings();
    const idx = bookings.findIndex((b) => b.id === bookingId);
    if (idx === -1) throw new Error("Booking not found");

    const booking = bookings[idx];
    const trips = getStoredTrips();
    const tripIdx = trips.findIndex((t) => t.id === booking.tripId);
    const trip = tripIdx !== -1 ? trips[tripIdx] : null;

    // Calculate refund based on cancellation policy
    let refundPercent = 100;
    if (trip) {
      const departureTime = new Date(trip.departureDate).getTime();
      const daysUntilDeparture = (departureTime - Date.now()) / (1000 * 60 * 60 * 24);

      if (daysUntilDeparture < trip.cancellationPolicy.freeCancellationBeforeDays) {
        refundPercent = Math.max(0, 100 - trip.cancellationPolicy.penaltyPercentAfterDeadline);
      }
      if (daysUntilDeparture < 1) {
        refundPercent = 0; // No refund within 24 hours
      }

      // Free up booked seats
      if (booking.status === "CONFIRMED") {
        trip.bookedSeats = Math.max(0, trip.bookedSeats - booking.participantCount);

        // Auto-promote first waitlisted passenger if available
        const waitlistedBooking = bookings.find(
          (b) => b.tripId === trip.id && b.status === "WAITLISTED" && b.participantCount <= trip.totalSeats - trip.bookedSeats
        );
        if (waitlistedBooking) {
          waitlistedBooking.status = "CONFIRMED";
          trip.bookedSeats += waitlistedBooking.participantCount;
          trip.waitlistCount = Math.max(0, trip.waitlistCount - waitlistedBooking.participantCount);
        }
      } else if (booking.status === "WAITLISTED") {
        trip.waitlistCount = Math.max(0, trip.waitlistCount - booking.participantCount);
      }

      trips[tripIdx] = trip;
      saveStoredTrips(trips);
    }

    const refundAmount = Math.round((booking.totalAmount * refundPercent) / 100);
    const penaltyDeducted = booking.totalAmount - refundAmount;

    booking.status = "CANCELLED";
    booking.cancelledAt = new Date().toISOString();
    booking.refundAmount = refundAmount;
    booking.cancellationReason = reason || "Cancelled by resident";
    booking.payment.status = refundAmount > 0 ? "REFUNDED" : "PAID";

    bookings[idx] = booking;
    saveStoredBookings(bookings);

    return { refundAmount, penaltyDeducted };
  },

  getHostTrips(hostUserId: string): Trip[] {
    const trips = getStoredTrips();
    return trips.filter((t) => t.hostId === hostUserId || hostUserId === "super-admin" || hostUserId === "admin");
  },

  getTripManifest(tripId: string): TripBooking[] {
    const bookings = getStoredBookings();
    return bookings.filter((b) => b.tripId === tripId && (b.status === "CONFIRMED" || b.status === "WAITLISTED"));
  },

  checkInPassenger(bookingId: string, scannedBy: string): TripBooking {
    const bookings = getStoredBookings();
    const idx = bookings.findIndex((b) => b.id === bookingId);
    if (idx === -1) throw new Error("Booking not found");

    const booking = bookings[idx];
    booking.attendance = {
      checkedIn: true,
      checkedInAt: new Date().toISOString(),
      checkedInBy: scannedBy,
    };
    bookings[idx] = booking;
    saveStoredBookings(bookings);
    return booking;
  },

  submitTripReview(tripId: string, review: Omit<TripReview, "id" | "createdAt">): TripReview {
    const trips = getStoredTrips();
    const idx = trips.findIndex((t) => t.id === tripId);
    if (idx === -1) throw new Error("Trip not found");

    const newReview: TripReview = {
      ...review,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    if (!trips[idx].reviews) trips[idx].reviews = [];
    trips[idx].reviews!.unshift(newReview);
    saveStoredTrips(trips);
    return newReview;
  },

  // --- Backend Microservice API Sync Methods ---

  /** Fetch trips from backend Spring Boot travel microservice with fallback to cache */
  async fetchTripsFromApi(): Promise<Trip[]> {
    try {
      const response = await apiClient.get<any>("/trips");
      const list = Array.isArray(response) ? response : (response?.content || []);
      if (list && list.length > 0) {
        // Map backend response fields if needed
        return list;
      }
    } catch (e) {
      console.warn("Backend trips API unreachable, using local storage:", e);
    }
    return getStoredTrips();
  },

  /** Create trip on backend */
  async createTripApi(
    tripData: Omit<Trip, "id" | "bookedSeats" | "waitlistCount" | "status" | "reviews">,
    hostUser: { id: string; fullName: string; flatNo?: string; phone?: string }
  ): Promise<Trip> {
    try {
      const result = await apiClient.post<Trip>("/trips", { ...tripData, hostId: hostUser.id });
      if (result && result.id) {
        return result;
      }
    } catch (e) {
      console.warn("Failed to create trip on backend, saving locally:", e);
    }
    return this.createTrip(tripData, hostUser);
  },

  /** Join/Book trip via backend */
  async joinTripApi(
    tripId: string,
    bookingData: {
      passengers: PassengerInfo[];
      selectedRoomType?: string;
      selectedPickupPoint?: string;
      paymentMethod: "UPI" | "CARD" | "NETBANKING";
    },
    user: { id: string; fullName: string; flatNo?: string; phone?: string }
  ): Promise<TripBooking> {
    try {
      const result = await apiClient.post<any>(`/trips/${tripId}/join`, { ...bookingData, userId: user.id });
      if (result) {
        return result;
      }
    } catch (e) {
      console.warn("Failed to join trip on backend, saving locally:", e);
    }
    return this.bookTrip(tripId, bookingData, user);
  },

  /** Check in passenger via QR scanning endpoint */
  async checkInPassengerApi(tripId: string, bookingId: string, scannedBy: string): Promise<any> {
    try {
      const result = await apiClient.post<any>(`/trips/${tripId}/checkin/scan`, {
        bookingId,
        scannedBy,
      });
      if (result) return result;
    } catch (e) {
      console.warn("Backend check-in scan failed, saving locally:", e);
    }
    return this.checkInPassenger(bookingId, scannedBy);
  },

  /** Submit review via backend API */
  async submitReviewApi(tripId: string, review: Omit<TripReview, "id" | "createdAt">): Promise<TripReview> {
    try {
      const result = await apiClient.post<TripReview>(`/trips/${tripId}/reviews`, review);
      if (result) return result;
    } catch (e) {
      console.warn("Backend review submission failed, saving locally:", e);
    }
    return this.submitTripReview(tripId, review);
  },
};
