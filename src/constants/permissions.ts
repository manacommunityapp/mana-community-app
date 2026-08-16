/**
 * Permission Constants — Single source of truth for the frontend.
 * Must stay in sync with Java: PermissionConstants.java
 *
 * @see com.manacommunity.api.constants.PermissionConstants
 */

// ──── COMMUNITY FEED ────
export const VIEW_FEED       = "View Feed";
export const CREATE_POST     = "Create Post";
export const DELETE_POST     = "Delete Post";
export const COMMENT_ON_POST = "Comment on Post";

// ──── SPORTS — GRANULAR PERMISSIONS ────
// Main
export const VIEW_SPORTS_MAIN          = "View Sports Main";
export const CREATE_EDIT_SPORTS_MAIN   = "Create/Edit Sports Main";
export const DELETE_SPORTS_MAIN        = "Delete Sports Main";
// Sports Menu
export const VIEW_SPORTS_MENU          = "View Sports Menu";
export const CREATE_EDIT_SPORTS_MENU   = "Create/Edit Sports Menu";
export const DELETE_SPORTS_MENU        = "Delete Sports Menu";
// Auction Configuration
export const VIEW_AUCTION_CONFIG       = "View Auction Configuration";
export const CREATE_EDIT_AUCTION_CONFIG = "Create/Edit Auction Configuration";
export const DELETE_AUCTION_CONFIG     = "Delete Auction Configuration";
// Live Auction
export const VIEW_LIVE_AUCTION         = "View Live Auction";
export const CREATE_EDIT_LIVE_AUCTION   = "Create/Edit Live Auction";
export const DELETE_LIVE_AUCTION        = "Delete Live Auction";
// Teams Dashboard
export const VIEW_TEAMS_DASHBOARD      = "View Teams Dashboard";
export const CREATE_EDIT_TEAMS_DASHBOARD = "Create/Edit Teams Dashboard";
export const DELETE_TEAMS_DASHBOARD    = "Delete Teams Dashboard";
// Player Pool
export const VIEW_PLAYER_POOL          = "View Player Pool";
export const CREATE_EDIT_PLAYER_POOL   = "Create/Edit Player Pool";
export const DELETE_PLAYER_POOL        = "Delete Player Pool";
// Event Registrations
export const VIEW_EVENT_REGISTRATIONS  = "View Event Registrations";
export const CREATE_EDIT_EVENT_REGISTRATIONS = "Create/Edit Event Registrations";
export const DELETE_EVENT_REGISTRATIONS = "Delete Event Registrations";
// Auction Results
export const VIEW_AUCTION_RESULTS      = "View Auction Results";
export const CREATE_EDIT_AUCTION_RESULTS = "Create/Edit Auction Results";
export const DELETE_AUCTION_RESULTS    = "Delete Auction Results";

/** @deprecated Use VIEW_SPORTS_MENU instead — kept for backward compatibility */
export const VIEW_SPORTS = VIEW_SPORTS_MENU;

/**
 * Sports Permission Matrix — structured for the table-based role editor.
 * Each row maps a feature to its View / Create-Edit / Delete permission keys.
 * `isChild` marks sub-items that should render indented (e.g. under Auction).
 */
export interface SportsPermissionRow {
  label: string;
  view?: string;
  createEdit?: string;
  delete?: string;
  isChild?: boolean;
  /** If true, this row is a group toggle header (no own permission — toggles children) */
  isGroupHeader?: boolean;
  /** Indices of child rows this group header toggles */
  childIndices?: number[];
}

export const SPORTS_PERMISSION_MATRIX: SportsPermissionRow[] = [
  { label: "Main",                  view: VIEW_SPORTS_MAIN,          createEdit: CREATE_EDIT_SPORTS_MAIN,          delete: DELETE_SPORTS_MAIN },
  { label: "Sports Menu",           view: VIEW_SPORTS_MENU,          createEdit: CREATE_EDIT_SPORTS_MENU,          delete: DELETE_SPORTS_MENU },
  { label: "Auction",               isGroupHeader: true, childIndices: [3, 4, 5, 6, 7, 8] },
  { label: "Auction Configuration", view: VIEW_AUCTION_CONFIG,       createEdit: CREATE_EDIT_AUCTION_CONFIG,        delete: DELETE_AUCTION_CONFIG, isChild: true },
  { label: "Live Auction",          view: VIEW_LIVE_AUCTION,         createEdit: CREATE_EDIT_LIVE_AUCTION,          delete: DELETE_LIVE_AUCTION, isChild: true },
  { label: "Teams Dashboard",       view: VIEW_TEAMS_DASHBOARD,      createEdit: CREATE_EDIT_TEAMS_DASHBOARD,       delete: DELETE_TEAMS_DASHBOARD, isChild: true },
  { label: "Player Pool",           view: VIEW_PLAYER_POOL,          createEdit: CREATE_EDIT_PLAYER_POOL,           delete: DELETE_PLAYER_POOL, isChild: true },
  { label: "Event Registrations",   view: VIEW_EVENT_REGISTRATIONS,  createEdit: CREATE_EDIT_EVENT_REGISTRATIONS,   delete: DELETE_EVENT_REGISTRATIONS, isChild: true },
  { label: "Auction Results",       view: VIEW_AUCTION_RESULTS,      createEdit: CREATE_EDIT_AUCTION_RESULTS,       delete: DELETE_AUCTION_RESULTS, isChild: true },
];

