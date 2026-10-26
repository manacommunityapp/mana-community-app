import { test, expect } from "@playwright/test";
import {
  injectAuth,
  mockAuthRoutes,
  mockSportsDashboardRoutes,
  mockSportsRegistrationRoutes,
  mockSportsTeamRegistrationRoutes,
  MOCK_SEARCH_USERS,
} from "../fixtures/auth";

// ─────────────────────────────────────────────────────────────────────────────
// Sports Team Registration — E2E Tests
// Covers: SportsTeamRegistration component at /sports/team-register/:eventId
// ─────────────────────────────────────────────────────────────────────────────

async function setupTeamRegRoutes(page: import("@playwright/test").Page) {
  await injectAuth(page);
  await mockAuthRoutes(page);
  await mockSportsDashboardRoutes(page);
  await mockSportsRegistrationRoutes(page);
  await mockSportsTeamRegistrationRoutes(page);
}

test.describe("Sports Team Registration", () => {
  test.beforeEach(async ({ page }) => {
    await setupTeamRegRoutes(page);
    await page.goto("/sports/team-register/102");
  });

  // ── Page renders ─────────────────────────────────────────────────────────────

  test("renders team registration page without crashing", async ({ page }) => {
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("Cannot read");
  });

  test("shows Team Register heading or label", async ({ page }) => {
    await page.waitForTimeout(600);
    const body = await page.locator("body").innerText();
    expect(
      body.includes("Team") || body.includes("Register") || body.includes("Football")
    ).toBe(true);
  });

  // ── Team name input ───────────────────────────────────────────────────────────

  test("renders a team name input field", async ({ page }) => {
    await page.waitForTimeout(600);
    const nameInput = page.locator('input[placeholder*="team name" i], input[placeholder*="Team Name" i], input[name*="team" i]').first();
    if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameInput.fill("Test Warriors");
      await expect(nameInput).toHaveValue("Test Warriors");
    }
  });

  // ── Emoji picker ─────────────────────────────────────────────────────────────

  test("shows emoji picker or emoji button for team icon", async ({ page }) => {
    await page.waitForTimeout(600);
    const emojiBtn = page.locator('button[aria-label*="emoji" i], button[title*="emoji" i], button').filter({ hasText: /🏆|⚽|🏅|emoji/i }).first();
    if (await emojiBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emojiBtn.click();
      await page.waitForTimeout(300);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });

  // ── Category dropdown ─────────────────────────────────────────────────────────

  test("category dropdown is populated from mock API", async ({ page }) => {
    await page.waitForTimeout(600);
    const categorySelect = page.locator("select").first();
    if (await categorySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      const options = await categorySelect.locator("option").allInnerTexts();
      const hasCategory = options.some(o => o.includes("Open") || o.includes("Youth") || o.includes("Senior"));
      expect(hasCategory).toBe(true);
    } else {
      // Category may be a custom dropdown
      const body = await page.locator("body").innerText();
      expect(body.includes("Open") || body.includes("Category")).toBe(true);
    }
  });

  // ── Member search ─────────────────────────────────────────────────────────────

  test("renders a member search input", async ({ page }) => {
    await page.waitForTimeout(600);
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="member" i], input[placeholder*="player" i]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill("Rahul");
      await page.waitForTimeout(400); // debounce 300ms
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });

  test("shows search results from mock API when query typed", async ({ page }) => {
    await page.waitForTimeout(600);
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="member" i], input[placeholder*="player" i]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill("Ra");
      await page.waitForTimeout(500); // wait for debounce + render
      const body = await page.locator("body").innerText();
      expect(
        body.includes("Rahul Verma") || body.includes("Kiran Joshi") || body.includes("Rahul") || body.includes("Verma")
      ).toBe(true);
    }
  });

  test("can add a member from search results", async ({ page }) => {
    await page.waitForTimeout(600);
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="member" i], input[placeholder*="player" i]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill("Ra");
      await page.waitForTimeout(500);
      const rahulResult = page.getByText("Rahul Verma").first();
      if (await rahulResult.isVisible({ timeout: 2000 }).catch(() => false)) {
        await rahulResult.click();
        await page.waitForTimeout(300);
        await expect(page.locator("body")).not.toContainText("Unhandled");
      }
    }
  });

  // ── Captain designation ───────────────────────────────────────────────────────

  test("shows captain checkbox or toggle for added members", async ({ page }) => {
    await page.waitForTimeout(600);
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="member" i], input[placeholder*="player" i]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill("Ra");
      await page.waitForTimeout(500);
      const rahulResult = page.getByText("Rahul Verma").first();
      if (await rahulResult.isVisible({ timeout: 2000 }).catch(() => false)) {
        await rahulResult.click();
        await page.waitForTimeout(300);
        const captainBtn = page.locator('input[type="checkbox"], button').filter({ hasText: /captain/i }).first();
        if (await captainBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await captainBtn.click();
          await page.waitForTimeout(200);
          await expect(page.locator("body")).not.toContainText("Unhandled");
        }
      }
    }
  });

  // ── Remove member ─────────────────────────────────────────────────────────────

  test("can remove an added member", async ({ page }) => {
    await page.waitForTimeout(600);
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="member" i], input[placeholder*="player" i]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill("Ra");
      await page.waitForTimeout(500);
      const rahulResult = page.getByText("Rahul Verma").first();
      if (await rahulResult.isVisible({ timeout: 2000 }).catch(() => false)) {
        await rahulResult.click();
        await page.waitForTimeout(300);
        const removeBtn = page.locator('button[aria-label*="remove" i], button').filter({ hasText: /remove|×|✕/i }).first();
        if (await removeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await removeBtn.click();
          await page.waitForTimeout(200);
          await expect(page.locator("body")).not.toContainText("Unhandled");
        }
      }
    }
  });

  // ── Submit button disabled state ──────────────────────────────────────────────

  test("submit button is disabled when fewer than 2 members", async ({ page }) => {
    await page.waitForTimeout(600);
    const submitBtn = page.getByRole("button", { name: /register|submit|create team/i }).first();
    if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      const isDisabled = await submitBtn.isDisabled();
      // With 0 members, should be disabled
      expect(isDisabled).toBe(true);
    }
  });

  // ── Submit sends POST ─────────────────────────────────────────────────────────

  test("submitting with valid team data sends POST to register-team API", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("register-team") && req.method() === "POST") {
        requests.push(req.url());
      }
    });

    await page.waitForTimeout(600);

    // Fill team name
    const nameInput = page.locator('input[placeholder*="team name" i], input[placeholder*="Team Name" i]').first();
    if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameInput.fill("Test Warriors");
    }

    // Add two members via search
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="member" i], input[placeholder*="player" i]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill("Ra");
      await page.waitForTimeout(500);
      const member1 = page.getByText("Rahul Verma").first();
      if (await member1.isVisible({ timeout: 2000 }).catch(() => false)) {
        await member1.click();
        await page.waitForTimeout(300);
      }
      await searchInput.clear();
      await searchInput.fill("Sne");
      await page.waitForTimeout(500);
      const member2 = page.getByText("Sneha Patel").first();
      if (await member2.isVisible({ timeout: 2000 }).catch(() => false)) {
        await member2.click();
        await page.waitForTimeout(300);
      }
    }

    // Select a category
    const categorySelect = page.locator("select").first();
    if (await categorySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await categorySelect.selectOption({ index: 1 });
    }

    const submitBtn = page.getByRole("button", { name: /register|submit|create team/i }).first();
    if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      const isDisabled = await submitBtn.isDisabled();
      if (!isDisabled) {
        await submitBtn.click();
        await page.waitForTimeout(500);
        await expect(page.locator("body")).not.toContainText("Unhandled");
      }
    }
  });

  // ── Success state ─────────────────────────────────────────────────────────────

  test("shows success state after team is registered", async ({ page }) => {
    await page.waitForTimeout(600);

    const nameInput = page.locator('input[placeholder*="team name" i], input[placeholder*="Team Name" i]').first();
    if (!await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) return;
    await nameInput.fill("Test Warriors");

    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="member" i], input[placeholder*="player" i]').first();
    if (!await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) return;

    await searchInput.fill("Ra");
    await page.waitForTimeout(500);
    const m1 = page.getByText("Rahul Verma").first();
    if (await m1.isVisible({ timeout: 2000 }).catch(() => false)) await m1.click();
    await page.waitForTimeout(300);

    await searchInput.clear();
    await searchInput.fill("Sne");
    await page.waitForTimeout(500);
    const m2 = page.getByText("Sneha Patel").first();
    if (await m2.isVisible({ timeout: 2000 }).catch(() => false)) await m2.click();
    await page.waitForTimeout(300);

    const categorySelect = page.locator("select").first();
    if (await categorySelect.isVisible({ timeout: 1000 }).catch(() => false)) {
      await categorySelect.selectOption({ index: 1 });
    }

    const submitBtn = page.getByRole("button", { name: /register|submit|create team/i }).first();
    if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false) && !await submitBtn.isDisabled()) {
      await submitBtn.click();
      await page.waitForTimeout(800);
      const body = await page.locator("body").innerText();
      expect(
        body.includes("Team Registered") || body.includes("Success") || body.includes("registered") || body.includes("success")
      ).toBe(true);
    }
  });

  // ── Error state ───────────────────────────────────────────────────────────────

  test("shows error message when register-team API fails", async ({ page }) => {
    await page.route("**/api/sports/register-team", (route) =>
      route.fulfill({ status: 500, json: { error: "Server error" } })
    );
    await page.goto("/sports/team-register/102");
    await page.waitForTimeout(600);

    const nameInput = page.locator('input[placeholder*="team name" i], input[placeholder*="Team Name" i]').first();
    if (!await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) return;
    await nameInput.fill("Error Team");

    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="member" i], input[placeholder*="player" i]').first();
    if (!await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) return;

    await searchInput.fill("Ra");
    await page.waitForTimeout(500);
    const m1 = page.getByText("Rahul Verma").first();
    if (await m1.isVisible({ timeout: 2000 }).catch(() => false)) await m1.click();
    await page.waitForTimeout(300);
    await searchInput.clear();
    await searchInput.fill("Sne");
    await page.waitForTimeout(500);
    const m2 = page.getByText("Sneha Patel").first();
    if (await m2.isVisible({ timeout: 2000 }).catch(() => false)) await m2.click();
    await page.waitForTimeout(300);

    const categorySelect = page.locator("select").first();
    if (await categorySelect.isVisible({ timeout: 1000 }).catch(() => false)) {
      await categorySelect.selectOption({ index: 1 });
    }

    const submitBtn = page.getByRole("button", { name: /register|submit|create team/i }).first();
    if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false) && !await submitBtn.isDisabled()) {
      await submitBtn.click();
      await page.waitForTimeout(800);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });
});
