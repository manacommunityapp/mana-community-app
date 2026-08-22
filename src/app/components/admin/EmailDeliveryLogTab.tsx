import { useState, useEffect, useCallback } from "react";
import {
  Mail,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  X,
  Copy,
  Check,
  Calendar,
  Building2,
  Trophy,
  Lock,
  Clock,
  Send,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Inbox,
  Dumbbell,
  RotateCcw,
  Smartphone,
  Monitor,
  ExternalLink,
  Code,
  FileText,
  User,
  Shield,
  Megaphone,
  CreditCard,
  Key,
  Ticket,
  MailCheck,
  PlusCircle,
  HelpCircle,
  SlidersHorizontal,
  Cloud,
  CloudLightning,
  Activity,
  Zap,
  MousePointerClick,
  CheckCircle,
  Globe,
  Radio,
} from "lucide-react";
import {
  emailAdminService,
  extractApiErrorMessage,
  type EmailDeliveryLogDto,
  type EmailDeliverySummary,
  type BrevoAccountDto,
  type BrevoStatsDto,
  type BrevoEmailLogDto,
  type BrevoSenderDto,
} from "../../../services/admin/emailAdminService";
import { communityService } from "../../../services/community/communityService";
import type { CommunityResponse } from "../../../types/api";
import { useAuth } from "../../../contexts/AuthContext";
import { showError, showSuccess } from "../../../utils/ToastUtils";

// ── Email / Template Category Configurations ─────────────────────────────────
export interface CategoryConfig {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}

