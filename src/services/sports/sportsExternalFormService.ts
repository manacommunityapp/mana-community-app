import { apiClient } from "../common/apiClient";

export interface FieldMapping {
  id?: number;
  manaFieldKey: string;
  externalQuestionId: string;
  questionTitle: string;
  mappingType: "DIRECT" | "CATEGORY_LOOKUP" | "FORMAT_LOOKUP" | "CUSTOM";
  mappingRulesJson?: string | null;
  required?: boolean;
}

export interface SyncState {
  syncMode?: "POLLING" | "WEBHOOK" | "PUBSUB";
  lastSyncTimestamp?: string;
  totalResponsesPolled: number;
  totalImported: number;
  totalQuarantined: number;
  totalRejected: number;
  syncStatus: "IDLE" | "SYNCING" | "ERROR";
  syncError?: string | null;
}

export interface ExternalFormConfig {
  id: number;
  eventId: number;
  eventName: string;
  communityId?: number;
  provider: "GOOGLE_FORMS" | "MANA_FORM";
  externalFormId: string;
  responderUrl: string;
  editUrl?: string | null;
  title: string;
  description?: string | null;
  webhookToken: string;
  webhookUrl: string;
  status: "ACTIVE" | "PAUSED" | "CLOSED";
  approvalMode: "AUTO" | "MANUAL" | "TOURNAMENT_DEFAULT";
  fieldMappings: FieldMapping[];
  syncState?: SyncState | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ExternalResponseItem {
  id: number;
  formId: number;
  externalResponseId: string;
  respondentEmail?: string | null;
  submittedAt: string;
  rawPayloadJson: string;
  status: "RECEIVED" | "PROCESSING" | "IMPORTED" | "NEEDS_REVIEW" | "REJECTED";
  reviewReason?: string | null;
  reviewNotes?: string | null;
  validationErrors?: string | null;
  linkedRegistrationId?: number | null;
  linkedPlayerName?: string | null;
  resolvedUserId?: number | null;
  resolvedUserName?: string | null;
  reviewedByUserName?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface CreateExternalFormPayload {
  eventId: number;
  provider?: "GOOGLE_FORMS" | "MANA_FORM";
  title?: string;
  description?: string;
  approvalMode?: "TOURNAMENT_DEFAULT" | "AUTO" | "MANUAL";
  fieldKeys?: string[];
  googleAccessToken?: string;
}

export interface SyncResult {
  formId: number;
  polledCount: number;
  importedCount: number;
  quarantinedCount: number;
  rejectedCount: number;
  message: string;
}

export interface ResolveReviewPayload {
  action: "APPROVE" | "REJECT" | "LINK_USER" | "OVERRIDE";
  resolvedUserId?: number;
  overrideCategoryId?: number;
  overrideMatchType?: string;
  reviewNotes?: string;
}

export const sportsExternalFormService = {
  /**
   * Create an external registration form (Google Forms or Mana Public Form) for an event
   */
  async createForm(eventId: number, payload: Partial<CreateExternalFormPayload>): Promise<ExternalFormConfig> {
    return apiClient.post<ExternalFormConfig>(`/sports/events/${eventId}/external-forms`, {
      eventId,
      provider: payload.provider || "GOOGLE_FORMS",
      title: payload.title,
      description: payload.description,
      approvalMode: payload.approvalMode || "TOURNAMENT_DEFAULT",
      fieldKeys: payload.fieldKeys,
      googleAccessToken: payload.googleAccessToken,
    });
  },

  /**
   * Get all external forms associated with an event
   */
  async getFormsForEvent(eventId: number): Promise<ExternalFormConfig[]> {
    return apiClient.get<ExternalFormConfig[]>(`/sports/events/${eventId}/external-forms`);
  },

  /**
   * Get single external form details
   */
  async getForm(formId: number): Promise<ExternalFormConfig> {
    return apiClient.get<ExternalFormConfig>(`/sports/external-forms/${formId}`);
  },

  /**
   * Update question field mappings
   */
  async updateMappings(formId: number, mappings: FieldMapping[]): Promise<ExternalFormConfig> {
    return apiClient.put<ExternalFormConfig>(`/sports/external-forms/${formId}/mappings`, mappings);
  },

  /**
   * Trigger manual sync / fetch of form responses
   */
  async syncForm(formId: number): Promise<SyncResult> {
    return apiClient.post<SyncResult>(`/sports/external-forms/${formId}/sync`, {});
  },

  /**
   * Get responses for a specific external form
   */
  async getResponses(formId: number, status?: string): Promise<ExternalResponseItem[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return apiClient.get<ExternalResponseItem[]>(`/sports/external-forms/${formId}/responses${query}`);
  },

  /**
   * Get review queue for a tournament event
   */
  async getReviewQueue(eventId: number): Promise<ExternalResponseItem[]> {
    return apiClient.get<ExternalResponseItem[]>(`/sports/events/${eventId}/external-forms/review`);
  },

  /**
   * Resolve an entry in the review queue
   */
  async resolveReview(responseId: number, payload: ResolveReviewPayload): Promise<ExternalResponseItem> {
    return apiClient.post<ExternalResponseItem>(`/sports/external-forms/responses/${responseId}/resolve`, payload);
  },

  /**
   * Get generated Google Apps Script code for copy-pasting into Google Forms
   */
  async getAppsScript(formId: number): Promise<{ script: string }> {
    return apiClient.get<{ script: string }>(`/sports/external-forms/${formId}/apps-script`);
  },

  /**
   * Public form metadata lookup
   */
  async getPublicForm(token: string): Promise<ExternalFormConfig> {
    return apiClient.get<ExternalFormConfig>(`/sports/external-forms/public/${token}`);
  },

  /**
   * Public form submission
   */
  async submitPublicForm(token: string, answers: Record<string, any>): Promise<any> {
    return apiClient.post<any>(`/sports/external-forms/public/${token}/submit`, answers);
  },
};
