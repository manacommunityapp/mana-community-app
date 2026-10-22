import { test, expect } from "@playwright/test";
import {
  injectAuthWithProfile,
  mockAuthRoutes,
  mockSportsDashboardRoutes,
  MOCK_FAMILY_MEMBERS,
} from "../fixtures/auth";

// ═══════════════════════════════════════════════════════════════════════════════
// Multi-Event Tournament Bulk Registration — E2E Suite
// Covers:
// 1. Tournament Header & Sport Groups Showcase (/sports/register-tournament/:id)
// 2. Participant Switching: Myself vs Family Member
// 3. Multi-Sport Event Selection (Singles & Doubles)
// 4. In-line Doubles Partner Selection (Need Partner / Open Pool)
// 5. Bulk Registration Checkout (Confirm & Register) & Single Event Quick Register
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_TOURNAMENT_ID = 1;

const MOCK_TOURNAMENT_DETAIL = {
  id: MOCK_TOURNAMENT_ID,
  name: "Annual Sports Fiesta 2026",
  eventDateStart: "2026-11-01",
  eventDateEnd: "2026-11-10",
  registrationStatus: "REGISTRATION_OPEN",
  communityId: 1,
  communityName: "Greenfield Community",
  events: [
    {
      id: 101,
      uuid: "evt-badminton-singles",
      name: "Badminton Men's Singles",
      sportName: "Badminton",
      categoryName: "Open",
      venueName: "Court A",
      formats: ["SINGLES"],
      format: "SINGLES",
    },
    {
      id: 102,
      uuid: "evt-badminton-doubles",
      name: "Badminton Open Doubles",
      sportName: "Badminton",
      categoryName: "Open",
      venueName: "Court B",
      formats: ["DOUBLES"],
      format: "DOUBLES",
    },
    {
      id: 103,
      uuid: "evt-table-tennis",
      name: "Table Tennis Singles",
      sportName: "Table Tennis",
      categoryName: "Open",
      venueName: "TT Arena",
      formats: ["SINGLES"],
      format: "SINGLES",
    },
  ],
};

const MOCK_CATEGORIES = [
  { id: 1, name: "Open", description: "All age open division", minAge: 16, maxAge: 65, gender: "ALL" },
  { id: 2, name: "Under 18", description: "Junior division", minAge: 10, maxAge: 18, gender: "ALL" },
];

const MOCK_NEIGHBORS = [
  { id: 10, fullName: "Rahul Verma", gender: "Male", flatNo: "201", block: "B" },
  { id: 11, fullName: "Sneha Patel", gender: "Female", flatNo: "102", block: "C" },
];

async function setupMultiRegisterRoutes(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    localStorage.setItem("mana_cookie_consent", JSON.stringify({ analytics: false, essential: true }));
    localStorage.setItem("mana_privacy_preferences_fallback", JSON.stringify({ analytics: false, essential: true }));
    localStorage.setItem(
      "mana_consent_banner_v1",
      JSON.stringify({
        analytics: true,
        marketing: true,
        version: "2026-10-13-v1",
        timestamp: new Date().toISOString(),
      })
    );
    const OrigWS = window.WebSocket;
    window.WebSocket = class extends OrigWS {
      constructor(url: string | URL, protocols?: string | string[]) {
        if (typeof url === "string" && url.includes("/ws")) {
          super("ws://0.0.0.0:1/blocked", protocols);
          return;
        }
        super(url, protocols);
      }
    };
  });

  // Base catch-all
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

  // Tournament details
  await page.route(/\/api\/sports\/tournaments\/\d+(\?.*)?$/, async (route) => {
    await route.fulfill({ status: 200, json: MOCK_TOURNAMENT_DETAIL });
  });

  await page.route(/\/api\/tournaments\/\d+(\?.*)?$/, async (route) => {
    await route.fulfill({ status: 200, json: MOCK_TOURNAMENT_DETAIL });
  });

  // Open tournaments list for sportsDashboardService
  await page.route("**/api/sports/dashboard/open-tournaments**", async (route) => {
    await route.fulfill({
      status: 200,
      json: [MOCK_TOURNAMENT_DETAIL],
    });
  });

  // Player categories
  await page.route("**/api/player-categories**", async (route) => {
    await route.fulfill({ status: 200, json: MOCK_CATEGORIES });
  });

  await page.route("**/api/sports/categories**", async (route) => {
    await route.fulfill({ status: 200, json: MOCK_CATEGORIES });
  });

  // Sports meta
  await page.route("**/api/sports/meta**", async (route) => {
    await route.fulfill({ status: 200, json: [] });
  });

  // Family members
  await page.route("**/api/family**", async (route) => {
    await route.fulfill({ status: 200, json: MOCK_FAMILY_MEMBERS });
  });
  await page.route("**/api/users/family-members**", async (route) => {
    await route.fulfill({ status: 200, json: MOCK_FAMILY_MEMBERS });
  });
  await page.route("**/api/events/family-members**", async (route) => {
    await route.fulfill({ status: 200, json: MOCK_FAMILY_MEMBERS });
  });

  // Global & community search
  await page.route(/\/api\/users\/.*search.*$/, async (route) => {
    await route.fulfill({ status: 200, json: MOCK_NEIGHBORS });
  });
}

