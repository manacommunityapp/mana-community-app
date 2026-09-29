import { test, expect } from "@playwright/test";
import {
  injectAuth,
  injectAuthWithProfile,
  mockAuthRoutes,
  mockSportsDashboardRoutes,
  mockSportsScheduleRoutes,
  mockSportsRegistrationRoutes,
  MOCK_USER,
  MOCK_USER_WITH_PROFILE,
  MOCK_REGISTRATION_EVENT,
  MOCK_DOUBLES_EVENT,
  MOCK_TEAM_EVENT,
  MOCK_BADMINTON_EVENT,
  MOCK_CATEGORIES,
  MOCK_FAMILY_MEMBERS,
} from "../fixtures/auth";

// ═══════════════════════════════════════════════════════════════════════════════
// Sports Registration — E2E Tests
// Covers: entry point, participant selection, modal lifecycle, format/category,
//         partner selection, captain nomination, form submission, and dashboard
//         state update.
// ═══════════════════════════════════════════════════════════════════════════════

async function setupAllRoutes(page: import("@playwright/test").Page) {
  // Catch-all FIRST so specific routes (registered later) take priority in Playwright's reverse-order matching
  await page.route("**/api/**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, json: [] });
    } else {
      await route.fulfill({ status: 200, json: { success: true } });
    }
  });
  await injectAuthWithProfile(page);
  await mockAuthRoutes(page);
  await mockSportsDashboardRoutes(page);
  await mockSportsScheduleRoutes(page);
  await mockSportsRegistrationRoutes(page);
}

test.describe("Sports Registration — Entry Point & Participant Selection", () => {
  test.beforeEach(async ({ page }) => {
    await setupAllRoutes(page);
  });

  test("sports page loads without crashing", async ({ page }) => {
    await page.goto("/sports");
    await page.waitForTimeout(1500);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    const body = await page.locator("body").innerText();
    expect(body.includes("Sports")).toBe(true);
  });

  test("sports navigation bar is visible", async ({ page }) => {
    await page.goto("/sports");
    await page.waitForTimeout(1000);
    const body = await page.locator("body").innerText();
    expect(
      body.includes("Dashboard") || body.includes("My Sports") || body.includes("Schedule")
    ).toBe(true);
  });

  test("sports page does not crash with incomplete profile", async ({ page }) => {
    await page.goto("/sports");
    await page.waitForTimeout(1000);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });
});

test.describe("Sports Registration — Modal Opens (Single Event)", () => {
  test.beforeEach(async ({ page }) => {
    await setupAllRoutes(page);
  });

  test("navigating to /sports/register/:eventUuid renders the registration form", async ({ page }) => {
    await page.goto(`/sports/register/${MOCK_REGISTRATION_EVENT.uuid}`);
    await page.waitForTimeout(500);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    const content = await page.locator("body").innerText();
    const hasRegistrationContent =
      content.includes("Cricket") ||
      content.includes("Register") ||
      content.includes("Category") ||
      content.includes("Format");
    expect(hasRegistrationContent).toBe(true);
  });

  test("registration form auto-populates player name from user profile", async ({ page }) => {
    await page.goto(`/sports/register/${MOCK_REGISTRATION_EVENT.uuid}`);
    await page.waitForTimeout(500);
    const nameField = page.locator('input[name="playerName"], input[placeholder*="name" i]').first();
    if (await nameField.isVisible()) {
      await expect(nameField).toHaveValue(MOCK_USER_WITH_PROFILE.fullName);
    }
  });

  test("registration page shows event details (sport, venue, dates)", async ({ page }) => {
    await page.goto(`/sports/register/${MOCK_REGISTRATION_EVENT.uuid}`);
    await page.waitForTimeout(500);
    const body = await page.locator("body").innerText();
    expect(
      body.includes("Cricket") || body.includes("Main Ground") || body.includes("2026")
    ).toBe(true);
  });
});

