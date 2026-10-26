import React from "react";
import { Plus, Shield, Trash2 } from "lucide-react";
import {
  categoryLabel,
  maskPolicyNumber,
  daysUntil,
  renewalBucket,
} from "../../constants/insurance";
import type { PolicyView } from "../../types/insurance";

interface InsurancePoliciesTabProps {
  policies: PolicyView[];
  loading: boolean;
  onOpenAddModal: () => void;
  onDeletePolicy: (id: number) => void;
  onOpenClaimModal: (policyId?: number) => void;
}

export const InsurancePoliciesTab: React.FC<InsurancePoliciesTabProps> = ({
  policies,
  loading,
  onOpenAddModal,
  onDeletePolicy,
  onOpenClaimModal,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Policy Vault & Renewal Management</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Centralized vault for family and community property policies. Masked policy storage.
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="px-4 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" /> Track New Policy
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-gray-400">Loading your policies...</div>
      ) : policies.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 space-y-3">
          <Shield className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-sm font-bold text-gray-700">Your policy vault is currently empty</p>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Add your active health, term, vehicle, or home policies to receive community renewal alerts and expedited claim assistance.
          </p>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 shadow"
          >
            + Track Policy
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {policies.map((p) => {
            const bucket = renewalBucket(p);
            const days = daysUntil(p.expiryDate);
            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full">
                      {categoryLabel(p.category)}
                    </span>
                    <div className="flex gap-1.5">
                      {p.dataSource === "USER_DECLARED" && (
                        <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                          Self-Declared
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          bucket === "OVERDUE"
                            ? "bg-red-100 text-red-700"
                            : bucket === "DUE_30"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {bucket === "OVERDUE" ? "Overdue" : bucket === "DUE_30" ? "Due in 30d" : "Active"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{p.productName}</h3>
                    <p className="text-xs text-gray-500 font-medium">{p.insurerName}</p>
                  </div>

                  <div className="space-y-1.5 pt-2 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Policy Number:</span>
                      <span className="font-mono font-medium">{maskPolicyNumber(p.maskedPolicyNumber)}</span>
                    </div>
                    {p.sumInsured && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Sum Insured:</span>
                        <span className="font-semibold text-gray-800">
                          ₹{p.sumInsured.toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}
                    {p.premiumAmount && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Premium:</span>
                        <span className="text-gray-800">
                          ₹{p.premiumAmount.toLocaleString("en-IN")}{" "}
                          {p.premiumFrequency ? `(${p.premiumFrequency})` : ""}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Expiry Date:</span>
                      <span className="font-medium text-gray-800">
                        {p.expiryDate || "Not specified"}
                        {days !== null && days >= 0 && (
                          <span className="text-emerald-600 text-[11px] ml-1">({days}d)</span>
                        )}
                      </span>
                    </div>
                    {p.nomineeName && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Nominee:</span>
                        <span className="text-gray-800">{p.nomineeName}</span>
                      </div>
                    )}
                  </div>

                  {p.statusNote && (
                    <p className="text-[11px] text-gray-400 italic pt-1">{p.statusNote}</p>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <button
                    onClick={() => onOpenClaimModal(p.id)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    Claim Help →
                  </button>
                  <button
                    onClick={() => onDeletePolicy(p.id)}
                    className="text-gray-400 hover:text-red-600 p-1 rounded-lg transition"
                    title="Remove Policy"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};