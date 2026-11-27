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

export function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  let b = ((base % mod) + mod) % mod;
  let e = exp;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % mod;
    e >>= 1n;
    b = (b * b) % mod;
  }
  return result;
}

export function modInverse(a: bigint, m: bigint): bigint {
  let [oldR, r] = [((a % m) + m) % m, m];
  let [oldS, s] = [1n, 0n];
  while (r !== 0n) {
    const q = oldR / r;
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
  }
  if (oldR !== 1n) throw new Error("Blinding factor is not coprime to RSA modulus");
  return ((oldS % m) + m) % m;
}

export function blindMessageHex(
  messageHex: string,
  blindingFactorHex: string,
  publicExponentHex: string,
  modulusHex: string
): string {
  const m = BigInt("0x" + messageHex);
  const r = BigInt("0x" + blindingFactorHex);
  const e = BigInt("0x" + publicExponentHex);
  const n = BigInt("0x" + modulusHex);
  return ((m * modPow(r, e, n)) % n).toString(16);
}

export function unblindSignatureHex(
  blindSignatureHex: string,
  blindingFactorHex: string,
  modulusHex: string
): string {
  const sPrime = BigInt("0x" + blindSignatureHex);
  const r = BigInt("0x" + blindingFactorHex);
  const n = BigInt("0x" + modulusHex);
  return ((sPrime * modInverse(r, n)) % n).toString(16);
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

  // Tamper-Evident Secret Ballot
  async getElectionPublicKey(electionId: number): Promise<{ electionId: number; modulusHex: string; publicExponentHex: string }> {
    const res = await apiClient.get<any>(`/governance/elections/${electionId}/public-key`);
    return unwrapOne(res);
  },

  async requestBlindToken(electionId: number, flatId: number, blindedMessageHex: string): Promise<any> {
    const res = await apiClient.post<any>(`/governance/elections/${electionId}/blind-token`, {
      flatId,
      blindedMessageHex,
    });
    return unwrapOne(res);
  },

  async castSecretBallot(
    electionId: number,
    nominationId: number,
    tokenHex: string,
    unblindedSignatureHex: string
  ): Promise<{ accepted: boolean; receiptCode: string; ballotHash: string }> {
    const res = await apiClient.post<any>(`/governance/elections/${electionId}/secret-ballot`, {
      nominationId,
      tokenHex,
      unblindedSignatureHex,
    });
    return unwrapOne(res);
  },

  async auditElectionBallots(electionId: number, receiptCode?: string): Promise<any> {
    const qs = receiptCode ? `?receiptCode=${encodeURIComponent(receiptCode)}` : "";
    const res = await apiClient.get<any>(`/governance/elections/${electionId}/audit${qs}`);
    return unwrapOne(res);
  },

  // Live Hybrid AGM Quorum & Proxy Tracking
  async registerAgmProxy(meetingId: number, flatId: number, proxyHolderUserId: number): Promise<any> {
    return apiClient.post<any>(`/governance/meetings/${meetingId}/register-proxy`, {
      flatId,
      proxyHolderUserId,
    });
  },

  async checkInAgm(
    meetingId: number,
    flatId: number,
    attendeeRole: "OWNER" | "CO_OWNER" | "PROXY" = "OWNER",
    attendanceMode: "IN_PERSON_QR" | "ONLINE_WS" = "IN_PERSON_QR"
  ): Promise<any> {
    return apiClient.post<any>(`/governance/meetings/${meetingId}/checkin`, {
      flatId,
      attendeeRole,
      attendanceMode,
    });
  },

  async revokeAgmProxy(meetingId: number, flatId: number): Promise<any> {
    return apiClient.post<any>(`/governance/meetings/${meetingId}/revoke-proxy`, { flatId });
  },

  async getLiveAgmQuorum(meetingId: number): Promise<any> {
    return apiClient.get<any>(`/governance/meetings/${meetingId}/quorum`);
  },

  async openResolutionVoting(resolutionId: number, meetingId: number): Promise<any> {
    return apiClient.post<any>(`/governance/resolutions/${resolutionId}/open-voting`, { meetingId });
  },
};
