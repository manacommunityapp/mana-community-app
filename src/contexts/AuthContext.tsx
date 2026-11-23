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
  isSuperAdmin: boolean;
  isSportsAdmin: boolean;
  isEventsAdmin: boolean;
  isAuctionAdmin: boolean;
  isAnyAdmin: boolean;
  isVendor: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  /** Call this to hydrate communityId / role after receiving extra user info */
  updateUser: (patch: Partial<StoredUser>) => void;
  /** Check if user has a specific permission. SUPER_ADMIN bypasses. */
  hasPermission: (permission: string) => boolean;
  /** Check if user has ANY of the specified permissions. SUPER_ADMIN bypasses. */
  hasAnyPermission: (...permissions: string[]) => boolean;
  /** Check if the user's role can perform an action on a specific menu item. SUPER_ADMIN bypasses. */
  hasMenuPermission: (menuKey: string, action: "view" | "add" | "update" | "delete") => boolean;
  /**
   * Whether the authoritative permission/module set has been loaded from the
   * server (`/users/me`) yet. Authorization gates must wait for "ready" instead
   * of treating a missing value as "allowed".
   *  - "loading": a session exists but /users/me has not resolved yet.
   *  - "ready":   /users/me resolved; `permissions` / `enabledModules` are authoritative.
   *  - "error":   /users/me failed; nothing may be inferred, so gates must deny.
   */
  authSyncStatus: AuthSyncStatus;
}

