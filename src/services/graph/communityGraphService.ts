import { apiClient } from "../common/apiClient";

export type RecommendationType = "PERSON" | "EVENT" | "SPORT" | "TRIP" | "SERVICE" | "FOOD";

export interface OmniSearchItem {
  id: string;
  domain: string;
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  avatarUrl?: string;
  deepLink?: string;
  relevanceScore?: number;
  tags?: string[];
}

export interface OmniSearchResponse {
  query: string;
  totalResults: number;
  domainCounts: Record<string, number>;
  people: OmniSearchItem[];
  events: OmniSearchItem[];
  sports: OmniSearchItem[];
  jobs: OmniSearchItem[];
  businesses: OmniSearchItem[];
  services: OmniSearchItem[];
  marketplace: OmniSearchItem[];
  food: OmniSearchItem[];
  documents: OmniSearchItem[];
  vendors: OmniSearchItem[];
}

export interface RecommendationCard {
  id: string;
  type: RecommendationType;
  title: string;
  subtitle: string;
  description: string;
  score: number;
  tags: string[];
  actionLabel: string;
  actionPath: string;
  imagePlaceholderColor: string;
}

export interface CommunityProfile {
  id: string;
  name: string;
  flatNumber: string;
  tower: string;
  skills: string[];
  professions: string[];
  interests: string[];
  sports: string[];
  visibility: "PUBLIC" | "NEIGHBORS" | "PRIVATE";
}

const SAMPLE_RECOMMENDATIONS: RecommendationCard[] = [];

const SAMPLE_PROFILES: CommunityProfile[] = [];

