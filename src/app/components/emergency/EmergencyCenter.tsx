import { useState, useEffect, useMemo } from "react";
import {
  AlertTriangle,
  Phone,
  Radio,
  MapPin,
  ShieldAlert,
  Flame,
  Zap,
  Droplets,
  Wind,
  Baby,
  CloudLightning,
  HelpCircle,
  TrendingUp,
  Plus,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Shield,
  Search,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Share2,
  Sparkles,
  RefreshCw,
  Bell,
  HeartPulse,
  UserCheck,
  Building,
  Info,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Activity,
  Filter
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
  emergencyService,
  type EmergencyIncident,
  type EmergencyContact,
  type EmergencyCategory,
  type EmergencyStatus,
  type EmergencySeverity,
} from "../../../services/emergency/emergencyService";
import { sosService, type LockdownDirective } from "../../../services/emergency/sosService";
import { useAuth } from "../../../contexts/AuthContext";

// ── Visual Categories with Groww-style vibrant accents & emergency color-coding ──
const CATEGORY_CONFIG: Record<
  EmergencyCategory,
  {
    label: string;
    sublabel: string;
    icon: React.ComponentType<any>;
    color: string;
    badgeBg: string;
    badgeText: string;
    gradient: string;
    border: string;
    hoverBorder: string;
    sla: string;
  }
> = {
  MEDICAL: {
    label: "Medical Emergency",
    sublabel: "Cardiac, trauma, stroke, fainting",
    icon: HeartPulse,
    color: "#EF4444",
    badgeBg: "bg-red-50 dark:bg-red-950/40",
    badgeText: "text-red-700 dark:text-red-400",
    gradient: "from-red-500/10 via-red-500/5 to-transparent",
    border: "border-red-200 dark:border-red-900/50",
    hoverBorder: "hover:border-red-500 hover:shadow-red-500/10",
    sla: "< 5 mins",
  },
  FIRE: {
    label: "Fire & Smoke",
    sublabel: "Kitchen fire, electrical, duct",
    icon: Flame,
    color: "#F97316",
    badgeBg: "bg-orange-50 dark:bg-orange-950/40",
    badgeText: "text-orange-700 dark:text-orange-400",
    gradient: "from-orange-500/10 via-orange-500/5 to-transparent",
    border: "border-orange-200 dark:border-orange-900/50",
    hoverBorder: "hover:border-orange-500 hover:shadow-orange-500/10",
    sla: "< 3 mins",
  },
  LIFT: {
    label: "Lift Trapped",
    sublabel: "Passengers stuck, power cut",
    icon: Zap,
    color: "#EAB308",
    badgeBg: "bg-amber-50 dark:bg-amber-950/40",
    badgeText: "text-amber-800 dark:text-amber-400",
    gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
    border: "border-amber-200 dark:border-amber-900/50",
    hoverBorder: "hover:border-amber-500 hover:shadow-amber-500/10",
    sla: "< 15 mins",
  },
  SECURITY: {
    label: "Security & Intruder",
    sublabel: "Unauthorized entry, altercation",
    icon: ShieldAlert,
    color: "#3B82F6",
    badgeBg: "bg-blue-50 dark:bg-blue-950/40",
    badgeText: "text-blue-700 dark:text-blue-400",
    gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
    border: "border-blue-200 dark:border-blue-900/50",
    hoverBorder: "hover:border-blue-500 hover:shadow-blue-500/10",
    sla: "< 3 mins",
  },
  GAS_LEAK: {
    label: "LPG / Piped Gas Leak",
    sublabel: "Smell of gas, pipeline rupture",
    icon: Wind,
    color: "#059669",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/40",
    badgeText: "text-emerald-700 dark:text-emerald-400",
    gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    border: "border-emerald-200 dark:border-emerald-900/50",
    hoverBorder: "hover:border-emerald-500 hover:shadow-emerald-500/10",
    sla: "< 5 mins",
  },
  FLOOD: {
    label: "Plumbing / Flood",
    sublabel: "Overhead tank burst, basement seepage",
    icon: Droplets,
    color: "#06B6D4",
    badgeBg: "bg-cyan-50 dark:bg-cyan-950/40",
    badgeText: "text-cyan-700 dark:text-cyan-400",
    gradient: "from-cyan-500/10 via-cyan-500/5 to-transparent",
    border: "border-cyan-200 dark:border-cyan-900/50",
    hoverBorder: "hover:border-cyan-500 hover:shadow-cyan-500/10",
    sla: "< 10 mins",
  },
  POWER: {
    label: "Total Power Outage",
    sublabel: "Transformer fail, DG tripping",
    icon: Zap,
    color: "#D97706",
    badgeBg: "bg-yellow-50 dark:bg-yellow-950/40",
    badgeText: "text-yellow-800 dark:text-yellow-400",
    gradient: "from-yellow-500/10 via-yellow-500/5 to-transparent",
    border: "border-yellow-200 dark:border-yellow-900/50",
    hoverBorder: "hover:border-yellow-500 hover:shadow-yellow-500/10",
    sla: "< 10 mins",
  },
  CHILD_SAFETY: {
    label: "Child Safety & Lost",
    sublabel: "Lost in podium, playground distress",
    icon: Baby,
    color: "#EC4899",
    badgeBg: "bg-pink-50 dark:bg-pink-950/40",
    badgeText: "text-pink-700 dark:text-pink-400",
    gradient: "from-pink-500/10 via-pink-500/5 to-transparent",
    border: "border-pink-200 dark:border-pink-900/50",
    hoverBorder: "hover:border-pink-500 hover:shadow-pink-500/10",
    sla: "Immediate",
  },
  NATURAL_DISASTER: {
    label: "Earthquake / Storm",
    sublabel: "Structural tremor, fallen tree",
    icon: CloudLightning,
    color: "#8B5CF6",
    badgeBg: "bg-purple-50 dark:bg-purple-950/40",
    badgeText: "text-purple-700 dark:text-purple-400",
    gradient: "from-purple-500/10 via-purple-500/5 to-transparent",
    border: "border-purple-200 dark:border-purple-900/50",
    hoverBorder: "hover:border-purple-500 hover:shadow-purple-500/10",
    sla: "Immediate",
  },
  OTHER: {
    label: "General SOS Assistance",
    sublabel: "Any other urgent distress situation",
    icon: HelpCircle,
    color: "#6B7280",
    badgeBg: "bg-gray-50 dark:bg-gray-800/40",
    badgeText: "text-gray-700 dark:text-gray-300",
    gradient: "from-gray-500/10 via-gray-500/5 to-transparent",
    border: "border-gray-200 dark:border-gray-800",
    hoverBorder: "hover:border-gray-400 hover:shadow-gray-500/10",
    sla: "< 5 mins",
  },
};

