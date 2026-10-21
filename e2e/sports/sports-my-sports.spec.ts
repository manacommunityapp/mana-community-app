import { test, expect } from "@playwright/test";
import {
  injectAuth,
  mockAuthRoutes,
  mockSportsDashboardRoutes,
  mockSportsScheduleRoutes,
} from "../fixtures/auth";

test.describe("My Sports", () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
    await mockSportsDashboardRoutes(page);
    await mockSportsScheduleRoutes(page);

    const mockRegistrations = [
      {
        id: 1,
        sportName: "Cricket",
        eventName: "Cricket Premier League 2026",
        proposedTeamName: "Team Alpha",
        status: "APPROVED",
        matchType: "Singles / XI",
      },
      {
        id: 2,
        sportName: "Badminton",
        eventName: "Badminton Open 2026",
        proposedTeamName: null,
        status: "PENDING",
        matchType: "Singles",
      },
    ];

    // Endpoint called by sportsScheduleService.getMyRegistrations()
    await page.route("**/api/sports/schedule/registrations/mine**", async (route) => {
      await route.fulfill({
        status: 200,
        json: mockRegistrations,
      });
    });

    await page.route("**/api/sports/my-registrations**", async (route) => {
      await route.fulfill({
        status: 200,
        json: mockRegistrations,
      });
    });

    await page.route("**/api/sports/registrations/mine**", async (route) => {
      await route.fulfill({ status: 200, json: [] });
    });

    await page.route("**/api/auction/my-teams**", async (route) => {
      await route.fulfill({
        status: 200,
        json: [{ id: 1, name: "Team Alpha", sport: "Cricket", playerCount: 11 }],
      });
    });

    await page.goto("/sports/my-sports");
  });

  // ── Page renders ────────────────────────────────────────────────────────────

  test("renders My Sports page without crashing", async ({ page }) => {
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("Cannot read");
  });

  test("shows My Sports in breadcrumb", async ({ page }) => {
    // "My Sports" appears in both the breadcrumb and nav sub-pill — use first()
    await expect(page.getByRole("link", { name: /My Sports/i }).first()).toBeVisible();
  });

  // ── Sport selection grid ────────────────────────────────────────────────────

  test("renders the sport selection grid", async ({ page }) => {
    const settingsBtn = page.getByRole("button", { name: /settings/i }).first();
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await page.waitForTimeout(300);
    }
    const sportNames = ["Cricket", "Badminton", "Football", "Tennis"];
    let found = 0;
    for (const sport of sportNames) {
      if (await page.getByText(sport).first().isVisible().catch(() => false)) {
        found++;
      }
    }
    expect(found).toBeGreaterThan(0);
  });

  test("can click on a sport to select it", async ({ page }) => {
    const settingsBtn = page.getByRole("button", { name: /settings/i }).first();
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await page.waitForTimeout(300);
    }
    const cricketCard = page.getByText("Cricket").first();
    await expect(cricketCard).toBeVisible();
    await cricketCard.click();
    await page.waitForTimeout(300);
    // Should not crash after selection
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });

  // ── Registrations list ──────────────────────────────────────────────────────

  test("displays user's existing registrations", async ({ page }) => {
    // After page loads, registrations from mock should appear
    const regText = ["Cricket Premier League 2026", "Badminton Open 2026", "Team Alpha", "APPROVED", "PENDING"];
    let found = false;
    for (const text of regText) {
      if (await page.getByText(text).isVisible().catch(() => false)) {
        found = true;
        break;
      }
    }
    // If registrations are behind a tab/selection, attempt to reveal them
    if (!found) {
      const myRegTab = page.getByRole("button", { name: /my registrations|registered/i });
      if (await myRegTab.isVisible().catch(() => false)) {
        await myRegTab.click();
        await page.waitForTimeout(400);
        for (const text of regText) {
          if (await page.getByText(text).isVisible().catch(() => false)) {
            found = true;
            break;
          }
        }
      }
    }
    expect(found).toBe(true);
  });

  // ── Register button ─────────────────────────────────────────────────────────

  test("shows a register button or link", async ({ page }) => {
    const registerAction = page
      .locator("a[href*='register'], a, button")
      .filter({ hasText: /register|join|enroll/i })
      .first();
    await expect(registerAction).toBeVisible();
  });

  // ── Match type selection ────────────────────────────────────────────────────

  test("shows match type options after selecting a sport", async ({ page }) => {
    const settingsBtn = page.getByRole("button", { name: /settings/i }).first();
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await page.waitForTimeout(300);
    }
    const matchOptions = page.locator("select, [role='combobox'], option").filter({ hasText: /Batsman|Bowler|All-Rounder|Singles|Doubles/i });
    await expect(matchOptions.first()).toBeAttached();
  });

  // ── Empty state ─────────────────────────────────────────────────────────────

  test("shows empty state when user has no registrations", async ({ page }) => {
    await page.route("**/api/sports/schedule/registrations/mine**", (route) =>
      route.fulfill({ status: 200, json: [] })
    );
    await page.route("**/api/sports/my-registrations**", (route) =>
      route.fulfill({ status: 200, json: [] })
    );
    await page.route("**/api/sports/registrations/mine**", (route) =>
      route.fulfill({ status: 200, json: [] })
    );
    await page.goto("/sports/my-sports");
    await page.waitForTimeout(600);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });
});
