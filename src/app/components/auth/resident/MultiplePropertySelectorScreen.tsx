import React from 'react';
import { useResidentAuth } from './ResidentAuthContext';
import type { UserPropertyMembership } from './ResidentAuthTypes';
import { Building2, Home, ArrowRight, PlusCircle, CheckCircle2, Shield, Bell } from 'lucide-react';

export const MultiplePropertySelectorScreen: React.FC = () => {
  const { properties, selectedProperty, handleSelectProperty, setCurrentStep } = useResidentAuth();

  return (
    <div className="flex flex-col h-full justify-between p-6 sm:p-8 bg-[#F6F8FC] text-[#202124]">
      <div>
        {/* Top App Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#173B72] to-[#2F6FED] text-white flex items-center justify-center shadow-md shadow-[#173B72]/15">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2F6FED]">Multi-Property Access</span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#173B72]">
                Select Property
              </h1>
            </div>
          </div>
        </div>
        <p className="text-xs text-[#667085] leading-relaxed mb-5">
          Your Mana ID is linked to multiple residences. Choose which household context to open.
        </p>

        {/* Property Cards List */}
        <div className="space-y-3">
          {properties.map((prop: UserPropertyMembership) => {
            const isCurrent = selectedProperty?.id === prop.id;
            return (
              <div
                key={prop.id}
                className={`bg-white rounded-2xl p-4 border transition-all shadow-sm ${
                  isCurrent
                    ? 'border-[#2F6FED] ring-2 ring-[#2F6FED]/20'
                    : 'border-[#DCE3EE] hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      isCurrent ? 'bg-[#EEF4FE] text-[#2F6FED]' : 'bg-gray-100 text-[#667085]'
                    }`}>
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#173B72]">{prop.flatNumber}</h3>
                        {prop.isPrimary && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Primary Residence
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#667085] mt-0.5">
                        {prop.tower} · {prop.societyName}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-[#EEF4FE] text-[#173B72]">
                    {prop.residentType}
                  </span>
                </div>

                {/* Quick Indicators & Action Button */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-[#667085]">
                    <span className="flex items-center gap-1">
                      <Bell className="w-3.5 h-3.5 text-[#2F6FED]" />
                      {prop.unreadNoticesCount} notices
                    </span>
                    <span>·</span>
                    <span>{prop.upcomingEventsCount} events</span>
                  </div>

                  <button
                    onClick={() => handleSelectProperty(prop)}
                    className="py-2 px-4 rounded-xl font-bold text-xs bg-[#173B72] hover:bg-[#1F4B8F] text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Enter</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Another Property Link */}
        <button
          onClick={() => setCurrentStep('REGISTER_FLAT')}
          className="w-full mt-4 p-3.5 rounded-2xl border-2 border-dashed border-[#DCE3EE] hover:border-[#2F6FED] hover:bg-[#EEF4FE]/30 text-center transition-all text-xs font-bold text-[#2F6FED] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Register Another Property / Flat</span>
        </button>
      </div>

      {/* Security Info */}
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#667085]">
        <Shield className="w-3.5 h-3.5 text-[#16A34A]" />
        <span>One Mana ID handles all your properties seamlessly</span>
      </div>
    </div>
  );
};
