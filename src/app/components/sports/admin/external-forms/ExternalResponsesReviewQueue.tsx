import { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
  Filter,
  ShieldAlert,
} from "lucide-react";
import {
  sportsExternalFormService,
  type ExternalResponseItem,
  type ResolveReviewPayload,
} from "../../../../../services/sports/sportsExternalFormService";
import { showSuccess, showError } from "../../../../../utils/ToastUtils";

interface ExternalResponsesReviewQueueProps {
  eventId: number;
  eventName: string;
  onResolved?: () => void;
}

export function ExternalResponsesReviewQueue({
  eventId,
  eventName,
  onResolved,
}: ExternalResponsesReviewQueueProps) {
  const [responses, setResponses] = useState<ExternalResponseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "NEEDS_REVIEW" | "REJECTED">("NEEDS_REVIEW");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [overrideNotes, setOverrideNotes] = useState<Record<number, string>>({});

  const fetchReviewQueue = async () => {
    setLoading(true);
    try {
      const items = await sportsExternalFormService.getReviewQueue(eventId);
      setResponses(items);
    } catch {
      showError("Failed to fetch review queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchReviewQueue();
    }
  }, [eventId]);

  const handleResolve = async (id: number, action: "APPROVE" | "REJECT" | "OVERRIDE") => {
    setResolvingId(id);
    try {
      const payload: ResolveReviewPayload = {
        action,
        reviewNotes: overrideNotes[id] || (action === "APPROVE" ? "Approved by sports organizer" : "Rejected by organizer"),
      };
      await sportsExternalFormService.resolveReview(id, payload);
      showSuccess(action === "APPROVE" ? "Registration overridden and confirmed!" : "Response marked rejected.");
      fetchReviewQueue();
      if (onResolved) onResolved();
    } catch (err: any) {
      showError(err?.message || "Failed to resolve response");
    } finally {
      setResolvingId(null);
    }
  };

  const filteredResponses = responses.filter(r => {
    if (filterStatus !== "ALL" && r.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const raw = r.rawPayloadJson.toLowerCase();
      const email = (r.respondentEmail || "").toLowerCase();
      const reason = (r.reviewReason || "").toLowerCase();
      return email.includes(q) || raw.includes(q) || reason.includes(q);
    }
    return true;
  });

  const parseRawPayload = (jsonStr: string) => {
    try {
      return JSON.parse(jsonStr);
    } catch {
      return {};
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">External Response Quarantine & Review</h4>
            <p className="text-xs text-slate-400">
              {eventName} • Verify ineligible, over-capacity, or duplicate submissions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setFilterStatus("NEEDS_REVIEW")}
              className={`px-3 py-1 rounded-md transition ${
                filterStatus === "NEEDS_REVIEW" ? "bg-amber-500 text-slate-950 font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              Needs Review ({responses.filter(r => r.status === "NEEDS_REVIEW").length})
            </button>
            <button
              onClick={() => setFilterStatus("REJECTED")}
              className={`px-3 py-1 rounded-md transition ${
                filterStatus === "REJECTED" ? "bg-red-500 text-white font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              Rejected ({responses.filter(r => r.status === "REJECTED").length})
            </button>
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`px-3 py-1 rounded-md transition ${
                filterStatus === "ALL" ? "bg-slate-700 text-white font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              All ({responses.length})
            </button>
          </div>

          <button
            onClick={fetchReviewQueue}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
            title="Refresh queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by player name, email, phone, or quarantine reason..."
          className="w-full pl-9 pr-4 py-2 bg-slate-900/40 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Queue List */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/30 rounded-xl border border-slate-800">
          Loading quarantined entries...
        </div>
      ) : filteredResponses.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/20 rounded-xl border border-slate-800/60 space-y-2">
          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
          <div className="text-sm font-medium text-slate-300">Quarantine Queue Clear!</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All external form registrations for this event have either been validated and imported cleanly or already resolved.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredResponses.map(item => {
            const raw = parseRawPayload(item.rawPayloadJson);
            const isExpanded = expandedId === item.id;
            const isResolving = resolvingId === item.id;
            const playerName = raw.playerName || raw["Full Name"] || item.respondentEmail || "Guest Player";
            const phone = raw.phone || raw["Phone Number / WhatsApp"] || "N/A";
            const flatNo = raw.flatNumber || raw["Flat / Apartment Number"] || "N/A";
            const category = raw.categoryId || raw["Tournament Category"] || "N/A";

            return (
              <div
                key={item.id}
                className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3 transition hover:border-slate-700"
              >
                {/* Row Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-800 text-slate-300 flex-shrink-0 mt-0.5">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{playerName}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            item.status === "NEEDS_REVIEW"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-red-500/20 text-red-300 border border-red-500/30"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Phone: <strong className="text-slate-300">{phone}</strong></span>
                        <span>Flat: <strong className="text-slate-300">{flatNo}</strong></span>
                        <span>Category: <strong className="text-slate-300">{category}</strong></span>
                        {item.respondentEmail && (
                          <span>Email: <strong className="text-slate-300">{item.respondentEmail}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reason Badge */}
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-300 text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="font-mono text-xs font-medium">{item.reviewReason || "NEEDS_REVIEW"}</span>
                    </div>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Validation Details */}
                {item.validationErrors && (
                  <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-900/40 text-xs text-red-300">
                    <strong className="text-red-400">Issue:</strong> {item.validationErrors}
                  </div>
                )}

                {/* Collapsible Raw Answers */}
                {isExpanded && (
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Submitted Form Payload
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {Object.entries(raw).map(([k, v]) => (
                        <div key={k} className="p-2 bg-slate-900 rounded border border-slate-800/80">
                          <div className="text-xs text-slate-500 truncate">{k}</div>
                          <div className="text-slate-200 font-medium truncate">{String(v || "—")}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Bar (Only for NEEDS_REVIEW) */}
                {item.status === "NEEDS_REVIEW" && (
                  <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <input
                      type="text"
                      placeholder="Optional organizer review note (e.g. 'Eligibility verified with resident directory')"
                      value={overrideNotes[item.id] || ""}
                      onChange={e => setOverrideNotes({ ...overrideNotes, [item.id]: e.target.value })}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 flex-grow"
                    />

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleResolve(item.id, "REJECT")}
                        disabled={isResolving}
                        className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-medium transition flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject Entry
                      </button>

                      <button
                        onClick={() => handleResolve(item.id, "APPROVE")}
                        disabled={isResolving}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition flex items-center gap-1 shadow-md shadow-emerald-600/20"
                      >
                        {isResolving ? (
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                        Override & Confirm
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
