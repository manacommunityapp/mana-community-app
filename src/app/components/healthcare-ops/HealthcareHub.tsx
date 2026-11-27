import React, { useState } from 'react';
import { NoShowManager } from './NoShowManager';
import { SlotUtilizationReport } from './SlotUtilizationReport';
import { ProviderCredentialManager } from './ProviderCredentialManager';
import { PrescriptionFollowupManager } from './PrescriptionFollowupManager';
import { DiagnosticsOrderManager } from './DiagnosticsOrderManager';
import { ReferralManager } from './ReferralManager';
import { CaregiverConsentManager } from './CaregiverConsentManager';

const TABS = [
  { id: 'noshows', label: 'No-shows' },
  { id: 'utilization', label: 'Slot Utilisation' },
  { id: 'credentials', label: 'Provider Credentials' },
  { id: 'followups', label: 'Prescription Follow-ups' },
  { id: 'diagnostics', label: 'Diagnostics Orders' },
  { id: 'referrals', label: 'Referrals' },
  { id: 'caregiver', label: 'Caregiver Consent' },
] as const;

type TabId = typeof TABS[number]['id'];

export function HealthcareHub() {
  const [activeTab, setActiveTab] = useState<TabId>('noshows');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-bold text-gray-800">Healthcare Operations</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage no-shows, provider credentials, diagnostics, referrals and caregiver access</p>
      </div>

      <div className="bg-white border-b px-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'noshows' && <NoShowManager />}
        {activeTab === 'utilization' && <SlotUtilizationReport />}
        {activeTab === 'credentials' && <ProviderCredentialManager />}
        {activeTab === 'followups' && <PrescriptionFollowupManager />}
        {activeTab === 'diagnostics' && <DiagnosticsOrderManager />}
        {activeTab === 'referrals' && <ReferralManager />}
        {activeTab === 'caregiver' && <CaregiverConsentManager />}
      </div>
    </div>
  );
}
