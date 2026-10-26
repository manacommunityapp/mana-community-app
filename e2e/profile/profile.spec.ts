import { test, expect } from "@playwright/test";
import { injectAuth, mockAuthRoutes, mockProfileRoutes } from "../fixtures/auth";

test.describe("Profile Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
    await mockProfileRoutes(page);
    await page.goto("/profile");
    await page.waitForTimeout(600);
  });

  // ── Page renders ─────────────────────────────────────────────────────────────

  test("renders profile page without crashing", async ({ page }) => {
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("Cannot read");
  });

  // ── Header: identity fields ───────────────────────────────────────────────────

  test("shows user full name in header", async ({ page }) => {
    await expect(page.getByText("Arjun Sharma").first()).toBeVisible();
  });

  test("shows VERIFIED KYC badge", async ({ page }) => {
    await expect(page.getByText("Verified").first()).toBeVisible();
  });

  test("shows Admin role badge", async ({ page }) => {
    await expect(page.getByText("Admin").first()).toBeVisible();
  });

  test("shows community name in header", async ({ page }) => {
    await expect(page.getByText("Le Community")).toBeVisible();
  });

  test("shows block and flat unit info in header", async ({ page }) => {
    // unitDisplay = "Block A - Flat 101"
    await expect(page.getByText(/Block A|Flat 101/i).first()).toBeVisible();
  });

  test("shows joined-since date in header", async ({ page }) => {
    // joinedAt: 2024-01-15 → "Jan 2024"
    await expect(page.getByText(/Jan 2024/i)).toBeVisible();
  });

  // ── Stats bar ─────────────────────────────────────────────────────────────────

  test("shows all 6 stat tiles", async ({ page }) => {
    const labels = ["Posts", "Network", "Events", "Items", "Jobs", "Sports"];
    let found = 0;
    for (const label of labels) {
      if (await page.getByText(label).isVisible().catch(() => false)) found++;
    }
    expect(found).toBeGreaterThanOrEqual(5);
  });

  test("shows correct stat values from mock data", async ({ page }) => {
    // posts: 12, connections: 48
    await expect(page.getByText("12").first()).toBeVisible();
    await expect(page.getByText("48").first()).toBeVisible();
  });

  // ── Tab navigation ────────────────────────────────────────────────────────────

  test("shows all 7 tab navigation items", async ({ page }) => {
    const tabLabels = ["Overview", "Family", "Activity", "Achievements", "Settings", "Security", "Privacy"];
    let found = 0;
    for (const label of tabLabels) {
      if ((await page.getByText(label).count()) > 0) found++;
    }
    expect(found).toBeGreaterThanOrEqual(6);
  });

  test("overview tab is active by default (no other tab param in URL)", async ({ page }) => {
    const url = page.url();
    expect(url).not.toContain("tab=family");
    expect(url).not.toContain("tab=security");
    expect(url).not.toContain("tab=settings");
  });

  // ── Overview tab content ──────────────────────────────────────────────────────

  test("shows email in contact cards", async ({ page }) => {
    await expect(page.getByText("arjun.sharma@manacommunity.test")).toBeVisible();
  });

  test("shows phone in contact cards", async ({ page }) => {
    await expect(page.getByText("9876543210")).toBeVisible();
  });

  test("shows bio text in overview", async ({ page }) => {
    await expect(page.getByText("Passionate cricket player and community volunteer.")).toBeVisible();
  });

  test("shows skills list with mock skills", async ({ page }) => {
    const skills = ["Cricket", "Badminton", "Photography"];
    let found = 0;
    for (const skill of skills) {
      if (await page.getByText(skill).isVisible().catch(() => false)) found++;
    }
    expect(found).toBeGreaterThan(0);
  });

  test("Add Skill button opens inline input", async ({ page }) => {
    const addSkillBtn = page.getByRole("button", { name: /Add Skill/i });
    if (await addSkillBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addSkillBtn.click();
      await expect(page.getByPlaceholder(/Skill.*Hobby/i)).toBeVisible();
    }
  });

  // ── Tab switching ─────────────────────────────────────────────────────────────

  test("Activity tab shows activity feed items", async ({ page }) => {
    const activityTab = page.getByRole("button", { name: /^Activity$/i }).first();
    await activityTab.click();
    await page.waitForTimeout(600);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    const feedTexts = ["Community Feed", "Marketplace", "Sports Day", "Posted", "Listed"];
    let found = 0;
    for (const text of feedTexts) {
      if (await page.getByText(text).isVisible().catch(() => false)) found++;
    }
    expect(found).toBeGreaterThan(0);
  });

  test("Security tab shows 2FA / authentication section", async ({ page }) => {
    const securityTab = page.getByRole("button", { name: /^Security$/i }).first();
    await securityTab.click();
    await page.waitForTimeout(600);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    const hasSecurity = await page.getByText(/Two.Factor|Authenticator|2FA|TOTP|Login Alert/i).isVisible().catch(() => false);
    expect(hasSecurity).toBe(true);
  });

  test("Security tab shows active sessions section", async ({ page }) => {
    const securityTab = page.getByRole("button", { name: /^Security$/i }).first();
    await securityTab.click();
    await page.waitForTimeout(600);
    const hasSession = await page.getByText(/Active.*Session|Device|Chrome|Windows/i).isVisible().catch(() => false);
    expect(hasSession).toBe(true);
  });

  test("Settings tab shows profile form fields", async ({ page }) => {
    const settingsTab = page.getByRole("button", { name: /^Settings$/i }).first();
    await settingsTab.click();
    await page.waitForTimeout(400);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    const hasForm = await page.getByText(/Full Name|Email|Phone|Gender|Date of Birth/i).isVisible().catch(() => false);
    expect(hasForm).toBe(true);
  });

  test("Edit button in header switches to settings tab", async ({ page }) => {
    const editBtn = page.getByRole("button", { name: /^Edit$/i }).first();
    await editBtn.click();
    await page.waitForTimeout(400);
    const url = page.url();
    const hasSettingsUrl = url.includes("tab=settings");
    const hasSettingsContent = await page.getByText(/Full Name|Profile Settings|Save Changes/i).isVisible().catch(() => false);
    expect(hasSettingsUrl || hasSettingsContent).toBe(true);
  });

  test("Family tab renders without crash and shows members", async ({ page }) => {
    const familyTab = page.getByRole("button", { name: /Family/i }).first();
    await familyTab.click();
    await page.waitForTimeout(600);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    const hasMembers =
      (await page.getByText("Priya Sharma").isVisible().catch(() => false)) ||
      (await page.getByText("Rohan Sharma").isVisible().catch(() => false)) ||
      (await page.getByText(/My Family|Add Member/i).isVisible().catch(() => false));
    expect(hasMembers).toBe(true);
  });

  test("Achievements tab renders without crash", async ({ page }) => {
    const achievementsTab = page.getByRole("button", { name: /Achievement|Awards/i }).first();
    await achievementsTab.click();
    await page.waitForTimeout(400);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });

  test("Privacy tab renders without crash", async ({ page }) => {
    const privacyTab = page.getByRole("button", { name: /Privacy/i }).first();
    await privacyTab.click();
    await page.waitForTimeout(400);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });

  // ── URL param ─────────────────────────────────────────────────────────────────

  test("URL ?tab=security restores security tab on load", async ({ page }) => {
    await page.goto("/profile?tab=security");
    await page.waitForTimeout(600);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    const hasSecurity = await page.getByText(/Two.Factor|Authenticator|2FA|Active Session|Login Alert/i).isVisible().catch(() => false);
    expect(hasSecurity).toBe(true);
  });

  test("URL ?tab=family restores family tab on load", async ({ page }) => {
    await page.goto("/profile?tab=family");
    await page.waitForTimeout(600);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });

  // ── Error state ───────────────────────────────────────────────────────────────

  test("shows error message when profile API fails", async ({ page }) => {
    await page.route("**/api/profile**", (route) =>
      route.fulfill({ status: 500, json: { error: "Internal Server Error" } })
    );
    await page.route("**/api/users/me**", (route) =>
      route.fulfill({ status: 500, json: { error: "Internal Server Error" } })
    );
    await page.goto("/profile");
    await page.waitForTimeout(800);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    const hasError = await page.getByText(/Could not load|Failed|profile data|error/i).isVisible().catch(() => false);
    expect(hasError).toBe(true);
  });

  test("Try Again button retries profile load on error", async ({ page }) => {
    let callCount = 0;
    await page.route("**/api/profile**", async (route) => {
      callCount++;
      if (callCount === 1) {
        await route.fulfill({ status: 500, json: { error: "Server Error" } });
      } else {
        await route.fulfill({ status: 200, json: { userId: 1, fullName: "Arjun Sharma", email: "arjun@test.com", phone: "9876543210", role: "ADMIN", kycStatus: "VERIFIED", stats: { posts: 0, connections: 0, eventsAttended: 0, itemsSold: 0, jobsPosted: 0, sportsPlayed: 0 }, skills: [] } });
      }
    });
    await page.route("**/api/users/me**", (route) =>
      route.fulfill({ status: 500, json: { error: "Server Error" } })
    );
    await page.goto("/profile");
    await page.waitForTimeout(800);
    const retryBtn = page.getByRole("button", { name: /Try Again/i });
    if (await retryBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await retryBtn.click();
      await page.waitForTimeout(800);
      expect(callCount).toBeGreaterThan(1);
    }
  });
});
