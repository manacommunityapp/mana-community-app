import { apiClient } from "./apiClient";

export interface EmailTemplateInfo {
  key: string;
  subject: string;
  templateFile: string;
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

export const emailAdminService = {
  async getTemplates(): Promise<{ count: number; templates: EmailTemplateInfo[] }> {
    return apiClient.get("/admin/email/templates");
  },

  async getPreviewHtml(template: string): Promise<string> {
    const res = await fetch(`/api/admin/email/preview/${template}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("mana_token") || ""}` },
    });
    if (!res.ok) throw new Error(`Preview failed: ${res.status}`);
    return res.text();
  },

  async getHealth(): Promise<EmailHealthInfo> {
    return apiClient.get("/admin/email/health");
  },

  async sendTest(template: string, to?: string, customVars?: Record<string, unknown>): Promise<TestEmailResult> {
    const params = new URLSearchParams({ template });
    if (to) params.set("to", to);
    return apiClient.post(`/admin/email/test?${params}`, customVars || {});
  },

  async sendAllTests(to?: string): Promise<TestAllResult> {
    const params = new URLSearchParams();
    if (to) params.set("to", to);
    return apiClient.post(`/admin/email/test-all?${params}`);
  },
};
