import React, { useState, useEffect } from 'react';
import {
  documentService,
  type DocumentDto,
  type DocumentCategory,
  type DocumentStatus,
} from '@/services/documents/documentService';
import { DocumentCategoryBadge, CATEGORY_CONFIG } from './DocumentCategoryBadge';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { DocumentVersionHistory } from './DocumentVersionHistory';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

type SortKey = 'title' | 'createdAt' | 'expiresAt' | 'versionCount';

export function DocumentManagementDashboard() {
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryTab, setCategoryTab] = useState<'ALL' | DocumentCategory>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | DocumentStatus>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [historyDoc, setHistoryDoc] = useState<DocumentDto | null>(null);

  const reload = () => {
    setLoading(true);
    documentService.list()
      .then((docs) => { setDocuments(docs); setError(null); })
      .catch(() => setError('Failed to load documents'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const totalStorage = documents.reduce((s, d) => s + (d.fileSizeBytes ?? 0), 0);
  const expiringSoon = documents.filter((d) => d.expiryWarning && d.status === 'ACTIVE').length;
  const pendingScan = documents.filter((d) => d.status === 'PENDING_SCAN').length;

  const filtered = documents
    .filter((d) => {
      if (categoryTab !== 'ALL' && d.category !== categoryTab) return false;
      if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      let va: string | number = '';
      let vb: string | number = '';
      if (sortKey === 'title') { va = a.title.toLowerCase(); vb = b.title.toLowerCase(); }
      else if (sortKey === 'createdAt') { va = a.createdAt; vb = b.createdAt; }
      else if (sortKey === 'expiresAt') { va = a.expiresAt ?? ''; vb = b.expiresAt ?? ''; }
      else if (sortKey === 'versionCount') { va = a.versionCount; vb = b.versionCount; }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  };

  const handleDelete = async (doc: DocumentDto) => {
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    try { await documentService.delete(doc.id); reload(); } catch { /* user can retry */ }
  };

  const handleDownload = async (doc: DocumentDto) => {
    try {
      const { url } = await documentService.download(doc.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch { /* silent */ }
  };

  const SortHeader = ({ label, key }: { label: string; key: SortKey }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide cursor-pointer select-none hover:text-gray-800 dark:hover:text-gray-200"
      onClick={() => toggleSort(key)}
    >
      {label} {sortKey === key ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Documents', value: documents.length },
          { label: 'Expiring Soon', value: expiringSoon, warn: expiringSoon > 0 },
          { label: 'Pending Scan', value: pendingScan, warn: pendingScan > 0 },
          { label: 'Storage Used', value: formatBytes(totalStorage) },
        ].map((kpi) => (
          <div key={kpi.label} className={`rounded-xl border p-4 ${kpi.warn ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
            <p className="text-xs text-gray-500 dark:text-gray-400">{kpi.label}</p>
            <p className={`text-2xl font-bold mt-1 ${kpi.warn ? 'text-amber-700 dark:text-amber-400' : 'text-gray-900 dark:text-gray-100'}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryTab('ALL')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${categoryTab === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
        >
          All
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([val, { label }]) => (
          <button
            key={val}
            onClick={() => setCategoryTab(val as DocumentCategory)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${categoryTab === val ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Status filter + count */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'ALL' | DocumentStatus)}
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="ARCHIVED">Archived</option>
          <option value="PENDING_SCAN">Scanning</option>
        </select>
        <span className="text-sm text-gray-400">{filtered.length} document{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      {loading && <div className="text-sm text-gray-400 py-8 text-center">Loading…</div>}
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {!loading && filtered.length === 0 && !error && (
        <p className="text-sm text-gray-400 py-8 text-center">No documents match the current filters.</p>
      )}

      {!loading && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <SortHeader label="Title" key="title" />
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <SortHeader label="Expiry" key="expiresAt" />
                <SortHeader label="Versions" key="versionCount" />
                <SortHeader label="Uploaded" key="createdAt" />
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((doc) => (
                <tr
                  key={doc.id}
                  className={`${doc.expiryWarning && doc.status === 'ACTIVE' ? 'bg-amber-50/50 dark:bg-amber-900/10' : 'bg-white dark:bg-gray-900'} hover:bg-gray-50 dark:hover:bg-gray-800/50`}
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 max-w-xs truncate">{doc.title}</td>
                  <td className="px-4 py-3"><DocumentCategoryBadge category={doc.category} /></td>
                  <td className="px-4 py-3"><DocumentStatusBadge status={doc.status} expiryWarning={doc.expiryWarning} /></td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {doc.expiresAt ? new Date(doc.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{doc.versionCount}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="inline-flex gap-1">
                      <button
                        onClick={() => handleDownload(doc)}
                        disabled={doc.scanStatus === 'INFECTED' || doc.status === 'PENDING_SCAN'}
                        className="px-2 py-1 rounded text-xs border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => setHistoryDoc(doc)}
                        className="px-2 py-1 rounded text-xs border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        History
                      </button>
                      <button
                        onClick={() => handleDelete(doc)}
                        className="px-2 py-1 rounded text-xs border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

export default DocumentManagementDashboard;
