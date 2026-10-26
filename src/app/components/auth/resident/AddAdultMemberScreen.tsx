import React, { useState } from 'react';
import { useResidentAuth } from './ResidentAuthContext';
import type { RelationshipToFlat } from './ResidentAuthTypes';
import { UserPlus, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle, Smartphone } from 'lucide-react';

export const AddAdultMemberScreen: React.FC = () => {
  const { handleAddAdultMember, setCurrentStep } = useResidentAuth();

  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [relationship, setRelationship] = useState<RelationshipToFlat>('SPOUSE');
  const [memberDob, setMemberDob] = useState('');
  const [allowAppAccess, setAllowAppAccess] = useState(true);
  const [isSent, setIsSent] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    if (raw.length > 5) {
      setMemberPhone(`${raw.slice(0, 5)} ${raw.slice(5)}`);
    } else {
      setMemberPhone(raw);
    }
  };

  const isComplete = memberName.trim().length >= 2 && memberPhone.replace(/\D/g, '').length === 10;

  const relationshipOptions: { value: RelationshipToFlat; label: string }[] = [
    { value: 'SPOUSE', label: 'Spouse' },
    { value: 'PARENT', label: 'Parent' },
    { value: 'SIBLING', label: 'Sibling' },
    { value: 'ADULT_CHILD', label: 'Adult Child' },
    { value: 'OTHER_FAMILY', label: 'Other' },
  ];

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) return;
    setIsSent(true);
  };

  const handleFinish = () => {
    handleAddAdultMember({
      fullName: memberName,
      mobile: `+91 ${memberPhone}`,
      relationship,
      dob: memberDob,
      appAccess: allowAppAccess,
    });
  };

  return (
    <div className="flex flex-col h-full justify-between p-6 sm:p-8 bg-[#F6F8FC] text-[#202124]">
      <div>
        {/* Top Back Nav */}
        {!isSent && (
          <button
            onClick={() => setCurrentStep('ADD_FAMILY_LANDING')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#173B72] transition-colors mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Family</span>
          </button>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-[#EEF4FE] text-[#2F6FED] border border-blue-100 flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5 text-[#2F6FED]" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2F6FED]">Individual Access</span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#173B72]">
              Add Family Member
            </h1>
          </div>
        </div>
        <p className="text-xs text-[#667085] leading-relaxed mb-4">
          Invite an adult family member. They will log in securely with their own phone number.
        </p>

        {!isSent ? (
          /* Form */
          <form onSubmit={onSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div className="bg-white rounded-2xl p-3.5 border border-[#DCE3EE] shadow-sm">
              <label className="block text-xs font-semibold text-[#667085] uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full text-sm font-semibold text-[#202124] border border-[#DCE3EE] rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                autoFocus
              />
            </div>

            {/* Mobile Number */}
            <div className="bg-white rounded-2xl p-3.5 border border-[#DCE3EE] shadow-sm">
              <label className="block text-xs font-semibold text-[#667085] uppercase tracking-wider mb-1.5">
                Mobile Number *
              </label>
              <div className="flex items-center gap-2 border border-[#DCE3EE] rounded-xl px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-[#2F6FED]">
                <div className="flex items-center gap-1 pr-2 border-r border-gray-200 text-xs font-semibold text-[#202124]">
                  <span>🇮🇳</span>
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  value={memberPhone}
                  onChange={handlePhoneChange}
                  placeholder="98765 88990"
                  className="w-full text-sm font-medium text-[#202124] focus:outline-none"
                  maxLength={11}
                />
              </div>
            </div>

            {/* Relationship */}
            <div className="bg-white rounded-2xl p-3.5 border border-[#DCE3EE] shadow-sm">
              <label className="block text-xs font-semibold text-[#667085] uppercase tracking-wider mb-2">
                Relationship *
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {relationshipOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRelationship(opt.value)}
                    className={`py-2 px-1 text-[11px] font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                      relationship === opt.value
                        ? 'border-[#2F6FED] bg-[#EEF4FE] text-[#173B72]'
                        : 'border-[#DCE3EE] text-[#667085]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date of Birth */}
            <div className="bg-white rounded-2xl p-3.5 border border-[#DCE3EE] shadow-sm">
              <label className="block text-xs font-semibold text-[#667085] uppercase tracking-wider mb-1.5">
                Date of Birth (Optional)
              </label>
              <input
                type="date"
                value={memberDob}
                onChange={(e) => setMemberDob(e.target.value)}
                className="w-full text-xs font-semibold text-[#202124] border border-[#DCE3EE] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
              />
            </div>

            {/* App Access Toggle */}
            <div className="bg-white rounded-2xl p-3.5 border border-[#DCE3EE] shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EEF4FE] text-[#2F6FED] flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#173B72]">Allow app access</h4>
                  <p className="text-[11px] text-[#667085]">Sends SMS invitation with login link</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowAppAccess}
                  onChange={(e) => setAllowAppAccess(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2F6FED]" />
              </label>
            </div>
          </form>
        ) : (
          /* Success Card */
          <div className="rounded-2xl bg-green-50 border border-green-200 p-6 text-center animate-in fade-in duration-300 my-4">
            <div className="w-14 h-14 rounded-full bg-[#16A34A] text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-green-600/20">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-[#16A34A] mb-1">Invitation sent ✓</h3>
            <p className="text-sm text-green-900 font-medium mb-2">
              <strong className="font-bold">{memberName}</strong> can log in using her own mobile number (+91 {memberPhone}).
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs text-green-800 bg-white/80 px-3 py-1.5 rounded-full border border-green-200">
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              <span>No shared password required</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="mt-6">
        {!isSent ? (
          <button
            onClick={onSubmit}
            disabled={!isComplete}
            className={`w-full py-3.5 px-5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
              isComplete
                ? 'bg-[#173B72] hover:bg-[#1F4B8F] active:bg-[#142F5B] text-white shadow-[#173B72]/20 cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>Send Invitation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="w-full py-3.5 px-5 rounded-xl font-semibold text-sm bg-[#173B72] hover:bg-[#1F4B8F] text-white shadow-sm shadow-[#173B72]/20 cursor-pointer flex items-center justify-center gap-2 transition-all"
          >
            <span>Return to Family Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
