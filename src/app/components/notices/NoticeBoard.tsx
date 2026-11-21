import {
  Megaphone, Plus, X, Loader2, Pin, PinOff, Trash2, Edit3, Clock,
  AlertTriangle, Wrench, Shield, CalendarDays, Users, BookOpen, ChevronDown, Sparkles
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ShieldAlert, PackageX } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { VIEW_NOTICES, CREATE_NOTICE, DELETE_NOTICE } from "../../../constants/permissions";
import { canAccessModule } from "../../../utils/permissionUtils";
import { noticeService, type NoticeResponse, type NoticeRequest } from "../../../services/notices/noticeService";
import {
  automationService,
  type NoticeStatutoryFormatResponse,
  type NoticeEmergencySanitizeResponse
} from "../../../services/automation/automationService";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const categories = ["All", "GENERAL", "MAINTENANCE", "SAFETY", "EVENT", "MEETING", "RULE_CHANGE"];

const categoryConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  GENERAL: { label: "General", icon: <Megaphone className="w-3.5 h-3.5" />, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  MAINTENANCE: { label: "Maintenance", icon: <Wrench className="w-3.5 h-3.5" />, color: "text-amber-600 bg-amber-50 border-amber-200" },
  SAFETY: { label: "Safety", icon: <Shield className="w-3.5 h-3.5" />, color: "text-red-500 bg-red-50 border-red-200" },
  EVENT: { label: "Event", icon: <CalendarDays className="w-3.5 h-3.5" />, color: "text-violet-600 bg-violet-50 border-violet-200" },
  MEETING: { label: "Meeting", icon: <Users className="w-3.5 h-3.5" />, color: "text-teal-600 bg-teal-50 border-teal-200" },
  RULE_CHANGE: { label: "Rule Change", icon: <BookOpen className="w-3.5 h-3.5" />, color: "text-orange-600 bg-orange-50 border-orange-200" },
};

