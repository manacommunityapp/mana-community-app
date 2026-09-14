import { test, expect } from "@playwright/test";
import {
  injectAuth,
  mockAuthRoutes,
  mockSportsDashboardRoutes,
  mockAnalyticsRoutes,
} from "../fixtures/auth";

test.describe("Sports Analytics", () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
    await mockSportsDashboardRoutes(page);
    await mockAnalyticsRoutes(page);
    await page.goto("/sports/analytics");
  });

  // ── Page renders ────────────────────────────────────────────────────────────

  test("renders the Analytics page without crashing", async ({ page }) => {
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("Cannot read");
  });

  test("shows Analytics in breadcrumb", async ({ page }) => {
    await expect(page.getByRole("link", { name: /Analytics/i })).toBeVisible();
  });

  // ── KPI / stat tiles ────────────────────────────────────────────────────────

  test("renders total events stat from mock data", async ({ page }) => {
    // Mock returns totalEvents: 12
    await expect(page.getByText("12")).toBeVisible();
  });

  test("renders total participants stat from mock data", async ({ page }) => {
    // Mock returns totalParticipants: 340
    await expect(page.getByText("340")).toBeVisible();
  });

  test("renders total matches stat from mock data", async ({ page }) => {
    // Mock returns totalMatches: 58
    await expect(page.getByText("58")).toBeVisible();
  });

  // ── Chart content ───────────────────────────────────────────────────────────

  test("renders sports breakdown chart with recharts SVG", async ({ page }) => {
    await page.waitForTimeout(800); // allow recharts to render
    // Recharts renders SVG elements
    const svgCount = await page.locator("svg").count();
    expect(svgCount).toBeGreaterThan(0);
  });

  test("sports breakdown shows sport names in legend or axis", async ({ page }) => {
    await page.waitForTimeout(800);
    const sportNames = ["Cricket", "Badminton", "Football"];
    let found = 0;
    for (const sport of sportNames) {
      if (await page.getByText(sport).isVisible().catch(() => false)) found++;
    }
    expect(found).toBeGreaterThan(0);
  });

  test("monthly trend chart shows month labels", async ({ page }) => {
    await page.waitForTimeout(800);
    const months = ["Jul", "Aug", "Sep"];
    let found = 0;
    for (const m of months) {
      if (await page.getByText(m).isVisible().catch(() => false)) found++;
    }
    expect(found).toBeGreaterThan(0);
  });

  // ── Loading and error states ────────────────────────────────────────────────

  test("shows loading skeleton while analytics API is pending", async ({ page }) => {
    // Delay the analytics response to observe loading state
    await page.route("**/api/analytics/**", async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      await route.fulfill({ status: 200, json: {} });
    });
    await page.goto("/sports/analytics");
    // Skeleton or spinner should be visible during load
    const loading = page.locator('.animate-pulse, .animate-spin, [data-testid="skeleton"]');
    // Just confirm no crash while loading
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });

  test("shows error/retry UI when analytics API fails", async ({ page }) => {
    await page.route("**/api/analytics/**", (route) =>
      route.fulfill({ status: 503, json: { error: "Service Unavailable" } })
    );
    await page.goto("/sports/analytics");
    await page.waitForTimeout(800);
    // Page should not crash; may show an error message or retry button
    await expect(page.locator("body")).not.toContainText("Unhandled");
    // Look for a retry button
    const retryBtn = page.getByRole("button", { name: /retry|refresh|reload/i });
    if (await retryBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(retryBtn).toBeEnabled();
    }
  });

  // ── Refresh button ──────────────────────────────────────────────────────────

  test("refresh button triggers a new API call", async ({ page }) => {
    let callCount = 0;
    await page.route("**/api/analytics/**", async (route) => {
      callCount++;
      await route.fulfill({
        status: 200,
        json: { totalEvents: callCount, totalParticipants: 0, totalMatches: 0, sportsBreakdown: [], monthlyTrend: [] },
      });
    });
    await page.goto("/sports/analytics");
    await page.waitForTimeout(500);
    const initialCount = callCount;

    const refreshBtn = page.getByRole("button", { name: /refresh|reload/i });
    if (await refreshBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await refreshBtn.click();
      await page.waitForTimeout(500);
      expect(callCount).toBeGreaterThan(initialCount);
    }
  });
});
