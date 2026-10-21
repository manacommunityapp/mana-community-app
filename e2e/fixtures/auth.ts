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

// ── Inject auth tokens into localStorage before page load ─────────────────────

export async function injectAuth(page: Page): Promise<void> {
  // Use the profile-complete user (with "View Sports Menu") so PermissionGuard
  // passes and the dashboard doesn't bounce to /login.
  await page.addInitScript(
    ({ token, user }) => {
      localStorage.setItem("mana_token", token);
      localStorage.setItem("mana_refresh_token", token + "_refresh");
      localStorage.setItem("mana_user", JSON.stringify(user));
      // Pre-accept cookie consent so the banner doesn't cover the UI
      localStorage.setItem("mana_privacy_preferences_fallback", JSON.stringify({ analytics: false, essential: true }));
      localStorage.setItem("mana_cookie_consent", JSON.stringify({ analytics: false, essential: true }));
    },
    { token: MOCK_TOKEN, user: MOCK_USER_WITH_PROFILE }
  );
}

// ── Mock common auth + profile API routes ────────────────────────────────────

export async function mockAuthRoutes(page: Page): Promise<void> {
  // Catch-all FIRST (lowest priority in Playwright's reverse-order matching) so
  // any un-mocked API call never reaches the real backend, which would return
  // 401 and log the test user out to the login page.
  await page.route("**/api/**", async (route: Route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, json: [] });
    } else {
      await route.fulfill({ status: 200, json: { success: true } });
    }
  });

  await page.route("**/api/auth/**", async (route: Route) => {
    await route.fulfill({ status: 200, json: { token: MOCK_TOKEN, user: MOCK_USER_WITH_PROFILE } });
  });

  await page.route("**/api/users/me", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_USER_WITH_PROFILE });
  });

  await page.route("**/api/users/profile", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_USER_WITH_PROFILE });
  });

  await page.route("**/api/community/modules**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: ["SPORTS", "EVENTS", "COMMUNITY_FEED", "ADMIN_HUB"],
    });
  });

  await page.route("**/api/menu-permissions**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_USER_WITH_PROFILE.permissions });
  });
}

// ── Mock open tournaments data (shared) ──────────────────────────────────────

export const MOCK_OPEN_TOURNAMENTS = [
  {
    id: 1,
    eventId: 1,
    name: "Cricket Premier League 2026",
    bannerImage: null,
    eventDateStart: "2026-10-01",
    eventDateEnd: "2026-10-15",
    registrationStatus: "REGISTRATION_OPEN",
    communityId: 1,
    communityName: "Le Community",
    event: { id: 1, name: "Cricket Open · Men's Singles" },
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

// ── Mock admin overview data (shared) ────────────────────────────────────────

const MOCK_ADMIN_OVERVIEW = {
  tournaments: [
    {
      id: 1,
      name: "Cricket Premier League 2026",
      registrationStatus: "REGISTRATION_OPEN",
      maxParticipants: 64,
      eventDateStart: "2026-10-01",
      eventDateEnd: "2026-10-15",
      events: [
        {
          id: 100,
          name: "Cricket Open · Men's Singles",
          eventDateStart: "2026-10-01",
          eventDateEnd: "2026-10-10",
          format: ["SINGLES"],
          tournamentType: "LEAGUE",
          gender: null,
          minAge: null,
          maxAge: null,
          maxParticipants: 32,
          registrationStatus: "REGISTRATION_OPEN",
          auctionStatus: null,
          sport: { name: "Cricket", icon: "🏏", iconUrl: null },
          tournamentId: 1,
          venue: { name: "Main Ground", city: "Mumbai" },
        },
      ],
    },
    {
      id: 2,
      name: "Badminton Cup 2026",
      registrationStatus: "REGISTRATION_OPEN",
      maxParticipants: 48,
      eventDateStart: "2026-10-05",
      eventDateEnd: "2026-10-12",
      events: [
        {
          id: 200,
          name: "Badminton Men (19+)",
          eventDateStart: "2026-10-05",
          eventDateEnd: "2026-10-12",
          format: ["SINGLES"],
          tournamentType: "LEAGUE",
          gender: null,
          minAge: null,
          maxAge: null,
          maxParticipants: 24,
          registrationStatus: "REGISTRATION_OPEN",
          auctionStatus: null,
          sport: { name: "Badminton", icon: "🏸", iconUrl: null },
          tournamentId: 2,
          venue: { name: "Indoor Hall", city: "Mumbai" },
        },
      ],
    },
  ],
  events: [
    {
      id: 100,
      name: "Cricket Open · Men's Singles",
      eventDateStart: "2026-10-01",
      eventDateEnd: "2026-10-10",
      format: ["SINGLES"],
      tournamentType: "LEAGUE",
      gender: null,
      minAge: null,
      maxAge: null,
      maxParticipants: 32,
      registrationStatus: "REGISTRATION_OPEN",
      auctionStatus: null,
      sport: { name: "Cricket", icon: "🏏", iconUrl: null },
      tournamentId: 1,
    },
    {
      id: 200,
      name: "Badminton Men (19+)",
      eventDateStart: "2026-10-05",
      eventDateEnd: "2026-10-12",
      format: ["SINGLES"],
      tournamentType: "LEAGUE",
      gender: null,
      minAge: null,
      maxAge: null,
      maxParticipants: 24,
      registrationStatus: "REGISTRATION_OPEN",
      auctionStatus: null,
      sport: { name: "Badminton", icon: "🏸", iconUrl: null },
      tournamentId: 2,
    },
  ],
  pendingRegistrations: [
    {
      id: 2,
      proposedTeamName: "Team Beta",
      playerName: "Suresh Patel",
      email: "suresh@test.com",
      status: "PENDING",
      registeredAt: "2026-09-28T10:00:00",
      matchType: "SINGLES",
      captainNomination: true,
      captainConfirmation: false,
      event: {
        id: 100,
        name: "Cricket Open · Men's Singles",
        sport: { name: "Cricket", icon: "🏏", iconUrl: null },
      },
      user: { fullName: "Suresh Patel", email: "suresh@test.com" },
    },
  ],
  confirmedRegistrations: [
    {
      id: 1,
      proposedTeamName: "Team Alpha",
      playerName: "Ravi Kumar",
      email: "ravi@test.com",
      status: "APPROVED",
      registeredAt: "2026-09-25T10:00:00",
      matchType: "SINGLES",
      captainNomination: false,
      captainConfirmation: true,
      event: {
        id: 100,
        name: "Cricket Open · Men's Singles",
        sport: { name: "Cricket", icon: "🏏", iconUrl: null },
      },
      user: { fullName: "Ravi Kumar", email: "ravi@test.com" },
    },
  ],
};

const MOCK_ADMIN_FORM_DATA = {
  sports: [
    { id: 1, name: "Cricket", icon: "🏏", iconUrl: null, formats: ["SINGLES", "TEAM"], communityId: 1 },
    { id: 2, name: "Badminton", icon: "🏸", iconUrl: null, formats: ["SINGLES", "DOUBLES"], communityId: 1 },
    { id: 3, name: "Football", icon: "⚽", iconUrl: null, formats: ["TEAM"], communityId: 1 },
  ],
  categories: [
    { id: 1, name: "Open", type: null, categoryType: null, description: null, minAge: 18, maxAge: 99, gender: null },
    { id: 2, name: "Youth (U-17)", type: null, categoryType: null, description: null, minAge: 14, maxAge: 17, gender: null },
    { id: 3, name: "Senior (50+)", type: null, categoryType: null, description: null, minAge: 50, maxAge: 99, gender: null },
  ],
  communities: [{ id: 1, name: "Le Community", type: "APARTMENT" }],
};

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

  // The actual endpoints used by sportsDashboardService
  await page.route("**/api/sports/dashboard/open-tournaments**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_OPEN_TOURNAMENTS });
  });

  await page.route("**/api/sports/dashboard/closed-tournaments**", async (route: Route) => {
    await route.fulfill({ status: 200, json: [] });
  });

  await page.route("**/api/sports/dashboard/my-registrations**", async (route: Route) => {
    await route.fulfill({ status: 200, json: [] });
  });

  await page.route("**/api/sports/dashboard/upcoming**", async (route: Route) => {
    await route.fulfill({ status: 200, json: [] });
  });

  await page.route("**/api/sports/dashboard/notifications**", async (route: Route) => {
    await route.fulfill({ status: 200, json: [] });
  });

  // Legacy / alternate endpoints kept for coverage
  await page.route("**/api/sports/tournaments**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: MOCK_OPEN_TOURNAMENTS,
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

const MOCK_SCHEDULE_EVENT_LIST = [
  {
    id: 100,
    name: "Cricket Open · Men's Singles",
    sportName: "Cricket",
    categoryName: "Open",
    venueName: "Main Ground",
    eventDateStart: "2026-10-01",
    eventDateEnd: "2026-10-10",
    registrationStatus: "REGISTRATION_OPEN",
    myRegistrationId: null,
    myRegistrationStatus: null,
    communityId: 1,
    tournamentId: 1,
    tournamentName: "Cricket Premier League 2026",
  },
  {
    id: 200,
    name: "Badminton Men (19+)",
    sportName: "Badminton",
    categoryName: "Open",
    venueName: "Indoor Hall",
    eventDateStart: "2026-10-05",
    eventDateEnd: "2026-10-12",
    registrationStatus: "REGISTRATION_OPEN",
    myRegistrationId: null,
    myRegistrationStatus: null,
    communityId: 1,
    tournamentId: 2,
    tournamentName: "Badminton Cup 2026",
  },
];

export async function mockSportsScheduleRoutes(page: Page): Promise<void> {
  // Endpoints used by sportsScheduleService
  await page.route("**/api/sports/schedule/events/open**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_SCHEDULE_EVENT_LIST });
  });

  await page.route("**/api/sports/schedule/events/open-all**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_SCHEDULE_EVENT_LIST });
  });

  await page.route("**/api/sports/schedule/events/mine**", async (route: Route) => {
    await route.fulfill({ status: 200, json: [] });
  });

  await page.route("**/api/sports/schedule/registrations/mine**", async (route: Route) => {
    await route.fulfill({ status: 200, json: [] });
  });

  // Endpoint used by sportsService.getScheduleStats()
  await page.route("**/api/sports/schedule/stats**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: { totalGames: 12, liveNow: 1, upcoming: 5, completed: 8 },
    });
  });

  // Tournament configs and bracket matches used by SportsSchedule
  await page.route(/\/api\/tournament\/configs(\?.*)?$/, async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        {
          id: 1,
          tournamentName: "Cricket Premier League 2026",
          eventName: "Cricket",
          eventId: 100,
          totalTeams: 8,
          status: "IN_PROGRESS",
          startDate: "2026-10-01",
          endDate: "2026-10-15",
        },
      ],
    });
  });

  await page.route(/\/api\/tournament\/\d+\/matches(\?.*)?$/, async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        {
          matchId: 1,
          roundName: "Final",
          matchNumber: 1,
          teamAName: "Cricket Premier League",
          teamBName: "Badminton Cup",
          scheduledAt: "2026-10-02T10:00:00",
          venueName: "Main Ground",
          status: "SCHEDULED",
        },
      ],
    });
  });

  // Legacy endpoints kept for broad coverage
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

  // sportsService endpoints used by MySports
  await page.route("**/api/tournaments/all**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_OPEN_TOURNAMENTS });
  });

  await page.route("**/api/sports/events/community**", async (route: Route) => {
    await route.fulfill({ status: 200, json: [] });
  });
}

