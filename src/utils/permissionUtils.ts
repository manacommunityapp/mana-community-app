import { getStoredUser, type StoredUser } from "../services/common/apiClient";
import {
  VIEW_FEED,
  VIEW_NOTICES,
  CREATE_NOTICE,
  DELETE_NOTICE,
  VIEW_EVENTS,
  VIEW_SPORTS_MENU,
  VIEW_SPORTS_MAIN,
  VIEW_MARKETPLACE,
  VIEW_VISITORS,
  VIEW_RESOURCE_BOOKING,
  VIEW_AMENITIES,
  VIEW_TICKETS,
  VIEW_POLLS,
  VIEW_JOBS,
  VIEW_ADMIN,
  VIEW_SERVICE_CATALOG,
} from "../constants/permissions";

export interface EndpointAccessRule {
  pathPrefix: string;
  module?: string;
  methods?: string[];
  anyPermissions?: string[];
}

export const ENDPOINT_ACCESS_RULES: EndpointAccessRule[] = [
  // Notices
  { pathPrefix: "/notices/all", module: "NOTICES", methods: ["GET"], anyPermissions: [DELETE_NOTICE, VIEW_NOTICES] },
  { pathPrefix: "/notices", module: "NOTICES", methods: ["GET"], anyPermissions: [VIEW_NOTICES] },
  { pathPrefix: "/notices", module: "NOTICES", methods: ["POST", "PUT"], anyPermissions: [CREATE_NOTICE] },
  { pathPrefix: "/notices", module: "NOTICES", methods: ["DELETE"], anyPermissions: [DELETE_NOTICE] },

  // Events
  { pathPrefix: "/events", module: "EVENTS", methods: ["GET"], anyPermissions: [VIEW_EVENTS] },

  // Sports
  { pathPrefix: "/sports", module: "SPORTS", methods: ["GET"], anyPermissions: [VIEW_SPORTS_MENU, VIEW_SPORTS_MAIN] },
  { pathPrefix: "/sports-events", module: "SPORTS", methods: ["GET"], anyPermissions: [VIEW_SPORTS_MENU, VIEW_SPORTS_MAIN] },

  // Marketplace
  { pathPrefix: "/marketplace", module: "MARKETPLACE", methods: ["GET"], anyPermissions: [VIEW_MARKETPLACE] },

  // Visitors
  { pathPrefix: "/visitors", module: "VISITORS", methods: ["GET"], anyPermissions: [VIEW_VISITORS] },
  { pathPrefix: "/visitor-passes", module: "VISITORS", methods: ["GET"], anyPermissions: [VIEW_VISITORS] },

  // Resource Booking
  { pathPrefix: "/bookings", module: "BOOKINGS", methods: ["GET"], anyPermissions: [VIEW_RESOURCE_BOOKING, VIEW_AMENITIES] },
  { pathPrefix: "/resources", module: "BOOKINGS", methods: ["GET"], anyPermissions: [VIEW_RESOURCE_BOOKING, VIEW_AMENITIES] },

  // Helpdesk
  { pathPrefix: "/tickets", module: "HELPDESK", methods: ["GET"], anyPermissions: [VIEW_TICKETS] },
  { pathPrefix: "/helpdesk", module: "HELPDESK", methods: ["GET"], anyPermissions: [VIEW_TICKETS] },

  // Polls
  { pathPrefix: "/polls", module: "POLLS", methods: ["GET"], anyPermissions: [VIEW_POLLS] },

  // Jobs
  { pathPrefix: "/jobs", module: "JOBS", methods: ["GET"], anyPermissions: [VIEW_JOBS] },

  // Community Feed
  { pathPrefix: "/posts", module: "COMMUNITY_FEED", methods: ["GET"], anyPermissions: [VIEW_FEED] },
  { pathPrefix: "/feed", module: "COMMUNITY_FEED", methods: ["GET"], anyPermissions: [VIEW_FEED] },

  // Service Platform
  { pathPrefix: "/services", module: "SERVICE_PLATFORM", methods: ["GET"], anyPermissions: [VIEW_SERVICE_CATALOG] },

  // Admin
  { pathPrefix: "/admin", module: "ADMIN_HUB", anyPermissions: [VIEW_ADMIN] },
];

