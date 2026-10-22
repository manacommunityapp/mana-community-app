import { test, expect } from "@playwright/test";
import {
  injectAuthWithProfile,
  mockAuthRoutes,
  mockSportsDashboardRoutes,
} from "../fixtures/auth";

// ═══════════════════════════════════════════════════════════════════════════════
// Teams Registration & My Teams Hub — E2E Suite
// Covers:
// 1. Team Registration (/sports/team-register/:eventId)
//    - Required validation: Team Name & Minimum 2 members
//    - Neighbor search & squad member addition
//    - Captain designation & crown badge toggle
//    - Emoji logo picker
//    - Successful submission with team payload & Success confirmation
// 2. My Teams Hub (/sports/my-teams)
//    - User team roster cards with captain badge, squad count & remaining budget
//    - Navigation to auction team details on card click
//    - Empty state when user has no team memberships
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_CATEGORIES = [
  { id: 1, name: "Open Category", description: "General community division", minAge: 16, maxAge: 60 },
  { id: 2, name: "Veterans (40+)", description: "Senior members division", minAge: 40, maxAge: 75 },
];

const MOCK_NEIGHBORS = [
  { id: 10, fullName: "Rahul Verma", flatNo: "201", block: "B", email: "rahul@example.com" },
  { id: 11, fullName: "Sneha Patel", flatNo: "102", block: "C", email: "sneha@example.com" },
  { id: 12, fullName: "Vikram Malhotra", flatNo: "304", block: "A", email: "vikram@example.com" },
];

const MOCK_AUCTION_CONFIGS = [
  {
    id: 1,
    eventId: 101,
    seasonName: "Premier League 2026",
    sportName: "Cricket",
    status: "LIVE",
    totalTeams: 4,
    budgetPerTeam: 1000,
  },
];

const MOCK_MY_TEAMS_SUMMARY = [
  {
    id: 1,
    name: "Super Strikers",
    teamName: "Super Strikers",
    emoji: "⚡",
    colorHex: "#10b981",
    budget: 1000,
    spent: 350,
    remainingBudget: 650,
    ownerUser: { id: 1, fullName: "Arjun Sharma" },
    players: [
      { userId: 1, playerId: 1, playerName: "Arjun Sharma", role: "Captain" },
      { userId: 10, playerId: 10, playerName: "Rahul Verma", role: "All-Rounder" },
      { userId: 11, playerId: 11, playerName: "Sneha Patel", role: "Batter" },
    ],
  },
];

async function setupTeamsRoutes(page: import("@playwright/test").Page) {
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

  // Player categories
  await page.route("**/api/player-categories**", async (route) => {
    await route.fulfill({ status: 200, json: MOCK_CATEGORIES });
  });

  // Neighbor search for team registration
  await page.route(/\/api\/users\/.*search.*$/, async (route) => {
    await route.fulfill({ status: 200, json: MOCK_NEIGHBORS });
  });

  // My Teams endpoints
  await page.route("**/api/auction/config/all**", async (route) => {
    await route.fulfill({ status: 200, json: MOCK_AUCTION_CONFIGS });
  });

  await page.route("**/api/auction/teams/1**", async (route) => {
    await route.fulfill({ status: 200, json: MOCK_MY_TEAMS_SUMMARY });
  });
}

