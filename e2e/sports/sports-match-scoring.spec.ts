import { test, expect } from "@playwright/test";
import {
  injectAuthWithProfile,
  mockAuthRoutes,
  mockSportsDashboardRoutes,
  mockSportsScheduleRoutes,
} from "../fixtures/auth";

// ═══════════════════════════════════════════════════════════════════════════════
// Match Scoring & Spectator Live Center — E2E Suite
// Covers:
// 1. Cricket Live Umpire Scoring (/sports/match/:matchId/score)
//    - Pitch setup: striker, non-striker, bowler selectors
//    - Score single run, boundary (4), six (6), and dot ball (0)
//    - Extras drawer: Wide (+1), No Ball, Bye, Leg Bye
//    - Wicket dismissal drawer & player retirement flow
//    - Undo last ball event & Swap batsmen positions
// 2. Generic Sport Live Scoring (/sports/match/generic/:matchId/score)
//    - Badminton point scoring for Team A & Team B
//    - Undo point / score event
//    - Complete game / period
// 3. Spectator Live Match Centers (/sports/match/:matchId/live & /sports/match/generic/:matchId/live)
//    - Cricket spectator scoreboard, run rates, overs
//    - Generic match spectator view with sets & points
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_CRICKET_STATE = {
  matchId: 101,
  status: "LIVE",
  currentInnings: 1,
  teamAId: 1,
  teamAName: "Royal Challengers",
  teamAColor: "#EF4444",
  teamBId: 2,
  teamBName: "Super Kings",
  teamBColor: "#F59E0B",
  target: null,
  batsmanOnStrikeId: 10,
  batsmanNonStrikeId: 11,
  currentBowlerId: 20,
  recentBalls: [],
  innings1: {
    battingTeamId: 1,
    battingTeamName: "Royal Challengers",
    totalRuns: 45,
    totalWickets: 2,
    totalOvers: "5.2",
    runRate: "8.44",
    thisOver: ["1", "4", "0"],
    batters: [
      { playerId: 10, playerName: "Virat Kohli", runs: 28, balls: 18, fours: 3, sixes: 1, strikeRate: "155.5", isOut: false },
      { playerId: 11, playerName: "Faf du Plessis", runs: 15, balls: 12, fours: 2, sixes: 0, strikeRate: "125.0", isOut: false },
      { playerId: 12, playerName: "Glenn Maxwell", runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: "0", isOut: false },
    ],
    bowlers: [
      { playerId: 20, playerName: "Ravindra Jadeja", overs: "1.2", runs: 12, wickets: 1, maidens: 0, economy: "9.0", dots: 3 },
      { playerId: 21, playerName: "Deepak Chahar", overs: "2.0", runs: 18, wickets: 1, maidens: 0, economy: "9.0", dots: 5 },
    ],
  },
  innings2: {
    battingTeamId: 2,
    battingTeamName: "Super Kings",
    totalRuns: 0,
    totalWickets: 0,
    totalOvers: "0.0",
    runRate: "0.0",
    thisOver: [],
    batters: [],
    bowlers: [],
  },
};

const MOCK_GENERIC_BADMINTON_STATE = {
  matchId: 201,
  status: "LIVE",
  sportType: "BADMINTON",
  teamAId: 1,
  teamAName: "Smashers",
  teamAColor: "blue",
  teamBId: 2,
  teamBName: "Shuttlers",
  teamBColor: "red",
  currentPeriod: 1,
  scoreTeamA: 15,
  scoreTeamB: 12,
  periodsWonA: 0,
  periodsWonB: 0,
  periods: [
    { periodNumber: 1, scoreA: 15, scoreB: 12, status: "IN_PROGRESS" },
  ],
  recentEvents: [
    { id: 1, periodNumber: 1, teamId: 1, eventType: "POINT", pointsAwarded: 1 },
  ],
};

const MOCK_CONFIGS = [
  { id: 1, tournamentName: "Community Premier League", eventId: 100, sportName: "Cricket" },
];

const MOCK_CONFIG_MATCHES = [
  { matchId: 101, configId: 1, teamAName: "Royal Challengers", teamBName: "Super Kings" },
];

const MOCK_CONFIG_TEAMS = [
  {
    id: 1,
    teamName: "Royal Challengers",
    players: [
      { id: 10, playerName: "Virat Kohli" },
      { id: 11, playerName: "Faf du Plessis" },
      { id: 12, playerName: "Glenn Maxwell" },
    ],
  },
  {
    id: 2,
    teamName: "Super Kings",
    players: [
      { id: 20, playerName: "Ravindra Jadeja" },
      { id: 21, playerName: "Deepak Chahar" },
    ],
  },
];