// ── Mock sports admin API routes ──────────────────────────────────────────────

export async function mockSportsAdminRoutes(page: Page): Promise<void> {
  await mockSportsScheduleRoutes(page);

  // Tournaments for community (used by useSportsAdminState.refreshTournaments)
  await page.route("**/api/tournaments/community**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_OPEN_TOURNAMENTS });
  });

  // Admin overview and form-data (used by useSportsAdminState)
  await page.route("**/api/sports/admin/overview**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_ADMIN_OVERVIEW });
  });

  await page.route("**/api/sports/admin/form-data**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_ADMIN_FORM_DATA });
  });

  // playerCategoryService calls /api/player-categories (without /sports)
  await page.route("**/api/player-categories**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        { id: 1, name: "Open", ageMin: 18, ageMax: 99 },
        { id: 2, name: "Youth", ageMin: 14, ageMax: 17 },
        { id: 3, name: "Senior", ageMin: 50, ageMax: 99 },
      ],
    });
  });

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

  await page.route("**/api/sports/events/*/registrations**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        { id: 2, proposedTeamName: "Team Beta", teamName: "Team Beta", playerName: "Suresh Patel", status: "PENDING" },
      ],
    });
  });

  await page.route("**/api/sports/tournaments/*/registrations**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        { id: 2, proposedTeamName: "Team Beta", teamName: "Team Beta", playerName: "Suresh Patel", status: "PENDING" },
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

  // Auction: check and all-configs endpoints need specific responses so the page doesn't crash
  await page.route("**/api/auction/config/check**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: { configExists: false, configCount: 0, communityId: 1 },
    });
  });

  await page.route("**/api/auction/config/all**", async (route: Route) => {
    await route.fulfill({ status: 200, json: [] });
  });

  await page.route("**/api/auction/**", async (route: Route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, json: [] });
    } else {
      await route.fulfill({ status: 200, json: { success: true } });
    }
  });

  await page.route("**/api/auction/teams/nominated/**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        { id: 2, name: "Team Beta", teamName: "Team Beta", captain: "Suresh Patel", status: "PENDING", proposedTeamName: "Team Beta" },
      ],
    });
  });

  await page.route("**/api/community/**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: { id: 1, name: "Le Community", city: "Mumbai" },
    });
  });

  await page.route(/\/api\/users(\?.*)?$/, async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        { id: 1, name: "Admin User", email: "admin@test.com" },
        { id: 2, name: "Member User", email: "member@test.com" },
      ],
    });
  });

  // Tournament service used by analytics
  await page.route("**/api/tournaments/configs**", async (route: Route) => {
    await route.fulfill({ status: 200, json: [] });
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

// ── Mock analytics routes ─────────────────────────────────────────────────────
// The analytics service (analyticsService.ts) does NOT call /api/analytics/**
// Instead it aggregates data from: sportsDashboardService, sportsAdminService,
// tournamentService and sportsService. So we just need those endpoints mocked
// (which mockSportsDashboardRoutes + mockSportsAdminRoutes already provide).
// This function adds any remaining endpoints the analytics page may call.

export async function mockAnalyticsRoutes(page: Page): Promise<void> {
  // Admin overview – analyticsService calls sportsAdminService.getOverview()
  await page.route("**/api/sports/admin/overview**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_ADMIN_OVERVIEW });
  });

  // tournamentService.getConfigs() → /api/tournaments/configs
  await page.route("**/api/tournaments/configs**", async (route: Route) => {
    await route.fulfill({ status: 200, json: [] });
  });

  // sportsService.getScheduleStats() → /api/sports/schedule/stats
  await page.route("**/api/sports/schedule/stats**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: { totalGames: 12, liveNow: 1, upcoming: 5, completed: 8 },
    });
  });

  // Dashboard endpoints used by analyticsService
  await page.route("**/api/sports/dashboard/open-tournaments**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_OPEN_TOURNAMENTS });
  });

  await page.route("**/api/sports/dashboard/closed-tournaments**", async (route: Route) => {
    await route.fulfill({ status: 200, json: [] });
  });

  await page.route("**/api/sports/dashboard/my-registrations**", async (route: Route) => {
    await route.fulfill({ status: 200, json: [] });
  });

  await page.route("**/api/sports/dashboard/upcoming**", async (route: Route) => {
    await route.fulfill({ status: 200, json: [] });
  });
}

