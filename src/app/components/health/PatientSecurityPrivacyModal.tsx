import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  Lock,
  EyeOff,
  UserCheck,
  AlertTriangle,
  Clock,
  Database,
  Key,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Ban,
  FileText
} from "lucide-react";
import type {
  PatientConsentDto,
  SecurityAuditLogDto,
  ComplianceDisclosureDto
} from "../../../types/health";
import { healthService } from "../../../services/healthService";

interface PatientSecurityPrivacyModalProps {
  patientId: string;
  onClose: () => void;
}

export const PatientSecurityPrivacyModal: React.FC<PatientSecurityPrivacyModalProps> = ({
  patientId,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<"consents" | "audit" | "compliance">("consents");
  const [consents, setConsents] = useState<PatientConsentDto[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLogDto[]>([]);
  const [compliance, setCompliance] = useState<ComplianceDisclosureDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [revokingConsentId, setRevokingConsentId] = useState<string | null>(null);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      const [cList, aLogs, comp] = await Promise.all([
        healthService.getPatientConsents(patientId),
        healthService.getSecurityAuditLogs(patientId),
        healthService.getComplianceDisclosure()
      ]);
      setConsents(cList);
      setAuditLogs(aLogs);
      setCompliance(comp);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityData();
  }, [patientId]);

  const handleRevokeConsent = async (consentId: string) => {
    setRevokingConsentId(consentId);
    try {
      await healthService.revokePatientConsent(consentId, "Patient manually terminated clinician access");
      await loadSecurityData();
    } finally {
      setRevokingConsentId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-300" />
              DISHA & DPDP Act 2023 Compliant
            </span>
            <span className="text-white/60 text-xs">• Zero HOA Admin Exposure</span>
          </div>
          <h2 className="text-xl font-black text-white">Healthcare Privacy, Consent & Audit Dashboard</h2>
          <p className="text-indigo-200 text-xs mt-1">
            Manage clinician authorization windows, audit every access attempt, and review encrypted storage safeguards.
          </p>
        </div>

        {/* Sub Navigation */}
        <div className="flex border-b border-gray-200 px-6 pt-3 gap-2 bg-gray-50/50">
          {[
            { id: "consents", label: "Active Doctor Authorizations", count: consents.filter(c => c.isActive).length },
            { id: "audit", label: "Tamper-Evident Access Log", count: auditLogs.length },
            { id: "compliance", label: "Regulatory Compliance & Safeguards" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-900"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span className="bg-gray-200 text-gray-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {loading ? (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center space-y-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold">Loading security telemetry...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: ACTIVE DOCTOR AUTHORIZATIONS */}
              {activeTab === "consents" && (
                <div className="space-y-4">
                  <div className="bg-indigo-50/70 border border-indigo-100 p-4 rounded-2xl flex items-start gap-3">
                    <UserCheck className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
                    <div className="text-xs text-indigo-950 space-y-1">
                      <strong className="block font-black">Purpose & Time-Bound Clinician Access</strong>
                      <p className="leading-relaxed">
                        Clinicians obtain access strictly during active consultation and follow-up windows (default 7 days).
                        You retain the sovereign right to revoke clinician access at any moment.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {consents.map(consent => (
                      <div
                        key={consent.consentId}
                        className={`p-4 rounded-2xl border transition-all ${
                          consent.isActive
                            ? "bg-white border-gray-200 shadow-2xs hover:border-indigo-300"
                            : "bg-gray-50 border-gray-200/80 opacity-70"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-gray-500">
                                {consent.consentId}
                              </span>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                                  consent.isActive
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-gray-200 text-gray-700"
                                }`}
                              >
                                {consent.isActive ? "ACTIVE CARE WINDOW" : "EXPIRED / REVOKED"}
                              </span>
                              <span className="text-[11px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">
                                Purpose: {consent.purpose}
                              </span>
                            </div>

                            <h4 className="font-extrabold text-sm text-gray-900">
                              {consent.grantedToName}
                            </h4>
                            <p className="text-xs text-gray-600">
                              {consent.doctorClinicName}
                            </p>

                            <div className="text-[11px] text-gray-400 flex flex-wrap gap-3 pt-1">
                              <span>Granted: {consent.grantedAt}</span>
                              <span className="text-indigo-700 font-bold">
                                Expires: {consent.expiresAt}
                              </span>
                            </div>
                            {consent.revocationReason && (
                              <p className="text-[11px] text-amber-800 italic pt-1">
                                Note: {consent.revocationReason}
                              </p>
                            )}
                          </div>

                          {consent.isActive && (
                            <button
                              onClick={() => handleRevokeConsent(consent.consentId)}
                              disabled={revokingConsentId === consent.consentId}
                              className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              {revokingConsentId === consent.consentId ? "Revoking..." : "Revoke Access Now"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: AUDIT LOG */}
              {activeTab === "audit" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">
                      Immutable record of all reads, edits, downloads and sharing attempts.
                    </span>
                    <span className="font-bold text-indigo-700 font-mono">
                      Log Retention: 7 Years (Legal Standard)
                    </span>
                  </div>

                  <div className="space-y-2">
                    {auditLogs.map(log => (
                      <div
                        key={log.auditId}
                        className={`p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                          log.authorized
                            ? "bg-white border-gray-200"
                            : "bg-red-50/70 border-red-200"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                                log.authorized
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {log.authorized ? "AUTHORIZED 200" : "BLOCKED 403 FORBIDDEN"}
                            </span>
                            <span className="font-mono text-gray-400 text-[10px]">{log.auditId}</span>
                            <span className="text-gray-400">• {log.timestamp}</span>
                          </div>

                          <div className="text-gray-900 font-bold">
                            {log.action} on <span className="font-mono text-gray-700">{log.resourceId}</span>
                          </div>

                          <p className="text-gray-500 text-[11px]">
                            Accessor: <strong>{log.accessorName}</strong> ({log.accessorRole}) • IP: {log.ipAddress}
                          </p>

                          {log.failureReason && (
                            <p className="text-red-700 text-[11px] font-semibold flex items-center gap-1 pt-0.5">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              {log.failureReason}
                            </p>
                          )}
                        </div>

                        <span className="text-[10px] bg-gray-100 text-gray-700 font-mono px-2 py-1 rounded shrink-0">
                          {log.purpose}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: REGULATORY COMPLIANCE SAFEGUARDS */}
              {activeTab === "compliance" && compliance && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                      <div className="flex items-center gap-2 text-indigo-900 font-black text-sm">
                        <Database className="w-4 h-4 text-indigo-600" />
                        Storage Separation & Encryption
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {compliance.storageSeparationSummary}
                      </p>
                      <span className="text-[10px] bg-indigo-100 text-indigo-900 font-bold px-2 py-0.5 rounded">
                        KMS AES-256 Envelope Encryption
                      </span>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                      <div className="flex items-center gap-2 text-indigo-900 font-black text-sm">
                        <EyeOff className="w-4 h-4 text-indigo-600" />
                        HOA & Community Admin Isolation
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {compliance.adminExclusionGuarantee}
                      </p>
                      <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded">
                        0 Leakage to Community Graph
                      </span>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                      <div className="flex items-center gap-2 text-indigo-900 font-black text-sm">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        Time-Bounded Clinician Grants
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Access is scoped strictly to {compliance.timeBoundAccessDurationDays} days post-consultation. No indefinite access is permitted without explicit patient renewal.
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                      <div className="flex items-center gap-2 text-indigo-900 font-black text-sm">
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        Mandatory Breach Notification SLA
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        In accordance with CERT-In and DPDP Act provisions, any unauthorized access attempts trigger an automated incident report within {compliance.breachNotificationLeadTimeHours} hours.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                    <strong className="block font-black flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-700" /> Clinical AI Judgment Disclaimer
                    </strong>
                    <p className="leading-relaxed">
                      AI triage tools and symptom analyzers in Mana Health operate strictly as informational navigation aids. AI algorithms do not generate final clinical diagnoses or prescribe pharmaceuticals. All care orders require approval by certified, council-verified medical doctors.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-extrabold rounded-xl transition"
            >
              Close Privacy Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
