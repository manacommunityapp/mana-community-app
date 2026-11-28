import { apiClient } from "../common/apiClient";

export interface BarrierCommandRequest {
  controllerId: string;
  cmdNonce: string;
  commandType: "OPEN_ONLY" | "CLOSE";
  loopAOccupied: boolean;
  loopBOccupied: boolean;
  issuedAt: string;
  ttlSeconds?: number;
}

export interface BarrierCommandOutcome {
  controllerId: string;
  cmdNonce: string;
  outcome:
    | "RELAY_PULSED"
    | "IDEMPOTENT_DUPLICATE"
    | "STALE_COMMAND_EXPIRED"
    | "NO_VEHICLE_ON_LOOP_A"
    | "LOOP_B_SAFETY_INHIBIT";
  relayPulseMs: number;
  relayCoilTarget: string;
  hardwareInterlockEngaged: boolean;
}

export interface EdgeOtaState {
  controllerId: string;
  activeSlot: "A" | "B";
  targetSlot: "A" | "B";
  currentVersion: string;
  pendingVersion?: string | null;
  upgradeAvailable: boolean;
  otaStatus: "HEALTHY" | "TRIAL_BOOTING" | "ROLLED_BACK" | "THERMAL_DEFERRED";
}

export function shouldTriggerWatchdogRollback(params: {
  serialBusHealthy: boolean;
  tlsMqttHealthy: boolean;
  secondsSinceBoot: number;
  crashLoopDetected: boolean;
}): boolean {
  return (
    params.crashLoopDetected ||
    params.secondsSinceBoot > 30 ||
    !params.serialBusHealthy ||
    !params.tlsMqttHealthy
  );
}

export const edgeHardwareService = {
  sendBarrierCommand(req: BarrierCommandRequest): Promise<BarrierCommandOutcome> {
    return apiClient.post<BarrierCommandOutcome>("/v1/edge/barrier/command", req);
  },

  evaluateOtaWatchdog(payload: {
    controllerId: string;
    serialBusHealthy: boolean;
    tlsMqttHealthy: boolean;
    secondsSinceBoot: number;
    crashLoopDetected?: boolean;
  }): Promise<EdgeOtaState> {
    return apiClient.post<EdgeOtaState>("/v1/edge/ota/watchdog-evaluate", payload);
  },
};
