import { type Page, type Route } from "@playwright/test";

// ── Mock user with full sports permissions ────────────────────────────────────

export const MOCK_TOKEN = "mock-jwt-token-sports-e2e";

export const MOCK_USER = {
  id: 1,
  userId: "1",
  name: "Admin User",
  email: "admin@manacommunity.test",
  phone: "9999999999",
  communityId: 1,
  communityName: "Le Community",
  roles: ["ADMIN"],
  permissions: [
    "View Sports Main",
    "Create/Edit Sports Main",
    "Delete Sports Main",
    "View Auction Configuration",
    "Create/Edit Auction Configuration",
    "Delete Auction Configuration",
    "View Live Auction",
    "View Teams Dashboard",
    "View Player Pool",
    "Create/Edit Player Pool",
    "Delete Player Pool",
    "View Event Registrations",
    "Create/Edit Event Registrations",
    "Delete Event Registrations",
    "View Auction Results",
    "Create/Edit Auction Results",
  ],
};

// ── Inject auth tokens into localStorage before page load ─────────────────────

export async function injectAuth(page: Page): Promise<void> {
  await page.addInitScript(
    ({ token, user }) => {
      localStorage.setItem("mana_token", token);
      localStorage.setItem("mana_refresh_token", token + "_refresh");
      localStorage.setItem("mana_user", JSON.stringify(user));
    },
    { token: MOCK_TOKEN, user: MOCK_USER }
  );
}

// ── Mock common auth + profile API routes ────────────────────────────────────

export async function mockAuthRoutes(page: Page): Promise<void> {
  await page.route("**/api/auth/**", async (route: Route) => {
    await route.fulfill({ status: 200, json: { token: MOCK_TOKEN, user: MOCK_USER } });
  });

  await page.route("**/api/users/me", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_USER });
  });

  await page.route("**/api/users/profile", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_USER });
  });

  await page.route("**/api/community/modules**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: ["SPORTS", "EVENTS", "COMMUNITY_FEED", "ADMIN_HUB"],
    });
  });

  await page.route("**/api/menu-permissions**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_USER.permissions });
  });
}

// ── Mock sports dashboard API routes ─────────────────────────────────────────

export async function mockSportsDashboardRoutes(page: Page): Promise<void> {
  await page.route("**/api/sports/dashboard/stats**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: {
        yourRegistrations: 3,
        liveEvents: 1,
        openRegistrations: 5,
        upcomingTournaments: 2,
      },
    });
  });

  await page.route("**/api/sports/tournaments**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        {
          id: 1,
          name: "Cricket Premier League 2026",
          sport: "Cricket",
          status: "ACTIVE",
          startDate: "2026-09-20",
          endDate: "2026-10-15",
          teamsCount: 8,
          registeredTeams: 6,
        },
        {
          id: 2,
          name: "Badminton Cup 2026",
          sport: "Badminton",
          status: "UPCOMING",
          startDate: "2026-10-01",
          endDate: "2026-10-10",
          teamsCount: 16,
          registeredTeams: 4,
        },
      ],
    });
  });

  await page.route("**/api/sports/event-registrations/open**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        { id: 10, sportName: "Cricket", eventName: "Cricket Premier League 2026", registrationDeadline: "2026-09-18" },
        { id: 11, sportName: "Badminton", eventName: "Badminton Cup 2026", registrationDeadline: "2026-09-25" },
      ],
    });
  });

  await page.route("**/api/auction/teams**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        { id: 1, name: "Team Alpha", captain: "Ravi Kumar", playerCount: 11, status: "APPROVED" },
        { id: 2, name: "Team Beta", captain: "Suresh Patel", playerCount: 9, status: "PENDING" },
      ],
    });
  });
}

// ── Mock sports schedule API routes ──────────────────────────────────────────

