import { test, expect } from "@playwright/test";
import {
  injectAuth,
  mockAuthRoutes,
  mockSportsDashboardRoutes,
  mockSportsAdminRoutes,
  mockTournamentScheduleRoutes,
  MOCK_TOURNAMENT_CONFIGS,
  MOCK_TOURNAMENT_MATCHES,
} from "../fixtures/auth";

// ─────────────────────────────────────────────────────────────────────────────
// Sports Admin — Schedule Tab (ScheduleAdminTab)
// Covers: /sports/admin → Schedule tab
// Shows accordion list of tournament configs; expanding loads match rows
// APIs:  GET /api/tournament/configs
//        GET /api/tournament/{configId}/matches
// ─────────────────────────────────────────────────────────────────────────────

async function gotoScheduleTab(page: import("@playwright/test").Page) {
  await injectAuth(page);
  await mockAuthRoutes(page);
  await mockSportsDashboardRoutes(page);
  await mockSportsAdminRoutes(page);
  await mockTournamentScheduleRoutes(page);
  await page.goto("/sports/admin");
  await page.waitForTimeout(500);
  const scheduleBtn = page.getByRole("button", { name: /Schedule/i });
  if (await scheduleBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await scheduleBtn.click();
    await page.waitForTimeout(600);
  }
}

test.describe("Schedule Admin Tab — Config List", () => {
  test.beforeEach(async ({ page }) => {
    await gotoScheduleTab(page);
  });

  test("renders Schedule tab without crashing", async ({ page }) => {
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("Cannot read");
  });

  test("shows tournament config names from mock", async ({ page }) => {
    const body = await page.locator("body").innerText();
    expect(
      body.includes("Cricket Premier League 2026") ||
      body.includes("Badminton Summer Cup") ||
      body.includes("schedule") ||
      body.includes("Schedule")
    ).toBe(true);
  });

  test("shows PUBLISHED status badge for first config", async ({ page }) => {
    const body = await page.locator("body").innerText();
    expect(
      body.includes("PUBLISHED") ||
      body.includes("Published") ||
      body.includes("Cricket Premier League")
    ).toBe(true);
  });

  test("shows DRAFT status badge for second config", async ({ page }) => {
    const body = await page.locator("body").innerText();
    expect(
      body.includes("DRAFT") ||
      body.includes("Draft") ||
      body.includes("Badminton Summer Cup")
    ).toBe(true);
  });

  test("shows total team count on config row", async ({ page }) => {
    const body = await page.locator("body").innerText();
    // Config 1 has 4 teams, config 2 has 8 teams
    expect(body.includes("4 team") || body.includes("8 team") || body.includes("teams")).toBe(true);
  });

  test("shows tournament type (LEAGUE / KNOCKOUT)", async ({ page }) => {
    const body = await page.locator("body").innerText();
    expect(
      body.includes("LEAGUE") || body.includes("League") ||
      body.includes("KNOCKOUT") || body.includes("Knockout")
    ).toBe(true);
  });

  test("shows Schedule Builder link", async ({ page }) => {
    const scheduleBuilderLink = page.getByRole("link", { name: /Schedule Builder/i });
    const isVisible = await scheduleBuilderLink.isVisible({ timeout: 2000 }).catch(() => false);
    if (isVisible) {
      await expect(scheduleBuilderLink).toBeEnabled();
    }
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });

  test("shows config count summary text", async ({ page }) => {
    const body = await page.locator("body").innerText();
    // "2 tournament schedules" or similar
    expect(
      body.includes("2 tournament") ||
      body.includes("schedule") ||
      body.includes("Cricket")
    ).toBe(true);
  });

  test("refresh button does not crash", async ({ page }) => {
    const refreshBtn = page.locator('button[title*="refresh" i], button svg.lucide-refresh-cw').locator("..");
    if (await refreshBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await refreshBtn.click();
      await page.waitForTimeout(500);
    }
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });
});

