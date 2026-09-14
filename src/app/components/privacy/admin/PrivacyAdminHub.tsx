import React, { useState } from "react";
import { useSearchParams } from "react-router";
import { Shield, Trash2, Database, ShieldAlert, History } from "lucide-react";
import { AdminDeletionRequests } from "./AdminDeletionRequests";
import { AdminRetentionPolicies } from "./AdminRetentionPolicies";

export const PrivacyAdminHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "deletion-requests";

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-6">
      {/* Sub-header navigation tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setTab("deletion-requests")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "deletion-requests"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Trash2 className="w-4 h-4" />
          Deletion Requests
        </button>

        <button
          onClick={() => setTab("retention-policies")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "retention-policies"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Database className="w-4 h-4" />
          Data Retention Policies
        </button>
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === "deletion-requests" && <AdminDeletionRequests />}
        {activeTab === "retention-policies" && <AdminRetentionPolicies />}
      </div>
    </div>
  );
};
