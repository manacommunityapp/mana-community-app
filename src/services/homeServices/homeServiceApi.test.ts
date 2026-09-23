import { describe, it, expect, beforeEach } from "vitest";
import { homeServiceApi } from "./homeServiceApi";
import type { HomeServiceBooking, ServiceAttendance } from "../../types/homeServices";

describe("HomeServiceApi - Categories & Workers", () => {
  beforeEach(() => {
    homeServiceApi.resetStorage();
  });

  it("should fetch all active service categories", async () => {
    const categories = await homeServiceApi.getCategories();
    expect(categories.length).toBeGreaterThanOrEqual(15);
    const maidCat = categories.find((c) => c.code === "MAID");
    expect(maidCat).toBeDefined();
    expect(maidCat?.supportsRecurring).toBe(true);
    expect(maidCat?.supportsMonthly).toBe(true);
  });

  it("should retrieve verified workers and filter by category", async () => {
    const allWorkers = await homeServiceApi.getWorkers();
    expect(allWorkers.length).toBeGreaterThan(0);

    const lakshmi = allWorkers.find((w) => w.displayName.includes("Lakshmi"));
    expect(lakshmi).toBeDefined();
    expect(lakshmi?.verificationStatus).toBe("VERIFIED");
    expect(lakshmi?.communityVerified).toBe(true);
    expect(lakshmi?.securityVerified).toBe(true);

    const cooks = await homeServiceApi.getWorkers({ categoryId: "cat-cook" });
    expect(cooks.some((c) => c.displayName.includes("Suresh"))).toBe(true);
  });

  it("should filter workers by minimum rating and tower", async () => {
    const highRated = await homeServiceApi.getWorkers({ minRating: 4.8 });
    expect(highRated.every((w) => w.rating >= 4.8)).toBe(true);

    const towerAWorkers = await homeServiceApi.getWorkers({ tower: "A" });
    expect(towerAWorkers.some((w) => w.flatAssignments.some((f) => f.tower === "A"))).toBe(true);
  });
});

describe("HomeServiceApi - Booking & Concurrency Safety", () => {
  beforeEach(() => {
    homeServiceApi.resetStorage();
  });

  it("should successfully create a recurring service booking", async () => {
    const booking = await homeServiceApi.createBooking({
      workerId: "worker-anitha",
      categoryId: "cat-cleaning",
      bookingType: "MONTHLY",
      pricingModel: "FIXED_MONTHLY",
      startDate: "2026-10-01",
      recurringDays: ["MONDAY", "WEDNESDAY", "FRIDAY"],
      startTime: "10:00",
      endTime: "11:30",
      price: 3200,
      flatNumber: "C-104",
      tower: "C",
      notes: "Please wash balconies.",
    });

    expect(booking.id).toBeDefined();
    expect(booking.status).toBe("REQUESTED");
    expect(booking.price).toBe(3200);
  });

  it("should reject conflicting overlapping booking requests for the same worker", async () => {
    // booking-101 is already pre-seeded for worker-lakshmi at 08:00 on MON-SAT
    await expect(
      homeServiceApi.createBooking({
        workerId: "worker-lakshmi",
        categoryId: "cat-maid",
        bookingType: "MONTHLY",
        pricingModel: "FIXED_MONTHLY",
        startDate: "2026-10-01",
        recurringDays: ["MONDAY", "TUESDAY"],
        startTime: "08:00",
        endTime: "09:30",
        price: 3500,
        flatNumber: "B-501",
        tower: "B",
      })
    ).rejects.toThrow(/already booked or requested/i);
  });

  it("should handle state transitions: confirm, complete, and cancel", async () => {
    const bookings = await homeServiceApi.getBookings();
    const target = bookings[0];

    // Confirm
    const confirmed = await homeServiceApi.updateBookingStatus(target.id, "CONFIRMED");
    expect(confirmed.status).toBe("CONFIRMED");

    // Complete
    const completed = await homeServiceApi.updateBookingStatus(target.id, "COMPLETED");
    expect(completed.status).toBe("COMPLETED");

    // Cancel
    const cancelled = await homeServiceApi.updateBookingStatus(target.id, "CANCELLED_BY_RESIDENT", "Relocated");
    expect(cancelled.status).toBe("CANCELLED_BY_RESIDENT");
    expect(cancelled.cancellationReason).toBe("Relocated");
  });
});

