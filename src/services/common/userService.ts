import { apiClient } from "./apiClient";
import type { UserResponse, RolePermissionsMap, RoleResponse } from "../../types/api";

/** Payload for the admin create-user page (POST /api/users). */
export interface AdminCreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;     // yyyy-MM-dd (optional)
  gender?: string;          // Male / Female / Other / Prefer not to say (optional)
  govtIdType?: string;      // Aadhaar Card, PAN Card, Passport, etc.
  govtIdNumber?: string;    // ID document number
  profilePic?: string;      // URL or base64 data-URI
  employeeId?: string;
  isActive?: boolean;
  communityId?: number;
  inviteCode?: string;
  block?: string;
  tower?: string;
  flatNo?: string;
  residentType?: string;
  occupancyStatus?: string;
  password?: string;
  role?: string;            // admin/committee/resident/security/vendor/staff
  prefEmail?: boolean;
  prefSms?: boolean;
  prefWhatsapp?: boolean;
  prefPush?: boolean;
}

export const userService = {
  /** GET /api/users/search?communityId={id}&query={q} */
  async searchUsers(communityId: number, query: string): Promise<UserResponse[]> {
    return apiClient.get<UserResponse[]>(`/users/search?communityId=${communityId}&query=${encodeURIComponent(query)}`);
  },

  /** Global / community-aware user search with fallback */
  async searchUsersGlobal(query: string, communityId?: number): Promise<UserResponse[]> {
    const q = query.trim();
    if (!q) {
      return communityId ? this.getCommunityUsers(communityId) : this.getAllUsers();
    }
    try {
      if (communityId) {
        return await this.searchUsers(communityId, q);
      }
      const res = await apiClient.get<UserResponse[] | { content?: UserResponse[] }>(
        `/users/search?query=${encodeURIComponent(q)}`
      );
      if (Array.isArray(res)) return res;
      return res?.content ?? [];
    } catch {
      const all = communityId ? await this.getCommunityUsers(communityId) : await this.getAllUsers();
      const lower = q.toLowerCase();
      return all.filter((u) =>
        (u.fullName || "").toLowerCase().includes(lower) ||
        (u.email || "").toLowerCase().includes(lower) ||
        (u.phone || "").toLowerCase().includes(lower) ||
        (u.role || "").toLowerCase().includes(lower) ||
        String(u.id).includes(lower.replace("#", "")) ||
        (u.block || "").toLowerCase().includes(lower) ||
        (u.flatNo || "").toLowerCase().includes(lower)
      );
    }
  },

  /** GET /api/users/community/{id} */
  async getCommunityUsers(communityId: number): Promise<UserResponse[]> {
    return apiClient.get<UserResponse[]>(`/users/community/${communityId}`);
  },

  /** GET /api/users — unwraps the paginated response into a list.
   *  The backend returns a PagedResponse ({ content, totalElements, ... });
   *  loads with default size 50. */
  async getAllUsers(kycStatus?: string, page: number = 0, size: number = 50): Promise<UserResponse[]> {
    const query = kycStatus ? `&kycStatus=${kycStatus}` : "";
    const res = await apiClient.get<UserResponse[] | { content?: UserResponse[] }>(
      `/users?page=${page}&size=${size}${query}`
    );
    if (Array.isArray(res)) return res;
    return res?.content ?? [];
  },

  /** PUT /api/users/{id}/status */
  async toggleUserStatus(userId: number): Promise<void> {
    return apiClient.put<void>(`/users/${userId}/status`, {});
  },

  /** PUT /api/users/{id}/role
   *  Backend reads `roles` array first, falls back to splitting `role` string.
   *  Stores comma-joined in user.role, creates combined permissions, returns 200 UserResponse. */
  async updateUserRole(userId: number, role: string | string[]): Promise<UserResponse> {
    const roleValue = Array.isArray(role) ? role.join(", ") : role;
    const rolesArray = Array.isArray(role)
      ? role
      : role.split(",").map((s) => s.trim()).filter(Boolean);
    return apiClient.put<UserResponse>(`/users/${userId}/role`, { role: roleValue, roles: rolesArray });
  },

  /** POST /api/users — admin create-user; maps the create-user form fields. */
  async createUser(payload: AdminCreateUserPayload): Promise<UserResponse> {
    return apiClient.post<UserResponse>("/users", payload);
  },

  /** GET /api/roles/permissions */
  async getRolePermissions(): Promise<RolePermissionsMap> {
    return apiClient.get<RolePermissionsMap>("/roles/permissions");
  },

  /** GET /api/roles/permissions/template — fetch global parent template permissions */
  async getTemplateRolePermissions(): Promise<RolePermissionsMap> {
    return apiClient.get<RolePermissionsMap>("/roles/permissions/template");
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

  /** PUT /api/users/{id} — update user profile fields */
  async updateUser(userId: number, payload: Partial<UserResponse>): Promise<UserResponse> {
    return apiClient.put<UserResponse>(`/users/${userId}`, payload);
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
