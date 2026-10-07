import { describe, it, expect, beforeEach } from "vitest";
import { tripService } from "./tripService";
import type { Trip } from "./tripService";

if (typeof globalThis.localStorage === "undefined") {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    length: 0,
  } as unknown as Storage;
}

describe("TripService - Full Lifecycle & Emergency Contacts", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should create a trip with emergency contact details", () => {
    const trip = tripService.createTrip(
      {
        title: "Wayanad Weekend Trek",
        category: "TREKKING",
        description: "Community hiking trip through Chembra peak.",
        destination: "Wayanad, Kerala",
        departureDate: new Date(Date.now() + 10 * 86400000).toISOString(),
        returnDate: new Date(Date.now() + 12 * 86400000).toISOString(),
        departurePoint: "Clubhouse Gate",
        totalSeats: 2,
        maxWaitlist: 5,
        pricePerPerson: 3500,
        itinerary: [],
        transport: "Mini Bus",
        emergencyContactName: "Dr. Arvind K",
        emergencyContactPhone: "+91 98860 99881",
        emergencyNotes: "First Aid Kit available on board",
        includes: ["Travel", "Snacks"],
        excludes: ["Personal meals"],
        cancellationPolicy: {
          freeCancellationBeforeDays: 7,
          penaltyPercentAfterDeadline: 25,
          policyNotes: "75% refund if cancelled within 7 days",
        },
        imagePlaceholderColor: "#10b981",
      },
      { id: "host-1", fullName: "Rahul Verma", flatNo: "B-204", phone: "+91 98765 00001" }
    );

    expect(trip.id).toBeDefined();
    expect(trip.title).toBe("Wayanad Weekend Trek");
    expect(trip.emergencyContactName).toBe("Dr. Arvind K");
    expect(trip.emergencyContactPhone).toBe("+91 98860 99881");
    expect(trip.emergencyNotes).toBe("First Aid Kit available on board");
    expect(trip.totalSeats).toBe(2);
    expect(trip.bookedSeats).toBe(0);
  });

  it("should handle booking capacity, waitlist overflow, and tiered cancellation refund", () => {
    const trip = tripService.createTrip(
      {
        title: "Coorg Plantation Tour",
        category: "OUTING",
        description: "Coffee estate exploration",
        destination: "Coorg",
        departureDate: new Date(Date.now() + 10 * 86400000).toISOString(),
        returnDate: new Date(Date.now() + 11 * 86400000).toISOString(),
        departurePoint: "Clubhouse Gate",
        totalSeats: 2,
        maxWaitlist: 2,
        pricePerPerson: 2000,
        itinerary: [],
        transport: "Tempo Traveller",
        includes: ["Travel"],
        excludes: [],
        cancellationPolicy: {
          freeCancellationBeforeDays: 7,
          penaltyPercentAfterDeadline: 25,
          policyNotes: "Standard policy",
        },
        imagePlaceholderColor: "#3b82f6",
      },
      { id: "host-1", fullName: "Host User" }
    );

    // Book 2 seats -> CONFIRMED
    const booking1 = tripService.bookTrip(
      trip.id,
      {
        passengers: [
          { id: "p1", name: "Alice", age: 28, gender: "FEMALE", emergencyPhone: "9999900001" },
          { id: "p2", name: "Bob", age: 30, gender: "MALE", emergencyPhone: "9999900002" },
        ],
        paymentMethod: "UPI",
      },
      { id: "user-1", fullName: "Alice Smith" }
    );

    expect(booking1.status).toBe("CONFIRMED");
    expect(booking1.participantCount).toBe(2);

    const tripAfter1 = tripService.getTripById(trip.id);
    expect(tripAfter1?.bookedSeats).toBe(2);

    // Book 1 seat -> Over capacity -> WAITLISTED
    const booking2 = tripService.bookTrip(
      trip.id,
      {
        passengers: [{ id: "p3", name: "Charlie", age: 25, gender: "MALE", emergencyPhone: "9999900003" }],
        paymentMethod: "UPI",
      },
      { id: "user-2", fullName: "Charlie Brown" }
    );

    expect(booking2.status).toBe("WAITLISTED");

    // Cancel booking1 (10 days ahead -> > 7 days free cancellation -> 100% refund)
    const { refundAmount, penaltyDeducted } = tripService.cancelBooking(booking1.id, "Emergency at home");
    expect(refundAmount).toBe(4000); // 2000 * 2 = 4000
    expect(penaltyDeducted).toBe(0);

    // Waitlist should auto-promote Charlie
    const bookingsAfter = tripService.getMyBookings("user-2");
    expect(bookingsAfter[0].status).toBe("CONFIRMED");

    const tripAfterCancel = tripService.getTripById(trip.id);
    expect(tripAfterCancel?.bookedSeats).toBe(1);
    expect(tripAfterCancel?.waitlistCount).toBe(0);
  });
});
