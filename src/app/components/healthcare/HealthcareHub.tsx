import { useState } from 'react';
import { NoShowManager } from './NoShowManager';
import { CredentialTracker } from './CredentialTracker';
import { FollowupTracker } from './FollowupTracker';
import { ReferralBoard } from './ReferralBoard';
import { DiagnosticsSlaMonitor } from './DiagnosticsSlaMonitor';

type Tab = 'no-shows' | 'credentials' | 'followups' | 'referrals' | 'diagnostics';

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'no-shows', label: 'No-Shows', icon: '🚫' },
  { key: 'credentials', label: 'Credentials', icon: '📋' },
  { key: 'followups', label: 'Follow-ups', icon: '💊' },
  { key: 'referrals', label: 'Referrals', icon: '↗' },
  { key: 'diagnostics', label: 'Diagnostics SLA', icon: '🔬' },
];

export function HealthcareHub() {
  const [active, setActive] = useState<Tab>('no-shows');
  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '16px 32px' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Healthcare Operations</h1>
      </div>
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 32px', display: 'flex' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActive(tab.key)} style={{ padding: '12px 20px', border: 'none', borderBottom: active === tab.key ? '2px solid #3B82F6' : '2px solid transparent', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: active === tab.key ? 600 : 400, color: active === tab.key ? '#3B82F6' : '#6B7280', display: 'flex', alignItems: 'center', gap: 6, marginBottom: -1 }}>
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>
      <div>
        {active === 'no-shows' && <NoShowManager />}
        {active === 'credentials' && <CredentialTracker />}
        {active === 'followups' && <FollowupTracker />}
        {active === 'referrals' && <ReferralBoard />}
        {active === 'diagnostics' && <DiagnosticsSlaMonitor />}
      </div>
    </div>
  );
}
