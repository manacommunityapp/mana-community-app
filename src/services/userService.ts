import { apiClient } from "./apiClient";
import type { UserResponse, RolePermissionsMap, RoleResponse } from "../types/api";

export const userService = {
  /** GET /api/users/search?communityId={id}&query={q} */
  async searchUsers(communityId: number, query: string): Promise<UserResponse[]> {
    return apiClient.get<UserResponse[]>(`/users/search?communityId=${communityId}&query=${query}`);
  },

  /** GET /api/users/community/{id} */
  async getCommunityUsers(communityId: number): Promise<UserResponse[]> {
    return apiClient.get<UserResponse[]>(`/users/community/${communityId}`);
  },

  /** GET /api/users — unwraps the paginated response into a flat list.
   *  The backend returns a PagedResponse ({ content, totalElements, ... });
   *  a large page size keeps the existing "all users" semantics, and we
   *  tolerate a raw array too for backward compatibility. */
  async getAllUsers(kycStatus?: string): Promise<UserResponse[]> {
    const query = kycStatus ? `&kycStatus=${kycStatus}` : "";
    const res = await apiClient.get<UserResponse[] | { content?: UserResponse[] }>(
      `/users?page=0&size=1000${query}`
    );
    if (Array.isArray(res)) return res;
    return res?.content ?? [];
  },

  /** PUT /api/users/{id}/status */
  async toggleUserStatus(userId: number): Promise<void> {
    return apiClient.put<void>(`/users/${userId}/status`, {});
  },

  /** PUT /api/users/{id}/role */
  async updateUserRole(userId: number, role: string): Promise<void> {
    return apiClient.put<void>(`/users/${userId}/role`, { role });
  },

  /** GET /api/roles/permissions */
  async getRolePermissions(): Promise<RolePermissionsMap> {
    return apiClient.get<RolePermissionsMap>("/roles/permissions");
  },

  /** PUT /api/roles/{role}/permissions */
  async updateRolePermissions(role: string, permissions: string[], userId?: number): Promise<void> {
    const url = userId ? `/roles/${role}/permissions?userId=${userId}` : `/roles/${role}/permissions`;
    return apiClient.put<void>(url, permissions);
  },

  /** GET /api/roles */
  async getRoles(): Promise<RoleResponse[]> {
    return apiClient.get<RoleResponse[]>("/roles");
  },

  /** POST /api/roles */
  async createRole(name: string): Promise<RoleResponse> {
    return apiClient.post<RoleResponse>("/roles", { name });
  },

  /** GET /api/users/{id} — fetch a single user's full profile including permissions */
  async getUserById(userId: number): Promise<UserResponse> {
    return apiClient.get<UserResponse>(`/users/${userId}`);
  },

  /** GET /api/roles/{role}/permissions — fetch permission list for a specific role */
  async getRolePermissionsByRole(role: string): Promise<string[]> {
    return apiClient.get<string[]>(`/roles/${role}/permissions`);
  },

  /** GET /api/users/me */
  async getMe(): Promise<UserResponse> {
    return apiClient.get<UserResponse>("/users/me");
  },

  /** PUT /api/users/{id}/kyc */
  async updateUserKycStatus(userId: number, status: "PENDING" | "VERIFIED" | "REJECTED"): Promise<void> {
    return apiClient.put<void>(`/users/${userId}/kyc`, { status });
  },

  /** GET /api/users/kyc/stats */
  async getKycStats(): Promise<{ total: number; pending: number; approved: number; rejected: number }> {
    return apiClient.get<{ total: number; pending: number; approved: number; rejected: number }>("/users/kyc/stats");
  }
};
