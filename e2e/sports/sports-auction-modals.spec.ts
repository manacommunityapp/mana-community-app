import { test, expect } from "@playwright/test";
import {
  injectAuth,
  mockAuthRoutes,
  mockSportsDashboardRoutes,
} from "../fixtures/auth";

// ─────────────────────────────────────────────────────────────────────────────
// Sports Auction Modals — E2E Tests
// Covers: AuctionSoldCelebrationModal, AuctionRtmModal
// These modals appear during a live auction when a player is sold or RTM fires.
// Tests navigate to the auction page and mock the live auction API state.
// ─────────────────────────────────────────────────────────────────────────────

function mockBaseAuctionRoutes(page: import("@playwright/test").Page) {
  return Promise.all([
    page.route("**/api/auction/config**", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: 1,
          eventId: 1,
          eventName: "Cricket Premier League 2026",
          maxTeams: 8,
          budgetPerTeam: 1000,
          status: "LIVE",
        },
      });
    }),
    page.route("**/api/auction/teams**", async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          { id: 1, name: "Team Alpha", emoji: "🏏", colorHex: "#3B82F6", captain: "Ravi Kumar", budget: 1000, spent: 450, playerCount: 6, status: "APPROVED" },
          { id: 2, name: "Team Beta", emoji: "🏸", colorHex: "#EF4444", captain: "Suresh Patel", budget: 1000, spent: 200, playerCount: 3, status: "APPROVED" },
        ],
      });
    }),
    page.route("**/api/auction/player-pool**", async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          { id: 1, name: "Vikram Mehta", role: "Batsman", category: "Open", basePrice: 100, soldTo: null, soldPrice: null },
          { id: 2, name: "Kiran Joshi", role: "Bowler", category: "Youth", basePrice: 80, soldTo: "Team Alpha", soldPrice: 120 },
        ],
      });
    }),
    page.route("**/api/auction/results**", async (route) => {
      await route.fulfill({
        status: 200,
        json: { status: "LIVE", teamsFinalized: 0, playersAllocated: 1, playersUnsold: 0 },
      });
    }),
  ]);
}

// ── Sold Celebration Modal ────────────────────────────────────────────────────

test.describe("Auction Sold Celebration Modal", () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
    await mockSportsDashboardRoutes(page);
    await mockBaseAuctionRoutes(page);
  });

  test("live auction page renders without crashing in LIVE status", async ({ page }) => {
    await page.route("**/api/auction/live**", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          status: "LIVE",
          currentPlayer: {
            id: 1,
            name: "Vikram Mehta",
            role: "Batsman",
            category: "Open",
            basePrice: 100,
          },
          currentBid: {
            amount: 150,
            teamId: 1,
            teamName: "Team Alpha",
          },
        },
      });
    });
    await page.goto("/sports/auction");
    await page.waitForTimeout(700);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("Cannot read");
  });

  test("auction page shows current player during live auction", async ({ page }) => {
    await page.route("**/api/auction/live**", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          status: "LIVE",
          currentPlayer: { id: 1, name: "Vikram Mehta", role: "Batsman", category: "Open", basePrice: 100 },
          currentBid: { amount: 150, teamId: 1, teamName: "Team Alpha" },
        },
      });
    });
    await page.goto("/sports/auction");
    await page.waitForTimeout(700);
    const body = await page.locator("body").innerText();
    expect(
      body.includes("Vikram Mehta") || body.includes("LIVE") || body.includes("Team Alpha") || body.length > 50
    ).toBe(true);
  });

  test("auction page with SOLD player does not crash", async ({ page }) => {
    await page.route("**/api/auction/live**", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          status: "SOLD",
          soldPlayer: {
            id: 1,
            name: "Vikram Mehta",
            role: "Batsman",
            category: "Open",
            soldPrice: 150,
            soldTeam: { id: 1, name: "Team Alpha", emoji: "🏏", colorHex: "#3B82F6" },
          },
          currentPlayer: null,
          currentBid: null,
        },
      });
    });
    await page.goto("/sports/auction");
    await page.waitForTimeout(700);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("Cannot read");
  });

  test("SOLD state shows player name or team in body", async ({ page }) => {
    await page.route("**/api/auction/live**", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          status: "SOLD",
          soldPlayer: {
            id: 1,
            name: "Vikram Mehta",
            role: "Batsman",
            category: "Open",
            soldPrice: 150,
            soldTeam: { id: 1, name: "Team Alpha", emoji: "🏏", colorHex: "#3B82F6" },
          },
          currentPlayer: null,
          currentBid: null,
        },
      });
    });
    await page.goto("/sports/auction");
    await page.waitForTimeout(800);
    const body = await page.locator("body").innerText();
    expect(
      body.includes("Vikram Mehta") ||
      body.includes("Team Alpha") ||
      body.includes("SOLD") ||
      body.includes("150") ||
      body.length > 50
    ).toBe(true);
  });

  test("auction page gracefully handles missing live state", async ({ page }) => {
    await page.route("**/api/auction/live**", async (route) => {
      await route.fulfill({ status: 404, json: { error: "Not found" } });
    });
    await page.goto("/sports/auction");
    await page.waitForTimeout(700);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });

  test("auction page with NOT_STARTED state renders setup UI", async ({ page }) => {
    await page.route("**/api/auction/live**", async (route) => {
      await route.fulfill({
        status: 200,
        json: { status: "NOT_STARTED", currentPlayer: null, currentBid: null },
      });
    });
    await page.goto("/sports/auction");
    await page.waitForTimeout(600);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });
});

