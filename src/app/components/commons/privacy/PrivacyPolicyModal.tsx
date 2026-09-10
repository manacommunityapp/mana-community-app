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
} from "lucide-react";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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
    description: "Community data is securely stored in our AWS-hosted PostgreSQL database.",
    accent: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
  },
  {
    icon: UserCheck,
    title: "Access Control",
    description: "Personal information is accessible only to authorized users and administrators based on their roles and permissions.",
    accent: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: Ban,
    title: "No Commercial Sharing",
    description: "We do not sell, rent, or commercially share your personal information.",
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
    description: "Your information is used only for legitimate community purposes such as resident management, events, Pooja/Seva registrations, cultural activities, communication, attendance, and community administration.",
    accent: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: ArrowRightLeft,
    title: "Secure Data Transfer",
    description: "Information collected through approved registration processes such as Google Forms or Excel is transferred to the My Community system for community-management purposes, with unnecessary duplicate copies not retained beyond operational requirements.",
    accent: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: Clock,
    title: "Data Retention",
    description: "Personal information is retained only for as long as it is reasonably required. When it is no longer needed, it may be deleted, anonymized, or securely disposed of.",
    accent: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  },
  {
    icon: Trash2,
    title: "Deletion Requests",
    description: "Where applicable, members can request correction or deletion of their personal information/account, subject to legitimate record-retention, financial, security, audit, or legal requirements.",
    accent: "text-red-500 bg-red-500/10 border-red-500/20",
  },
];

export function PrivacyContent() {
  return (
    <div className="space-y-6 text-foreground">
      {/* Intro Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-indigo-500/10 to-purple-500/10 border border-primary/20">
        <div className="flex items-center gap-2 mb-2 text-primary font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Privacy & Security Pledge</span>
        </div>
        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-medium">
          At <strong className="text-foreground font-extrabold">My Community Hub</strong>, your privacy is important to us.
          We are committed to keeping your community information{" "}
          <strong className="text-primary font-bold">private, secure, and limited to what is necessary</strong> to provide
          our services.
        </p>
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

      {/* Our Commitment */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 space-y-3 shadow-xs">
        <h4 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 text-emerald-500" />
          Our Commitment
        </h4>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          We believe your community information belongs to the community. Our goal is to ensure that personal information is{" "}
          <strong className="text-foreground">collected responsibly, used only for legitimate purposes, protected from unauthorized access, and removed when it is no longer required</strong>.
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
                <span>🔒</span> Your Privacy Matters to Us
              </h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">
                My Community Hub Data & Privacy Policy
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
            <span>Encrypted & Protected</span>
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
