import { useState } from "react";
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Printer,
  Download,
  Trophy,
  Sparkles,
} from "lucide-react";
import { showSuccess, showError } from "../../../../utils/ToastUtils";

interface ShareTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: {
    id: number;
    name: string;
    sportsEvents?: any[];
    eventDateStart?: string;
    eventDateEnd?: string;
    description?: string;
  };
}

export function ShareTournamentModal({
  isOpen,
  onClose,
  tournament,
}: ShareTournamentModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<"LINKS" | "QR" | "TEMPLATE">("LINKS");

  if (!isOpen || !tournament) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://hub.manacommunity.com";
  const multiRegisterUrl = `${origin}/sports/register-tournament/${tournament.id}`;

  const sportsList = tournament.sportsEvents && tournament.sportsEvents.length > 0
    ? tournament.sportsEvents.map((ev: any) => `• ${ev.name || "Sport"}`).join("\n")
    : "• Multiple sports events";

  const dateRange = tournament.eventDateStart && tournament.eventDateEnd
    ? `${tournament.eventDateStart} — ${tournament.eventDateEnd}`
    : "Upcoming Tournament";

  const shareText = `🏆 *Registration Open: ${tournament.name}*\n\n` +
    `📅 *Dates:* ${dateRange}\n\n` +
    `🏅 *Sports Included in this Tournament:*\n${sportsList}\n\n` +
    `Register for one or multiple sports in a single unified form here:\n` +
    `👉 ${multiRegisterUrl}\n\n` +
    `_Managed securely via Mana Community Hub._`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(multiRegisterUrl);
      setCopiedLink(true);
      showSuccess("Multi-sport registration link copied!");
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      showError("Failed to copy link");
    }
  };

  const copyFormattedMessage = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedMessage(true);
      showSuccess("Invitation message copied to clipboard!");
      setTimeout(() => setCopiedMessage(false), 2500);
    } catch {
      showError("Failed to copy message");
    }
  };

  const shareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareEmail = () => {
    const subject = encodeURIComponent(`Registration Open: ${tournament.name} (Multi-Sport Registration)`);
    const body = encodeURIComponent(
      `Hello Residents & Athletes,\n\nRegistrations are officially open for ${tournament.name}.\n\nDates: ${dateRange}\n\nSports Included:\n${sportsList}\n\nYou can register for one or multiple sports in a single form using the link below:\n${multiRegisterUrl}\n\nBest regards,\nSports Committee`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=15&data=${encodeURIComponent(multiRegisterUrl)}`;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const sportsHtml = tournament.sportsEvents && tournament.sportsEvents.length > 0
      ? tournament.sportsEvents.map((ev: any) => `<li><strong>${ev.name}</strong></li>`).join("")
      : "<li>Multiple Sports & Activities</li>";

    printWindow.document.write(`
      <html>
        <head>
          <title>${tournament.name} - Multi-Sport Registration Flyer</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 40px; color: #1e293b; max-width: 650px; margin: auto; }
            h1 { font-size: 30px; margin-bottom: 6px; color: #0f172a; }
            p { font-size: 15px; margin: 4px 0; color: #475569; }
            .badge { display: inline-block; padding: 6px 16px; background: #ede9fe; color: #6d28d9; border-radius: 9999px; font-weight: bold; font-size: 13px; margin-bottom: 12px; }
            .sports-box { text-align: left; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 24px; margin: 20px 0; }
            .sports-box h3 { margin-top: 0; font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; }
            .sports-box ul { margin: 8px 0 0 0; padding-left: 20px; font-size: 14px; color: #334155; line-height: 1.6; }
            .qr-box { margin: 16px auto; padding: 16px; display: inline-block; border: 2px solid #e2e8f0; border-radius: 16px; background: #ffffff; }
            .instructions { font-size: 15px; font-weight: 600; color: #1e293b; margin-top: 10px; }
            .url { font-family: monospace; font-size: 12px; color: #64748b; margin-top: 12px; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="badge">Annual Community Sports Tournament</div>
          <h1>${tournament.name}</h1>
          <p><strong>Tournament Dates:</strong> ${dateRange}</p>

          <div class="sports-box">
            <h3>Sports Included in this Single Form:</h3>
            <ul>${sportsHtml}</ul>
          </div>

          <div class="qr-box">
            <img src="${qrImageUrl}" alt="Multi-Sport QR Code" width="240" height="240" />
          </div>
          <div class="instructions">Scan QR Code on your mobile phone to register for all sports</div>
          <div class="url">${multiRegisterUrl}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-700/80 flex items-center justify-between bg-slate-800/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Share Tournament Registration</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Single unified form for all {tournament.sportsEvents?.length || ""} sports
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sports summary chips */}
        {tournament.sportsEvents && tournament.sportsEvents.length > 0 && (
          <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-700/60 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium flex-shrink-0">
              Includes:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {tournament.sportsEvents.map((ev: any) => (
                <span
                  key={ev.id}
                  className="px-2 py-0.5 rounded-md bg-purple-950/50 text-purple-300 border border-purple-800/40 text-[11px] font-medium"
                >
                  {ev.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="px-6 pt-4 border-b border-slate-700/60 bg-slate-800/40">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("LINKS")}
              className={`pb-3 px-3 text-xs font-medium border-b-2 transition ${
                activeTab === "LINKS"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              1-Click Share
            </button>
            <button
              onClick={() => setActiveTab("QR")}
              className={`pb-3 px-3 text-xs font-medium border-b-2 transition ${
                activeTab === "QR"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Tournament QR Flyer
            </button>
            <button
              onClick={() => setActiveTab("TEMPLATE")}
              className={`pb-3 px-3 text-xs font-medium border-b-2 transition ${
                activeTab === "TEMPLATE"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              WhatsApp Text
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          {activeTab === "LINKS" && (
            <div className="space-y-5">
              {/* Single Multi-Sport Registration Link */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Complete Tournament Registration Link (All Sports)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={multiRegisterUrl}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none"
                  />
                  <button
                    onClick={copyLink}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition flex-shrink-0 shadow-md shadow-blue-500/20"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedLink ? "Copied" : "Copy"}
                  </button>
                  <a
                    href={multiRegisterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition flex-shrink-0"
                    title="Open multi-sport form"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-400">
                  Participants can select multiple sports, pick partners, and register themselves or their family members in one go.
                </p>
              </div>

              {/* Instant Social Channels */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Broadcast Direct To
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* WhatsApp */}
                  <button
                    onClick={shareWhatsApp}
                    className="p-3.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 transition text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-sm">
                      💬
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-emerald-200">WhatsApp Broadcast</div>
                      <div className="text-[11px] text-emerald-400/80">Resident & sports groups</div>
                    </div>
                  </button>

                  {/* Email */}
                  <button
                    onClick={shareEmail}
                    className="p-3.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-300 flex items-center gap-3 transition text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                      ✉️
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-blue-200">Email Invitation</div>
                      <div className="text-[11px] text-blue-400/80">Send via email client</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Tip box */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs text-slate-400 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  Residents opening this link see all events in <strong>{tournament.name}</strong> on a single page, with automated category filtering based on age & gender.
                </div>
              </div>
            </div>
          )}

          {activeTab === "QR" && (
            <div className="space-y-5 text-center">
              <div className="p-4 bg-white rounded-2xl inline-block shadow-lg mx-auto border-4 border-slate-100">
                <img
                  src={qrImageUrl}
                  alt="Multi-Sport QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">Scan for All Sports</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  One QR code for the entire tournament. Print and place at clubhouse, lifts, and cafeteria noticeboards.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition shadow-md shadow-purple-600/20"
                >
                  <Printer className="w-4 h-4" />
                  Print Tournament Flyer
                </button>
                <a
                  href={qrImageUrl}
                  download={`${tournament.name}-registration-qr.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4" />
                  Save QR Image
                </a>
              </div>
            </div>
          )}

          {activeTab === "TEMPLATE" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Ready-to-Paste WhatsApp Announcement
                </label>
                <button
                  onClick={copyFormattedMessage}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition"
                >
                  {copiedMessage ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedMessage ? "Copied" : "Copy Message"}
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed select-all max-h-64 overflow-y-auto">
                {shareText}
              </pre>

              <p className="text-[11px] text-slate-400">
                Tip: Paste this into your community WhatsApp broadcast list or telegram channel.
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-3 border-t border-slate-700/80">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
