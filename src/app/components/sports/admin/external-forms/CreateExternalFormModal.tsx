import React, { useState } from "react";
import { X, CheckCircle, Copy, ExternalLink, Code, Sparkles, Check, AlertCircle } from "lucide-react";
import { sportsExternalFormService, type ExternalFormConfig } from "../../../../../services/sports/sportsExternalFormService";
import { showSuccess, showError } from "../../../../../utils/ToastUtils";

interface CreateExternalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  onFormCreated: (form: ExternalFormConfig) => void;
}

const AVAILABLE_FIELDS = [
  { key: "playerName", label: "Full Name", required: true, defaultSelected: true },
  { key: "phone", label: "Phone Number / WhatsApp", required: true, defaultSelected: true },
  { key: "email", label: "Email Address", required: false, defaultSelected: true },
  { key: "flatNumber", label: "Flat / Apartment Number", required: false, defaultSelected: true },
  { key: "age", label: "Age / Date of Birth", required: false, defaultSelected: true },
  { key: "gender", label: "Gender", required: false, defaultSelected: true },
  { key: "categoryId", label: "Tournament Category", required: false, defaultSelected: true },
  { key: "matchFormat", label: "Match Format (Singles/Doubles)", required: false, defaultSelected: true },
  { key: "partnerName", label: "Doubles Partner Name", required: false, defaultSelected: true },
  { key: "partnerPhone", label: "Doubles Partner Phone", required: false, defaultSelected: true },
  { key: "cricheroesUrl", label: "CricHeroes Profile Link", required: false, defaultSelected: false },
];

export function CreateExternalFormModal({
  isOpen,
  onClose,
  event,
  onFormCreated,
}: CreateExternalFormModalProps) {
  const [provider, setProvider] = useState<"GOOGLE_FORMS" | "MANA_FORM">("GOOGLE_FORMS");
  const [title, setTitle] = useState(`${event?.name || event?.title || "Tournament"} - Registration`);
  const [description, setDescription] = useState(
    `Official external registration form for ${event?.name || event?.title || "the tournament"}. Responses are directly imported and verified in Mana Community Hub.`
  );
  const [approvalMode, setApprovalMode] = useState<"TOURNAMENT_DEFAULT" | "AUTO" | "MANUAL">("TOURNAMENT_DEFAULT");
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>(
    AVAILABLE_FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: f.defaultSelected }), {})
  );
  const [googleAccessToken, setGoogleAccessToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdForm, setCreatedForm] = useState<ExternalFormConfig | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const toggleField = (key: string) => {
    if (key === "playerName" || key === "phone") return; // mandatory
    setSelectedFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event?.id) {
      showError("Event ID is missing");
      return;
    }

    const fieldKeys = Object.entries(selectedFields)
      .filter(([_, isSelected]) => isSelected)
      .map(([key]) => key);

    setLoading(true);
    try {
      const created = await sportsExternalFormService.createForm(event.id, {
        provider,
        title,
        description,
        approvalMode,
        fieldKeys,
        googleAccessToken: googleAccessToken.trim() || undefined,
      });
      setCreatedForm(created);
      onFormCreated(created);
      showSuccess(provider === "GOOGLE_FORMS" ? "Google Form created successfully!" : "Mana Public Form link generated!");
    } catch (err: any) {
      showError(err?.message || "Failed to create external form");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(true);
      showSuccess("Link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      showError("Could not copy link");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-700/80 flex items-center justify-between bg-slate-800/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Create External Registration Form</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {event?.name || event?.title} • Automated response synchronization
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

        {/* Created Success Screen */}
        {createdForm ? (
          <div className="p-6 space-y-6">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-emerald-300">External Form Ready!</h4>
                <p className="text-xs text-emerald-200/80 mt-1">
                  Share the link below with participants. Incoming entries will be validated against tournament capacity, age & gender limits, and staged in your sports dashboard.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                Public Responder Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdForm.responderUrl}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(createdForm.responderUrl)}
                  className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition flex-shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedLink ? "Copied" : "Copy"}
                </button>
                <a
                  href={createdForm.responderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1 transition flex-shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open
                </a>
              </div>
            </div>

            {createdForm.provider === "GOOGLE_FORMS" && (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                  <Code className="w-4 h-4" />
                  Instant Google Form Webhook Auto-Sync
                </div>
                <p className="text-xs text-slate-400">
                  To stream responses directly into Mana the second someone submits Google Forms, use the pre-configured Apps Script snippet.
                </p>
                <div className="text-xs text-slate-500 font-mono break-all bg-slate-950 p-2 rounded-lg border border-slate-800">
                  Webhook URL: {createdForm.webhookUrl}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-700/80">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form Setup Screen */
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Provider Switcher */}
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                Registration Form Provider
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProvider("GOOGLE_FORMS")}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition ${
                    provider === "GOOGLE_FORMS"
                      ? "bg-blue-600/10 border-blue-500 text-white"
                      : "bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${provider === "GOOGLE_FORMS" ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400"}`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">Google Forms</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Familiar Google Forms responder link with auto-sync webhook.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider("MANA_FORM")}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition ${
                    provider === "MANA_FORM"
                      ? "bg-blue-600/10 border-blue-500 text-white"
                      : "bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${provider === "MANA_FORM" ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400"}`}>
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">Mana Public Form</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Hosted branded form with real-time field validation.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                  Form Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/70 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Badminton Tournament Registration"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                  Form Description / Instructions
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900/70 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Event guidelines, dates, and instructions for participants..."
                />
              </div>
            </div>

            {/* Approval Mode */}
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                Registration Ingestion & Approval Workflow
              </label>
              <select
                value={approvalMode}
                onChange={e => setApprovalMode(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/70 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="TOURNAMENT_DEFAULT">Tournament Default (Matches tournament approval setting)</option>
                <option value="AUTO">Auto-Confirm (Valid community entries are confirmed immediately)</option>
                <option value="MANUAL">Manual Review (All external entries require organizer confirmation)</option>
              </select>
              <p className="text-xs text-slate-400 mt-1">
                Invalid age, over-capacity, or duplicate entries always route to the Review Queue regardless of setting.
              </p>
            </div>

            {/* Field Selection Checklist */}
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                Included Registration Questions
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {AVAILABLE_FIELDS.map(f => {
                  const isChecked = selectedFields[f.key];
                  const isDisabled = f.required;
                  return (
                    <label
                      key={f.key}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                        isChecked
                          ? "bg-slate-900/80 border-slate-600 text-slate-200"
                          : "bg-slate-900/30 border-slate-800 text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isDisabled}
                        onChange={() => toggleField(f.key)}
                        className="rounded border-slate-700 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                      />
                      <span className="truncate">
                        {f.label} {f.required && <span className="text-red-400 text-xs">*</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Optional OAuth token note */}
            {provider === "GOOGLE_FORMS" && (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-start gap-2.5 text-xs text-slate-400">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  No Google OAuth configuration required! Mana generates the form structure and provides a 1-click Google Apps Script trigger that pipes responses directly into your tournament.
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/80">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs font-medium rounded-xl transition flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {loading ? "Generating Form..." : "Create External Form"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