// ──── MARKETPLACE ────
export const VIEW_MARKETPLACE   = "View Marketplace";
export const CREATE_LISTING     = "Create Listing";
export const DELETE_LISTING     = "Delete Listing";
export const MANAGE_MARKETPLACE = "Manage Marketplace";

// ──── VISITOR / GATE PASS ────
export const VIEW_VISITORS       = "View Visitors";
export const CREATE_VISITOR_PASS = "Create Visitor Pass";
export const MANAGE_GATE         = "Manage Gate";

// ──── AMENITY BOOKING ────
export const VIEW_AMENITIES   = "View Amenities";
export const BOOK_AMENITY     = "Book Amenity";
export const MANAGE_AMENITIES = "Manage Amenities";

// ──── NOTICE BOARD ────
export const VIEW_NOTICES  = "View Notices";
export const CREATE_NOTICE = "Create Notice";
export const DELETE_NOTICE = "Delete Notice";

// ──── HELPDESK / COMPLAINTS ────
export const VIEW_TICKETS   = "View Tickets";
export const CREATE_TICKET  = "Create Ticket";
export const MANAGE_TICKETS = "Manage Tickets";

// ──── POLLING / VOTING ────
export const VIEW_POLLS  = "View Polls";
export const CREATE_POLL = "Create Poll";
export const VOTE_POLL   = "Vote Poll";

// ──── JOBS & REFERRALS ────
export const VIEW_JOBS  = "View Jobs";
export const CREATE_JOB = "Create Job";
export const APPLY_JOB  = "Apply Job";

// ──── EVENTS — GRANULAR PERMISSIONS ────
// Core
export const VIEW_EVENTS    = "View Events";
export const CREATE_EVENT   = "Create Event";
export const REGISTER_EVENT = "Register Event";
// Dashboard
export const VIEW_EVENT_DASHBOARD        = "View Event Dashboard";
export const MANAGE_EVENT_DASHBOARD      = "Manage Event Dashboard";
export const VIEW_EVENT_ADMIN_DASHBOARD  = "View Event Admin Dashboard";
export const MANAGE_EVENT_ADMIN_DASHBOARD= "Manage Event Admin Dashboard";
export const VIEW_EVENT_USER_DASHBOARD   = "View Event User Dashboard";
export const MANAGE_EVENT_USER_DASHBOARD = "Manage Event User Dashboard";
// Events & Schedule
export const VIEW_EVENT_SCHEDULE         = "View Event Schedule";
export const CREATE_EDIT_EVENT_SCHEDULE  = "Create/Edit Event Schedule";
export const DELETE_EVENT_SCHEDULE       = "Delete Event Schedule";
// Registration
export const VIEW_EVENT_REGISTRATION     = "View Event Registration";
export const MANAGE_EVENT_REGISTRATION   = "Manage Event Registration";
export const EXPORT_EVENT_REGISTRATION   = "Export Event Registration";
// People / Volunteers
export const VIEW_EVENT_PEOPLE           = "View Event People";
export const MANAGE_EVENT_PEOPLE         = "Manage Event People";
// Fundraising / Finance
export const VIEW_EVENT_FUNDRAISING      = "View Event Fundraising";
export const MANAGE_EVENT_FUNDRAISING    = "Manage Event Fundraising";
// Operations
export const VIEW_EVENT_OPERATIONS       = "View Event Operations";
export const MANAGE_EVENT_OPERATIONS     = "Manage Event Operations";
// Media & Reports
export const VIEW_EVENT_MEDIA            = "View Event Media";
export const MANAGE_EVENT_MEDIA          = "Manage Event Media";
// Gallery (subset of Media — view-only gallery without reports access)
export const VIEW_EVENT_GALLERY          = "View Event Gallery";
// Reports
export const VIEW_EVENT_REPORTS          = "View Event Reports";
// Notifications
export const SEND_EVENT_NOTIFICATIONS    = "Send Event Notifications";
export const MANAGE_EVENT_NOTIFICATIONS  = "Manage Event Notifications";
// Forms — Food & Cultural, Pooja, Donation, Auctions
export const VIEW_EVENT_FORMS            = "View Event Forms";
export const MANAGE_EVENT_FORMS          = "Manage Event Forms";
export const DELETE_EVENT_FORMS          = "Delete Event Forms";

