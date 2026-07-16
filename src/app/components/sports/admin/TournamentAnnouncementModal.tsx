import { useState } from "react";
import {
  Loader2, Mail, Bell, X, Send, FileText,
  Megaphone, Eye, ChevronDown
} from "lucide-react";
import { emailAdminService } from "../../../../services/emailAdminService";

export interface AnnouncementConfig {
  template: string;
  subject: string;
  message: string;
  sendEmail: boolean;
  sendPush: boolean;
  customHtml: string | null;
}

interface Props {
  tournament: { id: number; name: string };
  onConfirm: (config: AnnouncementConfig) => Promise<void>;
  onClose: () => void;
}

const TEMPLATES = [
  {
    key: "TOURNAMENT_OPEN",
    label: "Registration Open",
    description: "Announce that registration is now open",
    icon: "🏆",
    color: "emerald",
  },
  {
    key: "TOURNAMENT_ANNOUNCEMENT",
    label: "General Announcement",
    description: "Custom announcement about the tournament",
    icon: "📢",
    color: "violet",
  },
] as const;

const COLOR_MAP: Record<string, { border: string; bg: string; text: string; ring: string }> = {
  emerald: { border: "border-emerald-300", bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-500" },
  violet:  { border: "border-violet-300",  bg: "bg-violet-50",  text: "text-violet-700",  ring: "ring-violet-500"  },
};

export function TournamentAnnouncementModal({ tournament, onConfirm, onClose }: Props) {
  const [template, setTemplate] = useState("TOURNAMENT_OPEN");
  const [subject, setSubject] = useState(`Registration is now open — ${tournament.name}`);
  const [message, setMessage] = useState(
    `Registration for ${tournament.name} is now open! Sign up now to secure your spot.`
  );
  const [sendEmail, setSendEmail] = useState(true);
  const [sendPush, setSendPush] = useState(true);
  const [useCustomHtml, setUseCustomHtml] = useState(false);
  const [customHtml, setCustomHtml] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const handleTemplateChange = (key: string) => {
    setTemplate(key);
    if (key === "TOURNAMENT_OPEN") {
      setSubject(`Registration is now open — ${tournament.name}`);
      setMessage(`Registration for ${tournament.name} is now open! Sign up now to secure your spot.`);
    } else {
      setSubject(`Tournament announcement — ${tournament.name}`);
      setMessage("");
    }
    setPreviewHtml(null);
  };

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      if (useCustomHtml && customHtml.trim()) {
        setPreviewHtml(customHtml);
      } else {
        const html = await emailAdminService.getPreviewHtml(template);
        setPreviewHtml(html);
      }
    } catch {
      setPreviewHtml("<p style='padding:20px;color:#666'>Preview unavailable — template may not be deployed yet.</p>");
    } finally {
      setPreviewing(false);
    }
  };

  const handleSubmit = async () => {
    if (!subject.trim() || (!message.trim() && !useCustomHtml)) return;
    setSubmitting(true);
    try {
      await onConfirm({
        template,
        subject: subject.trim(),
        message: message.trim(),
        sendEmail,
        sendPush,
        customHtml: useCustomHtml && customHtml.trim() ? customHtml.trim() : null,
      });
    } catch {
      // parent handles error toast
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={!submitting ? onClose : undefined}
      />
      <div className="relative bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Megaphone className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Send Announcement</h2>
              <p className="text-sm text-slate-500 mt-0.5">{tournament.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Template Picker */}
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-widest font-bold block mb-2">
              Choose Template
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => {
                const c = COLOR_MAP[t.color];
                const selected = template === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => handleTemplateChange(t.key)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selected
                        ? `${c.border} ${c.bg} ring-2 ${c.ring} ring-offset-1`
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="text-xl mb-1">{t.icon}</div>
                    <div className={`text-sm font-semibold ${selected ? c.text : "text-slate-700"}`}>
                      {t.label}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{t.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-widest font-bold block mb-1.5">
              Email Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={submitting}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 outline-none transition-colors disabled:opacity-50"
            />
          </div>

          {/* Message */}
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-widest font-bold block mb-1.5">
              Notification Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              disabled={submitting}
              placeholder={template === "TOURNAMENT_ANNOUNCEMENT" ? "Write your announcement..." : undefined}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 outline-none resize-none transition-colors disabled:opacity-50"
            />
          </div>

          {/* Channel toggles */}
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-widest font-bold block mb-2">
              Notification Channels
            </label>
            <div className="space-y-2">
              <ChannelToggle
                icon={<Mail className="w-4 h-4" />}
                label="Email"
                sub="HTML template email to all community members"
                checked={sendEmail}
                onChange={setSendEmail}
                color="blue"
                disabled={submitting}
              />
              <ChannelToggle
                icon={<Bell className="w-4 h-4" />}
                label="In-App Notification"
                sub="Push notification in the notification bell"
                checked={sendPush}
                onChange={setSendPush}
                color="amber"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Custom HTML toggle */}
          <div>
            <button
              onClick={() => setUseCustomHtml(!useCustomHtml)}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${useCustomHtml ? "rotate-180" : ""}`} />
              <FileText className="w-3.5 h-3.5" />
              Use custom HTML template instead
            </button>
            {useCustomHtml && (
              <textarea
                value={customHtml}
                onChange={(e) => setCustomHtml(e.target.value)}
                rows={6}
                disabled={submitting}
                placeholder="Paste your custom HTML email template here..."
                className="mt-2 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-mono text-slate-700 placeholder-slate-400 focus:border-indigo-500 outline-none resize-none transition-colors disabled:opacity-50"
              />
            )}
          </div>

          {/* Preview */}
          <button
            onClick={handlePreview}
            disabled={previewing || submitting}
            className="flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors disabled:opacity-50"
          >
            {previewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
            Preview Template
          </button>

          {previewHtml && (
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-slate-200">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Email Preview
                </span>
                <button onClick={() => setPreviewHtml(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <iframe
                srcDoc={previewHtml}
                className="w-full h-64 border-none"
                sandbox="allow-same-origin"
                title="Email preview"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 border border-slate-200 bg-white text-slate-500 text-sm font-semibold rounded-lg hover:border-slate-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !subject.trim() || (!message.trim() && !useCustomHtml)}
            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send to Community
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChannelToggle({
  icon, label, sub, checked, onChange, color, disabled,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  color: "blue" | "amber";
  disabled?: boolean;
}) {
  const styles = {
    blue:  { border: "border-blue-200",  bg: "bg-blue-50/50",  text: "text-blue-600",  toggle: "bg-blue-500"  },
    amber: { border: "border-amber-200", bg: "bg-amber-50/50", text: "text-amber-600", toggle: "bg-amber-500" },
  };
  const c = styles[color];
  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${checked ? `${c.border} ${c.bg}` : "border-slate-200 bg-white"}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`${checked ? c.text : "text-slate-400"} flex-shrink-0 transition-colors`}>{icon}</div>
        <div className="min-w-0 text-left">
          <div className={`text-sm font-semibold transition-colors ${checked ? "text-slate-800" : "text-slate-500"}`}>
            {label}
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">{sub}</div>
        </div>
      </div>
      <div className={`relative w-11 h-6 rounded-full flex-shrink-0 ml-3 transition-colors ${checked ? c.toggle : "bg-slate-200"}`}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </div>
    </div>
  );
}