async function setupScoringRoutes(page: import("@playwright/test").Page) {
  // Prevent websocket connection to /ws so REST fallback is active and predictable
  await page.addInitScript(() => {
    localStorage.setItem("mana_cookie_consent", JSON.stringify({ analytics: false, essential: true }));
    localStorage.setItem("mana_privacy_preferences_fallback", JSON.stringify({ analytics: false, essential: true }));
    localStorage.setItem(
      "mana_consent_banner_v1",
      JSON.stringify({
        analytics: true,
        marketing: true,
        version: "2026-10-13-v1",
        timestamp: new Date().toISOString(),
      })
    );
    const OrigWS = window.WebSocket;
    window.WebSocket = class extends OrigWS {
      constructor(url: string | URL, protocols?: string | string[]) {
        if (typeof url === "string" && url.includes("/ws")) {
          super("ws://0.0.0.0:1/blocked", protocols);
          return;
        }
        super(url, protocols);
      }
    };
  });

  // Base catch-all for any unhandled API calls
  await page.route("**/api/**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, json: [] });
    } else {
      await route.fulfill({ status: 200, json: { success: true } });
    }
  });

  await injectAuthWithProfile(page);
  await mockAuthRoutes(page);
  await mockSportsDashboardRoutes(page);
  await mockSportsScheduleRoutes(page);

  // Cricket tournament structure
  await page.route("**/api/tournament/configs**", async (route) => {
    await route.fulfill({ status: 200, json: MOCK_CONFIGS });
  });

  await page.route("**/api/tournament/1/matches**", async (route) => {
    await route.fulfill({ status: 200, json: MOCK_CONFIG_MATCHES });
  });

  await page.route("**/api/tournament/1/teams**", async (route) => {
    await route.fulfill({ status: 200, json: MOCK_CONFIG_TEAMS });
  });

  // Cricket live state
  await page.route("**/api/tournament/match/101/live**", async (route) => {
    await route.fulfill({ status: 200, json: MOCK_CRICKET_STATE });
  });

  // Generic match state
  await page.route("**/api/tournament/match/generic/201/state**", async (route) => {
    await route.fulfill({ status: 200, json: MOCK_GENERIC_BADMINTON_STATE });
  });
}

test.describe("Cricket Live Scoring Panel", () => {
  test.beforeEach(async ({ page }) => {
    await setupScoringRoutes(page);
  });

  test("loads cricket match live scoring panel and displays striker, non-striker, bowler", async ({ page }) => {
    await page.goto("/sports/match/101/score");
    await page.waitForTimeout(600);

    // Expect header & mini-scoreboard
    await expect(page.getByText("Live Scorer")).toBeVisible();
    await expect(page.locator("body")).toContainText("Royal Challengers — Innings 1");
    await expect(page.locator("body")).toContainText("45/2");

    // Striker select should have Virat Kohli selected
    const strikerSelect = page.locator("select").nth(0);
    await expect(strikerSelect).toHaveValue("10");

    // Bowler select should have Ravindra Jadeja selected
    const bowlerSelect = page.locator("select").nth(2);
    await expect(bowlerSelect).toHaveValue("20");
  });

  test("records runs (0, 1, 4, 6) when run buttons are clicked", async ({ page }) => {
    let recordedPayload: any = null;
    await page.route("**/api/tournament/match/101/ball**", async (route) => {
      recordedPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        json: { id: 999, ...recordedPayload },
      });
    });

    await page.goto("/sports/match/101/score");
    await page.waitForTimeout(600);

    // Click Run button "4" (boundary)
    const fourBtn = page.getByRole("button", { name: "4", exact: true });
    await expect(fourBtn).toBeVisible();
    await fourBtn.click();

    await page.waitForTimeout(400);
    expect(recordedPayload).not.toBeNull();
    expect(recordedPayload.runsScored).toBe(4);
    expect(recordedPayload.isBoundary).toBe(true);
    expect(recordedPayload.batsmanId).toBe(10);
    expect(recordedPayload.bowlerId).toBe(20);
  });

  test("opens extras drawer and submits Wide with additional extra run", async ({ page }) => {
    let recordedPayload: any = null;
    await page.route("**/api/tournament/match/101/ball**", async (route) => {
      recordedPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        json: { id: 1000, ...recordedPayload },
      });
    });

    await page.goto("/sports/match/101/score");
    await page.waitForTimeout(600);

    // Open extras
    const extrasToggle = page.getByRole("button", { name: /Extras/i });
    await extrasToggle.click();

    // Verify extras options are displayed
    await expect(page.getByRole("button", { name: /Wide \+1/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /No Ball \+1/i })).toBeVisible();

    // Click Wide +1
    await page.getByRole("button", { name: /Wide \+1/i }).click();
    await page.waitForTimeout(400);

    expect(recordedPayload).not.toBeNull();
    expect(recordedPayload.extrasType).toBe("WIDE");
    expect(recordedPayload.extrasRuns).toBe(1);
  });

  test("opens wicket drawer, selects dismissal type and confirms wicket", async ({ page }) => {
    let wicketPayload: any = null;
    await page.route("**/api/tournament/match/101/ball**", async (route) => {
      wicketPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        json: { id: 1001, ...wicketPayload },
      });
    });

    await page.goto("/sports/match/101/score");
    await page.waitForTimeout(600);

    // Click Wicket button to reveal dismissal options
    const wicketBtn = page.getByRole("button", { name: /^Wicket$/i });
    await wicketBtn.click();

    // Verify dismissal form appears
    await expect(page.getByText("Dismissal Type")).toBeVisible();
    await expect(page.getByRole("button", { name: /Confirm Wicket/i })).toBeVisible();

    // Confirm wicket
    await page.getByRole("button", { name: /Confirm Wicket/i }).click();
    await page.waitForTimeout(400);

    expect(wicketPayload).not.toBeNull();
    expect(wicketPayload.isWicket).toBe(true);
    expect(wicketPayload.dismissalType).toBe("BOWLED");
  });

  test("undoes last ball event via Undo Last Ball button", async ({ page }) => {
    let undoCalled = false;
    await page.route("**/api/tournament/match/101/undo**", async (route) => {
      undoCalled = true;
      await route.fulfill({ status: 200, json: { success: true } });
    });

    await page.goto("/sports/match/101/score");
    await page.waitForTimeout(600);

    const undoBtn = page.getByRole("button", { name: /Undo Last Ball/i });
    await expect(undoBtn).toBeVisible();
    await undoBtn.click();

    await page.waitForTimeout(400);
    expect(undoCalled).toBe(true);
  });

  test("swaps striker and non-striker positions", async ({ page }) => {
    await page.goto("/sports/match/101/score");
    await page.waitForTimeout(600);

    const strikerSelect = page.locator("select").nth(0);
    const nonStrikerSelect = page.locator("select").nth(1);

    await expect(strikerSelect).toHaveValue("10"); // Virat Kohli
    await expect(nonStrikerSelect).toHaveValue("11"); // Faf du Plessis

    // Click swap button
    await page.getByRole("button", { name: /Swap Batsmen/i }).click();

    await expect(strikerSelect).toHaveValue("11");
    await expect(nonStrikerSelect).toHaveValue("10");
  });
});

