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

    // My Sports-specific routes
    await page.route("**/api/sports/my-registrations**", async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: 1,
            sport: "Cricket",
            eventName: "Cricket Premier League 2026",
            teamName: "Team Alpha",
            status: "APPROVED",
            matchType: "Singles / XI",
          },
          {
            id: 2,
            sport: "Badminton",
            eventName: "Badminton Open 2026",
            teamName: null,
            status: "PENDING",
            matchType: "Singles",
          },
        ],
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
    await expect(page.getByRole("link", { name: /My Sports/i })).toBeVisible();
  });

  // ── Sport selection grid ────────────────────────────────────────────────────

  test("renders the sport selection grid", async ({ page }) => {
    // All-sports list is hardcoded — Cricket, Badminton, etc. should appear
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
    const registerBtn = page.getByRole("button", { name: /register|join|enroll/i });
    const registerLink = page.getByRole("link", { name: /register|join|enroll/i });
    const hasRegBtn = await registerBtn.isVisible({ timeout: 2000 }).catch(() => false);
    const hasRegLink = await registerLink.isVisible({ timeout: 2000 }).catch(() => false);
    // At least one registration action should be available
    expect(hasRegBtn || hasRegLink).toBe(true);
  });

  // ── Match type selection ────────────────────────────────────────────────────

  test("shows match type options after selecting a sport", async ({ page }) => {
    await page.getByText("Cricket").first().click();
    await page.waitForTimeout(300);
    // Cricket match types: "Singles / XI", "Doubles"
    const matchTypes = ["Singles", "XI", "Doubles"];
    let found = false;
    for (const type of matchTypes) {
      if (await page.getByText(type).isVisible().catch(() => false)) {
        found = true;
        break;
      }
    }
    // Match type options should appear after sport selection
    expect(found).toBe(true);
  });

  // ── Empty state ─────────────────────────────────────────────────────────────

  test("shows empty state when user has no registrations", async ({ page }) => {
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
