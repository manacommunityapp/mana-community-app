import { useState, useCallback } from "react";
import { X } from "lucide-react";
import { tournamentService, type TossDecision } from "../../../services/sports/tournamentService";
import { toast } from "sonner";

// Sport-specific toss terminology
interface SportTossConfig {
  modalTitle: string;       // "Cricket Toss" / "Football Toss" etc.
  whoStartsQuestion: string; // "Who bats first?" / "Who kicks off?" etc.
  goFirstLabel: string;
  goFirstValue: TossDecision;
  goSecondLabel: string;
  goSecondValue: TossDecision;
}

const SPORT_TOSS_CONFIG: Record<string, SportTossConfig> = {
  CRICKET:          { modalTitle: "Cricket Toss",    whoStartsQuestion: "Who bats first?",   goFirstLabel: "🏏 Bat first",      goFirstValue: "BAT",      goSecondLabel: "🎳 Bowl first",     goSecondValue: "BOWL"    },
  FOOTBALL:         { modalTitle: "Football Toss",   whoStartsQuestion: "Who kicks off?",    goFirstLabel: "⚽ Kick off",        goFirstValue: "KICKOFF",  goSecondLabel: "🛡️ Defend first",   goSecondValue: "DEFEND"  },
  FUTSAL:           { modalTitle: "Futsal Toss",     whoStartsQuestion: "Who kicks off?",    goFirstLabel: "⚽ Kick off",        goFirstValue: "KICKOFF",  goSecondLabel: "🛡️ Defend first",   goSecondValue: "DEFEND"  },
  SOCCER:           { modalTitle: "Football Toss",   whoStartsQuestion: "Who kicks off?",    goFirstLabel: "⚽ Kick off",        goFirstValue: "KICKOFF",  goSecondLabel: "🛡️ Defend first",   goSecondValue: "DEFEND"  },
  HOCKEY:           { modalTitle: "Hockey Toss",     whoStartsQuestion: "Who starts?",       goFirstLabel: "🏑 Stick off",       goFirstValue: "KICKOFF",  goSecondLabel: "🛡️ Defend first",   goSecondValue: "DEFEND"  },
  RUGBY:            { modalTitle: "Rugby Toss",      whoStartsQuestion: "Who kicks off?",    goFirstLabel: "🏉 Kick off",        goFirstValue: "KICKOFF",  goSecondLabel: "🛡️ Receive kick",   goSecondValue: "DEFEND"  },
  KABADDI:          { modalTitle: "Kabaddi Toss",    whoStartsQuestion: "Who raids first?",  goFirstLabel: "⚡ Raid first",      goFirstValue: "RAID",     goSecondLabel: "🛡️ Defend first",   goSecondValue: "DEFEND"  },
  BADMINTON:        { modalTitle: "Badminton Toss",  whoStartsQuestion: "Who serves first?", goFirstLabel: "🏸 Serve first",     goFirstValue: "SERVE",    goSecondLabel: "🏸 Receive first",  goSecondValue: "RECEIVE" },
  TENNIS:           { modalTitle: "Tennis Toss",     whoStartsQuestion: "Who serves first?", goFirstLabel: "🎾 Serve first",     goFirstValue: "SERVE",    goSecondLabel: "🎾 Return first",   goSecondValue: "RECEIVE" },
  TABLE_TENNIS:     { modalTitle: "Table Tennis",    whoStartsQuestion: "Who serves first?", goFirstLabel: "🏓 Serve first",     goFirstValue: "SERVE",    goSecondLabel: "🏓 Receive first",  goSecondValue: "RECEIVE" },
  SQUASH:           { modalTitle: "Squash Toss",     whoStartsQuestion: "Who serves first?", goFirstLabel: "🎾 Serve first",     goFirstValue: "SERVE",    goSecondLabel: "🎾 Receive first",  goSecondValue: "RECEIVE" },
  PICKLEBALL:       { modalTitle: "Pickleball",      whoStartsQuestion: "Who serves first?", goFirstLabel: "🏓 Serve first",     goFirstValue: "SERVE",    goSecondLabel: "🏓 Receive first",  goSecondValue: "RECEIVE" },
  VOLLEYBALL:       { modalTitle: "Volleyball Toss", whoStartsQuestion: "Who serves first?", goFirstLabel: "🏐 Serve first",     goFirstValue: "SERVE",    goSecondLabel: "🏐 Receive first",  goSecondValue: "RECEIVE" },
  BEACH_VOLLEYBALL: { modalTitle: "Beach Volleyball",whoStartsQuestion: "Who serves first?", goFirstLabel: "🏐 Serve first",     goFirstValue: "SERVE",    goSecondLabel: "🏐 Receive first",  goSecondValue: "RECEIVE" },
  GRASS_VOLLEYBALL: { modalTitle: "Volleyball Toss", whoStartsQuestion: "Who serves first?", goFirstLabel: "🏐 Serve first",     goFirstValue: "SERVE",    goSecondLabel: "🏐 Receive first",  goSecondValue: "RECEIVE" },
  THROWBALL:        { modalTitle: "Throwball Toss",  whoStartsQuestion: "Who throws first?", goFirstLabel: "🏐 Throw first",     goFirstValue: "SERVE",    goSecondLabel: "🏐 Receive first",  goSecondValue: "RECEIVE" },
  BASKETBALL:       { modalTitle: "Basketball Toss", whoStartsQuestion: "Who takes jump ball?", goFirstLabel: "🏀 Jump ball",    goFirstValue: "GO_FIRST", goSecondLabel: "🏀 Concede jump",   goSecondValue: "GO_SECOND"},
  CARROM:           { modalTitle: "Carrom Toss",     whoStartsQuestion: "Who strikes first?",goFirstLabel: "⬜ Strike first",    goFirstValue: "SERVE",    goSecondLabel: "⬜ Strike second",  goSecondValue: "RECEIVE" },
  DEFAULT:          { modalTitle: "Match Toss",      whoStartsQuestion: "Who goes first?",   goFirstLabel: "▶️ Go first",        goFirstValue: "GO_FIRST", goSecondLabel: "⏭️ Go second",      goSecondValue: "GO_SECOND"},
};

