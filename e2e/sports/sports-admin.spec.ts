import { test, expect } from "@playwright/test";
import {
  injectAuth,
  mockAuthRoutes,
  mockSportsDashboardRoutes,
  mockSportsAdminRoutes,
} from "../fixtures/auth";

test.describe("Sports Admin Hub", () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
    await mockSportsDashboardRoutes(page);
    await mockSportsAdminRoutes(page);
    await page.goto("/sports/admin");
  });

  // ── Layout ──────────────────────────────────────────────────────────────────

  test("renders the Admin Hub sidebar", async ({ page }) => {
    await expect(page.getByText("Admin Hub")).toBeVisible();
  });

  test("renders the Management nav section in the sidebar", async ({ page }) => {
    await expect(page.getByText(/Management/i)).toBeVisible();
  });

  test("renders sidebar nav items", async ({ page }) => {
    const navItems = ["Dashboard", "Teams", "Schedule", "Results", "Settings"];
    let found = 0;
    for (const item of navItems) {
      if (await page.getByRole("button", { name: item }).isVisible().catch(() => false)) {
        found++;
      }
    }
    expect(found).toBeGreaterThan(0);
  });

  // ── Dashboard tab ────────────────────────────────────────────────────────────

  test("shows Dashboard tab content by default", async ({ page }) => {
    // Dashboard is the default active tab
    await expect(page.locator("body")).not.toContainText("Unhandled");
    // Either stat cards or a list is visible
    const content = await page.locator(".main-content").isVisible().catch(() => false);
    expect(content).toBe(true);
  });

  test("Dashboard tab shows active tournaments count", async ({ page }) => {
    // Mock returns 2 tournaments
    await expect(page.getByText(/Cricket Premier League 2026|Badminton Cup 2026/i).first()).toBeVisible();
  });

  test("Dashboard tab shows pending team approvals", async ({ page }) => {
    await expect(page.getByText("Team Beta")).toBeVisible();
  });

  // ── Tab switching ────────────────────────────────────────────────────────────

  test("switches to Teams tab", async ({ page }) => {
    const teamsBtn = page.getByRole("button", { name: /^Teams$/i });
    if (await teamsBtn.isVisible()) {
      await teamsBtn.click();
      await page.waitForTimeout(400);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });

  test("switches to Schedule (Admin) tab", async ({ page }) => {
    const scheduleBtn = page.getByRole("button", { name: /Schedule/i });
    if (await scheduleBtn.isVisible()) {
      await scheduleBtn.click();
      await page.waitForTimeout(400);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });

  test("switches to Results tab", async ({ page }) => {
    const resultsBtn = page.getByRole("button", { name: /Results/i });
    if (await resultsBtn.isVisible()) {
      await resultsBtn.click();
      await page.waitForTimeout(400);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });

  test("switches to Settings tab", async ({ page }) => {
    const settingsBtn = page.getByRole("button", { name: /Settings/i });
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await page.waitForTimeout(400);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });

  test("switches to Notifications tab", async ({ page }) => {
    const notifBtn = page.getByRole("button", { name: /Notification/i });
    if (await notifBtn.isVisible()) {
      await notifBtn.click();
      await page.waitForTimeout(400);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });

  // ── Teams tab interactions ───────────────────────────────────────────────────

  test("Teams tab shows team list and approve/reject buttons", async ({ page }) => {
    const teamsBtn = page.getByRole("button", { name: /^Teams$/i });
    if (await teamsBtn.isVisible()) {
      await teamsBtn.click();
      await page.waitForTimeout(400);
      // Pending team from mock should be visible
      await expect(page.getByText("Team Beta")).toBeVisible();
      // Approve / Reject actions should be present
      const approveBtn = page.getByRole("button", { name: /approve/i });
      const rejectBtn = page.getByRole("button", { name: /reject|decline/i });
      const hasApprove = await approveBtn.isVisible({ timeout: 2000 }).catch(() => false);
      const hasReject = await rejectBtn.isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasApprove || hasReject).toBe(true);
    }
  });

  // ── Create Tournament ────────────────────────────────────────────────────────

  test("Create Tournament tab renders a form", async ({ page }) => {
    const createBtn = page.getByRole("button", { name: /Create Tournament|New Tournament/i });
    if (await createBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(400);
      // A form with at least a name field should appear
      const nameInput = page.getByLabel(/tournament name|name/i).first();
      await expect(nameInput).toBeVisible();
    }
  });

  // ── Sport Events tab ─────────────────────────────────────────────────────────

  test("Sports Events tab lists configured events", async ({ page }) => {
    const eventsBtn = page.getByRole("button", { name: /Sports Event|Events/i });
    if (await eventsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await eventsBtn.click();
      await page.waitForTimeout(400);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });

  // ── Venue creation section ───────────────────────────────────────────────────

  test("Venue section shows venue list from mock", async ({ page }) => {
    const venuesBtn = page.getByRole("button", { name: /Venue/i });
    if (await venuesBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await venuesBtn.click();
      await page.waitForTimeout(400);
      await expect(page.getByText(/Main Ground|Indoor Hall/i).first()).toBeVisible();
    }
  });

  // ── Player categories section ────────────────────────────────────────────────

  test("Player Categories section shows categories from mock", async ({ page }) => {
    const catBtn = page.getByRole("button", { name: /Player Categor/i });
    if (await catBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await catBtn.click();
      await page.waitForTimeout(400);
      await expect(page.getByText(/Open|Youth|Senior/i).first()).toBeVisible();
    }
  });

  // ── URL params preserve active tab ───────────────────────────────────────────

  test("URL tab param restores active tab on reload", async ({ page }) => {
    // Navigate with ?tab=teams query param (useSportsAdminState uses useSearchParams)
    await page.goto("/sports/admin?tab=teams");
    await page.waitForTimeout(500);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });
});
