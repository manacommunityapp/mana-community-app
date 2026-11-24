import { apiClient } from "./common/apiClient";

export interface SocialGroup {
  id: number;
  name: string;
  groupType: string;
  description?: string;
  memberCount: number;
  isPrivate: boolean;
  coverColor?: string;
  coverImageUrl?: string;
  isMember?: boolean;
  communityId?: number;
}

export interface GroupMessage {
  id: number;
  groupId?: number;
  senderId: number;
  senderName: string;
  senderAvatarUrl?: string;
  content: string;
  sentAt: string;
}

export interface GroupEvent {
  id: number;
  groupId: number;
  title: string;
  description?: string;
  eventDate?: string;
  scheduledAt?: string;
  location?: string;
  rsvpStatus?: "GOING" | "NOT_GOING" | "MAYBE";
}

export interface GroupExpense {
  id: number;
  groupId?: number;
  description: string;
  amount: number;
  paidBy: number | string;
  paidByName?: string;
  splitBetween?: number;
  myShare?: number;
  myBalance?: number;
  createdAt: string;
}

export const GROUP_TYPES = [
  "BOOK_CLUB",
  "HOBBY",
  "FITNESS",
  "PARENTS",
  "BOOKS",
  "FOOD",
  "TRAVEL",
  "PROFESSIONAL",
  "INVESTMENT",
  "INTEREST",
  "GENERAL",
] as const;

function unwrapList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === "object") {
    const obj = res as { content?: unknown; data?: unknown };
    if (Array.isArray(obj.content)) return obj.content as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
  }
  return [];
}

export const socialGroupService = {
  async getGroups(communityId: number, type?: string): Promise<SocialGroup[]> {
    const params = new URLSearchParams();
    if (communityId > 0) params.set("communityId", String(communityId));
    if (type) params.set("type", type);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await apiClient.get<unknown>(`/social/groups${qs}`);
    return unwrapList<SocialGroup>(res);
  },

  async getMyGroups(): Promise<SocialGroup[]> {
    const res = await apiClient.get<unknown>("/social/groups/my");
    return unwrapList<SocialGroup>(res);
  },

  async getGroup(groupId: number): Promise<SocialGroup> {
    return apiClient.get<SocialGroup>(`/social/groups/${groupId}`);
  },

  async createGroup(data: Partial<SocialGroup> & { communityId: number }): Promise<SocialGroup> {
    return apiClient.post<SocialGroup>("/social/groups", data);
  },

  async join(groupId: number): Promise<void> {
    await apiClient.post<unknown>(`/social/groups/${groupId}/join`, {});
  },

  async leave(groupId: number): Promise<void> {
    await apiClient.post<unknown>(`/social/groups/${groupId}/leave`, {});
  },

  async getMessages(groupId: number, page: number): Promise<{ content: GroupMessage[]; hasNext: boolean }> {
    const res = await apiClient.get<unknown>(
      `/social/groups/${groupId}/messages?page=${page}&size=30`
    );
    const content = unwrapList<GroupMessage>(res);
    const last = (res as { last?: boolean })?.last;
    return { content, hasNext: last === undefined ? false : !last };
  },

  async sendMessage(groupId: number, content: string): Promise<GroupMessage> {
    return apiClient.post<GroupMessage>(`/social/groups/${groupId}/messages`, { content });
  },

  async getEvents(groupId: number): Promise<GroupEvent[]> {
    const res = await apiClient.get<unknown>(`/social/groups/${groupId}/events`);
    return unwrapList<GroupEvent>(res);
  },

  async createEvent(
    groupId: number,
    data: { title: string; description?: string; eventDate: string; location?: string }
  ): Promise<GroupEvent> {
    return apiClient.post<GroupEvent>(`/social/groups/${groupId}/events`, data);
  },

  async rsvpEvent(
    groupId: number,
    eventId: number,
    status: "GOING" | "MAYBE" | "NOT_GOING"
  ): Promise<void> {
    await apiClient.post<unknown>(`/social/groups/${groupId}/events/${eventId}/rsvp`, { status });
  },

  async getExpenses(groupId: number): Promise<GroupExpense[]> {
    const res = await apiClient.get<unknown>(`/social/groups/${groupId}/expenses`);
    return unwrapList<GroupExpense>(res);
  },

  async getBalance(groupId: number): Promise<number> {
    const res = await apiClient.get<unknown>(`/social/groups/${groupId}/balance`);
    if (typeof res === "number" && !Number.isNaN(res)) return res;
    if (res && typeof res === "object" && "balance" in res) {
      const val = Number((res as { balance?: unknown }).balance);
      return Number.isNaN(val) ? 0 : val;
    }
    return 0;
  },

  async addExpense(groupId: number, amount: number, description: string): Promise<GroupExpense> {
    return apiClient.post<GroupExpense>(`/social/groups/${groupId}/expenses`, { amount, description });
  },

  async settleExpense(expenseId: number): Promise<void> {
    await apiClient.post<unknown>(`/social/expenses/${expenseId}/settle`, {});
  },
};
