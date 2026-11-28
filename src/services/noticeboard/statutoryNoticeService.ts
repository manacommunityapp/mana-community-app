import axios from 'axios';

const API_BASE = '/api/statutory-notices';

export interface StatutoryNotice {
  id: number;
  communityId: string;
  title: string;
  body: string;
  bodyHtml?: string;
  category: string;
  priority: string;
  status: string;
  statutory: boolean;
  readReceiptRequired: boolean;
  publishedBy: string;
  publishedByRole: string;
  publishedAt: string;
  effectiveDate: string;
  expiryDate?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  audienceGroupId: number;
  totalRecipients: number;
  deliveredCount: number;
  openedCount: number;
  pinned: boolean;
  displayOrder: number;
}

export interface DeliveryChannelData {
  id: number;
  noticeId: number;
  channelType: string;
  channelStatus: string;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalFailed: number;
  totalBounced: number;
  dispatchStartedAt: string;
  dispatchCompletedAt: string;
  deliveryRatePercent: number;
  openRatePercent: number;
}

export interface ReadReceipt {
  id: number;
  noticeId: number;
  flatNumber: string;
  towerName: string;
  recipientName: string;
  recipientEmail: string;
  beaconStatus: string;
  sentAt: string;
  deliveredAt?: string;
  openedAt?: string;
  acknowledgedAt?: string;
  deliveredVia: string;
  legallyValid: boolean;
  signatureHash?: string;
}

export interface AudienceGroup {
  id: number;
  communityId: string;
  name: string;
  description: string;
  dynamic: boolean;
  systemDefined: boolean;
  ruleExpression?: string;
  cachedMemberCount: number;
  lastEvaluatedAt?: string;
  groupStatus: string;
}

export interface AudienceRule {
  id: number;
  audienceGroupId: number;
  field: string;
  operator: string;
  value: string;
  conjunction?: string;
  ruleOrder: number;
}

export interface AudienceMember {
  id: number;
  audienceGroupId: number;
  flatNumber: string;
  towerName: string;
  residentName: string;
  email: string;
  phone: string;
  ownershipType: string;
  matchedByRule: boolean;
}

export interface NoticeDeliveryDashboard {
  notice: StatutoryNotice;
  channels: DeliveryChannelData[];
  totalRecipients: number;
  statusBreakdown: Record<string, number>;
  towerWiseDelivery: Record<string, Record<string, number>>;
  pendingCount: number;
  openRatePercent: number;
  receipts: ReadReceipt[];
}

export interface AudienceGroupDashboard {
  totalGroups: number;
  dynamicGroups: number;
  staticGroups: number;
  totalMembers: number;
  membersByGroup: Record<string, number>;
  groups: AudienceGroup[];
  rules: AudienceRule[];
}

export const statutoryNoticeService = {
  getAllNotices: () => axios.get<StatutoryNotice[]>(`${API_BASE}/notices`).then(r => r.data),
  getNotice: (id: number) => axios.get<StatutoryNotice>(`${API_BASE}/notices/${id}`).then(r => r.data),
  getDeliveryDashboard: (noticeId: number) => axios.get<NoticeDeliveryDashboard>(`${API_BASE}/delivery/${noticeId}`).then(r => r.data),
  getReceipts: (noticeId: number) => axios.get<ReadReceipt[]>(`${API_BASE}/receipts/${noticeId}`).then(r => r.data),
  getAudienceDashboard: () => axios.get<AudienceGroupDashboard>(`${API_BASE}/audience/dashboard`).then(r => r.data),
  getAudienceGroups: () => axios.get<AudienceGroup[]>(`${API_BASE}/audience/groups`).then(r => r.data),
  getGroupMembers: (groupId: number) => axios.get<AudienceMember[]>(`${API_BASE}/audience/${groupId}/members`).then(r => r.data),
  getGroupRules: (groupId: number) => axios.get<AudienceRule[]>(`${API_BASE}/audience/${groupId}/rules`).then(r => r.data),
  seedDemo: () => axios.post(`${API_BASE}/seed-demo`).then(r => r.data),
};
