import React, { useEffect, useState } from 'react';
import { healthcareOpsService, ProviderCredential, CredentialStatus } from '@/services/healthcare/healthcareOpsService';
import { getStoredUser } from '@/services/common/apiClient';

const STATUS_STYLES: Record<CredentialStatus, string> = {
  VALID: 'bg-green-100 text-green-800',
  EXPIRING_SOON: 'bg-amber-100 text-amber-800',
  EXPIRED: 'bg-red-100 text-red-800',
  REVOKED: 'bg-gray-200 text-gray-600',
};

export function ProviderCredentialManager() {
  const [creds, setCreds] = useState<ProviderCredential[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [doctorId, setDoctorId] = useState('');
  const [form, setForm] = useState({ credentialType: 'MEDICAL_LICENSE', credentialNumber: '', issuingBody: '', expiryDate: '' });
  const user = getStoredUser();
  const communityId = user?.communityId ?? 0;

  const loadExpiring = async () => {
    setLoading(true);
    try {
      const data = await healthcareOpsService.getExpiringCredentials(communityId, 60);
      setCreds(data);
    } finally { setLoading(false); }
  };

  const loadForDoctor = async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const data = await healthcareOpsService.getCredentials(Number(doctorId));
      setCreds(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadExpiring(); }, [communityId]);

  const addCred = async () => {
    if (!doctorId) return;
    await healthcareOpsService.addCredential({ ...form, doctorId: Number(doctorId) });
    setShowAdd(false);
    loadForDoctor();
  };

  const expiringCount = creds.filter(c => c.status === 'EXPIRING_SOON').length;
  const expiredCount = creds.filter(c => c.status === 'EXPIRED').length;

  return (
    <div className="p-4">
      <div className="flex gap-4 mb-4 text-sm">
        <span className="font-semibold text-amber-600">{expiringCount} expiring soon</span>
        <span className="font-semibold text-red-600">{expiredCount} expired</span>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="number"
          placeholder="Doctor ID"
          value={doctorId}
          onChange={e => setDoctorId(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-32"
        />
        <button onClick={loadForDoctor} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">Load Doctor</button>
        <button onClick={loadExpiring} className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm">Show All Expiring</button>
        <button onClick={() => setShowAdd(true)} className="ml-auto px-3 py-2 bg-green-600 text-white rounded text-sm">+ Add Credential</button>
      </div>

      {loading ? <p className="text-gray-500 text-sm">Loading…</p> : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-3 border-b">Doctor</th>
              <th className="p-3 border-b">Type</th>
              <th className="p-3 border-b">Number</th>
              <th className="p-3 border-b">Issuing Body</th>
              <th className="p-3 border-b">Expires</th>
              <th className="p-3 border-b">Status</th>
            </tr>
          </thead>
          <tbody>
            {creds.map(c => (
              <tr key={c.id} className={`border-b hover:bg-gray-50 ${c.status === 'EXPIRED' ? 'bg-red-50' : c.status === 'EXPIRING_SOON' ? 'bg-amber-50' : ''}`}>
                <td className="p-3">#{c.doctorId}</td>
                <td className="p-3">{c.credentialType.replace('_', ' ')}</td>
                <td className="p-3">{c.credentialNumber ?? '—'}</td>
                <td className="p-3">{c.issuingBody ?? '—'}</td>
                <td className="p-3">{c.expiryDate}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[c.status]}`}>
                    {c.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
            {creds.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-gray-400">No credentials found</td></tr>}
          </tbody>
        </table>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
            <h3 className="font-bold mb-4">Add Credential</h3>
            <div className="space-y-3">
              <select value={form.credentialType} onChange={e => setForm(f => ({ ...f, credentialType: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm">
                {['MEDICAL_LICENSE','DEGREE','SPECIALIZATION','DEA','BOARD_CERTIFICATION','INSURANCE','OTHER'].map(t =>
                  <option key={t}>{t}</option>)}
              </select>
              <input placeholder="Credential number" value={form.credentialNumber} onChange={e => setForm(f => ({ ...f, credentialNumber: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
              <input placeholder="Issuing body" value={form.issuingBody} onChange={e => setForm(f => ({ ...f, issuingBody: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
              <label className="text-xs text-gray-500">Expiry date</label>
              <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-100 rounded text-sm">Cancel</button>
              <button onClick={addCred} className="px-4 py-2 bg-green-600 text-white rounded text-sm">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