test.describe("Multi-Event Tournament Registration Suite", () => {
  test.beforeEach(async ({ page }) => {
    await setupMultiRegisterRoutes(page);
  });

  test("renders tournament banner, sport groups and participant details", async ({ page }) => {
    await page.goto(`/sports/register-tournament/${MOCK_TOURNAMENT_ID}`);
    await page.waitForTimeout(600);

    // Tournament title
    await expect(page.locator("body")).toContainText("Annual Sports Fiesta 2026");

    // Participant controls (Myself vs Family)
    await expect(page.getByRole("button", { name: "Myself" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Family" }).first()).toBeVisible();

    // Sport groups: Badminton and Table Tennis
    await expect(page.locator("body")).toContainText("Badminton");
    await expect(page.locator("body")).toContainText("Table Tennis");

    // Events
    await expect(page.locator("body")).toContainText("Badminton Men's Singles");
    await expect(page.locator("body")).toContainText("Badminton Open Doubles");
  });

  test("switches participant between Myself and Family Member", async ({ page }) => {
    await page.goto(`/sports/register-tournament/${MOCK_TOURNAMENT_ID}`);
    await page.waitForTimeout(600);

    // Initial state: Myself is selected with Arjun Sharma
    await expect(page.locator("body")).toContainText("Arjun Sharma");

    // Click Family button
    const familyBtn = page.getByRole("button", { name: "Family" }).first();
    await familyBtn.click();
    await page.waitForTimeout(400);

    // Family member cards/options should be visible
    const aaravOption = page.locator("body", { hasText: /Aarav Sharma|Priya Sharma/i });
    await expect(aaravOption).toBeVisible();
  });

  test("selects multiple sports events and enforces doubles partner selection", async ({ page }) => {
    await page.goto(`/sports/register-tournament/${MOCK_TOURNAMENT_ID}`);
    await page.waitForTimeout(600);

    // Verify doubles partner selector appears for the doubles event
    await expect(page.locator("body")).toContainText(/Doubles Partner/i);
    const needPartnerBtn = page.getByRole("button", { name: "Need Partner" }).first();
    await expect(needPartnerBtn).toBeVisible();

    // Select Need Partner (Open pairing pool)
    await needPartnerBtn.click();
    await page.waitForTimeout(300);

    // Open pool confirmation badge should appear
    await expect(page.locator("body")).toContainText(/Open Pairing Pool/i);

    // Verify bulk checkout button reflects the selected events
    const checkoutBtn = page.getByRole("button", { name: /Confirm & Register/i }).first();
    await expect(checkoutBtn).toBeVisible();
  });

  test("submits bulk registration for multiple selected events", async ({ page }) => {
    const registeredEvents: any[] = [];
    await page.route("**/api/sports/register**", async (route) => {
      const payload = route.request().postDataJSON();
      registeredEvents.push(payload);
      await route.fulfill({
        status: 200,
        json: { id: 999, ...payload, status: "CONFIRMED" },
      });
    });

    await page.goto(`/sports/register-tournament/${MOCK_TOURNAMENT_ID}`);
    await page.waitForTimeout(600);

    // Doubles event needs partner selection
    const needPartnerBtn = page.getByRole("button", { name: "Need Partner" }).first();
    await needPartnerBtn.click();
    await page.waitForTimeout(300);

    // Click Confirm & Register button
    const checkoutBtn = page.getByRole("button", { name: /Confirm & Register/i }).first();
    await expect(checkoutBtn).toBeEnabled();
    await checkoutBtn.click();

    await page.waitForTimeout(600);

    // Verify registration calls were made
    expect(registeredEvents.length).toBeGreaterThanOrEqual(2);
    expect(registeredEvents.map(e => e.eventId)).toContain(101);
    expect(registeredEvents.map(e => e.eventId)).toContain(102);

    // Verify navigation returned to sports hub
    expect(page.url()).toContain("/sports");
  });

  test("registers for a single event using the direct card Register button", async ({ page }) => {
    let singlePayload: any = null;
    await page.route("**/api/sports/register**", async (route) => {
      singlePayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        json: { id: 888, ...singlePayload, status: "CONFIRMED" },
      });
    });

    await page.goto(`/sports/register-tournament/${MOCK_TOURNAMENT_ID}`);
    await page.waitForTimeout(600);

    // Direct Register button on Table Tennis Singles row
    const ttRow = page.locator(".divide-y > div", { hasText: "Table Tennis Singles" });
    const directRegisterBtn = ttRow.getByRole("button", { name: "Register", exact: true });
    await expect(directRegisterBtn).toBeVisible();
    await directRegisterBtn.click();

    await expect.poll(() => singlePayload, { timeout: 5000 }).not.toBeNull();
    expect(singlePayload.eventId).toBe(103);
  });
});
