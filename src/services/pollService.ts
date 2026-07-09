import { apiClient } from "./apiClient";

export interface PollOptionDto {
  id: number;
  text: string;
  sortOrder: number;
  voteCount: number;
  selected: boolean;
}

export interface PollResponse {
  id: number;
  question: string;
  description: string | null;
  closesOn: string | null;
  allowMultiple: boolean;
  anonymous: boolean;
  createdById: number;
  createdByName: string;
  communityId: number;
  createdAt: string;
  closed: boolean;
  hasVoted: boolean;
  totalVotes: number;
  options: PollOptionDto[];
}

export interface PollRequest {
  question: string;
  description?: string;
  closesOn?: string;
  allowMultiple?: boolean;
  anonymous?: boolean;
  options: string[];
}

export const pollService = {
  async getActivePolls(): Promise<PollResponse[]> {
    return apiClient.get<PollResponse[]>("/polls");
  },

  async getAllPolls(): Promise<PollResponse[]> {
    return apiClient.get<PollResponse[]>("/polls/all");
  },

  async getMyPolls(): Promise<PollResponse[]> {
    return apiClient.get<PollResponse[]>("/polls/mine");
  },

  async getById(id: number): Promise<PollResponse> {
    return apiClient.get<PollResponse>(`/polls/${id}`);
  },

  async create(data: PollRequest): Promise<PollResponse> {
    return apiClient.post<PollResponse>("/polls", data);
  },

  async vote(id: number, optionIds: number[]): Promise<PollResponse> {
    return apiClient.post<PollResponse>(`/polls/${id}/vote`, { optionIds });
  },

  async deletePoll(id: number): Promise<void> {
    await apiClient.delete<void>(`/polls/${id}`);
  },
};
