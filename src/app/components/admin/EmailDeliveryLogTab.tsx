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
  Dumbbell
} from "lucide-react";
import {
  emailAdminService,
  extractApiErrorMessage,
  type EmailDeliveryLogDto,
  type EmailDeliverySummary
} from "../../../services/admin/emailAdminService";
import { communityService } from "../../../services/community/communityService";
import type { CommunityResponse } from "../../../types/api";
import { useAuth } from "../../../contexts/AuthContext";
import { showError, showSuccess } from "../../../utils/ToastUtils";

// ── Event / Template Category Configurations ─────────────────────────────────
const EVENT_CATEGORIES = [
  { id: "ALL", label: "All Categories & Events", icon: Mail, color: "text-slate-400", bg: "bg-slate-500/10" },
  { id: "REGISTRATION_EMAIL", label: "Sports & Event Registrations", icon: Dumbbell, color: "text-blue-400", bg: "bg-blue-500/10" },
  { id: "TOURNAMENT_EMAIL", label: "Tournament Announcements", icon: Trophy, color: "text-violet-400", bg: "bg-violet-500/10" },
  { id: "MATCH_REMINDER", label: "Match Kickoff Reminders", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
  { id: "SCHEDULE_PUBLISHED", label: "Schedule Publishing", icon: Calendar, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { id: "WEEKLY_DIGEST", label: "Weekly Schedule Digest", icon: Inbox, color: "text-purple-400", bg: "bg-purple-500/10" },
  { id: "EMAIL_OTP", label: "Email OTP Verification", icon: Lock, color: "text-cyan-400", bg: "bg-cyan-500/10" },
] as const;

function getCategoryConfig(templateType: string | null) {
  if (!templateType) return { label: "General Notification", icon: Mail, color: "text-slate-400", bg: "bg-slate-500/10" };
  const upper = templateType.toUpperCase();
  const match = EVENT_CATEGORIES.find((c) => c.id === upper);
  if (match) return match;
  return { label: templateType.replace(/_/g, " "), icon: Sparkles, color: "text-indigo-400", bg: "bg-indigo-500/10" };
}

export function EmailDeliveryLogTab() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<CommunityResponse[]>([]);
  const [communityId, setCommunityId] = useState<number | null>(user?.communityId ?? null);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [recipientSearch, setRecipientSearch] = useState<string>("");
  const [appliedSearch, setAppliedSearch] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const pageSize = 15;

  // Data States
  const [logs, setLogs] = useState<EmailDeliveryLogDto[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [summary, setSummary] = useState<EmailDeliverySummary | null>(null);

  // Loading & Modal States
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedLog, setSelectedLog] = useState<EmailDeliveryLogDto | null>(null);
  const [copiedError, setCopiedError] = useState<boolean>(false);

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
      if (appliedSearch.trim()) logParams.recipient = appliedSearch.trim();

      const [logPageData, summaryData] = await Promise.all([
        emailAdminService.getDeliveryLogs(logParams).catch(() => ({ content: [], totalPages: 1, totalElements: 0, size: pageSize, number: 0 })),
        communityId != null
          ? emailAdminService.getDeliverySummary(communityId, 7).catch(() => null)
          : Promise.resolve(null)
      ]);

      setLogs(logPageData.content || []);
      setTotalPages(logPageData.totalPages || 1);
      setTotalElements(logPageData.totalElements || 0);
      setSummary(summaryData);
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to load email delivery logs"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [communityId, selectedCategory, selectedStatus, appliedSearch, page]);

  useEffect(() => {
    fetchDeliveryData();
  }, [fetchDeliveryData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDeliveryData();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setAppliedSearch(recipientSearch);
  };

  const handleCopyError = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedError(true);
    showSuccess("Copied error log to clipboard");
    setTimeout(() => setCopiedError(false), 2000);
  };

  // Delivery Rate Calculation
  const successRate = summary && summary.total > 0
    ? Math.round((summary.sent / summary.total) * 100)
    : 100;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── Top Header & Controls Bar ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                Event Email Delivery Tracker
              </h3>
              <p className="text-xs text-muted-foreground">
                Real-time audit log of all system emails (Sports, Events, OTPs & Schedules)
              </p>
            </div>
          </div>
        </div>

        {/* Community Selector & Refresh */}
        <div className="flex items-center gap-3">
          {communities.length > 0 && (
            <div className="flex items-center gap-2 bg-input/40 border border-border rounded-xl px-3 py-1.5 text-xs">
              <Building2 className="h-3.5 w-3.5 text-primary" />
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

      {/* ── Summary KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sent */}
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Delivered (7 Days)</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{summary?.sent ?? 0}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Successfully dispatched</p>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        {/* Failed */}
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Failed Attempts</p>
            <p className="text-2xl font-black text-rose-400 mt-1">{summary?.failed ?? 0}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">SMTP or network errors</p>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <XCircle className="h-5 w-5" />
          </div>
        </div>

        {/* Skipped */}
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Skipped / Gated</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{summary?.skipped ?? 0}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Mail disabled or dev mode</p>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        {/* Delivery Rate */}
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Delivery Success Rate</p>
            <p className="text-2xl font-black text-indigo-400 mt-1">{successRate}%</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Based on total attempts</p>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Send className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* ── Filters & Search Toolbar ── */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-4">
        {/* Left: Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Event / Category Type Dropdown */}
          <div className="flex items-center gap-2 bg-input/50 border border-border rounded-xl px-3 py-2 text-xs">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground font-medium hidden sm:inline">Event Type:</span>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(0);
              }}
              className="bg-transparent text-foreground font-semibold outline-none cursor-pointer"
            >
              {EVENT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-card text-foreground">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Delivery Status Dropdown */}
          <div className="flex items-center gap-2 bg-input/50 border border-border rounded-xl px-3 py-2 text-xs">
            <span className="text-muted-foreground font-medium hidden sm:inline">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(0);
              }}
              className="bg-transparent text-foreground font-semibold outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-card text-foreground">All Statuses</option>
              <option value="SENT" className="bg-card text-foreground">SENT (Delivered)</option>
              <option value="FAILED" className="bg-card text-foreground">FAILED (Error)</option>
              <option value="SKIPPED" className="bg-card text-foreground">SKIPPED (Disabled/Mock)</option>
            </select>
          </div>
        </div>

        {/* Right: Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search recipient email..."
              value={recipientSearch}
              onChange={(e) => setRecipientSearch(e.target.value)}
              className="w-full bg-input/50 border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* ── Delivery Logs Table ── */}
      <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="h-7 w-7 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Loading email delivery audit trail...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center p-6">
            <div className="h-12 w-12 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground mb-3">
              <Mail className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-foreground text-sm">No Email Logs Found</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              No delivery records match the current event type, status, or search parameters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Event / Category</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Sent At</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((logItem) => {
                  const catCfg = getCategoryConfig(logItem.templateType);
                  const Icon = catCfg.icon;

                  return (
                    <tr
                      key={logItem.id}
                      className="hover:bg-muted/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLog(logItem)}
                    >
                      {/* Event / Category Pill */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`h-7 w-7 rounded-lg ${catCfg.bg} ${catCfg.color} flex items-center justify-center shrink-0`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-semibold text-foreground">
                            {catCfg.label}
                          </span>
                        </div>
                      </td>

                      {/* Recipient */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-foreground">{logItem.recipient}</span>
                      </td>

                      {/* Subject Line */}
                      <td className="py-3.5 px-4 max-w-xs truncate text-muted-foreground font-medium">
                        {logItem.subject || "(No Subject)"}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        {logItem.status === "SENT" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            SENT
                          </span>
                        )}
                        {logItem.status === "FAILED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <XCircle className="h-3 w-3" />
                            FAILED
                          </span>
                        )}
                        {logItem.status === "SKIPPED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <AlertTriangle className="h-3 w-3" />
                            SKIPPED
                          </span>
                        )}
                      </td>

                      {/* Sent At */}
                      <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                        {new Date(logItem.sentAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit"
                        })}
                      </td>

                      {/* Action View Details */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(logItem);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all font-semibold flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </button>
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
              <strong className="text-foreground">{totalPages}</strong> ({totalElements} total entries)
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

      {/* ── Slide-Over / Modal Log Details Drawer ── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-5 animate-scale-up relative">
            {/* Close Button */}
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-input/50 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">Email Log Details</h3>
                <p className="text-xs text-muted-foreground">Log ID #{selectedLog.id}</p>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-muted/20 border border-border rounded-xl p-4">
              <div>
                <span className="text-muted-foreground block text-[11px]">Category / Event</span>
                <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                  {getCategoryConfig(selectedLog.templateType).label}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Delivery Status</span>
                <span className="font-bold mt-0.5 inline-block">
                  {selectedLog.status === "SENT" && <span className="text-emerald-400">SENT (Delivered)</span>}
                  {selectedLog.status === "FAILED" && <span className="text-rose-400">FAILED</span>}
                  {selectedLog.status === "SKIPPED" && <span className="text-amber-400">SKIPPED</span>}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Recipient</span>
                <span className="font-mono text-foreground mt-0.5 block truncate">{selectedLog.recipient}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Sent Timestamp</span>
                <span className="font-medium text-foreground mt-0.5 block">
                  {new Date(selectedLog.sentAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Subject Line</label>
              <div className="bg-input/40 border border-border rounded-xl p-3 text-xs text-foreground font-medium">
                {selectedLog.subject || "(No Subject)"}
              </div>
            </div>

            {/* Error Message trace box if FAILED */}
            {selectedLog.status === "FAILED" && selectedLog.errorMessage && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-rose-400 flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5" /> Error Log Trace
                  </label>
                  <button
                    onClick={() => handleCopyError(selectedLog.errorMessage || "")}
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

            {/* Skipped note if SKIPPED */}
            {selectedLog.status === "SKIPPED" && selectedLog.errorMessage && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-200">Skip Reason</p>
                  <p className="text-amber-300/80 mt-0.5">{selectedLog.errorMessage}</p>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-end pt-2">
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
    </div>
  );
}
