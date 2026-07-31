import {
  BadgeDollarSign,
  CalendarDays,
  Contact,
  FileText,
  GalleryHorizontalEnd,
  Heading1,
  Image,
  LayoutTemplate,
  ListTree,
  MailCheck,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface EmailBlockDefinition {
  id: string;
  label: string;
  category: string;
  icon: LucideIcon;
  content: string;
}

export interface DynamicFieldGroup {
  group: string;
  fields: { label: string; token: string }[];
}

export interface TemplateCategory {
  id: string;
  module: string;
  color: string;
  items: string[];
}

export interface CommunityThemeSetting {
  key: string;
  label: string;
  value: string;
  type: "text" | "color" | "select" | "number";
  options?: string[];
}

export const starterTemplateHtml = `
  <table role="presentation" style="width:100%;border-collapse:collapse;background:#f6f7fb;font-family:Arial,sans-serif;">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" style="width:100%;max-width:640px;border-collapse:collapse;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:26px 32px;background:#0f766e;color:#ffffff;">
              <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">{{communityName}}</div>
              <h1 style="margin:10px 0 0;font-size:30px;line-height:1.15;">{{tournamentName}}</h1>
              <p style="margin:10px 0 0;font-size:15px;line-height:1.6;color:#d1fae5;">Registration opens on {{registrationDate}} at {{venue}}.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;color:#111827;">
              <h2 style="font-size:20px;margin:0 0 10px;">Hello {{userName}},</h2>
              <p style="font-size:15px;line-height:1.7;margin:0 0 18px;color:#4b5563;">Join your community for a polished tournament experience with schedules, reminders, payment updates, and live results in one place.</p>
              <a href="{{registrationUrl}}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:10px;padding:12px 18px;font-size:14px;font-weight:700;">Register Now</a>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;background:#f9fafb;color:#6b7280;font-size:12px;line-height:1.6;">
              Sent by {{communityName}}. Need help? Contact {{supportEmail}}.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

export const starterTemplateCss = `
  body { margin: 0; background: #f6f7fb; }
  a { color: inherit; }
`;

export const emailBlocks: EmailBlockDefinition[] = [
  {
    id: "community-header",
    label: "Community Header",
    category: "Foundation",
    icon: Users,
    content: `<table role="presentation" style="width:100%;max-width:640px;margin:0 auto;background:#ffffff;border-collapse:collapse;"><tr><td style="padding:20px 28px;border-bottom:1px solid #e5e7eb;"><div style="font-size:12px;font-weight:700;color:#0f766e;text-transform:uppercase;">{{communityName}}</div><div style="font-size:22px;font-weight:800;color:#111827;margin-top:4px;">Mana Community</div></td></tr></table>`,
  },
  {
    id: "hero-banner",
    label: "Hero Banner",
    category: "Content",
    icon: Image,
    content: `<table role="presentation" style="width:100%;max-width:640px;margin:0 auto;background:#0f172a;border-collapse:collapse;"><tr><td style="padding:42px 32px;color:#ffffff;background-image:linear-gradient(135deg,#0f766e,#2563eb);"><div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#cffafe;">Announcement</div><h1 style="font-size:34px;line-height:1.1;margin:10px 0 10px;">{{tournamentName}}</h1><p style="font-size:16px;line-height:1.6;margin:0;color:#e0f2fe;">A community event crafted for players, families, and fans.</p></td></tr></table>`,
  },
  {
    id: "tournament-card",
    label: "Tournament Card",
    category: "Sports",
    icon: Trophy,
    content: `<table role="presentation" style="width:100%;max-width:640px;margin:0 auto;background:#ffffff;border-collapse:collapse;"><tr><td style="padding:26px 30px;"><div style="border:1px solid #dbeafe;border-radius:14px;padding:22px;background:#eff6ff;"><div style="font-size:13px;font-weight:800;color:#1d4ed8;">Tournament</div><h2 style="font-size:23px;margin:8px 0;color:#111827;">{{tournamentName}}</h2><p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">Venue: {{venue}}<br/>Registration closes: {{registrationDate}}</p></div></td></tr></table>`,
  },
  {
    id: "sports-events",
    label: "Sports Events",
    category: "Sports",
    icon: ShieldCheck,
    content: `<table role="presentation" style="width:100%;max-width:640px;margin:0 auto;background:#ffffff;border-collapse:collapse;"><tr><td style="padding:24px 30px;"><h2 style="font-size:20px;margin:0 0 14px;color:#111827;">Sports Events</h2><table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td style="padding:12px;border:1px solid #e5e7eb;border-radius:10px;color:#334155;">Cricket League</td><td style="padding:12px;color:#64748b;">{{eventDate}}</td></tr><tr><td style="padding:12px;border:1px solid #e5e7eb;border-radius:10px;color:#334155;">Badminton Doubles</td><td style="padding:12px;color:#64748b;">{{scheduleDate}}</td></tr></table></td></tr></table>`,
  },
  {
    id: "timeline",
    label: "Timeline",
    category: "Content",
    icon: CalendarDays,
    content: `<table role="presentation" style="width:100%;max-width:640px;margin:0 auto;background:#ffffff;border-collapse:collapse;"><tr><td style="padding:24px 30px;"><h2 style="font-size:20px;margin:0 0 14px;color:#111827;">Timeline</h2><p style="margin:0 0 10px;color:#475569;"><strong>1.</strong> Registration: {{registrationDate}}</p><p style="margin:0 0 10px;color:#475569;"><strong>2.</strong> Fixtures: {{scheduleDate}}</p><p style="margin:0;color:#475569;"><strong>3.</strong> Finals: {{eventDate}}</p></td></tr></table>`,
  },
  {
    id: "gallery",
    label: "Gallery",
    category: "Media",
    icon: GalleryHorizontalEnd,
    content: `<table role="presentation" style="width:100%;max-width:640px;margin:0 auto;background:#ffffff;border-collapse:collapse;"><tr><td style="padding:24px 30px;"><h2 style="font-size:20px;margin:0 0 14px;color:#111827;">Gallery</h2><table role="presentation" style="width:100%;"><tr><td style="width:33%;height:96px;background:#dbeafe;border-radius:12px;"></td><td style="width:2%;"></td><td style="width:33%;height:96px;background:#dcfce7;border-radius:12px;"></td><td style="width:2%;"></td><td style="width:33%;height:96px;background:#fee2e2;border-radius:12px;"></td></tr></table></td></tr></table>`,
  },
  {
    id: "sponsors",
    label: "Sponsors",
    category: "Media",
    icon: Sparkles,
    content: `<table role="presentation" style="width:100%;max-width:640px;margin:0 auto;background:#ffffff;border-collapse:collapse;"><tr><td style="padding:24px 30px;"><h2 style="font-size:20px;margin:0 0 14px;color:#111827;">Sponsors</h2><div data-repeat="sponsors" style="padding:16px;border:1px dashed #cbd5e1;border-radius:14px;color:#64748b;">Repeats for each sponsor: {{sponsorName}}</div></td></tr></table>`,
  },
  {
    id: "qr-code",
    label: "QR Code",
    category: "Action",
    icon: QrCode,
    content: `<table role="presentation" style="width:100%;max-width:640px;margin:0 auto;background:#ffffff;border-collapse:collapse;"><tr><td align="center" style="padding:24px 30px;"><div style="display:inline-block;padding:16px;border:1px solid #e5e7eb;border-radius:14px;background:#f8fafc;"><img src="{{qrCodeUrl}}" alt="QR code" width="132" style="display:block;border:0;" /><p style="margin:10px 0 0;color:#475569;font-size:13px;">Scan to open details</p></div></td></tr></table>`,
  },
  {
    id: "button",
    label: "Button",
    category: "Action",
    icon: MailCheck,
    content: `<table role="presentation" style="width:100%;max-width:640px;margin:0 auto;background:#ffffff;border-collapse:collapse;"><tr><td align="center" style="padding:26px;"><a href="{{registrationUrl}}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:10px;padding:13px 20px;font-size:14px;font-weight:800;">Register Now</a></td></tr></table>`,
  },
  {
    id: "invoice-summary",
    label: "Invoice Summary",
    category: "Finance",
    icon: BadgeDollarSign,
    content: `<table role="presentation" style="width:100%;max-width:640px;margin:0 auto;background:#ffffff;border-collapse:collapse;"><tr><td style="padding:24px 30px;"><h2 style="font-size:20px;margin:0 0 14px;color:#111827;">Invoice Summary</h2><p style="margin:0 0 8px;color:#475569;">Invoice: {{invoiceNumber}}</p><p style="margin:0 0 8px;color:#475569;">Due Date: {{dueDate}}</p><div style="font-size:28px;font-weight:800;color:#0f766e;">{{amountDue}}</div></td></tr></table>`,
  },
  {
    id: "payment-receipt",
    label: "Payment Receipt",
    category: "Finance",
    icon: ReceiptText,
    content: `<table role="presentation" style="width:100%;max-width:640px;margin:0 auto;background:#ffffff;border-collapse:collapse;"><tr><td style="padding:24px 30px;"><div style="border:1px solid #bbf7d0;background:#f0fdf4;border-radius:14px;padding:20px;"><h2 style="font-size:20px;margin:0 0 10px;color:#166534;">Payment Successful</h2><p style="margin:0;color:#475569;">Receipt {{receiptNumber}} for {{amountPaid}} has been recorded.</p></div></td></tr></table>`,
  },
  {
    id: "invoice-items",
    label: "Invoice Items",
    category: "Finance",
    icon: ListTree,
    content: `<table role="presentation" style="width:100%;max-width:640px;margin:0 auto;background:#ffffff;border-collapse:collapse;"><tr><td style="padding:24px 30px;"><h2 style="font-size:20px;margin:0 0 14px;color:#111827;">Invoice Items</h2><table role="presentation" data-repeat="invoiceItems" style="width:100%;border-collapse:collapse;"><tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#334155;">{{itemName}}</td><td align="right" style="padding:10px;border-bottom:1px solid #e5e7eb;color:#111827;font-weight:700;">{{amount}}</td></tr></table></td></tr></table>`,
  },
  {
    id: "contact-information",
    label: "Contact Information",
    category: "Foundation",
    icon: Contact,
    content: `<table role="presentation" style="width:100%;max-width:640px;margin:0 auto;background:#ffffff;border-collapse:collapse;"><tr><td style="padding:22px 30px;"><div style="padding:16px;border-left:4px solid #0f766e;background:#f8fafc;"><strong style="color:#111827;">Need help?</strong><p style="margin:6px 0 0;color:#64748b;font-size:13px;line-height:1.6;">Contact {{supportEmail}} or visit the community desk.</p></div></td></tr></table>`,
  },
  {
    id: "legal-disclaimer",
    label: "Legal Disclaimer",
    category: "Foundation",
    icon: FileText,
    content: `<table role="presentation" style="width:100%;max-width:640px;margin:0 auto;background:#f8fafc;border-collapse:collapse;"><tr><td style="padding:18px 30px;color:#94a3b8;font-size:11px;line-height:1.6;">This message was sent for community administration and resident services. Please do not share payment links or OTP codes with anyone.</td></tr></table>`,
  },
  {
    id: "section-heading",
    label: "Section Heading",
    category: "Content",
    icon: Heading1,
    content: `<table role="presentation" style="width:100%;max-width:640px;margin:0 auto;background:#ffffff;border-collapse:collapse;"><tr><td style="padding:24px 30px 8px;"><h2 style="font-size:22px;line-height:1.25;margin:0;color:#111827;">Section Title</h2><p style="font-size:14px;line-height:1.6;color:#64748b;margin:8px 0 0;">Add a short supporting line here.</p></td></tr></table>`,
  },
  {
    id: "community-footer",
    label: "Community Footer",
    category: "Foundation",
    icon: LayoutTemplate,
    content: `<table role="presentation" style="width:100%;max-width:640px;margin:0 auto;background:#f8fafc;border-collapse:collapse;"><tr><td style="padding:22px 30px;text-align:center;color:#64748b;font-size:12px;line-height:1.6;">Sent by {{communityName}}<br/>{{supportEmail}}</td></tr></table>`,
  },
];