const EVENT_CATEGORIES: CategoryConfig[] = [
  { id: "ALL", label: "All Categories", description: "All system & transactional emails", icon: Mail, color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" },
  { id: "EMAIL_OTP", label: "OTP & Auth", description: "Login OTP, email verification & security codes", icon: Lock, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  { id: "PASSWORD_RESET", label: "Password Reset", description: "Account recovery and reset links", icon: Key, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { id: "TOURNAMENT_EMAIL", label: "Sports Tournaments", description: "Tournament announcements & registration open alerts", icon: Trophy, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  { id: "REGISTRATION_EMAIL", label: "Registrations & Passes", description: "Pass confirmations, entry tickets & QR codes", icon: Dumbbell, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { id: "MATCH_REMINDER", label: "Match Reminders", description: "Kickoff schedules, court assignments & check-in alerts", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { id: "SCHEDULE_PUBLISHED", label: "Schedule Fixtures", description: "Tournament fixtures, brackets & game timings", icon: Calendar, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { id: "WEEKLY_DIGEST", label: "Weekly Digest", description: "Weekly community news, activities & highlights", icon: Inbox, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { id: "OFFICIAL_ANNOUNCEMENT", label: "Official Notices", description: "Emergency alerts, maintenance notices & circulars", icon: Megaphone, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  { id: "INVOICE_RECEIPT", label: "Billing & Invoices", description: "Maintenance bills, payment receipts & invoices", icon: CreditCard, color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/20" },
  { id: "EVENT_TICKET", label: "Celebration Tickets", description: "Festival passes, pooja sevas & event registrations", icon: Ticket, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  { id: "CUSTOM_COMMUNICATION", label: "Admin Custom Mail", description: "Manual broadcast and direct emails from administrators", icon: Sparkles, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
];

function getCategoryConfig(templateType: string | null): CategoryConfig {
  if (!templateType) {
    return { id: "GENERAL", label: "General Notification", description: "System transaction email", icon: Mail, color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" };
  }
  const upper = templateType.toUpperCase().trim();
  const match = EVENT_CATEGORIES.find((c) => c.id === upper);
  if (match) return match;

  if (upper.includes("OTP") || upper.includes("AUTH")) {
    return { id: upper, label: "OTP & Security", description: "Verification code", icon: Lock, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" };
  }
  if (upper.includes("TOURNAMENT") || upper.includes("SPORT")) {
    return { id: upper, label: "Sports & Tournaments", description: "Tournament alert", icon: Trophy, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" };
  }
  if (upper.includes("PASS") || upper.includes("REGISTRATION") || upper.includes("TICKET")) {
    return { id: upper, label: "Event Registration", description: "Pass confirmation", icon: Ticket, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" };
  }

  return {
    id: upper,
    label: templateType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    description: "System notification",
    icon: Sparkles,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
  };
}

function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return "just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export function EmailDeliveryLogTab() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<CommunityResponse[]>([]);
  const [communityId, setCommunityId] = useState<number | null>(user?.communityId ?? null);

  // Active Main View Tab: "local" (Database Logs) | "brevo" (Brevo Cloud Activity)
  const [viewMode, setViewMode] = useState<"local" | "brevo">("local");

  // Lookback days
  const [lookbackDays, setLookbackDays] = useState<number>(7);

  // Filter States (Local)
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [keywordInput, setKeywordInput] = useState<string>("");
  const [appliedKeyword, setAppliedKeyword] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const pageSize = 15;

  // Filter States (Brevo)
  const [brevoEmailFilter, setBrevoEmailFilter] = useState<string>("");
  const [brevoEventFilter, setBrevoEventFilter] = useState<string>("");

  // Local Data States
  const [logs, setLogs] = useState<EmailDeliveryLogDto[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [summary, setSummary] = useState<EmailDeliverySummary | null>(null);

  // Brevo Cloud Data States
  const [brevoAccount, setBrevoAccount] = useState<BrevoAccountDto | null>(null);
  const [brevoStats, setBrevoStats] = useState<BrevoStatsDto | null>(null);
  const [brevoLogs, setBrevoLogs] = useState<BrevoEmailLogDto[]>([]);
  const [brevoSenders, setBrevoSenders] = useState<BrevoSenderDto[]>([]);
  const [syncingBrevo, setSyncingBrevo] = useState<boolean>(false);

  // Loading & Modal States
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedLog, setSelectedLog] = useState<EmailDeliveryLogDto | null>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "preview" | "raw">("overview");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [copiedError, setCopiedError] = useState<boolean>(false);
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);
  const [resendingId, setResendingId] = useState<number | null>(null);

  // Forward/Resend Override modal state
  const [isForwardModalOpen, setIsForwardModalOpen] = useState<boolean>(false);
  const [forwardRecipient, setForwardRecipient] = useState<string>("");

  // Send Custom Email Modal
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [customTo, setCustomTo] = useState<string>("");
  const [customSubject, setCustomSubject] = useState<string>("");
  const [customCategory, setCustomCategory] = useState<string>("CUSTOM_COMMUNICATION");
  const [customBody, setCustomBody] = useState<string>("");
  const [sendingCustom, setSendingCustom] = useState<boolean>(false);

  // Fetch Communities once
  useEffect(() => {
    async function loadCommunities() {
      try {
        const list = await communityService.getCommunities();
        setCommunities(list);
        if (!communityId && list.length > 0) {
          setCommunityId(list[0].id);
        }
      } catch {
        // Fallback silently
      }
    }
    loadCommunities();
  }, [communityId]);

  // Main data fetch
  const fetchDeliveryData = useCallback(async () => {
    setLoading(true);
    try {
      const logParams: any = {
        page,
        size: pageSize,
      };

      if (communityId != null) logParams.communityId = communityId;
      if (selectedCategory !== "ALL") logParams.templateType = selectedCategory;
      if (selectedStatus !== "ALL") logParams.status = selectedStatus;
      if (appliedKeyword.trim()) logParams.keyword = appliedKeyword.trim();

      const [logPageData, summaryData, bAccount, bStats, bLogs, bSenders] = await Promise.all([
        emailAdminService.getDeliveryLogs(logParams).catch(() => ({ content: [], totalPages: 1, totalElements: 0, size: pageSize, number: 0 })),
        communityId != null
          ? emailAdminService.getDeliverySummary(communityId, lookbackDays).catch(() => null)
          : Promise.resolve(null),
        emailAdminService.getBrevoAccount().catch(() => null),
        emailAdminService.getBrevoStats(lookbackDays).catch(() => null),
        emailAdminService.getBrevoLogs({ limit: 50, email: brevoEmailFilter || undefined, event: brevoEventFilter || undefined }).catch(() => []),
        emailAdminService.getBrevoSenders().catch(() => []),
      ]);

      setLogs(logPageData.content || []);
      setTotalPages(logPageData.totalPages || 1);
      setTotalElements(logPageData.totalElements || 0);
      setSummary(summaryData);
      setBrevoAccount(bAccount);
      setBrevoStats(bStats);
      setBrevoLogs(bLogs || []);
      setBrevoSenders(bSenders || []);
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to load email delivery logs"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [communityId, selectedCategory, selectedStatus, appliedKeyword, page, lookbackDays, brevoEmailFilter, brevoEventFilter]);

  useEffect(() => {
    fetchDeliveryData();
  }, [fetchDeliveryData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDeliveryData();
  };

  const handleSyncBrevo = async () => {
    setSyncingBrevo(true);
    try {
      const res = await emailAdminService.syncBrevoEvents();
      showSuccess(res.message || "Synced delivery events with Brevo Cloud");
      fetchDeliveryData();
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to sync with Brevo"));
    } finally {
      setSyncingBrevo(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setAppliedKeyword(keywordInput);
  };

  const handleClearFilters = () => {
    setSelectedCategory("ALL");
    setSelectedStatus("ALL");
    setKeywordInput("");
    setAppliedKeyword("");
    setPage(0);
  };

  const handleCopy = (text: string, isError = true) => {
    navigator.clipboard.writeText(text);
    if (isError) {
      setCopiedError(true);
      showSuccess("Copied error trace to clipboard");
      setTimeout(() => setCopiedError(false), 2000);
    } else {
      setCopiedHtml(true);
      showSuccess("Copied HTML content to clipboard");
      setTimeout(() => setCopiedHtml(false), 2000);
    }
  };

  const handleResend = async (logItem: EmailDeliveryLogDto, overrideTo?: string) => {
    try {
      setResendingId(logItem.id);
      const res = await emailAdminService.resendEmail(logItem.id, overrideTo);
      showSuccess(res.message || `Email re-dispatched to ${res.recipient}`);
      setIsForwardModalOpen(false);
      fetchDeliveryData();
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to resend email"));
    } finally {
      setResendingId(null);
    }
  };

  const handleSendCustomEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTo.trim() || !customSubject.trim() || !customBody.trim()) {
      showError("Please fill all required fields");
      return;
    }
    setSendingCustom(true);
    try {
      const res = await emailAdminService.sendCustomEmail({
        to: customTo.trim(),
        subject: customSubject.trim(),
        body: customBody.trim(),
        templateType: customCategory,
        communityId: communityId ?? undefined,
      });
      showSuccess(res.message || "Custom email sent successfully");
      setIsCustomModalOpen(false);
      setCustomTo("");
      setCustomSubject("");
      setCustomBody("");
      fetchDeliveryData();
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to send custom email"));
    } finally {
      setSendingCustom(false);
    }
  };

  // Metrics computation (Local)
  const totalSent = summary?.sent ?? 0;
  const totalFailed = summary?.failed ?? 0;
  const totalSkipped = summary?.skipped ?? 0;
  const totalOpened = summary?.opened ?? 0;
  const totalAttempts = summary?.total ?? 0;
  const deliveryRate = summary?.deliveryRate ?? (totalAttempts > 0 ? Math.round((totalSent / totalAttempts) * 100) : 100);
  const openRate = summary?.openRate ?? (totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0);

  // Brevo Quota computation
  const relayQuota = brevoAccount?.dailyRelayQuota || 300;
  const creditsLeft = brevoAccount?.creditsRemaining ?? 285;
  const quotaPercent = Math.min(100, Math.round((creditsLeft / relayQuota) * 100));

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── Top Header & Action Controls ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-foreground">Email Delivery & Brevo Cloud Center</h3>
              {brevoAccount?.isLive ? (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Brevo Live Connected
                </span>
              ) : (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                  <CloudLightning className="h-3 w-3" />
                  Brevo Cloud Active
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live audit of transactional emails, Brevo cloud SMTP relay metrics, deliverability & event history
            </p>
          </div>
        </div>

        {/* Action Controls & Community Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {communities.length > 0 && (
            <div className="flex items-center gap-2 bg-input/40 border border-border rounded-xl px-3 py-1.5 text-xs">
              <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
              <select
                value={communityId ?? ""}
                onChange={(e) => {
                  setCommunityId(Number(e.target.value));
                  setPage(0);
                }}
                className="bg-transparent text-foreground font-medium outline-none cursor-pointer"
              >
                {communities.map((c) => (
                  <option key={c.id} value={c.id} className="bg-card text-foreground">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Lookback window */}
          <div className="flex items-center gap-1.5 bg-input/40 border border-border rounded-xl px-3 py-1.5 text-xs">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={lookbackDays}
              onChange={(e) => setLookbackDays(Number(e.target.value))}
              className="bg-transparent text-foreground font-semibold outline-none cursor-pointer"
            >
              <option value={1} className="bg-card text-foreground">Today</option>
              <option value={7} className="bg-card text-foreground">Last 7 Days</option>
              <option value={30} className="bg-card text-foreground">Last 30 Days</option>
              <option value={90} className="bg-card text-foreground">Last 90 Days</option>
            </select>
          </div>

          <button
            onClick={() => setIsCustomModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm hover:from-indigo-700 hover:to-violet-700 transition-all text-xs font-semibold cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Send Custom Email
          </button>

          <button
            onClick={handleSyncBrevo}
            disabled={syncingBrevo}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all text-xs font-semibold cursor-pointer disabled:opacity-50"
            title="Synchronize Brevo Cloud open and bounce events"
          >
            <CloudLightning className={`h-3.5 w-3.5 ${syncingBrevo ? "animate-spin" : ""}`} />
            Sync Brevo
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Brevo Cloud Account & Quota Status Bar ── */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/50 border border-indigo-500/20 rounded-2xl p-4 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Cloud className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">Brevo Transactional SMTP Cloud</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {brevoAccount?.planType || "Free Tier (300/day)"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Account: <strong className="text-foreground">{brevoAccount?.email || "admin@manacommunityhub.com"}</strong> • Organization: <strong className="text-foreground">{brevoAccount?.companyName || "Mana Community Hub"}</strong>
            </p>
          </div>
        </div>

        {/* Quota Meter */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-1 md:w-48">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-muted-foreground font-medium">Daily Relay Credits</span>
              <span className="font-bold text-indigo-300">{creditsLeft} / {relayQuota}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${quotaPercent}%` }} />
            </div>
          </div>

          <div className="border-l border-border pl-4 hidden sm:block">
            <span className="text-[11px] text-muted-foreground block">Verified Senders</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle className="h-3 w-3" /> {brevoSenders.length || 2} Active
            </span>
          </div>
        </div>
      </div>

      {/* ── View Mode Switcher (Local DB Logs vs Brevo Cloud Activity) ── */}
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("local")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === "local"
                ? "bg-primary text-white shadow-sm"
                : "bg-card hover:bg-input text-muted-foreground border border-border"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Application Audit Logs ({totalElements})
          </button>

          <button
            onClick={() => setViewMode("brevo")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === "brevo"
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
                : "bg-card hover:bg-input text-muted-foreground border border-border"
            }`}
          >
            <Cloud className="h-3.5 w-3.5 text-indigo-300" />
            Brevo Cloud Stream & Deliverability ({brevoLogs.length})
          </button>
        </div>

        <span className="text-xs text-muted-foreground hidden sm:inline">
          {viewMode === "local" ? "Showing local transactional database records" : "Showing live remote Brevo server events"}
        </span>
      </div>

      {/* ── VIEW MODE 1: LOCAL AUDIT LOGS ── */}
      {viewMode === "local" && (
        <div className="space-y-6">
          {/* ── KPI Metrics Cards (Local) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Total Dispatched */}
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total Dispatched</span>
                <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Send className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-foreground mt-2">{totalAttempts}</p>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
                <span>In past {lookbackDays} days</span>
              </div>
              <div className="w-full bg-input/40 rounded-full h-1 mt-2.5 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: "100%" }} />
              </div>
            </div>

            {/* Delivered / SENT */}
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Delivered (Sent)</span>
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-400 mt-2">{totalSent}</p>
              <div className="flex items-center justify-between mt-1 text-[11px]">
                <span className="text-muted-foreground">Delivery Rate</span>
                <span className="font-bold text-emerald-400">{deliveryRate}%</span>
              </div>
              <div className="w-full bg-input/40 rounded-full h-1 mt-2.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${deliveryRate}%` }} />
              </div>
            </div>

            {/* Failed */}
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Failed Attempts</span>
                <div className="h-8 w-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <XCircle className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-rose-400 mt-2">{totalFailed}</p>
              <div className="flex items-center justify-between mt-1 text-[11px]">
                <span className="text-muted-foreground">Error Rate</span>
                <span className="font-bold text-rose-400">{totalAttempts > 0 ? Math.round((totalFailed / totalAttempts) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-input/40 rounded-full h-1 mt-2.5 overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: `${totalAttempts > 0 ? (totalFailed / totalAttempts) * 100 : 0}%` }} />
              </div>
            </div>

            {/* Opened / Read */}
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Opened / Read</span>
                <div className="h-8 w-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <MailCheck className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-cyan-400 mt-2">{totalOpened}</p>
              <div className="flex items-center justify-between mt-1 text-[11px]">
                <span className="text-muted-foreground">Open Rate</span>
                <span className="font-bold text-cyan-400">{openRate}%</span>
              </div>
              <div className="w-full bg-input/40 rounded-full h-1 mt-2.5 overflow-hidden">
                <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${openRate}%` }} />
              </div>
            </div>

            {/* Skipped / Gated */}
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Skipped / Gated</span>
                <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-400 mt-2">{totalSkipped}</p>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
                <span>Mail disabled / Mock</span>
              </div>
              <div className="w-full bg-input/40 rounded-full h-1 mt-2.5 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalAttempts > 0 ? (totalSkipped / totalAttempts) * 100 : 0}%` }} />
              </div>
            </div>
          </div>

          {/* ── Category Quick Pills ── */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {EVENT_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const Icon = cat.icon;
              const count = cat.id === "ALL" ? totalAttempts : (summary?.categoryCounts?.[cat.id] ?? null);

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setPage(0);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                    isSelected
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-card hover:bg-input/50 text-muted-foreground border-border"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-white" : cat.color}`} />
                  <span>{cat.label}</span>
                  {count !== null && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-input text-muted-foreground"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Filter Toolbar ── */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-3.5">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Dropdown */}
              <div className="flex items-center gap-1.5 bg-input/50 border border-border rounded-xl px-3 py-1.5 text-xs">
                <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground font-medium">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setPage(0);
                  }}
                  className="bg-transparent text-foreground font-semibold outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-card text-foreground">All Statuses</option>
                  <option value="SENT" className="bg-card text-foreground">Delivered (SENT)</option>
                  <option value="FAILED" className="bg-card text-foreground">Failed (FAILED)</option>
                  <option value="SKIPPED" className="bg-card text-foreground">Skipped (SKIPPED)</option>
                </select>
              </div>

              {(selectedCategory !== "ALL" || selectedStatus !== "ALL" || appliedKeyword) && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search recipient, subject, or keyword..."
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  className="w-full bg-input/50 border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
              >
                Search
              </button>
            </form>
          </div>

          {/* ── Email Delivery Logs Table ── */}
          <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <RefreshCw className="h-7 w-7 text-primary animate-spin" />
                <p className="text-xs text-muted-foreground font-medium">Loading email delivery audit trail...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center p-6">
                <div className="h-12 w-12 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground mb-3">
                  <Mail className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-foreground text-sm">No Email Logs Found</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  No delivery records match the current filter or search criteria.
                </p>
                {(selectedCategory !== "ALL" || selectedStatus !== "ALL" || appliedKeyword) && (
                  <button
                    onClick={handleClearFilters}
                    className="mt-3 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all cursor-pointer"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Category / Event</th>
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Delivery Status</th>
                      <th className="py-3 px-4">Sent Time</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logs.map((logItem) => {
                      const catCfg = getCategoryConfig(logItem.templateType);
                      const Icon = catCfg.icon;
                      const initial = (logItem.recipient || "U").charAt(0).toUpperCase();

                      return (
                        <tr
                          key={logItem.id}
                          className="hover:bg-muted/30 transition-colors group cursor-pointer"
                          onClick={() => {
                            setSelectedLog(logItem);
                            setDetailTab("overview");
                          }}
                        >
                          {/* Event / Category Pill */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className={`h-7 w-7 rounded-lg ${catCfg.bg} ${catCfg.color} flex items-center justify-center shrink-0`}>
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <span className="font-semibold text-foreground block leading-tight">
                                  {catCfg.label}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {logItem.templateType || "GENERAL"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Recipient */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {initial}
                              </div>
                              <span className="font-mono text-foreground font-medium truncate max-w-[180px]">
                                {logItem.recipient}
                              </span>
                            </div>
                          </td>

                          {/* Subject */}
                          <td className="py-3 px-4 max-w-xs truncate text-muted-foreground font-medium">
                            <span className="text-foreground font-semibold block truncate">
                              {logItem.subject || "(No Subject)"}
                            </span>
                            {logItem.sender && (
                              <span className="text-[10px] text-muted-foreground block truncate">
                                From: {logItem.sender}
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {logItem.status === "SENT" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  DELIVERED
                                </span>
                              )}
                              {logItem.status === "FAILED" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                  <XCircle className="h-3 w-3" />
                                  FAILED
                                </span>
                              )}
                              {logItem.status === "SKIPPED" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  <AlertTriangle className="h-3 w-3" />
                                  SKIPPED
                                </span>
                              )}
                              {logItem.opened && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                  <MailCheck className="h-2.5 w-2.5" />
                                  Opened
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Sent Time */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="text-foreground font-medium block">
                              {formatRelativeTime(logItem.sentAt)}
                            </span>
                            <span className="text-[10px] text-muted-foreground block">
                              {new Date(logItem.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResend(logItem);
                                }}
                                disabled={resendingId === logItem.id}
                                title="Resend to recipient"
                                className="p-1.5 rounded-lg bg-input/50 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all cursor-pointer disabled:opacity-50"
                              >
                                <RotateCcw className={`h-3.5 w-3.5 ${resendingId === logItem.id ? "animate-spin text-primary" : ""}`} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLog(logItem);
                                  setDetailTab("overview");
                                }}
                                className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="h-3 w-3" />
                                Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20 text-xs">
                <span className="text-muted-foreground">
                  Showing page <strong className="text-foreground">{page + 1}</strong> of{" "}
                  <strong className="text-foreground">{totalPages}</strong> ({totalElements} total records)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className="p-1.5 rounded-lg border border-border bg-card hover:bg-input text-foreground disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-1.5 rounded-lg border border-border bg-card hover:bg-input text-foreground disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VIEW MODE 2: BREVO CLOUD DELIVERABILITY & STREAM ── */}
      {viewMode === "brevo" && (
        <div className="space-y-6 animate-fade-in">
          {/* ── Brevo Aggregated KPI Metrics ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Brevo Requests */}
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Brevo Ingested</span>
                <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Zap className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-foreground mt-2">{brevoStats?.requests ?? 0}</p>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
                <span>SMTP API requests</span>
              </div>
              <div className="w-full bg-input/40 rounded-full h-1 mt-2.5 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: "100%" }} />
              </div>
            </div>

            {/* In-box Delivered */}
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">In-Box Delivered</span>
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-400 mt-2">{brevoStats?.delivered ?? 0}</p>
              <div className="flex items-center justify-between mt-1 text-[11px]">
                <span className="text-muted-foreground">Deliverability</span>
                <span className="font-bold text-emerald-400">{brevoStats?.deliveryRate ?? 100}%</span>
              </div>
              <div className="w-full bg-input/40 rounded-full h-1 mt-2.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${brevoStats?.deliveryRate ?? 100}%` }} />
              </div>
            </div>

            {/* Brevo Opens */}
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Unique Opens</span>
                <div className="h-8 w-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <MailCheck className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-cyan-400 mt-2">{brevoStats?.uniqueOpens ?? 0}</p>
              <div className="flex items-center justify-between mt-1 text-[11px]">
                <span className="text-muted-foreground">Open Rate</span>
                <span className="font-bold text-cyan-400">{brevoStats?.openRate ?? 0}%</span>
              </div>
              <div className="w-full bg-input/40 rounded-full h-1 mt-2.5 overflow-hidden">
                <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${brevoStats?.openRate ?? 0}%` }} />
              </div>
            </div>

            {/* Brevo Clicks */}
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Link Clicks</span>
                <div className="h-8 w-8 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                  <MousePointerClick className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-violet-400 mt-2">{brevoStats?.uniqueClicks ?? 0}</p>
              <div className="flex items-center justify-between mt-1 text-[11px]">
                <span className="text-muted-foreground">CTR</span>
                <span className="font-bold text-violet-400">{brevoStats?.clickRate ?? 0}%</span>
              </div>
              <div className="w-full bg-input/40 rounded-full h-1 mt-2.5 overflow-hidden">
                <div className="bg-violet-500 h-full rounded-full" style={{ width: `${brevoStats?.clickRate ?? 0}%` }} />
              </div>
            </div>

            {/* Brevo Bounces / Blocked */}
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Hard & Soft Bounces</span>
                <div className="h-8 w-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <XCircle className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-rose-400 mt-2">{(brevoStats?.hardBounces ?? 0) + (brevoStats?.softBounces ?? 0)}</p>
              <div className="flex items-center justify-between mt-1 text-[11px]">
                <span className="text-muted-foreground">Bounce Rate</span>
                <span className="font-bold text-rose-400">{brevoStats?.bounceRate ?? 0}%</span>
              </div>
              <div className="w-full bg-input/40 rounded-full h-1 mt-2.5 overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: `${brevoStats?.bounceRate ?? 0}%` }} />
              </div>
            </div>
          </div>

          {/* ── Verified Brevo Senders Panel ── */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-md">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              Verified Brevo Senders & Domain Reputation
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {brevoSenders.map((sender) => (
                <div key={sender.id} className="p-3 rounded-xl border border-border bg-input/20 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground text-xs block">{sender.name}</span>
                    <span className="font-mono text-muted-foreground text-[11px] block">{sender.email}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    sender.active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400"
                  }`}>
                    {sender.active ? "SPF / DKIM ACTIVE" : "UNVERIFIED"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Brevo Live Activity Stream Table ── */}
          <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">
                  Live Brevo Transactional Event Stream
                </h4>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Showing recent {brevoLogs.length} cloud events
              </span>
            </div>

            {brevoLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                <Cloud className="h-8 w-8 mx-auto mb-2 opacity-50 text-indigo-400" />
                <p className="font-semibold">No Brevo Cloud Events Recorded Yet</p>
                <p className="text-[11px] mt-0.5">Send a test email to see live event steps in this feed.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Brevo Message UUID</th>
                      <th className="py-3 px-4">Event Flow Timeline</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {brevoLogs.map((bLog, idx) => (
                      <tr key={bLog.messageId || idx} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-foreground">
                          {bLog.email}
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-muted-foreground">
                          <span className="text-foreground font-semibold block truncate">
                            {bLog.subject || "(No Subject)"}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground truncate max-w-[140px]">
                          {bLog.messageId || bLog.uuid}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {bLog.events && bLog.events.map((ev, eIdx) => {
                              const isDelivered = ev.name === "delivered";
                              const isOpened = ev.name === "opened" || ev.name === "first_opening";
                              const isClicked = ev.name === "clicks";
                              const isBounce = ev.name.includes("bounce");

                              return (
                                <span
                                  key={eIdx}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                    isDelivered
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                      : isOpened
                                      ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                                      : isClicked
                                      ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                                      : isBounce
                                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                      : "bg-input/50 text-muted-foreground border-border"
                                  }`}
                                  title={ev.time ? `At ${new Date(ev.time).toLocaleTimeString()}` : ""}
                                >
                                  {ev.name.toUpperCase()}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {bLog.status || "DELIVERED"}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                          {formatRelativeTime(bLog.date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Slide-Over / Modal Log Details Drawer ── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-scale-up relative max-h-[90vh] flex flex-col overflow-hidden">
            {/* Close Button */}
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-input/50 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shrink-0 shadow-md">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-foreground">Email Inspection & Delivery Audit</h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-input text-muted-foreground">
                    #{selectedLog.id}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{selectedLog.subject || "(No Subject)"}</p>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-border text-xs shrink-0">
              <button
                onClick={() => setDetailTab("overview")}
                className={`flex items-center gap-1.5 py-2 px-3 border-b-2 font-semibold transition-colors cursor-pointer ${
                  detailTab === "overview" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Delivery Overview
              </button>
              <button
                onClick={() => setDetailTab("preview")}
                className={`flex items-center gap-1.5 py-2 px-3 border-b-2 font-semibold transition-colors cursor-pointer ${
                  detailTab === "preview" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                Rendered HTML Preview
              </button>
              <button
                onClick={() => setDetailTab("raw")}
                className={`flex items-center gap-1.5 py-2 px-3 border-b-2 font-semibold transition-colors cursor-pointer ${
                  detailTab === "raw" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                Raw Payload & Headers
              </button>
            </div>

            {/* Tab Content Area */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
              {/* Tab 1: Overview */}
              {detailTab === "overview" && (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20 border-border">
                    <div className="flex items-center gap-2">
                      {selectedLog.status === "SENT" && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                      {selectedLog.status === "FAILED" && <XCircle className="h-5 w-5 text-rose-400" />}
                      {selectedLog.status === "SKIPPED" && <AlertTriangle className="h-5 w-5 text-amber-400" />}
                      <div>
                        <span className="font-bold text-foreground block">
                          {selectedLog.status === "SENT" && "Delivered Successfully to SMTP Server"}
                          {selectedLog.status === "FAILED" && "Delivery Attempt Failed"}
                          {selectedLog.status === "SKIPPED" && "Delivery Skipped (Environment Gated)"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Sent at: {new Date(selectedLog.sentAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {selectedLog.opened && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                        <MailCheck className="h-3 w-3" /> Opened {selectedLog.openedAt ? formatRelativeTime(selectedLog.openedAt) : ""}
                      </span>
                    )}
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-3 bg-muted/15 border border-border rounded-xl p-4">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Event Category</span>
                      <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                        {getCategoryConfig(selectedLog.templateType).label}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Template Tag</span>
                      <span className="font-mono text-foreground font-semibold mt-0.5 block">
                        {selectedLog.templateType || "GENERAL"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Recipient Address</span>
                      <span className="font-mono text-foreground font-semibold mt-0.5 block truncate">
                        {selectedLog.recipient}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Sender Address</span>
                      <span className="font-mono text-foreground mt-0.5 block truncate">
                        {selectedLog.sender || "Default System Sender"}
                      </span>
                    </div>
                  </div>

                  {/* Subject Line */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Email Subject</label>
                    <div className="bg-input/40 border border-border rounded-xl p-3 text-xs text-foreground font-medium">
                      {selectedLog.subject || "(No Subject)"}
                    </div>
                  </div>

                  {/* Error Trace if FAILED */}
                  {selectedLog.status === "FAILED" && selectedLog.errorMessage && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-rose-400 flex items-center gap-1">
                          <XCircle className="h-3.5 w-3.5" /> Error Log Trace
                        </label>
                        <button
                          onClick={() => handleCopy(selectedLog.errorMessage || "", true)}
                          className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                        >
                          {copiedError ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          {copiedError ? "Copied" : "Copy Trace"}
                        </button>
                      </div>
                      <pre className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3 text-[11px] font-mono text-rose-300 max-h-40 overflow-y-auto whitespace-pre-wrap">
                        {selectedLog.errorMessage}
                      </pre>
                    </div>
                  )}

                  {/* Skip Reason if SKIPPED */}
                  {selectedLog.status === "SKIPPED" && selectedLog.errorMessage && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-200">Skip Reason</p>
                        <p className="text-amber-300/80 mt-0.5">{selectedLog.errorMessage}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Rendered HTML Preview */}
              {detailTab === "preview" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-input/50 p-0.5 rounded-lg border border-border">
                      <button
                        onClick={() => setPreviewDevice("desktop")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                          previewDevice === "desktop" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Monitor className="h-3 w-3" /> Desktop
                      </button>
                      <button
                        onClick={() => setPreviewDevice("mobile")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                          previewDevice === "mobile" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Smartphone className="h-3 w-3" /> Mobile
                      </button>
                    </div>
                    {selectedLog.body && (
                      <button
                        onClick={() => handleCopy(selectedLog.body || "", false)}
                        className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                      >
                        {copiedHtml ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        {copiedHtml ? "HTML Copied" : "Copy HTML Code"}
                      </button>
                    )}
                  </div>

                  {/* Rendered Email Sandbox */}
                  <div className="bg-slate-900 border border-border rounded-xl p-3 flex justify-center overflow-x-auto">
                    <div
                      className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 text-slate-900 ${
                        previewDevice === "mobile" ? "w-[360px] max-w-full" : "w-full"
                      }`}
                    >
                      {selectedLog.body ? (
                        <div
                          className="p-4 overflow-y-auto max-h-[450px] text-xs font-sans"
                          dangerouslySetInnerHTML={{ __html: selectedLog.body }}
                        />
                      ) : (
                        <div className="p-8 text-center text-slate-400">
                          <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="font-semibold">HTML Body Preview not captured</p>
                          <p className="text-[11px] mt-1">This log entry was recorded prior to HTML body persistence.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Raw Payload & JSON */}
              {detailTab === "raw" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">JSON Log Structure</span>
                    <button
                      onClick={() => handleCopy(JSON.stringify(selectedLog, null, 2), false)}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                    >
                      {copiedHtml ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      Copy JSON
                    </button>
                  </div>
                  <pre className="bg-slate-950 border border-border rounded-xl p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-[400px]">
                    {JSON.stringify(selectedLog, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleResend(selectedLog)}
                  disabled={resendingId === selectedLog.id}
                  className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${resendingId === selectedLog.id ? "animate-spin" : ""}`} />
                  {resendingId === selectedLog.id ? "Resending..." : "Resend Email"}
                </button>

                <button
                  onClick={() => {
                    setForwardRecipient(selectedLog.recipient);
                    setIsForwardModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-input/50 text-foreground text-xs font-semibold hover:bg-input transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  Forward to Address
                </button>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-input text-foreground text-xs font-semibold hover:bg-input/80 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Forward / Resend Override Modal ── */}
      {isForwardModalOpen && selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-up relative">
            <h3 className="font-bold text-base text-foreground">Forward / Re-dispatch Email</h3>
            <p className="text-xs text-muted-foreground">
              Send a fresh copy of email <strong>"{selectedLog.subject}"</strong> to a specific email address.
            </p>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Target Recipient Address</label>
              <input
                type="email"
                value={forwardRecipient}
                onChange={(e) => setForwardRecipient(e.target.value)}
                placeholder="resident@example.com"
                className="w-full bg-input/50 border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-primary/50 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsForwardModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-input text-foreground text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResend(selectedLog, forwardRecipient)}
                disabled={!forwardRecipient.trim() || resendingId === selectedLog.id}
                className="px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {resendingId === selectedLog.id ? "Sending..." : "Dispatch Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Send Custom Email / Broadcast Modal ── */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-scale-up relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCustomModalOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-input/50 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-md">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">Send Direct / Broadcast Email</h3>
                <p className="text-xs text-muted-foreground">Dispatch an on-demand email notification to a resident or address</p>
              </div>
            </div>

            <form onSubmit={handleSendCustomEmail} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Recipient Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="resident@example.com"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full bg-input/50 border border-border rounded-xl px-3 py-2 text-foreground font-mono outline-none focus:border-primary/50"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Category / Tag</label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full bg-input/50 border border-border rounded-xl px-3 py-2 text-foreground outline-none focus:border-primary/50 cursor-pointer font-semibold"
                >
                  {EVENT_CATEGORIES.filter((c) => c.id !== "ALL").map((c) => (
                    <option key={c.id} value={c.id} className="bg-card text-foreground">
                      {c.label} ({c.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Subject Line *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Important Community Water Maintenance Alert"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full bg-input/50 border border-border rounded-xl px-3 py-2 text-foreground outline-none focus:border-primary/50 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Message Body (HTML supported) *</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Dear Resident,&#10;&#10;Please be informed that..."
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  className="w-full bg-input/50 border border-border rounded-xl p-3 text-foreground outline-none focus:border-primary/50 font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-input text-foreground text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingCustom}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Send className={`h-3.5 w-3.5 ${sendingCustom ? "animate-spin" : ""}`} />
                  {sendingCustom ? "Sending..." : "Dispatch Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

