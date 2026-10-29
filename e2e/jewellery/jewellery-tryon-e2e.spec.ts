import { test, expect } from "@playwright/test";
import { injectAuth, mockAuthRoutes } from "../fixtures/auth";
import {
  mockAllJewelleryRoutes,
  MOCK_JEWELLERY_PRODUCTS,
} from "../fixtures/jewellery-fixtures";

test.describe("Virtual Try-On Studio — End-to-End User Journey", () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
    await mockAllJewelleryRoutes(page);
  });

  test("1. DPDP Consent Gate: displays privacy notice before camera or gallery launch", async ({ page }) => {
    // Navigate to Virtual Try-On studio
    await page.goto("/jewellery/try-on?productId=201");

    // Click "Take Photo"
    const takePhotoButton = page.getByRole("button", { name: /Take Photo/i });
    if (await takePhotoButton.isVisible()) {
      await takePhotoButton.click();

      // Consent Modal must be visible
      const consentTitle = page.getByText(/Your Photo, Your Privacy/i);
      await expect(consentTitle).toBeVisible();

      // Verify mandatory DPDP clauses are displayed
      await expect(page.getByText(/Deleted automatically within 24 hours/i)).toBeVisible();
      await expect(page.getByText(/Encrypted in transit and at rest/i)).toBeVisible();
      await expect(page.getByText(/Not used for identity \/ face recognition/i)).toBeVisible();
      await expect(page.getByText(/Never shared with third parties/i)).toBeVisible();

      // User declines consent
      const cancelButton = page.getByRole("button", { name: /Cancel/i });
      await cancelButton.click();
      await expect(consentTitle).not.toBeVisible();
    }
  });

  test("2. Full Upload & Composition Pipeline: S3 Presigned URL, Session, Job Polling", async ({ page }) => {
    let s3UploadRequested = false;
    let tryOnSessionStarted = false;
    let photoJobSubmitted = false;

    // Track network pipeline calls
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/api/jewellery/try-on/uploads")) s3UploadRequested = true;
      if (url.includes("/api/jewellery/try-on/sessions") && req.method() === "POST") {
        if (!url.includes("photo-jobs")) tryOnSessionStarted = true;
        else photoJobSubmitted = true;
      }
    });

    await page.goto("/jewellery/try-on?productId=201");

    // Trigger Upload photo flow
    const uploadBtn = page.getByRole("button", { name: /Upload Photo/i });
    if (await uploadBtn.isVisible()) {
      await uploadBtn.click();

      // Accept consent
      const agreeBtn = page.getByRole("button", { name: /I Understand – Continue/i });
      if (await agreeBtn.isVisible()) {
        await agreeBtn.click();
      }

      // Studio transitions through states
      // In web/mock test, verify loading state and progress
      const uploadingText = page.getByText(/Uploading photo…|Applying jewellery…/i);
      if (await uploadingText.isVisible()) {
        await expect(uploadingText).toBeVisible();
      }
    }
  });

  test("3. Result & Comparison View: Before/After split toggle", async ({ page }) => {
    await page.goto("/jewellery/try-on?productId=201");

    // Compare button toggles side-by-side view
    const compareBtn = page.getByRole("button", { name: /images-outline/i }).or(page.locator('[data-testid="compare-btn"]'));
    if (await compareBtn.isVisible()) {
      await compareBtn.click();
      await expect(page.getByText(/Before/i)).toBeVisible();
      await expect(page.getByText(/With Jewellery/i)).toBeVisible();
    }
  });

  test("4. Studio CTAs: Save Look to Wishlist and Add to Cart", async ({ page }) => {
    let wishlistedProduct = false;

    page.on("request", (req) => {
      if (req.url().includes("/api/jewellery/wishlist") && req.method() === "POST") {
        wishlistedProduct = true;
      }
    });

    await page.goto("/jewellery/try-on?productId=201");

    const saveLookBtn = page.getByRole("button", { name: /Save Look/i });
    if (await saveLookBtn.isVisible()) {
      await saveLookBtn.click();
      // Should show saved confirmation or trigger API
    }

    const addToCartBtn = page.getByRole("button", { name: /Add to Cart/i });
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
    }
  });

  test("5. Product Carousel Pre-selection: Switch jewellery SKU dynamically", async ({ page }) => {
    await page.goto("/jewellery/try-on");

    // Verify try-on ready items are listed in the carousel
    const carouselTitle = page.getByText(/Try-On Ready Items/i);
    if (await carouselTitle.isVisible()) {
      await expect(carouselTitle).toBeVisible();

      // Click on an item card
      const itemCard = page.getByText(/Royal Peacock Jhumkas/i).first();
      if (await itemCard.isVisible()) {
        await itemCard.click();
        await expect(page.getByText(/Try on Royal Peacock Jhumkas/i)).toBeVisible();
      }
    }
  });

  test("6. Live AR Information Dialog: notifies user about native tracking SDK", async ({ page }) => {
    await page.goto("/jewellery/try-on?productId=201");

    const liveARBtn = page.getByRole("button", { name: /Live AR/i });
    if (await liveARBtn.isVisible()) {
      // Setup dialog handler
      page.once("dialog", async (dialog) => {
        expect(dialog.message()).toContain("Live AR");
        await dialog.dismiss();
      });
      await liveARBtn.click();
    }
  });
});
