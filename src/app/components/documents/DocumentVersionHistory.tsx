import React, { useEffect, useState } from 'react';
import { documentService, type DocumentVersionDto, type DocScanStatus } from '@/services/documents/documentService';

interface Props {
  documentId: number;
  documentTitle: string;
  isOpen: boolean;
  onClose: () => void;
  currentVersionNumber?: number;
}

const SCAN_CONFIG: Record<DocScanStatus, { label: string; className: string }> = {
  PENDING:     { label: 'Scanning…', className: 'bg-gray-100 text-gray-500' },
  CLEAN:       { label: 'Clean',     className: 'bg-emerald-100 text-emerald-700' },
  INFECTED:    { label: 'Infected',  className: 'bg-rose-100 text-rose-700' },
  SCAN_FAILED: { label: 'Scan Error',className: 'bg-orange-100 text-orange-700' },
};

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentVersionHistory({ documentId, documentTitle, isOpen, onClose, currentVersionNumber }: Props) {
  const [versions, setVersions] = useState<DocumentVersionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    documentService.getVersions(documentId)
      .then((v) => { setVersions(v); setError(null); })
      .catch(() => setError('Failed to load versions'))
      .finally(() => setLoading(false));
  }, [documentId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate pr-4">
            Version History — {documentTitle}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none shrink-0">×</button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4">
          {loading && <p className="text-sm text-gray-500">Loading…</p>}
          {error && <p className="text-sm text-rose-600">{error}</p>}
          {!loading && versions.length === 0 && !error && (
            <p className="text-sm text-gray-400">No version history found.</p>
          )}
          <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-3 space-y-4">
            {versions.map((v) => {
              const isCurrent = v.versionNumber === currentVersionNumber;
              const scan = SCAN_CONFIG[v.scanStatus];
              return (
                <li key={v.id} className="ml-4">
                  <span className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 ${isCurrent ? 'bg-blue-600' : 'bg-gray-300'}`} />
                  <div className={`p-3 rounded-lg border ${isCurrent ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800' : 'border-gray-100 dark:border-gray-700'}`}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        v{v.versionNumber} {isCurrent && <span className="text-blue-600 text-xs">(current)</span>}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${scan.className}`}>{scan.label}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{v.originalFilename}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatBytes(v.fileSizeBytes)}{v.fileSizeBytes ? ' · ' : ''}
                      {new Date(v.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <button
                      disabled
                      className="mt-2 text-xs px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600 text-gray-400 cursor-not-allowed"
                      title="Restore functionality coming soon"
                    >
                      Restore this version
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}

export default DocumentVersionHistory;
