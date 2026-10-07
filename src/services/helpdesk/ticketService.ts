import { apiClient } from "../common/apiClient";

export interface CommentDto {
  id: number;
  message: string;
  authorId: number;
  authorName: string;
  createdAt: string;
}

export interface TicketResponse {
  id: number;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  adminRemarks: string | null;
  raisedById: number;
  raisedByName: string;
  assignedToId: number | null;
  assignedToName: string | null;
  communityId: number;
  slaDueAt?: string | null;
  slaStatus?: "ON_TRACK" | "AT_RISK" | "BREACHED" | null;
  urgencyScore?: number;
  aiClassificationJson?: string | null;
  resolutionNotes?: string | null;
  resolutionProofUrl?: string | null;
  resolutionCode?: string | null;
  reopenCount?: number;
  isEscalated?: boolean;
  escalationLevel?: number;
  satisfactionRating?: number | null;
  feedbackRemarks?: string | null;
  residentSignoff?: boolean;
  residentSignoffAt?: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  comments: CommentDto[];
}

export interface TicketRequest {
  subject: string;
  description?: string;
  category?: string;
  priority?: string;
}

export interface AiClassificationRequest {
  subject: string;
  description: string;
  communityId?: number;
}

export interface AiClassificationResult {
  category: string;
  priority: string;
  urgencyScore: number;
  requiredSkills: string[];
  rootCauseHypothesis: string;
  confidence: number;
  emergencyHazard: boolean;
}

export interface TicketResolutionRequest {
  notes: string;
  proofAttachmentUrl?: string;
  resolutionCode?: string;
  remarks?: string;
}

export interface TicketFeedbackRequest {
  satisfactionRating: number;
  feedbackRemarks?: string;
  signOffConfirmed: boolean;
}

export interface TicketReopenRequest {
  reason: string;
  remarks?: string;
}

export const ticketService = {
  async getTickets(status?: string): Promise<TicketResponse[]> {
    const qs = status && status !== "All" ? `?status=${status}` : "";
    return apiClient.get<TicketResponse[]>(`/helpdesk${qs}`);
  },

  async getOpenTickets(): Promise<TicketResponse[]> {
    return apiClient.get<TicketResponse[]>("/helpdesk/open");
  },

  async getMyTickets(): Promise<TicketResponse[]> {
    return apiClient.get<TicketResponse[]>("/helpdesk/mine");
  },

  async getById(id: number): Promise<TicketResponse> {
    return apiClient.get<TicketResponse>(`/helpdesk/${id}`);
  },

  async create(data: TicketRequest): Promise<TicketResponse> {
    return apiClient.post<TicketResponse>("/helpdesk", data);
  },

  async aiClassify(data: AiClassificationRequest): Promise<AiClassificationResult> {
    return apiClient.post<AiClassificationResult>("/helpdesk/tickets/ai-classify", data);
  },

  async resolveTicket(id: number, data: TicketResolutionRequest): Promise<TicketResponse> {
    return apiClient.post<TicketResponse>(`/helpdesk/tickets/${id}/resolve`, data);
  },

  async reopenTicket(id: number, data: TicketReopenRequest): Promise<TicketResponse> {
    return apiClient.post<TicketResponse>(`/helpdesk/tickets/${id}/reopen`, data);
  },

  async submitFeedback(id: number, data: TicketFeedbackRequest): Promise<TicketResponse> {
    return apiClient.post<TicketResponse>(`/helpdesk/tickets/${id}/feedback`, data);
  },

  async updateStatus(id: number, status: string, remarks?: string): Promise<TicketResponse> {
    return apiClient.put<TicketResponse>(`/helpdesk/${id}/status`, { status, remarks });
  },

  async assign(id: number, assigneeId: number): Promise<TicketResponse> {
    return apiClient.put<TicketResponse>(`/helpdesk/${id}/assign`, { assigneeId });
  },

  async addComment(id: number, message: string): Promise<TicketResponse> {
    return apiClient.post<TicketResponse>(`/helpdesk/${id}/comments`, { message });
  },
};