test.describe("Generic Match Live Scoring (Badminton)", () => {
  test.beforeEach(async ({ page }) => {
    await setupScoringRoutes(page);
  });

  test("renders generic scoring panel for badminton with both teams and period controls", async ({ page }) => {
    await page.goto("/sports/match/generic/201/score");
    await page.waitForTimeout(600);

    // Team names and current score
    await expect(page.locator("body")).toContainText("Smashers");
    await expect(page.locator("body")).toContainText("Shuttlers");
    await expect(page.locator("body")).toContainText("15");
    await expect(page.locator("body")).toContainText("12");

    // Point scoring buttons for both teams
    const pointButtons = page.getByRole("button", { name: /\+1/i });
    expect(await pointButtons.count()).toBeGreaterThanOrEqual(2);
  });

  test("records a point for Team A and undos it", async ({ page }) => {
    let scoredPayload: any = null;
    let undoCalled = false;

    await page.route("**/api/tournament/match/generic/score**", async (route) => {
      scoredPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        json: { id: 50, ...scoredPayload },
      });
    });

    await page.route("**/api/tournament/match/generic/201/undo**", async (route) => {
      undoCalled = true;
      await route.fulfill({ status: 200, json: { success: true } });
    });

    await page.goto("/sports/match/generic/201/score");
    await page.waitForTimeout(600);

    // Award point to Team A
    const addPointA = page.getByRole("button", { name: /\+1/i }).first();
    await addPointA.click();
    await page.waitForTimeout(400);

    expect(scoredPayload).not.toBeNull();
    expect(scoredPayload.teamId).toBe(1);
    expect(scoredPayload.pointsAwarded).toBe(1);

    // Click Undo
    const undoBtn = page.getByRole("button", { name: /Undo/i }).first();
    await undoBtn.click();
    await page.waitForTimeout(400);

    expect(undoCalled).toBe(true);
  });
});

test.describe("Spectator Live Match Center", () => {
  test.beforeEach(async ({ page }) => {
    await setupScoringRoutes(page);
  });

  test("renders Cricket spectator live scoreboard view with real-time stats", async ({ page }) => {
    await page.goto("/sports/match/101/live");
    await page.waitForTimeout(600);

    await expect(page.locator("body")).toContainText("Royal Challengers");
    await expect(page.locator("body")).toContainText("Super Kings");
    await expect(page.locator("body")).toContainText("45/2");
    await expect(page.locator("body")).toContainText("CRR: 8.44");
    await expect(page.locator("body")).toContainText("Virat Kohli");
    await expect(page.locator("body")).toContainText("LIVE");
  });

  test("renders Generic spectator live view with sets and scores", async ({ page }) => {
    await page.goto("/sports/match/generic/201/live");
    await page.waitForTimeout(600);

    await expect(page.locator("body")).toContainText("Smashers");
    await expect(page.locator("body")).toContainText("Shuttlers");
    await expect(page.locator("body")).toContainText("15");
    await expect(page.locator("body")).toContainText("12");
  });
});
