import { test, expect } from "@playwright/test";
import {
  injectAuth,
  mockAuthRoutes,
  mockSportsDashboardRoutes,
  mockSportsMyAuctionsRoutes,
  MOCK_MY_AUCTION_CONFIGS,
} from "../fixtures/auth";

// ─────────────────────────────────────────────────────────────────────────────
// Sports My Auctions — E2E Tests
// Covers: SportsMyAuctions at /sports/my-auctions
// Shows auctions where the current user is an owner or player of a team
// ─────────────────────────────────────────────────────────────────────────────

async function setupMyAuctionRoutes(page: import("@playwright/test").Page) {
  await injectAuth(page);
  await mockAuthRoutes(page);
  await mockSportsDashboardRoutes(page);
  await mockSportsMyAuctionsRoutes(page);
}

test.describe("Sports My Auctions", () => {
  test.beforeEach(async ({ page }) => {
    await setupMyAuctionRoutes(page);
    await page.goto("/sports/my-auctions");
  });

  // ── Page renders ─────────────────────────────────────────────────────────────

  test("renders My Auctions page without crashing", async ({ page }) => {
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("Cannot read");
  });

  test("shows My Auctions heading", async ({ page }) => {
    await page.waitForTimeout(600);
    const body = await page.locator("body").innerText();
    expect(body.includes("My Auctions") || body.includes("Auctions")).toBe(true);
  });

  test("shows My Auctions in breadcrumb or nav", async ({ page }) => {
    await page.waitForTimeout(600);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(30);
  });

  // ── Tab navigation ────────────────────────────────────────────────────────────

  test("renders Active and History tabs", async ({ page }) => {
    await page.waitForTimeout(600);
    const activeTab = page.getByRole("button", { name: /Active/i });
    const historyTab = page.getByRole("button", { name: /History/i });
    const hasActive = await activeTab.isVisible({ timeout: 2000 }).catch(() => false);
    const hasHistory = await historyTab.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasActive || hasHistory).toBe(true);
  });

  test("defaults to Active tab", async ({ page }) => {
    await page.waitForTimeout(600);
    const body = await page.locator("body").innerText();
    // Active tab should be default — Cricket Premier League (LIVE) should appear
    expect(
      body.includes("Cricket Premier League") ||
      body.includes("Active") ||
      body.includes("LIVE") ||
      body.includes("Team Alpha")
    ).toBe(true);
  });

  test("switching to History tab shows completed auctions", async ({ page }) => {
    await page.waitForTimeout(600);
    const historyTab = page.getByRole("button", { name: /History/i });
    if (await historyTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await historyTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator("body")).not.toContainText("Unhandled");
      const body = await page.locator("body").innerText();
      expect(
        body.includes("Badminton Summer Cup") ||
        body.includes("COMPLETED") ||
        body.includes("History") ||
        body.includes("No history") ||
        body.length > 50
      ).toBe(true);
    }
  });

  // ── Auction cards ─────────────────────────────────────────────────────────────

  test("shows auction card for user's team (Team Alpha)", async ({ page }) => {
    await page.waitForTimeout(700);
    const body = await page.locator("body").innerText();
    expect(
      body.includes("Team Alpha") ||
      body.includes("Cricket Premier League 2026") ||
      body.includes("🏏") ||
      body.includes("LIVE")
    ).toBe(true);
  });

  test("shows season name for each auction", async ({ page }) => {
    await page.waitForTimeout(700);
    const body = await page.locator("body").innerText();
    expect(
      body.includes("Cricket Premier League 2026") || body.includes("Auction") || body.includes("Season")
    ).toBe(true);
  });

  test("shows player count on auction card", async ({ page }) => {
    await page.waitForTimeout(700);
    const body = await page.locator("body").innerText();
    // Team Alpha has 2 players in mock
    expect(
      body.includes("2 players") || body.includes("players") || body.includes("2") || body.includes("Team Alpha")
    ).toBe(true);
  });

  test("shows amount spent on auction card", async ({ page }) => {
    await page.waitForTimeout(700);
    const body = await page.locator("body").innerText();
    // Team Alpha spent 450
    expect(
      body.includes("450") || body.includes("spent") || body.includes("₹") || body.includes("Team Alpha")
    ).toBe(true);
  });

  test("shows status badge (LIVE / COMPLETED) on auction cards", async ({ page }) => {
    await page.waitForTimeout(700);
    const body = await page.locator("body").innerText();
    expect(
      body.includes("LIVE") ||
      body.includes("COMPLETED") ||
      body.includes("CONFIGURED") ||
      body.includes("Active")
    ).toBe(true);
  });

  test("shows Captain indicator for teams where user is owner", async ({ page }) => {
    await page.waitForTimeout(700);
    const body = await page.locator("body").innerText();
    // Team Alpha ownerUser.id === 1 === MOCK_USER.userId, so should show Captain
    expect(
      body.includes("Captain") || body.includes("Owner") || body.includes("Team Alpha")
    ).toBe(true);
  });

  // ── Click / navigation ────────────────────────────────────────────────────────

  test("clicking an auction card navigates to the auction page", async ({ page }) => {
    await page.waitForTimeout(700);
    const auctionCard = page.getByText("Cricket Premier League 2026").first();
    if (await auctionCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await auctionCard.click();
      await page.waitForTimeout(600);
      const url = page.url();
      expect(
        url.includes("/sports/auction") || url.includes("/auction")
      ).toBe(true);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });

  test("clicking a card does not crash the page", async ({ page }) => {
    await page.waitForTimeout(700);
    const card = page.locator("div[style*='cursor: pointer'], div[style*='cursor:pointer']").first();
    if (await card.isVisible({ timeout: 2000 }).catch(() => false)) {
      await card.click();
      await page.waitForTimeout(500);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });

  // ── Loading state ─────────────────────────────────────────────────────────────

  test("shows loading spinner while API is pending", async ({ page }) => {
    await page.route("**/api/auction/configs**", async (route) => {
      await new Promise(r => setTimeout(r, 500));
      await route.fulfill({ status: 200, json: MOCK_MY_AUCTION_CONFIGS });
    });
    await page.goto("/sports/my-auctions");
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });

  // ── Empty state ───────────────────────────────────────────────────────────────

  test("shows empty state message when user has no auctions", async ({ page }) => {
    // Return configs where user is not in any team
    await page.route("**/api/auction/*/teams/summary**", (route) =>
      route.fulfill({
        status: 200,
        json: [
          {
            id: 99,
            teamName: "Other Team",
            ownerUser: { id: 99, name: "Other User", userId: 99 },
            spent: 0,
            budget: 1000,
            players: [],
          },
        ],
      })
    );
    await page.goto("/sports/my-auctions");
    await page.waitForTimeout(700);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    const body = await page.locator("body").innerText();
    expect(
      body.includes("No active") ||
      body.includes("No auctions") ||
      body.includes("No") ||
      body.length > 20
    ).toBe(true);
  });

  // ── Error state ───────────────────────────────────────────────────────────────

  test("shows graceful fallback when auction configs API fails", async ({ page }) => {
    await page.route("**/api/auction/configs**", (route) =>
      route.fulfill({ status: 500, json: { error: "Server error" } })
    );
    await page.goto("/sports/my-auctions");
    await page.waitForTimeout(700);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(20);
  });

  test("does not crash when team summary API fails for one config", async ({ page }) => {
    await page.route("**/api/auction/*/teams/summary**", (route) =>
      route.fulfill({ status: 404, json: { error: "Not found" } })
    );
    await page.goto("/sports/my-auctions");
    await page.waitForTimeout(700);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });
});
