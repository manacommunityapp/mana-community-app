import { useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";

type MenuAction = "view" | "add" | "update" | "delete";

export function useMenuPermission() {
  const { user, hasMenuPermission } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const canView = useCallback(
    (menuKey: string) => isSuperAdmin || hasMenuPermission(menuKey, "view"),
    [isSuperAdmin, hasMenuPermission],
  );

  const canAdd = useCallback(
    (menuKey: string) => isSuperAdmin || hasMenuPermission(menuKey, "add"),
    [isSuperAdmin, hasMenuPermission],
  );

  const canUpdate = useCallback(
    (menuKey: string) => isSuperAdmin || hasMenuPermission(menuKey, "update"),
    [isSuperAdmin, hasMenuPermission],
  );

  const canDelete = useCallback(
    (menuKey: string) => isSuperAdmin || hasMenuPermission(menuKey, "delete"),
    [isSuperAdmin, hasMenuPermission],
  );

  const check = useCallback(
    (menuKey: string, action: MenuAction) => isSuperAdmin || hasMenuPermission(menuKey, action),
    [isSuperAdmin, hasMenuPermission],
  );

  return { canView, canAdd, canUpdate, canDelete, check, isSuperAdmin };
}
