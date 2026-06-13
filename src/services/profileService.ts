import { apiClient } from "./apiClient";
import type { UserProfileResponse, UserProfileRequest } from "../types/api";

export const profileService = {
  /** GET /api/profile */
  async getProfile(): Promise<UserProfileResponse> {
    return apiClient.get<UserProfileResponse>("/profile");
  },

  /** PUT /api/profile */
  async updateProfile(data: UserProfileRequest): Promise<UserProfileResponse> {
    return apiClient.put<UserProfileResponse>("/profile", data);
  },
};