export async function mockSportsScheduleRoutes(page: Page): Promise<void> {
  await page.route("**/api/sports/events**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        {
          id: 1,
          title: "Cricket Premier League",
          sport: "CRICKET",
          status: "ACTIVE",
          startDate: "2026-09-20T09:00:00",
          endDate: "2026-10-15T18:00:00",
          venue: "Main Ground",
          registrationOpen: true,
        },
        {
          id: 2,
          title: "Badminton Open",
          sport: "BADMINTON",
          status: "UPCOMING",
          startDate: "2026-10-01T10:00:00",
          endDate: "2026-10-10T17:00:00",
          venue: "Indoor Hall",
          registrationOpen: true,
        },
      ],
    });
  });

  await page.route("**/api/sports/schedule**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: {
        matches: [
          { id: 1, team1: "Team Alpha", team2: "Team Beta", date: "2026-09-22", time: "10:00", venue: "Ground A", status: "SCHEDULED" },
          { id: 2, team1: "Team Gamma", team2: "Team Delta", date: "2026-09-22", time: "14:00", venue: "Ground B", status: "SCHEDULED" },
        ],
      },
    });
  });

  await page.route("**/api/venues**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        { id: 1, name: "Main Ground", type: "OUTDOOR", capacity: 500 },
        { id: 2, name: "Indoor Hall", type: "INDOOR", capacity: 200 },
      ],
    });
  });

  await page.route("**/api/sports/meta**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        { id: 1, name: "Cricket", icon: "🏏" },
        { id: 2, name: "Badminton", icon: "🏸" },
        { id: 3, name: "Football", icon: "⚽" },
        { id: 4, name: "Karate", icon: "🥋" },
      ],
    });
  });
}

// ── Mock sports admin API routes ──────────────────────────────────────────────

export async function mockSportsAdminRoutes(page: Page): Promise<void> {
  await mockSportsScheduleRoutes(page);

  await page.route("**/api/sports/player-categories**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        { id: 1, name: "Open", ageMin: 18, ageMax: 99 },
        { id: 2, name: "Youth", ageMin: 14, ageMax: 17 },
        { id: 3, name: "Senior", ageMin: 50, ageMax: 99 },
      ],
    });
  });

  await page.route("**/api/sports/registrations**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        { id: 1, playerName: "Ravi Kumar", sport: "Cricket", status: "APPROVED", teamName: "Team Alpha" },
        { id: 2, playerName: "Suresh Patel", sport: "Badminton", status: "PENDING", teamName: null },
      ],
    });
  });

  await page.route("**/api/sports/admin/pending-teams**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        { id: 2, name: "Team Beta", captain: "Suresh Patel", sport: "Cricket", playerCount: 9 },
      ],
    });
  });

  await page.route("**/api/auction/**", async (route: Route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, json: [] });
    } else {
      await route.fulfill({ status: 200, json: { success: true } });
    }
  });

  await page.route("**/api/community/**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: { id: 1, name: "Le Community", city: "Mumbai" },
    });
  });

  await page.route("**/api/users**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        { id: 1, name: "Admin User", email: "admin@test.com" },
        { id: 2, name: "Member User", email: "member@test.com" },
      ],
    });
  });
}

// ── Mock profile API routes ───────────────────────────────────────────────────

const MOCK_PROFILE = {
  userId: 1,
  fullName: "Arjun Sharma",
  email: "arjun.sharma@manacommunity.test",
  phone: "9876543210",
  dob: "1990-04-15",
  gender: "MALE",
  flatNo: "101",
  block: "A",
  role: "ADMIN",
  kycStatus: "VERIFIED",
  communityName: "Le Community",
  communityType: "APARTMENT",
  joinedAt: "2024-01-15T10:00:00",
  bio: "Passionate cricket player and community volunteer.",
  profilePicUrl: null,
  coverPicUrl: null,
  skills: ["Cricket", "Badminton", "Photography"],
  stats: { posts: 12, connections: 48, eventsAttended: 7, itemsSold: 3, jobsPosted: 2, sportsPlayed: 5 },
  achievements: [
    { id: 1, title: "Cricket Champion", description: "Won Annual Cricket Tournament 2025", icon: "🏆" },
  ],
};

