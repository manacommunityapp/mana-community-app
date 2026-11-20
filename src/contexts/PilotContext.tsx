import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTenantContext } from "./TenantContext";
import {
  DEFAULT_PILOT_CONFIG,
  pilotConfigService,
  type PilotConfig,
} from "../services/pilot/pilotConfigService";
import { isModuleEnabled as evalModuleEnabled } from "../config/featureFlags";
import { analyticsService } from "../services/analytics/analyticsService";
import { useAuth } from "./AuthContext";

interface PilotContextValue extends PilotConfig {
  isLoaded: boolean;
  isModuleEnabled: (moduleKey: string) => boolean;
}

const PilotContext = createContext<PilotContextValue | undefined>(undefined);

export function PilotProvider({ children }: { children: ReactNode }) {
  const { communityId, isResolved } = useTenantContext();
  const { user } = useAuth();
  const [config, setConfig] = useState<PilotConfig>(DEFAULT_PILOT_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isResolved || communityId == null) {
      setConfig(DEFAULT_PILOT_CONFIG);
      setIsLoaded(false);
      return;
    }
    let cancelled = false;
    pilotConfigService
      .getConfig(communityId)
      .then((c) => !cancelled && setConfig(c))
      // Fail open: if the config endpoint is missing/down, nothing is hidden.
      .catch(() => !cancelled && setConfig(DEFAULT_PILOT_CONFIG))
      .finally(() => !cancelled && setIsLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [communityId, isResolved]);

  useEffect(() => {
    analyticsService.setContext({
      communityId,
      userId: user?.userId ?? null,
      cohort: config.cohort,
    });
  }, [communityId, user?.userId, config.cohort]);

  const value = useMemo<PilotContextValue>(
    () => ({
      ...config,
      isLoaded,
      enabledModules: user?.enabledModules ?? config.enabledModules,
      isModuleEnabled: (moduleKey: string) =>
        evalModuleEnabled(moduleKey, { enabledModules: user?.enabledModules ?? config.enabledModules }),
    }),
    [config, isLoaded, user?.enabledModules],
  );

  return <PilotContext.Provider value={value}>{children}</PilotContext.Provider>;
}

export function usePilot(): PilotContextValue {
  const ctx = useContext(PilotContext);
  if (!ctx) throw new Error("usePilot must be used within PilotProvider");
  return ctx;
}
