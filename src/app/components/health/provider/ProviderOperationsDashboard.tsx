import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  UserCheck,
  Plus,
  Search,
  MessageSquare,
  Truck,
  Shield,
  Stethoscope,
  Building2,
  DollarSign,
  Tag,
  Send,
  Users,
  ChevronRight,
  Filter
} from "lucide-react";
import { healthService } from "../../../../services/healthService";
import { sanitizeHref } from "../../../../utils/sanitize";
import type {
  ProviderProfileDto,
  ProviderStaffMemberDto,
  ProviderServiceItemDto,
  PatientQueryDto,
  ProviderFulfillmentOrderDto,
  HealthAppointmentDto,
  DoctorDto
} from "../../../../types/health";

export const ProviderOperationsDashboard: React.FC = () => {
  const [selectedProviderId, setSelectedProviderId] = useState<string>("doc-1");
  const [providerProfile, setProviderProfile] = useState<ProviderProfileDto | null>(null);
  const [activeTab, setActiveTab] = useState<"appointments" | "slots" | "catalog" | "dispatch" | "fulfillment" | "queries" | "staff">("appointments");
  const [appointments, setAppointments] = useState<HealthAppointmentDto[]>([]);
  const [services, setServices] = useState<ProviderServiceItemDto[]>([]);
  const [staffList, setStaffList] = useState<ProviderStaffMemberDto[]>([]);
  const [queries, setQueries] = useState<PatientQueryDto[]>([]);
  const [fulfillments, setFulfillments] = useState<ProviderFulfillmentOrderDto[]>([]);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Modal / Action states
  const [replyModalQuery, setReplyModalQuery] = useState<PatientQueryDto | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState<Partial<ProviderStaffMemberDto>>({
    name: "",
    role: "RECEPTIONIST",
    email: "",
    phone: "",
    permissions: ["ACCEPT_BOOKINGS", "ANSWER_QUERIES"],
    active: true
  });

  // Clinical Dispatch Form
  const [dispatchForm, setDispatchForm] = useState({
    patientId: "fam-4",
    patientName: "M. K. Varma (Father)",
    docType: "PRESCRIPTION" as "PRESCRIPTION" | "LAB_REPORT",
    title: "Routine Post-Consultation Prescription",
    clinicalNotes: "Tab Atorvastatin 20mg once daily at bedtime. Tab Ecosprin 75mg once daily post lunch. Repeat lipid profile in 6 weeks."
  });

  useEffect(() => {
    loadProviderData();
  }, [selectedProviderId]);

  const loadProviderData = async () => {
    const prof = await healthService.getProviderProfile(selectedProviderId);
    const appts = await healthService.getProviderAppointments(selectedProviderId);
    const srvs = await healthService.getProviderServices(selectedProviderId);
    const stf = await healthService.getProviderStaff(selectedProviderId);
    const qrys = await healthService.getPatientQueries(selectedProviderId);
    const fuls = await healthService.getFulfillmentOrders(selectedProviderId);

    setProviderProfile(prof);
    setAppointments(appts);
    setServices(srvs);
    setStaffList(stf);
    setQueries(qrys);
    setFulfillments(fuls);
  };

  const showToast = (msg: string) => {
    setStatusFeedback(msg);
    setTimeout(() => setStatusFeedback(null), 4000);
  };

  const handleUpdateStatus = async (appointmentId: string, status: "CONFIRMED" | "CANCELLED" | "COMPLETED") => {
    await healthService.updateAppointmentStatus(appointmentId, status);
    showToast(`Appointment status updated to ${status}. Resident notified.`);
    loadProviderData();
  };

  const handleToggleService = async (service: ProviderServiceItemDto) => {
    const updated = { ...service, enabled: !service.enabled };
    await healthService.saveProviderService(selectedProviderId, updated);
    showToast(`Service "${service.name}" ${updated.enabled ? "enabled" : "hidden from directory"}.`);
    loadProviderData();
  };

  const handleSendReply = async () => {
    if (!replyModalQuery || !replyText.trim()) return;
    await healthService.replyToPatientQuery(
      selectedProviderId,
      replyModalQuery.id,
      replyText,
      providerProfile?.name || "Provider Staff"
    );
    showToast("Reply sent to patient. Private notification pushed.");
    setReplyModalQuery(null);
    setReplyText("");
    loadProviderData();
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.phone) return;
    const staffMember: ProviderStaffMemberDto = {
      id: `stf-${Date.now()}`,
      name: newStaff.name,
      role: newStaff.role as any,
      email: newStaff.email || "",
      phone: newStaff.phone,
      permissions: newStaff.permissions || ["ACCEPT_BOOKINGS"],
      active: true
    };
    await healthService.addProviderStaffMember(selectedProviderId, staffMember);
    setShowAddStaffModal(false);
    setNewStaff({ name: "", role: "RECEPTIONIST", email: "", phone: "", permissions: ["ACCEPT_BOOKINGS", "ANSWER_QUERIES"], active: true });
    showToast(`Staff member ${staffMember.name} added with verified credentials.`);
    loadProviderData();
  };

  const handleIssueDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchForm.title || !dispatchForm.clinicalNotes) return;
    await healthService.issuePrescriptionOrReport({
      patientId: dispatchForm.patientId,
      patientName: dispatchForm.patientName,
      doctorOrLabName: providerProfile?.name || "Authorized Clinician",
      title: dispatchForm.title,
      type: dispatchForm.docType,
      notes: dispatchForm.clinicalNotes
    });
    showToast(`Document "${dispatchForm.title}" published directly to patient's private Health Vault.`);
    setDispatchForm({
      ...dispatchForm,
      title: "",
      clinicalNotes: ""
    });
  };

  const handleFulfillmentAdvance = async (orderId: string, nextStatus: ProviderFulfillmentOrderDto["status"]) => {
    await healthService.updateFulfillmentStatus(selectedProviderId, orderId, nextStatus);
    showToast(`Order status advanced to ${nextStatus}.`);
    loadProviderData();
  };

  return (
    <div className="space-y-6">
      {/* Provider Header & Switcher */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-indigo-950 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-teal-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🏥</span>
            <span className="bg-teal-500/20 text-teal-300 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Healthcare Provider Operations Center
            </span>
          </div>
          <h2 className="text-2xl font-black">{providerProfile?.name || "Provider Console"}</h2>
          <p className="text-xs text-teal-200/80 mt-1">
            {providerProfile?.specialty} • Reg: <strong>{providerProfile?.registrationNumber}</strong> ({providerProfile?.medicalCouncil})
          </p>
        </div>

        {/* Workspace Switcher */}
        <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl border border-white/10 backdrop-blur-sm">
          <span className="text-xs text-teal-200 px-2 font-medium">Active Workspace:</span>
          <select
            value={selectedProviderId}
            onChange={(e) => setSelectedProviderId(e.target.value)}
            className="bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-teal-500/30 focus:outline-none"
          >
            <option value="doc-1">Dr. Rajesh Kumar (Cardiologist)</option>
            <option value="clinic-1">Apollo Clinic Express (Mana Annex)</option>
            <option value="lab-1">Thyrocare Technologies Diagnostic Center</option>
          </select>
        </div>
      </div>

      {statusFeedback && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusFeedback}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "appointments", label: "📅 Appointments & Bookings", count: appointments.length },
          { id: "slots", label: "⏱️ Availability & Slots" },
          { id: "catalog", label: "🏷️ Services & Pricing", count: services.length },
          { id: "dispatch", label: "📄 Issue Rx & Reports" },
          { id: "fulfillment", label: "🚚 Sample & OPD Fulfillment", count: fulfillments.length },
          { id: "queries", label: "💬 Patient Inquiries", count: queries.filter(q => q.status === "OPEN").length },
          { id: "staff", label: "👥 Verified Staff & Access", count: staffList.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-teal-700 text-white shadow-md shadow-teal-700/20"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeTab === tab.id ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: APPOINTMENTS & BOOKINGS */}
      {activeTab === "appointments" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-extrabold text-foreground">Resident Bookings & Clinical Queue</h3>
              <p className="text-xs text-muted-foreground">Accept, reschedule or mark attendance for incoming resident consultations.</p>
            </div>
            <div className="text-xs text-muted-foreground font-semibold">
              Total Managed: <span className="text-foreground font-bold">{appointments.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.map(appt => (
              <div key={appt.id} className="bg-card p-5 rounded-3xl border border-border shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/10 text-teal-800 dark:text-teal-300">
                      {appt.mode} CONSULTATION
                    </span>
                    <h4 className="font-extrabold text-base text-foreground mt-1">
                      {appt.patientName} <span className="text-xs font-normal text-muted-foreground">({appt.patientRelationship})</span>
                    </h4>
                  </div>
                  <span className={`text-xs font-extrabold px-2.5 py-1 rounded-xl ${
                    appt.status === "CONFIRMED" ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                    : appt.status === "COMPLETED" ? "bg-blue-500/10 text-blue-700 border border-blue-500/20"
                    : "bg-rose-500/10 text-rose-700 border border-rose-500/20"
                  }`}>
                    {appt.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-3 rounded-2xl">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Time Slot:</span>
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-teal-600" /> {appt.slotTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Consultation Fee:</span>
                    <span className="font-semibold text-foreground">₹{appt.fee}</span>
                  </div>
                </div>

                {appt.meetingLink && (
                  <div className="text-xs bg-teal-500/10 p-2.5 rounded-xl text-teal-800 dark:text-teal-300 flex items-center justify-between">
                    <span className="truncate">📹 Room: {appt.meetingLink}</span>
                    <a href={sanitizeHref(appt.meetingLink)} target="_blank" rel="noreferrer" className="underline font-bold shrink-0 ml-2">Join</a>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  {appt.status !== "COMPLETED" && (
                    <button
                      onClick={() => handleUpdateStatus(appt.id, "COMPLETED")}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                    </button>
                  )}
                  {appt.status !== "CANCELLED" && (
                    <button
                      onClick={() => handleUpdateStatus(appt.id, "CANCELLED")}
                      className="px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel Slot
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SLOTS & AVAILABILITY */}
      {activeTab === "slots" && (
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-3xl border border-border shadow-sm space-y-4">
            <h3 className="text-lg font-extrabold text-foreground">Weekly Roster & Real-Time Availability</h3>
            <p className="text-xs text-muted-foreground">Control live patient booking gates, consultation durations, and emergency slot locks.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                <span className="text-xs font-bold text-foreground">Accepting New Residents</span>
                <p className="text-[11px] text-muted-foreground">Show profile as open for new patient consultations across society towers.</p>
                <button
                  onClick={() => {
                    if (providerProfile) {
                      healthService.updateProviderProfile(selectedProviderId, { acceptingNewPatients: !providerProfile.acceptingNewPatients });
                      loadProviderData();
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    providerProfile?.acceptingNewPatients ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {providerProfile?.acceptingNewPatients ? "Active (Accepting)" : "Paused"}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                <span className="text-xs font-bold text-foreground">Emergency Buffer Slots</span>
                <p className="text-[11px] text-muted-foreground">Reserve 1 slot every morning and evening exclusively for acute resident urgent care.</p>
                <button
                  onClick={() => {
                    if (providerProfile) {
                      healthService.updateProviderProfile(selectedProviderId, { emergencySlotAvailable: !providerProfile.emergencySlotAvailable });
                      loadProviderData();
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    providerProfile?.emergencySlotAvailable ? "bg-amber-600 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {providerProfile?.emergencySlotAvailable ? "Emergency Reserve Active" : "No Emergency Reserve"}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                <span className="text-xs font-bold text-foreground">Average Slot Duration</span>
                <p className="text-[11px] text-muted-foreground">Sets interval spacing for automated booking generation.</p>
                <div className="flex gap-2">
                  {[15, 20, 30].map(mins => (
                    <button
                      key={mins}
                      onClick={() => {
                        healthService.updateProviderProfile(selectedProviderId, { averageConsultTimeMins: mins });
                        loadProviderData();
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold ${
                        providerProfile?.averageConsultTimeMins === mins ? "bg-teal-700 text-white" : "bg-muted text-foreground"
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Daily Slots Grid */}
            <div className="pt-4 border-t border-border">
              <h4 className="font-bold text-sm text-foreground mb-3">Today's Active Roster Slots:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {[
                  { time: "09:00 AM", mode: "IN_PERSON", status: "AVAILABLE" },
                  { time: "09:30 AM", mode: "IN_PERSON", status: "BOOKED" },
                  { time: "10:00 AM", mode: "VIDEO", status: "AVAILABLE" },
                  { time: "10:30 AM", mode: "VIDEO", status: "BLOCKED" },
                  { time: "04:30 PM", mode: "IN_PERSON", status: "AVAILABLE" },
                  { time: "05:00 PM", mode: "IN_PERSON", status: "EMERGENCY_HOLD" },
                  { time: "05:30 PM", mode: "IN_PERSON", status: "BOOKED" },
                  { time: "06:00 PM", mode: "VIDEO", status: "AVAILABLE" }
                ].map((s, idx) => (
                  <div key={idx} className={`p-3 rounded-2xl border text-center space-y-1 ${
                    s.status === "BOOKED" ? "bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200"
                    : s.status === "EMERGENCY_HOLD" ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
                    : s.status === "BLOCKED" ? "bg-muted border-border text-muted-foreground"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                  }`}>
                    <p className="font-extrabold text-xs">{s.time}</p>
                    <span className="text-[10px] font-bold block">{s.mode}</span>
                    <span className="text-[9px] font-semibold uppercase tracking-wider block opacity-80">{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SERVICES & PRICING */}
      {activeTab === "catalog" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-extrabold text-foreground">Service Catalog, Pricing & RWA Discounts</h3>
              <p className="text-xs text-muted-foreground">Define clinical packages, doorstep phlebotomy fees, and exclusive society privileges.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map(srv => (
              <div key={srv.id} className="bg-card p-5 rounded-3xl border border-border shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] bg-teal-500/10 text-teal-800 dark:text-teal-300 font-bold px-2 py-0.5 rounded">
                      {srv.category}
                    </span>
                    <h4 className="font-extrabold text-base text-foreground mt-1">{srv.name}</h4>
                  </div>
                  <button
                    onClick={() => handleToggleService(srv)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                      srv.enabled ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {srv.enabled ? "Listed Active" : "Hidden"}
                  </button>
                </div>

                <p className="text-xs text-muted-foreground">{srv.description}</p>

                <div className="flex items-center justify-between bg-muted/40 p-3 rounded-2xl text-xs">
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Resident Rate:</span>
                    <span className="text-lg font-black text-foreground">₹{srv.price}</span>
                    {srv.originalPrice && <span className="text-xs text-muted-foreground line-through ml-1.5">₹{srv.originalPrice}</span>}
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-teal-700 bg-teal-500/10 px-2 py-0.5 rounded block">
                      {srv.communityDiscountPercent}% Society Discount
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">{srv.turnaroundTime || "Same Day"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CLINICAL DISPATCH (RX & REPORTS) */}
      {activeTab === "dispatch" && (
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm space-y-5">
          <div>
            <h3 className="text-lg font-extrabold text-foreground">Issue Digital Prescription or Verified Diagnostic Report</h3>
            <p className="text-xs text-muted-foreground">
              Clinical documents are cryptographically signed with doctor registration credentials and delivered straight to the resident's private Health Vault.
            </p>
          </div>

          <form onSubmit={handleIssueDocument} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Select Resident Patient:</label>
                <select
                  value={dispatchForm.patientId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const name = id === "fam-4" ? "M. K. Varma (Father)" : "Rahul Varma (Self)";
                    setDispatchForm({ ...dispatchForm, patientId: id, patientName: name });
                  }}
                  className="w-full p-2.5 rounded-xl border border-border text-xs bg-background text-foreground"
                >
                  <option value="fam-4">M. K. Varma (Tower B-402, Age 69)</option>
                  <option value="fam-1">Rahul Varma (Tower B-402, Age 38)</option>
                  <option value="fam-3">Aarav Varma (Tower B-402, Age 8)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Document Category:</label>
                <select
                  value={dispatchForm.docType}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, docType: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-border text-xs bg-background text-foreground"
                >
                  <option value="PRESCRIPTION">E-Prescription (Rx)</option>
                  <option value="LAB_REPORT">Diagnostic Test Report</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Document Title / Diagnosis:</label>
              <input
                type="text"
                value={dispatchForm.title}
                onChange={(e) => setDispatchForm({ ...dispatchForm, title: e.target.value })}
                placeholder="e.g. Cardiology OPD Follow-up Prescription"
                className="w-full p-2.5 rounded-xl border border-border text-xs bg-background text-foreground"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Prescription Items & Clinical Instructions:</label>
              <textarea
                rows={4}
                value={dispatchForm.clinicalNotes}
                onChange={(e) => setDispatchForm({ ...dispatchForm, clinicalNotes: e.target.value })}
                placeholder="List dosage, frequency, dietary instructions and follow-up guidelines..."
                className="w-full p-2.5 rounded-xl border border-border text-xs bg-background text-foreground font-mono"
                required
              />
            </div>

            <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-300">
              🛡️ <strong>Clinical Audit Notice:</strong> Document will be tagged with Registration No: <strong>{providerProfile?.registrationNumber}</strong>. No automated diagnosis will be published.
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" /> Publish to Patient Vault
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: FULFILLMENT & SAMPLES */}
      {activeTab === "fulfillment" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-extrabold text-foreground">Fulfillment & Phlebotomy Logistics</h3>
              <p className="text-xs text-muted-foreground">Track doorstep blood collections, specimen transport, and in-clinic arrivals.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fulfillments.map(ord => (
              <div key={ord.id} className="bg-card p-5 rounded-3xl border border-border shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-800 dark:text-indigo-300">
                      {ord.type}
                    </span>
                    <h4 className="font-extrabold text-base text-foreground mt-1">{ord.patientName}</h4>
                    <span className="text-xs text-muted-foreground">{ord.patientFlatNo} • {ord.patientPhone}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-muted text-foreground">
                    {ord.status}
                  </span>
                </div>

                <div className="text-xs bg-muted/40 p-3 rounded-2xl space-y-1">
                  <p className="font-bold text-foreground">{ord.serviceName}</p>
                  <p className="text-muted-foreground">Scheduled: {ord.scheduledTime}</p>
                  {ord.assignedStaffName && (
                    <p className="text-teal-700 dark:text-teal-300 font-semibold">Assigned Staff: {ord.assignedStaffName}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  {ord.status === "SCHEDULED" && (
                    <button
                      onClick={() => handleFulfillmentAdvance(ord.id, "PHLEBOTOMIST_ASSIGNED")}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition"
                    >
                      Assign Field Phlebotomist
                    </button>
                  )}
                  {ord.status === "PHLEBOTOMIST_ASSIGNED" && (
                    <button
                      onClick={() => handleFulfillmentAdvance(ord.id, "SAMPLE_COLLECTED")}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-xl text-xs transition"
                    >
                      Confirm Sample Collected
                    </button>
                  )}
                  {ord.status === "SAMPLE_COLLECTED" && (
                    <button
                      onClick={() => handleFulfillmentAdvance(ord.id, "REPORT_DISPATCHED")}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition"
                    >
                      Mark Report Dispatched
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: PATIENT QUERIES */}
      {activeTab === "queries" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-extrabold text-foreground">Patient Inquiries & Triage Clarifications</h3>
              <p className="text-xs text-muted-foreground">Pre-consultation questions, fasting guidance, and dosage follow-up messages.</p>
            </div>
          </div>

          <div className="space-y-3">
            {queries.map(q => (
              <div key={q.id} className="bg-card p-5 rounded-3xl border border-border shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-sm text-foreground">{q.subject}</h4>
                    <p className="text-xs text-muted-foreground">From: <strong>{q.patientName}</strong> ({q.patientPhone}) • {q.receivedAt}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    q.status === "OPEN" ? "bg-amber-500/10 text-amber-800 dark:text-amber-300" : "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                  }`}>
                    {q.status}
                  </span>
                </div>

                <p className="text-xs text-foreground bg-muted/40 p-3 rounded-2xl italic">"{q.message}"</p>

                {q.replyMessage ? (
                  <div className="text-xs bg-teal-500/10 p-3 rounded-2xl border border-teal-500/20 text-teal-950 dark:text-teal-200 space-y-1">
                    <span className="font-bold block">✓ Reply from {q.repliedBy}:</span>
                    <p>{q.replyMessage}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => setReplyModalQuery(q)}
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Reply to Resident
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: STAFF ACCESS & ROLES */}
      {activeTab === "staff" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-extrabold text-foreground">Verified Clinic & Lab Personnel</h3>
              <p className="text-xs text-muted-foreground">Manage authorized receptionists, attendant staff, and sample collectors.</p>
            </div>
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Add Verified Staff
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staffList.map(stf => (
              <div key={stf.id} className="bg-card p-5 rounded-3xl border border-border shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-800 dark:text-teal-300">
                      {stf.role}
                    </span>
                    <h4 className="font-extrabold text-base text-foreground mt-1">{stf.name}</h4>
                    <p className="text-xs text-muted-foreground">{stf.phone} • {stf.email}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded">
                    Active
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground block">Granted Access Permissions:</span>
                  <div className="flex flex-wrap gap-1">
                    {stf.permissions.map((p, idx) => (
                      <span key={idx} className="bg-muted text-foreground text-[10px] px-2 py-0.5 rounded-md font-semibold">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: REPLY TO QUERY */}
      {replyModalQuery && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card p-6 rounded-3xl max-w-lg w-full border border-border shadow-2xl space-y-4">
            <h4 className="font-extrabold text-base text-foreground">Reply to {replyModalQuery.patientName}</h4>
            <p className="text-xs text-muted-foreground">Query: "{replyModalQuery.message}"</p>
            <textarea
              rows={4}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your response to the resident..."
              className="w-full p-3 rounded-xl border border-border text-xs bg-background text-foreground"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setReplyModalQuery(null)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-muted-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReply}
                className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold"
              >
                Send Reply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD STAFF */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card p-6 rounded-3xl max-w-md w-full border border-border shadow-2xl space-y-4">
            <h4 className="font-extrabold text-base text-foreground">Add New Staff Member</h4>
            <form onSubmit={handleAddStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Full Name:</label>
                <input
                  type="text"
                  required
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border text-xs bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Role:</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-border text-xs bg-background text-foreground"
                >
                  <option value="RECEPTIONIST">Receptionist / Front Desk</option>
                  <option value="CLINIC_ADMIN">Clinic Administrator</option>
                  <option value="LAB_TECHNICIAN">Lab Technician</option>
                  <option value="PHLEBOTOMIST">Field Phlebotomist</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Phone Number:</label>
                <input
                  type="text"
                  required
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border text-xs bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Email:</label>
                <input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border text-xs bg-background text-foreground"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold"
                >
                  Save Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};