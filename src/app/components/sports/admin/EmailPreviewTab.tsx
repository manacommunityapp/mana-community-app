import { useState, useEffect, useCallback, useRef } from "react";
import { Mail, Send, RefreshCw, CheckCircle2, Eye, X, AlertTriangle, Zap, Inbox, Upload, Image as ImageIcon, Sparkles, AlertCircle } from "lucide-react";
import { emailAdminService, type EmailTemplateInfo, type EmailHealthInfo } from "../../../../services/emailAdminService";
import { showError, showSuccess, showWarning } from "../../../../utils/ToastUtils";

const TEMPLATE_COLORS: Record<string, { bg: string; border: string; icon: string; badge: string; gradient: string }> = {
  REGISTRATION_RECEIVED:  { bg: "bg-blue-50/70",    border: "border-blue-200",    icon: "text-blue-500",    badge: "bg-blue-100 text-blue-700", gradient: "from-blue-600 to-indigo-600" },
  REGISTRATION_CONFIRMED: { bg: "bg-emerald-50/70", border: "border-emerald-200", icon: "text-emerald-500",  badge: "bg-emerald-100 text-emerald-700", gradient: "from-emerald-600 to-teal-600" },
  REGISTRATION_REJECTED:  { bg: "bg-slate-50/70",    border: "border-slate-200",    icon: "text-slate-500",    badge: "bg-slate-100 text-slate-700", gradient: "from-slate-600 to-slate-700" },
  SCHEDULE_PUBLISHED:     { bg: "bg-violet-50/70",   border: "border-violet-200",   icon: "text-violet-500",   badge: "bg-violet-100 text-violet-700", gradient: "from-violet-600 to-purple-600" },
  TOURNAMENT_START:       { bg: "bg-indigo-50/70",   border: "border-indigo-300",  icon: "text-indigo-600",   badge: "bg-indigo-100 text-indigo-800", gradient: "from-indigo-600 to-blue-700" },
  MATCH_REMINDER:         { bg: "bg-orange-50/70",   border: "border-orange-200",   icon: "text-orange-500",   badge: "bg-orange-100 text-orange-700", gradient: "from-orange-500 to-amber-600" },
  WINNER_NOTIFICATION:    { bg: "bg-yellow-50/70",   border: "border-yellow-200",   icon: "text-yellow-600",   badge: "bg-yellow-100 text-yellow-700", gradient: "from-yellow-500 to-amber-500" },
  TOURNAMENT_COMPLETION:  { bg: "bg-indigo-50/70",   border: "border-indigo-200",   icon: "text-indigo-500",   badge: "bg-indigo-100 text-indigo-700", gradient: "from-indigo-600 to-violet-700" },
  PRIZE_DISTRIBUTION:     { bg: "bg-pink-50/70",     border: "border-pink-200",     icon: "text-pink-500",     badge: "bg-pink-100 text-pink-700", gradient: "from-pink-600 to-rose-600" },
  EMAIL_OTP:              { bg: "bg-cyan-50/70",     border: "border-cyan-200",     icon: "text-cyan-500",     badge: "bg-cyan-100 text-cyan-700", gradient: "from-cyan-600 to-blue-600" },
  REGISTRATION_OPEN:      { bg: "bg-purple-50/70",   border: "border-purple-200",   icon: "text-purple-500",   badge: "bg-purple-100 text-purple-700", gradient: "from-purple-600 to-fuchsia-600" },
};

const DEFAULT_COLOR = { bg: "bg-gray-50", border: "border-gray-200", icon: "text-gray-500", badge: "bg-gray-100 text-gray-700", gradient: "from-slate-600 to-slate-800" };

const TEMPLATE_EMOJIS: Record<string, string> = {
  REGISTRATION_RECEIVED:  "📥",
  REGISTRATION_CONFIRMED: "✅",
  REGISTRATION_REJECTED:  "❌",
  SCHEDULE_PUBLISHED:     "📅",
  TOURNAMENT_START:       "🏁",
  MATCH_REMINDER:         "⏰",
  WINNER_NOTIFICATION:    "🏅",
  TOURNAMENT_COMPLETION:  "🏆",
  PRIZE_DISTRIBUTION:     "🎁",
  EMAIL_OTP:              "🔐",
  REGISTRATION_OPEN:      "📢",
};

const TEMPLATE_ORDER = [
  "REGISTRATION_OPEN",
  "REGISTRATION_RECEIVED",
  "REGISTRATION_CONFIRMED",
  "REGISTRATION_REJECTED",
  "SCHEDULE_PUBLISHED",
  "TOURNAMENT_START",
  "MATCH_REMINDER",
  "WINNER_NOTIFICATION",
  "TOURNAMENT_COMPLETION",
  "PRIZE_DISTRIBUTION",
  "EMAIL_OTP"
];

