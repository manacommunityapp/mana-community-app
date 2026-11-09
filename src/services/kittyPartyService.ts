import { apiClient, getToken } from "./common/apiClient";
import type {
  KittyPartyCircleSummary,
  KittyPartyMember,
  KittyPartyCycle,
  KittyPartyContribution,
  KittyPartyGameRoom,
  KittyPartyTicket,
  KittyPartyWinnerClaim,
  KittyPartyExpenseShare,
  SwapRotationRequest,
  ReplaceMemberRequest,
  SendRemindersResponse,
  KittyPartyAuditLog,
  KittyPartyDispute,
  CreateDisputeRequest,
  ResolveDisputeRequest,
  MonthlyStatementResponse,
  KittyPartyEvent,
  KittyPartyRsvp,
  KittyPartyAttendance,
  CreateKittyPartyEventRequest,
  KittyPartyRsvpRequest,
  KittyPartyAttendanceRequest,
  KittyPartyPost,
  KittyPartyPostComment,
  CreateKittyPartyPostRequest,
  CreateKittyPartyCommentRequest,
  KittyPartyCircleLeaderboardResponse,
  KittyPartyVendorPackage,
  InquireVendorPackageRequest,
} from "../types/kittyPartyTypes";

export interface CreateCirclePayload {
  circleName: string;
  description?: string;
  categoryCode: string;
  privacyType: string;
  approvalRequired?: boolean;
  maxMembers?: number;
  allowExternalMembers?: boolean;
  maxExternalMembers?: number;
}

export interface CreateCyclePayload {
  cycleName: string;
  contributionAmount: number;
  frequency?: string;
  memberCount: number;
  startDate: string;
  beneficiaryRotationUserIds?: number[];
}

export interface RecordContributionPayload {
  periodNumber: number;
  recordedAmount: number;
  externalRef?: string;
  receiptUrl?: string;
  notes?: string;
}

export interface CreateGameRoomPayload {
  roomName: string;
  maxPlayers?: number;
  allowGuestPlayers?: boolean;
}