describe("HomeServiceApi - Attendance & Monthly Payment Calculation", () => {
  beforeEach(() => {
    homeServiceApi.resetStorage();
  });

  it("should mark and retrieve attendance logs", async () => {
    const att = await homeServiceApi.markAttendance({
      bookingId: "booking-101",
      workerId: "worker-lakshmi",
      serviceDate: "2026-09-23",
      status: "COMPLETED",
      notes: "On-time arrival",
    });

    expect(att.status).toBe("COMPLETED");
    expect(att.serviceDate).toBe("2026-09-23");

    const history = await homeServiceApi.getAttendance("booking-101");
    expect(history.some((h) => h.serviceDate === "2026-09-23")).toBe(true);
  });

  it("should accurately calculate monthly bill based on pricing model", () => {
    const fixedBooking: HomeServiceBooking = {
      id: "b-1",
      communityId: "c-1",
      flatId: "f-1",
      tower: "A",
      flatNumber: "A-204",
      residentUserId: "u-1",
      workerId: "w-1",
      categoryId: "cat-maid",
      bookingType: "MONTHLY",
      pricingModel: "FIXED_MONTHLY",
      startDate: "2026-09-01",
      recurringDays: ["MONDAY"],
      startTime: "08:00",
      endTime: "09:00",
      price: 3500,
      status: "CONFIRMED",
      createdAt: "2026-09-01",
      updatedAt: "2026-09-01",
    };

    const attendanceRecords: ServiceAttendance[] = [
      { id: "a-1", bookingId: "b-1", workerId: "w-1", residentUserId: "u-1", serviceDate: "2026-09-01", status: "COMPLETED", markedBy: "RESIDENT", createdAt: "", updatedAt: "" },
      { id: "a-2", bookingId: "b-1", workerId: "w-1", residentUserId: "u-1", serviceDate: "2026-09-02", status: "COMPLETED", markedBy: "RESIDENT", createdAt: "", updatedAt: "" },
      { id: "a-3", bookingId: "b-1", workerId: "w-1", residentUserId: "u-1", serviceDate: "2026-09-03", status: "ABSENT", markedBy: "RESIDENT", createdAt: "", updatedAt: "" },
      { id: "a-4", bookingId: "b-1", workerId: "w-1", residentUserId: "u-1", serviceDate: "2026-09-04", status: "LEAVE", markedBy: "WORKER", createdAt: "", updatedAt: "" },
    ];

    const fixedBill = homeServiceApi.calculateMonthlyBill(fixedBooking, attendanceRecords);
    expect(fixedBill.completedDays).toBe(2);
    expect(fixedBill.absentDays).toBe(1);
    expect(fixedBill.leaveDays).toBe(1);
    expect(fixedBill.totalBill).toBe(3500);

    const perDayBooking: HomeServiceBooking = { ...fixedBooking, pricingModel: "PER_DAY", price: 250 };
    const perDayBill = homeServiceApi.calculateMonthlyBill(perDayBooking, attendanceRecords);
    expect(perDayBill.totalBill).toBe(500); // 2 days * 250
  });
});

describe("HomeServiceApi - Post Requirement & Bidding Workflow", () => {
  beforeEach(() => {
    homeServiceApi.resetStorage();
  });

  it("should post a requirement and allow workers to submit bids", async () => {
    const newReq = await homeServiceApi.createRequirement({
      categoryId: "cat-cook",
      frequency: "MONTHLY",
      preferredDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
      startDate: "2026-10-15",
      preferredStartTime: "07:30",
      preferredEndTime: "09:00",
      budgetMin: 5000,
      budgetMax: 6500,
      tower: "A",
      description: "Need breakfast & dinner cook for family of 4.",
    });

    expect(newReq.id).toBeDefined();
    expect(newReq.status).toBe("OPEN");

    const bid = await homeServiceApi.submitWorkerResponse({
      requestId: newReq.id,
      workerId: "worker-suresh",
      proposedPrice: 5800,
      message: "Available for 7:30 AM slot.",
    });

    expect(bid.id).toBeDefined();
    expect(bid.proposedPrice).toBe(5800);

    const responses = await homeServiceApi.getResponsesForRequirement(newReq.id);
    expect(responses.length).toBe(1);
    expect(responses[0].workerName).toContain("Suresh");
  });
});

describe("HomeServiceApi - Reviews, Gate Pass & Admin Oversight", () => {
  beforeEach(() => {
    homeServiceApi.resetStorage();
  });

  it("should submit multi-factor review and recalculate worker rating", async () => {
    const review = await homeServiceApi.createReview({
      bookingId: "booking-101",
      revieweeId: "worker-lakshmi",
      rating: 5.0,
      workQuality: 5,
      punctuality: 5,
      behaviour: 5,
      reliability: 5,
      comment: "Outstanding service quality and punctual timing.",
    });

    expect(review.id).toBeDefined();
    expect(review.rating).toBe(5.0);

    const worker = await homeServiceApi.getWorkerById("worker-lakshmi");
    expect(worker?.rating).toBeGreaterThanOrEqual(4.8);
  });

  it("should generate valid security gate pass records", async () => {
    const pass = await homeServiceApi.getGatePass("worker-lakshmi");
    expect(pass.status).toBe("ACTIVE");
    expect(pass.qrTokenHash).toContain("MANA-SEC-QR");
    expect(pass.history.length).toBeGreaterThan(0);
  });

  it("should calculate admin analytics KPIs", async () => {
    const stats = await homeServiceApi.getAdminAnalytics();
    expect(stats.totalWorkers).toBeGreaterThan(0);
    expect(stats.verifiedWorkers).toBeGreaterThan(0);
  });
});
