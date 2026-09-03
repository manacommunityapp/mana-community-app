import { apiClient } from "./apiClient";
import type { UserProfileResponse, UserProfileRequest, UserResponse } from "../../types/api";

export const profileService = {
  /** GET /api/profile with fallback to /api/users/me */
  async getProfile(): Promise<UserProfileResponse> {
    try {
      const profile = await apiClient.get<UserProfileResponse>("/profile");
      if (profile && (profile.userId || profile.email || profile.fullName)) {
        return profile;
      }
    } catch {
      // Fallback to /users/me
    }

    // Direct database fetch through /users/me
    const me = await apiClient.get<UserResponse>("/users/me");
    let communityName = "";
    let communityType = "";
    let communityCode = "";

    if (me.communityId) {
      try {
        const comm = await apiClient.get<any>(`/communities/${me.communityId}`);
        if (comm) {
          communityName = comm.name || "";
          communityType = comm.type || "";
          communityCode = comm.inviteCode || comm.code || "";
        }
      } catch {
        // Silently continue
      }
    }

    return {
      userId: me.id,
      fullName: me.fullName || "",
      email: me.email || "",
      phone: me.phone || "",
      dob: me.dateOfBirth,
      gender: me.gender || "MALE",
      flatNo: me.flatNo || "",
      block: me.block || "",
      role: me.role || "MEMBER",
      kycStatus: me.kycStatus || "PENDING",
      communityName: communityName || undefined,
      communityType: communityType || undefined,
      communityCode: communityCode || undefined,
      profilePicUrl: me.profilePicUrl || (me as any).profilePic,
      skills: [],
      stats: {
        posts: 0,
        connections: 0,
        eventsAttended: 0,
        itemsSold: 0,
        jobsPosted: 0,
        sportsPlayed: 0,
      },
    };
  },

  /** PUT /api/profile with fallback to /api/users/{id} */
  async updateProfile(data: UserProfileRequest): Promise<UserProfileResponse> {
    try {
      const res = await apiClient.put<UserProfileResponse>("/profile", data);
      if (res && (res.userId || res.email)) {
        return res;
      }
    } catch {
      // Fallback to update user endpoint
    }

    const me = await apiClient.get<UserResponse>("/users/me");
    const updated = await apiClient.put<UserResponse>(`/users/${me.id}`, {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      dateOfBirth: data.dob,
      gender: data.gender,
      flatNo: data.flatNo,
      block: data.block,
      profilePicUrl: data.profilePicUrl,
      profilePic: data.profilePicUrl,
    });

    return {
      userId: updated.id,
      fullName: updated.fullName || data.fullName || "",
      email: updated.email || data.email || "",
      phone: updated.phone || data.phone || "",
      dob: updated.dateOfBirth || data.dob,
      gender: updated.gender || data.gender || "MALE",
      flatNo: updated.flatNo ?? data.flatNo,
      block: updated.block ?? data.block,
      role: updated.role || me.role,
      kycStatus: updated.kycStatus || me.kycStatus || "PENDING",
      profilePicUrl: updated.profilePicUrl || (updated as any).profilePic || data.profilePicUrl,
      bio: data.bio,
      skills: data.skills || [],
      stats: {
        posts: 0,
        connections: 0,
        eventsAttended: 0,
        itemsSold: 0,
        jobsPosted: 0,
        sportsPlayed: 0,
      },
    };
  },
};
