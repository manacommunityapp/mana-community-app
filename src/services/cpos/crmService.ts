import { apiClient } from "../common/apiClient";
import type { Stage, LeadSource, ActivityType, Lead, Activity, LeadTag } from "../../app/components/cpos/crm/crmData";

// ── Backend DTOs (mirror Java backend) ────────────────────────────────────

export interface CrmActivityDto {
  id: number;
  activityType: string;
  note: string;
  createdBy: string;
  callOutcome: string | null;
  callDurationMin: number | null;
  createdAt: string;
}

export interface LogCallRequest {
  outcome: string;
  durationMin?: number | null;
  notes?: string;
  followUpAt?: string | null;
}

export interface CrmLeadDto {
  id: number;
  leadName: string;
  email: string | null;
  phone: string | null;
  source: string;
  stage: string;
  leadType: string;
  budgetLakhs: number;
  budgetDisplay: string | null;
  assignedTo: string | null;
  daysInStage: number;
  daysTotal: number;
  aiScore: number;
  followUpAt: string | null;
  followUpNote: string | null;
  activities?: CrmActivityDto[];
  tags?: { id: number; name: string; color: string }[];
  createdAt: string;
  updatedAt: string;
  approvalStatus?: string | null;
  approvalReason?: string | null;
  approvalComment?: string | null;
}

export interface CrmLeadRequest {
  leadName: string;
  email?: string;
  phone?: string;
  source?: string;
  leadType?: string;
  budgetLakhs?: number;
  budgetDisplay?: string;
  assignedTo?: string;
}

export interface FunnelStageDto {
  stage: string;
  count: number;
  pct: number;
}

export interface AgentStatDto {
  agent: string;
  totalLeads: number;
  closed: number;
  inNegotiation: number;
  avgScore: number;
  pipelineLakhs: number;
}

export interface LeaderboardEntryDto {
  rank: number;
  agent: string;
  closedLeads: number;
  revenueLakhs: number;
  totalLeads: number;
  score: number;
}

export interface SalesTargetDto {
  id: number;
  agentName: string;
  periodMonth: number;
  periodYear: number;
  targetLeadsClosed: number;
  targetRevenueLakhs: number;
  actualLeadsClosed: number;
  actualRevenueLakhs: number;
  closedPct: number;
  revenuePct: number;
}

export interface EmailCampaignDto {
  id: number;
  subject: string;
  bodyHtml: string;
  filterStage: string | null;
  filterSource: string | null;
  sentCount: number;
  createdBy: string;
  sentAt: string;
}

export interface ImportResultDto {
  created: number;
  duplicates: number;
  errors: number;
  errorMessages: string[];
}

export interface CallOutcomeDto { outcome: string; count: number; }
export interface HourlyActivityDto { hour: number; count: number; }
export interface StageForecastDto { stage: string; leads: number; probabilityPct: number; weightedRevenueLakhs: number; }
export interface ForecastDto { weightedRevenueLakhs: number; totalPipelineLeads: number; byStage: StageForecastDto[]; }

export interface CrmAnalyticsDto {
  totalLeads: number;
  overallConversionPct: number;
  avgDaysTotal: number;
  hotLeads: number;
  funnel: FunnelStageDto[];
  sourceBreakdown: Record<string, number>;
  stageVelocity: Record<string, number>;
  agentStats: AgentStatDto[];
  leaderboard?: LeaderboardEntryDto[];
  callOutcomes?: CallOutcomeDto[];
  hourlyActivity?: HourlyActivityDto[];
  forecast?: ForecastDto;
}

export interface DripStepDto { id?: number; delayDays: number; subject: string; bodyHtml: string; }
export interface DripSequenceDto { id?: number; name: string; triggerStage: string; active: boolean; steps: DripStepDto[]; }

export interface BrokerDto {
  id: number;
  brokerName: string;
  firmName: string;
  phone: string | null;
  email: string | null;
  commissionRate: number;
  totalLeads: number;
  closedLeads: number;
  totalCommissionLakhs: number;
}

export interface BrokerCommissionDto {
  id: number;
  brokerId: number;
  brokerName: string;
  firmName: string;
  leadId: number;
  leadName: string;
  budgetLakhs: number;
  leadStage: string;
  commissionRate: number;
  commissionLakhs: number;
  status: string;
  createdAt: string;
}

