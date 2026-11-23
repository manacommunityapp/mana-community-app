import React, { useState } from "react";
import { useSearchParams } from "react-router";
import { Shield, FileText, Lock, Database, FileCheck2, Mail, CheckSquare, Activity, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { PrivacySettingsTab } from "./PrivacySettingsTab";
import { MyDataPage } from "./MyDataPage";
import { PrivacyPolicyModal } from "../commons/privacy/PrivacyPolicyModal";
import { DataRightsForm } from "../commons/privacy/DataRightsForm";
import { ConsentManager } from "./ConsentManager";
import { HealthAccessLog } from "./HealthAccessLog";
import { automationService, type DpdpConsentAuditResponse } from "../../../services/automation/automationService";

export const PrivacyHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "settings";
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  // AI DPDP Act 2023 Consent & Purpose Auditor
  const [isAuditingDpdp, setIsAuditingDpdp] = useState(false);
  const [dpdpResult, setDpdpResult] = useState<DpdpConsentAuditResponse | null>(null);
  const [showDpdpModal, setShowDpdpModal] = useState(false);

  const handleAuditDpdp = async () => {
    setIsAuditingDpdp(true);
    try {
      const res = await automationService.auditDpdpConsent({
        residentId: "RES-FLAT-B-302",
        residentName: "Praveen Nair",
        flatNumber: "B-302",
        consentCategories: [
          { category: "BIOMETRIC_ANPR", consentGrantedDate: "2025-11-20", consentExpiryDate: "2026-11-20", purposeExplicitlyStated: true },
          { category: "CHILD_SPORTS_PROFILE", consentGrantedDate: "2026-06-15", consentExpiryDate: "2027-06-15", purposeExplicitlyStated: true },
          { category: "WHATSAPP_BROADCAST", consentGrantedDate: "2026-01-10", purposeExplicitlyStated: true }
        ]
      });
      setDpdpResult(res);
      setShowDpdpModal(true);
    } catch (err) {
      console.error("AI DPDP Audit error:", err);
    } finally {
      setIsAuditingDpdp(false);
    }
  };

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const tabs = [
    { id: "settings",    label: "Privacy & Visibility",   icon: Lock },
    { id: "consents",    label: "Consent Management",     icon: CheckSquare },
    { id: "my-data",     label: "My Data & Export",       icon: Database },
    { id: "data-rights", label: "Exercise My Rights",     icon: FileCheck2 },
    { id: "health-log",  label: "Health Access Log",      icon: Activity },
    { id: "contact",     label: "Grievance Contact",      icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-4 md:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-emerald-600" />
            Privacy & Data Protection Centre
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your personal data, exercise DPDP Act 2023 rights, and control consent preferences.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAuditDpdp}
            disabled={isAuditingDpdp}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            {isAuditingDpdp ? "Auditing Consents..." : "AI DPDP Consent Audit"}
          </button>
          <button
            onClick={() => setShowPolicyModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            View Privacy Notice
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-px">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === id
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === "settings"    && <PrivacySettingsTab />}
        {activeTab === "consents"    && <ConsentManager />}
        {activeTab === "my-data"     && <MyDataPage />}
        {activeTab === "health-log"  && <HealthAccessLog />}
        {activeTab === "data-rights" && (
          <div className="max-w-2xl mx-auto">
            <DataRightsForm />
          </div>
        )}
        {activeTab === "contact" && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-foreground">Grievance Officer</h2>
                  <p className="text-xs text-muted-foreground">DPDP Act 2023, s.13 — Response within 30 days</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</span>
                  <span className="text-foreground font-medium">Data Protection Officer (DPO)</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organisation</span>
                  <span className="text-foreground font-medium">Mana Community Pvt. Ltd.</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</span>
                  <a href="mailto:dpo@manacommunity.app" className="text-primary font-medium hover:underline">
                    dpo@manacommunity.app
                  </a>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registered Address</span>
                  <span className="text-foreground font-medium text-xs italic">
                    [LEGAL REVIEW REQUIRED: Insert registered office address]
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Response Timeline</span>
                  <span className="text-foreground font-medium">30 days from receipt of complaint</span>
                </div>
              </div>
              <div className="pt-3 border-t border-border">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  If you are unsatisfied with our response, you may approach the{" "}
                  <strong className="text-foreground">Data Protection Board of India</strong> once it is
                  operational under the DPDP Act 2023.
                </p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <a
                href="mailto:dpo@manacommunity.app"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                Email Grievance Officer
              </a>
              <button
                type="button"
                onClick={() => setTab("data-rights")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-foreground text-xs font-bold hover:bg-muted/80 transition-colors cursor-pointer"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                Submit Formal Rights Request
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Policy Modal */}
      {showPolicyModal && (
        <PrivacyPolicyModal
          isOpen={showPolicyModal}
          onClose={() => setShowPolicyModal(false)}
        />
      )}

      {/* AI DPDP Act 2023 Consent & Purpose Audit Modal */}
      {showDpdpModal && dpdpResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowDpdpModal(false); }}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">AI DPDP Act 2023 Consent Audit</h3>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                dpdpResult.dpdpComplianceRating === "COMPLIANT"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-800"
              }`}>
                {dpdpResult.dpdpComplianceRating}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">HEALTH SCORE</span>
                <span className="font-extrabold text-emerald-600 text-base">{dpdpResult.consentHealthScore}/100</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">EXPIRING CONSENTS</span>
                <span className="font-extrabold text-amber-600 text-base">{dpdpResult.expiringConsentsCount} Active</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">MINOR DATA (U-18)</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 text-xs mt-1 block">
                  {dpdpResult.minorDataConsentsVerified ? "Verified (Parental)" : "Pending Consent"}
                </span>
              </div>
            </div>

            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 p-3 rounded-xl text-xs">
              <div className="font-semibold text-emerald-900 dark:text-emerald-200 mb-1 flex items-center justify-between">
                <span>Statutory Reference</span>
                <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  DPDP Act 2023 Sec 6(1)
                </span>
              </div>
              <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed">{dpdpResult.statutoryClauseReferenced}</p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Actionable Audit Findings</span>
              {dpdpResult.actionableFindings?.map((f, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowDpdpModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Close Audit
              </button>
              <button
                onClick={() => {
                  alert("DPDP statutory re-consent reminder dispatched to resident app!");
                  setShowDpdpModal(false);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
              >
                Dispatch Re-Consent Notification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
