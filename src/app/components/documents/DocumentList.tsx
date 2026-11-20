import React, { useState, useRef } from 'react';
import { DocumentDto, DocumentCategory, DocumentStatus, documentService } from '@/services/documents/documentService';
import { useDocumentList } from '@/hooks/documents/useDocumentList';
import { DocumentCard } from './DocumentCard';
import { DocumentUploadModal } from './DocumentUploadModal';
import { DocumentVersionHistory } from './DocumentVersionHistory';
import { CATEGORY_CONFIG } from './DocumentCategoryBadge';

interface Props {
  entityType?: string;
  entityId?: string | number;
  category?: DocumentCategory;
  allowUpload?: boolean;
  uploadEntityType?: string;
  uploadEntityId?: string | number;
  defaultCategory?: DocumentCategory;
}

const STATUS_FILTERS: { value: 'ALL' | DocumentStatus; label: string }[] = [
  { value: 'ALL',          label: 'All' },
  { value: 'ACTIVE',       label: 'Active' },
  { value: 'EXPIRED',      label: 'Expired' },
  { value: 'ARCHIVED',     label: 'Archived' },
  { value: 'PENDING_SCAN', label: 'Scanning' },
];

export function DocumentList({
  entityType, entityId, category, allowUpload,
  uploadEntityType, uploadEntityId, defaultCategory,
}: Props) {
  const { documents, loading, error, reload } = useDocumentList({ entityType, entityId, category });
  const [statusFilter, setStatusFilter] = useState<'ALL' | DocumentStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | DocumentCategory>('ALL');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [historyDoc, setHistoryDoc] = useState<DocumentDto | null>(null);
  const addVersionInputRef = useRef<HTMLInputElement>(null);
  const [addVersionDocId, setAddVersionDocId] = useState<number | null>(null);

  const filtered = documents.filter((d) => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && d.category !== categoryFilter) return false;
    return true;
  });

  const handleAddVersion = (doc: DocumentDto) => {
    setAddVersionDocId(doc.id);
    addVersionInputRef.current?.click();
  };

  const handleVersionFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !addVersionDocId) return;
    try {
      await documentService.addVersion(addVersionDocId, file);
      reload();
    } catch {
      // version upload error handled silently; parent can add toast
    } finally {
      e.target.value = '';
      setAddVersionDocId(null);
    }
  };

  const handleDelete = async (doc: DocumentDto) => {
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    try {
      await documentService.delete(doc.id);
      reload();
    } catch {
      // let user retry
    }
  };

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'ALL' | DocumentStatus)}
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as 'ALL' | DocumentCategory)}
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Categories</option>
          {Object.entries(CATEGORY_CONFIG).map(([v, { label }]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>

        <div className="flex-1" />

        {allowUpload && (
          <button
            onClick={() => setUploadOpen(true)}
            className="text-sm px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
          >
            + Upload Document
          </button>
        )}
      </div>

      {/* Content */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl h-32 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📄</p>
          <p className="text-sm font-medium">No documents yet.</p>
          {allowUpload && (
            <button onClick={() => setUploadOpen(true)} className="mt-2 text-sm text-blue-600 hover:underline">
              Upload the first one
            </button>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onDownload={() => {}}
              onAddVersion={handleAddVersion}
              onDelete={handleDelete}
              onViewHistory={setHistoryDoc}
            />
          ))}
        </div>
      )}

      {/* Hidden file input for version upload */}
      <input ref={addVersionInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={handleVersionFileChange} />

      {uploadOpen && (
        <DocumentUploadModal
          isOpen
          onClose={() => setUploadOpen(false)}
          entityType={uploadEntityType ?? entityType}
          entityId={uploadEntityId ?? entityId}
          defaultCategory={defaultCategory ?? category}
          onUploaded={() => { setUploadOpen(false); reload(); }}
        />
      )}

      {historyDoc && (
        <DocumentVersionHistory
          isOpen
          documentId={historyDoc.id}
          documentTitle={historyDoc.title}
          currentVersionNumber={historyDoc.versionCount}
          onClose={() => setHistoryDoc(null)}
        />
      )}
    </div>
  );
}

export default DocumentList;
