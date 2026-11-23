import { apiClient } from "./common/apiClient";

export interface SocialGroup {
  id: number;
  name: string;
  groupType: string;
  description?: string;
  memberCount: number;
  isPrivate: boolean;
  coverColor?: string;
  isMember?: boolean;
  communityId?: number;
}

export interface GroupMessage {
  id: number;
  senderId: number;
  senderName: string;
  content: string;
  sentAt: string;
}

export interface GroupExpense {
  id: number;
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: number;
  createdAt: string;
}

export const GROUP_TYPES = [
  "HOBBY",
  "FITNESS",
  "PARENTS",
  "BOOKS",
  "FOOD",
  "TRAVEL",
  "INVESTMENT",
  "GENERAL",
] as const;

export const socialGroupService = {
  getGroups(communityId: number, type?: string): Promise<SocialGroup[]> {
    const params = type ? `?communityId=${communityId}&type=${type}` : `?communityId=${communityId}`;
    return apiClient.get<SocialGroup[]>(`/social-groups${params}`);
  },

  getMyGroups(): Promise<SocialGroup[]> {
    return apiClient.get<SocialGroup[]>("/social-groups/my");
  },

  createGroup(data: Partial<SocialGroup> & { communityId: number }): Promise<SocialGroup> {
    return apiClient.post<SocialGroup>("/social-groups", data);
  },

  join(groupId: number): Promise<void> {
    return apiClient.post<void>(`/social-groups/${groupId}/join`, {});
  },

  leave(groupId: number): Promise<void> {
    return apiClient.post<void>(`/social-groups/${groupId}/leave`, {});
  },

  getMessages(groupId: number, page: number): Promise<{ content: GroupMessage[]; hasNext: boolean }> {
    return apiClient.get<{ content: GroupMessage[]; hasNext: boolean }>(
      `/social-groups/${groupId}/messages?page=${page}&size=30`
    );
  },

  sendMessage(groupId: number, content: string): Promise<GroupMessage> {
    return apiClient.post<GroupMessage>(`/social-groups/${groupId}/messages`, { content });
  },

  getBalance(groupId: number): Promise<number> {
    return apiClient.get<number>(`/social-groups/${groupId}/balance`);
  },

  addExpense(groupId: number, amount: number, description: string): Promise<void> {
    return apiClient.post<void>(`/social-groups/${groupId}/expenses`, { amount, description });
  },
};
