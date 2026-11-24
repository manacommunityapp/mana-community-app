import { CheckCircle2, ChevronRight, Clock, Layers, Radio, Trophy } from "lucide-react";
import type { StageProgressionSummary, TournamentStageKey } from "../../../utils/sportsStageUtils";

interface StageProgressionBarProps {
  progression: StageProgressionSummary;
  title?: string;
  selectedStage?: TournamentStageKey;
  onSelectStage?: (stage: TournamentStageKey) => void;
  onViewBracket?: () => void;
  compact?: boolean;
}

export function StageProgressionBar({
  progression,
  title,
  selectedStage,
  onSelectStage,
  onViewBracket,
  compact = false,
}: StageProgressionBarProps) {
  if (!progression || progression.stages.length === 0) return null;

  const { stages, currentStage, isTournamentCompleted, championName, headline } = progression;

  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm ${
        compact ? "p-3" : "p-3.5 sm:p-4"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
        <div className="flex min-w-0 items-center gap-2 flex-wrap">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Layers className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-800 truncate">
            {title || "Tournament Stage Progress"}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
              isTournamentCompleted
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : currentStage?.status === "LIVE"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-indigo-200 bg-indigo-50 text-indigo-700"
            }`}
          >
            {currentStage?.status === "LIVE" && (
              <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
            )}
            {isTournamentCompleted && <Trophy className="h-2.5 w-2.5 text-amber-500" />}
            <span>{headline}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {championName && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              <Trophy className="h-2.5 w-2.5 text-amber-600" />
              {championName}
            </span>
          )}
          {onViewBracket && (
            <button
              type="button"
              onClick={onViewBracket}
              className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50/70 px-2.5 py-1 text-[11px] font-bold text-indigo-700 transition hover:bg-indigo-100 cursor-pointer"
            >
              <span>View Brackets</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Stage Stepper */}
      <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
        {stages.map((stage, idx) => {
          const isCurrent = currentStage?.key === stage.key && !isTournamentCompleted;
          const isSelected = selectedStage === stage.key;
          const isDone = stage.status === "COMPLETED";
          const isLive = stage.status === "LIVE";
          const isInProgress = stage.status === "IN_PROGRESS";

          const baseTone = isSelected
            ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
            : isLive
              ? "border-red-300 bg-red-50/90 text-red-800 hover:bg-red-100"
              : isDone
                ? "border-emerald-200 bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100/80"
                : isCurrent || isInProgress
                  ? "border-indigo-300 bg-indigo-50/80 text-indigo-800 hover:bg-indigo-100/80"
                  : "border-slate-200 bg-slate-50/80 text-slate-600 hover:bg-slate-100";

          return (
            <div key={stage.key} className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onSelectStage?.(isSelected ? "ALL" : stage.key)}
                disabled={!onSelectStage}
                title={`${stage.label}: ${stage.completedMatches}/${stage.totalMatches} completed${
                  stage.liveMatches > 0 ? `, ${stage.liveMatches} live` : ""
                }`}
                className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left transition ${baseTone} ${
                  onSelectStage ? "cursor-pointer active:scale-[0.98]" : "cursor-default"
                }`}
              >
                <span className="shrink-0">
                  {isLive ? (
                    <Radio className={`h-3.5 w-3.5 animate-pulse ${isSelected ? "text-white" : "text-red-600"}`} />
                  ) : isDone ? (
                    <CheckCircle2 className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-emerald-600"}`} />
                  ) : isCurrent || isInProgress ? (
                    <Trophy className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-indigo-600"}`} />
                  ) : (
                    <Clock className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-slate-400"}`} />
                  )}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold whitespace-nowrap">
                      {compact ? stage.shortLabel : stage.label}
                    </span>
                    {isCurrent && !isSelected && (
                      <span className="rounded px-1 py-0.2 text-[8px] font-black uppercase tracking-wider bg-indigo-600 text-white">
                        Current
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-[10px] font-medium whitespace-nowrap ${
                      isSelected ? "text-indigo-100" : "opacity-75"
                    }`}
                  >
                    {isLive
                      ? `${stage.liveMatches} live · ${stage.completedMatches}/${stage.totalMatches}`
                      : isDone
                        ? `${stage.totalMatches}/${stage.totalMatches} done`
                        : `${stage.completedMatches}/${stage.totalMatches} played`}
                  </div>
                </div>
              </button>

              {idx < stages.length - 1 && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
