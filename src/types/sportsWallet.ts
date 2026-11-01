export type TransactionType = "CREDIT" | "DEBIT";
export type TransactionCategory =
  | "MATCH_FEE"
  | "TOURNAMENT_ENTRY"
  | "VENUE_BOOKING"
  | "COACHING_FEE"
  | "MERCHANDISE"
  | "REWARD"
  | "TOP_UP"
  | "WITHDRAWAL"
  | "EXPENSE_SPLIT"
  | "REFUND";

export type TransactionStatus = "COMPLETED" | "PENDING" | "FAILED" | "REFUNDED";

export type SplitStatus = "PENDING" | "PAID" | "DECLINED" | "REMINDED";

export interface WalletBalance {
  available: number;
  pending: number;
  totalEarned: number;
  totalSpent: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  currency: string;
  description: string;
  counterpartyName?: string;
  counterpartyAvatar?: string;
  matchId?: string;
  tournamentId?: string;
  status: TransactionStatus;
  createdAt: string;
  completedAt?: string;
}

export interface MatchFeeCollection {
  id: string;
  matchId: string;
  matchTitle: string;
  sport: string;
  date: string;
  venue: string;
  totalAmount: number;
  perPlayerAmount: number;
  collectedAmount: number;
  status: "COLLECTING" | "COMPLETE" | "CANCELLED";
  participants: MatchFeeParticipant[];
  createdBy: string;
  createdAt: string;
}

export interface MatchFeeParticipant {
  playerId: string;
  playerName: string;
  avatar?: string;
  amount: number;
  status: SplitStatus;
  paidAt?: string;
}

export interface ExpenseSplit {
  id: string;
  title: string;
  description?: string;
  totalAmount: number;
  currency: string;
  category: "MATCH_FEE" | "VENUE" | "EQUIPMENT" | "FOOD" | "TRANSPORT" | "OTHER";
  splitType: "EQUAL" | "CUSTOM";
  status: "ACTIVE" | "SETTLED" | "CANCELLED";
  createdBy: string;
  createdByName: string;
  members: ExpenseSplitMember[];
  createdAt: string;
  settledAt?: string;
}

export interface ExpenseSplitMember {
  playerId: string;
  playerName: string;
  avatar?: string;
  shareAmount: number;
  status: SplitStatus;
  paidAt?: string;
}
