import React, { useState } from "react";
import { useNavigate } from "react-router";
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
  ConsultationMode
} from "../../types/health";
import { CommunityHealthCampsHub } from "../../app/components/health/CommunityHealthCampsHub";
import { HealthcareDirectory } from "../../app/components/health/HealthcareDirectory";
import { HealthcareBenefitsWalletView } from "../../app/components/health/HealthcareBenefitsWalletView";
import { PreventiveWellnessHub } from "../../app/components/health/PreventiveWellnessHub";
import { ProviderOperationsDashboard } from "../../app/components/health/provider/ProviderOperationsDashboard";
import { PatientSecurityPrivacyModal } from "../../app/components/health/PatientSecurityPrivacyModal";

export const HealthPortal: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "doctors" | "camps" | "family" | "appointments" | "records" | "labs" | "benefits" | "wellness" | "provider" | "emergency" | "ai"
  >("doctors");

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
            onClick={() => setActiveTab("emergency")}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition animate-pulse flex items-center gap-2 text-sm"
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
          { id: "ai", label: "🤖 AI Symptom Guide" }
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

                <button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl transition text-sm">
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
          <div className="bg-red-50 border-2 border-red-500 p-6 rounded-3xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-pulse">🚨</span>
              <h3 className="text-red-900 font-extrabold text-xl">24x7 Community Medical Emergency Hotlines</h3>
            </div>
            <p className="text-red-700 text-sm">
              Integrated with Mana Emergency SOS and Campus Gate Security. Calling triggers rapid dispatch of community first responders and security room gate pass clearances.
            </p>
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
                <a
                  href={`tel:${em.phone}`}
                  className="bg-red-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm hover:bg-red-700 transition shadow-sm"
                >
                  📞 Call Now
                </a>
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