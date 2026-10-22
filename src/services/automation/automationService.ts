/**
 * Mana Community AI Automation Service
 * Connects the Mana Community App with self-hosted n8n automation workflows
 */

// ─── Helpdesk Interfaces ──────────────────────────────────────────────────────

export interface TicketTriageRequest {
  ticketId: string | number;
  title: string;
  description: string;
  category?: string;
  location?: string;
}

export interface TicketTriageAnalysis {
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  assignedDepartment: string;
  suggestedAction: string;
  estimatedResolutionHours: number;
  safetyHazard: boolean;
}

export interface TicketTriageResponse {
  status: 'success' | 'error';
  ticketId: string | number;
  triagedAt: string;
  analysis: TicketTriageAnalysis;
}

// ─── Finance / Receipt Interfaces ─────────────────────────────────────────────

export interface ReceiptParseRequest {
  expenseId: string | number;
  imageUrl?: string;
  base64Data?: string;
  mimeType?: string;
}

export interface ReceiptParsedData {
  merchantName: string;
  invoiceNumber?: string;
  date?: string;
  currency?: string;
  subtotal?: number;
  taxAmount?: number;
  totalAmount: number;
  category: string;
  confidenceScore: number;
  lineItems?: Array<{ description: string; quantity: number; amount: number }>;
}

export interface ReceiptParseResponse {
  status: 'success' | 'error';
  expenseId: string | number;
  extractedAt: string;
  data: ReceiptParsedData;
}

// ─── Sports Module Interfaces ─────────────────────────────────────────────────

export interface SportsMatchRecapRequest {
  matchId: string | number;
  sport: string;
  tournamentName?: string;
  teamA: string;
  teamB: string;
  result: string;
  scoreSummary?: Record<string, any>;
  topPerformers?: Array<{ playerName: string; stats: string; team?: string }>;
}

export interface SportsMatchRecapData {
  headline: string;
  recap: string;
  keyMoments: string[];
  mvp: {
    playerName: string;
    team: string;
    rationale: string;
  };
  badgeRecommendations: Array<{
    playerName: string;
    badgeName: string;
    reason: string;
  }>;
  socialBulletin: string;
}

export interface SportsMatchRecapResponse {
  status: 'success' | 'error';
  matchId: string | number;
  sport: string;
  tournamentName?: string;
  generatedAt: string;
  data: SportsMatchRecapData;
}

export interface SportsSchedulerRequest {
  tournamentName: string;
  sport: string;
  format?: 'KNOCKOUT' | 'ROUND_ROBIN' | 'LEAGUE';
  teams: string[];
  venues?: string[];
  startDate?: string;
  timeSlots?: string[];
}

export interface SportsSchedulerResponse {
  status: 'success' | 'error';
  tournamentName: string;
  sport: string;
  generatedAt: string;
  schedule: {
    tournamentSummary: string;
    totalMatches: number;
    fixtures: Array<{
      matchNumber: number;
      round: string;
      teamA: string;
      teamB: string;
      venue: string;
      date: string;
      timeSlot: string;
      notes?: string;
    }>;
    fairnessAudit: string;
  };
}

// ─── Client Service ───────────────────────────────────────────────────────────

const AUTOMATION_WEBHOOK_BASE =
  (import.meta as any).env?.VITE_AUTOMATION_WEBHOOK_URL || 'http://localhost:5678/webhook';

export const automationService = {
  /**
   * Check if the self-hosted n8n engine is currently accessible
   */
  isAvailable: async (): Promise<boolean> => {
    try {
      const res = await fetch(`${AUTOMATION_WEBHOOK_BASE}/healthz`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Dispatches a maintenance ticket to the AI Triage workflow
   */
  triageTicket: async (ticket: TicketTriageRequest): Promise<TicketTriageResponse> => {
    try {
      const res = await fetch(`${AUTOMATION_WEBHOOK_BASE}/ticket-triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket),
      });

      if (!res.ok) {
        throw new Error(`Automation responded with status ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.warn('[automationService] AI Triage offline, returning rule-based fallback:', err);
      return {
        status: 'success',
        ticketId: ticket.ticketId,
        triagedAt: new Date().toISOString(),
        analysis: {
          urgency: 'MEDIUM',
          assignedDepartment: ticket.category || 'General',
          suggestedAction: 'Awaiting manual facility review',
          estimatedResolutionHours: 24,
          safetyHazard: false,
        },
      };
    }
  },

  /**
   * Dispatches an uploaded receipt/invoice image for multimodal AI OCR parsing
   */
  parseReceipt: async (receipt: ReceiptParseRequest): Promise<ReceiptParseResponse> => {
    try {
      const res = await fetch(`${AUTOMATION_WEBHOOK_BASE}/receipt-parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receipt),
      });

      if (!res.ok) {
        throw new Error(`Automation responded with status ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.warn('[automationService] AI Receipt OCR offline, returning fallback:', err);
      return {
        status: 'error',
        expenseId: receipt.expenseId,
        extractedAt: new Date().toISOString(),
        data: {
          merchantName: 'Unknown Vendor',
          totalAmount: 0,
          category: 'Office Supplies & Misc',
          confidenceScore: 0,
        },
      };
    }
  },

  /**
   * Generates thrilling AI match recap, highlights, MVP analysis, and badge recommendations
   */
  generateMatchRecap: async (
    req: SportsMatchRecapRequest
  ): Promise<SportsMatchRecapResponse> => {
    try {
      const res = await fetch(`${AUTOMATION_WEBHOOK_BASE}/sports-match-recap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      if (!res.ok) {
        throw new Error(`Automation responded with status ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.warn('[automationService] AI Sports Recap offline, returning fallback:', err);
      return {
        status: 'error',
        matchId: req.matchId,
        sport: req.sport,
        tournamentName: req.tournamentName,
        generatedAt: new Date().toISOString(),
        data: {
          headline: `${req.teamA} vs ${req.teamB} - ${req.result}`,
          recap: `Match concluded with ${req.result}. Great effort and competitive spirit displayed by both sides.`,
          keyMoments: ['Match concluded successfully in tournament schedule.'],
          mvp: {
            playerName: req.topPerformers?.[0]?.playerName || 'Top Contributor',
            team: req.teamA,
            rationale: 'Decisive team impact',
          },
          badgeRecommendations: [],
          socialBulletin: `🏆 Match Result: ${req.teamA} vs ${req.teamB}. ${req.result}`,
        },
      };
    }
  },

  /**
   * Generates optimal, conflict-free tournament fixtures and schedule
   */
  generateTournamentSchedule: async (
    req: SportsSchedulerRequest
  ): Promise<SportsSchedulerResponse> => {
    try {
      const res = await fetch(`${AUTOMATION_WEBHOOK_BASE}/sports-fixture-scheduler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      if (!res.ok) {
        throw new Error(`Automation responded with status ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.warn('[automationService] AI Fixture Scheduler offline, returning fallback:', err);
      return {
        status: 'error',
        tournamentName: req.tournamentName,
        sport: req.sport,
        generatedAt: new Date().toISOString(),
        schedule: {
          tournamentSummary: 'Standard bracket schedule',
          totalMatches: 0,
          fixtures: [],
          fairnessAudit: 'Default schedule allocation',
        },
      };
    }
  },
};
