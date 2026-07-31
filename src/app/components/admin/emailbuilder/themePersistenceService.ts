// themePersistenceService.ts — CRUD for /api/email/themes
import { apiClient } from "../../../../services/apiClient";
import type { ThemeSettings } from "./themeEngine";

export interface EmailThemeRecord {
  id?: number;
  communityId: number;
  name: string;
  themeJson: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmailThemePayload {
  id?: number;
  communityId: number;
  name: string;
  themeJson: string;
  isDefault?: boolean;
}

function parseSettings(record: EmailThemeRecord): ThemeSettings {
  try {
    return JSON.parse(record.themeJson) as ThemeSettings;
  } catch {
    return {} as ThemeSettings;
  }
}

export const themePersistenceService = {
  async list(communityId: number): Promise<EmailThemeRecord[]> {
    try {
      const result = await apiClient.get<any>(`/email/themes?communityId=${communityId}`);
      const rows = Array.isArray(result) ? result : result?.content ?? result?.themes ?? [];
      return rows as EmailThemeRecord[];
    } catch {
      return [];
    }
  },

  async save(payload: EmailThemePayload): Promise<EmailThemeRecord> {
    const result = payload.id
      ? await apiClient.put<EmailThemeRecord>(`/email/themes/${payload.id}`, payload)
      : await apiClient.post<EmailThemeRecord>("/email/themes", payload);
    return result;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/email/themes/${id}`);
  },

  async applyToTemplate(themeId: number, templateId: number): Promise<void> {
    await apiClient.post(`/email/themes/${themeId}/apply?templateId=${templateId}`, {});
  },

  settingsFromRecord: parseSettings,

  recordFromSettings(settings: ThemeSettings, communityId: number, id?: number): EmailThemePayload {
    return {
      id,
      communityId,
      name: settings.themeName,
      themeJson: JSON.stringify(settings),
      isDefault: false,
    };
  },
};
