import React from "react";
import { Link } from "react-router";
import { ShieldCheck, Lock, ArrowLeft } from "lucide-react";
import { PrivacyContent } from "./PrivacyPolicyModal";

export function PrivacyPage() {
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
            <span>Verified Privacy Statement</span>
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-card border border-border rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                <span>🔒</span> Your Privacy Matters to Us
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                My Community Hub Data & Privacy Policy
              </p>
            </div>
          </div>

          <PrivacyContent />
        </div>

        {/* Bottom Footer */}
        <div className="text-center text-xs text-muted-foreground/70 py-4">
          <p>© 2026 My Community Hub • Built for neighbor privacy and community trust</p>
        </div>
      </div>
    </div>
  );
}