export function EmailPreviewTab() {
  const [templates, setTemplates] = useState<EmailTemplateInfo[]>([]);
  const [health, setHealth] = useState<EmailHealthInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [toEmail, setToEmail] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  
  // Custom Banner & Sponsor Image States
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const [sponsorUrl, setSponsorUrl] = useState<string>("");

  // Modal & Preview States
  const [activeTemplate, setActiveTemplate] = useState<EmailTemplateInfo | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sendingTemplate, setSendingTemplate] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);

  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const sponsorFileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tpl, h] = await Promise.all([
        emailAdminService.getTemplates(),
        emailAdminService.getHealth(),
      ]);
      
      const sorted = [...tpl.templates].sort((a, b) => {
        const idxA = TEMPLATE_ORDER.indexOf(a.key);
        const idxB = TEMPLATE_ORDER.indexOf(b.key);
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
      });
      
      setTemplates(sorted);
      setHealth(h);
    } catch {
      showError("Failed to load email data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load preview when activeTemplate, bannerUrl or sponsorUrl changes
  useEffect(() => {
    if (!activeTemplate) return;

    const fetchPreview = async () => {
      setLoadingPreview(true);
      try {
        const payload = {
          bannerUrl: bannerUrl || undefined,
          sponsorImageUrl: sponsorUrl || undefined,
        };
        const html = await emailAdminService.getPreviewHtml(activeTemplate.key, payload);
        setPreviewHtml(html);
      } catch {
        showError("Failed to load template preview");
      } finally {
        setLoadingPreview(false);
      }
    };

    fetchPreview();
  }, [activeTemplate, bannerUrl, sponsorUrl]);

  // Handle File uploads converted to Base64
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
        showSuccess(`${type === "banner" ? "Banner" : "Sponsor"} image loaded successfully.`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendTest = async () => {
    if (!activeTemplate) return;
    setSendingTemplate(true);
    try {
      const customVars = {
        bannerUrl: bannerUrl || undefined,
        sponsorImageUrl: sponsorUrl || undefined,
        fromEmail: fromEmail || undefined,
        fromName: fromName || undefined,
      };
      const result = await emailAdminService.sendTest(activeTemplate.key, toEmail || undefined, customVars);
      if (result.mailEnabled) {
        showSuccess(`Test email sent to ${result.to}`);
      } else {
        showWarning("Mail disabled — email rendered but not sent via SMTP");
      }
    } catch {
      showError("Failed to send test");
    } finally {
      setSendingTemplate(false);
    }
  };

  const handleSendAll = async () => {
    setSendingAll(true);
    try {
      const customVars = {
        bannerUrl: bannerUrl || undefined,
        sponsorImageUrl: sponsorUrl || undefined,
        fromEmail: fromEmail || undefined,
        fromName: fromName || undefined,
      };
      const result = await emailAdminService.sendAllTests(toEmail || undefined, customVars);
      if (result.failed > 0) {
        showWarning(`${result.sent} sent, ${result.failed} failed`);
      } else {
        showSuccess(`All ${result.sent} templates sent successfully to ${result.to}`);
      }
    } catch {
      showError("Failed to send all tests");
    } finally {
      setSendingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
        <span className="ml-2 text-sm text-slate-500">Loading email templates…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Configuration & Global Status ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Health System Info */}
        {health && (
          <div className={`lg:col-span-2 rounded-2xl border p-5 ${health.mailEnabled
            ? "bg-gradient-to-br from-emerald-50 to-teal-50/30 border-emerald-100"
            : "bg-gradient-to-br from-amber-50/50 to-yellow-50/20 border-amber-100"}`}
          >
            <div className="flex items-center gap-2 mb-3">
              {health.mailEnabled
                ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                : <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
              }
              <span className="text-xs font-extrabold text-slate-800 tracking-wide uppercase">Email System Configuration</span>
              <span className={`ml-auto text-[9px] font-black px-2.5 py-0.5 rounded-full tracking-wide ${health.mailEnabled
                ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                {health.mailEnabled ? "SMTP ACTIVE" : "SMTP INACTIVE"}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Routing Mode", value: health.recipientMode },
                { label: "Sender (From)", value: health.from },
                { label: "Default Target", value: health.defaultRecipient || "—" },
                { label: "Registered Templates", value: String(health.templateCount) },
              ].map(s => (
                <div key={s.label}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">{s.label}</span>
                  <span className="text-xs font-semibold text-slate-700 truncate block">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global Controls Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1">Target Test Email</label>
              <input
                type="email"
                value={toEmail}
                onChange={e => setToEmail(e.target.value)}
                placeholder={health?.defaultRecipient || "admin@example.com"}
                className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1">Sender Email (From)</label>
              <input
                type="email"
                value={fromEmail}
                onChange={e => setFromEmail(e.target.value)}
                placeholder={health?.from || "no-reply@manacommunity.app"}
                className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1">Sender Name (From Name)</label>
              <input
                type="text"
                value={fromName}
                onChange={e => setFromName(e.target.value)}
                placeholder="Mana Community"
                className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all font-semibold"
              />
            </div>
          </div>
          <button
            onClick={handleSendAll}
            disabled={sendingAll}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            {sendingAll ? "Sending All…" : "Fire All Templates"}
          </button>
        </div>
      </div>

      {/* ── Banner and Sponsor Configuration Panel ──────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 border-slate-100">
          <Sparkles className="w-4.5 h-4.5 text-indigo-500" />
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Dynamic Media Insertion (All Templates)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Banner Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              Email Banner Image
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste Image URL..."
                value={bannerUrl}
                onChange={e => setBannerUrl(e.target.value)}
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
              />
              <input
                type="file"
                accept="image/*"
                ref={bannerFileInputRef}
                onChange={e => handleImageUpload(e, "banner")}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => bannerFileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload
              </button>
            </div>
            {bannerUrl && (
              <div className="flex items-center gap-2 mt-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-mono truncate flex-1">{bannerUrl}</span>
                <button
                  onClick={() => setBannerUrl("")}
                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Sponsor Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              Sponsor Logo Image
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste Logo URL..."
                value={sponsorUrl}
                onChange={e => setSponsorUrl(e.target.value)}
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
              />
              <input
                type="file"
                accept="image/*"
                ref={sponsorFileInputRef}
                onChange={e => handleImageUpload(e, "sponsor")}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => sponsorFileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload
              </button>
            </div>
            {sponsorUrl && (
              <div className="flex items-center gap-2 mt-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-mono truncate flex-1">{sponsorUrl}</span>
                <button
                  onClick={() => setSponsorUrl("")}
                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Templates Card List ─────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Inbox className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Email Templates</h3>
          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{templates.length}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map(tpl => {
            const colors = TEMPLATE_COLORS[tpl.key] || DEFAULT_COLOR;
            const emoji = TEMPLATE_EMOJIS[tpl.key] || "📧";
            const templateLabel = tpl.key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

            return (
              <div
                key={tpl.key}
                onClick={() => setActiveTemplate(tpl)}
                className={`group rounded-2xl border bg-white overflow-hidden transition-all duration-200 hover:scale-[1.01] hover:shadow-md cursor-pointer ${colors.border}`}
              >
                <div className={`flex items-center gap-3 p-4 ${colors.bg}`}>
                  <div className="text-xl flex-shrink-0">{emoji}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors">{templateLabel}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{tpl.subject}</div>
                  </div>
                  <div className="flex-shrink-0 text-slate-300 group-hover:text-indigo-400 transition-colors">
                    <Eye className="w-4.5 h-4.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Live Template Preview Modal ───────────────────────── */}
      {activeTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{TEMPLATE_EMOJIS[activeTemplate.key] || "📧"}</span>
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    {activeTemplate.key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{activeTemplate.subject}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTemplate(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Pane */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              
              {/* Left Settings Sidebar */}
              <div className="w-full md:w-80 bg-white border-r border-slate-200 p-5 overflow-y-auto space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Scope info */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-[11px] text-slate-500 leading-relaxed">
                    <span className="font-bold text-slate-700 block mb-1">🛠 Template Scope</span>
                    Verify design rendering live before distributing to tournament players or residents.
                  </div>

                  {/* Recipient & Sender Overrides */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider block mb-1">Test Recipient</label>
                      <input
                        type="email"
                        value={toEmail}
                        onChange={e => setToEmail(e.target.value)}
                        placeholder={health?.defaultRecipient || "test@example.com"}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider block mb-1">Sender Email (From)</label>
                      <input
                        type="email"
                        value={fromEmail}
                        onChange={e => setFromEmail(e.target.value)}
                        placeholder={health?.from || "no-reply@manacommunity.app"}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider block mb-1">Sender Name (From Name)</label>
                      <input
                        type="text"
                        value={fromName}
                        onChange={e => setFromName(e.target.value)}
                        placeholder="Mana Community"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all font-semibold"
                      />
                    </div>
                  </div>

                  {/* Quick toggle indicator */}
                  {(bannerUrl || sponsorUrl) && (
                    <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <div className="text-[10px] text-indigo-800 leading-tight">
                        Custom media is active. Both banner and sponsor assets are injected into the HTML.
                      </div>
                    </div>
                  )}
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSendTest}
                  disabled={sendingTemplate}
                  className={`w-full py-3 px-4 rounded-xl text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r ${TEMPLATE_COLORS[activeTemplate.key]?.gradient || DEFAULT_COLOR.gradient}`}
                >
                  {sendingTemplate ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {sendingTemplate ? "Sending Test..." : "Send Test Email"}
                </button>
              </div>

              {/* Right Iframe Preview Pane */}
              <div className="flex-1 bg-slate-100 flex flex-col">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live Mail Preview</span>
                </div>
                <div className="flex-1 p-6 flex justify-center items-center overflow-y-auto">
                  {loadingPreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                      <span className="text-xs text-slate-400 font-semibold">Compiling templates...</span>
                    </div>
                  ) : (
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full h-full border border-slate-200 rounded-xl bg-white shadow-xl max-w-xl"
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

    </div>
  );
}