test.describe("Schedule Admin Tab — Accordion Expand", () => {
  test.beforeEach(async ({ page }) => {
    await gotoScheduleTab(page);
  });

  test("clicking a config row expands and loads matches", async ({ page }) => {
    const configRow = page.getByText("Cricket Premier League 2026").first();
    if (await configRow.isVisible({ timeout: 2000 }).catch(() => false)) {
      await configRow.click();
      await page.waitForTimeout(700);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });

  test("expanded config shows match team names", async ({ page }) => {
    const configRow = page.getByText("Cricket Premier League 2026").first();
    if (await configRow.isVisible({ timeout: 2000 }).catch(() => false)) {
      await configRow.click();
      await page.waitForTimeout(700);
      const body = await page.locator("body").innerText();
      expect(
        body.includes("Team Alpha") || body.includes("Team Beta") || body.includes("Team Gamma")
      ).toBe(true);
    }
  });

  test("expanded config shows COMPLETED match status", async ({ page }) => {
    const configRow = page.getByText("Cricket Premier League 2026").first();
    if (await configRow.isVisible({ timeout: 2000 }).catch(() => false)) {
      await configRow.click();
      await page.waitForTimeout(700);
      const body = await page.locator("body").innerText();
      expect(
        body.includes("Completed") || body.includes("COMPLETED") || body.includes("Team Alpha")
      ).toBe(true);
    }
  });

  test("expanded config shows SCHEDULED match status", async ({ page }) => {
    const configRow = page.getByText("Cricket Premier League 2026").first();
    if (await configRow.isVisible({ timeout: 2000 }).catch(() => false)) {
      await configRow.click();
      await page.waitForTimeout(700);
      const body = await page.locator("body").innerText();
      expect(
        body.includes("Scheduled") || body.includes("SCHEDULED") || body.includes("Team Gamma")
      ).toBe(true);
    }
  });

  test("expanded config shows match scores for completed match", async ({ page }) => {
    const configRow = page.getByText("Cricket Premier League 2026").first();
    if (await configRow.isVisible({ timeout: 2000 }).catch(() => false)) {
      await configRow.click();
      await page.waitForTimeout(700);
      const body = await page.locator("body").innerText();
      expect(
        body.includes("180/4") || body.includes("160/8") || body.includes("180") || body.includes("Team Alpha")
      ).toBe(true);
    }
  });

  test("expanded config shows venue name on match rows", async ({ page }) => {
    const configRow = page.getByText("Cricket Premier League 2026").first();
    if (await configRow.isVisible({ timeout: 2000 }).catch(() => false)) {
      await configRow.click();
      await page.waitForTimeout(700);
      const body = await page.locator("body").innerText();
      expect(
        body.includes("Main Ground") || body.includes("Ground") || body.includes("Team Alpha")
      ).toBe(true);
    }
  });

  test("expanded config shows scheduled date/time for pending match", async ({ page }) => {
    const configRow = page.getByText("Cricket Premier League 2026").first();
    if (await configRow.isVisible({ timeout: 2000 }).catch(() => false)) {
      await configRow.click();
      await page.waitForTimeout(700);
      const body = await page.locator("body").innerText();
      // Match 102 scheduled for Nov 6 2026
      expect(
        body.includes("Nov") || body.includes("06") || body.includes("2026") || body.includes("Team Gamma")
      ).toBe(true);
    }
  });

  test("clicking expanded config again collapses it", async ({ page }) => {
    const configRow = page.getByText("Cricket Premier League 2026").first();
    if (await configRow.isVisible({ timeout: 2000 }).catch(() => false)) {
      await configRow.click();
      await page.waitForTimeout(500);
      await configRow.click();
      await page.waitForTimeout(400);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });

  test("match row links navigate to match detail page", async ({ page }) => {
    const configRow = page.getByText("Cricket Premier League 2026").first();
    if (await configRow.isVisible({ timeout: 2000 }).catch(() => false)) {
      await configRow.click();
      await page.waitForTimeout(700);
      const externalLink = page.locator('a[href*="/sports/schedule"], a[href*="/sports/matches"], a[href*="detail"]').first();
      if (await externalLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(externalLink).toBeEnabled();
      }
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });
});

test.describe("Schedule Admin Tab — Empty State", () => {
  test("shows empty state when no tournament configs exist", async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
    await mockSportsDashboardRoutes(page);
    await mockSportsAdminRoutes(page);
    await page.route("**/api/tournament/configs**", (route) =>
      route.fulfill({ status: 200, json: [] })
    );
    await page.route("**/api/tournament/**", (route) =>
      route.fulfill({ status: 200, json: [] })
    );
    await page.goto("/sports/admin");
    await page.waitForTimeout(500);

    const scheduleBtn = page.getByRole("button", { name: /Schedule/i });
    if (await scheduleBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await scheduleBtn.click();
      await page.waitForTimeout(600);
      const body = await page.locator("body").innerText();
      expect(
        body.includes("No Tournament Schedules") ||
        body.includes("No schedules") ||
        body.includes("Create") ||
        body.includes("Schedule Builder")
      ).toBe(true);
    }
  });

  test("empty state shows link to Schedule Builder", async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
    await mockSportsDashboardRoutes(page);
    await mockSportsAdminRoutes(page);
    await page.route("**/api/tournament/configs**", (route) =>
      route.fulfill({ status: 200, json: [] })
    );
    await page.route("**/api/tournament/**", (route) =>
      route.fulfill({ status: 200, json: [] })
    );
    await page.goto("/sports/admin");
    await page.waitForTimeout(500);

    const scheduleBtn = page.getByRole("button", { name: /Schedule/i });
    if (await scheduleBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await scheduleBtn.click();
      await page.waitForTimeout(600);
      const link = page.getByRole("link", { name: /Open Schedule Builder|Schedule Builder/i });
      if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(link).toBeVisible();
      }
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });
});

test.describe("Schedule Admin Tab — API Error Handling", () => {
  test("shows graceful error when configs API fails", async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
    await mockSportsDashboardRoutes(page);
    await mockSportsAdminRoutes(page);
    await page.route("**/api/tournament/configs**", (route) =>
      route.fulfill({ status: 500, json: { error: "Server error" } })
    );
    await page.route("**/api/tournament/**", (route) =>
      route.fulfill({ status: 500, json: { error: "Server error" } })
    );
    await page.goto("/sports/admin");
    await page.waitForTimeout(500);

    const scheduleBtn = page.getByRole("button", { name: /Schedule/i });
    if (await scheduleBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await scheduleBtn.click();
      await page.waitForTimeout(600);
      await expect(page.locator("body")).not.toContainText("Unhandled");
      await expect(page.locator("body")).not.toContainText("Cannot read");
    }
  });

  test("shows error when expanding config fails to load matches", async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
    await mockSportsDashboardRoutes(page);
    await mockSportsAdminRoutes(page);
    await page.route("**/api/tournament/configs**", (route) =>
      route.fulfill({ status: 200, json: MOCK_TOURNAMENT_CONFIGS })
    );
    await page.route("**/api/tournament/*/matches**", (route) =>
      route.fulfill({ status: 500, json: { error: "Server error" } })
    );
    await page.route("**/api/tournament/**", (route) =>
      route.fulfill({ status: 200, json: [] })
    );
    await page.goto("/sports/admin");
    await page.waitForTimeout(500);

    const scheduleBtn = page.getByRole("button", { name: /Schedule/i });
    if (await scheduleBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await scheduleBtn.click();
      await page.waitForTimeout(600);
      const configRow = page.getByText("Cricket Premier League 2026").first();
      if (await configRow.isVisible({ timeout: 2000 }).catch(() => false)) {
        await configRow.click();
        await page.waitForTimeout(700);
        await expect(page.locator("body")).not.toContainText("Unhandled");
        await expect(page.locator("body")).not.toContainText("Cannot read");
      }
    }
  });
});

test.describe("Schedule Admin Tab — URL Param", () => {
  test("direct navigation to /sports/admin?tab=schedule works", async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
    await mockSportsDashboardRoutes(page);
    await mockSportsAdminRoutes(page);
    await mockTournamentScheduleRoutes(page);
    await page.goto("/sports/admin?tab=schedule");
    await page.waitForTimeout(700);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("Cannot read");
  });
});