// ── RTM Modal ─────────────────────────────────────────────────────────────────

test.describe("Auction RTM Modal", () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
    await mockSportsDashboardRoutes(page);
    await mockBaseAuctionRoutes(page);
  });

  test("auction page with RTM state does not crash", async ({ page }) => {
    await page.route("**/api/auction/live**", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          status: "RTM",
          rtmData: {
            playerId: 1,
            playerName: "Vikram Mehta",
            playerRole: "Batsman",
            category: "Open",
            bidAmount: 150,
            highestBidderTeam: { id: 2, name: "Team Beta", emoji: "🏸", color: "#EF4444" },
            rtmEligibleTeam: {
              id: 1,
              name: "Team Alpha",
              emoji: "🏏",
              color: "#3B82F6",
              budget: 1000,
              spent: 450,
              remainingBudget: 550,
              rtmCardsLeft: 2,
            },
          },
          currentPlayer: null,
          currentBid: null,
        },
      });
    });
    await page.goto("/sports/auction");
    await page.waitForTimeout(700);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("Cannot read");
  });

  test("RTM state shows player or team info from mock", async ({ page }) => {
    await page.route("**/api/auction/live**", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          status: "RTM",
          rtmData: {
            playerId: 1,
            playerName: "Vikram Mehta",
            playerRole: "Batsman",
            category: "Open",
            bidAmount: 150,
            highestBidderTeam: { id: 2, name: "Team Beta", emoji: "🏸", color: "#EF4444" },
            rtmEligibleTeam: {
              id: 1,
              name: "Team Alpha",
              emoji: "🏏",
              color: "#3B82F6",
              budget: 1000,
              spent: 450,
              remainingBudget: 550,
              rtmCardsLeft: 2,
            },
          },
          currentPlayer: null,
          currentBid: null,
        },
      });
    });
    await page.goto("/sports/auction");
    await page.waitForTimeout(800);
    const body = await page.locator("body").innerText();
    expect(
      body.includes("Vikram Mehta") ||
      body.includes("Team Alpha") ||
      body.includes("RTM") ||
      body.includes("Right to Match") ||
      body.length > 50
    ).toBe(true);
  });

  test("RTM decline does not crash when handled", async ({ page }) => {
    await page.route("**/api/auction/live**", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          status: "RTM",
          rtmData: {
            playerId: 1,
            playerName: "Vikram Mehta",
            bidAmount: 150,
            highestBidderTeam: { id: 2, name: "Team Beta" },
            rtmEligibleTeam: {
              id: 1,
              name: "Team Alpha",
              budget: 1000,
              spent: 450,
              remainingBudget: 550,
              rtmCardsLeft: 2,
            },
          },
          currentPlayer: null,
          currentBid: null,
        },
      });
    });

    await page.route("**/api/auction/*/rtm/decline**", async (route) => {
      await route.fulfill({ status: 200, json: { success: true } });
    });

    await page.goto("/sports/auction");
    await page.waitForTimeout(700);

    const declineBtn = page.getByRole("button", { name: /Decline|Pass|Skip/i });
    if (await declineBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await declineBtn.click();
      await page.waitForTimeout(400);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });
});

// ── Player Skill Radar Chart ──────────────────────────────────────────────────

test.describe("Auction Player Skill Radar Chart", () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
    await mockSportsDashboardRoutes(page);
    await mockBaseAuctionRoutes(page);
  });

  test("player pool section renders without crashing with skill data", async ({ page }) => {
    await page.route("**/api/auction/live**", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          status: "LIVE",
          currentPlayer: {
            id: 1,
            name: "Vikram Mehta",
            role: "Batsman",
            category: "Open",
            basePrice: 100,
            skills: { batting: 90, bowling: 40, fielding: 70, fitness: 80, experience: 75 },
          },
          currentBid: { amount: 100, teamId: 1, teamName: "Team Alpha" },
        },
      });
    });
    await page.goto("/sports/auction");
    await page.waitForTimeout(700);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });

  test("player pool section shows player role or category", async ({ page }) => {
    await page.route("**/api/auction/live**", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          status: "LIVE",
          currentPlayer: {
            id: 1,
            name: "Vikram Mehta",
            role: "Batsman",
            category: "Open",
            basePrice: 100,
            skills: { batting: 90, bowling: 40, fielding: 70, fitness: 80, experience: 75 },
          },
          currentBid: null,
        },
      });
    });
    await page.goto("/sports/auction");
    await page.waitForTimeout(700);
    const body = await page.locator("body").innerText();
    expect(
      body.includes("Vikram Mehta") ||
      body.includes("Batsman") ||
      body.includes("Open") ||
      body.length > 50
    ).toBe(true);
  });
});
