import React, { useState, useRef } from 'react';
import {
  documentService,
  DocumentDto,
  DocumentCategory,
  DocAccessLevel,
  DocumentUploadRequest,
} from '@/services/documents/documentService';
import { CATEGORY_CONFIG } from './DocumentCategoryBadge';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  entityType?: string;
  entityId?: string | number;
  defaultCategory?: DocumentCategory;
  onUploaded: (doc: DocumentDto) => void;
}

const ACCESS_OPTIONS: { value: DocAccessLevel; label: string }[] = [
  { value: 'OWNER_ONLY',      label: 'Owner Only' },
  { value: 'COMMUNITY_ADMIN', label: 'Community Admin' },
  { value: 'COMMUNITY',       label: 'Community' },
  { value: 'PUBLIC',          label: 'Public' },
];

const CATEGORY_OPTIONS = Object.entries(CATEGORY_CONFIG).map(([value, { label }]) => ({
  value: value as DocumentCategory,
  label,
}));

export function DocumentUploadModal({
  isOpen, onClose, entityType, entityId, defaultCategory, onUploaded,
}: Props) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>(defaultCategory ?? 'OTHER');
  const [accessLevel, setAccessLevel] = useState<DocAccessLevel>('COMMUNITY_ADMIN');
  const [expiresAt, setExpiresAt] = useState('');
  const [reminderDays, setReminderDays] = useState(30);
  const [retentionDays, setRetentionDays] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const reset = () => {
    setTitle(''); setCategory(defaultCategory ?? 'OTHER'); setAccessLevel('COMMUNITY_ADMIN');
    setExpiresAt(''); setReminderDays(30); setRetentionDays(''); setDescription('');
    setFile(null); setError(null); setProgress(0);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError('Please select a file.'); return; }
    if (!title.trim()) { setError('Title is required.'); return; }

    const request: DocumentUploadRequest = {
      title: title.trim(),
      category,
      accessLevel,
      description: description.trim() || undefined,
      entityType: entityType || undefined,
      entityId: entityId != null ? String(entityId) : undefined,
      expiresAt: expiresAt || undefined,
      reminderDaysBefore: expiresAt ? reminderDays : undefined,
      retentionDays: retentionDays ? Number(retentionDays) : undefined,
    };

    setUploading(true);
    setError(null);
    // Simulate progress during upload since multipart doesn't expose progress here
    const interval = setInterval(() => setProgress((p) => Math.min(p + 10, 85)), 200);
    try {
      const doc = await documentService.upload(request, file);
      clearInterval(interval);
      setProgress(100);
      onUploaded(doc);
      handleClose();
    } catch (err: any) {
      clearInterval(interval);
      setProgress(0);
      setError(err?.response?.data?.message ?? 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Upload Document</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Vendor KYC — ABC Plumbers"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Access Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Access Level</label>
            <select
              value={accessLevel} onChange={(e) => setAccessLevel(e.target.value as DocAccessLevel)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ACCESS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry Date (optional)</label>
            <input
              type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {expiresAt && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reminder (days before expiry)
              </label>
              <input
                type="number" value={reminderDays} onChange={(e) => setReminderDays(Number(e.target.value))}
                min={1} max={365}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Retention */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Retention (days, optional)
              <span className="ml-1 text-xs text-gray-400" title="File deleted automatically after N days">ⓘ</span>
            </label>
            <input
              type="number" value={retentionDays} onChange={(e) => setRetentionDays(e.target.value)}
              min={1} placeholder="No automatic deletion"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (optional)</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* File */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">File *</label>
            <input
              ref={fileRef} type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {file && <p className="text-xs text-gray-500 mt-1">{file.name}</p>}
          </div>

          {/* Progress */}
          {uploading && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleClose}
              className="px-4 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancel
            </button>
            <button type="submit" disabled={uploading}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-wait">
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DocumentUploadModal;
