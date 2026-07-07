import { format } from "date-fns";
import { showSuccess } from "../../../../utils/ToastUtils";

const toast = {
  success: (msg: string) => showSuccess(msg),
};

const DEFAULT_TRIGGERS = {
  "7d":  { id: "7d",  label: "7 Days Before",       offset: -7 * 24 * 60, color: "border-blue-500",   bgColor: "rgba(59,130,246,0.15)",   textColor: "text-blue-400",   emoji: "📅", tagClass: "bg-blue-500/15 text-blue-400 border border-blue-500/20", category: "Registration", priority: "Critical" },
  "1d":  { id: "1d",  label: "1 Day Before",         offset: -1 * 24 * 60, color: "border-amber-500",  bgColor: "rgba(245,158,11,0.15)",   textColor: "text-amber-400",  emoji: "🌅", tagClass: "bg-amber-500/15 text-amber-400 border border-amber-500/20", category: "Reminder",   priority: "Critical" },
  "2h":  { id: "2h",  label: "2 Hours Before",       offset: -120,         color: "border-emerald-500",bgColor: "rgba(16,185,129,0.15)",  textColor: "text-emerald-400", emoji: "⚡", tagClass: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20", category: "Urgent",   priority: "High" },
  "30m": { id: "30m", label: "30 Minutes Before",    offset: -30,          color: "border-rose-500",   bgColor: "rgba(244,63,94,0.15)",   textColor: "text-rose-400",   emoji: "🔴", tagClass: "bg-rose-500/15 text-rose-400 border border-rose-500/20", category: "Critical",   priority: "Critical" },
  "now": { id: "now", label: "At Tournament Start",  offset: 0,            color: "border-yellow-400", bgColor: "rgba(245,158,11,0.2)",    textColor: "text-yellow-400",  emoji: "🏁", tagClass: "bg-amber-500/15 text-amber-500 border border-amber-500/20", category: "Live",       priority: "Normal" }
} as const;

const CHANNEL_META = [
  { id: "push",     emoji: "📲", label: "Push" },
  { id: "email",    emoji: "✉️", label: "Email" },
  { id: "sms",      emoji: "💬", label: "SMS" },
  { id: "whatsapp", emoji: "🟢", label: "WhatsApp" },
  { id: "inapp",    emoji: "🔔", label: "In-App" }
] as const;

const CUSTOM_OFFSET_OPTIONS = [
  { offset: -15, label: "15 minutes before" },
  { offset: -45, label: "45 minutes before" },
  { offset: -180, label: "3 hours before" },
  { offset: -360, label: "6 hours before" },
  { offset: -2880, label: "2 days before" },
  { offset: -4320, label: "3 days before" },
  { offset: 30, label: "After match ends" }
] as const;

const RECIPIENT_OPTIONS = [
  "Registered Players",
  "Team Owners",
  "All Members",
  "Admins Only",
  "Spectators",
  "Referees"
] as const;

const DEFAULT_TRIGGER_STATES: Record<string, { enabled: boolean; title: string; body: string; recipients: string[]; overrideChannels: string[]; }> = {
  "7d": {
    enabled: true,
    title: "🏏 Tournament Registration Open!",
    body: "Registration is now open for {{tournament_name}}! 🏆 Starting {{start_date}} at {{venue}}. Register before spots fill up. Tap to register now.",
    recipients: ["All Members", "Community Feed"],
    overrideChannels: ["push", "email", "whatsapp"]
  },
  "1d": {
    enabled: true,
    title: "🏆 Tournament Tomorrow!",
    body: "{{tournament_name}} begins TOMORROW at {{start_time}}! 📍 {{venue}}. Your match schedule is ready. Check your fixtures and prepare. See you on the ground! 🏅",
    recipients: ["Registered Players", "Team Owners", "Admins Only"],
    overrideChannels: []
  },
  "2h": {
    enabled: true,
    title: "⚡ 2 Hours to Kick-Off!",
    body: "⚡ {{tournament_name}} starts in 2 hours! Report at {{venue}} by {{report_time}}. Bring your kit & ID. Your first match is ready! Let's go! 🏏",
    recipients: ["Registered Players", "Team Owners", "Referees"],
    overrideChannels: []
  },
  "30m": {
    enabled: true,
    title: "🔴 30 Mins to Start — Head to Ground!",
    body: "🔴 FINAL CALL — {{tournament_name}} begins in 30 minutes! Head to {{venue}} NOW. Gate A open. Toss in 15 mins. Don't be late — matches won't be delayed! ⏱️",
    recipients: ["Registered Players", "Referees"],
    overrideChannels: ["push", "sms", "whatsapp", "inapp"]
  },
  "now": {
    enabled: true,
    title: "🏁 Tournament is LIVE Now!",
    body: "🏁 {{tournament_name}} has officially started! Follow live scores, results, and standings right here in the app. Play hard! 🏆",
    recipients: ["All Members", "Spectators", "Community Feed"],
    overrideChannels: []
  }
};

interface TriggerMeta {
  id: string;
  label: string;
  offset: number;
  emoji: string;
  tagClass: string;
  priority: string;
  isCustom: boolean;
  enabled: boolean;
  title: string;
  body: string;
  recipients: string[];
  overrideChannels: string[];
  [key: string]: any;
}

interface NotificationSetupModalProps {
  showNotificationModal: boolean;
  setShowNotificationModal: (v: boolean) => void;
  triggerStates: Record<string, { enabled: boolean; title: string; body: string; recipients: string[]; overrideChannels: string[]; priority?: string }>;
  setTriggerStates: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  customTriggers: any[];
  setCustomTriggers: React.Dispatch<React.SetStateAction<any[]>>;
  globalChannels: string[];
  setGlobalChannels: React.Dispatch<React.SetStateAction<string[]>>;
  expandedTrigger: string | null;
  setExpandedTrigger: (v: string | null) => void;
  previewTrigger: string;
  setPreviewTrigger: (v: string) => void;
  eventName: string;
  startTime: string;
  regStartDate?: Date;
  selectedVenueDetails: any;
  allTriggersToRender: TriggerMeta[];
  getCompiledPreviewBody: () => string;
  currentActiveChannels: string[];
  previewCount: number;
  previewPercentage: number;
  totalEnabledCount: number;
  totalOutputSends: number;
  toggleGlobalChannel: (channelId: string) => void;
  toggleTriggerRow: (id: string, isCustom?: boolean) => void;
  handleTriggerFieldChange: (id: string, isCustom: boolean, field: string, value: any) => void;
  toggleRecipient: (id: string, isCustom: boolean, recipient: string) => void;
  toggleTriggerChannel: (id: string, channelId: string, isCustom: boolean) => void;
  addCustomTrigger: () => void;
  removeCustomTrigger: (id: string) => void;
  getTournamentStartDateTime: () => Date | null;
  formatINRDate: (dateTimeStr: Date | string | null | undefined, offsetMinutes: number) => string;
}

export function NotificationSetupModal({
  showNotificationModal,
  setShowNotificationModal,
  triggerStates,
  setTriggerStates,
  customTriggers,
  setCustomTriggers,
  globalChannels,
  setGlobalChannels,
  expandedTrigger,
  setExpandedTrigger,
  previewTrigger,
  setPreviewTrigger,
  eventName,
  startTime,
  regStartDate,
  allTriggersToRender,
  getCompiledPreviewBody,
  currentActiveChannels,
  previewCount,
  previewPercentage,
  toggleGlobalChannel,
  toggleTriggerRow,
  handleTriggerFieldChange,
  toggleRecipient,
  toggleTriggerChannel,
  addCustomTrigger,
  removeCustomTrigger,
  getTournamentStartDateTime,
  formatINRDate,
}: NotificationSetupModalProps) {
  if (!showNotificationModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-[#141c2e] border border-[#2a3a5c] rounded-2xl w-full max-w-7xl max-h-[90vh] flex flex-col shadow-2xl text-left"
        style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.6), 0 0 40px rgba(249,115,22,0.08)" }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a3a5c] flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[#f1f5f9] flex items-center gap-2">
              📡 Notification Setup
            </h2>
            <p className="text-xs text-[#64748b] mt-0.5">
              Configure multi-channel automated triggers relative to tournament kick-off
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNotificationModal(false)}
            className="p-2 hover:bg-[#1e293b] rounded-lg text-[#94a3b8] hover:text-white transition-colors border-none bg-transparent cursor-pointer text-base"
          >
            ✕
          </button>
        </div>

        {/* Modal Body (Scrollable content) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-[#f8fafc]">
            {/* LEFT COLUMN: CONTROLS & TRIGGERS PANEL */}
            <div className="lg:col-span-2 space-y-6">

              {/* LIVE TEMPLATE CONTEXT */}
              <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#f1f5f9] mb-4 flex items-center gap-2">🏆 Live Preview Context Variables</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="flex flex-col gap-1.5 p-3 bg-[#0c1220]/60 rounded-lg border border-[#2a3a5c]/50 text-left">
                    <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Tournament Name Placeholder</span>
                    <span className="text-[#f1f5f9] font-medium truncate">{eventName.trim() || "Cricket League Season 2026"}</span>
                  </div>
                  <div className="flex flex-col gap-1.5 p-3 bg-[#0c1220]/60 rounded-lg border border-[#2a3a5c]/50 text-left">
                    <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Start Time Placeholder</span>
                    <span className="text-[#f1f5f9] font-medium truncate">
                      {regStartDate ? format(regStartDate, "dd MMM yyyy") : "25 Nov 2026"} · {startTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* DEFAULT DELIVERY CHANNELS */}
              <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#f1f5f9] mb-2 text-left">📡 Default Global Delivery Channels</h2>
                <p className="text-[10px] text-[#64748b] mb-4 font-medium text-left">Fires cross-platform unless customized per specific trigger below</p>
                <div className="flex gap-2 flex-wrap">
                  {CHANNEL_META.map(ch => {
                    const isActive = globalChannels.includes(ch.id);
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => toggleGlobalChannel(ch.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                          isActive
                            ? "border-[#f97316] text-[#f97316] bg-[#f97316]/10"
                            : "border-[#2a3a5c] bg-[#0c1220] text-[#94a3b8] hover:border-[#475569] hover:text-[#f1f5f9]"
                        }`}
                      >
                        <span>{ch.emoji}</span>
                        <span>{ch.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* INTERACTIVE RULESET ACCORDION */}
              <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#2a3a5c] flex justify-between items-center bg-[#0c1220]/40">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#f1f5f9] text-left">⚡ Execution Rules & Custom Templates</h2>
                    <p className="text-[10px] text-[#64748b] font-medium text-left mt-0.5">Toggle rules, customize messages, and add custom schedules</p>
                  </div>
                  <button
                    type="button"
                    onClick={addCustomTrigger}
                    className="px-3 py-1.5 bg-[#f97316]/10 hover:bg-[#f97316]/20 border border-[#f97316]/30 text-[#f97316] text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                  >
                    + Add Custom Rule
                  </button>
                </div>

                <div className="divide-y divide-[#2a3a5c]/50">
                  {allTriggersToRender.map(triggerMeta => {
                    const isExpanded = expandedTrigger === triggerMeta.id;
                    const isCustom = triggerMeta.isCustom;

                    return (
                      <div key={triggerMeta.id} className="transition-colors hover:bg-[#0c1220]/10">
                        {/* Accordion Trigger Header */}
                        <div className="px-5 py-3.5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <label className="relative inline-flex inline-flex items-center cursor-pointer flex-shrink-0">
                              <input
                                type="checkbox"
                                checked={triggerMeta.enabled}
                                onChange={() => toggleTriggerRow(triggerMeta.id, isCustom)}
                                className="sr-only peer"
                              />
                              <div className="w-8 h-4 rounded-full bg-[#1a2540] peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-600 relative transition-colors duration-200">
                                <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 peer-checked:translate-x-4" />
                              </div>
                            </label>

                            <div className="min-w-0 flex-1 text-left">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-[#f1f5f9] truncate">
                                  {triggerMeta.emoji} {triggerMeta.label}
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${triggerMeta.tagClass}`}>
                                  {isCustom ? "Custom Schedule" : "System Template"}
                                </span>
                                {triggerMeta.priority === 'Critical' && (
                                  <span className="text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 rounded">High Priority</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewTrigger(triggerMeta.id)}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors cursor-pointer border ${
                                previewTrigger === triggerMeta.id
                                  ? "bg-[#f97316] border-[#f97316] text-white"
                                  : "bg-[#0c1220] border-[#2a3a5c] text-[#94a3b8] hover:text-[#f1f5f9] hover:border-[#475569]"
                              }`}
                            >
                              Preview Device
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpandedTrigger(isExpanded ? null : triggerMeta.id)}
                              className="p-1 hover:bg-[#1a2540] rounded text-[#64748b] hover:text-white transition-colors cursor-pointer bg-transparent border-none text-[8px]"
                            >
                              {isExpanded ? "▲" : "▼"}
                            </button>
                          </div>
                        </div>

                        {/* Accordion Content Block */}
                        {isExpanded && (
                          <div className="px-5 pb-5 pt-1 bg-[#0c1220]/30 space-y-4 animate-in slide-in-from-top-2 duration-200 border-t border-[#2a3a5c]/20 text-left">
                            {isCustom && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider block mb-1.5">Schedule Label name</label>
                                  <input
                                    type="text"
                                    value={triggerMeta.label}
                                    onChange={e => handleTriggerFieldChange(triggerMeta.id, true, 'label', e.target.value)}
                                    className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-xs font-semibold text-[#f1f5f9] placeholder-slate-600 outline-none focus:border-[#f97316]"
                                    placeholder="e.g., Post-Match Wrapup"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider block mb-1.5">Trigger Kick-Off Offset</label>
                                  <select
                                    value={triggerMeta.offset}
                                    onChange={e => handleTriggerFieldChange(triggerMeta.id, true, 'offset', parseInt(e.target.value))}
                                    className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-xs font-semibold text-[#f97316] outline-none cursor-pointer focus:border-[#f97316]"
                                  >
                                    {CUSTOM_OFFSET_OPTIONS.map(opt => (
                                      <option key={opt.offset} value={opt.offset}>{opt.label}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider block mb-1.5">Target Recipients Group</label>
                                <div className="flex flex-wrap gap-1">
                                  {RECIPIENT_OPTIONS.map(role => {
                                    const isSelected = triggerMeta.recipients.includes(role);
                                    return (
                                      <button
                                        key={role}
                                        type="button"
                                        onClick={() => toggleRecipient(triggerMeta.id, isCustom, role)}
                                        className={`text-[9px] font-bold px-2.5 py-1 rounded transition border cursor-pointer ${
                                          isSelected
                                            ? "bg-[#f97316]/15 border-[#f97316]/30 text-[#f97316]"
                                            : "bg-[#0c1220] border-[#2a3a5c]/60 text-[#475569] hover:text-[#94a3b8]"
                                        }`}
                                      >
                                        {role}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider block mb-1.5">Override Target Delivery Channels</label>
                                <div className="flex flex-wrap gap-1">
                                  {CHANNEL_META.map(ch => {
                                    const isSelected = triggerMeta.overrideChannels.includes(ch.id);
                                    return (
                                      <button
                                        key={ch.id}
                                        type="button"
                                        onClick={() => toggleTriggerChannel(triggerMeta.id, ch.id, isCustom)}
                                        className={`text-[9px] font-bold px-2.5 py-1 rounded transition border cursor-pointer ${
                                          isSelected
                                            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                                            : "bg-[#0c1220] border-[#2a3a5c]/60 text-[#475569] hover:text-[#94a3b8]"
                                        }`}
                                      >
                                        <span>{ch.emoji}</span> {ch.label}
                                      </button>
                                    );
                                  })}
                                </div>
                                <span className="text-[8px] text-[#64748b] font-medium block mt-1">If blank, defaults to Global selection settings</span>
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider block mb-1.5">Custom Rules Priority</label>
                              <div className="flex gap-2">
                                {['Normal', 'High', 'Critical'].map(level => {
                                  const isSelected = triggerMeta.priority === level;
                                  return (
                                    <button
                                      key={level}
                                      type="button"
                                      onClick={() => {
                                        if (isCustom) handleTriggerFieldChange(triggerMeta.id, true, 'priority', level);
                                        else {
                                          setTriggerStates((prev: any) => ({
                                            ...prev,
                                            [triggerMeta.id]: { ...prev[triggerMeta.id], priority: level }
                                          }));
                                        }
                                      }}
                                      className={`flex-1 py-1.5 rounded text-[10px] font-bold transition border cursor-pointer ${
                                        isSelected
                                          ? "bg-slate-700 border-slate-600 text-white font-black"
                                          : "bg-[#0c1220] border-[#2a3a5c]/60 text-[#64748b] hover:text-[#94a3b8]"
                                      }`}
                                    >
                                      {level}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider block mb-1.5">Title Payload Header</label>
                              <input
                                type="text"
                                value={triggerMeta.title}
                                onChange={e => {
                                  if (isCustom) handleTriggerFieldChange(triggerMeta.id, true, 'title', e.target.value);
                                  else {
                                    setTriggerStates((prev: any) => ({
                                      ...prev,
                                      [triggerMeta.id]: { ...prev[triggerMeta.id], title: e.target.value }
                                    }));
                                  }
                                }}
                                className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-xs font-semibold text-[#f1f5f9] placeholder-slate-600 outline-none focus:border-[#f97316]"
                                placeholder="Rule Title"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider block mb-1.5">Markdown Text Body Content Template</label>
                              <textarea
                                value={triggerMeta.body}
                                onChange={e => {
                                  if (isCustom) handleTriggerFieldChange(triggerMeta.id, true, 'body', e.target.value);
                                  else {
                                    setTriggerStates((prev: any) => ({
                                      ...prev,
                                      [triggerMeta.id]: { ...prev[triggerMeta.id], body: e.target.value }
                                    }));
                                  }
                                }}
                                rows={3}
                                className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2 text-xs font-semibold text-[#f1f5f9] placeholder-slate-600 outline-none focus:border-[#f97316] resize-y font-sans leading-relaxed"
                                placeholder="Template Content Details"
                              />
                            </div>

                            {isCustom && (
                              <div className="flex justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={() => removeCustomTrigger(triggerMeta.id)}
                                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                                >
                                  Delete Trigger Rule
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: REALTIME HIGH-FIDELITY DEVICE PREVIEWS & AUDIENCE STATS */}
            <div className="space-y-6">

              <div className="bg-[#141c2e] border border-[#2a3a5c] rounded-xl p-5 space-y-5 shadow-xl">
                <div className="flex justify-between items-center border-b border-[#2a3a5c]/50 pb-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#f1f5f9] flex items-center gap-2">👁️ Mock Device Preview</h2>
                  <select
                    className="bg-[#0c1220] border border-[#2a3a5c] rounded-lg p-1.5 text-[10px] font-bold text-[#f97316] outline-none cursor-pointer"
                    value={previewTrigger}
                    onChange={e => setPreviewTrigger(e.target.value)}
                  >
                    <option value="7d">7 Days Prior</option>
                    <option value="1d">1 Day Prior</option>
                    <option value="2h">2 Hours Prior</option>
                    <option value="30m">30 Mins Prior</option>
                    <option value="now">On Start</option>
                    {customTriggers.map(ct => (
                      <option key={ct.id} value={ct.id}>{ct.label}</option>
                    ))}
                  </select>
                </div>

                {/* HIGH FIDELITY DEVICE OVERLAY MOCKUP */}
                <div className="bg-black rounded-3xl p-4 border-4 border-zinc-800 shadow-2xl">
                  <div className="flex justify-between text-[9px] text-[#475569] font-bold tracking-tight mb-3 px-2">
                    <span>9:41 AM</span>
                    <span className="text-emerald-500 font-mono">● CommuniSync Core</span>
                  </div>
                  <div className="bg-[#1c1c1e] rounded-xl p-3 flex gap-3 items-start border border-[#2a3a5c]/40">
                    <div className="w-7 h-7 bg-gradient-to-br from-violet-600 to-[#f97316] rounded-lg flex items-center justify-center text-sm flex-shrink-0 shadow-md">
                      {previewTrigger.startsWith('custom_') ? '✨' : DEFAULT_TRIGGERS[previewTrigger as keyof typeof DEFAULT_TRIGGERS]?.emoji}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <span className="text-[9px] text-[#475569] font-bold uppercase tracking-wider block">COMMUNISYNC SPORTS</span>
                      <h4 className="text-xs font-bold text-white mt-0.5 leading-snug truncate">
                        {previewTrigger.startsWith('custom_')
                          ? (customTriggers.find(t => t.id === previewTrigger)?.title || 'Custom Title')
                          : triggerStates[previewTrigger]?.title}
                      </h4>
                      <p className="text-[11px] text-[#94a3b8] mt-1 leading-relaxed break-words">
                        {getCompiledPreviewBody()}
                      </p>
                      <span className="text-[9px] text-zinc-600 block mt-2 font-medium">Just now</span>
                    </div>
                  </div>
                </div>

                {/* ACTIVE ROUTING DELIVERY TIMELINE VERTICAL STREAM */}
                <div>
                  <h3 className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-3 text-left">Live Processing Timeline Queue</h3>
                  <div className="space-y-3.5 pl-1 border-l border-[#2a3a5c] ml-1.5 text-left">
                    {[...allTriggersToRender].sort((a, b) => a.offset - b.offset).map(t => {
                      const isActive = t.enabled;
                      return (
                        <div key={t.id} className="flex gap-3 items-start relative">
                          <span className={`w-2.5 h-2.5 rounded-full absolute -left-[19.5px] top-1 border border-[#0c1220] z-10 ${
                            isActive
                              ? (t.isCustom ? 'bg-violet-500 shadow-[0_0_8px_#8b5cf6]' : 'bg-[#f97316] shadow-[0_0_8px_#f97316]')
                              : 'bg-[#475569]'
                          }`} />
                          <div className="flex-1 min-w-0 leading-none">
                            <span className={`text-xs font-bold block ${isActive ? 'text-[#f1f5f9]' : 'text-[#475569]'}`}>{t.label}</span>
                            <span className="text-[9px] text-[#64748b] font-mono mt-1 block">
                              {formatINRDate(getTournamentStartDateTime(), t.offset).split('·')[0]}
                            </span>
                          </div>
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#141c2e] text-[#475569]'}`}>
                            {isActive ? 'Active' : 'Muted'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CHANNELS ACTIVE ON PREVIEW CARD MATRICES */}
                <div className="pt-3 border-t border-[#2a3a5c]/50 text-left">
                  <h3 className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-2">Active Channels For Selection</h3>
                  <div className="flex gap-1.5 flex-wrap">
                    {currentActiveChannels.map((chId: string) => {
                      const data = CHANNEL_META.find(c => c.id === chId);
                      return (
                        <span key={chId} className="bg-[#f97316]/10 text-[#f97316] text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#f97316]/20 shadow-inner flex items-center gap-1">
                          <span>{data?.emoji}</span> {data?.label}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* ESTIMATED RECIPIENTS SECTION */}
                <div className="pt-3 border-t border-[#2a3a5c]/50 flex justify-between items-center text-left">
                  <div>
                    <h3 className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Estimated Audience</h3>
                    <div className="text-2xl font-bold text-[#f97316] mt-1">{previewCount}</div>
                    <span className="text-[9px] text-[#64748b] font-semibold">Across Selected Recipient Matrix Groups</span>
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-[#2a3a5c]/50 flex items-center justify-center relative bg-[#0c1220]">
                    <span className="text-xs font-bold text-teal-400">{previewPercentage}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#2a3a5c] bg-[#0c1220]/40 flex-shrink-0 rounded-b-2xl">
          <button
            type="button"
            onClick={() => {
              setGlobalChannels(["push", "email"]);
              setPreviewTrigger("2h");
              setExpandedTrigger(null);
              setCustomTriggers([]);
              setTriggerStates(DEFAULT_TRIGGER_STATES);
              toast.success("Notification configurations reset to system defaults!");
            }}
            className="px-4 py-2 bg-transparent hover:bg-red-500/10 border border-red-500/30 hover:border-red-500 text-red-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>↺</span> Reset
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowNotificationModal(false)}
              className="px-4 py-2 bg-transparent border border-[#2a3a5c] hover:border-[#475569] text-[#94a3b8] hover:text-[#f1f5f9] text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNotificationModal(false);
                toast.success("Notification configurations applied successfully!");
              }}
              className="px-5 py-2 bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer border-none flex items-center gap-1.5"
            >
              <span>💾</span> Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
