import { describe, it, expect, vi, beforeEach } from "vitest";
import { sosService } from "./sosService";
import { apiClient } from "../common/apiClient";

vi.mock("../common/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("Compact 2G Lift SOS & Geo-Targeted Tower Evacuation Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("encodes <90B compact lift SOS frame and posts with nearest-guard siren override", async () => {
    const frame = sosService.encodeCompactSosFrame({
      communityId: 10,
      residentId: 205,
      towerBlock: "C",
      locationCode: "LIFT-2",
      typeCode: "L",
      epochSec: 1764252000,
      idempotencyKey: "sos-lift-c2-99",
    });
    expect(frame.length).toBeLessThan(90);
    expect(frame).toBe("SOS1|10|205|C|LIFT-2|L|1764252000|sos-lift-c2-99");

    (apiClient.post as any).mockResolvedValueOnce({
      deduplicated: false,
      sirenOverride: true,
      nearestGuardId: 901,
    });
    const res = await sosService.triggerCompactSos(frame, "COMPACT_2G", 901);
    expect(res.sirenOverride).toBe(true);
    expect(apiClient.post).toHaveBeenCalledWith("/emergency/sos/compact", {
      rawFrame: frame,
      ingestChannel: "COMPACT_2G",
      nearestGuardId: 901,
    });
  });

  it("dispatches Tower-scoped evacuation broadcast and updates assembly muster roster", async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      totalAlerted: 3,
      computeTimeMs: 4,
      smsFallbackPhones: ["+919900112233", "+919811112222"],
    });
    const evac = await sosService.broadcastTowerEvacuation({
      towerBlock: "C",
      emergencyType: "GAS_LEAK",
      message: "Evacuate Tower C immediately",
      assemblyPoint: "Cricket Lawn",
    });
    expect(evac.totalAlerted).toBe(3);
    expect(evac.computeTimeMs).toBeLessThan(2000);
  });
});