// ── Mock tournaments browse routes ────────────────────────────────────────────

export async function mockSportsTournamentsRoutes(page: Page): Promise<void> {
  await page.route("**/api/sports/dashboard/open-tournaments", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_OPEN_TOURNAMENTS });
  });

  await page.route("**/api/sports/dashboard/closed-tournaments", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        {
          id: 3,
          name: "Kabaddi Tournament 2025",
          bannerImage: null,
          eventDateStart: "2025-06-01",
          eventDateEnd: "2025-06-10",
          registrationStatus: "CLOSED",
          communityId: 1,
          communityName: "Le Community",
          events: [],
        },
      ],
    });
  });

  await page.route("**/api/sports/dashboard/my-registrations", async (route: Route) => {
    await route.fulfill({ status: 200, json: [] });
  });

  await page.route("**/api/sports/tournaments/**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: {
        id: 1,
        name: "Cricket Premier League 2026",
        sport: "Cricket",
        status: "ACTIVE",
        startDate: "2026-09-20",
        endDate: "2026-10-15",
        teamsCount: 8,
        registeredTeams: 6,
        events: [MOCK_REGISTRATION_EVENT],
      },
    });
  });

  await page.route("**/api/sports/meta**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        { id: 1, name: "Cricket", icon: "🏏" },
        { id: 2, name: "Badminton", icon: "🏸" },
        { id: 3, name: "Football", icon: "⚽" },
      ],
    });
  });
}

// ── Mock my-teams routes ──────────────────────────────────────────────────────

export async function mockSportsMyTeamsRoutes(page: Page): Promise<void> {
  await page.route("**/api/auction/configs**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        { id: 1, eventId: 1, eventName: "Cricket Premier League 2026", maxTeams: 8, budgetPerTeam: 1000, status: "ACTIVE" },
      ],
    });
  });

  await page.route("**/api/auction/*/teams/summary**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        {
          id: 1,
          name: "Team Alpha",
          ownerUser: { id: 1, name: "Admin User" },
          players: [{ userId: 1, name: "Admin User" }],
          playerCount: 6,
          budget: 1000,
          spent: 450,
        },
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
}

// ── Mock badges routes ────────────────────────────────────────────────────────

export const MOCK_BADGES = [
  { id: 1, name: "Cricket Champion", description: "Won tournament", icon: "🏆", rarity: "legendary", category: "achievement", isEarned: true, earnedAt: "2026-05-01" },
  { id: 2, name: "Hat-Trick Hero", description: "Scored 3 wickets in an over", icon: "🎯", rarity: "epic", category: "achievement", isEarned: true, earnedAt: "2026-06-15" },
  { id: 3, name: "First Match", description: "Played first match", icon: "🥇", rarity: "common", category: "participation", isEarned: false, earnedAt: null },
  { id: 4, name: "100 Runs", description: "Scored 100 runs in a season", icon: "💯", rarity: "rare", category: "milestone", isEarned: false, earnedAt: null },
];

export async function mockSportsBadgesRoutes(page: Page): Promise<void> {
  await page.route("**/api/sports/enhanced/my-profile", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: {
        userId: 1,
        name: "Admin User",
        badges: MOCK_BADGES.filter(b => b.isEarned),
        stats: { matches: 24, wins: 14, runs: 380, wickets: 12 },
      },
    });
  });

  await page.route("**/api/sports/enhanced/badges", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_BADGES });
  });

  await page.route("**/api/sports/enhanced/**", async (route: Route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, json: [] });
    } else {
      await route.fulfill({ status: 200, json: { success: true } });
    }
  });
}

// ── Mock leaderboard routes ───────────────────────────────────────────────────

export async function mockSportsLeaderboardRoutes(page: Page): Promise<void> {
  await page.route("**/api/sports/leaderboard**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        { rank: 1, playerId: 1, playerName: "Ravi Kumar", sport: "Cricket", points: 520, matches: 18, wins: 14, avgScore: 42.5 },
        { rank: 2, playerId: 2, playerName: "Suresh Patel", sport: "Cricket", points: 480, matches: 16, wins: 12, avgScore: 38.2 },
        { rank: 3, playerId: 3, playerName: "Anil Sharma", sport: "Cricket", points: 410, matches: 14, wins: 9, avgScore: 35.8 },
      ],
    });
  });

  await page.route("**/api/tournament/*/standings**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        { rank: 1, teamId: 1, teamName: "Team Alpha", played: 6, won: 5, lost: 1, points: 10 },
        { rank: 2, teamId: 2, teamName: "Team Beta", played: 6, won: 4, lost: 2, points: 8 },
      ],
    });
  });

  await page.route("**/api/cricket/leaderboard**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: {
        topBatsmen: [
          { playerId: 1, playerName: "Ravi Kumar", runs: 520, matches: 18, average: 42.5, strikeRate: 128.4 },
          { playerId: 2, playerName: "Suresh Patel", runs: 480, matches: 16, average: 38.2, strikeRate: 119.5 },
        ],
        topBowlers: [
          { playerId: 3, playerName: "Anil Sharma", wickets: 22, matches: 14, economy: 6.2, average: 18.5 },
        ],
        mvp: { playerId: 1, playerName: "Ravi Kumar", points: 920 },
      },
    });
  });
}

// ── Mock match page routes ────────────────────────────────────────────────────

