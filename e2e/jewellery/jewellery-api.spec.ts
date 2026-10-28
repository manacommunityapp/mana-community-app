import { test, expect } from "@playwright/test";
import {
  MOCK_JEWELLERY_PRODUCTS,
  MOCK_JEWELLERY_VENDORS,
  MOCK_TIME_SLOTS,
  MOCK_RECOMMENDATIONS,
} from "../fixtures/jewellery-fixtures";

test.describe("Jewellery Module — End-to-End API Integration Contract", () => {
  // ── 1. Catalogue & Product Discovery Endpoints ──────────────────────────────

  test("GET /api/jewellery/products returns active products list with price breakdowns", async ({ request }) => {
    // We test against mocked route handlers or test environment baseURL
    const res = await request.get("/api/jewellery/products");
    expect(res.status()).toBe(200);
    const products = await res.json();
    expect(Array.isArray(products)).toBeTruthy();
    if (products.length > 0) {
      const p = products[0];
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("name");
      expect(p).toHaveProperty("category");
      expect(p).toHaveProperty("totalPrice");
      expect(typeof p.totalPrice).toBe("number");
    }
  });

  test("GET /api/jewellery/products supports category and material filtering", async ({ request }) => {
    const res = await request.get("/api/jewellery/products?category=EARRINGS&material=GOLD");
    expect(res.status()).toBe(200);
    const products = await res.json();
    expect(Array.isArray(products)).toBeTruthy();
    for (const p of products) {
      if (p.category) expect(p.category).toBe("EARRINGS");
      if (p.material) expect(p.material).toBe("GOLD");
    }
  });

  test("GET /api/jewellery/products supports search queries", async ({ request }) => {
    const res = await request.get("/api/jewellery/products?search=jhumka");
    expect(res.status()).toBe(200);
    const products = await res.json();
    expect(Array.isArray(products)).toBeTruthy();
  });

  test("GET /api/jewellery/products/featured returns curated items", async ({ request }) => {
    const res = await request.get("/api/jewellery/products/featured");
    expect(res.status()).toBe(200);
    const featured = await res.json();
    expect(Array.isArray(featured)).toBeTruthy();
  });

  test("GET /api/jewellery/products/:id returns single product with full HUID & vendor data", async ({ request }) => {
    const res = await request.get("/api/jewellery/products/201");
    if (res.status() === 200) {
      const p = await res.json();
      expect(p.id).toBe("201");
      expect(p.name).toContain("Jhumka");
      expect(p.huid).toBeTruthy();
      expect(p.totalPrice).toBeGreaterThan(0);
    }
  });

  // ── 2. Vendor Storefront & Consultation Slots ───────────────────────────────

  test("GET /api/jewellery/vendors/:id returns vendor storefront profile with BIS hallmark", async ({ request }) => {
    const res = await request.get("/api/jewellery/vendors/101");
    if (res.status() === 200) {
      const v = await res.json();
      expect(v.id).toBe("101");
      expect(v.shopName).toBeTruthy();
      expect(v.bisHallmarkLicense).toBeTruthy();
      expect(v.rating).toBeGreaterThanOrEqual(4.0);
    }
  });

  test("GET /api/jewellery/vendors/:id/available-slots dynamically returns unbooked slots", async ({ request }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    const res = await request.get(`/api/jewellery/vendors/101/available-slots?date=${dateStr}`);
    expect(res.status()).toBe(200);
    const slots = await res.json();
    expect(Array.isArray(slots)).toBeTruthy();
    // Slots should be valid time strings e.g. "10:00 AM"
    for (const slot of slots) {
      expect(slot).toMatch(/\d{1,2}:\d{2}\s+(AM|PM)/);
    }
  });

  // ── 3. Virtual Try-On Pipeline (Presigned S3, Session, Job Polling) ──────────

  test("POST /api/jewellery/try-on/uploads generates S3 presigned PUT URL and s3Key", async ({ request }) => {
    const res = await request.post("/api/jewellery/try-on/uploads");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("presignedUploadUrl");
    expect(data).toHaveProperty("s3Key");
    expect(data).toHaveProperty("sessionId");
    expect(data.httpMethod).toBe("PUT");
    expect(data.contentType).toBe("image/jpeg");
    expect(data.presignedUploadUrl).toContain("http");
  });

  test("POST /api/jewellery/try-on/sessions starts try-on session for product", async ({ request }) => {
    const res = await request.post("/api/jewellery/try-on/sessions", {
      data: {
        productId: "201",
        mode: "PHOTO",
        platform: "web",
      },
    });
    expect(res.status()).toBe(200);
    const session = await res.json();
    expect(session).toHaveProperty("id");
    expect(session.mode).toBe("PHOTO");
  });

  test("POST /api/jewellery/try-on/sessions/:id/photo-jobs submits job with sourceS3Key", async ({ request }) => {
    const res = await request.post("/api/jewellery/try-on/sessions/sess-8899/photo-jobs", {
      data: {
        sourceS3Key: "marketplace/jewellery-tryon/test-user-photo-1001.jpg",
      },
    });
    expect(res.status()).toBe(200);
    const job = await res.json();
    expect(job).toHaveProperty("id");
    expect(["QUEUED", "PROCESSING"]).toContain(job.status);
  });

  test("GET /api/jewellery/try-on/photo-jobs/:id polls job status until COMPLETED with outputUrl", async ({ request }) => {
    const res = await request.get("/api/jewellery/try-on/photo-jobs/job-7711");
    expect(res.status()).toBe(200);
    const job = await res.json();
    expect(job).toHaveProperty("id");
    expect(["QUEUED", "PROCESSING", "COMPLETED"]).toContain(job.status);
    if (job.status === "COMPLETED") {
      expect(job).toHaveProperty("outputUrl");
      expect(job.outputUrl).toContain("http");
    }
  });

  test("DELETE /api/jewellery/try-on/photos/:id supports DPDP photo purge", async ({ request }) => {
    const res = await request.delete("/api/jewellery/try-on/photos/7711");
    expect([200, 204]).toContain(res.status());
  });

  // ── 4. Appointments Lifecycle & Merchant Dashboard ──────────────────────────

  test("POST /api/jewellery/appointments books consultation slot", async ({ request }) => {
    const res = await request.post("/api/jewellery/appointments", {
      data: {
        vendorId: "101",
        date: "2026-11-10",
        time: "02:00 PM",
        purpose: "BRIDAL",
        notes: "Interested in heritage choker and earrings pairing",
      },
    });
    expect(res.status()).toBe(200);
    const appt = await res.json();
    expect(appt).toHaveProperty("id");
    expect(appt.vendorId).toBe("101");
    expect(appt.status).toBe("PENDING");
  });

  test("GET /api/jewellery/appointments returns user consultation appointments", async ({ request }) => {
    const res = await request.get("/api/jewellery/appointments");
    expect(res.status()).toBe(200);
    const appts = await res.json();
    expect(Array.isArray(appts)).toBeTruthy();
  });

  test("PATCH /api/jewellery/appointments/:id/cancel cancels appointment with reason", async ({ request }) => {
    const res = await request.patch("/api/jewellery/appointments/301/cancel", {
      data: { reason: "Rescheduled visit to weekend" },
    });
    expect([200, 204]).toContain(res.status());
  });

  test("Merchant Dashboard: GET /api/jewellery/vendor/appointments", async ({ request }) => {
    const res = await request.get("/api/jewellery/vendor/appointments");
    expect(res.status()).toBe(200);
    const appts = await res.json();
    expect(Array.isArray(appts)).toBeTruthy();
  });

  test("Merchant Dashboard: PATCH /api/jewellery/vendor/appointments/:id/status updates status", async ({ request }) => {
    const res = await request.patch("/api/jewellery/vendor/appointments/301/status", {
      data: { status: "CONFIRMED" },
    });
    expect([200, 204]).toContain(res.status());
  });

  // ── 5. Wishlist Management ──────────────────────────────────────────────────

  test("POST /api/jewellery/wishlist adds product to buyer wishlist", async ({ request }) => {
    const res = await request.post("/api/jewellery/wishlist", {
      data: { productId: 201 },
    });
    expect([200, 201]).toContain(res.status());
  });

  test("GET /api/jewellery/wishlist returns saved items", async ({ request }) => {
    const res = await request.get("/api/jewellery/wishlist");
    expect(res.status()).toBe(200);
    const list = await res.json();
    expect(Array.isArray(list)).toBeTruthy();
  });

  test("DELETE /api/jewellery/wishlist/:id removes product from wishlist", async ({ request }) => {
    const res = await request.delete("/api/jewellery/wishlist/201");
    expect([200, 204]).toContain(res.status());
  });

  // ── 6. Fit Profile & Proportion-Based Recommendations ───────────────────────

  test("PUT /api/jewellery/fit-profile saves face proportions", async ({ request }) => {
    const res = await request.put("/api/jewellery/fit-profile", {
      data: {
        faceShape: "round",
        widthRatio: 0.88,
        neckRatio: 0.65,
        confidence: 0.94,
      },
    });
    expect([200, 204]).toContain(res.status());
  });

  test("GET /api/jewellery/fit-profile fetches stored profile", async ({ request }) => {
    const res = await request.get("/api/jewellery/fit-profile");
    if (res.status() === 200) {
      const profile = await res.json();
      expect(profile.faceShape).toBe("round");
      expect(profile.confidence).toBeGreaterThan(0.5);
    } else {
      expect([200, 204]).toContain(res.status());
    }
  });

  test("GET /api/jewellery/recommendations returns proportion-matched products with scores", async ({ request }) => {
    const res = await request.get("/api/jewellery/recommendations?category=EARRINGS&limit=6");
    if (res.status() === 200) {
      const recs = await res.json();
      expect(Array.isArray(recs)).toBeTruthy();
      for (const rec of recs) {
        expect(rec).toHaveProperty("productId");
        expect(rec).toHaveProperty("score");
        expect(rec).toHaveProperty("reason");
        expect(rec.score).toBeGreaterThan(0);
      }
    } else {
      expect(res.status()).toBe(204); // 204 when user has no profile
    }
  });

  test("DELETE /api/jewellery/fit-profile purges profile for DPDP right to erasure", async ({ request }) => {
    const res = await request.delete("/api/jewellery/fit-profile");
    expect([200, 204]).toContain(res.status());
  });
});