/**
 * Events Permission Matrix — structured for the table-based role editor.
 * Each row maps a sub-menu to its View / Create-Edit / Delete permission keys.
 */
export interface EventPermissionRow {
  label: string;
  view?: string;
  createEdit?: string;
  delete?: string;
  isChild?: boolean;
  isGroupHeader?: boolean;
  childIndices?: number[];
}

export const EVENT_PERMISSION_MATRIX: EventPermissionRow[] = [
  { label: "Events Module",        isGroupHeader: true, childIndices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  { label: "Admin Dashboard",      view: VIEW_EVENT_ADMIN_DASHBOARD, createEdit: MANAGE_EVENT_ADMIN_DASHBOARD, isChild: true },
  { label: "User Dashboard",       view: VIEW_EVENT_USER_DASHBOARD,  createEdit: MANAGE_EVENT_USER_DASHBOARD,  isChild: true },
  { label: "Events & Schedule",    view: VIEW_EVENT_SCHEDULE,       createEdit: CREATE_EDIT_EVENT_SCHEDULE,  delete: DELETE_EVENT_SCHEDULE,     isChild: true },
  { label: "Registration",         view: VIEW_EVENT_REGISTRATION,   createEdit: MANAGE_EVENT_REGISTRATION,   delete: EXPORT_EVENT_REGISTRATION, isChild: true },
  { label: "People & Volunteers",  view: VIEW_EVENT_PEOPLE,         createEdit: MANAGE_EVENT_PEOPLE,                                           isChild: true },
  { label: "Fundraising",          view: VIEW_EVENT_FUNDRAISING,    createEdit: MANAGE_EVENT_FUNDRAISING,                                      isChild: true },
  { label: "Operations",           view: VIEW_EVENT_OPERATIONS,     createEdit: MANAGE_EVENT_OPERATIONS,                                       isChild: true },
  { label: "Gallery",              view: VIEW_EVENT_GALLERY,        createEdit: MANAGE_EVENT_MEDIA,                                            isChild: true },
  { label: "Reports",              view: VIEW_EVENT_REPORTS,        createEdit: MANAGE_EVENT_MEDIA,                                            isChild: true },
  { label: "Notifications",        view: SEND_EVENT_NOTIFICATIONS,  createEdit: MANAGE_EVENT_NOTIFICATIONS,                                    isChild: true },
  { label: "Forms (Categories)",   view: VIEW_EVENT_FORMS,          createEdit: MANAGE_EVENT_FORMS,          delete: DELETE_EVENT_FORMS,        isChild: true },
];

/**
 * Suggested default event permissions per role.
 * Includes 8 system roles and 6 event-specific custom roles.
 */
export const EVENT_ROLE_DEFAULTS: Record<string, string[]> = {
  // ── System roles ──────────────────────────────────────────────────────────
  ADMIN: [
    VIEW_EVENTS, CREATE_EVENT, REGISTER_EVENT,
    VIEW_EVENT_DASHBOARD, MANAGE_EVENT_DASHBOARD,
    VIEW_EVENT_ADMIN_DASHBOARD, MANAGE_EVENT_ADMIN_DASHBOARD,
    VIEW_EVENT_USER_DASHBOARD, MANAGE_EVENT_USER_DASHBOARD,
    VIEW_EVENT_SCHEDULE, CREATE_EDIT_EVENT_SCHEDULE, DELETE_EVENT_SCHEDULE,
    VIEW_EVENT_REGISTRATION, MANAGE_EVENT_REGISTRATION, EXPORT_EVENT_REGISTRATION,
    VIEW_EVENT_PEOPLE, MANAGE_EVENT_PEOPLE,
    VIEW_EVENT_FUNDRAISING, MANAGE_EVENT_FUNDRAISING,
    VIEW_EVENT_OPERATIONS, MANAGE_EVENT_OPERATIONS,
    VIEW_EVENT_MEDIA, MANAGE_EVENT_MEDIA, VIEW_EVENT_GALLERY, VIEW_EVENT_REPORTS,
    SEND_EVENT_NOTIFICATIONS, MANAGE_EVENT_NOTIFICATIONS,
    VIEW_EVENT_FORMS, MANAGE_EVENT_FORMS, DELETE_EVENT_FORMS,
  ],
  COMMUNITY_ADMIN: [
    VIEW_EVENTS, CREATE_EVENT, REGISTER_EVENT,
    VIEW_EVENT_DASHBOARD, MANAGE_EVENT_DASHBOARD,
    VIEW_EVENT_ADMIN_DASHBOARD, MANAGE_EVENT_ADMIN_DASHBOARD,
    VIEW_EVENT_USER_DASHBOARD, MANAGE_EVENT_USER_DASHBOARD,
    VIEW_EVENT_SCHEDULE, CREATE_EDIT_EVENT_SCHEDULE, DELETE_EVENT_SCHEDULE,
    VIEW_EVENT_REGISTRATION, MANAGE_EVENT_REGISTRATION, EXPORT_EVENT_REGISTRATION,
    VIEW_EVENT_PEOPLE, MANAGE_EVENT_PEOPLE,
    VIEW_EVENT_FUNDRAISING, MANAGE_EVENT_FUNDRAISING,
    VIEW_EVENT_OPERATIONS, MANAGE_EVENT_OPERATIONS,
    VIEW_EVENT_MEDIA, MANAGE_EVENT_MEDIA, VIEW_EVENT_GALLERY, VIEW_EVENT_REPORTS,
    SEND_EVENT_NOTIFICATIONS, MANAGE_EVENT_NOTIFICATIONS,
    VIEW_EVENT_FORMS, MANAGE_EVENT_FORMS, DELETE_EVENT_FORMS,
  ],
  EVENT_ADMIN: [
    VIEW_EVENTS, CREATE_EVENT, REGISTER_EVENT,
    VIEW_EVENT_DASHBOARD, MANAGE_EVENT_DASHBOARD,
    VIEW_EVENT_ADMIN_DASHBOARD, MANAGE_EVENT_ADMIN_DASHBOARD,
    VIEW_EVENT_USER_DASHBOARD, MANAGE_EVENT_USER_DASHBOARD,
    VIEW_EVENT_SCHEDULE, CREATE_EDIT_EVENT_SCHEDULE, DELETE_EVENT_SCHEDULE,
    VIEW_EVENT_REGISTRATION, MANAGE_EVENT_REGISTRATION, EXPORT_EVENT_REGISTRATION,
    VIEW_EVENT_PEOPLE, MANAGE_EVENT_PEOPLE,
    VIEW_EVENT_FUNDRAISING, MANAGE_EVENT_FUNDRAISING,
    VIEW_EVENT_OPERATIONS, MANAGE_EVENT_OPERATIONS,
    VIEW_EVENT_MEDIA, MANAGE_EVENT_MEDIA, VIEW_EVENT_GALLERY, VIEW_EVENT_REPORTS,
    SEND_EVENT_NOTIFICATIONS, MANAGE_EVENT_NOTIFICATIONS,
    VIEW_EVENT_FORMS, MANAGE_EVENT_FORMS, DELETE_EVENT_FORMS,
  ],
  SPORTS_ADMIN: [
    VIEW_EVENTS, REGISTER_EVENT,
    VIEW_EVENT_DASHBOARD,
    VIEW_EVENT_ADMIN_DASHBOARD,
    VIEW_EVENT_USER_DASHBOARD,
    VIEW_EVENT_SCHEDULE,
    VIEW_EVENT_MEDIA, VIEW_EVENT_GALLERY, VIEW_EVENT_REPORTS,
  ],
  MEMBER: [
    VIEW_EVENTS, REGISTER_EVENT,
    VIEW_EVENT_DASHBOARD,
    VIEW_EVENT_USER_DASHBOARD, MANAGE_EVENT_USER_DASHBOARD,
    VIEW_EVENT_SCHEDULE,
    VIEW_EVENT_MEDIA, VIEW_EVENT_GALLERY, VIEW_EVENT_REPORTS,
  ],
  VENDOR: [
    VIEW_EVENTS, REGISTER_EVENT,
    VIEW_EVENT_DASHBOARD,
    VIEW_EVENT_USER_DASHBOARD,
    VIEW_EVENT_SCHEDULE,
    VIEW_EVENT_MEDIA, VIEW_EVENT_GALLERY, VIEW_EVENT_REPORTS,
  ],
  CASHIER: [
    VIEW_EVENTS, REGISTER_EVENT,
    VIEW_EVENT_DASHBOARD,
    VIEW_EVENT_USER_DASHBOARD,
    VIEW_EVENT_SCHEDULE,
    VIEW_EVENT_MEDIA, VIEW_EVENT_GALLERY, VIEW_EVENT_REPORTS,
  ],
  STAFF: [
    VIEW_EVENTS, REGISTER_EVENT,
    VIEW_EVENT_DASHBOARD,
    VIEW_EVENT_USER_DASHBOARD,
    VIEW_EVENT_SCHEDULE,
    VIEW_EVENT_MEDIA, VIEW_EVENT_GALLERY, VIEW_EVENT_REPORTS,
  ],
  USER: [
    VIEW_EVENTS, REGISTER_EVENT,
    VIEW_EVENT_DASHBOARD,
    VIEW_EVENT_USER_DASHBOARD, MANAGE_EVENT_USER_DASHBOARD,
    VIEW_EVENT_SCHEDULE,
    VIEW_EVENT_MEDIA, VIEW_EVENT_GALLERY, VIEW_EVENT_REPORTS,
  ],

  // ── Suggested event-specific custom roles (creatable in Admin Hub) ────────
  EVENT_COORDINATOR: [
    VIEW_EVENTS, CREATE_EVENT, REGISTER_EVENT,
    VIEW_EVENT_DASHBOARD, MANAGE_EVENT_DASHBOARD,
    VIEW_EVENT_SCHEDULE, CREATE_EDIT_EVENT_SCHEDULE, DELETE_EVENT_SCHEDULE,
    VIEW_EVENT_REGISTRATION, MANAGE_EVENT_REGISTRATION, EXPORT_EVENT_REGISTRATION,
    VIEW_EVENT_PEOPLE, MANAGE_EVENT_PEOPLE,
    VIEW_EVENT_FUNDRAISING,
    VIEW_EVENT_OPERATIONS, MANAGE_EVENT_OPERATIONS,
    VIEW_EVENT_MEDIA, VIEW_EVENT_GALLERY, VIEW_EVENT_REPORTS,
    SEND_EVENT_NOTIFICATIONS,
    VIEW_EVENT_FORMS, MANAGE_EVENT_FORMS,
  ],
  EVENT_VOLUNTEER: [
    VIEW_EVENTS, REGISTER_EVENT,
    VIEW_EVENT_DASHBOARD,
    VIEW_EVENT_SCHEDULE,
    VIEW_EVENT_REGISTRATION,
    VIEW_EVENT_PEOPLE, MANAGE_EVENT_PEOPLE,
    VIEW_EVENT_OPERATIONS,
    VIEW_EVENT_GALLERY,
    VIEW_EVENT_FORMS,
  ],
  PRIEST: [
    VIEW_EVENTS,
    VIEW_EVENT_DASHBOARD,
    VIEW_EVENT_SCHEDULE,
    VIEW_EVENT_FORMS, MANAGE_EVENT_FORMS,
    SEND_EVENT_NOTIFICATIONS,
  ],
  TICKET_CHECKER: [
    VIEW_EVENTS,
    VIEW_EVENT_DASHBOARD,
    VIEW_EVENT_REGISTRATION,
    VIEW_EVENT_SCHEDULE,
    VIEW_EVENT_FORMS,
  ],
  FUNDRAISING_MANAGER: [
    VIEW_EVENTS, REGISTER_EVENT,
    VIEW_EVENT_DASHBOARD,
    VIEW_EVENT_SCHEDULE,
    VIEW_EVENT_REGISTRATION,
    VIEW_EVENT_FUNDRAISING, MANAGE_EVENT_FUNDRAISING,
    VIEW_EVENT_REPORTS,
    SEND_EVENT_NOTIFICATIONS,
    VIEW_EVENT_FORMS,
  ],
  MEDIA_TEAM: [
    VIEW_EVENTS,
    VIEW_EVENT_DASHBOARD,
    VIEW_EVENT_SCHEDULE,
    VIEW_EVENT_MEDIA, MANAGE_EVENT_MEDIA, VIEW_EVENT_GALLERY, VIEW_EVENT_REPORTS,
    VIEW_EVENT_FORMS,
  ],
};


// ──── VENDOR MANAGEMENT SYSTEM ────
export const VIEW_VENDOR_MANAGEMENT  = "View Vendor Management";
export const CREATE_VENDOR           = "Create Vendor";
export const MANAGE_VENDORS          = "Manage Vendors";
export const BOOK_VENDOR_SERVICE     = "Book Vendor Service";
export const MANAGE_WORK_ORDERS      = "Manage Work Orders";
export const MANAGE_PROCUREMENT      = "Manage Procurement";
export const MANAGE_CONTRACTS        = "Manage Contracts";
export const MANAGE_VENDOR_PAYMENTS  = "Manage Vendor Payments";
export const RATE_VENDOR             = "Rate Vendor";
export const VIEW_VENDOR_ANALYTICS   = "View Vendor Analytics";

// ──── RESOURCE BOOKING ────
export const VIEW_RESOURCE_BOOKING = "View Resource Booking";
export const MANAGE_RESOURCES = "Manage Resources";
export const MANAGE_RESOURCE_CATEGORIES = "Manage Resource Categories";
export const MANAGE_BOOKING_RULES = "Manage Booking Rules";
export const MANAGE_PRICING = "Manage Pricing";
export const MANAGE_MAINTENANCE = "Manage Maintenance";
export const APPROVE_BOOKINGS = "Approve Bookings";
export const VIEW_BOOKING_ANALYTICS = "View Booking Analytics";
export const MANAGE_COUPONS = "Manage Coupons";
export const MANAGE_WORKFLOWS = "Manage Workflows";


// ──── FOOD & LIFESTYLE OS ────
export const VIEW_FOOD_PROFILE        = "View Food Profile";
export const MANAGE_FOOD_PROFILE      = "Manage Food Profile";
export const VIEW_FOOD_RESTAURANTS    = "View Food Restaurants";
export const MANAGE_FOOD_RESTAURANTS  = "Manage Food Restaurants";
export const VIEW_FOOD_MENU           = "View Food Menu";
export const MANAGE_FOOD_MENU         = "Manage Food Menu";
export const VIEW_FOOD_HOME_CHEFS     = "View Food Home Chefs";
export const MANAGE_FOOD_HOME_CHEFS   = "Manage Food Home Chefs";
export const VIEW_FOOD_ORDERS         = "View Food Orders";
export const MANAGE_FOOD_ORDERS       = "Manage Food Orders";
export const VIEW_FOOD_SUBSCRIPTIONS  = "View Food Subscriptions";
export const MANAGE_FOOD_SUBSCRIPTIONS = "Manage Food Subscriptions";
export const VIEW_FOOD_DINING         = "View Food Dining";
export const MANAGE_FOOD_DINING       = "Manage Food Dining";
export const VIEW_FOOD_GROCERY        = "View Food Grocery";
export const MANAGE_FOOD_GROCERY      = "Manage Food Grocery";
export const VIEW_FOOD_RECIPES        = "View Food Recipes";
export const MANAGE_FOOD_RECIPES      = "Manage Food Recipes";
export const VIEW_FOOD_NUTRITION      = "View Food Nutrition";
export const MANAGE_FOOD_NUTRITION    = "Manage Food Nutrition";
export const VIEW_FOOD_DELIVERY       = "View Food Delivery";
export const MANAGE_FOOD_DELIVERY     = "Manage Food Delivery";
export const VIEW_FOOD_COMMUNITY_KITCHEN = "View Food Community Kitchen";
export const MANAGE_FOOD_COMMUNITY_KITCHEN = "Manage Food Community Kitchen";
export const VIEW_FOOD_CATERING       = "View Food Catering";
export const MANAGE_FOOD_CATERING     = "Manage Food Catering";
export const VIEW_FOOD_CORPORATE      = "View Food Corporate";
export const MANAGE_FOOD_CORPORATE    = "Manage Food Corporate";
export const VIEW_FOOD_EVENTS         = "View Food Events";
export const MANAGE_FOOD_EVENTS       = "Manage Food Events";
export const VIEW_FOOD_PANTRY         = "View Food Pantry";
export const MANAGE_FOOD_PANTRY       = "Manage Food Pantry";
export const VIEW_FOOD_LOYALTY        = "View Food Loyalty";
export const MANAGE_FOOD_LOYALTY      = "Manage Food Loyalty";
export const VIEW_FOOD_ANALYTICS      = "View Food Analytics";
export const VIEW_FOOD_PAYMENTS       = "View Food Payments";
export const MANAGE_FOOD_PAYMENTS     = "Manage Food Payments";
export const VIEW_FOOD_CLOUD_KITCHENS = "View Food Cloud Kitchens";
export const MANAGE_FOOD_CLOUD_KITCHENS = "Manage Food Cloud Kitchens";

// ──── ADMIN DASHBOARD ────
export const VIEW_ADMIN            = "View Admin";
export const VERIFY_KYC            = "Verify KYC";
export const BULK_UPLOAD           = "Bulk Upload";
export const MANAGE_COMMUNITIES    = "Manage Communities";
export const MANAGE_ROLES          = "Manage Roles";
export const EDIT_VENUE_TIMING     = "Edit Venue Timing";
export const VIEW_ADMIN_DASHBOARD  = "View Admin Dashboard";
export const VIEW_USER_DASHBOARD   = "View User Dashboard";

// ──── SERVICE PLATFORM ────
export const VIEW_SERVICE_CATALOG     = "View Service Catalog";
export const MANAGE_SERVICE_CATALOG   = "Manage Service Catalog";
export const VIEW_SERVICE_PROVIDERS   = "View Service Providers";
export const MANAGE_SERVICE_PROVIDERS = "Manage Service Providers";
export const CREATE_SERVICE_REQUEST   = "Create Service Request";
export const VIEW_SERVICE_REQUESTS    = "View Service Requests";
export const MANAGE_SERVICE_REQUESTS  = "Manage Service Requests";
export const VIEW_WORK_ORDERS         = "View Work Orders";
export const MANAGE_SERVICE_WORK_ORDERS       = "Manage Work Orders";

/**
 * Permission categories grouped for the Role Management UI.
 * Used by AdminRoleManagement component.
 */
export const PERMISSION_CATEGORIES = [
  {
    id: "feed",
    title: "COMMUNITY FEED Permission",
    permissions: [VIEW_FEED, CREATE_POST, DELETE_POST, COMMENT_ON_POST],
  },
  {
    id: "sports",
    title: "SPORTS Permission",
    permissions: [
      // Main
      VIEW_SPORTS_MAIN, CREATE_EDIT_SPORTS_MAIN, DELETE_SPORTS_MAIN,
      // Sports Menu
      VIEW_SPORTS_MENU, CREATE_EDIT_SPORTS_MENU, DELETE_SPORTS_MENU,
      // Auction Configuration
      VIEW_AUCTION_CONFIG, CREATE_EDIT_AUCTION_CONFIG, DELETE_AUCTION_CONFIG,
      // Live Auction
      VIEW_LIVE_AUCTION, CREATE_EDIT_LIVE_AUCTION, DELETE_LIVE_AUCTION,
      // Teams Dashboard
      VIEW_TEAMS_DASHBOARD, CREATE_EDIT_TEAMS_DASHBOARD, DELETE_TEAMS_DASHBOARD,
      // Player Pool
      VIEW_PLAYER_POOL, CREATE_EDIT_PLAYER_POOL, DELETE_PLAYER_POOL,
      // Event Registrations
      VIEW_EVENT_REGISTRATIONS, CREATE_EDIT_EVENT_REGISTRATIONS, DELETE_EVENT_REGISTRATIONS,
      // Auction Results
      VIEW_AUCTION_RESULTS, CREATE_EDIT_AUCTION_RESULTS, DELETE_AUCTION_RESULTS,
    ],
  },
  {
    id: "marketplace",
    title: "MARKETPLACE Permission",
    permissions: [VIEW_MARKETPLACE, CREATE_LISTING, DELETE_LISTING, MANAGE_MARKETPLACE],
  },
  {
    id: "visitors",
    title: "VISITOR / GATE PASS Permission",
    permissions: [VIEW_VISITORS, CREATE_VISITOR_PASS, MANAGE_GATE],
  },
  {
    id: "amenities",
    title: "AMENITY BOOKING Permission",
    permissions: [VIEW_AMENITIES, BOOK_AMENITY, MANAGE_AMENITIES],
  },
  {
    id: "notices",
    title: "NOTICE BOARD Permission",
    permissions: [VIEW_NOTICES, CREATE_NOTICE, DELETE_NOTICE],
  },
  {
    id: "helpdesk",
    title: "HELPDESK / COMPLAINTS Permission",
    permissions: [VIEW_TICKETS, CREATE_TICKET, MANAGE_TICKETS],
  },
  {
    id: "polling",
    title: "POLLING / VOTING Permission",
    permissions: [VIEW_POLLS, CREATE_POLL, VOTE_POLL],
  },
  {
    id: "jobs",
    title: "JOBS & REFERRALS Permission",
    permissions: [VIEW_JOBS, CREATE_JOB, APPLY_JOB],
  },
  {
    id: "events",
    title: "EVENTS Permission",
    permissions: [
      VIEW_EVENTS, CREATE_EVENT, REGISTER_EVENT,
      VIEW_EVENT_DASHBOARD, MANAGE_EVENT_DASHBOARD,
      VIEW_EVENT_SCHEDULE, CREATE_EDIT_EVENT_SCHEDULE, DELETE_EVENT_SCHEDULE,
      VIEW_EVENT_REGISTRATION, MANAGE_EVENT_REGISTRATION, EXPORT_EVENT_REGISTRATION,
      VIEW_EVENT_PEOPLE, MANAGE_EVENT_PEOPLE,
      VIEW_EVENT_FUNDRAISING, MANAGE_EVENT_FUNDRAISING,
      VIEW_EVENT_OPERATIONS, MANAGE_EVENT_OPERATIONS,
      VIEW_EVENT_MEDIA, MANAGE_EVENT_MEDIA, VIEW_EVENT_GALLERY, VIEW_EVENT_REPORTS,
      SEND_EVENT_NOTIFICATIONS, MANAGE_EVENT_NOTIFICATIONS,
      VIEW_EVENT_FORMS, MANAGE_EVENT_FORMS, DELETE_EVENT_FORMS,
    ],
  },
  {
    id: "vendor_management",
    title: "VENDOR MANAGEMENT Permission",
    permissions: [VIEW_VENDOR_MANAGEMENT, CREATE_VENDOR, MANAGE_VENDORS, BOOK_VENDOR_SERVICE,
      MANAGE_WORK_ORDERS, MANAGE_PROCUREMENT, MANAGE_CONTRACTS, MANAGE_VENDOR_PAYMENTS,
      RATE_VENDOR, VIEW_VENDOR_ANALYTICS],
  },
  {
    id: "resource-booking",
    title: "RESOURCE BOOKING Permission",
    permissions: [
      VIEW_RESOURCE_BOOKING, MANAGE_RESOURCES, MANAGE_RESOURCE_CATEGORIES,
      MANAGE_BOOKING_RULES, MANAGE_PRICING, MANAGE_MAINTENANCE,
      APPROVE_BOOKINGS, VIEW_BOOKING_ANALYTICS, MANAGE_COUPONS, MANAGE_WORKFLOWS,
    ],
  },
  {
    id: "food_os",
    title: "FOOD & LIFESTYLE Permission",
    permissions: [
      VIEW_FOOD_PROFILE, MANAGE_FOOD_PROFILE,
      VIEW_FOOD_RESTAURANTS, MANAGE_FOOD_RESTAURANTS,
      VIEW_FOOD_MENU, MANAGE_FOOD_MENU,
      VIEW_FOOD_HOME_CHEFS, MANAGE_FOOD_HOME_CHEFS,
      VIEW_FOOD_ORDERS, MANAGE_FOOD_ORDERS,
      VIEW_FOOD_SUBSCRIPTIONS, MANAGE_FOOD_SUBSCRIPTIONS,
      VIEW_FOOD_DINING, MANAGE_FOOD_DINING,
      VIEW_FOOD_GROCERY, MANAGE_FOOD_GROCERY,
      VIEW_FOOD_RECIPES, MANAGE_FOOD_RECIPES,
      VIEW_FOOD_NUTRITION, MANAGE_FOOD_NUTRITION,
      VIEW_FOOD_DELIVERY, MANAGE_FOOD_DELIVERY,
      VIEW_FOOD_COMMUNITY_KITCHEN, MANAGE_FOOD_COMMUNITY_KITCHEN,
      VIEW_FOOD_CATERING, MANAGE_FOOD_CATERING,
      VIEW_FOOD_CORPORATE, MANAGE_FOOD_CORPORATE,
      VIEW_FOOD_EVENTS, MANAGE_FOOD_EVENTS,
      VIEW_FOOD_PANTRY, MANAGE_FOOD_PANTRY,
      VIEW_FOOD_LOYALTY, MANAGE_FOOD_LOYALTY,
      VIEW_FOOD_ANALYTICS,
      VIEW_FOOD_PAYMENTS, MANAGE_FOOD_PAYMENTS,
      VIEW_FOOD_CLOUD_KITCHENS, MANAGE_FOOD_CLOUD_KITCHENS,
    ],
  },
  {
    id: "admin",
    title: "ADMIN DASHBOARD Permission",
    permissions: [VIEW_ADMIN, VERIFY_KYC, BULK_UPLOAD, MANAGE_COMMUNITIES, MANAGE_ROLES, EDIT_VENUE_TIMING],
  },
  {
    id: "service-platform",
    title: "SERVICE PLATFORM Permission",
    permissions: [
      VIEW_SERVICE_CATALOG, MANAGE_SERVICE_CATALOG,
      VIEW_SERVICE_PROVIDERS, MANAGE_SERVICE_PROVIDERS,
      CREATE_SERVICE_REQUEST, VIEW_SERVICE_REQUESTS, MANAGE_SERVICE_REQUESTS,
      VIEW_WORK_ORDERS, MANAGE_WORK_ORDERS,
    ],
  },
] as const;

// ──── ROLE NAME CONSTANTS ──────────────────────────────────────────────────
// Mirror of Java PermissionConstants ROLE_* values.
export const ROLE_SUPER_ADMIN    = "SUPER_ADMIN";
export const ROLE_ADMIN          = "ADMIN";
export const ROLE_COMMUNITY_ADMIN = "COMMUNITY_ADMIN";
export const ROLE_SPORTS_ADMIN   = "SPORTS_ADMIN";
export const ROLE_EVENT_ADMIN    = "EVENT_ADMIN";
export const ROLE_MEMBER         = "MEMBER";
/** Default role assigned to ALL new registrations. Must be upgraded by an admin. */
export const ROLE_USER           = "USER";
export const ROLE_VENDOR         = "VENDOR";
export const ROLE_CASHIER        = "CASHIER";
export const ROLE_STAFF               = "STAFF";
// Event-specific custom roles — creatable in Admin Hub → Event Access
export const ROLE_EVENT_COORDINATOR   = "EVENT_COORDINATOR";
export const ROLE_EVENT_VOLUNTEER     = "EVENT_VOLUNTEER";
export const ROLE_PRIEST              = "PRIEST";
export const ROLE_TICKET_CHECKER      = "TICKET_CHECKER";
export const ROLE_FUNDRAISING_MANAGER = "FUNDRAISING_MANAGER";
export const ROLE_MEDIA_TEAM          = "MEDIA_TEAM";

/**
 * Minimal permissions granted to a USER (newly registered / unverified member).
 * An admin can upgrade the user to MEMBER, STAFF, CASHIER, VENDOR, etc.
 */
export const USER_PERMISSIONS: string[] = [
  VIEW_FEED, COMMENT_ON_POST,
  VIEW_EVENTS, REGISTER_EVENT, VIEW_EVENT_DASHBOARD, VIEW_EVENT_SCHEDULE, VIEW_EVENT_GALLERY,
  VIEW_MARKETPLACE,
  VIEW_NOTICES,
  VIEW_POLLS, VOTE_POLL,
  VIEW_JOBS,
  VIEW_AMENITIES,
];