export async function mockSportsMatchRoutes(page: Page): Promise<void> {
  await page.route("**/api/sports/matches/*/state**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: {
        matchId: 1,
        sportType: "CRICKET",
        teamAName: "Team Alpha",
        teamBName: "Team Beta",
        teamAId: 1,
        teamBId: 2,
        teamAColor: "#3B82F6",
        teamBColor: "#EF4444",
        status: "COMPLETED",
        innings: [],
        result: "Team Alpha won by 24 runs",
      },
    });
  });

  await page.route("**/api/sports/matches/**", async (route: Route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          id: 1,
          sport: "Cricket",
          team1: "Team Alpha",
          team2: "Team Beta",
          status: "COMPLETED",
          date: "2026-09-22",
          venue: "Ground A",
          result: "Team Alpha won by 24 runs",
        },
      });
    } else {
      await route.fulfill({ status: 200, json: { success: true } });
    }
  });

  await page.route("**/api/tournament/matches/**", async (route: Route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          id: 1,
          sportType: "CRICKET",
          teamAId: 1,
          teamAName: "Team Alpha",
          teamBId: 2,
          teamBName: "Team Beta",
          teamAColor: "#3B82F6",
          teamBColor: "#EF4444",
          status: "COMPLETED",
          result: { winnerId: 1, description: "Team Alpha won by 24 runs" },
        },
      });
    } else {
      await route.fulfill({ status: 200, json: { success: true } });
    }
  });

  await page.route("**/api/cricket/matches/**", async (route: Route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          id: 1,
          team1: { id: 1, name: "Team Alpha" },
          team2: { id: 2, name: "Team Beta" },
          status: "COMPLETED",
          tossWinner: "Team Alpha",
          result: "Team Alpha won by 24 runs",
          innings: [],
        },
      });
    } else {
      await route.fulfill({ status: 200, json: { success: true } });
    }
  });

  await page.route("**/api/sports/race/**", async (route: Route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          id: 1,
          sport: "Athletics",
          eventName: "100m Sprint",
          status: "COMPLETED",
          results: [
            { rank: 1, athleteName: "Raj Kumar", bibNumber: 5, finishTime: "10.82s" },
            { rank: 2, athleteName: "Priya Sharma", bibNumber: 12, finishTime: "11.05s" },
          ],
        },
      });
    } else {
      await route.fulfill({ status: 200, json: { success: true } });
    }
  });
}

// ── Mock team registration routes ─────────────────────────────────────────────

export const MOCK_SEARCH_USERS = [
  { id: 10, fullName: "Rahul Verma", name: "Rahul Verma", email: "rahul@test.com", flatNo: "B-201", gender: "Male" },
  { id: 11, fullName: "Sneha Patel", name: "Sneha Patel", email: "sneha@test.com", flatNo: "C-102", gender: "Female" },
  { id: 12, fullName: "Kiran Joshi", name: "Kiran Joshi", email: "kiran@test.com", flatNo: "D-301", gender: "Male" },
  { id: 13, fullName: "Meena Sharma", name: "Meena Sharma", email: "meena@test.com", flatNo: "A-101", gender: "Female" },
];

export async function mockSportsTeamRegistrationRoutes(page: Page): Promise<void> {
  await page.route("**/api/player-categories**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        { id: 1, name: "Open", ageMin: 18, ageMax: 99, gender: null },
        { id: 2, name: "Youth (U-17)", ageMin: 14, ageMax: 17, gender: null },
        { id: 3, name: "Senior (50+)", ageMin: 50, ageMax: 99, gender: null },
        { id: 4, name: "Women", ageMin: 18, ageMax: 99, gender: "FEMALE" },
      ],
    });
  });

  await page.route("**/api/users/search**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_SEARCH_USERS });
  });

  await page.route("**/api/sports/register-team", async (route: Route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        json: [
          { id: 900, eventId: 102, status: "PENDING", playerName: "Rahul Verma", matchType: "TEAM", captainNomination: true },
          { id: 901, eventId: 102, status: "PENDING", playerName: "Sneha Patel", matchType: "TEAM", captainNomination: false },
        ],
      });
    } else {
      await route.fulfill({ status: 200, json: { success: true } });
    }
  });

  await page.route("**/api/sports/events/**", async (route: Route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          id: 102,
          uuid: "evt-uuid-football-team",
          name: "Football · Team Event",
          sport: "Football",
          sportName: "Football",
          status: "REGISTRATION_OPEN",
          registrationStatus: "REGISTRATION_OPEN",
          eventDateStart: "2026-10-10",
          communityId: 1,
          teamSport: true,
        },
      });
    } else {
      await route.fulfill({ status: 200, json: { success: true } });
    }
  });
}

// ── Mock partner selection routes ────────────────────────────────────────────

export async function mockSportsPartnerRoutes(page: Page): Promise<void> {
  await page.route("**/api/users/search**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_SEARCH_USERS });
  });

  await page.route("**/api/family**", async (route: Route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, json: MOCK_FAMILY_MEMBERS });
    } else {
      await route.fulfill({ status: 200, json: { success: true } });
    }
  });
}

// ── Mock My Auctions routes ───────────────────────────────────────────────────

export const MOCK_MY_AUCTION_CONFIGS = [
  {
    id: 10,
    eventId: 100,
    seasonName: "Cricket Premier League 2026",
    sportName: "Cricket",
    status: "LIVE",
    budgetPerTeam: 1000,
    maxTeams: 8,
    communityId: 1,
  },
  {
    id: 11,
    eventId: 101,
    seasonName: "Badminton Summer Cup",
    sportName: "Badminton",
    status: "COMPLETED",
    budgetPerTeam: 500,
    maxTeams: 4,
    communityId: 1,
  },
];

export async function mockSportsMyAuctionsRoutes(page: Page): Promise<void> {
  await page.route("**/api/auction/configs**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_MY_AUCTION_CONFIGS });
  });

  await page.route("**/api/auction/*/teams/summary**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        {
          id: 1,
          teamName: "Team Alpha",
          name: "Team Alpha",
          emoji: "🏏",
          colorHex: "#3B82F6",
          ownerUser: { id: 1, name: "Test User", userId: 1 },
          spent: 450,
          budget: 1000,
          players: [
            { userId: 1, playerId: 1, name: "Test User" },
            { userId: 2, playerId: 2, name: "Ravi Kumar" },
          ],
        },
        {
          id: 2,
          teamName: "Team Beta",
          name: "Team Beta",
          emoji: "🏸",
          colorHex: "#EF4444",
          ownerUser: { id: 2, name: "Ravi Kumar", userId: 2 },
          spent: 200,
          budget: 1000,
          players: [{ userId: 2, playerId: 2, name: "Ravi Kumar" }],
        },
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
}

// ── Notification mock data & routes ────────────────────────────────────────────

export const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "MATCH",
    category: "Sports",
    title: "Your cricket match starts soon",
    body: "Cricket Premier League - Quarter Final in 30 minutes",
    icon: null,
    actionUrl: "/sports/schedule",
    referenceType: "MATCH",
    referenceId: 101,
    priority: "HIGH",
    read: false,
    readAt: null,
    metadata: null,
    createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  },
  {
    id: 2,
    type: "REGISTRATION",
    category: "Sports",
    title: "Registration open for Badminton Open",
    body: "Register now to participate in the summer tournament",
    icon: null,
    actionUrl: "/sports/tournaments",
    referenceType: "TOURNAMENT",
    referenceId: 2,
    priority: "NORMAL",
    read: false,
    readAt: null,
    metadata: null,
    createdAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
  },
  {
    id: 3,
    type: "RESULT",
    category: "Sports",
    title: "Match result posted",
    body: "Team Alpha won vs Team Beta",
    icon: null,
    actionUrl: null,
    referenceType: "MATCH",
    referenceId: 102,
    priority: "LOW",
    read: true,
    readAt: new Date(Date.now() - 60 * 60_000).toISOString(),
    metadata: null,
    createdAt: new Date(Date.now() - 3 * 60 * 60_000).toISOString(),
  },
];

