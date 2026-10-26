import React from "react";
import { Lock } from "lucide-react";
import type { ConsentView } from "../../types/insurance";

interface InsuranceConsentsTabProps {
  consents: ConsentView[];
  loading: boolean;
  onWithdrawConsent: (id: number) => void;
}

export const InsuranceConsentsTab: React.FC<InsuranceConsentsTabProps> = ({
  consents,
  loading,
  onWithdrawConsent,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Transparent Data Sharing & Consent Ledger</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Review and manage authorizations granted for quote generation, policy storage, and claims assistance.
        </p>
      </div>

      <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 text-xs text-gray-700 space-y-1">
        <span className="font-bold">Append-Only Consent Protocol:</span>
        <p className="leading-relaxed">
          Every data-sharing permission is recorded in an immutable ledger. When you withdraw consent, partner data transmissions stop immediately. Prior transactions remain cryptographically audited for regulatory compliance.
        </p>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-gray-400">Loading consent records...</div>
      ) : consents.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 space-y-2">
          <Lock className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-sm font-bold text-gray-700">No consent events logged yet</p>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Consents are generated when you request quotes or submit group enquiries.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr>
                <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider">Purpose</th>
                <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider">Notice Version</th>
                <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider">Recorded At</th>
                <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {consents.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-6 font-bold text-gray-900">
                    {c.purpose.replace("_", " ")}
                  </td>
                  <td className="py-3.5 px-6">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        c.eventType === "GRANTED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {c.eventType}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 font-mono text-gray-500">{c.noticeVersion}</td>
                  <td className="py-3.5 px-6 text-gray-500">
                    {new Date(c.createdAt).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    {c.eventType === "GRANTED" && (
                      <button
                        onClick={() => onWithdrawConsent(c.id)}
                        className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline"
                      >
                        Withdraw Consent
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};