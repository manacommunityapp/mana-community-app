/**
 * TenantContext — JWT-authoritative community context.
 *
 * communityId is sourced exclusively from the authenticated user object,
 * which is populated from the JWT claims on login. It is never read from
 * arbitrary localStorage keys.
 *
 * Security invariant: community selection is a user convenience, not a
 * permission grant. The JWT (validated server-side) is the authority.
 */
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';

export interface TenantContextValue {
  /** JWT-derived community ID. Null until authentication resolves. */
  communityId: number | null;
  /** Display name for the active community. */
  communityName: string | null;
  /** True once authentication has resolved and communityId is known. */
  isResolved: boolean;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();

  const value = useMemo<TenantContextValue>(() => ({
    communityId: user?.communityId ?? null,
    communityName: user?.communityName ?? null,
    isResolved: isAuthenticated,
  }), [user?.communityId, user?.communityName, isAuthenticated]);

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantContext(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenantContext must be used within TenantProvider');
  return ctx;
}
