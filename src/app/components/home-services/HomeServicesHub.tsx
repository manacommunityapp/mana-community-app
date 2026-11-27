import React, { useState } from 'react';
import BookingManager from './BookingManager';
import RecurringPlanManager from './RecurringPlanManager';
import WorkerBrowser from './WorkerBrowser';

const TABS = [
  { key: 'bookings', label: 'My Bookings' },
  { key: 'workers', label: 'Workers' },
  { key: 'plans', label: 'Recurring Plans' },
];

export default function HomeServicesHub() {
  const [tab, setTab] = useState('bookings');

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px 0' }}>
        <h1 style={{ margin: '0 0 16px', fontSize: 24, fontWeight: 800, color: '#1e293b' }}>Home Services</h1>
        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '8px 16px', border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer',
                fontWeight: tab === t.key ? 700 : 500, fontSize: 13,
                background: tab === t.key ? '#f8fafc' : 'transparent',
                color: tab === t.key ? '#2563eb' : '#64748b',
                borderBottom: tab === t.key ? '2px solid #2563eb' : '2px solid transparent',
              }}
            >{t.label}</button>
          ))}
        </div>
      </div>
      <div>
        {tab === 'bookings' && <BookingManager />}
        {tab === 'workers' && <WorkerBrowser />}
        {tab === 'plans' && <RecurringPlanManager />}
      </div>
    </div>
  );
}
