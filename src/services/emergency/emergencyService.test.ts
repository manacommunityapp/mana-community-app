import { describe, it, expect, beforeEach } from "vitest";
import { emergencyService } from "./emergencyService";

if (typeof globalThis.localStorage === "undefined") {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    length: 0,
  } as unknown as Storage;
}

describe("EmergencyService - 10-Stage Safety-Critical Response Lifecycle", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should process full lifecycle from SOS trigger to resolution and audit report", () => {
    // 1. SOS Trigger & Location Capture
    const incident = emergencyService.triggerSOS({
      category: "MEDICAL",
      tower: "A",
      flatNumber: "502",
      description: "Severe breathing difficulty",
      reportedBy: "Sandesh Patil",
      reportedByPhone: "+91 98450 11223",
    });

    expect(incident.id).toBeDefined();
    expect(incident.status).toBe("TRIGGERED");
    expect(incident.severity).toBe("CRITICAL");
    expect(incident.tower).toBe("A");
    expect(incident.flatNumber).toBe("502");

    // 2. Acknowledge by Control Room
    const ack = emergencyService.acknowledgeIncident(incident.id, "Security Supervisor Rao");
    expect(ack?.status).toBe("ACKNOWLEDGED");
    expect(ack?.acknowledgedAt).toBeDefined();

    // 3. Auto Dispatch Responder
    const dispatched = emergencyService.autoDispatch(incident.id, "Nurse Anita", "Paramedic");
    expect(dispatched?.status).toBe("ASSIGNED");
    expect(dispatched?.assignedResponder).toBe("Nurse Anita");
    expect(dispatched?.assignedAt).toBeDefined();

    // 4. Responder Sets ETA & Goes En Route
    const enRoute = emergencyService.setResponderEta(incident.id, 4);
    expect(enRoute?.status).toBe("RESPONDING");
    expect(enRoute?.etaMinutes).toBe(4);
    expect(enRoute?.enRouteAt).toBeDefined();

    // 5. Watchdog Escalation
    const escalated = emergencyService.escalateIncident(incident.id, "LEVEL_2_SUPERVISOR", "Ambulance required");
    expect(escalated?.status).toBe("ESCALATED");
    expect(escalated?.escalationLevel).toBe("LEVEL_2_SUPERVISOR");
    expect(escalated?.slaBreached).toBe(true);

    // 6. On-Scene Arrival
    const onScene = emergencyService.markOnScene(incident.id);
    expect(onScene?.status).toBe("ON_SCENE");
    expect(onScene?.onSceneAt).toBeDefined();

    // 7. Active Remediation
    const underAction = emergencyService.markUnderAction(incident.id, "Oxygen administered");
    expect(underAction?.status).toBe("UNDER_ACTION");

    // 8. Resolution
    const resolved = emergencyService.resolveIncident(incident.id, "Patient stable");
    expect(resolved?.status).toBe("RESOLVED");
    expect(resolved?.resolvedAt).toBeDefined();

    // 9. Audit Report
    const audit = emergencyService.getAuditReport(incident.id);
    expect(audit).toBeDefined();
    expect(audit?.incident.id).toBe(incident.id);
    expect(audit?.timeToAcknowledgeSeconds).toBeGreaterThanOrEqual(0);
    expect(audit?.timeToOnSceneSeconds).toBeGreaterThanOrEqual(0);
    expect(audit?.totalResolutionTimeSeconds).toBeGreaterThanOrEqual(0);
    expect(audit?.timeline.length).toBeGreaterThanOrEqual(8);
  });
});