function getSportConfig(sportType?: string): SportTossConfig {
  if (!sportType) return SPORT_TOSS_CONFIG.DEFAULT;
  const key = sportType.toUpperCase().replace(/[\s-]/g, "_");
  return SPORT_TOSS_CONFIG[key] ?? SPORT_TOSS_CONFIG.DEFAULT;
}

interface TossSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: number;
  teamAId: number;
  teamBId: number;
  teamAName: string;
  teamBName: string;
  onSaved: () => void;
  sportType?: string;
}

type TossMode = "coin" | "record" | "pick" | null;
type CoinState = "idle" | "flipping" | "done";

function useCoinFlip() {
  const [coinState, setCoinState] = useState<CoinState>("idle");
  const [result, setResult] = useState<"heads" | "tails" | null>(null);

  const flip = useCallback(() => {
    setCoinState("flipping");
    setResult(null);
    setTimeout(() => {
      const r = Math.random() < 0.5 ? "heads" : "tails";
      setResult(r);
      setCoinState("done");
    }, 1600);
  }, []);

  const reset = useCallback(() => {
    setCoinState("idle");
    setResult(null);
  }, []);

  return { coinState, result, flip, reset };
}

export function TossSetupModal({
  isOpen, onClose, matchId,
  teamAId, teamBId, teamAName, teamBName, onSaved, sportType,
}: TossSetupModalProps) {
  const cfg = getSportConfig(sportType);
  const [mode, setMode] = useState<TossMode>(null);
  const [winnerSide, setWinnerSide] = useState<"A" | "B" | "">("");
  const [decision, setDecision] = useState<TossDecision | "">("");
  const [saving, setSaving] = useState(false);
  const { coinState, result, flip, reset } = useCoinFlip();

  if (!isOpen) return null;

  const handleBack = () => {
    setMode(null);
    setWinnerSide("");
    setDecision("");
    reset();
  };

  const save = async (winnerId: number, dec: "BAT" | "BOWL") => {
    setSaving(true);
    try {
      await tournamentService.recordMatchToss(matchId, { tossWinnerTeamId: winnerId, tossDecision: dec });
      const winnerName = winnerId === teamAId ? teamAName : teamBName;
      toast.success(`Toss saved — ${winnerName} elected to ${dec === "BAT" ? "bat" : "bowl"} first`);
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save toss");
    } finally {
      setSaving(false);
    }
  };

  const handleRecordSave = () => {
    if (!winnerSide || !decision) {
      toast.error("Select the toss winner and their decision.");
      return;
    }
    save(winnerSide === "A" ? teamAId : teamBId, decision as TossDecision);
  };

  const flipsEndsDeg = result === "tails" ? 1980 : 1800;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-black text-slate-800">{cfg.modalTitle}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">{teamAName} vs {teamBName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Mode picker */}
        {mode === null && (
          <div className="p-5 space-y-2.5">
            <p className="text-[11px] text-slate-400 text-center mb-3">How was the toss done?</p>

            <button
              onClick={() => setMode("coin")}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-300 transition text-left active:scale-[0.99]"
            >
              <span className="text-2xl leading-none">🪙</span>
              <div>
                <div className="text-sm font-bold text-amber-900">Flip a coin</div>
                <div className="text-[11px] text-amber-700/80">Use the animated coin to decide now</div>
              </div>
            </button>

            <button
              onClick={() => setMode("record")}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition text-left active:scale-[0.99]"
            >
              <span className="text-2xl leading-none">📋</span>
              <div>
                <div className="text-sm font-bold text-slate-800">Record toss</div>
                <div className="text-[11px] text-slate-500">Toss already done — enter the result</div>
              </div>
            </button>

            <button
              onClick={() => setMode("pick")}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition text-left active:scale-[0.99]"
            >
              <span className="text-2xl leading-none">⚡</span>
              <div>
                <div className="text-sm font-bold text-slate-800">Just pick who bats</div>
                <div className="text-[11px] text-slate-500">Skip the formality — tap a team</div>
              </div>
            </button>

            <button onClick={onClose} className="w-full pt-1 text-xs text-slate-400 hover:text-slate-600 transition">
              Skip for now
            </button>
          </div>
        )}

        {/* Coin flip */}
        {mode === "coin" && (
          <div className="p-5 text-center">
            <div className="relative mx-auto w-28 h-28 my-3" style={{ perspective: "600px" }}>
              <style>{`
                @keyframes toss-coin-flip {
                  0%   { transform: rotateY(0deg) translateY(0px); }
                  25%  { transform: rotateY(540deg) translateY(-24px); }
                  65%  { transform: rotateY(1260deg) translateY(-12px); }
                  100% { transform: rotateY(${flipsEndsDeg}deg) translateY(0px); }
                }
              `}</style>
              <div
                className="w-full h-full"
                style={{
                  transformStyle: "preserve-3d",
                  animation: coinState === "flipping" ? "toss-coin-flip 1.6s cubic-bezier(0.3,0.9,0.5,1) forwards" : "none",
                  transform: coinState === "done"
                    ? `rotateY(${flipsEndsDeg}deg)`
                    : "rotateY(0deg)",
                  transition: coinState === "idle" ? "transform 0.3s" : undefined,
                }}
              >
                <div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-500 flex items-center justify-center shadow-xl ring-4 ring-amber-600/20"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="text-center">
                    <div className="text-4xl">🏏</div>
                    <div className="text-[9px] font-black text-amber-900 uppercase tracking-widest mt-0.5">Heads</div>
                  </div>
                </div>
                <div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-slate-500 flex items-center justify-center shadow-xl ring-4 ring-slate-600/20"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <div className="text-center">
                    <div className="text-4xl">🏟️</div>
                    <div className="text-[9px] font-black text-slate-800 uppercase tracking-widest mt-0.5">Tails</div>
                  </div>
                </div>
              </div>
            </div>

            {coinState === "idle" && (
              <div className="space-y-3 mt-2">
                <p className="text-xs text-slate-500">Tap to flip the coin</p>
                <button
                  onClick={flip}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition active:scale-[0.98]"
                >
                  Flip Coin 🪙
                </button>
              </div>
            )}

            {coinState === "flipping" && (
              <p className="text-xs font-bold text-slate-500 animate-pulse mt-2">Flipping…</p>
            )}

            {coinState === "done" && (
              <div className="space-y-3 mt-2">
                <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                  {result === "heads" ? "🏏 Heads!" : "🏟️ Tails!"}
                </div>

                <p className="text-xs font-semibold text-slate-600">Who won the toss?</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["A", "B"] as const).map(side => (
                    <button
                      key={side}
                      onClick={() => setWinnerSide(side)}
                      className={`py-2.5 rounded-xl text-xs font-bold border-2 transition active:scale-[0.97] ${
                        winnerSide === side
                          ? "border-amber-400 bg-amber-50 text-amber-800"
                          : "border-slate-200 hover:border-amber-200 text-slate-600"
                      }`}
                    >
                      {side === "A" ? teamAName : teamBName}
                    </button>
                  ))}
                </div>

                {winnerSide && (
                  <>
                    <p className="text-xs font-semibold text-slate-600">They chose to…</p>
                    <div className="grid grid-cols-2 gap-2">
                      {([cfg.goFirstValue, cfg.goSecondValue] as const).map((val, i) => {
                        const label = i === 0 ? cfg.goFirstLabel : cfg.goSecondLabel;
                        return (
                          <button
                            key={val}
                            onClick={() => setDecision(val)}
                            className={`py-2.5 rounded-xl text-xs font-bold border-2 transition active:scale-[0.97] ${
                              decision === val
                                ? "border-indigo-400 bg-indigo-50 text-indigo-800"
                                : "border-slate-200 hover:border-indigo-200 text-slate-600"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {winnerSide && decision && (
                  <button
                    onClick={() => save(winnerSide === "A" ? teamAId : teamBId, decision)}
                    disabled={saving}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition active:scale-[0.98] disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Start Match 🏏"}
                  </button>
                )}

                <button
                  onClick={() => { reset(); setWinnerSide(""); setDecision(""); }}
                  className="text-xs text-slate-400 hover:text-slate-600 transition"
                >
                  Flip again
                </button>
              </div>
            )}

            <button onClick={handleBack} className="mt-3 text-xs text-slate-400 hover:text-slate-600 transition block mx-auto">
              ← Back
            </button>
          </div>
        )}

        {/* Record toss */}
        {mode === "record" && (
          <div className="p-5 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Toss won by</p>
              <div className="grid grid-cols-2 gap-2">
                {(["A", "B"] as const).map(side => (
                  <button
                    key={side}
                    onClick={() => setWinnerSide(side)}
                    className={`py-3 rounded-xl text-xs font-bold border-2 transition active:scale-[0.97] ${
                      winnerSide === side
                        ? "border-amber-400 bg-amber-50 text-amber-800"
                        : "border-slate-200 hover:border-amber-200 text-slate-600"
                    }`}
                  >
                    {side === "A" ? teamAName : teamBName}
                  </button>
                ))}
              </div>
            </div>

            {winnerSide && (
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">They chose to</p>
                <div className="grid grid-cols-2 gap-2">
                  {([cfg.goFirstValue, cfg.goSecondValue] as const).map((val, i) => {
                    const label = i === 0 ? cfg.goFirstLabel : cfg.goSecondLabel;
                    return (
                      <button
                        key={val}
                        onClick={() => setDecision(val)}
                        className={`py-3 rounded-xl text-xs font-bold border-2 transition active:scale-[0.97] ${
                          decision === val
                            ? "border-indigo-400 bg-indigo-50 text-indigo-800"
                            : "border-slate-200 hover:border-indigo-200 text-slate-600"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {winnerSide && decision && (
              <button
                onClick={handleRecordSave}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Toss"}
              </button>
            )}

            <button onClick={handleBack} className="text-xs text-slate-400 hover:text-slate-600 transition block">
              ← Back
            </button>
          </div>
        )}

        {/* Quick pick */}
        {mode === "pick" && (
          <div className="p-5 space-y-4">
            <p className="text-xs text-slate-500 text-center">{cfg.whoStartsQuestion}</p>
            <div className="grid grid-cols-2 gap-3">
              {(["A", "B"] as const).map(side => (
                <button
                  key={side}
                  onClick={() => save(side === "A" ? teamAId : teamBId, cfg.goFirstValue)}
                  disabled={saving}
                  className="py-6 rounded-2xl text-sm font-black border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 transition active:scale-[0.97] disabled:opacity-50"
                >
                  {side === "A" ? teamAName : teamBName}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 text-center -mt-1">The other team goes second</p>
            <button onClick={handleBack} className="text-xs text-slate-400 hover:text-slate-600 transition block mx-auto">
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}



