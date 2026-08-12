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

export const SYSTEM_TEMPLATES_CATALOG: EmailTemplateInfo[] = [
  // Sports Templates
  {
    key: "REGISTRATION_RECEIVED",
    subject: "We received your registration",
    templateFile: "email/registration-received.html",
    category: "REGISTRATION",
    triggerMenuPath: "Sports → Register",
    triggerWired: true,
    triggerDescription: "A player submits a registration for an event that requires admin approval; entry lands PENDING.",
    customTemplateExists: false, customTemplateId: null, customTemplateName: null, customTemplateStatus: null, appliedSource: "DEFAULT"
  },
  {
    key: "REGISTRATION_CONFIRMED",
    subject: "You're confirmed!",
    templateFile: "email/registration-confirmed.html",
    category: "REGISTRATION",
    triggerMenuPath: "Sports → Register · Admin → Registrations",
    triggerWired: true,
    triggerDescription: "The registration auto-confirms or an admin confirms a PENDING entry.",
    customTemplateExists: false, customTemplateId: null, customTemplateName: null, customTemplateStatus: null, appliedSource: "DEFAULT"
  },
  {
    key: "REGISTRATION_REJECTED",
    subject: "Update on your registration",
    templateFile: "email/registration-rejected.html",
    category: "REGISTRATION",
    triggerMenuPath: "Sports → Admin → Registrations",
    triggerWired: true,
    triggerDescription: "An admin rejects a pending registration with a reason.",
    customTemplateExists: false, customTemplateId: null, customTemplateName: null, customTemplateStatus: null, appliedSource: "DEFAULT"
  },
  {
    key: "SCHEDULE_PUBLISHED",
    subject: "Match schedule is live",
    templateFile: "email/schedule-published.html",
    category: "TOURNAMENT",
    triggerMenuPath: "Sports → Schedule",
    triggerWired: true,
    triggerDescription: "An admin publishes the match schedule/fixtures for a tournament.",
    customTemplateExists: false, customTemplateId: null, customTemplateName: null, customTemplateStatus: null, appliedSource: "DEFAULT"
  },
  {
    key: "MATCH_REMINDER",
    subject: "Your match starts soon",
    templateFile: "email/match-reminder.html",
    category: "MATCH",
    triggerMenuPath: "Sports → Auction · Sports → Schedule",
    triggerWired: true,
    triggerDescription: "Automatic background job — fires shortly before a match's scheduled start.",
    customTemplateExists: false, customTemplateId: null, customTemplateName: null, customTemplateStatus: null, appliedSource: "DEFAULT"
  },
  {
    key: "WINNER_NOTIFICATION",
    subject: "You won your match! 🎉",
    templateFile: "email/winner-notification.html",
    category: "MATCH",
    triggerMenuPath: "Sports → Schedule (bracket / match result)",
    triggerWired: true,
    triggerDescription: "An admin records a completed match result; winning side's players are emailed.",
    customTemplateExists: false, customTemplateId: null, customTemplateName: null, customTemplateStatus: null, appliedSource: "DEFAULT"
  },
  {
    key: "TOURNAMENT_COMPLETION",
    subject: "Tournament results are in",
    templateFile: "email/tournament-completion.html",
    category: "TOURNAMENT",
    triggerMenuPath: "Sports → Schedule (bracket)",
    triggerWired: true,
    triggerDescription: "Fires automatically to all confirmed participants once the FINAL round's result is recorded.",
    customTemplateExists: false, customTemplateId: null, customTemplateName: null, customTemplateStatus: null, appliedSource: "DEFAULT"
  },
  {
    key: "TOURNAMENT_OPEN",
    subject: "Registration is now open!",
    templateFile: "email/tournament-open.html",
    category: "TOURNAMENT",
    triggerMenuPath: "Sports → Admin → Tournament management",
    triggerWired: true,
    triggerDescription: "An admin clicks 'Notify Registration Open' for a tournament.",
    customTemplateExists: false, customTemplateId: null, customTemplateName: null, customTemplateStatus: null, appliedSource: "DEFAULT"
  },
  {
    key: "TOURNAMENT_ANNOUNCEMENT",
    subject: "Tournament announcement",
    templateFile: "email/tournament-announcement.html",
    category: "ANNOUNCEMENT",
    triggerMenuPath: "Sports → Admin → Tournament Announcement",
    triggerWired: true,
    triggerDescription: "Default template for free-form tournament announcements.",
    customTemplateExists: false, customTemplateId: null, customTemplateName: null, customTemplateStatus: null, appliedSource: "DEFAULT"
  },
  {
    key: "EMAIL_OTP",
    subject: "Your verification code",
    templateFile: "email/email-otp.html",
    category: "AUTH",
    triggerMenuPath: "Sports → Register (registration form)",
    triggerWired: true,
    triggerDescription: "A player requests an email verification code before submitting registration.",
    customTemplateExists: false, customTemplateId: null, customTemplateName: null, customTemplateStatus: null, appliedSource: "DEFAULT"
  },

  // Event Templates (8 Entries)
  {
    key: "EVENT_ANNOUNCEMENT",
    subject: "You're Invited — {{eventName}}!",
    templateFile: "email/event-announcement.html",
    category: "EVENT",
    triggerMenuPath: "Events → Announcements",
    triggerWired: true,
    triggerDescription: "Sent when an admin publishes a new community event or festival announcement to all residents.",
    customTemplateExists: false, customTemplateId: null, customTemplateName: null, customTemplateStatus: null, appliedSource: "DEFAULT"
  },
  {
    key: "EVENT_REMINDER",
    subject: "Reminder: {{eventName}} is Coming Up!",
    templateFile: "email/event-reminder.html",
    category: "EVENT",
    triggerMenuPath: "Events → Reminders",
    triggerWired: true,
    triggerDescription: "Triggered manually by admin or automatically N days before an event's date; sent to invited/registered residents.",
    customTemplateExists: false, customTemplateId: null, customTemplateName: null, customTemplateStatus: null, appliedSource: "DEFAULT"
  },
  {
    key: "EVENT_DONATION_APPEAL",
    subject: "Support {{eventName}} — Donate Now",
    templateFile: "email/event-donation-appeal.html",
    category: "EVENT",
    triggerMenuPath: "Events → Donations",
    triggerWired: true,
    triggerDescription: "Sent when an admin opens a donation drive for an upcoming community event.",
    customTemplateExists: false, customTemplateId: null, customTemplateName: null, customTemplateStatus: null, appliedSource: "DEFAULT"
  },
  {
    key: "EVENT_REGISTRATION_CONFIRMED",
    subject: "You're Registered for {{eventName}}! 🎉",
    templateFile: "email/event-registration-confirmed.html",
    category: "EVENT",
    triggerMenuPath: "Events → RSVP / Registration",
    triggerWired: true,
    triggerDescription: "Auto-sent to the resident immediately after a successful RSVP or registration submission for an event.",
    customTemplateExists: false, customTemplateId: null, customTemplateName: null, customTemplateStatus: null, appliedSource: "DEFAULT"
  },
  {
    key: "EVENT_VOLUNTEER_INVITATION",
    subject: "Join Us as a Volunteer for {{eventName}}",
    templateFile: "email/event-volunteer-invitation.html",
    category: "EVENT",
    triggerMenuPath: "Events → Volunteers",
    triggerWired: true,
    triggerDescription: "Sent by an admin to residents who are invited to volunteer at a community event.",
    customTemplateExists: false, customTemplateId: null, customTemplateName: null, customTemplateStatus: null, appliedSource: "DEFAULT"
  },
  {
    key: "EVENT_THANK_YOU",
    subject: "Thank You for Joining {{eventName}}! 🙏",
    templateFile: "email/event-thank-you.html",
    category: "EVENT",
    triggerMenuPath: "Events → Post-Event",
    triggerWired: true,
    triggerDescription: "Sent after an event concludes to attendees and volunteers; may include highlights and a feedback link.",
    customTemplateExists: false, customTemplateId: null, customTemplateName: null, customTemplateStatus: null, appliedSource: "DEFAULT"
  },
  {
    key: "EVENT_SCHEDULE_UPDATE",
    subject: "Update: {{eventName}} Schedule Changed",
    templateFile: "email/event-schedule-update.html",
    category: "EVENT",
    triggerMenuPath: "Events → Admin → Edit Event",
    triggerWired: false,
    triggerDescription: "Not yet wired to an automatic trigger — reachable from this admin test-send tool while the schedule-change flow is under development.",
    customTemplateExists: false, customTemplateId: null, customTemplateName: null, customTemplateStatus: null, appliedSource: "DEFAULT"
  },
  {
    key: "EVENT_CANCELLATION",
    subject: "Important: {{eventName}} Has Been Cancelled",
    templateFile: "email/event-cancellation.html",
    category: "EVENT",
    triggerMenuPath: "Events → Admin → Cancel Event",
    triggerWired: false,
    triggerDescription: "Not yet wired to an automatic trigger — reachable from this admin test-send tool while the cancellation flow is under development.",
    customTemplateExists: false, customTemplateId: null, customTemplateName: null, customTemplateStatus: null, appliedSource: "DEFAULT"
  }
];

export const emailAdminService = {
  async getTemplates(communityId?: number): Promise<{ count: number; templates: EmailTemplateInfo[] }> {
    const url = communityId != null ? `/admin/email/templates?communityId=${communityId}` : "/admin/email/templates";
    try {
      const res = await apiClient.get<{ count?: number; templates?: EmailTemplateInfo[] } | EmailTemplateInfo[]>(url);
      let list: EmailTemplateInfo[] = [];
      if (Array.isArray(res)) list = res;
      else if (res && Array.isArray(res.templates)) list = res.templates;

      if (list.length === 0) {
        return { count: SYSTEM_TEMPLATES_CATALOG.length, templates: SYSTEM_TEMPLATES_CATALOG };
      }
      return { count: list.length, templates: list };
    } catch {
      return { count: SYSTEM_TEMPLATES_CATALOG.length, templates: SYSTEM_TEMPLATES_CATALOG };
    }
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
