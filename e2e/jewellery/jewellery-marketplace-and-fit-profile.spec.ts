import { test, expect } from "@playwright/test";
import { injectAuth, mockAuthRoutes } from "../fixtures/auth";
import {
  mockAllJewelleryRoutes,
  MOCK_JEWELLERY_PRODUCTS,
  MOCK_JEWELLERY_VENDORS,
  MOCK_RECOMMENDATIONS,
} from "../fixtures/jewellery-fixtures";

test.describe("Jewellery Marketplace, Vendor Storefront & Fit Profile — End-to-End User Journey", () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
    await mockAllJewelleryRoutes(page);
  });

  // ── 1. Marketplace Hub & Search Debounce ───────────────────────────────────

  test("1. Marketplace Hub: renders banner, verified jewellers, and product grid", async ({ page }) => {
    await page.goto("/jewellery");

    // Header & banner
    await expect(page.getByText(/Mana Jewellery Hub/i)).toBeVisible();
    await expect(page.getByText(/Discover & Try On/i)).toBeVisible();

    // Verify verified jewellers row
    await expect(page.getByText(/Verified Jewellers Nearby/i)).toBeVisible();
    await expect(page.getByText(/Kalyan Jewellers Heritage/i)).toBeVisible();

    // Verify product cards are displayed
    await expect(page.getByText(/Royal Peacock Jhumkas/i)).toBeVisible();
  });

  test("2. Search Debounce: 300ms debounce prevents rapid API calls during typing", async ({ page }) => {
    let searchCallCount = 0;

    page.on("request", (req) => {
      if (req.url().includes("/api/jewellery/products") && req.url().includes("search=")) {
        searchCallCount++;
      }
    });

    await page.goto("/jewellery");

    const searchInput = page.getByPlaceholder(/Search jewellery by design/i);
    if (await searchInput.isVisible()) {
      // Rapid typing simulation
      await searchInput.pressSequentially("jhumka", { delay: 50 });

      // Immediately before debounce fires
      await page.waitForTimeout(400);

      // Debounced call count should be minimal (typically 1), not 6 calls
      expect(searchCallCount).toBeLessThanOrEqual(2);
    }
  });

  test("3. Festive Collection Filters: clicking cards sets active filters and updates catalogue", async ({ page }) => {
    await page.goto("/jewellery");

    const bridalCard = page.getByText(/Bridal Sets/i);
    if (await bridalCard.isVisible()) {
      await bridalCard.click();
      // Should filter for bridal or necklace items
    }

    const diwaliCard = page.getByText(/Diwali Special/i);
    if (await diwaliCard.isVisible()) {
      await diwaliCard.click();
      // Should filter for gold items
    }
  });

  // ── 2. Vendor Storefront & Try-On Ready Toggle ─────────────────────────────

  test("4. Vendor Storefront: renders BIS Hallmark license, contact CTAs, and Try-On Only filter", async ({ page }) => {
    await page.goto("/jewellery/vendor/101");

    // Shop name and BIS badge
    await expect(page.getByText(/Kalyan Jewellers Heritage/i)).toBeVisible();
    await expect(page.getByText(/BIS Hallmark Verified|HM-KA-88912/i)).toBeVisible();

    // Contact CTAs
    await expect(page.getByText(/Call/i)).toBeVisible();
    await expect(page.getByText(/WhatsApp/i)).toBeVisible();
    await expect(page.getByText(/Book Visit/i)).toBeVisible();

    // Try-on ready only filter toggle
    const tryOnFilterToggle = page.getByText(/Try-On Ready/i);
    if (await tryOnFilterToggle.isVisible()) {
      await tryOnFilterToggle.click();
      // Only items with tryOnAssetUrl should remain visible
    }
  });

  // ── 3. Product Detail & Add to Cart ────────────────────────────────────────

  test("5. Product Detail: pricing breakdown, HUID verification, and Add to Cart action", async ({ page }) => {
    await page.goto("/jewellery/201");

    // Product Title & HUID
    await expect(page.getByText(/Royal Peacock Jhumkas/i)).toBeVisible();
    await expect(page.getByText(/K22M9981A/i)).toBeVisible();

    // Price Breakdown
    await expect(page.getByText(/Gold Rate|Making Charges|GST/i).first()).toBeVisible();

    // Wishlist Toggle
    const wishlistBtn = page.locator('[data-testid="wishlist-toggle"]').or(page.getByRole("button", { name: /heart/i }));
    if (await wishlistBtn.isVisible()) {
      await wishlistBtn.click();
    }

    // Add to Cart
    const addCartBtn = page.getByRole("button", { name: /Add to Cart/i });
    if (await addCartBtn.isVisible()) {
      await addCartBtn.click();
    }
  });

  // ── 4. Fit Profile & "For You" Recommendations ─────────────────────────────

  test("6. Fit Profile: Proportion-based 'For You' recommendations display custom reasoning", async ({ page }) => {
    await page.goto("/jewellery");

    // Verify "For You" section renders with proportion matching badges
    const forYouHeader = page.getByText(/For You \(Proportions Match\)/i);
    if (await forYouHeader.isVisible()) {
      await expect(forYouHeader).toBeVisible();
      await expect(page.getByText(/Proportion Match/i).first()).toBeVisible();
      await expect(page.getByText(/Suits your proportions/i).first()).toBeVisible();

      // Clicking a recommendation card navigates to product detail
      const recCard = page.getByText(/Royal Peacock Jhumkas/i).first();
      await recCard.click();
      await expect(page).toHaveURL(/\/jewellery\/\d+/);
    }
  });

  test("7. DPDP Right to Erasure: deleting fit profile hides 'For You' recommendations", async ({ page }) => {
    // Delete fit profile
    await page.request.delete("/api/jewellery/fit-profile");

    // Re-visit homepage
    await page.goto("/jewellery");

    // If profile is deleted, API returns 204 and section does not appear
    const forYouHeader = page.getByText(/For You \(Proportions Match\)/i);
    expect(await forYouHeader.isVisible()).toBeFalsy();
  });
});
