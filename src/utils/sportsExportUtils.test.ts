import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  exportTournamentPaymentsToCSV,
  exportTournamentPaymentsToExcel,
  exportTournamentPaymentsToPDF,
} from "./sportsExportUtils";
import type { UniqueTournamentPlayer } from "../services/sports/tournamentPaymentService";

describe("sportsExportUtils - Tournament Payment & Roster Exports", () => {
  let createdBlobContent: string = "";
  let createdDownloadFilename: string = "";

  beforeEach(() => {
    createdBlobContent = "";
    createdDownloadFilename = "";

    // Mock Blob and URL
    globalThis.Blob = vi.fn().mockImplementation(function (parts: any[]) {
      createdBlobContent = parts.join("");
      return { parts };
    }) as any;

    globalThis.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    globalThis.URL.revokeObjectURL = vi.fn();

    // Mock document and window
    const mockDocument = {
      createElement: vi.fn().mockImplementation((tag: string) => {
        if (tag === "a") {
          return {
            setAttribute: (attr: string, val: string) => {
              if (attr === "download") createdDownloadFilename = val;
            },
            click: vi.fn(),
          };
        }
        return {};
      }),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    };
    (globalThis as any).document = mockDocument;

    const mockWindow = {
      open: vi.fn(),
    };
    (globalThis as any).window = mockWindow;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockPlayers: UniqueTournamentPlayer[] = [
    {
      playerKey: "user_10",
      playerName: "Rahul Verma",
      flatNumber: "A-101",
      phone: "9999911111",
      email: "rahul@example.com",
      relation: "SELF",
      isPartnerOnly: false,
      paymentStatus: "PAID",
      payment: {
        tournamentId: 1,
        playerKey: "user_10",
        playerName: "Rahul Verma",
        flatNumber: "A-101",
        paymentStatus: "PAID",
        amount: 500,
        paymentMode: "UPI",
        transactionRef: "UPI-TXN-12345",
        paidAt: "2026-11-08T10:00:00.000Z",
        collectedByName: "Amit Sharma",
        collectedByContact: "9876500000",
        notes: "Paid via GPay",
      },
      registeredEvents: [
        {
          eventId: 101,
          eventName: "Badminton Men Singles",
          sportName: "Badminton",
          categoryName: "Open",
          status: "CONFIRMED",
        },
        {
          eventId: 102,
          eventName: "Tennis Doubles",
          sportName: "Tennis",
          categoryName: "Men 30+",
          status: "CONFIRMED",
          partnerName: "Suresh Kumar",
          partnerPhone: "9999922222",
          partnerConfirmationStatus: "CONFIRMED",
        },
      ],
    },
    {
      playerKey: "user_20",
      playerName: "Suresh Kumar",
      flatNumber: "B-202",
      phone: "9999922222",
      relation: "SELF",
      isPartnerOnly: true,
      paymentStatus: "UNPAID",
      registeredEvents: [
        {
          eventId: 102,
          eventName: "Tennis Doubles",
          sportName: "Tennis",
          categoryName: "Men 30+",
          status: "CONFIRMED",
          isPartner: true,
          partnerName: "Rahul Verma",
          partnerPhone: "9999911111",
          partnerConfirmationStatus: "CONFIRMED",
        },
      ],
    },
  ];

  it("exports tournament roster to CSV with all 20 columns", () => {
    exportTournamentPaymentsToCSV(mockPlayers, "Annual_Community_Games", "roster");

    expect(createdDownloadFilename).toContain("Annual_Community_Games_Roster_Payments");
    expect(createdBlobContent).toContain("S.No,Flat / Unit No,Household Role,Relation,Player Name");
    expect(createdBlobContent).toContain("Fee Amount (INR)");
    expect(createdBlobContent).toContain("Transaction Ref / UPI ID");

    // Check Rahul Verma's details
    expect(createdBlobContent).toContain('"Rahul Verma"');
    expect(createdBlobContent).toContain('"A-101"');
    expect(createdBlobContent).toContain('"Head of Household"');
    expect(createdBlobContent).toContain('"Primary Participant"');
    expect(createdBlobContent).toContain('"PAID"');
    expect(createdBlobContent).toContain("500");
    expect(createdBlobContent).toContain('"UPI-TXN-12345"');
    expect(createdBlobContent).toContain('"Amit Sharma"');
    expect(createdBlobContent).toContain('"Paid via GPay"');

    // Check Suresh Kumar's details
    expect(createdBlobContent).toContain('"Suresh Kumar"');
    expect(createdBlobContent).toContain('"B-202"');
    expect(createdBlobContent).toContain('"Doubles Partner Only"');
    expect(createdBlobContent).toContain('"UNPAID"');
  });

  it("exports detailed event-by-event breakdown to CSV", () => {
    exportTournamentPaymentsToCSV(mockPlayers, "Annual_Community_Games", "events");

    expect(createdDownloadFilename).toContain("Annual_Community_Games_Detailed_Events");
    expect(createdBlobContent).toContain("Role in Event,Partner Name,Partner Phone,Partner Confirmation Status");

    // Rahul has 2 events, so 2 rows for Rahul
    expect(createdBlobContent).toContain('"Badminton Men Singles"');
    expect(createdBlobContent).toContain('"Tennis Doubles"');
    expect(createdBlobContent).toContain('"Primary Registrant"');
    expect(createdBlobContent).toContain('"Nominated Partner"');
  });

  it("exports tournament roster & payments to Excel (.xls) with Table 1 and Table 2", () => {
    exportTournamentPaymentsToExcel(mockPlayers, "Annual_Community_Games", {
      total: 2,
      flats: 2,
      paid: 1,
      unpaid: 1,
      totalCollected: 500,
    });

    expect(createdDownloadFilename).toContain("Annual_Community_Games_Complete_Details");
    expect(createdDownloadFilename).toContain(".xls");

    // Title & Summary banner
    expect(createdBlobContent).toContain("Annual_Community_Games — Participant Roster &amp; Payment Hub");
    expect(createdBlobContent).toContain("Total Registered:</b> 2 Players");
    expect(createdBlobContent).toContain("Paid:</b> 1");
    expect(createdBlobContent).toContain("Total Collected:</b> INR 500");

    // Table 1 Header & Content
    expect(createdBlobContent).toContain("1. PARTICIPANT ROSTER &amp; PAYMENT STATUS (Summary)");
    expect(createdBlobContent).toContain("Rahul Verma");
    expect(createdBlobContent).toContain("badge-paid");
    expect(createdBlobContent).toContain("badge-unpaid");

    // Table 2 Detailed Events Header
    expect(createdBlobContent).toContain("2. DETAILED EVENT-BY-EVENT REGISTRATIONS (Check-In Sheet)");
    expect(createdBlobContent).toContain("Badminton Men Singles");
    expect(createdBlobContent).toContain("Tennis Doubles");
  });

  it("generates formatted PDF printable document", () => {
    const mockPrint = vi.fn();
    const mockWrite = vi.fn();
    const mockClose = vi.fn();
    const mockFocus = vi.fn();

    (globalThis as any).window.open = vi.fn().mockReturnValue({
      document: {
        write: mockWrite,
        close: mockClose,
      },
      focus: mockFocus,
      print: mockPrint,
    });

    exportTournamentPaymentsToPDF(mockPlayers, "Annual_Community_Games", {
      total: 2,
      flats: 2,
      paid: 1,
      unpaid: 1,
      totalCollected: 500,
    });

    expect((globalThis as any).window.open).toHaveBeenCalledWith("", "_blank", "width=1000,height=800");
    expect(mockWrite).toHaveBeenCalled();
    const htmlContent = mockWrite.mock.calls[0][0];
    expect(htmlContent).toContain("Annual_Community_Games — Participant Roster &amp; Payment Hub");
    expect(htmlContent).toContain("Rahul Verma");
    expect(htmlContent).toContain("Suresh Kumar");
    expect(htmlContent).toContain("status-paid");
    expect(htmlContent).toContain("status-unpaid");
  });
});

describe("sportsExportUtils - Schedule Exports with Flat Details", () => {
  let createdBlobContent: string = "";
  let createdDownloadFilename: string = "";

  beforeEach(() => {
    createdBlobContent = "";
    createdDownloadFilename = "";

    globalThis.Blob = vi.fn().mockImplementation(function (parts: any[]) {
      createdBlobContent = parts.join("");
      return { parts };
    }) as any;

    globalThis.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    globalThis.URL.revokeObjectURL = vi.fn();

    const mockDocument = {
      createElement: vi.fn().mockImplementation((tag: string) => {
        if (tag === "a") {
          return {
            setAttribute: (attr: string, val: string) => {
              if (attr === "download") createdDownloadFilename = val;
            },
            click: vi.fn(),
          };
        }
        return {};
      }),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    };
    (globalThis as any).document = mockDocument;
  });

  const mockMatches = [
    {
      matchNumber: 1,
      round: "GROUP_STAGE",
      groupName: "Group A",
      team1: "Vikram / Rohan",
      team2: "Sameer / Ankit",
      team1Flat: "Tower 1 - 402",
      team2Flat: "Tower 2 - 105",
      date: "2026-11-20",
      time: "09:00",
      court: "Court 1",
      status: "SCHEDULED",
    },
    {
      matchNumber: 2,
      round: "KNOCKOUT",
      home: "Alice",
      away: "Bob",
      homeFlat: "A-201",
      awayFlat: "B-304",
      date: "2026-11-20",
      time: "10:30",
      court: "Court 2",
      status: "SCHEDULED",
    },
  ];

  it("exports schedule to CSV including Team 1 Flat and Team 2 Flat columns", async () => {
    const { exportScheduleToCSV } = await import("./sportsExportUtils");
    exportScheduleToCSV(mockMatches, "Badminton Open");

    expect(createdDownloadFilename).toContain("Badminton_Open_");
    expect(createdDownloadFilename).toContain(".csv");
    // Verify CSV Header includes flat columns
    expect(createdBlobContent).toContain("Team 1 Flat");
    expect(createdBlobContent).toContain("Team 2 Flat");
    // Verify Row 1 flat values
    expect(createdBlobContent).toContain('"Tower 1 - 402"');
    expect(createdBlobContent).toContain('"Tower 2 - 105"');
    // Verify Row 2 fallback homeFlat/awayFlat
    expect(createdBlobContent).toContain('"A-201"');
    expect(createdBlobContent).toContain('"B-304"');
  });

  it("exports schedule to Excel including Team 1 Flat and Team 2 Flat headers and data cells", async () => {
    const { exportScheduleToExcel } = await import("./sportsExportUtils");
    exportScheduleToExcel(mockMatches, "Badminton Open");

    expect(createdDownloadFilename).toContain("Badminton_Open_");
    expect(createdDownloadFilename).toContain(".xls");
    expect(createdBlobContent).toContain("<th>Team 1 Flat</th>");
    expect(createdBlobContent).toContain("<th>Team 2 Flat</th>");
    expect(createdBlobContent).toContain("Tower 1 - 402");
    expect(createdBlobContent).toContain("Tower 2 - 105");
    expect(createdBlobContent).toContain("A-201");
    expect(createdBlobContent).toContain("B-304");
  });

  it("exports schedule to PDF with flat icons under team names", async () => {
    const mockPrint = vi.fn();
    const mockWrite = vi.fn();
    const mockClose = vi.fn();
    const mockFocus = vi.fn();

    (globalThis as any).window.open = vi.fn().mockReturnValue({
      document: {
        write: mockWrite,
        close: mockClose,
      },
      focus: mockFocus,
      print: mockPrint,
    });

    const { exportScheduleToPDF } = await import("./sportsExportUtils");
    exportScheduleToPDF(mockMatches, "Badminton Open");

    expect((globalThis as any).window.open).toHaveBeenCalled();
    const html = mockWrite.mock.calls[0][0];
    expect(html).toContain("🏠 Tower 1 - 402");
    expect(html).toContain("🏠 Tower 2 - 105");
    expect(html).toContain("🏠 A-201");
    expect(html).toContain("🏠 B-304");
  });

  it("exports umpire scorecards PDF with competitor flat details", async () => {
    const mockPrint = vi.fn();
    const mockWrite = vi.fn();
    const mockClose = vi.fn();
    const mockFocus = vi.fn();

    (globalThis as any).window.open = vi.fn().mockReturnValue({
      document: {
        write: mockWrite,
        close: mockClose,
      },
      focus: mockFocus,
      print: mockPrint,
    });

    const { exportUmpireScorecardsPDF } = await import("./sportsExportUtils");
    exportUmpireScorecardsPDF(mockMatches, "Badminton Open");

    expect((globalThis as any).window.open).toHaveBeenCalled();
    const html = mockWrite.mock.calls[0][0];
    expect(html).toContain("🏠 Flat: Tower 1 - 402");
    expect(html).toContain("🏠 Flat: Tower 2 - 105");
  });
});
