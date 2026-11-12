import { useState, useEffect, useCallback } from "react";
import {
  Send, Eye, Clock, CheckCircle2, AlertTriangle, RefreshCw, Loader2,
  ChevronDown, ChevronRight, Bell, Download, FileSpreadsheet, FileText,
  Globe, Layers, Calendar, BarChart3, Shield, ArrowRight,
} from "lucide-react";
import { tournamentStageService } from "../../../../services/sports/tournamentStageService";
import { showSuccess, showError, showWarning, showInfo } from "../../../../utils/ToastUtils";
import { confirmAction } from "../../../../utils/AlertUtils";
import type {
  TournamentStage,
  TournamentScheduleDashboard,
  StageScheduleSummary,
  StageStatus,
} from "../../../../types/tournamentStage";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return String(iso); }
}

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5">
      <div
        className={`h-1.5 rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Dashboard Cards ────────────────────────────────────────────────────────

function DashboardCards({ dashboard }: { dashboard: TournamentScheduleDashboard }) {
  const cards = [
    { label: "Total Matches", value: dashboard.totalMatches, color: "text-slate-800" },
    { label: "Completed", value: dashboard.completedMatches, color: "text-emerald-600" },
    { label: "Upcoming", value: dashboard.upcomingMatches, color: "text-blue-600" },
    { label: "Postponed", value: dashboard.postponedMatches, color: "text-amber-600" },
    { label: "Live Now", value: dashboard.liveMatches, color: "text-red-600" },
    { label: "Pending Publish", value: dashboard.pendingPublications, color: "text-violet-600" },
  ];
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {cards.map(c => (
        <div key={c.label} className="bg-white rounded-xl border border-slate-100 p-3 text-center">
          <div className={`text-lg font-bold ${c.color}`}>{c.value}</div>
          <div className="text-[8px] text-slate-500 uppercase tracking-wider mt-0.5">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Stage Publication Table ────────────────────────────────────────────────

function StagePublicationTable({
  stages,
  onPublish,
  onUnpublish,
  onNotify,
  actionLoading,
}: {
  stages: TournamentStage[];
  onPublish: (stageId: number) => void;
  onUnpublish: (stageId: number) => void;
  onNotify: (stageId: number) => void;
  actionLoading: string | null;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider">
              <th className="text-left p-3 font-semibold">Stage</th>
              <th className="text-center p-3 font-semibold">Matches</th>
              <th className="text-center p-3 font-semibold">Status</th>
              <th className="text-center p-3 font-semibold">Publication</th>
              <th className="text-center p-3 font-semibold">Version</th>
              <th className="text-center p-3 font-semibold">Last Published</th>
              <th className="text-right p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {stages
              .sort((a, b) => a.stageOrder - b.stageOrder)
              .map(stage => {
                const canPublish = stage.stageStatus === "APPROVED" || stage.stageStatus === "VALIDATED";
                const canUnpublish = stage.publicationStatus === "PUBLISHED" || stage.publicationStatus === "UPDATED";
                const canNotify = stage.publicationStatus === "PUBLISHED" || stage.publicationStatus === "UPDATED";
                const isPublishing = actionLoading === `publish-${stage.id}`;
                const isUnpublishing = actionLoading === `unpublish-${stage.id}`;
                const isNotifying = actionLoading === `notify-${stage.id}`;

                return (
                  <tr key={stage.id} className="hover:bg-slate-50/50">
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{stage.stageName}</div>
                      <div className="text-[9px] text-slate-500">{stage.stageType.replace(/_/g, " ")}</div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-bold text-slate-800">{stage.matchCount}</span>
                      {stage.matchCount > 0 && (
                        <div className="mt-1 w-16 mx-auto">
                          <ProgressBar completed={stage.completedMatchCount} total={stage.matchCount} />
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                        stage.stageStatus === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" :
                        stage.stageStatus === "COMPLETED" ? "bg-violet-50 text-violet-700" :
                        stage.stageStatus === "APPROVED" ? "bg-indigo-50 text-indigo-700" :
                        stage.stageStatus === "DRAFT" ? "bg-amber-50 text-amber-700" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {stage.stageStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                        stage.publicationStatus === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" :
                        stage.publicationStatus === "UPDATED" ? "bg-blue-50 text-blue-700" :
                        stage.publicationStatus === "WITHDRAWN" ? "bg-red-50 text-red-600" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {stage.publicationStatus}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono text-slate-600">
                      {stage.publishedVersionId ? `v${stage.publishedVersionId}` : "—"}
                    </td>
                    <td className="p-3 text-center text-[9px] text-slate-500">
                      {stage.updatedAt ? formatDate(stage.updatedAt) : "—"}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canPublish && (
                          <button
                            onClick={() => onPublish(stage.id)}
                            disabled={!!actionLoading}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[9px] font-semibold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 disabled:opacity-50 cursor-pointer"
                          >
                            {isPublishing ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Send className="w-2.5 h-2.5" />}
                            Publish
                          </button>
                        )}
                        {canUnpublish && (
                          <button
                            onClick={() => onUnpublish(stage.id)}
                            disabled={!!actionLoading}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[9px] font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 cursor-pointer"
                          >
                            {isUnpublishing ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Globe className="w-2.5 h-2.5" />}
                            Unpublish
                          </button>
                        )}
                        {canNotify && (
                          <button
                            onClick={() => onNotify(stage.id)}
                            disabled={!!actionLoading}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[9px] font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 cursor-pointer"
                          >
                            {isNotifying ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Bell className="w-2.5 h-2.5" />}
                            Notify
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function SchedulePublicationManager({ configId }: { configId: number }) {
  const [stages, setStages] = useState<TournamentStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<TournamentScheduleDashboard | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [stagesData, dashboardData] = await Promise.all([
        tournamentStageService.getStages(configId),
        tournamentStageService.getScheduleDashboard(configId).catch(() => null),
      ]);
      setStages(stagesData);
      setDashboard(dashboardData);
    } catch {
      showError("Failed to load publication data");
    } finally {
      setLoading(false);
    }
  }, [configId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePublish = async (stageId: number) => {
    const stage = stages.find(s => s.id === stageId);
    const confirmed = await confirmAction(
      "Publish Stage Schedule",
      `Publish "${stage?.stageName || "stage"}" fixtures? This will be visible to all participants and creates an immutable schedule version.`
    );
    if (!confirmed) return;
    setActionLoading(`publish-${stageId}`);
    try {
      await tournamentStageService.publishStage(stageId);
      showSuccess(`"${stage?.stageName}" published successfully`);
      fetchData();
    } catch (e: any) {
      showError(e?.message || "Failed to publish stage");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnpublish = async (stageId: number) => {
    const stage = stages.find(s => s.id === stageId);
    const confirmed = await confirmAction(
      "Withdraw Publication",
      `Withdraw "${stage?.stageName || "stage"}" from public view? Participants will no longer see these fixtures.`
    );
    if (!confirmed) return;
    setActionLoading(`unpublish-${stageId}`);
    try {
      await tournamentStageService.unpublishStage(stageId, "Admin withdrew publication");
      showSuccess(`"${stage?.stageName}" withdrawn from public`);
      fetchData();
    } catch (e: any) {
      showError(e?.message || "Failed to unpublish stage");
    } finally {
      setActionLoading(null);
    }
  };

  const handleNotify = async (stageId: number) => {
    const stage = stages.find(s => s.id === stageId);
    setActionLoading(`notify-${stageId}`);
    try {
      const result = await tournamentStageService.sendStageNotification(stageId, "SCHEDULE_PUBLISHED");
      showSuccess(`Notifications sent: ${result.sent} delivered, ${result.failed} failed`);
    } catch (e: any) {
      showError(e?.message || "Failed to send notifications");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
        <span className="text-[10px] ml-2 text-slate-500">Loading publication manager…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Send className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800">Schedule Publication Manager</h3>
            <p className="text-[9px] text-slate-500">Manage stage-wise publication and notifications</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Dashboard Cards */}
      {dashboard && <DashboardCards dashboard={dashboard} />}

      {/* Conflict Warning */}
      {dashboard?.hasUnresolvedConflicts && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] font-bold text-amber-800">Scheduling Conflicts Detected</div>
            <div className="text-[9px] text-amber-700 mt-0.5">
              Resolve all conflicts before publishing. Check venue availability, team rest periods, and stage dependencies.
            </div>
          </div>
        </div>
      )}

      {/* Publication Table */}
      {stages.length > 0 ? (
        <StagePublicationTable
          stages={stages}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
          onNotify={handleNotify}
          actionLoading={actionLoading}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 text-center space-y-2">
          <Layers className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-[10px] text-slate-500">No stages to publish. Configure stages first.</p>
        </div>
      )}
    </div>
  );
}
