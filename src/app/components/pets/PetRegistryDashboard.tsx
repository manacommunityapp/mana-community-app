import { useState, useEffect } from "react";
import {
  Heart,
  Search,
  Plus,
  ShieldCheck,
  Phone,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
  Award,
  Stethoscope,
  Scissors,
  Footprints,
  Home,
  AlertCircle,
  Filter,
  User,
  QrCode,
  Check,
  ChevronRight
} from "lucide-react";
import { petService } from "../../../services/pets/petService";
import type {
  Pet,
  PetServiceProvider,
  PetBooking,
  PetRegistrationPayload,
  PetBookingPayload,
  PetSpecies,
  PetServiceType
} from "../../../services/pets/petService";
import { useAuth } from "../../../contexts/AuthContext";
import { toast } from "sonner";

export function PetRegistryDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"directory" | "services" | "register" | "my-pets">("directory");

  const [pets, setPets] = useState<Pet[]>([]);
  const [providers, setProviders] = useState<PetServiceProvider[]>([]);
  const [myBookings, setMyBookings] = useState<PetBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState<string>("ALL");
  const [selectedServiceType, setSelectedServiceType] = useState<string>("ALL");

  // Modals
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [selectedProviderForBooking, setSelectedProviderForBooking] = useState<PetServiceProvider | null>(null);

  // Registration Form State
  const [regForm, setRegForm] = useState<PetRegistrationPayload>({
    name: "",
    species: "DOG",
    breed: "",
    ageYears: 2,
    gender: "MALE",
    color: "",
    photoUrl: "",
    ownerName: user?.fullName || "Resident",
    ownerPhone: user?.phone || "+91 98765 43210",
    tower: user?.block ? `Tower ${user.block}` : "Tower A",
    flatNumber: user?.flatNo || "101",
    isVaccinated: true,
    lastVaccinationDate: new Date().toISOString().split("T")[0],
    microchipNumber: "",
    isFriendlyWithKids: true,
    isFriendlyWithPets: true,
    specialNotes: "",
    vetName: "",
    vetContact: "",
  });
  const [submittingReg, setSubmittingReg] = useState(false);

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    petId: "",
    bookingDate: new Date().toISOString().split("T")[0],
    timeSlot: "10:00 AM - 11:00 AM",
    notes: "",
  });
  const [submittingBooking, setSubmittingBooking] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedSpecies, searchQuery, selectedServiceType]);

  async function loadData() {
    setLoading(true);
    try {
      const [fetchedPets, fetchedProviders, fetchedBookings] = await Promise.all([
        petService.getPets(selectedSpecies, searchQuery),
        petService.getPetServices(selectedServiceType),
        petService.getMyBookings(),
      ]);
      setPets(fetchedPets);
      setProviders(fetchedProviders);
      setMyBookings(fetchedBookings);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load pet registry data");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!regForm.name.trim()) {
      toast.error("Please provide pet name");
      return;
    }
    setSubmittingReg(true);
    try {
      const newPet = await petService.registerPet(regForm);
      toast.success(`🎉 ${newPet.name} registered successfully in the Community Pet Directory!`);
      setPets(prev => [newPet, ...prev]);
      setActiveTab("directory");
      // Reset
      setRegForm({
        name: "",
        species: "DOG",
        breed: "",
        ageYears: 2,
        gender: "MALE",
        color: "",
        photoUrl: "",
        ownerName: user?.fullName || "Resident",
        ownerPhone: user?.phone || "+91 98765 43210",
        tower: user?.block ? `Tower ${user.block}` : "Tower A",
        flatNumber: user?.flatNo || "101",
        isVaccinated: true,
        lastVaccinationDate: new Date().toISOString().split("T")[0],
        microchipNumber: "",
        isFriendlyWithKids: true,
        isFriendlyWithPets: true,
        specialNotes: "",
        vetName: "",
        vetContact: "",
      });
    } catch (err) {
      toast.error("Failed to register pet. Please try again.");
    } finally {
      setSubmittingReg(false);
    }
  }

  async function handleBookingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProviderForBooking) return;
    if (!bookingForm.petId) {
      toast.error("Please select one of your registered pets");
      return;
    }
    const petObj = pets.find(p => String(p.id) === String(bookingForm.petId));
    setSubmittingBooking(true);
    try {
      const payload: PetBookingPayload = {
        petId: bookingForm.petId,
        petName: petObj?.name || "My Pet",
        userName: user?.fullName || "Resident",
        userPhone: user?.phone || "+91 98765 43210",
        tower: user?.block ? `Tower ${user.block}` : "Tower A",
        flatNumber: user?.flatNo || "101",
        bookingDate: bookingForm.bookingDate,
        timeSlot: bookingForm.timeSlot,
        notes: bookingForm.notes,
      };
      const booking = await petService.bookPetService(selectedProviderForBooking.id, payload);
      toast.success(`🐾 Appointment booked with ${selectedProviderForBooking.name} for ${booking.petName}!`);
      setMyBookings(prev => [booking, ...prev]);
      setSelectedProviderForBooking(null);
      setActiveTab("my-pets");
    } catch (err) {
      toast.error("Failed to book pet service.");
    } finally {
      setSubmittingBooking(false);
    }
  }

  const speciesBadges: { key: string; label: string; icon: string }[] = [
    { key: "ALL", label: "All Pets", icon: "🐾" },
    { key: "DOG", label: "Dogs", icon: "🐕" },
    { key: "CAT", label: "Cats", icon: "🐈" },
    { key: "BIRD", label: "Birds", icon: "🦜" },
    { key: "RABBIT", label: "Rabbits", icon: "🐇" },
    { key: "OTHER", label: "Others", icon: "🐾" },
  ];

  const serviceCategories = [
    { key: "ALL", label: "All Services", icon: Sparkles },
    { key: "VET", label: "Veterinary Doctors", icon: Stethoscope },
    { key: "WALKER", label: "Dog Walkers", icon: Footprints },
    { key: "GROOMER", label: "Pet Spa & Grooming", icon: Scissors },
    { key: "SITTER", label: "Pet Sitters & Daycare", icon: Home },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 p-6 sm:p-8 text-white shadow-xl shadow-teal-900/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <Heart className="h-3.5 w-3.5 fill-rose-300 text-rose-300 animate-pulse" />
              <span>Community Pet Registry &amp; Care</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              Paws, Whiskers &amp; Care Network
            </h1>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed">
              Register community pets, ensure vaccination compliance, find society pet buddies, and book certified veterinary doctors, dog walkers, and pet groomers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab("register")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-teal-800 font-bold text-sm shadow-lg hover:bg-white/90 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Register Pet
            </button>
            <button
              onClick={() => setActiveTab("services")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-sm backdrop-blur-md border border-white/20 transition-all cursor-pointer"
            >
              <Stethoscope className="h-4 w-4" />
              Find Vet / Walker
            </button>
          </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -top-12 -left-12 h-48 w-48 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab("directory")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "directory"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900"
          }`}
        >
          <span>🐾</span>
          <span>Pet Directory ({pets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("services")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "services"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900"
          }`}
        >
          <Stethoscope className="h-4 w-4" />
          <span>Vets &amp; Services ({providers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("register")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "register"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900"
          }`}
        >
          <Plus className="h-4 w-4" />
          <span>Register New Pet</span>
        </button>

        <button
          onClick={() => setActiveTab("my-pets")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "my-pets"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900"
          }`}
        >
          <User className="h-4 w-4" />
          <span>My Pets &amp; Bookings ({myBookings.length})</span>
        </button>
      </div>

      {/* ─── TAB 1: PET DIRECTORY ─── */}
      {activeTab === "directory" && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by pet name, breed, flat number, or owner..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
              />
            </div>

            {/* Species Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1">
              {speciesBadges.map(s => (
                <button
                  key={s.key}
                  onClick={() => setSelectedSpecies(s.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedSpecies === s.key
                      ? "bg-teal-600 text-white shadow-2xs font-bold"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-teal-500"
                  }`}
                >
                  <span className="mr-1">{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pets Grid */}
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading community pet records...</div>
          ) : pets.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="text-4xl">🐾</div>
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No pets matched your filter</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try searching for a different breed or be the first to register a pet in this category.
              </p>
              <button
                onClick={() => setActiveTab("register")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold cursor-pointer hover:bg-teal-700"
              >
                <Plus className="h-3.5 w-3.5" /> Register Pet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {pets.map(pet => (
                <div
                  key={pet.id}
                  onClick={() => setSelectedPet(pet)}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md hover:border-teal-400/50 transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Pet Photo / Avatar */}
                    <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-800">
                      {pet.photoUrl ? (
                        <img
                          src={pet.photoUrl}
                          alt={pet.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-2xl">
                          {pet.species === "CAT" ? "🐈" : pet.species === "BIRD" ? "🦜" : "🐕"}
                        </div>
                      )}
                      {pet.isVaccinated && (
                        <div className="absolute top-1 right-1 bg-emerald-500 text-white p-0.5 rounded-md shadow-xs" title="Vaccinated">
                          <ShieldCheck className="h-3 w-3" />
                        </div>
                      )}
                    </div>

                    {/* Pet Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                          {pet.name}
                        </h3>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                          {pet.species}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {pet.breed || "Purebred"} • {pet.ageYears ? `${pet.ageYears} yrs` : "Young"} • {pet.gender || "Pet"}
                      </p>

                      <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <MapPin className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                        <span className="truncate">{pet.tower}, Flat {pet.flatNumber}</span>
                      </div>

                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        Owner: <span className="text-slate-600 dark:text-slate-300 font-medium">{pet.ownerName}</span>
                      </p>
                    </div>
                  </div>

                  {/* Temperament Tags & Microchip */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      {pet.isFriendlyWithKids && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-medium text-[10px]">
                          Friendly
                        </span>
                      )}
                      {pet.microchipNumber && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[9px]">
                          Chip: {pet.microchipNumber}
                        </span>
                      )}
                    </div>
                    <span className="text-teal-600 dark:text-teal-400 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                      Passport <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: VETS & PET SERVICES ─── */}
      {activeTab === "services" && (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
            {serviceCategories.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedServiceType(cat.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedServiceType === cat.key
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-teal-500"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Providers List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {providers.map(prov => (
              <div
                key={prov.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 hover:border-teal-500/40 transition-all flex flex-col justify-between"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={prov.photoUrl || "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=500"}
                    alt={prov.name}
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {prov.name}
                      </h3>
                      {prov.isVerified && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                          <Check className="h-3 w-3" /> Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-amber-500 font-bold">
                      <span>★ {prov.rating}</span>
                      <span className="text-slate-400 font-normal">({prov.reviewCount} reviews)</span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-teal-600 dark:text-teal-400 font-semibold">{prov.serviceType}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {prov.description}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Location / Service:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{prov.clinicOrAddress}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Availability:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{prov.availableHours}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Standard Price:</span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">{prov.priceRange}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <a
                    href={`tel:${prov.contactNumber}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5 text-teal-600" />
                    Call Provider
                  </a>
                  <button
                    onClick={() => {
                      setSelectedProviderForBooking(prov);
                      if (pets.length > 0) {
                        setBookingForm(prev => ({ ...prev, petId: String(pets[0].id) }));
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Book Service
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 3: REGISTER PET FORM ─── */}
      {activeTab === "register" && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-1 text-center">
            <div className="h-12 w-12 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 mx-auto flex items-center justify-center text-2xl">
              🐾
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Register Pet in Society Registry</h2>
            <p className="text-xs text-slate-500">
              Helps security, tower marshals, and community pet lovers keep records of vaccinated pets and microchip IDs.
            </p>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pet Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Buddy, Milo"
                  value={regForm.name}
                  onChange={e => setRegForm({ ...regForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Species *
                </label>
                <select
                  value={regForm.species}
                  onChange={e => setRegForm({ ...regForm, species: e.target.value as PetSpecies })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer"
                >
                  <option value="DOG">Dog</option>
                  <option value="CAT">Cat</option>
                  <option value="BIRD">Bird</option>
                  <option value="RABBIT">Rabbit</option>
                  <option value="FISH">Fish / Aquatic</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Breed
                </label>
                <input
                  type="text"
                  placeholder="e.g. Golden Retriever, Persian"
                  value={regForm.breed}
                  onChange={e => setRegForm({ ...regForm, breed: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Age (Years) &amp; Gender
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={regForm.ageYears}
                    onChange={e => setRegForm({ ...regForm, ageYears: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <select
                    value={regForm.gender}
                    onChange={e => setRegForm({ ...regForm, gender: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tower / Block *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tower B"
                  value={regForm.tower}
                  onChange={e => setRegForm({ ...regForm, tower: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Flat Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 402"
                  value={regForm.flatNumber}
                  onChange={e => setRegForm({ ...regForm, flatNumber: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Microchip / Tag Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. MC-8829104 (Optional)"
                  value={regForm.microchipNumber}
                  onChange={e => setRegForm({ ...regForm, microchipNumber: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Last Vaccination Date
                </label>
                <input
                  type="date"
                  value={regForm.lastVaccinationDate}
                  onChange={e => setRegForm({ ...regForm, lastVaccinationDate: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 cursor-pointer">
                <input
                  type="checkbox"
                  checked={regForm.isVaccinated}
                  onChange={e => setRegForm({ ...regForm, isVaccinated: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Vaccinations are up to date
                </span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 cursor-pointer">
                <input
                  type="checkbox"
                  checked={regForm.isFriendlyWithKids}
                  onChange={e => setRegForm({ ...regForm, isFriendlyWithKids: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Friendly with children
                </span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Special Care Notes &amp; Routine
              </label>
              <textarea
                rows={3}
                placeholder="Walk timings, food allergies, temperament when meeting other dogs..."
                value={regForm.specialNotes}
                onChange={e => setRegForm({ ...regForm, specialNotes: e.target.value })}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submittingReg}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {submittingReg ? "Registering..." : "Complete Pet Registration"}
            </button>
          </form>
        </div>
      )}

      {/* ─── TAB 4: MY PETS & APPOINTMENTS ─── */}
      {activeTab === "my-pets" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-teal-600" />
              Active Pet Service Appointments ({myBookings.length})
            </h2>

            {myBookings.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <p className="text-xs">No active bookings yet.</p>
                <button
                  onClick={() => setActiveTab("services")}
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs cursor-pointer"
                >
                  Browse Vets &amp; Walkers
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myBookings.map(b => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {b.providerName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase">
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        For pet: <strong className="text-teal-600 dark:text-teal-400">{b.petName}</strong> • {b.serviceType}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" /> {b.bookingDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" /> {b.timeSlot}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex sm:flex-col items-center sm:items-end justify-between">
                      <span className="text-sm font-black text-teal-600 dark:text-teal-400">
                        {b.amount ? `₹${b.amount}` : "Confirmed"}
                      </span>
                      <span className="text-[10px] text-slate-400">Doorstep Visit</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: PET PASSPORT DETAIL ─── */}
      {selectedPet && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedPet(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <img
                src={selectedPet.photoUrl || "https://images.unsplash.com/photo-1552053831-71594a27632d?w=500"}
                alt={selectedPet.name}
                className="h-20 w-20 rounded-2xl object-cover shrink-0 border-2 border-teal-500/30"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white truncate">
                    {selectedPet.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                    {selectedPet.species}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedPet.breed} • {selectedPet.ageYears} Years Old • {selectedPet.gender}
                </p>
                <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1.5">
                  <MapPin className="h-3.5 w-3.5 text-teal-600" />
                  <span>{selectedPet.tower}, Flat {selectedPet.flatNumber}</span>
                </div>
              </div>
            </div>

            {/* Passport Badges */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Vaccination</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="h-3.5 w-3.5" /> Up to Date
                </span>
                <span className="text-[10px] text-slate-400">Last: {selectedPet.lastVaccinationDate || "Recent"}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Microchip ID</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block mt-0.5 truncate">
                  {selectedPet.microchipNumber || "Registered NFC Tag"}
                </span>
                <span className="text-[10px] text-slate-400">Society Safety Log</span>
              </div>
            </div>

            {/* Owner & Vet Contact Info */}
            <div className="p-3.5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Pet Parent:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPet.ownerName}</span>
              </div>
              {selectedPet.ownerPhone && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Contact:</span>
                  <a href={`tel:${selectedPet.ownerPhone}`} className="font-semibold text-teal-600 hover:underline">
                    {selectedPet.ownerPhone}
                  </a>
                </div>
              )}
              {selectedPet.vetName && (
                <div className="flex items-center justify-between pt-1 border-t border-teal-100/60 dark:border-teal-900/30">
                  <span className="text-slate-500">Assigned Vet:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{selectedPet.vetName}</span>
                </div>
              )}
            </div>

            {selectedPet.specialNotes && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Special Notes</span>
                <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  {selectedPet.specialNotes}
                </p>
              </div>
            )}

            <button
              onClick={() => setSelectedPet(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Close Passport
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL: BOOK PET SERVICE ─── */}
      {selectedProviderForBooking && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedProviderForBooking(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase text-teal-600 dark:text-teal-400">Appointment Request</span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Book {selectedProviderForBooking.name}
              </h2>
              <p className="text-xs text-slate-500">
                Rate: <strong className="text-teal-600">{selectedProviderForBooking.priceRange}</strong>
              </p>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Registered Pet *
                </label>
                <select
                  value={bookingForm.petId}
                  onChange={e => setBookingForm({ ...bookingForm, petId: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                >
                  {pets.map(p => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name} ({p.species} • {p.tower}-{p.flatNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Appointment Date *
                </label>
                <input
                  type="date"
                  required
                  value={bookingForm.bookingDate}
                  onChange={e => setBookingForm({ ...bookingForm, bookingDate: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Preferred Time Slot *
                </label>
                <select
                  value={bookingForm.timeSlot}
                  onChange={e => setBookingForm({ ...bookingForm, timeSlot: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="07:00 AM - 08:00 AM">07:00 AM - 08:00 AM (Early Morning Walk)</option>
                  <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM (Morning Consultation)</option>
                  <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM (Afternoon Spa / Bath)</option>
                  <option value="05:30 PM - 06:30 PM">05:30 PM - 06:30 PM (Evening Walk)</option>
                  <option value="08:00 PM - 09:00 PM">08:00 PM - 09:00 PM (Night Checkup)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Symptoms / Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Annual booster vaccine, gentle brushing needed..."
                  value={bookingForm.notes}
                  onChange={e => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProviderForBooking(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBooking}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submittingBooking ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
