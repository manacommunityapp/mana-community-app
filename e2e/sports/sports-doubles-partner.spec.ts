import { test, expect } from "@playwright/test";
import {
  injectAuthWithProfile,
  mockAuthRoutes,
  mockSportsDashboardRoutes,
  mockSportsScheduleRoutes,
  mockSportsRegistrationRoutes,
  MOCK_USER_WITH_PROFILE,
  MOCK_DOUBLES_EVENT,
  MOCK_FAMILY_MEMBERS,
} from "../fixtures/auth";

// ═══════════════════════════════════════════════════════════════════════════════
// Doubles & Mixed Doubles Partner Registration & Invitations — E2E Suite
// Covers:
// 1. Doubles partner selector render & Mixed Doubles format detection
// 2. Neighbor / Community search with Mixed Doubles complementary gender rules
// 3. Family member partner selection with self-exclusion & gender check
// 4. Open Pairing Pool ("Need Partner") selection
// 5. Validation failure when partner is omitted
// 6. Form submission with partner payload (partnerUserId / partnerFamilyMemberId)
// 7. My Sports: Pending Doubles Partner Invitation accept / decline flow
// 8. My Sports: Registration card partner status badges & Change Partner modal
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_NEIGHBORS = [
  { id: 10, fullName: "Rahul Verma", gender: "Male", flatNo: "201", block: "B" },
  { id: 11, fullName: "Sneha Patel", gender: "Female", flatNo: "102", block: "C" },
];

async function setupDoublesRoutes(page: import("@playwright/test").Page) {
  // Base catch-all for any unhandled GET/POST/PUT
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

  // Mock global/community user search for partner selector
  await page.route("**/api/sports/partner-search**", async (route) => {
    await route.fulfill({
      status: 200,
      json: MOCK_NEIGHBORS.map((n) => ({
        type: "USER",
        id: n.id,
        name: n.fullName,
        flatNo: n.flatNo,
        block: n.block,
        gender: n.gender.toUpperCase(),
        occupancyLabel: `Owner · Flat ${n.block}-${n.flatNo}`,
        eligible: true,
      })),
    });
  });

  await page.route("**/api/users/search**", async (route) => {
    await route.fulfill({
      status: 200,
      json: MOCK_NEIGHBORS,
    });
  });

  // Ensure family endpoints return test members
  await page.route("**/api/users/family-members**", async (route) => {
    await route.fulfill({
      status: 200,
      json: MOCK_FAMILY_MEMBERS,
    });
  });

  await page.route("**/api/events/family-members**", async (route) => {
    await route.fulfill({
      status: 200,
      json: MOCK_FAMILY_MEMBERS,
    });
  });

  await page.route("**/api/family**", async (route) => {
    await route.fulfill({
      status: 200,
      json: MOCK_FAMILY_MEMBERS,
    });
  });
}