const STATUS_STEPS: EmergencyStatus[] = [
  "TRIGGERED",
  "ASSIGNED",
  "RESPONDING",
  "ON_SCENE",
  "RESOLVED",
];

const SEVERITY_CONFIG: Record<
  EmergencySeverity,
  { label: string; bg: string; text: string; dot: string }
> = {
  CRITICAL: {
    label: "Critical",
    bg: "bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50",
    text: "text-red-700 dark:text-red-400",
    dot: "bg-red-500 animate-ping",
  },
  HIGH: {
    label: "High Priority",
    bg: "bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50",
    text: "text-orange-700 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  MEDIUM: {
    label: "Medium",
    bg: "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50",
    text: "text-amber-800 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  LOW: {
    label: "Low Priority",
    bg: "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
};

function formatTimeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  const hrs = Math.floor(diff / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function EmergencyCenter() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"sos" | "incidents" | "contacts" | "evacuation">("sos");
  const [incidents, setIncidents] = useState<EmergencyIncident[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<EmergencyIncident | null>(null);

  // Filter & Search states
  const [searchIncident, setSearchIncident] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [contactSearch, setContactSearch] = useState("");
  const [contactRoleFilter, setContactRoleFilter] = useState<string>("ALL");

  // SOS Trigger Modal
  const [sosCategory, setSosCategory] = useState<EmergencyCategory | null>(null);
  const [sosOpen, setSosOpen] = useState(false);
  const [sosForm, setSosForm] = useState({
    tower: user?.tower || "Tower A",
    flat: user?.flatNumber || "302",
    description: "",
    severity: "CRITICAL" as EmergencySeverity,
  });

  // Action Drawer / Notes
  const [updateNote, setUpdateNote] = useState("");
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: "success" | "warn" | "error" } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Auto-reload data
  const loadData = () => {
    const incs = emergencyService.getIncidents();
    setIncidents(incs);
    setContacts(emergencyService.getContacts());
    if (selectedIncident) {
      const match = incs.find((i) => i.id === selectedIncident.id);
      if (match) setSelectedIncident(match);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [selectedIncident?.id]);

  const showToast = (title: string, desc: string, type: "success" | "warn" | "error" = "success") => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // SOS Trigger Submission
  const handleTriggerSOS = () => {
    if (!sosCategory || !sosForm.tower.trim() || !sosForm.flat.trim()) {
      showToast("Missing Fields", "Please specify tower and flat number.", "warn");
      return;
    }

    const newInc = emergencyService.triggerSOS({
      category: sosCategory,
      tower: sosForm.tower.trim(),
      flatNumber: sosForm.flat.trim(),
      description: sosForm.description.trim() || `${CATEGORY_CONFIG[sosCategory].label} triggered by resident`,
      reportedBy: user?.fullName || "Resident",
      reportedByPhone: user?.phone || "+91 98450 12345",
    });

    setIncidents(emergencyService.getIncidents());
    setSelectedIncident(newInc);
    setSosOpen(false);
    setSosForm({
      tower: user?.tower || "Tower A",
      flat: user?.flatNumber || "302",
      description: "",
      severity: "CRITICAL",
    });
    setSosCategory(null);
    setActiveTab("incidents");
    showToast(
      "🚨 SOS Broadcast Activated",
      `Control room & responders notified for ${newInc.incidentNumber}. Stay in a safe position.`,
      "success"
    );
  };

  // Add Incident Update
  const handleAddUpdate = () => {
    if (!selectedIncident || !updateNote.trim()) return;
    emergencyService.updateIncidentStatus(
      selectedIncident.id,
      selectedIncident.status,
      updateNote.trim(),
      user?.fullName || "Resident"
    );
    loadData();
    setUpdateNote("");
    showToast("Update Logged", "Log appended to emergency incident audit trail.", "success");
  };

  // Manual Quick Action: Acknowledge, Dispatch, Arrive, Resolve
  const handleAdvanceStatus = (nextStatus: EmergencyStatus) => {
    if (!selectedIncident) return;
    if (nextStatus === "ACKNOWLEDGED") {
      emergencyService.acknowledgeIncident(selectedIncident.id, user?.fullName || "Operator");
    } else if (nextStatus === "ASSIGNED") {
      emergencyService.autoDispatch(selectedIncident.id, "Guard Unit Alpha", "Gate 1 First Responder");
    } else if (nextStatus === "ON_SCENE") {
      emergencyService.markOnScene(selectedIncident.id);
    } else if (nextStatus === "RESOLVED") {
      emergencyService.resolveIncident(selectedIncident.id, "Resolved on site. Situation clear.");
    }
    loadData();
    showToast("Incident Advanced", `Status updated to ${nextStatus}.`, "success");
  };

  // Filtered Incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const q = searchIncident.toLowerCase();
      const matchSearch =
        !q ||
        inc.title.toLowerCase().includes(q) ||
        inc.incidentNumber.toLowerCase().includes(q) ||
        inc.location.toLowerCase().includes(q) ||
        inc.reportedBy.toLowerCase().includes(q);

      const matchCategory = categoryFilter === "ALL" || inc.category === categoryFilter;
      const matchStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "ACTIVE"
          ? !["RESOLVED", "CLOSED"].includes(inc.status)
          : statusFilter === "RESOLVED"
          ? ["RESOLVED", "CLOSED"].includes(inc.status)
          : inc.status === statusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [incidents, searchIncident, categoryFilter, statusFilter]);

  // Filtered Contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const q = contactSearch.toLowerCase();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q);

      const matchRole =
        contactRoleFilter === "ALL"
          ? true
          : contactRoleFilter === "24x7"
          ? c.available24x7
          : contactRoleFilter === "MARSHAL"
          ? c.role.toLowerCase().includes("marshal")
          : true;

      return matchSearch && matchRole;
    });
  }, [contacts, contactSearch, contactRoleFilter]);

  const activeIncidentsCount = incidents.filter((i) => !["RESOLVED", "CLOSED"].includes(i.status)).length;
  const criticalIncidentsCount = incidents.filter(
    (i) => i.severity === "CRITICAL" && !["RESOLVED", "CLOSED"].includes(i.status)
  ).length;

  return (
    <div className="min-h-screen bg-[#F9FAFC] dark:bg-[#0B0F17] text-[#44475B] dark:text-[#E2E8F0] pb-16 antialiased">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md ${
              toastMessage.type === "error" || toastMessage.type === "warn"
                ? "bg-red-500/90 text-white border-red-400"
                : "bg-emerald-600/95 text-white border-emerald-400"
            }`}
          >
            <div className="p-1 rounded-full bg-white/20">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-xs">{toastMessage.title}</p>
              <p className="text-[11px] text-white/90">{toastMessage.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Hero & Emergency Command Banner (Groww Clean Slate) ──────── */}
      <div className="bg-white dark:bg-[#111827] border-b border-[#EBEFF2] dark:border-slate-800 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              {/* Status Pill Row */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEEFEF] dark:bg-red-950/50 text-[#DC2626] dark:text-red-400 border border-[#FCA5A5]/60">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping mr-1.5" />
                  24x7 EMERGENCY RESPONSE GRID
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E6FAF5] text-[#008767] border border-[#A7F3D0]">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#00D09C]" />
                  Control Room Online
                </span>
                <span className="text-xs text-[#7C7E8C] dark:text-slate-400 font-mono hidden sm:inline">
                  Hotline: 1800-MANA-SOS
                </span>
              </div>

              <h4 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#44475B] dark:text-white flex items-center gap-3">
                Emergency &amp; SOS Command Center
              </h4>
              <p className="text-xs sm:text-sm text-[#7C7E8C] dark:text-slate-400 mt-1 max-w-2xl">
                Immediate incident escalation, automatic tower marshal dispatch, live ambulance liaison, and smart gate lockdown protocols.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="inline-flex items-center px-3 py-2 bg-[#F1F4F7] hover:bg-[#E4E9EE] dark:bg-slate-800 dark:hover:bg-slate-700 text-[#44475B] dark:text-slate-200 text-xs font-bold rounded-xl border border-[#DFE4E8] dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
                title="Toggle Emergency Audio Alert"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 mr-1 text-emerald-600" />
                ) : (
                  <VolumeX className="w-4 h-4 mr-1 text-slate-400" />
                )}
                {soundEnabled ? "Siren Alert: Active" : "Muted"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSosCategory("MEDICAL");
                  setSosOpen(true);
                }}
                className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md shadow-red-500/20 transition-all cursor-pointer active:scale-95"
              >
                <AlertTriangle className="w-4 h-4 mr-1.5 animate-bounce" />
                Instant SOS Panic
              </button>
            </div>
          </div>

          {/* ── Real-Time SLA Metric Counters (Clean Groww-style tiles) ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#EBEFF2] dark:border-slate-800">
            <div className="bg-[#F9FAFC] dark:bg-slate-900/60 rounded-2xl p-3.5 border border-[#EBEFF2] dark:border-slate-800 transition-all shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#7C7E8C] dark:text-slate-400 font-medium">
                <span>Active Incidents</span>
                <span className={`w-2 h-2 rounded-full ${activeIncidentsCount > 0 ? "bg-red-500 animate-ping" : "bg-emerald-500"}`} />
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#44475B] dark:text-white mt-1">
                {activeIncidentsCount}
              </div>
              <div className="text-[10px] text-[#7C7E8C] dark:text-slate-500 mt-0.5">
                {criticalIncidentsCount > 0 ? `${criticalIncidentsCount} critical priority` : "Normal campus state"}
              </div>
            </div>

            <div className="bg-[#F9FAFC] dark:bg-slate-900/60 rounded-2xl p-3.5 border border-[#EBEFF2] dark:border-slate-800 transition-all shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#7C7E8C] dark:text-slate-400 font-medium">
                <span>Medical SLA</span>
                <HeartPulse className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#008767] dark:text-emerald-400 mt-1">
                &lt; 5 mins
              </div>
              <div className="text-[10px] text-[#7C7E8C] dark:text-slate-500 mt-0.5">On-site paramedic ETA</div>
            </div>

            <div className="bg-[#F9FAFC] dark:bg-slate-900/60 rounded-2xl p-3.5 border border-[#EBEFF2] dark:border-slate-800 transition-all shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#7C7E8C] dark:text-slate-400 font-medium">
                <span>Lift Trapped SLA</span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                &lt; 15 mins
              </div>
              <div className="text-[10px] text-[#7C7E8C] dark:text-slate-500 mt-0.5">Technician response target</div>
            </div>

            <div className="bg-[#F9FAFC] dark:bg-slate-900/60 rounded-2xl p-3.5 border border-[#EBEFF2] dark:border-slate-800 transition-all shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#7C7E8C] dark:text-slate-400 font-medium">
                <span>Tower Marshals</span>
                <UserCheck className="w-4 h-4 text-[#00D09C]" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#008767] dark:text-emerald-400 mt-1">
                8 Active
              </div>
              <div className="text-[10px] text-[#7C7E8C] dark:text-slate-500 mt-0.5">Stationed across towers</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Sub-Navigation Tabs ──────────────────────────────────── */}
      <div className="bg-white dark:bg-[#111827] border-b border-[#EBEFF2] dark:border-slate-800 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 hide-scrollbar">
            {[
              { id: "sos", label: "SOS Quick Triggers", icon: AlertTriangle, count: null },
              { id: "incidents", label: "Live Incidents Stream", icon: Radio, count: activeIncidentsCount },
              { id: "contacts", label: "Emergency Contacts", icon: Phone, count: contacts.length },
              { id: "evacuation", label: "Evacuation & Protocol", icon: Shield, count: null },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`inline-flex items-center px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer border ${
                    active
                      ? "bg-[#E6FAF5] dark:bg-emerald-950/40 text-[#008767] dark:text-emerald-400 border-[#A7F3D0] dark:border-emerald-800 shadow-2xs"
                      : "border-transparent text-[#7C7E8C] dark:text-slate-400 hover:text-[#44475B] dark:hover:text-white hover:bg-[#F9FAFC] dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 mr-2 ${
                      active ? "text-[#00D09C]" : "text-[#9CA3AF]"
                    }`}
                  />
                  {tab.label}
                  {tab.count !== null && (
                    <span
                      className={`ml-2 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        active
                          ? "bg-[#00D09C] text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Main Tab Content ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ══════════════════════════════════════════════════════════════
            TAB 1: SOS QUICK TRIGGERS & FIRST-RESPONSE TILES
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === "sos" && (
          <div className="space-y-6">
            {/* Banner Guide */}
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-2xl space-y-2">
                <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white">
                  <ShieldAlert className="w-3.5 h-3.5" /> High-Priority Resident Safety
                </div>
                <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white">
                  Select an Emergency Category to Trigger Assistance
                </h2>
                <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
                  Triggering an SOS alerts the main security gate, broadcasts to active patrolling guards with your flat location, and rings on-call medics immediately.
                </p>
              </div>

              {/* Quick Gate Lockdown Control for Admin/Staff */}
              <div className="mt-5 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-white/90 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-white" /> Emergency Gate Smart Barriers:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Execute Smart Lockdown on all outer security gate barriers?")) {
                        sosService.executeLockdown({
                          directive: "LOCKDOWN_CLOSE_ALL",
                          affectedGates: "ALL_GATES",
                          reason: "Emergency Gate Lockdown triggered from dashboard",
                        });
                        showToast("Gate Barriers Locked", "All peripheral entry/exit barriers secured.", "warn");
                      }
                    }}
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl border border-white/30 transition-all cursor-pointer"
                  >
                    Lockdown All Gates
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Open all emergency evacuation boom barriers?")) {
                        sosService.executeLockdown({
                          directive: "EVACUATION_OPEN_ALL",
                          affectedGates: "ALL_GATES",
                          reason: "Evacuation boom barrier release",
                        });
                        showToast("Evacuation Open", "Barriers held open for emergency exit.", "success");
                      }
                    }}
                    className="px-3 py-1.5 bg-white text-red-600 font-extrabold rounded-xl hover:bg-white/90 transition-all cursor-pointer shadow-sm"
                  >
                    Open Evacuation Gates
                  </button>
                </div>
              </div>
            </div>

            {/* Emergency Category Buttons Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#44475B] dark:text-slate-300">
                  Select Emergency Category
                </h3>
                <span className="text-xs text-[#7C7E8C]">1-click rapid dialog</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {(Object.entries(CATEGORY_CONFIG) as [EmergencyCategory, (typeof CATEGORY_CONFIG)[EmergencyCategory]][]).map(
                  ([cat, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={cat}
                        onClick={() => {
                          setSosCategory(cat);
                          setSosOpen(true);
                        }}
                        className={`group relative bg-white dark:bg-[#111827] rounded-2xl p-4 border ${cfg.border} ${cfg.hoverBorder} transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                            style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
                          >
                            <Icon className="w-6 h-6" />
                          </div>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.badgeText}`}
                          >
                            {cfg.sla}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-sm text-[#44475B] dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                            {cfg.label}
                          </h4>
                          <p className="text-[11px] text-[#7C7E8C] dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {cfg.sublabel}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold" style={{ color: cfg.color }}>
                          <span>Trigger SOS</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Standard Response Protocol Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-xs space-y-2">
                <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
                  <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/50">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-sm">Medical Response SLA</h4>
                </div>
                <p className="text-xs text-[#7C7E8C] dark:text-slate-400 leading-relaxed">
                  Community Paramedic equipped with AED &amp; trauma kit dispatched within <strong>5 minutes</strong>. Hospital ambulance liaison automatically queued at Gate 2.
                </p>
              </div>

              <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-amber-100 dark:border-amber-900/30 shadow-xs space-y-2">
                <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-sm">Lift Entrapment SLA</h4>
                </div>
                <p className="text-xs text-[#7C7E8C] dark:text-slate-400 leading-relaxed">
                  Automated ARD (Automatic Rescue Device) checks initiated. Trained OEM Lift technician dispatched within <strong>15 minutes</strong> with primary priority for elderly/infants.
                </p>
              </div>

              <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-xs space-y-2">
                <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-sm">Tower Marshals Active</h4>
                </div>
                <p className="text-xs text-[#7C7E8C] dark:text-slate-400 leading-relaxed">
                  Every tower has certified volunteer marshals trained in fire hose reel deployment, stairwell evacuation, and elderly evacuation chairs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 2: LIVE INCIDENTS STREAM & INCIDENT DETAILS
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === "incidents" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-[#EBEFF2] dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by incident number, flat, location, reporter..."
                  value={searchIncident}
                  onChange={(e) => setSearchIncident(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#F9FAFC] dark:bg-slate-900 border border-[#EBEFF2] dark:border-slate-800 rounded-xl text-xs text-[#44475B] dark:text-white focus:outline-none focus:border-[#00D09C]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 text-xs rounded-xl border-[#EBEFF2] dark:border-slate-800 w-[140px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active Only</SelectItem>
                    <SelectItem value="TRIGGERED">Triggered</SelectItem>
                    <SelectItem value="RESPONDING">Responding</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-9 text-xs rounded-xl border-[#EBEFF2] dark:border-slate-800 w-[150px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    {(Object.keys(CATEGORY_CONFIG) as EmergencyCategory[]).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_CONFIG[cat].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <button
                  type="button"
                  onClick={loadData}
                  className="p-2 rounded-xl border border-[#EBEFF2] dark:border-slate-800 text-[#7C7E8C] hover:text-[#44475B] hover:bg-slate-50 dark:hover:bg-slate-800"
                  title="Refresh Incident Stream"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dual Pane: Master List + Incident Workspace Detail */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Incidents List */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#7C7E8C] px-1">
                  <span>Incidents ({filteredIncidents.length})</span>
                  <span>Chronological feed</span>
                </div>

                {filteredIncidents.length === 0 ? (
                  <div className="bg-white dark:bg-[#111827] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <h4 className="font-bold text-sm text-[#44475B] dark:text-white">All Clear</h4>
                    <p className="text-xs text-[#7C7E8C]">No matching emergency incidents recorded.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1 hide-scrollbar">
                    {filteredIncidents.map((inc) => {
                      const cfg = CATEGORY_CONFIG[inc.category] || CATEGORY_CONFIG.OTHER;
                      const Icon = cfg.icon;
                      const sev = SEVERITY_CONFIG[inc.severity] || SEVERITY_CONFIG.MEDIUM;
                      const isSelected = selectedIncident?.id === inc.id;
                      const isResolved = inc.status === "RESOLVED" || inc.status === "CLOSED";

                      return (
                        <div
                          key={inc.id}
                          onClick={() => setSelectedIncident(inc)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-white dark:bg-slate-900 border-[#00D09C] ring-2 ring-[#00D09C]/20 shadow-sm"
                              : "bg-white dark:bg-[#111827] border-[#EBEFF2] dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-3">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-bold text-sm text-[#44475B] dark:text-white">
                                    {inc.title}
                                  </h4>
                                </div>
                                <p className="text-xs text-[#7C7E8C] dark:text-slate-400 mt-0.5">
                                  {inc.incidentNumber} • {formatTimeAgo(inc.reportedAt)}
                                </p>
                              </div>
                            </div>

                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${sev.bg} ${sev.text}`}>
                              {sev.label}
                            </span>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-[#7C7E8C] dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {inc.location}
                            </span>
                            <span
                              className={`font-extrabold text-[11px] px-2 py-0.5 rounded-md ${
                                isResolved
                                  ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                              }`}
                            >
                              {inc.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Incident Workspace Details */}
              <div className="lg:col-span-7">
                {selectedIncident ? (
                  <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#EBEFF2] dark:border-slate-800 p-6 shadow-xs space-y-6">
                    {/* Header Details */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#008767] bg-[#E6FAF5] px-2 py-0.5 rounded-md">
                            {selectedIncident.incidentNumber}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                              SEVERITY_CONFIG[selectedIncident.severity]?.bg
                            } ${SEVERITY_CONFIG[selectedIncident.severity]?.text}`}
                          >
                            {selectedIncident.severity}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-[#44475B] dark:text-white mt-1.5">
                          {selectedIncident.title}
                        </h3>
                        <p className="text-xs text-[#7C7E8C] flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-red-500" />
                          {selectedIncident.location} • Reported by {selectedIncident.reportedBy} ({selectedIncident.reportedByPhone})
                        </p>
                      </div>

                      {/* Rapid Operator Controls */}
                      <div className="flex items-center gap-2">
                        {selectedIncident.status === "TRIGGERED" && (
                          <Button
                            size="sm"
                            onClick={() => handleAdvanceStatus("ACKNOWLEDGED")}
                            className="bg-[#00D09C] hover:bg-[#008767] text-white text-xs font-bold rounded-xl"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Acknowledge
                          </Button>
                        )}
                        {(selectedIncident.status === "TRIGGERED" ||
                          selectedIncident.status === "ACKNOWLEDGED") && (
                          <Button
                            size="sm"
                            onClick={() => handleAdvanceStatus("ASSIGNED")}
                            className="bg-primary text-white text-xs font-bold rounded-xl"
                          >
                            <UserCheck className="w-3.5 h-3.5 mr-1" /> Dispatch Guard
                          </Button>
                        )}
                        {selectedIncident.status === "ASSIGNED" && (
                          <Button
                            size="sm"
                            onClick={() => handleAdvanceStatus("ON_SCENE")}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl"
                          >
                            <MapPin className="w-3.5 h-3.5 mr-1" /> Mark On-Scene
                          </Button>
                        )}
                        {selectedIncident.status !== "RESOLVED" &&
                          selectedIncident.status !== "CLOSED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAdvanceStatus("RESOLVED")}
                              className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 text-xs font-bold rounded-xl"
                            >
                              Resolve
                            </Button>
                          )}
                      </div>
                    </div>

                    {/* Visual 5-Stage Stepper Pipeline */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#7C7E8C]">
                        Incident Response Pipeline
                      </span>
                      <div className="grid grid-cols-5 gap-1 pt-1">
                        {STATUS_STEPS.map((step, idx) => {
                          const currentIdx = STATUS_STEPS.indexOf(selectedIncident.status);
                          const isDone = idx <= currentIdx;
                          const isCurrent = idx === currentIdx;

                          return (
                            <div key={step} className="flex flex-col items-center text-center">
                              <div
                                className={`h-2.5 w-full rounded-full transition-all ${
                                  isDone
                                    ? "bg-gradient-to-r from-[#00D09C] to-[#008767]"
                                    : "bg-slate-100 dark:bg-slate-800"
                                }`}
                              />
                              <span
                                className={`text-[10px] mt-1.5 font-bold ${
                                  isCurrent
                                    ? "text-[#008767] dark:text-[#00D09C]"
                                    : isDone
                                    ? "text-slate-600 dark:text-slate-400"
                                    : "text-slate-300 dark:text-slate-600"
                                }`}
                              >
                                {step.replace("_", " ")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Assigned Responder Tile */}
                    {selectedIncident.assignedResponder && (
                      <div className="bg-[#F9FAFC] dark:bg-slate-900/60 p-4 rounded-2xl border border-[#EBEFF2] dark:border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                            {selectedIncident.assignedResponder.charAt(0)}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">
                              Assigned First Responder
                            </span>
                            <h4 className="font-bold text-sm text-[#44475B] dark:text-white">
                              {selectedIncident.assignedResponder}
                            </h4>
                            <span className="text-xs text-blue-600 font-medium">
                              {selectedIncident.responderRole}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {selectedIncident.etaMinutes && (
                            <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                              ETA: {selectedIncident.etaMinutes}m
                            </span>
                          )}
                          <a
                            href={`tel:${selectedIncident.responderPhone}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                          >
                            <Phone className="w-3.5 h-3.5" /> Call
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Audit Timeline */}
                    <div className="space-y-3">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#7C7E8C]">
                        Live Incident Audit Trail
                      </span>
                      <div className="space-y-2 border-l-2 border-slate-100 dark:border-slate-800 ml-2 pl-4 py-1">
                        {selectedIncident.updates.map((u) => (
                          <div key={u.id} className="relative text-xs space-y-0.5">
                            <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#00D09C] ring-4 ring-white dark:ring-[#111827]" />
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-[#44475B] dark:text-slate-200">
                                {u.author}
                              </span>
                              <span className="text-[10px] text-slate-400">{formatTimeAgo(u.timestamp)}</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                              {u.note}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Add Log Form */}
                    <div className="pt-2 flex gap-2">
                      <Input
                        placeholder="Append status log, arrival notes, or hospital dispatch update..."
                        value={updateNote}
                        onChange={(e) => setUpdateNote(e.target.value)}
                        className="text-xs rounded-xl"
                      />
                      <Button
                        size="sm"
                        onClick={handleAddUpdate}
                        className="bg-[#00D09C] hover:bg-[#008767] text-white font-bold rounded-xl shrink-0"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add Note
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-[#111827] rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 space-y-2">
                    <Radio className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                    <h4 className="font-bold text-sm text-[#44475B] dark:text-slate-200">
                      No Incident Selected
                    </h4>
                    <p className="text-xs text-[#7C7E8C] max-w-sm mx-auto">
                      Select any emergency report from the list to view its real-time response pipeline, responder contact, and append updates.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 3: EMERGENCY CONTACTS DIRECTORY
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === "contacts" && (
          <div className="space-y-4">
            {/* Contact search and filter bar */}
            <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-[#EBEFF2] dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex-1 w-full relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search contacts by name, role, tower or telephone..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#F9FAFC] dark:bg-slate-900 border border-[#EBEFF2] dark:border-slate-800 rounded-xl text-xs text-[#44475B] dark:text-white focus:outline-none focus:border-[#00D09C]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select value={contactRoleFilter} onValueChange={setContactRoleFilter}>
                  <SelectTrigger className="h-9 text-xs rounded-xl border-[#EBEFF2] dark:border-slate-800 w-full sm:w-[150px]">
                    <SelectValue placeholder="All Contacts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Contacts</SelectItem>
                    <SelectItem value="24x7">24x7 Priority Only</SelectItem>
                    <SelectItem value="MARSHAL">Tower Marshals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Contacts Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredContacts.map((c) => (
                <div
                  key={c.id}
                  className="bg-white dark:bg-[#111827] rounded-2xl border border-[#EBEFF2] dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center font-bold">
                        <Phone className="w-5 h-5" />
                      </div>
                      {c.available24x7 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200">
                          24x7 Ready
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-[#44475B] dark:text-white">
                        {c.name}
                      </h4>
                      <p className="text-xs text-[#7C7E8C] dark:text-slate-400 mt-0.5">
                        {c.role}
                      </p>
                      {c.coversTower && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-purple-700 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md">
                          Covers Tower {c.coversTower}
                        </span>
                      )}
                    </div>
                  </div>

                  <a
                    href={`tel:${c.phone}`}
                    className="inline-flex items-center justify-center gap-2 w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call {c.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 4: EVACUATION & SAFETY PROTOCOLS
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === "evacuation" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Fire Evacuation */}
              <div className="bg-white dark:bg-[#111827] rounded-3xl border border-orange-100 dark:border-orange-900/30 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3 text-orange-600">
                  <div className="p-2.5 rounded-2xl bg-orange-50 dark:bg-orange-950/50">
                    <Flame className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-[#44475B] dark:text-white">
                      Fire Evacuation Protocol
                    </h3>
                    <p className="text-[11px] text-[#7C7E8C]">Tower stairwell procedure</p>
                  </div>
                </div>

                <ol className="space-y-2 text-xs text-[#44475B] dark:text-slate-300">
                  {[
                    "Pull manual call station (MCP) at floor lobby immediately",
                    "Do NOT use elevators under any circumstances — use fire escape stairs",
                    "Feel door handles before opening; stay low if smoke is present",
                    "Assemble at Main Lawn (Gate 1 perimeter) and report to Tower Marshal",
                    "Assist senior citizens and children; do not re-enter for belongings",
                  ].map((step, idx) => (
                    <li key={idx} className="flex gap-2.5 items-start">
                      <span className="font-black text-orange-600 shrink-0 w-4">{idx + 1}.</span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Lift Trapped */}
              <div className="bg-white dark:bg-[#111827] rounded-3xl border border-amber-100 dark:border-amber-900/30 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3 text-amber-600">
                  <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-[#44475B] dark:text-white">
                      Lift Trapped Procedure
                    </h3>
                    <p className="text-[11px] text-[#7C7E8C]">Safe passenger extraction</p>
                  </div>
                </div>

                <ol className="space-y-2 text-xs text-[#44475B] dark:text-slate-300">
                  {[
                    "Stay calm. Lifts are mechanically supported with multiple safety cables",
                    "Press and hold the yellow ALARM bell and INTERCOM inside cabin",
                    "Do NOT try to pry open lift doors between floors",
                    "Trained technician dispatched via ARD with key within 15 mins",
                    "Ventilation fans remain operational via battery emergency backup",
                  ].map((step, idx) => (
                    <li key={idx} className="flex gap-2.5 items-start">
                      <span className="font-black text-amber-600 shrink-0 w-4">{idx + 1}.</span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Assembly Points */}
              <div className="bg-white dark:bg-[#111827] rounded-3xl border border-emerald-100 dark:border-emerald-900/30 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3 text-emerald-600">
                  <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-[#44475B] dark:text-white">
                      Designated Assembly Points
                    </h3>
                    <p className="text-[11px] text-[#7C7E8C]">Safe zones outside podium</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {[
                    { tower: "Tower A & B", location: "Main Lawn (Gate 1)", cap: "350 persons" },
                    { tower: "Tower C & D", location: "Clubhouse Open Plaza", cap: "300 persons" },
                    { tower: "Villas & Row Houses", location: "Cricket Nets Ground", cap: "200 persons" },
                    { tower: "Entire Society", location: "Outer Ring Road (Gate 2)", cap: "Unlimited" },
                  ].map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-xs text-emerald-900 dark:text-emerald-300">
                          {p.tower} → {p.location}
                        </h4>
                        <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400">
                          Capacity: {p.cap}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── SOS Trigger Modal (Clean Dialog with High-Contrast Warning) ── */}
      <Dialog open={sosOpen} onOpenChange={setSosOpen}>
        <DialogContent className="max-w-md rounded-3xl border-2 border-red-500 bg-white dark:bg-[#111827]">
          <DialogHeader className="space-y-2 text-left">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto sm:mx-0 shadow-inner">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-red-600">
                Trigger {sosCategory ? CATEGORY_CONFIG[sosCategory].label : "Emergency SOS"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                This broadcast alerts the control room, gate marshals, and on-duty medics with instant audio sirens.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                Emergency Category
              </label>
              <Select
                value={sosCategory || "MEDICAL"}
                onValueChange={(v) => setSosCategory(v as EmergencyCategory)}
              >
                <SelectTrigger className="text-xs rounded-xl border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Select Emergency" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_CONFIG) as EmergencyCategory[]).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_CONFIG[cat].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Tower / Block
                </label>
                <Input
                  placeholder="e.g. Tower A"
                  value={sosForm.tower}
                  onChange={(e) => setSosForm((f) => ({ ...f, tower: e.target.value }))}
                  className="text-xs rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Flat Number
                </label>
                <Input
                  placeholder="e.g. 302"
                  value={sosForm.flat}
                  onChange={(e) => setSosForm((f) => ({ ...f, flat: e.target.value }))}
                  className="text-xs rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                Details or Medical Symptoms (Optional)
              </label>
              <Textarea
                rows={3}
                placeholder="e.g. Resident having breathing difficulty, needs stretcher at lift lobby..."
                value={sosForm.description}
                onChange={(e) => setSosForm((f) => ({ ...f, description: e.target.value }))}
                className="text-xs rounded-xl"
              />
            </div>

            <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900 text-[11px] text-red-700 dark:text-red-300 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-red-600" />
              <span>
                First responders will receive your phone number and floor number immediately. Stay calm.
              </span>
            </div>
          </div>

          <DialogFooter className="flex sm:justify-between items-center gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setSosOpen(false)}
              className="rounded-xl text-xs w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTriggerSOS}
              className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-red-500/25 w-full sm:w-auto"
            >
              <AlertTriangle className="w-4 h-4 mr-1.5" /> Confirm SOS Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
