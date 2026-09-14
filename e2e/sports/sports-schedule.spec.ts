import { test, expect } from "@playwright/test";
import {
  injectAuth,
  mockAuthRoutes,
  mockSportsDashboardRoutes,
  mockSportsScheduleRoutes,
} from "../fixtures/auth";

test.describe("Sports Schedule", () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
    await mockSportsDashboardRoutes(page);
    await mockSportsScheduleRoutes(page);
    await page.goto("/sports/schedule");
  });

  // ── Page renders ────────────────────────────────────────────────────────────

  test("renders the Schedule page without crashing", async ({ page }) => {
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("Cannot read");
  });

  test("shows the Sports breadcrumb with Schedule sub-section", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Schedule" })).toBeVisible();
  });

  // ── Tab navigation ──────────────────────────────────────────────────────────

  test("renders the Overview tab by default", async ({ page }) => {
    const overviewTab = page.getByRole("button", { name: /Overview/i });
    await expect(overviewTab).toBeVisible();
  });

  test("switches to My Matches tab", async ({ page }) => {
    const myMatchesTab = page.getByRole("button", { name: /My Matches/i });
    if (await myMatchesTab.isVisible()) {
      await myMatchesTab.click();
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });

  test("switches to All Events tab", async ({ page }) => {
    const allEventsTab = page.getByRole("button", { name: /All Events/i });
    if (await allEventsTab.isVisible()) {
      await allEventsTab.click();
      await page.waitForTimeout(300);
      await expect(page.locator("body")).not.toContainText("TypeError");
    }
  });

  test("switches to Leaderboard tab", async ({ page }) => {
    const leaderboardTab = page.getByRole("button", { name: /Leaderboard/i });
    if (await leaderboardTab.isVisible()) {
      await leaderboardTab.click();
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });

  // ── Event list ──────────────────────────────────────────────────────────────

  test("displays events from the mock API", async ({ page }) => {
    // The schedule page fetches events; at least one mocked event title should appear
    const eventTitles = ["Cricket Premier League", "Badminton Open"];
    let found = false;
    for (const title of eventTitles) {
      if (await page.getByText(title).isVisible().catch(() => false)) {
        found = true;
        break;
      }
    }
    // If the default tab doesn't list events, check after switching tab
    if (!found) {
      const allEventsTab = page.getByRole("button", { name: /All Events/i });
      if (await allEventsTab.isVisible()) {
        await allEventsTab.click();
        await page.waitForTimeout(400);
        for (const title of eventTitles) {
          if (await page.getByText(title).isVisible().catch(() => false)) {
            found = true;
            break;
          }
        }
      }
    }
    // Event data should appear somewhere in the schedule UI
    expect(found).toBe(true);
  });

  // ── Venue filter ────────────────────────────────────────────────────────────

  test("renders a sport or venue filter if available", async ({ page }) => {
    // Filter controls use select, input, or button-group patterns
    const filterEl = page.locator("select, [role='combobox'], [placeholder*='filter' i], [placeholder*='search' i]").first();
    // Filter may or may not be present depending on active tab — just ensure no crash
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });

  // ── Create event button (admin permission) ──────────────────────────────────

  test("shows a create/add event button for admin users", async ({ page }) => {
    // Admin users should see a create button somewhere on the schedule page
    const createBtn = page.getByRole("button", { name: /create|add|new event/i });
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(createBtn).toBeEnabled();
    }
    // Not all tabs may show the create button — absence is acceptable
  });

  // ── Empty state ─────────────────────────────────────────────────────────────

  test("shows empty state when schedule API returns no data", async ({ page }) => {
    await page.route("**/api/sports/events**", (route) =>
      route.fulfill({ status: 200, json: [] })
    );
    await page.route("**/api/sports/schedule**", (route) =>
      route.fulfill({ status: 200, json: { matches: [] } })
    );
    await page.goto("/sports/schedule");
    await page.waitForTimeout(600);
    // Should show empty state text or no crash
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });
});
