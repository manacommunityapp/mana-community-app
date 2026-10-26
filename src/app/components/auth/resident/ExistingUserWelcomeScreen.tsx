import React from 'react';
import { useResidentAuth } from './ResidentAuthContext';
import { Building2, Sparkles, ArrowRight, Trophy, Bell, ShieldCheck, Users } from 'lucide-react';
import { useNavigate } from 'react-router';

export const ExistingUserWelcomeScreen: React.FC = () => {
  const { fullName, household, adultMembers, children, setCurrentStep } = useResidentAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full justify-between p-6 sm:p-8 bg-[#F6F8FC] text-[#202124]">
      <div>
        {/* Top App Identity */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#173B72] to-[#2F6FED] text-white flex items-center justify-center shadow-md shadow-[#173B72]/15">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2F6FED]">Verified Resident</span>
              <h2 className="text-sm font-semibold text-[#173B72]">Mana ID Active</h2>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-[#16A34A] border border-green-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified
          </span>
        </div>

        {/* Personalized Hero Card */}
        <div className="rounded-3xl bg-gradient-to-br from-[#173B72] via-[#1F4B8F] to-[#2F6FED] p-6 text-white shadow-xl shadow-[#173B72]/15 mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur-md mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Household Session Live
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1">
            Welcome back, {fullName || 'Raj'}
          </h1>
          <p className="text-sm text-blue-100/90 font-medium">
            {household.flatNumber} · {household.tower}
          </p>

          <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-blue-100">
              <Users className="w-4 h-4" />
              <span>{adultMembers.length + children.length} Household Members</span>
            </div>
            <button
              onClick={() => setCurrentStep('FAMILY_DASHBOARD')}
              className="text-xs font-bold text-amber-300 hover:text-white transition-colors underline"
            >
              My Family
            </button>
          </div>
        </div>

        {/* Upcoming Community Activity Card */}
        <div className="bg-white rounded-2xl p-4 border border-[#DCE3EE] shadow-sm mb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#173B72]">
                Upcoming Community Events
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Registrations Open
            </span>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-[#202124]">Annual Monsoon Badminton Cup 2026</h4>
              <p className="text-[11px] text-[#667085]">Starts Saturday · Singles & Doubles</p>
            </div>
            <button
              onClick={() => navigate('/events')}
              className="text-xs font-bold text-[#2F6FED] hover:underline"
            >
              Register
            </button>
          </div>
        </div>

        {/* Notice Board Pill */}
        <div className="bg-white rounded-2xl p-3.5 border border-[#DCE3EE] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EEF4FE] text-[#2F6FED] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#173B72]">Clubhouse Renovation Notice</h4>
              <p className="text-[10px] text-[#667085]">Posted 2h ago by Management Committee</p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-[#2F6FED]" />
        </div>
      </div>

      {/* Primary CTA to enter community */}
      <div className="mt-6 space-y-2.5">
        <button
          onClick={() => navigate('/events')}
          className="w-full py-4 px-5 rounded-2xl font-bold text-base bg-[#173B72] hover:bg-[#1F4B8F] active:bg-[#142F5B] text-white shadow-md shadow-[#173B72]/20 cursor-pointer flex items-center justify-center gap-2 transition-all"
        >
          <span>Enter Community</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-center gap-4 text-xs font-semibold text-[#667085]">
          <button
            onClick={() => setCurrentStep('FAMILY_DASHBOARD')}
            className="hover:text-[#2F6FED] transition-colors"
          >
            Manage Family
          </button>
          <span>·</span>
          <button
            onClick={() => setCurrentStep('MULTIPLE_PROPERTY')}
            className="hover:text-[#2F6FED] transition-colors"
          >
            Switch Property
          </button>
        </div>
      </div>
    </div>
  );
};
