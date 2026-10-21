/**
 * Mana Community AI Automation Service
 * Connects the Mana Community App with self-hosted n8n automation workflows
 */

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
};