export async function mockSportsNotificationRoutes(page: Page): Promise<void> {
  await page.route("**/api/notifications/count**", async (route: Route) => {
    await route.fulfill({ status: 200, json: { count: 2 } });
  });

  await page.route("**/api/notifications/summary**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: {
        content: MOCK_NOTIFICATIONS,
        totalElements: 3,
        totalPages: 1,
        number: 0,
        size: 20,
        first: true,
        last: true,
        empty: false,
      },
    });
  });

  await page.route("**/api/notifications/read-all**", async (route: Route) => {
    await route.fulfill({ status: 200, json: { updated: 2 } });
  });

  await page.route("**/api/notifications/read**", async (route: Route) => {
    await route.fulfill({ status: 200, json: { updated: 1 } });
  });

  await page.route("**/api/notifications/*/dismiss**", async (route: Route) => {
    await route.fulfill({ status: 200, json: { dismissed: 1 } });
  });

  await page.route("**/api/notifications/**", async (route: Route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, json: { count: 0 } });
    } else {
      await route.fulfill({ status: 200, json: { success: true } });
    }
  });
}

// ── Tournament full details mock (for TournamentDetailsModal) ─────────────────

export const MOCK_TOURNAMENT_FULL_DETAILS = {
  id: 1,
  name: "Cricket Premier League 2026",
  registrationStatus: "OPEN",
  eventDateStart: "2026-11-01T00:00:00Z",
  eventDateEnd: "2026-11-30T00:00:00Z",
  registrationDateStart: "2026-10-01T00:00:00Z",
  registrationDateEnd: "2026-10-31T00:00:00Z",
  venueName: "Main Ground",
  description: "Annual inter-community cricket tournament. All are welcome!",
  tournamentType: "LEAGUE",
  communityName: "MANA Community",
  bannerImage: null,
  rules: null,
  contactName: "Suresh Patel",
  contactNumber: "9876543210",
  contactEmail: "suresh@example.com",
  contactTitle: "Tournament Director",
  contacts: [],
  sponsors: [],
  sportsEvents: [
    {
      id: 10,
      name: "Cricket Open Men",
      categoryName: "Open Men",
      sportName: "Cricket",
      sport: { name: "Cricket" },
      teamSport: true,
      registrationStatus: "REGISTRATION_OPEN",
      registeredCount: 6,
      maxParticipants: 16,
      venueName: "Main Ground",
    },
    {
      id: 11,
      name: "Cricket Open Women",
      categoryName: "Open Women",
      sportName: "Cricket",
      sport: { name: "Cricket" },
      teamSport: true,
      registrationStatus: "REGISTRATION_OPEN",
      registeredCount: 4,
      maxParticipants: 8,
      venueName: "Main Ground",
    },
  ],
};

export async function mockTournamentDetailsRoutes(page: Page): Promise<void> {
  await page.route("**/api/sports/tournaments/1**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_TOURNAMENT_FULL_DETAILS });
  });

  await page.route("**/api/sports/tournaments/**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_TOURNAMENT_FULL_DETAILS });
  });
}

// ── Tournament scheduling & results mock data ─────────────────────────────────

export const MOCK_TOURNAMENT_CONFIGS = [
  {
    id: 1,
    tournamentName: "Cricket Premier League 2026",
    tournamentType: "LEAGUE",
    eventName: "Cricket Open 2026",
    eventId: 1,
    totalTeams: 4,
    startDate: "2026-11-01T00:00:00Z",
    endDate: "2026-11-30T00:00:00Z",
    status: "PUBLISHED",
    matchDurationMinutes: 120,
    breakBetweenMatchesMinutes: 30,
  },
  {
    id: 2,
    tournamentName: "Badminton Summer Cup",
    tournamentType: "KNOCKOUT",
    eventName: "Badminton Open 2026",
    eventId: 2,
    totalTeams: 8,
    startDate: "2026-12-01T00:00:00Z",
    endDate: "2026-12-15T00:00:00Z",
    status: "DRAFT",
    matchDurationMinutes: 60,
    breakBetweenMatchesMinutes: 15,
  },
];

export const MOCK_TOURNAMENT_MATCHES = [
  {
    id: 101,
    round: "LEAGUE_ROUND",
    matchNumber: 1,
    teamAName: "Team Alpha",
    teamBName: "Team Beta",
    teamAId: 1,
    teamBId: 2,
    scheduledAt: "2026-11-05T10:00:00Z",
    status: "COMPLETED",
    scoreTeamA: "180/4",
    scoreTeamB: "160/8",
    venueName: "Main Ground",
    courtName: "Court A",
    winnerTeamId: 1,
  },
  {
    id: 102,
    round: "LEAGUE_ROUND",
    matchNumber: 2,
    teamAName: "Team Gamma",
    teamBName: "Team Delta",
    teamAId: 3,
    teamBId: 4,
    scheduledAt: "2026-11-06T14:00:00Z",
    status: "SCHEDULED",
    scoreTeamA: null,
    scoreTeamB: null,
    venueName: "Main Ground",
    courtName: null,
    winnerTeamId: null,
  },
  {
    id: 103,
    round: "FINAL",
    matchNumber: 3,
    teamAName: "Team Alpha",
    teamBName: "Team Gamma",
    teamAId: 1,
    teamBId: 3,
    scheduledAt: "2026-11-30T16:00:00Z",
    status: "SCHEDULED",
    scoreTeamA: null,
    scoreTeamB: null,
    venueName: "Main Ground",
    courtName: null,
    winnerTeamId: null,
  },
];

export const MOCK_MATCH_DETAIL = {
  matchId: 101,
  roundName: "LEAGUE_ROUND",
  matchNumber: 1,
  scheduledAt: "2026-11-05T10:00:00Z",
  status: "COMPLETED",
  teamA: { id: 1, name: "Team Alpha", color: "#3B82F6" },
  teamB: { id: 2, name: "Team Beta", color: "#EF4444" },
  resultType: "NORMAL",
  scoreTeamA: "180/4",
  scoreTeamB: "160/8",
  winMargin: "20 runs",
  winnerName: "Team Alpha",
  matchSummary: "Team Alpha won by 20 runs in a dominant display.",
  venueName: "Main Ground",
  innings: [
    {
      inningsNumber: 1,
      battingTeamName: "Team Alpha",
      bowlingTeamName: "Team Beta",
      totalRuns: 180,
      totalWickets: 4,
      totalOvers: "20.0",
      extras: 8,
      runRate: "9.00",
      batting: [],
      bowling: [],
    },
    {
      inningsNumber: 2,
      battingTeamName: "Team Beta",
      bowlingTeamName: "Team Alpha",
      totalRuns: 160,
      totalWickets: 8,
      totalOvers: "20.0",
      extras: 12,
      runRate: "8.00",
      batting: [],
      bowling: [],
    },
  ],
};

