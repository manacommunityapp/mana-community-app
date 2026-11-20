import { apiClient } from '../apiClient';

export interface PaymentTimelineEvent {
  id: number;
  userId: number;
  sourceModule: string;
  referenceId: number;
  eventType: string;
  amount?: number;
  description?: string;
  occurredAt: string;
}

export interface BillReminder {
  id: number;
  userId: number;
  billType: string;
  billerName: string;
  amount?: number;
  dueDate: string;
  reminderDays: number;
  reminderSent: boolean;
  paid: boolean;
  paidAt?: string;
  createdAt: string;
}

export interface PaymentMandate {
  id: number;
  userId: number;
  mandateType: string;
  provider: string;
  maxAmount: number;
  frequency: string;
  approvedAt: string;
  expiresAt?: string;
  active: boolean;
  cancelledAt?: string;
  cancelReason?: string;
}

export interface PaymentReceipt {
  id: number;
  userId: number;
  sourceModule: string;
  referenceId: number;
  amount: number;
  currency: string;
  paymentMethod?: string;
  gatewayRef?: string;
  receiptNumber: string;
  paidAt: string;
}

export interface PaymentReconciliation {
  id: number;
  periodStart: string;
  periodEnd: string;
  totalCollected: number;
  totalRefunded: number;
  totalPending: number;
  discrepancy: number;
  status: string;
  reviewedBy?: number;
  reviewedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface PaymentDispute {
  id: number;
  userId: number;
  receiptId?: number;
  amount: number;
  reason: string;
  description?: string;
  status: string;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface PaymentRequestLink {
  id: number;
  createdBy: number;
  payeeUserId?: number;
  amount: number;
  description: string;
  linkToken: string;
  expiresAt?: string;
  paid: boolean;
  paidAt?: string;
  createdAt: string;
}

export interface PaymentReward {
  id: number;
  userId: number;
  sourceModule: string;
  rewardType: string;
  points: number;
  description?: string;
  expiresAt?: string;
  redeemed: boolean;
}

const BASE = '/api/payments';

export const paymentsService = {
  timeline: (limit = 50) => apiClient.get<PaymentTimelineEvent[]>(`${BASE}/timeline/my?limit=${limit}`),
  listReminders: () => apiClient.get<BillReminder[]>(`${BASE}/bill-reminders/my`),
  createReminder: (data: Partial<BillReminder>) => apiClient.post<BillReminder>(`${BASE}/bill-reminders`, data),
  markReminderPaid: (id: number) => apiClient.put<BillReminder>(`${BASE}/bill-reminders/${id}/paid`, {}),
  listMandates: () => apiClient.get<PaymentMandate[]>(`${BASE}/mandates/my`),
  cancelMandate: (id: number, reason: string) => apiClient.put<PaymentMandate>(`${BASE}/mandates/${id}/cancel`, { reason }),
  listReceipts: () => apiClient.get<PaymentReceipt[]>(`${BASE}/receipts/my`),
  listReconciliations: () => apiClient.get<PaymentReconciliation[]>(`${BASE}/reconciliation`),
  createReconciliation: (data: Partial<PaymentReconciliation>) => apiClient.post<PaymentReconciliation>(`${BASE}/reconciliation`, data),
  approveReconciliation: (id: number) => apiClient.put<PaymentReconciliation>(`${BASE}/reconciliation/${id}/approve`, {}),
  listDisputes: () => apiClient.get<PaymentDispute[]>(`${BASE}/disputes/my`),
  listOpenDisputes: () => apiClient.get<PaymentDispute[]>(`${BASE}/disputes/open`),
  raiseDispute: (data: Partial<PaymentDispute>) => apiClient.post<PaymentDispute>(`${BASE}/disputes`, data),
  resolveDispute: (id: number, resolution: string) => apiClient.put<PaymentDispute>(`${BASE}/disputes/${id}/resolve`, { resolution }),
  listRequestLinks: () => apiClient.get<PaymentRequestLink[]>(`${BASE}/request-links/my`),
  createRequestLink: (data: Partial<PaymentRequestLink>) => apiClient.post<PaymentRequestLink>(`${BASE}/request-links`, data),
  myRewards: () => apiClient.get<PaymentReward[]>(`${BASE}/rewards/my`),
  rewardBalance: () => apiClient.get<{ userId: number; points: number }>(`${BASE}/rewards/my/balance`),
  redeemReward: (id: number) => apiClient.post<PaymentReward>(`${BASE}/rewards/redeem/${id}`, {}),
};
