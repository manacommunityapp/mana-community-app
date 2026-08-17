export interface SystemEmailTemplate {
  key: string;
  name: string;
  subject: string;
  templateFile: string;
  category: "AUTH" | "EVENT" | "MATCH" | "TOURNAMENT" | "REGISTRATION" | "PRIZE" | "ANNOUNCEMENT";
  triggerMenuPath: string;
  triggerWired: boolean;
  triggerDescription: string;
  variables: { name: string; description: string; sample: string }[];
  rawHtml: string;
}

export const EMAIL_TEMPLATES_COLLECTION: SystemEmailTemplate[] = [
  {
    key: "EMAIL_OTP",
    name: "Email Verification Code (OTP)",
    subject: "Your Verification Code — Mana Community",
    templateFile: "email/email-otp.html",
    category: "AUTH",
    triggerMenuPath: "Auth → Sign Up / Verification",
    triggerWired: true,
    triggerDescription: "Sent when a user requests an email verification code (OTP) during registration or login verification.",
    variables: [
      { name: "appName", description: "Application Name", sample: "Mana Community" },
      { name: "recipientName", description: "Recipient's Name", sample: "Sandeep" },
      { name: "otpCode", description: "6-Digit OTP Code", sample: "849201" },
      { name: "expiryMinutes", description: "Code Expiry in Minutes", sample: "10" },
      { name: "year", description: "Current Year", sample: "2026" },
    ],
    rawHtml: `<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title th:text="\${appName} + ' — Verification code'">Verification code</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2933;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#2563eb;padding:28px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;" th:text="\${appName}">Mana Community</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Verify your email</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;">
                Hi <strong th:text="\${recipientName}">there</strong>, use the code below to verify your email
                address and complete your event registration.
              </p>
              <div style="text-align:center;margin:0 0 24px;">
                <span style="display:inline-block;background:#eff6ff;color:#1d4ed8;border-radius:10px;padding:16px 28px;font-size:30px;font-weight:700;letter-spacing:8px;" th:text="\${otpCode}">000000</span>
              </div>
              <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#4b5563;">
                This code expires in <strong th:text="\${expiryMinutes}">10</strong> minutes. If you didn't request
                it, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background-color:#f9fafb;border-top:1px solid #eef0f2;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                &copy; <span th:text="\${year}">2026</span> <span th:text="\${appName}">Mana Community</span>. This is an automated message — please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    key: "EVENT_ANNOUNCEMENT",
    name: "Community Event Announcement",
    subject: "You're Invited — {{eventTitle}}! 🎆",
    templateFile: "email/event-announcement.html",
    category: "EVENT",
    triggerMenuPath: "Events → Announcements",
    triggerWired: true,
    triggerDescription: "Sent when an administrator publishes a festival, cultural night, or major community gathering announcement.",
    variables: [
      { name: "appName", description: "Application Name", sample: "Mana Community" },
      { name: "eventTitle", description: "Event Title", sample: "Ganesh Chaturthi & Cultural Utsav 2026" },
      { name: "recipientName", description: "Resident Name", sample: "Ananya Sharma" },
      { name: "eventDateTime", description: "Date & Time", sample: "Aug 29 - Sep 2, 2026 · 6:00 PM onwards" },
      { name: "venueName", description: "Venue Location", sample: "Main Clubhouse Lawn & Amphitheatre" },
      { name: "organiserName", description: "Organising Committee", sample: "Cultural & Events Committee" },
      { name: "eventDescription", description: "Event Highlights", sample: "Join us for 5 days of festive bliss including Pooja, Dhol Tasha procession, Mahaprasadam feast, and cultural performances by our community talents!" },
      { name: "actionUrl", description: "RSVP Action URL", sample: "https://manacommunity.app/events/101" },
      { name: "year", description: "Current Year", sample: "2026" },
    ],
    rawHtml: `<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title th:text="\${appName} + ' — Event Announcement'">Event Announcement</title>
</head>
<body style="margin:0;padding:0;background-color:#fefce8;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fefce8;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(217,119,6,0.12);border:1px solid #fef3c7;">
          <tr>
            <td style="background:linear-gradient(135deg, #d97706, #b45309);padding:28px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:0.02em;" th:text="\${appName}">Mana Community</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <div style="font-size:42px;line-height:1;margin-bottom:12px;">🎆</div>
              <span style="display:inline-block;padding:4px 12px;background-color:#fef3c7;color:#b45309;font-size:11px;font-weight:700;border-radius:9999px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">Grand Community Celebration</span>
              <h1 style="margin:0 0 12px;font-size:24px;color:#78350f;font-weight:800;line-height:1.3;" th:text="\${eventTitle}">Ganesh Chaturthi & Cultural Utsav 2026</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
                Dear <strong th:text="\${recipientName}">Resident</strong>, we are thrilled to invite you and your family to our upcoming grand celebration! Mark your calendars for an unforgettable community event filled with music, cultural performances, games, and delicious prasad.
              </p>
              <div style="margin:0 0 24px;padding:20px;background-color:#fffbeb;border-radius:12px;border-left:4px solid #d97706;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr><td style="padding:6px 0;color:#92400e;font-size:13px;font-weight:600;">Date & Time</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#78350f;text-align:right;" th:text="\${eventDateTime}">Aug 29 - Sep 2, 2026 · 6:00 PM onwards</td></tr>
                  <tr><td style="padding:6px 0;color:#92400e;font-size:13px;font-weight:600;">Venue</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#78350f;text-align:right;" th:text="\${venueName}">Main Clubhouse Lawn & Amphitheatre</td></tr>
                  <tr><td style="padding:6px 0;color:#92400e;font-size:13px;font-weight:600;">Organiser</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#78350f;text-align:right;" th:text="\${organiserName}">Cultural & Events Committee</td></tr>
                </table>
              </div>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#4b5563;" th:text="\${eventDescription}">
                Join us for 5 days of festive bliss including Pooja, Dhol Tasha procession, Mahaprasadam feast, and cultural performances by our community talents!
              </p>
              <a th:href="\${actionUrl}" href="#" style="display:inline-block;background:linear-gradient(135deg, #d97706, #b45309);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:700;box-shadow:0 2px 8px rgba(217,119,6,0.25);">RSVP & View Full Itinerary</a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background-color:#fffbeb;border-top:1px solid #fef3c7;">
              <p style="margin:0;font-size:12px;color:#92400e;line-height:1.5;">
                &copy; <span th:text="\${year}">2026</span> <span th:text="\${appName}">Mana Community</span>. Dedicated to bringing neighbors together.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    key: "EVENT_DONATION_APPEAL",
    name: "Festival Donation & Seva Appeal",
    subject: "Support {{campaignTitle}} — Community Contribution Drive",
    templateFile: "email/event-donation-appeal.html",
    category: "EVENT",
    triggerMenuPath: "Events → Donations & Sevas",
    triggerWired: true,
    triggerDescription: "Sent when an administrator launches a fundraising drive or pooja seva sponsorship campaign for a festival.",
    variables: [
      { name: "appName", description: "Application Name", sample: "Mana Community" },
      { name: "campaignTitle", description: "Campaign Title", sample: "Support Ganesh Utsav 2026 Festival Fund" },
      { name: "recipientName", description: "Recipient Name", sample: "Rajesh Varma" },
      { name: "targetGoal", description: "Fund Target Goal", sample: "₹1,50,000" },
      { name: "raisedAmount", description: "Raised Amount So Far", sample: "₹95,000" },
      { name: "suggestedAmount", description: "Suggested Contribution", sample: "₹1,500 / family" },
      { name: "actionUrl", description: "Donation Link", sample: "https://manacommunity.app/events/donations/101" },
      { name: "year", description: "Current Year", sample: "2026" },
    ],
    rawHtml: `<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title th:text="\${appName} + ' — Festival Donation Drive'">Festival Donation Drive</title>
</head>
<body style="margin:0;padding:0;background-color:#fef2f2;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(220,38,38,0.12);border:1px solid #fee2e2;">
          <tr>
            <td style="background:linear-gradient(135deg, #dc2626, #ea580c);padding:28px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:0.02em;" th:text="\${appName}">Mana Community</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <div style="font-size:42px;line-height:1;margin-bottom:12px;">🚩</div>
              <span style="display:inline-block;padding:4px 12px;background-color:#fee2e2;color:#991b1b;font-size:11px;font-weight:700;border-radius:9999px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">Community Contribution Appeal</span>
              <h1 style="margin:0 0 12px;font-size:22px;color:#991b1b;font-weight:800;line-height:1.3;" th:text="\${campaignTitle}">Support Ganesh Utsav 2026 Festival Fund</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
                Dear <strong th:text="\${recipientName}">Community Member</strong>, as we prepare for our grand festival celebration, we invite generous contributions from resident families to make this year's decorations, prasadam, and cultural arrangements memorable for everyone!
              </p>
              <div style="margin:0 0 24px;padding:20px;background-color:#fff1f2;border-radius:12px;border:1px solid #fecdd3;">
                <div style="font-size:12px;font-weight:700;color:#9f1239;text-transform:uppercase;margin-bottom:8px;">Fundraising Drive Progress</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:12px;">
                  <tr><td style="color:#881337;font-size:13px;">Target Goal</td><td style="font-size:15px;font-weight:800;color:#9f1239;text-align:right;" th:text="\${targetGoal}">₹1,50,000</td></tr>
                  <tr><td style="color:#881337;font-size:13px;">Raised So Far</td><td style="font-size:15px;font-weight:800;color:#15803d;text-align:right;" th:text="\${raisedAmount}">₹95,000</td></tr>
                  <tr><td style="color:#881337;font-size:13px;">Suggested Per-Flat Contribution</td><td style="font-size:14px;font-weight:700;color:#b91c1c;text-align:right;" th:text="\${suggestedAmount}">₹1,500 / family</td></tr>
                </table>
              </div>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#4b5563;">
                Every contribution counts towards making our grand event successful. Full transparency reports and receipts will be issued instantly upon payment.
              </p>
              <a th:href="\${actionUrl}" href="#" style="display:inline-block;background:linear-gradient(135deg, #dc2626, #b91c1c);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:700;box-shadow:0 2px 8px rgba(220,38,38,0.25);">Contribute to Event Fund</a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background-color:#fff1f2;border-top:1px solid #fecdd3;">
              <p style="margin:0;font-size:12px;color:#9f1239;line-height:1.5;">
                &copy; <span th:text="\${year}">2026</span> <span th:text="\${appName}">Mana Community</span>. Thank you for your generous support!
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    key: "EVENT_REGISTRATION_CONFIRMED",
    name: "Event RSVP & Registration Confirmed",
    subject: "You're Registered for {{eventName}}! 🎉",
    templateFile: "email/event-registration-confirmed.html",
    category: "EVENT",
    triggerMenuPath: "Events → RSVP / Registration",
    triggerWired: true,
    triggerDescription: "Auto-sent to the resident immediately after a successful RSVP or pass booking for a community event.",
    variables: [
      { name: "appName", description: "Application Name", sample: "Mana Community" },
      { name: "eventName", description: "Event Name", sample: "Grand Diwali Gala & Dandiya Night" },
      { name: "recipientName", description: "Resident Name", sample: "Pooja Hegde" },
      { name: "passType", description: "Pass Type", sample: "Family Pass (4 Members)" },
      { name: "ticketCode", description: "Pass / QR Ticket Code", sample: "EVT-DWD-8921" },
      { name: "eventDateTime", description: "Date & Time", sample: "Oct 24, 2026 · 7:00 PM" },
      { name: "venueName", description: "Venue", sample: "Clubhouse Open Lawn" },
      { name: "actionUrl", description: "Ticket URL", sample: "https://manacommunity.app/passes/8921" },
      { name: "year", description: "Current Year", sample: "2026" },
    ],
    rawHtml: `<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title th:text="\${appName} + ' — Event Registration Confirmed'">Registration Confirmed</title>
</head>
<body style="margin:0;padding:0;background-color:#f0fdf4;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(22,101,52,0.12);border:1px solid #dcfce7;">
          <tr>
            <td style="background:linear-gradient(135deg, #16a34a, #15803d);padding:28px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:0.02em;" th:text="\${appName}">Mana Community</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <div style="font-size:42px;line-height:1;margin-bottom:12px;">🎉</div>
              <span style="display:inline-block;padding:4px 12px;background-color:#dcfce7;color:#166534;font-size:11px;font-weight:700;border-radius:9999px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">RSVP Confirmed</span>
              <h1 style="margin:0 0 12px;font-size:24px;color:#14532d;font-weight:800;line-height:1.3;" th:text="\${eventName}">Grand Diwali Gala & Dandiya Night</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
                Hi <strong th:text="\${recipientName}">Pooja</strong>, your event registration is officially confirmed! Here is your entry pass and event itinerary.
              </p>
              <div style="margin:0 0 24px;padding:20px;background-color:#f0fdf4;border-radius:12px;border:1px dashed #86efac;text-align:center;">
                <div style="font-size:11px;color:#15803d;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Digital Entry Pass Code</div>
                <div style="font-size:26px;font-weight:800;color:#166534;letter-spacing:4px;margin-bottom:8px;" th:text="\${ticketCode}">EVT-DWD-8921</div>
                <div style="font-size:13px;color:#15803d;font-weight:600;" th:text="\${passType}">Family Pass (4 Members)</div>
              </div>
              <div style="margin:0 0 24px;padding:16px 20px;background-color:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Date & Time</td><td style="padding:6px 0;font-size:14px;font-weight:600;color:#1e293b;text-align:right;" th:text="\${eventDateTime}">Oct 24, 2026 · 7:00 PM</td></tr>
                  <tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Venue</td><td style="padding:6px 0;font-size:14px;font-weight:600;color:#1e293b;text-align:right;" th:text="\${venueName}">Clubhouse Open Lawn</td></tr>
                </table>
              </div>
              <a th:href="\${actionUrl}" href="#" style="display:inline-block;background:linear-gradient(135deg, #16a34a, #15803d);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:700;box-shadow:0 2px 8px rgba(22,163,74,0.25);">Download Event Pass & Add to Calendar</a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background-color:#f0fdf4;border-top:1px solid #dcfce7;">
              <p style="margin:0;font-size:12px;color:#166534;line-height:1.5;">
                &copy; <span th:text="\${year}">2026</span> <span th:text="\${appName}">Mana Community</span>. See you at the celebration!
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    key: "EVENT_REMINDER",
    name: "Event Countdown & Reminder",
    subject: "Reminder: {{eventName}} is Coming Up! ⏰",
    templateFile: "email/event-reminder.html",
    category: "EVENT",
    triggerMenuPath: "Events → Reminders",
    triggerWired: true,
    triggerDescription: "Fires 24-48 hours before an event to remind registered and invited attendees of timings, guidelines, and dress codes.",
    variables: [
      { name: "appName", description: "Application Name", sample: "Mana Community" },
      { name: "eventName", description: "Event Name", sample: "Annual Society Badminton Tournament" },
      { name: "recipientName", description: "Resident Name", sample: "Vikram Malhotra" },
      { name: "eventDateTime", description: "Start Date & Time", sample: "Tomorrow, 8:00 AM" },
      { name: "venueName", description: "Venue Location", sample: "Indoor Badminton Court" },
      { name: "instructions", description: "Special Instructions", sample: "Please arrive 20 minutes prior with non-marking sports shoes." },
      { name: "actionUrl", description: "View Event Schedule", sample: "https://manacommunity.app/events/schedule/205" },
      { name: "year", description: "Current Year", sample: "2026" },
    ],
    rawHtml: `<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title th:text="\${appName} + ' — Event Reminder'">Event Reminder</title>
</head>
<body style="margin:0;padding:0;background-color:#fffbeb;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fffbeb;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(217,119,6,0.12);border:1px solid #fef3c7;">
          <tr>
            <td style="background:linear-gradient(135deg, #f59e0b, #d97706);padding:28px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:0.02em;" th:text="\${appName}">Mana Community</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <div style="font-size:42px;line-height:1;margin-bottom:12px;">⏰</div>
              <span style="display:inline-block;padding:4px 12px;background-color:#fef3c7;color:#b45309;font-size:11px;font-weight:700;border-radius:9999px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">Starting Soon</span>
              <h1 style="margin:0 0 12px;font-size:24px;color:#78350f;font-weight:800;line-height:1.3;" th:text="\${eventName}">Annual Society Badminton Tournament</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
                Hi <strong th:text="\${recipientName}">Vikram</strong>, this is a quick reminder that <strong th:text="\${eventName}">the event</strong> begins tomorrow!
              </p>
              <div style="margin:0 0 24px;padding:18px;background-color:#fffbeb;border-radius:12px;border:1px solid #fde68a;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr><td style="padding:6px 0;color:#92400e;font-size:13px;font-weight:600;">Time</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#78350f;text-align:right;" th:text="\${eventDateTime}">Tomorrow, 8:00 AM</td></tr>
                  <tr><td style="padding:6px 0;color:#92400e;font-size:13px;font-weight:600;">Venue</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#78350f;text-align:right;" th:text="\${venueName}">Indoor Badminton Court</td></tr>
                </table>
              </div>
              <div style="margin:0 0 24px;padding:14px 18px;background-color:#f8fafc;border-left:4px solid #3b82f6;border-radius:8px;font-size:13px;color:#334155;line-height:1.6;" th:text="\${instructions}">
                Please arrive 20 minutes prior with non-marking sports shoes.
              </div>
              <a th:href="\${actionUrl}" href="#" style="display:inline-block;background:linear-gradient(135deg, #f59e0b, #d97706);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:700;box-shadow:0 2px 8px rgba(245,158,11,0.25);">View Live Schedule & Fixtures</a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background-color:#fffbeb;border-top:1px solid #fef3c7;">
              <p style="margin:0;font-size:12px;color:#92400e;line-height:1.5;">
                &copy; <span th:text="\${year}">2026</span> <span th:text="\${appName}">Mana Community</span>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    key: "EVENT_THANK_YOU",
    name: "Event Thank You & Highlights",
    subject: "Thank You for Joining {{eventName}}! 🙏",
    templateFile: "email/event-thank-you.html",
    category: "EVENT",
    triggerMenuPath: "Events → Post-Event",
    triggerWired: true,
    triggerDescription: "Sent automatically to all attendees after an event concludes with photo gallery links, winner highlights, and feedback survey.",
    variables: [
      { name: "appName", description: "Application Name", sample: "Mana Community" },
      { name: "eventName", description: "Event Name", sample: "Independence Day Carnival 2026" },
      { name: "recipientName", description: "Attendee Name", sample: "Deepa Nair" },
      { name: "highlightsText", description: "Event Summary", sample: "Over 350 residents joined us for flag hoisting, kids cultural dance performances, and community lunch." },
      { name: "galleryUrl", description: "Photo Gallery URL", sample: "https://manacommunity.app/gallery/id-2026" },
      { name: "feedbackUrl", description: "Feedback Survey URL", sample: "https://manacommunity.app/feedback/id-2026" },
      { name: "year", description: "Current Year", sample: "2026" },
    ],
    rawHtml: `<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title th:text="\${appName} + ' — Thank You!'">Thank You</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">
          <tr>
            <td style="background:linear-gradient(135deg, #6366f1, #4f46e5);padding:28px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:0.02em;" th:text="\${appName}">Mana Community</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <div style="font-size:42px;line-height:1;margin-bottom:12px;">🙏</div>
              <span style="display:inline-block;padding:4px 12px;background-color:#ede9fe;color:#5b21b6;font-size:11px;font-weight:700;border-radius:9999px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">Celebration Wrapped Up</span>
              <h1 style="margin:0 0 12px;font-size:24px;color:#1e1b4b;font-weight:800;line-height:1.3;">Thank you for making <span th:text="\${eventName}">the event</span> memorable!</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
                Dear <strong th:text="\${recipientName}">Deepa</strong>, our celebration would not have been complete without your presence and enthusiasm!
              </p>
              <div style="margin:0 0 24px;padding:20px;background-color:#f5f3ff;border-radius:12px;border:1px solid #ddd6fe;font-size:14px;color:#4c1d95;line-height:1.6;" th:text="\${highlightsText}">
                Over 350 residents joined us for flag hoisting, kids cultural dance performances, and community lunch.
              </div>
              <div style="margin:0 0 24px;text-align:center;">
                <a th:href="\${galleryUrl}" href="#" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700;margin-right:10px;">View Photo Gallery</a>
                <a th:href="\${feedbackUrl}" href="#" style="display:inline-block;background:#f1f5f9;color:#334155;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700;">Share Feedback</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">
                &copy; <span th:text="\${year}">2026</span> <span th:text="\${appName}">Mana Community</span>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    key: "EVENT_VOLUNTEER_INVITATION",
    name: "Volunteer Seva & Coordination Invitation",
    subject: "Join Us as a Volunteer for {{eventName}} 🤝",
    templateFile: "email/event-volunteer-invitation.html",
    category: "EVENT",
    triggerMenuPath: "Events → Volunteers",
    triggerWired: true,
    triggerDescription: "Invites resident volunteers for event organizing tasks like decoration, registration desks, food management, and stage coordination.",
    variables: [
      { name: "appName", description: "Application Name", sample: "Mana Community" },
      { name: "eventName", description: "Event Name", sample: "Ganesh Festival 2026" },
      { name: "recipientName", description: "Volunteer Name", sample: "Karthik Raja" },
      { name: "roleName", description: "Volunteer Role", sample: "Prasadam & Food Distribution Lead" },
      { name: "meetingTime", description: "Briefing Meeting", sample: "Saturday, 5:00 PM at Community Hall" },
      { name: "actionUrl", description: "Accept & Join Team", sample: "https://manacommunity.app/volunteers/accept/77" },
      { name: "year", description: "Current Year", sample: "2026" },
    ],
    rawHtml: `<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title th:text="\${appName} + ' — Volunteer Invitation'">Volunteer Invitation</title>
</head>
<body style="margin:0;padding:0;background-color:#faf5ff;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf5ff;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(126,34,206,0.12);border:1px solid #f3e8ff;">
          <tr>
            <td style="background:linear-gradient(135deg, #9333ea, #7e22ce);padding:28px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:0.02em;" th:text="\${appName}">Mana Community</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <div style="font-size:42px;line-height:1;margin-bottom:12px;">🤝</div>
              <span style="display:inline-block;padding:4px 12px;background-color:#f3e8ff;color:#7e22ce;font-size:11px;font-weight:700;border-radius:9999px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">Community Seva Call</span>
              <h1 style="margin:0 0 12px;font-size:24px;color:#581c87;font-weight:800;line-height:1.3;">Help us organize <span th:text="\${eventName}">Ganesh Festival 2026</span>!</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
                Hi <strong th:text="\${recipientName}">Karthik</strong>, our community events thrive because of energetic residents like you! We invite you to join the core organizing team.
              </p>
              <div style="margin:0 0 24px;padding:20px;background-color:#faf5ff;border-radius:12px;border:1px solid #e9d5ff;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr><td style="padding:6px 0;color:#7e22ce;font-size:13px;font-weight:600;">Proposed Team / Seva</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#581c87;text-align:right;" th:text="\${roleName}">Prasadam & Food Distribution Lead</td></tr>
                  <tr><td style="padding:6px 0;color:#7e22ce;font-size:13px;font-weight:600;">Team Briefing</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#581c87;text-align:right;" th:text="\${meetingTime}">Saturday, 5:00 PM at Community Hall</td></tr>
                </table>
              </div>
              <a th:href="\${actionUrl}" href="#" style="display:inline-block;background:linear-gradient(135deg, #9333ea, #7e22ce);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:700;box-shadow:0 2px 8px rgba(147,51,234,0.25);">Accept & Join Volunteer Team</a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background-color:#faf5ff;border-top:1px solid #f3e8ff;">
              <p style="margin:0;font-size:12px;color:#7e22ce;line-height:1.5;">
                &copy; <span th:text="\${year}">2026</span> <span th:text="\${appName}">Mana Community</span>. Thank you for your leadership and service!
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    key: "MATCH_REMINDER",
    name: "Sports Match Fixture Reminder",
    subject: "Your match starts soon: {{matchName}} ⏰",
    templateFile: "email/match-reminder.html",
    category: "MATCH",
    triggerMenuPath: "Sports → Schedule & Live Scores",
    triggerWired: true,
    triggerDescription: "Automatic background job — fires 60-90 minutes before a tournament match to remind players of their scheduled fixture.",
    variables: [
      { name: "appName", description: "Application Name", sample: "Mana Community" },
      { name: "recipientName", description: "Player Name", sample: "Rohit Sharma" },
      { name: "matchName", description: "Match Fixture", sample: "Quarter Final: Tower A Titans vs Tower C Strikers" },
      { name: "scheduledTime", description: "Match Time", sample: "Today at 4:30 PM" },
      { name: "courtVenue", description: "Court / Venue", sample: "Clubhouse Tennis Court 1" },
      { name: "actionUrl", description: "Live Score Link", sample: "https://manacommunity.app/sports/match/502" },
      { name: "year", description: "Current Year", sample: "2026" },
    ],
    rawHtml: `<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title th:text="\${appName} + ' — Match Reminder'">Match Reminder</title>
</head>
<body style="margin:0;padding:0;background-color:#fff7ed;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff7ed;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(234,88,12,0.12);border:1px solid #ffedd5;">
          <tr>
            <td style="background:linear-gradient(135deg, #ea580c, #c2410c);padding:28px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:0.02em;" th:text="\${appName}">Mana Community</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <div style="font-size:42px;line-height:1;margin-bottom:12px;">⏰</div>
              <span style="display:inline-block;padding:4px 12px;background-color:#ffedd5;color:#9a3412;font-size:11px;font-weight:700;border-radius:9999px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">Match Alert</span>
              <h1 style="margin:0 0 12px;font-size:22px;color:#7c2d12;font-weight:800;line-height:1.3;" th:text="\${matchName}">Quarter Final: Tower A Titans vs Tower C Strikers</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
                Hi <strong th:text="\${recipientName}">Rohit</strong>, your scheduled match is coming up shortly. Please warm up and be at the court on time!
              </p>
              <div style="margin:0 0 24px;padding:18px;background-color:#fff7ed;border-radius:12px;border:1px solid #fed7aa;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr><td style="padding:6px 0;color:#9a3412;font-size:13px;font-weight:600;">Scheduled Start</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#7c2d12;text-align:right;" th:text="\${scheduledTime}">Today at 4:30 PM</td></tr>
                  <tr><td style="padding:6px 0;color:#9a3412;font-size:13px;font-weight:600;">Court / Venue</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#7c2d12;text-align:right;" th:text="\${courtVenue}">Clubhouse Tennis Court 1</td></tr>
                </table>
              </div>
              <a th:href="\${actionUrl}" href="#" style="display:inline-block;background:linear-gradient(135deg, #ea580c, #c2410c);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:700;box-shadow:0 2px 8px rgba(234,88,12,0.25);">View Fixture Details & Scorecard</a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background-color:#fff7ed;border-top:1px solid #ffedd5;">
              <p style="margin:0;font-size:12px;color:#9a3412;line-height:1.5;">
                &copy; <span th:text="\${year}">2026</span> <span th:text="\${appName}">Mana Community</span>. Good luck for your match!
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    key: "PRIZE_DISTRIBUTION",
    name: "Prize Distribution & Trophy Ceremony",
    subject: "Your prize awaits — {{tournamentName}}! 🎁",
    templateFile: "email/prize-distribution.html",
    category: "PRIZE",
    triggerMenuPath: "Sports → Tournament Podium & Awards",
    triggerWired: true,
    triggerDescription: "Notifies medalists and champions of the prize distribution ceremony date, trophy collection, and cash prize vouchers.",
    variables: [
      { name: "appName", description: "Application Name", sample: "Mana Community" },
      { name: "recipientName", description: "Player Name", sample: "Suresh Raina" },
      { name: "position", description: "Position / Title", sample: "Champion (1st Place)" },
      { name: "tournamentName", description: "Tournament Name", sample: "Monsoon Cricket League 2026" },
      { name: "prize", description: "Prize Won", sample: "₹15,000 + Gold Trophy & Medal" },
      { name: "ceremonyDate", description: "Ceremony Timing", sample: "Sunday, Sep 14 · 6:30 PM" },
      { name: "venueName", description: "Ceremony Venue", sample: "Main Amphitheatre" },
      { name: "actionUrl", description: "Ceremony Details Link", sample: "https://manacommunity.app/sports/awards/902" },
      { name: "year", description: "Current Year", sample: "2026" },
    ],
    rawHtml: `<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title th:text="\${appName} + ' — Prize distribution'">Prize distribution</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2933;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color:#7c3aed;padding:28px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;" th:text="\${appName}">Mana Community</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <div style="font-size:40px;line-height:1;margin-bottom:8px;">🎁</div>
              <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Your prize awaits!</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
                Congratulations <strong th:text="\${recipientName}">Player</strong>! As the
                <strong th:text="\${position}">Champion</strong> of <strong th:text="\${tournamentName}">the tournament</strong>,
                here are your prize and ceremony details.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;margin-bottom:20px;">
                <tr>
                  <td style="padding:20px;text-align:center;">
                    <div style="font-size:12px;color:#6d28d9;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;margin-bottom:6px;">Your Prize</div>
                    <div style="font-size:20px;font-weight:700;color:#4c1d95;" th:text="\${prize}">₹15,000 + Gold Trophy & Medal</div>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
                <tr><td style="padding:8px 0;border-bottom:1px solid #eef0f2;color:#6b7280;font-size:13px;">Position</td><td style="padding:8px 0;border-bottom:1px solid #eef0f2;font-size:14px;text-align:right;font-weight:600;" th:text="\${position}">Champion</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid #eef0f2;color:#6b7280;font-size:13px;">Ceremony</td><td style="padding:8px 0;border-bottom:1px solid #eef0f2;font-size:14px;text-align:right;" th:text="\${ceremonyDate}">Sunday, Sep 14 · 6:30 PM</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Venue</td><td style="padding:8px 0;font-size:14px;text-align:right;" th:text="\${venueName}">Main Amphitheatre</td></tr>
              </table>
              <a th:href="\${actionUrl}" href="#" style="display:inline-block;background-color:#7c3aed;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">View ceremony details</a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background-color:#f9fafb;border-top:1px solid #eef0f2;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                &copy; <span th:text="\${year}">2026</span> <span th:text="\${appName}">Mana Community</span>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    key: "REGISTRATION_CONFIRMED",
    name: "Tournament Registration Confirmed",
    subject: "You're confirmed for {{tournamentName}}! 🏸",
    templateFile: "email/registration-confirmed.html",
    category: "REGISTRATION",
    triggerMenuPath: "Sports → Register · Admin → Registrations",
    triggerWired: true,
    triggerDescription: "Auto-sent to the player when their tournament entry is confirmed by the sports coordinator or after payment.",
    variables: [
      { name: "appName", description: "Application Name", sample: "Mana Community" },
      { name: "recipientName", description: "Player Name", sample: "Gautam Gambhir" },
      { name: "tournamentName", description: "Tournament", sample: "Table Tennis Open Championship" },
      { name: "category", description: "Category / Age Group", sample: "Men's Singles 18+" },
      { name: "startDate", description: "Tournament Start Date", sample: "Saturday, Oct 10, 2026" },
      { name: "actionUrl", description: "Participant Pass URL", sample: "https://manacommunity.app/sports/tournaments/110" },
      { name: "year", description: "Current Year", sample: "2026" },
    ],
    rawHtml: `<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title th:text="\${appName} + ' — Registration Confirmed'">Registration Confirmed</title>
</head>
<body style="margin:0;padding:0;background-color:#f0fdf4;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color:#16a34a;padding:28px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;" th:text="\${appName}">Mana Community</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <div style="font-size:40px;line-height:1;margin-bottom:8px;">✅</div>
              <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Registration Confirmed!</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
                Hi <strong th:text="\${recipientName}">Gautam</strong>, your registration for <strong th:text="\${tournamentName}">Table Tennis Open Championship</strong> has been confirmed!
              </p>
              <div style="background-color:#f8fafc;border-radius:8px;padding:16px;margin-bottom:24px;border:1px solid #e2e8f0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Category</td><td style="padding:6px 0;font-size:14px;font-weight:600;text-align:right;" th:text="\${category}">Men's Singles 18+</td></tr>
                  <tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Tournament Begins</td><td style="padding:6px 0;font-size:14px;font-weight:600;text-align:right;" th:text="\${startDate}">Saturday, Oct 10, 2026</td></tr>
                </table>
              </div>
              <a th:href="\${actionUrl}" href="#" style="display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">View tournament details</a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background-color:#f9fafb;border-top:1px solid #eef0f2;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                &copy; <span th:text="\${year}">2026</span> <span th:text="\${appName}">Mana Community</span>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    key: "REGISTRATION_OPEN",
    name: "Tournament Entries Open Notification",
    subject: "Registration is now open for {{tournamentName}}! 🏆",
    templateFile: "email/registration-open.html",
    category: "REGISTRATION",
    triggerMenuPath: "Sports → Admin → Tournament Announcements",
    triggerWired: true,
    triggerDescription: "Broadcast email sent to all sports enthusiasts when a new tournament is opened for registrations.",
    variables: [
      { name: "appName", description: "Application Name", sample: "Mana Community" },
      { name: "tournamentName", description: "Tournament Name", sample: "Inter-Society Badminton Smash 2026" },
      { name: "sportType", description: "Sport Type", sample: "Badminton" },
      { name: "deadlineDate", description: "Last Date to Register", sample: "September 25, 2026" },
      { name: "entryFee", description: "Entry Fee", sample: "₹300 / player" },
      { name: "actionUrl", description: "Register URL", sample: "https://manacommunity.app/sports/register/12" },
      { name: "year", description: "Current Year", sample: "2026" },
    ],
    rawHtml: `<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title th:text="\${appName} + ' — Tournament Registration Open'">Registrations Open</title>
</head>
<body style="margin:0;padding:0;background-color:#eff6ff;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eff6ff;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(37,99,235,0.12);border:1px solid #dbeafe;">
          <tr>
            <td style="background:linear-gradient(135deg, #2563eb, #1d4ed8);padding:28px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:0.02em;" th:text="\${appName}">Mana Community</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <div style="font-size:42px;line-height:1;margin-bottom:12px;">🏆</div>
              <span style="display:inline-block;padding:4px 12px;background-color:#dbeafe;color:#1d4ed8;font-size:11px;font-weight:700;border-radius:9999px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">Now Open For Entries</span>
              <h1 style="margin:0 0 12px;font-size:24px;color:#1e3a8a;font-weight:800;line-height:1.3;" th:text="\${tournamentName}">Inter-Society Badminton Smash 2026</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
                Calling all badminton enthusiasts! Slots are now open for singles and doubles categories. Register early to secure your slot in the fixture brackets!
              </p>
              <div style="margin:0 0 24px;padding:20px;background-color:#f0f9ff;border-radius:12px;border:1px solid #bae6fd;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr><td style="padding:6px 0;color:#0369a1;font-size:13px;font-weight:600;">Sport</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#075985;text-align:right;" th:text="\${sportType}">Badminton</td></tr>
                  <tr><td style="padding:6px 0;color:#0369a1;font-size:13px;font-weight:600;">Entry Fee</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#075985;text-align:right;" th:text="\${entryFee}">₹300 / player</td></tr>
                  <tr><td style="padding:6px 0;color:#0369a1;font-size:13px;font-weight:600;">Registration Deadline</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#075985;text-align:right;" th:text="\${deadlineDate}">September 25, 2026</td></tr>
                </table>
              </div>
              <a th:href="\${actionUrl}" href="#" style="display:inline-block;background:linear-gradient(135deg, #2563eb, #1d4ed8);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:700;box-shadow:0 2px 8px rgba(37,99,235,0.25);">Register for Tournament</a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background-color:#eff6ff;border-top:1px solid #dbeafe;">
              <p style="margin:0;font-size:12px;color:#1d4ed8;line-height:1.5;">
                &copy; <span th:text="\${year}">2026</span> <span th:text="\${appName}">Mana Community</span>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    key: "REGISTRATION_RECEIVED",
    name: "Registration Received & Under Review",
    subject: "We received your registration — {{tournamentName}}",
    templateFile: "email/registration-received.html",
    category: "REGISTRATION",
    triggerMenuPath: "Sports → Register",
    triggerWired: true,
    triggerDescription: "Sent when an entry is submitted that requires administrator approval before slot confirmation.",
    variables: [
      { name: "appName", description: "Application Name", sample: "Mana Community" },
      { name: "recipientName", description: "Player Name", sample: "Manoj Kumar" },
      { name: "tournamentName", description: "Tournament Name", sample: "Inter-Society Football Cup" },
      { name: "category", description: "Category", sample: "Senior Boys Under 19" },
      { name: "actionUrl", description: "Status Check Link", sample: "https://manacommunity.app/sports/my-registrations" },
      { name: "year", description: "Current Year", sample: "2026" },
    ],
    rawHtml: `<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title th:text="\${appName} + ' — Registration Received'">Registration Received</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2933;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color:#2563eb;padding:28px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;" th:text="\${appName}">Mana Community</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <div style="font-size:40px;line-height:1;margin-bottom:8px;">📥</div>
              <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">We received your registration</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
                Hi <strong th:text="\${recipientName}">Manoj</strong>, thanks for registering for <strong th:text="\${tournamentName}">the tournament</strong>! Your entry has been submitted and is currently pending review by tournament organizers.
              </p>
              <div style="background-color:#f8fafc;border-radius:8px;padding:16px;margin-bottom:24px;border:1px solid #e2e8f0;">
                <p style="margin:0;font-size:13px;color:#475569;">
                  You will receive another email once your registration status is updated.
                </p>
              </div>
              <a th:href="\${actionUrl}" href="#" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">Check registration status</a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background-color:#f9fafb;border-top:1px solid #eef0f2;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                &copy; <span th:text="\${year}">2026</span> <span th:text="\${appName}">Mana Community</span>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    key: "REGISTRATION_REJECTED",
    name: "Registration Declined Notification",
    subject: "Update on your registration for {{tournamentName}}",
    templateFile: "email/registration-rejected.html",
    category: "REGISTRATION",
    triggerMenuPath: "Sports → Admin → Registrations",
    triggerWired: true,
    triggerDescription: "Sent when an administrator rejects or cancels an unverified or duplicate registration with a specific reason.",
    variables: [
      { name: "appName", description: "Application Name", sample: "Mana Community" },
      { name: "recipientName", description: "Player Name", sample: "Nitin Gadkari" },
      { name: "tournamentName", description: "Tournament Name", sample: "Inter-Society Squash Open" },
      { name: "reason", description: "Rejection Reason", sample: "Tournament category is fully booked or age group criteria was not met." },
      { name: "actionUrl", description: "Contact Admin URL", sample: "https://manacommunity.app/helpdesk" },
      { name: "year", description: "Current Year", sample: "2026" },
    ],
    rawHtml: `<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title th:text="\${appName} + ' — Registration update'">Registration Update</title>
</head>
<body style="margin:0;padding:0;background-color:#fef2f2;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color:#dc2626;padding:28px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;" th:text="\${appName}">Mana Community</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <div style="font-size:40px;line-height:1;margin-bottom:8px;">⚠️</div>
              <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Registration Update</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
                Hi <strong th:text="\${recipientName}">Nitin</strong>, unfortunately your registration for <strong th:text="\${tournamentName}">the tournament</strong> could not be approved at this time.
              </p>
              <div style="background-color:#fee2e2;border-radius:8px;padding:16px;margin-bottom:24px;border:1px solid #fecaca;">
                <p style="margin:0;font-size:14px;color:#991b1b;line-height:1.5;">
                  <strong>Reason:</strong> <span th:text="\${reason}">Tournament category is fully booked.</span>
                </p>
              </div>
              <a th:href="\${actionUrl}" href="#" style="display:inline-block;background-color:#dc2626;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">Contact Sports Committee</a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background-color:#fff1f2;border-top:1px solid #fee2e2;">
              <p style="margin:0;font-size:12px;color:#991b1b;line-height:1.5;">
                &copy; <span th:text="\${year}">2026</span> <span th:text="\${appName}">Mana Community</span>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    key: "SCHEDULE_PUBLISHED",
    name: "Tournament Match Schedule Live",
    subject: "Match schedule is live: {{tournamentName}} 📅",
    templateFile: "email/schedule-published.html",
    category: "TOURNAMENT",
    triggerMenuPath: "Sports → Schedule",
    triggerWired: true,
    triggerDescription: "Fires when the fixtures, rounds, and knockout schedule are officially published by the tournament organizers.",
    variables: [
      { name: "appName", description: "Application Name", sample: "Mana Community" },
      { name: "recipientName", description: "Player Name", sample: "Krunal Pandya" },
      { name: "tournamentName", description: "Tournament Name", sample: "Society Volleyball Tournament" },
      { name: "firstMatchTime", description: "Your First Fixture", sample: "Sunday at 10:00 AM" },
      { name: "actionUrl", description: "Schedule Bracket Link", sample: "https://manacommunity.app/sports/schedule/44" },
      { name: "year", description: "Current Year", sample: "2026" },
    ],
    rawHtml: `<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title th:text="\${appName} + ' — Schedule Published'">Schedule Published</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2933;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color:#4f46e5;padding:28px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;" th:text="\${appName}">Mana Community</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <div style="font-size:40px;line-height:1;margin-bottom:8px;">📅</div>
              <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Match Schedule is Live!</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
                Hi <strong th:text="\${recipientName}">Krunal</strong>, the official match schedule and knockout fixtures for <strong th:text="\${tournamentName}">the tournament</strong> have been published!
              </p>
              <div style="background-color:#eef2ff;border-radius:8px;padding:16px;margin-bottom:24px;border:1px solid #c7d2fe;">
                <p style="margin:0;font-size:14px;color:#3730a3;line-height:1.5;">
                  <strong>First Match:</strong> <span th:text="\${firstMatchTime}">Sunday at 10:00 AM</span>
                </p>
              </div>
              <a th:href="\${actionUrl}" href="#" style="display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">View match fixtures & bracket</a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background-color:#f9fafb;border-top:1px solid #eef0f2;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                &copy; <span th:text="\${year}">2026</span> <span th:text="\${appName}">Mana Community</span>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    key: "TOURNAMENT_ANNOUNCEMENT",
    name: "Grand Sports Tournament Announcement",
    subject: "Tournament Announcement: {{tournamentName}} 🏆",
    templateFile: "email/tournament-announcement.html",
    category: "ANNOUNCEMENT",
    triggerMenuPath: "Sports → Admin → Tournament Announcement",
    triggerWired: true,
    triggerDescription: "Comprehensive newsletter and banner announcement sent to announce upcoming sports cups, rules, and sponsor tie-ups.",
    variables: [
      { name: "appName", description: "Application Name", sample: "Mana Community" },
      { name: "tournamentName", description: "Tournament Name", sample: "Mana Premier League (MPL) Cricket 2026" },
      { name: "startDate", description: "Kickoff Date", sample: "October 15, 2026" },
      { name: "venue", description: "Venue Ground", sample: "Main Cricket Grounds" },
      { name: "prizePool", description: "Total Prize Pool", sample: "₹1,00,000" },
      { name: "actionUrl", description: "Tournament Portal URL", sample: "https://manacommunity.app/sports/tournaments/mpl" },
      { name: "year", description: "Current Year", sample: "2026" },
    ],
    rawHtml: `<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title th:text="\${appName} + ' — Tournament Announcement'">Tournament Announcement</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#f8fafc;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#1e293b;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.3);border:1px solid #334155;">
          <tr>
            <td style="background:linear-gradient(135deg, #6366f1, #4338ca);padding:36px 32px;text-align:center;">
              <div style="font-size:48px;line-height:1;margin-bottom:12px;">🏆</div>
              <h1 style="margin:0 0 8px;font-size:26px;color:#ffffff;font-weight:900;" th:text="\${tournamentName}">Mana Premier League (MPL) Cricket 2026</h1>
              <span style="display:inline-block;padding:4px 14px;background-color:rgba(255,255,255,0.2);color:#ffffff;font-size:12px;font-weight:700;border-radius:9999px;text-transform:uppercase;letter-spacing:0.05em;">Grand Sports Spectacle</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#cbd5e1;">
                Get ready for the biggest sporting event of the season! Multiple teams will battle it out over two intense weeks of thrilling competition and community glory.
              </p>
              <div style="margin:0 0 24px;padding:20px;background-color:#0f172a;border-radius:12px;border:1px solid #334155;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;">Kickoff Date</td><td style="padding:8px 0;font-size:14px;font-weight:700;color:#f8fafc;text-align:right;" th:text="\${startDate}">October 15, 2026</td></tr>
                  <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;">Venue</td><td style="padding:8px 0;font-size:14px;font-weight:700;color:#f8fafc;text-align:right;" th:text="\${venue}">Main Cricket Grounds</td></tr>
                  <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;">Total Prize Pool</td><td style="padding:8px 0;font-size:15px;font-weight:800;color:#38bdf8;text-align:right;" th:text="\${prizePool}">₹1,00,000</td></tr>
                </table>
              </div>
              <div style="text-align:center;">
                <a th:href="\${actionUrl}" href="#" style="display:inline-block;background:linear-gradient(135deg, #6366f1, #4338ca);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:800;box-shadow:0 4px 14px rgba(99,102,241,0.4);">View Teams, Auction & Rules</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background-color:#0f172a;border-top:1px solid #334155;">
              <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">
                &copy; <span th:text="\${year}">2026</span> <span th:text="\${appName}">Mana Community</span>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    key: "TOURNAMENT_COMPLETION",
    name: "Tournament Final Results & Highlights",
    subject: "Tournament results are in: {{tournamentName}} 🏆",
    templateFile: "email/tournament-completion.html",
    category: "TOURNAMENT",
    triggerMenuPath: "Sports → Schedule (Final Bracket)",
    triggerWired: true,
    triggerDescription: "Fires automatically to all participants and society residents once the final championship match is completed.",
    variables: [
      { name: "appName", description: "Application Name", sample: "Mana Community" },
      { name: "tournamentName", description: "Tournament Name", sample: "Badminton Super League 2026" },
      { name: "winnerName", description: "Champion Winner / Team", sample: "Tower B Smashers (Abhishek & Neha)" },
      { name: "runnerUpName", description: "Runner Up", sample: "Tower A Aces (Kiran & Rahul)" },
      { name: "actionUrl", description: "Final Scorecard URL", sample: "https://manacommunity.app/sports/tournaments/bsl/results" },
      { name: "year", description: "Current Year", sample: "2026" },
    ],
    rawHtml: `<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title th:text="\${appName} + ' — Tournament Results'">Tournament Results</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2933;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color:#6366f1;padding:28px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;" th:text="\${appName}">Mana Community</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <div style="font-size:40px;line-height:1;margin-bottom:8px;">🏆</div>
              <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Tournament Results Are In!</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
                What an incredible finale! <strong th:text="\${tournamentName}">the tournament</strong> has officially concluded with spectacular matches.
              </p>
              <div style="background-color:#f5f3ff;border-radius:8px;padding:20px;margin-bottom:24px;border:1px solid #ddd6fe;">
                <div style="font-size:12px;color:#6d28d9;text-transform:uppercase;font-weight:700;margin-bottom:8px;">🥇 Champions</div>
                <div style="font-size:18px;font-weight:800;color:#4c1d95;margin-bottom:12px;" th:text="\${winnerName}">Tower B Smashers</div>
                <div style="font-size:12px;color:#6d28d9;text-transform:uppercase;font-weight:700;margin-bottom:4px;">🥈 Runners Up</div>
                <div style="font-size:15px;font-weight:700;color:#6b21a8;" th:text="\${runnerUpName}">Tower A Aces</div>
              </div>
              <a th:href="\${actionUrl}" href="#" style="display:inline-block;background-color:#6366f1;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">View full final leaderboard & stats</a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background-color:#f9fafb;border-top:1px solid #eef0f2;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                &copy; <span th:text="\${year}">2026</span> <span th:text="\${appName}">Mana Community</span>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    key: "TOURNAMENT_OPEN",
    name: "Tournament Open Announcement",
    subject: "Tournament Registration Open: {{tournamentName}} 🏆",
    templateFile: "email/tournament-open.html",
    category: "TOURNAMENT",
    triggerMenuPath: "Sports → Admin → Tournament management",
    triggerWired: true,
    triggerDescription: "Triggered by the sports administrator to alert all community residents that tournament entries are open.",
    variables: [
      { name: "appName", description: "Application Name", sample: "Mana Community" },
      { name: "tournamentName", description: "Tournament Name", sample: "Inter-Tower Cricket Championship" },
      { name: "registrationDeadline", description: "Last Date", sample: "Sunday, Sep 20" },
      { name: "actionUrl", description: "Register Link", sample: "https://manacommunity.app/sports/tournaments/cricket" },
      { name: "year", description: "Current Year", sample: "2026" },
    ],
    rawHtml: `<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title th:text="\${appName} + ' — Tournament Open'">Tournament Open</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2933;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color:#7c3aed;padding:28px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;" th:text="\${appName}">Mana Community</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <div style="font-size:40px;line-height:1;margin-bottom:8px;">🏆</div>
              <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Tournament Registration is Open!</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
                Registrations for <strong th:text="\${tournamentName}">the tournament</strong> are officially open. Gather your team and sign up before slots run out!
              </p>
              <div style="background-color:#faf5ff;border-radius:8px;padding:16px;margin-bottom:24px;border:1px solid #e9d5ff;">
                <p style="margin:0;font-size:14px;color:#6b21a8;">
                  <strong>Registration Closes:</strong> <span th:text="\${registrationDeadline}">Sunday, Sep 20</span>
                </p>
              </div>
              <a th:href="\${actionUrl}" href="#" style="display:inline-block;background-color:#7c3aed;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">Register your team now</a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background-color:#f9fafb;border-top:1px solid #eef0f2;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                &copy; <span th:text="\${year}">2026</span> <span th:text="\${appName}">Mana Community</span>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    key: "TOURNAMENT_START",
    name: "Tournament Day 1 Kickoff & Opening Ceremony",
    subject: "The Games Have Begun: {{tournamentName}} 🏁",
    templateFile: "email/tournament-start.html",
    category: "TOURNAMENT",
    triggerMenuPath: "Sports → Tournament Live Tracker",
    triggerWired: true,
    triggerDescription: "Fires on Day 1 of the tournament to announce the opening matches, court timings, and live scorecard links.",
    variables: [
      { name: "appName", description: "Application Name", sample: "Mana Community" },
      { name: "tournamentName", description: "Tournament Name", sample: "Summer Smash Cup 2026" },
      { name: "recipientName", description: "Player Name", sample: "Arjun Reddy" },
      { name: "description", description: "Organizer Welcome Note", sample: "Welcome to Day 1! 16 teams are participating with knockout matches all week." },
      { name: "sportName", description: "Sport Name", sample: "Badminton" },
      { name: "openingTime", description: "Opening Time", sample: "Today at 9:00 AM" },
      { name: "venueName", description: "Venue Ground", sample: "Main Sports Complex Court 1 & 2" },
      { name: "firstFixture", description: "Opening Match", sample: "Smashers vs Hawks" },
      { name: "actionUrl", description: "Live Scoreboard Link", sample: "https://manacommunity.app/sports/live" },
      { name: "year", description: "Current Year", sample: "2026" },
    ],
    rawHtml: `<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title th:text="\${appName} + ' — Tournament Started!'">Tournament Started!</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2933;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#2563eb 60%,#3b82f6 100%);padding:40px 32px 32px;text-align:center;">
              <div style="font-size:48px;line-height:1;margin-bottom:12px;">🏁</div>
              <h1 style="margin:0 0 6px;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">The Games Have Begun!</h1>
              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);font-weight:500;" th:text="\${tournamentName}">Summer Smash Cup 2026</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#4b5563;">
                Hi <strong th:text="\${recipientName}">Player</strong>, the wait is officially over!
                We are thrilled to welcome you to the opening of <strong th:text="\${tournamentName}">the tournament</strong>.
              </p>
              <div style="background-color:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;margin-bottom:24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr><td style="padding:12px 18px;border-bottom:1px solid #e2e8f0;color:#6b7280;font-size:13px;width:40%;">Tournament</td><td style="padding:12px 18px;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:600;color:#1e293b;text-align:right;" th:text="\${tournamentName}">Summer Smash Cup</td></tr>
                  <tr><td style="padding:12px 18px;border-bottom:1px solid #e2e8f0;color:#6b7280;font-size:13px;">Sport</td><td style="padding:12px 18px;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:500;color:#1e293b;text-align:right;" th:text="\${sportName}">Badminton</td></tr>
                  <tr><td style="padding:12px 18px;border-bottom:1px solid #e2e8f0;color:#6b7280;font-size:13px;">Opening Time</td><td style="padding:12px 18px;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:500;color:#1e293b;text-align:right;" th:text="\${openingTime}">Today at 9:00 AM</td></tr>
                  <tr><td style="padding:12px 18px;border-bottom:1px solid #e2e8f0;color:#6b7280;font-size:13px;">Venue</td><td style="padding:12px 18px;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:500;color:#1e293b;text-align:right;" th:text="\${venueName}">Main Sports Complex</td></tr>
                </table>
              </div>
              <a th:href="\${actionUrl}" href="#" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">Follow live scores & fixtures</a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background-color:#f9fafb;border-top:1px solid #eef0f2;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                &copy; <span th:text="\${year}">2026</span> <span th:text="\${appName}">Mana Community</span>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    key: "WINNER_NOTIFICATION",
    name: "Match Winner & Next Round Notification",
    subject: "You won your match! 🎉 — {{tournamentName}}",
    templateFile: "email/winner-notification.html",
    category: "MATCH",
    triggerMenuPath: "Sports → Match Results",
    triggerWired: true,
    triggerDescription: "Auto-dispatched immediately after a match umpire saves the final match scorecard to notify winning players of qualification to the next round.",
    variables: [
      { name: "appName", description: "Application Name", sample: "Mana Community" },
      { name: "recipientName", description: "Player Name", sample: "Neeraj Chopra" },
      { name: "tournamentName", description: "Tournament Name", sample: "Annual Society Sports Gala" },
      { name: "matchScore", description: "Winning Score", sample: "21-18, 21-14 (Won in straight sets)" },
      { name: "nextRound", description: "Next Round", sample: "Semi-Finals (Tomorrow at 5:00 PM)" },
      { name: "actionUrl", description: "Match Scorecard URL", sample: "https://manacommunity.app/sports/match/score/812" },
      { name: "year", description: "Current Year", sample: "2026" },
    ],
    rawHtml: `<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title th:text="\${appName} + ' — Match Victory'">Match Victory</title>
</head>
<body style="margin:0;padding:0;background-color:#f0fdf4;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color:#16a34a;padding:28px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;" th:text="\${appName}">Mana Community</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <div style="font-size:40px;line-height:1;margin-bottom:8px;">🎉</div>
              <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">You Won Your Match!</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
                Congratulations <strong th:text="\${recipientName}">Neeraj</strong>! You have won your match in <strong th:text="\${tournamentName}">the tournament</strong> and advanced to the next round.
              </p>
              <div style="background-color:#f0fdf4;border-radius:8px;padding:16px;margin-bottom:24px;border:1px solid #bbf7d0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr><td style="padding:6px 0;color:#166534;font-size:13px;">Final Score</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#14532d;text-align:right;" th:text="\${matchScore}">21-18, 21-14</td></tr>
                  <tr><td style="padding:6px 0;color:#166534;font-size:13px;">Next Fixture</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#14532d;text-align:right;" th:text="\${nextRound}">Semi-Finals (Tomorrow at 5:00 PM)</td></tr>
                </table>
              </div>
              <a th:href="\${actionUrl}" href="#" style="display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">View updated tournament bracket</a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background-color:#f9fafb;border-top:1px solid #eef0f2;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                &copy; <span th:text="\${year}">2026</span> <span th:text="\${appName}">Mana Community</span>. Keep up the great form!
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  }
];

export function renderSampleHtml(template: SystemEmailTemplate, customOverrides?: Record<string, unknown>): string {
  let html = template.rawHtml;

  // Merge sample data with custom overrides
  const data: Record<string, string> = {};
  template.variables.forEach((v) => {
    data[v.name] = v.sample;
  });

  if (customOverrides) {
    Object.keys(customOverrides).forEach((k) => {
      if (customOverrides[k] !== undefined && customOverrides[k] !== null && String(customOverrides[k]).trim() !== "") {
        data[k] = String(customOverrides[k]);
      }
    });
  }

  // Inject Custom Banner Image if supplied
  if (customOverrides?.bannerUrl) {
    const bannerBlock = `
      <tr>
        <td style="padding:0;text-align:center;background-color:#ffffff;">
          <img src="${customOverrides.bannerUrl}" alt="Banner" style="max-width:100%;height:auto;display:block;border-bottom:1px solid #e2e8f0;" />
        </td>
      </tr>
    `;
    html = html.replace('<!-- Header -->', `<!-- Header -->\n${bannerBlock}`);
    html = html.replace('<!-- Saffron Header -->', `<!-- Saffron Header -->\n${bannerBlock}`);
    html = html.replace('<!-- Red/Orange Header -->', `<!-- Red/Orange Header -->\n${bannerBlock}`);
    html = html.replace('<!-- Hero Header with Gradient -->', `<!-- Hero Header with Gradient -->\n${bannerBlock}`);
  }

  // Inject Custom Sponsor Image if supplied
  if (customOverrides?.sponsorImageUrl) {
    const sponsorBlock = `
      <tr>
        <td style="padding:16px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
          <span style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:6px;">Official Event Sponsor</span>
          <img src="${customOverrides.sponsorImageUrl}" alt="Sponsor Logo" style="max-height:45px;max-width:180px;display:inline-block;" />
        </td>
      </tr>
    `;
    html = html.replace('<!-- Footer -->', `${sponsorBlock}\n<!-- Footer -->`);
  }

  // Replace Thymeleaf \${varName} expressions
  Object.keys(data).forEach((key) => {
    const regex = new RegExp(`\\$\\{${key}\\}`, "g");
    html = html.replace(regex, data[key]);
  });

  // Clean remaining th:text="..." attributes
  html = html.replace(/th:text="[^"]*"/g, "");
  html = html.replace(/th:href="[^"]*"/g, "");
  html = html.replace(/th:if="[^"]*"/g, "");
  html = html.replace(/th:unless="[^"]*"/g, "");

  return html;
}
