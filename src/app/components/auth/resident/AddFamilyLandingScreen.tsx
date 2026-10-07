import React from 'react';
import { useResidentAuth } from './ResidentAuthContext';
import { Users, UserPlus, Baby, CheckCircle2, Shield, ArrowRight } from 'lucide-react';

export const AddFamilyLandingScreen: React.FC = () => {
  const { household, adultMembers, children, setCurrentStep } = useResidentAuth();

  return (
    <div className="flex flex-col h-full justify-between p-6 sm:p-8 bg-[#F6F8FC] text-[#202124]">
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-[#EEF4FE] text-[#2F6FED] border border-blue-100 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-[#2F6FED]" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2F6FED]">Household Setup</span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#173B72]">
              Add Your Family
            </h1>
          </div>
        </div>
        <p className="text-xs text-[#667085] leading-relaxed mb-5">
          Add family members so they can participate in community tournaments, sports events, and social activities.
        </p>

        {/* Household Card */}
        <div className="bg-white rounded-2xl p-4 border border-[#DCE3EE] shadow-sm mb-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Household Unit</span>
              <h3 className="text-base font-bold text-[#173B72]">{household.flatNumber}</h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EEF4FE] text-[#173B72]">
              {adultMembers.length + children.length} Members
            </span>
          </div>

          {/* Members List */}
          <div className="space-y-2.5">
            {/* Adult Members */}
            {adultMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/70 border border-gray-100"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#173B72] text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.fullName} className="w-full h-full object-cover" />
                    ) : (
                      member.fullName.charAt(0)
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#202124]">{member.fullName}</h4>
                    <p className="text-[10px] text-[#667085] capitalize">{member.relationship.toLowerCase()}</p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16A34A] bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              </div>
            ))}

            {/* Child Members */}
            {children.map((child) => (
              <div
                key={child.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/70 border border-gray-100"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                    {child.avatarUrl ? (
                      <img src={child.avatarUrl} alt={child.fullName} className="w-full h-full object-cover" />
                    ) : (
                      child.fullName.charAt(0)
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#202124]">{child.fullName}</h4>
                    <p className="text-[10px] text-[#667085] capitalize">{child.relationship.toLowerCase()}</p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <Baby className="w-3 h-3" /> Parent Managed
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dual Add Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => setCurrentStep('ADD_ADULT_MEMBER')}
            className="p-4 rounded-2xl bg-white border border-[#DCE3EE] hover:border-[#2F6FED] hover:bg-[#EEF4FE]/50 text-left transition-all group shadow-sm cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-[#EEF4FE] text-[#2F6FED] group-hover:bg-[#2F6FED] group-hover:text-white flex items-center justify-center mb-2.5 transition-colors">
              <UserPlus className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-[#173B72] mb-0.5">+ Add Adult Member</h4>
            <p className="text-[11px] text-[#667085] leading-snug">Spouse, parent, or adult child with own phone login.</p>
          </button>

          <button
            onClick={() => setCurrentStep('ADD_CHILD')}
            className="p-4 rounded-2xl bg-white border border-[#DCE3EE] hover:border-amber-400 hover:bg-amber-50/50 text-left transition-all group shadow-sm cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white flex items-center justify-center mb-2.5 transition-colors">
              <Baby className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-[#173B72] mb-0.5">+ Add Child</h4>
            <p className="text-[11px] text-[#667085] leading-snug">Parent-managed profile for junior sports & event signups.</p>
          </button>
        </div>

        {/* Security Rule Note */}
        <div className="flex items-center gap-2 text-xs text-[#667085] px-1">
          <Shield className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
          <span>Adults get individual OTP login; no shared flat passwords.</span>
        </div>
      </div>

      {/* Bottom Finish CTA */}
      <div className="mt-6">
        <button
          onClick={() => setCurrentStep('FAMILY_DASHBOARD')}
          className="w-full py-3.5 px-5 rounded-xl font-semibold text-sm bg-[#173B72] hover:bg-[#1F4B8F] active:bg-[#142F5B] text-white shadow-sm shadow-[#173B72]/20 cursor-pointer flex items-center justify-center gap-2 transition-all"
        >
          <span>View My Family Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