export const dynamicFieldGroups: DynamicFieldGroup[] = [
  {
    group: "Tournament",
    fields: [
      { label: "Tournament Name", token: "{{tournamentName}}" },
      { label: "Venue", token: "{{venue}}" },
      { label: "Registration Date", token: "{{registrationDate}}" },
      { label: "Registration URL", token: "{{registrationUrl}}" },
      { label: "Schedule Date", token: "{{scheduleDate}}" },
      { label: "Event Date", token: "{{eventDate}}" },
    ],
  },
  {
    group: "Community",
    fields: [
      { label: "Community Name", token: "{{communityName}}" },
      { label: "Community Logo", token: "{{communityLogo}}" },
      { label: "Support Email", token: "{{supportEmail}}" },
      { label: "Community Address", token: "{{communityAddress}}" },
    ],
  },
  {
    group: "User",
    fields: [
      { label: "User Name", token: "{{userName}}" },
      { label: "First Name", token: "{{firstName}}" },
      { label: "Last Name", token: "{{lastName}}" },
      { label: "Flat Number", token: "{{flatNo}}" },
      { label: "Block", token: "{{block}}" },
      { label: "Email", token: "{{email}}" },
    ],
  },
  {
    group: "Payment",
    fields: [
      { label: "Amount", token: "{{amount}}" },
      { label: "Invoice Number", token: "{{invoiceNumber}}" },
      { label: "Transaction ID", token: "{{transactionId}}" },
      { label: "Amount Due", token: "{{amountDue}}" },
      { label: "Amount Paid", token: "{{amountPaid}}" },
      { label: "Due Date", token: "{{dueDate}}" },
      { label: "Receipt Number", token: "{{receiptNumber}}" },
    ],
  },
  {
    group: "Inventory",
    fields: [
      { label: "Item Name", token: "{{itemName}}" },
      { label: "Quantity", token: "{{quantity}}" },
      { label: "Reorder Level", token: "{{reorderLevel}}" },
    ],
  },
  {
    group: "Maintenance",
    fields: [
      { label: "Ticket ID", token: "{{ticketId}}" },
      { label: "Issue Title", token: "{{issueTitle}}" },
      { label: "Assigned To", token: "{{assignedTo}}" },
    ],
  },
];

