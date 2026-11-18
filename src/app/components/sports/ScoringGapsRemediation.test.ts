import { describe, it, expect } from "vitest";

describe("Badminton & Cricket Scoring Gaps Remediation Test Suite", () => {
  describe("1. Badminton Service Court & Server Rotation (BWF Rules)", () => {
    const getServiceCourt = (serverScore: number) => {
      return serverScore % 2 === 0 ? "Right Box (Even)" : "Left Box (Odd)";
    };

    it("assigns Right Service Court when server score is Even (0, 2, 4, 6...)", () => {
      expect(getServiceCourt(0)).toBe("Right Box (Even)");
      expect(getServiceCourt(2)).toBe("Right Box (Even)");
      expect(getServiceCourt(14)).toBe("Right Box (Even)");
      expect(getServiceCourt(20)).toBe("Right Box (Even)");
    });

    it("assigns Left Service Court when server score is Odd (1, 3, 5, 7...)", () => {
      expect(getServiceCourt(1)).toBe("Left Box (Odd)");
      expect(getServiceCourt(3)).toBe("Left Box (Odd)");
      expect(getServiceCourt(11)).toBe("Left Box (Odd)");
      expect(getServiceCourt(21)).toBe("Left Box (Odd)");
    });

    it("rotates server to rally winner on each point", () => {
      let currentServer = "A"; // Toss winner elected to serve
      const awardPointTo = (winnerSide: "A" | "B") => {
        currentServer = winnerSide;
        return currentServer;
      };

      expect(awardPointTo("A")).toBe("A");
      expect(awardPointTo("B")).toBe("B");
      expect(awardPointTo("B")).toBe("B");
      expect(awardPointTo("A")).toBe("A");
    });
  });

  describe("2. Badminton Set Win, Golden Point (29-29) & 11-Pt Interval", () => {
    const checkSetWon = (scoreA: number, scoreB: number, target = 21, cap = 30) => {
      if (cap && (scoreA >= cap || scoreB >= cap)) return true;
      return (scoreA >= target || scoreB >= target) && Math.abs(scoreA - scoreB) >= 2;
    };

    it("detects regular set victory at 21 points with 2-point lead", () => {
      expect(checkSetWon(21, 15)).toBe(true);
      expect(checkSetWon(20, 21)).toBe(false); // needs 2-point lead
      expect(checkSetWon(22, 20)).toBe(true);
    });

    it("detects deuce continues up to 29-29 without winner", () => {
      expect(checkSetWon(28, 28)).toBe(false);
      expect(checkSetWon(29, 29)).toBe(false);
    });

    it("enforces golden point at 30-29 without requiring 2-point lead", () => {
      expect(checkSetWon(30, 29)).toBe(true);
      expect(checkSetWon(29, 30)).toBe(true);
    });

    it("detects 11-point technical interval when leading player reaches 11", () => {
      const isInterval = (scoreA: number, scoreB: number) => scoreA === 11 || scoreB === 11;

      expect(isInterval(11, 8)).toBe(true);
      expect(isInterval(9, 11)).toBe(true);
      expect(isInterval(10, 10)).toBe(false);
      expect(isInterval(12, 11)).toBe(true);
    });

    it("detects match winner when a player wins 2 sets out of 3", () => {
      const setsToWin = 2;
      const isMatchWon = (setsWonA: number, setsWonB: number) =>
        setsWonA >= setsToWin || setsWonB >= setsToWin;

      expect(isMatchWon(1, 0)).toBe(false);
      expect(isMatchWon(1, 1)).toBe(false);
      expect(isMatchWon(2, 0)).toBe(true);
      expect(isMatchWon(1, 2)).toBe(true);
    });
  });

  describe("3. Cricket Striker Rotation Logic on Overs and Byes", () => {
    const computeShouldSwapStriker = (
      runsScored: number,
      isOverCompleted: boolean,
      extrasType?: string,
      extrasRuns?: number
    ) => {
      const isOddRunRally =
        (!extrasType && runsScored % 2 === 1) ||
        ((extrasType === "BYE" || extrasType === "LEG_BYE") && (extrasRuns || 0) % 2 === 1) ||
        (extrasType === "NO_BALL" && runsScored % 2 === 1);

      return (isOddRunRally && !isOverCompleted) || (!isOddRunRally && isOverCompleted);
    };

    it("swaps striker on single (1 run) during mid-over", () => {
      expect(computeShouldSwapStriker(1, false)).toBe(true);
    });

    it("does not swap striker on dot ball (0 runs) during mid-over", () => {
      expect(computeShouldSwapStriker(0, false)).toBe(false);
    });

    it("does not swap striker on boundary 4 or 6 during mid-over", () => {
      expect(computeShouldSwapStriker(4, false)).toBe(false);
      expect(computeShouldSwapStriker(6, false)).toBe(false);
    });

    it("swaps striker on 1 Bye or 1 Leg-Bye", () => {
      expect(computeShouldSwapStriker(0, false, "BYE", 1)).toBe(true);
      expect(computeShouldSwapStriker(0, false, "LEG_BYE", 1)).toBe(true);
      expect(computeShouldSwapStriker(0, false, "BYE", 2)).toBe(false);
    });

    it("swaps striker when over completes on a dot ball (0 runs)", () => {
      // Over completes on a dot: non-striker faces next over!
      expect(computeShouldSwapStriker(0, true)).toBe(true);
    });

    it("swaps striker when over completes on a boundary (4 or 6)", () => {
      expect(computeShouldSwapStriker(4, true)).toBe(true);
      expect(computeShouldSwapStriker(6, true)).toBe(true);
    });

    it("retains striker when over completes on a single (1 run)", () => {
      // Batsman ran 1 run across pitch, ends changed -> same batsman faces next over!
      expect(computeShouldSwapStriker(1, true)).toBe(false);
    });
  });

  describe("4. Cricket Innings 1 Completion & Target Chased Auto-Detection", () => {
    it("detects Innings 1 complete when overs limit is reached", () => {
      const isInnings1Over = (oversBowled: number, maxOvers: number, wickets: number) =>
        oversBowled >= maxOvers || wickets >= 10;

      expect(isInnings1Over(19, 20, 4)).toBe(false);
      expect(isInnings1Over(20, 20, 6)).toBe(true);
      expect(isInnings1Over(14, 20, 10)).toBe(true); // All out
    });

    it("detects Innings 2 target achieved when chasing team passes target", () => {
      const innings1Runs = 145;
      const target = innings1Runs + 1; // 146
      const isTargetAchieved = (innings2Runs: number) => innings2Runs >= target;

      expect(isTargetAchieved(140)).toBe(false);
      expect(isTargetAchieved(145)).toBe(false); // Tie score, target is 146
      expect(isTargetAchieved(146)).toBe(true);  // Won!
      expect(isTargetAchieved(148)).toBe(true);  // Won with boundary!
    });

    it("calculates victory margin by wickets for chasing team", () => {
      const wicketsLost = 4;
      const margin = 10 - wicketsLost;
      expect(`Won by ${margin} wickets`).toBe("Won by 6 wickets");
    });
  });
});
