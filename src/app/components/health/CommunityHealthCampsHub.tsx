import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  AlertCircle,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Stethoscope,
  Heart,
  Eye,
  Syringe,
  Baby,
  Smile,
  QrCode,
  FileText,
  Activity,
  ArrowRight,
  TrendingUp,
  Award,
  ChevronRight,
  UserCheck,
  Building2,
  CalendarDays,
  Flame,
  AlertTriangle,
  XCircle,
  PlusCircle
} from "lucide-react";
import type {
  HealthCampDto,
  HealthCampRegistrationDto,
  CampCategory,
  FamilyMemberDto,
  CampVitals,
  MedicalRecordDto
} from "../../../types/health";
import { healthService } from "../../../services/healthService";
import { CampSlotBookingModal } from "./CampSlotBookingModal";
import { CampPassModal } from "./CampPassModal";
import { CampPartnerReportModal } from "./CampPartnerReportModal";

interface CommunityHealthCampsHubProps {
  onNavigateToVault?: () => void;
  onNavigateToEvents?: (eventId?: number | string) => void;
}

export const CommunityHealthCampsHub: React.FC<CommunityHealthCampsHubProps> = ({
  onNavigateToVault,
  onNavigateToEvents
}) => {
  const [subTab, setSubTab] = useState<"camps" | "my_passes" | "desk" | "reports">("camps");
  const [camps, setCamps] = useState<HealthCampDto[]>([]);
  const [registrations, setRegistrations] = useState<HealthCampRegistrationDto[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [audienceFilter, setAudienceFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [bookingCamp, setBookingCamp] = useState<HealthCampDto | null>(null);
  const [activePassReg, setActivePassReg] = useState<HealthCampRegistrationDto | null>(null);
  const [viewingReportCamp, setViewingReportCamp] = useState<HealthCampDto | null>(null);

  // Success notifications
  const [feedbackToast, setFeedbackToast] = useState<{ title: string; message: string; type: "success" | "info" } | null>(null);

  // On-Site Attendance Desk State
  const [selectedDeskCampId, setSelectedDeskCampId] = useState<string>("");
  const [deskSearch, setDeskSearch] = useState("");
  const [deskStatusFilter, setDeskStatusFilter] = useState<string>("ALL");
  const [recordingReg, setRecordingReg] = useState<HealthCampRegistrationDto | null>(null);
  const [vitalsInput, setVitalsInput] = useState<CampVitals>({
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    bloodSugarMgDl: 95,
    bloodSugarType: "FASTING",
    pulseBpm: 72,
    spo2Percent: 99,
    weightKg: 68,
    heightCm: 170
  });
  const [doctorNotes, setDoctorNotes] = useState("");
  const [referralSpecialty, setReferralSpecialty] = useState("");
  const [vaccineBatch, setVaccineBatch] = useState("VAX-2026-B812");
  const [dentalFindingsInput, setDentalFindingsInput] = useState({
    cariesDetected: false,
    scalingNeeded: false,
    notes: ""
  });
  const [visionFindingsInput, setVisionFindingsInput] = useState({
    leftEyeAcuity: "6/6",
    rightEyeAcuity: "6/6",
    glassesAdvised: false,
    notes: ""
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [campsData, regsData, familyData] = await Promise.all([
        healthService.getHealthCamps(),
        healthService.getCampRegistrations(),
        healthService.getFamilyMembers()
      ]);
      setCamps(campsData);
      setRegistrations(regsData);
      setFamilyMembers(familyData);
      if (campsData.length > 0 && !selectedDeskCampId) {
        setSelectedDeskCampId(campsData[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (title: string, message: string, type: "success" | "info" = "success") => {
    setFeedbackToast({ title, message, type });
    setTimeout(() => setFeedbackToast(null), 5000);
  };

  // Filtered camps
  const filteredCamps = camps.filter(camp => {
    const matchesCategory =
      categoryFilter === "ALL" ||
      (categoryFilter === "DIABETES_BP" && (camp.campCategory === "DIABETES_BP" || camp.campCategory === "DIABETES_CARDIAC")) ||
      camp.campCategory === categoryFilter;

    const matchesAudience =
      audienceFilter === "ALL" ||
      camp.targetAudience === audienceFilter ||
      camp.targetAudience === "ALL";

    const matchesSearch =
      searchQuery.trim() === "" ||
      camp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      camp.partnerProviderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      camp.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      camp.servicesIncluded.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesAudience && matchesSearch;
  });

  // Category Icons & Helpers
  const getCategoryMeta = (cat: CampCategory) => {
    switch (cat) {
      case "DIABETES_BP":
      case "DIABETES_CARDIAC":
        return { label: "Diabetes & BP", icon: Heart, color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" };
      case "VACCINATION":
        return { label: "Vaccination Drive", icon: Syringe, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" };
      case "SENIOR_SCREENING":
        return { label: "Senior Screening", icon: Users, color: "text-amber-800", bg: "bg-amber-50", border: "border-amber-200" };
      case "KIDS_NUTRITION":
        return { label: "Kids & Nutrition", icon: Baby, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" };
      case "DENTAL_EYE":
        return { label: "Dental & Vision", icon: Eye, color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200" };
      default:
        return { label: "General Health", icon: Stethoscope, color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200" };
    }
  };

  // Booking Success
  const handleBookingSuccess = (reg: HealthCampRegistrationDto) => {
    setBookingCamp(null);
    loadData();
    setActivePassReg(reg);
    showToast(
      "Slot Reserved Successfully!",
      `Reserved slot ${reg.slotTime} for ${reg.patientName} (${reg.tokenNumber}). Vitals will be privately synced to your Vault.`
    );
  };

  // Check-In on site
  const handleCheckIn = async (regId: string) => {
    try {
      await healthService.checkInParticipant(regId);
      loadData();
      showToast("Checked In!", "Participant token checked in at Clubhouse reception desk.");
    } catch (err: any) {
      alert(err.message || "Failed to check in");
    }
  };

  // Cancel Booking
  const handleCancelRegistration = async (regId: string) => {
    if (!confirm("Are you sure you want to cancel this camp slot reservation?")) return;
    try {
      await healthService.cancelCampRegistration(regId);
      loadData();
      showToast("Slot Cancelled", "Your reservation was cancelled and the slot released for other residents.", "info");
    } catch (err: any) {
      alert(err.message || "Failed to cancel");
    }
  };

  // Save Vitals and Push to Vault
  const handleSaveVitalsAndComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingReg) return;

    // Calculate BMI if height and weight provided
    let calculatedBmi = vitalsInput.bmi;
    let bmiCategory = vitalsInput.bmiCategory;
    if (vitalsInput.heightCm && vitalsInput.weightKg) {
      const heightM = vitalsInput.heightCm / 100;
      calculatedBmi = vitalsInput.weightKg / (heightM * heightM);
      if (calculatedBmi < 18.5) bmiCategory = "UNDERWEIGHT";
      else if (calculatedBmi < 25) bmiCategory = "NORMAL";
      else if (calculatedBmi < 30) bmiCategory = "OVERWEIGHT";
      else bmiCategory = "OBESE";
    }

    try {
      await healthService.recordCampVitalsAndComplete(
        recordingReg.id,
        {
          ...vitalsInput,
          bmi: calculatedBmi,
          bmiCategory
        },
        doctorNotes,
        referralSpecialty || undefined,
        {
          vaccine: recordingReg.campTitle.toLowerCase().includes("vaccin")
            ? {
                vaccineName: "Influenza Quadrivalent 2026/27",
                batchNumber: vaccineBatch,
                dose: "0.5 mL IM",
                administeredBy: "Nurse Kavitha (Staff Reg #4920)"
              }
            : undefined,
          dental: dentalFindingsInput.cariesDetected || dentalFindingsInput.scalingNeeded ? dentalFindingsInput : undefined,
          vision: visionFindingsInput.glassesAdvised || visionFindingsInput.notes ? visionFindingsInput : undefined
        }
      );

      setRecordingReg(null);
      setDoctorNotes("");
      setReferralSpecialty("");
      loadData();
      showToast(
        "Screening Completed & Vault Updated!",
        `Clinical report for ${recordingReg.patientName} was securely pushed directly into their Private Health Vault.`
      );
    } catch (err: any) {
      alert(err.message || "Failed to record clinical vitals");
    }
  };

  // Desk Filtered Registrations
  const deskRegistrations = registrations.filter(r => {
    if (selectedDeskCampId && r.campId !== selectedDeskCampId) return false;
    if (deskStatusFilter !== "ALL" && r.attendanceStatus !== deskStatusFilter) return false;
    if (deskSearch.trim()) {
      const q = deskSearch.toLowerCase();
      return (
        r.patientName.toLowerCase().includes(q) ||
        r.tokenNumber.toLowerCase().includes(q) ||
        (r.flatNo && r.flatNo.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed top-6 right-6 z-50 max-w-md bg-white border-2 border-teal-500 rounded-3xl p-4 shadow-2xl animate-in slide-in-from-top-4 flex items-start gap-3">
          <div className="p-2 bg-teal-100 text-teal-800 rounded-2xl shrink-0">
            <CheckCircle2 className="w-5 h-5 text-teal-700" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-bold text-gray-900 text-sm">{feedbackToast.title}</h4>
            <p className="text-xs text-gray-600 leading-snug">{feedbackToast.message}</p>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-emerald-400 text-teal-950 font-black text-[11px] uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
              Community Health Camps
            </span>
            <span className="bg-white/10 text-teal-100 text-xs px-2.5 py-0.5 rounded-full border border-white/20">
              Mana Events Calendar Connected
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Preventive Camps &amp; Clinical Screening Drives
          </h2>
          <p className="text-teal-100 text-xs md:text-sm leading-relaxed">
            Diabetes, blood pressure, pediatric growth, senior screenings, and seasonal vaccination camps hosted at our Clubhouse with accredited hospitals. Reserve 30-minute time slots to skip queues.
          </p>
        </div>

        {/* 5-Stage Camp Lifecycle Architecture */}
        <div className="mt-5 pt-4 border-t border-white/15">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
              End-to-End Privacy-Preserving Camp Lifecycle:
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
            <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-2xl border border-white/15">
              <span className="text-emerald-300 font-extrabold text-[10px] block">Stage 1</span>
              <p className="font-bold text-white text-xs">1. Publish Drive</p>
              <p className="text-[10px] text-teal-100/80 mt-0.5 leading-snug">Admin creates camp with partner &amp; slots</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-2xl border border-white/15">
              <span className="text-emerald-300 font-extrabold text-[10px] block">Stage 2</span>
              <p className="font-bold text-white text-xs">2. Private Booking</p>
              <p className="text-[10px] text-teal-100/80 mt-0.5 leading-snug">Residents select slots for family; zero clinical sharing</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-2xl border border-white/15">
              <span className="text-emerald-300 font-extrabold text-[10px] block">Stage 3</span>
              <p className="font-bold text-white text-xs">3. Clinical Check</p>
              <p className="text-[10px] text-teal-100/80 mt-0.5 leading-snug">Hospital provider verifies token &amp; screens</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-2xl border border-white/15">
              <span className="text-emerald-300 font-extrabold text-[10px] block">Stage 4</span>
              <p className="font-bold text-white text-xs">4. Vault Delivery</p>
              <p className="text-[10px] text-teal-100/80 mt-0.5 leading-snug">Vitals &amp; reports sent straight to patient's Vault</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-2xl border border-white/15">
              <span className="text-emerald-300 font-extrabold text-[10px] block">Stage 5</span>
              <p className="font-bold text-white text-xs">5. De-Identified Totals</p>
              <p className="text-[10px] text-teal-100/80 mt-0.5 leading-snug">Admin sees attendance totals, zero medical data</p>
            </div>
          </div>
        </div>

        {/* Reassurance Banner */}
        <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs text-teal-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>
              <strong>Privacy-by-Design Rule:</strong> Society committee sees aggregate counts (attendance &amp; turnout). Only the resident and their attending clinician can access private blood sugar, BP, and diagnostic reports.
            </span>
          </div>
          {onNavigateToVault && (
            <button
              onClick={onNavigateToVault}
              className="bg-white/15 hover:bg-white/25 text-white font-bold px-3 py-1.5 rounded-xl border border-white/25 transition text-xs flex items-center gap-1.5 shrink-0"
            >
              <FileText className="w-3.5 h-3.5" />
              Open My Health Vault
            </button>
          )}
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {[
            { id: "camps", label: "⛺ Upcoming Camps", count: camps.length },
            { id: "my_passes", label: "🎟️ My Passes & Bookings", count: registrations.length },
            { id: "desk", label: "📋 On-Site Attendance & Vitals Desk" },
            { id: "reports", label: "📊 Partner Reports & Analytics" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition flex items-center gap-2 ${
                subTab === tab.id
                  ? "bg-teal-700 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    subTab === tab.id ? "bg-white/20 text-white" : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {subTab === "camps" && onNavigateToEvents && (
          <button
            onClick={() => onNavigateToEvents()}
            className="text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1.5 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200/80 transition"
          >
            <CalendarDays className="w-3.5 h-3.5 text-teal-700" />
            View Community Events Calendar
          </button>
        )}
      </div>

      {/* ─── TAB 1: UPCOMING CAMPS CATALOG ─── */}
      {subTab === "camps" && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm space-y-3">
            {/* Search and Audience row */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search camps by title, hospital partner, or tests included..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-2xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Target Audience Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                <span className="text-xs font-bold text-gray-500 whitespace-nowrap mr-1">Audience:</span>
                {[
                  { id: "ALL", label: "All" },
                  { id: "SENIORS", label: "👴 Seniors (60+)" },
                  { id: "KIDS", label: "🧒 Kids & Teens" },
                  { id: "ADULTS", label: "Adults" }
                ].map(aud => (
                  <button
                    key={aud.id}
                    onClick={() => setAudienceFilter(aud.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                      audienceFilter === aud.id
                        ? "bg-slate-800 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {aud.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex gap-1.5 overflow-x-auto pt-1 scrollbar-none">
              {[
                { id: "ALL", label: "All Categories", icon: Stethoscope },
                { id: "DIABETES_BP", label: "Diabetes & BP", icon: Heart },
                { id: "VACCINATION", label: "Vaccination Drives", icon: Syringe },
                { id: "SENIOR_SCREENING", label: "Senior Screening", icon: Users },
                { id: "KIDS_NUTRITION", label: "Kids & Nutrition", icon: Baby },
                { id: "DENTAL_EYE", label: "Dental & Vision", icon: Eye }
              ].map(cat => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                      categoryFilter === cat.id
                        ? "bg-teal-700 text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Camps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {filteredCamps.map(camp => {
              const meta = getCategoryMeta(camp.campCategory);
              const CategoryIcon = meta.icon;
              const hasAvailableSlots = camp.availableSlots > 0;

              return (
                <div
                  key={camp.id}
                  className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between space-y-4 relative overflow-hidden"
                >
                  <div className="space-y-3">
                    {/* Header Chips */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 ${meta.bg} ${meta.color} border ${meta.border}`}
                        >
                          <CategoryIcon className="w-3.5 h-3.5" />
                          {meta.label}
                        </span>
                        {camp.targetAudience && camp.targetAudience !== "ALL" && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg">
                            {camp.targetAudience}
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-xs px-2.5 py-1 rounded-xl font-extrabold ${
                          camp.isFree ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {camp.isFree ? "FREE DRIVE" : `₹${camp.feePerResident}`}
                      </span>
                    </div>

                    {/* Title & Partner */}
                    <div>
                      <h3 className="font-black text-xl text-gray-900 leading-snug">{camp.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-teal-700" />
                        Partner: <strong className="text-teal-900">{camp.partnerProviderName}</strong>
                        {camp.partnerHospital?.accreditation && (
                          <span className="text-[10px] bg-teal-50 text-teal-800 px-1.5 py-0.2 rounded border border-teal-200">
                            {camp.partnerHospital.accreditation}
                          </span>
                        )}
                      </p>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed">{camp.description}</p>

                    {/* Fasting Warning Callout */}
                    {camp.fastingInstructions && (
                      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-2.5 text-[11px] text-amber-900 flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">
                          <strong>Fasting Required:</strong> {camp.fastingInstructions}
                        </span>
                      </div>
                    )}

                    {/* Logistics Card */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl text-xs space-y-1.5 text-gray-700 border border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-gray-500">
                          <MapPin className="w-3.5 h-3.5 text-teal-700" /> Venue:
                        </span>
                        <strong className="text-gray-900">{camp.venue}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-gray-500">
                          <Calendar className="w-3.5 h-3.5 text-teal-700" /> Date &amp; Hours:
                        </span>
                        <strong className="text-gray-900">
                          {camp.date} ({camp.startTime} - {camp.endTime})
                        </strong>
                      </div>

                      {/* Slots Capacity Progress */}
                      <div className="pt-1.5 border-t border-gray-200/60">
                        <div className="flex justify-between items-center text-[11px] font-semibold mb-1">
                          <span className="text-gray-500">Available Slots:</span>
                          <span className={hasAvailableSlots ? "text-emerald-700 font-bold" : "text-red-600 font-bold"}>
                            {camp.availableSlots} / {camp.totalSlots} Slots Remaining
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              camp.availableSlots > 10 ? "bg-emerald-500" : camp.availableSlots > 0 ? "bg-amber-500" : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.round(((camp.totalSlots - camp.availableSlots) / camp.totalSlots) * 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Included Services Tags */}
                    <div>
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                        Clinical Parameters &amp; Tests Included:
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {camp.servicesIncluded.map((s, idx) => (
                          <span
                            key={idx}
                            className="bg-gray-100 text-gray-700 text-[11px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="border-t border-gray-100 pt-4 flex items-center gap-2.5">
                    {camp.partnerReport && (
                      <button
                        onClick={() => setViewingReportCamp(camp)}
                        className="py-2.5 px-3 rounded-2xl font-bold text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 transition flex items-center gap-1.5 shrink-0"
                      >
                        <FileText className="w-3.5 h-3.5 text-teal-700" />
                        Partner Report
                      </button>
                    )}

                    <button
                      disabled={!hasAvailableSlots}
                      onClick={() => setBookingCamp(camp)}
                      className={`flex-1 py-2.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 ${
                        !hasAvailableSlots
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-teal-700 hover:bg-teal-800 text-white"
                      }`}
                    >
                      {hasAvailableSlots ? (
                        <>
                          <Calendar className="w-3.5 h-3.5" />
                          Reserve 30-Min Slot
                        </>
                      ) : (
                        "All Slots Booked"
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 2: MY PASSES & ACTIVE BOOKINGS ─── */}
      {subTab === "my_passes" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
            <div>
              <h3 className="text-xl font-bold text-gray-900">🎟️ My Active Camp Passes &amp; Registrations</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Arrival passes for you and your registered dependents. Scan at the Clubhouse entrance desk on camp day.
              </p>
            </div>
            <button
              onClick={() => setSubTab("camps")}
              className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              Book Another Camp Slot
            </button>
          </div>

          {registrations.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
              <QrCode className="w-12 h-12 text-gray-300 mx-auto" />
              <h4 className="font-bold text-gray-800 text-base">No Camp Registrations Yet</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Explore upcoming diabetes, vaccination, and pediatric camps in the Clubhouse and reserve slots for your family.
              </p>
              <button
                onClick={() => setSubTab("camps")}
                className="bg-teal-700 text-white text-xs font-bold px-5 py-2.5 rounded-2xl shadow"
              >
                Browse Upcoming Camps
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {registrations.map(reg => {
                const linkedCamp = camps.find(c => c.id === reg.campId);
                const isCompleted = reg.attendanceStatus === "COMPLETED";

                return (
                  <div
                    key={reg.id}
                    className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between space-y-4 relative"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="font-mono font-bold text-xs bg-teal-100 text-teal-900 px-2.5 py-1 rounded-xl">
                          {reg.tokenNumber}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-xl font-bold uppercase tracking-wider ${
                            isCompleted
                              ? "bg-emerald-100 text-emerald-800"
                              : reg.attendanceStatus === "CHECKED_IN"
                              ? "bg-blue-100 text-blue-800"
                              : reg.attendanceStatus === "CANCELLED"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          ● {reg.attendanceStatus.replace("_", " ")}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-black text-lg text-gray-900">{reg.campTitle}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Patient: <strong className="text-gray-900">{reg.patientName}</strong> (
                          {reg.patientRelationship || "Resident"} • {reg.patientAge || ""}y)
                        </p>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-2xl text-xs space-y-1.5 text-gray-700">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Arrival Slot:</span>
                          <strong className="text-teal-900 font-mono">{reg.slotTime}</strong>
                        </div>
                        {linkedCamp && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Venue:</span>
                            <span className="font-medium text-gray-800">{linkedCamp.venue}</span>
                          </div>
                        )}
                      </div>

                      {/* Vitals summary preview if completed */}
                      {reg.vitals && isCompleted && (
                        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-950 space-y-1">
                          <strong className="block text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                            Recorded Screening Summary:
                          </strong>
                          <p className="text-[11px] leading-relaxed">
                            {reg.vitals.bloodPressureSystolic && `BP: ${reg.vitals.bloodPressureSystolic}/${reg.vitals.bloodPressureDiastolic} mmHg • `}
                            {reg.vitals.bloodSugarMgDl && `Sugar: ${reg.vitals.bloodSugarMgDl} mg/dL • `}
                            {reg.vitals.pulseBpm && `Pulse: ${reg.vitals.pulseBpm} bpm • `}
                            {reg.vitals.bmi && `BMI: ${reg.vitals.bmi.toFixed(1)}`}
                          </p>
                          {reg.clinicalNotes && (
                            <p className="text-[11px] text-gray-600 italic mt-1">"{reg.clinicalNotes}"</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-3 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setActivePassReg(reg)}
                        className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow transition flex items-center gap-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        View Digital Pass
                      </button>

                      {isCompleted ? (
                        onNavigateToVault && (
                          <button
                            onClick={onNavigateToVault}
                            className="text-xs font-bold text-teal-800 hover:text-teal-950 bg-teal-50 px-3.5 py-2.5 rounded-xl border border-teal-200 transition flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View in Vault
                          </button>
                        )
                      ) : reg.attendanceStatus !== "CANCELLED" ? (
                        <button
                          onClick={() => handleCancelRegistration(reg.id)}
                          className="text-xs font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-2 rounded-xl transition"
                        >
                          Cancel Slot
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: ON-SITE ATTENDANCE & CLINICAL VITALS DESK ─── */}
      {subTab === "desk" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                  Staff &amp; Coordinator Desk
                </span>
                <h3 className="text-xl font-bold text-gray-900">📋 On-Site Attendance &amp; Vitals Recording</h3>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Camp check-in queue management and direct point-of-care vital measurements input. Results are automatically encrypted into resident's Vault.
              </p>
            </div>

            {/* Select Active Camp */}
            <div className="w-full md:w-72">
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Select Active Camp:</label>
              <select
                value={selectedDeskCampId}
                onChange={e => setSelectedDeskCampId(e.target.value)}
                className="w-full p-2.5 border rounded-2xl text-xs font-bold text-gray-800 bg-gray-50 outline-none"
              >
                {camps.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.date})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search & Status Filters */}
          <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search participant name, Token (CAMP-DIA-...), or Flat..."
                value={deskSearch}
                onChange={e => setDeskSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-2xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto">
              {[
                { id: "ALL", label: "All Queue" },
                { id: "REGISTERED", label: "Waiting Arrival" },
                { id: "CHECKED_IN", label: "Checked In" },
                { id: "COMPLETED", label: "Completed" }
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setDeskStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    deskStatusFilter === st.id
                      ? "bg-teal-700 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vitals Recording Modal / Drawer */}
          {recordingReg && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
                <div className="bg-gradient-to-r from-teal-800 to-emerald-900 p-6 text-white relative">
                  <button
                    onClick={() => setRecordingReg(null)}
                    className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 p-2 rounded-full"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                  <span className="bg-emerald-400 text-teal-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block mb-1">
                    Clinical Vitals Input
                  </span>
                  <h3 className="text-xl font-bold">Record Vitals: {recordingReg.patientName}</h3>
                  <p className="text-teal-200 text-xs mt-0.5">
                    Token: <strong>{recordingReg.tokenNumber}</strong> • Slot: {recordingReg.slotTime}
                  </p>
                </div>

                <form onSubmit={handleSaveVitalsAndComplete} className="p-6 space-y-4 text-xs">
                  {/* Blood Pressure & Glucose */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-2xl border">
                      <label className="block font-bold text-gray-700 mb-1">Blood Pressure (Systolic / Diastolic):</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Systolic"
                          value={vitalsInput.bloodPressureSystolic || ""}
                          onChange={e => setVitalsInput({ ...vitalsInput, bloodPressureSystolic: Number(e.target.value) })}
                          className="w-1/2 p-2 border rounded-xl font-bold text-center"
                        />
                        <span className="self-center font-bold text-gray-400">/</span>
                        <input
                          type="number"
                          placeholder="Diastolic"
                          value={vitalsInput.bloodPressureDiastolic || ""}
                          onChange={e => setVitalsInput({ ...vitalsInput, bloodPressureDiastolic: Number(e.target.value) })}
                          className="w-1/2 p-2 border rounded-xl font-bold text-center"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border">
                      <label className="block font-bold text-gray-700 mb-1">Blood Glucose (mg/dL):</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="e.g. 104"
                          value={vitalsInput.bloodSugarMgDl || ""}
                          onChange={e => setVitalsInput({ ...vitalsInput, bloodSugarMgDl: Number(e.target.value) })}
                          className="w-2/3 p-2 border rounded-xl font-bold text-center"
                        />
                        <select
                          value={vitalsInput.bloodSugarType || "FASTING"}
                          onChange={e => setVitalsInput({ ...vitalsInput, bloodSugarType: e.target.value as any })}
                          className="w-1/3 p-2 border rounded-xl text-[11px] font-semibold bg-white"
                        >
                          <option value="FASTING">Fasting</option>
                          <option value="RANDOM">Random</option>
                          <option value="HBA1C">HbA1c</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Pulse, SpO2, Height, Weight */}
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block font-bold text-gray-600 mb-1">Pulse (bpm):</label>
                      <input
                        type="number"
                        value={vitalsInput.pulseBpm || ""}
                        onChange={e => setVitalsInput({ ...vitalsInput, pulseBpm: Number(e.target.value) })}
                        className="w-full p-2 border rounded-xl text-center font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-600 mb-1">SpO2 (%):</label>
                      <input
                        type="number"
                        value={vitalsInput.spo2Percent || ""}
                        onChange={e => setVitalsInput({ ...vitalsInput, spo2Percent: Number(e.target.value) })}
                        className="w-full p-2 border rounded-xl text-center font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-600 mb-1">Height (cm):</label>
                      <input
                        type="number"
                        value={vitalsInput.heightCm || ""}
                        onChange={e => setVitalsInput({ ...vitalsInput, heightCm: Number(e.target.value) })}
                        className="w-full p-2 border rounded-xl text-center font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-600 mb-1">Weight (kg):</label>
                      <input
                        type="number"
                        value={vitalsInput.weightKg || ""}
                        onChange={e => setVitalsInput({ ...vitalsInput, weightKg: Number(e.target.value) })}
                        className="w-full p-2 border rounded-xl text-center font-semibold"
                      />
                    </div>
                  </div>

                  {/* Specialized fields if Dental/Eye or Vaccination */}
                  {recordingReg.campTitle.toLowerCase().includes("dental") || recordingReg.campTitle.toLowerCase().includes("vision") ? (
                    <div className="bg-teal-50/70 p-3 rounded-2xl border border-teal-200 space-y-2">
                      <strong className="block font-bold text-teal-900">Dental &amp; Vision Checkup:</strong>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={dentalFindingsInput.cariesDetected}
                            onChange={e => setDentalFindingsInput({ ...dentalFindingsInput, cariesDetected: e.target.checked })}
                          />
                          <span>Dental Caries Observed</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={dentalFindingsInput.scalingNeeded}
                            onChange={e => setDentalFindingsInput({ ...dentalFindingsInput, scalingNeeded: e.target.checked })}
                          />
                          <span>Oral Scaling Recommended</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="block text-[10px] text-gray-600">Left Eye Acuity:</label>
                          <input
                            type="text"
                            value={visionFindingsInput.leftEyeAcuity}
                            onChange={e => setVisionFindingsInput({ ...visionFindingsInput, leftEyeAcuity: e.target.value })}
                            className="w-full p-1.5 border rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-600">Right Eye Acuity:</label>
                          <input
                            type="text"
                            value={visionFindingsInput.rightEyeAcuity}
                            onChange={e => setVisionFindingsInput({ ...visionFindingsInput, rightEyeAcuity: e.target.value })}
                            className="w-full p-1.5 border rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Doctor Notes & Referral */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Doctor Advice / Clinical Notes:</label>
                    <textarea
                      rows={2}
                      value={doctorNotes}
                      onChange={e => setDoctorNotes(e.target.value)}
                      placeholder="e.g. Normal BP. Advised reduction in dietary sodium and annual follow-up."
                      className="w-full p-2.5 border rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Specialist Referral (if required):</label>
                    <input
                      type="text"
                      value={referralSpecialty}
                      onChange={e => setReferralSpecialty(e.target.value)}
                      placeholder="e.g. Cardiologist / Pediatric Ophthalmology"
                      className="w-full p-2.5 border rounded-xl outline-none"
                    />
                  </div>

                  {/* Vault Privacy Reminder */}
                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Submitting automatically generates a digital Clinical Report and saves it to the patient's personal Health Vault.
                    </span>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setRecordingReg(null)}
                      className="px-4 py-2 border rounded-xl font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold shadow"
                    >
                      Complete &amp; Push to Vault
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Participant Queue Table */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-gray-600 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Token #</th>
                    <th className="py-3 px-4">Patient / Dependent</th>
                    <th className="py-3 px-4">Arrival Slot</th>
                    <th className="py-3 px-4">Flat / Phone</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {deskRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        No participants found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    deskRegistrations.map(reg => (
                      <tr key={reg.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-teal-900">
                          {reg.tokenNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <strong className="text-gray-900 block">{reg.patientName}</strong>
                          <span className="text-[11px] text-gray-500">
                            {reg.patientRelationship} • {reg.patientAge ? `${reg.patientAge}y` : ""}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-gray-700">{reg.slotTime}</td>
                        <td className="py-3.5 px-4 text-gray-600">
                          {reg.flatNo || "—"} <br />
                          <span className="text-[10px] text-gray-400">{reg.phone}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider ${
                              reg.attendanceStatus === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-800"
                                : reg.attendanceStatus === "CHECKED_IN"
                                ? "bg-blue-100 text-blue-800"
                                : reg.attendanceStatus === "CANCELLED"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {reg.attendanceStatus.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {reg.attendanceStatus === "REGISTERED" && (
                            <button
                              onClick={() => handleCheckIn(reg.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl shadow-sm text-xs"
                            >
                              Check In
                            </button>
                          )}
                          {reg.attendanceStatus === "CHECKED_IN" && (
                            <button
                              onClick={() => {
                                setRecordingReg(reg);
                                setDoctorNotes(reg.clinicalNotes || "");
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl shadow-sm text-xs"
                            >
                              Record Vitals
                            </button>
                          )}
                          {reg.attendanceStatus === "COMPLETED" && (
                            <button
                              onClick={() => {
                                setRecordingReg(reg);
                                setDoctorNotes(reg.clinicalNotes || "");
                              }}
                              className="text-gray-600 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-semibold"
                            >
                              Edit Vitals
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: PARTNER REPORTS & PARTICIPATION ANALYTICS ─── */}
      {subTab === "reports" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900">📊 Partner Reports &amp; Aggregate Epidemiology</h3>
            <p className="text-xs text-gray-500 mt-1">
              De-identified population health metrics for society health committees and accredited hospital partners. Individual clinical data is strictly confidential.
            </p>
          </div>

          {/* High Level KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                Total Screenings
              </span>
              <p className="text-3xl font-black text-teal-900 mt-1">195</p>
              <span className="text-[11px] text-emerald-700 font-semibold">Across 4 Completed Camps</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                Average Turnout
              </span>
              <p className="text-3xl font-black text-emerald-800 mt-1">92.0%</p>
              <span className="text-[11px] text-gray-500 font-semibold">Minimal No-Show Rate</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                Average Satisfaction
              </span>
              <p className="text-3xl font-black text-amber-800 mt-1">98.5%</p>
              <span className="text-[11px] text-amber-700 font-semibold">Resident Feedback</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                Clinical Referrals
              </span>
              <p className="text-3xl font-black text-blue-900 mt-1">41</p>
              <span className="text-[11px] text-blue-700 font-semibold">Specialist Care Advised</span>
            </div>
          </div>

          {/* Partner Reports Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {camps.map(camp => (
              <div
                key={camp.id}
                className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="bg-teal-50 text-teal-800 font-bold text-xs px-2.5 py-1 rounded-xl border border-teal-200">
                      {camp.partnerHospital?.name || camp.partnerProviderName}
                    </span>
                    <span className="text-xs font-semibold text-gray-400">{camp.date}</span>
                  </div>

                  <h4 className="font-extrabold text-lg text-gray-900">{camp.title}</h4>

                  {camp.partnerReport ? (
                    <p className="text-xs text-gray-600 line-clamp-3 bg-slate-50 p-3 rounded-2xl border leading-relaxed">
                      "{camp.partnerReport.keyFindingsSummary}"
                    </p>
                  ) : null}

                  {camp.aggregateStats && (
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                      <div className="bg-gray-50 p-2.5 rounded-xl border">
                        <span className="text-[10px] text-gray-500 block">Attended</span>
                        <strong className="text-gray-900 font-bold">{camp.aggregateStats.totalAttended}</strong>
                      </div>
                      <div className="bg-gray-50 p-2.5 rounded-xl border">
                        <span className="text-[10px] text-gray-500 block">Turnout</span>
                        <strong className="text-emerald-700 font-bold">{camp.aggregateStats.attendanceRatePercent}%</strong>
                      </div>
                      <div className="bg-gray-50 p-2.5 rounded-xl border">
                        <span className="text-[10px] text-gray-500 block">Referrals</span>
                        <strong className="text-amber-700 font-bold">{camp.aggregateStats.referralsCount}</strong>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setViewingReportCamp(camp)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-2xl shadow transition flex items-center justify-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View &amp; Print Full Executive Report
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── MODALS ─── */}
      {bookingCamp && (
        <CampSlotBookingModal
          camp={bookingCamp}
          familyMembers={familyMembers}
          onClose={() => setBookingCamp(null)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {activePassReg && (
        <CampPassModal
          registration={activePassReg}
          camp={camps.find(c => c.id === activePassReg.campId)}
          onClose={() => setActivePassReg(null)}
        />
      )}

      {viewingReportCamp && (
        <CampPartnerReportModal
          camp={viewingReportCamp}
          onClose={() => setViewingReportCamp(null)}
        />
      )}
    </div>
  );
};
