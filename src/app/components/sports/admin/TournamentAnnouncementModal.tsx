import { useState, useEffect } from "react";
import {
  Loader2, Mail, Bell, X, Send, FileText,
  Megaphone, Eye, ChevronDown
} from "lucide-react";
import { emailAdminService } from "../../../../services/emailAdminService";
import { sportsService } from "../../../../services/sportsService";

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
    key: "TOURNAMENT_ANNOUNCEMENT",
    label: "Announcement",
    description: "General update or details",
    icon: "📢",
    color: "violet",
  },
  {
    key: "TOURNAMENT_OPEN",
    label: "Opening",
    description: "Registrations are now open",
    icon: "🏆",
    color: "emerald",
  },
  {
    key: "TOURNAMENT_START",
    label: "Start",
    description: "Matches are starting now",
    icon: "🏁",
    color: "indigo",
  },
] as const;

const COLOR_MAP: Record<string, { border: string; bg: string; text: string; ring: string }> = {
  emerald: { border: "border-emerald-300", bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-500" },
  violet:  { border: "border-violet-300",  bg: "bg-violet-50",  text: "text-violet-700",  ring: "ring-violet-500"  },
  indigo:  { border: "border-indigo-300",  bg: "bg-indigo-50",  text: "text-indigo-700",  ring: "ring-indigo-500"  },
};

export function TournamentAnnouncementModal({ tournament, onConfirm, onClose }: Props) {
  const [template, setTemplate] = useState("TOURNAMENT_ANNOUNCEMENT");
  const [subject, setSubject] = useState(`Tournament announcement — ${tournament.name}`);
  const [message, setMessage] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendPush, setSendPush] = useState(true);
  const [useCustomHtml, setUseCustomHtml] = useState(false);
  const [customHtml, setCustomHtml] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // Real tournament details from database
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    async function fetchTournamentDetails() {
      if (!tournament?.id) return;
      try {
        const res = await sportsService.getTournamentById(tournament.id);
        setDetails(res);
      } catch (err) {
        console.warn("Could not load full tournament details for email preview:", err);
      }
    }
    fetchTournamentDetails();
  }, [tournament?.id]);

  const handleTemplateChange = (key: string) => {
    setTemplate(key);
    if (key === "TOURNAMENT_OPEN") {
      setSubject(`Registration is now open — ${tournament.name}`);
      setMessage(`Registration for ${tournament.name} is now open! Sign up now to secure your spot.`);
    } else if (key === "TOURNAMENT_START") {
      setSubject(`Tournament matches are starting! — ${tournament.name}`);
      setMessage(`The matches for ${tournament.name} are starting! Check the schedule and join us to cheer.`);
    } else {
      setSubject(`Tournament announcement — ${tournament.name}`);
      setMessage("");
    }
    setPreviewHtml(null);
  };

  const buildVars = (d: any) => {
    const tourName = d?.name || tournament.name;
    const desc = message.trim() || d?.description || "Join us for an exciting community sports event!";

    const fmt = (dateStr?: string | null) => {
      if (!dateStr) return "";
      try {
        const dateObj = new Date(dateStr);
        if (isNaN(dateObj.getTime())) return dateStr;
        return dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      } catch {
        return dateStr;
      }
    };

    // Extract real sub-events linked to tournament
    const mappedSportsEvents = Array.isArray(d?.sportsEvents) && d.sportsEvents.length > 0
      ? d.sportsEvents.map((se: any) => {
          const sName = se.sport?.name || se.sportName || se.name || "Sport";
          const eName = se.eventName || se.name || sName;
          
          let icon = "🏅";
          const lower = sName.toLowerCase();
          if (lower.includes("badminton")) icon = "🏸";
          else if (lower.includes("cricket")) icon = "🏏";
          else if (lower.includes("football") || lower.includes("soccer")) icon = "⚽";
          else if (lower.includes("tennis") && !lower.includes("table")) icon = "🎾";
          else if (lower.includes("table tennis") || lower.includes("ping")) icon = "🏓";
          else if (lower.includes("chess")) icon = "♟️";
          else if (lower.includes("basket")) icon = "🏀";
          else if (lower.includes("volley")) icon = "🏐";
          else if (lower.includes("swim")) icon = "🏊";
          else if (lower.includes("run") || lower.includes("athletic")) icon = "🏃";

          const genderLabel = se.gender ? (se.gender === "MALE" ? "Men's" : se.gender === "FEMALE" ? "Women's" : se.gender) : "All Categories";
          const ageLabel = se.minAge && se.maxAge ? `${se.minAge}–${se.maxAge} Yrs` : (se.ageRange || "Open Category");

          return {
            sportName: sName,
            eventName: eName,
            icon: icon,
            gender: genderLabel,
            ageRange: ageLabel,
          };
        })
      : null;

    // Calculate "Sports Included" list dynamically from events
    let sportsList = "";
    if (mappedSportsEvents && mappedSportsEvents.length > 0) {
      sportsList = Array.from(new Set(mappedSportsEvents.map((se: any) => se.sportName || se.eventName))).join(", ");
    } else if (d?.sportName) {
      sportsList = d.sportName;
    }
    if (!sportsList) sportsList = "Badminton, Table Tennis, Football";

    const venue = d?.venueName || d?.venue?.name || "Community Sports Arena";
    const regStart = fmt(d?.registrationDateStart);
    const regEnd = fmt(d?.registrationDateEnd);
    const regPeriod = regStart && regEnd ? `${regStart} — ${regEnd}` : (regStart || regEnd || "Registration Open Now");

    const evtStart = fmt(d?.eventDateStart);
    const evtEnd = fmt(d?.eventDateEnd);
    const evtDates = evtStart && evtEnd ? `${evtStart} — ${evtEnd}` : (evtStart || evtEnd || "Upcoming");

    const cName = d?.contactName || "Sports Committee";
    const cPhone = d?.contactNumber || "";
    const cEmail = d?.contactEmail || "";
    let cDetails = cName;
    if (cEmail) cDetails += ` (${cEmail})`;
    if (cPhone) cDetails += ` - ${cPhone}`;

    return {
      tournamentName: tourName,
      subject: subject.trim() || `Sports Event Announcement — ${tourName}`,
      customMessage: message.trim() || desc,
      description: desc,
      sportName: sportsList,
      sportsEvents: mappedSportsEvents,
      registrationPeriod: regPeriod,
      eventDates: evtDates,
      eventDate: evtStart || "Upcoming",
      openingTime: evtStart ? `${evtStart} ${d?.startTime || "09:00 AM"}` : "Opening Soon",
      venueName: venue,
      contactName: cName,
      contactNumber: cPhone,
      contactEmail: cEmail,
      contactDetails: cDetails,
      actionUrl: window.location.origin + "/sports",
      bannerImage: d?.bannerImage || "",
    };
  };

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      if (useCustomHtml && customHtml.trim()) {
        setPreviewHtml(customHtml);
      } else {
        let currentDetails = details;
        if (!currentDetails && tournament?.id) {
          try {
            currentDetails = await sportsService.getTournamentById(tournament.id);
            setDetails(currentDetails);
          } catch {
            // fallback
          }
        }
        const customVars = buildVars(currentDetails);
        const html = await emailAdminService.getPreviewHtml(template, customVars);
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
      <div className="relative bg-white border border-slate-200 rounded-2xl w-full md:max-w-2xl lg:max-w-[50vw] shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
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
            <div className="grid grid-cols-3 gap-2">
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

          {/* Unified Controls & Actions Panel (Single DIV Container) */}
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-sm">
            <label className="text-[11px] text-slate-500 uppercase tracking-widest font-extrabold block">
              Channels & Preview Options
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Button 1: Email Channel */}
              <ChannelToggle
                icon={<Mail className="w-4 h-4" />}
                label="Email"
                sub="HTML template email to all community members"
                checked={sendEmail}
                onChange={setSendEmail}
                color="blue"
                disabled={submitting}
              />

              {/* Button 2: In-App Notification Channel */}
              <ChannelToggle
                icon={<Bell className="w-4 h-4" />}
                label="In-App Notification"
                sub="Push notification in the notification bell"
                checked={sendPush}
                onChange={setSendPush}
                color="amber"
                disabled={submitting}
              />

              {/* Button 3: Custom HTML Template Toggle */}
              <button
                type="button"
                onClick={() => setUseCustomHtml(!useCustomHtml)}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                  useCustomHtml
                    ? "bg-slate-900 border-slate-800 text-white shadow-sm ring-2 ring-slate-400/20"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg shrink-0 ${useCustomHtml ? "bg-slate-800 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="font-bold text-xs truncate">Use Custom HTML Template</div>
                    <div className={`text-[10px] truncate mt-0.5 ${useCustomHtml ? "text-slate-400" : "text-slate-400"}`}>
                      Override layout with raw HTML markup
                    </div>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 shrink-0 ml-2 transition-transform duration-200 ${useCustomHtml ? "rotate-180 text-white" : "text-slate-400"}`} />
              </button>

              {/* Button 4: Preview Template Action */}
              <button
                type="button"
                onClick={handlePreview}
                disabled={previewing || submitting}
                className="flex items-center justify-between p-3 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-white/20 text-white shrink-0">
                    {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="font-extrabold text-xs">Preview Template</div>
                    <div className="text-[10px] text-indigo-100/80 truncate mt-0.5">
                      Renders live database details
                    </div>
                  </div>
                </div>
                <Eye className="w-4 h-4 text-white/80 shrink-0 ml-2" />
              </button>
            </div>

            {/* Custom HTML Textarea if active */}
            {useCustomHtml && (
              <div className="pt-2 animate-in fade-in zoom-in-95 duration-200">
                <textarea
                  value={customHtml}
                  onChange={(e) => setCustomHtml(e.target.value)}
                  rows={6}
                  disabled={submitting}
                  placeholder="Paste your custom HTML email template here..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-xs font-mono text-indigo-200 placeholder-slate-500 focus:border-indigo-400 outline-none resize-none transition-colors disabled:opacity-50"
                />
              </div>
            )}
          </div>

          {/* Live Email Preview Frame */}
          {previewHtml && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Header Bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-b border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400/90 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/90 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/90 inline-block" />
                  </div>
                  <div className="h-3.5 w-[1px] bg-slate-700 mx-1" />
                  <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[11px] font-extrabold tracking-wide uppercase text-slate-200">
                      Live Email Preview
                    </span>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-black text-emerald-300 tracking-wider uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Data Applied
                  </span>
                </div>
                <button
                  onClick={() => setPreviewHtml(null)}
                  className="p-1 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Close Preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {details?.name && (
                <div className="px-4 py-2 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between text-[11px] font-semibold text-indigo-900">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="font-extrabold text-indigo-700">Tournament:</span> {details.name}
                  </span>
                  {details.venueName && (
                    <span className="text-indigo-600/80 font-bold shrink-0 ml-2">
                      📍 {details.venueName}
                    </span>
                  )}
                </div>
              )}

              <iframe
                srcDoc={previewHtml}
                className="w-full h-80 border-none bg-slate-50"
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
