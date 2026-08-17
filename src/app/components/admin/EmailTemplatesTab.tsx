import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Mail,
  Send,
  RefreshCw,
  CheckCircle2,
  Eye,
  X,
  AlertTriangle,
  Zap,
  Inbox,
  Upload,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  XCircle,
  MapPin,
  FileCheck,
  Search,
  Code2,
  Smartphone,
  Monitor,
  Copy,
  Check,
  Layers,
  HelpCircle,
  Tag,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import {
  emailAdminService,
  extractApiErrorMessage,
  type EmailTemplateInfo,
  type EmailHealthInfo,
  type TestAllResult,
  type DefaultTemplateDetails,
} from "../../../services/admin/emailAdminService";
import { EMAIL_TEMPLATES_COLLECTION } from "../../../services/admin/emailTemplatesData";
import { communityService } from "../../../services/community/communityService";
import type { CommunityResponse } from "../../../types/api";
import { useAuth } from "../../../contexts/AuthContext";
import { showError, showSuccess, showWarning } from "../../../utils/ToastUtils";

const CATEGORY_STYLES: Record<
  string,
  { bg: string; border: string; icon: string; badge: string; gradient: string; emoji: string; label: string }
> = {
  REGISTRATION: {
    bg: "bg-blue-50/70 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-900/40",
    icon: "text-blue-500",
    badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
    gradient: "from-blue-600 to-indigo-600",
    emoji: "📥",
    label: "Registration",
  },
  TOURNAMENT: {
    bg: "bg-violet-50/70 dark:bg-violet-950/20",
    border: "border-violet-200 dark:border-violet-900/40",
    icon: "text-violet-500",
    badge: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
    gradient: "from-violet-600 to-purple-600",
    emoji: "🏆",
    label: "Tournament",
  },
  MATCH: {
    bg: "bg-orange-50/70 dark:bg-orange-950/20",
    border: "border-orange-200 dark:border-orange-900/40",
    icon: "text-orange-500",
    badge: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
    gradient: "from-orange-500 to-amber-600",
    emoji: "⏰",
    label: "Match & Fixture",
  },
  PRIZE: {
    bg: "bg-pink-50/70 dark:bg-pink-950/20",
    border: "border-pink-200 dark:border-pink-900/40",
    icon: "text-pink-500",
    badge: "bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300",
    gradient: "from-pink-600 to-rose-600",
    emoji: "🎁",
    label: "Prize & Podium",
  },
  ANNOUNCEMENT: {
    bg: "bg-purple-50/70 dark:bg-purple-950/20",
    border: "border-purple-200 dark:border-purple-900/40",
    icon: "text-purple-500",
    badge: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
    gradient: "from-purple-600 to-fuchsia-600",
    emoji: "📢",
    label: "Announcement",
  },
  AUTH: {
    bg: "bg-cyan-50/70 dark:bg-cyan-950/20",
    border: "border-cyan-200 dark:border-cyan-900/40",
    icon: "text-cyan-500",
    badge: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300",
    gradient: "from-cyan-600 to-blue-600",
    emoji: "🔐",
    label: "Authentication",
  },
  EVENT: {
    bg: "bg-amber-50/70 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-900/40",
    icon: "text-amber-500",
    badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
    gradient: "from-amber-500 to-orange-600",
    emoji: "🎆",
    label: "Community Event",
  },
};

const DEFAULT_STYLE = {
  bg: "bg-slate-50 dark:bg-slate-900/30",
  border: "border-slate-200 dark:border-slate-800",
  icon: "text-slate-500",
  badge: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
  gradient: "from-slate-600 to-slate-800",
  emoji: "📧",
  label: "General",
};

function styleFor(category?: string | null) {
  if (!category) return DEFAULT_STYLE;
  return CATEGORY_STYLES[category] || DEFAULT_STYLE;
}

function getTplKey(tpl?: Partial<EmailTemplateInfo> | null): string {
  if (!tpl) return "";
  const val = tpl.key ?? (tpl as any).name ?? (tpl as any).templateKey ?? (tpl as any).id ?? "";
  return String(val);
}

