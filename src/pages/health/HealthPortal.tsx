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
  | "dental" | "abha" | "cancer" | "mental-health" | "hospitals" | "gold";

export const VALID_HEALTH_TABS: HealthTab[] = [
  "doctors", "camps", "family", "appointments", "records", "labs", "benefits", "wellness",
  "provider", "emergency", "ai", "care-journey", "pharmacy", "ambulance", "ipd", "surgery",
  "dental", "abha", "cancer", "mental-health", "hospitals", "gold"
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
        <HealthcareDirectory
          onCampRegister={() => setActiveTab("camps")}
        />
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
          {/* Care Buddy Banner */}
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-black">P</div>
            <div className="flex-1">
              <p className="font-black text-purple-900 text-sm">Care Buddy: Priya Sharma</p>
              <p className="text-xs text-purple-700 mt-0.5">Dedicated coordinator · Available 24×7 · Free service</p>
            </div>
            <button onClick={() => alert("Care Buddy: +91 98765 43210")} className="bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">Call</button>
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
            <p className="text-sm text-amber-200">Your Premium Health Membership</p>
            <p className="text-xs text-amber-100">Unlimited consultations, priority care, exclusive discounts.</p>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <h3 className="text-sm font-black text-gray-900">What's Included</h3>
            {[
              { icon: "📹", title: "Unlimited Video Consultations", value: "Unlimited" },
              { icon: "🧪", title: "30% Off Lab Tests", value: "30% off" },
              { icon: "💊", title: "20% Off Pharmacy", value: "20% off" },
              { icon: "⚡", title: "Priority Booking", value: "Priority" },
              { icon: "🩺", title: "Annual Health Check-up", value: "1 free/yr" },
              { icon: "🧠", title: "4 Free Therapy Sessions/mo", value: "4/mo" },
              { icon: "📞", title: "24×7 Doctor Helpline", value: "24×7" },
            ].map((b, i) => (
              <div key={i} className="bg-white border border-amber-200 rounded-2xl p-3 flex items-center gap-3">
                <span className="text-xl">{b.icon}</span>
                <p className="flex-1 text-sm font-semibold text-gray-800">{b.title}</p>
                <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded-lg">{b.value}</span>
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