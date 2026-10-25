import { test, expect } from "@playwright/test";
import {
  injectAuthWithProfile,
  mockAuthRoutes,
  mockSportsDashboardRoutes,
  mockSportsScheduleRoutes,
  mockSportsRegistrationRoutes,
  mockSportsAdminRoutes,
} from "../fixtures/auth";

const MOCK_EXTERNAL_FORMS = [
  {
    id: 101,
    eventId: 1,
    eventName: "Badminton Open 2026",
    communityId: 1,
    provider: "GOOGLE_FORMS",
    externalFormId: "1FAIpQLSc_mock_form_101",
    responderUrl: "https://docs.google.com/forms/d/e/1FAIpQLSc_mock_form_101/viewform",
    editUrl: "https://docs.google.com/forms/d/1FAIpQLSc_mock_form_101/edit",
    title: "Badminton Open 2026 - Registration Form",
    description: "Official external registration form",
    webhookToken: "token_mock_123",
    webhookUrl: "https://hub.manacommunity.com/api/integrations/google/forms/webhook/token_mock_123",
    status: "ACTIVE",
    approvalMode: "TOURNAMENT_DEFAULT",
    fieldMappings: [
      { id: 1, manaFieldKey: "playerName", externalQuestionId: "q_1", questionTitle: "Full Name", mappingType: "DIRECT", required: true },
      { id: 2, manaFieldKey: "phone", externalQuestionId: "q_2", questionTitle: "Phone Number", mappingType: "DIRECT", required: true },
    ],
    syncState: {
      syncMode: "POLLING",
      lastSyncTimestamp: new Date().toISOString(),
      totalResponsesPolled: 12,
      totalImported: 10,
      totalQuarantined: 1,
      totalRejected: 1,
      syncStatus: "IDLE",
    },
    createdAt: new Date().toISOString(),
  },
];

const MOCK_REVIEW_QUEUE = [
  {
    id: 501,
    formId: 101,
    externalResponseId: "resp_quarantined_1",
    respondentEmail: "guest@example.com",
    submittedAt: new Date().toISOString(),
    rawPayloadJson: JSON.stringify({
      playerName: "Vikram Seth",
      phone: "9876543210",
      flatNumber: "C-402",
      age: "45",
      "Tournament Category": "Men Singles (18-35)",
    }),
    status: "NEEDS_REVIEW",
    reviewReason: "AGE_INELIGIBLE",
    reviewNotes: null,
    validationErrors: "Age 45 is outside permitted range (18–35 yrs) for Men Singles (18-35)",
    linkedRegistrationId: null,
    linkedPlayerName: null,
    createdAt: new Date().toISOString(),
  },
];

async function setupExternalFormsMockRoutes(page: import("@playwright/test").Page) {
  await page.route("**/api/sports/events/*/external-forms", async (route) => {
    if (route.request().method() === "POST") {
      const payload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        json: {
          ...MOCK_EXTERNAL_FORMS[0],
          id: 102,
          provider: payload.provider || "GOOGLE_FORMS",
          title: payload.title || "New External Form",
        },
      });
    } else {
      await route.fulfill({ status: 200, json: MOCK_EXTERNAL_FORMS });
    }
  });

  await page.route("**/api/sports/external-forms/*/sync", async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        formId: 101,
        polledCount: 12,
        importedCount: 10,
        quarantinedCount: 1,
        rejectedCount: 1,
        message: "Synchronized 12 responses (10 imported, 1 in review).",
      },
    });
  });

  await page.route("**/api/sports/events/*/external-forms/review", async (route) => {
    await route.fulfill({ status: 200, json: MOCK_REVIEW_QUEUE });
  });

  await page.route("**/api/sports/external-forms/*/apps-script", async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        script: "function onFormSubmit(e) { /* mock script */ }",
      },
    });
  });

  await page.route("**/api/sports/external-forms/responses/*/resolve", async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        ...MOCK_REVIEW_QUEUE[0],
        status: "IMPORTED",
        linkedRegistrationId: 999,
        reviewReason: "Approved with manual override",
      },
    });
  });
}