function getTplLabel(tpl?: Partial<EmailTemplateInfo> | null): string {
  if (tpl?.name) return tpl.name;
  const key = String(getTplKey(tpl) || "");
  if (!key) return "Template";
  return key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
}

export function EmailTemplatesTab() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<CommunityResponse[]>([]);
  const [communityId, setCommunityId] = useState<number | null>(user?.communityId ?? null);
  const [templates, setTemplates] = useState<EmailTemplateInfo[]>([]);
  const [health, setHealth] = useState<EmailHealthInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Global Config Overrides
  const [toEmail, setToEmail] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [subjectOverride, setSubjectOverride] = useState("");

  // Custom Banner & Sponsor Image States
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const [sponsorUrl, setSponsorUrl] = useState<string>("");

  // Modal & Preview States
  const [activeTemplate, setActiveTemplate] = useState<EmailTemplateInfo | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  // Default Template View Modal State
  const [viewingDefaultTemplate, setViewingDefaultTemplate] = useState<EmailTemplateInfo | null>(null);
  const [defaultDetails, setDefaultDetails] = useState<DefaultTemplateDetails | null>(null);
  const [loadingDefaultPreview, setLoadingDefaultPreview] = useState(false);
  const [defaultViewMode, setDefaultViewMode] = useState<"rendered" | "source" | "variables">("rendered");
  const [copiedCode, setCopiedCode] = useState(false);

  const [sendingTemplate, setSendingTemplate] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);
  const [lastAllResult, setLastAllResult] = useState<TestAllResult | null>(null);

  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const sponsorFileInputRef = useRef<HTMLInputElement>(null);
  const previewRequestId = useRef(0);

  const loadCommunities = async () => {
    try {
      const data = await communityService.getCommunities();
      let list: CommunityResponse[] = [];
      if (Array.isArray(data)) list = data;
      else if (typeof data === "object" && data !== null && Array.isArray((data as any).content)) list = (data as any).content;
      setCommunities(list);
      if (communityId == null && list.length > 0) {
        setCommunityId(list[0].id);
      }
    } catch {
      showError("Failed to load communities");
    }
  };

  useEffect(() => {
    loadCommunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = useCallback(async () => {
    if (communityId == null) return;
    setLoading(true);
    try {
      const [tpl, h] = await Promise.all([
        emailAdminService.getTemplates(communityId),
        emailAdminService.getHealth(communityId),
      ]);
      const list = Array.isArray(tpl)
        ? tpl
        : Array.isArray((tpl as any)?.templates)
        ? (tpl as any).templates
        : [];
      setTemplates(list);
      setHealth(h);
    } catch {
      showError("Failed to load email data");
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load preview when activeTemplate, bannerUrl or sponsorUrl changes
  useEffect(() => {
    if (!activeTemplate || communityId == null) return;

    const requestId = ++previewRequestId.current;
    setLoadingPreview(true);

    const fetchPreview = async () => {
      try {
        const payload = {
          bannerUrl: bannerUrl || undefined,
          sponsorImageUrl: sponsorUrl || undefined,
          fromEmail: fromEmail || undefined,
          fromName: fromName || undefined,
          subject: subjectOverride || undefined,
        };
        const html = await emailAdminService.getPreviewHtml(activeTemplate.key, communityId ?? undefined, payload);
        if (requestId === previewRequestId.current) setPreviewHtml(html);
      } catch (err) {
        if (requestId === previewRequestId.current) {
          showError(extractApiErrorMessage(err, "Failed to load template preview"));
        }
      } finally {
        if (requestId === previewRequestId.current) setLoadingPreview(false);
      }
    };

    fetchPreview();
  }, [activeTemplate, communityId, bannerUrl, sponsorUrl, fromEmail, fromName, subjectOverride]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "banner" | "sponsor") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showWarning("File size exceeds 2MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        if (type === "banner") {
          setBannerUrl(reader.result);
        } else {
          setSponsorUrl(reader.result);
        }
        showSuccess(`${type === "banner" ? "Banner" : "Sponsor"} image loaded for preview.`);
      }
    };
    reader.readAsDataURL(file);
  };

  const openDefaultTemplateView = async (tpl: EmailTemplateInfo) => {
    setViewingDefaultTemplate(tpl);
    setLoadingDefaultPreview(true);
    setDefaultViewMode("rendered");
    try {
      const res = await emailAdminService.getDefaultTemplate(tpl.key);
      setDefaultDetails(res);
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to load default template HTML"));
    } finally {
      setLoadingDefaultPreview(false);
    }
  };

  const handleSendTest = async () => {
    if (!activeTemplate || communityId == null) return;
    setSendingTemplate(true);
    try {
      const customVars = {
        bannerUrl: bannerUrl || undefined,
        sponsorImageUrl: sponsorUrl || undefined,
        fromEmail: fromEmail || undefined,
        fromName: fromName || undefined,
        subject: subjectOverride || undefined,
      };
      const result = await emailAdminService.sendTest(activeTemplate.key, communityId, toEmail || undefined, customVars);
      if (result.mailEnabled) {
        showSuccess(`Test email sent to ${result.to}`);
      } else {
        showWarning("Mail disabled — email rendered but not sent via SMTP");
      }
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to send test"));
    } finally {
      setSendingTemplate(false);
    }
  };

  const handleSendAll = async () => {
    if (communityId == null) return;
    const target = toEmail || health?.defaultRecipient;
    const confirmed = confirm(
      `This will test-send all ${templates.length} system templates${target ? ` to ${target}` : ""}. Continue?`
    );
    if (!confirmed) return;
    setSendingAll(true);
    setLastAllResult(null);
    try {
      const customVars = {
        bannerUrl: bannerUrl || undefined,
        sponsorImageUrl: sponsorUrl || undefined,
        fromEmail: fromEmail || undefined,
        fromName: fromName || undefined,
        subject: subjectOverride || undefined,
      };
      const result = await emailAdminService.sendAllTests(communityId, toEmail || undefined, customVars);
      setLastAllResult(result);
      if (result.failed > 0) {
        showWarning(`${result.sent} sent, ${result.failed} failed — see breakdown below`);
      } else {
        showSuccess(`All ${result.sent} templates sent successfully to ${result.to}`);
      }
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to send all tests"));
    } finally {
      setSendingAll(false);
    }
  };

  const categories = useMemo(() => {
    const counts: Record<string, number> = { ALL: templates.length };
    templates.forEach((t) => {
      const c = t.category || "GENERAL";
      counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchesCat = selectedCategory === "ALL" || tpl.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tpl.key.toLowerCase().includes(q) ||
        (tpl.name && tpl.name.toLowerCase().includes(q)) ||
        tpl.subject.toLowerCase().includes(q) ||
        tpl.templateFile.toLowerCase().includes(q) ||
        (tpl.triggerMenuPath && tpl.triggerMenuPath.toLowerCase().includes(q)) ||
        (tpl.triggerDescription && tpl.triggerDescription.toLowerCase().includes(q));

      return matchesCat && matchesSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  const communitySelector = (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-xs">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">Community</span>
      <select
        value={communityId ?? ""}
        onChange={(e) => setCommunityId(e.target.value ? Number(e.target.value) : null)}
        className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground bg-[var(--mana-bg-input)] outline-none focus:ring-2 focus:ring-primary/20"
      >
        {communities.length === 0 && <option value="">No communities</option>}
        {communities.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );

  if (communityId == null) {
    return (
      <div className="space-y-4">
        {communitySelector}
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          Select a community to view email templates.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {communitySelector}
        <div className="flex items-center justify-center py-20 gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground font-semibold">Loading system email templates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {communitySelector}

      {/* ── Configuration & Global Status ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Health System Info */}
        {health && (
          <div
            className={`lg:col-span-2 rounded-2xl border p-5 shadow-xs ${
              health.mailEnabled
                ? "bg-gradient-to-br from-emerald-50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10 border-emerald-200 dark:border-emerald-800/40"
                : "bg-gradient-to-br from-amber-50/50 to-yellow-50/20 dark:from-amber-950/20 dark:to-yellow-950/10 border-amber-200 dark:border-amber-800/40"
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              {health.mailEnabled ? (
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
              )}
              <span className="text-xs font-extrabold text-foreground tracking-wide uppercase">
                Email Service Engine & SMTP Status
              </span>
              <span
                className={`ml-auto text-[9px] font-black px-2.5 py-0.5 rounded-full tracking-wide ${
                  health.mailEnabled
                    ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300"
                    : "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300"
                }`}
              >
                {health.mailEnabled ? "LIVE SMTP ACTIVE" : "LOCAL / DEV MODE"}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Dispatch Mode", value: health.recipientMode },
                { label: "Default From", value: health.from },
                { label: "Default Recipient", value: health.defaultRecipient || "—" },
                { label: "Sample Templates", value: `${templates.length} HTML Files` },
              ].map((s) => (
                <div key={s.label}>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">
                    {s.label}
                  </span>
                  <span className="text-xs font-semibold text-foreground truncate block">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global Controls Card */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold block mb-1">
                Target Test Email
              </label>
              <input
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder={health?.defaultRecipient || "admin@example.com"}
                className="w-full border border-border rounded-xl px-3 py-1.5 text-xs bg-[var(--mana-bg-input)] outline-none focus:ring-2 focus:ring-primary/20 font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold block mb-1">
                Sender Name (From Name)
              </label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Mana Community"
                className="w-full border border-border rounded-xl px-3 py-1.5 text-xs bg-[var(--mana-bg-input)] outline-none focus:ring-2 focus:ring-primary/20 font-semibold"
              />
            </div>
          </div>
          <button
            onClick={handleSendAll}
            disabled={sendingAll}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
            {sendingAll ? "Dispatched Templates..." : `Test Dispatch All (${templates.length})`}
          </button>
        </div>
      </div>

      {/* ── Last "Send All" Result Breakdown ──────────────────────── */}
      {lastAllResult && (
        <div className="bg-card rounded-2xl border border-border shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between border-b pb-3 border-border">
            <div className="flex items-center gap-2">
              <Inbox className="w-4.5 h-4.5 text-primary" />
              <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                Test Result Summary — {lastAllResult.to}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                {lastAllResult.sent} sent
              </span>
              <button
                onClick={() => setLastAllResult(null)}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {lastAllResult.results.map((r) => (
              <div
                key={r.template}
                className="flex items-center gap-2 p-2.5 rounded-xl border text-xs bg-muted/20 border-border"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="font-semibold text-foreground truncate">{r.template}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Search & Category Filter Toolbar ─────────────────────── */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by template name, file name (e.g. email-otp.html), subject, or trigger path..."
              className="w-full pl-9 pr-4 py-2 border border-border rounded-xl text-xs bg-[var(--mana-bg-input)] outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
            Showing <strong className="text-foreground">{filteredTemplates.length}</strong> of {templates.length} templates
          </span>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {Object.entries({
            ALL: "All Templates",
            EVENT: "Community Events",
            TOURNAMENT: "Sports Tournaments",
            MATCH: "Match & Fixtures",
            REGISTRATION: "Registrations",
            AUTH: "Auth & OTP",
            PRIZE: "Prize & Awards",
            ANNOUNCEMENT: "Announcements",
          }).map(([catKey, label]) => {
            const count = categories[catKey] || 0;
            if (count === 0 && catKey !== "ALL") return null;
            const isSelected = selectedCategory === catKey;

            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setSelectedCategory(catKey)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? "bg-primary text-white shadow-xs"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Templates Card List ─────────────────────────────────── */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTemplates.map((tpl, idx) => {
            const key = getTplKey(tpl) || `template-card-${idx}`;
            const style = styleFor(tpl.category);
            const templateLabel = getTplLabel(tpl);

            return (
              <div
                key={key}
                className={`group rounded-2xl border bg-card overflow-hidden transition-all duration-200 hover:shadow-md flex flex-col justify-between ${style.border}`}
              >
                <div>
                  {/* Card Header */}
                  <div className={`p-4 border-b border-border/50 ${style.bg}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl shrink-0">{style.emoji}</span>
                        <div>
                          <span
                            className={`text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${style.badge}`}
                          >
                            {style.label}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10.5px] font-mono text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                        {tpl.templateFile.replace("email/", "")}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-foreground group-hover:text-primary transition-colors leading-tight mb-1">
                      {templateLabel}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-1 italic">"{tpl.subject}"</p>
                  </div>

                  {/* Trigger Details */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-foreground font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{tpl.triggerMenuPath || "Trigger Configured"}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      {tpl.triggerDescription}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-3 border-t border-border bg-muted/20 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTemplate(tpl)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview & Test
                  </button>

                  <button
                    type="button"
                    onClick={() => openDefaultTemplateView(tpl)}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl border border-border transition-all cursor-pointer"
                    title="View HTML Source & Details"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="py-16 text-center bg-card rounded-2xl border border-border p-8">
            <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h4 className="text-sm font-bold text-foreground mb-1">No email templates matched your criteria</h4>
            <p className="text-xs text-muted-foreground mb-4">Try adjusting your search query or selecting "All Templates".</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("ALL");
              }}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* ── Live Template Preview & Test Dispatch Modal ──────────── */}
      {activeTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border border-border animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-muted/30 border-b border-border">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{styleFor(activeTemplate.category).emoji}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-foreground">{getTplLabel(activeTemplate)}</h3>
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        styleFor(activeTemplate.category).badge
                      }`}
                    >
                      {styleFor(activeTemplate.category).label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    File: <strong className="text-foreground">{activeTemplate.templateFile}</strong>
                  </p>
                </div>
              </div>

              {/* Viewport Width Toggle */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-muted p-0.5 rounded-xl border border-border">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      previewDevice === "desktop" ? "bg-card text-primary shadow-xs" : "text-muted-foreground"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" /> Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      previewDevice === "mobile" ? "bg-card text-primary shadow-xs" : "text-muted-foreground"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Mobile
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTemplate(null)}
                  className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Settings Sidebar */}
              <div className="w-full md:w-88 bg-card border-r border-border p-5 overflow-y-auto space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Where this fires */}
                  <div className="bg-muted/40 p-3 rounded-xl border border-border text-xs space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      Trigger Location
                    </span>
                    <p className="text-primary font-bold">{activeTemplate.triggerMenuPath}</p>
                    <p className="text-muted-foreground leading-relaxed">{activeTemplate.triggerDescription}</p>
                  </div>

                  {/* Test Dispatch Form */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">
                        Test Recipient Email
                      </label>
                      <input
                        type="email"
                        value={toEmail}
                        onChange={(e) => setToEmail(e.target.value)}
                        placeholder={health?.defaultRecipient || "resident@example.com"}
                        className="w-full border border-border rounded-xl px-3 py-2 text-xs bg-[var(--mana-bg-input)] outline-none focus:ring-2 focus:ring-primary/20 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">
                        Subject Line
                      </label>
                      <input
                        type="text"
                        value={subjectOverride}
                        onChange={(e) => setSubjectOverride(e.target.value)}
                        placeholder={activeTemplate.subject}
                        className="w-full border border-border rounded-xl px-3 py-2 text-xs bg-[var(--mana-bg-input)] outline-none focus:ring-2 focus:ring-primary/20 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">
                        Sender Name (From Name)
                      </label>
                      <input
                        type="text"
                        value={fromName}
                        onChange={(e) => setFromName(e.target.value)}
                        placeholder="Mana Community"
                        className="w-full border border-border rounded-xl px-3 py-2 text-xs bg-[var(--mana-bg-input)] outline-none focus:ring-2 focus:ring-primary/20 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={handleSendTest}
                  disabled={sendingTemplate}
                  className={`w-full py-3 px-4 rounded-xl text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r ${
                    styleFor(activeTemplate.category).gradient
                  }`}
                >
                  {sendingTemplate ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sendingTemplate ? "Sending Live Test..." : "Send Test Email"}
                </button>
              </div>

              {/* Right Iframe Preview Pane */}
              <div className="flex-1 bg-muted/60 flex flex-col overflow-hidden">
                <div className="bg-card px-4 py-2 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Interactive Mailbox Preview ({previewDevice})
                    </span>
                  </div>
                </div>

                <div className="flex-1 p-6 flex justify-center items-center overflow-y-auto">
                  {loadingPreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground font-semibold">Rendering email preview...</span>
                    </div>
                  ) : (
                    <iframe
                      srcDoc={previewHtml}
                      className={`h-full border border-border rounded-2xl bg-white shadow-2xl transition-all ${
                        previewDevice === "mobile" ? "w-[380px]" : "w-full max-w-2xl"
                      }`}
                      title={`Preview: ${activeTemplate.key}`}
                      sandbox="allow-same-origin"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Default Template Full Details Modal (HTML Source & Variables) ── */}
      {viewingDefaultTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-border text-left">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  Template Details:{" "}
                  <span className="text-primary font-extrabold">{getTplLabel(viewingDefaultTemplate)}</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  File Path: {viewingDefaultTemplate.templateFile}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-muted p-0.5 rounded-xl border border-border text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setDefaultViewMode("rendered")}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      defaultViewMode === "rendered" ? "bg-card text-primary shadow-xs" : "text-muted-foreground"
                    }`}
                  >
                    Rendered View
                  </button>
                  <button
                    type="button"
                    onClick={() => setDefaultViewMode("source")}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      defaultViewMode === "source" ? "bg-card text-primary shadow-xs" : "text-muted-foreground"
                    }`}
                  >
                    Thymeleaf HTML
                  </button>
                  <button
                    type="button"
                    onClick={() => setDefaultViewMode("variables")}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      defaultViewMode === "variables" ? "bg-card text-primary shadow-xs" : "text-muted-foreground"
                    }`}
                  >
                    Variables & Tokens
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const content = defaultViewMode === "source" ? defaultDetails?.rawHtml : defaultDetails?.renderedHtml;
                    if (content) {
                      navigator.clipboard.writeText(content);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                      showSuccess("Code copied to clipboard!");
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border text-foreground text-xs font-bold rounded-xl shadow-xs cursor-pointer hover:bg-muted transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? "Copied" : "Copy Code"}
                </button>

                <button
                  type="button"
                  onClick={() => setViewingDefaultTemplate(null)}
                  className="p-1.5 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 overflow-y-auto bg-muted/40 min-h-[450px]">
              {loadingDefaultPreview ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground font-semibold">Loading template details...</span>
                </div>
              ) : defaultViewMode === "rendered" ? (
                <iframe
                  srcDoc={defaultDetails?.renderedHtml || ""}
                  className="w-full h-[60vh] border border-border rounded-2xl bg-white shadow-md max-w-2xl mx-auto block"
                  title={`Default Template Preview: ${viewingDefaultTemplate.key}`}
                  sandbox="allow-same-origin"
                />
              ) : defaultViewMode === "source" ? (
                <div className="rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                  <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>{viewingDefaultTemplate.templateFile}</span>
                    <span className="text-[11px] text-emerald-400 font-bold">Thymeleaf Template Format</span>
                  </div>
                  <pre className="w-full h-[55vh] overflow-auto bg-slate-900 text-emerald-300 p-5 text-xs font-mono leading-relaxed whitespace-pre-wrap selection:bg-indigo-500 selection:text-white">
                    {defaultDetails?.rawHtml || "<!-- Source HTML not loaded -->"}
                  </pre>
                </div>
              ) : (
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4 max-w-3xl mx-auto">
                  <h3 className="text-sm font-bold text-foreground">Dynamic Template Variables & Tokens</h3>
                  <p className="text-xs text-muted-foreground">
                    These variable placeholders are populated dynamically by the backend template engine during email generation.
                  </p>

                  <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                    {EMAIL_TEMPLATES_COLLECTION.find((t) => t.key === viewingDefaultTemplate.key)?.variables.map((v) => (
                      <div key={v.name} className="p-3 text-xs flex items-start justify-between gap-4 bg-muted/20">
                        <div>
                          <code className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded font-mono">
                            {"${" + v.name + "}"}
                          </code>
                          <p className="text-muted-foreground mt-1 text-[11px]">{v.description}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold block">Sample Value</span>
                          <span className="font-semibold text-foreground">{v.sample}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
