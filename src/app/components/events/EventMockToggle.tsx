import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";

interface MockToggleCtx {
  useMock: boolean;
  toggle: () => void;
}

const Ctx = createContext<MockToggleCtx>({ useMock: false, toggle: () => {} });

const STORAGE_KEY = "events_mock_mode";

export function EventMockProvider({ children }: { children: ReactNode }) {
  const { isSuperAdmin } = useAuth();
  const [internalMock, setInternalMock] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const toggle = useCallback(() => {
    setInternalMock(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  // Strict restriction: only Super Admin can activate mock data. For all other roles, always force Live API (false).
  const useMock = isSuperAdmin ? internalMock : false;

  return <Ctx.Provider value={{ useMock, toggle }}>{children}</Ctx.Provider>;
}

export function useEventMock() {
  return useContext(Ctx);
}

export function NoBackendBanner({ feature }: { feature: string }) {
  const { isSuperAdmin } = useAuth();
  let useMock = false;
  try { useMock = useEventMock().useMock; } catch {}
  if (useMock || !isSuperAdmin) return null;
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 mb-4">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span><strong>{feature}</strong> has no backend API yet — showing mock data.</span>
    </div>
  );
}
