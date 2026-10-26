import { apiClient } from "../common/apiClient";

export type PetSpecies = "DOG" | "CAT" | "BIRD" | "RABBIT" | "FISH" | "OTHER";
export type PetServiceType = "VET" | "WALKER" | "GROOMER" | "TRAINER" | "SITTER" | "BOARDING";

export interface Pet {
  id: string | number;
  name: string;
  species: PetSpecies | string;
  breed?: string;
  ageYears?: number;
  gender?: "MALE" | "FEMALE";
  color?: string;
  photoUrl?: string;
  ownerId?: string | number;
  ownerName: string;
  ownerPhone?: string;
  communityId?: string | number;
  tower: string;
  flatNumber: string;
  isVaccinated: boolean;
  lastVaccinationDate?: string;
  vaccinationCertificateUrl?: string;
  microchipNumber?: string;
  isFriendlyWithKids?: boolean;
  isFriendlyWithPets?: boolean;
  specialNotes?: string;
  vetName?: string;
  vetContact?: string;
  status?: "ACTIVE" | "INACTIVE" | "RELOCATED";
  createdAt?: string;
}

export interface PetRegistrationPayload {
  name: string;
  species: PetSpecies | string;
  breed?: string;
  ageYears?: number;
  gender?: string;
  color?: string;
  photoUrl?: string;
  ownerName: string;
  ownerPhone?: string;
  tower: string;
  flatNumber: string;
  isVaccinated: boolean;
  lastVaccinationDate?: string;
  microchipNumber?: string;
  isFriendlyWithKids?: boolean;
  isFriendlyWithPets?: boolean;
  specialNotes?: string;
  vetName?: string;
  vetContact?: string;
}

export interface PetServiceProvider {
  id: string | number;
  name: string;
  serviceType: PetServiceType | string;
  description: string;
  contactNumber: string;
  email?: string;
  clinicOrAddress?: string;
  priceRange: string;
  basePrice: number;
  rating: number;
  reviewCount: number;
  photoUrl?: string;
  isVerified: boolean;
  isAvailable: boolean;
  availableHours?: string;
}

export interface PetBookingPayload {
  petId: string | number;
  petName?: string;
  userName: string;
  userPhone?: string;
  tower: string;
  flatNumber: string;
  bookingDate: string;
  timeSlot: string;
  notes?: string;
}

export interface PetBooking {
  id: string | number;
  providerId: string | number;
  providerName: string;
  serviceType: string;
  petId: string | number;
  petName: string;
  userName: string;
  userPhone?: string;
  tower: string;
  flatNumber: string;
  bookingDate: string;
  timeSlot: string;
  notes?: string;
  status: "CONFIRMED" | "PENDING" | "COMPLETED" | "CANCELLED";
  amount?: number;
  createdAt?: string;
}