export const MOCK_LIVE_MATCH_STATE = {
  matchId: 1,
  status: "LIVE",
  currentInnings: 1,
  teamAName: "Team Alpha",
  teamBName: "Team Beta",
  teamAColor: "#3B82F6",
  teamBColor: "#EF4444",
  teamAId: 1,
  teamBId: 2,
  batsmanOnStrikeId: 10,
  batsmanOnStrikeName: "Vikram Mehta",
  batsmanNonStrikeId: 11,
  batsmanNonStrikeName: "Ravi Kumar",
  currentBowlerId: 20,
  currentBowlerName: "Suresh Patel",
  target: null,
  recentBalls: ["0", "1", "4", "W", "2", "6"],
  innings1: {
    battingTeamId: 1,
    battingTeamName: "Team Alpha",
    totalRuns: 87,
    totalWickets: 2,
    totalOvers: "9.3",
    runRate: "9.16",
    batters: [
      { playerId: 10, playerName: "Vikram Mehta", runs: 42, balls: 30, fours: 4, sixes: 2, strikeRate: "140.00", isOut: false },
      { playerId: 11, playerName: "Ravi Kumar", runs: 28, balls: 22, fours: 3, sixes: 0, strikeRate: "127.27", isOut: false },
    ],
    bowlers: [
      { playerId: 20, playerName: "Suresh Patel", overs: "3.3", runs: 28, wickets: 1, maidens: 0, economy: "8.00", dots: 6 },
    ],
    thisOver: ["0", "1", "4", "W", "2"],
  },
  innings2: {
    battingTeamId: 2,
    battingTeamName: "Team Beta",
    totalRuns: 0,
    totalWickets: 0,
    totalOvers: "0.0",
    runRate: "0.00",
    batters: [],
    bowlers: [],
    thisOver: [],
  },
};

export const MOCK_GENERIC_MATCH_STATE = {
  matchId: 2,
  status: "LIVE",
  sportType: "BADMINTON",
  teamAId: 1,
  teamAName: "Team Alpha",
  teamAColor: "#3B82F6",
  teamBId: 2,
  teamBName: "Team Beta",
  teamBColor: "#EF4444",
  currentPeriod: 1,
  scoreTeamA: 15,
  scoreTeamB: 12,
  periodsWonA: 0,
  periodsWonB: 0,
  periods: [
    { periodNumber: 1, periodLabel: "Game 1", scoreTeamA: 15, scoreTeamB: 12 },
  ],
  recentEvents: [
    { id: 1, matchId: 2, teamId: 1, teamName: "Team Alpha", eventType: "POINT", periodNumber: 1, pointsAwarded: 1 },
  ],
  scoringConfig: {
    sportType: "BADMINTON",
    periodsCount: 3,
    pointsToWinPeriod: 21,
    mustWinByTwo: true,
    periodsToWin: 2,
    hasOvertime: false,
    hasPenaltyShootout: false,
  },
};

// ── Match Detail & Score Panel mock data ──────────────────────────────────────

export const MOCK_MATCH_DETAIL_CRICKET = {
  matchId: 1,
  roundName: "QUARTER_FINAL",
  matchNumber: 1,
  scheduledAt: "2026-11-05T10:00:00Z",
  status: "COMPLETED",
  teamA: { id: 1, name: "Team Alpha", color: "#3B82F6" },
  teamB: { id: 2, name: "Team Beta", color: "#EF4444" },
  resultType: "NORMAL",
  scoreTeamA: "180/4",
  scoreTeamB: "160/8",
  winMargin: "20 runs",
  winnerName: "Team Alpha",
  matchSummary: "Team Alpha won by 20 runs in a dominant display.",
  venueName: "Main Ground",
  innings: [
    {
      inningsNumber: 1,
      battingTeamName: "Team Alpha",
      bowlingTeamName: "Team Beta",
      totalRuns: 180,
      totalWickets: 4,
      totalOvers: "20.0",
      extras: 8,
      runRate: "9.00",
      batting: [
        { playerId: 10, playerName: "Vikram Mehta", runs: 72, balls: 48, fours: 8, sixes: 3, strikeRate: "150.00", howOut: "caught" },
        { playerId: 11, playerName: "Ravi Kumar", runs: 45, balls: 38, fours: 4, sixes: 1, strikeRate: "118.42", howOut: "not out" },
      ],
      bowling: [
        { playerId: 20, playerName: "Suresh Patel", overs: "4.0", runs: 32, wickets: 2, maidens: 0, economy: "8.00" },
      ],
    },
    {
      inningsNumber: 2,
      battingTeamName: "Team Beta",
      bowlingTeamName: "Team Alpha",
      totalRuns: 160,
      totalWickets: 8,
      totalOvers: "20.0",
      extras: 12,
      runRate: "8.00",
      batting: [],
      bowling: [],
    },
  ],
};

export const MOCK_GENERIC_MATCH_DETAIL = {
  matchId: 2,
  sportType: "BADMINTON",
  status: "COMPLETED",
  teamA: { id: 1, name: "Team Alpha", color: "#3B82F6" },
  teamB: { id: 2, name: "Team Beta", color: "#EF4444" },
  winnerName: "Team Alpha",
  winMargin: "2-1 games",
  matchSummary: "Team Alpha won 2-1 in a close match.",
  venueName: "Indoor Hall",
  periods: [
    { periodNumber: 1, periodLabel: "Game 1", scoreTeamA: 21, scoreTeamB: 18, winner: "Team Alpha" },
    { periodNumber: 2, periodLabel: "Game 2", scoreTeamA: 15, scoreTeamB: 21, winner: "Team Beta" },
    { periodNumber: 3, periodLabel: "Game 3", scoreTeamA: 21, scoreTeamB: 17, winner: "Team Alpha" },
  ],
};

export const MOCK_RACE_MATCH_STATE = {
  matchId: 3,
  status: "LIVE",
  sportType: "ATHLETICS",
  eventName: "100m Sprint",
  participants: [
    { id: 1, name: "Arjun Sharma", lane: 1, bib: "101", finishTime: null, position: null },
    { id: 2, name: "Priya Patel", lane: 2, bib: "102", finishTime: null, position: null },
    { id: 3, name: "Deepak Verma", lane: 3, bib: "103", finishTime: null, position: null },
  ],
};

export const MOCK_MATCH_PHOTOS = [
  { id: 1, matchId: 1, url: "/photos/match1-1.jpg", caption: "Opening ceremony", likeCount: 5, likedByMe: false, uploadedByName: "Admin User", uploadedAt: "2026-11-05T11:00:00Z" },
  { id: 2, matchId: 1, url: "/photos/match1-2.jpg", caption: "Vikram Mehta batting", likeCount: 12, likedByMe: true, uploadedByName: "Admin User", uploadedAt: "2026-11-05T12:00:00Z" },
];

export const MOCK_MATCH_RATINGS = {
  matchId: 1,
  totalRatings: 24,
  topPlayers: [
    { playerId: 10, playerName: "Vikram Mehta", teamName: "Team Alpha", reactionCounts: { BEST_PLAYER: 10, CLUTCH: 5, TEAM_PLAYER: 3, GOOD_SPORT: 4, CONSISTENT: 2 } },
    { playerId: 20, playerName: "Suresh Patel", teamName: "Team Beta", reactionCounts: { BEST_PLAYER: 2, CLUTCH: 3, TEAM_PLAYER: 6, GOOD_SPORT: 3, CONSISTENT: 1 } },
  ],
  myRatings: [],
};

export const MOCK_TEAMS_HUB = [
  {
    id: 1,
    name: "Team Alpha",
    emoji: "🏏",
    colorHex: "#3B82F6",
    captainName: "Ravi Kumar",
    budget: 1000,
    spent: 650,
    playerCount: 11,
    tournamentName: "Cricket Premier League 2026",
    players: [
      { id: 10, name: "Vikram Mehta", role: "Batsman", category: "Open", soldPrice: 150 },
      { id: 11, name: "Ravi Kumar", role: "All-Rounder", category: "Open", soldPrice: 120 },
      { id: 20, name: "Suresh Patel", role: "Bowler", category: "Open", soldPrice: 100 },
    ],
  },
  {
    id: 2,
    name: "Team Beta",
    emoji: "🏸",
    colorHex: "#EF4444",
    captainName: "Suresh Patel",
    budget: 1000,
    spent: 400,
    playerCount: 7,
    tournamentName: "Cricket Premier League 2026",
    players: [
      { id: 30, name: "Kiran Joshi", role: "Bowler", category: "Youth", soldPrice: 80 },
    ],
  },
];

