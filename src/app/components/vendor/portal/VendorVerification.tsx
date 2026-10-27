import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, FileText, Loader2, ShieldCheck, Trash2, Upload } from "lucide-react";
import { vendorDocumentService } from "../../../../services/vendor/vendorService";
import type { VendorDocument } from "../../../../types/api";
import { showError, showSuccess } from "../../../../utils/ToastUtils";

export function VendorVerification() {
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("BUSINESS_LICENSE");
  const [documentName, setDocumentName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const load = useCallback(async () => {
    try {
      setDocuments(await vendorDocumentService.getMyDocuments());
    } catch {
      showError("Could not load your verification documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function upload() {
    if (!file || !documentName.trim()) {
      showError("Choose a file and enter a document name");
      return;
    }
    const payload = new FormData();
    payload.append("file", file);
    payload.append("documentType", documentType);
    payload.append("documentName", documentName.trim());
    if (expiryDate) payload.append("expiryDate", expiryDate);
    setUploading(true);
    try {
      await vendorDocumentService.uploadDocument(payload);
      setFile(null);
      setDocumentName("");
      setExpiryDate("");
      showSuccess("Document uploaded for review");
      await load();
    } catch {
      showError("Document upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: number) {
    try {
      await vendorDocumentService.deleteDocument(id);
      setDocuments((current) => current.filter((document) => document.id !== id));
      showSuccess("Document removed");
    } catch {
      showError("Could not remove this document");
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          Vendor Trust & Verification
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Upload current business documents. The community administrator reviews each submission.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="mb-4 text-sm font-bold text-slate-900">Upload a verification document</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-semibold text-slate-600">Document type
            <select value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
              <option value="BUSINESS_LICENSE">Business license</option><option value="GST">GST certificate</option><option value="FSSAI">FSSAI license</option><option value="PAN">PAN document</option><option value="INSURANCE">Insurance</option><option value="OTHER">Other</option>
            </select>
          </label>
          <label className="space-y-1 text-xs font-semibold text-slate-600">Document name
            <input value={documentName} onChange={(event) => setDocumentName(event.target.value)} maxLength={200} className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm" placeholder="e.g. GST registration certificate" />
          </label>
          <label className="space-y-1 text-xs font-semibold text-slate-600">File
            <input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="block w-full text-sm" />
          </label>
          <label className="space-y-1 text-xs font-semibold text-slate-600">Expiry date (optional)
            <input type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm" />
          </label>
        </div>
        <button type="button" onClick={() => void upload()} disabled={uploading} className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Upload document
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="mb-4 border-b border-slate-100 pb-2 text-sm font-bold text-slate-900">Your submitted documents</h3>
        {loading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
          : documents.length === 0 ? <div className="flex items-center gap-2 py-4 text-sm text-slate-500"><AlertCircle className="h-4 w-4" />No documents submitted yet.</div>
          : <div className="space-y-3">{documents.map((document) => {
            const status = document.status ?? (document.verified ? "APPROVED" : "PENDING");
            const approved = status === "APPROVED" || document.verified;
            return <div key={document.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex min-w-0 items-center gap-3"><FileText className="h-5 w-5 shrink-0 text-indigo-600" /><div className="min-w-0"><div className="truncate text-sm font-bold text-slate-900">{document.documentName}</div><div className="text-[10px] text-slate-500">{document.documentType}{document.expiryDate ? ` · Expires ${document.expiryDate}` : ""} · Uploaded {new Date(document.uploadedAt).toLocaleDateString()}</div></div></div>
              <div className="flex shrink-0 items-center gap-2">{approved ? <span className="flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700"><CheckCircle2 className="h-3 w-3" />APPROVED</span> : status === "REJECTED" ? <span className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700">REJECTED</span> : <span className="flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700"><Clock className="h-3 w-3" />PENDING</span>}<button type="button" title="Remove document" onClick={() => void remove(document.id)} className="rounded p-2 text-slate-500 hover:bg-white hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div>
            </div>;
          })}</div>}
      </div>
    </div>
  );
}
