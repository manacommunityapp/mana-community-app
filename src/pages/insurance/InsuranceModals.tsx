import React from "react";
import { CATEGORIES } from "../../constants/insurance";
import type { PolicyCreateInput, PolicyView, GroupEnquiryInput } from "../../types/insurance";

interface AddPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  policy: Partial<PolicyCreateInput>;
  onPolicyChange: (policy: Partial<PolicyCreateInput>) => void;
  onSubmit: (e: React.FormEvent) => void;
  errors: Record<string, string>;
  submitting: boolean;
}

export const AddPolicyModal: React.FC<AddPolicyModalProps> = ({
  isOpen,
  onClose,
  policy,
  onPolicyChange,
  onSubmit,
  errors,
  submitting,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Track an Insurance Policy</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Protection Category *</label>
            <select
              value={policy.category}
              onChange={(e) => onPolicyChange({ ...policy, category: e.target.value as any })}
              className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Insurer Name *</label>
            <input
              type="text"
              placeholder="e.g. Star Health, HDFC ERGO, ICICI Lombard"
              value={policy.insurerName || ""}
              onChange={(e) => onPolicyChange({ ...policy, insurerName: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
            {errors.insurerName && <p className="text-red-600 text-[11px] mt-0.5">{errors.insurerName}</p>}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Plan / Product Name *</label>
            <input
              type="text"
              placeholder="e.g. Family Health Optima, Optima Secure"
              value={policy.productName || ""}
              onChange={(e) => onPolicyChange({ ...policy, productName: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
            {errors.productName && <p className="text-red-600 text-[11px] mt-0.5">{errors.productName}</p>}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Policy Number (Optional)</label>
            <input
              type="text"
              placeholder="Masked for privacy (e.g. XXXXXX1234)"
              value={policy.policyNumber || ""}
              onChange={(e) => onPolicyChange({ ...policy, policyNumber: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Sum Insured (₹)</label>
              <input
                type="number"
                placeholder="1000000"
                value={policy.sumInsured || ""}
                onChange={(e) => onPolicyChange({ ...policy, sumInsured: Number(e.target.value) || undefined })}
                className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Annual Premium (₹)</label>
              <input
                type="number"
                placeholder="18500"
                value={policy.premiumAmount || ""}
                onChange={(e) => onPolicyChange({ ...policy, premiumAmount: Number(e.target.value) || undefined })}
                className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={policy.startDate || ""}
                onChange={(e) => onPolicyChange({ ...policy, startDate: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                value={policy.expiryDate || ""}
                onChange={(e) => onPolicyChange({ ...policy, expiryDate: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Nominee Name</label>
            <input
              type="text"
              placeholder="Primary beneficiary"
              value={policy.nomineeName || ""}
              onChange={(e) => onPolicyChange({ ...policy, nomineeName: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
            Self-declared policies are stored encrypted. Mana does not verify policy active status directly with insurers unless an authorized integration exists.
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Policy"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  policies: PolicyView[];
  policyId?: number;
  onPolicyIdChange: (id?: number) => void;
  claimType: string;
  onClaimTypeChange: (val: string) => void;
  claimDesc: string;
  onClaimDescChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  isOpen,
  onClose,
  policies,
  policyId,
  onPolicyIdChange,
  claimType,
  onClaimTypeChange,
  claimDesc,
  onClaimDescChange,
  onSubmit,
  submitting,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Open Claims Assistance Ticket</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Associated Policy (Optional)</label>
            <select
              value={policyId || ""}
              onChange={(e) => onPolicyIdChange(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Unlinked / General Incident --</option>
              {policies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.productName} ({p.insurerName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Claim Type *</label>
            <input
              type="text"
              placeholder="e.g. Cashless Hospitalization, Reimbursement, Motor Accidental Repair"
              value={claimType}
              onChange={(e) => onClaimTypeChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Situation Details</label>
            <textarea
              rows={4}
              placeholder="Describe your situation, hospital name, date of admission or accident."
              value={claimDesc}
              onChange={(e) => onClaimDescChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-[11px] text-blue-900 leading-relaxed">
            Mana Community team assists with document verification and insurer escalation. We do not decide or disburse claims.
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Case"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: Partial<GroupEnquiryInput>;
  onFormChange: (form: Partial<GroupEnquiryInput>) => void;
  consentChecked: boolean;
  onConsentChange: (checked: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
}

export const GroupModal: React.FC<GroupModalProps> = ({
  isOpen,
  onClose,
  form,
  onFormChange,
  consentChecked,
  onConsentChange,
  onSubmit,
  submitting,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">RWA / Society Group Enquiry</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Society / Organisation Name *</label>
            <input
              type="text"
              placeholder="e.g. Prestige Greenwoods RWA"
              value={form.organisationName || ""}
              onChange={(e) => onFormChange({ ...form, organisationName: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Organisation Type</label>
            <input
              type="text"
              placeholder="e.g. Housing Society, Apartment Owners Association"
              value={form.organisationType || ""}
              onChange={(e) => onFormChange({ ...form, organisationType: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Coverage Scope</label>
            <select
              value={form.coverageScope}
              onChange={(e) => onFormChange({ ...form, coverageScope: e.target.value as any })}
              className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            >
              <option value="COMMON_PROPERTY">Common Property & Infrastructure</option>
              <option value="INDIVIDUAL_RESIDENT">Individual Residents Floater</option>
              <option value="GROUP_POLICY">Society Staff & Security Group Policy</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Coverage Details Sought *</label>
            <input
              type="text"
              placeholder="e.g. Fire & earthquake structure cover, Lift breakdown AMC, Staff group health"
              value={form.coverageSought || ""}
              onChange={(e) => onFormChange({ ...form, coverageSought: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Approximate Members / Units</label>
            <input
              type="number"
              placeholder="50"
              value={form.approxMembers || ""}
              onChange={(e) => onFormChange({ ...form, approxMembers: Number(e.target.value) || 5 })}
              className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Additional Requirements</label>
            <textarea
              rows={3}
              placeholder="Any specific insurer preference or past policy renewal date."
              value={form.requirements || ""}
              onChange={(e) => onFormChange({ ...form, requirements: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-start gap-2 pt-2">
            <input
              type="checkbox"
              id="groupConsent"
              checked={consentChecked}
              onChange={(e) => onConsentChange(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="groupConsent" className="text-gray-600 text-[11px] leading-relaxed cursor-pointer">
              I authorize Mana Community to forward this group enquiry to IRDAI-registered insurance partners for obtaining formal quotation proposals. I acknowledge that Mana does not issue binding insurance policies.
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Enquiry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};