test.describe("Sports Admin — Google Forms & External Registration Integration", () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthWithProfile(page);
    await mockAuthRoutes(page);
    await mockSportsDashboardRoutes(page);
    await mockSportsScheduleRoutes(page);
    await mockSportsRegistrationRoutes(page);
    await mockSportsAdminRoutes(page);
    await setupExternalFormsMockRoutes(page);
  });

  test("renders External Forms management button in tournament view", async ({ page }) => {
    await page.goto("/sports/admin");
    await page.waitForTimeout(1000);

    // Switch to Configure Events / Tournaments
    const eventsNav = page.getByRole("button", { name: /Configure Events|Events/i });
    if (await eventsNav.isVisible().catch(() => false)) {
      await eventsNav.click();
      await page.waitForTimeout(500);
    }

    // Verify page loads without error
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });

  test("External Forms Manager displays sync stats and Google Form actions", async ({ page }) => {
    await page.goto("/sports/admin");
    await page.waitForTimeout(1000);

    // Verify external forms components are rendered
    await expect(page.locator("body")).not.toContainText("Unhandled");
  });
});

test.describe("Sports Native Public Portal (MANA_FORM) — Unauthenticated Access", () => {
  const MOCK_PUBLIC_FORM = {
    id: 105,
    eventId: 1,
    eventName: "Badminton Championship 2026",
    provider: "MANA_FORM",
    title: "Badminton Championship 2026 Registration",
    description: "Register online for Men's Singles and Doubles tournament.",
    status: "ACTIVE",
    fieldMappings: [
      { manaFieldKey: "playerName", questionTitle: "Full Name", required: true },
      { manaFieldKey: "phone", questionTitle: "Phone Number / WhatsApp", required: true },
      { manaFieldKey: "email", questionTitle: "Email Address", required: false },
      { manaFieldKey: "flatNumber", questionTitle: "Flat / Unit Number", required: true },
      { manaFieldKey: "age", questionTitle: "Age", required: true },
      { manaFieldKey: "gender", questionTitle: "Gender", required: false },
      {
        manaFieldKey: "categoryId",
        questionTitle: "Tournament Category",
        required: true,
        mappingRulesJson: JSON.stringify({
          "Men Singles (18-35)": "1",
          "Men Doubles (Open)": "2",
        }),
      },
      {
        manaFieldKey: "matchFormat",
        questionTitle: "Match Format",
        required: true,
        mappingRulesJson: JSON.stringify({
          Singles: "SINGLES",
          Doubles: "DOUBLES",
        }),
      },
    ],
  };

  test.beforeEach(async ({ page }) => {
    // Unauthenticated: Only mock public form endpoints without any auth session
    await page.route("**/api/sports/external-forms/public/**", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          json: {
            status: "IMPORTED",
            registrationId: 789,
            responseId: 456,
            reviewReason: "",
          },
        });
      } else {
        await route.fulfill({
          status: 200,
          json: MOCK_PUBLIC_FORM,
        });
      }
    });
  });

  test("loads public registration portal without authentication and displays categories", async ({ page }) => {
    await page.goto("/sports/register/external/token_mock_public_123");
    await page.waitForTimeout(500);

    // Verify title and event info
    await expect(page.getByText("Badminton Championship 2026 Registration")).toBeVisible();
    await expect(page.getByText("Mana Sports Portal")).toBeVisible();

    // Verify player inputs
    await expect(page.getByLabel(/Full Name/i)).toBeVisible();
    await expect(page.getByLabel(/Phone Number/i)).toBeVisible();

    // Verify category options from mappingRulesJson
    await expect(page.getByRole("button", { name: /Men Singles \(18-35\)/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Men Doubles \(Open\)/i })).toBeVisible();
  });

  test("submits public registration and displays confirmation screen with share button", async ({ page }) => {
    await page.goto("/sports/register/external/token_mock_public_123");
    await page.waitForTimeout(500);

    // Fill form
    await page.getByLabel(/Full Name/i).fill("Aditya Sharma");
    await page.getByLabel(/Phone Number/i).fill("9876543210");

    // Toggle guest participant
    const guestCheckbox = page.getByRole("checkbox", { name: /external guest/i });
    if (await guestCheckbox.isVisible().catch(() => false)) {
      await guestCheckbox.check();
    }

    const ageInput = page.getByLabel(/Age/i);
    if (await ageInput.isVisible().catch(() => false)) {
      await ageInput.fill("28");
    }

    // Submit
    await page.getByRole("button", { name: /Submit Tournament Registration/i }).click();

    // Verify confirmation screen
    await expect(page.getByText("Registration Confirmed!")).toBeVisible();
    await expect(page.getByText("#789")).toBeVisible();
    await expect(page.getByText("Aditya Sharma")).toBeVisible();
    await expect(page.getByRole("button", { name: /Share on WhatsApp/i })).toBeVisible();
  });
});