export type AuthSyncStatus = "loading" | "ready" | "error";

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(restoreSession);
  const [authSyncStatus, setAuthSyncStatus] = useState<AuthSyncStatus>("loading");

  const updateUser = useCallback((patch: Partial<StoredUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      // Filter out undefined keys so we don't accidentally overwrite existing valid values (e.g. profilePicUrl)
      const cleanPatch: Partial<StoredUser> = {};
      (Object.keys(patch) as (keyof StoredUser)[]).forEach((key) => {
        if (patch[key] !== undefined) {
          (cleanPatch as any)[key] = patch[key];
        }
      });
      const updated = { ...prev, ...cleanPatch };
      storeUser(updated);
      return updated;
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setAuthSyncStatus("ready");
      return;
    }
    userService.getMe()
      .then((me) => {
        const resolvedPic = me.profilePicUrl || (me as any).profilePic;
        updateUser({
          role: me.role,
          roles: me.roles,
          fullName: me.fullName,
          email: me.email,
          phone: me.phone,
          communityId: me.communityId,
          roleId: me.roleId,
          gender: me.gender,
          dateOfBirth: me.dateOfBirth || (me as any).dob,
          flatNo: me.flatNo,
          block: me.block,
          // Always coerce to arrays: `undefined` is reserved to mean
          // "not loaded yet" for the authorization gates.
          permissions: me.permissions ?? [],
          enabledModules: me.enabledModules ?? [],
          menuPermissions: me.menuPermissions ?? [],
          ...(resolvedPic ? { profilePicUrl: resolvedPic } : {}),
          occupancyStatus: me.occupancyStatus,
          residentType: me.residentType,
          userType: me.userType || me.occupancyStatus,
        });
        setAuthSyncStatus("ready");
      })
      .catch((err) => {
        console.error("Failed to synchronize user permissions on boot:", err);
        setAuthSyncStatus("error");
      });
  }, [updateUser]);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await authService.login(data);
    if (!response || !response.userId) {
      throw new Error("Invalid response from authentication server. Please verify backend service connection.");
    }
    safeStorage.setItem("mana_last_activity", String(Date.now()));
    if (response.token) {
      setTokens(response.token, response.refreshToken);
    }

    const payload = response.token ? decodeJwtPayload(response.token) : null;
    // Roles are taken from the signed token's claims first; the login response is
    // used only as a fallback. Neither comes from the writable `mana_user` blob.
    const tokenRoles = extractRolesFromClaims(payload);
    const responseRoles = parseRoleList(response.role);
    const roles = tokenRoles.length > 0 ? tokenRoles : responseRoles;
    const newUser: AuthUser = {
      userId: response.userId,
      role: roles.join(",") || "MEMBER",
      roles,
      communityId: response.communityId ?? (payload?.communityId != null ? Number(payload.communityId) : undefined),
      fullName: response.fullName ?? (payload?.fullName != null ? String(payload.fullName) : payload?.sub != null ? String(payload.sub) : undefined),
      email: response.email ?? (payload?.email != null ? String(payload.email) : undefined),
      gender: response.gender,
      dateOfBirth: response.dateOfBirth,
      // `undefined` means "not loaded yet" — module gates wait instead of opening.
      enabledModules: Array.isArray(response.enabledModules) ? response.enabledModules : undefined,
      occupancyStatus: response.occupancyStatus,
      userType: response.userType || response.occupancyStatus,
      residentType: response.residentType,
      profilePicUrl: (response as any).profilePicUrl || (response as any).profilePic || (payload as any)?.profilePicUrl || (payload as any)?.profilePic,
      permissions: [], // guard nav from flash before /users/me resolves
    };
    storeUser(newUser);
    setUser(newUser);
    setAuthSyncStatus("loading");

    try {
      const me = await userService.getMe();
      const updated = {
        ...newUser,
        role: me.role,
        roles: me.roles,
        fullName: me.fullName,
        email: me.email,
        phone: me.phone,
        communityId: me.communityId,
        roleId: me.roleId,
        gender: me.gender || newUser.gender,
        dateOfBirth: me.dateOfBirth || (me as any).dob || newUser.dateOfBirth,
        flatNo: me.flatNo,
        block: me.block,
        tower: me.tower,
        permissions: me.permissions ?? [],
        enabledModules: me.enabledModules ?? [],
        menuPermissions: me.menuPermissions ?? [],
        profilePicUrl: me.profilePicUrl || (me as any).profilePic || newUser.profilePicUrl,
        occupancyStatus: me.occupancyStatus,
        residentType: me.residentType,
        userType: me.userType || me.occupancyStatus,
      };
      storeUser(updated);
      setUser(updated);
      setAuthSyncStatus("ready");
    } catch (err) {
      console.error("Failed to sync permissions on login:", err);
      setAuthSyncStatus("error");
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const response = await authService.register(data);
    if (!response || !response.userId) {
      throw new Error("Invalid response from registration server. Please verify backend service connection.");
    }
    safeStorage.setItem("mana_last_activity", String(Date.now()));
    if (response.token) {
      setTokens(response.token, response.refreshToken);
    }

    const payload = response.token ? decodeJwtPayload(response.token) : null;
    const tokenRoles = extractRolesFromClaims(payload);
    const responseRoles = parseRoleList(response.role);
    const roles = tokenRoles.length > 0 ? tokenRoles : responseRoles;
    const newUser: AuthUser = {
      userId: response.userId,
      role: roles.join(",") || "MEMBER",
      roles,
      communityId: response.communityId ?? (payload?.communityId != null ? Number(payload.communityId) : undefined),
      fullName: response.fullName ?? (payload?.fullName != null ? String(payload.fullName) : undefined),
      email: response.email ?? data.email,
      gender: response.gender,
      dateOfBirth: response.dateOfBirth,
      enabledModules: Array.isArray(response.enabledModules) ? response.enabledModules : undefined,
      occupancyStatus: response.occupancyStatus || data.occupancyStatus || data.userType,
      userType: response.userType || data.userType || data.occupancyStatus,
      residentType: response.residentType || data.residentType,
      profilePicUrl: (response as any).profilePicUrl || (response as any).profilePic || (payload as any)?.profilePicUrl,
      permissions: [], // guard nav from flash before /users/me resolves
    };
    storeUser(newUser);
    setUser(newUser);
    setAuthSyncStatus("loading");

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
        enabledModules: me.enabledModules ?? [],
        menuPermissions: me.menuPermissions ?? [],
        profilePicUrl: me.profilePicUrl || (me as any).profilePic || newUser.profilePicUrl,
        occupancyStatus: me.occupancyStatus,
        residentType: me.residentType,
        userType: me.userType || me.occupancyStatus,
      };
      storeUser(updated);
      setUser(updated);
      setAuthSyncStatus("ready");
    } catch (err) {
      console.error("Failed to sync permissions on registration:", err);
      setAuthSyncStatus("error");
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

  const isSuperAdmin = userRoleSet.has("SUPER_ADMIN") || userRoleSet.has("SUPERADMIN") || userRoleSet.has("SUPER_ADMINISTRATOR");

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

  const hasMenuPermission = useCallback((menuKey: string, action: "view" | "add" | "update" | "delete"): boolean => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    const perm = user.menuPermissions?.find(p => p.menuKey === menuKey);
    if (!perm) return false;
    if (action === "view") return perm.canView;
    if (action === "add") return perm.canAdd;
    if (action === "update") return perm.canUpdate;
    if (action === "delete") return perm.canDelete;
    return false;
  }, [user, isSuperAdmin]);

  const isAnyAdmin = isSuperAdmin || Array.from(userRoleSet).some(r => r.includes("ADMIN"));

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isAdmin: userRoleSet.has("ADMIN") || isSuperAdmin || userRoleSet.has("COMMUNITY_ADMIN") || userRoleSet.has("COMMUNITYADMIN") || userRoleSet.has("COMMUNITY_ADMINISTRATOR"),
    isSuperAdmin,
    isSportsAdmin: userRoleSet.has("SPORTS_ADMIN") || isSuperAdmin || userRoleSet.has("COMMUNITY_ADMIN") || userRoleSet.has("COMMUNITYADMIN") || userRoleSet.has("COMMUNITY_ADMINISTRATOR"),
    isEventsAdmin: userRoleSet.has("EVENTS_ADMIN") || userRoleSet.has("EVENT_ADMIN") || isSuperAdmin || userRoleSet.has("COMMUNITY_ADMIN") || userRoleSet.has("COMMUNITYADMIN") || userRoleSet.has("COMMUNITY_ADMINISTRATOR"),
    isAuctionAdmin: isSuperAdmin || userRoleSet.has("COMMUNITY_ADMIN") || userRoleSet.has("SPORTS_ADMIN") || userRoleSet.has("ADMIN"),
    isAnyAdmin,
    isVendor: isSuperAdmin || userRoleSet.has("ADMIN") || userRoleSet.has("COMMUNITY_ADMIN") || userRoleSet.has("VENDOR") || userRoleSet.has("SPORTS_VENDOR") || userRoleSet.has("VENDOR_ADMIN"),
    login,
    register,
    logout,
    updateUser,
    hasPermission,
    hasAnyPermission,
    hasMenuPermission,
    authSyncStatus,
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

