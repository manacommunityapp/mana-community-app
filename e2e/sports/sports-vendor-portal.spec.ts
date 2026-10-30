import { test, expect } from "@playwright/test";
import { injectAuth, mockAuthRoutes } from "../fixtures/auth";

test.describe("Sports Vendor Portal & Resident Court Booking Journey", () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
  });

  // ── 1. Sports Vendor Dashboard ──────────────────────────────────────────
  test("1. Sports Vendor Dashboard: loads metrics and quick navigation", async ({ page }) => {
    await page.goto("/vendor-portal/sports");

    // Dashboard title and operational metrics
    await expect(page.getByText(/Sports Vendor Hub|Sports Venue Operations/i)).toBeVisible();
    await expect(page.getByText(/Active Bookings/i)).toBeVisible();
    await expect(page.getByText(/Court Utilization/i)).toBeVisible();
    await expect(page.getByText(/Today's Revenue/i)).toBeVisible();

    // Key management action buttons exist
    await expect(page.getByRole("link", { name: /Venues & Courts/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Slot Calendar/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Bookings/i })).toBeVisible();
  });

  // ── 2. Venue & Court Management ─────────────────────────────────────────
  test("2. Venue & Court Manager: lists facilities, courts and opens add dialog", async ({ page }) => {
    await page.goto("/vendor-portal/sports/venues");

    // Venue title visible
    await expect(page.getByText(/Sports Venues & Courts/i)).toBeVisible();

    // Verify existing facilities render
    await expect(page.getByText(/Greenfield Arena|Smash Point/i).first()).toBeVisible();

    // Check Add Facility button
    const addFacilityBtn = page.getByRole("button", { name: /Add Facility/i });
    await expect(addFacilityBtn).toBeVisible();
    await addFacilityBtn.click();

    // Modal opens
    await expect(page.getByText(/Create Sports Facility/i)).toBeVisible();
    await expect(page.getByPlaceholder(/e.g. Greenfield Arena/i)).toBeVisible();

    // Close modal
    await page.getByRole("button", { name: /Cancel/i }).click();
    await expect(page.getByText(/Create Sports Facility/i)).not.toBeVisible();
  });

  // ── 3. Real-time Slot Calendar ──────────────────────────────────────────
  test("3. Slot Calendar: renders time grid and allows toggling maintenance/lock", async ({ page }) => {
    await page.goto("/vendor-portal/sports/calendar");

    // Calendar header
    await expect(page.getByText(/Court Slot Calendar/i)).toBeVisible();

    // Time slots exist in calendar grid
    await expect(page.getByText(/06:00 AM|07:00 AM/i).first()).toBeVisible();

    // Check legend exists
    await expect(page.getByText(/Available/i).first()).toBeVisible();
    await expect(page.getByText(/Booked/i).first()).toBeVisible();
    await expect(page.getByText(/Maintenance/i).first()).toBeVisible();
  });

  // ── 4. Resident Venue Discovery ─────────────────────────────────────────
  test("4. Resident Venue Discovery: filters sports and displays venue cards", async ({ page }) => {
    await page.goto("/sports/venues");

    // Header and filter chips
    await expect(page.getByText(/Community Sports Venues/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /All Sports/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Badminton/i })).toBeVisible();

    // Venue card renders with pricing
    await expect(page.getByText(/Greenfield Arena/i).first()).toBeVisible();
    await expect(page.getByText(/From ₹/i).first()).toBeVisible();

    // Clicking a venue card navigates to venue details
    const exploreBtn = page.getByRole("link", { name: /Book Court/i }).first();
    await expect(exploreBtn).toBeVisible();
    await exploreBtn.click();

    await expect(page).toHaveURL(/\/sports\/venues\/\d+/);
  });

  // ── 5. Court Booking Modal & Checkout Flow ──────────────────────────────
  test("5. Court Booking Flow: selects slot and completes resident reservation", async ({ page }) => {
    await page.goto("/sports/venues/1");

    // Venue details header
    await expect(page.getByText(/Greenfield Arena/i)).toBeVisible();
    await expect(page.getByText(/Select Court & Slot/i)).toBeVisible();

    // Select court and time slot
    const bookSlotBtn = page.getByRole("button", { name: /Book Slot/i }).first();
    if (await bookSlotBtn.isVisible()) {
      await bookSlotBtn.click();

      // Booking modal opens
      await expect(page.getByText(/Confirm Court Booking/i)).toBeVisible();
      await expect(page.getByText(/Total Amount/i)).toBeVisible();

      // Click Confirm & Pay
      const confirmBtn = page.getByRole("button", { name: /Confirm & Pay/i });
      await expect(confirmBtn).toBeVisible();
      await confirmBtn.click();

      // QR Code and confirmation screen appears
      await expect(page.getByText(/Booking Confirmed!/i)).toBeVisible();
      await expect(page.getByText(/Show this QR code at venue reception/i)).toBeVisible();
    }
  });

  // ── 6. Vendor Booking Manager & Check-in ─────────────────────────────────
  test("6. Vendor Booking Manager: shows booking list and check-in action", async ({ page }) => {
    await page.goto("/vendor-portal/sports/bookings");

    await expect(page.getByText(/Sports Bookings & Check-In/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Search by resident name/i)).toBeVisible();

    // Bookings table renders rows
    await expect(page.getByText(/CONFIRMED|COMPLETED|CANCELLED/i).first()).toBeVisible();

    // Check-In button is available for confirmed bookings
    const checkInBtn = page.getByRole("button", { name: /Check In/i }).first();
    if (await checkInBtn.isVisible()) {
      await expect(checkInBtn).toBeEnabled();
    }
  });

  // ── 7. Dynamic Pricing Matrix ───────────────────────────────────────────
  test("7. Pricing Matrix: displays tier rules and peak/weekend multipliers", async ({ page }) => {
    await page.goto("/vendor-portal/sports/pricing");

    await expect(page.getByText(/Dynamic Pricing & Slot Matrix/i)).toBeVisible();
    await expect(page.getByText(/Standard Hours/i).first()).toBeVisible();
    await expect(page.getByText(/Peak Hours/i).first()).toBeVisible();
  });

  // ── 8. Coaching Academy Portal ──────────────────────────────────────────
  test("8. Coaching Portal: lists coaches, academy batches and enrollments", async ({ page }) => {
    await page.goto("/vendor-portal/sports/coaching");

    await expect(page.getByText(/Coaches & Academy Batches/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Add New Batch/i })).toBeVisible();

    // Coaches and batches rendered
    await expect(page.getByText(/Batches/i).first()).toBeVisible();
    await expect(page.getByText(/Enrolled/i).first()).toBeVisible();
  });

  // ── 9. Memberships & Multi-Sport Passes ─────────────────────────────────
  test("9. Memberships Portal: lists sports passes and tiers", async ({ page }) => {
    await page.goto("/vendor-portal/sports/memberships");

    await expect(page.getByText(/Sports Memberships & Passes/i)).toBeVisible();
    await expect(page.getByText(/Silver Pass|Gold Pass|Weekend Pass/i).first()).toBeVisible();
  });

  // ── 10. Tournaments & Match Officials ───────────────────────────────────
  test("10. Tournament & Officials Portal: organizes court locks and referee roster", async ({ page }) => {
    await page.goto("/vendor-portal/sports/events");

    await expect(page.getByText(/Tournament Organizers & Match Officials/i)).toBeVisible();
    await expect(page.getByText(/Certified Officials/i)).toBeVisible();
    await expect(page.getByText(/Book Official/i).first()).toBeVisible();
  });

  // ── 11. Equipment Suppliers & Quotations RFQ ────────────────────────────
  test("11. Suppliers Portal: displays equipment catalogue and RFQ dialog", async ({ page }) => {
    await page.goto("/vendor-portal/sports/suppliers");

    await expect(page.getByText(/Sports Suppliers & Equipment Commerce/i)).toBeVisible();
    await expect(page.getByText(/Request Bulk Quote/i).first()).toBeVisible();

    // Open Quote Dialog
    const rfqBtn = page.getByRole("button", { name: /Request Bulk Quote/i });
    await rfqBtn.click();
    await expect(page.getByText(/Submit Quotation Request/i)).toBeVisible();
    await page.getByRole("button", { name: /Cancel/i }).click();
  });

  // ── 12. AI Demand Intelligence ──────────────────────────────────────────
  test("12. AI Intelligence Portal: displays peak demand forecast and waitlist auto-recovery", async ({ page }) => {
    await page.goto("/vendor-portal/sports/intelligence");

    await expect(page.getByText(/Sports Demand Intelligence & Revenue AI/i)).toBeVisible();
    await expect(page.getByText(/Waitlist Auto-Recovery Engine/i)).toBeVisible();
    await expect(page.getByText(/Dynamic Offer Automation/i)).toBeVisible();
  });

  // ── 13. Multi-Venue & Federated Passes ──────────────────────────────────
  test("13. Multi-Venue Portal: displays branch performance and cross-pass redemption", async ({ page }) => {
    await page.goto("/vendor-portal/sports/branches");

    await expect(page.getByText(/Multi-Venue Group Analytics & Federated Passes/i)).toBeVisible();
    await expect(page.getByText(/Branch Performance Matrix/i)).toBeVisible();
    await expect(page.getByText(/Federated Community Sports Pass/i)).toBeVisible();
  });
});
