import axiosInstance from "../axiosInstance";

// ── Fee Engine Types ──

export interface LineItem {
  ruleId: string;
  description: string;
  amount: number;
  priority: number;
}

export interface InvoiceBreakdown {
  lineItems: LineItem[];
  subtotal: number;
  penalties: number;
  gst: number;
  grandTotal: number;
}

export interface FeeCalcRequest {
  communityId: number;
  residentId: number;
  flatNo: string;
  flatAreaSqft: string;
  flatType: string;
  overdueMonths: number;
  outstandingAmount: string;
  gstExempt: boolean;
  hasActiveWaiver: boolean;
}

export interface RuleInfo {
  ruleId: string;
  description: string;
  priority: number;
}

// ── Rate Limiter Types ──

export interface RateLimitDecision {
  allowed: boolean;
  code: string;
  message?: string;
  retryAfterMs: number;
  currentCount: number;
  limit: number;
}

export interface RateLimitInfo {
  key: string;
  used: number;
  limit: number;
  remaining: number;
}

// ── Notification Router Types ──

export interface DeliveryResultDTO {
  channelId: string;
  success: boolean;
  messageId?: string;
  errorReason?: string;
  deliveryTimeMs: number;
}

export interface RoutingResult {
  delivered: boolean;
  attempts: DeliveryResultDTO[];
  failureReason?: string;
}

export interface ChannelInfo {
  channelId: string;
  priority: number;
}

const BASE = "/api/lld";

// ── Fee Engine ──

export const calculateFees = (req: FeeCalcRequest) =>
  axiosInstance.post<InvoiceBreakdown>(`${BASE}/fee-engine/calculate`, req);

export const listFeeRules = () =>
  axiosInstance.get<RuleInfo[]>(`${BASE}/fee-engine/rules`);

// ── Rate Limiter ──

export const checkRate = (partnerId: string, societyId: number) =>
  axiosInstance.post<RateLimitDecision>(`${BASE}/rate-limiter/check`, null, { params: { partnerId, societyId } });

export const getPartnerStats = () =>
  axiosInstance.get<Record<string, RateLimitInfo>>(`${BASE}/rate-limiter/partner-stats`);

export const getSocietyStats = (societyId: number) =>
  axiosInstance.get<RateLimitInfo>(`${BASE}/rate-limiter/society-stats/${societyId}`);

export const setPartnerLimit = (partnerId: string, limit: number) =>
  axiosInstance.post(`${BASE}/rate-limiter/set-limit`, null, { params: { partnerId, limit } });

// ── Notification Router ──

export const sendNotification = (req: {
  recipientId: number;
  recipientPhone?: string;
  recipientEmail?: string;
  urgency: string;
  title: string;
  body: string;
  category: string;
  data?: Record<string, string>;
  dndOverride: boolean;
}) => axiosInstance.post<RoutingResult>(`${BASE}/notification-router/send`, req);

export const listChannels = () =>
  axiosInstance.get<ChannelInfo[]>(`${BASE}/notification-router/channels`);

export const setDnd = (userId: number, enabled: boolean) =>
  axiosInstance.post(`${BASE}/notification-router/dnd`, null, { params: { userId, enabled } });
