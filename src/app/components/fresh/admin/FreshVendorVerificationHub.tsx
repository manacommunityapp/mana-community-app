import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, CheckCircle2, XCircle, Clock, AlertTriangle,
  Building2, Calendar, FileText, Search, Filter, Loader2, Check, X
} from 'lucide-react';
import { freshVendorService } from '../../../../services/freshVendorService';
import type { VendorCapabilityDto } from '../../../../types/freshVendor';

import { FreshAdminDocumentVerificationTab } from './FreshAdminDocumentVerificationTab';

export function FreshVendorVerificationHub() {
  const [activeTab, setActiveTab] = useState<'CAPABILITIES' | 'DOCUMENTS'>('CAPABILITIES');
  const [capabilities, setCapabilities] = useState<VendorCapabilityDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectingItem, setRejectingItem] = useState<VendorCapabilityDto | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadPending = async () => {
    try {
      setLoading(true);
      const data = await freshVendorService.getPendingCapabilities();
      setCapabilities(data || []);
    } catch (err) {
      console.error('Failed to load pending capabilities', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      setProcessingId(id);
      await freshVendorService.reviewCapability(id, { approved: true });
      await loadPending();
    } catch (err: any) {
      alert(err.message || 'Failed to approve capability');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;

    try {
      setProcessingId(rejectingItem.id);
      await freshVendorService.reviewCapability(rejectingItem.id, {
        approved: false,
        rejectionReason
      });
      setRejectingItem(null);
      setRejectionReason('');
      await loadPending();
    } catch (err: any) {
      alert(err.message || 'Failed to reject capability');
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = capabilities.filter(c =>
    (c.vendorBusinessName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.capabilityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.fssaiLicenseNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Admin Header */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold tracking-wider uppercase mb-1">
            <ShieldCheck className="w-4 h-4" /> Central Food Safety & Compliance
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white m-0">
            Vendor Verification & Regulatory Desk
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl m-0">
            Review and certify supplier operational capabilities and multi-document compliance (FSSAI licenses, GST certificates, water testing reports, and PCB clearances).
          </p>
        </div>
        <div className="bg-white/10 rounded-xl p-4 border border-white/10 text-center min-w-[140px]">
          <div className="text-2xl font-black text-amber-400">{capabilities.length}</div>
          <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
            Pending Audits
          </div>
        </div>
      </div>

      {/* Subtabs Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('CAPABILITIES')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'CAPABILITIES'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" /> Capability Approvals ({capabilities.length})
        </button>
        <button
          onClick={() => setActiveTab('DOCUMENTS')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'DOCUMENTS'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" /> Regulatory Document Audits
        </button>
      </div>

      {activeTab === 'DOCUMENTS' ? (
        <FreshAdminDocumentVerificationTab />
      ) : (
        <>
          {/* Filter and Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search vendor, capability, FSSAI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-xl border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing <strong>{filtered.length}</strong> pending {filtered.length === 1 ? 'submission' : 'submissions'}
            </div>
          </div>

          {/* Pending Items List */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-sm font-semibold">Loading compliance submissions...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 m-0">All Audits Up to Date</h3>

          <p className="text-xs text-slate-500 max-w-md mx-auto m-0">
            No supplier capability submissions are currently awaiting inspection. New onboarding requests will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row lg:items-center justify-between gap-5"
            >
              {/* Left Details */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                    {item.capabilityType.replace(/_/g, ' ')}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <Clock className="w-3 h-3 text-amber-600" /> Pending Review
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 m-0">
                    {item.vendorBusinessName || `Vendor #${item.vendorId}`}
                  </h3>
                  <p className="text-xs text-slate-500 m-0 mt-0.5">
                    {item.facilityAddress || 'No facility address recorded'}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">FSSAI License:</span>
                    <strong className="text-slate-800 font-mono">{item.fssaiLicenseNumber || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Validity:</span>
                    <strong className="text-slate-800">{item.fssaiValidUntil || 'Not Specified'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Cold Chain (2–4°C):</span>
                    <strong className={item.coldStorageAvailable ? 'text-emerald-700' : 'text-slate-700'}>
                      {item.coldStorageAvailable ? 'Certified' : 'Ambient Only'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Daily Production:</span>
                    <strong className="text-slate-800">{item.dailyCapacityUnits} units/day</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex lg:flex-col items-center gap-2 border-t lg:border-t-0 lg:border-l lg:pl-5 pt-3 lg:pt-0 shrink-0">
                <button
                  type="button"
                  disabled={processingId === item.id}
                  onClick={() => handleApprove(item.id)}
                  className="flex-1 lg:w-36 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {processingId === item.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Approve Module
                </button>
                <button
                  type="button"
                  disabled={processingId === item.id}
                  onClick={() => {
                    setRejectingItem(item);
                    setRejectionReason('');
                  }}
                  className="flex-1 lg:w-36 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  Reject / Resubmit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 m-0">
                Reject Capability Submission
              </h3>
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleReject} className="space-y-3 text-xs">
              <p className="text-slate-600 m-0">
                State the compliance reason for rejecting{' '}
                <strong>{rejectingItem.capabilityType}</strong> for{' '}
                <strong>{rejectingItem.vendorBusinessName}</strong>:
              </p>
              <textarea
                rows={3}
                required
                placeholder="e.g. FSSAI registration document unverified or cold-chain temperature certificate missing."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId !== null}
                  className="px-5 py-2 rounded-xl text-white bg-rose-600 hover:bg-rose-700 font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20"
                >
                  {processingId !== null && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}