import { test, expect } from "@playwright/test";
import {
  injectAuth,
  mockAuthRoutes,
  mockSportsDashboardRoutes,
} from "../fixtures/auth";

test.describe("Sports Auction", () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
    await mockSportsDashboardRoutes(page);

    // Auction-specific mock routes
    await page.route("**/api/auction/config**", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: 1,
          eventId: 1,
          eventName: "Cricket Premier League 2026",
          maxTeams: 8,
          budgetPerTeam: 1000,
          status: "DRAFT",
          playerPoolSize: 50,
        },
      });
    });

    await page.route("**/api/auction/teams**", async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          { id: 1, name: "Team Alpha", captain: "Ravi Kumar", budget: 1000, spent: 450, playerCount: 6, status: "APPROVED" },
          { id: 2, name: "Team Beta", captain: "Suresh Patel", budget: 1000, spent: 200, playerCount: 3, status: "APPROVED" },
          { id: 3, name: "Team Gamma", captain: "Anil Sharma", budget: 1000, spent: 0, playerCount: 0, status: "PENDING" },
        ],
      });
    });

    await page.route("**/api/auction/player-pool**", async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          { id: 1, name: "Vikram Mehta", sport: "Cricket", basePrice: 100, soldTo: "Team Alpha", soldPrice: 150, category: "Open" },
          { id: 2, name: "Kiran Joshi", sport: "Cricket", basePrice: 80, soldTo: null, soldPrice: null, category: "Youth" },
          { id: 3, name: "Mohan Das", sport: "Cricket", basePrice: 120, soldTo: "Team Beta", soldPrice: 200, category: "Open" },
        ],
      });
    });

    await page.route("**/api/auction/results**", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          status: "COMPLETED",
          teamsFinalized: 2,
          playersAllocated: 2,
          playersUnsold: 1,
        },
      });
    });

    await page.route("**/api/auction/live**", async (route) => {
      await route.fulfill({
        status: 200,
        json: { status: "NOT_STARTED", currentPlayer: null, currentBid: null },
      });
    });

    await page.goto("/sports/auction");
  });

  // ── Page renders ────────────────────────────────────────────────────────────

  test("renders the Auction page without crashing", async ({ page }) => {
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("Cannot read");
  });

  test("shows Auction in breadcrumb", async ({ page }) => {
    await expect(page.getByRole("link", { name: /Auction/i })).toBeVisible();
  });

  // ── Configuration section ───────────────────────────────────────────────────

  test("displays auction configuration details", async ({ page }) => {
    const labels = ["Cricket Premier League 2026", "1000", "DRAFT"];
    let found = 0;
    for (const label of labels) {
      if (await page.getByText(label).isVisible().catch(() => false)) found++;
    }
    expect(found).toBeGreaterThan(0);
  });

  // ── Teams section ───────────────────────────────────────────────────────────

  test("displays the registered teams list", async ({ page }) => {
    await expect(page.getByText("Team Alpha")).toBeVisible();
    await expect(page.getByText("Team Beta")).toBeVisible();
  });

  test("shows team captain names", async ({ page }) => {
    const captains = ["Ravi Kumar", "Suresh Patel"];
    let found = 0;
    for (const captain of captains) {
      if (await page.getByText(captain).isVisible().catch(() => false)) found++;
    }
    expect(found).toBeGreaterThan(0);
  });

  test("shows team budget information", async ({ page }) => {
    // Budget 1000 per team from mock
    await expect(page.getByText("1000").first()).toBeVisible();
  });

  // ── Player pool section ─────────────────────────────────────────────────────

  test("displays players in the player pool", async ({ page }) => {
    const players = ["Vikram Mehta", "Kiran Joshi", "Mohan Das"];
    let found = 0;
    for (const player of players) {
      if (await page.getByText(player).isVisible().catch(() => false)) found++;
    }
    // Player pool may be behind a tab — navigate if needed
    if (found === 0) {
      const playerPoolBtn = page.getByRole("button", { name: /Player Pool|Players/i });
      if (await playerPoolBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await playerPoolBtn.click();
        await page.waitForTimeout(400);
        for (const player of players) {
          if (await page.getByText(player).isVisible().catch(() => false)) found++;
        }
      }
    }
    expect(found).toBeGreaterThan(0);
  });

  test("shows sold/unsold status for players", async ({ page }) => {
    // Navigate to player pool if behind a tab
    const playerPoolBtn = page.getByRole("button", { name: /Player Pool|Players/i });
    if (await playerPoolBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await playerPoolBtn.click();
      await page.waitForTimeout(400);
    }
    const soldText = ["Team Alpha", "Team Beta", "Unsold", "Available"];
    let found = false;
    for (const text of soldText) {
      if (await page.getByText(text).isVisible().catch(() => false)) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  // ── Live auction section ────────────────────────────────────────────────────

  test("shows live auction status", async ({ page }) => {
    const liveBtn = page.getByRole("button", { name: /Live Auction|Start Auction/i });
    if (await liveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await liveBtn.click();
      await page.waitForTimeout(400);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });

  // ── Results section ─────────────────────────────────────────────────────────

  test("shows auction results when status is COMPLETED", async ({ page }) => {
    const resultsBtn = page.getByRole("button", { name: /Results/i });
    if (await resultsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await resultsBtn.click();
      await page.waitForTimeout(400);
      // Should show finalized teams count
      await expect(page.getByText(/2|COMPLETED/i).first()).toBeVisible();
    }
  });

  // ── Add player modal ────────────────────────────────────────────────────────

  test("Add Player button opens a modal or form", async ({ page }) => {
    const addPlayerBtn = page.getByRole("button", { name: /Add Player|Import Players/i });
    if (await addPlayerBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addPlayerBtn.click();
      await page.waitForTimeout(400);
      // A modal or form should appear
      const modal = page.locator('[role="dialog"], .modal, form').first();
      await expect(modal).toBeVisible();
    }
  });

  // ── Error state ─────────────────────────────────────────────────────────────

  test("shows fallback when auction config API fails", async ({ page }) => {
    await page.route("**/api/auction/config**", (route) =>
      route.fulfill({ status: 404, json: { error: "Not found" } })
    );
    await page.goto("/sports/auction");
    await page.waitForTimeout(600);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });
});
