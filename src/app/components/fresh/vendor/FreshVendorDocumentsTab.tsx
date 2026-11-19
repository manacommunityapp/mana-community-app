import React, { useState, useEffect } from 'react';
import {
  FileText, ShieldCheck, CheckCircle2, Clock, XCircle, AlertTriangle,
  Upload, Plus, ExternalLink, Calendar, Hash, RefreshCw, Loader2
} from 'lucide-react';
import { freshVendorService } from '../../../../services/freshVendorService';
import type { VendorDocumentDto, VendorDocumentType, UploadVendorDocumentRequest } from '../../../../types/freshVendor';
import { useAuth } from '../../../../contexts/AuthContext';

const DOCUMENT_TYPES: { type: VendorDocumentType; label: string; description: string; required: boolean }[] = [
  {
    type: 'FSSAI_LICENSE',
    label: 'FSSAI Food Safety License',
    description: 'Mandatory 14-digit state/central license for food processing and handling.',
    required: true,
  },
  {
    type: 'GST_CERTIFICATE',
    label: 'GST Registration Certificate',
    description: 'Mandatory GSTIN certificate for commercial sales and tax invoices.',
    required: true,
  },
  {
    type: 'TRADE_LICENSE',
    label: 'Municipal Trade License',
    description: 'Local municipal trade permit for operational commercial premises.',
    required: false,
  },
  {
    type: 'POLLUTION_NOC',
    label: 'Pollution Control Board NOC',
    description: 'PCB consent to establish / operate for processing and poultry/meat units.',
    required: false,
  },
  {
    type: 'WATER_TEST_REPORT',
    label: 'Potable Water Test Report',
    description: 'Microbiological and chemical water potability test (IS:10500 standard).',
    required: false,
  },
  {
    type: 'FSMS_CERTIFICATE',
    label: 'FSMS / ISO 22000 Certificate',
    description: 'Food Safety Management System certification for high-risk categories.',
    required: false,
  },
];

export function FreshVendorDocumentsTab({ vendorId: propVendorId }: { vendorId?: number }) {
  const { user } = useAuth();
  const vendorId = propVendorId || user?.vendorId || 1;

  const [documents, setDocuments] = useState<VendorDocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedDocType, setSelectedDocType] = useState<VendorDocumentType>('FSSAI_LICENSE');
  const [documentNumber, setDocumentNumber] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await freshVendorService.getVendorDocuments(vendorId);
      setDocuments(data || []);
    } catch (err) {
      console.error('Failed to load vendor documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [vendorId]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentNumber || !fileUrl) {
      alert('Please fill in Document Number and File URL');
      return;
    }

    try {
      setSubmitting(true);
      const payload: UploadVendorDocumentRequest = {
        vendorId,
        documentType: selectedDocType,
        documentNumber,
        validFrom: validFrom ? `${validFrom}T00:00:00Z` : undefined,
        validTo: validTo ? `${validTo}T23:59:59Z` : undefined,
        fileUrl,
      };

      await freshVendorService.uploadVendorDocument(payload);
      setShowUploadModal(false);
      resetForm();
      await loadDocuments();
    } catch (err: any) {
      alert(err.message || 'Failed to upload document');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedDocType('FSSAI_LICENSE');
    setDocumentNumber('');
    setValidFrom('');
    setValidTo('');
    setFileUrl('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified
          </span>
        );
      case 'PENDING_VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Under Audit
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-600" /> Expired
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Upload CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-900 m-0 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" /> Food Safety & Compliance Documents
          </h2>
          <p className="text-xs text-slate-500 mt-1 m-0">
            Upload verified regulatory certificates. FSSAI License and GSTIN are mandatory before processing live community orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDocuments}
            disabled={loading}
            className="p-2.5 text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition"
          >
            <Plus className="w-4 h-4" /> Upload Certificate
          </button>
        </div>
      </div>

      {/* Grid of Standard Document Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DOCUMENT_TYPES.map(docType => {
          const uploadedDoc = documents.find(d => d.documentType === docType.type);
          return (
            <div
              key={docType.type}
              className={`p-5 rounded-2xl border transition relative flex flex-col justify-between ${
                uploadedDoc?.status === 'VERIFIED'
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : uploadedDoc?.status === 'PENDING_VERIFICATION'
                  ? 'bg-amber-50/30 border-amber-200'
                  : uploadedDoc?.status === 'REJECTED'
                  ? 'bg-rose-50/40 border-rose-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    {uploadedDoc ? (
                      getStatusBadge(uploadedDoc.status)
                    ) : docType.required ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        Required
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Optional
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 m-0">{docType.label}</h3>
                <p className="text-xs text-slate-500 mt-1 mb-3 line-clamp-2">{docType.description}</p>

                {uploadedDoc && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono font-bold text-slate-800">{uploadedDoc.documentNumber}</span>
                    </div>
                    {uploadedDoc.validTo && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Valid until: {new Date(uploadedDoc.validTo).toLocaleDateString()}</span>
                      </div>
                    )}
                    {uploadedDoc.rejectionReason && (
                      <div className="p-2 mt-2 rounded-lg bg-rose-100/60 text-rose-800 text-[11px] font-medium border border-rose-200">
                        <span className="font-bold">Rejection Note:</span> {uploadedDoc.rejectionReason}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                {uploadedDoc ? (
                  <>
                    <a
                      href={uploadedDoc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View File
                    </a>
                    {uploadedDoc.status === 'REJECTED' && (
                      <button
                        onClick={() => {
                          setSelectedDocType(docType.type);
                          setShowUploadModal(true);
                        }}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 underline"
                      >
                        Re-upload
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedDocType(docType.type);
                      setShowUploadModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Now
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-black text-slate-900 m-0 mb-1 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" /> Upload Compliance Document
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter official certification details. Submissions will be audited by the Mana Quality Assurance team.
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Document Type</label>
                <select
                  value={selectedDocType}
                  onChange={e => setSelectedDocType(e.target.value as VendorDocumentType)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {DOCUMENT_TYPES.map(d => (
                    <option key={d.type} value={d.type}>
                      {d.label} {d.required ? '(Mandatory)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  License / Registration Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10020047000123 or 36AABCU9603R1ZM"
                  value={documentNumber}
                  onChange={e => setDocumentNumber(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 font-mono uppercase focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Valid From</label>
                  <input
                    type="date"
                    value={validFrom}
                    onChange={e => setValidFrom(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Valid To / Expiry</label>
                  <input
                    type="date"
                    value={validTo}
                    onChange={e => setValidTo(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Public File URL / S3 Link *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://storage.manacommunity.com/compliance/fssai-123.pdf"
                  value={fileUrl}
                  onChange={e => setFileUrl(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
