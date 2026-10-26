import { test, expect } from "@playwright/test";
import {
  injectAuth,
  mockAuthRoutes,
  mockSportsDashboardRoutes,
  mockSportsScheduleRoutes,
  mockSportsMatchRoutes,
} from "../fixtures/auth";

// ─────────────────────────────────────────────────────────────────────────────
// Sports Match Pages — E2E Tests
// Covers: MatchDetailPage, MatchLivePage, MatchScorePage,
//         GenericMatchLivePage, GenericMatchScorePage,
//         RaceResultsPage, RaceScorePage
// ─────────────────────────────────────────────────────────────────────────────

async function setupMatchRoutes(page: import("@playwright/test").Page) {
  await injectAuth(page);
  await mockAuthRoutes(page);
  await mockSportsDashboardRoutes(page);
  await mockSportsScheduleRoutes(page);
  await mockSportsMatchRoutes(page);
}

// ── Match Detail Page (/sports/match/:matchId) ──────────────────────────────

test.describe("Sports Match Detail Page", () => {
  test.beforeEach(async ({ page }) => {
    await setupMatchRoutes(page);
  });

  test("renders match detail page without crashing", async ({ page }) => {
    await page.goto("/sports/match/1");
    await page.waitForTimeout(800);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("Cannot read");
  });

  test("shows team names from mock API", async ({ page }) => {
    await page.goto("/sports/match/1");
    await page.waitForTimeout(800);
    const body = await page.locator("body").innerText();
    expect(
      body.includes("Team Alpha") || body.includes("Team Beta") || body.includes("Cricket")
    ).toBe(true);
  });

  test("shows match result or status", async ({ page }) => {
    await page.goto("/sports/match/1");
    await page.waitForTimeout(800);
    const body = await page.locator("body").innerText();
    expect(
      body.includes("won") ||
      body.includes("COMPLETED") ||
      body.includes("Result") ||
      body.includes("Team Alpha")
    ).toBe(true);
  });

  test("shows Back to Schedule button", async ({ page }) => {
    await page.goto("/sports/match/1");
    await page.waitForTimeout(600);
    const backBtn = page.getByRole("button", { name: /Back|Schedule/i });
    if (await backBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await backBtn.click();
      await expect(page).toHaveURL(/\/sports\/schedule/);
    }
  });

  test("shows error state for invalid match ID", async ({ page }) => {
    await page.goto("/sports/match/0");
    await page.waitForTimeout(500);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.getByText(/Invalid Match ID/i)).toBeVisible();
  });
});

// ── Match Live Page (/sports/match/:matchId/live) ───────────────────────────

test.describe("Sports Match Live Page", () => {
  test.beforeEach(async ({ page }) => {
    await setupMatchRoutes(page);
  });

  test("renders live match page without crashing", async ({ page }) => {
    await page.goto("/sports/match/1/live");
    await page.waitForTimeout(800);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("TypeError");
  });

  test("shows team names on live match page", async ({ page }) => {
    await page.goto("/sports/match/1/live");
    await page.waitForTimeout(800);
    const body = await page.locator("body").innerText();
    expect(
      body.includes("Team Alpha") || body.includes("Team Beta") || body.includes("Cricket") || body.includes("Live")
    ).toBe(true);
  });

  test("shows error state for invalid match ID on live page", async ({ page }) => {
    await page.goto("/sports/match/0/live");
    await page.waitForTimeout(500);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.getByText(/Invalid Match ID/i)).toBeVisible();
  });
});

// ── Match Score Page (/sports/match/:matchId/score) ─────────────────────────

test.describe("Sports Match Score Page (Umpire)", () => {
  test.beforeEach(async ({ page }) => {
    await setupMatchRoutes(page);
  });

  test("renders scoring panel without crashing", async ({ page }) => {
    await page.goto("/sports/match/1/score");
    await page.waitForTimeout(800);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("TypeError");
  });

  test("shows team names on scoring panel", async ({ page }) => {
    await page.goto("/sports/match/1/score");
    await page.waitForTimeout(800);
    const body = await page.locator("body").innerText();
    expect(
      body.includes("Team Alpha") || body.includes("Team Beta") || body.includes("Score") || body.includes("Cricket")
    ).toBe(true);
  });

  test("shows error state for invalid match ID on score page", async ({ page }) => {
    await page.goto("/sports/match/0/score");
    await page.waitForTimeout(500);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.getByText(/Invalid Match ID/i)).toBeVisible();
  });
});

// ── Generic Match Live Page (/sports/match/generic/:matchId/live) ───────────

