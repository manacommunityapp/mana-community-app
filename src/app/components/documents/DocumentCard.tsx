import React, { useState } from 'react';
import type { DocumentDto } from '@/services/documents/documentService';
import { documentService } from '@/services/documents/documentService';
import { DocumentCategoryBadge } from './DocumentCategoryBadge';
import { DocumentStatusBadge } from './DocumentStatusBadge';

interface Props {
  document: DocumentDto;
  onDownload: (doc: DocumentDto) => void;
  onAddVersion?: (doc: DocumentDto) => void;
  onDelete?: (doc: DocumentDto) => void;
  onViewHistory?: (doc: DocumentDto) => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatExpiry(isoDate?: string): string | null {
  if (!isoDate) return null;
  const exp = new Date(isoDate);
  const now = new Date();
  const diffMs = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / 86400000);
  if (diffDays < 0) return `Expired ${Math.abs(diffDays)}d ago`;
  if (diffDays <= 30) return `in ${diffDays}d`;
  return exp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const ACCESS_LABEL: Record<string, string> = {
  OWNER_ONLY:      '🔒 Owner Only',
  COMMUNITY_ADMIN: '🔑 Admin Only',
  COMMUNITY:       '🏘️ Community',
  PUBLIC:          '🌐 Public',
};

export function DocumentCard({ document: doc, onDownload, onAddVersion, onDelete, onViewHistory }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [dlError, setDlError] = useState<string | null>(null);

  const isInfected = doc.scanStatus === 'INFECTED';
  const isScanning = doc.scanStatus === 'PENDING' || doc.status === 'PENDING_SCAN';
  const expiry = formatExpiry(doc.expiresAt);
  const fileSize = formatBytes(doc.fileSizeBytes);

  const handleDownload = async () => {
    if (isInfected || isScanning) return;
    setDownloading(true);
    setDlError(null);
    try {
      const { url } = await documentService.download(doc.id);
      window.open(url, '_blank', 'noopener,noreferrer');
      onDownload(doc);
    } catch {
      setDlError('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap gap-1.5">
          <DocumentCategoryBadge category={doc.category} />
          <DocumentStatusBadge status={doc.status} expiryWarning={doc.expiryWarning} />
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
            aria-label="More options"
          >
            ⋮
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 z-10 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1">
              {onViewHistory && (
                <button
                  className="block w-full px-3 py-1.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => { setMenuOpen(false); onViewHistory(doc); }}
                >
                  Version History
                </button>
              )}
              {onAddVersion && (
                <button
                  className="block w-full px-3 py-1.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => { setMenuOpen(false); onAddVersion(doc); }}
                >
                  Upload New Version
                </button>
              )}
              {onDelete && (
                <button
                  className="block w-full px-3 py-1.5 text-sm text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  onClick={() => { setMenuOpen(false); onDelete(doc); }}
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">{doc.title}</p>

      {/* Meta row */}
      <p className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-2 mb-2">
        {doc.currentVersionFilename && <span>{doc.currentVersionFilename}</span>}
        {fileSize && <span>{fileSize}</span>}
        {doc.versionCount > 1 && <span>v{doc.versionCount}</span>}
        {expiry && <span>expires {expiry}</span>}
      </p>

      {/* Infected warning */}
      {isInfected && (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mb-2">
          ⚠️ File flagged as malicious — download disabled
        </p>
      )}

      {dlError && <p className="text-xs text-rose-600 mb-2">{dlError}</p>}

      {/* Footer row */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
        <span className="text-xs text-gray-400">{ACCESS_LABEL[doc.accessLevel] ?? doc.accessLevel}</span>
        <div className="flex gap-2">
          {onAddVersion && (
            <button
              onClick={() => onAddVersion(doc)}
              className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              + Version
            </button>
          )}
          <button
            onClick={handleDownload}
            disabled={isInfected || isScanning || downloading}
            className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
              isInfected
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700'
                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-wait'
            }`}
          >
            {isScanning ? 'Scanning…' : downloading ? '…' : 'Download'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DocumentCard;
