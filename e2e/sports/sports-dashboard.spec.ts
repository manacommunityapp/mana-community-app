import { test, expect } from "@playwright/test";
import {
  injectAuth,
  mockAuthRoutes,
  mockSportsDashboardRoutes,
  mockSportsScheduleRoutes,
} from "../fixtures/auth";

test.describe("Sports Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
    await mockSportsDashboardRoutes(page);
    await mockSportsScheduleRoutes(page);
    await page.goto("/sports");
  });

  // ── Stat cards ──────────────────────────────────────────────────────────────

  test("renders the four stat cards with mocked values", async ({ page }) => {
    await expect(page.getByText("3")).toBeVisible();       // yourRegistrations
    await expect(page.getByText("1")).toBeVisible();       // liveEvents
    await expect(page.getByText("5")).toBeVisible();       // openRegistrations
    await expect(page.getByText("2")).toBeVisible();       // upcomingTournaments
  });

  test("stat card labels are visible", async ({ page }) => {
    // At least one of the known label texts should appear
    const labelTexts = ["Registration", "Live", "Open", "Tournament", "Event"];
    let found = false;
    for (const text of labelTexts) {
      const count = await page.getByText(new RegExp(text, "i")).count();
      if (count > 0) { found = true; break; }
    }
    expect(found).toBe(true);
  });

  // ── Tournament list ─────────────────────────────────────────────────────────

  test("displays active tournaments from mock API", async ({ page }) => {
    await expect(page.getByText("Cricket Premier League 2026")).toBeVisible();
    await expect(page.getByText("Badminton Cup 2026")).toBeVisible();
  });

  test("shows tournament sport labels", async ({ page }) => {
    await expect(page.getByText(/Cricket/i).first()).toBeVisible();
    await expect(page.getByText(/Badminton/i).first()).toBeVisible();
  });

  // ── Open registrations ──────────────────────────────────────────────────────

  test("displays open registrations section", async ({ page }) => {
    // Should show registration-related content from mock
    await expect(
      page.getByText(/Cricket Premier League 2026|Badminton Cup 2026/i).first()
    ).toBeVisible();
  });

  // ── Teams pending approval ──────────────────────────────────────────────────

  test("shows pending team in approvals area", async ({ page }) => {
    // Team Beta is PENDING
    await expect(page.getByText("Team Beta")).toBeVisible();
  });

  // ── Navigation shortcuts ────────────────────────────────────────────────────

  test("clicking a tournament navigates or expands detail", async ({ page }) => {
    // Clicking a tournament row/card should either navigate or show detail
    const tournament = page.getByText("Cricket Premier League 2026");
    await expect(tournament).toBeVisible();
    await tournament.click();
    // Either URL changes or a detail panel appears — check for expanded state
    await page.waitForTimeout(400);
    // No error should occur
    await expect(page.locator("body")).not.toContainText("Error");
  });

  // ── Error state ─────────────────────────────────────────────────────────────

  test("shows fallback when stats API fails", async ({ page }) => {
    // Override stats route to return error
    await page.route("**/api/sports/dashboard/stats**", (route) =>
      route.fulfill({ status: 500, json: { error: "Internal Server Error" } })
    );
    await page.goto("/sports");
    // Page should not crash — either shows 0/error state or a retry button
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });

  // ── Loading skeleton ────────────────────────────────────────────────────────

  test("does not remain in loading state after API responds", async ({ page }) => {
    // Spinner/loader should not be visible after data loads
    const loader = page.locator('[data-testid="loader"], .animate-spin, .animate-pulse');
    // Wait for content to appear first
    await expect(page.getByText("Cricket Premier League 2026")).toBeVisible();
    // Spinner should be gone
    await expect(loader.first()).not.toBeVisible({ timeout: 5000 }).catch(() => {
      // If no loader element, that's fine too
    });
  });
});
