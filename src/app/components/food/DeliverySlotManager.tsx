import React, { useState, useEffect } from 'react';
import { foodOpsService, DeliverySlotDto, SlotTemplateDto, SlotStatus } from '../../../services/food/foodOpsService';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function slotColor(booked: number, capacity: number): string {
  const pct = capacity > 0 ? booked / capacity : 0;
  if (pct >= 0.8) return '#DC2626';
  if (pct >= 0.5) return '#D97706';
  return '#059669';
}

function statusBadge(s: SlotStatus) {
  const cfg: Record<SlotStatus, { bg: string; text: string; label: string }> = {
    OPEN:          { bg: '#D1FAE5', text: '#065F46', label: 'Open' },
    FULL:          { bg: '#FEE2E2', text: '#991B1B', label: 'Full' },
    CUTOFF: { bg: '#FEF3C7', text: '#92400E', label: 'Cutoff' },
    CUTOFF_PASSED: { bg: '#FEF3C7', text: '#92400E', label: 'Cutoff' },
    CANCELLED:     { bg: '#F3F4F6', text: '#6B7280', label: 'Cancelled' },
  };
  const c = cfg[s] ?? cfg.OPEN;
  return (
    <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: c.bg, color: c.text }}>
      {c.label}
    </span>
  );
}

export function DeliverySlotManager({ vendorId, communityId }: { vendorId?: number; communityId?: number }) {
  const vid = vendorId ?? 1;
  const cid = communityId ?? 1;
  const [tab, setTab] = useState<'templates' | 'slots'>('slots');
  const [slots, setSlots] = useState<DeliverySlotDto[]>([]);
  const [templates, setTemplates] = useState<SlotTemplateDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState<Partial<SlotTemplateDto>>({});

  useEffect(() => {
    setLoading(true);
    if (tab === 'slots') {
      foodOpsService.getSlots(vid, cid).then(setSlots).finally(() => setLoading(false));
    } else {
      foodOpsService.getSlotTemplates(vid, cid).then(setTemplates).finally(() => setLoading(false));
    }
  }, [tab, vid, cid]);

  const saveTemplate = async () => {
    if (editTemplate.id) {
      await foodOpsService.updateSlotTemplate(editTemplate.id, editTemplate);
    } else {
      await foodOpsService.createSlotTemplate(editTemplate);
    }
    setShowModal(false);
    setEditTemplate({});
    foodOpsService.getSlotTemplates(vid, cid).then(setTemplates);
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Delivery Slots</h2>
        {tab === 'templates' && (
          <button onClick={() => { setEditTemplate({}); setShowModal(true); }}
            style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>
            + Add Template
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['slots', 'templates'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #E5E7EB', cursor: 'pointer', fontWeight: 600,
              background: tab === t ? '#2563EB' : '#fff', color: tab === t ? '#fff' : '#374151' }}>
            {t === 'slots' ? 'Upcoming Slots' : 'Templates'}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color: '#6B7280' }}>Loading…</p> : tab === 'slots' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
          {slots.length === 0 && <p style={{ color: '#6B7280', gridColumn: '1/-1' }}>No upcoming slots.</p>}
          {slots.map(s => {
            const color = slotColor(s.bookedCount, s.capacity);
            return (
              <div key={s.id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>{s.slotDate}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{s.slotStart}–{s.slotEnd}</div>
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 20, color }}>{s.bookedCount}/{s.capacity}</span>
                  {statusBadge(s.status)}
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>Cutoff: {s.cutoffAt?.substring(11, 16)}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              {['Day', 'Time', 'Cutoff (hrs)', 'Capacity', 'Active', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#374151', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {templates.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '10px 12px' }}>{DAYS[t.dayOfWeek ?? 0]}</td>
                <td style={{ padding: '10px 12px' }}>{t.slotStart}–{t.slotEnd}</td>
                <td style={{ padding: '10px 12px' }}>{t.cutoffHours}</td>
                <td style={{ padding: '10px 12px' }}>{t.capacity}</td>
                <td style={{ padding: '10px 12px' }}>{t.active ? '✅' : '❌'}</td>
                <td style={{ padding: '10px 12px' }}>
                  <button onClick={() => { setEditTemplate(t); setShowModal(true); }}
                    style={{ background: 'none', border: '1px solid #2563EB', color: '#2563EB', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>{editTemplate.id ? 'Edit' : 'New'} Template</h3>
            {[
              { label: 'Day of Week (0=Sun)', key: 'dayOfWeek', type: 'number' },
              { label: 'Start Time (HH:MM)', key: 'slotStart', type: 'text' },
              { label: 'End Time (HH:MM)', key: 'slotEnd', type: 'text' },
              { label: 'Cutoff Hours', key: 'cutoffHours', type: 'number' },
              { label: 'Capacity', key: 'capacity', type: 'number' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input type={f.type}
                  value={(editTemplate as any)[f.key] ?? ''}
                  onChange={e => setEditTemplate(prev => ({ ...prev, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                  style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: 8, padding: '8px 10px', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setShowModal(false)}
                style={{ border: '1px solid #D1D5DB', background: '#fff', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveTemplate}
                style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