export async function mockProfileRoutes(page: Page): Promise<void> {
  await page.route("**/api/profile/stats**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_PROFILE.stats });
  });

  await page.route("**/api/profile/activities**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        { id: 1, type: "post", text: "Posted in Community Feed: Reminder about AGM", time: "2 hours ago", iconType: "post", color: "indigo" },
        { id: 2, type: "marketplace", text: "Listed dining table on Marketplace for ₹8,500", time: "1 day ago", iconType: "marketplace", color: "emerald" },
        { id: 3, type: "event", text: "Registered for Annual Sports Day 2026", time: "2 days ago", iconType: "event", color: "yellow" },
      ],
    });
  });

  await page.route("**/api/profile**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_PROFILE });
  });

  await page.route("**/api/sessions**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        { id: 1, device: "Windows 11", browser: "Chrome", ipAddress: "103.246.41.22", isCurrent: true, lastActivityAt: null, loginAt: new Date().toISOString() },
        { id: 2, device: "iOS", browser: "Safari", ipAddress: "103.246.41.23", isCurrent: false, lastActivityAt: "2026-09-14T10:00:00", loginAt: "2026-09-14T08:00:00" },
      ],
    });
  });

  await page.route("**/api/security-audit**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: {
        content: [
          { id: 1, event: "Successful login via Web App", location: "Hyderabad, IN • Chrome / Windows 11", time: "Active now", iconType: "LOGIN", color: "text-emerald-500" },
          { id: 2, event: "KYC verification confirmed", location: "Verified by Admin", time: "Verified", iconType: "AWARD", color: "text-amber-500" },
        ],
        page: 0,
        totalPages: 1,
        totalElements: 2,
      },
    });
  });

  await page.route("**/api/family**", async (route: Route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        json: [
          { id: 1, name: "Priya Sharma", relation: "Spouse", gender: "Female", age: 30, dob: "1995-08-20", emergencyContact: true, isDevotee: true },
          { id: 2, name: "Rohan Sharma", relation: "Child", gender: "Male", age: 8, dob: "2018-03-10", emergencyContact: false, isDevotee: false },
        ],
      });
    } else {
      await route.fulfill({ status: 200, json: { success: true } });
    }
  });

  await page.route("**/api/auth/change-password**", async (route: Route) => {
    await route.fulfill({ status: 200, json: { message: "Password changed successfully!" } });
  });

  await page.route("**/api/files/**", async (route: Route) => {
    await route.fulfill({ status: 200, json: { url: "https://example.com/avatar.jpg" } });
  });
}

// ── Mock analytics routes ─────────────────────────────────────────────────────

// ── Mock sports registration API routes ──────────────────────────────────────

export const MOCK_REGISTRATION_EVENT = {
  id: 100,
  uuid: "evt-uuid-cricket-open",
  name: "Cricket Open · Men's Singles",
  sport: "Cricket",
  sportName: "Cricket",
  status: "REGISTRATION_OPEN",
  registrationStatus: "REGISTRATION_OPEN",
  eventDateStart: "2026-10-01",
  eventDateEnd: "2026-10-10",
  venue: "Main Ground",
  venueName: "Main Ground",
  maxParticipants: 32,
  registeredCount: 12,
  categoryName: "Open",
  teamSport: false,
  auctionStatus: null,
  tournament: {
    id: 1,
    name: "Cricket Premier League 2026",
    registrationStatus: "REGISTRATION_OPEN",
  },
};

export const MOCK_DOUBLES_EVENT = {
  id: 101,
  uuid: "evt-uuid-badminton-doubles",
  name: "Badminton · Mixed Doubles",
  sport: "Badminton",
  sportName: "Badminton",
  status: "REGISTRATION_OPEN",
  registrationStatus: "REGISTRATION_OPEN",
  eventDateStart: "2026-10-05",
  eventDateEnd: "2026-10-12",
  venue: "Indoor Hall",
  venueName: "Indoor Hall",
  maxParticipants: 16,
  registeredCount: 4,
  categoryName: "Open",
  teamSport: false,
  auctionStatus: null,
  tournament: {
    id: 2,
    name: "Badminton Cup 2026",
    registrationStatus: "REGISTRATION_OPEN",
  },
};

