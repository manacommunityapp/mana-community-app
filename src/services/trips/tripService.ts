export type TripCategory = "TREKKING" | "PILGRIMAGE" | "OUTING" | "CAMPING" | "ADVENTURE" | "WELLNESS";
export type TripStatus = "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
export type BookingStatus = "CONFIRMED" | "WAITLISTED" | "CANCELLED";

export interface ItineraryDay {
  day: number;
  title: string;
  activities: string[];
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
  totalSeats: number;
  bookedSeats: number;
  pricePerPerson: number;
  host: string;
  hostFlatNumber: string;
  itinerary: ItineraryDay[];
  transport: string;
  includes: string[];
  excludes: string[];
  status: TripStatus;
  imagePlaceholderColor: string;
}

export interface TripBooking {
  id: string;
  tripId: string;
  tripTitle: string;
  destination: string;
  departureDate: string;
  participantCount: number;
  totalAmount: number;
  status: BookingStatus;
  boardingPassQR: string;
  bookedAt: string;
}

const SAMPLE_TRIPS: Trip[] = [
  {
    id: "trip-001",
    title: "Kedarnath Yatra",
    category: "PILGRIMAGE",
    description: "Sacred pilgrimage to Kedarnath temple with experienced guide. Helicopter option available for senior citizens.",
    destination: "Kedarnath, Uttarakhand",
    departureDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    returnDate: new Date(Date.now() + 36 * 86400000).toISOString(),
    departurePoint: "Society Main Gate",
    totalSeats: 35,
    bookedSeats: 22,
    pricePerPerson: 18500,
    host: "Suresh Iyer",
    hostFlatNumber: "A-401",
    itinerary: [
      { day: 1, title: "Delhi to Haridwar", activities: ["Board AC Volvo at 9 PM", "Overnight journey"] },
      { day: 2, title: "Haridwar to Gaurikund", activities: ["Morning Ganga aarti", "Drive to Sonprayag", "Check-in at Gaurikund camp"] },
      { day: 3, title: "Trek to Kedarnath", activities: ["Wake up at 4 AM", "16 km trek or pony ride", "Temple darshan", "Night stay at base"] },
      { day: 4, title: "Kedarnath to Haridwar", activities: ["Morning prayers", "Trek down", "Drive to Haridwar", "Hotel check-in"] },
      { day: 5, title: "Return to Hyderabad", activities: ["Haridwar visit", "Depart 6 PM by bus"] },
      { day: 6, title: "Arrival", activities: ["Reach Hyderabad by morning"] },
    ],
    transport: "AC Volvo Bus",
    includes: ["Transport", "Accommodation (5 nights)", "Breakfast & Dinner", "Guide charges", "Temple entry"],
    excludes: ["Lunch", "Helicopter charges", "Personal expenses", "Travel insurance"],
    status: "UPCOMING",
    imagePlaceholderColor: "#7c3aed",
  },
  {
    id: "trip-002",
    title: "Coorg Coffee Trail Weekend",
    category: "OUTING",
    description: "Relaxing 3-day getaway to the Scotland of India. Coffee estate tours, waterfall treks, and local cuisine.",
    destination: "Coorg, Karnataka",
    departureDate: new Date(Date.now() + 14 * 86400000).toISOString(),
    returnDate: new Date(Date.now() + 16 * 86400000).toISOString(),
    departurePoint: "Society Main Gate",
    totalSeats: 20,
    bookedSeats: 18,
    pricePerPerson: 7500,
    host: "Ananya Rao",
    hostFlatNumber: "B-204",
    itinerary: [
      { day: 1, title: "Drive to Coorg", activities: ["Depart 5 AM", "Breakfast at Mysore", "Coffee estate visit", "Hotel check-in"] },
      { day: 2, title: "Explore Coorg", activities: ["Abbey Falls trek", "Mandalpatti peak visit", "Local market", "Group dinner"] },
      { day: 3, title: "Return", activities: ["Check-out 8 AM", "Bylakuppe Golden Temple", "Return by evening"] },
    ],
    transport: "Tempo Traveller",
    includes: ["Transport", "Hotel (2 nights, twin sharing)", "Breakfast", "Sightseeing"],
    excludes: ["Lunch & Dinner (Day 1, 3)", "Entry fees", "Personal expenses"],
    status: "UPCOMING",
    imagePlaceholderColor: "#16a34a",
  },
  {
    id: "trip-003",
    title: "Coastal Camping at Kashid Beach",
    category: "CAMPING",
    description: "Starlit camping on pristine Kashid Beach. Bonfire, beach volleyball, kayaking, and seafood feast.",
    destination: "Kashid Beach, Maharashtra",
    departureDate: new Date(Date.now() + 20 * 86400000).toISOString(),
    returnDate: new Date(Date.now() + 21 * 86400000).toISOString(),
    departurePoint: "Society Main Gate",
    totalSeats: 30,
    bookedSeats: 25,
    pricePerPerson: 4200,
    host: "Karthik Menon",
    hostFlatNumber: "C-101",
    itinerary: [
      { day: 1, title: "Drive to Kashid", activities: ["Depart 6 AM", "Check-in beach camp", "Water sports", "Seafood BBQ", "Bonfire & music night"] },
      { day: 2, title: "Morning & Return", activities: ["Sunrise yoga on beach", "Breakfast", "Return by noon"] },
    ],
    transport: "Bus",
    includes: ["Transport", "Beach camping tents", "All meals", "Kayaking", "Bonfire"],
    excludes: ["Personal expenses", "Extra water sports activities"],
    status: "UPCOMING",
    imagePlaceholderColor: "#0ea5e9",
  },
  {
    id: "trip-004",
    title: "Rishikesh Adventure & Rafting",
    category: "ADVENTURE",
    description: "Thrilling Rishikesh adventure with Grade 3/4 river rafting, bungee jumping optional, yoga sessions.",
    destination: "Rishikesh, Uttarakhand",
    departureDate: new Date(Date.now() + 45 * 86400000).toISOString(),
    returnDate: new Date(Date.now() + 48 * 86400000).toISOString(),
    departurePoint: "Society Main Gate",
    totalSeats: 25,
    bookedSeats: 10,
    pricePerPerson: 12000,
    host: "Deepak Verma",
    hostFlatNumber: "A-502",
    itinerary: [
      { day: 1, title: "Delhi to Rishikesh", activities: ["Fly to Delhi", "Bus to Rishikesh", "Camp check-in", "Orientation"] },
      { day: 2, title: "River Rafting", activities: ["Morning yoga", "16 km rafting (Grade 3/4)", "Cliff jumping", "Evening campfire"] },
      { day: 3, title: "Adventure Activities", activities: ["Bungee jumping (optional)", "Zip-lining", "Giant swing", "Market walk"] },
      { day: 4, title: "Return", activities: ["Morning meditation", "Checkout", "Return journey"] },
    ],
    transport: "Shared Cars + Flight",
    includes: ["Flight (DXB)", "Camp stay (3 nights)", "Rafting", "Meals", "Equipment"],
    excludes: ["Bungee jumping ₹3500", "Personal expenses", "Travel insurance"],
    status: "UPCOMING",
    imagePlaceholderColor: "#f97316",
  },
];

