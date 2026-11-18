import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  exportTournamentPaymentsToCSV,
  exportTournamentPaymentsToExcel,
  exportTournamentPaymentsToPDF,
  exportScheduleToCSV,
  exportScheduleToExcel,
  exportScheduleToPDF,
  isByeMatch,
  isTeamBasedSchedule,
  formatExportDate,
  formatExportTime,
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

  it("exports bracket draw to PDF with SVG connectors, auto-fit, and landscape styling", async () => {
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

    const { exportBracketToPDF } = await import("./sportsExportUtils");

    const bracketMatches = [
      {
        id: "m1",
        round: "SEMI_FINAL",
        roundIndex: 0,
        home: { id: "p1", name: "Player 1", flatNumber: "A-101" },
        away: { id: "p2", name: "Player 2", flatNumber: "A-102" },
        date: "2026-12-01",
        time: "10:00 AM",
      },
      {
        id: "m2",
        round: "SEMI_FINAL",
        roundIndex: 0,
        home: { id: "p3", name: "Player 3", flatNumber: "B-201" },
        away: { id: "p4", name: "Player 4", flatNumber: "B-202" },
        date: "2026-12-01",
        time: "10:30 AM",
      },
      {
        id: "m3",
        round: "FINAL",
        roundIndex: 1,
        home: { id: "m1-winner", name: "Semi-Final 1 (Winner)" },
        away: { id: "m2-winner", name: "Semi-Final 2 (Winner)" },
        date: "2026-12-01",
        time: "11:30 AM",
      },
    ];

    exportBracketToPDF(bracketMatches as any, "Test Tournament Draw", "Mana Community", "Badminton");

    expect((globalThis as any).window.open).toHaveBeenCalled();
    const html = mockWrite.mock.calls[0][0];

    // Verify document structure & landscape print page size
    expect(html).toContain("<title>Test Tournament Draw — Knockout Bracket</title>");
    expect(html).toContain("@page { size: landscape; margin: 6mm; }");

    // Verify SVG vector path connector layer is generated
    expect(html).toContain("<svg style=");
    expect(html).toContain("<path d=\"M");
    expect(html).toContain("stroke=\"#818cf8\"");

    // Verify auto-fit script
    expect(html).toContain("fitBracketToPage");

    // Verify matches and podium
    expect(html).toContain("Player 1");
    expect(html).toContain("Player 2");
    expect(html).toContain("Semi-Finals");
    expect(html).toContain("Final");
    expect(html).toContain("Champion / Winner");
  });

  describe("Schedule Exports - Date/Time formatting, BYE blanks, Serial Numbers, and Dynamic Headers", () => {
    it("formatExportDate and formatExportTime correctly parse ISO timestamps", () => {
      expect(formatExportDate("2026-11-15T18:00")).toBe("15-Nov-2026");
      expect(formatExportTime("", "2026-11-15T18:00")).toBe("06:00 PM");
      expect(formatExportTime("18:30", "2026-11-15")).toBe("06:30 PM");
      expect(formatExportTime("09:15 AM", "2026-11-15")).toBe("09:15 AM");
    });

    it("isByeMatch accurately detects BYE and AUTO_ADVANCED matches", () => {
      expect(isByeMatch({ status: "AUTO_ADVANCED" })).toBe(true);
      expect(isByeMatch({ team1: "BYE", team2: "Player 1" })).toBe(true);
      expect(isByeMatch({ home: { id: "bye", name: "BYE" }, away: { id: "p1", name: "Player 1" } })).toBe(true);
      expect(isByeMatch({ team1: "Player 1", team2: "Player 2", status: "SCHEDULED" })).toBe(false);
    });

    it("isTeamBasedSchedule detects Team sports vs Player individual sports", () => {
      // Cricket -> Teams
      expect(isTeamBasedSchedule([], "LEPL Cricket Championship", undefined)).toBe(true);
      // Football -> Teams
      expect(isTeamBasedSchedule([], "Society Football Cup", true)).toBe(true);
      // Table Tennis -> Players
      expect(isTeamBasedSchedule([], "LE Table Tennis Championship", undefined)).toBe(false);
      // Badminton singles -> Players
      expect(isTeamBasedSchedule([], "Badminton Singles Tournament", false)).toBe(false);
    });

    it("exportScheduleToCSV exports dynamic headers and blanks out BYE date/time/venue", () => {
      const schedule = [
        {
          matchNumber: 1,
          round: "Round of 16",
          team1: "Veera",
          team2: "BYE",
          status: "AUTO_ADVANCED",
          date: "2026-11-15T18:00",
          time: "06:00 PM",
          venue: "Clubhouse · Court 1",
        },
        {
          matchNumber: 5,
          round: "Round of 16",
          team1: "Shreyansh",
          team2: "Gautham",
          status: "SCHEDULED",
          date: "2026-11-15T18:30",
          time: "06:30 PM",
          venue: "Clubhouse · Court 2",
        },
      ];

      // Export Table Tennis (individual players)
      exportScheduleToCSV(schedule, "TT_Schedule", false);

      expect(createdDownloadFilename).toContain("TT_Schedule");
      // Dynamic header: Player 1 and Player 2, not Team 1
      expect(createdBlobContent).toContain("Player 1");
      expect(createdBlobContent).toContain("Player 2");
      expect(createdBlobContent).not.toContain("Team 1");

      // Match numbers must be sequential: 1 and 2 (not 1 and 5)
      expect(createdBlobContent).toContain('1,"League Match"');
      expect(createdBlobContent).toContain('2,"League Match"');

      // Veera BYE: date, time, and venue must be "—"
      expect(createdBlobContent).toContain('"—","—","—","Veera"');

      // Shreyansh vs Gautham: date and time formatted cleanly
      expect(createdBlobContent).toContain('"15-Nov-2026","06:30 PM","Clubhouse · Court 2"');
    });

    it("exportScheduleToPDF includes dynamic headers, count summary with byes, and blanks BYE match details", () => {
      const mockWrite = vi.fn();
      (globalThis as any).window.open = vi.fn().mockReturnValue({
        document: {
          write: mockWrite,
          close: vi.fn(),
        },
        focus: vi.fn(),
        print: vi.fn(),
      });

      const schedule = [
        {
          matchNumber: 1,
          round: "Round of 16",
          team1: "Veera",
          team2: "BYE",
          status: "AUTO_ADVANCED",
          date: "2026-11-15T18:00",
          time: "06:00 PM",
          venue: "Clubhouse",
        },
        {
          matchNumber: 5,
          round: "Round of 16",
          team1: "Shreyansh",
          team2: "Gautham",
          status: "SCHEDULED",
          date: "2026-11-15T18:30",
          time: "06:30 PM",
          venue: "Clubhouse · Court 2",
        },
      ];

      exportScheduleToPDF(schedule, "LE Table Tennis Championship", "Community Sports", false);

      expect((globalThis as any).window.open).toHaveBeenCalled();
      const html = mockWrite.mock.calls[0][0];

      // Dynamic competitor header
      expect(html).toContain("PLAYER 1");
      expect(html).toContain("PLAYER 2");

      // Subtitle summary with accurate playable count and byes (singular BYE for 1)
      expect(html).toContain("1 Matches (1 Auto-Advanced BYE)");

      // Serial match numbering
      expect(html).toContain("#1");
      expect(html).toContain("#2");

      // Veera auto-advanced BYE shows "—" for date/time/court
      expect(html).toContain("AUTO_ADVANCED");
      expect(html).toContain("Veera");

      // Regular match has formatted date & time
      expect(html).toContain("15-Nov-2026");
      expect(html).toContain("06:30 PM");
    });
  });
});