export const MOCK_TEAM_EVENT = {
  id: 102,
  uuid: "evt-uuid-football-team",
  name: "Football · Team Event",
  sport: "Football",
  sportName: "Football",
  status: "REGISTRATION_OPEN",
  registrationStatus: "REGISTRATION_OPEN",
  eventDateStart: "2026-10-10",
  eventDateEnd: "2026-10-20",
  venue: "Main Ground",
  venueName: "Main Ground",
  maxParticipants: 64,
  registeredCount: 20,
  categoryName: "Open",
  teamSport: true,
  auctionStatus: null,
  tournament: {
    id: 3,
    name: "Football League 2026",
    registrationStatus: "REGISTRATION_OPEN",
  },
};

export const MOCK_CATEGORIES = [
  { id: 1, name: "Open", ageMin: 18, ageMax: 60, gender: null },
  { id: 2, name: "Youth (U-17)", ageMin: 14, ageMax: 17, gender: null },
  { id: 3, name: "Senior (50+)", ageMin: 50, ageMax: 99, gender: null },
  { id: 4, name: "Women", ageMin: 18, ageMax: 60, gender: "FEMALE" },
];

export const MOCK_FAMILY_MEMBERS = [
  { id: 1, name: "Priya Sharma", relation: "Spouse", gender: "Female", age: 30, dob: "1995-08-20", dateOfBirth: "1995-08-20", emergencyContact: true, isDevotee: true },
  { id: 2, name: "Rohan Sharma", relation: "Child", gender: "Male", age: 8, dob: "2018-03-10", dateOfBirth: "2018-03-10", emergencyContact: false, isDevotee: false },
];

export const MOCK_BADMINTON_EVENT = {
  id: 200,
  uuid: "evt-uuid-badminton-men",
  name: "Badminton Men (19+)",
  sport: "Badminton",
  sportName: "Badminton",
  status: "REGISTRATION_OPEN",
  registrationStatus: "REGISTRATION_OPEN",
  eventDateStart: "2026-10-05",
  eventDateEnd: "2026-10-12",
  venue: "Indoor Hall",
  venueName: "Indoor Hall",
  maxParticipants: 24,
  registeredCount: 8,
  categoryName: "Open",
  teamSport: false,
  auctionStatus: null,
  tournament: {
    id: 2,
    name: "Badminton Cup 2026",
    registrationStatus: "REGISTRATION_OPEN",
  },
};

export const MOCK_OPEN_TOURNAMENTS = [
  {
    id: 1,
    name: "Cricket Premier League 2026",
    bannerImage: null,
    eventDateStart: "2026-10-01",
    eventDateEnd: "2026-10-15",
    registrationStatus: "REGISTRATION_OPEN",
    communityId: 1,
    communityName: "Le Community",
    events: [
      {
        id: 100,
        uuid: "evt-uuid-cricket-open",
        name: "Cricket Open · Men's Singles",
        sportName: "Cricket",
        categoryName: "Open",
        eventDateStart: "2026-10-01",
        eventDateEnd: "2026-10-10",
        venueName: "Main Ground",
        maxParticipants: 32,
        registeredCount: 12,
        registrationStatus: "REGISTRATION_OPEN",
        auctionStatus: null,
        teamSport: false,
        myRegistrationId: null,
        myRegistrationStatus: null,
      },
    ],
  },
  {
    id: 2,
    name: "Badminton Cup 2026",
    bannerImage: null,
    eventDateStart: "2026-10-05",
    eventDateEnd: "2026-10-12",
    registrationStatus: "REGISTRATION_OPEN",
    communityId: 1,
    communityName: "Le Community",
    events: [
      {
        id: 200,
        uuid: "evt-uuid-badminton-men",
        name: "Badminton Men (19+)",
        sportName: "Badminton",
        categoryName: "Open",
        eventDateStart: "2026-10-05",
        eventDateEnd: "2026-10-12",
        venueName: "Indoor Hall",
        maxParticipants: 24,
        registeredCount: 8,
        registrationStatus: "REGISTRATION_OPEN",
        auctionStatus: null,
        teamSport: false,
        myRegistrationId: null,
        myRegistrationStatus: null,
      },
    ],
  },
];

