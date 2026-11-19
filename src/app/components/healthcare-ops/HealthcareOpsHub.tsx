import React, { useState } from 'react';
import { NoShowManager } from './NoShowManager';
import { SlotUtilizationReport } from './SlotUtilizationReport';
import { ProviderCredentialManager } from './ProviderCredentialManager';
import { PrescriptionFollowupManager } from './PrescriptionFollowupManager';

const TABS = [
  { id: 'no-shows', label: 'No-Shows' },
  { id: 'utilization', label: 'Slot Utilization' },
  { id: 'credentials', label: 'Credentials' },
  { id: 'followups', label: 'Follow-ups' },
] as const;

type TabId = typeof TABS[number]['id'];

export function HealthcareOpsHub() {
  const [active, setActive] = useState<TabId>('no-shows');

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '20px 32px 0' }}>
        <h1 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Healthcare Operations</h1>
        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              style={{
                padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap',
                color: active === tab.id ? '#2563eb' : '#64748b',
                borderBottom: active === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                transition: 'color 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        {active === 'no-shows' && <NoShowManager />}
        {active === 'utilization' && <SlotUtilizationReport />}
        {active === 'credentials' && <ProviderCredentialManager />}
        {active === 'followups' && <PrescriptionFollowupManager />}
      </div>
    </div>
  );
}
