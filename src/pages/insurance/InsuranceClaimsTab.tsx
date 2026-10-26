import React from "react";
import { Plus, AlertCircle, FileText } from "lucide-react";
import type { ClaimCaseView } from "../../types/insurance";

interface InsuranceClaimsTabProps {
  claims: ClaimCaseView[];
  loading: boolean;
  onOpenNewClaimModal: () => void;
}

export const InsuranceClaimsTab: React.FC<InsuranceClaimsTabProps> = ({
  claims,
  loading,
  onOpenNewClaimModal,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Claims Assistance Desk</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Administrative support, document coordination, and hospital liaison assistance for community residents.
          </p>
        </div>
        <button
          onClick={onOpenNewClaimModal}
          className="px-4 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" /> Open Assistance Case
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Administrative Scope of Mana Claims Support:</span>
          <p className="leading-relaxed">
            Mana Community does not decide, settle, or adjudicate insurance claims. All decisions regarding claim admissibility, deductions, and payout amounts rest solely with the insurance company and its authorized Third Party Administrator (TPA).
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-gray-400">Loading claims assistance tickets...</div>
      ) : claims.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 space-y-3">
          <FileText className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-sm font-bold text-gray-700">No active assistance cases</p>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            If you or a family member face hospitalization or an insurance incident, open a case here for paperwork guidance.
          </p>
          <button
            onClick={onOpenNewClaimModal}
            className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 shadow"
          >
            + Open Case
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-700">#{c.caseRef}</span>
                    <span className="text-xs font-bold text-gray-900">• {c.claimType}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Opened on {new Date(c.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                    c.assistanceStatus === "OPEN"
                      ? "bg-blue-100 text-blue-800"
                      : c.assistanceStatus === "IN_REVIEW"
                      ? "bg-amber-100 text-amber-800"
                      : c.assistanceStatus === "CLOSED"
                      ? "bg-gray-100 text-gray-700"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {c.assistanceStatus.replace("_", " ")}
                </span>
              </div>

              {c.description && (
                <p className="text-xs text-gray-700 bg-slate-50 p-3 rounded-xl leading-relaxed">
                  {c.description}
                </p>
              )}

              {c.insurerClaimReference && (
                <div className="text-xs text-emerald-800 font-semibold bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                  Insurer Claim Ref: <span className="font-mono">{c.insurerClaimReference}</span>
                </div>
              )}

              <p className="text-[11px] text-gray-400 italic">{c.notice}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};