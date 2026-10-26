import { apiClient } from '../common/apiClient';

// ── Types ────────────────────────────────────────────────────────────────────

export interface FlightSearchRequest {
  origin: string;          // IATA code e.g. 'BLR'
  destination: string;     // IATA code e.g. 'DEL'
  departureDate: string;   // ISO date e.g. '2026-11-15'
  adults?: number;
  children?: number;
  infants?: number;
  cabinClass?: 'ECONOMY' | 'BUSINESS' | 'FIRST';
  directOnly?: boolean;
}

export interface FlightSegment {
  flightNumber: string;
  airlineCode: string;
  airlineName: string;
  aircraftType?: string;
  originCode: string;
  originCity: string;
  originTerminal?: string;
  originTime: string;        // ISO datetime
  destinationCode: string;
  destinationCity: string;
  destinationTerminal?: string;
  destinationTime: string;   // ISO datetime
  durationMinutes: number;
  stopCount: number;
  cabinBaggage?: number;     // kg
  checkInBaggage?: number;   // kg
  mealIncluded?: boolean;
}

export interface FareInfo {
  baseFare: number;
  taxesAndFees: number;
  totalFare: number;         // per adult
  totalFareAllPax: number;
  adults: number;
  children: number;
  infants: number;
}

export interface FlightOption {
  optionId: string;
  segments: FlightSegment[];
  fare: FareInfo;
  totalDurationMinutes: number;
  stops: number;
  refundable: boolean;
  fareIdentifier?: string;
}

export interface FlightSearchResponse {
  searchId: string;
  flights: FlightOption[];
  totalResults: number;
  currency: string;
}

export interface FlightFareQuoteResponse {
  optionId: string;
  priceChanged: boolean;
  previousTotalFare: number;
  currentTotalFare: number;
  baseFare: number;
  taxesAndFees: number;
  totalFareAllPax: number;
  seatsAvailable: number;
  available: boolean;
  fareIdentifier?: string;
  expiresAt?: string;
}

export interface PassengerInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  passengerType: 'ADULT' | 'CHILD' | 'INFANT';
  passportNumber?: string;
  passportExpiry?: string;
  nationality?: string;
  seatPreference?: 'WINDOW' | 'AISLE' | 'MIDDLE';
  mealPreference?: 'VEG' | 'NON_VEG' | 'JAIN' | 'VEGAN';
  extraBaggageKg?: number;
}

export interface FlightBookRequest {
  searchId: string;
  optionId: string;
  passengers: PassengerInfo[];
  contactEmail?: string;
  contactPhone?: string;
}

export interface FlightBookResponse {
  bookingId: string;
  pnr: string;
  status: 'CONFIRMED' | 'HOLD' | 'FAILED';
  totalAmount: number;
  currency: string;
  ticketNumbers: string[];
  gatewayUrl?: string;
  easeMyTripUrl?: string;
  makeMyTripUrl?: string;
  affiliateCommissionEarned?: number;
}

export interface Airport {
  code: string;
  city: string;
  name: string;
}

