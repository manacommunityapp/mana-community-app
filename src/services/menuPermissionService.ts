import { apiClient } from "./apiClient";
import type { MenuRolePermissionResponse } from "../types/api";

export const menuPermissionService = {
  /**
   * GET /api/menu-permissions/role/{roleId}/viewable
   * Retrieves the list of active menu permissions assigned to the specified role ID.
   */
  async getViewableMenus(roleId: number): Promise<MenuRolePermissionResponse[]> {
    return apiClient.get<MenuRolePermissionResponse[]>(`/menu-permissions/role/${roleId}/viewable`);
  },
};
