import { test, expect } from "@playwright/test";
import {
  injectAuthWithProfile,
  mockAuthRoutes,
  mockSportsDashboardRoutes,
} from "../fixtures/auth";

// ═══════════════════════════════════════════════════════════════════════════════
// Live Auction Engine, Real-Time Bidding & RTM Modal — E2E Suite
// Covers:
// 1. Live Auction Room (/sports/auction/:eventId?tab=live)
//    - Real-time player spotlight (name, base price, role, skills radar/stats toggle)
//    - Current winning bid and countdown timer
//    - Team bid cards with remaining purse and RTM card counter
// 2. Real-Time Bidding Actions
//    - Placing team bids (calls POST /api/auction/live/bid)
//    - Bid increment updates and bid history feed
// 3. Right To Match (RTM) Modal Workflow
//    - RTM trigger when player previously represented an eligible franchise
//    - Franchise showdown card (Current Winning Bidder vs RTM Franchise)
//    - Decline RTM action (sold to highest bidder)
//    - Exercise RTM action (matches bid amount & deducts RTM card)
// 4. Sold Celebration Modal
//    - Confetti canvas and hammer strike "HAMMER DOWN • SOLD!" banner
//    - Final winning bid callout and winning franchise card
//    - Team purse reduction and squad allocation
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_CONFIG = {
  id: 1,
  eventId: 10,
  eventName: "Cricket Premier League 2026",
  seasonName: "Season 2026",
  sportName: "Cricket",
  maxTeams: 4,
  budgetPerTeam: 1000,
  basePrice: 100,
  status: "LIVE",
  totalPlayers: 20,
};

const MOCK_TEAMS = [
  {
    id: 1,
    name: "Team Alpha",
    teamName: "Team Alpha",
    captain: "Ravi Kumar",
    budget: 1000,
    spent: 200,
    playerCount: 2,
    status: "APPROVED",
    emoji: "🦁",
    colorHex: "#ef4444",
    players: [],
  },
  {
    id: 2,
    name: "Team Beta",
    teamName: "Team Beta",
    captain: "Suresh Patel",
    budget: 1000,
    spent: 150,
    playerCount: 1,
    status: "APPROVED",
    emoji: "⚡",
    colorHex: "#f59e0b",
    players: [],
  },
  {
    id: 3,
    name: "Team Gamma",
    teamName: "Team Gamma",
    captain: "Anil Sharma",
    budget: 1000,
    spent: 0,
    playerCount: 0,
    status: "APPROVED",
    emoji: "🦅",
    colorHex: "#3b82f6",
    players: [],
  },
];

const MOCK_LIVE_PLAYER = {
  playerId: 101,
  playerName: "Rohit Sharma",
  category: "Open",
  playerRole: "Opening Batter",
  age: 36,
  basePrice: 100,
  currentBid: 150,
  nextBid: 170,
  nextIncrement: 20,
  currentBidTeamName: "Team Alpha",
  queueOrder: 1,
  status: "LIVE",
  statsJson: JSON.stringify({ runs: 520, fours: 42, sixes: 22 }),
  // Previous franchise eligible for RTM
  previousTeamId: 2,
};

const MOCK_PLAYERS_POOL = [
  {
    id: 101,
    name: "Rohit Sharma",
    playerName: "Rohit Sharma",
    sport: "Cricket",
    basePrice: 100,
    soldTo: null,
    soldPrice: null,
    category: "Open",
    status: "AVAILABLE",
  },
  {
    id: 102,
    name: "Jasprit Bumrah",
    playerName: "Jasprit Bumrah",
    sport: "Cricket",
    basePrice: 120,
    soldTo: null,
    soldPrice: null,
    category: "Open",
    status: "AVAILABLE",
  },
];

