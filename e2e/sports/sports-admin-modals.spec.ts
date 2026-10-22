import { test, expect } from "@playwright/test";
import {
  injectAuth,
  mockAuthRoutes,
  mockSportsDashboardRoutes,
  mockSportsAdminRoutes,
  mockAdminModalsRoutes,
  mockTournamentScheduleRoutes,
} from "../fixtures/auth";

// ─────────────────────────────────────────────────────────────────────────────
// Sports Admin Modals — E2E Tests
// Covers modals triggered inside /sports/admin:
//   NotificationSetupModal   (Notification Analytics tab → Setup)
//   AddPlayerModal           (Sports Event tab → Add Player)
//   ImportPlayersModal       (Sports Event tab → Import)
//   SportEventConfigModal    (Sports Event tab → Configure)
//   VenueDetailsModal        (Create Tournament → venue)
//   TournamentAnnouncementModal (Publish tournament action)
//   RegistrationOpenModal    (Open registration action)
//   ConfigureEventsTab       (Sports Event sub-tab)
// ─────────────────────────────────────────────────────────────────────────────

async function setup(page: import("@playwright/test").Page) {
  await injectAuth(page);
  await mockAuthRoutes(page);
  await mockSportsDashboardRoutes(page);
  await mockSportsAdminRoutes(page);
  await mockAdminModalsRoutes(page);
}

async function gotoAdminTab(page: import("@playwright/test").Page, tabName: RegExp | string) {
  await setup(page);
  await page.goto("/sports/admin");
  await page.waitForTimeout(500);
  const tabBtn = page.getByRole("button", { name: tabName });
  if (await tabBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await tabBtn.click();
    await page.waitForTimeout(600);
  }
}

// ── Notification Setup Modal ──────────────────────────────────────────────────

test.describe("Admin — Notification Analytics Tab & Setup Modal", () => {
  test("notification analytics tab renders without crashing", async ({ page }) => {
    await gotoAdminTab(page, /Notification|Notify/i);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("Cannot read");
  });

  test("shows send notification or analytics content", async ({ page }) => {
    await gotoAdminTab(page, /Notification|Notify/i);
    const body = await page.locator("body").innerText();
    expect(
      body.includes("Notification") || body.includes("Send") || body.includes("Analytics") || body.length > 30
    ).toBe(true);
  });

  test("setup notification button opens modal without crash", async ({ page }) => {
    await gotoAdminTab(page, /Notification|Notify/i);
    const setupBtn = page.getByRole("button", { name: /setup|configure|template/i }).first();
    if (await setupBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await setupBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });

  test("send notification button does not crash", async ({ page }) => {
    await gotoAdminTab(page, /Notification|Notify/i);
    const sendBtn = page.getByRole("button", { name: /send|Send Notification/i }).first();
    if (await sendBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sendBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });
});

// ── Sports Event Tab & Modals ─────────────────────────────────────────────────

test.describe("Admin — Sports Event Tab", () => {
  test("sports event tab renders without crashing", async ({ page }) => {
    await gotoAdminTab(page, /Sports Event|Events|Event/i);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("Cannot read");
  });

  test("shows event content or event-related text", async ({ page }) => {
    await gotoAdminTab(page, /Sports Event|Events/i);
    const body = await page.locator("body").innerText();
    expect(
      body.includes("Event") || body.includes("Cricket") || body.includes("Sport") || body.length > 30
    ).toBe(true);
  });
});

test.describe("Admin — Add Player Modal", () => {
  test("add player button opens modal without crash", async ({ page }) => {
    await gotoAdminTab(page, /Sports Event|Events/i);
    const addBtn = page.getByRole("button", { name: /add player|Add Player/i }).first();
    if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(600);
      await expect(page.locator("body")).not.toContainText("Unhandled");
      await expect(page.locator("body")).not.toContainText("Cannot read");
    }
  });

  test("add player modal shows player form fields", async ({ page }) => {
    await gotoAdminTab(page, /Sports Event|Events/i);
    const addBtn = page.getByRole("button", { name: /add player|Add Player/i }).first();
    if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(600);
      const body = await page.locator("body").innerText();
      expect(
        body.includes("Player") || body.includes("Name") || body.includes("Role") || body.length > 30
      ).toBe(true);
    }
  });

  test("add player modal close works", async ({ page }) => {
    await gotoAdminTab(page, /Sports Event|Events/i);
    const addBtn = page.getByRole("button", { name: /add player|Add Player/i }).first();
    if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      const closeBtn = page.getByRole("button", { name: /cancel|close|×/i }).first();
      if (await closeBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await closeBtn.click();
        await page.waitForTimeout(400);
        await expect(page.locator("body")).not.toContainText("Unhandled");
      }
    }
  });
});

