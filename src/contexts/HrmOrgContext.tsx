import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { hrmService } from "../services/hrm/hrmService";
import type { HrOrganization } from "../types/hrm";

interface HrmOrgContextValue {
  activeOrgId: number | null;
  activeOrg: HrOrganization | null;
  organizations: HrOrganization[];
  setActiveOrgId: (id: number) => void;
  loading: boolean;
}

const HrmOrgContext = createContext<HrmOrgContextValue>({
  activeOrgId: null,
  activeOrg: null,
  organizations: [],
  setActiveOrgId: () => {},
  loading: true,
});

export function HrmOrgProvider({ children }: { children: React.ReactNode }) {
  const [organizations, setOrganizations] = useState<HrOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOrgId, setActiveOrgIdState] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem("hrm_active_org_id");
      return stored ? Number(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    hrmService.getMyOrganizations()
      .then((orgs) => {
        setOrganizations(orgs);
        if (orgs.length > 0) {
          const stored = activeOrgId;
          const valid = stored && orgs.some((o) => o.id === stored);
          if (!valid) {
            setActiveOrgIdState(orgs[0].id);
            try { localStorage.setItem("hrm_active_org_id", String(orgs[0].id)); } catch {}
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setActiveOrgId = useCallback((id: number) => {
    setActiveOrgIdState(id);
    try { localStorage.setItem("hrm_active_org_id", String(id)); } catch {}
  }, []);

  const activeOrg = organizations.find((o) => o.id === activeOrgId) ?? null;

  return (
    <HrmOrgContext.Provider value={{ activeOrgId, activeOrg, organizations, setActiveOrgId, loading }}>
      {children}
    </HrmOrgContext.Provider>
  );
}

export const useHrmOrg = () => useContext(HrmOrgContext);
