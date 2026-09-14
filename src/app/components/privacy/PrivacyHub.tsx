import React, { useState } from "react";
import { useSearchParams } from "react-router";
import { Shield, FileText, Lock, UserCheck, Eye, Trash2, Database } from "lucide-react";
import { PrivacySettingsTab } from "./PrivacySettingsTab";
import { MyDataPage } from "./MyDataPage";
import { PrivacyPolicyModal } from "../commons/privacy/PrivacyPolicyModal";

export const PrivacyHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "settings";
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-4 md:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-emerald-600" />
            Privacy & Data Protection Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your personal data visibility, exercise GDPR/DPDP access rights, and control community directory masking.
          </p>
        </div>

        <button
          onClick={() => setShowPolicyModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <FileText className="w-4 h-4 text-emerald-600" />
          View Full Privacy Policy
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setTab("settings")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "settings"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Lock className="w-4 h-4" />
          Privacy & Visibility Settings
        </button>
        <button
          onClick={() => setTab("my-data")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "my-data"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Database className="w-4 h-4" />
          My Personal Data & Export
        </button>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === "settings" && <PrivacySettingsTab />}
        {activeTab === "my-data" && <MyDataPage />}
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
