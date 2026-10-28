import React, { useState, useEffect } from "react";
import { Shield, Settings, Check, X } from "lucide-react";
import { safeStorage, STORAGE_KEYS } from "../../../../utils/storage";
import { PRIVACY_NOTICE_VERSION } from "./PrivacyPolicyModal";
import { useAuth } from "../../../../contexts/AuthContext";

/** Per-purpose consent state stored in localStorage (non-authenticated fallback). */
export interface ConsentChoices {
  analytics: boolean;
  marketing: boolean;
  version: string;
  timestamp: string;
}

const CONSENT_STORAGE_KEY = "mana_consent_banner_v1";

function loadStoredChoices(): ConsentChoices | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentChoices;
    // Invalidate if notice version changed — user must re-consent.
    if (parsed.version !== PRIVACY_NOTICE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveChoices(choices: ConsentChoices) {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(choices));
  } catch {
    // localStorage may be unavailable in private browsing — fail silently.
  }
}

interface ConsentBannerProps {
  /** Called with the final consent choices after user acts. */
  onConsent?: (choices: ConsentChoices) => void;
}

/**
 * DPDP Act 2023, s.6 — non-essential trackers (analytics, marketing) must not fire
 * until the user opts in. This banner gates those purposes.
 *
 * Essential processing (security, session management) is never blocked.
 * Shown only for admin and super admin users.
 */
export function ConsentBanner({ onConsent }: ConsentBannerProps) {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const roleUpper = String(user?.role || "").toUpperCase();
  const rolesUpper = (user?.roles || []).map((r) => String(r).toUpperCase());
  const canShowBanner = Boolean(
    isSuperAdmin ||
    isAdmin ||
    roleUpper === "SUPER_ADMIN" ||
    roleUpper === "SUPERADMIN" ||
    roleUpper === "SUPER_ADMINISTRATOR" ||
    roleUpper === "ADMIN" ||
    roleUpper === "COMMUNITY_ADMIN" ||
    rolesUpper.some((r) =>
      ["SUPER_ADMIN", "SUPERADMIN", "SUPER_ADMINISTRATOR", "ADMIN", "COMMUNITY_ADMIN"].includes(r)
    )
  );

  useEffect(() => {
    if (!canShowBanner) {
      setVisible(false);
      return;
    }

    const stored = loadStoredChoices();
    if (stored) {
      onConsent?.(stored);
      return;
    }
    // Show banner after a short delay so the page loads first.
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, [canShowBanner, onConsent]);

  if (!canShowBanner || !visible) return null;

  function acceptAll() {
    const choices: ConsentChoices = {
      analytics: true,
      marketing: true,
      version: PRIVACY_NOTICE_VERSION,
      timestamp: new Date().toISOString(),
    };
    saveChoices(choices);
    onConsent?.(choices);
    setVisible(false);
  }

  function acceptSelected() {
    const choices: ConsentChoices = {
      analytics: analyticsConsent,
      marketing: marketingConsent,
      version: PRIVACY_NOTICE_VERSION,
      timestamp: new Date().toISOString(),
    };
    saveChoices(choices);
    onConsent?.(choices);
    setVisible(false);
  }

  function rejectAll() {
    const choices: ConsentChoices = {
      analytics: false,
      marketing: false,
      version: PRIVACY_NOTICE_VERSION,
      timestamp: new Date().toISOString(),
    };
    saveChoices(choices);
    onConsent?.(choices);
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie and tracking consent"
      className="consent-banner-dialog fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[99999] bg-background border border-border rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-extrabold text-foreground">We value your privacy</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            We use <strong>essential</strong> cookies for security and authentication.
            With your consent, we also use analytics to improve the app.
            You can change your preferences at any time in{" "}
            <a href="/account/privacy-settings" className="text-primary hover:underline">
              Privacy Centre
            </a>.
          </p>
        </div>
      </div>

      {showDetails && (
        <div className="mb-3 space-y-2 border-t border-border pt-3">
          <label className="flex items-start gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={true}
              disabled
              className="mt-0.5 rounded accent-primary opacity-60"
            />
            <div>
              <p className="text-[11px] font-semibold text-foreground">Essential (always on)</p>
              <p className="text-[10px] text-muted-foreground">Security, authentication, session management. Cannot be disabled.</p>
            </div>
          </label>
          <label className="flex items-start gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={analyticsConsent}
              onChange={(e) => setAnalyticsConsent(e.target.checked)}
              className="mt-0.5 rounded accent-primary"
            />
            <div>
              <p className="text-[11px] font-semibold text-foreground">Analytics</p>
              <p className="text-[10px] text-muted-foreground">Anonymous in-app usage telemetry. No data shared externally.</p>
            </div>
          </label>
          <label className="flex items-start gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              className="mt-0.5 rounded accent-primary"
            />
            <div>
              <p className="text-[11px] font-semibold text-foreground">Community Offers & Marketing</p>
              <p className="text-[10px] text-muted-foreground">Community deals, group-buying promotions, and event reminders.</p>
            </div>
          </label>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-2">
        <button
          type="button"
          onClick={acceptAll}
          className="flex-1 min-w-[80px] px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1 cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          Accept All
        </button>
        {showDetails ? (
          <button
            type="button"
            onClick={acceptSelected}
            className="flex-1 min-w-[80px] px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-bold hover:bg-muted/80 transition-colors cursor-pointer"
          >
            Save Preferences
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowDetails(true)}
            className="flex-1 min-w-[80px] px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-bold hover:bg-muted/80 transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            Customise
          </button>
        )}
        <button
          type="button"
          onClick={rejectAll}
          className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground text-xs font-semibold hover:bg-muted/50 transition-colors flex items-center gap-1 cursor-pointer"
          title="Reject non-essential"
        >
          <X className="w-3.5 h-3.5" />
          Reject
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground/70 mt-2 text-center">
        DPDP Act 2023 compliant · Notice v{PRIVACY_NOTICE_VERSION}
      </p>
    </div>
  );
}
