import React from "react";
import { Plus, Building } from "lucide-react";
import type { GroupEnquiryView } from "../../types/insurance";

interface InsuranceGroupTabProps {
  enquiries: GroupEnquiryView[];
  loading: boolean;
  onOpenNewGroupModal: () => void;
}

export const InsuranceGroupTab: React.FC<InsuranceGroupTabProps> = ({
  enquiries,
  loading,
  onOpenNewGroupModal,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">RWA & Society Group Coverage</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Bulk institutional insurance for common areas, security personnel, lift shafts, and collective resident floaters.
          </p>
        </div>
        <button
          onClick={onOpenNewGroupModal}
          className="px-4 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" /> Request Society Quote
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-gray-400">Loading society enquiries...</div>
      ) : enquiries.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 space-y-3">
          <Building className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-sm font-bold text-gray-700">No group enquiries submitted</p>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Housing societies and RWAs can submit bulk coverage enquiries to obtain competitive quotes from IRDAI-registered insurers.
          </p>
          <button
            onClick={onOpenNewGroupModal}
            className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 shadow"
          >
            + Submit Society Enquiry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {enquiries.map((g) => (
            <div key={g.id} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-xs font-bold text-emerald-800">#{g.enquiryRef}</span>
                  <h3 className="font-bold text-gray-900 text-base mt-0.5">{g.organisationName}</h3>
                  <p className="text-xs text-gray-500">{g.organisationType}</p>
                </div>
                <span className="text-[10px] font-bold uppercase bg-slate-100 text-gray-800 px-2.5 py-1 rounded-full">
                  {g.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-gray-700 bg-slate-50 p-3.5 rounded-2xl">
                <p>
                  <strong>Coverage Scope:</strong> {g.coverageScope.replace("_", " ")}
                </p>
                <p>
                  <strong>Coverage Sought:</strong> {g.coverageSought}
                </p>
                <p>
                  <strong>Estimated Members:</strong> {g.approxMembers}
                </p>
              </div>

              <p className="text-[11px] text-gray-400 italic">{g.notice}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};