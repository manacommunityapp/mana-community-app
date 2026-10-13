// Types for Mana Pay - Unified Payments Capability

export type ManaPayDomain =
  | 'MAINTENANCE_BILL'
  | 'EVENT_BOOKING'
  | 'POOJA_BOOKING'
  | 'SPORTS_FEE'
  | 'MARKETPLACE_ORDER'
  | 'TRIP_BOOKING'
  | 'MANA_HEALTH'
  | 'WALLET_TOPUP';

export type ManaPaymentRail =
  | 'UPI_INTENT'
  | 'UPI_QR'
  | 'GATEWAY_CARD_NETBANKING'
  | 'WALLET';

export type ManaPaymentStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED';

export type ManaReconciliationStatus =
  | 'RECONCILED'
  | 'UNRECONCILED'
  | 'FLAGGED';

export interface ManaPayPayerInfo {
  id?: number | string;
  name: string;
  email?: string;
  phone?: string;
  unit?: string;
  tower?: string;
}

export interface ManaPayItemLine {
  title: string;
  quantity?: number;
  unitPrice?: number;
  amount: number;
}

export interface CreateManaPaymentIntentRequest {
  idempotencyKey: string;
  domain: ManaPayDomain;
  orderReferenceId: string;
  title: string;
  description?: string;
  totalAmount: number;
  currency?: string;
  taxAmount?: number;
  convenienceFee?: number;
  preferredRail?: ManaPaymentRail;
  payer: ManaPayPayerInfo;
  vendorId?: string;
  vendorName?: string;
  items?: ManaPayItemLine[];
  metadata?: Record<string, unknown>;
}

export interface ManaPaymentIntentResponse {
  intentId: string;
  idempotencyKey: string;
  domain: ManaPayDomain;
  orderReferenceId: string;
  amount: number;
  currency: string;
  status: ManaPaymentStatus;
  preferredRail: ManaPaymentRail;
  upiVpa: string;
  upiIntentUri: string;
  gatewayOrderId?: string;
  gatewayKeyId?: string;
  gatewayPaymentUrl?: string;
  receiptNumber?: string;
  expiresAt: string;
  createdAt: string;
}

export interface ConfirmManaPaymentRequest {
  intentId: string;
  rail: ManaPaymentRail;
  gatewayPaymentId?: string;
  gatewayOrderId?: string;
  gatewaySignature?: string;
  utr?: string;
  bankRefNumber?: string;
}

export interface ManaDigitalReceipt {
  receiptNumber: string;
  receiptDate: string;
  transactionNumber: string;
  orderReferenceId: string;
  domain: ManaPayDomain;
  status: ManaPaymentStatus;
  payerName: string;
  payerUnit?: string;
  payerPhone?: string;
  paymentRail: ManaPaymentRail;
  amount: number;
  taxAmount: number;
  convenienceFee: number;
  totalAmount: number;
  utr?: string;
  gatewayRef?: string;
  vendorId?: string;
  vendorName?: string;
  societyName: string;
  societyGstin?: string;
  societyAddress: string;
  items: ManaPayItemLine[];
  notes?: string;
  verifiedStamp: boolean;
}

export interface ManaPaymentRecord {
  id: string;
  transactionNumber: string;
  orderReferenceId: string;
  domain: ManaPayDomain;
  title: string;
  amount: number;
  currency: string;
  status: ManaPaymentStatus;
  paymentRail: ManaPaymentRail;
  createdAt: string;
  paidAt?: string;
  payerId?: string;
  payerName: string;
  payerUnit?: string;
  vendorId?: string;
  vendorName?: string;
  utr?: string;
  gatewayRef?: string;
  receiptNumber?: string;
  reconciliationStatus?: ManaReconciliationStatus;
  reconciledAt?: string;
  reconciledBy?: string;
  refundedAmount?: number;
  refundReason?: string;
  canRefund?: boolean;
}

export interface ManaRefundRequest {
  transactionNumber: string;
  amount: number;
  reason: string;
  refundToWallet?: boolean;
}