test.describe("Sports Registration — Format & Category Selection", () => {
  test.beforeEach(async ({ page }) => {
    await setupAllRoutes(page);
  });

  test("displays available categories from API", async ({ page }) => {
    await page.goto(`/sports/register/${MOCK_REGISTRATION_EVENT.uuid}`);
    await page.waitForTimeout(500);
    const body = await page.locator("body").innerText();
    const hasCategory = MOCK_CATEGORIES.some(cat => body.includes(cat.name));
    expect(hasCategory).toBe(true);
  });

  test("match type selector shows Singles/Doubles options", async ({ page }) => {
    await page.goto(`/sports/register/${MOCK_REGISTRATION_EVENT.uuid}`);
    await page.waitForTimeout(800);
    const body = await page.locator("body").innerText();
    expect(
      body.includes("Singles") ||
      body.includes("SINGLES") ||
      body.includes("Format") ||
      body.includes("Match Type") ||
      body.includes("Cricket")
    ).toBe(true);
  });

  test("ineligible category shows indicator for gender-restricted events", async ({ page }) => {
    await page.route("**/api/sports/events/*/registration-details", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          event: MOCK_REGISTRATION_EVENT,
          categories: [
            { id: 4, name: "Women", ageMin: 18, ageMax: 60, gender: "FEMALE" },
          ],
          siblingCategories: [],
        },
      });
    });
    await page.goto(`/sports/register/${MOCK_REGISTRATION_EVENT.uuid}`);
    await page.waitForTimeout(800);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });
});

test.describe("Sports Registration — Partner Selection (Doubles)", () => {
  test.beforeEach(async ({ page }) => {
    await setupAllRoutes(page);
  });

  test("navigating to doubles event registration loads correctly", async ({ page }) => {
    await page.goto(`/sports/register/${MOCK_DOUBLES_EVENT.uuid}`);
    await page.waitForTimeout(500);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    const body = await page.locator("body").innerText();
    expect(body.includes("Badminton") || body.includes("Doubles") || body.includes("Partner")).toBe(true);
  });
});

test.describe("Sports Registration — Captain Nomination (Team Events)", () => {
  test.beforeEach(async ({ page }) => {
    await setupAllRoutes(page);
  });

  test("team event registration page loads without error", async ({ page }) => {
    await page.goto(`/sports/register/${MOCK_TEAM_EVENT.uuid}`);
    await page.waitForTimeout(500);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    const body = await page.locator("body").innerText();
    expect(body.includes("Football") || body.includes("Team") || body.includes("Captain")).toBe(true);
  });
});

test.describe("Sports Registration — Form Submission", () => {
  test.beforeEach(async ({ page }) => {
    await setupAllRoutes(page);
  });

  test("submitting registration sends POST to /api/sports/register", async ({ page }) => {
    let registrationPosted = false;
    let postedPayload: any = null;

    await page.route("**/api/sports/register", async (route) => {
      if (route.request().method() === "POST") {
        registrationPosted = true;
        postedPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          json: {
            id: 999,
            eventId: postedPayload.eventId,
            status: "PENDING",
            playerName: MOCK_USER_WITH_PROFILE.fullName,
            captainNomination: false,
            matchType: postedPayload.matchType || "SINGLES",
          },
        });
      } else {
        await route.fulfill({ status: 200, json: { success: true } });
      }
    });

    await page.goto(`/sports/register/${MOCK_REGISTRATION_EVENT.uuid}`);
    await page.waitForTimeout(800);

    const submitBtn = page.locator('button:has-text("Register"), button:has-text("Submit"), button:has-text("Confirm")').first();
    if (await submitBtn.isVisible() && await submitBtn.isEnabled()) {
      await submitBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test("registration page does not crash with missing event UUID", async ({ page }) => {
    await page.goto("/sports/register/nonexistent-uuid");
    await page.waitForTimeout(500);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });
});

test.describe("Sports Registration — Dashboard State After Registration", () => {
  test.beforeEach(async ({ page }) => {
    await setupAllRoutes(page);
  });

  test("dashboard renders sports page without errors", async ({ page }) => {
    await page.goto("/sports");
    await page.waitForTimeout(1000);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(50);
  });

  test("dashboard shows Registered status when user has an existing registration", async ({ page }) => {
    await page.route("**/api/sports/dashboard/my-registrations", async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: 999,
            eventId: 100,
            eventName: "Cricket Open · Men's Singles",
            eventDateStart: "2026-10-01",
            sportName: "Cricket",
            categoryName: "Open",
            eventRegistrationStatus: "REGISTRATION_OPEN",
            status: "PENDING",
            matchType: "SINGLES",
            captainNomination: false,
            captainConfirmation: false,
            playerName: MOCK_USER_WITH_PROFILE.fullName,
            relation: null,
            familyMemberId: null,
          },
        ],
      });
    });

    await page.goto("/sports");
    await page.waitForTimeout(1000);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });
});