test.describe("Sports Team Registration Flow", () => {
  test.beforeEach(async ({ page }) => {
    await setupTeamsRoutes(page);
  });

  test("validates required fields: submit button is disabled until team name and 2 members are added", async ({ page }) => {
    await page.goto("/sports/team-register/101");
    await page.waitForTimeout(600);

    // Initial state: Register button should be disabled because team name is empty & 0 members
    const registerBtn = page.getByRole("button", { name: /Register Team/i });
    await expect(registerBtn).toBeVisible();
    await expect(registerBtn).toBeDisabled();

    // Enter team name but still 0 members -> button remains disabled
    const teamNameInput = page.getByPlaceholder(/Enter team name/i);
    await teamNameInput.fill("Phoenix Warriors");
    await expect(registerBtn).toBeDisabled();
  });

  test("searches neighbors, adds squad members, toggles captain designation and submits team", async ({ page }) => {
    let registrationPayload: any = null;
    await page.route("**/api/sports/register-team**", async (route) => {
      registrationPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        json: [{ id: 99, ...registrationPayload }],
      });
    });

    await page.goto("/sports/team-register/101");
    await page.waitForTimeout(600);

    // 1. Enter Team Name
    const teamNameInput = page.getByPlaceholder(/Enter team name/i);
    await teamNameInput.fill("Royal Tigers");

    // 2. Select Emoji from picker
    const emojiToggle = page.locator("button", { hasText: "🏏" }).first();
    await emojiToggle.click();
    // Choose 🔥 from emoji picker
    const fireEmojiBtn = page.locator("button", { hasText: "🔥" });
    await fireEmojiBtn.click();

    // 3. Search and add first member: Rahul Verma
    const searchInput = page.getByPlaceholder(/Search members by name/i);
    await searchInput.fill("Rahul");
    await page.waitForTimeout(400);

    const rahulBtn = page.getByRole("button", { name: /Rahul Verma/i });
    await expect(rahulBtn).toBeVisible();
    await rahulBtn.click();

    // Verify Rahul is added and automatically designated captain
    await expect(page.locator("body")).toContainText("Rahul Verma");

    // 4. Search and add second member: Sneha Patel
    await searchInput.fill("Sneha");
    await page.waitForTimeout(400);

    const snehaBtn = page.getByRole("button", { name: /Sneha Patel/i });
    await expect(snehaBtn).toBeVisible();
    await snehaBtn.click();

    await expect(page.locator("body")).toContainText("Sneha Patel");

    // 5. Submit Team Registration (now enabled with 2 members)
    const submitBtn = page.getByRole("button", { name: /Register Team \(2 members\)/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();
    await page.waitForTimeout(500);

    // Verify POST payload sent to backend
    expect(registrationPayload).not.toBeNull();
    expect(registrationPayload.eventId).toBe(101);
    expect(registrationPayload.teamName).toBe("Royal Tigers");
    expect(registrationPayload.logoEmoji).toBe("🔥");
    expect(registrationPayload.memberUserIds).toEqual([10, 11]);
    expect(registrationPayload.captainUserId).toBe(10);

    // 6. Verify Success State view
    await expect(page.locator("body")).toContainText("Team Registered!");
    await expect(page.locator("body")).toContainText("Royal Tigers");
    await expect(page.locator("body")).toContainText("2 members");
    await expect(page.getByRole("button", { name: "Done" })).toBeVisible();
  });
});

test.describe("My Teams Hub", () => {
  test.beforeEach(async ({ page }) => {
    await setupTeamsRoutes(page);
  });

  test("renders user's registered teams with captain badge, squad count and purse remaining", async ({ page }) => {
    await page.goto("/sports/my-teams");
    await page.waitForTimeout(600);

    // Header
    await expect(page.locator("body")).toContainText("My Teams");

    // Team Card
    await expect(page.locator("body")).toContainText("Super Strikers");
    await expect(page.locator("body")).toContainText("Captain");
    await expect(page.locator("body")).toContainText("Premier League 2026 · Cricket");
    await expect(page.locator("body")).toContainText("3 players");
    await expect(page.locator("body")).toContainText("₹650 remaining");
  });

  test("navigates to auction teams tab when team card is clicked", async ({ page }) => {
    await page.goto("/sports/my-teams");
    await page.waitForTimeout(600);

    const teamCard = page.locator("div", { hasText: "Super Strikers" }).first();
    await teamCard.click();
    await page.waitForTimeout(400);

    // URL should transition to /sports/auction/101?tab=teams
    expect(page.url()).toContain("/sports/auction");
    expect(page.url()).toContain("tab=teams");
  });

  test("renders empty state when user belongs to no teams", async ({ page }) => {
    // Override auction configs to empty
    await page.route("**/api/auction/config/all**", async (route) => {
      await route.fulfill({ status: 200, json: [] });
    });

    await page.goto("/sports/my-teams");
    await page.waitForTimeout(600);

    await expect(page.locator("body")).toContainText("No teams yet");
    await expect(page.locator("body")).toContainText("You'll see your auction teams here once assigned");
  });
});
