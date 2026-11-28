import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { apiClient } from "../common/apiClient";
import { cancelBooking } from "../amenity/amenityBookingService";
import { createTicket } from "./helpdeskSlaService";
import { ticketService } from "./ticketService";

const { mockAxiosInstancePost } = vi.hoisted(() => ({
  mockAxiosInstancePost: vi.fn(),
}));

vi.mock("../axiosInstance", () => ({
  default: {
    get: vi.fn(),
    post: mockAxiosInstancePost,
  },
}));

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("../common/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("Amenity Waitlist Promotion & Helpdesk Attachment/SLA Services (Web)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns waitlist promotion metadata when an occupied amenity booking is cancelled", async () => {
    mockAxiosInstancePost.mockResolvedValueOnce({
      data: {
        success: true,
        message: "Cancelled and offered slot to waitlist position 1",
        cancelledReference: "BK-ABC123",
        promotedWaitlistResidentId: 1002,
        promotedWaitlistPosition: 1,
      },
    });

    const res = await cancelBooking(55, 1001);
    expect(res.data.promotedWaitlistResidentId).toBe(1002);
    expect(res.data.promotedWaitlistPosition).toBe(1);
  });

  it("submits helpdesk SLA & ticket complaints with photo attachments", async () => {
    (axios.post as any).mockResolvedValueOnce({
      data: {
        id: 501,
        communityId: 412,
        title: "Pipe leakage",
        attachmentUrls: "https://cdn.mygate.in/leak1.jpg,https://cdn.mygate.in/leak2.jpg",
        slaMinutes: 60,
      },
    });

    const ticket = await createTicket({
      communityId: 412,
      title: "Pipe leakage",
      description: "Water dripping near riser shaft",
      category: "PLUMBING",
      priority: "MEDIUM",
      tower: "B",
      flatNumber: "404",
      reportedByUserId: 77,
      attachmentUrls: "https://cdn.mygate.in/leak1.jpg,https://cdn.mygate.in/leak2.jpg",
    });

    expect(ticket.attachmentUrls).toContain("leak1.jpg");
    expect(ticket.slaMinutes).toBe(60);

    (apiClient.post as any).mockResolvedValueOnce({
      id: 601,
      ticketNumber: "TKT-601",
      attachments: "https://cdn.mygate.in/leak1.jpg",
    });
    const created = await ticketService.create({
      subject: "Pipe leakage",
      description: "Bathroom pipe dripping",
      category: "PLUMBING",
      priority: "HIGH",
      attachments: "https://cdn.mygate.in/leak1.jpg",
    });
    expect(created.attachments).toBe("https://cdn.mygate.in/leak1.jpg");
  });
});