const priorityConfig: Record<string, { label: string; dot: string }> = {
  LOW: { label: "Low", dot: "bg-slate-400" },
  NORMAL: { label: "Normal", dot: "bg-blue-500" },
  HIGH: { label: "High", dot: "bg-amber-500" },
  URGENT: { label: "Urgent", dot: "bg-red-500" },
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

export function NoticeBoard() {
  const { user, isSuperAdmin, hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "All";
  const setActiveCategory = (cat: string) => {
    setSearchParams((prev) => {
      prev.set("category", cat);
      return prev;
    }, { replace: true });
  };
  const [notices, setNotices] = useState<NoticeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editNotice, setEditNotice] = useState<NoticeResponse | null>(null);

  // AI Statutory Review & Multilingual Translation
  const [isFormattingStatutory, setIsFormattingStatutory] = useState(false);
  const [statutoryResult, setStatutoryResult] = useState<NoticeStatutoryFormatResponse | null>(null);
  const [showStatutoryModal, setShowStatutoryModal] = useState(false);

  // AI Emergency Flash Broadcast Sanitizer
  const [isSanitizingEmergency, setIsSanitizingEmergency] = useState(false);
  const [emergencyResult, setEmergencyResult] = useState<NoticeEmergencySanitizeResponse | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const handleStatutoryReview = async () => {
    setIsFormattingStatutory(true);
    try {
      const res = await automationService.formatStatutoryNotice({
        draftTitle: "Scheduled Elevator & Power Backup Modernization",
        rawNoticeContent: "Residents are informed that Lift #2 and DG synchronizer maintenance is scheduled for Tuesday 10:00 AM to 02:00 PM. Please use service lift during these hours.",
        issuingAuthority: "MANAGEMENT_COMMITTEE",
        applicableBylawSubject: "Apartment Ownership Act Clause 19 - Common Facility Upkeep",
        urgencyLevel: "IMPORTANT"
      });
      setStatutoryResult(res);
      setShowStatutoryModal(true);
    } catch (err) {
      console.error("AI Statutory Notice error:", err);
    } finally {
      setIsFormattingStatutory(false);
    }
  };

  const handleEmergencyBroadcast = async () => {
    setIsSanitizingEmergency(true);
    try {
      const res = await automationService.sanitizeEmergencyNotice({
        incidentType: "WATER_SUPPLY_LOSS",
        headline: "Water Supply Pressure Drop in Towers B & C",
        details: "Main distribution pump gasket seal ruptured during morning peak. Technical contractor is on-site replacement in progress.",
        affectedBlocks: ["Block B", "Block C"],
        reportedTime: new Date().toLocaleTimeString()
      });
      setEmergencyResult(res);
      setShowEmergencyModal(true);
    } catch (err) {
      console.error("AI Emergency Notice error:", err);
    } finally {
      setIsSanitizingEmergency(false);
    }
  };

  const isModuleEnabled = isSuperAdmin || canAccessModule(user, "NOTICES");
  const canView = isSuperAdmin || hasPermission(VIEW_NOTICES);
  const canCreate = isSuperAdmin || hasPermission(CREATE_NOTICE);
  const canDelete = isSuperAdmin || hasPermission(DELETE_NOTICE);

  const fetchNotices = useCallback(async () => {
    if (!isModuleEnabled || !canView) {
      setLoading(false);
      setNotices([]);
      return;
    }

    setLoading(true);
    try {
      const data = await noticeService.getNotices(activeCategory !== "All" ? activeCategory : undefined);
      setNotices(data);
    } catch {
      setNotices([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, isModuleEnabled, canView]);

  useEffect(() => { 
    if (isModuleEnabled && canView) {
      fetchNotices(); 
    } else {
      setLoading(false);
    }
  }, [fetchNotices, isModuleEnabled, canView]);

  const handlePin = async (id: number) => {
    if (!canCreate) return;
    try {
      await noticeService.togglePin(id);
      fetchNotices();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: number) => {
    if (!canDelete) return;
    try {
      await noticeService.deleteNotice(id);
      fetchNotices();
    } catch { /* ignore */ }
  };

  const handleSaved = () => {
    setShowCreate(false);
    setEditNotice(null);
    fetchNotices();
  };

  if (!isModuleEnabled) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm max-w-lg mx-auto mt-12 animate-in fade-in duration-300">
        <div className="p-4 bg-amber-50 text-amber-600 rounded-full border border-amber-100 mb-5">
          <PackageX className="w-10 h-10 text-amber-600" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 mb-2">Notice Board Not Available</h2>
        <p className="text-slate-500 text-xs mt-1 max-w-sm mb-6 leading-relaxed font-semibold">
          The Notice Board module is not enabled for your community.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm active:scale-95 cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm max-w-lg mx-auto mt-12 animate-in fade-in duration-300">
        <div className="p-4 bg-red-50 text-red-600 rounded-full border border-red-100 mb-5">
          <ShieldAlert className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-500 text-xs mt-1 max-w-sm mb-6 leading-relaxed font-semibold">
          You do not have permission to view notices. Please contact your community administrator.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm active:scale-95 cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  const pinned = notices.filter((n) => n.pinned);
  const unpinned = notices.filter((n) => !n.pinned);

  return (
    <div className="min-h-screen text-[#0d0d2b] p-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Community</span>
          <h4 className="text-2xl font-black text-[#0d0d2b] mt-1">Notice Board</h4>
          <p className="text-[#6b7094] text-sm mt-1">Announcements and updates from your community.</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleStatutoryReview}
            disabled={isFormattingStatutory}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            {isFormattingStatutory ? "Reviewing Bylaws..." : "AI Statutory Review"}
          </button>
          <button
            onClick={handleEmergencyBroadcast}
            disabled={isSanitizingEmergency}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-full transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            {isSanitizingEmergency ? "Sanitizing Flash..." : "AI Emergency Broadcast"}
          </button>
          {canCreate && (
            <button
              onClick={() => { setEditNotice(null); setShowCreate(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 text-white text-xs font-bold rounded-full transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Post Notice
            </button>
          )}
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 hide-scrollbar">
        {categories.map((cat) => {
          const cfg = categoryConfig[cat];
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border",
                activeCategory === cat
                  ? "bg-[#0d0d2b] text-white border-transparent shadow-sm"
                  : "bg-white text-[#6b7094] border-slate-200 hover:text-[#0d0d2b] hover:bg-slate-50"
              )}
            >
              {cfg?.label ?? cat}
            </button>
          );
        })}
      </div>

      {/* Notices */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Megaphone className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-[#6b7094] text-sm font-medium">No notices yet</p>
          <p className="text-slate-400 text-xs mt-1">Post the first announcement for your community!</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl">
          {pinned.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                <Pin className="w-3 h-3" /> Pinned
              </p>
              {pinned.map((n) => (
                <NoticeCard key={n.id} notice={n} onPin={handlePin} onDelete={handleDelete} onEdit={(n) => { setEditNotice(n); setShowCreate(true); }} canCreate={canCreate} canDelete={canDelete} />
              ))}
            </div>
          )}
          {unpinned.length > 0 && (
            <div className="space-y-3">
              {pinned.length > 0 && (
                <p className="text-[10px] font-bold text-[#6b7094] uppercase tracking-widest mt-6">Recent</p>
              )}
              {unpinned.map((n) => (
                <NoticeCard key={n.id} notice={n} onPin={handlePin} onDelete={handleDelete} onEdit={(n) => { setEditNotice(n); setShowCreate(true); }} canCreate={canCreate} canDelete={canDelete} />
              ))}
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <NoticeFormModal
          existing={editNotice}
          onClose={() => { setShowCreate(false); setEditNotice(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* AI Statutory Notice Review & Multilingual Modal */}
      {showStatutoryModal && statutoryResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowStatutoryModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800">AI Statutory Notice Review & Translator</h3>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                statutoryResult.statutoryCompliance === "COMPLIANT_WITH_BYLAWS" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}>
                {statutoryResult.statutoryCompliance.replace(/_/g, " ")}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">SENTIMENT / TONE SCORE</span>
                <span className="font-bold text-emerald-600 text-sm">{statutoryResult.sentimentToneScore}/100 (Polite & Constructive)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">STATUTORY BYLAW CITATION</span>
                <span className="font-medium text-slate-700 text-xs">{statutoryResult.bylawCitation}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                <span className="font-bold text-indigo-900 block mb-1">Revised English Notice</span>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">{statutoryResult.revisedEnglishNotice}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Hindi Translation (हिंदी)</span>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">{statutoryResult.hindiTranslation}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Regional Translation (ಕನ್ನಡ / తెలుగు)</span>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">{statutoryResult.regionalTranslation}</p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowStatutoryModal(false)}
                className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${statutoryResult.revisedEnglishNotice}\n\n${statutoryResult.hindiTranslation}\n\n${statutoryResult.regionalTranslation}`);
                  alert("Copied trilingual notice to clipboard!");
                  setShowStatutoryModal(false);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
              >
                Copy Trilingual Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Emergency Flash Broadcast Sanitizer Modal */}
      {showEmergencyModal && emergencyResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowEmergencyModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4 border border-rose-200">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-rose-900">AI Emergency Flash Broadcast Sanitizer</h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
                SEVERITY: {emergencyResult.severityLevel}
              </span>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl">
              <h4 className="font-bold text-rose-900 text-sm mb-1">{emergencyResult.emergencyHeadline}</h4>
              <p className="text-xs text-rose-800 leading-relaxed">{emergencyResult.sanitizedBroadcastMessage}</p>
              <div className="mt-2 text-[11px] font-semibold text-rose-700 flex items-center justify-between">
                <span>Expected Resolution: ~{emergencyResult.expectedResolutionEtaMinutes} minutes</span>
                <span>Helpline: {emergencyResult.escalationHelpline}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                <span className="font-bold text-emerald-900 block mb-1.5">Actionable DOs</span>
                <ul className="space-y-1 text-emerald-800 list-disc list-inside">
                  {emergencyResult.actionableDos?.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                <span className="font-bold text-amber-900 block mb-1.5">Actionable DON'Ts</span>
                <ul className="space-y-1 text-amber-800 list-disc list-inside">
                  {emergencyResult.actionableDonts?.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  alert("Emergency broadcast pushed to resident apps and WhatsApp flash group!");
                  setShowEmergencyModal(false);
                }}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
              >
                Push Emergency Broadcast
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NoticeCard({
  notice, onPin, onDelete, onEdit, canCreate, canDelete,
}: {
  notice: NoticeResponse;
  onPin: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (n: NoticeResponse) => void;
  canCreate?: boolean;
  canDelete?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const cat = categoryConfig[notice.category] ?? categoryConfig.GENERAL;
  const pri = priorityConfig[notice.priority] ?? priorityConfig.NORMAL;

  return (
    <div className={cn(
      "bg-white rounded-2xl border overflow-hidden shadow-[0_4px_20px_rgba(99,102,241,0.03)] transition-all",
      notice.pinned ? "border-indigo-200 ring-1 ring-indigo-100" : "border-[#6366f1]/12"
    )}>
      <div
        className="p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          {/* Priority dot */}
          <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 shrink-0", pri.dot)} title={pri.label} />

          <div className="flex-1 min-w-0">
            {/* Top row: category + time */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border", cat.color)}>
                {cat.icon} {cat.label}
              </span>
              {notice.pinned && <Pin className="w-3 h-3 text-indigo-500" />}
              <span className="text-[10px] text-slate-400 ml-auto shrink-0">{timeAgo(notice.createdAt)}</span>
            </div>

            {/* Title */}
            <h3 className="font-bold text-[#0d0d2b] text-sm leading-snug">{notice.title}</h3>

            {/* Preview or full body */}
            <p className={cn(
              "text-[#6b7094] text-xs leading-relaxed mt-1.5",
              !expanded && "line-clamp-2"
            )}>
              {notice.body}
            </p>

            {/* Expanded metadata */}
            {expanded && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 text-[11px] text-[#6b7094]">
                  <span className="font-medium text-[#0d0d2b]">{notice.authorName}</span>
                  <span>{formatDate(notice.createdAt)}</span>
                  {notice.expiresOn && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <Clock className="w-3 h-3" /> Expires {formatDate(notice.expiresOn)}
                    </span>
                  )}
                </div>
                {(canCreate || canDelete) && (
                  <div className="flex items-center gap-1">
                    {canCreate && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onPin(notice.id); }}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title={notice.pinned ? "Unpin" : "Pin"}
                      >
                        {notice.pinned ? <PinOff className="w-3.5 h-3.5 text-indigo-500" /> : <Pin className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                    )}
                    {canCreate && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(notice); }}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(notice.id); }}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform shrink-0 mt-1", expanded && "rotate-180")} />
        </div>
      </div>
    </div>
  );
}

function NoticeFormModal({
  existing, onClose, onSaved,
}: {
  existing: NoticeResponse | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<NoticeRequest>({
    title: existing?.title ?? "",
    body: existing?.body ?? "",
    category: existing?.category ?? "GENERAL",
    priority: existing?.priority ?? "NORMAL",
    pinned: existing?.pinned ?? false,
    expiresOn: existing?.expiresOn ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setError("Title and body are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (existing) {
        await noticeService.update(existing.id, form);
      } else {
        await noticeService.create(form);
      }
      onSaved();
    } catch {
      setError("Failed to save notice. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof NoticeRequest, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-[#0d0d2b]">{existing ? "Edit Notice" : "Post Notice"}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5 text-[#6b7094]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="text-red-500 text-xs font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div>
            <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Title *</label>
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              maxLength={200}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              placeholder="e.g. Water supply maintenance on Saturday"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Body *</label>
            <textarea
              value={form.body}
              onChange={(e) => update("body", e.target.value)}
              maxLength={5000}
              rows={5}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 resize-none"
              placeholder="Provide details about the announcement..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              >
                {Object.entries(categoryConfig).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => update("priority", e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              >
                {Object.entries(priorityConfig).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Expires On</label>
              <input
                type="date"
                value={form.expiresOn ?? ""}
                onChange={(e) => update("expiresOn", e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={(e) => update("pinned", e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-[#0d0d2b]">Pin to top</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-bold text-[#6b7094] hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold rounded-xl hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Saving..." : existing ? "Update" : "Post Notice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
