import { describe, it, expect } from "vitest";
import {
  getMatchStage,
  getStageMeta,
  formatRoundStageLabel,
  computeStageProgression,
} from "./sportsStageUtils";

describe("sportsStageUtils", () => {
  describe("getMatchStage", () => {
    it("classifies group, round of 16, quarter, semi, third place, and final matches", () => {
      expect(getMatchStage({ roundName: "GROUP_STAGE", groupName: "Group A" })).toBe("GROUP");
      expect(getMatchStage({ roundName: "ROUND_OF_16" })).toBe("ROUND_OF_16");
      expect(getMatchStage({ roundName: "Quarter-Final 2" })).toBe("QUARTER_FINAL");
      expect(getMatchStage({ roundName: "SEMI_FINAL" })).toBe("SEMI_FINAL");
      expect(getMatchStage({ roundName: "THIRD_PLACE" })).toBe("THIRD_PLACE");
      expect(getMatchStage({ roundName: "FINAL" })).toBe("FINAL");
      expect(getMatchStage({ roundName: "Round 1", matchNumber: 3 })).toBe("ROUND_OF_16");
    });
  });

  describe("formatRoundStageLabel", () => {
    it("uses group name when match belongs to a named group", () => {
      expect(formatRoundStageLabel("GROUP_STAGE", "Group B")).toBe("Group B");
      expect(formatRoundStageLabel("QUARTER_FINAL", "QF 1")).toBe("Quarter-Finals");
    });
  });

  describe("computeStageProgression", () => {
    it("tracks Group Stage -> R16 -> QF -> SF -> Final progression and detects active stage", () => {
      const matches = [
        { id: 1, roundName: "GROUP_STAGE", groupName: "Group A", status: "COMPLETED", teamAName: "A", teamBName: "B" },
        { id: 2, roundName: "GROUP_STAGE", groupName: "Group B", status: "COMPLETED", teamAName: "C", teamBName: "D" },
        { id: 3, roundName: "ROUND_OF_16", status: "COMPLETED", teamAName: "A", teamBName: "D" },
        { id: 4, roundName: "QUARTER_FINAL", status: "COMPLETED", teamAName: "A", teamBName: "E" },
        { id: 5, roundName: "QUARTER_FINAL", status: "SCHEDULED", teamAName: "C", teamBName: "F" },
        { id: 6, roundName: "SEMI_FINAL", status: "SCHEDULED", teamAName: "TBD", teamBName: "TBD" },
        { id: 7, roundName: "FINAL", status: "SCHEDULED", teamAName: "TBD", teamBName: "TBD" },
      ];

      const summary = computeStageProgression(matches);
      expect(summary.stages.map((s) => s.key)).toEqual([
        "GROUP",
        "ROUND_OF_16",
        "QUARTER_FINAL",
        "SEMI_FINAL",
        "FINAL",
      ]);
      expect(summary.stages[0].status).toBe("COMPLETED");
      expect(summary.stages[1].status).toBe("COMPLETED");
      expect(summary.stages[2].status).toBe("IN_PROGRESS");
      expect(summary.stages[3].status).toBe("UPCOMING");
      expect(summary.currentStage?.key).toBe("QUARTER_FINAL");
      expect(summary.headline).toBe("Quarter-Finals (1/2 done)");
      expect(summary.isTournamentCompleted).toBe(false);
    });

    it("prioritizes LIVE stage over earlier in-progress or completed stages", () => {
      const matches = [
        { id: 1, roundName: "GROUP_STAGE", status: "COMPLETED", teamAName: "A", teamBName: "B" },
        { id: 2, roundName: "SEMI_FINAL", status: "LIVE", teamAName: "A", teamBName: "C" },
        { id: 3, roundName: "FINAL", status: "SCHEDULED", teamAName: "TBD", teamBName: "TBD" },
      ];

      const summary = computeStageProgression(matches);
      expect(summary.currentStage?.key).toBe("SEMI_FINAL");
      expect(summary.currentStage?.status).toBe("LIVE");
      expect(summary.headline).toBe("Live in Semi-Finals");
    });

    it("detects upcoming assigned stage right after group stage finishes", () => {
      const matches = [
        { id: 1, roundName: "GROUP_STAGE", status: "COMPLETED", teamAName: "A", teamBName: "B" },
        { id: 2, roundName: "QUARTER_FINAL", status: "SCHEDULED", teamAName: "A", teamBName: "C" },
        { id: 3, roundName: "FINAL", status: "SCHEDULED", teamAName: "TBD", teamBName: "TBD" },
      ];

      const summary = computeStageProgression(matches);
      expect(summary.currentStage?.key).toBe("QUARTER_FINAL");
      expect(summary.headline).toBe("Up Next: Quarter-Finals");
    });

    it("identifies completed tournament and champion name from Final", () => {
      const matches = [
        { id: 1, roundName: "SEMI_FINAL", status: "COMPLETED", teamAName: "Tigers", teamBName: "Lions" },
        {
          id: 2,
          roundName: "FINAL",
          status: "COMPLETED",
          teamAId: 10,
          teamBId: 20,
          teamAName: "Tigers",
          teamBName: "Hawks",
          winnerTeamId: 10,
        },
      ];

      const summary = computeStageProgression(matches);
      expect(summary.isTournamentCompleted).toBe(true);
      expect(summary.championName).toBe("Tigers");
      expect(summary.headline).toBe("Completed · Champion: Tigers");
    });

    it("filters out DRAFT and BYE matches by default", () => {
      const matches = [
        { id: 1, roundName: "ROUND_OF_16", status: "BYE", teamAName: "Alpha", teamBName: "BYE" },
        { id: 2, roundName: "QUARTER_FINAL", status: "DRAFT", teamAName: "Alpha", teamBName: "Beta" },
        { id: 3, roundName: "QUARTER_FINAL", status: "SCHEDULED", teamAName: "Gamma", teamBName: "Delta" },
      ];

      const summary = computeStageProgression(matches);
      expect(summary.stages).toHaveLength(1);
      expect(summary.stages[0].key).toBe("QUARTER_FINAL");
      expect(summary.stages[0].totalMatches).toBe(1);
    });

    it("returns empty state cleanly when no matches exist", () => {
      const summary = computeStageProgression([]);
      expect(summary.stages).toEqual([]);
      expect(summary.currentStage).toBeNull();
      expect(getStageMeta("FINAL").label).toBe("Final");
    });
  });
});
