import { useState, useEffect, useRef } from "react";
import {
  FileText, Upload, Trash2, Loader2, AlertCircle,
  CheckCircle2, Clock, File, Download, Eye,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { vendorDocumentService } from "../../../../services/vendorService";
import type { VendorDocument } from "../../../../types/api";

const DOC_TYPES = [
  { value: "BUSINESS_LICENSE", label: "Business License" },
  { value: "GST_CERTIFICATE", label: "GST Certificate" },
  { value: "PAN_CARD", label: "PAN Card" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "TRADE_LICENSE", label: "Trade License" },
  { value: "CERTIFICATE", label: "Certificate" },
  { value: "OTHER", label: "Other" },
];

export function MyDocuments() {
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadForm, setUploadForm] = useState({
    documentType: "BUSINESS_LICENSE",
    documentName: "",
    expiryDate: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await vendorDocumentService.getMyDocuments();
      setDocuments(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load documents");
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.documentName) {
      toast.error("Please select a file and provide a document name");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("documentType", uploadForm.documentType);
      formData.append("documentName", uploadForm.documentName);
      if (uploadForm.expiryDate) {
        formData.append("expiryDate", uploadForm.expiryDate);
      }
      await vendorDocumentService.uploadDocument(formData);
      toast.success("Document uploaded successfully");
      setShowUpload(false);
      setSelectedFile(null);
      setUploadForm({ documentType: "BUSINESS_LICENSE", documentName: "", expiryDate: "" });
      loadDocuments();
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await vendorDocumentService.deleteDocument(id);
      toast.success("Document deleted");
      setDeleteConfirm(null);
      loadDocuments();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete document");
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "--";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-[#6b7094] font-medium">{error}</p>
        <button onClick={loadDocuments} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Vendor Portal</span>
          <h1 className="text-3xl font-black text-[#0d0d2b] flex items-center gap-2 mt-1">
            <FileText className="h-8 w-8 text-indigo-600" />
            Documents
          </h1>
          <p className="text-[#6b7094] text-sm mt-1">Upload and manage your business documents</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 text-white px-5 py-3 rounded-full font-bold transition-all text-sm md:self-end"
        >
          <Upload className="h-5 w-5" />
          Upload Document
        </button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-black text-[#0d0d2b]">Upload New Document</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-[#6b7094] block mb-1">Document Type</label>
              <select
                value={uploadForm.documentType}
                onChange={(e) => setUploadForm({ ...uploadForm, documentType: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-white"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#6b7094] block mb-1">Document Name *</label>
              <input
                type="text"
                value={uploadForm.documentName}
                onChange={(e) => setUploadForm({ ...uploadForm, documentName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                placeholder="e.g. GST Registration Certificate"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#6b7094] block mb-1">Expiry Date</label>
              <input
                type="date"
                value={uploadForm.expiryDate}
                onChange={(e) => setUploadForm({ ...uploadForm, expiryDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* File Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-2">
                <File className="w-5 h-5 text-indigo-600" />
                <span className="text-sm font-bold text-[#0d0d2b]">{selectedFile.name}</span>
                <span className="text-xs text-[#6b7094]">({formatFileSize(selectedFile.size)})</span>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-[#6b7094]">Click to select a file</p>
                <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG, DOC (max 10MB)</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setShowUpload(false); setSelectedFile(null); }}
              className="px-4 py-2 text-sm font-bold text-[#6b7094] hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
              Upload
            </button>
          </div>
        </div>
      )}

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-[#6b7094] font-medium">No documents uploaded</p>
          <p className="text-xs text-slate-400 mt-1">Upload your business documents to get verified</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${doc.verified ? "bg-emerald-100" : "bg-slate-100"}`}>
                    <FileText className={`w-4 h-4 ${doc.verified ? "text-emerald-600" : "text-slate-400"}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0d0d2b]">{doc.documentName}</h4>
                    <p className="text-[10px] text-[#6b7094] font-semibold">
                      {DOC_TYPES.find((t) => t.value === doc.documentType)?.label || doc.documentType}
                    </p>
                  </div>
                </div>
                {doc.verified ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3" />
                    Pending
                  </span>
                )}
              </div>

              <div className="text-xs text-[#6b7094] space-y-1 mb-3">
                {doc.fileSize && <p>Size: {formatFileSize(doc.fileSize)}</p>}
                {doc.expiryDate && (
                  <p>Expires: {new Date(doc.expiryDate).toLocaleDateString()}</p>
                )}
                <p>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                {doc.version > 1 && <p>Version: {doc.version}</p>}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                >
                  <Eye className="w-3 h-3" />
                  View
                </a>
                <a
                  href={doc.fileUrl}
                  download
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-[#6b7094] hover:bg-slate-100 rounded-lg transition-all"
                >
                  <Download className="w-3 h-3" />
                  Download
                </a>
                <div className="flex-1" />
                {deleteConfirm === doc.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-[10px] font-bold text-red-600 px-2 py-1 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="text-[10px] font-bold text-slate-500 px-2 py-1 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(doc.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
