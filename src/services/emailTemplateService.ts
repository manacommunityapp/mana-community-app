import { apiClient } from "./apiClient";

export type EmailTemplateStatus = "DRAFT" | "REVIEW" | "APPROVED" | "PUBLISHED" | "ACTIVE" | "ARCHIVED";

export interface EmailTemplateRecord {
  id?: number;
  communityId: number;
  name: string;
  subject: string;
  html: string;
  css: string;
  jsonLayout: unknown;
  status: EmailTemplateStatus;
  category?: string;
  tags?: string[];
  themeName?: string;
  themeJson?: string;
  generatedCss?: string;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmailTemplatePayload {
  id?: number;
  communityId: number;
  templateName: string;
  subject: string;
  html: string;
  css: string;
  jsonLayout: unknown;
  status?: EmailTemplateStatus;
  category?: string;
  tags?: string[];
  themeName?: string;
  themeJson?: string;
  generatedCss?: string;
}

interface UploadedAssetResponse {
  url: string;
  key?: string;
}

function normalizeTemplate(raw: any): EmailTemplateRecord {
  return {
    id: raw.id,
    communityId: raw.communityId ?? raw.community_id,
    name: raw.name ?? raw.templateName ?? raw.template_name ?? "Untitled Template",
    subject: raw.subject ?? "",
    html: raw.html ?? "",
    css: raw.css ?? "",
    jsonLayout: raw.jsonLayout ?? raw.layoutJson ?? raw.layout_json ?? {},
    status: raw.status ?? "DRAFT",
    category: raw.category,
    tags: raw.tags ?? [],
    themeName: raw.themeName ?? raw.theme_name,
    themeJson: raw.themeJson ?? raw.theme_json,
    generatedCss: raw.generatedCss ?? raw.generated_css,
    version: raw.version,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export const emailTemplateService = {
  async list(communityId: number): Promise<EmailTemplateRecord[]> {
    const result = await apiClient.get<any>(`/email/templates?communityId=${communityId}`);
    const rows = Array.isArray(result) ? result : result?.templates ?? result?.content ?? [];
    return rows.map(normalizeTemplate);
  },

  async save(payload: EmailTemplatePayload): Promise<EmailTemplateRecord> {
    const body = {
      communityId: payload.communityId,
      templateName: payload.templateName,
      name: payload.templateName,
      subject: payload.subject,
      html: payload.html,
      css: payload.css,
      jsonLayout: payload.jsonLayout,
      layoutJson: payload.jsonLayout,
      status: payload.status ?? "DRAFT",
      category: payload.category,
      tags: payload.tags ?? [],
      themeName: payload.themeName,
      themeJson: payload.themeJson,
      generatedCss: payload.generatedCss,
    };

    const result = payload.id
      ? await apiClient.put<any>(`/email/templates/${payload.id}`, body)
      : await apiClient.post<any>("/email/templates", body);

    return normalizeTemplate(result);
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/email/templates/${id}`);
  },

  async uploadAsset(file: File, communityId: number): Promise<UploadedAssetResponse> {
    const form = new FormData();
    form.append("file", file);
    form.append("communityId", String(communityId));
    return apiClient.postForm<UploadedAssetResponse>("/email/templates/assets", form);
  },
};
