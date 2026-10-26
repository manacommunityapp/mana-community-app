import React, { useState, useMemo } from "react";
import {
  SEED_DOCTORS,
  SEED_EMERGENCY_CONTACTS,
  SEED_HEALTH_CAMPS,
  SEED_FAMILY_MEMBERS
} from "../../../services/healthService";
import type {
  DoctorDto,
  ProviderCategory,
  ConsultationMode,
  HealthCampDto,
  FamilyMemberDto,
  HealthEmergencyContactDto,
  ClinicHourSlot,
  DoctorReview,
  AppointmentSlot
} from "../../../types/health";

interface HealthcareDirectoryProps {
  onBookAppointment?: (doctor: DoctorDto) => void;
  onCampRegister?: (camp: HealthCampDto) => void;
}

const CATEGORY_TABS: { id: ProviderCategory | "ALL"; label: string; icon: string }[] = [
  { id: "ALL", label: "All Providers", icon: "🌐" },
  { id: "DOCTOR", label: "Doctors", icon: "👨‍⚕️" },
  { id: "CLINIC", label: "Clinics", icon: "🏥" },
  { id: "DENTIST", label: "Dentists", icon: "🦷" },
  { id: "DIAGNOSTIC_CENTER", label: "Diagnostics & Labs", icon: "🧪" },
  { id: "PHARMACY", label: "Pharmacies", icon: "💊" },
  { id: "PHYSIOTHERAPIST", label: "Physiotherapists", icon: "🏃" },
  { id: "FITNESS_TRAINER", label: "Gym & Fitness Trainers", icon: "🏋️" },
  { id: "HOME_CARE", label: "Home Care", icon: "🏡" }
];

const DISTANCE_OPTIONS = [
  { label: "All Distances", value: 999 },
  { label: "In-Campus (0 km)", value: 0.1 },
  { label: "< 1 km", value: 1.0 },
  { label: "< 3 km", value: 3.0 },
  { label: "< 5 km", value: 5.0 }
];

const FEE_OPTIONS = [
  { label: "All Fees", min: 0, max: 99999 },
  { label: "Free (₹0)", min: 0, max: 0 },
  { label: "Under ₹500", min: 1, max: 500 },
  { label: "₹500 - ₹1000", min: 501, max: 1000 },
  { label: "₹1000+", min: 1001, max: 99999 }
];

