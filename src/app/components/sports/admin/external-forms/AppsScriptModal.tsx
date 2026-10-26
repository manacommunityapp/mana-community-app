import { useState, useEffect } from "react";
import { X, Copy, Check, Code, ExternalLink, AlertTriangle, BookOpen } from "lucide-react";
import { sportsExternalFormService } from "../../../../../services/sports/sportsExternalFormService";
import { showSuccess, showError } from "../../../../../utils/ToastUtils";

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  formId: number;
  formTitle: string;
}

export function AppsScriptModal({ isOpen, onClose, formId, formTitle }: AppsScriptModalProps) {
  const [script, setScript] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && formId) {
      setLoading(true);
      sportsExternalFormService.getAppsScript(formId)
        .then(res => setScript(res.script))
        .catch(() => showError("Failed to fetch Apps Script snippet"))
        .finally(() => setLoading(false));
    }
  }, [isOpen, formId]);

  if (!isOpen) return null;

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      showSuccess("Apps Script code copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showError("Failed to copy code");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-700/80 flex items-center justify-between bg-slate-800/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">Google Forms Webhook Integration</h3>
              <p className="text-xs text-slate-400 mt-0.5">{formTitle} • Continuous Auto-Sync</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Setup Guide Steps */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/70 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              Easy 2-Minute Setup Instructions
            </div>
            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                Open your form in <strong className="text-white">Google Forms</strong> editor.
              </li>
              <li>
                Click the three vertical dots (<strong>⋮</strong>) in the top right corner and choose{" "}
                <span className="text-blue-300 font-mono bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/40">
                  Script editor
                </span>.
              </li>
              <li>
                Replace whatever placeholder code is in <code className="text-purple-300">Code.gs</code> with the snippet below.
              </li>
              <li>
                Click the Save icon (<strong>💾</strong>), then click the clock icon (<strong>⏰ Triggers</strong>) on the left sidebar.
              </li>
              <li>
                Click <strong className="text-white">Add Trigger</strong>:
                <div className="mt-1 ml-4 p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-xs text-slate-300">
                  <div>• Choose which function to run: <strong className="text-emerald-400">onFormSubmit</strong></div>
                  <div>• Select event source: <strong className="text-emerald-400">From form</strong></div>
                  <div>• Select event type: <strong className="text-emerald-400">On form submit</strong></div>
                </div>
              </li>
              <li>Save and authorize permissions. Whenever anyone submits the Google Form, it will automatically register them in Mana in real-time!</li>
            </ol>
          </div>

          {/* Script Code Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Google Apps Script Code
              </span>
              <button
                onClick={copyScript}
                disabled={loading || !script}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy Code"}
              </button>
            </div>

            {loading ? (
              <div className="h-64 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xs text-slate-500">
                Generating script...
              </div>
            ) : (
              <div className="relative">
                <pre className="max-h-64 overflow-y-auto p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-300 font-mono leading-relaxed select-all">
                  {script}
                </pre>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-amber-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>You only need to install this trigger once per Google Form.</span>
            </div>
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
