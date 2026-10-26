import React, { useState } from 'react';
import { useResidentAuth } from './ResidentAuthContext';
import { Building2, ShieldCheck, Clock, CheckCircle, ArrowRight, ArrowLeft, FileText, UserCheck } from 'lucide-react';

export const FlatVerificationScreen: React.FC = () => {
  const { household, fullName, residentType, handleSubmitVerification, setCurrentStep } = useResidentAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const onSubmit = () => {
    setIsSubmitted(true);
  };

  return (
    <div className="flex flex-col h-full justify-between p-6 sm:p-8 bg-[#F6F8FC] text-[#202124]">
      <div>
        {/* Top Back Nav */}
        {!isSubmitted && (
          <button
            onClick={() => setCurrentStep('RESIDENT_PROFILE')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#173B72] transition-colors mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Profile</span>
          </button>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-[#EEF4FE] text-[#2F6FED] border border-blue-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#2F6FED]" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2F6FED]">Step 3 of 3</span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#173B72]">
              Flat Verification
            </h1>
          </div>
        </div>
        <p className="text-xs text-[#667085] leading-relaxed mb-5">
          Review your household details before submitting to the society administrator.
        </p>

        {/* Confirmation Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#DCE3EE] shadow-sm mb-4">
          <div className="flex items-center justify-between pb-4 border-b border-[#DCE3EE] mb-4">
            <div>
              <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider">Household Unit</span>
              <h2 className="text-lg font-bold text-[#173B72]">{household.flatNumber}</h2>
              <p className="text-xs text-[#667085]">{household.tower} · {household.societyName}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#EEF4FE] flex items-center justify-center text-[#173B72] font-bold text-sm">
              <Building2 className="w-6 h-6 text-[#2F6FED]" />
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-[#667085]">Resident Name</span>
              <strong className="text-[#202124] font-semibold">{fullName}</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-[#667085]">Role</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#EEF4FE] text-[#173B72]">
                {residentType}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[#667085]">Verification Status</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                <Clock className="w-3.5 h-3.5" /> Pending Verification
              </span>
            </div>
          </div>
        </div>

        {/* Admin Verification SLA Notice */}
        {!isSubmitted ? (
          <div className="rounded-2xl bg-amber-50/80 border border-amber-200 p-4 flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">Admin Review Policy</h4>
              <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
                Your flat registration will be verified by the community administrator. You can still set up your family profile and view upcoming sports events in restricted mode.
              </p>
            </div>
          </div>
        ) : (
          /* Post Submission Success State */
          <div className="rounded-2xl bg-green-50 border border-green-200 p-5 text-center animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-full bg-[#16A34A] text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-green-600/20">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#16A34A] mb-1">Registration submitted ✓</h3>
            <p className="text-xs text-green-800 max-w-xs mx-auto leading-relaxed">
              Your community administrator will review your request. In the meantime, you can add your family members!
            </p>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="mt-6">
        {!isSubmitted ? (
          <button
            onClick={onSubmit}
            className="w-full py-3.5 px-5 rounded-xl font-semibold text-sm bg-[#173B72] hover:bg-[#1F4B8F] active:bg-[#142F5B] text-white shadow-sm shadow-[#173B72]/20 cursor-pointer flex items-center justify-center gap-2 transition-all"
          >
            <span>Submit Registration</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => {
              handleSubmitVerification();
              setCurrentStep('ADD_FAMILY_LANDING');
            }}
            className="w-full py-3.5 px-5 rounded-xl font-semibold text-sm bg-[#2F6FED] hover:bg-blue-600 active:bg-blue-700 text-white shadow-sm shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2 transition-all"
          >
            <span>Continue to Add Family Members</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