export const HealthcareDirectory: React.FC<HealthcareDirectoryProps> = ({
  onBookAppointment,
  onCampRegister
}) => {
  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<ProviderCategory | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("ALL");
  const [selectedLanguage, setSelectedLanguage] = useState("ALL");
  const [maxDistance, setMaxDistance] = useState<number>(999);
  const [feeRangeIndex, setFeeRangeIndex] = useState<number>(0);
  const [availableTodayOnly, setAvailableTodayOnly] = useState(false);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [homeVisitOnly, setHomeVisitOnly] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"ALL" | ConsultationMode>("ALL");
  const [selectedDept, setSelectedDept] = useState("All");

  // Modals state
  const [selectedDoctorForDetails, setSelectedDoctorForDetails] = useState<DoctorDto | null>(null);
  const [selectedDoctorForHours, setSelectedDoctorForHours] = useState<DoctorDto | null>(null);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<DoctorDto | null>(null);
  const [selectedCampForBooking, setSelectedCampForBooking] = useState<HealthCampDto | null>(null);

  // Booking Form State inside Directory
  const [familyMembers] = useState<FamilyMemberDto[]>(SEED_FAMILY_MEMBERS);
  const [bookingPatientId, setBookingPatientId] = useState<string>("fam-1");
  const [bookingMode, setBookingMode] = useState<ConsultationMode>("IN_PERSON");
  const [bookingSlot, setBookingSlot] = useState<string>("");
  const [bookingSuccessAlert, setBookingSuccessAlert] = useState<string | null>(null);
  const [campSuccessAlert, setCampSuccessAlert] = useState<string | null>(null);

  // Available unique specialties & languages from SEED_DOCTORS
  const specialties = useMemo(() => {
    const set = new Set<string>();
    SEED_DOCTORS.forEach((d: DoctorDto) => {
      if (d.specialty) set.add(d.specialty);
    });
    return Array.from(set).sort();
  }, []);

  const languages = useMemo(() => {
    const set = new Set<string>();
    SEED_DOCTORS.forEach((d: DoctorDto) => {
      d.languages?.forEach((lang: string) => set.add(lang));
    });
    return Array.from(set).sort();
  }, []);

  // Filtered providers
  const filteredProviders = useMemo(() => {
    return SEED_DOCTORS.filter((doc: DoctorDto) => {
      // Category filter
      if (selectedCategory !== "ALL" && doc.category !== selectedCategory) {
        return false;
      }

      // Search Query (name, clinic, specialty, address, qualifications)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = doc.name.toLowerCase().includes(q);
        const matchesClinic = doc.clinicName.toLowerCase().includes(q);
        const matchesSpec = doc.specialty.toLowerCase().includes(q);
        const matchesAddr = doc.clinicAddress.toLowerCase().includes(q);
        const matchesQual = doc.qualifications.some((ql: string) => ql.toLowerCase().includes(q));
        if (!matchesName && !matchesClinic && !matchesSpec && !matchesAddr && !matchesQual) {
          return false;
        }
      }

      // Specialty filter
      if (selectedSpecialty !== "ALL" && doc.specialty !== selectedSpecialty) {
        return false;
      }

      // Language filter
      if (selectedLanguage !== "ALL" && !doc.languages.includes(selectedLanguage)) {
        return false;
      }

      // Distance filter
      if (maxDistance !== 999) {
        const dist = doc.distanceKm ?? 999;
        if (dist > maxDistance) return false;
      }

      // Fee Range filter
      const feeRange = FEE_OPTIONS[feeRangeIndex];
      if (doc.consultationFee < feeRange.min || doc.consultationFee > feeRange.max) {
        return false;
      }

      // Available Today
      if (availableTodayOnly) {
        const next = doc.nextAvailableSlot.toLowerCase();
        if (!next.includes("today") && !next.includes("available on") && !next.includes("24x7")) {
          return false;
        }
      }

      // Open Now
      if (openNowOnly && !doc.openNow) {
        return false;
      }

      // Home Visit Available
      if (homeVisitOnly && !doc.homeVisitAvailable) {
        return false;
      }

      // Consultation Mode
      if (selectedMode !== "ALL" && !doc.consultationModes.includes(selectedMode)) {
        return false;
      }

      // Department filter
      if (selectedDept && selectedDept !== "All") {
        const match = doc.specialty?.toLowerCase().includes(selectedDept.toLowerCase());
        if (!match) return false;
      }

      return true;
    });
  }, [
    selectedCategory,
    searchQuery,
    selectedSpecialty,
    selectedLanguage,
    maxDistance,
    feeRangeIndex,
    availableTodayOnly,
    openNowOnly,
    homeVisitOnly,
    selectedMode,
    selectedDept
  ]);

  // Provider Category count helper
  const getCategoryCount = (cat: ProviderCategory | "ALL") => {
    if (cat === "ALL") return SEED_DOCTORS.length;
    return SEED_DOCTORS.filter((d: DoctorDto) => d.category === cat).length;
  };

  const handleConfirmAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorForBooking) return;
    const patient = familyMembers.find(f => f.id === bookingPatientId);
    const chosenSlot = bookingSlot || selectedDoctorForBooking.nextAvailableSlot;
    
    setBookingSuccessAlert(
      `Appointment confirmed with ${selectedDoctorForBooking.name} for ${patient?.fullName} at ${chosenSlot} (${bookingMode})! Synced to Health Vault.`
    );
    if (onBookAppointment) {
      onBookAppointment(selectedDoctorForBooking);
    }
    setTimeout(() => {
      setSelectedDoctorForBooking(null);
      setBookingSlot("");
      setBookingSuccessAlert(null);
    }, 3500);
  };

  const handleConfirmCampReservation = (camp: HealthCampDto) => {
    setCampSuccessAlert(
      `Slot reserved for "${camp.title}" at ${camp.venue} (${camp.date}, ${camp.startTime})! Private screening passes sent to your app.`
    );
    if (onCampRegister) {
      onCampRegister(camp);
    }
    setTimeout(() => {
      setSelectedCampForBooking(null);
      setCampSuccessAlert(null);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* ── 1. EMERGENCY FACILITIES 1-TAP BANNER ── */}
      <div className="bg-gradient-to-r from-red-950 via-rose-900 to-red-900 rounded-3xl p-5 text-white shadow-lg border border-red-800/50">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-pulse">🚨</span>
              <h2 className="text-xl font-bold tracking-tight">Nearby Emergency Facilities</h2>
              <span className="bg-red-500 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">
                24x7 Direct Dispatch
              </span>
            </div>
            <p className="text-rose-200 text-xs mt-1">
              Immediate community response: ambulance stationed at Gate 1, Level 1 clinic, trauma centers, and round-the-clock pharmacies.
            </p>
          </div>
          <div className="text-xs bg-red-950/80 px-3 py-1.5 rounded-xl border border-red-700/60 text-rose-300 font-medium">
            🛡️ Zero-Wait Priority for Mana Residents
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {SEED_EMERGENCY_CONTACTS.map((contact: HealthEmergencyContactDto) => (
            <div
              key={contact.id}
              className="bg-white/10 hover:bg-white/15 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 flex flex-col justify-between transition"
            >
              <div>
                <div className="flex justify-between items-start gap-1">
                  <h3 className="font-bold text-sm text-white leading-tight">{contact.name}</h3>
                  <span className="bg-emerald-500/30 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {contact.distanceKm === 0 ? "On-Campus" : `${contact.distanceKm} km`}
                  </span>
                </div>
                <p className="text-[11px] text-rose-200 mt-1">📍 {contact.address}</p>
                {contact.is24x7 && (
                  <span className="inline-block mt-1 text-[10px] text-emerald-400 font-semibold">
                    ● 24x7 Ready
                  </span>
                )}
              </div>

              <a
                href={`tel:${contact.phone.replace(/[^0-9+]/g, "")}`}
                className="mt-3 w-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-2 shadow transition"
              >
                <span>📞 Call</span>
                <span>{contact.phone}</span>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. COMMUNITY HEALTH CAMPS & EXCLUSIVE RESIDENT OFFERS ── */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-cyan-950 rounded-3xl p-5 text-white shadow-lg border border-teal-800/40">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-teal-800/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⛺</span>
              <h2 className="text-xl font-bold tracking-tight">Community Health Camps & Society Offers</h2>
              <span className="bg-teal-500 text-teal-950 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                Clubhouse Drives
              </span>
            </div>
            <p className="text-teal-200 text-xs mt-1">
              Preventive screening drives and partner hospital discounts organized by the Mana Health Committee.
            </p>
          </div>
          <div className="text-xs text-teal-300 bg-teal-950/60 border border-teal-700/50 px-3 py-1.5 rounded-xl font-medium">
            🔒 Results encrypted into your personal Health Vault
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
          {SEED_HEALTH_CAMPS.slice(0, 3).map((camp: HealthCampDto) => (
            <div
              key={camp.id}
              className="bg-white/10 hover:bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex flex-col justify-between transition space-y-3"
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <span className="bg-teal-400 text-teal-950 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                    {camp.isFree ? "Free Camp" : `₹${camp.feePerResident}`}
                  </span>
                  <span className="text-[11px] text-teal-200 font-medium">
                    📅 {camp.date}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-white mt-2 leading-snug">{camp.title}</h3>
                <p className="text-xs text-teal-200 mt-1">🏢 By {camp.partnerProviderName}</p>
                <p className="text-[11px] text-teal-100/80 mt-1">📍 {camp.venue} • {camp.startTime} - {camp.endTime}</p>

                <div className="flex flex-wrap gap-1 mt-2.5">
                  {camp.servicesIncluded.slice(0, 3).map((srv: string, idx: number) => (
                    <span key={idx} className="bg-teal-950/70 text-teal-200 text-[10px] px-2 py-0.5 rounded-md border border-teal-700/50">
                      ✓ {srv}
                    </span>
                  ))}
                  {camp.servicesIncluded.length > 3 && (
                    <span className="text-[10px] text-teal-300">+{camp.servicesIncluded.length - 3} more</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-teal-800/60 flex items-center justify-between">
                <span className="text-[11px] text-emerald-300 font-semibold">
                  {camp.availableSlots} slots left
                </span>
                <button
                  onClick={() => setSelectedCampForBooking(camp)}
                  className="bg-emerald-400 hover:bg-emerald-300 text-teal-950 text-xs font-bold py-1.5 px-3 rounded-xl transition shadow"
                >
                  Reserve Slot
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. ZERO-LEAK PRIVACY SHIELD ── */}
      <div className="bg-gradient-to-r from-blue-50 via-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <h4 className="font-bold text-teal-950 text-sm">Mana Health Privacy Shield Guarantee</h4>
            <p className="text-xs text-teal-800">
              Browse providers and book appointments with complete confidentiality. Your searches, medical history, prescriptions, and health conditions are strictly private and never visible to neighbours or community admins.
            </p>
          </div>
        </div>
        <div className="shrink-0 bg-white px-3 py-1 rounded-xl border border-teal-300 text-teal-900 text-xs font-bold shadow-sm">
          🔒 Zero-Data-Leak Verified
        </div>
      </div>

      {/* ── 4. CATEGORY TABS ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORY_TABS.map(tab => {
          const isActive = selectedCategory === tab.id;
          const count = getCategoryCount(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition whitespace-nowrap border ${
                isActive
                  ? "bg-teal-700 text-white border-teal-700 shadow-md"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isActive ? "bg-teal-900/50 text-teal-200" : "bg-gray-100 text-gray-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 5. MULTI-FACETED FILTER & SEARCH CONTROLS ── */}
      <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-4">
        {/* Main Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by doctor name, clinic, specialty (e.g., Cardiologist, Pediatrician, Dentist, Physio, ICU Attendant)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full p-3.5 pl-11 border border-gray-300 rounded-2xl shadow-inner text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
          />
          <span className="absolute left-4 top-3.5 text-gray-400 text-base">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-3 text-xs text-gray-400 hover:text-gray-600 font-bold px-2 py-1"
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Department Quick-Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {["All", "Cardiology", "Pediatrics", "Orthopedics", "Dermatology", "Neurology", "Gynecology", "Ophthalmology", "ENT", "Psychiatry", "Oncology", "General Medicine"].map(dept => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                selectedDept === dept
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-teal-400 hover:text-teal-700"
              }`}
            >
              {dept === "All" ? "All Depts" : dept}
            </button>
          ))}
        </div>

        {/* Dropdowns Row: Specialty, Distance, Language, Fee, Mode */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Specialty Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Specialty</label>
            <select
              value={selectedSpecialty}
              onChange={e => setSelectedSpecialty(e.target.value)}
              className="w-full p-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="ALL">All Specialties</option>
              {specialties.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          {/* Distance Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Distance</label>
            <select
              value={maxDistance}
              onChange={e => setMaxDistance(Number(e.target.value))}
              className="w-full p-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              {DISTANCE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Language Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Language</label>
            <select
              value={selectedLanguage}
              onChange={e => setSelectedLanguage(e.target.value)}
              className="w-full p-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="ALL">All Languages</option>
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          {/* Consultation Fee Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Consultation Fee</label>
            <select
              value={feeRangeIndex}
              onChange={e => setFeeRangeIndex(Number(e.target.value))}
              className="w-full p-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              {FEE_OPTIONS.map((opt, idx) => (
                <option key={idx} value={idx}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Mode Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Consultation Mode</label>
            <select
              value={selectedMode}
              onChange={e => setSelectedMode(e.target.value as any)}
              className="w-full p-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="ALL">All Modes</option>
              <option value="IN_PERSON">🏥 In-Person Clinic</option>
              <option value="VIDEO">📹 Video Call</option>
              <option value="PHONE">📞 Phone</option>
            </select>
          </div>
        </div>

        {/* Quick Toggles Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={availableTodayOnly}
                onChange={e => setAvailableTodayOnly(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
              />
              <span>⚡ Available Today</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={openNowOnly}
                onChange={e => setOpenNowOnly(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
              />
              <span>🟢 Open Now</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={homeVisitOnly}
                onChange={e => setHomeVisitOnly(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
              />
              <span>🏡 Home Visit / Sample Collection</span>
            </label>
          </div>

          <div className="text-xs text-gray-500 font-medium">
            Showing <strong className="text-teal-800">{filteredProviders.length}</strong> of {SEED_DOCTORS.length} providers
          </div>
        </div>
      </div>

      {/* ── 6. PROVIDERS GRID ── */}
      {filteredProviders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-sm space-y-3">
          <div className="text-4xl">🔍</div>
          <h3 className="text-lg font-bold text-gray-800">No providers matched your filters</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Try adjusting your search keywords, increasing maximum distance, or resetting specialty/language filters.
          </p>
          <button
            onClick={() => {
              setSelectedCategory("ALL");
              setSearchQuery("");
              setSelectedSpecialty("ALL");
              setSelectedLanguage("ALL");
              setMaxDistance(999);
              setFeeRangeIndex(0);
              setAvailableTodayOnly(false);
              setOpenNowOnly(false);
              setHomeVisitOnly(false);
              setSelectedMode("ALL");
            }}
            className="mt-2 bg-teal-600 text-white text-xs font-bold py-2 px-4 rounded-xl hover:bg-teal-700 transition"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProviders.map((provider: DoctorDto) => (
            <div
              key={provider.id}
              className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header Row: Name, Verified Badge, Rating, Fee */}
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-base text-gray-900 leading-tight">{provider.name}</h3>
                      {provider.verifiedBadge && (
                        <span
                          title={`Verified by ${provider.medicalCouncil} (${provider.registrationNumber})`}
                          className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1"
                        >
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-teal-700 font-bold mt-0.5">{provider.specialty}</p>
                    <p className="text-[11px] text-gray-500">
                      {provider.qualifications.join(", ")} • {provider.experienceYears} yrs exp
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-lg font-bold">
                      ⭐ {provider.rating} <span className="text-gray-400 text-[10px]">({provider.reviewCount})</span>
                    </span>
                    <p className="text-sm font-extrabold text-gray-900 mt-1">
                      {provider.consultationFee === 0 ? "Free" : `₹${provider.consultationFee}`}
                    </p>
                  </div>
                </div>

                {/* Registration & Council Tag */}
                <div className="bg-slate-50 p-2.5 rounded-2xl text-xs space-y-1 text-gray-700 border border-slate-100">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-500 font-medium">Reg: <strong>{provider.registrationNumber}</strong></span>
                    <span className="text-gray-600 font-medium text-[10px]">{provider.medicalCouncil}</span>
                  </div>
                  <p className="text-gray-800 font-medium">
                    📍 <strong>{provider.clinicName}</strong>
                  </p>
                  <p className="text-gray-500 text-[11px] flex justify-between">
                    <span>{provider.clinicAddress}</span>
                    {provider.distanceKm !== undefined && (
                      <span className="font-bold text-teal-800 shrink-0 ml-1">
                        {provider.distanceKm === 0 ? "In-Campus" : `${provider.distanceKm} km`}
                      </span>
                    )}
                  </p>
                  <p className="text-gray-500 text-[11px]">🗣️ Languages: {provider.languages.join(", ")}</p>
                </div>

                {/* Community Trust Badge */}
                <div className="bg-teal-50/80 p-2.5 rounded-2xl text-xs text-teal-950 font-medium border border-teal-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span>👥</span>
                    <span><strong>{provider.verifiedCommunityConsultations} neighbors</strong> consulted</span>
                  </div>
                  {provider.openNow && (
                    <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Open Now
                    </span>
                  )}
                </div>

                {/* Community Exclusive Offer (if any) */}
                {provider.communityOffer && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-2.5 rounded-2xl text-xs space-y-0.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-amber-900">{provider.communityOffer.title}</span>
                      <span className="bg-amber-500 text-white font-extrabold text-[10px] px-1.5 py-0.2 rounded">
                        {provider.communityOffer.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800">{provider.communityOffer.description}</p>
                  </div>
                )}

                {/* Accreditation Badges */}
                {(provider as any).accreditations && (provider as any).accreditations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {(provider as any).accreditations.map((a: string, i: number) => (
                      <span key={i} className="flex items-center gap-1 bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        🏅 {a}
                      </span>
                    ))}
                  </div>
                )}

                {/* Next Slot & Modes */}
                <div className="flex justify-between items-center text-xs text-gray-600 pt-1">
                  <span>
                    Slot: <strong className="text-emerald-700">{provider.nextAvailableSlot}</strong>
                  </span>
                  <div className="flex gap-1">
                    {provider.consultationModes.map((m: ConsultationMode) => (
                      <span key={m} className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                        {m === "IN_PERSON" ? "🏥" : m === "VIDEO" ? "📹" : "📞"}
                      </span>
                    ))}
                    {provider.homeVisitAvailable && (
                      <span title="Home Visit Available" className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                        🏡
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setSelectedDoctorForDetails(provider)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 rounded-xl transition text-center"
                  >
                    View Credentials
                  </button>
                  <button
                    onClick={() => setSelectedDoctorForHours(provider)}
                    className="w-full bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold py-2 rounded-xl transition text-center border border-teal-200"
                  >
                    Clinic Hours
                  </button>
                </div>

                <div className="flex gap-2">
                  {(provider as any).mapsUrl && (
                    <a
                      href={(provider as any).mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 font-bold py-2.5 px-3 rounded-xl transition text-xs flex items-center justify-center"
                      title="Get Directions"
                    >
                      📍
                    </a>
                  )}
                  {provider.phone && (
                    <a
                      href={`tel:${provider.phone.replace(/[^0-9+]/g, "")}`}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-3 rounded-xl transition text-xs flex items-center justify-center"
                      title={`Call ${provider.name}`}
                    >
                      📞
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setSelectedDoctorForBooking(provider);
                      setBookingSlot(provider.appointmentSlots?.[0]?.time || provider.nextAvailableSlot);
                    }}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl transition text-xs shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <span>📅 Book Appointment</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL 1: CREDENTIALS & REVIEWS ── */}
      {selectedDoctorForDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-xl text-gray-900">{selectedDoctorForDetails.name}</h3>
                  {selectedDoctorForDetails.verifiedBadge && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-teal-700 font-bold mt-0.5">{selectedDoctorForDetails.specialty}</p>
                <p className="text-xs text-gray-500">{selectedDoctorForDetails.qualifications.join(", ")} • {selectedDoctorForDetails.experienceYears} Years Experience</p>
              </div>
              <button
                onClick={() => setSelectedDoctorForDetails(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl p-1"
              >
                ✕
              </button>
            </div>

            {/* Official Credentials Breakdown */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <h4 className="font-bold text-gray-900 uppercase text-[11px] tracking-wider">
                Official Registration & Council Credentials
              </h4>
              <div className="grid grid-cols-2 gap-2 text-gray-700">
                <div>
                  <span className="text-gray-500 block">Registration Number:</span>
                  <strong className="text-gray-900">{selectedDoctorForDetails.registrationNumber}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Accrediting Council:</span>
                  <strong className="text-gray-900">{selectedDoctorForDetails.medicalCouncil}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Clinic Address:</span>
                  <strong className="text-gray-900">{selectedDoctorForDetails.clinicAddress}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Contact:</span>
                  <strong className="text-gray-900">{selectedDoctorForDetails.phone || "On Request"}</strong>
                </div>
              </div>
              {selectedDoctorForDetails.hospitalAffiliations?.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-gray-500 block">Hospital Affiliations:</span>
                  <strong className="text-gray-900">{selectedDoctorForDetails.hospitalAffiliations.join(", ")}</strong>
                </div>
              )}
            </div>

            {/* About / Summary */}
            <div className="text-xs text-gray-700 leading-relaxed bg-teal-50/50 p-3.5 rounded-2xl border border-teal-100">
              <h5 className="font-bold text-teal-950 mb-1">About the Practice:</h5>
              <p>{selectedDoctorForDetails.about || "Dedicated community healthcare partner committed to clinical excellence and resident wellness."}</p>
            </div>

            {/* Anonymous Resident Reviews */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm text-gray-900">
                  Community Reviews ({selectedDoctorForDetails.reviews?.length || 0})
                </h4>
                <span className="text-xs bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-lg font-bold">
                  ⭐ {selectedDoctorForDetails.rating} / 5
                </span>
              </div>

              {(!selectedDoctorForDetails.reviews || selectedDoctorForDetails.reviews.length === 0) ? (
                <div className="bg-gray-50 p-4 rounded-xl text-center text-xs text-gray-500">
                  No community reviews recorded yet. All feedback from verified residents is anonymized.
                </div>
              ) : (
                selectedDoctorForDetails.reviews.map((rev: DoctorReview, idx: number) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-2xl border border-gray-200 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-800">{rev.authorName}</span>
                      <span className="text-[11px] text-gray-500">{rev.date}</span>
                    </div>
                    {rev.comment && <p className="text-gray-600 italic">"{rev.comment}"</p>}
                    <div className="flex gap-3 text-[11px] text-gray-500 pt-1">
                      <span>Communication: ⭐ {rev.communication}/5</span>
                      <span>Wait Time: ⭐ {rev.waitingTime}/5</span>
                      <span>Clinic: ⭐ {rev.clinicExperience}/5</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setSelectedDoctorForDetails(null);
                  setSelectedDoctorForBooking(selectedDoctorForDetails);
                  setBookingSlot(selectedDoctorForDetails.appointmentSlots?.[0]?.time || selectedDoctorForDetails.nextAvailableSlot);
                }}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-2xl transition text-sm shadow-md"
              >
                Book Appointment with {selectedDoctorForDetails.name}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: CLINIC HOURS & SLOTS ── */}
      {selectedDoctorForHours && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="font-extrabold text-lg text-gray-900">{selectedDoctorForHours.clinicName}</h3>
                <p className="text-xs text-teal-700 font-bold">{selectedDoctorForHours.name} • {selectedDoctorForHours.specialty}</p>
                <p className="text-xs text-gray-500">📍 {selectedDoctorForHours.clinicAddress}</p>
              </div>
              <button
                onClick={() => setSelectedDoctorForHours(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase text-gray-700 tracking-wider">Weekly Schedule</h4>
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden text-xs">
                {selectedDoctorForHours.clinicHours?.map((slot: ClinicHourSlot, idx: number) => (
                  <div key={idx} className="p-3 flex justify-between items-center bg-white hover:bg-gray-50">
                    <span className="font-bold text-gray-800">{slot.day}</span>
                    {slot.is24x7 ? (
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                        24x7 Open
                      </span>
                    ) : slot.isClosed ? (
                      <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[11px]">
                        Closed
                      </span>
                    ) : (
                      <div className="text-right text-gray-600 space-y-0.5">
                        {slot.morning && <div>🌅 {slot.morning}</div>}
                        {slot.evening && <div>🌇 {slot.evening}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Real-time appointment slots preview */}
            {selectedDoctorForHours.appointmentSlots && selectedDoctorForHours.appointmentSlots.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase text-gray-700 tracking-wider">Available Slots Today</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedDoctorForHours.appointmentSlots.map((slot: AppointmentSlot) => (
                    <div
                      key={slot.id}
                      className="p-2 rounded-xl text-center text-xs font-semibold border bg-emerald-50 text-emerald-900 border-emerald-200"
                    >
                      {slot.time} ({slot.mode === "IN_PERSON" ? "Clinic" : "Video"})
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              {selectedDoctorForHours.phone && (
                <a
                  href={`tel:${selectedDoctorForHours.phone.replace(/[^0-9+]/g, "")}`}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl transition text-xs flex items-center justify-center gap-1.5"
                >
                  <span>📞 Call</span>
                </a>
              )}
              <button
                onClick={() => {
                  const doc = selectedDoctorForHours;
                  setSelectedDoctorForHours(null);
                  setSelectedDoctorForBooking(doc);
                  setBookingSlot(doc.appointmentSlots?.[0]?.time || doc.nextAvailableSlot);
                }}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl transition text-xs shadow-md"
              >
                Proceed to Book Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: BOOKING FORM ── */}
      {selectedDoctorForBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="font-extrabold text-lg text-gray-900">Book with {selectedDoctorForBooking.name}</h3>
                <p className="text-xs text-teal-700 font-semibold">
                  {selectedDoctorForBooking.specialty} • Fee: ₹{selectedDoctorForBooking.consultationFee}
                </p>
                <p className="text-xs text-gray-500">📍 {selectedDoctorForBooking.clinicName}</p>
              </div>
              <button
                onClick={() => setSelectedDoctorForBooking(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {bookingSuccessAlert ? (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-2xl text-sm font-semibold space-y-1">
                <p>✓ {bookingSuccessAlert}</p>
                <p className="text-xs text-emerald-700">A reminder has been added to your Health Dashboard.</p>
              </div>
            ) : (
              <form onSubmit={handleConfirmAppointment} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Select Patient (Family Member):
                  </label>
                  <select
                    value={bookingPatientId}
                    onChange={e => setBookingPatientId(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    {familyMembers.map((f: FamilyMemberDto) => (
                      <option key={f.id} value={f.id}>
                        {f.fullName} ({f.relationship}, {f.age} yrs) - Blood: {f.bloodGroup}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Consultation Mode:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedDoctorForBooking.consultationModes.map((mode: ConsultationMode) => (
                      <button
                        type="button"
                        key={mode}
                        onClick={() => setBookingMode(mode)}
                        className={`p-2.5 rounded-xl text-xs font-semibold border transition ${
                          bookingMode === mode
                            ? "bg-teal-700 text-white border-teal-700 shadow-sm"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {mode === "IN_PERSON" ? "🏥 Clinic" : mode === "VIDEO" ? "📹 Video" : "📞 Phone"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Available Slot Picker */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Select Slot:</label>
                  {selectedDoctorForBooking.appointmentSlots && selectedDoctorForBooking.appointmentSlots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedDoctorForBooking.appointmentSlots.map((slot: AppointmentSlot) => (
                        <button
                          type="button"
                          key={slot.id}
                          onClick={() => setBookingSlot(slot.time)}
                          className={`p-2 rounded-xl text-xs font-medium border text-left transition ${
                            bookingSlot === slot.time
                              ? "bg-teal-50 border-teal-600 text-teal-900 font-bold ring-2 ring-teal-500"
                              : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          ⏰ {slot.time} ({slot.period})
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs text-gray-700">
                      Next earliest slot: <strong>{selectedDoctorForBooking.nextAvailableSlot}</strong>
                    </div>
                  )}
                </div>

                {/* Privacy Guarantee Note */}
                <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
                  <span>🔒</span>
                  <span>
                    Your appointment is private. Consultation notes and prescriptions will be saved only to your Health Vault.
                  </span>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedDoctorForBooking(null)}
                    className="px-4 py-2.5 text-xs text-gray-600 hover:text-gray-800 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-6 rounded-xl transition text-xs shadow-md"
                  >
                    Confirm Appointment
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL 4: CAMP RESERVATION ── */}
      {selectedCampForBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <span className="bg-teal-100 text-teal-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                  Clubhouse Camp
                </span>
                <h3 className="font-extrabold text-lg text-gray-900 mt-1">{selectedCampForBooking.title}</h3>
                <p className="text-xs text-teal-700 font-semibold">Organized by {selectedCampForBooking.partnerProviderName}</p>
              </div>
              <button
                onClick={() => setSelectedCampForBooking(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl p-1"
              >
                ✕
              </button>
            </div>

            {campSuccessAlert ? (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-2xl text-sm font-semibold">
                ✓ {campSuccessAlert}
              </div>
            ) : (
              <div className="space-y-3 text-xs text-gray-700">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 space-y-1">
                  <p>📍 <strong>Venue:</strong> {selectedCampForBooking.venue}</p>
                  <p>📅 <strong>Date:</strong> {selectedCampForBooking.date} ({selectedCampForBooking.startTime} - {selectedCampForBooking.endTime})</p>
                  <p>💰 <strong>Fee:</strong> {selectedCampForBooking.isFree ? "Free for Mana Residents" : `₹${selectedCampForBooking.feePerResident}`}</p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-gray-900">Services Included:</h4>
                  <ul className="list-disc pl-5 space-y-0.5 text-gray-600">
                    {selectedCampForBooking.servicesIncluded.map((s: string, idx: number) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-emerald-900">
                  🛡️ <strong>Zero-Leak Privacy:</strong> Camp medical reports are directly uploaded to your private encrypted Health Vault.
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setSelectedCampForBooking(null)}
                    className="px-4 py-2.5 text-gray-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleConfirmCampReservation(selectedCampForBooking)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-xl transition shadow"
                  >
                    Confirm My Slot ({selectedCampForBooking.availableSlots} left)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