const BOOKINGS_KEY = "mana_trip_bookings";

function loadBookings(): TripBooking[] {
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveBookings(bookings: TripBooking[]) {
  try { localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings)); } catch {}
}

export const tripService = {
  getTrips(filter?: TripCategory): Trip[] {
    if (!filter) return SAMPLE_TRIPS;
    return SAMPLE_TRIPS.filter(t => t.category === filter);
  },

  getTripById(id: string): Trip | undefined {
    return SAMPLE_TRIPS.find(t => t.id === id);
  },

  bookTrip(tripId: string, count: number, _userId: string): TripBooking {
    const trip = SAMPLE_TRIPS.find(t => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    const booking: TripBooking = {
      id: `bk-${Date.now()}`,
      tripId,
      tripTitle: trip.title,
      destination: trip.destination,
      departureDate: trip.departureDate,
      participantCount: count,
      totalAmount: trip.pricePerPerson * count,
      status: "CONFIRMED",
      boardingPassQR: `BP-${tripId.toUpperCase()}-${Date.now()}`,
      bookedAt: new Date().toISOString(),
    };
    const bookings = loadBookings();
    saveBookings([...bookings, booking]);
    return booking;
  },

  getMyBookings(_userId: string): TripBooking[] {
    return loadBookings();
  },

  cancelBooking(bookingId: string): boolean {
    const bookings = loadBookings();
    const idx = bookings.findIndex(b => b.id === bookingId);
    if (idx === -1) return false;
    bookings[idx] = { ...bookings[idx], status: "CANCELLED" };
    saveBookings(bookings);
    return true;
  },
};
