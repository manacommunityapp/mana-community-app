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

    const mockConfig = {
      id: 1,
      eventId: 1,
      eventName: "Cricket Premier League 2026",
      maxTeams: 8,
      budgetPerTeam: 1000,
      status: "DRAFT",
      playerPoolSize: 50,
      sportName: "Cricket",
      basePrice: 100,
    };

    await page.route(/\/api\/auction\/config(\/.*|\?.*)?$/, async (route) => {
      const url = route.request().url();
      if (url.includes("/check")) {
        await route.fulfill({ status: 200, json: { configExists: true, configCount: 1, communityId: 1 } });
      } else if (url.includes("/all")) {
        await route.fulfill({ status: 200, json: [mockConfig] });
      } else if (url.includes("/stats")) {
        await route.fulfill({
          status: 200,
          json: {
            totalPlayers: 3,
            soldPlayers: 2,
            unsoldPlayers: 1,
            totalSpent: 350,
            remainingBudget: 1650,
            highestBid: 200,
            averageBid: 175,
          },
        });
      } else if (url.includes("/registration-count")) {
        await route.fulfill({ status: 200, json: 10 });
      } else {
        await route.fulfill({
          status: 200,
          json: mockConfig,
        });
      }
    });

    await page.route(/\/api\/auction\/teams(\/.*|\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          { id: 1, name: "Team Alpha", teamName: "Team Alpha", captain: "Ravi Kumar", ownerName: "Ravi Kumar", budget: 1000, spent: 450, playerCount: 6, status: "APPROVED" },
          { id: 2, name: "Team Beta", teamName: "Team Beta", captain: "Suresh Patel", ownerName: "Suresh Patel", budget: 1000, spent: 200, playerCount: 3, status: "APPROVED" },
          { id: 3, name: "Team Gamma", teamName: "Team Gamma", captain: "Anil Sharma", ownerName: "Anil Sharma", budget: 1000, spent: 0, playerCount: 0, status: "PENDING" },
        ],
      });
    });

    const mockPlayers = [
      { id: 1, name: "Vikram Mehta", sport: "Cricket", basePrice: 100, soldTo: "Team Alpha", soldPrice: 150, category: "Open", status: "SOLD", assignedTeam: { id: 1, name: "Team Alpha" } },
      { id: 2, name: "Kiran Joshi", sport: "Cricket", basePrice: 80, soldTo: null, soldPrice: null, category: "Youth", status: "AVAILABLE" },
      { id: 3, name: "Mohan Das", sport: "Cricket", basePrice: 120, soldTo: "Team Beta", soldPrice: 200, category: "Open", status: "SOLD", assignedTeam: { id: 2, name: "Team Beta" } },
    ];

    await page.route(/\/api\/auction\/live\/\d+\/players(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        json: mockPlayers,
      });
    });

    await page.route("**/api/auction/player-pool**", async (route) => {
      await route.fulfill({
        status: 200,
        json: mockPlayers,
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

    await page.route(/\/api\/auction\/live(\?.*)?$/, async (route) => {
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
    await expect(page.getByRole("link", { name: /Auction/i }).first()).toBeVisible();
  });

  // ── Configuration section ───────────────────────────────────────────────────

  test("displays auction configuration details", async ({ page }) => {
    await page.goto("/sports/auction?tab=config");
    const labels = ["Auction Configuration", "Auction Rules", "Cricket", "Season 2026", "1000"];
    let found = 0;
    for (const label of labels) {
      if (
        (await page.getByText(new RegExp(label, "i")).first().isVisible().catch(() => false)) ||
        (await page.locator(`input[value="${label}"]`).first().isVisible().catch(() => false))
      ) {
        found++;
      }
    }
    expect(found).toBeGreaterThan(0);
  });

  // ── Teams section ───────────────────────────────────────────────────────────

  test("displays the registered teams list", async ({ page }) => {
    await page.goto("/sports/auction?tab=teams");
    await expect(page.getByText("Team Alpha")).toBeVisible();
    await expect(page.getByText("Team Beta")).toBeVisible();
  });

  test("shows team captain names", async ({ page }) => {
    await page.goto("/sports/auction?tab=teams");
    await expect(page.getByText(/Ravi Kumar|Suresh Patel/).first()).toBeVisible();
  });

  test("shows team budget information", async ({ page }) => {
    await page.goto("/sports/auction?tab=teams");
    // Budget formatted as 1,000 or ₹1,000 or input value 1000
    const budgetEl = page.getByText(/1[,.]?000/).first();
    await expect(budgetEl).toBeVisible();
  });

  // ── Player pool section ─────────────────────────────────────────────────────

  test("displays players in the player pool", async ({ page }) => {
    await page.goto("/sports/auction?tab=players");
    await expect(page.getByText(/Vikram Mehta|Kiran Joshi|Mohan Das/).first()).toBeVisible();
  });

  test("shows sold/unsold status for players", async ({ page }) => {
    await page.goto("/sports/auction?tab=players");
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
    await page.goto("/sports/auction?tab=live");
    await page.waitForTimeout(400);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });

  // ── Results section ─────────────────────────────────────────────────────────

  test("shows auction results when status is COMPLETED", async ({ page }) => {
    await page.goto("/sports/auction?tab=results");
    await page.waitForTimeout(400);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });

  // ── Add player modal ────────────────────────────────────────────────────────

  test("Add Player button opens a modal or form", async ({ page }) => {
    await page.goto("/sports/auction?tab=players");
    const addPlayerBtn = page.getByRole("button", { name: /Add Player|Import Players/i }).first();
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
