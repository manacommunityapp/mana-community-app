import React from 'react';
import { useResidentAuth } from './ResidentAuthContext';
import type { RelationshipToFlat } from './ResidentAuthTypes';
import { User, Mail, Calendar, ArrowRight, ArrowLeft, CheckCircle2, Award } from 'lucide-react';

export const ResidentProfileScreen: React.FC = () => {
  const {
    fullName,
    setFullName,
    email,
    setEmail,
    dob,
    setDob,
    gender,
    setGender,
    relationshipToFlat,
    setRelationshipToFlat,
    isPrimaryResident,
    setIsPrimaryResident,
    mobileNumber,
    residentType,
    handleContinueProfile,
    setCurrentStep,
  } = useResidentAuth();

  const isComplete = fullName.trim().length >= 2 && dob.length > 0;

  const relationshipOptions: { value: RelationshipToFlat; label: string }[] = [
    { value: 'OWNER', label: 'Owner' },
    { value: 'SPOUSE', label: 'Spouse' },
    { value: 'PARENT', label: 'Parent' },
    { value: 'ADULT_CHILD', label: 'Child (Adult)' },
    { value: 'SIBLING', label: 'Sibling' },
    { value: 'OTHER_FAMILY', label: 'Other Family' },
  ];

  return (
    <div className="flex flex-col h-full justify-between p-6 sm:p-8 bg-[#F6F8FC] text-[#202124]">
      <div>
        {/* Top Back Nav */}
        <button
          onClick={() => setCurrentStep('REGISTER_FLAT')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#173B72] transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-[#EEF4FE] text-[#2F6FED] border border-blue-100 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2F6FED]">Step 2 of 3</span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#173B72]">
              Tell us about yourself
            </h1>
          </div>
        </div>
        <p className="text-xs text-[#667085] leading-relaxed mb-4">
          This personal profile will be linked to your Mana ID for community events.
        </p>

        {/* Form Fields Container */}
        <div className="space-y-3.5">
          {/* Full Name */}
          <div className="bg-white rounded-2xl p-3.5 border border-[#DCE3EE] shadow-sm">
            <label className="block text-xs font-semibold text-[#667085] uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Raj Kumar"
              className="w-full text-sm font-semibold text-[#202124] border border-[#DCE3EE] rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
            />
          </div>

          {/* Mobile & Email 2-Col */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mobile (Verified) */}
            <div className="bg-white rounded-2xl p-3.5 border border-[#DCE3EE] shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#667085] uppercase tracking-wider">
                  Mobile Number
                </label>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#16A34A]">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              </div>
              <input
                type="text"
                disabled
                value={`+91 ${mobileNumber}`}
                className="w-full text-xs font-semibold text-[#667085] bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 cursor-not-allowed"
              />
            </div>

            {/* Email */}
            <div className="bg-white rounded-2xl p-3.5 border border-[#DCE3EE] shadow-sm">
              <label className="block text-xs font-semibold text-[#667085] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-xs font-semibold text-[#202124] border border-[#DCE3EE] rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                />
                <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* DOB & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date of Birth */}
            <div className="bg-white rounded-2xl p-3.5 border border-[#DCE3EE] shadow-sm">
              <label className="block text-xs font-semibold text-[#667085] uppercase tracking-wider mb-1.5">
                Date of Birth *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full text-xs font-semibold text-[#202124] border border-[#DCE3EE] rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                />
                <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Gender */}
            <div className="bg-white rounded-2xl p-3.5 border border-[#DCE3EE] shadow-sm">
              <label className="block text-xs font-semibold text-[#667085] uppercase tracking-wider mb-1.5">
                Gender
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['MALE', 'FEMALE', 'OTHER'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-2 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                      gender === g
                        ? 'border-[#2F6FED] bg-[#EEF4FE] text-[#173B72]'
                        : 'border-[#DCE3EE] text-[#667085]'
                    }`}
                  >
                    {g === 'MALE' ? 'Male' : g === 'FEMALE' ? 'Female' : 'Other'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Relationship to Flat */}
          <div className="bg-white rounded-2xl p-3.5 border border-[#DCE3EE] shadow-sm">
            <label className="block text-xs font-semibold text-[#667085] uppercase tracking-wider mb-2">
              Relationship to Flat
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {relationshipOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRelationshipToFlat(opt.value)}
                  className={`py-2 px-1 text-[11px] font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                    relationshipToFlat === opt.value
                      ? 'border-[#2F6FED] bg-[#EEF4FE] text-[#173B72]'
                      : 'border-[#DCE3EE] text-[#667085]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Resident Toggle (If Owner) */}
          {residentType === 'OWNER' && (
            <div className="bg-white rounded-2xl p-3.5 border border-[#DCE3EE] shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#173B72]">Primary Resident</h4>
                  <p className="text-[11px] text-[#667085]">Are you the primary resident for this household?</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrimaryResident}
                  onChange={(e) => setIsPrimaryResident(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2F6FED]" />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-6">
        <button
          onClick={handleContinueProfile}
          disabled={!isComplete}
          className={`w-full py-3.5 px-5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
            isComplete
              ? 'bg-[#173B72] hover:bg-[#1F4B8F] active:bg-[#142F5B] text-white shadow-[#173B72]/20 cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <span>Continue to Verification</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