export const MOCK_AUCTION_CONFIGS_ALL = [
  { id: 1, communityId: 1, eventId: 10, eventName: "Cricket Premier League 2026", status: "LIVE", maxTeams: 8, budgetPerTeam: 1000, teamsRegistered: 6 },
  { id: 2, communityId: 1, eventId: 11, eventName: "Badminton Summer Cup", status: "UPCOMING", maxTeams: 4, budgetPerTeam: 500, teamsRegistered: 2 },
  { id: 3, communityId: 1, eventId: 12, eventName: "Football League 2025", status: "COMPLETED", maxTeams: 6, budgetPerTeam: 800, teamsRegistered: 6 },
];

export const MOCK_SPONSORS = [
  { id: 1, name: "SportsMart", tier: "TITLE", logoUrl: null, websiteUrl: "https://sportsmart.test", description: "Official Equipment Partner" },
  { id: 2, name: "FitFuel", tier: "GOLD", logoUrl: null, websiteUrl: null, description: "Nutrition Partner" },
  { id: 3, name: "QuickKart", tier: "SILVER", logoUrl: null, websiteUrl: null, description: "" },
];

// ── Mock helpers for new spec files ──────────────────────────────────────────

export async function mockMatchDetailRoutes(page: Page): Promise<void> {
  // Match detail (cricket)
  await page.route("**/api/tournament/match/1/detail**", async (route) =>
    route.fulfill({ status: 200, json: MOCK_MATCH_DETAIL_CRICKET })
  );
  // Generic match state (triggers GenericMatchDetailView for non-cricket)
  await page.route("**/api/tournament/match/2/generic-state**", async (route) =>
    route.fulfill({ status: 200, json: MOCK_GENERIC_MATCH_DETAIL })
  );
  await page.route("**/api/tournament/match/2/detail**", async (route) =>
    route.fulfill({ status: 200, json: MOCK_GENERIC_MATCH_DETAIL })
  );
  // Generic match state for match 1 returns null/404 → triggers cricket path
  await page.route("**/api/tournament/match/1/generic-state**", async (route) =>
    route.fulfill({ status: 404, json: { error: "Not a generic match" } })
  );
  // Photos
  await page.route("**/api/sports/match/*/photos**", async (route) =>
    route.fulfill({ status: 200, json: MOCK_MATCH_PHOTOS })
  );
  await page.route("**/api/sports/enhanced/match/*/photos**", async (route) =>
    route.fulfill({ status: 200, json: MOCK_MATCH_PHOTOS })
  );
  // Ratings
  await page.route("**/api/sports/match/*/ratings**", async (route) =>
    route.fulfill({ status: 200, json: MOCK_MATCH_RATINGS })
  );
  await page.route("**/api/sports/enhanced/match/*/ratings**", async (route) =>
    route.fulfill({ status: 200, json: MOCK_MATCH_RATINGS })
  );
  // Catch-all for match APIs
  await page.route("**/api/tournament/match/**", async (route) =>
    route.fulfill({ status: 200, json: {} })
  );
}

export async function mockScoringPanelRoutes(page: Page): Promise<void> {
  // Live state for cricket scoring panel (match 1)
  await page.route("**/api/tournament/match/1/live-state**", async (route) =>
    route.fulfill({ status: 200, json: MOCK_LIVE_MATCH_STATE })
  );
  // Live state for generic scoring panel (match 2)
  await page.route("**/api/tournament/match/2/live-state**", async (route) =>
    route.fulfill({ status: 200, json: MOCK_GENERIC_MATCH_STATE })
  );
  // Generic match state for panel setup
  await page.route("**/api/tournament/match/2/generic-state**", async (route) =>
    route.fulfill({ status: 200, json: MOCK_GENERIC_MATCH_STATE })
  );
  // Race state
  await page.route("**/api/tournament/match/3/live-state**", async (route) =>
    route.fulfill({ status: 200, json: MOCK_RACE_MATCH_STATE })
  );
  // Ball post / undo
  await page.route("**/api/tournament/match/*/ball**", async (route) =>
    route.fulfill({ status: 200, json: { success: true, state: MOCK_LIVE_MATCH_STATE } })
  );
  await page.route("**/api/tournament/match/*/undo-ball**", async (route) =>
    route.fulfill({ status: 200, json: { success: true, state: MOCK_LIVE_MATCH_STATE } })
  );
  // Generic score point
  await page.route("**/api/tournament/match/*/score**", async (route) =>
    route.fulfill({ status: 200, json: { success: true, state: MOCK_GENERIC_MATCH_STATE } })
  );
  // Race result
  await page.route("**/api/tournament/match/*/race-result**", async (route) =>
    route.fulfill({ status: 200, json: { success: true } })
  );
  await page.route("**/api/tournament/match/**", async (route) =>
    route.fulfill({ status: 200, json: {} })
  );
}

export async function mockTeamsHubRoutes(page: Page): Promise<void> {
  await page.route("**/api/auction/teams**", async (route) =>
    route.fulfill({ status: 200, json: MOCK_TEAMS_HUB })
  );
  await page.route("**/api/auction/config**", async (route) =>
    route.fulfill({
      status: 200,
      json: { id: 1, eventName: "Cricket Premier League 2026", status: "LIVE", maxTeams: 8, budgetPerTeam: 1000 },
    })
  );
  await page.route("**/api/auction/*/teams**", async (route) =>
    route.fulfill({ status: 200, json: MOCK_TEAMS_HUB })
  );
  await page.route("**/api/auction/**", async (route) =>
    route.fulfill({ status: 200, json: [] })
  );
}

