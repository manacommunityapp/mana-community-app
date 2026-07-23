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

// ──── EVENTS ────
export const VIEW_EVENTS    = "View Events";
export const CREATE_EVENT   = "Create Event";
export const REGISTER_EVENT = "Register Event";

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

// ──── ADMIN DASHBOARD ────
export const VIEW_ADMIN         = "View Admin";
export const VERIFY_KYC         = "Verify KYC";
export const BULK_UPLOAD        = "Bulk Upload";
export const MANAGE_COMMUNITIES = "Manage Communities";
export const MANAGE_ROLES       = "Manage Roles";
export const EDIT_VENUE_TIMING  = "Edit Venue Timing";


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
    permissions: [VIEW_EVENTS, CREATE_EVENT, REGISTER_EVENT],
  },
  {
    id: "vendor_management",
    title: "VENDOR MANAGEMENT Permission",
    permissions: [VIEW_VENDOR_MANAGEMENT, CREATE_VENDOR, MANAGE_VENDORS, BOOK_VENDOR_SERVICE,
      MANAGE_WORK_ORDERS, MANAGE_PROCUREMENT, MANAGE_CONTRACTS, MANAGE_VENDOR_PAYMENTS,
      RATE_VENDOR, VIEW_VENDOR_ANALYTICS],
  },
  {
    id: "admin",
    title: "ADMIN DASHBOARD Permission",
    permissions: [VIEW_ADMIN, VERIFY_KYC, BULK_UPLOAD, MANAGE_COMMUNITIES, MANAGE_ROLES, EDIT_VENUE_TIMING],
  },
] as const;