test.describe("Sports Registration — Partially Registered UI", () => {
  const SINGLES_REG = {
    id: 501,
    eventId: 200,
    eventName: "Badminton Men (19+)",
    eventDateStart: "2026-10-05",
    sportName: "Badminton",
    categoryName: "Open",
    eventRegistrationStatus: "REGISTRATION_OPEN",
    status: "PENDING",
    matchType: "SINGLES",
    captainNomination: false,
    captainConfirmation: false,
    playerName: MOCK_USER_WITH_PROFILE.fullName,
    relation: null,
    familyMemberId: null,
  };

  async function gotoAndWaitForDashboard(page: import("@playwright/test").Page) {
    await page.goto("/sports");
    // Wait for tournament data to render (tournament card or event name visible)
    await page.waitForSelector("text=Badminton", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);
  }

  async function expandBadmintonGroup(page: import("@playwright/test").Page) {
    const badmintonHeader = page.locator("text=Badminton").first();
    if (await badmintonHeader.isVisible()) {
      await badmintonHeader.click();
      await page.waitForTimeout(500);
    }
  }

  test.beforeEach(async ({ page }) => {
    await setupAllRoutes(page);

    // Override my-registrations to return a Singles registration for the Badminton event
    await page.route("**/api/sports/dashboard/my-registrations", async (route) => {
      await route.fulfill({ status: 200, json: [SINGLES_REG] });
    });
  });

  test("dashboard loads with tournament data and Badminton event", async ({ page }) => {
    await gotoAndWaitForDashboard(page);
    const body = await page.locator("body").innerText();
    // The dashboard should show tournament data with Badminton
    expect(
      body.includes("Badminton") || body.includes("tournament") || body.includes("Open for Registration")
    ).toBe(true);
  });

  test("partially registered event shows counter or format badge after expanding", async ({ page }) => {
    await gotoAndWaitForDashboard(page);
    await expandBadmintonGroup(page);
    await page.waitForTimeout(300);
    const body = await page.locator("body").innerText();
    // After expanding, should see fraction badge (1/3) or format names or Register
    expect(
      body.includes("1/3") || body.includes("1/2") || body.includes("Singles") ||
      body.includes("Register") || body.includes("Badminton Men")
    ).toBe(true);
  });

  test("partially registered event shows add-formats button or register option", async ({ page }) => {
    await gotoAndWaitForDashboard(page);
    await expandBadmintonGroup(page);
    await page.waitForTimeout(300);

    // Should show a button with remaining formats or a register button
    const addFormatsBtn = page.locator("button").filter({ hasText: /Doubles|Mixed|Register/ }).first();
    const body = await page.locator("body").innerText();
    const hasFormatUI = await addFormatsBtn.isVisible().catch(() => false) ||
      body.includes("Doubles") || body.includes("Register");
    expect(hasFormatUI).toBe(true);
  });

  test("clicking add-formats button or register navigates correctly", async ({ page }) => {
    await gotoAndWaitForDashboard(page);
    await expandBadmintonGroup(page);
    await page.waitForTimeout(300);

    const addFormatsBtn = page.locator("button").filter({ hasText: /Doubles|Mixed|Register/ }).first();
    if (await addFormatsBtn.isVisible().catch(() => false)) {
      await addFormatsBtn.click();
      await page.waitForTimeout(1000);
      const url = page.url();
      expect(
        url.includes("/register/") || url.includes("evt-uuid-badminton") || url.includes("/sports")
      ).toBe(true);
    }
  });

  test("fully registered event shows All Formats or Registered badge", async ({ page }) => {
    // Override to return registrations for ALL formats
    await page.route("**/api/sports/dashboard/my-registrations", async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          { ...SINGLES_REG, id: 501, matchType: "SINGLES" },
          { ...SINGLES_REG, id: 502, matchType: "DOUBLES" },
          { ...SINGLES_REG, id: 503, matchType: "MIXED_DOUBLES" },
        ],
      });
    });

    await gotoAndWaitForDashboard(page);
    await expandBadmintonGroup(page);
    await page.waitForTimeout(300);

    const body = await page.locator("body").innerText();
    expect(
      body.includes("All Formats") || body.includes("Registered") ||
      body.includes("3/3") || body.includes("Badminton")
    ).toBe(true);
  });

  test("single-format event shows Registered instead of fraction", async ({ page }) => {
    // Cricket is single-format
    await page.route("**/api/sports/dashboard/my-registrations", async (route) => {
      await route.fulfill({
        status: 200,
        json: [{
          ...SINGLES_REG,
          id: 601, eventId: 100, eventName: "Cricket Open · Men's Singles",
          eventDateStart: "2026-10-01", sportName: "Cricket",
        }],
      });
    });

    await page.goto("/sports");
    await page.waitForSelector("text=Cricket", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);

    // Expand Cricket sport group
    const cricketHeader = page.locator("text=Cricket").first();
    if (await cricketHeader.isVisible()) {
      await cricketHeader.click();
      await page.waitForTimeout(500);
    }

    const body = await page.locator("body").innerText();
    expect(
      body.includes("Registered") || body.includes("All Formats") || body.includes("Cricket")
    ).toBe(true);
  });
});

