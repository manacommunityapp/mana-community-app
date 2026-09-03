import { describe, it, expect } from "vitest";
import {
  isUserSuperAdmin,
  canAccessModule,
  hasUserPermission,
  hasAnyUserPermission,
  canAccessEndpoint,
} from "./permissionUtils";
import type { StoredUser } from "../services/common/apiClient";
import { VIEW_NOTICES, CREATE_NOTICE, VIEW_EVENTS } from "../constants/permissions";

describe("permissionUtils", () => {
  const superAdminUser: StoredUser = {
    userId: "1",
    role: "SUPER_ADMIN",
    roles: ["SUPER_ADMIN"],
    permissions: [],
    enabledModules: [],
  };

  const regularMemberUser: StoredUser = {
    userId: "2",
    role: "MEMBER",
    roles: ["MEMBER"],
    permissions: [VIEW_EVENTS],
    enabledModules: ["EVENTS", "COMMUNITY_FEED"],
  };

  const noticeAdminUser: StoredUser = {
    userId: "3",
    role: "COMMUNITY_ADMIN",
    roles: ["COMMUNITY_ADMIN"],
    permissions: [VIEW_NOTICES, CREATE_NOTICE],
    enabledModules: ["NOTICES", "EVENTS"],
  };

  describe("isUserSuperAdmin", () => {
    it("identifies super admins correctly", () => {
      expect(isUserSuperAdmin(superAdminUser)).toBe(true);
      expect(isUserSuperAdmin(regularMemberUser)).toBe(false);
      expect(isUserSuperAdmin(null)).toBe(false);
    });
  });

  describe("canAccessModule", () => {
    it("allows super admin to access any module", () => {
      expect(canAccessModule(superAdminUser, "NOTICES")).toBe(true);
    });

    it("checks enabledModules for normal users", () => {
      expect(canAccessModule(regularMemberUser, "EVENTS")).toBe(true);
      expect(canAccessModule(regularMemberUser, "NOTICES")).toBe(false);
      expect(canAccessModule(noticeAdminUser, "NOTICES")).toBe(true);
    });
  });

  describe("hasUserPermission & hasAnyUserPermission", () => {
    it("allows super admin all permissions", () => {
      expect(hasUserPermission(superAdminUser, VIEW_NOTICES)).toBe(true);
      expect(hasAnyUserPermission(superAdminUser, VIEW_NOTICES, "SOME_OTHER_PERM")).toBe(true);
    });

    it("checks granted permissions for normal users", () => {
      expect(hasUserPermission(regularMemberUser, VIEW_EVENTS)).toBe(true);
      expect(hasUserPermission(regularMemberUser, VIEW_NOTICES)).toBe(false);
      expect(hasAnyUserPermission(regularMemberUser, VIEW_NOTICES, VIEW_EVENTS)).toBe(true);
    });
  });

  describe("canAccessEndpoint", () => {
    it("always permits public endpoints without a user", () => {
      expect(canAccessEndpoint("/auth/login", "POST", null).allowed).toBe(true);
      expect(canAccessEndpoint("/auth/register", "POST", null).allowed).toBe(true);
      expect(canAccessEndpoint("/public/events/1", "GET", null).allowed).toBe(true);
    });

    it("blocks endpoints when user is not authenticated", () => {
      const res = canAccessEndpoint("/notices", "GET", null);
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe("UNAUTHENTICATED");
    });

    it("blocks endpoint if module is disabled for user", () => {
      const res = canAccessEndpoint("/notices", "GET", regularMemberUser);
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe("MODULE_DISABLED");
    });

    it("blocks endpoint if user lacks permission", () => {
      const userWithModuleOnly: StoredUser = {
        userId: "4",
        role: "MEMBER",
        roles: ["MEMBER"],
        permissions: [VIEW_EVENTS],
        enabledModules: ["NOTICES", "EVENTS"],
      };
      const res = canAccessEndpoint("/notices", "GET", userWithModuleOnly);
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe("PERMISSION_DENIED");
    });

    it("allows endpoint when user has both module and permission enabled", () => {
      const res = canAccessEndpoint("/notices", "GET", noticeAdminUser);
      expect(res.allowed).toBe(true);
    });

    it("allows super admin to call any endpoint", () => {
      expect(canAccessEndpoint("/notices", "GET", superAdminUser).allowed).toBe(true);
      expect(canAccessEndpoint("/notices", "POST", superAdminUser).allowed).toBe(true);
    });
  });
});