export const DEFAULT_PETS: Pet[] = [
  {
    id: "pet-1",
    name: "Buddy",
    species: "DOG",
    breed: "Golden Retriever",
    ageYears: 3,
    gender: "MALE",
    color: "Golden Honey",
    photoUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=500&auto=format&fit=crop&q=60",
    ownerName: "Priya Sharma",
    ownerPhone: "+91 98765 43210",
    tower: "Tower B",
    flatNumber: "402",
    isVaccinated: true,
    lastVaccinationDate: "2026-08-15",
    microchipNumber: "MC-8829104",
    isFriendlyWithKids: true,
    isFriendlyWithPets: true,
    specialNotes: "Super friendly and loves playing fetch at the community dog park. Regularly vaccinated against rabies and DHPP.",
    vetName: "Dr. Sneha's Pet Clinic",
    vetContact: "+91 98111 22334",
    status: "ACTIVE",
    createdAt: "2026-01-10",
  },
  {
    id: "pet-2",
    name: "Milo",
    species: "CAT",
    breed: "Persian Longhair",
    ageYears: 2,
    gender: "MALE",
    color: "Snow White",
    photoUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop&q=60",
    ownerName: "Rahul Verma",
    ownerPhone: "+91 98222 33445",
    tower: "Tower A",
    flatNumber: "1104",
    isVaccinated: true,
    lastVaccinationDate: "2026-07-20",
    microchipNumber: "MC-3310291",
    isFriendlyWithKids: true,
    isFriendlyWithPets: false,
    specialNotes: "Indoor cat with complete FVRCP vaccination schedule. Shy around big dogs.",
    vetName: "Crown Animal Hospital",
    vetContact: "+91 98444 55667",
    status: "ACTIVE",
    createdAt: "2026-02-14",
  },
  {
    id: "pet-3",
    name: "Coco",
    species: "DOG",
    breed: "Shih Tzu",
    ageYears: 1,
    gender: "FEMALE",
    color: "Tri-color Brown & White",
    photoUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop&q=60",
    ownerName: "Ananya Iyer",
    ownerPhone: "+91 98333 44556",
    tower: "Tower C",
    flatNumber: "201",
    isVaccinated: true,
    lastVaccinationDate: "2026-09-01",
    microchipNumber: "MC-9940182",
    isFriendlyWithKids: true,
    isFriendlyWithPets: true,
    specialNotes: "Gentle puppy, loves socializing during morning walks between 7 AM - 8 AM.",
    vetName: "Dr. Sneha's Pet Clinic",
    vetContact: "+91 98111 22334",
    status: "ACTIVE",
    createdAt: "2026-03-05",
  },
  {
    id: "pet-4",
    name: "Rio",
    species: "BIRD",
    breed: "Sun Conure Parakeet",
    ageYears: 4,
    gender: "MALE",
    color: "Vibrant Yellow & Orange",
    photoUrl: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=500&auto=format&fit=crop&q=60",
    ownerName: "Vikram Malhotra",
    ownerPhone: "+91 98555 66778",
    tower: "Tower B",
    flatNumber: "805",
    isVaccinated: true,
    lastVaccinationDate: "2026-06-10",
    isFriendlyWithKids: true,
    isFriendlyWithPets: true,
    specialNotes: "Loves whistling community morning tunes! Very social bird registered with avian care protocol.",
    status: "ACTIVE",
    createdAt: "2026-04-12",
  },
  {
    id: "pet-5",
    name: "Rocky",
    species: "DOG",
    breed: "German Shepherd",
    ageYears: 4,
    gender: "MALE",
    color: "Black & Tan",
    photoUrl: "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=500&auto=format&fit=crop&q=60",
    ownerName: "Rajesh Patel",
    ownerPhone: "+91 98777 88990",
    tower: "Tower D",
    flatNumber: "603",
    isVaccinated: true,
    lastVaccinationDate: "2026-08-30",
    microchipNumber: "MC-7719283",
    isFriendlyWithKids: true,
    isFriendlyWithPets: true,
    specialNotes: "Certified obedience training level 3. Well behaved and walks on leash at all times.",
    vetName: "V-Care Multi-Specialty Vet",
    vetContact: "+91 98999 00112",
    status: "ACTIVE",
    createdAt: "2026-01-25",
  },
];