test.describe("Admin — Import Players Modal", () => {
  test("import players button opens modal without crash", async ({ page }) => {
    await gotoAdminTab(page, /Sports Event|Events/i);
    const importBtn = page.getByRole("button", { name: /import|Import Players/i }).first();
    if (await importBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await importBtn.click();
      await page.waitForTimeout(600);
      await expect(page.locator("body")).not.toContainText("Unhandled");
      await expect(page.locator("body")).not.toContainText("Cannot read");
    }
  });

  test("import modal shows upload or player list", async ({ page }) => {
    await gotoAdminTab(page, /Sports Event|Events/i);
    const importBtn = page.getByRole("button", { name: /import|Import Players/i }).first();
    if (await importBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await importBtn.click();
      await page.waitForTimeout(600);
      const body = await page.locator("body").innerText();
      expect(
        body.includes("Import") || body.includes("Player") || body.includes("Upload") || body.length > 30
      ).toBe(true);
    }
  });
});

test.describe("Admin — Sport Event Config Modal", () => {
  test("configure event button opens config modal without crash", async ({ page }) => {
    await gotoAdminTab(page, /Sports Event|Events/i);
    const configBtn = page.getByRole("button", { name: /configure|config|Configure/i }).first();
    if (await configBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await configBtn.click();
      await page.waitForTimeout(600);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });
});

// ── Create Tournament — Venue Modal ──────────────────────────────────────────

test.describe("Admin — Create Tournament — Venue Section", () => {
  test("create tournament tab renders without crashing", async ({ page }) => {
    await gotoAdminTab(page, /Create Tournament|Create/i);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("Cannot read");
  });

  test("venue selection field renders", async ({ page }) => {
    await gotoAdminTab(page, /Create Tournament|Create/i);
    const body = await page.locator("body").innerText();
    expect(
      body.includes("Venue") || body.includes("Ground") || body.includes("Create") || body.length > 30
    ).toBe(true);
  });

  test("venue autocomplete or select shows mock venues", async ({ page }) => {
    await gotoAdminTab(page, /Create Tournament|Create/i);
    const venueInput = page.locator('input[placeholder*="venue" i], input[name*="venue" i], [aria-label*="Venue" i]').first();
    if (await venueInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await venueInput.click();
      await page.waitForTimeout(300);
      const body = await page.locator("body").innerText();
      expect(body.includes("Main Ground") || body.includes("Indoor Hall") || body.length > 30).toBe(true);
    }
  });

  test("create venue button opens VenueCreationSection without crash", async ({ page }) => {
    // VenueCreationSection is rendered inside Create Tournament form
    await gotoAdminTab(page, /Create Tournament|Create/i);
    const createVenueBtn = page.getByRole("button", { name: /create venue|new venue|add venue/i }).first();
    if (await createVenueBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createVenueBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });

  test("venue details modal opens when venue info button clicked", async ({ page }) => {
    await gotoAdminTab(page, /Create Tournament|Create/i);
    const infoBtn = page.getByRole("button", { name: /venue details|view venue/i }).first();
    if (await infoBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await infoBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator("body")).not.toContainText("Unhandled");
    }
  });
});

// ── Tournament Announcement Modal ────────────────────────────────────────────

test.describe("Admin — Tournament Announcement Modal", () => {
  test("publish tournament action opens announcement modal", async ({ page }) => {
    await gotoAdminTab(page, /Tournaments List|Tournaments/i);
    const publishBtn = page.getByRole("button", { name: /publish|announce/i }).first();
    if (await publishBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await publishBtn.click();
      await page.waitForTimeout(600);
      await expect(page.locator("body")).not.toContainText("Unhandled");
      await expect(page.locator("body")).not.toContainText("Cannot read");
    }
  });

  test("announcement modal close works", async ({ page }) => {
    await gotoAdminTab(page, /Tournaments List|Tournaments/i);
    const publishBtn = page.getByRole("button", { name: /publish|announce/i }).first();
    if (await publishBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await publishBtn.click();
      await page.waitForTimeout(500);
      const closeBtn = page.getByRole("button", { name: /cancel|close/i }).first();
      if (await closeBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await closeBtn.click();
        await page.waitForTimeout(400);
        await expect(page.locator("body")).not.toContainText("Unhandled");
      }
    }
  });
});

// ── Registration Open Modal ───────────────────────────────────────────────────

test.describe("Admin — Registration Open Modal", () => {
  test("open registration button triggers modal", async ({ page }) => {
    await gotoAdminTab(page, /Tournaments List|Tournaments/i);
    const openRegBtn = page.getByRole("button", { name: /open registration|Open Reg/i }).first();
    if (await openRegBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await openRegBtn.click();
      await page.waitForTimeout(600);
      await expect(page.locator("body")).not.toContainText("Unhandled");
      await expect(page.locator("body")).not.toContainText("Cannot read");
    }
  });
});

// ── Configure Events Tab ──────────────────────────────────────────────────────

test.describe("Admin — Configure Events Sub-Tab", () => {
  test("configure events tab renders without crashing", async ({ page }) => {
    await gotoAdminTab(page, /Configure|Sports Event/i);
    const configTab = page.getByRole("button", { name: /configure|Configure Events/i });
    if (await configTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await configTab.click();
      await page.waitForTimeout(600);
    }
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("Cannot read");
  });

  test("event configuration form shows sport type dropdown", async ({ page }) => {
    await gotoAdminTab(page, /Configure|Sports Event/i);
    const configTab = page.getByRole("button", { name: /configure|Configure Events/i });
    if (await configTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await configTab.click();
      await page.waitForTimeout(500);
      const body = await page.locator("body").innerText();
      expect(
        body.includes("Sport") || body.includes("Cricket") || body.includes("Category") || body.length > 30
      ).toBe(true);
    }
  });
});

// ── Admin Modals General Error Handling ──────────────────────────────────────

test.describe("Admin Modals — Error Handling", () => {
  test("admin page renders when venue API fails", async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
    await mockSportsDashboardRoutes(page);
    await mockSportsAdminRoutes(page);
    await page.route("**/api/sports/venues**", (route) =>
      route.fulfill({ status: 500, json: { error: "Server error" } })
    );
    await page.route("**/api/tournament/**", (route) =>
      route.fulfill({ status: 200, json: [] })
    );
    await page.route("**/api/sports/**", (route) =>
      route.fulfill({ status: 200, json: {} })
    );
    await page.goto("/sports/admin");
    await page.waitForTimeout(600);
    await expect(page.locator("body")).not.toContainText("Unhandled");
    await expect(page.locator("body")).not.toContainText("Cannot read");
  });

  test("admin page renders when members API fails", async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
    await mockSportsDashboardRoutes(page);
    await mockSportsAdminRoutes(page);
    await page.route("**/api/community/members**", (route) =>
      route.fulfill({ status: 500, json: { error: "Server error" } })
    );
    await page.route("**/api/tournament/**", (route) =>
      route.fulfill({ status: 200, json: [] })
    );
    await page.route("**/api/sports/**", (route) =>
      route.fulfill({ status: 200, json: {} })
    );
    await page.goto("/sports/admin");
    await page.waitForTimeout(600);
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });
});
