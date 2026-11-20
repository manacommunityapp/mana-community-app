import { useState } from 'react';
import { DeliverySlotManager } from './DeliverySlotManager';
import { RecurringBasketManager } from './RecurringBasketManager';
import { DeliveryBatchManager } from './DeliveryBatchManager';
import { RefundManager } from './RefundManager';
import { VendorPrepAnalytics } from './VendorPrepAnalytics';

type Tab = 'slots' | 'baskets' | 'batches' | 'refunds' | 'analytics';

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'slots', label: 'Delivery Slots', icon: '🕐' },
  { key: 'baskets', label: 'Baskets', icon: '🛒' },
  { key: 'batches', label: 'Batches', icon: '🚚' },
  { key: 'refunds', label: 'Refunds', icon: '↩' },
  { key: 'analytics', label: 'Analytics', icon: '📊' },
];

export function FoodOpsHub() {
  const [active, setActive] = useState<Tab>('slots');

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '16px 32px' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Food & Grocery Operations</h1>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 32px', display: 'flex', gap: 0 }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            style={{ padding: '12px 20px', border: 'none', borderBottom: active === tab.key ? '2px solid #3B82F6' : '2px solid transparent', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: active === tab.key ? 600 : 400, color: active === tab.key ? '#3B82F6' : '#6B7280', display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.15s', marginBottom: -1 }}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {active === 'slots' && <DeliverySlotManager />}
        {active === 'baskets' && <RecurringBasketManager />}
        {active === 'batches' && <DeliveryBatchManager />}
        {active === 'refunds' && <RefundManager />}
        {active === 'analytics' && <VendorPrepAnalytics />}
      </div>
    </div>
  );
}
