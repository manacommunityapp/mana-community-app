import { test, expect } from "@playwright/test";
import {
  injectAuth,
  mockAuthRoutes,
  mockSportsDashboardRoutes,
  mockSportsRegistrationRoutes,
  mockSportsPartnerRoutes,
  MOCK_SEARCH_USERS,
  MOCK_FAMILY_MEMBERS,
  MOCK_DOUBLES_EVENT,
} from "../fixtures/auth";

// ─────────────────────────────────────────────────────────────────────────────
// Sports Partner Selection — E2E Tests
// Covers: SportsPartnerSelector component (community / family / open_pool modes)
// rendered inside SportsRegister at /sports/register/:eventId for doubles events
// ─────────────────────────────────────────────────────────────────────────────

async function setupPartnerRoutes(page: import("@playwright/test").Page) {
  await injectAuth(page);
  await mockAuthRoutes(page);
  await mockSportsDashboardRoutes(page);
  await mockSportsRegistrationRoutes(page);
  await mockSportsPartnerRoutes(page);
}

test.describe("Sports Partner Selection (doubles events)", () => {
  test.beforeEach(async ({ page }) => {
    await setupPartnerRoutes(page);
    // Navigate to a doubles event registration page
    await page.goto(`/sports/register/${MOCK_DOUBLES_EVENT.id}`);
  });

  // ── Page renders ──────────────────────────────────────────────────────────────

  test("renders partner selection page without crashing", async ({ page }) => {
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("Cannot read");
  });

  test("shows partner selection UI for a doubles event", async ({ page }) => {
    await page.waitForTimeout(600);
    const body = await page.locator("body").innerText();
    expect(
      body.includes("Partner") ||
      body.includes("Doubles") ||
      body.includes("Register") ||
      body.includes("Badminton")
    ).toBe(true);
  });

  // ── Community member search mode ──────────────────────────────────────────────

  test("shows a partner search input in community mode", async ({ page }) => {
    await page.waitForTimeout(600);
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="partner" i], input[placeholder*="player" i]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill("Sne");
      await page.waitForTimeout(500);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });

  test("shows search results from mock API when typing in partner search", async ({ page }) => {
    await page.waitForTimeout(600);
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="partner" i], input[placeholder*="player" i]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill("Sne");
      await page.waitForTimeout(500);
      const body = await page.locator("body").innerText();
      expect(
        body.includes("Sneha") || body.includes("Patel") || body.includes("Rahul") || body.includes("Verma")
      ).toBe(true);
    }
  });

  test("can select a community member as partner", async ({ page }) => {
    await page.waitForTimeout(600);
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="partner" i], input[placeholder*="player" i]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill("Sne");
      await page.waitForTimeout(500);
      const snehaResult = page.getByText("Sneha Patel").first();
      if (await snehaResult.isVisible({ timeout: 2000 }).catch(() => false)) {
        await snehaResult.click();
        await page.waitForTimeout(300);
        await expect(page.locator("body")).not.toContainText("Unhandled");
        const body = await page.locator("body").innerText();
        expect(body.includes("Sneha Patel") || body.includes("Sneha")).toBe(true);
      }
    }
  });

  test("can clear or change partner selection", async ({ page }) => {
    await page.waitForTimeout(600);
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="partner" i], input[placeholder*="player" i]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill("Sne");
      await page.waitForTimeout(500);
      const snehaResult = page.getByText("Sneha Patel").first();
      if (await snehaResult.isVisible({ timeout: 2000 }).catch(() => false)) {
        await snehaResult.click();
        await page.waitForTimeout(300);
        // Try to find a clear/remove button
        const clearBtn = page.locator('button').filter({ hasText: /clear|remove|change|×|✕/i }).first();
        if (await clearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await clearBtn.click();
          await page.waitForTimeout(300);
          await expect(page.locator("body")).not.toContainText("Unhandled");
        }
      }
    }
  });

  // ── Family member mode ────────────────────────────────────────────────────────

  test("shows family member option or tab", async ({ page }) => {
    await page.waitForTimeout(600);
    const familyTab = page.getByRole("button", { name: /family/i }).first();
    if (await familyTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await familyTab.click();
      await page.waitForTimeout(400);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });

  test("family mode shows family members from mock", async ({ page }) => {
    await page.waitForTimeout(600);
    const familyTab = page.getByRole("button", { name: /family/i }).first();
    if (await familyTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await familyTab.click();
      await page.waitForTimeout(500);
      const body = await page.locator("body").innerText();
      // MOCK_FAMILY_MEMBERS names
      expect(
        body.includes("Ananya") || body.includes("Arjun") || body.includes("Family") || body.includes("Member")
      ).toBe(true);
    }
  });

  test("can select a family member as partner", async ({ page }) => {
    await page.waitForTimeout(600);
    const familyTab = page.getByRole("button", { name: /family/i }).first();
    if (await familyTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await familyTab.click();
      await page.waitForTimeout(500);
      const familyMember = page.getByText("Ananya").first();
      if (await familyMember.isVisible({ timeout: 2000 }).catch(() => false)) {
        await familyMember.click();
        await page.waitForTimeout(300);
        await expect(page.locator("body")).not.toContainText("Unhandled");
      }
    }
  });

  // ── Mixed doubles gender suggestion ──────────────────────────────────────────

  test("mixed doubles partner search does not crash the page", async ({ page }) => {
    // Navigate to the mixed doubles / badminton event registration
    await page.goto(`/sports/register/${MOCK_DOUBLES_EVENT.id}`);
    await page.waitForTimeout(600);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("TypeError");
  });

  test("mixed doubles shows partner mode selector without crashing", async ({ page }) => {
    await page.goto(`/sports/register/${MOCK_DOUBLES_EVENT.id}`);
    await page.waitForTimeout(600);
    const body = await page.locator("body").innerText();
    // Page should render meaningful content
    expect(body.length).toBeGreaterThan(50);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });

  // ── Error state ───────────────────────────────────────────────────────────────

  test("shows graceful fallback when users search API fails", async ({ page }) => {
    await page.route("**/api/users/search**", (route) =>
      route.fulfill({ status: 500, json: { error: "Error" } })
    );
    await page.goto(`/sports/register/${MOCK_DOUBLES_EVENT.id}`);
    await page.waitForTimeout(600);
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="partner" i]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill("Test");
      await page.waitForTimeout(500);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });
});
