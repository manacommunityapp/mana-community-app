import { apiClient } from "../common/apiClient";

export interface EmailTemplateInfo {
  key: string;
  subject: string;
  templateFile: string;
  category: string;
  /** Human-readable module/menu/submenu path where this email fires, or null if not wired to a live trigger yet. */
  triggerMenuPath: string | null;
  /** False when nothing in the app currently sends this template automatically or via a UI action. */
  triggerWired: boolean;
  /** What specifically causes the send. */
  triggerDescription: string;
  /**
   * Applicability — reporting only. True when this community has drafted a
   * custom template (in the template builder) with a matching key. Does NOT
   * mean it's actually what gets sent today; `appliedSource` below reflects
   * only what an ACTIVE custom template would imply if wired up.
   */
  customTemplateExists: boolean;
  customTemplateId: number | null;
  customTemplateName: string | null;
  customTemplateStatus: string | null;
  /** "CUSTOM" only when a custom template exists AND is ACTIVE; "DEFAULT" otherwise. */
  appliedSource: "DEFAULT" | "CUSTOM";
}

export interface EmailHealthInfo {
  mailEnabled: boolean;
  from: string;
  fromName: string;
  recipientMode: string;
  defaultRecipient: string;
  baseUrl: string;
  templateCount: number;
  status: string;
}

export interface TestEmailResult {
  template: string;
  subject: string;
  to: string;
  customVarsApplied: string[];
  mailEnabled: boolean;
  recipientMode: string;
  note: string;
}

export interface TestAllResult {
  to: string;
  totalTemplates: number;
  sent: number;
  failed: number;
  mailEnabled: boolean;
  recipientMode: string;
  results: { template: string; subject: string; status: string; error?: string }[];
  note: string;
}

/**
 * apiClient surfaces non-2xx responses as `Error(rawBodyText)`. Our email admin
 * endpoints return JSON bodies like `{ "error": "..." }` for validation and
 * rate-limit failures — this pulls that message out so the UI can show the
 * actual reason instead of a generic fallback.
 */
export function extractApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) {
    try {
      const parsed = JSON.parse(err.message);
      if (parsed && typeof parsed.error === "string") return parsed.error;
    } catch {
      // Not JSON — fall through to the raw message or fallback below.
    }
    if (!err.message.trim().startsWith("{")) return err.message;
  }
  return fallback;
}

export interface DefaultTemplateDetails {
  key: string;
  templateName: string;
  templateFile: string;
  subject: string;
  category: string;
  rawHtml: string;
  renderedHtml: string;
}

export const emailAdminService = {
  async getTemplates(communityId?: number): Promise<{ count: number; templates: EmailTemplateInfo[] }> {
    const url = communityId != null ? `/admin/email/templates?communityId=${communityId}` : "/admin/email/templates";
    return apiClient.get(url);
  },

  async getPreviewHtml(template: string, communityId?: number, customVars?: Record<string, unknown>): Promise<string> {
    const query = communityId != null ? `?communityId=${communityId}` : "";
    const url = `/api/admin/email/preview/${template}${query}`;
    const token = localStorage.getItem("mana_token") || "";
    let res;
    if (customVars) {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(customVars)
      });
    } else {
      res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
    }
    if (!res.ok) throw new Error(`Preview failed: ${res.status}`);
    return res.text();
  },

  async getDefaultTemplate(template: string): Promise<DefaultTemplateDetails> {
    return apiClient.get(`/admin/email/default-template/${template}`);
  },

  async getHealth(communityId?: number): Promise<EmailHealthInfo> {
    const url = communityId != null ? `/admin/email/health?communityId=${communityId}` : "/admin/email/health";
    return apiClient.get(url);
  },

  async sendTest(template: string, communityId: number, to?: string, customVars?: Record<string, unknown>): Promise<TestEmailResult> {
    const params = new URLSearchParams({ template, communityId: String(communityId) });
    if (to) params.set("to", to);
    return apiClient.post(`/admin/email/test?${params}`, customVars || {});
  },

  async sendAllTests(communityId: number, to?: string, customVars?: Record<string, unknown>): Promise<TestAllResult> {
    const params = new URLSearchParams({ communityId: String(communityId) });
    if (to) params.set("to", to);
    return apiClient.post(`/admin/email/test-all?${params}`, customVars || {});
  },

  async getDeliveryLogs(params?: {
    status?: string;
    templateType?: string;
    communityId?: number;
    recipient?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
  }): Promise<EmailDeliveryLogPage> {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.templateType) query.set("templateType", params.templateType);
    if (params?.communityId != null) query.set("communityId", String(params.communityId));
    if (params?.recipient) query.set("recipient", params.recipient);
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.page != null) query.set("page", String(params.page));
    if (params?.size != null) query.set("size", String(params.size));

    const queryString = query.toString();
    const url = `/admin/email/delivery-log${queryString ? `?${queryString}` : ""}`;
    return apiClient.get(url);
  },

  async getDeliverySummary(communityId: number, days: number = 7): Promise<EmailDeliverySummary> {
    return apiClient.get(`/admin/email/delivery-log/summary?communityId=${communityId}&days=${days}`);
  },

  async getDeliveryLogById(id: number): Promise<EmailDeliveryLogDto> {
    return apiClient.get(`/admin/email/delivery-log/${id}`);
  },
};

export interface EmailDeliveryLogDto {
  id: number;
  recipient: string;
  subject: string;
  templateType: string | null;
  status: "SENT" | "FAILED" | "SKIPPED";
  errorMessage: string | null;
  opened: boolean;
  openedAt: string | null;
  communityId: number | null;
  sentAt: string;
}

export interface EmailDeliveryLogPage {
  content: EmailDeliveryLogDto[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface EmailDeliverySummary {
  communityId: number;
  periodDays: number;
  sent: number;
  failed: number;
  skipped: number;
  total: number;
}
