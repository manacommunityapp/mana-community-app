import { apiClient } from "./apiClient";
import type { UserProfileResponse, UserProfileRequest, UserResponse, UserActivityItem } from "../../types/api";

function parseSkills(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((s) => (typeof s === "string" ? s.trim() : (s?.name || s?.label || String(s)).trim()))
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((s) => String(s).trim()).filter(Boolean);
        }
      } catch {
        // Fallback to comma splitting
      }
    }
    return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export const profileService = {
  /** GET real-time user statistics from database count endpoints */
  async getProfileStats(userId?: number, communityId?: number): Promise<UserProfileResponse["stats"]> {
    try {
      const statsRes = await apiClient.get<UserProfileResponse["stats"]>("/profile/stats");
      if (statsRes && typeof statsRes.posts === "number") {
        return statsRes;
      }
    } catch {
      // Endpoint fallback to direct concurrent service counts
    }

    const [postsRes, networkRes, eventsRes, itemsRes, jobsRes, sportsRes] = await Promise.allSettled([
      // Posts count created by user
      userId
        ? apiClient.get<any>(`/posts?userId=${userId}&page=0&size=1`).catch(() => apiClient.get<any>("/posts/mine"))
        : apiClient.get<any>("/posts/mine").catch(() => null),
      // Network count (Community residents)
      communityId
        ? apiClient.get<any>(`/users?communityId=${communityId}&page=0&size=1`).catch(() => apiClient.get<any>(`/users/community/${communityId}`))
        : apiClient.get<any>("/users?page=0&size=1").catch(() => apiClient.get<any>("/community/directory")),
      // Events attended / registered
      apiClient.get<any>("/events/mine").catch(async () => {
        const dash = await apiClient.get<any>("/events/user-dashboard").catch(() => null);
        return dash?.myRegistrations || dash?.stats?.myRegistrationsCount;
      }),
      // Items listed on Marketplace by user
      apiClient.get<any>("/marketplace/listings/mine").catch(() => null),
      // Jobs posted by user
      apiClient.get<any>("/jobs/mine").catch(() => null),
      // Sports registered / played by user
      apiClient.get<any>("/sports/registrations/mine").catch(async () => {
        const sportsDash = await apiClient.get<any>("/sports/dashboard/my-registrations").catch(() => null);
        return sportsDash;
      }),
    ]);

    // Parse counts safely
    const postsVal = postsRes.status === "fulfilled" ? postsRes.value : null;
    const postsCount = postsVal
      ? (typeof postsVal.totalElements === "number"
          ? postsVal.totalElements
          : Array.isArray(postsVal)
          ? postsVal.length
          : Array.isArray(postsVal.content)
          ? postsVal.content.length
          : 0)
      : 0;

    const netVal = networkRes.status === "fulfilled" ? networkRes.value : null;
    const networkCount = netVal
      ? (typeof netVal.totalElements === "number"
          ? netVal.totalElements
          : Array.isArray(netVal)
          ? netVal.length
          : Array.isArray(netVal.content)
          ? netVal.content.length
          : 0)
      : 0;

    const evVal = eventsRes.status === "fulfilled" ? eventsRes.value : null;
    const eventsCount = evVal
      ? (typeof evVal === "number"
          ? evVal
          : Array.isArray(evVal)
          ? evVal.length
          : typeof evVal.totalElements === "number"
          ? evVal.totalElements
          : Array.isArray(evVal.content)
          ? evVal.content.length
          : 0)
      : 0;

    const itemVal = itemsRes.status === "fulfilled" ? itemsRes.value : null;
    const itemsCount = itemVal
      ? (Array.isArray(itemVal)
          ? itemVal.length
          : typeof itemVal.totalElements === "number"
          ? itemVal.totalElements
          : Array.isArray(itemVal.content)
          ? itemVal.content.length
          : 0)
      : 0;

    const jobVal = jobsRes.status === "fulfilled" ? jobsRes.value : null;
    const jobsCount = jobVal
      ? (Array.isArray(jobVal)
          ? jobVal.length
          : typeof jobVal.totalElements === "number"
          ? jobVal.totalElements
          : Array.isArray(jobVal.content)
          ? jobVal.content.length
          : 0)
      : 0;

    const sportsVal = sportsRes.status === "fulfilled" ? sportsRes.value : null;
    const sportsCount = sportsVal
      ? (Array.isArray(sportsVal)
          ? sportsVal.length
          : typeof sportsVal.totalElements === "number"
          ? sportsVal.totalElements
          : Array.isArray(sportsVal.content)
          ? sportsVal.content.length
          : 0)
      : 0;

    return {
      posts: postsCount,
      connections: networkCount,
      eventsAttended: eventsCount,
      itemsSold: itemsCount,
      jobsPosted: jobsCount,
      sportsPlayed: sportsCount,
    };
  },

  /** GET /api/profile with fallback to /api/users/me and real-time DB counts */
  async getProfile(): Promise<UserProfileResponse> {
    let resolvedProfile: Partial<UserProfileResponse> | null = null;

    try {
      const profile = await apiClient.get<UserProfileResponse>("/profile");
      if (profile && (profile.userId || profile.email || profile.fullName)) {
        resolvedProfile = profile;
      }
    } catch {
      // Fallback to /users/me
    }

    if (!resolvedProfile) {
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

      resolvedProfile = {
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
        bio: me.bio || (me as any).about || "",
        skills: parseSkills(me.skills ?? (me as any).skillList ?? (me as any).interests),
      };
    }

    // Use live stats from /profile or fetch real-time database counts
    const liveStats =
      resolvedProfile.stats && typeof resolvedProfile.stats.posts === "number"
        ? resolvedProfile.stats
        : await this.getProfileStats(
            resolvedProfile.userId,
            (resolvedProfile as any).communityId
          );

    return {
      userId: resolvedProfile.userId || 0,
      fullName: resolvedProfile.fullName || "",
      email: resolvedProfile.email || "",
      phone: resolvedProfile.phone || "",
      dob: resolvedProfile.dob,
      gender: resolvedProfile.gender || "MALE",
      flatNo: resolvedProfile.flatNo || "",
      block: resolvedProfile.block || "",
      role: resolvedProfile.role || "MEMBER",
      kycStatus: resolvedProfile.kycStatus || "PENDING",
      occupancyStatus: resolvedProfile.occupancyStatus,
      residentType: resolvedProfile.residentType,
      userType: resolvedProfile.userType,
      communityName: resolvedProfile.communityName,
      communityType: resolvedProfile.communityType,
      communityCode: resolvedProfile.communityCode,
      joinedAt: resolvedProfile.joinedAt,
      bio: resolvedProfile.bio || "",
      profilePicUrl: resolvedProfile.profilePicUrl,
      coverPicUrl: resolvedProfile.coverPicUrl,
      skills: parseSkills(resolvedProfile.skills ?? (resolvedProfile as any).skillList ?? (resolvedProfile as any).interests),
      stats: liveStats,
      achievements: resolvedProfile.achievements,
    };
  },

  /** PUT /api/profile with fallback to /api/users/{id} */
  async updateProfile(data: UserProfileRequest): Promise<UserProfileResponse> {
    try {
      const res = await apiClient.put<UserProfileResponse>("/profile", data);
      if (res && (res.userId || res.email)) {
        return {
          ...res,
          skills: parseSkills(res.skills ?? data.skills),
        };
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
      bio: data.bio,
      skills: data.skills,
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
      bio: updated.bio || data.bio || "",
      skills: parseSkills(updated.skills ?? data.skills),
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

  /** GET /api/profile/activities with graceful fallback */
  async getActivities(): Promise<UserActivityItem[]> {
    try {
      const res = await apiClient.get<UserActivityItem[]>("/profile/activities");
      if (Array.isArray(res) && res.length > 0) {
        return res;
      }
    } catch {
      // Fallback
    }
    return [
      {
        id: 1,
        type: "community",
        text: "Joined Mana Community",
        time: "Recently",
        iconType: "users",
        color: "indigo",
      },
      {
        id: 2,
        type: "post",
        text: "Active in Community Feed & Discussions",
        time: "Recently",
        iconType: "message",
        color: "indigo",
      },
    ];
  },
};
