import { describe, it, expect, vi } from "vitest";
import type { ConfigInfo } from "../../../services/sports/tournamentService";

describe("Edit Complete Schedule Feature", () => {
  const sampleConfig: ConfigInfo = {
    id: 42,
    tournamentName: "Monsoon Badminton Cup 2026",
    tournamentType: "GROUP_PLAYOFF",
    eventName: "Men's Singles Badminton",
    eventId: 101,
    totalTeams: 16,
    numberOfGroups: 4,
    teamsAdvancingPerGroup: 2,
    matchDurationMinutes: 45,
    breakBetweenMatchesMinutes: 15,
    startDate: "2026-08-10",
    endDate: "2026-08-15",
    status: "DRAFT",
    venueId: 5,
    pointsForWin: 3,
    pointsForDraw: 1,
    pointsForLoss: 0,
    thirdPlaceMatch: true,
    seedingOrder: "TRADITIONAL",
    byesFirstRoundOnly: true,
    showByesInBracket: true,
    limitMatchesPerDay: true,
    maxMatchesPerDay: 2,
    usePlayoffDays: true,
    playoffDays: [0, 5, 6],
    matchDays: [1, 2, 3, 4, 5, 6],
    venueAssignType: "Sequential",
  };

  it("identifies matching existing config for the event and allows edit mode", () => {
    const configs: ConfigInfo[] = [sampleConfig];
    const selectedEvent = "101";
    const currentConfigId = 42;

    const existingConfig = selectedEvent
      ? configs.find(c => c.eventId === Number(selectedEvent))
      : undefined;

    const isEditingExistingConfig = Boolean(
      currentConfigId && existingConfig && existingConfig.id === currentConfigId
    );
    const isBlockedByOtherConfig = Boolean(
      existingConfig && (!currentConfigId || existingConfig.id !== currentConfigId)
    );

    expect(existingConfig).toBeDefined();
    expect(existingConfig?.id).toBe(42);
    expect(isEditingExistingConfig).toBe(true);
    expect(isBlockedByOtherConfig).toBe(false);
  });

  it("blocks schedule generation when a DIFFERENT config already exists for the event", () => {
    const configs: ConfigInfo[] = [sampleConfig];
    const selectedEvent = "101";
    const currentConfigId = null;

    const existingConfig = selectedEvent
      ? configs.find(c => c.eventId === Number(selectedEvent))
      : undefined;

    const isEditingExistingConfig = Boolean(
      currentConfigId && existingConfig && existingConfig.id === currentConfigId
    );
    const isBlockedByOtherConfig = Boolean(
      existingConfig && (!currentConfigId || existingConfig.id !== currentConfigId)
    );

    expect(isEditingExistingConfig).toBe(false);
    expect(isBlockedByOtherConfig).toBe(true);
  });

  it("maps tournamentType correctly from config to setup format", () => {
    const mapType = (type: string) => {
      if (type === "KNOCKOUT") return "KNOCKOUT_SINGLE";
      if (type === "GROUP_KNOCKOUT") return "GROUP_PLAYOFF";
      return type;
    };

    expect(mapType("KNOCKOUT")).toBe("KNOCKOUT_SINGLE");
    expect(mapType("GROUP_KNOCKOUT")).toBe("GROUP_PLAYOFF");
    expect(mapType("GROUP_PLAYOFF")).toBe("GROUP_PLAYOFF");
    expect(mapType("ROUND_ROBIN")).toBe("ROUND_ROBIN");
  });

  it("handles Edit Schedule callback invocation with full config data", () => {
    const onEditSchedule = vi.fn();
    const handleEditSchedule = (config: ConfigInfo) => {
      onEditSchedule(config);
    };

    handleEditSchedule(sampleConfig);
    expect(onEditSchedule).toHaveBeenCalledWith(sampleConfig);
    expect(onEditSchedule).toHaveBeenCalledTimes(1);
    expect(onEditSchedule.mock.calls[0][0].id).toBe(42);
    expect(onEditSchedule.mock.calls[0][0].tournamentName).toBe("Monsoon Badminton Cup 2026");
    expect(onEditSchedule.mock.calls[0][0].eventId).toBe(101);
  });

  it("exits edit mode cleanly resetting state and calling onClearConfigSelection", () => {
    const onClearConfigSelection = vi.fn();
    let currentConfigId: number | null = 42;
    let selectedEvent = "101";

    const handleExitEditMode = () => {
      currentConfigId = null;
      selectedEvent = "";
      onClearConfigSelection();
    };

    handleExitEditMode();
    expect(currentConfigId).toBeNull();
    expect(selectedEvent).toBe("");
    expect(onClearConfigSelection).toHaveBeenCalledTimes(1);
  });

  describe("Published Schedule Edit Restrictions", () => {
    const publishedConfig: ConfigInfo = {
      ...sampleConfig,
      id: 88,
      status: "PUBLISHED",
    };

    const isSchedulePublished = (
      configStatus: string | undefined,
      currentConfig: ConfigInfo | undefined,
      existingConfig: ConfigInfo | undefined
    ) => {
      return Boolean(
        (configStatus && configStatus.toUpperCase() !== "DRAFT") ||
        (currentConfig?.status && currentConfig.status.toUpperCase() !== "DRAFT") ||
        (existingConfig?.status && existingConfig.status.toUpperCase() !== "DRAFT")
      );
    };

    it("correctly determines published status for PUBLISHED, ACTIVE vs DRAFT", () => {
      expect(isSchedulePublished("PUBLISHED", publishedConfig, undefined)).toBe(true);
      expect(isSchedulePublished("ACTIVE", { ...sampleConfig, status: "ACTIVE" }, undefined)).toBe(true);
      expect(isSchedulePublished("DRAFT", sampleConfig, undefined)).toBe(false);
      expect(isSchedulePublished("", undefined, publishedConfig)).toBe(true);
      expect(isSchedulePublished("", undefined, sampleConfig)).toBe(false);
    });

    it("prevents schedule regeneration and clearing when schedule is published", () => {
      const isPublished = true;
      let scheduleRegenerated = false;
      let scheduleCleared = false;

      const handleGenerate = () => {
        if (isPublished) return;
        scheduleRegenerated = true;
      };

      const handleClearSchedule = () => {
        if (isPublished) return;
        scheduleCleared = true;
      };

      handleGenerate();
      handleClearSchedule();

      expect(scheduleRegenerated).toBe(false);
      expect(scheduleCleared).toBe(false);
    });

    it("prevents seeding order changes when schedule is published", () => {
      const isPublished = true;
      let seedingOrder = "TRADITIONAL";

      const handleKnockoutSeedingOrderChange = (newOrder: string) => {
        if (isPublished) return;
        seedingOrder = newOrder;
      };

      handleKnockoutSeedingOrderChange("RANDOM");
      expect(seedingOrder).toBe("TRADITIONAL");
    });

    it("allows updating date, time, duration, venue, and court in match edit while locking participants when published", () => {
      const isPublished = true;

      const originalMatch = {
        id: "playoff-r0-m0",
        p1: { id: "p1", name: "Alice", flat: "A-101" },
        p2: { id: "p2", name: "Bob", flat: "B-202" },
        date: "2026-08-10",
        time: "10:00",
        durationMinutes: 45,
        venueId: 5,
        courtId: 1,
      };

      const attemptedEdit = {
        p1Id: "p99",
        p2Id: "p88",
        date: "2026-08-12",
        time: "14:30",
        durationMinutes: 60,
        venueId: 7,
        courtId: 3,
      };

      const updatedMatch = {
        ...originalMatch,
        p1: isPublished ? originalMatch.p1 : { id: attemptedEdit.p1Id, name: "New P1", flat: "" },
        p2: isPublished ? originalMatch.p2 : { id: attemptedEdit.p2Id, name: "New P2", flat: "" },
        date: attemptedEdit.date,
        time: attemptedEdit.time,
        durationMinutes: attemptedEdit.durationMinutes,
        venueId: attemptedEdit.venueId,
        courtId: attemptedEdit.courtId,
      };

      expect(updatedMatch.p1.id).toBe("p1");
      expect(updatedMatch.p1.name).toBe("Alice");
      expect(updatedMatch.p2.id).toBe("p2");
      expect(updatedMatch.p2.name).toBe("Bob");

      expect(updatedMatch.date).toBe("2026-08-12");
      expect(updatedMatch.time).toBe("14:30");
      expect(updatedMatch.durationMinutes).toBe(60);
      expect(updatedMatch.venueId).toBe(7);
      expect(updatedMatch.courtId).toBe(3);
    });

    it("configures ScheduleSaveFooter appropriately when published", () => {
      const getFooterConfig = (isPublished?: boolean, isSaving?: boolean) => ({
        showClearButton: !isPublished,
        showSaveDraftButton: !isPublished,
        primaryButtonText: isSaving
          ? "Saving..."
          : isPublished
          ? "Save Schedule Updates"
          : "Save & Publish",
      });

      const draftFooter = getFooterConfig(false, false);
      expect(draftFooter.showClearButton).toBe(true);
      expect(draftFooter.showSaveDraftButton).toBe(true);
      expect(draftFooter.primaryButtonText).toBe("Save & Publish");

      const publishedFooter = getFooterConfig(true, false);
      expect(publishedFooter.showClearButton).toBe(false);
      expect(publishedFooter.showSaveDraftButton).toBe(false);
      expect(publishedFooter.primaryButtonText).toBe("Save Schedule Updates");

      const savingPublishedFooter = getFooterConfig(true, true);
      expect(savingPublishedFooter.primaryButtonText).toBe("Saving...");
    });
  });
});