export const emailTemplateCategories: TemplateCategory[] = [
  { id: "tournament", module: "Tournament", color: "#2563eb", items: ["Registration", "Announcement", "Fixtures", "Winners"] },
  { id: "finance", module: "Finance", color: "#0f766e", items: ["Invoice", "Payment Success", "Payment Failed", "Refund"] },
  { id: "user", module: "User", color: "#7c3aed", items: ["Welcome", "OTP", "Password Reset", "Email Verification"] },
  { id: "community", module: "Community", color: "#db2777", items: ["Maintenance", "Notice", "Event Invitation", "Newsletter"] },
  { id: "inventory", module: "Inventory", color: "#ea580c", items: ["Purchase Order", "Low Stock", "Asset Allocation"] },
];

export const communityThemeDefaults: CommunityThemeSetting[] = [
  { key: "logo", label: "Logo", value: "{{communityLogo}}", type: "text" },
  { key: "primaryColor", label: "Primary Color", value: "#0f766e", type: "color" },
  { key: "secondaryColor", label: "Secondary Color", value: "#2563eb", type: "color" },
  { key: "font", label: "Font", value: "Arial", type: "select", options: ["Arial", "Inter", "Georgia", "Trebuchet"] },
  { key: "buttonStyle", label: "Button Style", value: "Filled", type: "select", options: ["Filled", "Outline", "Soft"] },
  { key: "borderRadius", label: "Border Radius", value: "12", type: "number" },
  { key: "headerStyle", label: "Header Style", value: "Brand Bar", type: "select", options: ["Brand Bar", "Logo Center", "Minimal"] },
  { key: "footerStyle", label: "Footer Style", value: "Compliance", type: "select", options: ["Compliance", "Social", "Minimal"] },
  { key: "emailWidth", label: "Email Width", value: "640", type: "number" },
  { key: "defaultBanner", label: "Default Banner", value: "{{defaultBanner}}", type: "text" },
];