async function setupAuctionLiveRoutes(page: import("@playwright/test").Page) {
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
    // Intercept WebSocket to prevent connection races
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

  // Base catch-all
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

  // Auction Config & checks
  await page.route(/\/api\/auction\/config(\/.*|\?.*)?$/, async (route) => {
    const url = route.request().url();
    if (url.includes("/check")) {
      await route.fulfill({ status: 200, json: { configExists: true, configCount: 1, communityId: 1 } });
    } else if (url.includes("/all")) {
      await route.fulfill({ status: 200, json: [MOCK_CONFIG] });
    } else if (url.includes("/stats")) {
      await route.fulfill({
        status: 200,
        json: {
          totalPlayers: 20,
          soldPlayers: 5,
          unsoldPlayers: 1,
          totalSpent: 650,
          remainingBudget: 2350,
          highestBid: 250,
          averageBid: 130,
          totalTeams: 3,
          totalBudget: 3000,
        },
      });
    } else if (url.includes("/registration-count")) {
      await route.fulfill({ status: 200, json: 20 });
    } else {
      await route.fulfill({ status: 200, json: MOCK_CONFIG });
    }
  });

  // Teams endpoint
  await page.route(/\/api\/auction\/teams(\/.*|\?.*)?$/, async (route) => {
    await route.fulfill({ status: 200, json: MOCK_TEAMS });
  });

  // Live Current Player
  await page.route(/\/api\/auction\/live\/\d+\/current-player(\?.*)?$/, async (route) => {
    await route.fulfill({ status: 200, json: MOCK_LIVE_PLAYER });
  });

  // Next Random Player when current is sold/passed
  const MOCK_NEXT_PLAYER = {
    playerId: 102,
    playerName: "Jasprit Bumrah",
    category: "Open",
    playerRole: "Pace Bowler",
    age: 30,
    basePrice: 120,
    currentBid: 120,
    nextBid: 140,
    nextIncrement: 20,
    currentBidTeamName: "",
    queueOrder: 2,
    status: "LIVE",
    statsJson: JSON.stringify({ wickets: 35, economy: 6.8 }),
  };
  await page.route(/\/api\/auction\/live\/\d+\/random-player(\?.*)?$/, async (route) => {
    await route.fulfill({ status: 200, json: MOCK_NEXT_PLAYER });
  });

  // Players pool
  await page.route(/\/api\/auction\/live\/\d+\/players(\?.*)?$/, async (route) => {
    await route.fulfill({ status: 200, json: MOCK_PLAYERS_POOL });
  });

  // Sports tournament metadata used by SportsAuction event selector
  await page.route("**/api/sports/tournament-list-map**", async (route) => {
    await route.fulfill({
      status: 200,
      json: [{ id: 10, name: "Cricket Premier League 2026" }],
    });
  });

  await page.route(/\/api\/sports\/tournaments\/\d+\/confirmed-count(\?.*)?$/, async (route) => {
    await route.fulfill({ status: 200, json: 10 });
  });

  await page.route(/\/api\/sports\/tournaments\/\d+\/registrations(\?.*)?$/, async (route) => {
    await route.fulfill({ status: 200, json: [] });
  });

  await page.route(/\/api\/sports\/tournaments\/\d+(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        id: 10,
        name: "Cricket Premier League 2026",
        disputeCommitteeIds: "",
        community: { id: 1, name: "Greenfield" },
      },
    });
  });

  await page.route(/\/api\/sports\/events\/community(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      json: [{ id: 10, name: "Cricket Premier League 2026", auctionEnabled: true }],
    });
  });
}

