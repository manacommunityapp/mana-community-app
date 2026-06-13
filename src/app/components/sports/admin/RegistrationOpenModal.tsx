import { useState } from "react";
import { Loader2, Mail, Bell, MessageSquare, X, CheckCircle2 } from "lucide-react";

export interface RegistrationNotifConfig {
  sendEmail: boolean;
  sendPush: boolean;
  sendSms: boolean;
  message: string;
}

interface RegistrationOpenModalProps {
  tournament: { id: number; name: string };
  onConfirm: (config: RegistrationNotifConfig) => Promise<void>;
  onClose: () => void;
}

export function RegistrationOpenModal({ tournament, onConfirm, onClose }: RegistrationOpenModalProps) {
  const [sendEmail, setSendEmail] = useState(true);
  const [sendPush, setSendPush] = useState(true);
  const [sendSms, setSendSms] = useState(true);
  const [message, setMessage] = useState(
    `Registration for ${tournament.name} is now open! Sign up now to secure your spot.`
  );
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm({ sendEmail, sendPush, sendSms, message });
    } catch {
      // parent handles error toast; keep modal open for retry
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
      <div className="relative bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="text-left">
            <h2 className="text-lg font-bold text-slate-800">Open for Registration</h2>
            <p className="text-sm text-slate-500 mt-0.5">{tournament.name}</p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-slate-400 hover:text-slate-600 transition-colors ml-4 flex-shrink-0 disabled:opacity-40 bg-transparent border-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status info banner */}
        <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 mb-5 text-left">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-emerald-700 leading-relaxed">
            Status will change to <strong>REGISTRATION OPEN</strong> and notifications will be sent
            to all community users on the selected channels below.
          </p>
        </div>

        {/* Notification message */}
        <div className="mb-4 text-left">
          <label className="text-xs text-slate-500 uppercase tracking-widest font-bold block mb-1.5">
            Notification Message
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            disabled={submitting}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 outline-none resize-none transition-colors disabled:opacity-50"
          />
        </div>

        {/* Channel toggles */}
        <div className="mb-6 text-left">
          <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2.5">
            Notification Channels
          </div>
          <div className="space-y-2">
            <ChannelRow
              icon={<Mail className="w-4 h-4" />}
              label="Email"
              sublabel="Send email to all community users"
              checked={sendEmail}
              onChange={setSendEmail}
              activeColor="blue"
              disabled={submitting}
            />
            <ChannelRow
              icon={<Bell className="w-4 h-4" />}
              label="Push Notification"
              sublabel="In-app and mobile push alerts"
              checked={sendPush}
              onChange={setSendPush}
              activeColor="orange"
              disabled={submitting}
            />
            <ChannelRow
              icon={<MessageSquare className="w-4 h-4" />}
              label="SMS / WhatsApp"
              sublabel="Text message to registered phone numbers"
              checked={sendSms}
              onChange={setSendSms}
              activeColor="green"
              disabled={submitting}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 border border-slate-200 bg-white text-slate-500 text-sm font-semibold rounded-lg hover:border-indigo-500 hover:text-indigo-600 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Opening...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Open Regs
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Channel toggle row ───────────────────────────────────────────────────────

interface ChannelRowProps {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  activeColor: "blue" | "orange" | "green";
  disabled?: boolean;
}

const colorClasses = {
  blue:   { border: "border-blue-200", bg: "bg-blue-50/50",  text: "text-blue-600",  toggle: "bg-blue-500"  },
  orange: { border: "border-amber-200", bg: "bg-amber-50/50",  text: "text-amber-600",  toggle: "bg-amber-500"  },
  green:  { border: "border-emerald-200", bg: "bg-emerald-50/50",  text: "text-emerald-600",  toggle: "bg-emerald-500"  },
};

function ChannelRow({ icon, label, sublabel, checked, onChange, activeColor, disabled }: ChannelRowProps) {
  const c = colorClasses[activeColor];
  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${checked ? `${c.border} ${c.bg}` : "border-slate-200 bg-white"}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`${checked ? c.text : "text-slate-400"} flex-shrink-0 transition-colors`}>
          {icon}
        </div>
        <div className="min-w-0 text-left">
          <div className={`text-sm font-semibold transition-colors ${checked ? "text-slate-800" : "text-slate-500"}`}>
            {label}
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">{sublabel}</div>
        </div>
      </div>
      {/* Toggle pill */}
      <div className={`relative w-11 h-6 rounded-full flex-shrink-0 ml-3 transition-colors ${checked ? c.toggle : "bg-slate-200"}`}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </div>
    </div>
  );
}
