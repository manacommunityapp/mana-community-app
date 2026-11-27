import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  governanceService,
  modPow,
  modInverse,
  blindMessageHex,
  unblindSignatureHex,
} from "./governanceService";
import { pollService } from "../polls/pollService";
import { apiClient } from "../common/apiClient";

vi.mock("../common/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("Governance Secret Ballot, Eligibility & Hybrid AGM Quorum Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("performs Chaumian RSA blind/unblind signature round-trip accurately", () => {
    // Small textbook RSA keypair for deterministic client-side BigInt math test: p=61, q=53 -> n=3233, e=17, d=2753
    const nHex = (3233).toString(16);
    const eHex = (17).toString(16);
    const d = 2753n;
    const n = 3233n;
    const messageHex = (65).toString(16);
    const rHex = (19).toString(16); // gcd(19, 3233) = 1

    const blindedHex = blindMessageHex(messageHex, rHex, eHex, nHex);
    const blindSig = modPow(BigInt("0x" + blindedHex), d, n);
    const unblindedHex = unblindSignatureHex(blindSig.toString(16), rHex, nHex);

    const verified = modPow(BigInt("0x" + unblindedHex), 17n, n);
    expect(verified).toBe(65n);
    expect(modInverse(19n, n) * 19n % n).toBe(1n);
  });

  it("checks flat-level 90-day defaulter eligibility and casts unit-scoped poll vote", async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      eligible: false,
      reasonCode: "DEFAULTED_OVER_90_DAYS",
      overdueInvoiceCount: 1,
      overdueAmount: 6500,
    });
    const elig = await pollService.checkFlatEligibility(77, 100);
    expect(elig.eligible).toBe(false);
    expect(elig.reasonCode).toBe("DEFAULTED_OVER_90_DAYS");

    (apiClient.post as any).mockResolvedValueOnce({ id: 77, totalVotes: 1 });
    await pollService.vote(77, [700], 100);
    expect(apiClient.post).toHaveBeenCalledWith("/polls/77/vote", { optionIds: [700], flatId: 100 });
  });

  it("handles hybrid AGM check-in, proxy revocation, and resolution gating", async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      quorumConfirmed: 25,
      totalEligibleUnits: 100,
      quorumPercentage: 25.0,
      quorumMet: true,
      proxySuperseded: true,
    });

    const checkinRes = await governanceService.checkInAgm(801, 100, "OWNER", "ONLINE_WS");
    expect(checkinRes.quorumMet).toBe(true);
    expect(checkinRes.proxySuperseded).toBe(true);

    (apiClient.post as any).mockResolvedValueOnce({ id: 601, votingStatus: "VOTING_OPEN" });
    const openRes = await governanceService.openResolutionVoting(601, 801);
    expect(openRes.votingStatus).toBe("VOTING_OPEN");
  });
});
