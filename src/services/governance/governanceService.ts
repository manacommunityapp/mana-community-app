import { apiClient } from "../common/apiClient";

// ── Polls ──────────────────────────────────────────────────────────────────

export interface PollOption {
  id: string;
  label: string;
  votes?: number;
}

export interface Poll {
  id: number;
  communityId: number;
  title: string;
  description?: string;
  pollType: "OPINION" | "BINDING";
  options: PollOption[];
  startsAt: string;
  endsAt: string;
  status: "DRAFT" | "ACTIVE" | "CLOSED" | "CANCELLED";
  myVoteOptionId?: string;
  resultSummary?: PollResult;
  totalVotes?: number;
  quorumRequired?: number;
  linkedResolutionId?: number;
}

export interface PollResult {
  winner?: string;
  counts: Record<string, number>;
  totalVotes: number;
  quorumMet: boolean;
}

// ── Resolutions ────────────────────────────────────────────────────────────

export interface Resolution {
  id: number;
  communityId: number;
  title: string;
  description: string;
  resolutionType: "ORDINARY" | "SPECIAL" | "EMERGENCY";
  status: "PROPOSED" | "OPEN_FOR_VOTE" | "PASSED" | "REJECTED" | "WITHDRAWN";
  passedAt?: string;
  rejectedAt?: string;
  linkedPollId?: number;
  createdAt: string;
}

// ── NOC Requests ───────────────────────────────────────────────────────────

export type NocType =
  | "RENOVATION"
  | "PET"
  | "SUBLETTING"
  | "PARKING"
  | "EVENT"
  | "STRUCTURAL_CHANGE"
  | "OTHER";

export interface NocRequest {
  id: number;
  nocType: NocType;
  description: string;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  nocNumber?: string;
  validUntil?: string;
  rejectionReason?: string;
  createdAt: string;
  decidedAt?: string;
}

export type NocRequestInput = Pick<NocRequest, "nocType" | "description"> & { communityId?: number };

// ── Helpers ────────────────────────────────────────────────────────────────

function unwrapList(res: any): any[] {
  if (Array.isArray(res)) return res;
  const nested = res?.data ?? res?.content ?? res?.items;
  if (Array.isArray(nested)) return nested;
  return [];
}

function unwrapOne(res: any): any {
  return res?.data ?? res;
}

// ── Service ────────────────────────────────────────────────────────────────

export const governanceService = {
  // Polls
  async getActivePolls(communityId: number): Promise<Poll[]> {
    try {
      const res = await apiClient.get<any>(`/governance/polls?communityId=${communityId}&status=ACTIVE`);
      return unwrapList(res);
    } catch {
      return [];
    }
  },

  async getAllPolls(communityId: number): Promise<Poll[]> {
    try {
      const res = await apiClient.get<any>(`/governance/polls?communityId=${communityId}`);
      return unwrapList(res);
    } catch {
      return [];
    }
  },

  async castVote(pollId: number, optionId: string): Promise<void> {
    await apiClient.post<void>(`/governance/polls/${pollId}/vote`, { optionId });
  },

  async getPollResult(pollId: number): Promise<PollResult> {
    const res = await apiClient.get<any>(`/governance/polls/${pollId}/results`);
    return unwrapOne(res);
  },

  // Resolutions
  async getResolutions(communityId: number, status?: string): Promise<Resolution[]> {
    try {
      const params = new URLSearchParams({ communityId: String(communityId) });
      if (status) params.set("status", status);
      const res = await apiClient.get<any>(`/governance/resolutions?${params}`);
      return unwrapList(res);
    } catch {
      return [];
    }
  },

  // NOC Requests
  async submitNocRequest(data: NocRequestInput): Promise<NocRequest> {
    const res = await apiClient.post<any>("/governance/noc-requests", data);
    return unwrapOne(res);
  },

  async getMyNocRequests(): Promise<NocRequest[]> {
    try {
      const res = await apiClient.get<any>("/governance/noc-requests/my");
      return unwrapList(res);
    } catch {
      return [];
    }
  },
};
