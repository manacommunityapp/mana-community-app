import { useState } from "react";
import {
  X,
  AlertTriangle,
  CloudRain,
  ShieldAlert,
  Clock,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  Scale,
  FileText
} from "lucide-react";
import { automationService, type SportsDisputeResponse } from "../../../services/automation/automationService";
import {
  calculateRainRevisedTarget,
  validateWalkoverForfeit,
} from "./sportsValidation";
import { toast } from "sonner";

interface SportsDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: number | string;
  tournamentName?: string;
  teamAName?: string;
  teamBName?: string;
  sport?: string;
  currentScoreSummary?: {
    firstInningsRuns?: number;
    firstInningsOvers?: number;
    currentOvers?: number;
  };
  onApplyRuling?: (ruling: SportsDisputeResponse["ruling"]) => void;
}

type DisputeTab = "RAIN" | "WALKOVER" | "DISPUTE" | "CONDUCT";

export function SportsDisputeModal({
  isOpen,
  onClose,
  matchId,
  tournamentName = "Mana Community Tournament",
  teamAName = "Team A",
  teamBName = "Team B",
  sport = "Cricket",
  currentScoreSummary,
  onApplyRuling,
}: SportsDisputeModalProps) {
  const [activeTab, setActiveTab] = useState<DisputeTab>("RAIN");
  const [incidentText, setIncidentText] = useState("");
  const [selectedParty, setSelectedParty] = useState(teamAName);

  // Rain Rule Inputs
  const [firstInningsRuns, setFirstInningsRuns] = useState(currentScoreSummary?.firstInningsRuns || 120);
  const [firstInningsOvers, setFirstInningsOvers] = useState(currentScoreSummary?.firstInningsOvers || 20);
  const [availableOvers, setAvailableOvers] = useState(12);

  // Walkover Inputs
  const [minutesLate, setMinutesLate] = useState(20);
  const [playersPresent, setPlayersPresent] = useState(6);
  const [minRequired, setMinRequired] = useState(7);

  // Arbitration State
  const [loading, setLoading] = useState(false);
  const [rulingResponse, setRulingResponse] = useState<SportsDisputeResponse | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCalculateRainLocal = () => {
    const calc = calculateRainRevisedTarget(firstInningsRuns, firstInningsOvers, availableOvers, 5);
    if (!calc.isValidMatch) {
      toast.error(calc.reason || "Match cannot proceed.");
      return;
    }
    toast.success(`Revised Target: ${calc.revisedTarget} runs in ${availableOvers} overs (Req RR: ${calc.runRateNeeded})`);
  };

  const handleConsultAI = async () => {
    setLoading(true);
    setRulingResponse(null);

    let disputeType: "DISPUTE" | "CONTENT_MODERATION" | "RAIN_RULE" = "DISPUTE";
    let fullPromptDescription = "";

    if (activeTab === "RAIN") {
      disputeType = "RAIN_RULE";
      fullPromptDescription = `Match interrupted by rain/weather. 1st innings scored ${firstInningsRuns} runs in ${firstInningsOvers} overs. Due to time lost, 2nd innings can only bowl ${availableOvers} overs. Calculate fair revised target and confirm if match meets minimum valid overs. Additional remarks: ${incidentText}`;
    } else if (activeTab === "WALKOVER") {
      disputeType = "DISPUTE";
      fullPromptDescription = `Walkover / No-Show Claim. ${selectedParty} is ${minutesLate} minutes late past scheduled start time (community grace period is 15 mins). Squad currently has only ${playersPresent} players present out of required ${minRequired}. Additional remarks: ${incidentText}`;
    } else if (activeTab === "CONDUCT") {
      disputeType = "CONTENT_MODERATION";
      fullPromptDescription = `Sportsmanship & Code of Conduct violation. Involved party: ${selectedParty}. Incident details: "${incidentText}". Evaluate toxicity, unsporting behavior, and suggest disciplinary sanction (warning, cards, points deduction).`;
    } else {
      disputeType = "DISPUTE";
      fullPromptDescription = `On-field dispute between ${teamAName} and ${teamBName}. Issue: "${incidentText}". Need neutral fair-play ruling.`;
    }

    try {
      const response = await automationService.resolveDisputeOrModerate({
        type: disputeType,
        matchId,
        tournamentName,
        parties: `${teamAName} vs ${teamBName} (${selectedParty})`,
        incidentDescription: fullPromptDescription,
      });

      if (response && response.status === "success") {
        setRulingResponse(response);
        toast.success("AI Arbitrator ruling generated!");
      } else {
        toast.error("Failed to generate ruling from AI engine.");
      }
    } catch {
      toast.error("Error communicating with AI dispute engine.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBulletin = () => {
    if (!rulingResponse?.ruling?.residentMessage) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(rulingResponse.ruling.residentMessage);
    }
    setCopied(true);
    toast.success("Resident announcement copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white">Dispute & Incident Arbitrator</h3>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> AI Assisted
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {teamAName} vs {teamBName} · Match #{matchId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-3 pt-2 gap-1 overflow-x-auto">
          {[
            { id: "RAIN", label: "Rain / Weather Rule", icon: CloudRain },
            { id: "WALKOVER", label: "Walkover / No-Show", icon: Clock },
            { id: "CONDUCT", label: "Player Conduct", icon: ShieldAlert },
            { id: "DISPUTE", label: "General Dispute", icon: AlertTriangle },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as DisputeTab);
                  setRulingResponse(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition whitespace-nowrap ${
                  active
                    ? "bg-white text-indigo-700 border-t border-x border-slate-200 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Tab 1: Rain Delay */}
          {activeTab === "RAIN" && (
            <div className="space-y-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-blue-600" />
                Rain Delay & Target Revision (DLS Rule)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">1st Innings Runs</label>
                  <input
                    type="number"
                    value={firstInningsRuns}
                    onChange={(e) => setFirstInningsRuns(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">1st Innings Overs</label>
                  <input
                    type="number"
                    value={firstInningsOvers}
                    onChange={(e) => setFirstInningsOvers(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Available 2nd Inn. Overs</label>
                  <input
                    type="number"
                    value={availableOvers}
                    onChange={(e) => setAvailableOvers(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCalculateRainLocal}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  Quick Formula Check
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Walkover */}
          {activeTab === "WALKOVER" && (
            <div className="space-y-3 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
              <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                Walkover & No-Show Grace Period Check
              </h4>
              <p className="text-xs text-slate-600">
                Official tournament rule: 15-minute grace period allowed. Failing to report with minimum squad constitutes automatic forfeit.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Defaulting Team</label>
                  <select
                    value={selectedParty}
                    onChange={(e) => setSelectedParty(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-amber-500"
                  >
                    <option value={teamAName}>{teamAName}</option>
                    <option value={teamBName}>{teamBName}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Minutes Past Toss</label>
                  <input
                    type="number"
                    value={minutesLate}
                    onChange={(e) => setMinutesLate(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Players Present</label>
                  <input
                    type="number"
                    value={playersPresent}
                    onChange={(e) => setPlayersPresent(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Conduct & Tab 4: General Dispute */}
          {(activeTab === "CONDUCT" || activeTab === "DISPUTE") && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                {activeTab === "CONDUCT" ? "Reported Misconduct & Unsportsmanlike Behavior" : "Dispute Description"}
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedParty}
                  onChange={(e) => setSelectedParty(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500"
                >
                  <option value={teamAName}>{teamAName}</option>
                  <option value={teamBName}>{teamBName}</option>
                  <option value="Both Teams">Both Teams</option>
                  <option value="Match Official / Scorer">Match Official / Scorer</option>
                </select>
              </div>
            </div>
          )}

          {/* Incident Remarks Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">
              Incident Context / Official Remarks:
            </label>
            <textarea
              rows={3}
              value={incidentText}
              onChange={(e) => setIncidentText(e.target.value)}
              placeholder="e.g. Batsman disputed run-out decision and refused to walk off; 10 min delay ensued..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          {/* Consult AI Action Button */}
          <button
            onClick={handleConsultAI}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Arbitrating with Gemini AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                Generate Official Arbitration Ruling
              </>
            )}
          </button>

          {/* Ruling Result Display */}
          {rulingResponse && (
            <div className="space-y-3.5 mt-4 pt-4 border-t border-slate-200 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Official Arbitrator Verdict
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${ rulingResponse.ruling.actionTaken === "WALKOVER_CONFIRMED" ? "bg-red-100 text-red-700 border border-red-200" : rulingResponse.ruling.actionTaken === "TARGET_REVISED" ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-purple-100 text-purple-700 border border-purple-200" }`}
                >
                  {rulingResponse.ruling.actionTaken}
                </span>
              </div>

              {/* Toxicity Meter if applicable */}
              {rulingResponse.ruling.toxicityScore > 0 && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600">Toxicity Assessment:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          rulingResponse.ruling.toxicityScore > 0.6
                            ? "bg-red-500"
                            : rulingResponse.ruling.toxicityScore > 0.3
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, rulingResponse.ruling.toxicityScore * 100)}%` }}
                      />
                    </div>
                    <span className="font-bold text-slate-700">
                      {(rulingResponse.ruling.toxicityScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Official Ruling Paragraph */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed space-y-1.5">
                <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-indigo-600" /> Ruling Rationale:
                </p>
                <p className="whitespace-pre-line text-slate-700">{rulingResponse.ruling.officialRuling}</p>
              </div>

              {/* Match Condition Revisions (if rain rule applied) */}
              {rulingResponse.ruling.revisedMatchConditions?.revisedTargetRuns != null && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                  <div>
                    <span className="font-bold">Revised Target:</span>{" "}
                    {rulingResponse.ruling.revisedMatchConditions.revisedTargetRuns} runs in{" "}
                    {rulingResponse.ruling.revisedMatchConditions.oversReducedTo || availableOvers} overs
                  </div>
                  {onApplyRuling && (
                    <button
                      onClick={() => onApplyRuling(rulingResponse.ruling)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Apply To Match
                    </button>
                  )}
                </div>
              )}

              {/* WhatsApp Resident Notification Bulletin */}
              {rulingResponse.ruling.residentMessage && (
                <div className="p-3.5 bg-green-50/70 border border-green-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-green-900 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-green-700" />
                      De-escalating Announcement (WhatsApp / App):
                    </span>
                    <button
                      onClick={handleCopyBulletin}
                      className="flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="text-xs text-green-800 bg-white/80 p-2.5 rounded-lg border border-green-100 italic">
                    "{rulingResponse.ruling.residentMessage}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