export async function mockAuctionEmbeddedRoutes(page: Page): Promise<void> {
  // All auction configs (for discovery tab)
  await page.route("**/api/auction/community/configs**", async (route) =>
    route.fulfill({ status: 200, json: MOCK_AUCTION_CONFIGS_ALL })
  );
  await page.route("**/api/auction/configs**", async (route) =>
    route.fulfill({ status: 200, json: MOCK_AUCTION_CONFIGS_ALL })
  );
  await page.route("**/api/auction/watchlist**", async (route) =>
    route.fulfill({ status: 200, json: [] })
  );
  // Player pool with skills for radar chart
  await page.route("**/api/auction/player-pool**", async (route) =>
    route.fulfill({
      status: 200,
      json: [
        { id: 1, name: "Vikram Mehta", role: "Batsman", category: "Open", basePrice: 100, soldTo: null, soldPrice: null,
          skills: { batting: 90, bowling: 30, fielding: 70, fitness: 85, experience: 75 } },
        { id: 2, name: "Suresh Patel", role: "Bowler", category: "Open", basePrice: 80, soldTo: "Team Alpha", soldPrice: 120,
          skills: { batting: 40, bowling: 88, fielding: 65, fitness: 80, experience: 70 } },
      ],
    })
  );
  await page.route("**/api/auction/config**", async (route) =>
    route.fulfill({
      status: 200,
      json: { id: 1, eventId: 1, eventName: "Cricket Premier League 2026", maxTeams: 8, budgetPerTeam: 1000, status: "LIVE" },
    })
  );
  await page.route("**/api/auction/teams**", async (route) =>
    route.fulfill({ status: 200, json: MOCK_TEAMS_HUB })
  );
  await page.route("**/api/auction/live**", async (route) =>
    route.fulfill({
      status: 200,
      json: {
        status: "LIVE",
        currentPlayer: { id: 1, name: "Vikram Mehta", role: "Batsman", category: "Open", basePrice: 100,
          skills: { batting: 90, bowling: 30, fielding: 70, fitness: 85, experience: 75 } },
        currentBid: { amount: 150, teamId: 1, teamName: "Team Alpha" },
      },
    })
  );
  await page.route("**/api/auction/results**", async (route) =>
    route.fulfill({ status: 200, json: { status: "LIVE", teamsFinalized: 0, playersAllocated: 2, playersUnsold: 0 } })
  );
  await page.route("**/api/cricheroes/**", async (route) =>
    route.fulfill({ status: 200, json: { profile: null } })
  );
  await page.route("**/api/auction/**", async (route) =>
    route.fulfill({ status: 200, json: {} })
  );
}

export async function mockAdminModalsRoutes(page: Page): Promise<void> {
  // Tournament configs for admin dropdowns
  await page.route("**/api/tournament/configs**", async (route) =>
    route.fulfill({ status: 200, json: MOCK_TOURNAMENT_CONFIGS })
  );
  // Players for AddPlayerModal
  await page.route("**/api/sports/players**", async (route) =>
    route.fulfill({
      status: 200,
      json: [
        { id: 1, name: "Vikram Mehta", role: "Batsman", category: "Open", communityMemberId: 101 },
        { id: 2, name: "Suresh Patel", role: "Bowler", category: "Open", communityMemberId: 102 },
      ],
    })
  );
  // Members for player search autocomplete
  await page.route("**/api/community/members**", async (route) =>
    route.fulfill({
      status: 200,
      json: [
        { id: 101, name: "Vikram Mehta", email: "vikram@test.com" },
        { id: 102, name: "Suresh Patel", email: "suresh@test.com" },
      ],
    })
  );
  // Venues
  await page.route("**/api/sports/venues**", async (route) =>
    route.fulfill({
      status: 200,
      json: [
        { id: 1, name: "Main Ground", capacity: 500 },
        { id: 2, name: "Indoor Hall", capacity: 200 },
      ],
    })
  );
  // Notification templates
  await page.route("**/api/notifications/templates**", async (route) =>
    route.fulfill({ status: 200, json: [] })
  );
  await page.route("**/api/notifications/**", async (route) =>
    route.fulfill({ status: 200, json: { count: 0 } })
  );
  await page.route("**/api/tournament/**", async (route) =>
    route.fulfill({ status: 200, json: [] })
  );
  await page.route("**/api/sports/**", async (route) =>
    route.fulfill({ status: 200, json: {} })
  );
}

export async function mockTournamentScheduleRoutes(page: Page): Promise<void> {
  await page.route("**/api/tournament/configs**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_TOURNAMENT_CONFIGS });
  });

  await page.route("**/api/tournament/1/matches**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_TOURNAMENT_MATCHES });
  });

  await page.route("**/api/tournament/*/matches**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_TOURNAMENT_MATCHES });
  });

  await page.route("**/api/tournament/**", async (route: Route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, json: [] });
    } else {
      await route.fulfill({ status: 200, json: { success: true } });
    }
  });
}

export async function mockTournamentResultsRoutes(page: Page): Promise<void> {
  await page.route("**/api/tournament/configs**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_TOURNAMENT_CONFIGS });
  });

  await page.route("**/api/tournament/*/matches**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_TOURNAMENT_MATCHES });
  });

  await page.route("**/api/tournament/match/result**", async (route: Route) => {
    await route.fulfill({ status: 200, json: { matchId: 102, status: "COMPLETED", scoreTeamA: "21-15", scoreTeamB: "18-21" } });
  });

  await page.route("**/api/tournament/match/*/detail**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_MATCH_DETAIL });
  });

  await page.route("**/api/tournament/**", async (route: Route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, json: [] });
    } else {
      await route.fulfill({ status: 200, json: { success: true } });
    }
  });
}

export async function mockLiveScoringRoutes(page: Page): Promise<void> {
  await page.route("**/api/tournament/match/*/live**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_LIVE_MATCH_STATE });
  });

  await page.route("**/api/sports/matches/*/state**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_LIVE_MATCH_STATE });
  });

  await page.route("**/api/tournament/match/*/ball**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: {
        id: 100,
        matchId: 1,
        inningsNumber: 1,
        overNumber: 9,
        ballNumber: 4,
        deliveryNumber: 58,
        runsScored: 1,
        isBoundary: false,
        isSix: false,
        extrasRuns: 0,
        isWicket: false,
        batsmanId: 10,
        batsmanName: "Vikram Mehta",
        bowlerId: 20,
        bowlerName: "Suresh Patel",
        totalRuns: 88,
        totalWickets: 2,
        totalOvers: "9.4",
      },
    });
  });

  await page.route("**/api/tournament/match/*/undo**", async (route: Route) => {
    await route.fulfill({ status: 200, json: { success: true } });
  });

  await page.route("**/api/tournament/match/generic/*/state**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_GENERIC_MATCH_STATE });
  });

  await page.route("**/api/tournament/match/generic/score**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: { id: 50, matchId: 2, teamId: 1, teamName: "Team Alpha", eventType: "POINT", periodNumber: 1, pointsAwarded: 1 },
    });
  });

  await page.route("**/api/tournament/match/generic/*/undo**", async (route: Route) => {
    await route.fulfill({ status: 200, json: { success: true } });
  });

  await page.route("**/api/tournament/match/generic/*/period/*/complete**", async (route: Route) => {
    await route.fulfill({ status: 200, json: { success: true } });
  });

  await page.route("**/api/tournament/match/race/*/results**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: [
        { id: 1, matchId: 3, playerId: 10, playerName: "Vikram Mehta", teamName: "Team Alpha", heatNumber: 1, laneNumber: 1, finishTimeMillis: 12500, formattedTime: "12.5s", raceStatus: "FINISHED", overallRank: 1, heatRank: 1 },
        { id: 2, matchId: 3, playerId: 11, playerName: "Ravi Kumar", teamName: "Team Beta", heatNumber: 1, laneNumber: 2, finishTimeMillis: 13100, formattedTime: "13.1s", raceStatus: "FINISHED", overallRank: 2, heatRank: 2 },
      ],
    });
  });

  await page.route("**/api/tournament/match/race/result**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      json: { id: 10, matchId: 3, playerId: 10, raceStatus: "FINISHED", finishTimeMillis: 12500, overallRank: 1 },
    });
  });

  await page.route("**/api/tournament/match/generic/scoring-config/**", async (route: Route) => {
    await route.fulfill({ status: 200, json: MOCK_GENERIC_MATCH_STATE.scoringConfig });
  });

  await page.route("**/api/tournament/**", async (route: Route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, json: { data: [] } });
    } else {
      await route.fulfill({ status: 200, json: { success: true } });
    }
  });
}