/**
 * Restores an authenticated session on boot.
 *
 * SECURITY: the `mana_user` localStorage blob is writable by anyone with a
 * DevTools console, so it is used ONLY for display fields (name, avatar, flat
 * number). Everything that drives authorization — roles, permissions, enabled
 * modules — is derived from the signed access token's claims or re-fetched from
 * `/users/me`. Decoding the JWT here is NOT verification; the point is that the
 * user cannot forge claims without forging a signature the Spring Boot backend
 * verifies, which is strictly better than trusting a plain writable blob.
 *
 * A session is never restored without an access token (the old
 * `mana_last_activity`-only path is gone).
 */
function restoreSession(): AuthUser | null {
  const token = getToken();
  if (!token) return null;

  const claims = decodeJwtPayload(token);
  const stored = getStoredUser();
  const userId = String(
    claims?.userId ?? claims?.uid ?? claims?.sub ?? stored?.userId ?? ""
  ).trim();
  if (!userId) return null;

  const roles = extractRolesFromClaims(claims);
  const communityId =
    claims?.communityId != null ? Number(claims.communityId) : stored?.communityId;

  return {
    // Display-only fields may come from the blob; they grant nothing.
    ...(stored ?? {}),
    userId,
    communityId,
    // ── Authorization fields: never from the blob ──────────────────────────
    role: roles.join(","),
    roles,
    permissions: [],
    enabledModules: undefined, // "not loaded yet" — gates wait, they do not open
    menuPermissions: undefined,
  } as AuthUser;
}

/** Split a comma-separated role string into normalized role names. */
function parseRoleList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((r) => normalizeRole(String(r)))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[,\s]+/)
      .map((r) => normalizeRole(r))
      .filter(Boolean);
  }
  return [];
}

/** Strip Spring Security's `ROLE_` prefix and upper-case the role name. */
function normalizeRole(role: string): string {
  const trimmed = role.trim().toUpperCase();
  return trimmed.startsWith("ROLE_") ? trimmed.slice(5) : trimmed;
}

/**
 * Reads role names out of the access token's claims, covering the shapes a
 * Spring Boot JWT commonly uses: `roles`, `role`, `authorities`, `scope`/`scp`.
 */
export function extractRolesFromClaims(
  claims: Record<string, unknown> | null | undefined
): string[] {
  if (!claims) return [];
  const collected = new Set<string>();
  for (const key of ["roles", "role", "authorities", "scope", "scp"]) {
    for (const role of parseRoleList(claims[key])) {
      collected.add(role);
    }
  }
  return Array.from(collected);
}

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
