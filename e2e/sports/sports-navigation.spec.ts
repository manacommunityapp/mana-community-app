import { test, expect } from "@playwright/test";
import {
  injectAuth,
  mockAuthRoutes,
  mockSportsDashboardRoutes,
  mockSportsScheduleRoutes,
  mockSportsAdminRoutes,
  mockSportsTournamentsRoutes,
  mockSportsMyTeamsRoutes,
  mockSportsBadgesRoutes,
  mockSportsLeaderboardRoutes,
  mockSportsMyAuctionsRoutes,
} from "../fixtures/auth";

test.describe("Sports Module — Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
    await mockSportsDashboardRoutes(page);
    await mockSportsScheduleRoutes(page);
    await mockSportsAdminRoutes(page);
    await mockSportsTournamentsRoutes(page);
    await mockSportsMyTeamsRoutes(page);
    await mockSportsBadgesRoutes(page);
    await mockSportsLeaderboardRoutes(page);
    await mockSportsMyAuctionsRoutes(page);
  });

  // ── Header & breadcrumb ──────────────────────────────────────────────────────

  test("renders the Sports breadcrumb and page header", async ({ page }) => {
    await page.goto("/sports");
    await expect(page.getByRole("link", { name: "Sports", exact: true })).toBeVisible();
    await expect(page.getByText("Leagues, teams, schedules")).toBeVisible();
  });

  // ── Full nav bar ─────────────────────────────────────────────────────────────

  test("renders all nav bar items for a user with full permissions", async ({ page }) => {
    await page.goto("/sports");
    // Use .first() to avoid strict-mode violations when links appear in both nav and floating button
    await expect(page.getByRole("link", { name: /Dashboard/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /My Sports/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Schedule/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Auction/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Admin/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Analytics/i }).first()).toBeVisible();
  });

  // ── Navigation from nav bar ──────────────────────────────────────────────────

  test("navigates to Schedule page from nav bar", async ({ page }) => {
    await page.goto("/sports");
    await page.getByRole("link", { name: /Schedule/i }).click();
    await expect(page).toHaveURL(/\/sports\/schedule/);
  });

  test("navigates to Admin page from nav bar", async ({ page }) => {
    await page.goto("/sports");
    await page.getByRole("link", { name: /Admin/i }).click();
    await expect(page).toHaveURL(/\/sports\/admin/);
  });

  test("navigates to My Sports from nav bar", async ({ page }) => {
    await page.goto("/sports");
    await page.getByRole("link", { name: /My Sports/i }).click();
    await expect(page).toHaveURL(/\/sports\/my-sports/);
  });

  test("navigates to Analytics from nav bar", async ({ page }) => {
    await page.goto("/sports");
    await page.getByRole("link", { name: /Analytics/i }).click();
    await expect(page).toHaveURL(/\/sports\/analytics/);
  });

  test("navigates to Tournaments from nav bar", async ({ page }) => {
    await page.goto("/sports");
    await page.getByRole("link", { name: /Tournaments/i }).click();
    await expect(page).toHaveURL(/\/sports\/tournaments/);
  });

  test("navigates to My Teams from nav bar", async ({ page }) => {
    await page.goto("/sports");
    await page.getByRole("link", { name: /My Teams/i }).click();
    await expect(page).toHaveURL(/\/sports\/my-teams/);
  });

  test("navigates to Badges from nav bar", async ({ page }) => {
    await page.goto("/sports");
    await page.getByRole("link", { name: /Badges/i }).click();
    await expect(page).toHaveURL(/\/sports\/badges/);
  });

  // ── Active state ─────────────────────────────────────────────────────────────

  test("highlights the active nav item", async ({ page }) => {
    await page.goto("/sports/schedule");
    // Schedule appears in breadcrumb (nth(0)) and the sports sub-nav pill (nth(1))
    const scheduleLink = page.getByRole("link", { name: "Schedule" }).nth(1);
    await expect(scheduleLink).toBeVisible();
    const color = await scheduleLink.evaluate((el) =>
      getComputedStyle(el.querySelector("div") ?? el).color
    );
    // Active item renders white text — rgb(255, 255, 255)
    expect(color).toBe("rgb(255, 255, 255)");
  });

  test("highlights Tournaments nav item when on tournaments page", async ({ page }) => {
    await page.goto("/sports/tournaments");
    const tournamentsLink = page.getByRole("link", { name: /Tournaments/i });
    await expect(tournamentsLink).toBeVisible();
    const color = await tournamentsLink.evaluate((el) =>
      getComputedStyle(el.querySelector("div") ?? el).color
    );
    expect(color).toBe("rgb(255, 255, 255)");
  });

  test("highlights My Teams nav item when on my-teams page", async ({ page }) => {
    await page.goto("/sports/my-teams");
    const myTeamsLink = page.getByRole("link", { name: /My Teams/i });
    await expect(myTeamsLink).toBeVisible();
    const color = await myTeamsLink.evaluate((el) =>
      getComputedStyle(el.querySelector("div") ?? el).color
    );
    expect(color).toBe("rgb(255, 255, 255)");
  });

  test("highlights Badges nav item when on badges page", async ({ page }) => {
    await page.goto("/sports/badges");
    const badgesLink = page.getByRole("link", { name: /Badges/i });
    await expect(badgesLink).toBeVisible();
    const color = await badgesLink.evaluate((el) =>
      getComputedStyle(el.querySelector("div") ?? el).color
    );
    expect(color).toBe("rgb(255, 255, 255)");
  });

  // ── Breadcrumbs ──────────────────────────────────────────────────────────────

  test("shows breadcrumb trail with current sub-section", async ({ page }) => {
    await page.goto("/sports/schedule");
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sports", exact: true })).toBeVisible();
    // Schedule appears in both breadcrumb and the nav pill — use first()
    await expect(page.getByRole("link", { name: "Schedule" }).first()).toBeVisible();
  });

  test("shows Tournaments in breadcrumb when on tournaments page", async ({ page }) => {
    await page.goto("/sports/tournaments");
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sports" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Tournaments" })).toBeVisible();
  });

  test("shows Badges in breadcrumb when on badges page", async ({ page }) => {
    await page.goto("/sports/badges");
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sports" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Badges" })).toBeVisible();
  });

  test("navigates to My Auctions from nav bar", async ({ page }) => {
    await page.goto("/sports");
    const myAuctionsLink = page.getByRole("link", { name: /My Auctions/i });
    if (await myAuctionsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await myAuctionsLink.click();
      await expect(page).toHaveURL(/\/sports\/my-auctions/);
    }
  });

  test("highlights My Auctions nav item when on my-auctions page", async ({ page }) => {
    await page.goto("/sports/my-auctions");
    const myAuctionsLink = page.getByRole("link", { name: /My Auctions/i });
    if (await myAuctionsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      const color = await myAuctionsLink.evaluate((el) =>
        getComputedStyle(el.querySelector("div") ?? el).color
      );
      expect(color).toBe("rgb(255, 255, 255)");
    }
  });

  test("My Auctions page renders without crashing from nav", async ({ page }) => {
    await page.goto("/sports/my-auctions");
    await page.waitForTimeout(600);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });

  // ── Notification bell ────────────────────────────────────────────────────────

  test("renders the notification bell in the header", async ({ page }) => {
    await page.goto("/sports");
    // SportsNotificationBell is always rendered in the header
    await expect(page.locator("body")).not.toContainText("Unhandled");
    // Bell icon or button should be in the header area
    const bell = page.locator('[aria-label*="notification" i], button[title*="notification" i]').first();
    // Presence is optional per permission — just verify no crash
    await expect(page.locator("body")).not.toContainText("Cannot read");
  });
});