export function isUserSuperAdmin(user?: StoredUser | null): boolean {
  if (!user) return false;
  const roleSet = new Set<string>(
    (user.roles && user.roles.length > 0 ? user.roles : (user.role ?? "").split(","))
      .map((r) => r.trim().toUpperCase())
      .filter(Boolean)
  );
  return roleSet.has("SUPER_ADMIN") || roleSet.has("SUPERADMIN") || roleSet.has("SUPER_ADMINISTRATOR");
}

export function canAccessModule(user: StoredUser | null | undefined, moduleKey: string): boolean {
  if (!user) return false;
  if (isUserSuperAdmin(user)) return true;
  if (!user.enabledModules) return true;
  return user.enabledModules.includes(moduleKey);
}

export function hasUserPermission(user: StoredUser | null | undefined, permission: string): boolean {
  if (!user) return false;
  if (isUserSuperAdmin(user)) return true;
  return user.permissions?.includes(permission) ?? false;
}

export function hasAnyUserPermission(user: StoredUser | null | undefined, ...permissions: string[]): boolean {
  if (!user) return false;
  if (isUserSuperAdmin(user)) return true;
  return permissions.some((p) => user.permissions?.includes(p) ?? false);
}

export interface AccessCheckResult {
  allowed: boolean;
  reason?: "UNAUTHENTICATED" | "MODULE_DISABLED" | "PERMISSION_DENIED";
  message?: string;
  module?: string;
  requiredPermissions?: string[];
}

export function canAccessEndpoint(
  path: string,
  method = "GET",
  user: StoredUser | null = getStoredUser()
): AccessCheckResult {
  const normalizedPath = path.startsWith("/api") ? path.substring(4) : path;
  const upperMethod = method.toUpperCase();

  // Public / unauthenticated endpoints allowed during registration, login, and public browsing
  if (
    normalizedPath.startsWith("/auth/") ||
    normalizedPath === "/auth/login" ||
    normalizedPath === "/auth/register" ||
    normalizedPath === "/auth/refresh" ||
    normalizedPath.startsWith("/otp/") ||
    normalizedPath.startsWith("/public/") ||
    normalizedPath.includes("/public") ||
    (upperMethod === "GET" && (
      normalizedPath === "/communities" ||
      normalizedPath.startsWith("/communities?") ||
      normalizedPath.startsWith("/communities/") ||
      normalizedPath === "/community" ||
      normalizedPath.startsWith("/community?") ||
      normalizedPath.startsWith("/community/") ||
      normalizedPath.startsWith("/branding") ||
      normalizedPath.startsWith("/sports/events/by-uuid/")
    ))
  ) {
    return { allowed: true };
  }

  if (normalizedPath === "/users/me" || normalizedPath.startsWith("/users/me")) {
    return { allowed: true };
  }

  if (!user) {
    return { allowed: false, reason: "UNAUTHENTICATED", message: "User is not logged in." };
  }

  if (isUserSuperAdmin(user)) {
    return { allowed: true };
  }

  const rule = ENDPOINT_ACCESS_RULES.find((r) => {
    const matchesPath =
      normalizedPath === r.pathPrefix ||
      normalizedPath.startsWith(`${r.pathPrefix}/`) ||
      normalizedPath.startsWith(`${r.pathPrefix}?`);
    if (!matchesPath) return false;
    if (r.methods && !r.methods.includes(upperMethod)) return false;
    return true;
  });

  if (!rule) {
    return { allowed: true };
  }

  if (rule.module && user.enabledModules && user.enabledModules.length > 0) {
    if (!user.enabledModules.includes(rule.module)) {
      return {
        allowed: false,
        reason: "MODULE_DISABLED",
        module: rule.module,
        message: `The ${rule.module} module is disabled for your community.`,
      };
    }
  }

  if (
    rule.anyPermissions &&
    rule.anyPermissions.length > 0 &&
    Array.isArray(user.permissions) &&
    user.permissions.length > 0
  ) {
    const hasPerm = rule.anyPermissions.some((p) => user.permissions?.includes(p));
    if (!hasPerm) {
      return {
        allowed: false,
        reason: "PERMISSION_DENIED",
        requiredPermissions: rule.anyPermissions,
        message: "You do not have permission to perform this action.",
      };
    }
  }

  return { allowed: true };
}
