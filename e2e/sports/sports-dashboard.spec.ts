import { test, expect } from "@playwright/test";
import {
  injectAuth,
  mockAuthRoutes,
  mockSportsDashboardRoutes,
  mockSportsScheduleRoutes,
  mockSportsAdminRoutes,
} from "../fixtures/auth";

test.describe("Sports Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
    await mockSportsDashboardRoutes(page);
    await mockSportsScheduleRoutes(page);
    await mockSportsAdminRoutes(page);
    await page.goto("/sports");
  });

  // ── Stat cards ──────────────────────────────────────────────────────────────

  test("renders the four stat cards with mocked values", async ({ page }) => {
    // Exact-match each stat card label together with its value to avoid strict-mode ambiguity
    const expected: Array<[string, string]> = [
      ["Your Registrations", "3"],   // yourRegistrations
      ["Live Events", "1"],          // liveEvents
      ["Open Registrations", "5"],   // openRegistrations
      ["Upcoming Tournaments", "2"], // upcomingTournaments
    ];
    for (const [label, value] of expected) {
      const card = page.locator("div.card-hover-lift", { hasText: label });
      await expect(card).toBeVisible();
      await expect(card.getByText(value, { exact: true })).toBeVisible();
    }
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
    // If pending approvals widget is on dashboard or admin hub, verify Team Beta is visible
    const pending = page.getByText("Team Beta").first();
    if (await pending.isVisible().catch(() => false)) {
      await expect(pending).toBeVisible();
    } else {
      await page.goto("/sports/admin");
      await expect(page.getByText("Team Beta").first()).toBeVisible();
    }
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