export const templateStarters = [
  { name: "Tournament Announcement", category: "Tournament", tags: ["sports", "announcement"] },
  { name: "Welcome Email", category: "User", tags: ["onboarding"] },
  { name: "Invoice", category: "Finance", tags: ["billing"] },
  { name: "Payment Success", category: "Finance", tags: ["receipt"] },
  { name: "OTP", category: "User", tags: ["security"] },
  { name: "Password Reset", category: "User", tags: ["security"] },
  { name: "Maintenance Notice", category: "Community", tags: ["maintenance"] },
  { name: "Newsletter", category: "Community", tags: ["newsletter"] },
];

export const approvalSteps = ["Draft", "Review", "Approved", "Published", "Archived"];

export const sampleDatasets = [
  {
    id: "community-a-tournament",
    label: "Community A Tournament",
    values: {
      communityName: "Mana Heights",
      firstName: "Aarav",
      lastName: "Mehta",
      userName: "Aarav Mehta",
      tournamentName: "Summer Cricket League",
      venue: "Central Turf",
      registrationDate: "25 Jul 2026",
      registrationUrl: "https://mana.community/register",
      supportEmail: "help@mana.community",
      amount: "Rs 1,250",
      invoiceNumber: "INV-2026-1042",
      transactionId: "TXN-88A21",
    },
  },
  {
    id: "community-b-invoice",
    label: "Community B Invoice",
    values: {
      communityName: "Lakeview Enclave",
      firstName: "Nisha",
      lastName: "Rao",
      userName: "Nisha Rao",
      tournamentName: "Family Sports Day",
      venue: "Clubhouse",
      registrationDate: "28 Jul 2026",
      registrationUrl: "https://mana.community/events",
      supportEmail: "accounts@lakeview.example",
      amount: "Rs 3,840",
      amountDue: "Rs 3,840",
      invoiceNumber: "LVE-2026-088",
      transactionId: "TXN-41F92",
    },
  },
];

