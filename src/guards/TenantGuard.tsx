import type { ReactNode } from 'react';
import { useTenantContext } from '../contexts/TenantContext';

interface TenantGuardProps {
  children: ReactNode;
  /** Optional skeleton/spinner to show while tenant resolves. Defaults to a minimal spinner. */
  fallback?: ReactNode;
}

/**
 * Renders children only when the JWT-derived community context is resolved.
 * Use around routes or sections that require a known communityId.
 */
export function TenantGuard({ children, fallback }: TenantGuardProps) {
  const { isResolved } = useTenantContext();

  if (!isResolved) {
    return fallback ?? (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
