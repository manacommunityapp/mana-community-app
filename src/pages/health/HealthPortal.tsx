import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  SEED_DOCTORS,
  SEED_LAB_PACKAGES,
  SEED_EMERGENCY_CONTACTS,
  SEED_FAMILY_MEMBERS,
  SEED_HEALTH_CAMPS,
  SEED_MEDICAL_RECORDS,
  SEED_APPOINTMENTS,
  SEED_BENEFIT_WALLET,
  SEED_CARE_JOURNEYS
} from "../../services/healthService";
import type {
  DoctorDto,
  LabPackageDto,
  FamilyMemberDto,
  HealthCampDto,
  MedicalRecordDto,
  HealthAppointmentDto,
  CareJourneyDto,
  ConsultationMode
} from "../../types/health";
import { CommunityHealthCampsHub } from "../../app/components/health/CommunityHealthCampsHub";
import { HealthcareDirectory } from "../../app/components/health/HealthcareDirectory";
import { HealthcareBenefitsWalletView } from "../../app/components/health/HealthcareBenefitsWalletView";
import { PreventiveWellnessHub } from "../../app/components/health/PreventiveWellnessHub";
import { ProviderOperationsDashboard } from "../../app/components/health/provider/ProviderOperationsDashboard";
import { PatientSecurityPrivacyModal } from "../../app/components/health/PatientSecurityPrivacyModal";

export type HealthTab =
  | "doctors" | "camps" | "family" | "appointments" | "records" | "labs" | "benefits" | "wellness"
  | "provider" | "emergency" | "ai" | "care-journey" | "pharmacy" | "ambulance" | "ipd" | "surgery"
  | "dental" | "abha" | "cancer" | "mental-health" | "hospitals" | "gold" | "physiotherapy" | "gym-trainers";

export const VALID_HEALTH_TABS: HealthTab[] = [
  "doctors", "camps", "family", "appointments", "records", "labs", "benefits", "wellness",
  "provider", "emergency", "ai", "care-journey", "pharmacy", "ambulance", "ipd", "surgery",
  "dental", "abha", "cancer", "mental-health", "hospitals", "gold", "physiotherapy", "gym-trainers"
];