export const emailClients = ["Gmail", "Outlook", "Apple Mail", "Yahoo Mail"];

export const repeatableCollections = ["Sports List", "Announcements", "Timeline", "Invoice Items", "Participants", "Sponsors", "Winners", "Gallery"];

export const conditionalRules = [
  "IF amount > 0 show Payment Section",
  "IF tournamentType == Cricket show Cricket Rules",
  "IF user.isPremium show Premium Banner",
];

export const imageLibraryAssets = [
  { name: "Tournament Banner", folder: "Banners", tags: ["sports", "hero"], type: "Banner" },
  { name: "Community Logo", folder: "Logos", tags: ["brand"], type: "Logo" },
  { name: "Sponsor Strip", folder: "Sponsors", tags: ["partner"], type: "Sponsor" },
  { name: "Payment QR", folder: "QR Codes", tags: ["payment"], type: "QR Code" },
  { name: "Maintenance Icon Set", folder: "Icons", tags: ["notice"], type: "Icon" },
];

export const analyticsMetrics = [
  { label: "Sent", value: "12.8k" },
  { label: "Delivered", value: "12.1k" },
  { label: "Opened", value: "7.4k" },
  { label: "Clicked", value: "2.2k" },
  { label: "Bounced", value: "184" },
  { label: "Failed", value: "42" },
  { label: "Spam", value: "9" },
  { label: "Unsubscribed", value: "31" },
];

export const auditEvents = [
  { user: "Community Admin", action: "Published Tournament Announcement", version: "V4", date: "22 Jul 2026" },
  { user: "Reviewer", action: "Approved Finance Invoice", version: "V2", date: "21 Jul 2026" },
  { user: "Designer", action: "Updated Header Block", version: "V7", date: "20 Jul 2026" },
];

export const permissionMatrix = [
  { role: "Designer", access: "Create, edit drafts, manage blocks" },
  { role: "Reviewer", access: "Review, comment, request changes" },
  { role: "Community Admin", access: "Approve, publish, send tests" },
  { role: "Super Admin", access: "Global themes, permissions, audit logs" },
];