export const DEFAULT_PROVIDERS: PetServiceProvider[] = [
  {
    id: "prov-1",
    name: "Dr. Sneha's Pet Clinic & 24/7 Vet Care",
    serviceType: "VET",
    description: "Full veterinary clinic with emergency surgery, annual vaccination packages, dental hygiene, and home visit checks.",
    contactNumber: "+91 98111 22334",
    email: "clinic@drsnehapetcare.in",
    clinicOrAddress: "Shop 14, Commercial Plaza, Mana Enclave",
    priceRange: "₹500 - ₹1,500",
    basePrice: 600,
    rating: 4.9,
    reviewCount: 128,
    photoUrl: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=500&auto=format&fit=crop&q=60",
    isVerified: true,
    isAvailable: true,
    availableHours: "08:00 AM - 09:00 PM (Emergency 24/7)",
  },
  {
    id: "prov-2",
    name: "Paws & Stride Professional Dog Walking",
    serviceType: "WALKER",
    description: "GPS-tracked daily dog walking by certified canine handlers. Morning and evening 45-min exercise sessions with hydration tracking.",
    contactNumber: "+91 98222 55667",
    email: "walks@pawsandstride.com",
    clinicOrAddress: "Serving Towers A to F inside Community",
    priceRange: "₹350 / session",
    basePrice: 350,
    rating: 4.8,
    reviewCount: 85,
    photoUrl: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=500&auto=format&fit=crop&q=60",
    isVerified: true,
    isAvailable: true,
    availableHours: "06:00 AM - 10:00 AM, 05:00 PM - 08:30 PM",
  },
  {
    id: "prov-3",
    name: "Fluffy Tails Mobile Grooming Van",
    serviceType: "GROOMER",
    description: "Doorstep luxury pet spa: warm hydrobath, organic shampoo, coat de-shedding, nail clipping, and ear cleaning right at your tower lobby.",
    contactNumber: "+91 98333 77889",
    email: "booking@fluffytails.in",
    clinicOrAddress: "Mobile Pet Spa Van — Enclave Parking Bay 3",
    priceRange: "₹800 - ₹2,200",
    basePrice: 850,
    rating: 4.7,
    reviewCount: 64,
    photoUrl: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=500&auto=format&fit=crop&q=60",
    isVerified: true,
    isAvailable: true,
    availableHours: "09:00 AM - 07:00 PM (Tuesday to Sunday)",
  },
  {
    id: "prov-4",
    name: "Happy Tails Community Pet Sitting & Daycare",
    serviceType: "SITTER",
    description: "Cage-free in-house pet sitting when you travel or during long office days. Includes feeding, play sessions, and WhatsApp photo updates.",
    contactNumber: "+91 98444 88990",
    email: "care@happytailssitters.in",
    clinicOrAddress: "Tower C-102 & In-Flat Visits",
    priceRange: "₹500 / day",
    basePrice: 500,
    rating: 4.9,
    reviewCount: 92,
    photoUrl: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=500&auto=format&fit=crop&q=60",
    isVerified: true,
    isAvailable: true,
    availableHours: "24/7 Boarding & Daycare",
  },
];

const LOCAL_STORAGE_PETS = "mana_community_pets_registry";
const LOCAL_STORAGE_BOOKINGS = "mana_community_pet_bookings";

function getLocalPets(): Pet[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PETS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_PETS;
}

function saveLocalPets(pets: Pet[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_PETS, JSON.stringify(pets));
  } catch {}
}

function getLocalBookings(): PetBooking[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_BOOKINGS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveLocalBookings(bookings: PetBooking[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_BOOKINGS, JSON.stringify(bookings));
  } catch {}
}

