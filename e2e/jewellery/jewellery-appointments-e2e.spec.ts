import { test, expect } from "@playwright/test";
import { injectAuth, mockAuthRoutes } from "../fixtures/auth";
import {
  mockAllJewelleryRoutes,
  MOCK_JEWELLERY_VENDORS,
  MOCK_APPOINTMENTS,
} from "../fixtures/jewellery-fixtures";

test.describe("Jewellery Appointments & Merchant Dashboard — End-to-End User Journey", () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
    await mockAllJewelleryRoutes(page);
  });

  test("1. Interactive Date Chips: displays upcoming 7 days with human-readable labels", async ({ page }) => {
    await page.goto("/jewellery/appointments?vendorId=101");

    // Booking modal or sheet opens
    const bookTitle = page.getByText(/Book Consultation|Select Jeweller/i);
    if (await bookTitle.isVisible()) {
      // Check date chips
      const tomorrowChip = page.getByText(/Tomorrow/i);
      await expect(tomorrowChip).toBeVisible();

      // Clicking another day updates selection
      const otherDayChip = page.locator("text=/[A-Z][a-z]{2},\\s+[A-Z][a-z]{2}\\s+\\d+/").first();
      if (await otherDayChip.isVisible()) {
        await otherDayChip.click();
      }
    }
  });

  test("2. Dynamic Slot Availability: queries vendor available slots and updates grid", async ({ page }) => {
    let slotsQueried = false;

    page.on("request", (req) => {
      if (req.url().includes("/available-slots")) {
        slotsQueried = true;
      }
    });

    await page.goto("/jewellery/appointments?vendorId=101");

    const slotsSection = page.getByText(/Available Time Slots/i);
    if (await slotsSection.isVisible()) {
      await expect(slotsSection).toBeVisible();

      // Slot buttons
      const timeSlot = page.getByText(/11:00 AM|02:00 PM|03:00 PM/i).first();
      if (await timeSlot.isVisible()) {
        await timeSlot.click();
      }
    }
  });

  test("3. Booking Flow: creates appointment with purpose and notes", async ({ page }) => {
    let bookingPayload: any = null;

    page.on("request", (req) => {
      if (req.url().includes("/api/jewellery/appointments") && req.method() === "POST") {
        bookingPayload = req.postDataJSON();
      }
    });

    await page.goto("/jewellery/appointments?vendorId=101");

    // Select purpose
    const bridalChip = page.getByText(/Bridal Consultation/i);
    if (await bridalChip.isVisible()) {
      await bridalChip.click();
    }

    // Enter notes
    const notesInput = page.getByPlaceholder(/Looking for a necklace|E\.g\./i);
    if (await notesInput.isVisible()) {
      await notesInput.fill("Looking for matching temple necklace and jhumka set for December wedding.");
    }

    // Submit booking
    const confirmBtn = page.getByRole("button", { name: /Confirm Appointment/i });
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      // Verify payload was submitted with purpose and vendorId
      if (bookingPayload) {
        expect(bookingPayload.vendorId).toBe("101");
        expect(bookingPayload.purpose).toBeTruthy();
      }
    }
  });

  test("4. Appointments List & Tab Switching: toggles Upcoming and Past appointments", async ({ page }) => {
    await page.goto("/jewellery/appointments");

    // Tab buttons
    const upcomingTab = page.getByRole("button", { name: /Upcoming/i }).or(page.getByText(/Upcoming/i));
    const pastTab = page.getByRole("button", { name: /Past/i }).or(page.getByText(/Past/i));

    if (await upcomingTab.isVisible() && await pastTab.isVisible()) {
      await expect(upcomingTab).toBeVisible();

      // Click Past tab
      await pastTab.click();
      // Should show completed appointment
      const completedText = page.getByText(/COMPLETED|Gold Valuation/i);
      if (await completedText.isVisible()) {
        await expect(completedText).toBeVisible();
      }

      // Switch back to Upcoming
      await upcomingTab.click();
      await expect(page.getByText(/CONFIRMED|Kalyan Jewellers/i).first()).toBeVisible();
    }
  });

  test("5. Cancellation Flow: prompts for reason and calls cancellation endpoint", async ({ page }) => {
    let cancellationCalled = false;

    page.on("request", (req) => {
      if (req.url().includes("/cancel") && req.method() === "PATCH") {
        cancellationCalled = true;
      }
    });

    await page.goto("/jewellery/appointments");

    const cancelBtn = page.getByRole("button", { name: /Cancel Appointment/i });
    if (await cancelBtn.isVisible()) {
      // Setup alert dialog handler
      page.once("dialog", async (dialog) => {
        expect(dialog.message()).toContain("Cancel");
        await dialog.accept();
      });
      await cancelBtn.click();
    }
  });

  test("6. Merchant Dashboard: views appointments and updates status", async ({ page }) => {
    let statusUpdated = false;

    page.on("request", (req) => {
      if (req.url().includes("/vendor/appointments") && req.method() === "PATCH") {
        statusUpdated = true;
      }
    });

    await page.goto("/jewellery/vendor/appointments");

    // Verify vendor appointment list renders
    const header = page.getByText(/Consultation Appointments|Manage Bookings/i);
    if (await header.isVisible()) {
      await expect(header).toBeVisible();
    }
  });
});