export const communityGraphService = {
  /** Fetch ML-powered recommendations from backend Graph service */
  async getDiscoverRecommendations(): Promise<RecommendationCard[]> {
    try {
      const res = await apiClient.get<any>("/graph/recommendations/feed");
      if (res && res.recommendations && Array.isArray(res.recommendations) && res.recommendations.length > 0) {
        return res.recommendations.map((item: any, idx: number) => ({
          id: item.id || `rec-${idx}`,
          type: (item.recommendationType || item.type || "PERSON") as RecommendationType,
          title: item.title || item.name || "Community Recommendation",
          subtitle: item.subtitle || item.category || "Recommendation",
          description: item.description || item.reason || "",
          score: item.score ? Math.round(item.score * 100) : 90,
          tags: item.tags || [item.category || "Community"],
          actionLabel: item.actionLabel || "Connect",
          actionPath: item.actionPath || "/discover",
          imagePlaceholderColor: item.imagePlaceholderColor || "#6366f1",
        }));
      }
    } catch (e) {
      console.warn("Backend /graph/recommendations/feed fallback to local recommendations:", e);
    }
    try {
      const disc = await apiClient.get<any>("/community-graph/discover");
      if (disc && disc.neighbors && Array.isArray(disc.neighbors)) {
        return disc.neighbors.map((n: any, idx: number) => ({
          id: String(n.id || `n-${idx}`),
          type: "PERSON" as RecommendationType,
          title: n.name || n.fullName || "Community Member",
          subtitle: `Tower ${n.tower || "A"} • Flat ${n.flatNumber || "—"}`,
          description: n.profession || n.bio || "Neighbour in your community",
          score: 85,
          tags: n.skills || ["Neighbour"],
          actionLabel: "Connect",
          actionPath: "/discover",
          imagePlaceholderColor: "#6366f1",
        }));
      }
    } catch {}
    return [];
  },

  getPersonalizedFeed(): RecommendationCard[] {
    return [...SAMPLE_RECOMMENDATIONS].sort((a, b) => b.score - a.score);
  },

  searchCommunity(query: string): CommunityProfile[] {
    const q = query.toLowerCase();
    return SAMPLE_PROFILES.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.skills.some(s => s.toLowerCase().includes(q)) ||
      p.professions.some(pr => pr.toLowerCase().includes(q)) ||
      p.interests.some(i => i.toLowerCase().includes(q)) ||
      p.sports.some(s => s.toLowerCase().includes(q))
    );
  },

  getProfiles(filter?: { skill?: string; sport?: string; tower?: string }): CommunityProfile[] {
    let profiles = SAMPLE_PROFILES.filter(p => p.visibility !== "PRIVATE");
    if (filter?.skill) profiles = profiles.filter(p => p.skills.some(s => s.toLowerCase().includes(filter.skill!.toLowerCase())));
    if (filter?.sport) profiles = profiles.filter(p => p.sports.some(s => s.toLowerCase().includes(filter.sport!.toLowerCase())));
    if (filter?.tower) profiles = profiles.filter(p => p.tower === filter.tower);
    return profiles;
  },

  updateVisibility(_settings: Partial<CommunityProfile>): void {
    // In production, this would call an API
    console.log("Visibility updated:", _settings);
  },

  // ──── BACKEND GRAPH & OMNISEARCH API METHODS ────

  /** Call backend Graph OmniSearch across all 10 domains */
  async omniSearchApi(query: string, limit = 6): Promise<OmniSearchResponse> {
    try {
      const res = await apiClient.get<OmniSearchResponse>(
        `/graph/omnisearch?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      if (res && res.domainCounts) {
        return res;
      }
    } catch (e) {
      console.warn("Graph OmniSearch API call failed, synthesizing local matches:", e);
    }

    // Fallback: Synthesize matches locally across sample data
    const q = query.toLowerCase();
    const matchedPeople: OmniSearchItem[] = SAMPLE_PROFILES.filter(p =>
      p.name.toLowerCase().includes(q) || p.skills.some(s => s.toLowerCase().includes(q))
    ).map(p => ({
      id: p.id,
      domain: "PEOPLE",
      title: p.name,
      subtitle: `${p.tower}-${p.flatNumber} • ${p.professions[0] || "Resident"}`,
      description: `Skills: ${p.skills.join(", ")}`,
      badge: "Resident",
      deepLink: `/community/directory?userId=${p.id}`,
      relevanceScore: 0.9,
      tags: p.skills,
    }));

    const counts: Record<string, number> = {
      PEOPLE: matchedPeople.length,
      EVENTS: 0,
      SPORTS: 0,
      JOBS: 0,
      BUSINESSES: 0,
      SERVICES: 0,
      MARKETPLACE: 0,
      FOOD: 0,
      DOCUMENTS: 0,
      VENDORS: 0,
    };

    return {
      query,
      totalResults: matchedPeople.length,
      domainCounts: counts,
      people: matchedPeople,
      events: [],
      sports: [],
      jobs: [],
      businesses: [],
      services: [],
      marketplace: [],
      food: [],
      documents: [],
      vendors: [],
    };
  },

  /** Get trending skills in community */
  async getTopSkillsApi(): Promise<any[]> {
    try {
      const res = await apiClient.get<any[]>("/graph/discover/skills");
      if (res && Array.isArray(res)) return res;
    } catch (e) {
      console.warn("Backend get top skills failed:", e);
    }
    return [];
  },

  /** Server-enforced discover profile search */
  async searchDiscoverProfilesApi(q?: string, tower?: string, skill?: string): Promise<CommunityProfile[]> {
    try {
      const params = new URLSearchParams();
      if (q) params.append("q", q);
      if (tower) params.append("tower", tower);
      if (skill) params.append("skill", skill);
      const res = await apiClient.get<any[]>(`/graph/discover/search?${params.toString()}`);
      if (res && Array.isArray(res)) {
        return res.map(p => ({
          id: p.userId || p.id,
          name: p.fullName || p.name,
          flatNumber: p.flatNumber || "",
          tower: p.tower || "",
          skills: p.skills || [],
          professions: p.profession ? [p.profession] : (p.professions || []),
          interests: p.interests || [],
          sports: p.sports || [],
          visibility: p.visibility || "PUBLIC",
        }));
      }
    } catch (e) {
      console.warn("Backend /graph/discover/search fallback:", e);
    }
    return this.getProfiles({ skill, tower });
  },

  /** Send connection request to a neighbor */
  async connectWithNeighbor(targetUserId: string, message?: string): Promise<void> {
    try {
      await apiClient.post(`/graph/relationships`, {
        targetId: targetUserId,
        relationshipType: 'CONNECTED_TO',
        notes: message,
      });
    } catch {
      try {
        await apiClient.post(`/community-graph/connect/${targetUserId}`, { message });
      } catch (e) {
        console.warn("connectWithNeighbor fallback handled:", e);
      }
    }
  },

  /** Server-enforced privacy visibility update */
  async updateVisibilityApi(settings: { visibility: "PUBLIC" | "NEIGHBORS" | "PRIVATE"; shareProfession?: boolean; shareSkills?: boolean; shareInterests?: boolean }): Promise<void> {
    try {
      await apiClient.put("/graph/privacy/visibility", settings);
    } catch (e) {
      console.warn("Backend /graph/privacy/visibility failed:", e);
    }
  },
};

