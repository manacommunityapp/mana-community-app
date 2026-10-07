import React from 'react';
import { useResidentAuth } from './ResidentAuthContext';
import { Building2, ShieldCheck, Sparkles, ArrowRight, Home, Users } from 'lucide-react';

export const WelcomeLoginScreen: React.FC = () => {
  const { mobileNumber, setMobileNumber, handleSendOtp, setCurrentStep, setActivePersona } = useResidentAuth();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    // Format as 5 + 5
    if (raw.length > 5) {
      setMobileNumber(`${raw.slice(0, 5)} ${raw.slice(5)}`);
    } else {
      setMobileNumber(raw);
    }
  };

  const isComplete = mobileNumber.replace(/\D/g, '').length === 10;

  return (
    <div className="flex flex-col h-full justify-between p-6 sm:p-8 bg-[#F6F8FC] text-[#202124]">
      {/* Top Header & Logo Area */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#173B72] to-[#2F6FED] flex items-center justify-center text-white shadow-md shadow-[#173B72]/15">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2F6FED]">Mana ID</span>
              <h2 className="text-sm font-semibold text-[#173B72]">Community Connect</h2>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#EEF4FE] text-[#173B72] border border-[#DCE3EE]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
            Verified Society
          </span>
        </div>

        {/* Hero Visual Card */}
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#173B72] via-[#1F4B8F] to-[#2F6FED] p-6 text-white shadow-lg shadow-[#173B72]/10">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
            <Home className="w-40 h-40" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/15 text-white backdrop-blur-md mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Multi-Resident Household Access
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              Welcome to Community
            </h1>
            <p className="text-sm text-blue-100/90 leading-relaxed max-w-sm">
              Manage your events, family registrations and community activities seamlessly.
            </p>
          </div>
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#DCE3EE] shadow-sm mb-6">
          <label className="block text-xs font-semibold text-[#667085] uppercase tracking-wider mb-2">
            Mobile Number
          </label>
          <div className="flex items-center gap-2 border border-[#DCE3EE] rounded-xl px-3.5 py-3 focus-within:ring-2 focus-within:ring-[#2F6FED] focus-within:border-[#2F6FED] bg-white transition-all">
            <div className="flex items-center gap-1.5 pr-2 border-r border-[#DCE3EE] text-sm font-semibold text-[#202124]">
              <span className="text-base">🇮🇳</span>
              <span>+91</span>
            </div>
            <input
              type="tel"
              value={mobileNumber}
              onChange={handlePhoneChange}
              placeholder="98765 43210"
              className="w-full text-base font-medium tracking-wide text-[#202124] focus:outline-none placeholder:text-gray-400"
              maxLength={11}
              autoFocus
            />
          </div>
          <p className="text-xs text-[#667085] mt-2.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            We'll send a 6-digit one-time password (OTP)
          </p>
        </div>

        {/* Core Concept Banner */}
        <div className="rounded-xl bg-[#EEF4FE] border border-blue-100 p-3.5 flex items-start gap-3">
          <Users className="w-4 h-4 text-[#2F6FED] shrink-0 mt-0.5" />
          <p className="text-xs text-[#173B72] leading-relaxed">
            <strong className="font-semibold">Individual Account:</strong> Each adult family member logs in securely with their own phone number.
          </p>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="mt-8 space-y-3">
        <button
          onClick={handleSendOtp}
          disabled={!isComplete}
          className={`w-full py-3.5 px-5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
            isComplete
              ? 'bg-[#173B72] hover:bg-[#1F4B8F] active:bg-[#142F5B] text-white shadow-[#173B72]/20 cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="text-center pt-2">
          <button
            onClick={() => {
              setActivePersona('NEW_RESIDENT');
              setCurrentStep('REGISTER_FLAT');
            }}
            className="text-xs font-semibold text-[#2F6FED] hover:text-[#173B72] transition-colors py-1 inline-flex items-center gap-1"
          >
            <span>New Resident? Register your flat</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
