import React, { useEffect, useState } from 'react';
import { healthcareOpsService, CaregiverConsent } from '@/services/healthcare/healthcareOpsService';

export function CaregiverConsentManager() {
  const [consents, setConsents] = useState<CaregiverConsent[]>([]);
  const [patientId, setPatientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    caregiverUserId: '',
    relationship: '',
    canViewRecords: true,
    canBookAppointments: false,
    canReceiveReports: false,
  });

  const load = async () => {
    if (!patientId) return;
    setLoading(true);
    try { setConsents(await healthcareOpsService.getCaregiverConsents(Number(patientId))); }
    finally { setLoading(false); }
  };

  const grant = async () => {
    await healthcareOpsService.grantConsent({
      patientUserId: Number(patientId),
      caregiverUserId: Number(form.caregiverUserId),
      relationship: form.relationship,
      canViewRecords: form.canViewRecords,
      canBookAppointments: form.canBookAppointments,
      canReceiveReports: form.canReceiveReports,
    });
    setShowAdd(false);
    load();
  };

  const revoke = async (id: number) => {
    await healthcareOpsService.revokeConsent(id);
    load();
  };

  return (
    <div className="p-4">
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-4">
        Caregiver consent is patient-initiated. Only patients may grant access to caregivers. This view is for support and audit use only.
      </p>

      <div className="flex gap-2 mb-4">
        <input type="number" placeholder="Patient ID" value={patientId} onChange={e => setPatientId(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-32" />
        <button onClick={load} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">Load</button>
        {patientId && (
          <button onClick={() => setShowAdd(true)} className="ml-auto px-3 py-2 bg-green-600 text-white rounded text-sm">+ Grant Consent</button>
        )}
      </div>

      {loading ? <p className="text-gray-500 text-sm">Loading…</p> : (
        <div className="space-y-3">
          {consents.map(c => (
            <div key={c.id} className={`bg-white border rounded-lg p-4 shadow-sm ${!c.isActive ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-sm">Caregiver #{c.caregiverUserId} · {c.relationship}</div>
                  <div className="text-xs text-gray-500 mt-1">Granted {c.grantedAt?.slice(0,10)}{c.expiresAt ? ` · Expires ${c.expiresAt.slice(0,10)}` : ''}</div>
                  <div className="flex gap-3 mt-2 text-xs">
                    <Permission label="View Records" enabled={c.canViewRecords} />
                    <Permission label="Book Appointments" enabled={c.canBookAppointments} />
                    <Permission label="Receive Reports" enabled={c.canReceiveReports} />
                  </div>
                </div>
                {c.isActive && (
                  <button onClick={() => revoke(c.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs">Revoke</button>
                )}
              </div>
            </div>
          ))}
          {!patientId && <p className="text-gray-400 text-sm text-center py-6">Enter a patient ID to manage consents</p>}
          {patientId && consents.length === 0 && !loading && <p className="text-gray-400 text-sm text-center py-6">No caregiver consents found</p>}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-xl">
            <h3 className="font-bold mb-1">Grant Caregiver Consent</h3>
            <p className="text-xs text-gray-500 mb-4">Patient #{patientId} is granting access to a caregiver.</p>
            <div className="space-y-3">
              <input type="number" placeholder="Caregiver User ID" value={form.caregiverUserId}
                onChange={e => setForm(f => ({ ...f, caregiverUserId: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm" />
              <input placeholder="Relationship (e.g. Spouse, Parent)" value={form.relationship}
                onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm" />
              <div className="space-y-2">
                <CheckRow label="Can view medical records" checked={form.canViewRecords}
                  onChange={v => setForm(f => ({ ...f, canViewRecords: v }))} />
                <CheckRow label="Can book appointments" checked={form.canBookAppointments}
                  onChange={v => setForm(f => ({ ...f, canBookAppointments: v }))} />
                <CheckRow label="Can receive lab reports" checked={form.canReceiveReports}
                  onChange={v => setForm(f => ({ ...f, canReceiveReports: v }))} />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-100 rounded text-sm">Cancel</button>
              <button onClick={grant} className="px-4 py-2 bg-green-600 text-white rounded text-sm">Grant</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Permission({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <span className={`px-2 py-0.5 rounded-full font-medium ${enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
      {enabled ? '✓' : '✗'} {label}
    </span>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="rounded" />
      {label}
    </label>
  );
}