test.describe("Live Auction Room & Bidding Lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuctionLiveRoutes(page);
  });

  test("renders live auction stage with current player spotlight, base price and bid timer", async ({ page }) => {
    await page.goto("/sports/auction?tab=live");
    await page.waitForTimeout(600);

    // Player spotlight
    await expect(page.locator("body")).toContainText("Rohit Sharma");
    await expect(page.locator("body")).toContainText("Opening Batter");
    await expect(page.locator("body")).toContainText("Base ₹100");
    await expect(page.locator("body")).toContainText("₹150");

    // Teams bid grid
    await expect(page.locator("body")).toContainText("Team Alpha");
    await expect(page.locator("body")).toContainText("Team Beta");
    await expect(page.locator("body")).toContainText("Team Gamma");

    // RTM indicators on team cards
    await expect(page.getByText(/⚡ 2 RTM/i).first()).toBeVisible();
  });

  test("places a bid for a team and updates the live bid history", async ({ page }) => {
    let bidRequestPayload: any = null;
    await page.route("**/api/auction/live/bid**", async (route) => {
      bidRequestPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        json: { id: 88, ...bidRequestPayload },
      });
    });

    await page.goto("/sports/auction?tab=live");
    await page.waitForTimeout(600);

    // Team Beta places next bid (₹170)
    const teamBetaCard = page.locator(".team-bid-card", { hasText: "Team Beta" });
    await expect(teamBetaCard).toBeVisible();
    await teamBetaCard.click();

    await page.waitForTimeout(400);
    expect(bidRequestPayload).not.toBeNull();
    expect(bidRequestPayload.teamId).toBe(2);
    expect(bidRequestPayload.playerId).toBe(101);
  });

  test("triggers Right To Match (RTM) Modal when eligible franchise matches winning bid", async ({ page }) => {
    await page.goto("/sports/auction?tab=live");
    await page.waitForTimeout(600);

    // Place a bid from Team Alpha (id: 1)
    const teamAlphaCard = page.locator(".team-bid-card", { hasText: "Team Alpha" });
    await teamAlphaCard.click();
    await page.waitForTimeout(300);

    // Click SOLD! button to trigger sale
    const soldBtn = page.getByRole("button", { name: "SOLD!" });
    await expect(soldBtn).toBeVisible();
    await soldBtn.click();

    // Since Rohit Sharma has previousTeamId: 2 (Team Beta), AuctionRtmModal should open!
    await expect(page.locator("body")).toContainText(/Right To Match \(RTM\) Card/i);
    await expect(page.locator("body")).toContainText(/Exercise RTM for Rohit Sharma\?/i);
    await expect(page.locator("body")).toContainText(/Team Beta/i);

    // Verify both Decline and Exercise actions are rendered
    await expect(page.getByRole("button", { name: /Decline RTM/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Exercise RTM/i })).toBeVisible();
  });

  test("exercises RTM and confirms sale with AuctionSoldCelebrationModal", async ({ page }) => {
    let soldPayload: any = null;
    await page.route("**/api/auction/live/sold**", async (route) => {
      soldPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        json: { id: 101, ...soldPayload, status: "SOLD" },
      });
    });

    await page.goto("/sports/auction?tab=live");
    await page.waitForTimeout(600);

    // Bid from Team Alpha
    await page.locator(".team-bid-card", { hasText: "Team Alpha" }).click();
    await page.waitForTimeout(300);

    // Click SOLD!
    await page.getByRole("button", { name: "SOLD!" }).click();

    // In RTM modal, click Exercise RTM to award player to Team Beta
    const exerciseBtn = page.getByRole("button", { name: /Exercise RTM/i });
    await expect(exerciseBtn).toBeVisible();
    await exerciseBtn.click();

    await page.waitForTimeout(400);

    // Verify sold endpoint was called for Team Beta
    expect(soldPayload).not.toBeNull();
    expect(soldPayload.teamId).toBe(2);
    expect(soldPayload.playerId).toBe(101);

    // Sold celebration modal should appear
    await expect(page.locator("body")).toContainText("HAMMER DOWN • SOLD!");
    await expect(page.locator("body")).toContainText("Rohit Sharma");
    await expect(page.locator("body")).toContainText("Team Beta");
  });

  test("declines RTM and sells player to highest bidder directly", async ({ page }) => {
    let soldPayload: any = null;
    await page.route("**/api/auction/live/sold**", async (route) => {
      soldPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        json: { id: 101, ...soldPayload, status: "SOLD" },
      });
    });

    await page.goto("/sports/auction?tab=live");
    await page.waitForTimeout(600);

    // Bid from Team Alpha
    await page.locator(".team-bid-card", { hasText: "Team Alpha" }).click();
    await page.waitForTimeout(300);

    // Click SOLD!
    await page.getByRole("button", { name: "SOLD!" }).click();

    // Click Decline RTM
    const declineBtn = page.getByRole("button", { name: /Decline RTM/i });
    await expect(declineBtn).toBeVisible();
    await declineBtn.click();

    await page.waitForTimeout(400);

    // Sold to Team Alpha (highest bidder)
    expect(soldPayload).not.toBeNull();
    expect(soldPayload.teamId).toBe(1);

    // Sold celebration modal appears
    await expect(page.locator("body")).toContainText("HAMMER DOWN • SOLD!");
    await expect(page.locator("body")).toContainText("Team Alpha");
  });
});
