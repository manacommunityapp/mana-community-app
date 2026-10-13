import React, { useState } from "react";
import { useSearchParams } from "react-router";
import { Shield, FileText, Lock, Database, FileCheck2, Mail } from "lucide-react";
import { PrivacySettingsTab } from "./PrivacySettingsTab";
import { MyDataPage } from "./MyDataPage";
import { PrivacyPolicyModal } from "../commons/privacy/PrivacyPolicyModal";
import { DataRightsForm } from "../commons/privacy/DataRightsForm";

export const PrivacyHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "settings";
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const tabs = [
    { id: "settings",    label: "Privacy & Visibility",   icon: Lock },
    { id: "my-data",     label: "My Data & Export",       icon: Database },
    { id: "data-rights", label: "Exercise My Rights",     icon: FileCheck2 },
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

        <button
          onClick={() => setShowPolicyModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <FileText className="w-4 h-4 text-emerald-600" />
          View Privacy Notice
        </button>
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
        {activeTab === "my-data"     && <MyDataPage />}
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
    </div>
  );
};
