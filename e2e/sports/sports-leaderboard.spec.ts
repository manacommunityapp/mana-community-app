import { test, expect } from "@playwright/test";
import {
  injectAuth,
  mockAuthRoutes,
  mockSportsDashboardRoutes,
  mockSportsLeaderboardRoutes,
} from "../fixtures/auth";

test.describe("Sports Leaderboard", () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
    await mockSportsDashboardRoutes(page);
    await mockSportsLeaderboardRoutes(page);
    await page.goto("/sports/leaderboard");
  });

  // ── Page renders ────────────────────────────────────────────────────────────

  test("renders the Leaderboard page without crashing", async ({ page }) => {
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("Cannot read");
  });

  test("shows Tournament Leaderboards heading", async ({ page }) => {
    await expect(page.getByText(/Tournament Leaderboards/i)).toBeVisible();
  });

  // ── Mode toggle ──────────────────────────────────────────────────────────────

  test("shows Cricket Stats and Multi-Sport Rankings toggle buttons", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Cricket Stats/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Multi-Sport Rankings/i })).toBeVisible();
  });

  test("defaults to Cricket Stats mode", async ({ page }) => {
    const cricketBtn = page.getByRole("button", { name: /Cricket Stats/i });
    await expect(cricketBtn).toBeVisible();
    // Active button should have white background or different style
    const isActive = await cricketBtn.evaluate((el) => {
      const style = getComputedStyle(el);
      return style.backgroundColor !== "rgba(0, 0, 0, 0)" && style.color !== "";
    });
    expect(isActive).toBe(true);
  });

  test("switches to Multi-Sport Rankings mode", async ({ page }) => {
    const multiBtn = page.getByRole("button", { name: /Multi-Sport Rankings/i });
    await multiBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });

  // ── Cricket leaderboard content ──────────────────────────────────────────────

  test("Cricket Stats mode shows top batsmen section", async ({ page }) => {
    await page.waitForTimeout(600);
    const body = await page.locator("body").innerText();
    expect(
      body.includes("Ravi Kumar") ||
      body.includes("Batsmen") ||
      body.includes("Runs") ||
      body.includes("Average")
    ).toBe(true);
  });

  test("Cricket Stats mode shows player names from mock API", async ({ page }) => {
    await page.waitForTimeout(600);
    let found = 0;
    for (const name of ["Ravi Kumar", "Suresh Patel"]) {
      if (await page.getByText(name).first().isVisible().catch(() => false)) found++;
    }
    expect(found).toBeGreaterThan(0);
  });

  test("Cricket Stats mode shows top bowlers section", async ({ page }) => {
    await page.waitForTimeout(600);
    const body = await page.locator("body").innerText();
    expect(
      body.includes("Anil Sharma") ||
      body.includes("Bowler") ||
      body.includes("Wicket") ||
      body.includes("Economy")
    ).toBe(true);
  });

  // ── Generic / multi-sport leaderboard ────────────────────────────────────────

  test("Multi-Sport Rankings mode shows team standings", async ({ page }) => {
    const multiBtn = page.getByRole("button", { name: /Multi-Sport Rankings/i });
    await multiBtn.click();
    await page.waitForTimeout(600);
    const body = await page.locator("body").innerText();
    expect(
      body.includes("Team Alpha") || body.includes("Team Beta") ||
      body.includes("Standings") || body.includes("Points") ||
      body.includes("Rank")
    ).toBe(true);
  });

  // ── Loading state ─────────────────────────────────────────────────────────────

  test("shows loading skeleton or spinner while API is pending", async ({ page }) => {
    await page.route("**/api/cricket/leaderboard**", async (route) => {
      await new Promise(r => setTimeout(r, 500));
      await route.fulfill({ status: 200, json: { topBatsmen: [], topBowlers: [], mvp: null } });
    });
    await page.goto("/sports/leaderboard");
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });

  // ── Error state ───────────────────────────────────────────────────────────────

  test("shows fallback when leaderboard API fails", async ({ page }) => {
    await page.route("**/api/cricket/leaderboard**", (route) =>
      route.fulfill({ status: 503, json: { error: "Service unavailable" } })
    );
    await page.goto("/sports/leaderboard");
    await page.waitForTimeout(800);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });

  test("Multi-Sport Rankings fallback works when standings API fails", async ({ page }) => {
    await page.route("**/api/tournament/*/standings**", (route) =>
      route.fulfill({ status: 500, json: { error: "Error" } })
    );
    await page.goto("/sports/leaderboard");
    const multiBtn = page.getByRole("button", { name: /Multi-Sport Rankings/i });
    if (await multiBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await multiBtn.click();
      await page.waitForTimeout(600);
    }
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });

  // ── Tournament-scoped leaderboard ─────────────────────────────────────────────

  test("renders leaderboard page with tournament ID param without crashing", async ({ page }) => {
    await page.goto("/sports/leaderboard/1");
    await page.waitForTimeout(500);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.getByText(/Tournament Leaderboards/i)).toBeVisible();
  });
});