export const HealthPortal: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab") as HealthTab | null;
  const initialTab: HealthTab = (urlTab && VALID_HEALTH_TABS.includes(urlTab)) ? urlTab : "doctors";
  const [activeTab, setActiveTab] = useState<HealthTab>(initialTab);

  // Sync state if URL query param changes externally
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") as HealthTab | null;
    if (tabFromUrl && VALID_HEALTH_TABS.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Sync URL when activeTab changes
  useEffect(() => {
    const currentUrlTab = searchParams.get("tab");
    if (currentUrlTab !== activeTab) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", activeTab);
        return next;
      }, { replace: true });
    }
  }, [activeTab]);

  const [searchSpecialty, setSearchSpecialty] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorDto | null>(null);
  
  // State for Booking Modal / Interaction
  const [bookingPatientId, setBookingPatientId] = useState<string>("fam-1");
  const [bookingMode, setBookingMode] = useState<ConsultationMode>("IN_PERSON");
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

  // State for Camps
  const [registeredCampId, setRegisteredCampId] = useState<string | null>(null);
  const [campSuccessMsg, setCampSuccessMsg] = useState<string | null>(null);

  // State for Privacy & Consent Dashboard Modal
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  // State for Family Hub (New member form toggle)
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [familyList, setFamilyList] = useState<FamilyMemberDto[]>(SEED_FAMILY_MEMBERS);
  const [newMember, setNewMember] = useState({
    fullName: "",
    relationship: "CHILD" as any,
    age: 0,
    gender: "MALE" as any,
    bloodGroup: "O+",
    allergies: ""
  });

  // Ambulance booking state
  const [ambVehicleType, setAmbVehicleType] = useState<"BASIC" | "ADVANCED" | "ICU">("BASIC");
  const [ambPatientName, setAmbPatientName] = useState("");
  const [ambPickup, setAmbPickup] = useState("");
  const [ambDest, setAmbDest] = useState("");
  const [ambPhone, setAmbPhone] = useState("");
  const [ambNote, setAmbNote] = useState("");
  const [ambDispatched, setAmbDispatched] = useState(false);

  // IPD state
  const [ipdDept, setIpdDept] = useState("");
  const [ipdHospital, setIpdHospital] = useState("");
  const [ipdPatientName, setIpdPatientName] = useState("");
  const [ipdReason, setIpdReason] = useState("");
  const [ipdWard, setIpdWard] = useState<"GENERAL" | "SEMI_PRIVATE" | "PRIVATE" | "ICU">("GENERAL");
  const [ipdDate, setIpdDate] = useState("");
  const [ipdPhone, setIpdPhone] = useState("");
  const [ipdSubmitted, setIpdSubmitted] = useState(false);

  // Emergency Callback state
  const [cbPhone, setCbPhone] = useState("");
  const [cbDesc, setCbDesc] = useState("");
  const [cbSubmitted, setCbSubmitted] = useState(false);

  // Department filter for doctors
  const [doctorDept, setDoctorDept] = useState("All");

  // State for Lab Home Collection booking modal
  const [labBookingPkg, setLabBookingPkg] = useState<LabPackageDto | null>(null);
  const [labBookingDate, setLabBookingDate] = useState("tomorrow");
  const [labBookingSlot, setLabBookingSlot] = useState("morning");
  const [labBookingSuccess, setLabBookingSuccess] = useState(false);

  // State for Pharmacy / Medicine Delivery
  const POPULAR_MEDICINES = [
    { id: "med-1", name: "Paracetamol 500mg", price: 22, category: "OTC" },
    { id: "med-2", name: "Cetirizine 10mg", price: 18, category: "OTC" },
    { id: "med-3", name: "Omeprazole 20mg", price: 55, category: "OTC" },
    { id: "med-4", name: "Azithromycin 500mg", price: 120, category: "Antibiotic" },
    { id: "med-5", name: "Metformin 500mg", price: 45, category: "Chronic" },
    { id: "med-6", name: "Amlodipine 5mg", price: 60, category: "Chronic" }
  ];
  const [pharmacyTab, setPharmacyTab] = useState<"otc" | "prescription" | "autorefill">("otc");
  const [pharmacyCart, setPharmacyCart] = useState<Record<string, number>>({});
  const [pharmacyDeliverySlot, setPharmacyDeliverySlot] = useState("same-day");
  const [pharmacyOrderSuccess, setPharmacyOrderSuccess] = useState(false);
  const CHRONIC_MEDS_WEB = [
    { name: "Metformin 500mg", price: 105 }, { name: "Amlodipine 5mg", price: 144 },
    { name: "Atorvastatin 20mg", price: 245 }, { name: "Losartan 50mg", price: 182 },
    { name: "Levothyroxine 50mcg", price: 95 }, { name: "Pantoprazole 40mg", price: 68 },
  ];
  const [refillSubs, setRefillSubs] = useState([
    { id: "sub-1", name: "Metformin 500mg", freq: "Monthly", next: "15 Nov 2026", price: 105, active: true },
    { id: "sub-2", name: "Amlodipine 5mg",  freq: "Monthly", next: "15 Nov 2026", price: 144, active: true },
    { id: "sub-3", name: "Atorvastatin 20mg", freq: "Monthly", next: "20 Nov 2026", price: 245, active: false },
  ]);
  const HOSPITAL_BED_WEB: Record<string, Record<string, number>> = {
    "Apollo Hospital":  { GENERAL: 14, SEMI_PRIVATE: 6, PRIVATE: 4, ICU: 3 },
    "Fortis Healthcare":{ GENERAL: 8,  SEMI_PRIVATE: 4, PRIVATE: 2, ICU: 1 },
    "Max Super Specialty": { GENERAL: 12, SEMI_PRIVATE: 5, PRIVATE: 3, ICU: 2 },
    "AIIMS":            { GENERAL: 20, SEMI_PRIVATE: 0, PRIVATE: 0, ICU: 4 },
    "Manipal Hospital": { GENERAL: 10, SEMI_PRIVATE: 4, PRIVATE: 3, ICU: 2 },
    "Community General Hospital": { GENERAL: 6, SEMI_PRIVATE: 2, PRIVATE: 1, ICU: 0 },
  };

  // State for Video Consultation
  const [videoAppt, setVideoAppt] = useState<HealthAppointmentDto | null>(null);
  const [videoState, setVideoState] = useState<"CONNECTING" | "CONNECTED" | "ENDED">("CONNECTING");
  const [videoMuted, setVideoMuted] = useState(false);
  const [videoCamOff, setVideoCamOff] = useState(false);
  const [videoElapsed, setVideoElapsed] = useState(0);

  // State for AI Triage / Symptom Guide
  const [symptomInput, setSymptomInput] = useState("");
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    triageCategory: string;
    specialtyRecommendation: string;
    precautionNotes: string;
    isEmergency: boolean;
  } | null>(null);

  // State for Physiotherapy & Rehabilitation Hub
  const [physioCategoryFilter, setPhysioCategoryFilter] = useState<"ALL" | "SPORTS" | "POST_OP" | "SPINE" | "GERIATRIC" | "HOME_CARE">("ALL");
  const [selectedPainArea, setSelectedPainArea] = useState<"neck" | "back" | "knee" | "shoulder" | "ankle">("back");
  const [painDuration, setPainDuration] = useState<"acute" | "subacute" | "chronic">("subacute");
  const [painSeverity, setPainSeverity] = useState<number>(5);
  const [physioBookingModal, setPhysioBookingModal] = useState<{
    open: boolean;
    physio: DoctorDto | null;
    packageTitle?: string;
    preselectedMode?: "CLINIC" | "HOME";
  }>({ open: false, physio: null });
  const [physioVisitMode, setPhysioVisitMode] = useState<"CLINIC" | "HOME">("CLINIC");
  const [physioPatientId, setPhysioPatientId] = useState<string>("fam-1");
  const [physioSlot, setPhysioSlot] = useState<string>("Today, 4:30 PM");
  const [physioCondition, setPhysioCondition] = useState<string>("Back & Neck Pain");
  const [physioFlatNo, setPhysioFlatNo] = useState<string>("Tower B - 604");
  const [physioSuccessMsg, setPhysioSuccessMsg] = useState<string | null>(null);

  // State for Gym Trainers & Personal Fitness Hub
  const [trainerCategoryFilter, setTrainerCategoryFilter] = useState<
    "ALL" | "STRENGTH" | "FAT_LOSS" | "HIIT" | "SENIOR" | "WOMEN_FITNESS"
  >("ALL");
  const [selectedFitnessGoal, setSelectedFitnessGoal] = useState<
    "FAT_LOSS" | "MUSCLE_GAIN" | "ENDURANCE" | "SENIOR_FITNESS" | "POST_REHAB"
  >("MUSCLE_GAIN");
  const [selectedExperienceLevel, setSelectedExperienceLevel] = useState<
    "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  >("INTERMEDIATE");
  const [selectedTimeSlotPref, setSelectedTimeSlotPref] = useState<
    "EARLY_MORNING" | "MID_MORNING" | "EVENING"
  >("EARLY_MORNING");
  const [trainerBookingModal, setTrainerBookingModal] = useState<{
    open: boolean;
    trainer: DoctorDto | null;
    packageTitle?: string;
    preselectedVenue?: "CLUBHOUSE_GYM" | "HOME_LAWN";
  }>({ open: false, trainer: null });
  const [trainerVenue, setTrainerVenue] = useState<"CLUBHOUSE_GYM" | "HOME_LAWN">("CLUBHOUSE_GYM");
  const [trainerPatientId, setTrainerPatientId] = useState<string>("fam-1");
  const [trainerSlot, setTrainerSlot] = useState<string>("Tomorrow, 06:30 AM");
  const [trainerGoalNote, setTrainerGoalNote] = useState<string>("Build Strength & Improve Form");
  const [trainerFlatNo, setTrainerFlatNo] = useState<string>("Tower B - 604");
  const [trainerSuccessMsg, setTrainerSuccessMsg] = useState<string | null>(null);

  const filteredDoctors = SEED_DOCTORS.filter(d =>
    d.name.toLowerCase().includes(searchSpecialty.toLowerCase()) ||
    d.specialty.toLowerCase().includes(searchSpecialty.toLowerCase()) ||
    d.clinicAddress.toLowerCase().includes(searchSpecialty.toLowerCase())
  );

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    const patient = familyList.find(f => f.id === bookingPatientId);
    setBookingSuccessMsg(`Appointment confirmed with ${selectedDoctor.name} for ${patient?.fullName} (${bookingMode})! Details synced to Health Vault.`);
    setTimeout(() => {
      setSelectedDoctor(null);
      setBookingSuccessMsg(null);
    }, 3500);
  };

  const handleCampRegistration = (camp: HealthCampDto) => {
    setRegisteredCampId(camp.id);
    setCampSuccessMsg(`You have reserved a slot for "${camp.title}" at ${camp.venue}. Vitals and reports will be privately saved to your Health Vault.`);
    setTimeout(() => {
      setCampSuccessMsg(null);
    }, 4500);
  };

  const handleAddFamilyMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.fullName) return;
    const created: FamilyMemberDto = {
      id: `fam-${Date.now()}`,
      residentUserId: "usr-me",
      fullName: newMember.fullName,
      relationship: newMember.relationship,
      age: Number(newMember.age),
      gender: newMember.gender,
      bloodGroup: newMember.bloodGroup,
      allergies: newMember.allergies ? newMember.allergies.split(",").map(s => s.trim()) : [],
      consentToShareRecords: true
    };
    setFamilyList([...familyList, created]);
    setShowAddFamilyModal(false);
    setNewMember({ fullName: "", relationship: "CHILD", age: 0, gender: "MALE", bloodGroup: "O+", allergies: "" });
  };

  const runAiSymptomCheck = () => {
    if (!symptomInput.trim()) return;
    const lower = symptomInput.toLowerCase();
    if (lower.includes("chest") || lower.includes("breathing") || lower.includes("heart") || lower.includes("collapse")) {
      setAiAnalysisResult({
        triageCategory: "🚨 Urgent Medical Priority",
        specialtyRecommendation: "Emergency Cardiology & Trauma",
        precautionNotes: "Chest pain or acute breathing difficulty warrants immediate physical evaluation. Please contact the 24x7 Community SOS or visit the nearest emergency room immediately.",
        isEmergency: true
      });
    } else if (lower.includes("child") || lower.includes("baby") || lower.includes("infant") || lower.includes("fever")) {
      setAiAnalysisResult({
        triageCategory: "⚠️ Moderate - Pediatric Assessment Recommended",
        specialtyRecommendation: "Pediatrician / General Physician",
        precautionNotes: "Ensure regular hydration, monitor temperature every 3-4 hours, and avoid self-medicating antibiotics without prescription.",
        isEmergency: false
      });
    } else if (
      lower.includes("back") || lower.includes("neck") || lower.includes("spine") ||
      lower.includes("knee") || lower.includes("joint") || lower.includes("sprain") ||
      lower.includes("physio") || lower.includes("posture") || lower.includes("shoulder") ||
      lower.includes("sciatica") || lower.includes("ligament") || lower.includes("muscle")
    ) {
      setAiAnalysisResult({
        triageCategory: "🏃 Musculoskeletal & Mobility Care",
        specialtyRecommendation: "Physiotherapy & Rehabilitation Specialist",
        precautionNotes: "Avoid heavy lifting and sudden twisting. Apply cold compression for acute sprains (within 48 hrs) or warmth for chronic muscle stiffness. Book a clinical assessment at the Clubhouse Sports Pavilion or request a doorstep home visit.",
        isEmergency: false
      });
    } else {
      setAiAnalysisResult({
        triageCategory: "ℹ️ Routine Care Guidance",
        specialtyRecommendation: "General Practitioner / Internal Medicine",
        precautionNotes: "Symptoms can be assessed via video consultation or in-person clinic visit. Keep a log of symptom progression.",
        isEmergency: false
      });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 p-6 rounded-3xl text-white shadow-xl gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xl">🩺</span>
            <h1 className="text-3xl font-extrabold tracking-tight">Mana Health</h1>
            <span className="bg-emerald-400 text-teal-950 font-bold text-xs uppercase px-2.5 py-0.5 rounded-full">Community Health Ecosystem</span>
          </div>
          <p className="text-teal-100 text-sm mt-1 max-w-2xl">
            Trusted healthcare for residents and families. Connect verified doctors, clubhouse health screening drives, and privacy-governed health records.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setShowSecurityModal(true)}
            className="bg-slate-900 hover:bg-black text-emerald-300 border border-emerald-500/30 font-bold py-2.5 px-3.5 rounded-xl shadow-md transition flex items-center gap-1.5 text-xs"
          >
            🛡️ Privacy & Audit
          </button>
          <button
            onClick={() => setActiveTab("provider")}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition flex items-center gap-2 text-sm"
          >
            🏥 Provider Portal
          </button>
          <button
            onClick={() => setActiveTab("ambulance")}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition animate-pulse flex items-center gap-2 text-sm"
          >
            🚑 Ambulance
          </button>
          <button
            onClick={() => setActiveTab("emergency")}
            className="bg-red-800 hover:bg-red-900 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition flex items-center gap-2 text-sm"
          >
            🚨 Medical SOS
          </button>
          <button
            onClick={() => setActiveTab("physiotherapy")}
            className="bg-teal-500 hover:bg-teal-400 text-teal-950 font-bold py-2.5 px-4 rounded-xl shadow-md transition flex items-center gap-1.5 text-sm"
          >
            🏃 Physiotherapy
          </button>
          <button
            onClick={() => setActiveTab("gym-trainers")}
            className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold py-2.5 px-4 rounded-xl shadow-md transition flex items-center gap-1.5 text-sm"
          >
            🏋️ Gym Trainers
          </button>
          <button
            onClick={() => setActiveTab("camps")}
            className="bg-emerald-500 hover:bg-emerald-400 text-teal-950 font-bold py-2.5 px-4 rounded-xl shadow-md transition flex items-center gap-2 text-sm"
          >
            ⛺ Clubhouse Camps
          </button>
          <button
            onClick={() => setActiveTab("family")}
            className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 px-4 rounded-xl border border-white/20 transition flex items-center gap-2 text-sm backdrop-blur-sm"
          >
            👨‍👩‍👧 Family Hub
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "doctors", label: "👨‍⚕️ Doctors & Clinics" },
          { id: "camps", label: "⛺ Health Camps" },
          { id: "family", label: "👨‍👩‍👧 Family Health Hub" },
          { id: "appointments", label: "📅 Appointments & Journey" },
          { id: "records", label: "🔒 Private Health Vault" },
          { id: "labs", label: "🧪 Lab Packages" },
          { id: "benefits", label: "💳 Benefits & Wallet" },
          { id: "wellness", label: "🌿 Preventive & Wellness" },
          { id: "provider", label: "🏥 Provider Operations" },
          { id: "emergency", label: "🚨 Community Emergency" },
          { id: "ai", label: "🤖 AI Symptom Guide" },
          { id: "care-journey", label: "🗺️ Care Journey" },
          { id: "pharmacy", label: "💊 Pharmacy" },
          { id: "ambulance", label: "🚑 Ambulance" },
          { id: "ipd", label: "🏥 IPD Admission" },
          { id: "surgery", label: "🔪 Surgery Care" },
          { id: "dental", label: "🦷 Dental Care" },
          { id: "physiotherapy", label: "🏃 Physiotherapy & Rehab" },
          { id: "gym-trainers", label: "🏋️ Gym & Fitness Trainers" },
          { id: "abha", label: "🪪 ABHA Health ID" },
          { id: "cancer", label: "🎗️ Cancer Care" },
          { id: "mental-health", label: "🧠 Mental Health" },
          { id: "hospitals", label: "🏥 Hospital Finder" },
          { id: "gold", label: "⭐ Mana Gold" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-teal-700 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Doctors & Clinics Directory */}
      {activeTab === "doctors" && (
        <div className="space-y-4">
          {/* Condition-Based Quick Access (Round 6) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-sm font-black text-gray-900 mb-1">What are you looking for?</p>
            <p className="text-xs text-gray-500 mb-3">Select a condition or specialty — consult in ~15 min from ₹199</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Cold & Fever", icon: "🌡️", specialty: "General Medicine" },
                { label: "Skin & Hair", icon: "✨", specialty: "Dermatology" },
                { label: "Stomach Issues", icon: "🫁", specialty: "Gastroenterology" },
                { label: "Back & Joints", icon: "🦴", specialty: "Orthopedics" },
                { label: "Heart Issues", icon: "❤️", specialty: "Cardiology" },
                { label: "Pregnancy", icon: "🤰", specialty: "Gynecology" },
                { label: "Child & Infant", icon: "👶", specialty: "Pediatrics" },
                { label: "Report Analysis", icon: "📋", specialty: "Lab Report Analysis" },
                { label: "Sexual Health", icon: "🔒", specialty: "Sexual Health" },
                { label: "Weight Loss", icon: "⚖️", specialty: "Nutrition" },
                { label: "I Don't Know", icon: "❓", specialty: "" },
              ].map((cg, i) => (
                <button key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-teal-200 bg-teal-50 text-teal-700 text-xs font-semibold hover:bg-teal-100 transition-colors">
                  <span>{cg.icon}</span>
                  <span>{cg.label}</span>
                </button>
              ))}
            </div>
          </div>
          <HealthcareDirectory
            onCampRegister={() => setActiveTab("camps")}
          />
        </div>
      )}

      {/* Tab 2: Community Health Camps */}
      {activeTab === "camps" && (
        <CommunityHealthCampsHub
          onNavigateToVault={() => setActiveTab("records")}
          onNavigateToEvents={(eventId) => navigate(eventId ? `/events/${eventId}` : "/events")}
        />
      )}

      {/* Tab 3: Family Health Hub */}
      {activeTab === "family" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-gray-900">👨‍👩‍👧 Family Health Profiles & Care Coordination</h2>
              <p className="text-xs text-gray-500 mt-0.5">Manage health profiles, vaccination charts, and consent-based record sharing for your dependents.</p>
            </div>
            <button
              onClick={() => setShowAddFamilyModal(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition"
            >
              + Add Family Member
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {familyList.map(member => (
              <div key={member.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3 relative hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md">
                      {member.relationship}
                    </span>
                    <h3 className="font-bold text-gray-900 text-lg mt-1">{member.fullName}</h3>
                    <p className="text-xs text-gray-500">{member.age} yrs • {member.gender}</p>
                  </div>
                  <span className="text-xs bg-red-50 text-red-700 font-extrabold px-2 py-1 rounded-lg border border-red-200">
                    🩸 {member.bloodGroup || "N/A"}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1.5 text-gray-700">
                  <p><strong>Allergies:</strong> {member.allergies && member.allergies.length ? member.allergies.join(", ") : "None reported"}</p>
                  {member.chronicConditions && member.chronicConditions.length > 0 && (
                    <p className="text-amber-800"><strong>Conditions:</strong> {member.chronicConditions.join(", ")}</p>
                  )}
                  <p><strong>Doctor Access:</strong> {member.consentToShareRecords ? "Consent Authorized ✓" : "Restricted ✕"}</p>

                  {/* Elder Care / Caregiver Delegation */}
                  {member.caregivers && member.caregivers.length > 0 && (
                    <div className="pt-1.5 border-t border-gray-200">
                      <p className="font-bold text-[11px] text-teal-800 flex items-center gap-1">
                        👵 Authorized Caregivers:
                      </p>
                      {member.caregivers.map((cg, i) => (
                        <p key={i} className="text-[10px] text-gray-600 mt-0.5">
                          • {cg.caregiverName} ({cg.accessScope.replace("_", " ")})
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Upcoming Reminders (Vaccinations & Appointments) */}
                  {member.upcomingReminders && member.upcomingReminders.length > 0 && (
                    <div className="pt-1.5 border-t border-gray-200">
                      <p className="font-bold text-[11px] text-indigo-800 flex items-center gap-1">
                        🔔 Reminders ({member.upcomingReminders.length}):
                      </p>
                      {member.upcomingReminders.map((rem, i) => (
                        <div key={i} className="bg-white p-1.5 rounded-lg border border-gray-200 mt-1">
                          <p className="font-semibold text-[11px] text-gray-900 leading-tight">{rem.title}</p>
                          <p className="text-[10px] text-indigo-600 font-medium">Due: {rem.dueDate}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setActiveTab("records")}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold py-2 rounded-xl transition"
                  >
                    View Vault
                  </button>
                  <button
                    onClick={() => {
                      setBookingPatientId(member.id);
                      setActiveTab("doctors");
                    }}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold py-2 rounded-xl transition"
                  >
                    Book Doctor
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Member Modal */}
          {showAddFamilyModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-extrabold text-lg text-gray-900">Add Family Member</h3>
                  <button onClick={() => setShowAddFamilyModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                </div>
                <form onSubmit={handleAddFamilyMember} className="space-y-3 text-sm">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Full Name:</label>
                    <input
                      type="text"
                      required
                      value={newMember.fullName}
                      onChange={e => setNewMember({ ...newMember, fullName: e.target.value })}
                      className="w-full p-2 border rounded-xl text-sm"
                      placeholder="e.g. Maya Varma"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Relationship:</label>
                      <select
                        value={newMember.relationship}
                        onChange={e => setNewMember({ ...newMember, relationship: e.target.value as any })}
                        className="w-full p-2 border rounded-xl text-sm bg-white"
                      >
                        <option value="SPOUSE">Spouse</option>
                        <option value="CHILD">Child</option>
                        <option value="PARENT">Parent</option>
                        <option value="DEPENDENT">Elder / Dependent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Age:</label>
                      <input
                        type="number"
                        required
                        value={newMember.age || ""}
                        onChange={e => setNewMember({ ...newMember, age: Number(e.target.value) })}
                        className="w-full p-2 border rounded-xl text-sm"
                        placeholder="Age"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Blood Group:</label>
                      <select
                        value={newMember.bloodGroup}
                        onChange={e => setNewMember({ ...newMember, bloodGroup: e.target.value })}
                        className="w-full p-2 border rounded-xl text-sm bg-white"
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Gender:</label>
                      <select
                        value={newMember.gender}
                        onChange={e => setNewMember({ ...newMember, gender: e.target.value as any })}
                        className="w-full p-2 border rounded-xl text-sm bg-white"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Known Allergies (comma separated):</label>
                    <input
                      type="text"
                      value={newMember.allergies}
                      onChange={e => setNewMember({ ...newMember, allergies: e.target.value })}
                      className="w-full p-2 border rounded-xl text-sm"
                      placeholder="e.g. Penicillin, Pollen, Peanuts"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowAddFamilyModal(false)}
                      className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow"
                    >
                      Save Profile
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Appointments & Care Journey */}
      {activeTab === "appointments" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-teal-800 to-indigo-900 p-6 rounded-3xl text-white shadow-md">
            <h2 className="text-2xl font-black">🔄 The Complete Care Journey</h2>
            <p className="text-teal-100 text-xs mt-1">
              End-to-end continuous care: <strong>Appointment ➔ Consultation ➔ Prescription ➔ Lab Test ➔ Results Ready ➔ Follow-up</strong>.
            </p>
            <p className="text-amber-200 text-[11px] mt-2 font-medium bg-white/10 p-2.5 rounded-xl border border-white/10">
              🛡️ <strong>Clinical Rule:</strong> Test results are delivered privately without automated diagnosis. Follow-ups are prompted based on clinician recommendations rather than arbitrary auto-scheduling.
            </p>
          </div>

          {/* Interactive Care Journey Steppers */}
          <div className="space-y-6">
            {SEED_CARE_JOURNEYS.map(journey => (
              <div key={journey.id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b pb-4">
                  <div>
                    <span className="text-xs bg-teal-100 text-teal-800 font-bold px-2.5 py-0.5 rounded-md">
                      Patient: {journey.patientName} ({journey.patientRelationship})
                    </span>
                    <h3 className="text-lg font-extrabold text-gray-900 mt-1">
                      {journey.doctorName} • <span className="text-teal-700 font-semibold">{journey.doctorSpecialty}</span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Consultation Mode: <strong className="text-gray-900">{journey.mode}</strong></span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      ● Active Journey
                    </span>
                  </div>
                </div>

                {/* 6-Stage Visual Stepper */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2 pt-1">
                  {[
                    { id: "APPOINTMENT_BOOKED", label: "1. Appointment", desc: journey.appointmentTime, icon: "📅", done: true },
                    { id: "CONSULTATION_COMPLETED", label: "2. Consult", desc: "Reports shared with doc", icon: "👨‍⚕️", done: true },
                    { id: "PRESCRIPTION_ISSUED", label: "3. Prescription", desc: journey.prescriptionId || "Rx Uploaded", icon: "💊", done: !!journey.prescriptionId },
                    { id: "LAB_TEST_ORDERED", label: "4. Lab Test", desc: journey.labPackageName || "Home Sample", icon: "🧪", done: !!journey.labPackageName },
                    { id: "RESULTS_READY", label: "5. Results", desc: journey.resultsAvailable ? "Verified in Vault" : "Pending Lab", icon: "📊", done: journey.resultsAvailable },
                    { id: "FOLLOW_UP_SCHEDULED", label: "6. Follow-up", desc: journey.clinicianRecommendedFollowUp ? journey.clinicianRecommendedFollowUp.dueDate : "As per Doctor", icon: "🔔", done: journey.clinicianRecommendedFollowUp?.status === "BOOKED" }
                  ].map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border text-xs space-y-1 transition ${
                        step.done
                          ? "bg-teal-50/80 border-teal-300 text-teal-950 font-semibold"
                          : "bg-gray-50 border-gray-200 text-gray-500"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{step.icon}</span>
                        {step.done ? <span className="text-[10px] bg-teal-600 text-white px-1.5 py-0.2 rounded font-bold">✓</span> : <span className="text-[10px] text-gray-400">Next</span>}
                      </div>
                      <p className="font-bold text-[11px] leading-tight mt-1">{step.label}</p>
                      <p className="text-[10px] text-gray-600 truncate">{step.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Journey Details & Clinician Guardrail Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Left: Reports & Prescriptions */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <h5 className="font-bold text-gray-800 flex items-center gap-1.5">
                      📄 Clinical Records Linked:
                    </h5>
                    {journey.prescriptionSummary && (
                      <p className="text-gray-700 bg-white p-2 rounded-xl border">
                        <strong>Prescription:</strong> {journey.prescriptionSummary}
                      </p>
                    )}
                    {journey.resultsAvailable && (
                      <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex justify-between items-center text-emerald-900 font-medium">
                        <span>✓ Diagnostic test results ready in Vault</span>
                        <button onClick={() => setActiveTab("records")} className="text-teal-800 underline font-bold">
                          View Report
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right: Clinician-Decided Follow-up */}
                  <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200 space-y-2 text-xs">
                    <h5 className="font-bold text-indigo-950 flex items-center gap-1.5">
                      🩺 Clinician Follow-up Decision:
                    </h5>
                    {journey.clinicianRecommendedFollowUp ? (
                      <div className="space-y-1.5">
                        <p className="text-indigo-900">
                          <strong>Doctor's Advice:</strong> "{journey.clinicianRecommendedFollowUp.instructions}"
                        </p>
                        <p className="text-gray-700">
                          Recommended Review Date: <strong>{journey.clinicianRecommendedFollowUp.dueDate}</strong>
                        </p>
                        <div className="pt-1 flex gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            journey.clinicianRecommendedFollowUp.status === "BOOKED"
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            Status: {journey.clinicianRecommendedFollowUp.status}
                          </span>
                          {journey.clinicianRecommendedFollowUp.status !== "BOOKED" && (
                            <button
                              onClick={() => {
                                setBookingPatientId(journey.patientId);
                                setActiveTab("doctors");
                              }}
                              className="bg-indigo-700 text-white font-bold px-3 py-1 rounded-lg text-[11px]"
                            >
                              Book Doctor Follow-up
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No routine follow-up indicated by clinician at this stage.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Private Health Vault */}
      {activeTab === "records" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 to-teal-950 p-6 rounded-3xl text-white shadow-md">
            <h2 className="text-2xl font-black">🔒 Confidential Health Record Vault</h2>
            <p className="text-slate-300 text-xs mt-1">
              Compliant personal health records. End-to-end access controlled; shareable with verified clinicians during appointments. Never visible to community members or admins.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SEED_MEDICAL_RECORDS.map(rec => (
              <div key={rec.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded border border-teal-200">
                    {rec.type.replace("_", " ")}
                  </span>
                  <span className="text-xs text-gray-400">{rec.date}</span>
                </div>
                <h4 className="font-bold text-gray-900 text-base">{rec.title}</h4>
                <p className="text-xs text-gray-500">Patient: <strong>{rec.patientName}</strong></p>
                <p className="text-xs text-gray-600">Issued by: <strong>{rec.doctorOrLabName}</strong></p>
                {rec.notes && <p className="text-xs bg-slate-50 p-2.5 rounded-xl text-gray-600 italic">"{rec.notes}"</p>}
                <button className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold py-2 rounded-xl transition">
                  Download Encrypted Document
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Lab Packages */}
      {activeTab === "labs" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">🧪 Preventive Diagnostic Packages & Home Sample Collection</h2>
            <p className="text-xs text-gray-500 mt-1">Partner diagnostic labs with doorstep phlebotomist collection at your flat.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SEED_LAB_PACKAGES.map(pkg => (
              <div key={pkg.id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-lg text-gray-900">{pkg.name}</h4>
                    <p className="text-xs text-gray-500">{pkg.testCount} Parameters Included • Reports in {pkg.reportTurnaroundHours}h</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-teal-700">₹{pkg.price}</span>
                    <span className="text-xs text-gray-400 line-through block">₹{pkg.originalPrice}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {pkg.testsIncluded.map((t, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-md font-medium">{t}</span>
                  ))}
                </div>

                <div className="bg-emerald-50 p-2.5 rounded-xl text-xs text-emerald-900 flex justify-between font-medium">
                  <span>🏠 Doorstep Home Collection: {pkg.homeCollectionAvailable ? "Available" : "No"}</span>
                  <span>🍵 Fasting: {pkg.fastingRequired ? "Required (10 hrs)" : "Not Required"}</span>
                </div>

                <button
                  onClick={() => { setLabBookingPkg(pkg); setLabBookingSuccess(false); }}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl transition text-sm"
                >
                  Schedule Home Collection Slot
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Benefits & Healthcare Wallet */}
      {activeTab === "benefits" && (
        <HealthcareBenefitsWalletView />
      )}

      {/* Tab 8: Preventive Health & Wellness */}
      {activeTab === "wellness" && (
        <PreventiveWellnessHub familyMembers={familyList} />
      )}

      {/* Tab 9: Provider Operations Console */}
      {activeTab === "provider" && (
        <ProviderOperationsDashboard />
      )}

      {/* Tab 8: Community Emergency SOS */}
      {activeTab === "emergency" && (
        <div className="space-y-6">
          {/* When to Seek Emergency Care panel */}
          <div className="bg-red-50 border-2 border-red-400 p-6 rounded-3xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-pulse">⚠️</span>
              <h3 className="text-red-900 font-extrabold text-xl">When to Seek Emergency Care</h3>
            </div>
            <p className="text-red-700 text-sm font-medium">Go to ER immediately or call 112 if you experience:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {["Chest pain or difficulty breathing", "Signs of stroke (face drooping, arm weakness, slurred speech)", "Major trauma, accident or fall injuries", "Severe allergic reaction / anaphylaxis", "Loss of consciousness, seizure or faint", "Severe bleeding or burns", "High fever with confusion or stiff neck", "Severe abdominal pain"].map((sign, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-red-800">
                  <span className="text-red-500">●</span> {sign}
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <a href="tel:112" className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition shadow">
                📞 Call 112 — National Emergency
              </a>
              <button onClick={() => setActiveTab("ambulance")} className="flex items-center gap-2 bg-white border-2 border-red-400 text-red-700 font-bold py-2.5 px-5 rounded-xl text-sm hover:bg-red-50 transition">
                🚑 Book Ambulance
              </button>
            </div>
          </div>

          {/* Emergency Callback Request */}
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-3xl space-y-4">
            <h3 className="text-blue-900 font-bold text-lg flex items-center gap-2">
              📞 Request 24/7 Emergency Callback
            </h3>
            {cbSubmitted ? (
              <div className="text-center py-4 space-y-2">
                <div className="text-4xl">✅</div>
                <p className="font-bold text-teal-800">Callback Requested!</p>
                <p className="text-sm text-gray-600">Our health desk will call you within 5–10 minutes. Agent: Community Health Desk</p>
                <button onClick={() => setCbSubmitted(false)} className="mt-2 bg-teal-600 text-white font-bold px-5 py-2 rounded-xl text-sm">Done</button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="tel"
                    placeholder="Your phone number *"
                    value={cbPhone}
                    onChange={e => setCbPhone(e.target.value)}
                    className="border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Emergency description"
                    value={cbDesc}
                    onChange={e => setCbDesc(e.target.value)}
                    className="border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => cbPhone && setCbSubmitted(true)}
                  disabled={!cbPhone}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition"
                >
                  Request Callback Now
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🚨</span>
            <h3 className="text-red-900 font-extrabold text-xl">24x7 Community Medical Emergency Hotlines</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SEED_EMERGENCY_CONTACTS.map(em => (
              <div key={em.id} className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm flex justify-between items-center">
                <div>
                  <span className="text-xs bg-red-100 text-red-800 font-bold px-2.5 py-0.5 rounded">{em.type}</span>
                  <h4 className="font-bold text-gray-900 mt-1.5 text-base">{em.name}</h4>
                  <p className="text-xs text-gray-500">{em.address} • {em.distanceKm} km away</p>
                  {em.is24x7 && <span className="text-[11px] text-green-700 font-bold block mt-0.5">● Available 24x7</span>}
                </div>
                <div className="flex gap-2 items-center">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(em.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-teal-300 text-teal-700 font-bold py-2 px-3 rounded-xl text-xs hover:bg-teal-50 transition"
                    title="Get Directions"
                  >
                    📍 Directions
                  </a>
                  <a
                    href={`tel:${em.phone}`}
                    className="bg-red-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm hover:bg-red-700 transition shadow-sm"
                  >
                    📞 Call Now
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 9: AI Symptom Guide */}
      {activeTab === "ai" && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🤖</span>
              <div>
                <h3 className="font-black text-xl text-gray-900">Mana AI Symptom Navigator</h3>
                <p className="text-xs text-gray-500">Triage assistant to find the right clinical specialty. Not a diagnostic replacement for medical advice.</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700">Describe symptoms or concerns:</label>
              <textarea
                rows={3}
                value={symptomInput}
                onChange={e => setSymptomInput(e.target.value)}
                placeholder="e.g. 5-year-old running mild fever for 2 days with runny nose and cough..."
                className="w-full p-3 border rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <button
                onClick={runAiSymptomCheck}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition text-sm shadow"
              >
                Analyze Symptoms & Recommend Specialty
              </button>
            </div>

            {aiAnalysisResult && (
              <div className={`p-5 rounded-2xl border space-y-3 ${aiAnalysisResult.isEmergency ? "bg-red-50 border-red-300" : "bg-teal-50 border-teal-200"}`}>
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-sm">{aiAnalysisResult.triageCategory}</h4>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/70">Recommended: {aiAnalysisResult.specialtyRecommendation}</span>
                </div>
                <p className="text-xs text-gray-800 leading-relaxed">{aiAnalysisResult.precautionNotes}</p>
                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => {
                      setSearchSpecialty(aiAnalysisResult.specialtyRecommendation.split(" ")[0]);
                      setActiveTab("doctors");
                    }}
                    className="bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    Find Matching Doctors →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Care Journey Tracker */}
      {activeTab === "care-journey" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-800 to-purple-900 p-6 rounded-3xl text-white shadow-md">
            <h2 className="text-2xl font-black">🗺️ My Care Journey</h2>
            <p className="text-indigo-200 text-xs mt-1">Track every step from appointment booking through follow-up — all in one place.</p>
          </div>

          <div className="space-y-6">
            {SEED_CARE_JOURNEYS.map((journey: CareJourneyDto) => {
              const STAGES = [
                { key: "APPOINTMENT_BOOKED", label: "Appointment Booked", icon: "📅" },
                { key: "CONSULTATION_COMPLETED", label: "Consultation Done", icon: "👨‍⚕️" },
                { key: "PRESCRIPTION_ISSUED", label: "Prescription Issued", icon: "💊" },
                { key: "LAB_TEST_ORDERED", label: "Lab Test Ordered", icon: "🧪" },
                { key: "RESULTS_READY", label: "Results Ready", icon: "📊" },
                { key: "FOLLOW_UP_SCHEDULED", label: "Follow-up Scheduled", icon: "🔔" }
              ];
              const stageOrder = STAGES.map(s => s.key);
              const currentIdx = stageOrder.indexOf(journey.currentStage);
              return (
                <div key={journey.id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-5">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b pb-4">
                    <div>
                      <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2.5 py-0.5 rounded-md">
                        Patient: {journey.patientName}
                      </span>
                      <h3 className="text-lg font-extrabold text-gray-900 mt-1">
                        {journey.doctorName} • <span className="text-indigo-700 font-semibold">{journey.doctorSpecialty}</span>
                      </h3>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
                      Current: {journey.currentStage.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                    {STAGES.map((step, idx) => {
                      const done = idx <= currentIdx;
                      return (
                        <div
                          key={step.key}
                          className={`p-3 rounded-2xl border text-xs space-y-1 ${
                            done ? "bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold" : "bg-gray-50 border-gray-200 text-gray-400"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span>{step.icon}</span>
                            {done
                              ? <span className="text-[10px] bg-indigo-600 text-white px-1.5 rounded font-bold">✓</span>
                              : <span className="text-[10px] text-gray-300">○</span>}
                          </div>
                          <p className="font-bold text-[11px] leading-tight mt-1">{step.label}</p>
                        </div>
                      );
                    })}
                  </div>

                  {journey.prescriptionSummary && (
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-xs text-emerald-900">
                      <p className="font-bold mb-1">💊 Prescription:</p>
                      <p>{journey.prescriptionSummary}</p>
                    </div>
                  )}
                  {journey.clinicianRecommendedFollowUp && (
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 flex justify-between items-start gap-4">
                      <div>
                        <p className="font-bold mb-1">🩺 Follow-up: {journey.clinicianRecommendedFollowUp.dueDate}</p>
                        <p>{journey.clinicianRecommendedFollowUp.instructions}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                        journey.clinicianRecommendedFollowUp.status === "BOOKED"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-200 text-amber-900"
                      }`}>
                        {journey.clinicianRecommendedFollowUp.status}
                      </span>
                    </div>
                  )}

                  {journey.mode === "VIDEO" && (
                    <button
                      onClick={() => {
                        setVideoAppt(SEED_APPOINTMENTS.find(a => a.id === journey.appointmentId) || null);
                        setVideoState("CONNECTING");
                        setVideoElapsed(0);
                      }}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-sm transition"
                    >
                      📹 Join Video Consultation
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Pharmacy / Medicine Delivery */}
      {activeTab === "pharmacy" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-700 to-violet-800 p-6 rounded-3xl text-white shadow-md">
            <h2 className="text-2xl font-black">💊 Medicine Delivery</h2>
            <p className="text-purple-200 text-xs mt-1">Order OTC medicines or refill prescriptions — delivered to your flat door.</p>
          </div>

          {pharmacyOrderSuccess ? (
            <div className="bg-emerald-50 border-2 border-emerald-400 p-8 rounded-3xl text-center space-y-3">
              <div className="text-4xl">✅</div>
              <h3 className="text-xl font-black text-emerald-900">Order Placed Successfully!</h3>
              <p className="text-emerald-700 text-sm">Your medicines will be delivered as per the selected slot. Order details saved to Health Vault.</p>
              <button
                onClick={() => { setPharmacyOrderSuccess(false); setPharmacyCart({}); }}
                className="bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm mt-2"
              >
                Place Another Order
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                {/* Sub-tabs */}
                <div className="flex gap-2 flex-wrap">
                  {([["otc", "OTC / General"], ["prescription", "By Prescription"], ["autorefill", "🔁 Auto-Refill"]] as const).map(([t, label]) => (
                    <button
                      key={t}
                      onClick={() => setPharmacyTab(t)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition relative ${
                        pharmacyTab === t ? "bg-purple-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {label}
                      {t === "autorefill" && refillSubs.filter(s => s.active).length > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-teal-500 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                          {refillSubs.filter(s => s.active).length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {pharmacyTab === "otc" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {POPULAR_MEDICINES.map(med => (
                      <div key={med.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center gap-3">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{med.name}</p>
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-medium">{med.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-gray-800">₹{med.price}</span>
                          {pharmacyCart[med.id] ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setPharmacyCart(c => ({ ...c, [med.id]: Math.max(0, (c[med.id] || 0) - 1) }))}
                                className="w-7 h-7 bg-gray-200 rounded-lg font-bold text-gray-700"
                              >−</button>
                              <span className="w-6 text-center font-bold text-sm">{pharmacyCart[med.id]}</span>
                              <button
                                onClick={() => setPharmacyCart(c => ({ ...c, [med.id]: (c[med.id] || 0) + 1 }))}
                                className="w-7 h-7 bg-purple-600 text-white rounded-lg font-bold"
                              >+</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setPharmacyCart(c => ({ ...c, [med.id]: 1 }))}
                              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {pharmacyTab === "prescription" && (
                  <div className="space-y-3">
                    {SEED_MEDICAL_RECORDS.filter(r => r.type === "PRESCRIPTION").map(rx => (
                      <div key={rx.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center gap-4">
                        <div>
                          <p className="font-bold text-gray-900">{rx.title}</p>
                          <p className="text-xs text-gray-500">{rx.date} • {rx.doctorOrLabName}</p>
                        </div>
                        <button
                          onClick={() => alert("Upload prescription to auto-parse medicines")}
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
                        >
                          Order Medicines
                        </button>
                      </div>
                    ))}
                    {SEED_MEDICAL_RECORDS.filter(r => r.type === "PRESCRIPTION").length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-8">No prescriptions in your Health Vault yet.</p>
                    )}
                  </div>
                )}

                {pharmacyTab === "autorefill" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-black text-gray-900 text-sm">Active Subscriptions</p>
                        <p className="text-xs text-gray-500">{refillSubs.filter(s => s.active).length} active • {refillSubs.length} total</p>
                      </div>
                      <button
                        onClick={() => {
                          const med = prompt("Medicine name (e.g. Losartan 50mg):");
                          if (med?.trim()) {
                            setRefillSubs(prev => [...prev, { id: `sub-${Date.now()}`, name: med.trim(), freq: "Monthly", next: "15 Dec 2026", price: 150, active: true }]);
                          }
                        }}
                        className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition"
                      >
                        + Add Subscription
                      </button>
                    </div>
                    {refillSubs.map(sub => (
                      <div key={sub.id} className={`bg-white p-4 rounded-2xl border-2 shadow-sm flex items-center gap-4 ${sub.active ? "border-teal-200" : "border-gray-200 opacity-70"}`}>
                        <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0 text-lg">💊</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">{sub.name}</p>
                          <p className="text-xs text-gray-500">{sub.freq} • 30 tabs</p>
                          <p className="text-xs text-teal-600 font-semibold">Next: {sub.next}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-black text-gray-900">₹{sub.price}</p>
                          <button
                            onClick={() => setRefillSubs(prev => prev.map(s => s.id === sub.id ? { ...s, active: !s.active } : s))}
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg border mt-1 transition ${sub.active ? "border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100" : "border-teal-400 text-teal-700 bg-teal-50 hover:bg-teal-100"}`}
                          >
                            {sub.active ? "Pause" : "Resume"}
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-start gap-2 text-xs text-blue-700">
                      <span className="text-base shrink-0">ℹ️</span>
                      <span>Auto-dispatched to your address on schedule. Pause anytime. 5% cashback on all chronic medicine subscriptions.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4 h-fit">
                <h3 className="font-black text-gray-900">🛒 Cart</h3>
                {Object.entries(pharmacyCart).filter(([, qty]) => qty > 0).length === 0 ? (
                  <p className="text-gray-400 text-sm">No items added yet.</p>
                ) : (
                  <>
                    {Object.entries(pharmacyCart).filter(([, qty]) => qty > 0).map(([id, qty]) => {
                      const med = POPULAR_MEDICINES.find(m => m.id === id);
                      if (!med) return null;
                      return (
                        <div key={id} className="flex justify-between items-center text-sm border-b pb-2">
                          <span className="text-gray-700">{med.name} × {qty}</span>
                          <span className="font-bold">₹{med.price * qty}</span>
                        </div>
                      );
                    })}
                    <div className="pt-2">
                      <div className="flex justify-between font-black text-gray-900">
                        <span>Total</span>
                        <span>₹{Object.entries(pharmacyCart).reduce((sum, [id, qty]) => {
                          const med = POPULAR_MEDICINES.find(m => m.id === id);
                          return sum + (med ? med.price * qty : 0);
                        }, 0)}</span>
                      </div>
                    </div>
                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-bold text-gray-700">Delivery Slot:</label>
                      <select
                        value={pharmacyDeliverySlot}
                        onChange={e => setPharmacyDeliverySlot(e.target.value)}
                        className="w-full border rounded-xl p-2 text-sm"
                      >
                        <option value="express">Express (2h) — ₹49</option>
                        <option value="same-day">Same Day — FREE</option>
                        <option value="next-day">Next Day — FREE</option>
                      </select>
                    </div>
                    <button
                      onClick={() => setPharmacyOrderSuccess(true)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-sm transition"
                    >
                      Place Order
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Ambulance Booking */}
      {activeTab === "ambulance" && (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="bg-red-50 border-2 border-red-400 p-6 rounded-3xl space-y-3">
            <h3 className="text-red-900 font-extrabold text-xl flex items-center gap-2">🚑 When to Request Ambulance</h3>
            <div className="grid grid-cols-2 gap-2">
              {["Chest pain or difficulty breathing", "Loss of consciousness or seizure", "Major trauma or accident injuries", "Signs of stroke or heart attack", "Severe bleeding or burns", "Severe allergic reaction"].map((sign, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-red-800">
                  <span className="text-red-500">●</span> {sign}
                </div>
              ))}
            </div>
            <a href="tel:112" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition">
              📞 Call 112 for Life-Threatening Emergencies
            </a>
          </div>

          {ambDispatched ? (
            <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
              <div className="text-5xl">✅</div>
              <h3 className="text-xl font-black text-red-800">Ambulance Dispatched!</h3>
              <p className="text-gray-600 text-sm">ETA: ~{ambVehicleType === "BASIC" ? "10" : ambVehicleType === "ADVANCED" ? "13" : "16"} minutes</p>
              <div className="bg-gray-50 rounded-2xl p-4 text-sm text-left space-y-2">
                <p><strong>Driver:</strong> Suresh Kumar</p>
                <p><strong>Phone:</strong> <a href="tel:+919800012345" className="text-teal-700 font-bold">+91-9800012345</a></p>
                <p><strong>Vehicle:</strong> WB-01-AB-1234</p>
                <p><strong>Type:</strong> {ambVehicleType} Ambulance</p>
              </div>
              <div className="flex justify-center gap-2 text-xs">
                {["REQUESTED", "DISPATCHED", "EN_ROUTE", "ARRIVED"].map((s, i) => (
                  <div key={s} className="flex flex-col items-center gap-1">
                    <div className={`w-3 h-3 rounded-full ${i <= 1 ? "bg-teal-500" : "bg-gray-300"}`} />
                    <span className={i <= 1 ? "text-teal-700 font-bold" : "text-gray-400"}>{s.replace("_", " ")}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setAmbDispatched(false)} className="text-gray-500 text-sm underline">Book Another</button>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-5 shadow-sm">
              <h3 className="font-black text-xl text-gray-900">Book Ambulance</h3>

              <div className="grid grid-cols-3 gap-3">
                {([
                  { type: "BASIC" as const, label: "Basic", emoji: "🚐", desc: "First aid, O2, stretcher", eta: "8–12 min" },
                  { type: "ADVANCED" as const, label: "Advanced", emoji: "🚑", desc: "Paramedic + cardiac monitor", eta: "10–15 min" },
                  { type: "ICU" as const, label: "ICU Mobile", emoji: "🏥", desc: "Full ICU / ventilator", eta: "12–18 min" }
                ]).map(v => (
                  <button
                    key={v.type}
                    onClick={() => setAmbVehicleType(v.type)}
                    className={`p-3 rounded-2xl border-2 text-left transition ${ambVehicleType === v.type ? "border-red-500 bg-red-50" : "border-gray-200 bg-white hover:border-red-300"}`}
                  >
                    <div className="text-2xl mb-1">{v.emoji}</div>
                    <p className="font-bold text-sm">{v.label}</p>
                    <p className="text-xs text-gray-500">{v.desc}</p>
                    <p className={`text-xs font-bold mt-1 ${ambVehicleType === v.type ? "text-red-600" : "text-gray-400"}`}>ETA: {v.eta}</p>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Patient Name *</label>
                  <input type="text" value={ambPatientName} onChange={e => setAmbPatientName(e.target.value)} placeholder="Full name" className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-red-400 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Contact Phone *</label>
                  <input type="tel" value={ambPhone} onChange={e => setAmbPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-red-400 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Pickup Address *</label>
                  <input type="text" value={ambPickup} onChange={e => setAmbPickup(e.target.value)} placeholder="Flat / Block / Area" className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-red-400 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Destination Hospital (optional)</label>
                  <input type="text" value={ambDest} onChange={e => setAmbDest(e.target.value)} placeholder="Hospital name" className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-red-400 focus:outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-700 block mb-1">Emergency Note</label>
                  <textarea rows={2} value={ambNote} onChange={e => setAmbNote(e.target.value)} placeholder="Brief description of emergency..." className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-red-400 focus:outline-none resize-none" />
                </div>
              </div>

              <button
                onClick={() => { if (ambPatientName && ambPickup && ambPhone) setAmbDispatched(true); }}
                disabled={!ambPatientName || !ambPickup || !ambPhone}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl text-base transition shadow-lg"
              >
                🚑 Dispatch Ambulance Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: IPD Hospital Admission */}
      {activeTab === "ipd" && (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="bg-purple-50 border border-purple-200 p-6 rounded-3xl">
            <h3 className="text-purple-900 font-extrabold text-xl mb-1">🏥 IPD / Hospital Admission Booking</h3>
            <p className="text-purple-700 text-sm">Book a planned hospital admission, select your ward preference, and get confirmation within 4 hours.</p>
          </div>

          {ipdSubmitted ? (
            <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
              <div className="text-5xl">✅</div>
              <h3 className="text-xl font-black text-teal-800">Admission Request Submitted!</h3>
              <p className="text-gray-600 text-sm">The hospital coordinator will call you within 4 hours to confirm.</p>
              <div className="bg-gray-50 rounded-2xl p-4 text-sm text-left space-y-2">
                {[["Patient", ipdPatientName], ["Hospital", ipdHospital], ["Department", ipdDept], ["Ward", ipdWard], ["Reason", ipdReason || "—"]].map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-gray-500 w-24 shrink-0">{k}:</span>
                    <span className="font-semibold text-gray-900">{v}</span>
                  </div>
                ))}
              </div>
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-sm text-left space-y-2">
                <p className="font-bold text-teal-800 mb-1">Next Steps:</p>
                {["Hospital coordinator will call within 4 hrs", "Carry ID proof and doctor's referral", "Pre-admission tests may be required", "Insurance pre-authorization if applicable"].map((s, i) => (
                  <div key={i} className="flex gap-2"><span className="font-bold text-teal-600">{i + 1}.</span> {s}</div>
                ))}
              </div>
              <button onClick={() => setIpdSubmitted(false)} className="text-gray-500 text-sm underline">Submit Another</button>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-5 shadow-sm">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2">Department *</label>
                <div className="flex flex-wrap gap-2">
                  {["General Medicine", "Cardiology", "Orthopedics", "Neurology", "Gynecology", "Pediatrics", "Oncology", "Gastroenterology", "Urology", "ENT"].map(d => (
                    <button key={d} onClick={() => setIpdDept(d)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border ${ipdDept === d ? "bg-purple-600 text-white border-purple-600" : "bg-white border-gray-200 text-gray-700 hover:border-purple-300"}`}>{d}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2">Hospital *</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Apollo Hospital", "Fortis Healthcare", "Max Super Specialty", "AIIMS", "Manipal Hospital", "Community General Hospital"].map(h => {
                    const beds = HOSPITAL_BED_WEB[h];
                    const total = beds ? Object.values(beds).reduce((s, n) => s + n, 0) : 0;
                    const bedColor = total > 10 ? "text-green-700 bg-green-50 border-green-300" : total > 4 ? "text-amber-700 bg-amber-50 border-amber-300" : "text-red-700 bg-red-50 border-red-300";
                    return (
                      <button key={h} onClick={() => setIpdHospital(h)} className={`p-2.5 rounded-xl text-xs font-semibold text-left transition border flex items-center justify-between gap-2 ${ipdHospital === h ? "bg-purple-50 border-purple-500 text-purple-800" : "bg-white border-gray-200 text-gray-700 hover:border-purple-300"}`}>
                        <span>🏥 {h}</span>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full border ${bedColor} shrink-0`}>
                          {total > 0 ? `${total} beds` : "Full"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Patient Name *</label>
                  <input type="text" value={ipdPatientName} onChange={e => setIpdPatientName(e.target.value)} placeholder="Name as on ID" className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-purple-400 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Contact Phone *</label>
                  <input type="tel" value={ipdPhone} onChange={e => setIpdPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-purple-400 focus:outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-700 block mb-1">Reason for Admission</label>
                  <input type="text" value={ipdReason} onChange={e => setIpdReason(e.target.value)} placeholder="e.g. knee replacement surgery, planned delivery" className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-purple-400 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Expected Admission Date</label>
                  <input type="date" value={ipdDate} onChange={e => setIpdDate(e.target.value)} className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-purple-400 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Ward Preference</label>
                  <select value={ipdWard} onChange={e => setIpdWard(e.target.value as any)} className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-purple-400 focus:outline-none">
                    {([["GENERAL", "General Ward", "₹1,200/day"], ["SEMI_PRIVATE", "Semi-Private", "₹2,500/day"], ["PRIVATE", "Private Room", "₹4,500/day"], ["ICU", "ICU / Critical", "₹8,000+/day"]] as const).map(([val, label, price]) => {
                      const avail = ipdHospital ? (HOSPITAL_BED_WEB[ipdHospital]?.[val] ?? null) : null;
                      const availLabel = avail === null ? "" : avail === 0 ? " • Full" : ` • ${avail} beds available`;
                      return <option key={val} value={val}>{label} — {price}{availLabel}</option>;
                    })}
                  </select>
                </div>
              </div>

              <button
                onClick={() => { if (ipdDept && ipdHospital && ipdPatientName && ipdPhone) setIpdSubmitted(true); }}
                disabled={!ipdDept || !ipdHospital || !ipdPatientName || !ipdPhone}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl text-base transition shadow"
              >
                Submit Admission Request
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Surgery Care ─────────────────────────────────────────────────────── */}
      {activeTab === "surgery" && (
        <div className="space-y-5">
          {/* Free First Consultation CTA (Round 6) */}
          <div className="bg-teal-600 rounded-2xl p-4 flex items-center gap-3 text-white">
            <span className="text-2xl">💬</span>
            <div className="flex-1">
              <p className="font-black text-sm">Book Free Consultation</p>
              <p className="text-xs text-teal-100">Talk to a surgical specialist first — free, no obligation</p>
            </div>
            <button onClick={() => alert("Free Consultation\n\nA surgical specialist will call you within 2 hours to understand your condition and guide you — completely free.")} className="bg-white text-teal-700 font-black text-xs px-3 py-2 rounded-xl">Book Free →</button>
          </div>

          {/* Care Buddy Banner */}
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-black">P</div>
            <div className="flex-1">
              <p className="font-black text-purple-900 text-sm">Care Buddy: Priya Sharma</p>
              <p className="text-xs text-purple-700 mt-0.5">Dedicated coordinator · Available 24×7 · Free service</p>
            </div>
            <button onClick={() => alert("Care Buddy: +91 98765 43210")} className="bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">Call</button>
          </div>

          {/* Insurance Coverage Check (Round 6) */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-600">🛡️</span>
              <p className="font-black text-green-900 text-sm flex-1">Insurance Coverage Check</p>
              <span className="bg-green-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">✓ COVERED</span>
            </div>
            <p className="text-xs text-green-700 mb-3">Your surgery is covered under Star Health (SH-2026-XXXXX)</p>
            <div className="grid grid-cols-3 gap-2">
              {[{ label: "Sum Insured", val: "₹5,00,000" }, { label: "Used", val: "₹1,20,000" }, { label: "Available", val: "₹3,80,000" }].map((d, i) => (
                <div key={i} className="bg-white rounded-xl p-2 text-center">
                  <p className="text-[10px] text-gray-500">{d.label}</p>
                  <p className="text-sm font-black text-gray-800 mt-0.5">{d.val}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-green-600 mt-2 italic">Cashless pre-auth will be initiated by your Care Buddy.</p>
          </div>

          {/* Procedure Grid */}
          <div>
            <h3 className="text-sm font-black text-gray-900 mb-3">Select Procedure</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "Bypass Surgery (CABG)", cat: "Cardiac", range: "₹2L–₹5L", color: "bg-red-50 border-red-200 text-red-700" },
                { name: "Knee Replacement (TKR)", cat: "Orthopedics", range: "₹1.2L–₹2.8L", color: "bg-purple-50 border-purple-200 text-purple-700" },
                { name: "Cataract Surgery", cat: "Ophthalmology", range: "₹15K–₹60K", color: "bg-teal-50 border-teal-200 text-teal-700" },
                { name: "Laparoscopic Surgery", cat: "General", range: "₹40K–₹1.2L", color: "bg-amber-50 border-amber-200 text-amber-700" },
                { name: "Hysterectomy", cat: "Gynecology", range: "₹60K–₹1.5L", color: "bg-pink-50 border-pink-200 text-pink-700" },
                { name: "Bariatric Surgery", cat: "Bariatric", range: "₹1.5L–₹3.5L", color: "bg-green-50 border-green-200 text-green-700" },
              ].map((p, i) => (
                <div key={i} className={`${p.color} border rounded-2xl p-3 cursor-pointer hover:shadow-md transition`}
                  onClick={() => alert(`Surgery: ${p.name}\n\nEst. cost: ${p.range}\nCategory: ${p.cat}\n\nYour Care Buddy will contact you within 2 hours.`)}>
                  <p className="font-black text-sm leading-tight">{p.name}</p>
                  <p className="text-xs opacity-70 mt-1">{p.cat}</p>
                  <p className="text-xs font-bold mt-2">{p.range}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cashless Hospitals */}
          <div>
            <h3 className="text-sm font-black text-gray-900 mb-3">Cashless Empanelled Hospitals</h3>
            {[
              { name: "Apollo Hospital", rating: "4.9", cashless: true, nabl: true },
              { name: "Yashoda Super Speciality", rating: "4.7", cashless: true, nabl: true },
              { name: "Care Hospitals", rating: "4.6", cashless: true, nabl: false },
            ].map((h, i) => (
              <div key={i} className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-3 mb-2">
                <div>
                  <p className="font-bold text-sm text-gray-900">{h.name}</p>
                  <div className="flex gap-1.5 mt-1">
                    {h.cashless && <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">Cashless</span>}
                    {h.nabl && <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">NABH</span>}
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">⭐ {h.rating}</span>
              </div>
            ))}
          </div>

          {/* EMI */}
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
            <p className="font-black text-teal-900 text-sm">💳 EMI / No-Cost Finance</p>
            <p className="text-xs text-teal-700 mt-1">0% interest via HDFC, ICICI, Bajaj Finance — 3, 6, 9, 12, 18, or 24 months</p>
            <button className="mt-3 bg-teal-600 text-white text-xs font-bold px-4 py-2 rounded-xl" onClick={() => alert("EMI Calculator coming soon.")}>Check EMI Options</button>
          </div>
        </div>
      )}

      {/* ── Dental Care ──────────────────────────────────────────────────────── */}
      {activeTab === "dental" && (
        <div className="space-y-5">
          {/* Dentist List */}
          <div>
            <h3 className="text-sm font-black text-gray-900 mb-3">Community Verified Dentists</h3>
            {[
              { name: "Dr. Ramesh Gupta", spec: "Prosthodontics & Implants", exp: 15, fee: 400, slot: "Today 5:00 PM" },
              { name: "Dr. Sunita Agarwal", spec: "Orthodontics (Braces)", exp: 12, fee: 350, slot: "Tomorrow 10:00 AM" },
              { name: "Dr. Kiran Reddy", spec: "Root Canal & Endodontics", exp: 10, fee: 300, slot: "Today 7:00 PM" },
            ].map((d, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 mb-2 flex items-center justify-between gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-black shrink-0">
                  {d.name.split(" ")[1][0]}
                </div>
                <div className="flex-1">
                  <p className="font-black text-sm text-gray-900">{d.name}</p>
                  <p className="text-xs text-gray-500">{d.spec} · {d.exp} yrs</p>
                  <p className="text-xs text-blue-600 font-semibold mt-1">🕐 {d.slot}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">₹{d.fee}</p>
                  <button onClick={() => alert(`Booking with ${d.name}\nNext: ${d.slot}`)} className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">Book</button>
                </div>
              </div>
            ))}
          </div>

          {/* Packages */}
          <div>
            <h3 className="text-sm font-black text-gray-900 mb-3">Dental Packages</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "Basic Checkup", price: 299, original: 499, color: "bg-teal-50 border-teal-200" },
                { name: "Scaling & Polish", price: 799, original: 1200, popular: true, color: "bg-indigo-50 border-indigo-200" },
                { name: "Root Canal", price: 2999, original: 4500, color: "bg-amber-50 border-amber-200" },
                { name: "Teeth Whitening", price: 1999, original: 3500, color: "bg-pink-50 border-pink-200" },
                { name: "Dental Crown", price: 4999, original: 7000, color: "bg-purple-50 border-purple-200" },
                { name: "Braces Consult", price: 0, original: 500, color: "bg-green-50 border-green-200" },
              ].map((pkg, i) => (
                <div key={i} className={`${pkg.color} border rounded-2xl p-3 cursor-pointer hover:shadow-md transition`}
                  onClick={() => alert(`Package: ${pkg.name}\nPrice: ${pkg.price === 0 ? "FREE" : `₹${pkg.price}`}\n\nBook with any of our verified dentists.`)}>
                  {(pkg as any).popular && <span className="text-xs bg-amber-200 text-amber-800 font-bold px-2 py-0.5 rounded-full">Popular</span>}
                  <p className="font-black text-sm mt-1">{pkg.name}</p>
                  <p className="text-lg font-black text-gray-900 mt-1">{pkg.price === 0 ? "FREE" : `₹${pkg.price}`}</p>
                  <p className="text-xs text-gray-400 line-through">₹{pkg.original}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dental Vault */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <p className="font-black text-blue-900 text-sm">🛡️ Dental Vault</p>
            <p className="text-xs text-blue-700 mt-1">Your dental findings, treatments and follow-up reminders are stored securely.</p>
            <div className="mt-3 space-y-2">
              {[
                { date: "12 Aug 2026", dentist: "Dr. Ramesh Gupta", finding: "Mild tartar buildup", treatment: "Scaling done" },
                { date: "3 Mar 2026", dentist: "Dr. Sunita Agarwal", finding: "Crowding (lower arch)", treatment: "Braces consult advised" },
              ].map((f, i) => (
                <div key={i} className="bg-white rounded-xl p-3 text-xs space-y-1">
                  <div className="flex justify-between"><span className="font-bold text-gray-700">{f.dentist}</span><span className="text-gray-400">{f.date}</span></div>
                  <p className="text-gray-600">{f.finding} → {f.treatment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ABHA Health ID ───────────────────────────────────────────────────── */}
      {activeTab === "abha" && (
        <div className="space-y-5">
          {/* ABHA Card */}
          <div className="bg-gradient-to-r from-blue-800 to-purple-700 text-white rounded-3xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold tracking-widest text-blue-200 uppercase">ABHA Health ID</span>
              <span className="text-xs bg-green-400/20 text-green-300 font-bold px-2 py-0.5 rounded-full">✓ Verified</span>
            </div>
            <p className="text-2xl font-black tracking-widest mb-1">23-4521-6789-0012</p>
            <p className="text-sm text-blue-200 font-semibold">Raghunath Krishnamurthy</p>
            <p className="text-xs text-blue-300 mt-0.5">DOB: 15/08/1985 · Male</p>
            <div className="flex gap-4 mt-4 bg-white/10 rounded-2xl p-3 text-center">
              <div className="flex-1"><p className="text-xl font-black">4</p><p className="text-xs text-blue-200">Hospitals</p></div>
              <div className="w-px bg-white/20" />
              <div className="flex-1"><p className="text-xl font-black">12</p><p className="text-xs text-blue-200">Records</p></div>
              <div className="w-px bg-white/20" />
              <div className="flex-1"><p className="text-xl font-black">Mar</p><p className="text-xs text-blue-200">2025</p></div>
            </div>
          </div>

          {/* Linked Records */}
          <div>
            <h3 className="text-sm font-black text-gray-900 mb-3">Linked Records</h3>
            {[
              { type: "Prescription", title: "Antibiotic Course — Dr. Mehta", hospital: "Apollo Hospital", date: "12 Oct 2026" },
              { type: "Lab Report", title: "HbA1c & Lipid Panel", hospital: "Star Lab", date: "3 Sep 2026" },
              { type: "Discharge", title: "Appendectomy Discharge Summary", hospital: "Yashoda Hospital", date: "15 Aug 2026" },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-3 mb-2">
                <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-lg shrink-0">{r.type}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-900">{r.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{r.hospital} · {r.date}</p>
                </div>
                <button onClick={() => alert(`Viewing: ${r.title}`)} className="text-blue-600 text-xs font-bold">View →</button>
              </div>
            ))}
          </div>

          {/* Consent Manager */}
          <div>
            <h3 className="text-sm font-black text-gray-900 mb-3">Consent Manager</h3>
            {[
              { from: "Apollo Hospital", purpose: "View OPD Records", status: "Pending" },
              { from: "Star Lab Diagnostics", purpose: "Share Lab Reports", status: "Approved" },
            ].map((c, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 mb-2 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-sm text-gray-900">{c.from}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.status === "Pending" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>{c.status}</span>
                </div>
                <p className="text-xs text-gray-500">{c.purpose}</p>
                {c.status === "Pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => alert("Consent granted")} className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded-xl">Approve</button>
                    <button onClick={() => alert("Consent denied")} className="flex-1 bg-red-100 text-red-600 text-xs font-bold py-2 rounded-xl">Deny</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Cancer Care ───────────────────────────────────────────────────────── */}
      {activeTab === "cancer" && (
        <div className="space-y-5">
          {/* Second Opinion Banner */}
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
            <p className="font-black text-purple-900 text-sm">💬 Get a Second Opinion</p>
            <p className="text-xs text-purple-700 mt-1 mb-3">25% of cancer diagnoses benefit from a second expert review. It's your right — and often covered by insurance.</p>
            <button onClick={() => alert("Second opinion request submitted.\n\nA specialist will review your diagnosis and contact you within 24–48 hours.")} className="bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-xl">Request Second Opinion</button>
          </div>

          {/* Oncologists */}
          <div>
            <h3 className="text-sm font-black text-gray-900 mb-3">Oncology Specialists</h3>
            {[
              { name: "Dr. Vikram Desai", spec: "Medical Oncology", hospital: "Apollo Cancer Centre", fee: 800, so: true },
              { name: "Dr. Kavita Sharma", spec: "Surgical Oncology", hospital: "Yashoda Cancer Hospital", fee: 900, so: true },
              { name: "Dr. Arun Nair", spec: "Radiation Oncology", hospital: "HCG Cancer Centre", fee: 750, so: false },
            ].map((d, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-black shrink-0">
                    {d.name.split(" ")[1][0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-sm text-gray-900">{d.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{d.spec}</p>
                    <p className="text-xs text-gray-400">{d.hospital}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">₹{d.fee}</p>
                    <button onClick={() => alert(`Booking with ${d.name}`)} className="bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">Book</button>
                  </div>
                </div>
                {d.so && <span className="mt-2 inline-block text-xs bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">Second Opinion Available</span>}
              </div>
            ))}
          </div>

          {/* Oncology Care Journey */}
          <div>
            <h3 className="text-sm font-black text-gray-900 mb-3">Oncology Care Journey</h3>
            <div className="space-y-2">
              {[
                { label: "Diagnosis Confirmed", done: true, detail: "Biopsy confirmed • 5 Sep 2026" },
                { label: "Cancer Staging", done: true, detail: "Stage II — localised • 12 Sep 2026" },
                { label: "Second Opinion", done: true, detail: "Dr. Vikram Desai confirmed • 18 Sep 2026" },
                { label: "Treatment Plan Ready", done: true, detail: "4 cycles chemo + radiation • 22 Sep 2026" },
                { label: "Treatment In Progress", done: false, detail: "Cycle 2 of 4 — Next: 30 Oct 2026" },
                { label: "Response Evaluation", done: false, detail: "Mid-treatment CT scan" },
                { label: "Follow-up & Remission", done: false, detail: "Ongoing surveillance" },
              ].map((step, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-2xl border ${step.done ? "bg-purple-50 border-purple-200" : "bg-gray-50 border-gray-200 opacity-60"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${step.done ? "bg-purple-600 text-white" : "bg-gray-300 text-gray-600"}`}>
                    {step.done ? "✓" : i + 1}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">{step.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Support */}
          <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-2xl p-4 text-center space-y-2">
            <p className="font-black text-lg">You Are Not Alone</p>
            <p className="text-xs text-purple-200">Our community, Care Buddy, and oncology team support you every step of the way.</p>
            <p className="text-xs text-purple-200 font-semibold">National Cancer Helpline: 1800-180-4104 (Free · 24×7)</p>
          </div>
        </div>
      )}

      {/* ── Mental Health ──────────────────────────────────────────────────────── */}
      {activeTab === "mental-health" && (
        <div className="space-y-5">
          {/* Mood Check-in */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
            <p className="font-black text-sm text-gray-900">How are you feeling today?</p>
            <p className="text-xs text-gray-500">Daily mood tracking helps identify patterns over time.</p>
            <div className="flex gap-2">
              {[
                { score: 1, emoji: "😔", label: "Very Low", color: "bg-red-100 border-red-300" },
                { score: 2, emoji: "😟", label: "Low", color: "bg-orange-100 border-orange-300" },
                { score: 3, emoji: "😐", label: "Okay", color: "bg-yellow-100 border-yellow-300" },
                { score: 4, emoji: "🙂", label: "Good", color: "bg-green-100 border-green-300" },
                { score: 5, emoji: "😄", label: "Great", color: "bg-emerald-100 border-emerald-300" },
              ].map((m) => (
                <button key={m.score} className={`flex-1 border ${m.color} rounded-xl p-2 text-center hover:scale-105 transition-transform`}
                  onClick={() => alert(`Mood logged: ${m.label} ${m.emoji}\n\nKeep up your wellness check-in streak!`)}>
                  <div className="text-xl">{m.emoji}</div>
                  <div className="text-[9px] font-semibold text-gray-600 mt-1">{m.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Therapists */}
          <div>
            <h3 className="text-sm font-black text-gray-900 mb-1">Mental Health Specialists</h3>
            <p className="text-xs text-gray-500 mb-3">50-minute sessions with licensed therapists & psychiatrists</p>
            {[
              { name: "Dr. Priya Sharma", spec: "Clinical Psychologist", exp: "12 yrs", fee: 1200, modes: ["Video", "Phone"], next: "Today 5:00 PM" },
              { name: "Dr. Rajan Menon", spec: "Psychiatrist", exp: "18 yrs", fee: 1800, modes: ["Video"], next: "Today 7:00 PM" },
              { name: "Dr. Sonal Verma", spec: "Psychotherapist", exp: "8 yrs", fee: 900, modes: ["Video", "Phone", "Chat"], next: "Tomorrow 10:00 AM" },
            ].map((t, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 mb-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-black shrink-0">{t.name.split(" ")[1][0]}</div>
                  <div className="flex-1">
                    <p className="font-black text-sm text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.spec} · {t.exp}</p>
                    <div className="flex gap-1 mt-1">
                      {t.modes.map(m => <span key={m} className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">{m}</span>)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-purple-700">₹{t.fee}</p>
                    <p className="text-[10px] text-gray-400 mb-1">/session</p>
                    <button onClick={() => alert(`50-min session with ${t.name} booked! You'll receive a meeting link.`)} className="bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">Book</button>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">🕐 Next: {t.next}</p>
              </div>
            ))}
          </div>

          {/* Wellness Programs */}
          <div>
            <h3 className="text-sm font-black text-gray-900 mb-3">Wellness Programs</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: "Stress & Anxiety Relief", sessions: 8, duration: "4 weeks", color: "bg-green-50 border-green-200" },
                { title: "Sleep Improvement", sessions: 6, duration: "3 weeks", color: "bg-purple-50 border-purple-200" },
                { title: "Mindfulness", sessions: 12, duration: "6 weeks", color: "bg-blue-50 border-blue-200" },
                { title: "Burnout Recovery", sessions: 8, duration: "4 weeks", color: "bg-amber-50 border-amber-200" },
              ].map((p, i) => (
                <button key={i} className={`border ${p.color} rounded-2xl p-4 text-left hover:shadow-md transition-shadow`}
                  onClick={() => alert(`Enrolled in "${p.title}"! A coach will reach out within 24 hours.`)}>
                  <p className="font-bold text-sm text-gray-900">{p.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{p.sessions} sessions · {p.duration}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Crisis Banner */}
          <div className="bg-red-600 text-white rounded-2xl p-4 text-center space-y-2">
            <p className="font-black text-lg">Crisis Support</p>
            <p className="text-xs text-red-200">If you're in crisis, help is available right now.</p>
            <p className="text-xs font-bold">iCall: 9152987821 · Vandrevala: 1860-2662-345</p>
          </div>
        </div>
      )}

      {/* ── Hospital Finder ────────────────────────────────────────────────────── */}
      {activeTab === "hospitals" && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {["All", "Cashless", "NABL", "NABH"].map(f => (
              <button key={f} className="bg-white border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-teal-50 hover:border-teal-400 hover:text-teal-700 transition-colors">{f}</button>
            ))}
          </div>
          {[
            { name: "Apollo Hospitals", address: "Bannerghatta Road, Bengaluru", distance: "1.2 km", rating: 4.9, beds: 280, cashless: true, nabl: true, nabh: true, er: true, specs: ["Cardiology", "Oncology", "Neurology"] },
            { name: "Manipal Hospital", address: "HAL Airport Road, Bengaluru", distance: "3.4 km", rating: 4.8, beds: 350, cashless: true, nabl: true, nabh: true, er: true, specs: ["Ortho", "Cardiology", "Maternity"] },
            { name: "Fortis Hospital", address: "Cunningham Road, Bengaluru", distance: "4.1 km", rating: 4.7, beds: 190, cashless: true, nabl: true, nabh: false, er: true, specs: ["Oncology", "Neurology"] },
            { name: "Narayana Health City", address: "Bommasandra, Bengaluru", distance: "7.2 km", rating: 4.8, beds: 540, cashless: true, nabl: true, nabh: true, er: true, specs: ["Cardiology", "Oncology", "Maternity"] },
          ].map((h, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-sm text-gray-900">{h.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">📍 {h.address}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs bg-teal-50 text-teal-700 font-bold px-2 py-1 rounded-lg">🧭 {h.distance}</span>
                  <p className="text-xs text-gray-500 mt-1">⭐ {h.rating}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {h.cashless && <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">💳 Cashless</span>}
                {h.nabl && <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">NABL</span>}
                {h.nabh && <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">NABH</span>}
                {h.er && <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">24×7 ER</span>}
              </div>
              <div className="flex flex-wrap gap-1">
                {h.specs.map(s => <span key={s} className="text-[10px] bg-purple-50 text-purple-600 font-semibold px-2 py-0.5 rounded-full">{s}</span>)}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => alert(`Directions to ${h.name}: Opening maps…`)} className="flex-1 border border-teal-500 text-teal-700 text-xs font-bold py-2 rounded-xl">Directions</button>
                <button onClick={() => alert(`Booking OPD at ${h.name}…`)} className="flex-1 bg-teal-600 text-white text-xs font-bold py-2 rounded-xl">Book OPD</button>
                <button onClick={() => alert(`Claim intimated for ${h.name}. Your TPA will be notified.`)} className="flex-1 bg-indigo-50 text-indigo-700 text-xs font-bold py-2 rounded-xl">Intimate Claim</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Mana Gold ─────────────────────────────────────────────────────────── */}
      {activeTab === "gold" && (
        <div className="space-y-5">
          {/* Hero */}
          <div className="bg-gradient-to-br from-amber-700 to-amber-500 rounded-2xl p-6 text-center text-white space-y-2">
            <div className="text-4xl">⭐</div>
            <p className="font-black text-xl text-yellow-200">Mana Gold</p>
            <p className="text-sm text-amber-200 font-bold">Family of 6 · 22+ Specialties · 12+ Languages</p>
            <p className="text-xs text-amber-100">Unlimited video consultations for your entire family, 24×7, in your language.</p>
          </div>

          {/* Family Coverage */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-sm font-black text-amber-800 mb-1">Covers Your Whole Family</p>
            <p className="text-xs text-amber-600 mb-3">Add up to 6 members — free for all on one plan</p>
            <div className="flex gap-3 flex-wrap">
              {["You", "Spouse", "Child 1", "Child 2", "Parent 1", "Parent 2"].map((m, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-amber-200 border-2 border-amber-500 flex items-center justify-center text-lg">👤</div>
                  <span className="text-[10px] text-amber-700 font-semibold">{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <h3 className="text-sm font-black text-gray-900">What's Included</h3>
            {[
              { icon: "📹", title: "Unlimited Video Consultations", detail: "22+ specialties, family of 6, 24×7", value: "Family of 6" },
              { icon: "🌐", title: "12+ Languages Supported", detail: "Hindi, Telugu, Tamil, Kannada, Bengali & more", value: "12+ langs" },
              { icon: "🧪", title: "30% Off Lab Tests", detail: "All lab packages & home collection", value: "30% off" },
              { icon: "💊", title: "20% Off Pharmacy", detail: "All pharmacy orders", value: "20% off" },
              { icon: "⚡", title: "Priority Booking", detail: "Skip the queue — instant slot confirmation", value: "Priority" },
              { icon: "🩺", title: "Annual Health Check-up", detail: "Comprehensive check-up included", value: "1 free/yr" },
              { icon: "🧠", title: "4 Free Therapy Sessions/mo", detail: "Mental health & counselling sessions", value: "4/mo" },
              { icon: "📞", title: "24×7 Doctor Helpline", detail: "On-call doctor anytime", value: "24×7" },
            ].map((b, i) => (
              <div key={i} className="bg-white border border-amber-200 rounded-2xl p-3 flex items-center gap-3">
                <span className="text-xl">{b.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{b.title}</p>
                  <p className="text-xs text-gray-500">{b.detail}</p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded-lg whitespace-nowrap">{b.value}</span>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
              <p className="text-xs text-gray-500 font-semibold">Monthly</p>
              <p className="text-2xl font-black text-gray-800 mt-1">₹499<span className="text-sm font-normal text-gray-400">/mo</span></p>
            </div>
            <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 text-center relative">
              <span className="absolute -top-2.5 right-2 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">SAVE ₹1,200</span>
              <p className="text-xs text-amber-700 font-semibold">Annual</p>
              <p className="text-2xl font-black text-amber-700 mt-1">₹399<span className="text-sm font-normal text-amber-500">/mo</span></p>
              <p className="text-[10px] text-amber-500">₹4,788/year</p>
            </div>
          </div>

          <button onClick={() => alert("Welcome to Mana Gold! 🌟\n\nYour Gold membership is now active. All benefits are unlocked.")} className="w-full bg-gradient-to-r from-amber-700 to-amber-500 text-yellow-200 font-black text-base py-4 rounded-2xl flex items-center justify-center gap-2">
            ⭐ Get Mana Gold — ₹399/mo
          </button>
          <p className="text-xs text-center text-gray-400">Cancel anytime · No hidden charges · Instant activation</p>
        </div>
      )}

      {/* ── Physiotherapy & Rehabilitation Center ────────────────────────────── */}
      {activeTab === "physiotherapy" && (
        <div className="space-y-6">
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-700 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
            <div className="max-w-2xl space-y-2 relative z-10">
              <div className="flex items-center gap-2">
                <span className="text-3xl">🏃</span>
                <span className="bg-emerald-400 text-teal-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full">
                  Clubhouse Rehab & Doorstep Home Care
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">Physiotherapy & Rehabilitation Center</h2>
              <p className="text-teal-100 text-xs sm:text-sm leading-relaxed">
                Certified sports & musculoskeletal physiotherapists, post-operative recovery, and doorstep home visits. Recover comfortably with dedicated clubhouse rehab facilities and IAP-certified practitioners.
              </p>
            </div>

            {/* Quick Feature Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-teal-600/60 relative z-10 text-xs">
              <div className="bg-teal-900/40 backdrop-blur-xs rounded-xl p-2.5 border border-teal-500/30">
                <div className="text-base mb-1">🏢</div>
                <div className="font-bold text-white">Clubhouse Pavilion</div>
                <div className="text-[10px] text-teal-200">Ground floor sports clinic</div>
              </div>
              <div className="bg-teal-900/40 backdrop-blur-xs rounded-xl p-2.5 border border-teal-500/30">
                <div className="text-base mb-1">🏡</div>
                <div className="font-bold text-white">Home Visits</div>
                <div className="text-[10px] text-teal-200">Portable IFT & ultrasound</div>
              </div>
              <div className="bg-teal-900/40 backdrop-blur-xs rounded-xl p-2.5 border border-teal-500/30">
                <div className="text-base mb-1">🏅</div>
                <div className="font-bold text-white">IAP Certified</div>
                <div className="text-[10px] text-teal-200">100% verified clinicians</div>
              </div>
              <div className="bg-teal-900/40 backdrop-blur-xs rounded-xl p-2.5 border border-teal-500/30">
                <div className="text-base mb-1">💳</div>
                <div className="font-bold text-white">15% Mana Discount</div>
                <div className="text-[10px] text-teal-200">Cashless pass eligible</div>
              </div>
            </div>
          </div>

          {/* Specialty Tracks Filter */}
          <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-xs font-bold text-gray-500 shrink-0 ml-1">Specialties:</span>
            {[
              { id: "ALL", label: "🌐 All Services" },
              { id: "SPORTS", label: "🎾 Sports & Joints" },
              { id: "POST_OP", label: "🩹 Post-Surgery Rehab" },
              { id: "SPINE", label: "💻 Spine & Ergonomics" },
              { id: "GERIATRIC", label: "👵 Senior Mobility" },
              { id: "HOME_CARE", label: "🏡 In-Home Visits" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setPhysioCategoryFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  physioCategoryFilter === tab.id
                    ? "bg-teal-700 text-white shadow-xs"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Interactive Pain & Mobility Self-Assessment Tool */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white rounded-3xl border border-teal-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🩺</span>
                  <h3 className="text-sm sm:text-base font-black text-gray-900">Pain & Mobility Quick Self-Assessment</h3>
                  <span className="text-[10px] font-bold bg-teal-200/80 text-teal-900 px-2 py-0.5 rounded-full">Interactive Guide</span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  Select your pain area and duration for instant clinical guidance and recommended therapy protocols.
                </p>
              </div>
            </div>

            {/* Selector Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pain Area */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2">1. Where does it hurt or feel stiff?</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "neck" as const, label: "Neck & Upper Back", icon: "🧣", note: "Tech-neck, stiffness" },
                    { id: "back" as const, label: "Lower Back / Spine", icon: "🦴", note: "Sciatica, lifting strain" },
                    { id: "knee" as const, label: "Knee & Meniscus", icon: "🦵", note: "Runner's knee, arthritis" },
                    { id: "shoulder" as const, label: "Shoulder & Rotator", icon: "💪", note: "Frozen shoulder, impingement" },
                    { id: "ankle" as const, label: "Ankle & Foot", icon: "👟", note: "Sprain, plantar fasciitis" },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedPainArea(item.id)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        selectedPainArea === item.id
                          ? "bg-teal-700 text-white border-teal-700 shadow-sm"
                          : "bg-white text-gray-800 border-gray-200 hover:border-teal-300"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <span className={`text-[10px] mt-1 ${selectedPainArea === item.id ? "text-teal-100" : "text-gray-400"}`}>
                        {item.note}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration & Severity */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-2">2. How long have you experienced this?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "acute" as const, label: "Recent", time: "< 2 weeks", tag: "Acute" },
                      { id: "subacute" as const, label: "Persistent", time: "2 - 6 weeks", tag: "Subacute" },
                      { id: "chronic" as const, label: "Long-term", time: "> 6 weeks", tag: "Chronic" },
                    ].map(d => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setPainDuration(d.id)}
                        className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                          painDuration === d.id
                            ? "bg-teal-700 text-white border-teal-700 font-bold shadow-xs"
                            : "bg-white text-gray-800 border-gray-200 hover:border-teal-300"
                        }`}
                      >
                        <div className="text-xs font-bold">{d.label}</div>
                        <div className={`text-[10px] ${painDuration === d.id ? "text-teal-100" : "text-gray-400"}`}>{d.time}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-gray-700">3. Pain Intensity (1 to 10):</label>
                    <span className="text-xs font-black text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
                      Level {painSeverity} / 10 · {painSeverity <= 3 ? "Mild" : painSeverity <= 7 ? "Moderate" : "Severe"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={painSeverity}
                    onChange={(e) => setPainSeverity(Number(e.target.value))}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>1: Mild Discomfort</span>
                    <span>5: Interacting with Daily Tasks</span>
                    <span>10: Severe / Immobile</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Assessment Output */}
            {(() => {
              const recommendationMap = {
                neck: {
                  condition: "Cervical Spondylosis & Postural Tech-Neck",
                  protocol: "Cervical Traction, IFT Electrotherapy, Deep Muscle Trigger Release & Ergonomic Desk Calibration",
                  specialist: "Dr. Varun Nair (ActiveLife Physio)",
                  specId: "physio-1",
                  mode: "In-Clinic or Doorstep Home Visit",
                },
                back: {
                  condition: "Lumbar Strain, Disc Bulge or Sciatica Irritation",
                  protocol: "Interferential Therapy (IFT), Lumbar Core Stabilization, McKenzie Extension & Warm Ultrasound Therapy",
                  specialist: "Dr. Ananya Sen (ProMove Rehab)",
                  specId: "physio-3",
                  mode: "In-Clinic (Clubhouse) or Home Visit",
                },
                knee: {
                  condition: "Patellofemoral Pain, Meniscus Strain or Early Osteoarthritis",
                  protocol: "Cryo-compression, Dry Needling for VMO muscle, Joint Gliding & Quadriceps Strengthening Routine",
                  specialist: "Dr. Varun Nair (ActiveLife Physio)",
                  specId: "physio-1",
                  mode: "Clubhouse Sports Pavilion Clinic",
                },
                shoulder: {
                  condition: "Adhesive Capsulitis (Frozen Shoulder) or Rotator Cuff Tendonitis",
                  protocol: "Glenohumeral Joint Mobilization, Therapeutic Ultrasound, Pendulum Exercises & Resistance Band Activation",
                  specialist: "Dr. Ananya Sen (ProMove Rehab)",
                  specId: "physio-3",
                  mode: "In-Clinic or Doorstep Home Visit",
                },
                ankle: {
                  condition: "Inversion Ankle Sprain, Achilles Tendonitis or Plantar Fasciitis",
                  protocol: "Proprioception Wobble-Board Training, Kinesio Taping, Calf Muscle Release & Ultrasound Therapy",
                  specialist: "Dr. Varun Nair (ActiveLife Physio)",
                  specId: "physio-1",
                  mode: "Clubhouse Sports Pavilion Clinic",
                },
              };
              const rec = recommendationMap[selectedPainArea];
              const matchedPhysio = SEED_DOCTORS.find(d => d.id === rec.specId) || SEED_DOCTORS.find(d => d.category === "PHYSIOTHERAPIST");

              return (
                <div className="bg-white rounded-2xl p-4 border border-teal-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                        Suggested Diagnosis: {rec.condition}
                      </span>
                      {painSeverity >= 7 && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          ⚠️ Priority Care Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-700 font-medium">
                      <strong>Recommended Protocol:</strong> {rec.protocol}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Recommended Specialist: <strong className="text-gray-900">{rec.specialist}</strong> · {rec.mode}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPhysioCondition(rec.condition);
                      setPhysioBookingModal({
                        open: true,
                        physio: matchedPhysio || null,
                        preselectedMode: painSeverity >= 8 ? "HOME" : "CLINIC"
                      });
                    }}
                    className="shrink-0 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Book Session for this Issue</span>
                    <span>→</span>
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Verified Community Physiotherapists List */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <span>👨‍⚕️</span>
                  <span>Verified Community Physiotherapists</span>
                </h3>
                <p className="text-xs text-gray-500">IAP Certified clinicians available at the Clubhouse Sports Pavilion and for doorstep flat visits.</p>
              </div>
            </div>

            <div className="space-y-3">
              {SEED_DOCTORS.filter(d => {
                if (d.category !== "PHYSIOTHERAPIST") return false;
                if (physioCategoryFilter === "ALL") return true;
                if (physioCategoryFilter === "SPORTS") return d.specialty.toLowerCase().includes("sport");
                if (physioCategoryFilter === "POST_OP") return d.specialty.toLowerCase().includes("post-surgery") || d.specialty.toLowerCase().includes("orthopedic");
                if (physioCategoryFilter === "SPINE") return d.specialty.toLowerCase().includes("spine") || d.specialty.toLowerCase().includes("rehab");
                if (physioCategoryFilter === "GERIATRIC") return d.specialty.toLowerCase().includes("geriatric") || d.specialty.toLowerCase().includes("neuro");
                if (physioCategoryFilter === "HOME_CARE") return Boolean(d.homeVisitAvailable);
                return true;
              }).map((physio) => (
                <div
                  key={physio.id}
                  className="bg-white border border-gray-200 rounded-3xl p-5 hover:border-teal-300 transition-all shadow-2xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    {/* Left: Avatar & Bio */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                        {physio.name.replace("Dr. ", "").split(" ")[0][0]}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-base text-gray-900">{physio.name}</h4>
                          {physio.verifiedBadge && (
                            <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                              ✓ Verified IAP
                            </span>
                          )}
                          {physio.clinicAddress.includes("Clubhouse") && (
                            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                              🏢 Clubhouse Pavilion
                            </span>
                          )}
                          {physio.homeVisitAvailable && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                              🏡 Home Visits
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-semibold text-teal-700">{physio.specialty}</p>

                        <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                          <span>{physio.qualifications.join(", ")}</span>
                          <span>·</span>
                          <span>{physio.experienceYears} yrs experience</span>
                          <span>·</span>
                          <span className="text-amber-600 font-bold">⭐ {physio.rating} ({physio.reviewCount} reviews)</span>
                        </div>

                        <div className="text-xs text-gray-600 flex items-center gap-2 pt-1 flex-wrap">
                          <span>📍 {physio.clinicAddress}</span>
                          <span>·</span>
                          <span>🗣️ {physio.languages.join(", ")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Pricing & CTA */}
                    <div className="w-full sm:w-auto text-left sm:text-right flex sm:flex-col justify-between items-center sm:items-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0">
                      <div>
                        <div className="flex items-baseline gap-1.5 justify-end">
                          <span className="text-xs text-gray-400 line-through">₹{Math.round(physio.consultationFee * 1.18)}</span>
                          <span className="text-xl font-black text-teal-900">₹{physio.consultationFee}</span>
                        </div>
                        <p className="text-[10px] font-semibold text-emerald-600">15% Mana Resident Discount</p>
                        <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1 sm:justify-end">
                          <span>🕐 Slot:</span>
                          <strong className="text-gray-800">{physio.nextAvailableSlot}</strong>
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPhysioVisitMode("CLINIC");
                            setPhysioBookingModal({ open: true, physio, preselectedMode: "CLINIC" });
                          }}
                          className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xs transition cursor-pointer"
                        >
                          Book Clinic
                        </button>
                        {physio.homeVisitAvailable && (
                          <button
                            type="button"
                            onClick={() => {
                              setPhysioVisitMode("HOME");
                              setPhysioBookingModal({ open: true, physio, preselectedMode: "HOME" });
                            }}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
                          >
                            Book Home Visit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Community Offer Strip if available */}
                  {physio.communityOffer && (
                    <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-2.5 flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🏷️</span>
                        <span>
                          <strong className="font-bold text-amber-900">{physio.communityOffer.title}:</strong>{" "}
                          <span className="text-amber-800">{physio.communityOffer.description}</span>
                        </span>
                      </div>
                      <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full shrink-0">
                        {physio.communityOffer.badge}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Curated Therapy Packages */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <span>📦</span>
                  <span>Specialized Rehabilitation Packages</span>
                </h3>
                <p className="text-xs text-gray-500">Multi-session structured recovery protocols with bundled community pricing.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[
                {
                  title: "Back & Spine Relief Protocol",
                  sessions: "5 Sessions",
                  originalPrice: 3500,
                  offerPrice: 2499,
                  badge: "Most Popular",
                  badgeColor: "bg-emerald-100 text-emerald-800",
                  features: ["IFT Electrotherapy & Heat", "Lumbar Core Activation", "Spinal Decompression Traction", "Ergonomic Home Calibration"],
                  mode: "In-Clinic / Home Visit"
                },
                {
                  title: "Active Sports Recovery Pass",
                  sessions: "3 Sessions",
                  originalPrice: 2400,
                  offerPrice: 1699,
                  badge: "Athletes & Gym",
                  badgeColor: "bg-indigo-100 text-indigo-800",
                  features: ["Dry Needling & Cupping", "Deep Tissue Trigger Release", "Joint Mobilization & Floss Band", "Kinesio Athletic Taping"],
                  mode: "Clubhouse Sports Pavilion"
                },
                {
                  title: "Senior Balance & Fall Prevention",
                  sessions: "10 Doorstep Visits",
                  originalPrice: 7500,
                  offerPrice: 5499,
                  badge: "Elder Care",
                  badgeColor: "bg-amber-100 text-amber-800",
                  features: ["Proprioception & Gait Training", "Gentle Joint Mobilization", "Safe Sit-to-Stand Drills", "Home Fall-Hazard Audit"],
                  mode: "Doorstep Flat Visit"
                },
                {
                  title: "Post-Surgery Orthopedic Rehab",
                  sessions: "12 Sessions",
                  originalPrice: 9600,
                  offerPrice: 6999,
                  badge: "Post-Operative",
                  badgeColor: "bg-purple-100 text-purple-800",
                  features: ["Knee / Hip Replacement Care", "Range of Motion Expansion", "Scar Tissue Mobilization", "Weekly Surgeon Progress Report"],
                  mode: "In-Clinic + Home Care"
                },
                {
                  title: "WFH Tech-Neck & Posture Reset",
                  sessions: "Workspace Audit + 2 Sessions",
                  originalPrice: 1800,
                  offerPrice: 1199,
                  badge: "Remote Workers",
                  badgeColor: "bg-blue-100 text-blue-800",
                  features: ["1-on-1 Ergonomic Desk Calibration", "Cervical Spine Traction", "Postural Muscle Re-education", "Daily 5-Min Desk Stretch Guide"],
                  mode: "In-Clinic / Home Visit"
                },
                {
                  title: "Pediatric Ortho & Posture Check",
                  sessions: "3 Sessions",
                  originalPrice: 2100,
                  offerPrice: 1499,
                  badge: "Children & Teens",
                  badgeColor: "bg-pink-100 text-pink-800",
                  features: ["Schoolbag Strain & Scoliosis Screen", "Flat Foot & Gait Assessment", "Core Posture Conditioning", "Kids Sports Mobility Drills"],
                  mode: "Clubhouse Sports Pavilion"
                },
              ].map((pkg, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 rounded-3xl p-5 flex flex-col justify-between hover:shadow-md transition space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${pkg.badgeColor}`}>
                        {pkg.badge}
                      </span>
                      <span className="text-[11px] font-bold text-gray-500">{pkg.sessions}</span>
                    </div>

                    <div>
                      <h4 className="font-black text-sm text-gray-900">{pkg.title}</h4>
                      <p className="text-[11px] text-teal-700 font-semibold mt-0.5">📍 {pkg.mode}</p>
                    </div>

                    <ul className="space-y-1.5 text-xs text-gray-600">
                      {pkg.features.map((f, fi) => (
                        <li key={fi} className="flex items-center gap-1.5">
                          <span className="text-teal-600 font-bold">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs text-gray-400 line-through">₹{pkg.originalPrice}</span>
                        <span className="text-lg font-black text-teal-900">₹{pkg.offerPrice}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600">Save ₹{pkg.originalPrice - pkg.offerPrice}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const matchedPhysio = SEED_DOCTORS.find(d => d.category === "PHYSIOTHERAPIST");
                        setPhysioBookingModal({
                          open: true,
                          physio: matchedPhysio || null,
                          packageTitle: pkg.title,
                          preselectedMode: pkg.mode.includes("Flat") ? "HOME" : "CLINIC"
                        });
                      }}
                      className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Book Package
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clubhouse Rehab & Group Classes Schedule */}
          <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <span>🗓️</span>
                <span>Weekly Clubhouse Rehab & Mobility Group Sessions</span>
              </h3>
              <p className="text-xs text-gray-500">Free instructor-led corrective exercise workshops open to all community residents.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {[
                {
                  title: "Senior Morning Mobility & Joint Care",
                  schedule: "Mon, Wed, Fri · 7:30 AM - 8:15 AM",
                  venue: "Clubhouse Open Deck",
                  instructor: "Dr. Kavitha Rao (Geriatric Rehab)",
                  focus: "Gentle arthritis mobility, balance drills & fall prevention.",
                  attendees: "18 residents enrolled"
                },
                {
                  title: "Desk-Worker Spine & Core Ergonomics",
                  schedule: "Every Saturday · 11:00 AM - 12:00 PM",
                  venue: "Clubhouse Yoga Studio (Room 2)",
                  instructor: "Dr. Varun Nair (Sports & Spine)",
                  focus: "Neck decompression, thoracic mobility, core endurance for WFH.",
                  attendees: "24 residents enrolled"
                },
                {
                  title: "Sports Injury Taping & Knee Conditioning",
                  schedule: "Every Sunday · 4:00 PM - 5:00 PM",
                  venue: "Sports Pavilion Rehab Bay",
                  instructor: "Dr. Ananya Sen (Ortho Rehab)",
                  focus: "ACL prevention, knee stability, ankle strapping & recovery.",
                  attendees: "14 residents enrolled"
                },
              ].map((cls, ci) => (
                <div key={ci} className="bg-teal-50/50 border border-teal-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{cls.title}</h4>
                    <p className="text-xs font-semibold text-teal-800 mt-1">🕐 {cls.schedule}</p>
                    <p className="text-xs text-gray-600 mt-0.5">📍 {cls.venue}</p>
                    <p className="text-xs text-gray-500 mt-2">{cls.focus}</p>
                  </div>

                  <div className="pt-2 border-t border-teal-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-gray-500 font-semibold">{cls.attendees}</span>
                    <button
                      type="button"
                      onClick={() => alert(`RSVP Confirmed for "${cls.title}"!\n\nInstructor: ${cls.instructor}\nVenue: ${cls.venue}\n\nSession pass saved to your Health Vault.`)}
                      className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      RSVP Free Slot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Modalities & Equipment Guide */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3">
            <div>
              <h4 className="font-bold text-sm text-slate-800">Available Modalities & Portable Equipment</h4>
              <p className="text-xs text-slate-500">Hospital-grade electrotherapy & recovery modalities available both in-clinic and carried during home visits.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-center text-xs">
              <div className="bg-white p-3 rounded-2xl border border-slate-200">
                <div className="text-xl mb-1">⚡</div>
                <div className="font-bold text-slate-900">IFT Therapy</div>
                <div className="text-[10px] text-slate-500">Deep muscle spasm relief</div>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200">
                <div className="text-xl mb-1">🌊</div>
                <div className="font-bold text-slate-900">Ultrasound</div>
                <div className="text-[10px] text-slate-500">Ligament & tendon repair</div>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200">
                <div className="text-xl mb-1">🪡</div>
                <div className="font-bold text-slate-900">Dry Needling</div>
                <div className="text-[10px] text-slate-500">Myofascial trigger points</div>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200">
                <div className="text-xl mb-1">🎯</div>
                <div className="font-bold text-slate-900">TENS Unit</div>
                <div className="text-[10px] text-slate-500">Nerve pain modulation</div>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200">
                <div className="text-xl mb-1">📐</div>
                <div className="font-bold text-slate-900">Spine Traction</div>
                <div className="text-[10px] text-slate-500">Disc bulge decompression</div>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200">
                <div className="text-xl mb-1">🏋️</div>
                <div className="font-bold text-slate-900">Mobility Gym</div>
                <div className="text-[10px] text-slate-500">Resistance band conditioning</div>
              </div>
            </div>
          </div>

          {/* Post-Rehab to Fitness Bridge */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="text-3xl p-3 bg-white rounded-2xl shadow-2xs border border-amber-200">🏋️</div>
              <div>
                <h4 className="font-bold text-sm text-amber-950">Completed Rehab & Looking to Build Strength?</h4>
                <p className="text-xs text-amber-800">
                  Transition smoothly from physical therapy to structured progressive fitness with certified Clubhouse Gym coaches.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("gym-trainers")}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition whitespace-nowrap cursor-pointer"
            >
              Explore Gym Trainers →
            </button>
          </div>
        </div>
      )}

      {/* ── Mana Clubhouse Gymnasium & Personal Fitness Trainers ────────────── */}
      {activeTab === "gym-trainers" && (
        <div className="space-y-6">
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-amber-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
            <div className="max-w-2xl space-y-2 relative z-10">
              <div className="flex items-center gap-2">
                <span className="text-3xl">🏋️</span>
                <span className="bg-amber-400 text-amber-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full">
                  Clubhouse Gymnasium · Tower A Level 1
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">Gymnasium & Certified Personal Fitness Coaches</h2>
              <p className="text-amber-100 text-xs sm:text-sm leading-relaxed">
                Work 1-on-1 with certified trainers (ACE, ACSM, K11) stationed right at the Mana Clubhouse Gymnasium or book personalized doorstep fitness sessions. From fat loss & strength hypertrophy to senior mobility and post-rehab conditioning.
              </p>
            </div>

            {/* Quick Feature Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-amber-800/60 relative z-10 text-xs">
              <div className="bg-stone-900/60 backdrop-blur-xs rounded-xl p-2.5 border border-amber-500/30">
                <div className="text-base mb-1">🏢</div>
                <div className="font-bold text-white">Clubhouse Gymnasium</div>
                <div className="text-[10px] text-amber-200">Open 6:00 AM - 10:00 PM Daily</div>
              </div>
              <div className="bg-stone-900/60 backdrop-blur-xs rounded-xl p-2.5 border border-amber-500/30">
                <div className="text-base mb-1">🏅</div>
                <div className="font-bold text-white">Certified Personal Trainers</div>
                <div className="text-[10px] text-amber-200">ACE, ACSM & CSCS Verified</div>
              </div>
              <div className="bg-stone-900/60 backdrop-blur-xs rounded-xl p-2.5 border border-amber-500/30">
                <div className="text-base mb-1">📊</div>
                <div className="font-bold text-white">Free InBody Analysis</div>
                <div className="text-[10px] text-amber-200">Complimentary 1st PT assessment</div>
              </div>
              <div className="bg-stone-900/60 backdrop-blur-xs rounded-xl p-2.5 border border-amber-500/30">
                <div className="text-base mb-1">🏡</div>
                <div className="font-bold text-white">Flexible Venues</div>
                <div className="text-[10px] text-amber-200">Gym Floor, Turf or Doorstep</div>
              </div>
            </div>
          </div>

          {/* Training Focus / Category Filters */}
          <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-xs font-bold text-gray-500 shrink-0 ml-1">Training Focus:</span>
            {[
              { id: "ALL", label: "🌐 All Coaches" },
              { id: "STRENGTH", label: "💪 Strength & Hypertrophy" },
              { id: "FAT_LOSS", label: "🔥 Fat Loss & Conditioning" },
              { id: "HIIT", label: "⚡ Functional HIIT & Core" },
              { id: "SENIOR", label: "👵 Senior Functional Strength" },
              { id: "WOMEN_FITNESS", label: "👩 Women's & Postnatal" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setTrainerCategoryFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  trainerCategoryFilter === tab.id
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Interactive Workout Goal & Split Matcher */}
          <div className="bg-gradient-to-br from-amber-50 via-orange-50/40 to-white rounded-3xl border border-amber-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  <h3 className="text-sm sm:text-base font-black text-gray-900">Personalized Workout Split & Coach Matcher</h3>
                  <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">Interactive Tool</span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  Select your primary fitness objective and weekly routine preference to get a scientifically tailored split and recommended community coach.
                </p>
              </div>
            </div>

            {/* Selector Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Step 1: Goal */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">1. Select Primary Objective:</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    { id: "MUSCLE_GAIN", label: "💪 Hypertrophy & Muscle Gain", desc: "Progressive overload, compound lifts" },
                    { id: "FAT_LOSS", label: "🔥 Fat Loss & Body Toning", desc: "Calorie burn, metabolic conditioning" },
                    { id: "ENDURANCE", label: "⚡ Functional HIIT & Core", desc: "Athletic agility, posture & stamina" },
                    { id: "SENIOR_FITNESS", label: "👵 Senior Functional Strength", desc: "Joint health, balance, gentle weights" },
                    { id: "POST_REHAB", label: "🩹 Post-Rehab Conditioning", desc: "Safely rebuilding after physical therapy" },
                  ].map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedFitnessGoal(g.id as any)}
                      className={`text-left p-2.5 rounded-xl border text-xs transition cursor-pointer ${
                        selectedFitnessGoal === g.id
                          ? "bg-amber-100/90 border-amber-400 text-amber-950 font-bold shadow-2xs"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-bold">{g.label}</div>
                      <div className="text-[10px] text-gray-500 font-normal">{g.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Experience Level */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">2. Training Experience Level:</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    { id: "BEGINNER", label: "🌱 Beginner (< 6 Months)", desc: "Focus on form, movement mechanics & safe habits" },
                    { id: "INTERMEDIATE", label: "🏋️ Intermediate (6mo - 2yrs)", desc: "Breaking plateaus, periodization & heavier loads" },
                    { id: "ADVANCED", label: "🏆 Advanced (2+ Years)", desc: "Powerlifting, athletic conditioning & peak output" },
                  ].map(lvl => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setSelectedExperienceLevel(lvl.id as any)}
                      className={`text-left p-2.5 rounded-xl border text-xs transition cursor-pointer ${
                        selectedExperienceLevel === lvl.id
                          ? "bg-amber-100/90 border-amber-400 text-amber-950 font-bold shadow-2xs"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-bold">{lvl.label}</div>
                      <div className="text-[10px] text-gray-500 font-normal">{lvl.desc}</div>
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">3. Preferred Workout Window:</label>
                  <div className="grid grid-cols-3 gap-1 text-[11px]">
                    {[
                      { id: "EARLY_MORNING", label: "🌅 6 - 9 AM" },
                      { id: "MID_MORNING", label: "☀️ 10 - 2 PM" },
                      { id: "EVENING", label: "🌙 5 - 9 PM" },
                    ].map(slot => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedTimeSlotPref(slot.id as any)}
                        className={`p-2 rounded-lg border text-center transition cursor-pointer font-bold ${
                          selectedTimeSlotPref === slot.id
                            ? "bg-amber-600 border-amber-600 text-white"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 3: Match Result */}
              <div className="bg-white rounded-2xl border border-amber-200 p-4 flex flex-col justify-between space-y-3 shadow-2xs">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    Recommended Routine Split
                  </span>
                  <h4 className="font-black text-sm text-gray-900 mt-2">
                    {selectedFitnessGoal === "MUSCLE_GAIN" && "4-Day Upper / Lower Hypertrophy Split"}
                    {selectedFitnessGoal === "FAT_LOSS" && "3-Day Full-Body Resistance + 2x Zone-2 Cardio"}
                    {selectedFitnessGoal === "ENDURANCE" && "4-Day Athletic Functional Strength & HIIT Split"}
                    {selectedFitnessGoal === "SENIOR_FITNESS" && "3-Day Gentle Strength, Balance & Mobility Protocol"}
                    {selectedFitnessGoal === "POST_REHAB" && "3-Day Post-Rehab Stability & Isometric Progression"}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {selectedFitnessGoal === "MUSCLE_GAIN" && "Focus on compound barbell lifts, progressive overload, and adequate protein intake (1.6g/kg)."}
                    {selectedFitnessGoal === "FAT_LOSS" && "High-volume circuit weights paired with post-workout 15-min incline treadmill walk in the clubhouse gym."}
                    {selectedFitnessGoal === "ENDURANCE" && "Kettlebell flows, TRX core suspension, battle ropes, and functional rotational movement."}
                    {selectedFitnessGoal === "SENIOR_FITNESS" && "Low-impact seated & standing dumbbell presses, glute bridges, and balance board stability."}
                    {selectedFitnessGoal === "POST_REHAB" && "Controlled closed-chain exercises, rotator cuff / hip stabilizer activation under coach supervision."}
                  </p>

                  <div className="mt-3 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs">
                    <p className="font-bold text-amber-950 flex items-center gap-1.5">
                      <span>👤</span>
                      <span>Best Matched Coach:</span>
                      <span className="underline decoration-amber-500">
                        {selectedFitnessGoal === "MUSCLE_GAIN" || selectedFitnessGoal === "POST_REHAB" ? "Coach Rajesh Sharma (Head Strength Coach)" :
                         selectedFitnessGoal === "FAT_LOSS" || selectedFitnessGoal === "ENDURANCE" ? "Coach Sneha Kapoor (Functional & HIIT Specialist)" :
                         "Coach Marcus D'Souza (Senior Mobility & Agility)"}
                      </span>
                    </p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Stationed at Clubhouse Gym · Includes complimentary InBody Body-Fat Assessment
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const matchedTrainer = SEED_DOCTORS.find(d =>
                      d.category === "FITNESS_TRAINER" &&
                      (selectedFitnessGoal === "MUSCLE_GAIN" || selectedFitnessGoal === "POST_REHAB" ? d.id === "trainer-1" :
                       selectedFitnessGoal === "FAT_LOSS" || selectedFitnessGoal === "ENDURANCE" ? d.id === "trainer-2" :
                       d.id === "trainer-3")
                    ) || SEED_DOCTORS.find(d => d.category === "FITNESS_TRAINER");
                    
                    setTrainerBookingModal({
                      open: true,
                      trainer: matchedTrainer || null,
                      packageTitle: `Initial Assessment & ${selectedFitnessGoal.replace(/_/g, " ")} 1-on-1 Trial`,
                      preselectedVenue: "CLUBHOUSE_GYM"
                    });
                  }}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Book Trial with Matched Coach</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>

          {/* Certified Community Gym Trainers List */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <span>🏅</span>
                  <span>Certified Clubhouse Trainers & Fitness Coaches</span>
                </h3>
                <p className="text-xs text-gray-500">Vetted personal trainers with active certifications, background checks, and community reviews.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SEED_DOCTORS.filter(d => {
                if (d.category !== "FITNESS_TRAINER") return false;
                if (trainerCategoryFilter === "ALL") return true;
                if (trainerCategoryFilter === "STRENGTH") return d.specialty.toLowerCase().includes("strength") || d.qualifications.some(q => q.includes("CSCS") || q.includes("ACE"));
                if (trainerCategoryFilter === "FAT_LOSS") return d.specialty.toLowerCase().includes("hiit") || d.specialty.toLowerCase().includes("strength");
                if (trainerCategoryFilter === "HIIT") return d.specialty.toLowerCase().includes("hiit") || d.specialty.toLowerCase().includes("athletic");
                if (trainerCategoryFilter === "SENIOR") return d.specialty.toLowerCase().includes("senior") || d.specialty.toLowerCase().includes("mobility");
                if (trainerCategoryFilter === "WOMEN_FITNESS") return d.specialty.toLowerCase().includes("postural") || d.qualifications.some(q => q.toLowerCase().includes("natal"));
                return true;
              }).map(trainer => (
                <div key={trainer.id} className="bg-white rounded-3xl border border-gray-200 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    {/* Header: Photo, Name, Verified */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-400 text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
                        🏋️
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-black text-sm text-gray-900 truncate">{trainer.name}</h4>
                          {trainer.verifiedBadge && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md">
                              ✓ Mana Coach
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-amber-800">{trainer.specialty}</p>
                        <p className="text-[11px] text-gray-500">{trainer.clinicAddress}</p>
                      </div>
                    </div>

                    {/* Qualifications & Accreditations */}
                    <div className="flex flex-wrap gap-1">
                      {trainer.qualifications.map((q, qi) => (
                        <span key={qi} className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-semibold">
                          {q}
                        </span>
                      ))}
                    </div>

                    {/* Stats strip */}
                    <div className="bg-gray-50 rounded-xl p-2.5 flex items-center justify-between text-xs text-gray-700">
                      <div>
                        <span className="font-black text-gray-900">⭐ {trainer.rating}</span>
                        <span className="text-[10px] text-gray-400 ml-1">({trainer.reviewCount} reviews)</span>
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {trainer.experienceYears} Years Exp
                      </div>
                      <div className="font-bold text-amber-900">
                        ₹{trainer.consultationFee}<span className="text-[10px] font-normal text-gray-500">/session</span>
                      </div>
                    </div>

                    {/* Next Slot */}
                    <div className="text-xs flex items-center justify-between text-gray-600">
                      <span>Next Slot:</span>
                      <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                        {trainer.nextAvailableSlot}
                      </span>
                    </div>

                    {/* Community Offer */}
                    {trainer.communityOffer && (
                      <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-2.5 flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🏷️</span>
                          <span>
                            <strong className="font-bold text-amber-900">{trainer.communityOffer.title}:</strong>{" "}
                            <span className="text-amber-800">{trainer.communityOffer.description}</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-gray-100 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTrainerVenue("CLUBHOUSE_GYM");
                        setTrainerBookingModal({
                          open: true,
                          trainer,
                          preselectedVenue: "CLUBHOUSE_GYM"
                        });
                      }}
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-xl transition shadow-xs cursor-pointer text-center"
                    >
                      Book Gym PT
                    </button>
                    {trainer.homeVisitAvailable && (
                      <button
                        type="button"
                        onClick={() => {
                          setTrainerVenue("HOME_LAWN");
                          setTrainerBookingModal({
                            open: true,
                            trainer,
                            preselectedVenue: "HOME_LAWN"
                          });
                        }}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
                      >
                        Home PT
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Curated Personal Training Packages */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <span>📦</span>
                  <span>Curated Personal Training Packages</span>
                </h3>
                <p className="text-xs text-gray-500">Discounted community multi-session training programs with dedicated coach support.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[
                {
                  title: "12-Week Body Transformation",
                  sessions: "36 1-on-1 Sessions",
                  originalPrice: 18000,
                  offerPrice: 14499,
                  badge: "Best Value",
                  badgeColor: "bg-amber-100 text-amber-900",
                  features: ["3x / week coached sessions", "Weekly InBody body-fat check", "Custom calorie & macro targets", "Progressive overload tracking"],
                  venue: "Clubhouse Gymnasium"
                },
                {
                  title: "10-Session Monthly PT Pass",
                  sessions: "10 Sessions",
                  originalPrice: 5500,
                  offerPrice: 4299,
                  badge: "Most Flexible",
                  badgeColor: "bg-indigo-100 text-indigo-900",
                  features: ["Form & posture correction", "Core activation drills", "Access to training app log", "Valid across 45 days"],
                  venue: "Gym Floor / Doorstep"
                },
                {
                  title: "Senior Functional Strength Pass",
                  sessions: "12 Sessions",
                  originalPrice: 6600,
                  offerPrice: 4999,
                  badge: "Age 55+ Care",
                  badgeColor: "bg-emerald-100 text-emerald-900",
                  features: ["Gentle joint-friendly resistance", "Sit-to-stand balance drills", "Blood pressure monitored", "In-home or quiet gym hours"],
                  venue: "Clubhouse Gym or Home"
                },
                {
                  title: "Buddy / Couples Training",
                  sessions: "12 Shared Sessions",
                  originalPrice: 10000,
                  offerPrice: 6999,
                  badge: "Partner Pass",
                  badgeColor: "bg-purple-100 text-purple-900",
                  features: ["Train together with spouse/friend", "Fun partner workout challenges", "Shared coach guidance", "Save 30% per person"],
                  venue: "Clubhouse Gymnasium"
                },
              ].map((pkg, pi) => (
                <div key={pi} className="bg-white rounded-3xl border border-gray-200 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${pkg.badgeColor}`}>
                        {pkg.badge}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-500">📍 {pkg.venue}</span>
                    </div>

                    <div>
                      <h4 className="font-black text-sm text-gray-900">{pkg.title}</h4>
                      <p className="text-xs font-bold text-amber-800">{pkg.sessions}</p>
                    </div>

                    <ul className="space-y-1.5 text-xs text-gray-600">
                      {pkg.features.map((f, fi) => (
                        <li key={fi} className="flex items-center gap-1.5">
                          <span className="text-amber-600 font-bold">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 line-through">₹{pkg.originalPrice}</span>
                      <div className="text-base font-black text-gray-900">₹{pkg.offerPrice}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const matchedTrainer = SEED_DOCTORS.find(d => d.category === "FITNESS_TRAINER");
                        setTrainerBookingModal({
                          open: true,
                          trainer: matchedTrainer || null,
                          packageTitle: pkg.title,
                          preselectedVenue: pkg.venue.includes("Doorstep") ? "HOME_LAWN" : "CLUBHOUSE_GYM"
                        });
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Book Package
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clubhouse Gymnasium Amenities & Peak Hours Guide */}
          <div className="bg-stone-900 text-stone-100 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
              <div>
                <h4 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                  <span>🏢</span>
                  <span>Clubhouse Gymnasium Equipment & Peak Hours Guide</span>
                </h4>
                <p className="text-xs text-stone-400 mt-0.5">
                  Located at Tower A Level 1 · Air-conditioned facility maintained by Mana Facility Management.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-400">Gym Currently Open</span>
              </div>
            </div>

            {/* Equipments list */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-center text-xs">
              <div className="bg-stone-800/80 p-3 rounded-2xl border border-stone-700">
                <div className="text-xl mb-1">🏋️‍♂️</div>
                <div className="font-bold text-white">Power Racks</div>
                <div className="text-[10px] text-stone-400">2x Olympic Squat Cages</div>
              </div>
              <div className="bg-stone-800/80 p-3 rounded-2xl border border-stone-700">
                <div className="text-xl mb-1">⚡</div>
                <div className="font-bold text-white">Free Weights</div>
                <div className="text-[10px] text-stone-400">Dumbbells 2.5kg - 40kg</div>
              </div>
              <div className="bg-stone-800/80 p-3 rounded-2xl border border-stone-700">
                <div className="text-xl mb-1">🏃</div>
                <div className="font-bold text-white">Cardio Zone</div>
                <div className="text-[10px] text-stone-400">6x Incline Treadmills</div>
              </div>
              <div className="bg-stone-800/80 p-3 rounded-2xl border border-stone-700">
                <div className="text-xl mb-1">🚣</div>
                <div className="font-bold text-white">Rowers & Bikes</div>
                <div className="text-[10px] text-stone-400">Concept2 Air Rowers</div>
              </div>
              <div className="bg-stone-800/80 p-3 rounded-2xl border border-stone-700">
                <div className="text-xl mb-1">🎯</div>
                <div className="font-bold text-white">Cable Cross</div>
                <div className="text-[10px] text-stone-400">Dual 8-stack Functional</div>
              </div>
              <div className="bg-stone-800/80 p-3 rounded-2xl border border-stone-700">
                <div className="text-xl mb-1">🧘</div>
                <div className="font-bold text-white">Turf & Stretch</div>
                <div className="text-[10px] text-stone-400">Kettlebells & Foam Rollers</div>
              </div>
            </div>

            {/* Hours Strip */}
            <div className="bg-stone-800/60 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-300 gap-2 border border-stone-700">
              <div className="flex items-center gap-2">
                <span className="text-base">🕐</span>
                <span><strong>Quiet Hours (Recommended for Seniors & Beginners):</strong> 11:00 AM - 4:00 PM</span>
              </div>
              <div className="flex items-center gap-2 text-stone-400">
                <span>⚠️ <strong>Peak Hours:</strong> 6:30 - 8:30 AM & 6:30 - 8:30 PM</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Physiotherapy Dedicated Booking Modal */}
      {physioBookingModal.open && physioBookingModal.physio && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {physioSuccessMsg ? (
              <div className="text-center space-y-3 py-6">
                <div className="text-5xl">✅</div>
                <h3 className="text-xl font-black text-teal-900">Physiotherapy Session Confirmed!</h3>
                <p className="text-gray-600 text-xs sm:text-sm">
                  {physioSuccessMsg}
                </p>
                <div className="bg-teal-50 border border-teal-200 text-teal-800 text-xs p-3.5 rounded-2xl space-y-1 text-left">
                  <p><strong>Appointment ID:</strong> PHY-{Date.now().toString().slice(-6)}</p>
                  <p><strong>Specialist:</strong> {physioBookingModal.physio.name}</p>
                  <p><strong>Visit Mode:</strong> {physioVisitMode === "HOME" ? `🏡 Home Visit (${physioFlatNo})` : "🏢 Clubhouse Sports Pavilion (Ground Floor)"}</p>
                  <p><strong>Scheduled Slot:</strong> {physioSlot}</p>
                  <p className="text-[11px] text-teal-600 mt-1">✓ An assessment entry and invoice have been securely synced to your Private Health Vault.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPhysioBookingModal({ open: false, physio: null });
                    setPhysioSuccessMsg(null);
                  }}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs mt-2 cursor-pointer transition shadow-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Physiotherapy Booking</span>
                    <h3 className="font-black text-lg text-gray-900">{physioBookingModal.physio.name}</h3>
                    <p className="text-xs text-gray-500">{physioBookingModal.physio.specialty}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhysioBookingModal({ open: false, physio: null })}
                    className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {physioBookingModal.packageTitle && (
                  <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 p-2.5 rounded-xl text-xs flex items-center gap-2">
                    <span>📦</span>
                    <span>Selected Package: <strong>{physioBookingModal.packageTitle}</strong></span>
                  </div>
                )}

                <div className="space-y-3.5 text-xs">
                  {/* Patient Selection */}
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Patient:</label>
                    <select
                      value={physioPatientId}
                      onChange={(e) => setPhysioPatientId(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-teal-500"
                    >
                      {familyList.map(f => (
                        <option key={f.id} value={f.id}>
                          👤 {f.fullName} ({f.relationship}, {f.age}y)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Visit Mode: In-Clinic vs Home Visit */}
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Consultation Location:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPhysioVisitMode("CLINIC")}
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                          physioVisitMode === "CLINIC"
                            ? "bg-teal-700 text-white border-teal-700 font-bold shadow-xs"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <div className="text-sm mb-0.5">🏢</div>
                        <div className="text-xs font-bold">Clubhouse Pavilion</div>
                        <div className={`text-[10px] ${physioVisitMode === "CLINIC" ? "text-teal-100" : "text-gray-400"}`}>Sports Rehab Bay</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPhysioVisitMode("HOME")}
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                          physioVisitMode === "HOME"
                            ? "bg-teal-700 text-white border-teal-700 font-bold shadow-xs"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <div className="text-sm mb-0.5">🏡</div>
                        <div className="text-xs font-bold">Doorstep Home Visit</div>
                        <div className={`text-[10px] ${physioVisitMode === "HOME" ? "text-teal-100" : "text-gray-400"}`}>Physio visits your flat</div>
                      </button>
                    </div>
                  </div>

                  {/* Flat No if Home Visit */}
                  {physioVisitMode === "HOME" && (
                    <div className="animate-in fade-in duration-200">
                      <label className="font-bold text-gray-700 block mb-1">Apartment / Flat Number:</label>
                      <input
                        type="text"
                        value={physioFlatNo}
                        onChange={(e) => setPhysioFlatNo(e.target.value)}
                        placeholder="e.g. Tower B - 604"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-teal-500"
                      />
                      <span className="text-[10px] text-gray-400 mt-0.5 block">Physiotherapist will carry portable electrotherapy & ultrasound kit.</span>
                    </div>
                  )}

                  {/* Date & Time Slot */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Preferred Slot:</label>
                      <select
                        value={physioSlot}
                        onChange={(e) => setPhysioSlot(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-teal-500"
                      >
                        <option value="Today, 04:30 PM">Today, 04:30 PM (Evening)</option>
                        <option value="Today, 06:00 PM">Today, 06:00 PM (Evening)</option>
                        <option value="Tomorrow, 09:30 AM">Tomorrow, 09:30 AM (Morning)</option>
                        <option value="Tomorrow, 11:30 AM">Tomorrow, 11:30 AM (Morning)</option>
                        <option value="Tomorrow, 05:00 PM">Tomorrow, 05:00 PM (Evening)</option>
                        <option value="Day After Tomorrow, 10:00 AM">Day After Tomorrow, 10:00 AM</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Chief Issue / Condition:</label>
                      <select
                        value={physioCondition}
                        onChange={(e) => setPhysioCondition(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-teal-500"
                      >
                        <option value="Back & Neck Pain">Back & Neck Pain</option>
                        <option value="Sports Injury / Sprain">Sports Injury / Sprain</option>
                        <option value="Knee / Joint Mobility">Knee / Joint Mobility</option>
                        <option value="Post-Surgery Rehab">Post-Surgery Rehab</option>
                        <option value="Shoulder / Frozen Shoulder">Shoulder / Frozen Shoulder</option>
                        <option value="General Ergonomics Assessment">General Ergonomics Assessment</option>
                      </select>
                    </div>
                  </div>

                  {/* Pricing summary */}
                  <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl p-3 space-y-1 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>Standard Session Fee:</span>
                      <span className="line-through text-gray-400">₹{Math.round(physioBookingModal.physio.consultationFee * 1.18)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Mana Resident Discount (15%):</span>
                      <span>- ₹{Math.round(physioBookingModal.physio.consultationFee * 0.18)}</span>
                    </div>
                    <div className="flex justify-between text-gray-900 font-black text-sm pt-1 border-t border-teal-200">
                      <span>Amount Payable:</span>
                      <span className="text-teal-900">₹{physioBookingModal.physio.consultationFee}</span>
                    </div>
                    <p className="text-[10px] text-teal-700 mt-1">✓ Cashless pass eligible · Pay after session via UPI or Cash</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPhysioBookingModal({ open: false, physio: null })}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const patient = familyList.find(f => f.id === physioPatientId);
                      setPhysioSuccessMsg(
                        `Your appointment with ${physioBookingModal.physio?.name} has been booked for ${patient?.fullName || "Resident"} on ${physioSlot}.`
                      );
                    }}
                    className="flex-2 bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-xs cursor-pointer"
                  >
                    Confirm Booking →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Gym Personal Trainer Booking Modal */}
      {trainerBookingModal.open && trainerBookingModal.trainer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {trainerSuccessMsg ? (
              <div className="text-center space-y-3 py-6">
                <div className="text-5xl">💪</div>
                <h3 className="text-xl font-black text-amber-950">Personal Training Session Confirmed!</h3>
                <p className="text-gray-600 text-xs sm:text-sm">
                  {trainerSuccessMsg}
                </p>
                <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3.5 rounded-2xl space-y-1 text-left">
                  <p><strong>Session ID:</strong> PT-{Date.now().toString().slice(-6)}</p>
                  <p><strong>Coach:</strong> {trainerBookingModal.trainer.name}</p>
                  <p><strong>Training Venue:</strong> {trainerVenue === "HOME_LAWN" ? `🏡 Home / Lawn (${trainerFlatNo})` : "🏢 Clubhouse Gymnasium (Tower A Level 1)"}</p>
                  <p><strong>Scheduled Slot:</strong> {trainerSlot}</p>
                  <p><strong>Focus Goal:</strong> {trainerGoalNote}</p>
                  <p className="text-[11px] text-amber-700 mt-1">✓ Your coach has been notified and initial InBody body composition scan is reserved.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTrainerBookingModal({ open: false, trainer: null });
                    setTrainerSuccessMsg(null);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs mt-2 cursor-pointer transition shadow-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                      1-on-1 Personal Training Session
                    </span>
                    <h3 className="text-base font-black text-gray-900 mt-1">
                      Book Session with {trainerBookingModal.trainer.name}
                    </h3>
                    <p className="text-xs text-gray-500">{trainerBookingModal.trainer.specialty}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTrainerBookingModal({ open: false, trainer: null })}
                    className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {trainerBookingModal.packageTitle && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 font-semibold flex items-center gap-2">
                    <span>📦</span>
                    <span>Package: {trainerBookingModal.packageTitle}</span>
                  </div>
                )}

                <div className="space-y-3 text-xs">
                  {/* Select Member */}
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Participant (Resident / Family Member):</label>
                    <select
                      value={trainerPatientId}
                      onChange={(e) => setTrainerPatientId(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-amber-500"
                    >
                      {familyList.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.fullName} ({m.relationship}) - {m.age}y
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Training Venue */}
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Training Location:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTrainerVenue("CLUBHOUSE_GYM")}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                          trainerVenue === "CLUBHOUSE_GYM"
                            ? "bg-amber-600 border-amber-600 text-white font-bold shadow-xs"
                            : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <div className="text-sm mb-0.5">🏢</div>
                        <div className="text-xs font-bold">Clubhouse Gym</div>
                        <div className={`text-[10px] ${trainerVenue === "CLUBHOUSE_GYM" ? "text-amber-100" : "text-gray-400"}`}>Level 1 (Tower A)</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTrainerVenue("HOME_LAWN")}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                          trainerVenue === "HOME_LAWN"
                            ? "bg-amber-600 border-amber-600 text-white font-bold shadow-xs"
                            : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <div className="text-sm mb-0.5">🏡</div>
                        <div className="text-xs font-bold">Doorstep / Lawn</div>
                        <div className={`text-[10px] ${trainerVenue === "HOME_LAWN" ? "text-amber-100" : "text-gray-400"}`}>Coach visits flat/turf</div>
                      </button>
                    </div>
                  </div>

                  {/* Flat No if Home Visit */}
                  {trainerVenue === "HOME_LAWN" && (
                    <div className="animate-in fade-in duration-200">
                      <label className="font-bold text-gray-700 block mb-1">Apartment / Flat Number:</label>
                      <input
                        type="text"
                        value={trainerFlatNo}
                        onChange={(e) => setTrainerFlatNo(e.target.value)}
                        placeholder="e.g. Tower B - 604"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-amber-500"
                      />
                      <span className="text-[10px] text-gray-400 mt-0.5 block">Trainer will bring resistance bands, mats & agility equipment.</span>
                    </div>
                  )}

                  {/* Slot & Goal */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Preferred Time Slot:</label>
                      <select
                        value={trainerSlot}
                        onChange={(e) => setTrainerSlot(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-amber-500"
                      >
                        <option value="Tomorrow, 06:30 AM">Tomorrow, 06:30 AM (Morning)</option>
                        <option value="Tomorrow, 08:00 AM">Tomorrow, 08:00 AM (Morning)</option>
                        <option value="Tomorrow, 11:00 AM">Tomorrow, 11:00 AM (Quiet Hours)</option>
                        <option value="Tomorrow, 05:00 PM">Tomorrow, 05:00 PM (Evening)</option>
                        <option value="Tomorrow, 06:30 PM">Tomorrow, 06:30 PM (Evening)</option>
                        <option value="Tomorrow, 07:30 PM">Tomorrow, 07:30 PM (Evening)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Primary Fitness Goal:</label>
                      <select
                        value={trainerGoalNote}
                        onChange={(e) => setTrainerGoalNote(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-amber-500"
                      >
                        <option value="Build Strength & Improve Form">Strength & Form Check</option>
                        <option value="Weight & Fat Loss Routine">Weight & Fat Loss</option>
                        <option value="Core & Posture Correction">Core & Posture</option>
                        <option value="Senior Mobility & Joint Stability">Senior Mobility & Balance</option>
                        <option value="Post-Rehab Conditioning">Post-Rehab Conditioning</option>
                      </select>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 space-y-1 text-gray-700">
                    <div className="flex justify-between items-center">
                      <span>1-on-1 PT Session Fee:</span>
                      <span className="font-bold">₹{trainerBookingModal.trainer.consultationFee}</span>
                    </div>
                    <div className="flex justify-between items-center text-amber-800 font-semibold">
                      <span>Resident InBody Scan:</span>
                      <span className="bg-amber-200 text-amber-900 text-[10px] px-1.5 py-0.5 rounded-md font-bold">FREE (Worth ₹500)</span>
                    </div>
                    <p className="text-[10px] text-amber-800 mt-1">✓ Pay after session via UPI or Cash at Clubhouse Gym reception</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setTrainerBookingModal({ open: false, trainer: null })}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const patient = familyList.find(f => f.id === trainerPatientId);
                      setTrainerSuccessMsg(
                        `Personal training session with ${trainerBookingModal.trainer?.name} has been booked for ${patient?.fullName || "Resident"} on ${trainerSlot}.`
                      );
                    }}
                    className="flex-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-xs cursor-pointer"
                  >
                    Confirm Booking →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Lab Home Collection Booking Modal */}
      {labBookingPkg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5">
            {labBookingSuccess ? (
              <div className="text-center space-y-3 py-4">
                <div className="text-4xl">✅</div>
                <h3 className="text-xl font-black text-teal-900">Slot Booked!</h3>
                <p className="text-gray-600 text-sm">
                  Phlebotomist <strong>Ravi Kumar</strong> will arrive at your flat at the selected time. Please keep the sample kit ready.
                </p>
                {labBookingPkg.fastingRequired && (
                  <p className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl">
                    ⚠️ Fasting required: Do not eat or drink (except water) for 10 hours before collection.
                  </p>
                )}
                <button
                  onClick={() => setLabBookingPkg(null)}
                  className="bg-teal-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm mt-2"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-xl text-gray-900">📅 Book Home Collection</h3>
                    <p className="text-sm text-teal-700 font-semibold mt-0.5">{labBookingPkg.name}</p>
                  </div>
                  <button onClick={() => setLabBookingPkg(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                </div>

                {labBookingPkg.fastingRequired && (
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 font-medium">
                    ⚠️ Fasting Required: 10 hours before sample collection.
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Collection Date:</label>
                    <div className="flex gap-2">
                      {[
                        { val: "tomorrow", label: "Tomorrow" },
                        { val: "day-after", label: "Day After" },
                        { val: "in-3-days", label: "In 3 Days" }
                      ].map(opt => (
                        <button
                          key={opt.val}
                          onClick={() => setLabBookingDate(opt.val)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                            labBookingDate === opt.val ? "bg-teal-600 text-white border-teal-600" : "bg-gray-50 text-gray-700 border-gray-200"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Time Slot:</label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { val: "morning", label: "Morning 6–9 AM" },
                        { val: "forenoon", label: "Forenoon 9–12 PM" },
                        { val: "afternoon", label: "Afternoon 12–3 PM" }
                      ].map(opt => (
                        <button
                          key={opt.val}
                          onClick={() => setLabBookingSlot(opt.val)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                            labBookingSlot === opt.val ? "bg-teal-600 text-white border-teal-600" : "bg-gray-50 text-gray-700 border-gray-200"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-xl text-xs text-gray-600 border">
                    <p className="font-bold text-gray-800">📍 Home Address</p>
                    <p>Flat 404, Tower B, Mana Residency, Bangalore — 560103</p>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t pt-4">
                  <div>
                    <p className="text-xs text-gray-500">Package Price</p>
                    <p className="text-2xl font-black text-teal-700">₹{labBookingPkg.price}</p>
                  </div>
                  <button
                    onClick={() => setLabBookingSuccess(true)}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-xl text-sm shadow transition"
                  >
                    Confirm Booking
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Video Consultation In-Page Room */}
      {videoAppt && (
        <div className="fixed inset-0 bg-gray-950 flex flex-col z-50">
          {videoState === "ENDED" ? (
            <div className="flex-1 flex flex-col items-center justify-center text-white space-y-6 p-6">
              <div className="text-5xl">✅</div>
              <h2 className="text-2xl font-black">Consultation Complete</h2>
              <p className="text-gray-300 text-sm text-center">Your consultation has ended. Notes and next steps will be updated in your Care Journey.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setVideoAppt(null); setActiveTab("care-journey"); }}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-xl"
                >
                  View Care Journey
                </button>
                <button
                  onClick={() => { setVideoAppt(null); setActiveTab("pharmacy"); }}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl"
                >
                  Order Medicines
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Status bar */}
              <div className="flex justify-between items-center p-4 bg-black/40">
                <span className="text-xs text-green-400 font-bold">🔒 End-to-End Encrypted</span>
                <span className="text-xs text-white font-mono">
                  {videoState === "CONNECTING" ? "Connecting..." : `${String(Math.floor(videoElapsed / 60)).padStart(2, "0")}:${String(videoElapsed % 60).padStart(2, "0")}`}
                </span>
              </div>

              {/* Doctor area */}
              <div className="flex-1 flex items-center justify-center relative bg-gray-900">
                <div className="text-center space-y-3">
                  <div className="w-28 h-28 rounded-full bg-teal-700 flex items-center justify-center text-4xl mx-auto border-4 border-teal-400 animate-pulse">
                    👨‍⚕️
                  </div>
                  <p className="text-white font-black text-lg">{videoAppt.doctorName}</p>
                  <p className="text-teal-300 text-sm">{videoAppt.doctorSpecialty}</p>
                  {videoState === "CONNECTING" && (
                    <p className="text-gray-400 text-xs animate-pulse">Waiting for doctor to join...</p>
                  )}
                  {videoState === "CONNECTED" && (
                    <p className="text-green-400 text-xs">● Live consultation in progress</p>
                  )}
                </div>

                {/* Self PIP */}
                <div className="absolute top-4 right-4 w-20 h-28 bg-gray-700 rounded-2xl flex items-center justify-center text-2xl border-2 border-gray-600">
                  {videoCamOff ? "🚫" : "🙂"}
                </div>
              </div>

              {/* Controls */}
              <div className="p-6 bg-black/60 flex justify-center gap-4">
                <button
                  onClick={() => setVideoMuted(m => !m)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-lg transition ${videoMuted ? "bg-red-600" : "bg-gray-700 hover:bg-gray-600"}`}
                >
                  {videoMuted ? "🔇" : "🎙️"}
                </button>
                <button
                  onClick={() => setVideoCamOff(c => !c)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-lg transition ${videoCamOff ? "bg-red-600" : "bg-gray-700 hover:bg-gray-600"}`}
                >
                  {videoCamOff ? "📷" : "📹"}
                </button>
                {videoState === "CONNECTING" && (
                  <button
                    onClick={() => setVideoState("CONNECTED")}
                    className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center text-xl shadow-lg"
                  >
                    ✅
                  </button>
                )}
                <button
                  onClick={() => setVideoState("ENDED")}
                  className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-xl shadow-lg"
                >
                  📵
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Patient Security & Privacy Dashboard Modal */}
      {showSecurityModal && (
        <PatientSecurityPrivacyModal
          patientId="fam-1"
          onClose={() => setShowSecurityModal(false)}
        />
      )}
    </div>
  );
};

export default HealthPortal;