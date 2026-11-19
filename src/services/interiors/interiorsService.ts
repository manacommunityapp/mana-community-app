import { apiClient } from "../common/apiClient";
import type { ServiceOfferingResponse } from "../../types/api";
import type { CommerceCheckoutRequest, CommerceOrder } from "../../types/commerceCore";

const BASE = "/service-platform/interiors";

export interface InteriorAttachment {
  mediaId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface InteriorMaterialOrder {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  items: { title: string; quantity: number }[];
  createdAt: string;
}

export interface InteriorDesignerProfile {
  id: number;
  userId: number;
  userName: string;
  providerType: string;
  businessName: string;
  bio: string | null;
  profileImageUrl: string | null;
  verificationStatus: string;
  avgRating: number | null;
  totalJobsCompleted: number | null;
  serviceAreas: string | null;
  portfolio: string | null;
  offerings: ServiceOfferingResponse[];
}

export interface InteriorProjectBrief {
  propertyType: string;
  homeSize: string;
  locality: string;
  stylePreference?: string;
  focusAreas?: string[];
  budgetMin?: number;
  budgetMax?: number;
  projectScope: string;
  preferredStart?: string;
  designerIds?: number[];
}

export interface InteriorQuote {
  id: number;
  projectId: number;
  providerId: number;
  providerName: string;
  quotedAmount: number;
  estimatedDurationDays: number | null;
  materialAllowance: number | null;
  laborAmount: number | null;
  taxAmount: number | null;
  notes: string | null;
  status: string;
  createdAt: string;
  lineItems: InteriorQuoteLineItem[];
}

export interface InteriorQuoteLineItem {
  id: number;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  marginPercent: number;
  taxPercent: number;
  lineTotal: number;
  position: number;
}

export interface InteriorWorkOrder {
  id: number;
  status: string;
  providerName: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  notes: string | null;
  residentSignoff: boolean;
  providerSignoff: boolean;
  checklistItems: string | null;
  materialsUsed: string | null;
  beforePhotos: string | null;
  afterPhotos: string | null;
  invoiceId: number | null;
}

export interface InteriorReview {
  id: number;
  rating: number;
  comment: string | null;
  reviewerName: string;
  createdAt: string;
  qualityRating?: number | null;
  punctualityRating?: number | null;
  behaviorRating?: number | null;
}

export interface InteriorProject {
  id: number;
  title: string;
  status: string;
  propertyType: string;
  homeSize: string;
  locality: string;
  stylePreference: string | null;
  focusAreas: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  projectScope: string;
  preferredStart: string | null;
  createdAt: string;
  invitedDesignerIds: number[];
  quotes: InteriorQuote[];
  workOrder: InteriorWorkOrder | null;
  review?: InteriorReview | null;
  attachments: InteriorAttachment[];
  milestoneApprovals: string[];
  materialOrders: InteriorMaterialOrder[];
}

export interface SubmitInteriorQuote {
  quotedAmount: number;
  estimatedDurationDays: number;
  materialAllowance?: number;
  laborAmount?: number;
  taxAmount?: number;
  notes?: string;
  lineItems?: Array<Pick<InteriorQuoteLineItem, "category" | "description" | "quantity" | "unit" | "unitPrice" | "marginPercent" | "taxPercent">>;
}

export const interiorsService = {
  listDesigners(params?: { area?: string; query?: string }): Promise<InteriorDesignerProfile[]> {
    const search = new URLSearchParams();
    if (params?.area) search.set("area", params.area);
    if (params?.query) search.set("q", params.query);
    return apiClient.get<InteriorDesignerProfile[]>(`${BASE}/designers${search.size ? `?${search}` : ""}`);
  },

  getDesigner(id: number): Promise<InteriorDesignerProfile> {
    return apiClient.get<InteriorDesignerProfile>(`${BASE}/designers/${id}`);
  },

  getDesignerReviews(id: number): Promise<InteriorReview[]> {
    return apiClient.get<InteriorReview[]>(`${BASE}/designers/${id}/reviews`);
  },

  listSavedDesigners(): Promise<InteriorDesignerProfile[]> {
    return apiClient.get<InteriorDesignerProfile[]>(`${BASE}/designers/saved`);
  },

  saveDesigner(id: number): Promise<void> {
    return apiClient.post<void>(`${BASE}/designers/${id}/save`, {});
  },

  removeSavedDesigner(id: number): Promise<void> {
    return apiClient.delete<void>(`${BASE}/designers/${id}/save`);
  },

  createProject(data: InteriorProjectBrief): Promise<InteriorProject> {
    return apiClient.post<InteriorProject>(`${BASE}/projects`, data);
  },

  updateProjectAttachments(projectId: number, mediaIds: string[]): Promise<InteriorProject> {
    return apiClient.patch<InteriorProject>(`${BASE}/projects/${projectId}/attachments`, { mediaIds });
  },

  approveMilestone(projectId: number, milestoneId: string): Promise<InteriorProject> {
    return apiClient.post<InteriorProject>(`${BASE}/projects/${projectId}/milestones/${encodeURIComponent(milestoneId)}/approve`, {});
  },

  checkoutProjectMaterials(projectId: number, request: CommerceCheckoutRequest): Promise<CommerceOrder> {
    return apiClient.post<CommerceOrder>(`${BASE}/projects/${projectId}/materials/checkout`, request);
  },

  listMyProjects(): Promise<InteriorProject[]> {
    return apiClient.get<InteriorProject[]>(`${BASE}/projects/my`);
  },

  getProject(id: number): Promise<InteriorProject> {
    return apiClient.get<InteriorProject>(`${BASE}/projects/${id}`);
  },

  listDesignerLeads(): Promise<InteriorProject[]> {
    return apiClient.get<InteriorProject[]>(`${BASE}/providers/me/leads`);
  },

  submitQuote(projectId: number, data: SubmitInteriorQuote): Promise<InteriorQuote> {
    return apiClient.post<InteriorQuote>(`${BASE}/projects/${projectId}/quotes`, data);
  },

  acceptQuote(projectId: number, quoteId: number): Promise<InteriorProject> {
    return apiClient.post<InteriorProject>(`${BASE}/projects/${projectId}/quotes/${quoteId}/accept`, {});
  },

  reviewProject(projectId: number, data: { rating: number; qualityRating?: number; punctualityRating?: number; behaviorRating?: number; comment?: string }): Promise<InteriorReview> {
    return apiClient.post<InteriorReview>(`${BASE}/projects/${projectId}/review`, data);
  },
};
