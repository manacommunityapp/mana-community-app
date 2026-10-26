import React from "react";
import { Link } from "react-router";
import { FileText, ArrowLeft, ShieldCheck, AlertTriangle } from "lucide-react";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    content: `By registering for or using My Community Hub ("Platform"), you agree to be bound by these Terms of Use. If you do not agree, do not use the Platform.`,
  },
  {
    title: "2. Eligibility",
    content: `The Platform is available to residents, owners, tenants, and staff of communities that have subscribed to My Community Hub. You must be at least 18 years of age to create an account.`,
  },
  {
    title: "3. Account Responsibilities",
    content: `You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account. Notify us immediately at dpo@manacommunity.app if you suspect unauthorised access.`,
  },
  {
    title: "4. Acceptable Use",
    content: `You agree not to: (a) post unlawful, defamatory, or harassing content; (b) impersonate another person; (c) use automated tools to scrape the Platform; (d) transmit malware or conduct denial-of-service attacks; (e) share another resident's personal data without their consent.`,
  },
  {
    title: "5. Intellectual Property",
    content: `All Platform content, designs, code, and branding remain the property of Mana Community Pvt. Ltd. You may not reproduce or distribute Platform content without prior written consent.`,
  },
  {
    title: "6. Data Protection and Privacy",
    content: `[LEGAL REVIEW REQUIRED — This clause is a working draft pending legal review for compliance with the DPDP Act 2023.]

6.1 Data Fiduciary. Mana Community Pvt. Ltd. is the Data Fiduciary for personal data processed through the Platform, as defined under the Digital Personal Data Protection Act 2023 (India) ("DPDP Act").

6.2 Collection and Processing. We collect and process personal data including your name, contact details, residence information, and (where applicable) financial transaction references, solely for the purposes described in our Privacy Notice (available at /privacy). We process data only on the basis of your explicit consent or as permitted by law.

6.3 Consent. By registering, you acknowledge that you have read and understood the Privacy Notice and provide informed, free, specific, and unambiguous consent to the processing of your personal data for the essential purposes described therein. Consent for non-essential purposes (analytics, marketing, biometric access) is sought separately and may be withdrawn at any time via the Privacy Centre.

6.4 Your Rights. Under the DPDP Act 2023 (ss.11–14) you have the right to: (a) access personal data we hold about you; (b) correct inaccurate or outdated data; (c) request erasure of your data subject to lawful retention requirements; (d) request data portability; (e) nominate a person to exercise these rights on your behalf; (f) lodge a grievance with our Grievance Officer; and (g) approach the Data Protection Board of India.

6.5 Grievance Redressal. To exercise your rights or lodge a complaint, contact our Grievance Officer at dpo@manacommunity.app. We will respond within 30 days as required by the DPDP Act 2023.

6.6 Sensitive Personal Data. We do not require or knowingly store Aadhaar, PAN, biometric data (other than hashed turnstile templates with separate explicit consent), or financial credentials. If you believe sensitive data has been inadvertently collected, notify our Grievance Officer immediately.

6.7 Cross-border Transfers. [LEGAL REVIEW REQUIRED — Confirm if any cross-border transfer is permissible under applicable DPDP Rules once finalised.]

6.8 Retention. Personal data is retained only as long as necessary for the purposes described, or as required by law. Specific retention periods are published in the Privacy Notice.`,
    highlight: true,
  },
  {
    title: "7. Payments",
    content: `Payment transactions are processed by Razorpay (a PCI-DSS Level 1 certified payment gateway). Mana Community Pvt. Ltd. does not store card numbers or CVV codes. Your payment data is governed by Razorpay's Privacy Policy (https://razorpay.com/privacy/).`,
  },
  {
    title: "8. Limitation of Liability",
    content: `[LEGAL REVIEW REQUIRED] To the maximum extent permitted by applicable law, Mana Community Pvt. Ltd. shall not be liable for indirect, incidental, or consequential damages arising from your use of the Platform. Our liability shall not exceed the amount paid by you to us in the 12 months preceding the claim.`,
  },
  {
    title: "9. Termination",
    content: `We may suspend or terminate your account if you violate these Terms. You may close your account at any time via the Privacy Centre (Deletion Request). Applicable data-retention obligations survive termination.`,
  },
  {
    title: "10. Governing Law and Dispute Resolution",
    content: `[LEGAL REVIEW REQUIRED] These Terms shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts at [INSERT CITY], India, and shall first be attempted to be resolved through good-faith negotiation.`,
  },
  {
    title: "11. Changes to Terms",
    content: `We may revise these Terms at any time. Material changes will be notified by email and in-app banner at least 14 days before they take effect. Continued use after the effective date constitutes acceptance.`,
  },
  {
    title: "12. Contact",
    content: `Questions: support@manacommunity.app\nData / Privacy: dpo@manacommunity.app\nRegistered Address: [LEGAL REVIEW REQUIRED: Insert registered office address]`,
  },
];

export function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors p-2 rounded-xl hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Terms of Use</span>
          </div>
        </div>

        {/* Legal Review Banner */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>[LEGAL REVIEW REQUIRED]</strong> This Terms of Use document is a working draft.
            Sections marked [LEGAL REVIEW REQUIRED] — particularly the data protection clause (§6),
            limitation of liability (§8), governing law (§10) — must be reviewed and approved by
            qualified legal counsel before publication.
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-card border border-border rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Terms of Use
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                My Community Hub · Effective October 2026 · Version 2026-10-13-v1
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {SECTIONS.map((section, i) => (
              <div
                key={i}
                className={`space-y-2 ${section.highlight ? "p-4 rounded-2xl bg-primary/5 border border-primary/20" : ""}`}
              >
                <h2 className={`text-sm font-extrabold ${section.highlight ? "text-primary" : "text-foreground"}`}>
                  {section.title}
                  {section.highlight && (
                    <span className="ml-2 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Data Protection
                    </span>
                  )}
                </h2>
                <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground/70 py-4 space-y-1">
          <p>© 2026 My Community Hub · Mana Community Pvt. Ltd.</p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/privacy" className="hover:underline hover:text-foreground transition-colors">
              Privacy Notice
            </Link>
            <span>·</span>
            <a href="mailto:dpo@manacommunity.app" className="hover:underline hover:text-foreground transition-colors">
              dpo@manacommunity.app
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
