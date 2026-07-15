import { useState, useEffect, useCallback } from "react";
import { Mail, Send, RefreshCw, CheckCircle2, XCircle, Eye, ChevronDown, ChevronRight, AlertTriangle, Zap } from "lucide-react";
import { emailAdminService, type EmailTemplateInfo, type EmailHealthInfo } from "../../../../services/emailAdminService";
import { showError, showSuccess, showWarning } from "../../../../utils/ToastUtils";

export function EmailPreviewTab() {
  const [templates, setTemplates] = useState<EmailTemplateInfo[]>([]);
  const [health, setHealth] = useState<EmailHealthInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sendingTemplate, setSendingTemplate] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [toEmail, setToEmail] = useState("");
  const [expandedSection, setExpandedSection] = useState<"templates" | "health" | null>("templates");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tpl, h] = await Promise.all([
        emailAdminService.getTemplates(),
        emailAdminService.getHealth(),
      ]);
      setTemplates(tpl.templates);
      setHealth(h);
    } catch {
      showError("Failed to load email data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePreview = async (key: string) => {
    if (previewKey === key) { setPreviewKey(null); return; }
    setPreviewKey(key);
    setLoadingPreview(true);
    try {
      const html = await emailAdminService.getPreviewHtml(key);
      setPreviewHtml(html);
    } catch {
      showError("Failed to load preview");
      setPreviewKey(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSendTest = async (templateKey: string) => {
    setSendingTemplate(templateKey);
    try {
      const result = await emailAdminService.sendTest(templateKey, toEmail || undefined);
      if (result.mailEnabled) {
        showSuccess(`Test email sent to ${result.to}`);
      } else {
        showWarning("Mail disabled — email rendered but not sent");
      }
    } catch (e: any) {
      showError(e?.message || "Failed to send test");
    } finally {
      setSendingTemplate(null);
    }
  };

  const handleSendAll = async () => {
    setSendingAll(true);
    try {
      const result = await emailAdminService.sendAllTests(toEmail || undefined);
      if (result.failed > 0) {
        showWarning(`${result.sent} sent, ${result.failed} failed`);
      } else {
        showSuccess(`All ${result.sent} test emails sent to ${result.to}`);
      }
    } catch (e: any) {
      showError(e?.message || "Failed to send test emails");
    } finally {
      setSendingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
        <span className="ml-2 text-sm text-slate-500">Loading email templates…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Health Status */}
      {health && (
        <div className={`rounded-xl border p-4 ${health.mailEnabled ? "bg-green-50/50 border-green-200" : "bg-amber-50/50 border-amber-200"}`}>
          <div className="flex items-center gap-2 mb-2">
            {health.mailEnabled ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            )}
            <span className="text-xs font-semibold text-slate-700">Email System Status</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
            <div>
              <span className="text-slate-400 block">Mode</span>
              <span className="font-medium text-slate-700">{health.recipientMode}</span>
            </div>
            <div>
              <span className="text-slate-400 block">From</span>
              <span className="font-medium text-slate-700 truncate block">{health.from}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Default Recipient</span>
              <span className="font-medium text-slate-700 truncate block">{health.defaultRecipient || "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Templates</span>
              <span className="font-medium text-slate-700">{health.templateCount}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">{health.status}</p>
        </div>
      )}

      {/* Send Controls */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] text-slate-400 uppercase tracking-wide block mb-1">Recipient Email (optional)</label>
            <input
              type="email"
              value={toEmail}
              onChange={e => setToEmail(e.target.value)}
              placeholder={health?.defaultRecipient || "admin@example.com"}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
            />
          </div>
          <button
            onClick={handleSendAll}
            disabled={sendingAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md disabled:opacity-50 transition-all cursor-pointer mt-4 sm:mt-0"
          >
            <Zap className="w-3.5 h-3.5" />
            {sendingAll ? "Sending…" : "Send All Templates"}
          </button>
        </div>
      </div>

      {/* Templates List */}
      <div className="space-y-2">
        {templates.map(tpl => {
          const isOpen = previewKey === tpl.key;
          const isSending = sendingTemplate === tpl.key;
          const templateLabel = tpl.key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

          return (
            <div key={tpl.key} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 p-3">
                <button
                  onClick={() => handlePreview(tpl.key)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                >
                  <div className="flex-shrink-0 text-slate-400">
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </div>
                  <Mail className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate">{templateLabel}</div>
                    <div className="text-[10px] text-slate-400 truncate">{tpl.subject}</div>
                  </div>
                </button>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handlePreview(tpl.key)}
                    className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 transition-colors cursor-pointer"
                    title="Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleSendTest(tpl.key)}
                    disabled={isSending}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    {isSending ? "…" : "Send"}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-slate-100">
                  {loadingPreview ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                    </div>
                  ) : (
                    <div className="p-1 bg-slate-50">
                      <iframe
                        srcDoc={previewHtml}
                        className="w-full border-0 rounded-lg bg-white"
                        style={{ minHeight: "400px", maxHeight: "600px" }}
                        title={`Preview: ${tpl.key}`}
                        sandbox="allow-same-origin"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
