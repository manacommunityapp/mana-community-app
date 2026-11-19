import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2, ArrowRight } from "lucide-react";
import { useWorkflowTransitions } from "../../../hooks/workflow/useWorkflowTransitions";
import { workflowService } from "../../../services/workflow/workflowService";
import { WorkflowStatusBadge } from "./WorkflowStatusBadge";

interface WorkflowTransitionPanelProps {
  workflowId: string;
  entityId: string | number;
  currentStatus: string;
  onStatusChanged?: (newStatus: string) => void;
  compact?: boolean;
}

function formatTs(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WorkflowTransitionPanel({
  workflowId,
  entityId,
  currentStatus,
  onStatusChanged,
  compact = false,
}: WorkflowTransitionPanelProps) {
  const [localStatus, setLocalStatus] = useState(currentStatus);
  const { transitions, history, loading, error, reload } = useWorkflowTransitions(
    workflowId,
    entityId,
    localStatus
  );

  const [pendingTransition, setPendingTransition] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [executing, setExecuting] = useState(false);
  const [execError, setExecError] = useState<string | null>(null);
  const [execSuccess, setExecSuccess] = useState<string | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const handleTransitionClick = (toStatus: string, reasonRequired: boolean) => {
    if (reasonRequired) {
      setPendingTransition(toStatus);
      setReason("");
    } else {
      executeTransition(toStatus, undefined);
    }
  };

  const executeTransition = async (toStatus: string, transitionReason: string | undefined) => {
    setExecuting(true);
    setExecError(null);
    setExecSuccess(null);
    try {
      const result = await workflowService.executeTransition(
        workflowId,
        entityId,
        localStatus,
        toStatus,
        transitionReason
      );
      const next = result.newStatus ?? toStatus;
      setLocalStatus(next);
      setExecSuccess(`Status updated to ${next.replace(/_/g, " ").toLowerCase()}`);
      onStatusChanged?.(next);
      setPendingTransition(null);
      setReason("");
      reload();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Transition failed. Please try again.";
      setExecError(msg);
    } finally {
      setExecuting(false);
    }
  };

  const displayedHistory = showAll ? history : history.slice(0, 10);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4 bg-white dark:bg-gray-900">
      {/* Current status */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Status:</span>
        <WorkflowStatusBadge status={localStatus} size="md" />
      </div>

      {/* Loading / fetch error */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading transitions…
        </div>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Transition buttons */}
      {!loading && transitions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
            Actions
          </p>
          <div className="flex flex-wrap gap-2">
            {transitions.map((t) => (
              <button
                key={t.toStatus}
                disabled={executing}
                onClick={() => handleTransitionClick(t.toStatus, t.reasonRequired)}
                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600
                  bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                  text-gray-700 dark:text-gray-200 font-medium transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {executing && pendingTransition === t.toStatus ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />
                ) : null}
                {t.displayLabel}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Inline reason box */}
      {pendingTransition && (
        <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 space-y-2">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Reason required to proceed
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Enter reason…"
            className="w-full text-sm rounded-md border border-gray-300 dark:border-gray-600
              bg-white dark:bg-gray-800 p-2 focus:outline-none focus:ring-2 focus:ring-amber-400
              text-gray-800 dark:text-gray-100 resize-none"
          />
          <div className="flex gap-2">
            <button
              disabled={!reason.trim() || executing}
              onClick={() => executeTransition(pendingTransition, reason.trim())}
              className="px-3 py-1.5 text-sm rounded-md bg-amber-600 hover:bg-amber-700 text-white
                font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {executing ? <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" /> : null}
              Confirm
            </button>
            <button
              onClick={() => setPendingTransition(null)}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Success / error feedback */}
      {execSuccess && (
        <p className="text-sm text-green-700 dark:text-green-400 font-medium">{execSuccess}</p>
      )}
      {execError && (
        <p className="text-sm text-red-600 dark:text-red-400">{execError}</p>
      )}

      {/* History timeline */}
      {!compact && history.length > 0 && (
        <div>
          <button
            onClick={() => setHistoryExpanded((x) => !x)}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400
              hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            {historyExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            History ({history.length})
          </button>
          {historyExpanded && (
            <div className="mt-2 space-y-2 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
              {displayedHistory.map((entry) => (
                <div key={entry.id} className="text-xs space-y-0.5">
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <span>{formatTs(entry.transitionedAt)}</span>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <span className="font-medium">{entry.actorRole}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                    <WorkflowStatusBadge status={entry.fromStatus} />
                    <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <WorkflowStatusBadge status={entry.toStatus} />
                    {entry.displayLabel && (
                      <span className="text-gray-500 dark:text-gray-400 ml-1">
                        ({entry.displayLabel})
                      </span>
                    )}
                  </div>
                  {entry.reason && (
                    <p className="text-gray-500 dark:text-gray-400 italic">"{entry.reason}"</p>
                  )}
                </div>
              ))}
              {history.length > 10 && !showAll && (
                <button
                  onClick={() => setShowAll(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Show all {history.length} entries
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WorkflowTransitionPanel;