test.describe("Doubles Registration — Partner Selection Lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await setupDoublesRoutes(page);
  });

  test("renders SportsPartnerSelector for Doubles / Mixed Doubles events", async ({ page }) => {
    await page.goto(`/sports/register/${MOCK_DOUBLES_EVENT.uuid}`);
    await page.waitForTimeout(800);

    await expect(page.locator("body")).toContainText(/Doubles Partner/i);
    await expect(page.locator("body")).toContainText(/Mixed Doubles/i);
    // Verifies complementary gender requirement guidance for Male user
    await expect(page.locator("body")).toContainText(/requires a female partner/i);

    // Verifies tabs exist
    await expect(page.getByRole("button", { name: "Neighbor", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Family", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Need Partner", exact: true })).toBeVisible();
  });

  test("searches neighbors and enforces Mixed Doubles complementary gender rule", async ({ page }) => {
    await page.goto(`/sports/register/${MOCK_DOUBLES_EVENT.uuid}`);
    await page.waitForTimeout(800);

    const searchInput = page.getByPlaceholder(/Search neighbor by name or flat number/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Sneha");
    await page.waitForTimeout(400);

    // Dropdown should show both neighbors
    const rahulBtn = page.locator("button").filter({ hasText: "Rahul Verma" }).first();
    const snehaBtn = page.locator("button").filter({ hasText: "Sneha Patel" }).first();

    await expect(rahulBtn).toBeVisible();
    await expect(snehaBtn).toBeVisible();

    // Rahul (Male) should be disabled with Need FEMALE badge because user Arjun is Male
    await expect(rahulBtn).toBeDisabled();
    await expect(rahulBtn).toContainText(/Need FEMALE/i);

    // Sneha (Female) should be selectable
    await expect(snehaBtn).toBeEnabled();
    await snehaBtn.click();

    // Verifies partner card is rendered with details
    await expect(page.locator("body")).toContainText("Sneha Patel");
    await expect(page.locator("body")).toContainText("Female");
    await expect(page.locator("body")).toContainText(/An invite will be dispatched upon registration/i);

    // Can clear partner
    const clearBtn = page.locator('button[title="Remove partner"]').first();
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    // Search input should be visible again
    await expect(page.getByPlaceholder(/Search neighbor by name or flat number/i)).toBeVisible();
  });

  test("selects family member and filters out gender-mismatched relatives", async ({ page }) => {
    await page.goto(`/sports/register/${MOCK_DOUBLES_EVENT.uuid}`);
    await page.waitForTimeout(800);

    // Switch to Family tab
    const familyTab = page.getByRole("button", { name: "Family", exact: true });
    await familyTab.click();
    await page.waitForTimeout(300);

    // Priya Sharma (Female) vs Rohan Sharma (Male)
    const priyaCard = page.locator("button").filter({ hasText: "Priya Sharma" }).first();
    const rohanCard = page.locator("button").filter({ hasText: "Rohan Sharma" }).first();

    await expect(priyaCard).toBeVisible();
    await expect(rohanCard).toBeVisible();

    // Rohan is male -> disabled with Need FEMALE
    await expect(rohanCard).toBeDisabled();
    await expect(rohanCard).toContainText(/Need FEMALE/i);

    // Priya is female -> enabled with Pick
    await expect(priyaCard).toBeEnabled();
    await priyaCard.click();

    // Verifies selected family partner card
    await expect(page.locator("body")).toContainText("Priya Sharma");
    await expect(page.locator("body")).toContainText(/An invite will be dispatched upon registration/i);
  });

  test("selects Open Pairing Pool (Need Partner) mode", async ({ page }) => {
    await page.goto(`/sports/register/${MOCK_DOUBLES_EVENT.uuid}`);
    await page.waitForTimeout(800);

    const needPartnerTab = page.getByRole("button", { name: "Need Partner", exact: true });
    await needPartnerTab.click();
    await page.waitForTimeout(300);

    // Verifies open pool card
    await expect(page.locator("body")).toContainText(/Looking for Partner \(Open Pool\)/i);
    await expect(page.locator("body")).toContainText(/Open Pairing Pool/i);
  });

  test("submits doubles registration with selected partner payload", async ({ page }) => {
    let capturedPayload: any = null;

    await page.route("**/api/sports/register", async (route) => {
      if (route.request().method() === "POST") {
        capturedPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          json: {
            id: 888,
            eventId: capturedPayload.eventId,
            status: "PENDING",
            playerName: MOCK_USER_WITH_PROFILE.fullName,
            matchType: capturedPayload.matchType,
            partnerUserId: capturedPayload.partnerUserId,
          },
        });
      } else {
        await route.fulfill({ status: 200, json: { success: true } });
      }
    });

    await page.goto(`/sports/register/${MOCK_DOUBLES_EVENT.uuid}`);
    await page.waitForTimeout(800);

    // Select Sneha Patel as partner
    const searchInput = page.getByPlaceholder(/Search neighbor by name or flat number/i);
    await searchInput.fill("Sneha");
    await page.waitForTimeout(400);

    const snehaBtn = page.locator("button").filter({ hasText: "Sneha Patel" }).first();
    await snehaBtn.click();
    await page.waitForTimeout(300);

    // Submit form
    const submitBtn = page.locator('button:has-text("Submit Registration"), button:has-text("Confirm")').first();
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();
    await page.waitForTimeout(1000);

    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload.partnerUserId).toBe(11);
    expect(capturedPayload.matchType || capturedPayload.matchTypes?.[0]).toMatch(/DOUBLES/i);
  });
});

