import { apiClient } from "./apiClient";

export interface EmailTemplateInfo {
  key: string;
  subject: string;
  templateFile: string;
  category: string;
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
};