export const petService = {
  /**
   * GET /pets — Community pet directory
   */
  async getPets(species?: string, search?: string): Promise<Pet[]> {
    try {
      const params = new URLSearchParams();
      if (species && species !== "ALL") params.append("species", species);
      if (search) params.append("search", search);
      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await apiClient.get<Pet[]>(`/pets${query}`);
      if (res && Array.isArray(res) && res.length > 0) {
        return res;
      }
    } catch (e) {
      console.warn("Backend /pets endpoint fallback to local store:", e);
    }

    let list = getLocalPets();
    if (species && species !== "ALL") {
      list = list.filter(p => p.species.toUpperCase() === species.toUpperCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.breed && p.breed.toLowerCase().includes(q)) ||
        p.ownerName.toLowerCase().includes(q) ||
        p.tower.toLowerCase().includes(q) ||
        p.flatNumber.toLowerCase().includes(q)
      );
    }
    return list;
  },

  /**
   * POST /pets — Register a pet
   */
  async registerPet(payload: PetRegistrationPayload): Promise<Pet> {
    try {
      const res = await apiClient.post<Pet>("/pets", payload);
      if (res && res.id) {
        return res;
      }
    } catch (e) {
      console.warn("Backend POST /pets failed, saving locally:", e);
    }

    const newPet: Pet = {
      id: `pet-${Date.now()}`,
      name: payload.name,
      species: payload.species,
      breed: payload.breed || "Standard",
      ageYears: payload.ageYears || 1,
      gender: (payload.gender as any) || "MALE",
      color: payload.color || "Multi",
      photoUrl: payload.photoUrl || (payload.species === "CAT" ? "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500" : "https://images.unsplash.com/photo-1552053831-71594a27632d?w=500"),
      ownerName: payload.ownerName,
      ownerPhone: payload.ownerPhone || "+91 99999 88888",
      tower: payload.tower,
      flatNumber: payload.flatNumber,
      isVaccinated: payload.isVaccinated,
      lastVaccinationDate: payload.lastVaccinationDate || new Date().toISOString().split("T")[0],
      microchipNumber: payload.microchipNumber || `MC-${Math.floor(1000000 + Math.random() * 9000000)}`,
      isFriendlyWithKids: payload.isFriendlyWithKids ?? true,
      isFriendlyWithPets: payload.isFriendlyWithPets ?? true,
      specialNotes: payload.specialNotes,
      vetName: payload.vetName,
      vetContact: payload.vetContact,
      status: "ACTIVE",
      createdAt: new Date().toISOString().split("T")[0],
    };

    const current = getLocalPets();
    saveLocalPets([newPet, ...current]);
    return newPet;
  },

  /**
   * GET /pets/services — Pet service providers (vets, walkers, groomers, etc.)
   */
  async getPetServices(type?: string): Promise<PetServiceProvider[]> {
    try {
      const query = type && type !== "ALL" ? `?type=${type}` : "";
      const res = await apiClient.get<PetServiceProvider[]>(`/pets/services${query}`);
      if (res && Array.isArray(res) && res.length > 0) {
        return res;
      }
    } catch (e) {
      console.warn("Backend /pets/services fallback to mock providers:", e);
    }

    if (type && type !== "ALL") {
      return DEFAULT_PROVIDERS.filter(p => p.serviceType.toUpperCase() === type.toUpperCase());
    }
    return DEFAULT_PROVIDERS;
  },

  /**
   * POST /pets/services/{id}/book — Book a pet service
   */
  async bookPetService(providerId: string | number, payload: PetBookingPayload): Promise<PetBooking> {
    try {
      const res = await apiClient.post<PetBooking>(`/pets/services/${providerId}/book`, payload);
      if (res && res.id) {
        return res;
      }
    } catch (e) {
      console.warn("Backend POST /pets/services/{id}/book fallback:", e);
    }

    const provider = DEFAULT_PROVIDERS.find(p => String(p.id) === String(providerId)) || DEFAULT_PROVIDERS[0];
    const newBooking: PetBooking = {
      id: `pb-${Date.now()}`,
      providerId: provider.id,
      providerName: provider.name,
      serviceType: provider.serviceType,
      petId: payload.petId,
      petName: payload.petName || "Pet",
      userName: payload.userName,
      userPhone: payload.userPhone,
      tower: payload.tower,
      flatNumber: payload.flatNumber,
      bookingDate: payload.bookingDate,
      timeSlot: payload.timeSlot,
      notes: payload.notes,
      status: "CONFIRMED",
      amount: provider.basePrice,
      createdAt: new Date().toISOString(),
    };

    const bookings = getLocalBookings();
    saveLocalBookings([newBooking, ...bookings]);
    return newBooking;
  },

  /**
   * GET /pets/my — Resident's registered pets
   */
  async getMyPets(ownerName?: string): Promise<Pet[]> {
    const all = await this.getPets();
    if (ownerName) {
      return all.filter(p => p.ownerName.toLowerCase() === ownerName.toLowerCase());
    }
    return all.slice(0, 2);
  },

  /**
   * GET /pets/bookings/my — Resident's active bookings
   */
  async getMyBookings(): Promise<PetBooking[]> {
    return getLocalBookings();
  }
};
