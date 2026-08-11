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

export interface EmailApplicabilityOption {
  moduleKey: string;
  moduleLabel: string;
  menuKey: string;
  menuLabel: string;
  subMenuKey: string;
  subMenuLabel: string;
  useCase: string;
  triggerKey: string;
  templateKey: string;
  category: string;
  defaultName: string;
  defaultSubject: string;
  tags: string[];
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

/* ── Event module starter HTML templates ─────────────────────────────────── */

export const eventAnnouncementHtml = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf3e3;padding:30px 0;font-family:Georgia,'Times New Roman',serif;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#b8860b,#ff9933);padding:35px 20px;text-align:center;">
              <div style="font-size:42px;line-height:1;">🐘🌺</div>
              <h1 style="color:#ffffff;margin:10px 0 0;font-size:28px;letter-spacing:1px;text-shadow:1px 1px 3px rgba(0,0,0,0.2);">{{eventName}}</h1>
              <p style="color:#fff3d6;margin:6px 0 0;font-size:15px;">{{communityName}}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 35px;color:#4a2c00;">
              <p style="font-size:16px;margin:0 0 18px;">Dear Resident <strong>{{residentName}}</strong>,</p>
              <p style="font-size:15px;line-height:1.7;margin:0 0 18px;">We are delighted to announce <strong>{{eventName}}</strong> at <strong>{{communityName}}</strong>. Join us for this joyous community celebration!</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff8ec;border:1px solid #f0d9a8;border-radius:8px;margin:20px 0;">
                <tr>
                  <td style="padding:20px 25px;">
                    <table role="presentation" width="100%" cellpadding="6" cellspacing="0" style="font-size:15px;color:#4a2c00;">
                      <tr><td style="width:34%;font-weight:bold;vertical-align:top;">📅 Date</td><td>{{eventDate}}</td></tr>
                      <tr><td style="font-weight:bold;vertical-align:top;">🙏 Puja Muhurat</td><td>{{pujaMuhurat}}</td></tr>
                      <tr><td style="font-weight:bold;vertical-align:top;">📍 Venue</td><td>{{venue}}</td></tr>
                      <tr><td style="font-weight:bold;vertical-align:top;">⏰ Time</td><td>{{eventTime}}</td></tr>
                      <tr><td style="font-weight:bold;vertical-align:top;">🎉 Visarjan</td><td>{{visarjanDate}}</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="font-size:15px;line-height:1.7;margin:0 0 22px;">We warmly invite you and your family to be a part of this beautiful celebration and seek the blessings of prosperity and success together.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:10px 0 28px;">
                <tr>
                  <td style="background-color:#ff9933;border-radius:6px;">
                    <a href="{{rsvpLink}}" style="display:inline-block;padding:12px 30px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;">RSVP Now</a>
                  </td>
                </tr>
              </table>
              <p style="font-size:15px;margin:0;">Warm regards,</p>
              <p style="font-size:15px;margin:2px 0 0;font-weight:bold;">{{senderName}}</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#fff3d6;text-align:center;padding:18px;font-size:12px;color:#8a6d3b;">
              Sent by {{communityName}} · {{supportEmail}}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

export const eventDonationHtml = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf3e3;padding:30px 0;font-family:Georgia,'Times New Roman',serif;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#a3341c,#e07a3f);padding:35px 20px;text-align:center;">
              <div style="font-size:42px;line-height:1;">🐘🙏</div>
              <h1 style="color:#ffffff;margin:10px 0 0;font-size:26px;letter-spacing:1px;text-shadow:1px 1px 3px rgba(0,0,0,0.2);">{{eventName}}</h1>
              <p style="color:#ffe9d9;margin:6px 0 0;font-size:15px;">Donation Appeal</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 35px;color:#4a2c00;">
              <p style="font-size:16px;margin:0 0 18px;">Dear Resident <strong>{{residentName}}</strong>,</p>
              <p style="font-size:15px;line-height:1.7;margin:0 0 18px;">As we prepare to celebrate <strong>{{eventName}}</strong> at <strong>{{communityName}}</strong>, we humbly seek your generous contribution towards making this celebration grand and memorable for everyone.</p>
              <p style="font-size:15px;line-height:1.7;margin:0 0 18px;">Your donation will support the decorations, puja samagri, prasadam, cultural programs, and community arrangements.</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff2e9;border:1px solid #f2c7a6;border-radius:8px;margin:20px 0;">
                <tr>
                  <td style="padding:20px 25px;">
                    <table role="presentation" width="100%" cellpadding="6" cellspacing="0" style="font-size:15px;color:#4a2c00;">
                      <tr><td style="width:40%;font-weight:bold;vertical-align:top;">🎯 Suggested Contribution</td><td>{{suggestedAmount}}</td></tr>
                      <tr><td style="font-weight:bold;vertical-align:top;">📅 Last Date to Contribute</td><td>{{donationDeadline}}</td></tr>
                      <tr><td style="font-weight:bold;vertical-align:top;">💳 Payment Options</td><td>{{paymentOptions}}</td></tr>
                      <tr><td style="font-weight:bold;vertical-align:top;">🧾 UPI ID</td><td>{{upiId}}</td></tr>
                      <tr><td style="font-weight:bold;vertical-align:top;">📍 Collection Point</td><td>{{collectionPoint}}</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="font-size:15px;line-height:1.7;margin:0 0 22px;">Every contribution, big or small, is deeply appreciated and will be acknowledged with a receipt. Names of donors will be listed on our community notice board with their kind permission.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:10px 0 28px;">
                <tr>
                  <td style="background-color:#a3341c;border-radius:6px;">
                    <a href="{{donationLink}}" style="display:inline-block;padding:12px 30px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;">Donate Now</a>
                  </td>
                </tr>
              </table>
              <p style="font-size:14px;line-height:1.6;margin:0 0 18px;color:#6b4a2c;">For any queries, please contact <strong>{{contactPerson}}</strong> at {{contactNumber}} or {{contactEmail}}.</p>
              <p style="font-size:15px;margin:0;">With gratitude,</p>
              <p style="font-size:15px;margin:2px 0 0;font-weight:bold;">{{senderName}}</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffe9d9;text-align:center;padding:18px;font-size:12px;color:#a3341c;">
              Your generosity brings the community's celebration to life. · {{communityName}}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

export const eventReminderHtml = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf3e3;padding:30px 0;font-family:Georgia,'Times New Roman',serif;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#c9770a,#f2a93b);padding:35px 20px;text-align:center;">
              <div style="font-size:42px;line-height:1;">🐘⏰</div>
              <h1 style="color:#ffffff;margin:10px 0 0;font-size:26px;letter-spacing:1px;text-shadow:1px 1px 3px rgba(0,0,0,0.2);">{{eventName}}</h1>
              <p style="color:#fff3dc;margin:6px 0 0;font-size:15px;">Friendly Reminder</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 35px;color:#4a2c00;">
              <p style="font-size:16px;margin:0 0 18px;">Dear Resident <strong>{{residentName}}</strong>,</p>
              <p style="font-size:15px;line-height:1.7;margin:0 0 18px;">This is a gentle reminder that <strong>{{eventName}}</strong> at <strong>{{communityName}}</strong> is coming up soon! We hope to see you and your family join in the festivities.</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff3dc;border:1px dashed #f2a93b;border-radius:8px;margin:20px 0;">
                <tr>
                  <td style="padding:16px 20px;text-align:center;">
                    <p style="margin:0;font-size:16px;font-weight:bold;color:#c9770a;">⏳ {{reminderMessage}}</p>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff8ec;border:1px solid #f0d9a8;border-radius:8px;margin:20px 0;">
                <tr>
                  <td style="padding:20px 25px;">
                    <table role="presentation" width="100%" cellpadding="6" cellspacing="0" style="font-size:15px;color:#4a2c00;">
                      <tr><td style="width:38%;font-weight:bold;vertical-align:top;">📅 Event Date</td><td>{{eventDate}}</td></tr>
                      <tr><td style="font-weight:bold;vertical-align:top;">⏰ Time</td><td>{{eventTime}}</td></tr>
                      <tr><td style="font-weight:bold;vertical-align:top;">📍 Venue</td><td>{{venue}}</td></tr>
                      <tr><td style="font-weight:bold;vertical-align:top;">📝 Pending Action</td><td>{{pendingAction}}</td></tr>
                      <tr><td style="font-weight:bold;vertical-align:top;">🗓️ Deadline</td><td>{{deadlineDate}}</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="font-size:15px;line-height:1.7;margin:0 0 22px;">Kindly complete the pending action above at the earliest so we can finalize arrangements smoothly. Thank you for your cooperation!</p>
              <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:10px 0 28px;">
                <tr>
                  <td style="background-color:#c9770a;border-radius:6px;">
                    <a href="{{actionLink}}" style="display:inline-block;padding:12px 30px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;">{{actionButtonText}}</a>
                  </td>
                </tr>
              </table>
              <p style="font-size:14px;line-height:1.6;margin:0 0 18px;color:#6b4a2c;">For any questions, contact <strong>{{contactPerson}}</strong> at {{contactNumber}} or {{contactEmail}}.</p>
              <p style="font-size:15px;margin:0;">Warm regards,</p>
              <p style="font-size:15px;margin:2px 0 0;font-weight:bold;">{{senderName}}</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#fff3dc;text-align:center;padding:18px;font-size:12px;color:#c9770a;">
              We can't wait to celebrate with you! · {{communityName}}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

export const eventRegistrationConfirmedHtml = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;padding:30px 0;font-family:Georgia,'Times New Roman',serif;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#3F6B4A,#5a9e6b);padding:35px 20px;text-align:center;">
              <div style="font-size:42px;line-height:1;">✅🎊</div>
              <h1 style="color:#ffffff;margin:10px 0 0;font-size:26px;letter-spacing:1px;text-shadow:1px 1px 3px rgba(0,0,0,0.2);">Registration Confirmed!</h1>
              <p style="color:#d4efdc;margin:6px 0 0;font-size:15px;">{{eventName}}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 35px;color:#1a3c2a;">
              <p style="font-size:16px;margin:0 0 18px;">Dear <strong>{{residentName}}</strong>,</p>
              <p style="font-size:15px;line-height:1.7;margin:0 0 18px;">Great news! Your registration for <strong>{{eventName}}</strong> at <strong>{{communityName}}</strong> has been confirmed. We're excited to have you join us!</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin:20px 0;">
                <tr>
                  <td style="padding:20px 25px;">
                    <table role="presentation" width="100%" cellpadding="6" cellspacing="0" style="font-size:15px;color:#1a3c2a;">
                      <tr><td style="width:34%;font-weight:bold;vertical-align:top;">📅 Date</td><td>{{eventDate}}</td></tr>
                      <tr><td style="font-weight:bold;vertical-align:top;">⏰ Time</td><td>{{eventTime}}</td></tr>
                      <tr><td style="font-weight:bold;vertical-align:top;">📍 Venue</td><td>{{venue}}</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="font-size:15px;line-height:1.7;margin:0 0 22px;">We look forward to celebrating together. Save the date and spread the word!</p>
              <p style="font-size:15px;margin:0;">See you at the event,</p>
              <p style="font-size:15px;margin:2px 0 0;font-weight:bold;">{{senderName}}</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f0fdf4;text-align:center;padding:18px;font-size:12px;color:#3F6B4A;">
              Questions? Contact {{contactEmail}} · {{communityName}}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

export const eventVolunteerInvitationHtml = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4ff;padding:30px 0;font-family:Georgia,'Times New Roman',serif;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#3730a3,#6366f1);padding:35px 20px;text-align:center;">
              <div style="font-size:42px;line-height:1;">🤝🌟</div>
              <h1 style="color:#ffffff;margin:10px 0 0;font-size:26px;letter-spacing:1px;text-shadow:1px 1px 3px rgba(0,0,0,0.2);">Be a Volunteer!</h1>
              <p style="color:#c7d2fe;margin:6px 0 0;font-size:15px;">{{eventName}}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 35px;color:#1e1b4b;">
              <p style="font-size:16px;margin:0 0 18px;">Dear <strong>{{residentName}}</strong>,</p>
              <p style="font-size:15px;line-height:1.7;margin:0 0 18px;">We are looking for enthusiastic volunteers to help make <strong>{{eventName}}</strong> at <strong>{{communityName}}</strong> a grand success. Your participation will be invaluable!</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;margin:20px 0;">
                <tr>
                  <td style="padding:20px 25px;">
                    <table role="presentation" width="100%" cellpadding="6" cellspacing="0" style="font-size:15px;color:#1e1b4b;">
                      <tr><td style="width:34%;font-weight:bold;vertical-align:top;">📅 Event Date</td><td>{{eventDate}}</td></tr>
                      <tr><td style="font-weight:bold;vertical-align:top;">⏰ Volunteer Slot</td><td>{{eventTime}}</td></tr>
                      <tr><td style="font-weight:bold;vertical-align:top;">📍 Venue</td><td>{{venue}}</td></tr>
                      <tr><td style="font-weight:bold;vertical-align:top;">📝 Deadline to Sign Up</td><td>{{deadlineDate}}</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="font-size:15px;line-height:1.7;margin:0 0 22px;">Every helping hand makes a difference. Join us and be a part of something special for our community!</p>
              <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:10px 0 28px;">
                <tr>
                  <td style="background-color:#3730a3;border-radius:6px;">
                    <a href="{{actionLink}}" style="display:inline-block;padding:12px 30px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;">Sign Up to Volunteer</a>
                  </td>
                </tr>
              </table>
              <p style="font-size:14px;line-height:1.6;margin:0 0 18px;color:#4338ca;">For queries, contact <strong>{{contactPerson}}</strong> at {{contactNumber}} or {{contactEmail}}.</p>
              <p style="font-size:15px;margin:0;">With appreciation,</p>
              <p style="font-size:15px;margin:2px 0 0;font-weight:bold;">{{senderName}}</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#eef2ff;text-align:center;padding:18px;font-size:12px;color:#4338ca;">
              Thank you for making {{communityName}} a wonderful place to live.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

export const eventThankYouHtml = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf3e3;padding:30px 0;font-family:Georgia,'Times New Roman',serif;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#7c2d12,#ea580c);padding:35px 20px;text-align:center;">
              <div style="font-size:42px;line-height:1;">🙏💛</div>
              <h1 style="color:#ffffff;margin:10px 0 0;font-size:26px;letter-spacing:1px;text-shadow:1px 1px 3px rgba(0,0,0,0.2);">Thank You!</h1>
              <p style="color:#fed7aa;margin:6px 0 0;font-size:15px;">{{eventName}}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 35px;color:#431407;">
              <p style="font-size:16px;margin:0 0 18px;">Dear <strong>{{residentName}}</strong>,</p>
              <p style="font-size:15px;line-height:1.7;margin:0 0 18px;">Thank you for being a part of <strong>{{eventName}}</strong> at <strong>{{communityName}}</strong>! Your presence, enthusiasm, and support made this celebration truly special.</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:8px;margin:20px 0;">
                <tr>
                  <td style="padding:18px 24px;text-align:center;">
                    <p style="margin:0;font-size:16px;color:#7c2d12;font-weight:bold;">🌟 Your participation means the world to our community.</p>
                  </td>
                </tr>
              </table>
              <p style="font-size:15px;line-height:1.7;margin:0 0 22px;">We hope you carry wonderful memories from the festivities. Stay tuned for more upcoming events at {{communityName}}!</p>
              <p style="font-size:14px;line-height:1.6;margin:0 0 18px;color:#7c2d12;">For feedback or queries, reach out to <strong>{{contactPerson}}</strong> at {{contactEmail}}.</p>
              <p style="font-size:15px;margin:0;">With warmth and gratitude,</p>
              <p style="font-size:15px;margin:2px 0 0;font-weight:bold;">{{senderName}}</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#fff7ed;text-align:center;padding:18px;font-size:12px;color:#7c2d12;">
              Sent by {{communityName}} · {{supportEmail}}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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
  /* ── Event Blocks ── */
  {
    id: "event-festive-header",
    label: "Event Festive Header",
    category: "Events",
    icon: CalendarDays,
    content: `<table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;"><tr><td style="background:linear-gradient(135deg,#b8860b,#ff9933);padding:35px 20px;text-align:center;"><div style="font-size:40px;line-height:1;">🐘🌺</div><h1 style="color:#ffffff;margin:10px 0 0;font-size:28px;letter-spacing:1px;font-family:Georgia,serif;">{{eventName}}</h1><p style="color:#fff3d6;margin:6px 0 0;font-size:15px;font-family:Georgia,serif;">{{communityName}}</p></td></tr></table>`,
  },
  {
    id: "event-details-card",
    label: "Event Details Card",
    category: "Events",
    icon: CalendarDays,
    content: `<table role="presentation" style="width:100%;max-width:640px;margin:0 auto;background:#ffffff;border-collapse:collapse;"><tr><td style="padding:0 30px 20px;"><table role="presentation" width="100%" style="background:#fff8ec;border:1px solid #f0d9a8;border-radius:8px;border-collapse:collapse;"><tr><td style="padding:20px 25px;"><table role="presentation" width="100%" cellpadding="6" style="font-size:15px;color:#4a2c00;border-collapse:collapse;"><tr><td style="width:35%;font-weight:bold;font-family:Georgia,serif;">📅 Date</td><td style="font-family:Georgia,serif;">{{eventDate}}</td></tr><tr><td style="font-weight:bold;font-family:Georgia,serif;">🙏 Puja Muhurat</td><td style="font-family:Georgia,serif;">{{pujaMuhurat}}</td></tr><tr><td style="font-weight:bold;font-family:Georgia,serif;">📍 Venue</td><td style="font-family:Georgia,serif;">{{venue}}</td></tr><tr><td style="font-weight:bold;font-family:Georgia,serif;">⏰ Time</td><td style="font-family:Georgia,serif;">{{eventTime}}</td></tr><tr><td style="font-weight:bold;font-family:Georgia,serif;">🎉 Visarjan</td><td style="font-family:Georgia,serif;">{{visarjanDate}}</td></tr></table></td></tr></table></td></tr></table>`,
  },
  {
    id: "event-donation-card",
    label: "Event Donation Card",
    category: "Events",
    icon: BadgeDollarSign,
    content: `<table role="presentation" style="width:100%;max-width:640px;margin:0 auto;background:#ffffff;border-collapse:collapse;"><tr><td style="padding:0 30px 20px;"><table role="presentation" width="100%" style="background:#fff2e9;border:1px solid #f2c7a6;border-radius:8px;border-collapse:collapse;"><tr><td style="padding:20px 25px;"><table role="presentation" width="100%" cellpadding="6" style="font-size:15px;color:#4a2c00;border-collapse:collapse;"><tr><td style="width:42%;font-weight:bold;font-family:Georgia,serif;">🎯 Suggested Contribution</td><td style="font-family:Georgia,serif;">{{suggestedAmount}}</td></tr><tr><td style="font-weight:bold;font-family:Georgia,serif;">📅 Last Date</td><td style="font-family:Georgia,serif;">{{donationDeadline}}</td></tr><tr><td style="font-weight:bold;font-family:Georgia,serif;">💳 Payment Options</td><td style="font-family:Georgia,serif;">{{paymentOptions}}</td></tr><tr><td style="font-weight:bold;font-family:Georgia,serif;">🧾 UPI ID</td><td style="font-family:Georgia,serif;">{{upiId}}</td></tr><tr><td style="font-weight:bold;font-family:Georgia,serif;">📍 Collection Point</td><td style="font-family:Georgia,serif;">{{collectionPoint}}</td></tr></table></td></tr></table></td></tr></table>`,
  },
  {
    id: "event-reminder-highlight",
    label: "Event Reminder Banner",
    category: "Events",
    icon: CalendarDays,
    content: `<table role="presentation" style="width:100%;max-width:640px;margin:0 auto;background:#ffffff;border-collapse:collapse;"><tr><td style="padding:0 30px 20px;"><table role="presentation" width="100%" style="background:#fff3dc;border:1px dashed #f2a93b;border-radius:8px;border-collapse:collapse;"><tr><td style="padding:16px 20px;text-align:center;"><p style="margin:0;font-size:16px;font-weight:bold;color:#c9770a;font-family:Georgia,serif;">⏳ {{reminderMessage}}</p></td></tr></table></td></tr></table>`,
  },
  {
    id: "event-contact-block",
    label: "Event Contact Block",
    category: "Events",
    icon: Contact,
    content: `<table role="presentation" style="width:100%;max-width:640px;margin:0 auto;background:#ffffff;border-collapse:collapse;"><tr><td style="padding:20px 30px;"><div style="padding:14px 16px;border-left:4px solid #ff9933;background:#fff8ec;border-radius:0 6px 6px 0;"><strong style="color:#4a2c00;font-size:14px;font-family:Georgia,serif;">For queries, contact <span style="color:#b8860b;">{{contactPerson}}</span></strong><p style="margin:6px 0 0;color:#6b4a2c;font-size:13px;line-height:1.6;font-family:Georgia,serif;">📞 {{contactNumber}} &nbsp;·&nbsp; ✉️ {{contactEmail}}</p></div></td></tr></table>`,
  },
  {
    id: "event-festive-footer",
    label: "Event Festive Footer",
    category: "Events",
    icon: LayoutTemplate,
    content: `<table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse;"><tr><td style="background-color:#fff3d6;text-align:center;padding:18px;font-size:12px;color:#8a6d3b;font-family:Georgia,serif;">Sent by {{communityName}} · {{supportEmail}}</td></tr></table>`,
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
  /* ── Event module field groups ── */
  {
    group: "Event",
    fields: [
      { label: "Event Name", token: "{{eventName}}" },
      { label: "Event Date", token: "{{eventDate}}" },
      { label: "Event Time", token: "{{eventTime}}" },
      { label: "Venue", token: "{{venue}}" },
      { label: "Puja Muhurat", token: "{{pujaMuhurat}}" },
      { label: "Visarjan Date", token: "{{visarjanDate}}" },
      { label: "RSVP Link", token: "{{rsvpLink}}" },
      { label: "Resident Name", token: "{{residentName}}" },
      { label: "Sender Name", token: "{{senderName}}" },
    ],
  },
  {
    group: "Event Donation",
    fields: [
      { label: "Suggested Amount", token: "{{suggestedAmount}}" },
      { label: "Donation Deadline", token: "{{donationDeadline}}" },
      { label: "Payment Options", token: "{{paymentOptions}}" },
      { label: "UPI ID", token: "{{upiId}}" },
      { label: "Collection Point", token: "{{collectionPoint}}" },
      { label: "Donation Link", token: "{{donationLink}}" },
    ],
  },
  {
    group: "Event Reminder",
    fields: [
      { label: "Reminder Message", token: "{{reminderMessage}}" },
      { label: "Pending Action", token: "{{pendingAction}}" },
      { label: "Deadline Date", token: "{{deadlineDate}}" },
      { label: "Action Link", token: "{{actionLink}}" },
      { label: "Action Button Text", token: "{{actionButtonText}}" },
    ],
  },
  {
    group: "Event Contact",
    fields: [
      { label: "Contact Person", token: "{{contactPerson}}" },
      { label: "Contact Number", token: "{{contactNumber}}" },
      { label: "Contact Email", token: "{{contactEmail}}" },
    ],
  },
];

export const emailTemplateCategories: TemplateCategory[] = [
  { id: "tournament", module: "Tournament", color: "#2563eb", items: ["Registration", "Announcement", "Fixtures", "Winners"] },
  { id: "finance", module: "Finance", color: "#0f766e", items: ["Invoice", "Payment Success", "Payment Failed", "Refund"] },
  { id: "user", module: "User", color: "#7c3aed", items: ["Welcome", "OTP", "Password Reset", "Email Verification"] },
  { id: "community", module: "Community", color: "#db2777", items: ["Maintenance", "Notice", "Event Invitation", "Newsletter"] },
  { id: "inventory", module: "Inventory", color: "#ea580c", items: ["Purchase Order", "Low Stock", "Asset Allocation"] },
  { id: "events", module: "Events", color: "#ff9933", items: ["Announcement", "Reminder", "Donation Appeal", "Registration Confirmed", "Cancellation", "Volunteer Invitation", "Thank You", "Schedule Update"] },
];

export const emailApplicabilityOptions: EmailApplicabilityOption[] = [
  {
    moduleKey: "SPORTS",
    moduleLabel: "Sports",
    menuKey: "SPORTS_ADMIN",
    menuLabel: "Sports Admin",
    subMenuKey: "TOURNAMENT_CREATION",
    subMenuLabel: "Tournament Creation",
    useCase: "Tournament announcement",
    triggerKey: "TOURNAMENT_ANNOUNCEMENT",
    templateKey: "tournament-announcement",
    category: "Tournament",
    defaultName: "Tournament Announcement",
    defaultSubject: "{{tournamentName}} announcement - {{communityName}}",
    tags: ["sports", "tournament", "announcement"],
  },
  {
    moduleKey: "SPORTS",
    moduleLabel: "Sports",
    menuKey: "SPORTS_ADMIN",
    menuLabel: "Sports Admin",
    subMenuKey: "TOURNAMENT_CREATION",
    subMenuLabel: "Tournament Creation",
    useCase: "Tournament open",
    triggerKey: "TOURNAMENT_OPEN",
    templateKey: "tournament-open",
    category: "Tournament",
    defaultName: "Tournament Open",
    defaultSubject: "{{tournamentName}} is open for {{communityName}}",
    tags: ["sports", "tournament", "open"],
  },
  {
    moduleKey: "SPORTS",
    moduleLabel: "Sports",
    menuKey: "SPORTS_ADMIN",
    menuLabel: "Sports Admin",
    subMenuKey: "TOURNAMENT_CREATION",
    subMenuLabel: "Tournament Creation",
    useCase: "Tournament start",
    triggerKey: "TOURNAMENT_START",
    templateKey: "tournament-start",
    category: "Tournament",
    defaultName: "Tournament Start",
    defaultSubject: "{{tournamentName}} starts today",
    tags: ["sports", "tournament", "start"],
  },
  {
    moduleKey: "SPORTS",
    moduleLabel: "Sports",
    menuKey: "SPORTS_ADMIN",
    menuLabel: "Sports Admin",
    subMenuKey: "REGISTRATION",
    subMenuLabel: "Registrations",
    useCase: "Registration open",
    triggerKey: "REGISTRATION_OPEN",
    templateKey: "registration-open",
    category: "Tournament",
    defaultName: "Registration Open",
    defaultSubject: "Registration open for {{tournamentName}}",
    tags: ["sports", "registration", "open"],
  },
  {
    moduleKey: "SPORTS",
    moduleLabel: "Sports",
    menuKey: "SPORTS_ADMIN",
    menuLabel: "Sports Admin",
    subMenuKey: "REGISTRATION",
    subMenuLabel: "Registrations",
    useCase: "Registration received",
    triggerKey: "REGISTRATION_RECEIVED",
    templateKey: "registration-received",
    category: "Tournament",
    defaultName: "Registration Received",
    defaultSubject: "We received your {{tournamentName}} registration",
    tags: ["sports", "registration", "received"],
  },
  {
    moduleKey: "SPORTS",
    moduleLabel: "Sports",
    menuKey: "SPORTS_ADMIN",
    menuLabel: "Sports Admin",
    subMenuKey: "REGISTRATION",
    subMenuLabel: "Registrations",
    useCase: "Registration confirmed",
    triggerKey: "REGISTRATION_CONFIRMED",
    templateKey: "registration-confirmed",
    category: "Tournament",
    defaultName: "Registration Confirmed",
    defaultSubject: "Confirmed: {{tournamentName}} registration",
    tags: ["sports", "registration", "confirmed"],
  },
  {
    moduleKey: "SPORTS",
    moduleLabel: "Sports",
    menuKey: "SPORTS_ADMIN",
    menuLabel: "Sports Admin",
    subMenuKey: "REGISTRATION",
    subMenuLabel: "Registrations",
    useCase: "Registration rejected",
    triggerKey: "REGISTRATION_REJECTED",
    templateKey: "registration-rejected",
    category: "Tournament",
    defaultName: "Registration Rejected",
    defaultSubject: "Update on your {{tournamentName}} registration",
    tags: ["sports", "registration", "rejected"],
  },
  {
    moduleKey: "SPORTS",
    moduleLabel: "Sports",
    menuKey: "SPORTS",
    menuLabel: "Sports",
    subMenuKey: "SCHEDULE",
    subMenuLabel: "Match Schedule",
    useCase: "Schedule published",
    triggerKey: "SCHEDULE_PUBLISHED",
    templateKey: "schedule-published",
    category: "Tournament",
    defaultName: "Schedule Published",
    defaultSubject: "{{tournamentName}} schedule is published",
    tags: ["sports", "schedule", "fixtures"],
  },
  {
    moduleKey: "SPORTS",
    moduleLabel: "Sports",
    menuKey: "SPORTS",
    menuLabel: "Sports",
    subMenuKey: "SCHEDULE",
    subMenuLabel: "Match Schedule",
    useCase: "Match reminder",
    triggerKey: "MATCH_REMINDER",
    templateKey: "match-reminder",
    category: "Tournament",
    defaultName: "Match Reminder",
    defaultSubject: "Reminder: {{tournamentName}} match at {{venue}}",
    tags: ["sports", "match", "reminder"],
  },
  {
    moduleKey: "SPORTS",
    moduleLabel: "Sports",
    menuKey: "SPORTS_AUCTION",
    menuLabel: "Auction",
    subMenuKey: "AUCTION",
    subMenuLabel: "Auction",
    useCase: "Auction related notifications",
    triggerKey: "AUCTION_NOTIFICATION",
    templateKey: "auction-notification",
    category: "Tournament",
    defaultName: "Auction Notification",
    defaultSubject: "{{tournamentName}} auction update",
    tags: ["sports", "auction"],
  },
  {
    moduleKey: "SPORTS",
    moduleLabel: "Sports",
    menuKey: "SPORTS_RESULTS",
    menuLabel: "Results",
    subMenuKey: "RESULTS",
    subMenuLabel: "Tournament Results",
    useCase: "Winner notification",
    triggerKey: "WINNER_NOTIFICATION",
    templateKey: "winner-notification",
    category: "Tournament",
    defaultName: "Winner Notification",
    defaultSubject: "Congratulations {{winnerName}}",
    tags: ["sports", "winner", "results"],
  },
  {
    moduleKey: "SPORTS",
    moduleLabel: "Sports",
    menuKey: "SPORTS_RESULTS",
    menuLabel: "Results",
    subMenuKey: "RESULTS",
    subMenuLabel: "Tournament Results",
    useCase: "Prize distribution",
    triggerKey: "PRIZE_DISTRIBUTION",
    templateKey: "prize-distribution",
    category: "Tournament",
    defaultName: "Prize Distribution",
    defaultSubject: "{{tournamentName}} prize distribution",
    tags: ["sports", "prize", "results"],
  },
  {
    moduleKey: "SPORTS",
    moduleLabel: "Sports",
    menuKey: "SPORTS_RESULTS",
    menuLabel: "Results",
    subMenuKey: "RESULTS",
    subMenuLabel: "Tournament Results",
    useCase: "Tournament completion",
    triggerKey: "TOURNAMENT_COMPLETION",
    templateKey: "tournament-completion",
    category: "Tournament",
    defaultName: "Tournament Completion",
    defaultSubject: "{{tournamentName}} completed",
    tags: ["sports", "completion", "results"],
  },
  {
    moduleKey: "AUTH",
    moduleLabel: "User",
    menuKey: "AUTH",
    menuLabel: "Authentication",
    subMenuKey: "OTP",
    subMenuLabel: "OTP",
    useCase: "Email OTP",
    triggerKey: "EMAIL_OTP",
    templateKey: "email-otp",
    category: "User",
    defaultName: "Email OTP",
    defaultSubject: "Your Mana Community OTP",
    tags: ["user", "otp", "security"],
  },
  /* ── Events module applicability options ── */
  {
    moduleKey: "EVENTS",
    moduleLabel: "Events",
    menuKey: "EVENTS_ADMIN",
    menuLabel: "Events Admin",
    subMenuKey: "EVENT_CREATION",
    subMenuLabel: "Event Creation",
    useCase: "Event announcement",
    triggerKey: "EVENT_ANNOUNCEMENT",
    templateKey: "event-announcement",
    category: "Events",
    defaultName: "Event Announcement",
    defaultSubject: "{{eventName}} — You're Invited, {{residentName}}!",
    tags: ["events", "announcement", "invitation"],
  },
  {
    moduleKey: "EVENTS",
    moduleLabel: "Events",
    menuKey: "EVENTS_ADMIN",
    menuLabel: "Events Admin",
    subMenuKey: "EVENT_CREATION",
    subMenuLabel: "Event Creation",
    useCase: "Event reminder",
    triggerKey: "EVENT_REMINDER",
    templateKey: "event-reminder",
    category: "Events",
    defaultName: "Event Reminder",
    defaultSubject: "Reminder: {{eventName}} is coming up at {{communityName}}",
    tags: ["events", "reminder"],
  },
  {
    moduleKey: "EVENTS",
    moduleLabel: "Events",
    menuKey: "EVENTS_DONATIONS",
    menuLabel: "Event Donations",
    subMenuKey: "DONATION_APPEAL",
    subMenuLabel: "Donation Appeal",
    useCase: "Event donation appeal",
    triggerKey: "EVENT_DONATION_APPEAL",
    templateKey: "event-donation-appeal",
    category: "Events",
    defaultName: "Event Donation Appeal",
    defaultSubject: "Support {{eventName}} — Donate for {{communityName}}",
    tags: ["events", "donation", "appeal"],
  },
  {
    moduleKey: "EVENTS",
    moduleLabel: "Events",
    menuKey: "EVENTS_REGISTRATIONS",
    menuLabel: "Event Registrations",
    subMenuKey: "REGISTRATION_CONFIRMED",
    subMenuLabel: "Registration Confirmed",
    useCase: "Event registration confirmed",
    triggerKey: "EVENT_REGISTRATION_CONFIRMED",
    templateKey: "event-registration-confirmed",
    category: "Events",
    defaultName: "Event Registration Confirmed",
    defaultSubject: "You're registered for {{eventName}} at {{communityName}}",
    tags: ["events", "registration", "confirmed"],
  },
  {
    moduleKey: "EVENTS",
    moduleLabel: "Events",
    menuKey: "EVENTS_ADMIN",
    menuLabel: "Events Admin",
    subMenuKey: "SCHEDULE_UPDATE",
    subMenuLabel: "Schedule Update",
    useCase: "Event schedule update",
    triggerKey: "EVENT_SCHEDULE_UPDATE",
    templateKey: "event-schedule-update",
    category: "Events",
    defaultName: "Event Schedule Update",
    defaultSubject: "Update: {{eventName}} schedule at {{communityName}}",
    tags: ["events", "schedule", "update"],
  },
  {
    moduleKey: "EVENTS",
    moduleLabel: "Events",
    menuKey: "EVENTS_ADMIN",
    menuLabel: "Events Admin",
    subMenuKey: "CANCELLATION",
    subMenuLabel: "Cancellation",
    useCase: "Event cancellation notice",
    triggerKey: "EVENT_CANCELLATION",
    templateKey: "event-cancellation",
    category: "Events",
    defaultName: "Event Cancellation Notice",
    defaultSubject: "Important update: {{eventName}} at {{communityName}}",
    tags: ["events", "cancellation"],
  },
  {
    moduleKey: "EVENTS",
    moduleLabel: "Events",
    menuKey: "EVENTS_VOLUNTEERS",
    menuLabel: "Volunteers",
    subMenuKey: "VOLUNTEER_INVITATION",
    subMenuLabel: "Volunteer Invitation",
    useCase: "Volunteer invitation",
    triggerKey: "EVENT_VOLUNTEER_INVITATION",
    templateKey: "event-volunteer-invitation",
    category: "Events",
    defaultName: "Volunteer Invitation",
    defaultSubject: "We need your help at {{eventName}}, {{residentName}}!",
    tags: ["events", "volunteer", "invitation"],
  },
  {
    moduleKey: "EVENTS",
    moduleLabel: "Events",
    menuKey: "EVENTS_ADMIN",
    menuLabel: "Events Admin",
    subMenuKey: "THANK_YOU",
    subMenuLabel: "Thank You",
    useCase: "Post-event thank you",
    triggerKey: "EVENT_THANK_YOU",
    templateKey: "event-thank-you",
    category: "Events",
    defaultName: "Post-Event Thank You",
    defaultSubject: "Thank you for joining {{eventName}}, {{residentName}}!",
    tags: ["events", "thank-you", "post-event"],
  },
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
  ...emailApplicabilityOptions.map((option) => ({
    name: option.defaultName,
    category: option.category,
    tags: option.tags,
    moduleKey: option.moduleKey,
    moduleLabel: option.moduleLabel,
    menuKey: option.menuKey,
    menuLabel: option.menuLabel,
    subMenuKey: option.subMenuKey,
    subMenuLabel: option.subMenuLabel,
    useCase: option.useCase,
    triggerKey: option.triggerKey,
    templateKey: option.templateKey,
    subject: option.defaultSubject,
  })),
  { name: "Welcome Email", category: "User", tags: ["onboarding"], moduleKey: "USER", moduleLabel: "User", menuKey: "USER", menuLabel: "Users", subMenuKey: "WELCOME", subMenuLabel: "Welcome", useCase: "Welcome email", triggerKey: "WELCOME_EMAIL", templateKey: "welcome-email", subject: "Welcome to {{communityName}}" },
  { name: "Invoice", category: "Finance", tags: ["billing"], moduleKey: "FINANCE", moduleLabel: "Finance", menuKey: "FINANCE_INVOICES", menuLabel: "Invoices", subMenuKey: "INVOICE", subMenuLabel: "Invoice", useCase: "Invoice", triggerKey: "INVOICE_CREATED", templateKey: "invoice", subject: "Invoice {{invoiceNumber}} from {{communityName}}" },
  { name: "Payment Success", category: "Finance", tags: ["receipt"], moduleKey: "FINANCE", moduleLabel: "Finance", menuKey: "FINANCE_PAYMENTS", menuLabel: "Payments", subMenuKey: "PAYMENT_SUCCESS", subMenuLabel: "Payment Success", useCase: "Payment success", triggerKey: "PAYMENT_SUCCESS", templateKey: "payment-success", subject: "Payment received for {{communityName}}" },
  { name: "Password Reset", category: "User", tags: ["security"], moduleKey: "AUTH", moduleLabel: "User", menuKey: "AUTH", menuLabel: "Authentication", subMenuKey: "PASSWORD_RESET", subMenuLabel: "Password Reset", useCase: "Password reset", triggerKey: "PASSWORD_RESET", templateKey: "password-reset", subject: "Reset your Mana Community password" },
  { name: "Maintenance Notice", category: "Community", tags: ["maintenance"], moduleKey: "COMMUNITY", moduleLabel: "Community", menuKey: "COMMUNITY_MAINTENANCE", menuLabel: "Maintenance", subMenuKey: "NOTICE", subMenuLabel: "Notice", useCase: "Maintenance notice", triggerKey: "MAINTENANCE_NOTICE", templateKey: "maintenance-notice", subject: "Maintenance notice for {{communityName}}" },
  { name: "Newsletter", category: "Community", tags: ["newsletter"], moduleKey: "COMMUNITY", moduleLabel: "Community", menuKey: "COMMUNITY_NEWSLETTER", menuLabel: "Newsletter", subMenuKey: "NEWSLETTER", subMenuLabel: "Newsletter", useCase: "Newsletter", triggerKey: "NEWSLETTER", templateKey: "newsletter", subject: "{{communityName}} newsletter" },
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
  /* ── Event sample datasets ── */
  {
    id: "vinayaka-chavithi-2026-announcement",
    label: "Vinayaka Chavithi 2026 — Announcement",
    values: {
      communityName: "Mana Heights",
      eventName: "Vinayaka Chavithi 2026",
      residentName: "Priya Rao",
      senderName: "Events Committee, Mana Heights",
      eventDate: "Monday, Sep 14, 2026",
      pujaMuhurat: "9:00 AM – 11:00 AM",
      eventTime: "9:00 AM onwards",
      venue: "Community Clubhouse, Block A",
      visarjanDate: "Wednesday, Sep 23, 2026",
      rsvpLink: "https://mana.community/events/rsvp",
      supportEmail: "events@manaheights.in",
      contactPerson: "Ravi Kumar",
      contactNumber: "+91 98765 43210",
      contactEmail: "events@manaheights.in",
    },
  },
  {
    id: "vinayaka-chavithi-2026-donation",
    label: "Vinayaka Chavithi 2026 — Donation Appeal",
    values: {
      communityName: "Mana Heights",
      eventName: "Vinayaka Chavithi 2026",
      residentName: "Priya Rao",
      senderName: "Events Committee, Mana Heights",
      suggestedAmount: "₹500 per family",
      donationDeadline: "September 10, 2026",
      paymentOptions: "UPI, Cash, Bank Transfer",
      upiId: "manahts@upi",
      collectionPoint: "Community Office, Block A",
      donationLink: "https://mana.community/events/donate",
      contactPerson: "Ravi Kumar",
      contactNumber: "+91 98765 43210",
      contactEmail: "events@manaheights.in",
      supportEmail: "events@manaheights.in",
    },
  },
  {
    id: "vinayaka-chavithi-2026-reminder",
    label: "Vinayaka Chavithi 2026 — Reminder",
    values: {
      communityName: "Mana Heights",
      eventName: "Vinayaka Chavithi 2026",
      residentName: "Priya Rao",
      senderName: "Events Committee, Mana Heights",
      reminderMessage: "Only 3 days left! RSVP by September 11.",
      eventDate: "Monday, Sep 14, 2026",
      eventTime: "9:00 AM onwards",
      venue: "Community Clubhouse, Block A",
      pendingAction: "Complete your RSVP and confirm attendance",
      deadlineDate: "September 11, 2026",
      actionLink: "https://mana.community/events/rsvp",
      actionButtonText: "RSVP Now",
      contactPerson: "Ravi Kumar",
      contactNumber: "+91 98765 43210",
      contactEmail: "events@manaheights.in",
      supportEmail: "events@manaheights.in",
    },
  },
];

export const emailClients = ["Gmail", "Outlook", "Apple Mail", "Yahoo Mail"];

export const repeatableCollections = [
  "Sports List", "Announcements", "Timeline", "Invoice Items", "Participants", "Sponsors", "Winners", "Gallery",
  "Event Program", "Event Sponsors", "Event Volunteers", "Event Donors", "Event Days",
];

export const conditionalRules = [
  "IF amount > 0 show Payment Section",
  "IF tournamentType == Cricket show Cricket Rules",
  "IF user.isPremium show Premium Banner",
  "IF eventType == Festival show Festive Header",
  "IF donationEnabled show Donation Block",
  "IF hasPujaMuhurat show Muhurat Row",
  "IF hasVisarjan show Visarjan Row",
  "IF pendingAction != empty show Reminder Banner",
];

export const imageLibraryAssets = [
  { name: "Tournament Banner", folder: "Banners", tags: ["sports", "hero"], type: "Banner" },
  { name: "Community Logo", folder: "Logos", tags: ["brand"], type: "Logo" },
  { name: "Sponsor Strip", folder: "Sponsors", tags: ["partner"], type: "Sponsor" },
  { name: "Payment QR", folder: "QR Codes", tags: ["payment"], type: "QR Code" },
  { name: "Maintenance Icon Set", folder: "Icons", tags: ["notice"], type: "Icon" },
  { name: "Festival Invitation Banner", folder: "Banners", tags: ["events", "festival", "hero"], type: "Banner" },
  { name: "Donation Appeal Graphic", folder: "Events", tags: ["events", "donation"], type: "Illustration" },
  { name: "Event Venue Photo", folder: "Events", tags: ["events", "venue"], type: "Photo" },
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
