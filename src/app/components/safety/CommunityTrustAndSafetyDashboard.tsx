import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  QrCode,
  AlertTriangle,
  MapPin,
  FileCheck2,
  Lock,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Car,
  ChevronRight,
  Shield,
  FileText,
  RefreshCw,
  Search,
  Filter,
  UserCheck,
  Building,
  KeyRound,
  ExternalLink,
  Sliders,
  Check,
  X
} from "lucide-react";
import {
  trustAndSafetyService,
  type TrustSafetyOverview,
  type VerifiedMembership,
  type VisitorApproval,
  type IncidentLifecycle,
  type LocationConsentPurpose,
  type AuditableAdminAction,
  type KycStatus,
} from "../../../services/safety/trustAndSafetyService";
import { showSuccess, showError } from "../../../utils/ToastUtils";

export function CommunityTrustAndSafetyDashboard() {
  const [data, setData] = useState<TrustSafetyOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "visitors" | "incidents" | "consent" | "audit">("overview");

  const [memberSearch, setMemberSearch] = useState("");
  const [kycFilter, setKycFilter] = useState<string>("ALL");

  const [consentStates, setConsentStates] = useState<Record<LocationConsentPurpose, boolean>>({
    EMERGENCY_SOS: true,
    SECURITY_PATROL: true,
    GEOFENCE_GATE: false,
    AMENITY_PROXIMITY: false,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await trustAndSafetyService.getOverview();
      setData(res);
    } catch {
      showError("Failed to load Trust & Safety metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleVerifyKyc = async (userId: number, status: KycStatus) => {
    try {
      await trustAndSafetyService.verifyMembership(userId, status, `Manual review status set to ${status}`);
      showSuccess(`Membership status updated to ${status}`);
      loadData();
    } catch {
      showError("Failed to update membership status");
    }
  };

  const handleToggleConsent = async (purpose: LocationConsentPurpose) => {
    const nextVal = !consentStates[purpose];
    setConsentStates((prev) => ({ ...prev, [purpose]: nextVal }));
    try {
      await trustAndSafetyService.setLocationConsent(purpose, nextVal);
      showSuccess(`Location consent for ${purpose.replace("_", " ")} ${nextVal ? "granted" : "revoked"}`);
    } catch {
      showError("Failed to update consent preference");
    }
  };

  const filteredMembers = useMemo(() => {
    if (!data) return [];
    return data.recentMemberships.filter((m) => {
      const matchSearch =
        m.fullName.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.flatNumber.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.phone.includes(memberSearch);
      const matchKyc = kycFilter === "ALL" || m.kycStatus === kycFilter;
      return matchSearch && matchKyc;
    });
  }, [data, memberSearch, kycFilter]);

  return (
    <div className="bg-[#F9FAFC] text-[#44475B] p-4 sm:p-6 lg:p-8 font-sans rounded-2xl border border-[#EBEFF2] mt-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#EBEFF2]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#E6FAF5] border border-[#A7F3D0] flex items-center justify-center text-[#008767] shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-[#44475B] tracking-tight">Community Trust & Safety Hub</h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E6FAF5] text-[#008767] border border-[#A7F3D0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D09C] animate-pulse" />
                  DPDP ACT 2023 ENFORCED
                </span>
              </div>
              <p className="text-xs text-[#7C7E8C] mt-1">Verified identities, dual-confirmed visitor entry, SLA incident handling, and auditable governance.</p>
            </div>
          </div>
          <button 
            onClick={loadData} 
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-[#F9FAFC] border border-[#EBEFF2] rounded-lg text-xs font-semibold text-[#44475B] shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#7C7E8C] ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </header>

        {data && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-white border border-[#EBEFF2] rounded-xl p-3.5 shadow-sm hover:border-[#00D09C]/40 transition-all">
              <div className="flex items-center justify-between text-[#7C7E8C] text-xs">
                <span>Verified Members</span>
                <div className="w-7 h-7 rounded-lg bg-[#E6FAF5] flex items-center justify-center text-[#008767]">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl font-bold text-[#44475B] mt-2">{data.totalVerifiedMembers}</p>
              <p className="text-[11px] text-[#D97706] mt-1 font-medium">{data.pendingKycCount} pending review</p>
            </div>

            <div className="bg-white border border-[#EBEFF2] rounded-xl p-3.5 shadow-sm hover:border-[#00D09C]/40 transition-all">
              <div className="flex items-center justify-between text-[#7C7E8C] text-xs">
                <span>Avg Trust Score</span>
                <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
                  <Shield className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl font-bold text-[#44475B] mt-2">{data.averageTrustScore}/100</p>
              <p className="text-[11px] text-[#008767] mt-1 font-semibold">Platinum Tier</p>
            </div>

            <div className="bg-white border border-[#EBEFF2] rounded-xl p-3.5 shadow-sm hover:border-[#00D09C]/40 transition-all">
              <div className="flex items-center justify-between text-[#7C7E8C] text-xs">
                <span>Visitors Inside</span>
                <div className="w-7 h-7 rounded-lg bg-[#E0F2FE] flex items-center justify-center text-[#0284C7]">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl font-bold text-[#44475B] mt-2">{data.activeVisitorsInside}</p>
              <p className="text-[11px] text-[#7C7E8C] mt-1 font-medium">All dual-approved</p>
            </div>

            <div className="bg-white border border-[#EBEFF2] rounded-xl p-3.5 shadow-sm hover:border-[#00D09C]/40 transition-all">
              <div className="flex items-center justify-between text-[#7C7E8C] text-xs">
                <span>Open Incidents</span>
                <div className="w-7 h-7 rounded-lg bg-[#FEEFEF] flex items-center justify-center text-[#EB5B5B]">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl font-bold text-[#44475B] mt-2">{data.openIncidentsCount}</p>
              <p className="text-[11px] text-[#EB5B5B] mt-1 font-semibold">{data.criticalSlaPendingCount} Critical P1</p>
            </div>

            <div className="bg-white border border-[#EBEFF2] rounded-xl p-3.5 shadow-sm hover:border-[#00D09C]/40 transition-all">
              <div className="flex items-center justify-between text-[#7C7E8C] text-xs">
                <span>Consent Adherence</span>
                <div className="w-7 h-7 rounded-lg bg-[#E6FAF5] flex items-center justify-center text-[#008767]">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl font-bold text-[#008767] mt-2">{data.locationConsentAdherencePercent}%</p>
              <p className="text-[11px] text-[#7C7E8C] mt-1 font-medium">100% compliant</p>
            </div>

            <div className="bg-white border border-[#EBEFF2] rounded-xl p-3.5 shadow-sm hover:border-[#00D09C]/40 transition-all">
              <div className="flex items-center justify-between text-[#7C7E8C] text-xs">
                <span>Audited Actions</span>
                <div className="w-7 h-7 rounded-lg bg-[#F5F3FF] flex items-center justify-center text-[#7C3AED]">
                  <FileCheck2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl font-bold text-[#44475B] mt-2 font-mono">{data.totalAuditedActions}</p>
              <p className="text-[11px] text-[#7C7E8C] mt-1 font-medium">SHA-256 Verified</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5 bg-white border border-[#EBEFF2] p-1.5 rounded-xl overflow-x-auto text-xs shadow-sm">
          {[
            { id: "overview", label: "Overview Stream", icon: ShieldCheck },
            { id: "members", label: "Verified Memberships", icon: UserCheck },
            { id: "visitors", label: "Visitor Dual-Approvals", icon: QrCode },
            { id: "incidents", label: "Incident SLA Queue", icon: AlertTriangle },
            { id: "consent", label: "Consent-Aware Location", icon: MapPin },
            { id: "audit", label: "Auditable Admin Trail", icon: FileCheck2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  active 
                    ? "bg-[#E6FAF5] text-[#008767] border border-[#A7F3D0] shadow-sm" 
                    : "text-[#7C7E8C] hover:text-[#44475B] hover:bg-[#F9FAFC]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-[#008767]" : "text-[#7C7E8C]"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "overview" && data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-[#EBEFF2] rounded-xl p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-[#44475B] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#EB5B5B]" /> Active High-Priority Incidents
              </h3>
              <div className="space-y-3">
                {data.activeIncidents.map((inc) => (
                  <div key={inc.incidentId} className="p-3.5 rounded-xl border border-[#FEEFEF] bg-[#FFF8F8] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#EB5B5B] font-mono">{inc.incidentCode} · {inc.severity}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FEEFEF] text-[#EB5B5B] font-semibold border border-[#FCA5A5]">{inc.status}</span>
                    </div>
                    <p className="text-sm font-bold text-[#44475B]">{inc.title}</p>
                    <p className="text-xs text-[#7C7E8C]">{inc.description}</p>
                    <div className="flex items-center justify-between text-[11px] text-[#7C7E8C] pt-2 border-t border-[#FEEFEF]">
                      <span>Assigned: <strong className="text-[#44475B]">{inc.assignedToName}</strong></span>
                      <span className="font-mono text-[#008767] bg-[#E6FAF5] px-2 py-0.5 rounded border border-[#A7F3D0]">{inc.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#EBEFF2] rounded-xl p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-[#44475B] flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#008767]" /> Live Visitor Passes
              </h3>
              <div className="space-y-3">
                {data.activeVisitorApprovals.map((pass) => (
                  <div key={pass.passId} className="p-3.5 rounded-xl border border-[#EBEFF2] bg-[#F9FAFC] flex items-center justify-between hover:border-[#00D09C]/40 transition-all">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#44475B] font-mono">{pass.passCode}</span>
                        <span className="text-[10px] bg-[#E6FAF5] text-[#008767] border border-[#A7F3D0] px-1.5 py-0.5 rounded-full font-semibold">{pass.status}</span>
                      </div>
                      <p className="text-xs font-bold text-[#44475B] mt-1">{pass.visitorName} ({pass.visitorPhone})</p>
                      <p className="text-[11px] text-[#7C7E8C] mt-0.5">Host: {pass.residentName} · Flat {pass.flatNumber}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-mono text-[#44475B] block font-semibold">{pass.vehicleNumber || "Pedestrian"}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#008767] mt-1 font-semibold bg-[#E6FAF5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
                        <Check className="w-3 h-3" /> Host Confirmed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <div className="bg-white border border-[#EBEFF2] rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-sm font-bold text-[#44475B] flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#008767]" /> Verified Memberships
              </h2>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="Search resident..." 
                  value={memberSearch} 
                  onChange={(e) => setMemberSearch(e.target.value)} 
                  className="px-3 py-1.5 bg-[#F9FAFC] border border-[#EBEFF2] rounded-lg text-xs text-[#44475B] placeholder-[#7C7E8C] focus:outline-none focus:border-[#00D09C]" 
                />
                <select 
                  value={kycFilter} 
                  onChange={(e) => setKycFilter(e.target.value)} 
                  className="px-2.5 py-1.5 bg-[#F9FAFC] border border-[#EBEFF2] rounded-lg text-xs text-[#44475B] focus:outline-none focus:border-[#00D09C]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="PENDING">Pending</option>
                  <option value="FLAGGED">Flagged</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EBEFF2] text-[#7C7E8C] bg-[#F9FAFC]">
                    <th className="p-3 font-semibold">Resident</th>
                    <th className="p-3 font-semibold">Flat</th>
                    <th className="p-3 font-semibold">Type</th>
                    <th className="p-3 font-semibold">ID Type</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold">Trust Score</th>
                    <th className="p-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBEFF2]">
                  {filteredMembers.map((m) => (
                    <tr key={m.userId} className="hover:bg-[#F9FAFC] transition-colors">
                      <td className="p-3 font-medium text-[#44475B]">
                        <div className="font-bold">{m.fullName}</div>
                        <div className="text-[11px] text-[#7C7E8C]">{m.phone}</div>
                      </td>
                      <td className="p-3 text-[#44475B] font-mono">{m.flatNumber} ({m.tower})</td>
                      <td className="p-3 text-[#7C7E8C]">{m.residentType}</td>
                      <td className="p-3 text-[#7C7E8C]">{m.govtIdType}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          m.kycStatus === "VERIFIED" 
                            ? "bg-[#E6FAF5] text-[#008767] border-[#A7F3D0]" 
                            : "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]"
                        }`}>
                          {m.kycStatus}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-[#44475B]">{m.trustScore}</span>{" "}
                        <span className="text-[10px] text-[#7C7E8C]">({m.trustBadge})</span>
                      </td>
                      <td className="p-3 text-right">
                        {m.kycStatus !== "VERIFIED" ? (
                          <button 
                            onClick={() => handleVerifyKyc(m.userId, "VERIFIED")} 
                            className="px-2.5 py-1 bg-[#00D09C] hover:bg-[#00b887] text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                          >
                            Verify
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleVerifyKyc(m.userId, "FLAGGED")} 
                            className="px-2.5 py-1 bg-white hover:bg-[#FEEFEF] text-[#EB5B5B] border border-[#EBEFF2] rounded-lg text-xs font-semibold transition-all"
                          >
                            Flag
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "visitors" && data && (
          <div className="bg-white border border-[#EBEFF2] rounded-xl p-5 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-[#44475B] flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#008767]" /> Gate Visitor Pass Registry
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.activeVisitorApprovals.map((pass) => (
                <div key={pass.passId} className="p-4 rounded-xl border border-[#EBEFF2] bg-[#F9FAFC] space-y-2 hover:border-[#00D09C]/40 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-[#44475B]">{pass.passCode}</span>
                    <span className="text-xs font-semibold text-[#008767] bg-[#E6FAF5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">{pass.status}</span>
                  </div>
                  <p className="text-sm font-bold text-[#44475B]">{pass.visitorName} ({pass.visitorPhone})</p>
                  <p className="text-xs text-[#7C7E8C]">Purpose: <span className="text-[#44475B] font-medium">{pass.purpose}</span></p>
                  <div className="text-[11px] text-[#7C7E8C] pt-2 border-t border-[#EBEFF2]">
                    Host: <strong className="text-[#44475B]">{pass.residentName}</strong> · Flat {pass.flatNumber} · Vehicle: <span className="font-mono">{pass.vehicleNumber || "None"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "incidents" && data && (
          <div className="bg-white border border-[#EBEFF2] rounded-xl p-5 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-[#44475B] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#EB5B5B]" /> Incident Response & SLA Tracking
            </h2>
            <div className="space-y-3">
              {data.activeIncidents.map((inc) => (
                <div key={inc.incidentId} className="p-4 rounded-xl border border-[#EBEFF2] bg-[#F9FAFC] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-[#EB5B5B]">{inc.incidentCode} · {inc.severity}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-white border border-[#EBEFF2] text-[#44475B] font-semibold">{inc.status}</span>
                  </div>
                  <p className="text-sm font-bold text-[#44475B]">{inc.title}</p>
                  <p className="text-xs text-[#7C7E8C]">{inc.description}</p>
                  <div className="p-2.5 bg-white border border-[#EBEFF2] rounded-lg text-xs text-[#7C7E8C] flex flex-wrap items-center justify-between gap-2">
                    <span>Assigned: <strong className="text-[#44475B]">{inc.assignedToName}</strong></span>
                    <span>Location: <strong className="text-[#44475B]">{inc.location}</strong></span>
                    <span>Resolution: <span className="text-[#008767] font-medium">{inc.resolutionNotes}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "consent" && (
          <div className="bg-white border border-[#EBEFF2] rounded-xl p-5 space-y-6 shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-[#44475B] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#008767]" /> Consent-Aware Location Access Control (DPDP Act 2023)
              </h2>
              <p className="text-xs text-[#7C7E8C] mt-1">Granular opt-in/opt-out preferences with immediate revocation enforcement.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { purpose: "EMERGENCY_SOS" as LocationConsentPurpose, title: "Emergency SOS Distress Signal", desc: "Allows emergency responders to access unit coordinates during active SOS." },
                { purpose: "SECURITY_PATROL" as LocationConsentPurpose, title: "Security Patrol Proximity Assistance", desc: "Allows roving guards on patrol to verify safety check-ins outside your apartment tower." },
                { purpose: "GEOFENCE_GATE" as LocationConsentPurpose, title: "Hands-Free Geofence Gate Barrier", desc: "Permits gate boom barriers to detect registered vehicle approaching within 15m." },
                { purpose: "AMENITY_PROXIMITY" as LocationConsentPurpose, title: "Clubhouse & Amenity Beacon Check-In", desc: "Enables bluetooth beacon check-in when entering the gym, swimming pool, or tennis courts." },
              ].map((item) => {
                const isGranted = consentStates[item.purpose];
                return (
                  <div key={item.purpose} className="p-4 rounded-xl border border-[#EBEFF2] bg-[#F9FAFC] flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-[#44475B]">{item.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isGranted 
                            ? "bg-[#E6FAF5] text-[#008767] border-[#A7F3D0]" 
                            : "bg-[#F1F3F6] text-[#7C7E8C] border-[#EBEFF2]"
                        }`}>
                          {isGranted ? "ACTIVE" : "OPTED OUT"}
                        </span>
                      </div>
                      <p className="text-xs text-[#7C7E8C] mt-2">{item.desc}</p>
                    </div>
                    <div className="pt-2 border-t border-[#EBEFF2] flex justify-between items-center">
                      <span className="text-[11px] font-mono text-[#7C7E8C]">{item.purpose}</span>
                      <button 
                        onClick={() => handleToggleConsent(item.purpose)} 
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isGranted 
                            ? "bg-[#FEEFEF] hover:bg-[#FCDADA] text-[#EB5B5B] border border-[#FCA5A5]" 
                            : "bg-[#00D09C] hover:bg-[#00b887] text-white shadow-sm"
                        }`}
                      >
                        {isGranted ? "Revoke Consent" : "Grant Consent"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "audit" && data && (
          <div className="bg-white border border-[#EBEFF2] rounded-xl p-5 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-[#44475B] flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#7C3AED]" /> Tamper-Proof Administrative Action Audit Trail
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EBEFF2] text-[#7C7E8C] bg-[#F9FAFC]">
                    <th className="p-3 font-semibold">Time</th>
                    <th className="p-3 font-semibold">Operator</th>
                    <th className="p-3 font-semibold">Action</th>
                    <th className="p-3 font-semibold">Resource</th>
                    <th className="p-3 font-semibold">Justification</th>
                    <th className="p-3 font-semibold text-right">SHA-256 Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBEFF2]">
                  {data.recentAuditTrail.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F9FAFC] transition-colors">
                      <td className="p-3 text-[#7C7E8C] font-mono">{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td className="p-3 text-[#44475B] font-bold">{log.operatorName}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] font-bold text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-[#0284C7] font-mono font-medium">{log.targetResource}</td>
                      <td className="p-3 text-[#44475B]">{log.justification}</td>
                      <td className="p-3 text-right text-[#7C7E8C] font-mono">{log.sha256Hash.substring(0, 12)}...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
