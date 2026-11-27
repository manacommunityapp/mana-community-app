import React from 'react';
import type { DocumentCategory } from '@/services/documents/documentService';

const CATEGORY_CONFIG: Record<DocumentCategory, { label: string; className: string }> = {
  RENTAL_AGREEMENT:          { label: 'Rental Agreement',       className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  DOCTOR_DOCUMENT:           { label: 'Doctor Document',        className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  VENDOR_KYC:                { label: 'Vendor KYC',             className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  SPORTS_WAIVER:             { label: 'Sports Waiver',          className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  INSURANCE_DOCUMENT:        { label: 'Insurance',              className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  INVOICE:                   { label: 'Invoice',                className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  EVENT_SPONSORSHIP_CONTRACT:{ label: 'Sponsorship Contract',   className: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  GOVERNANCE_RECORD:         { label: 'Governance Record',      className: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
  OTHER:                     { label: 'Other',                  className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
};

interface Props {
  category: DocumentCategory;
  size?: 'sm' | 'md';
  className?: string;
}

export function DocumentCategoryBadge({ category, size = 'sm', className = '' }: Props) {
  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.OTHER;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${cfg.className} ${className}`}>
      {cfg.label}
    </span>
  );
}

export { CATEGORY_CONFIG };
export default DocumentCategoryBadge;
