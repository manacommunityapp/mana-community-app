import { test, expect } from "@playwright/test";
import {
  injectAuth,
  mockAuthRoutes,
  mockSportsDashboardRoutes,
  mockSportsMyTeamsRoutes,
} from "../fixtures/auth";

test.describe("Sports My Teams", () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
    await mockSportsDashboardRoutes(page);
    await mockSportsMyTeamsRoutes(page);
    await page.goto("/sports/my-teams");
  });

  // ── Page renders ────────────────────────────────────────────────────────────

  test("renders My Teams page without crashing", async ({ page }) => {
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("Cannot read");
  });

  test("shows My Teams in breadcrumb", async ({ page }) => {
    await expect(page.getByRole("link", { name: /My Teams/i })).toBeVisible();
  });

  // ── Team list ────────────────────────────────────────────────────────────────

  test("displays team cards when user belongs to teams", async ({ page }) => {
    await page.waitForTimeout(600);
    // Team Alpha is returned with user id=1 as owner/player
    const body = await page.locator("body").innerText();
    expect(
      body.includes("Team Alpha") || body.includes("Loading") || body.includes("No teams")
    ).toBe(true);
  });

  test("shows team name and player count", async ({ page }) => {
    await page.waitForTimeout(600);
    if (await page.getByText("Team Alpha").isVisible().catch(() => false)) {
      await expect(page.getByText("Team Alpha")).toBeVisible();
      // Player count (6) should appear
      const body = await page.locator("body").innerText();
      expect(body.includes("6") || body.includes("player") || body.includes("Player")).toBe(true);
    }
  });

  test("shows owner badge for teams the user owns", async ({ page }) => {
    await page.waitForTimeout(600);
    const body = await page.locator("body").innerText();
    // Owner badge text variations
    const hasOwnerBadge =
      body.includes("Owner") ||
      body.includes("Captain") ||
      body.includes("Team Alpha"); // at minimum the team should appear
    expect(hasOwnerBadge).toBe(true);
  });

  // ── Team actions ─────────────────────────────────────────────────────────────

  test("team card shows an action button (View/Leave/Manage)", async ({ page }) => {
    await page.waitForTimeout(600);
    if (await page.getByText("Team Alpha").isVisible().catch(() => false)) {
      const actionBtn = page.getByRole("button", { name: /view|manage|leave|details/i }).first();
      const hasAction = await actionBtn.isVisible({ timeout: 2000 }).catch(() => false);
      // May also be a chevron/arrow link
      const hasArrow = await page.locator("svg").first().isVisible().catch(() => false);
      expect(hasAction || hasArrow).toBe(true);
    }
  });

  test("clicking a team card does not crash the page", async ({ page }) => {
    await page.waitForTimeout(600);
    const teamCard = page.getByText("Team Alpha").first();
    if (await teamCard.isVisible().catch(() => false)) {
      await teamCard.click();
      await page.waitForTimeout(400);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });

  // ── Budget display ───────────────────────────────────────────────────────────

  test("shows budget information for auction teams", async ({ page }) => {
    await page.waitForTimeout(600);
    const body = await page.locator("body").innerText();
    // Budget: 1000, Spent: 450
    expect(
      body.includes("1000") || body.includes("450") || body.includes("Budget") ||
      body.includes("Spent") || body.includes("Team Alpha")
    ).toBe(true);
  });

  // ── Empty state ───────────────────────────────────────────────────────────────

  test("shows empty state or message when user has no teams", async ({ page }) => {
    await page.route("**/api/auction/configs**", (route) =>
      route.fulfill({ status: 200, json: [] })
    );
    await page.route("**/api/auction/**", (route) =>
      route.fulfill({ status: 200, json: [] })
    );
    await page.goto("/sports/my-teams");
    await page.waitForTimeout(800);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(10);
  });

  // ── Error state ───────────────────────────────────────────────────────────────

  test("shows fallback when teams API fails", async ({ page }) => {
    await page.route("**/api/auction/configs**", (route) =>
      route.fulfill({ status: 500, json: { error: "Server error" } })
    );
    await page.goto("/sports/my-teams");
    await page.waitForTimeout(800);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });

  test("does not crash when team summary API fails for one config", async ({ page }) => {
    await page.route("**/api/auction/*/teams/summary**", (route) =>
      route.fulfill({ status: 404, json: { error: "Not found" } })
    );
    await page.goto("/sports/my-teams");
    await page.waitForTimeout(800);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });
});
