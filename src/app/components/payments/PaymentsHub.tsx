import React, { useState } from 'react';
import PaymentTimeline from './PaymentTimeline';
import BillReminderManager from './BillReminderManager';
import MandateManager from './MandateManager';
import ReceiptViewer from './ReceiptViewer';
import ReconciliationManager from './ReconciliationManager';
import DisputeManager from './DisputeManager';
import RequestLinkManager from './RequestLinkManager';
import RewardsDashboard from './RewardsDashboard';

const TABS = [
  { key: 'timeline', label: 'Timeline' },
  { key: 'reminders', label: 'Bill Reminders' },
  { key: 'mandates', label: 'Mandates' },
  { key: 'receipts', label: 'Receipts' },
  { key: 'reconciliation', label: 'Reconciliation' },
  { key: 'disputes', label: 'Disputes' },
  { key: 'links', label: 'Request Links' },
  { key: 'rewards', label: 'Rewards' },
];

export default function PaymentsHub() {
  const [tab, setTab] = useState('timeline');

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px 0' }}>
        <h1 style={{ margin: '0 0 16px', fontSize: 24, fontWeight: 800, color: '#1e293b' }}>Payments</h1>
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 1 }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '8px 16px', border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer',
                fontWeight: tab === t.key ? 700 : 500, fontSize: 13, whiteSpace: 'nowrap',
                background: tab === t.key ? '#f8fafc' : 'transparent',
                color: tab === t.key ? '#2563eb' : '#64748b',
                borderBottom: tab === t.key ? '2px solid #2563eb' : '2px solid transparent',
              }}
            >{t.label}</button>
          ))}
        </div>
      </div>
      <div>
        {tab === 'timeline' && <PaymentTimeline />}
        {tab === 'reminders' && <BillReminderManager />}
        {tab === 'mandates' && <MandateManager />}
        {tab === 'receipts' && <ReceiptViewer />}
        {tab === 'reconciliation' && <ReconciliationManager />}
        {tab === 'disputes' && <DisputeManager />}
        {tab === 'links' && <RequestLinkManager />}
        {tab === 'rewards' && <RewardsDashboard />}
      </div>
    </div>
  );
}
