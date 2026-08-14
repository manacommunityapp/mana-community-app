import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import {
  getToken,
  setTokens,
  removeToken,
  getStoredUser,
  storeUser,
  type StoredUser,
} from "../services/common/apiClient";
import { authService } from "../services/common/authService";
import { userService } from "../services/common/userService";
import { safeStorage } from "../utils/storage";
import type { LoginRequest, RegisterRequest } from "../types/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthUser extends StoredUser {
  userId: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSportsAdmin: boolean;
  isAuctionAdmin: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  /** Call this to hydrate communityId / role after receiving extra user info */
  updateUser: (patch: Partial<StoredUser>) => void;
  /** Check if user has a specific permission. SUPER_ADMIN bypasses. */
  hasPermission: (permission: string) => boolean;
  /** Check if user has ANY of the specified permissions. SUPER_ADMIN bypasses. */
  hasAnyPermission: (...permissions: string[]) => boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    // Hydrate from localStorage on first render
    const stored = getStoredUser();
    const token = getToken();
    if (stored && token) return stored as AuthUser;
    return null;
  });

  const updateUser = useCallback((patch: Partial<StoredUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      storeUser(updated);
      return updated;
    });
  }, []);

  // Synchronize full profile and permissions on startup
  useEffect(() => {
    const token = getToken();
    if (token) {
      userService.getMe()
        .then((me) => {
          updateUser({
            role: me.role,
            roles: me.roles,
            fullName: me.fullName,
            email: me.email,
            communityId: me.communityId,
            roleId: me.roleId,
            permissions: me.permissions ?? [],
            enabledModules: me.enabledModules,
          });
        })
        .catch((err) => {
          console.error("Failed to synchronize user permissions on boot:", err);
        });
    }
  }, [updateUser]);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await authService.login(data);
    safeStorage.setItem("mana_last_activity", String(Date.now()));
    setTokens(response.token, response.refreshToken);

    // Try to use direct response fields first, fallback to JWT payload
    const payload = decodeJwtPayload(response.token);
    const newUser: AuthUser = {
      userId: response.userId,
      role: response.role ?? (payload?.role != null ? String(payload.role) : "MEMBER"),
      communityId: response.communityId ?? (payload?.communityId != null ? Number(payload.communityId) : undefined),
      fullName: response.fullName ?? (payload?.fullName != null ? String(payload.fullName) : payload?.sub != null ? String(payload.sub) : undefined),
      email: response.email ?? (payload?.email != null ? String(payload.email) : undefined),
      dateOfBirth: response.dateOfBirth,
      enabledModules: response.enabledModules,
      permissions: [], // guard nav from flash before /users/me resolves
    };
    storeUser(newUser);
    setUser(newUser);

    try {
      const me = await userService.getMe();
      const updated = {
        ...newUser,
        role: me.role,
        roles: me.roles,
        fullName: me.fullName,
        email: me.email,
        communityId: me.communityId,
        roleId: me.roleId,
        permissions: me.permissions ?? [],
        enabledModules: me.enabledModules,
      };
      storeUser(updated);
      setUser(updated);
    } catch (err) {
      console.error("Failed to sync permissions on login:", err);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const response = await authService.register(data);
    safeStorage.setItem("mana_last_activity", String(Date.now()));
    setTokens(response.token, response.refreshToken);

    const payload = decodeJwtPayload(response.token);
    const newUser: AuthUser = {
      userId: response.userId,
      role: response.role ?? (payload?.role != null ? String(payload.role) : "MEMBER"),
      communityId: response.communityId ?? (payload?.communityId != null ? Number(payload.communityId) : undefined),
      fullName: response.fullName ?? (payload?.fullName != null ? String(payload.fullName) : undefined),
      email: response.email ?? data.email,
      dateOfBirth: response.dateOfBirth,
      enabledModules: response.enabledModules,
      permissions: [], // guard nav from flash before /users/me resolves
    };
    storeUser(newUser);
    setUser(newUser);

    try {
      const me = await userService.getMe();
      const updated = {
        ...newUser,
        role: me.role,
        roles: me.roles,
        fullName: me.fullName,
        email: me.email,
        communityId: me.communityId,
        roleId: me.roleId,
        permissions: me.permissions ?? [],
        enabledModules: me.enabledModules,
      };
      storeUser(updated);
      setUser(updated);
    } catch (err) {
      console.error("Failed to sync permissions on registration:", err);
    }
  }, []);

  const logout = useCallback(() => {
    // Best-effort server-side audit; never block local logout on it.
    void authService.logout();
    removeToken();
    setUser(null);
    window.location.href = "/login";
  }, []);

  // Parse all assigned roles from roles array or comma-separated role string.
  // Must be above hasPermission/hasAnyPermission so they can reference it.
  const userRoleSet = new Set<string>(
    user
      ? (user.roles && user.roles.length > 0
          ? user.roles
          : (user.role ?? "").split(",")
        ).map((r) => r.trim().toUpperCase()).filter(Boolean)
      : []
  );

  const isSuperAdmin = userRoleSet.has("SUPER_ADMIN");

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    return user.permissions?.includes(permission) ?? false;
  }, [user, isSuperAdmin]);

  const hasAnyPermission = useCallback((...permissions: string[]): boolean => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    return permissions.some(p => user.permissions?.includes(p) ?? false);
  }, [user, isSuperAdmin]);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user && !!getToken(),
    isAdmin: userRoleSet.has("ADMIN") || userRoleSet.has("SUPER_ADMIN") || userRoleSet.has("COMMUNITY_ADMIN"),
    isSportsAdmin: userRoleSet.has("SPORTS_ADMIN") || userRoleSet.has("SUPER_ADMIN") || userRoleSet.has("COMMUNITY_ADMIN"),
    isAuctionAdmin: userRoleSet.has("SUPER_ADMIN") || userRoleSet.has("COMMUNITY_ADMIN") || userRoleSet.has("SPORTS_ADMIN") || userRoleSet.has("ADMIN"),
    login,
    register,
    logout,
    updateUser,
    hasPermission,
    hasAnyPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Safely decode the JWT payload (base64url → JSON). Returns null on failure. */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    const padded = base64.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}
