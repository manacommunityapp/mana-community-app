import { apiClient } from "../common/apiClient";
import type { Stage, LeadSource, ActivityType, Lead, Activity } from "../../app/components/cpos/crm/crmData";

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
  createdAt: string;
  updatedAt: string;
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

export interface CrmAnalyticsDto {
  totalLeads: number;
  overallConversionPct: number;
  avgDaysTotal: number;
  hotLeads: number;
  funnel: FunnelStageDto[];
  sourceBreakdown: Record<string, number>;
  stageVelocity: Record<string, number>;
  agentStats: AgentStatDto[];
}

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
};
