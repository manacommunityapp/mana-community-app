import React, { useState } from 'react';
import { useResidentAuth } from './ResidentAuthContext';
import type { ChildRelationship } from './ResidentAuthTypes';
import { Baby, ArrowLeft, ArrowRight, ShieldCheck, Trophy, Sparkles } from 'lucide-react';

export const AddChildScreen: React.FC = () => {
  const { handleAddChild, setCurrentStep } = useResidentAuth();

  const [childName, setChildName] = useState('');
  const [childDob, setChildDob] = useState('');
  const [childGender, setChildGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [relationship, setRelationship] = useState<ChildRelationship>('SON');
  const [isParentManaged, setIsParentManaged] = useState(true);

  // Calculate age
  const calculateAge = (dobString: string): number | null => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  const computedAge = calculateAge(childDob);
  const isComplete = childName.trim().length >= 2 && childDob.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) return;

    handleAddChild({
      fullName: childName,
      dob: childDob,
      gender: childGender,
      relationship,
    });
  };

  return (
    <div className="flex flex-col h-full justify-between p-6 sm:p-8 bg-[#F6F8FC] text-[#202124]">
      <div>
        {/* Top Back Nav */}
        <button
          onClick={() => setCurrentStep('ADD_FAMILY_LANDING')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#173B72] transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Family</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
            <Baby className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Dependent Profile</span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#173B72]">
              Add Child
            </h1>
          </div>
        </div>
        <p className="text-xs text-[#667085] leading-relaxed mb-4">
          Add child profiles for tournament brackets, junior cricket leagues, and event registrations.
        </p>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Child Name */}
          <div className="bg-white rounded-2xl p-3.5 border border-[#DCE3EE] shadow-sm">
            <label className="block text-xs font-semibold text-[#667085] uppercase tracking-wider mb-1.5">
              Child's Full Name *
            </label>
            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="e.g. Arjun Kumar"
              className="w-full text-sm font-semibold text-[#202124] border border-[#DCE3EE] rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
              autoFocus
            />
          </div>

          {/* Date of Birth & Live Age Calculation */}
          <div className="bg-white rounded-2xl p-3.5 border border-[#DCE3EE] shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#667085] uppercase tracking-wider">
                Date of Birth *
              </label>
              {computedAge !== null && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#173B72] bg-[#EEF4FE] px-2 py-0.5 rounded-md">
                  <Sparkles className="w-3 h-3 text-[#2F6FED]" />
                  Age: {computedAge} years old
                </span>
              )}
            </div>
            <input
              type="date"
              value={childDob}
              onChange={(e) => setChildDob(e.target.value)}
              className="w-full text-xs font-semibold text-[#202124] border border-[#DCE3EE] rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
            />
            {computedAge !== null && (
              <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-[11px] text-[#16A34A] font-medium">
                <Trophy className="w-3.5 h-3.5" />
                <span>Eligible for: {computedAge <= 10 ? 'U-10 Cricket & Swimming' : 'U-14 Junior Tournaments'}</span>
              </div>
            )}
          </div>

          {/* Gender & Relationship */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    onClick={() => setChildGender(g)}
                    className={`py-2 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                      childGender === g
                        ? 'border-[#2F6FED] bg-[#EEF4FE] text-[#173B72]'
                        : 'border-[#DCE3EE] text-[#667085]'
                    }`}
                  >
                    {g === 'MALE' ? 'Boy' : g === 'FEMALE' ? 'Girl' : 'Other'}
                  </button>
                ))}
              </div>
            </div>

            {/* Relationship */}
            <div className="bg-white rounded-2xl p-3.5 border border-[#DCE3EE] shadow-sm">
              <label className="block text-xs font-semibold text-[#667085] uppercase tracking-wider mb-1.5">
                Relationship
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['SON', 'DAUGHTER', 'DEPENDENT_OTHER'] as const).map((rel) => (
                  <button
                    key={rel}
                    type="button"
                    onClick={() => setRelationship(rel)}
                    className={`py-2 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                      relationship === rel
                        ? 'border-[#2F6FED] bg-[#EEF4FE] text-[#173B72]'
                        : 'border-[#DCE3EE] text-[#667085]'
                    }`}
                  >
                    {rel === 'SON' ? 'Son' : rel === 'DAUGHTER' ? 'Daughter' : 'Ward'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Parent Managed Toggle & Explanation */}
          <div className="bg-white rounded-2xl p-3.5 border border-[#DCE3EE] shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#173B72]">Parent Managed</h4>
                <p className="text-[11px] text-[#667085]">No phone number or password required</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isParentManaged}
                onChange={(e) => setIsParentManaged(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2F6FED]" />
            </label>
          </div>

          <div className="rounded-xl bg-[#EEF4FE] p-3 text-xs text-[#173B72] leading-relaxed">
            Children can be added to event registrations and sports matches without requiring their own login.
          </div>
        </form>
      </div>

      {/* Bottom CTA */}
      <div className="mt-6">
        <button
          onClick={handleSubmit}
          disabled={!isComplete}
          className={`w-full py-3.5 px-5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
            isComplete
              ? 'bg-[#173B72] hover:bg-[#1F4B8F] active:bg-[#142F5B] text-white shadow-[#173B72]/20 cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <span>Add Child</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
