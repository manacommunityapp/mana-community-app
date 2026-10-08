import React from 'react';
import { useResidentAuth, MOCK_SOCIETIES } from './ResidentAuthContext';
import type { ResidentType } from './ResidentAuthTypes';
import { Home, Building, ArrowRight, ArrowLeft, Shield } from 'lucide-react';

export const RegisterFlatScreen: React.FC = () => {
  const {
    selectedSocietyId,
    setSelectedSocietyId,
    selectedTower,
    setSelectedTower,
    flatNumberInput,
    setFlatNumberInput,
    residentType,
    setResidentType,
    handleContinueFlatRegistration,
    setCurrentStep,
  } = useResidentAuth();

  const currentSociety = MOCK_SOCIETIES.find((s) => s.id === selectedSocietyId) || MOCK_SOCIETIES[0];

  const handleSocietyChange = (id: string) => {
    setSelectedSocietyId(id);
    const soc = MOCK_SOCIETIES.find((s) => s.id === id);
    if (soc && soc.towers.length > 0) {
      setSelectedTower(soc.towers[0]);
    }
  };

  const isComplete = flatNumberInput.trim().length > 0;

  const residentTypeOptions: { type: ResidentType; label: string; desc: string }[] = [
    { type: 'OWNER', label: 'Owner', desc: 'I own this apartment / villa' },
    { type: 'TENANT', label: 'Tenant', desc: 'I rent this apartment' },
    { type: 'FAMILY_MEMBER', label: 'Family Member', desc: 'I live with the primary resident' },
  ];

  return (
    <div className="flex flex-col h-full justify-between p-6 sm:p-8 bg-[#F6F8FC] text-[#202124]">
      <div>
        {/* Top Back Nav */}
        <button
          onClick={() => setCurrentStep('OTP_VERIFICATION')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#173B72] transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-[#EEF4FE] text-[#2F6FED] border border-blue-100 flex items-center justify-center shrink-0">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2F6FED]">Step 1 of 3</span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#173B72]">
              Register Your Home
            </h1>
          </div>
        </div>
        <p className="text-xs text-[#667085] leading-relaxed mb-5">
          Link your individual mobile number to your physical household unit.
        </p>

        {/* Form Container */}
        <div className="space-y-4">
          {/* Society Selector */}
          <div className="bg-white rounded-2xl p-4 border border-[#DCE3EE] shadow-sm">
            <label className="block text-xs font-semibold text-[#667085] uppercase tracking-wider mb-2">
              Society / Community *
            </label>
            <div className="relative">
              <select
                value={selectedSocietyId}
                onChange={(e) => handleSocietyChange(e.target.value)}
                className="w-full text-sm font-medium text-[#202124] border border-[#DCE3EE] rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#2F6FED] appearance-none"
              >
                {MOCK_SOCIETIES.map((soc) => (
                  <option key={soc.id} value={soc.id}>
                    {soc.name} ({soc.city})
                  </option>
                ))}
              </select>
              <Building className="w-4 h-4 text-gray-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Building & Flat Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tower / Building */}
            <div className="bg-white rounded-2xl p-4 border border-[#DCE3EE] shadow-sm">
              <label className="block text-xs font-semibold text-[#667085] uppercase tracking-wider mb-2">
                Building / Tower *
              </label>
              <select
                value={selectedTower}
                onChange={(e) => setSelectedTower(e.target.value)}
                className="w-full text-sm font-medium text-[#202124] border border-[#DCE3EE] rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
              >
                {currentSociety.towers.map((tower) => (
                  <option key={tower} value={tower}>
                    {tower}
                  </option>
                ))}
              </select>
            </div>

            {/* Flat Number */}
            <div className="bg-white rounded-2xl p-4 border border-[#DCE3EE] shadow-sm">
              <label className="block text-xs font-semibold text-[#667085] uppercase tracking-wider mb-2">
                Flat / Unit Number *
              </label>
              <input
                type="text"
                value={flatNumberInput}
                onChange={(e) => setFlatNumberInput(e.target.value.toUpperCase())}
                placeholder="e.g. 1204 or V-12"
                className="w-full text-sm font-semibold text-[#202124] border border-[#DCE3EE] rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
              />
            </div>
          </div>

          {/* Resident Type Segmented Cards */}
          <div className="bg-white rounded-2xl p-4 border border-[#DCE3EE] shadow-sm">
            <label className="block text-xs font-semibold text-[#667085] uppercase tracking-wider mb-2.5">
              Resident Type *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {residentTypeOptions.map((opt) => {
                const isSelected = residentType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setResidentType(opt.type)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#2F6FED] bg-[#EEF4FE] text-[#173B72] ring-1 ring-[#2F6FED]'
                        : 'border-[#DCE3EE] hover:border-gray-300 text-[#667085]'
                    }`}
                  >
                    <div className="text-xs font-bold text-[#173B72]">{opt.label}</div>
                    <div className="text-[10px] text-[#667085] mt-0.5 line-clamp-1">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Privacy Note */}
          <div className="flex items-center gap-2 text-xs text-[#667085] px-1">
            <Shield className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
            <span>Multiple residents can belong to this flat with individual logins.</span>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-6">
        <button
          onClick={handleContinueFlatRegistration}
          disabled={!isComplete}
          className={`w-full py-3.5 px-5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
            isComplete
              ? 'bg-[#173B72] hover:bg-[#1F4B8F] active:bg-[#142F5B] text-white shadow-[#173B72]/20 cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <span>Continue to Profile</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