export interface IntegrationConfigDto {
  id: number;
  apiKey: string;
  agentPool: string[];
  rrIndex: number;
  totalInboundLeads: number;
}

export interface CrmMeDto {
  role: 'ADMIN' | 'AGENT';
  agentName: string;
}

export interface CrmEmailTemplateDto {
  id: number;
  name: string;
  subject: string;
  body: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SendEmailRequest {
  to?: string;
  subject: string;
  body: string;
}

export interface CrmDocumentDto {
  id: number;
  leadId: number;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadedBy: string;
  createdAt: string;
}

// ── Mapper: API DTO → frontend Lead ───────────────────────────────────────

export function mapLead(dto: CrmLeadDto): Lead {
  return {
    id: String(dto.id),
    name: dto.leadName,
    phone: dto.phone ?? "",
    email: dto.email ?? "",
    budget: dto.budgetDisplay ?? `₹${dto.budgetLakhs} L`,
    budgetLakhs: dto.budgetLakhs,
    type: dto.leadType,
    stage: dto.stage as Stage,
    source: dto.source as LeadSource,
    score: dto.aiScore,
    daysInStage: dto.daysInStage,
    daysTotal: dto.daysTotal,
    assignedTo: dto.assignedTo ?? "",
    followUpAt: dto.followUpAt ?? null,
    followUpNote: dto.followUpNote ?? null,
    tags: (dto.tags ?? []).map((t): LeadTag => ({ id: t.id, name: t.name, color: t.color })),
    activities: (dto.activities ?? []).map(
      (a): Activity => ({
        id: String(a.id),
        type: a.activityType as ActivityType,
        by: a.createdBy,
        notes: a.note,
        date: new Date(a.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        callOutcome: a.callOutcome ?? null,
        callDurationMin: a.callDurationMin ?? null,
      })
    ),
  };
}

// ── Service ───────────────────────────────────────────────────────────────

export const crmService = {
  async getLeads(stage?: string): Promise<Lead[]> {
    const path = stage
      ? `/v1/cpos/crm/leads?stage=${stage}`
      : "/v1/cpos/crm/leads";
    const dtos = await apiClient.get<CrmLeadDto[]>(path);
    return dtos.map(mapLead);
  },

  async getLeadById(id: number | string): Promise<Lead> {
    const dto = await apiClient.get<CrmLeadDto>(`/v1/cpos/crm/leads/${id}`);
    return mapLead(dto);
  },

  async createLead(req: CrmLeadRequest): Promise<Lead> {
    const dto = await apiClient.post<CrmLeadDto>("/v1/cpos/crm/leads", req);
    return mapLead(dto);
  },

  async updateStage(id: number | string, stage: string): Promise<Lead> {
    const dto = await apiClient.put<CrmLeadDto>(
      `/v1/cpos/crm/leads/${id}/stage`,
      { stage }
    );
    return mapLead(dto);
  },

  async addActivity(
    leadId: number | string,
    type: string,
    note: string
  ): Promise<CrmActivityDto> {
    return apiClient.post<CrmActivityDto>(
      `/v1/cpos/crm/leads/${leadId}/activities`,
      { type, note }
    );
  },

  async deleteLead(id: number | string): Promise<void> {
    return apiClient.delete<void>(`/v1/cpos/crm/leads/${id}`);
  },

  async getAnalytics(): Promise<CrmAnalyticsDto> {
    return apiClient.get<CrmAnalyticsDto>("/v1/cpos/crm/analytics");
  },

  async getBrokers(): Promise<BrokerDto[]> {
    return apiClient.get<BrokerDto[]>("/v1/cpos/crm/brokers");
  },

  async getCommissions(): Promise<BrokerCommissionDto[]> {
    return apiClient.get<BrokerCommissionDto[]>("/v1/cpos/crm/commissions");
  },

  async approveCommission(id: number): Promise<BrokerCommissionDto> {
    return apiClient.put<BrokerCommissionDto>(
      `/v1/cpos/crm/commissions/${id}/approve`,
      {}
    );
  },

  async setFollowUp(id: number | string, followUpAt: string | null, note: string): Promise<Lead> {
    const dto = await apiClient.put<CrmLeadDto>(`/v1/cpos/crm/leads/${id}/followup`, {
      followUpAt,
      note,
    });
    return mapLead(dto);
  },

  async getDueFollowUps(): Promise<Lead[]> {
    const dtos = await apiClient.get<CrmLeadDto[]>('/v1/cpos/crm/leads/due-followups');
    return dtos.map(mapLead);
  },

  async getIntegrationConfig(): Promise<IntegrationConfigDto> {
    return apiClient.get<IntegrationConfigDto>('/v1/cpos/crm/integrations');
  },

  async updateAgentPool(agents: string[]): Promise<IntegrationConfigDto> {
    return apiClient.put<IntegrationConfigDto>('/v1/cpos/crm/integrations/agents', { agents });
  },

  async logCall(leadId: number | string, req: LogCallRequest): Promise<CrmActivityDto> {
    return apiClient.post<CrmActivityDto>(`/v1/cpos/crm/leads/${leadId}/calls`, req);
  },

  async getMe(): Promise<CrmMeDto> {
    return apiClient.get<CrmMeDto>('/v1/cpos/crm/me');
  },

  async getAgents(): Promise<string[]> {
    return apiClient.get<string[]>('/v1/cpos/crm/agents');
  },

  async assignLead(leadId: number | string, agentName: string): Promise<Lead> {
    const dto = await apiClient.put<CrmLeadDto>(`/v1/cpos/crm/leads/${leadId}/assign`, { agentName });
    return mapLead(dto);
  },

  async getEmailTemplates(): Promise<CrmEmailTemplateDto[]> {
    return apiClient.get<CrmEmailTemplateDto[]>('/v1/cpos/crm/email-templates');
  },

  async createEmailTemplate(req: { name: string; subject: string; body: string }): Promise<CrmEmailTemplateDto> {
    return apiClient.post<CrmEmailTemplateDto>('/v1/cpos/crm/email-templates', req);
  },

  async updateEmailTemplate(id: number, req: { name?: string; subject?: string; body?: string }): Promise<CrmEmailTemplateDto> {
    return apiClient.put<CrmEmailTemplateDto>(`/v1/cpos/crm/email-templates/${id}`, req);
  },

  async deleteEmailTemplate(id: number): Promise<void> {
    return apiClient.delete<void>(`/v1/cpos/crm/email-templates/${id}`);
  },

  async sendLeadEmail(leadId: number | string, req: SendEmailRequest): Promise<CrmActivityDto> {
    return apiClient.post<CrmActivityDto>(`/v1/cpos/crm/leads/${leadId}/send-email`, req);
  },

  async uploadDocument(leadId: number | string, file: File): Promise<CrmDocumentDto> {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<CrmDocumentDto>(`/v1/cpos/crm/leads/${leadId}/documents`, form);
  },

  async getDocuments(leadId: number | string): Promise<CrmDocumentDto[]> {
    return apiClient.get<CrmDocumentDto[]>(`/v1/cpos/crm/leads/${leadId}/documents`);
  },

  async deleteDocument(leadId: number | string, docId: number): Promise<void> {
    return apiClient.delete<void>(`/v1/cpos/crm/leads/${leadId}/documents/${docId}`);
  },

  // ── Tags ─────────────────────────────────────────────────────────────────

  async getTags(): Promise<LeadTag[]> {
    return apiClient.get<LeadTag[]>('/v1/cpos/crm/tags');
  },

  async createTag(name: string, color: string): Promise<LeadTag> {
    return apiClient.post<LeadTag>('/v1/cpos/crm/tags', { name, color });
  },

  async deleteTag(tagId: number): Promise<void> {
    return apiClient.delete<void>(`/v1/cpos/crm/tags/${tagId}`);
  },

  async addTagToLead(leadId: number | string, tagId: number): Promise<Lead> {
    const dto = await apiClient.post<CrmLeadDto>(`/v1/cpos/crm/leads/${leadId}/tags/${tagId}`, {});
    return mapLead(dto);
  },

  async removeTagFromLead(leadId: number | string, tagId: number): Promise<Lead> {
    const dto = await apiClient.delete<CrmLeadDto>(`/v1/cpos/crm/leads/${leadId}/tags/${tagId}`);
    return mapLead(dto);
  },

  // ── CSV Import ────────────────────────────────────────────────────────────

  async checkDuplicate(phone?: string, email?: string): Promise<boolean> {
    const params = new URLSearchParams();
    if (phone) params.append('phone', phone);
    if (email) params.append('email', email);
    const r = await apiClient.get<{ duplicate: boolean }>(`/v1/cpos/crm/leads/check-duplicate?${params}`);
    return r.duplicate;
  },

  async importLeads(file: File): Promise<ImportResultDto> {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<ImportResultDto>('/v1/cpos/crm/leads/import', form);
  },

  // ── Sales Targets ─────────────────────────────────────────────────────────

  async getSalesTargets(month?: number, year?: number): Promise<SalesTargetDto[]> {
    const params = new URLSearchParams();
    if (month) params.append('month', String(month));
    if (year)  params.append('year',  String(year));
    return apiClient.get<SalesTargetDto[]>(`/v1/cpos/crm/targets?${params}`);
  },

  async upsertSalesTarget(req: {
    agentName: string; month?: number; year?: number;
    targetLeadsClosed: number; targetRevenueLakhs: number;
  }): Promise<SalesTargetDto> {
    return apiClient.put<SalesTargetDto>('/v1/cpos/crm/targets', req);
  },

  // ── Leaderboard ────────────────────────────────────────────────────────────

  async getLeaderboard(month?: number, year?: number): Promise<LeaderboardEntryDto[]> {
    const params = new URLSearchParams();
    if (month) params.append('month', String(month));
    if (year)  params.append('year',  String(year));
    return apiClient.get<LeaderboardEntryDto[]>(`/v1/cpos/crm/leaderboard?${params}`);
  },

  // ── Stale Leads ───────────────────────────────────────────────────────────

  async getStaleLeads(staleDays?: number): Promise<Lead[]> {
    const dtos = await apiClient.get<CrmLeadDto[]>(
      `/v1/cpos/crm/leads/stale${staleDays ? `?staleDays=${staleDays}` : ''}`
    );
    return dtos.map(mapLead);
  },

  // ── Email Campaigns ───────────────────────────────────────────────────────

  async getEmailCampaigns(): Promise<EmailCampaignDto[]> {
    return apiClient.get<EmailCampaignDto[]>('/v1/cpos/crm/email-campaigns');
  },

  async sendBulkEmailCampaign(req: {
    subject: string; bodyHtml: string;
    filterStage?: string; filterSource?: string;
  }): Promise<EmailCampaignDto> {
    return apiClient.post<EmailCampaignDto>('/v1/cpos/crm/email-campaigns', req);
  },

  // ── SMS ───────────────────────────────────────────────────────────────────

  async sendLeadSms(leadId: number | string, message: string): Promise<void> {
    return apiClient.post<void>(`/v1/cpos/crm/leads/${leadId}/sms`, { message });
  },

  // ── Approval Workflows ────────────────────────────────────────────────────

  async getLeadsAwaitingApproval(): Promise<Lead[]> {
    const dtos = await apiClient.get<CrmLeadDto[]>('/v1/cpos/crm/leads/pending-approval');
    return dtos.map(mapLead);
  },

  async requestApproval(leadId: number | string, reason: string): Promise<Lead> {
    const dto = await apiClient.post<CrmLeadDto>(`/v1/cpos/crm/leads/${leadId}/request-approval`, { reason });
    return mapLead(dto);
  },

  async approveOrRejectLead(leadId: number | string, approve: boolean, comment?: string): Promise<Lead> {
    const dto = await apiClient.post<CrmLeadDto>(`/v1/cpos/crm/leads/${leadId}/approve`, { approve, comment });
    return mapLead(dto);
  },

  // ── Email Drip Sequences ──────────────────────────────────────────────────

  async getDripSequences(): Promise<DripSequenceDto[]> {
    return apiClient.get<DripSequenceDto[]>('/v1/cpos/crm/drip-sequences');
  },

  async createDripSequence(req: DripSequenceDto): Promise<DripSequenceDto> {
    return apiClient.post<DripSequenceDto>('/v1/cpos/crm/drip-sequences', req);
  },

  async deleteDripSequence(seqId: number): Promise<void> {
    return apiClient.delete<void>(`/v1/cpos/crm/drip-sequences/${seqId}`);
  },
};