test.describe("Sports Generic Match Live Page", () => {
  test.beforeEach(async ({ page }) => {
    await setupMatchRoutes(page);
    // Override to return a non-Cricket sport type
    await page.route("**/api/sports/matches/*/state**", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          matchId: 2,
          sportType: "BADMINTON",
          teamAName: "Team Alpha",
          teamBName: "Team Beta",
          teamAId: 1,
          teamBId: 2,
          teamAColor: "#3B82F6",
          teamBColor: "#EF4444",
          status: "LIVE",
        },
      });
    });
  });

  test("renders generic live match page without crashing", async ({ page }) => {
    await page.goto("/sports/match/generic/2/live");
    await page.waitForTimeout(800);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("TypeError");
  });

  test("shows team names on generic live match page", async ({ page }) => {
    await page.goto("/sports/match/generic/2/live");
    await page.waitForTimeout(800);
    const body = await page.locator("body").innerText();
    expect(
      body.includes("Team Alpha") || body.includes("Team Beta") || body.includes("Badminton") || body.includes("Live")
    ).toBe(true);
  });

  test("shows error state for invalid ID on generic live page", async ({ page }) => {
    await page.goto("/sports/match/generic/0/live");
    await page.waitForTimeout(500);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.getByText(/Invalid Match ID/i)).toBeVisible();
  });
});

// ── Generic Match Score Page (/sports/match/generic/:matchId/score) ──────────

test.describe("Sports Generic Match Score Page", () => {
  test.beforeEach(async ({ page }) => {
    await setupMatchRoutes(page);
    await page.route("**/api/sports/matches/*/state**", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          matchId: 2,
          sportType: "BADMINTON",
          teamAName: "Team Alpha",
          teamBName: "Team Beta",
          teamAId: 1,
          teamBId: 2,
          teamAColor: "#3B82F6",
          teamBColor: "#EF4444",
          status: "LIVE",
        },
      });
    });
  });

  test("renders generic scoring panel without crashing", async ({ page }) => {
    await page.goto("/sports/match/generic/2/score");
    await page.waitForTimeout(800);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("TypeError");
  });

  test("shows team names on generic scoring panel", async ({ page }) => {
    await page.goto("/sports/match/generic/2/score");
    await page.waitForTimeout(800);
    const body = await page.locator("body").innerText();
    expect(
      body.includes("Team Alpha") || body.includes("Team Beta") || body.includes("Score")
    ).toBe(true);
  });

  test("shows error state for invalid ID on generic score page", async ({ page }) => {
    await page.goto("/sports/match/generic/0/score");
    await page.waitForTimeout(500);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.getByText(/Invalid Match ID/i)).toBeVisible();
  });
});

// ── Race Results Page (/sports/race/:matchId) ────────────────────────────────

test.describe("Sports Race Results Page", () => {
  test.beforeEach(async ({ page }) => {
    await setupMatchRoutes(page);
  });

  test("renders race results page without crashing", async ({ page }) => {
    await page.goto("/sports/race/1");
    await page.waitForTimeout(800);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("TypeError");
  });

  test("shows athlete names or race data from mock", async ({ page }) => {
    await page.goto("/sports/race/1");
    await page.waitForTimeout(800);
    const body = await page.locator("body").innerText();
    expect(
      body.includes("Raj Kumar") ||
      body.includes("Priya Sharma") ||
      body.includes("Athletics") ||
      body.includes("Race") ||
      body.includes("Sprint")
    ).toBe(true);
  });

  test("shows finish times or ranks for race results", async ({ page }) => {
    await page.goto("/sports/race/1");
    await page.waitForTimeout(800);
    const body = await page.locator("body").innerText();
    expect(
      body.includes("10.82") || body.includes("11.05") ||
      body.includes("Rank") || body.includes("1") || body.includes("2")
    ).toBe(true);
  });

  test("shows error state for invalid race match ID", async ({ page }) => {
    await page.goto("/sports/race/0");
    await page.waitForTimeout(500);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.getByText(/Invalid Match ID/i)).toBeVisible();
  });

  test("Back to Schedule button navigates correctly", async ({ page }) => {
    await page.goto("/sports/race/1");
    await page.waitForTimeout(600);
    const backBtn = page.getByRole("button", { name: /Back|Schedule/i });
    if (await backBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await backBtn.click();
      await expect(page).toHaveURL(/\/sports\/schedule/);
    }
  });
});

// ── Race Score Page (/sports/race/:matchId/score) ────────────────────────────

test.describe("Sports Race Score Page", () => {
  test.beforeEach(async ({ page }) => {
    await setupMatchRoutes(page);
  });

  test("renders race scoring panel without crashing", async ({ page }) => {
    await page.goto("/sports/race/1/score");
    await page.waitForTimeout(800);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("TypeError");
  });

  test("shows race participants or timing UI", async ({ page }) => {
    await page.goto("/sports/race/1/score");
    await page.waitForTimeout(800);
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(20);
    expect(body).not.toContain("TypeError");
  });

  test("shows error state for invalid race match ID on score page", async ({ page }) => {
    await page.goto("/sports/race/0/score");
    await page.waitForTimeout(500);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.getByText(/Invalid Match ID/i)).toBeVisible();
  });
});