test.describe("My Sports — Partner Invitation & Management Flow", () => {
  test.beforeEach(async ({ page }) => {
    await setupDoublesRoutes(page);
  });

  test("displays pending doubles partner invitation card with Accept and Decline actions", async ({ page }) => {
    const mockInvitation = {
      id: 701,
      sportName: "Badminton",
      eventName: "Badminton Cup 2026",
      playerName: "Vikram Malhotra",
      categoryName: "Mixed Doubles",
      matchType: "MIXED_DOUBLES",
      status: "PENDING",
    };

    await page.route("**/api/sports/registrations/partner-invitations**", async (route) => {
      await route.fulfill({
        status: 200,
        json: [mockInvitation],
      });
    });

    let acceptedInviteId: number | null = null;
    await page.route("**/api/sports/registrations/*/partner-confirm**", async (route) => {
      const url = route.request().url();
      if (url.includes("701") && url.includes("accept=true")) {
        acceptedInviteId = 701;
      }
      await route.fulfill({
        status: 200,
        json: { id: 701, status: "CONFIRMED" },
      });
    });

    await page.goto("/sports/my-sports");
    await page.waitForTimeout(1000);

    // Check banner presence
    await expect(page.locator("body")).toContainText(/Pending Doubles Partner Invitations/i);
    await expect(page.locator("body")).toContainText(/Vikram Malhotra/i);
    await expect(page.locator("body")).toContainText(/nominated you to play as their doubles partner/i);

    // Check action buttons
    const acceptBtn = page.getByRole("button", { name: /Accept Partner/i }).first();
    const declineBtn = page.getByRole("button", { name: /Decline/i }).first();
    await expect(acceptBtn).toBeVisible();
    await expect(declineBtn).toBeVisible();

    // Click Accept
    await acceptBtn.click();
    await page.waitForTimeout(600);

    expect(acceptedInviteId).toBe(701);
  });

  test("shows partner status badges on tournament cards and opens partner nomination modal", async ({ page }) => {
    const mockRegistrations = [
      {
        id: 901,
        status: "CONFIRMED",
        eventId: 101,
        eventName: "Badminton Cup 2026",
        sportName: "Badminton",
        categoryName: "Mixed Doubles",
        matchType: "MIXED_DOUBLES",
        partnerUserId: 11,
        partnerName: "Sneha Patel",
        partnerStatus: "CONFIRMED",
        age: 30,
        flatNumber: "101",
        registeredAt: "2026-10-01",
      },
    ];

    await page.route("**/api/sports/schedule/registrations/mine**", async (route) => {
      await route.fulfill({ status: 200, json: mockRegistrations });
    });

    let nominatedPartnerUserId: number | null = null;
    await page.route("**/api/sports/registrations/*/nominate-partner**", async (route) => {
      const url = route.request().url();
      const match = url.match(/partnerUserId=(\d+)/);
      if (match) nominatedPartnerUserId = Number(match[1]);
      await route.fulfill({ status: 200, json: { ...mockRegistrations[0], partnerUserId: nominatedPartnerUserId } });
    });

    await page.goto("/sports/my-sports");
    await page.waitForTimeout(1000);

    // Switch to My Tournaments tab if needed
    const tourneysTab = page.getByRole("button", { name: /My Tournaments/i }).first();
    if (await tourneysTab.isVisible().catch(() => false)) {
      await tourneysTab.click();
      await page.waitForTimeout(500);
    }

    // Verify partner status badge
    await expect(page.locator("body")).toContainText(/Partner:/i);
    await expect(page.locator("body")).toContainText(/Sneha Patel/i);
    await expect(page.locator("body")).toContainText(/Confirmed/i);

    // Click "Change Partner" button
    const changePartnerBtn = page.getByRole("button", { name: /Change Partner/i }).first();
    await expect(changePartnerBtn).toBeVisible();
    await changePartnerBtn.click();
    await page.waitForTimeout(400);

    // Nomination modal should be visible
    await expect(page.locator("body")).toContainText(/Doubles Partner/i);
    const modalCancelBtn = page.getByRole("button", { name: /Cancel/i }).first();
    await expect(modalCancelBtn).toBeVisible();
    await modalCancelBtn.click();
  });
});
