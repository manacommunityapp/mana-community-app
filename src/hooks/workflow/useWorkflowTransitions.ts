import { useState, useEffect, useCallback } from "react";
import {
  workflowService,
  type AllowedTransition,
  type TransitionHistoryEntry,
} from "../../services/workflow/workflowService";

export function useWorkflowTransitions(
  workflowId: string,
  entityId: string | number,
  currentStatus: string,
  enabled = true
) {
  const [transitions, setTransitions] = useState<AllowedTransition[]>([]);
  const [history, setHistory] = useState<TransitionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled || !entityId || !currentStatus) return;
    setLoading(true);
    try {
      const [t, h] = await Promise.all([
        workflowService.getAllowedTransitions(workflowId, entityId, currentStatus),
        workflowService.getHistory(workflowId, entityId),
      ]);
      setTransitions(t);
      setHistory(h);
      setError(null);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to load workflow state";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [workflowId, entityId, currentStatus, enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { transitions, history, loading, error, reload };
}
