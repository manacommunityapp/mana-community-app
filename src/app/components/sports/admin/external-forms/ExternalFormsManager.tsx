import { useState, useEffect } from "react";
import {
  Sparkles,
  ExternalLink,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Code,
  AlertCircle,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Users,
  Share2,
} from "lucide-react";
import {
  sportsExternalFormService,
  type ExternalFormConfig,
  type SyncResult,
} from "../../../../../services/sports/sportsExternalFormService";
import { CreateExternalFormModal } from "./CreateExternalFormModal";
import { AppsScriptModal } from "./AppsScriptModal";
import { ExternalResponsesReviewQueue } from "./ExternalResponsesReviewQueue";
import { ShareExternalFormModal } from "./ShareExternalFormModal";
import { showSuccess, showError } from "../../../../../utils/ToastUtils";

interface ExternalFormsManagerProps {
  event: any;
  onRefreshRegistrations?: () => void;
}

export function ExternalFormsManager({
  event,
  onRefreshRegistrations,
}: ExternalFormsManagerProps) {
  const [forms, setForms] = useState<ExternalFormConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"FORMS" | "REVIEW">("FORMS");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [appsScriptForm, setAppsScriptForm] = useState<{ id: number; title: string } | null>(null);
  const [shareModalForm, setShareModalForm] = useState<ExternalFormConfig | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchForms = async () => {
    if (!event?.id) return;
    setLoading(true);
    try {
      const data = await sportsExternalFormService.getFormsForEvent(event.id);
      setForms(data);
    } catch {
      showError("Failed to fetch external forms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, [event?.id]);

  const handleSync = async (formId: number) => {
    setSyncingId(formId);
    try {
      const result: SyncResult = await sportsExternalFormService.syncForm(formId);
      showSuccess(result.message || "Form responses synchronized successfully!");
      fetchForms();
      if (onRefreshRegistrations) onRefreshRegistrations();
    } catch (err: any) {
      showError(err?.message || "Sync failed");
    } finally {
      setSyncingId(null);
    }
  };

  const copyLink = async (form: ExternalFormConfig) => {
    try {
      await navigator.clipboard.writeText(form.responderUrl);
      setCopiedId(form.id);
      showSuccess("Public link copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      showError("Failed to copy link");
    }
  };

  const totalQuarantined = forms.reduce(
    (sum, f) => sum + (f.syncState?.totalQuarantined || 0),
    0
  );

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-6">
      {/* Top Bar with Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-white">External Form Integration</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-400 font-medium border border-blue-500/30">
              Google Forms & Public Links
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Publish external forms, auto-import responses into tournament pools, and review non-standard entries.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sub-tab navigation */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab("FORMS")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "FORMS"
                  ? "bg-slate-800 text-white font-medium shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Forms ({forms.length})
            </button>
            <button
              onClick={() => setActiveTab("REVIEW")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === "REVIEW"
                  ? "bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Review Queue</span>
              {totalQuarantined > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold">
                  {totalQuarantined}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Form
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "REVIEW" ? (
        <ExternalResponsesReviewQueue
          eventId={event.id}
          eventName={event.name || event.title}
          onResolved={() => {
            fetchForms();
            if (onRefreshRegistrations) onRefreshRegistrations();
          }}
        />
      ) : loading ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
          Loading external forms...
        </div>
      ) : forms.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/30 rounded-xl border border-dashed border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-semibold text-white">No External Forms Created Yet</div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Create a Google Form or Mana Public Link to start accepting registrations outside the community app.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create First External Form
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forms.map(form => {
            const isGoogle = form.provider === "GOOGLE_FORMS";
            const isSyncing = syncingId === form.id;
            const sync = form.syncState;

            return (
              <div
                key={form.id}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4 hover:border-slate-700 transition"
              >
                {/* Form Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl border ${
                        isGoogle
                          ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                          : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      }`}
                    >
                      {isGoogle ? <Sparkles className="w-5 h-5" /> : <ExternalLink className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-white">{form.title}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                          {form.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {isGoogle ? "Google Form" : "Mana Hosted Public Form"} • Created{" "}
                        {new Date(form.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sync Counters & Health */}
                <div className="grid grid-cols-4 gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 text-center">
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Polled</div>
                    <div className="text-sm font-semibold text-slate-200">{sync?.totalResponsesPolled ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-emerald-500 uppercase tracking-wider">Imported</div>
                    <div className="text-sm font-semibold text-emerald-400">{sync?.totalImported ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-amber-500 uppercase tracking-wider">Review</div>
                    <div className="text-sm font-semibold text-amber-400">{sync?.totalQuarantined ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-red-500 uppercase tracking-wider">Rejected</div>
                    <div className="text-sm font-semibold text-red-400">{sync?.totalRejected ?? 0}</div>
                  </div>
                </div>

                {/* Action Links */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => copyLink(form)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center gap-1"
                      title="Copy Public Link"
                    >
                      {copiedId === form.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="text-[10px]">{copiedId === form.id ? "Copied" : "Copy Link"}</span>
                    </button>

                    <a
                      href={form.responderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Open</span>
                    </a>

                    <button
                      onClick={() => setShareModalForm(form)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/40 transition flex items-center gap-1"
                      title="Share to WhatsApp, QR flyer, Email"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Share</span>
                    </button>

                    {isGoogle && (
                      <button
                        onClick={() => setAppsScriptForm({ id: form.id, title: form.title })}
                        className="px-2.5 py-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-800/40 transition flex items-center gap-1"
                        title="Webhook Apps Script Integration"
                      >
                        <Code className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Apps Script</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleSync(form.id)}
                    disabled={isSyncing}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-medium transition flex items-center gap-1.5 shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                    <span className="text-[10px]">{isSyncing ? "Syncing..." : "Sync"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreateExternalFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        event={event}
        onFormCreated={() => {
          fetchForms();
          if (onRefreshRegistrations) onRefreshRegistrations();
        }}
      />

      {appsScriptForm && (
        <AppsScriptModal
          isOpen={!!appsScriptForm}
          onClose={() => setAppsScriptForm(null)}
          formId={appsScriptForm.id}
          formTitle={appsScriptForm.title}
        />
      )}

      {shareModalForm && (
        <ShareExternalFormModal
          isOpen={!!shareModalForm}
          onClose={() => setShareModalForm(null)}
          form={shareModalForm}
          event={event}
        />
      )}
    </div>
  );
}
