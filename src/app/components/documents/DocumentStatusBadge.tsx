import React from 'react';
import type { DocumentStatus } from '@/services/documents/documentService';

interface Props {
  status: DocumentStatus;
  expiryWarning?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const STATUS_CONFIG: Record<DocumentStatus, { label: string; className: string }> = {
  PENDING_SCAN: { label: 'Scanning…',  className: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' },
  ACTIVE:       { label: 'Active',     className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  EXPIRED:      { label: 'Expired',    className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  ARCHIVED:     { label: 'Archived',   className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  DELETED:      { label: 'Deleted',    className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};

const EXPIRY_WARNING = { label: 'Expiring Soon', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };

export function DocumentStatusBadge({ status, expiryWarning, size = 'sm', className = '' }: Props) {
  const cfg = (expiryWarning && status === 'ACTIVE') ? EXPIRY_WARNING : STATUS_CONFIG[status];
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${cfg.className} ${className}`}>
      {cfg.label}
    </span>
  );
}

export default DocumentStatusBadge;
