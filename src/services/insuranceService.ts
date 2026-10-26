import { apiClient } from './common/apiClient';
import type {
  CatalogueItem,
  ClaimCaseView,
  ConsentPurpose,
  ConsentView,
  GroupEnquiryInput,
  GroupEnquiryView,
  InsuranceCategory,
  PolicyCreateInput,
  PolicyView,
  QuoteRequestView,
} from '../types/insurance';

export const insuranceService = {
  async catalogue(category: InsuranceCategory): Promise<CatalogueItem[]> {
    return apiClient.get<CatalogueItem[]>(`/insurance/catalogue?category=${encodeURIComponent(category)}`);
  },

  async grantConsent(purpose: ConsentPurpose, noticeVersion: string, partnerId?: number): Promise<ConsentView> {
    return apiClient.post<ConsentView>('/insurance/consents', { purpose, noticeVersion, partnerId });
  },

  async withdrawConsent(id: number): Promise<ConsentView> {
    return apiClient.post<ConsentView>(`/insurance/consents/${id}/withdraw`);
  },

  async consents(): Promise<ConsentView[]> {
    return apiClient.get<ConsentView[]>('/insurance/consents');
  },

  async submitQuote(args: {
    idempotencyKey: string;
    category: InsuranceCategory;
    partnerCode: string;
    consentId: number;
    fields: Record<string, unknown>;
  }): Promise<QuoteRequestView> {
    const { idempotencyKey, ...body } = args;
    return apiClient.post<QuoteRequestView>('/insurance/quote-requests', body, {
      'Idempotency-Key': idempotencyKey,
    });
  },

  async policies(): Promise<PolicyView[]> {
    return apiClient.get<PolicyView[]>('/insurance/policies');
  },

  async policy(id: number): Promise<PolicyView> {
    return apiClient.get<PolicyView>(`/insurance/policies/${id}`);
  },

  async createPolicy(input: PolicyCreateInput): Promise<PolicyView> {
    return apiClient.post<PolicyView>('/insurance/policies', input);
  },

  async deletePolicy(id: number): Promise<void> {
    await apiClient.delete(`/insurance/policies/${id}`);
  },

  async claimCases(): Promise<ClaimCaseView[]> {
    return apiClient.get<ClaimCaseView[]>('/insurance/claims-assistance');
  },

  async createClaimCase(input: { policyId?: number; claimType: string; description?: string }): Promise<ClaimCaseView> {
    return apiClient.post<ClaimCaseView>('/insurance/claims-assistance', input);
  },

  async attachInsurerReference(id: number, reference: string): Promise<ClaimCaseView> {
    return apiClient.post<ClaimCaseView>(`/insurance/claims-assistance/${id}/insurer-reference`, { reference });
  },

  async groupEnquiries(): Promise<GroupEnquiryView[]> {
    return apiClient.get<GroupEnquiryView[]>('/insurance/group-enquiries');
  },

  async createGroupEnquiry(input: GroupEnquiryInput): Promise<GroupEnquiryView> {
    return apiClient.post<GroupEnquiryView>('/insurance/group-enquiries', input);
  },
};