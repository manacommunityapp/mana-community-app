import React, { useState, useEffect } from 'react';
import {
  FileText, ShieldCheck, CheckCircle2, Clock, XCircle, AlertTriangle,
  ExternalLink, Calendar, Hash, Building2, Check, X, Loader2, RefreshCw
} from 'lucide-react';
import { freshVendorService } from '../../../../services/freshVendorService';
import type { VendorDocumentDto } from '../../../../types/freshVendor';

export function FreshAdminDocumentVerificationTab() {
  const [documents, setDocuments] = useState<VendorDocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectingDoc, setRejectingDoc] = useState<VendorDocumentDto | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [vendorFilterId, setVendorFilterId] = useState<number | ''>('');

  const loadDocuments = async () => {
    try {
      setLoading(true);
      // Fetch documents for selected vendor or default to vendor 1
      const vId = typeof vendorFilterId === 'number' ? vendorFilterId : 1;
      const data = await freshVendorService.getAdminVendorDocuments(vId);
      setDocuments(data || []);
    } catch (err) {
      console.error('Failed to load admin vendor documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [vendorFilterId]);

  const handleVerify = async (docId: number) => {
    try {
      setProcessingId(docId);
      await freshVendorService.verifyVendorDocument(docId, {
        status: 'VERIFIED',
      });
      await loadDocuments();
    } catch (err: any) {
      alert(err.message || 'Failed to verify document');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingDoc) return;
    if (!rejectionReason.trim()) {
      alert('Please specify a rejection reason for compliance records');
      return;
    }

    try {
      setProcessingId(rejectingDoc.id);
      await freshVendorService.verifyVendorDocument(rejectingDoc.id, {
        status: 'REJECTED',
        rejectionReason,
      });
      setRejectingDoc(null);
      setRejectionReason('');
      await loadDocuments();
    } catch (err: any) {
      alert(err.message || 'Failed to reject document');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDocType = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-900 m-0 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" /> Regulatory Document Audits
          </h2>
          <p className="text-xs text-slate-500 mt-1 m-0">
            Verify official food safety certifications (FSSAI licenses, GST registrations, water quality reports, and pollution clearances).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Vendor ID:</span>
            <input
              type="number"
              min={1}
              placeholder="e.g. 1"
              value={vendorFilterId}
              onChange={e => setVendorFilterId(e.target.value ? Number(e.target.value) : '')}
              className="w-24 text-xs font-mono font-bold px-3 py-1.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={loadDocuments}
            disabled={loading}
            className="p-2.5 text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition"
            title="Reload"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Documents Table / Card List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-semibold">Auditing regulatory documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 m-0">No documents found for this vendor</h3>
          <p className="text-xs text-slate-500 mt-1">Vendor has not uploaded regulatory compliance certificates yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Document Type</th>
                <th className="py-3 px-4">Registration #</th>
                <th className="py-3 px-4">Validity</th>
                <th className="py-3 px-4">File Link</th>
                <th className="py-3 px-4">Audit Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {documents.map(doc => {
                const isPending = doc.status === 'PENDING_VERIFICATION';
                const isVerified = doc.status === 'VERIFIED';
                const isRejected = doc.status === 'REJECTED';

                return (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span>{formatDocType(doc.documentType)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {doc.documentNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                      {doc.validTo ? (
                        <span>Valid to: {new Date(doc.validTo).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-slate-400">Not specified</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-700"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Inspect File
                      </a>
                    </td>
                    <td className="py-3.5 px-4">
                      {isVerified && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3 text-amber-600" /> Needs Review
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800" title={doc.rejectionReason}>
                          <XCircle className="w-3 h-3 text-rose-600" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isPending ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleVerify(doc.id)}
                            disabled={processingId === doc.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => {
                              setRejectingDoc(doc);
                              setRejectionReason('');
                            }}
                            disabled={processingId === doc.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400">Audit Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-black text-slate-900 m-0 mb-1 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" /> Reject Compliance Document
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter reason for rejecting <strong>{formatDocType(rejectingDoc.documentType)}</strong> (#{rejectingDoc.documentNumber}). The vendor will be requested to resubmit.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rejection Reason *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. License expired on specified date / illegible water test lab stamp..."
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingDoc(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === rejectingDoc.id}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {processingId === rejectingDoc.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