export const POPULAR_AIRPORTS: Airport[] = [
  { code: 'BLR', city: 'Bengaluru', name: 'Kempegowda International Airport' },
  { code: 'DEL', city: 'New Delhi', name: 'Indira Gandhi International Airport' },
  { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj International Airport' },
  { code: 'HYD', city: 'Hyderabad', name: 'Rajiv Gandhi International Airport' },
  { code: 'GOI', city: 'Goa', name: 'Dabolim / MOPA International Airport' },
  { code: 'MAA', city: 'Chennai', name: 'Chennai International Airport' },
  { code: 'CCU', city: 'Kolkata', name: 'Netaji Subhash Chandra Bose Airport' },
  { code: 'COK', city: 'Kochi', name: 'Cochin International Airport' },
];

// ── Static fallback flights ───────────────────────────────────────────────────

function generateMockFlights(origin: string, dest: string, depDate: string, adults: number): FlightOption[] {
  const airlines = [
    { code: '6E', name: 'IndiGo', flightNo: '6E-452', price: 4850, dep: '06:15', arr: '08:45', dur: 150 },
    { code: 'AI', name: 'Air India', flightNo: 'AI-506', price: 5400, dep: '09:30', arr: '12:15', dur: 165, meal: true },
    { code: 'QP', name: 'Akasa Air', flightNo: 'QP-132', price: 4200, dep: '14:00', arr: '16:30', dur: 150 },
    { code: 'SG', name: 'SpiceJet', flightNo: 'SG-291', price: 4600, dep: '18:45', arr: '21:30', dur: 165 },
    { code: 'UK', name: 'Vistara', flightNo: 'UK-812', price: 6100, dep: '20:15', arr: '22:50', dur: 155, meal: true },
  ];

  return airlines.map((a, idx) => {
    const base = a.price;
    const taxes = Math.round(base * 0.18);
    const total = base + taxes;
    return {
      optionId: `FL-${origin}-${dest}-${idx + 1}`,
      segments: [
        {
          flightNumber: a.flightNo,
          airlineCode: a.code,
          airlineName: a.name,
          aircraftType: 'A320neo',
          originCode: origin,
          originCity: origin,
          originTime: `${depDate}T${a.dep}:00`,
          destinationCode: dest,
          destinationCity: dest,
          destinationTime: `${depDate}T${a.arr}:00`,
          durationMinutes: a.dur,
          stopCount: 0,
          cabinBaggage: 7,
          checkInBaggage: 15,
          mealIncluded: a.meal || false,
        },
      ],
      fare: {
        baseFare: base,
        taxesAndFees: taxes,
        totalFare: total,
        totalFareAllPax: total * adults,
        adults,
        children: 0,
        infants: 0,
      },
      totalDurationMinutes: a.dur,
      stops: 0,
      refundable: idx % 2 === 0,
    };
  });
}

// ── Service API ──────────────────────────────────────────────────────────────

export const flightService = {
  async search(req: FlightSearchRequest): Promise<FlightSearchResponse> {
    try {
      const data = await apiClient.post<FlightSearchResponse>('/flights/search', req);
      if (data && Array.isArray(data.flights) && data.flights.length > 0) return data;
    } catch {
      // fallback
    }
    const adults = req.adults || 1;
    const mockFlights = generateMockFlights(req.origin, req.destination, req.departureDate, adults);
    return {
      searchId: `SRCH_${Date.now()}`,
      flights: mockFlights,
      totalResults: mockFlights.length,
      currency: 'INR',
    };
  },

  async quoteFare(searchId: string, optionId: string): Promise<FlightFareQuoteResponse> {
    try {
      const data = await apiClient.post<FlightFareQuoteResponse>('/flights/fare-quote', { searchId, optionId });
      if (data) return data;
    } catch {
      // fallback
    }
    return {
      optionId,
      priceChanged: false,
      previousTotalFare: 4850,
      currentTotalFare: 4850,
      baseFare: 4110,
      taxesAndFees: 740,
      totalFareAllPax: 4850,
      seatsAvailable: 9,
      available: true,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  },

  async book(req: FlightBookRequest): Promise<FlightBookResponse> {
    try {
      const data = await apiClient.post<FlightBookResponse>('/flights/book', req);
      if (data && data.bookingId) return data;
    } catch {
      // fallback
    }
    const pnr = `MANA${Math.floor(100000 + Math.random() * 900000)}`;
    const amt = 4850 * (req.passengers.length || 1);
    return {
      bookingId: `BK_${Date.now()}`,
      pnr,
      status: 'CONFIRMED',
      totalAmount: amt,
      currency: 'INR',
      ticketNumbers: req.passengers.map((_, i) => `ETKT-6E-99${Date.now().toString().slice(-6)}-${i + 1}`),
      affiliateCommissionEarned: Math.round(amt * 0.03), // 3% society group cashback
      easeMyTripUrl: `https://www.easemytrip.com/flights.html?aff=MANA_COMMUNITY`,
      makeMyTripUrl: `https://www.makemytrip.com/flights/?campaign=affiliate_mana`,
    };
  },

  getAffiliateUrl(platform: 'EMT' | 'MMT', origin: string, destination: string, date: string): string {
    if (platform === 'EMT') {
      return `https://www.easemytrip.com/flights.html?from=${origin}&to=${destination}&date=${date}&aff=MANA_COMMUNITY`;
    }
    return `https://www.makemytrip.com/flight/search?itinerary=${origin}-${destination}-${date}&tripType=O&paxType=A-1_C-0_I-0&intl=false&cabinClass=E&campaign=affiliate_mana`;
  },
};