export const kittyPartyService = {
  // Circles
  getMyCircles: async (): Promise<{ content: KittyPartyCircleSummary[] }> => {
    return apiClient.get<{ content: KittyPartyCircleSummary[] }>("/v1/kitty-circles/my");
  },

  discoverCircles: async (categoryCode?: string): Promise<{ content: KittyPartyCircleSummary[] }> => {
    const q = categoryCode ? `?categoryCode=${categoryCode}` : "";
    return apiClient.get<{ content: KittyPartyCircleSummary[] }>(`/v1/kitty-circles/discover${q}`);
  },

  getCircleDetails: async (circleId: number): Promise<KittyPartyCircleSummary> => {
    return apiClient.get<KittyPartyCircleSummary>(`/v1/kitty-circles/${circleId}`);
  },

  createCircle: async (payload: CreateCirclePayload): Promise<KittyPartyCircleSummary> => {
    return apiClient.post<KittyPartyCircleSummary>("/v1/kitty-circles", payload);
  },

  getCircleMembers: async (circleId: number): Promise<KittyPartyMember[]> => {
    return apiClient.get<KittyPartyMember[]>(`/v1/kitty-circles/${circleId}/members`);
  },

  requestToJoin: async (circleId: number, message?: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>(`/v1/kitty-circles/${circleId}/join`, { requestMessage: message });
  },

  approveJoinRequest: async (circleId: number, requestId: number): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>(`/v1/kitty-circles/${circleId}/join-requests/${requestId}/approve`, {});
  },

  inviteMember: async (
    circleId: number,
    invitedUserId?: number,
    invitedPhone?: string,
    isExternal?: boolean,
    externalSocietyName?: string
  ): Promise<{ success: boolean; inviteToken: string }> => {
    return apiClient.post<{ success: boolean; inviteToken: string }>(
      `/v1/kitty-circles/${circleId}/invitations`,
      { invitedUserId, invitedPhone, isExternal, externalSocietyName }
    );
  },

  acceptInvitation: async (token: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>(`/v1/kitty-circles/invitations/accept?token=${encodeURIComponent(token)}`, {});
  },

  // Savings Ledger
  createCycle: async (circleId: number, payload: CreateCyclePayload): Promise<KittyPartyCycle> => {
    return apiClient.post<KittyPartyCycle>(`/v1/kitty-ledger/circles/${circleId}/cycles`, payload);
  },

  getCycleSummary: async (cycleId: number): Promise<KittyPartyCycle> => {
    return apiClient.get<KittyPartyCycle>(`/v1/kitty-ledger/cycles/${cycleId}`);
  },

  getCircleActiveCycle: async (circleId: number): Promise<KittyPartyCycle> => {
    return apiClient.get<KittyPartyCycle>(`/v1/kitty-ledger/circles/${circleId}/active-cycle`);
  },

  getContributions: async (cycleId: number, periodNumber?: number): Promise<KittyPartyContribution[]> => {
    const q = periodNumber ? `?periodNumber=${periodNumber}` : "";
    return apiClient.get<KittyPartyContribution[]>(`/v1/kitty-ledger/cycles/${cycleId}/contributions${q}`);
  },

  recordContribution: async (cycleId: number, payload: RecordContributionPayload): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>(`/v1/kitty-ledger/cycles/${cycleId}/contributions`, payload);
  },

  verifyContribution: async (contributionId: number, status: 'VERIFIED' | 'DEFAULTED'): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>(`/v1/kitty-ledger/contributions/${contributionId}/verify`, { paymentStatus: status });
  },

  disbursePayout: async (cycleId: number, periodNumber: number, externalPayoutRef: string, payoutReceiptUrl?: string): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>(`/v1/kitty-ledger/cycles/${cycleId}/disburse`, {
      periodNumber,
      externalPayoutRef,
      payoutReceiptUrl,
    });
  },

  // Advanced Ledger & Workflow Features
  swapRotation: async (cycleId: number, payload: SwapRotationRequest): Promise<KittyPartyCycle> => {
    return apiClient.post<KittyPartyCycle>(`/v1/kitty-ledger/cycles/${cycleId}/swap-rotation`, payload);
  },

  sendReminders: async (cycleId: number, periodNumber?: number): Promise<SendRemindersResponse> => {
    return apiClient.post<SendRemindersResponse>(`/v1/kitty-ledger/cycles/${cycleId}/remind`, { periodNumber });
  },

  replaceMember: async (cycleId: number, payload: ReplaceMemberRequest): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>(`/v1/kitty-ledger/cycles/${cycleId}/replace-member`, payload);
  },

  getStatement: async (cycleId: number, periodNumber?: number): Promise<MonthlyStatementResponse> => {
    const q = periodNumber ? `?periodNumber=${periodNumber}` : "";
    return apiClient.get<MonthlyStatementResponse>(`/v1/kitty-ledger/cycles/${cycleId}/statement${q}`);
  },

  downloadStatementCsv: async (cycleId: number, periodNumber?: number): Promise<void> => {
    const q = periodNumber ? `&periodNumber=${periodNumber}` : "";
    const token = getToken();
    const url = `/api/v1/kitty-ledger/cycles/${cycleId}/statement?format=csv${q}`;
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to download statement CSV");
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `kitty_statement_cycle_${cycleId}_period_${periodNumber || "all"}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  },

  getAuditTrail: async (cycleId: number): Promise<KittyPartyAuditLog[]> => {
    return apiClient.get<KittyPartyAuditLog[]>(`/v1/kitty-ledger/cycles/${cycleId}/audit-trail`);
  },

  // Disputes & Complaints
  createDispute: async (circleId: number, payload: CreateDisputeRequest): Promise<KittyPartyDispute> => {
    return apiClient.post<KittyPartyDispute>(`/v1/kitty-ledger/circles/${circleId}/disputes`, payload);
  },

  getDisputes: async (circleId: number): Promise<KittyPartyDispute[]> => {
    return apiClient.get<KittyPartyDispute[]>(`/v1/kitty-ledger/circles/${circleId}/disputes`);
  },

  resolveDispute: async (circleId: number, disputeId: number, payload: ResolveDisputeRequest): Promise<KittyPartyDispute> => {
    return apiClient.post<KittyPartyDispute>(`/v1/kitty-ledger/circles/${circleId}/disputes/${disputeId}/resolve`, payload);
  },

  // Housie / Tambola Game Engine
  createGameRoom: async (circleId: number, payload: CreateGameRoomPayload): Promise<KittyPartyGameRoom> => {
    return apiClient.post<KittyPartyGameRoom>(`/v1/kitty-games/circles/${circleId}/rooms`, payload);
  },

  getRoomDetails: async (roomId: number): Promise<KittyPartyGameRoom> => {
    return apiClient.get<KittyPartyGameRoom>(`/v1/kitty-games/rooms/${roomId}`);
  },

  joinGameRoom: async (roomId: number): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>(`/v1/kitty-games/rooms/${roomId}/join`, {});
  },

  joinGameRoomByCode: async (roomCode: string): Promise<KittyPartyGameRoom> => {
    return apiClient.post<KittyPartyGameRoom>("/v1/kitty-games/rooms/join-by-code", { roomCode });
  },

  generateTicket: async (roomId: number): Promise<KittyPartyTicket> => {
    return apiClient.post<KittyPartyTicket>(`/v1/kitty-games/rooms/${roomId}/tickets`, {});
  },

  getMyTickets: async (roomId: number): Promise<KittyPartyTicket[]> => {
    return apiClient.get<KittyPartyTicket[]>(`/v1/kitty-games/rooms/${roomId}/my-tickets`);
  },

  startGame: async (roomId: number): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>(`/v1/kitty-games/rooms/${roomId}/start`, {});
  },

  callNextNumber: async (roomId: number): Promise<{ roomId: number; sequenceNum: number; calledNumber: number }> => {
    return apiClient.post<{ roomId: number; sequenceNum: number; calledNumber: number }>(`/v1/kitty-games/rooms/${roomId}/call-number`, {});
  },

  claimPrize: async (roomId: number, ticketId: number, claimType: string): Promise<KittyPartyWinnerClaim> => {
    return apiClient.post<KittyPartyWinnerClaim>(`/v1/kitty-games/rooms/${roomId}/claim`, { ticketId, claimType });
  },

  // Expenses & Split
  splitExpense: async (expenseId: number, participantUserIds: number[], customShareAmount?: number): Promise<KittyPartyExpenseShare[]> => {
    return apiClient.post<KittyPartyExpenseShare[]>("/v1/kitty-expenses/split", { expenseId, participantUserIds, customShareAmount });
  },

  getExpenseShares: async (expenseId: number): Promise<KittyPartyExpenseShare[]> => {
    return apiClient.get<KittyPartyExpenseShare[]>(`/v1/kitty-expenses/expenses/${expenseId}/shares`);
  },

  getMyPendingShares: async (): Promise<KittyPartyExpenseShare[]> => {
    return apiClient.get<KittyPartyExpenseShare[]>("/v1/kitty-expenses/my-pending");
  },

  settleShare: async (shareId: number, settlementRef: string): Promise<KittyPartyExpenseShare> => {
    return apiClient.post<KittyPartyExpenseShare>(`/v1/kitty-expenses/shares/${shareId}/settle`, { settlementRef });
  },

  // Events & RSVP Calendar
  getEvents: async (circleId: number): Promise<KittyPartyEvent[]> => {
    return apiClient.get<KittyPartyEvent[]>(`/v1/kitty-events/circles/${circleId}`);
  },

  getUpcomingEvents: async (circleId: number): Promise<KittyPartyEvent[]> => {
    return apiClient.get<KittyPartyEvent[]>(`/v1/kitty-events/circles/${circleId}/upcoming`);
  },

  getEventById: async (eventId: number): Promise<KittyPartyEvent> => {
    return apiClient.get<KittyPartyEvent>(`/v1/kitty-events/${eventId}`);
  },

  createEvent: async (circleId: number, payload: CreateKittyPartyEventRequest): Promise<KittyPartyEvent> => {
    return apiClient.post<KittyPartyEvent>(`/v1/kitty-events/circles/${circleId}`, payload);
  },

  submitRsvp: async (eventId: number, payload: KittyPartyRsvpRequest): Promise<KittyPartyRsvp> => {
    return apiClient.post<KittyPartyRsvp>(`/v1/kitty-events/${eventId}/rsvp`, payload);
  },

  getEventRsvps: async (eventId: number): Promise<KittyPartyRsvp[]> => {
    return apiClient.get<KittyPartyRsvp[]>(`/v1/kitty-events/${eventId}/rsvps`);
  },

  markAttendance: async (eventId: number, payload: KittyPartyAttendanceRequest): Promise<KittyPartyAttendance> => {
    return apiClient.post<KittyPartyAttendance>(`/v1/kitty-events/${eventId}/attendance`, payload);
  },

  getEventAttendance: async (eventId: number): Promise<KittyPartyAttendance[]> => {
    return apiClient.get<KittyPartyAttendance[]>(`/v1/kitty-events/${eventId}/attendance`);
  },

  // Feed: Posts & Comments
  getCirclePosts: async (circleId: number): Promise<KittyPartyPost[]> => {
    return apiClient.get<KittyPartyPost[]>(`/v1/kitty-posts/circles/${circleId}`);
  },

  createPost: async (circleId: number, payload: CreateKittyPartyPostRequest): Promise<KittyPartyPost> => {
    return apiClient.post<KittyPartyPost>(`/v1/kitty-posts/circles/${circleId}`, payload);
  },

  togglePinPost: async (postId: number): Promise<KittyPartyPost> => {
    return apiClient.post<KittyPartyPost>(`/v1/kitty-posts/${postId}/pin`, {});
  },

  deletePost: async (postId: number): Promise<void> => {
    return apiClient.delete<void>(`/v1/kitty-posts/${postId}`);
  },

  getPostComments: async (postId: number): Promise<KittyPartyPostComment[]> => {
    return apiClient.get<KittyPartyPostComment[]>(`/v1/kitty-posts/${postId}/comments`);
  },

  addComment: async (postId: number, payload: CreateKittyPartyCommentRequest): Promise<KittyPartyPostComment> => {
    return apiClient.post<KittyPartyPostComment>(`/v1/kitty-posts/${postId}/comments`, payload);
  },

  deleteComment: async (postId: number, commentId: number): Promise<void> => {
    return apiClient.delete<void>(`/v1/kitty-posts/${postId}/comments/${commentId}`);
  },

  // Phase 5: Housie Leaderboard & Trophies
  getLeaderboard: async (circleId: number): Promise<KittyPartyCircleLeaderboardResponse> => {
    return apiClient.get<KittyPartyCircleLeaderboardResponse>(`/v1/kitty-games/circles/${circleId}/leaderboard`);
  },

  // Phase 5: Curated Party Vendor Packages
  getVendorPackages: async (circleId: number, category?: string): Promise<KittyPartyVendorPackage[]> => {
    const q = category ? `?category=${encodeURIComponent(category)}` : '';
    return apiClient.get<KittyPartyVendorPackage[]>(`/v1/kitty-circles/${circleId}/vendor-packages${q}`);
  },

  inquireVendorPackage: async (payload: InquireVendorPackageRequest): Promise<{ success: boolean; message: string; contactPhone?: string; contactPerson?: string }> => {
    return apiClient.post<{ success: boolean; message: string; contactPhone?: string; contactPerson?: string }>('/v1/kitty-circles/vendor-packages/inquire', payload);
  },

  // Phase 5: Poll Voting
  votePoll: async (postId: number, optionId: number): Promise<KittyPartyPost> => {
    return apiClient.post<KittyPartyPost>(`/v1/kitty-posts/${postId}/vote`, { optionId });
  },
};

