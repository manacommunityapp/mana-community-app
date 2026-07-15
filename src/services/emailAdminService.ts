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

  async getPreviewHtml(template: string, customVars?: Record<string, unknown>): Promise<string> {
    const url = `/api/admin/email/preview/${template}`;
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

  async getHealth(): Promise<EmailHealthInfo> {
    return apiClient.get("/admin/email/health");
  },

  async sendTest(template: string, to?: string, customVars?: Record<string, unknown>): Promise<TestEmailResult> {
    const params = new URLSearchParams({ template });
    if (to) params.set("to", to);
    return apiClient.post(`/admin/email/test?${params}`, customVars || {});
  },

  async sendAllTests(to?: string, customVars?: Record<string, unknown>): Promise<TestAllResult> {
    const params = new URLSearchParams();
    if (to) params.set("to", to);
    return apiClient.post(`/admin/email/test-all?${params}`, customVars || {});
  },
};