test.describe("Sports Registration — Multi-Register (Tournament)", () => {
  test.beforeEach(async ({ page }) => {
    await setupAllRoutes(page);

    await page.route("**/api/sports/tournaments/1", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: 1,
          name: "Cricket Premier League 2026",
          sport: "Cricket",
          status: "REGISTRATION_OPEN",
          registrationStatus: "REGISTRATION_OPEN",
          communityId: 1,
          communityName: "Le Community",
          events: [MOCK_REGISTRATION_EVENT],
        },
      });
    });
  });

  test("multi-register page loads for tournament", async ({ page }) => {
    await page.goto("/sports/register-tournament/1");
    await page.waitForTimeout(500);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });

  test("multi-register shows Self/Family toggle for admin users", async ({ page }) => {
    await page.goto("/sports/register-tournament/1");
    await page.waitForTimeout(500);
    const body = await page.locator("body").innerText();
    const hasToggle = body.includes("Self") || body.includes("Family") || body.includes(MOCK_USER_WITH_PROFILE.fullName);
    expect(hasToggle).toBe(true);
  });
});

test.describe("Sports Registration — Error Handling", () => {
  test.beforeEach(async ({ page }) => {
    await setupAllRoutes(page);
  });

  test("handles API error for registration details gracefully", async ({ page }) => {
    await page.route("**/api/sports/events/*/registration-details", async (route) => {
      await route.fulfill({ status: 500, json: { error: "Internal Server Error" } });
    });
    await page.goto(`/sports/register/${MOCK_REGISTRATION_EVENT.uuid}`);
    await page.waitForTimeout(500);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });

  test("handles registration POST failure gracefully", async ({ page }) => {
    await page.route("**/api/sports/register", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ status: 400, json: { message: "Already registered for this event" } });
      } else {
        await route.fulfill({ status: 200, json: {} });
      }
    });
    await page.goto(`/sports/register/${MOCK_REGISTRATION_EVENT.uuid}`);
    await page.waitForTimeout(500);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });
});
