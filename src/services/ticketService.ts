import { apiClient } from "./apiClient";

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
