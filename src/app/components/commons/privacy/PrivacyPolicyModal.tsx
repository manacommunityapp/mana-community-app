import React, { useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  Database,
  UserCheck,
  Ban,
  FileCheck2,
  CalendarCheck,
  ArrowRightLeft,
  Clock,
  Trash2,
  HeartHandshake,
  X,
  Sparkles,
  Mail,
  Phone,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Current notice version — must be passed as consentNoticeVersion at registration. */
export const PRIVACY_NOTICE_VERSION = "2026-10-13-v1";

export const PRIVACY_POINTS = [
  {
    icon: FileCheck2,
    title: "Data Minimization",
    description: "We collect only the information required for community management and the services you use.",
    accent: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: Database,
    title: "Secure Storage",
    description: "Community data is securely stored in our AWS-hosted PostgreSQL database with encryption at rest.",
    accent: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
  },
  {
    icon: UserCheck,
    title: "Access Control",
    description: "Personal information is accessible only to authorised users and administrators based on their roles and permissions.",
    accent: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: Ban,
    title: "No Commercial Sharing",
    description: "We do not sell, rent, or commercially share your personal information with any third party for their own marketing.",
    accent: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  },
  {
    icon: ShieldCheck,
    title: "No Aadhaar or PAN",
    description: "We do not require or intentionally store Aadhaar, PAN, or similar government identity documents in the application.",
    accent: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: CalendarCheck,
    title: "Purpose-Limited Use",
    description: "Your information is used only for legitimate community purposes: resident management, events, Pooja/Seva registrations, communication, and community administration.",
    accent: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: ArrowRightLeft,
    title: "Secure Data Transfer",
    description: "All data is transferred over HTTPS/TLS. Information from approved onboarding processes is imported securely; unnecessary duplicates are not retained.",
    accent: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: Clock,
    title: "Data Retention",
    description: "Account data: retained while the account is active + 2 years after deletion. Financial records: 7 years (statutory). Access logs: 1 year. Biometric templates: deleted on dis-enrolment.",
    accent: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  },
  {
    icon: Trash2,
    title: "Deletion & Erasure",
    description: "You may request correction or deletion of your personal information via the Privacy Centre, subject to lawful retention obligations.",
    accent: "text-red-500 bg-red-500/10 border-red-500/20",
  },
];

const DATA_COLLECTED = [
  { category: "Identity", items: "Full name, gender, date of birth", purpose: "Resident identity & community directory" },
  { category: "Contact", items: "Email address, phone number", purpose: "Authentication, notifications, emergency alerts" },
  { category: "Residence", items: "Block, flat number, occupancy type", purpose: "Resident management & gate access" },
  { category: "Financial", items: "Payment reference IDs via Razorpay (no card data stored)", purpose: "Maintenance dues, event fees, amenity booking" },
  { category: "Usage", items: "App activity logs, feature interactions", purpose: "Platform performance & security (analytics, with consent)" },
  { category: "Device", items: "Push notification token (FCM/APNs)", purpose: "Push notification delivery (with consent)" },
  { category: "Biometric*", items: "Fingerprint / face hash (not raw image)", purpose: "Turnstile gate access (with explicit separate consent)" },
];

const THIRD_PARTIES = [
  { name: "Razorpay", purpose: "Payment processing", privacyUrl: "https://razorpay.com/privacy/" },
  { name: "Brevo (formerly Sendinblue)", purpose: "Transactional email delivery", privacyUrl: "https://www.brevo.com/legal/privacypolicy/" },
  { name: "Firebase / Google (FCM)", purpose: "Push notifications", privacyUrl: "https://policies.google.com/privacy" },
  { name: "AWS (Amazon Web Services)", purpose: "Cloud hosting, S3 media storage, RDS PostgreSQL", privacyUrl: "https://aws.amazon.com/privacy/" },
  { name: "Anthropic Claude API", purpose: "AI assistant features (opt-in only; no PII sent without consent)", privacyUrl: "https://www.anthropic.com/privacy" },
];

export function PrivacyContent() {
  return (
    <div className="space-y-7 text-foreground">
      {/* Legal Notice Banner */}
      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
          <strong>[LEGAL REVIEW REQUIRED]</strong> This Privacy Notice is a working draft pending
          legal review for compliance with the <strong>DPDP Act 2023</strong> and applicable Rules.
          Items marked with * or [LEGAL REVIEW] require legal sign-off before publication.
          Notice version: <code className="font-mono">{PRIVACY_NOTICE_VERSION}</code>
        </p>
      </div>

      {/* Intro Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-indigo-500/10 to-purple-500/10 border border-primary/20">
        <div className="flex items-center gap-2 mb-2 text-primary font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Privacy Notice — DPDP Act 2023 Compliant</span>
        </div>
        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-medium">
          At <strong className="text-foreground font-extrabold">My Community Hub</strong>, your privacy is important to us.
          This notice explains what personal data we collect, why, for how long, and your rights
          under the <strong className="text-primary">Digital Personal Data Protection Act 2023 (India)</strong>.
        </p>
        <p className="text-[11px] text-muted-foreground mt-2">
          Data Fiduciary: Mana Community Pvt. Ltd. &nbsp;|&nbsp; Effective: October 2026 &nbsp;|&nbsp;
          Version: {PRIVACY_NOTICE_VERSION}
        </p>
      </div>

      {/* Data We Collect */}
      <div>
        <h4 className="text-sm sm:text-base font-extrabold text-foreground mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          What Personal Data We Collect
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-3 py-2 font-bold text-foreground border border-border rounded-tl-lg">Category</th>
                <th className="text-left px-3 py-2 font-bold text-foreground border border-border">Data Items</th>
                <th className="text-left px-3 py-2 font-bold text-foreground border border-border rounded-tr-lg">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {DATA_COLLECTED.map((row, i) => (
                <tr key={i} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 font-semibold text-foreground border-x border-border">{row.category}</td>
                  <td className="px-3 py-2 text-muted-foreground border-x border-border">{row.items}</td>
                  <td className="px-3 py-2 text-muted-foreground border-x border-border">{row.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">
          * Biometric data is processed only with your explicit, separate consent and is never shared with third parties.
        </p>
      </div>

      {/* Legal Basis */}
      <div className="p-4 rounded-xl bg-card border border-border space-y-2">
        <h4 className="text-xs font-extrabold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Legal Basis for Processing (DPDP Act 2023, s.4–7)
        </h4>
        <ul className="space-y-1 text-[11px] text-muted-foreground list-disc list-inside">
          <li><strong className="text-foreground">Consent (s.6):</strong> Registration, marketing communications, analytics, biometric enrolment.</li>
          <li><strong className="text-foreground">Legitimate Uses (s.7):</strong> Emergency safety, court orders, public-authority obligations.</li>
          <li><strong className="text-foreground">Contractual necessity:</strong> Account creation and community management services.</li>
          <li><strong className="text-foreground">Legal obligation:</strong> Financial record retention (7 years), statutory compliance.</li>
        </ul>
      </div>

      {/* Retention */}
      <div>
        <h4 className="text-sm font-extrabold text-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          Data Retention Periods
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { type: "Account & profile data", period: "Active + 2 years after deletion" },
            { type: "Financial / payment records", period: "7 years (Companies Act / GST)" },
            { type: "Access & audit logs", period: "12 months" },
            { type: "Chat & feed messages", period: "As long as you are a member" },
            { type: "Biometric templates", period: "Deleted on dis-enrolment or account closure" },
            { type: "Consent records", period: "7 years (immutable audit trail)" },
          ].map((r, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/50">
              <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-foreground">{r.type}</p>
                <p className="text-[10px] text-muted-foreground">{r.period}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Third Parties */}
      <div>
        <h4 className="text-sm font-extrabold text-foreground mb-3 flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-cyan-500" />
          Third-Party Service Providers
        </h4>
        <p className="text-[11px] text-muted-foreground mb-2">
          We share data only as necessary with the following processors. We do not sell your data.
        </p>
        <div className="space-y-1.5">
          {THIRD_PARTIES.map((tp, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border/80 text-[11px]">
              <div>
                <span className="font-semibold text-foreground">{tp.name}</span>
                <span className="text-muted-foreground ml-2">— {tp.purpose}</span>
              </div>
              <a
                href={tp.privacyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline shrink-0 ml-2"
              >
                Privacy Policy ↗
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Your Rights */}
      <div>
        <h4 className="text-sm font-extrabold text-foreground mb-3 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-primary" />
          Your Rights Under DPDP Act 2023 (s.11–14)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {[
            { right: "Right to Information (s.11)", desc: "Know what data we hold about you. Use 'My Personal Data' in Privacy Centre." },
            { right: "Right to Correction (s.12)", desc: "Correct inaccurate or incomplete data. Submit via Data Rights form in Privacy Centre." },
            { right: "Right to Erasure (s.12)", desc: "Request deletion of your account and data (subject to lawful retention). Use Deletion Request in Privacy Centre." },
            { right: "Right to Grievance Redressal (s.13)", desc: "Lodge a complaint with our Grievance Officer within 30 days." },
            { right: "Right to Nominate (s.14)", desc: "Nominate a person to exercise rights on your behalf in the event of death or incapacity. [LEGAL REVIEW REQUIRED]" },
            { right: "Right to Withdraw Consent (s.6)", desc: "Withdraw consent at any time via the Consent tab in Privacy Centre. Withdrawal does not affect prior processing." },
          ].map((r, i) => (
            <div key={i} className="p-3 rounded-xl bg-card border border-border/80 text-[11px]">
              <p className="font-bold text-foreground mb-0.5">{r.right}</p>
              <p className="text-muted-foreground leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How We Protect Your Data */}
      <div>
        <h4 className="text-sm sm:text-base font-extrabold text-foreground mb-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          How We Protect Your Data
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
          {PRIVACY_POINTS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-card border border-border/80 shadow-xs hover:border-primary/30 transition-all flex items-start gap-3"
              >
                <div className={`p-2 rounded-lg shrink-0 border ${item.accent}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-bold text-foreground mb-0.5">{item.title}</h5>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grievance Officer */}
      <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3">
        <h4 className="text-sm font-extrabold text-foreground flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          Grievance Officer Contact (DPDP Act 2023, s.13)
        </h4>
        <div className="text-[11px] text-muted-foreground space-y-1">
          <p><strong className="text-foreground">Name:</strong> Data Protection Officer, Mana Community Pvt. Ltd.</p>
          <p><strong className="text-foreground">Email:</strong>{" "}
            <a href="mailto:dpo@manacommunity.app" className="text-primary hover:underline">dpo@manacommunity.app</a>
          </p>
          <p><strong className="text-foreground">Address:</strong> [LEGAL REVIEW REQUIRED: Insert registered office address]</p>
          <p><strong className="text-foreground">Response Time:</strong> Within 30 days of receipt</p>
        </div>
        <div className="pt-2 border-t border-border/60">
          <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            [LEGAL REVIEW REQUIRED] DPO details, registered address, and response timelines must be verified by legal counsel before publication.
          </p>
        </div>
      </div>

      {/* Updates */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border/60 flex items-start gap-2">
        <RefreshCw className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Updates to this Notice:</strong> We will notify you of material changes by email and via an in-app banner before the changes take effect.
          The current version is <code className="font-mono text-primary">{PRIVACY_NOTICE_VERSION}</code>.
        </p>
      </div>

      {/* Commitment */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 space-y-3 shadow-xs">
        <h4 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 text-emerald-500" />
          Our Commitment
        </h4>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          We believe your community information belongs to the community. Our goal is to ensure that personal information is{" "}
          <strong className="text-foreground">collected responsibly, used only for legitimate purposes, protected from unauthorised access, and removed when it is no longer required</strong>.
        </p>
        <div className="pt-2 border-t border-border/60">
          <p className="text-xs sm:text-sm font-bold text-primary flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Your privacy is not an add-on — it is part of how My Community is designed.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-background border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-border bg-card/70 backdrop-blur-sm flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
              <Lock className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight flex items-center gap-1.5">
                Privacy Notice
              </h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">
                My Community Hub · DPDP Act 2023 Compliant · v{PRIVACY_NOTICE_VERSION}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[calc(90vh-130px)] hide-scrollbar" style={{ scrollbarWidth: "thin" }}>
          <PrivacyContent />
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-border bg-card/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>DPDP Act 2023 Compliant</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
