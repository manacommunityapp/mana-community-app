import { useState } from "react";
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Download,
  Printer,
  FileText,
  Sparkles,
} from "lucide-react";
import type { ExternalFormConfig } from "../../../../../services/sports/sportsExternalFormService";
import { showSuccess, showError } from "../../../../../utils/ToastUtils";

interface ShareExternalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: ExternalFormConfig;
  event: any;
}

export function ShareExternalFormModal({
  isOpen,
  onClose,
  form,
  event,
}: ShareExternalFormModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<"LINKS" | "QR" | "TEMPLATE">("LINKS");

  if (!isOpen || !form) return null;

  const eventName = event?.name || event?.title || form.eventName || "Sports Tournament";
  const venue = event?.venue?.name || event?.venue || "Community Sports Complex";
  const dateStr = event?.eventDateStart ? new Date(event.eventDateStart).toLocaleDateString() : "Upcoming";

  const shareText = `🏆 *Tournament Registration Open: ${eventName}*\n\n` +
    `📅 *Date:* ${dateStr}\n` +
    `📍 *Venue:* ${venue}\n\n` +
    `Sign up now using the registration link below:\n` +
    `👉 ${form.responderUrl}\n\n` +
    `_Managed securely via Mana Community Hub._`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(form.responderUrl);
      setCopiedLink(true);
      showSuccess("Link copied to clipboard!");
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
    const subject = encodeURIComponent(`Registration Open: ${eventName}`);
    const body = encodeURIComponent(
      `Hello,\n\nRegistrations are now open for ${eventName}.\n\nDate: ${dateStr}\nVenue: ${venue}\n\nPlease register using this link:\n${form.responderUrl}\n\nBest regards,\nSports Committee`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=15&data=${encodeURIComponent(form.responderUrl)}`;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${eventName} - Registration QR Code</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; color: #1e293b; }
            h1 { font-size: 28px; margin-bottom: 8px; color: #0f172a; }
            p { font-size: 16px; margin: 4px 0; color: #475569; }
            .badge { display: inline-block; padding: 6px 14px; background: #e0f2fe; color: #0369a1; border-radius: 9999px; font-weight: bold; margin: 16px 0; }
            .qr-box { margin: 24px auto; padding: 16px; display: inline-block; border: 2px solid #e2e8f0; border-radius: 16px; }
            .url { font-family: monospace; font-size: 13px; color: #64748b; margin-top: 16px; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="badge">Official Sports Registration</div>
          <h1>${eventName}</h1>
          <p><strong>Venue:</strong> ${venue} &bull; <strong>Date:</strong> ${dateStr}</p>
          <div class="qr-box">
            <img src="${qrImageUrl}" alt="Registration QR Code" width="260" height="260" />
          </div>
          <p><strong>Scan QR Code on your mobile phone to register</strong></p>
          <div class="url">${form.responderUrl}</div>
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
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Share Registration Form</h3>
              <p className="text-xs text-slate-400 mt-0.5">{eventName} • Public Responder Link</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
              QR Code Flyer
            </button>
            <button
              onClick={() => setActiveTab("TEMPLATE")}
              className={`pb-3 px-3 text-xs font-medium border-b-2 transition ${
                activeTab === "TEMPLATE"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Announcement Text
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          {activeTab === "LINKS" && (
            <div className="space-y-5">
              {/* Public URL Box */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Public Registration Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={form.responderUrl}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none"
                  />
                  <button
                    onClick={copyLink}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition flex-shrink-0"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedLink ? "Copied" : "Copy"}
                  </button>
                  <a
                    href={form.responderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition flex-shrink-0"
                    title="Open form"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Instant Social Channels */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Share Directly To
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* WhatsApp */}
                  <button
                    onClick={shareWhatsApp}
                    className="p-3 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 transition text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-sm">
                      💬
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-emerald-200">WhatsApp</div>
                      <div className="text-[11px] text-emerald-400/80">Resident & tower groups</div>
                    </div>
                  </button>

                  {/* Email */}
                  <button
                    onClick={shareEmail}
                    className="p-3 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-300 flex items-center gap-3 transition text-left"
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

              {/* Hint */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs text-slate-400 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  Anyone who submits this link will automatically appear in your sports registrations table. Ineligible entries are automatically quarantined for your review.
                </div>
              </div>
            </div>
          )}

          {activeTab === "QR" && (
            <div className="space-y-5 text-center">
              <div className="p-4 bg-white rounded-2xl inline-block shadow-lg mx-auto border-4 border-slate-100">
                <img
                  src={qrImageUrl}
                  alt="Registration QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">Scan to Register</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Print and post this QR code at community clubhouses, lifts, and sports grounds.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Printer className="w-4 h-4" />
                  Print Notice Flyer
                </button>
                <a
                  href={qrImageUrl}
                  download={`${eventName}-registration-qr.png`}
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
                  Community Notice / Announcement Message
                </label>
                <button
                  onClick={copyFormattedMessage}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition"
                >
                  {copiedMessage ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedMessage ? "Copied" : "Copy Message"}
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed select-all">
                {shareText}
              </pre>

              <p className="text-[11px] text-slate-400">
                Tip: Paste this formatted text into your resident WhatsApp announcement groups or community board notices.
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
