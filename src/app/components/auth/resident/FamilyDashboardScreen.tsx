import React from 'react';
import { useResidentAuth } from './ResidentAuthContext';
import {
  Users,
  Building2,
  UserPlus,
  Baby,
  CheckCircle2,
  Clock,
  Shield,
  Trophy,
  ArrowRight,
  MoreVertical,
  Calendar,
} from 'lucide-react';

export const FamilyDashboardScreen: React.FC = () => {
  const { household, adultMembers, children, setCurrentStep } = useResidentAuth();

  return (
    <div className="flex flex-col h-full justify-between p-6 sm:p-8 bg-[#F6F8FC] text-[#202124]">
      <div>
        {/* Top Household Banner */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#173B72] to-[#2F6FED] text-white flex items-center justify-center shadow-md shadow-[#173B72]/15">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Household Roster</span>
              <h1 className="text-lg font-bold text-[#173B72]">My Family</h1>
            </div>
          </div>

          <button
            onClick={() => setCurrentStep('MULTIPLE_PROPERTY')}
            className="text-[11px] font-semibold text-[#2F6FED] bg-[#EEF4FE] hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Switch Flat</span>
          </button>
        </div>

        {/* Flat Location Card */}
        <div className="bg-white rounded-2xl p-4 border border-[#DCE3EE] shadow-sm mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EEF4FE] text-[#173B72] font-bold flex items-center justify-center text-sm">
              <Building2 className="w-5 h-5 text-[#2F6FED]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#173B72]">{household.flatNumber} · {household.tower}</h2>
              <p className="text-xs text-[#667085]">{household.societyName}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#16A34A] bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
            {adultMembers.length + children.length} Residents
          </span>
        </div>

        {/* Section: Adult Family Members */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085]">
              Adult Members (Own Login)
            </h3>
            <button
              onClick={() => setCurrentStep('ADD_ADULT_MEMBER')}
              className="text-xs font-semibold text-[#2F6FED] hover:underline flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add Adult</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {adultMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-2xl p-3.5 border border-[#DCE3EE] shadow-sm flex items-center justify-between hover:border-[#2F6FED]/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-full bg-[#173B72] text-white flex items-center justify-center font-bold text-sm overflow-hidden ring-2 ring-white shadow-sm">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.fullName} className="w-full h-full object-cover" />
                      ) : (
                        member.fullName.charAt(0)
                      )}
                    </div>
                    {member.isPrimaryResident && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-white text-[9px] font-black flex items-center justify-center border border-white" title="Primary Resident">
                        ★
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#202124]">{member.fullName}</h4>
                      {member.isPrimaryResident && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#667085] mt-0.5">
                      <span className="capitalize">{member.relationship.toLowerCase()}</span>
                      <span>·</span>
                      <span>{member.mobile}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {member.accessStatus === 'ACTIVE' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16A34A] bg-green-50 px-2 py-0.5 rounded-lg border border-green-200">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                      <Clock className="w-3 h-3" /> Invited
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Parent-Managed Children */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085]">
              Children (Parent Managed)
            </h3>
            <button
              onClick={() => setCurrentStep('ADD_CHILD')}
              className="text-xs font-semibold text-[#2F6FED] hover:underline flex items-center gap-1"
            >
              <Baby className="w-3.5 h-3.5" />
              <span>+ Add Child</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {children.map((child) => (
              <div
                key={child.id}
                className="bg-white rounded-2xl p-3.5 border border-[#DCE3EE] shadow-sm flex items-center justify-between hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm overflow-hidden ring-2 ring-white shadow-sm">
                    {child.avatarUrl ? (
                      <img src={child.avatarUrl} alt={child.fullName} className="w-full h-full object-cover" />
                    ) : (
                      child.fullName.charAt(0)
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#202124]">{child.fullName}</h4>
                    <div className="flex items-center gap-2 text-xs text-[#667085] mt-0.5">
                      <span className="capitalize">{child.relationship.toLowerCase()}</span>
                      <span>·</span>
                      <span>DOB: {child.dob}</span>
                    </div>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <Baby className="w-3.5 h-3.5" /> Parent Managed
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA / Event Hub Launch */}
      <div className="mt-6 space-y-2.5">
        <button
          onClick={() => setCurrentStep('EXISTING_USER_WELCOME')}
          className="w-full py-3.5 px-5 rounded-xl font-semibold text-sm bg-[#173B72] hover:bg-[#1F4B8F] active:bg-[#142F5B] text-white shadow-sm shadow-[#173B72]/20 cursor-pointer flex items-center justify-center gap-2 transition-all"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Register Family for Events</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