export async function mockSportsRegistrationRoutes(page: Page): Promise<void> {
  // Override menu permissions to include "View Sports Menu" needed by the PermissionGuard
  await page.route("**/api/menu-permissions**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_USER_WITH_PROFILE.permissions });
  });

  // Override /users/me so AuthContext boot picks up the extended permissions & profile
  await page.route("**/api/users/me", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_USER_WITH_PROFILE });
  });

  await page.route("**/api/sports/events/*/registration-details", async (route: Route) => {
    const url = route.request().url();
    const isDoubles = url.includes("badminton-doubles");
    const isTeam = url.includes("football-team");
    const event = isDoubles ? MOCK_DOUBLES_EVENT : isTeam ? MOCK_TEAM_EVENT : MOCK_REGISTRATION_EVENT;
    await route.fulfill({
      status: 200,
      json: {
        event,
        categories: MOCK_CATEGORIES,
        siblingCategories: [],
      },
    });
  });

  await page.route("**/api/sports/dashboard/open-tournaments", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_OPEN_TOURNAMENTS });
  });

  await page.route("**/api/sports/dashboard/closed-tournaments", async (route: Route) => {
    await route.fulfill({ status: 200, json: [] });
  });

  await page.route("**/api/sports/dashboard/my-registrations", async (route: Route) => {
    await route.fulfill({ status: 200, json: [] });
  });

  await page.route("**/api/sports/dashboard/upcoming", async (route: Route) => {
    await route.fulfill({ status: 200, json: [] });
  });

  await page.route("**/api/sports/dashboard/notifications", async (route: Route) => {
    await route.fulfill({ status: 200, json: [] });
  });

  await page.route("**/api/sports/register", async (route: Route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        json: {
          id: 999,
          eventId: body.eventId,
          status: "PENDING",
          playerName: MOCK_PROFILE.fullName,
          captainNomination: body.captainNomination ?? false,
          captainConfirmation: false,
          matchType: body.matchType || "SINGLES",
          ...body,
        },
      });
    } else {
      await route.fulfill({ status: 200, json: { success: true } });
    }
  });

  await page.route("**/api/sports/registrations/mine", async (route: Route) => {
    await route.fulfill({ status: 200, json: [] });
  });

  await page.route("**/api/family**", async (route: Route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, json: MOCK_FAMILY_MEMBERS });
    } else {
      await route.fulfill({ status: 200, json: { success: true } });
    }
  });

  await page.route("**/api/sports/community-members**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        { id: 10, name: "Rahul Verma", flatNo: "B-201", gender: "Male", dob: "1992-06-15" },
        { id: 11, name: "Sneha Patel", flatNo: "C-102", gender: "Female", dob: "1994-11-22" },
      ],
    });
  });
}

// ── Mock user with complete profile (gender + DOB for registration) ──────────

export const MOCK_USER_WITH_PROFILE = {
  ...MOCK_USER,
  fullName: "Arjun Sharma",
  name: "Arjun Sharma",
  gender: "MALE",
  dateOfBirth: "1990-04-15",
  dob: "1990-04-15",
  flatNo: "101",
  block: "A",
  flat_no: "101",
  unitNumber: "101",
  permissions: [
    ...MOCK_USER.permissions,
    "View Sports Menu",
    "Create/Edit Sports Menu",
    "Delete Sports Menu",
  ],
};

export async function injectAuthWithProfile(page: Page): Promise<void> {
  await page.addInitScript(
    ({ token, user }) => {
      localStorage.setItem("mana_token", token);
      localStorage.setItem("mana_refresh_token", token + "_refresh");
      localStorage.setItem("mana_user", JSON.stringify(user));
    },
    { token: MOCK_TOKEN, user: MOCK_USER_WITH_PROFILE }
  );
}

export async function mockAnalyticsRoutes(page: Page): Promise<void> {
  await page.route("**/api/analytics/**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: {
        totalEvents: 12,
        totalParticipants: 340,
        totalMatches: 58,
        sportsBreakdown: [
          { sport: "Cricket", count: 5, participants: 150 },
          { sport: "Badminton", count: 4, participants: 80 },
          { sport: "Football", count: 3, participants: 110 },
        ],
        monthlyTrend: [
          { month: "Jul", events: 3, participants: 90 },
          { month: "Aug", events: 5, participants: 140 },
          { month: "Sep", events: 4, participants: 110 },
        ],
      },
    });
  });
}
