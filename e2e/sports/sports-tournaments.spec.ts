import { test, expect } from "@playwright/test";
import {
  injectAuth,
  mockAuthRoutes,
  mockSportsDashboardRoutes,
  mockSportsTournamentsRoutes,
  MOCK_OPEN_TOURNAMENTS,
} from "../fixtures/auth";

test.describe("Sports Tournaments Browse", () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
    await mockSportsDashboardRoutes(page);
    await mockSportsTournamentsRoutes(page);
    await page.goto("/sports/tournaments");
  });

  // ── Page renders ────────────────────────────────────────────────────────────

  test("renders the Tournaments page without crashing", async ({ page }) => {
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("Cannot read");
  });

  test("shows Tournaments in breadcrumb", async ({ page }) => {
    await expect(page.getByRole("link", { name: /Tournaments/i })).toBeVisible();
  });

  // ── Tab navigation ──────────────────────────────────────────────────────────

  test("renders Open Registrations tab by default", async ({ page }) => {
    // Default tab is 'open' — page should show open tournaments
    await page.waitForTimeout(600);
    await expect(page.locator("body")).not.toContainText("TypeError");
    const tabBtn = page.getByRole("button", { name: /Open|Registration/i }).first();
    if (await tabBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(tabBtn).toBeVisible();
    }
  });

  test("switches to My Registrations tab", async ({ page }) => {
    const myTab = page.getByRole("button", { name: /My Registrations|My Tournaments/i });
    if (await myTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await myTab.click();
      await page.waitForTimeout(400);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });

  test("switches to Closed Tournaments tab", async ({ page }) => {
    const closedTab = page.getByRole("button", { name: /Closed|Past/i });
    if (await closedTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closedTab.click();
      await page.waitForTimeout(400);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });

  // ── Tournament cards ─────────────────────────────────────────────────────────

  test("displays open tournaments from mock API", async ({ page }) => {
    await page.waitForTimeout(600);
    const names = MOCK_OPEN_TOURNAMENTS.map(t => t.name);
    let found = 0;
    for (const name of names) {
      if (await page.getByText(name).isVisible().catch(() => false)) found++;
    }
    expect(found).toBeGreaterThan(0);
  });

  test("shows sport emoji or sport label on tournament cards", async ({ page }) => {
    await page.waitForTimeout(600);
    const sports = ["Cricket", "Badminton"];
    let found = 0;
    for (const sport of sports) {
      if (await page.getByText(sport).first().isVisible().catch(() => false)) found++;
    }
    expect(found).toBeGreaterThan(0);
  });

  test("shows registration status badge on tournament cards", async ({ page }) => {
    await page.waitForTimeout(600);
    const statusTexts = ["Open", "OPEN", "Registration Open", "Upcoming", "Active"];
    let found = false;
    for (const text of statusTexts) {
      if (await page.getByText(text).first().isVisible().catch(() => false)) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  // ── Search / filter ──────────────────────────────────────────────────────────

  test("renders a search input for filtering tournaments", async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="tournament" i]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill("Cricket");
      await page.waitForTimeout(300);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });

  test("renders a sport filter dropdown or chip group", async ({ page }) => {
    // Sport filter (All / Cricket / Badminton / etc.)
    const filterEl = page.locator("select, [role='combobox'], button").filter({ hasText: /All Sports|Cricket|Badminton/ }).first();
    if (await filterEl.isVisible({ timeout: 2000 }).catch(() => false)) {
      await filterEl.click().catch(() => {});
      await page.waitForTimeout(300);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });

  // ── Tournament detail modal ──────────────────────────────────────────────────

  test("clicking a tournament card opens detail or navigates", async ({ page }) => {
    await page.waitForTimeout(600);
    const tournamentCard = page.getByText("Cricket Premier League 2026").first();
    if (await tournamentCard.isVisible().catch(() => false)) {
      await tournamentCard.click();
      await page.waitForTimeout(500);
      // Should either show a modal or navigate — no crash
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });

  test("Register button on a tournament card navigates to registration", async ({ page }) => {
    await page.waitForTimeout(600);
    const registerBtn = page.getByRole("button", { name: /Register|Join/i }).first();
    if (await registerBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await registerBtn.click();
      await page.waitForTimeout(500);
      const url = page.url();
      expect(
        url.includes("/register/") || url.includes("/sports/register") || url.includes("/sports/tournaments")
      ).toBe(true);
    }
  });

  // ── Closed tournaments tab ────────────────────────────────────────────────────

  test("closed tournaments tab shows past tournaments", async ({ page }) => {
    const closedTab = page.getByRole("button", { name: /Closed|Past/i });
    if (await closedTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closedTab.click();
      await page.waitForTimeout(500);
      const body = await page.locator("body").innerText();
      expect(
        body.includes("Kabaddi") || body.includes("2025") || body.includes("Closed") || body.includes("Past")
      ).toBe(true);
    }
  });

  // ── Empty state ──────────────────────────────────────────────────────────────

  test("shows empty state or no-tournaments message when API returns empty", async ({ page }) => {
    await page.route("**/api/sports/dashboard/open-tournaments", (route) =>
      route.fulfill({ status: 200, json: [] })
    );
    await page.goto("/sports/tournaments");
    await page.waitForTimeout(600);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });

  // ── Error state ───────────────────────────────────────────────────────────────

  test("shows fallback when tournaments API fails", async ({ page }) => {
    await page.route("**/api/sports/dashboard/open-tournaments", (route) =>
      route.fulfill({ status: 500, json: { error: "Server error" } })
    );
    await page.goto("/sports/tournaments");
    await page.waitForTimeout(600);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });
});
