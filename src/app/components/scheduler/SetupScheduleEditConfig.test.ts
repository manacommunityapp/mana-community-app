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
});
