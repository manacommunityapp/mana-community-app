import React, { useState } from 'react';
import SubscriptionManager from './SubscriptionManager';
import OpenPlayManager from './OpenPlayManager';
import DepositManager from './DepositManager';
import PlayerRatingManager from './PlayerRatingManager';
import CoachPackageManager from './CoachPackageManager';
import RefereeManager from './RefereeManager';
import WaitlistManager from './WaitlistManager';
import SponsorManager from './SponsorManager';
import MerchandiseManager from './MerchandiseManager';
import PlayerLeaderboard from './PlayerLeaderboard';

const TABS = [
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'open-play', label: 'Open Play' },
  { id: 'waitlist', label: 'Waitlist' },
  { id: 'deposits', label: 'Deposits' },
  { id: 'ratings', label: 'Ratings' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'coaching', label: 'Coaching' },
  { id: 'referees', label: 'Referees' },
  { id: 'sponsors', label: 'Sponsors' },
  { id: 'merchandise', label: 'Merchandise' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function SportsOpsHub() {
  const [activeTab, setActiveTab] = useState<TabId>('subscriptions');

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px' }}>
        <h1 style={{ margin: 0, padding: '20px 0 0', fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Sports Operations</h1>
        <div style={{ display: 'flex', gap: 4, marginTop: 12, overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600,
                fontSize: 14, color: activeTab === tab.id ? '#2563eb' : '#64748b', whiteSpace: 'nowrap',
                borderBottom: activeTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                transition: 'color 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        {activeTab === 'subscriptions' && <SubscriptionManager />}
        {activeTab === 'open-play' && <OpenPlayManager />}
        {activeTab === 'waitlist' && <WaitlistManager />}
        {activeTab === 'deposits' && <DepositManager />}
        {activeTab === 'ratings' && <PlayerRatingManager />}
        {activeTab === 'coaching' && <CoachPackageManager />}
        {activeTab === 'referees' && <RefereeManager />}
        {activeTab === 'leaderboard' && <PlayerLeaderboard />}
        {activeTab === 'sponsors' && <SponsorManager />}
        {activeTab === 'merchandise' && <MerchandiseManager />}
      </div>
    </div>
  );
}
