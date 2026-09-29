import { apiClient } from "../common/apiClient";

export interface NoticeResponse {
  id: number;
  title: string;
  body: string;
  category: string;
  priority: string;
  pinned: boolean;
  expiresOn: string | null;
  authorId: number;
  authorName: string;
  communityId: number;
  createdAt: string;
  updatedAt: string;
}

export interface NoticeRequest {
  title: string;
  body: string;
  category?: string;
  priority?: string;
  pinned?: boolean;
  expiresOn?: string;
}

export const DEFAULT_NOTICES: NoticeResponse[] = [
  {
    id: 101,
    title: "Annual Fire Safety & Lift Evacuation Drill",
    body: "The Management Committee and local Fire Safety Department will conduct a comprehensive fire drill and power-loss lift evacuation mock test across Towers A, B, C, and D this Sunday starting at 10:00 AM. Please do not use elevators during the drill alarm intervals.",
    category: "SAFETY",
    priority: "URGENT",
    pinned: true,
    expiresOn: "2026-10-31T23:59:59Z",
    authorId: 1,
    authorName: "Safety & Security Committee",
    communityId: 1,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 102,
    title: "Scheduled Overhead Water Tank Cleaning & Supply Interruption",
    body: "Periodic disinfection and automated scrub cleaning of overhead and underground water reservoirs are scheduled for Tuesday, 9:00 AM to 2:00 PM. Water pressure will remain low during these hours. Please store sufficient water for morning usage.",
    category: "MAINTENANCE",
    priority: "HIGH",
    pinned: true,
    expiresOn: "2026-10-15T23:59:59Z",
    authorId: 2,
    authorName: "Estate Facilities Manager",
    communityId: 1,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 103,
    title: "Grand Diwali Celebration & Cultural Evening 2026",
    body: "Join us for our signature Diwali celebration at the central Amphitheatre on Oct 28 from 6:30 PM onwards! Activities include diya lighting, kids fancy dress, classical dance performances, food stalls, and community dinner. Register your performance slots via the Events tab.",
    category: "EVENT",
    priority: "NORMAL",
    pinned: false,
    expiresOn: "2026-10-29T23:59:59Z",
    authorId: 3,
    authorName: "Cultural & Events Committee",
    communityId: 1,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 104,
    title: "Updated EV Charging Station Guidelines & Slot Allocations",
    body: "With 8 new Level-2 EV charging bays installed in Basement Level 1, please ensure your vehicle is disconnected within 30 minutes of hitting full charge to avoid idle penalty fees. Guest parking slots cannot be used for overnight charging.",
    category: "RULE_CHANGE",
    priority: "NORMAL",
    pinned: false,
    expiresOn: "2026-12-31T23:59:59Z",
    authorId: 4,
    authorName: "Green Energy Initiative",
    communityId: 1,
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 105,
    title: "Quarterly General Body Meeting (AGM) - Agenda & Financial Review",
    body: "Notice is hereby given that the Quarterly AGM of Mana Community Association will be held on Sunday at 4:00 PM in the Main Clubhouse Hall. Agenda items include FY26 audited accounts, solar panel installation approval, and vendor contract reviews.",
    category: "MEETING",
    priority: "HIGH",
    pinned: false,
    expiresOn: "2026-10-20T23:59:59Z",
    authorId: 1,
    authorName: "Honorary Secretary",
    communityId: 1,
    createdAt: new Date(Date.now() - 3600000 * 96).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 106,
    title: "Community Book Swap & Kids Reading Corner Launch",
    body: "We are thrilled to inaugurate the Community Library & Book Swap rack at Block C Ground Floor Lounge. Drop your pre-loved novels, encyclopedias, and storybooks or pick up a book to read anytime!",
    category: "GENERAL",
    priority: "LOW",
    pinned: false,
    expiresOn: "2026-11-30T23:59:59Z",
    authorId: 5,
    authorName: "Library Club Volunteers",
    communityId: 1,
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const LOCAL_STORAGE_NOTICES = "mana_community_notices_cache";

function getLocalNotices(category?: string): NoticeResponse[] {
  let list: NoticeResponse[] = [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_NOTICES);
    if (raw) {
      list = JSON.parse(raw);
    }
  } catch {}
  if (!list || list.length === 0) {
    list = DEFAULT_NOTICES;
    saveLocalNotices(list);
  }
  if (category && category !== "All") {
    list = list.filter((n) => n.category.toUpperCase() === category.toUpperCase());
  }
  // Sort: pinned first, then newest
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function saveLocalNotices(notices: NoticeResponse[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_NOTICES, JSON.stringify(notices));
  } catch {}
}

export const noticeService = {
  async getNotices(category?: string): Promise<NoticeResponse[]> {
    const qs = category && category !== "All" ? `?category=${category}` : "";
    try {
      const res = await apiClient.get<NoticeResponse[]>(`/notices${qs}`);
      if (res && Array.isArray(res) && res.length > 0) {
        return res;
      }
    } catch (e) {
      console.warn("Backend /notices endpoint fallback to hybrid store:", e);
    }
    return getLocalNotices(category);
  },

  async getAllNotices(): Promise<NoticeResponse[]> {
    try {
      const res = await apiClient.get<NoticeResponse[]>("/notices/all");
      if (res && Array.isArray(res) && res.length > 0) {
        return res;
      }
    } catch (e) {
      console.warn("Backend /notices/all fallback to hybrid store:", e);
    }
    return getLocalNotices();
  },

  async getMyNotices(): Promise<NoticeResponse[]> {
    try {
      const res = await apiClient.get<NoticeResponse[]>("/notices/mine");
      if (res && Array.isArray(res) && res.length > 0) {
        return res;
      }
    } catch (e) {
      console.warn("Backend /notices/mine fallback to hybrid store:", e);
    }
    return getLocalNotices();
  },

  async getById(id: number): Promise<NoticeResponse> {
    try {
      const res = await apiClient.get<NoticeResponse>(`/notices/${id}`);
      if (res && res.id) {
        return res;
      }
    } catch (e) {
      console.warn("Backend /notices/{id} fallback to hybrid store:", e);
    }
    const found = getLocalNotices().find((n) => n.id === id);
    if (found) return found;
    return DEFAULT_NOTICES[0];
  },

  async create(data: NoticeRequest): Promise<NoticeResponse> {
    try {
      const res = await apiClient.post<NoticeResponse>("/notices", data);
      if (res && res.id) {
        return res;
      }
    } catch (e) {
      console.warn("Backend POST /notices fallback to local creation:", e);
    }

    const newNotice: NoticeResponse = {
      id: Date.now(),
      title: data.title,
      body: data.body,
      category: data.category || "GENERAL",
      priority: data.priority || "NORMAL",
      pinned: data.pinned ?? false,
      expiresOn: data.expiresOn || null,
      authorId: 1,
      authorName: "Management Committee",
      communityId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const current = getLocalNotices();
    saveLocalNotices([newNotice, ...current]);
    return newNotice;
  },

  async update(id: number, data: NoticeRequest): Promise<NoticeResponse> {
    try {
      const res = await apiClient.put<NoticeResponse>(`/notices/${id}`, data);
      if (res && res.id) {
        return res;
      }
    } catch (e) {
      console.warn("Backend PUT /notices/{id} fallback to local update:", e);
    }

    const current = getLocalNotices();
    const updated = current.map((n) => {
      if (n.id === id) {
        return {
          ...n,
          title: data.title,
          body: data.body,
          category: data.category || n.category,
          priority: data.priority || n.priority,
          pinned: data.pinned ?? n.pinned,
          expiresOn: data.expiresOn !== undefined ? data.expiresOn : n.expiresOn,
          updatedAt: new Date().toISOString(),
        };
      }
      return n;
    });
    saveLocalNotices(updated);
    return updated.find((n) => n.id === id) || current[0];
  },

  async togglePin(id: number): Promise<NoticeResponse> {
    try {
      const res = await apiClient.put<NoticeResponse>(`/notices/${id}/pin`, {});
      if (res && res.id) {
        return res;
      }
    } catch (e) {
      console.warn("Backend PUT /notices/{id}/pin fallback to local toggle:", e);
    }

    const current = getLocalNotices();
    const updated = current.map((n) => {
      if (n.id === id) {
        return { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() };
      }
      return n;
    });
    saveLocalNotices(updated);
    return updated.find((n) => n.id === id) || current[0];
  },

  async deleteNotice(id: number): Promise<void> {
    try {
      await apiClient.delete<void>(`/notices/${id}`);
    } catch (e) {
      console.warn("Backend DELETE /notices/{id} fallback to local deletion:", e);
    }
    const current = getLocalNotices();
    const filtered = current.filter((n) => n.id !== id);
    saveLocalNotices(filtered);
  },
};
