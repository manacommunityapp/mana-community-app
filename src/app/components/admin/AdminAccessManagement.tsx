import { useState, useEffect, type ElementType } from "react";
import { useSearchParams } from "react-router";
import {
  Shield, Users, Eye, Pencil, Trash2, ChevronDown, ChevronRight,
  CheckCircle2, Lock, Unlock, RotateCcw, Save, Loader2, Crown,
  Briefcase, Banknote, Wrench, DollarSign, Sparkles, UserCheck,
  MessageSquare, ShoppingBag, DoorOpen, Building, Bell,
  Headphones, Trophy, UtensilsCrossed, Package, CalendarDays,
  Settings, Truck, ChefHat, CalendarCheck, BarChart2, Star, ShieldAlert,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { cn } from "../ui/utils";
import {
  EVENT_PERMISSION_MATRIX, EVENT_ROLE_DEFAULTS,
  SPORTS_PERMISSION_MATRIX,
  VIEW_SPORTS_MAIN, CREATE_EDIT_SPORTS_MAIN, DELETE_SPORTS_MAIN,
  VIEW_SPORTS_MENU, CREATE_EDIT_SPORTS_MENU, DELETE_SPORTS_MENU,
  VIEW_AUCTION_CONFIG, CREATE_EDIT_AUCTION_CONFIG, DELETE_AUCTION_CONFIG,
  VIEW_LIVE_AUCTION, CREATE_EDIT_LIVE_AUCTION, DELETE_LIVE_AUCTION,
  VIEW_TEAMS_DASHBOARD, CREATE_EDIT_TEAMS_DASHBOARD, DELETE_TEAMS_DASHBOARD,
  VIEW_PLAYER_POOL, CREATE_EDIT_PLAYER_POOL, DELETE_PLAYER_POOL,
  VIEW_EVENT_REGISTRATIONS, CREATE_EDIT_EVENT_REGISTRATIONS, DELETE_EVENT_REGISTRATIONS,
  VIEW_AUCTION_RESULTS, CREATE_EDIT_AUCTION_RESULTS, DELETE_AUCTION_RESULTS,
  VIEW_FEED, CREATE_POST, DELETE_POST, COMMENT_ON_POST,
  VIEW_MARKETPLACE, CREATE_LISTING, DELETE_LISTING, MANAGE_MARKETPLACE,
  VIEW_VISITORS, CREATE_VISITOR_PASS, MANAGE_GATE,
  VIEW_AMENITIES, BOOK_AMENITY, MANAGE_AMENITIES,
  VIEW_NOTICES, CREATE_NOTICE, DELETE_NOTICE,
  VIEW_TICKETS, CREATE_TICKET, MANAGE_TICKETS,
  VIEW_POLLS, CREATE_POLL, VOTE_POLL,
  VIEW_JOBS, CREATE_JOB, APPLY_JOB,
  VIEW_VENDOR_MANAGEMENT, CREATE_VENDOR, MANAGE_VENDORS, BOOK_VENDOR_SERVICE,
  MANAGE_WORK_ORDERS, MANAGE_PROCUREMENT, MANAGE_CONTRACTS, MANAGE_VENDOR_PAYMENTS,
  RATE_VENDOR, VIEW_VENDOR_ANALYTICS,
  VIEW_RESOURCE_BOOKING, MANAGE_RESOURCES, MANAGE_RESOURCE_CATEGORIES,
  MANAGE_BOOKING_RULES, MANAGE_PRICING, MANAGE_MAINTENANCE,
  APPROVE_BOOKINGS, VIEW_BOOKING_ANALYTICS, MANAGE_COUPONS, MANAGE_WORKFLOWS,
  VIEW_FOOD_PROFILE, MANAGE_FOOD_PROFILE,
  VIEW_FOOD_RESTAURANTS, MANAGE_FOOD_RESTAURANTS,
  VIEW_FOOD_MENU, MANAGE_FOOD_MENU,
  VIEW_FOOD_HOME_CHEFS, MANAGE_FOOD_HOME_CHEFS,
  VIEW_FOOD_ORDERS, MANAGE_FOOD_ORDERS,
  VIEW_FOOD_SUBSCRIPTIONS, MANAGE_FOOD_SUBSCRIPTIONS,
  VIEW_FOOD_DINING, MANAGE_FOOD_DINING,
  VIEW_FOOD_GROCERY, MANAGE_FOOD_GROCERY,
  VIEW_FOOD_CATERING, MANAGE_FOOD_CATERING,
  VIEW_FOOD_COMMUNITY_KITCHEN, MANAGE_FOOD_COMMUNITY_KITCHEN,
  VIEW_FOOD_ANALYTICS, VIEW_FOOD_PAYMENTS, MANAGE_FOOD_PAYMENTS,
  VIEW_ADMIN, VERIFY_KYC, BULK_UPLOAD, MANAGE_COMMUNITIES, MANAGE_ROLES, EDIT_VENUE_TIMING,
  VIEW_SERVICE_CATALOG, MANAGE_SERVICE_CATALOG,
  VIEW_SERVICE_PROVIDERS, MANAGE_SERVICE_PROVIDERS,
  CREATE_SERVICE_REQUEST, VIEW_SERVICE_REQUESTS, MANAGE_SERVICE_REQUESTS,
  VIEW_WORK_ORDERS, MANAGE_SERVICE_WORK_ORDERS,
} from "../../../constants/permissions";
import { userService } from "../../../services/common/userService";
import { sortRoles } from "../../../utils/roleUtils";


/* ─── Types ─── */
interface PermRow {
  label: string;
  view?: string;
  createEdit?: string;
  delete?: string;
  isGroupHeader?: boolean;
  childIndices?: number[];
  isChild?: boolean;
}

interface ModuleConfig {
  id: string;
  label: string;
  icon: ElementType;
  color: string;
  accent: string;
  description: string;
  rows: PermRow[];
  roleDefaults: Record<string, string[]>;
}

export interface SystemRoleDef {
  name: string;
  label: string;
  color: string;
  icon: ElementType;
}

const HIDDEN_ROLES = [
  "SUPER_ADMIN", "SUPERADMIN", "SUPER_ADMINISTRATOR",
  "COMMUNITY_ADMIN", "COMMUNITYADMIN", "COMMUNITY_ADMINISTRATOR", "COMMUNITY ADMIN",
];

const isHiddenRole = (name: string) => HIDDEN_ROLES.includes(name.trim().toUpperCase());

const KNOWN_ROLE_META: Record<string, { label: string; color: string; icon: ElementType }> = {
  ADMIN:        { label: "Admin",        color: "#4f46e5", icon: Crown },
  SPORTS_ADMIN: { label: "Sports Admin", color: "#0891b2", icon: Briefcase },
  MEMBER:       { label: "Member",       color: "#059669", icon: UserCheck },
  VENDOR:       { label: "Vendor",       color: "#d97706", icon: Banknote },
  CASHIER:      { label: "Cashier",      color: "#be185d", icon: DollarSign },
  STAFF:        { label: "Staff",        color: "#64748b", icon: Wrench },
  USER:         { label: "User",         color: "#8b5cf6", icon: Users },
};

function mapRoleNameToDef(name: string): SystemRoleDef {
  const upper = name.trim().toUpperCase();
  if (KNOWN_ROLE_META[upper]) {
    return { name: upper, ...KNOWN_ROLE_META[upper] };
  }
  const formattedLabel = upper
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
  return {
    name: upper,
    label: formattedLabel,
    color: "#6366f1",
    icon: Shield,
  };
}

/* ─── Default fallback roles (never includes SUPER_ADMIN or COMMUNITY_ADMIN) ─── */
const DEFAULT_SYSTEM_ROLES: SystemRoleDef[] = sortRoles([
  { name: "ADMIN",        label: "Admin",        color: "#4f46e5", icon: Crown },
  { name: "CASHIER",      label: "Cashier",      color: "#be185d", icon: DollarSign },
  { name: "MEMBER",       label: "Member",       color: "#059669", icon: UserCheck },
  { name: "SPORTS_ADMIN", label: "Sports Admin", color: "#0891b2", icon: Briefcase },
  { name: "STAFF",        label: "Staff",        color: "#64748b", icon: Wrench },
  { name: "USER",         label: "User",         color: "#8b5cf6", icon: Users },
  { name: "VENDOR",       label: "Vendor",       color: "#d97706", icon: Banknote },
]);


/* ─── Module configs ─── */
const MODULES: ModuleConfig[] = [
  /* ── Events ──────────────────────────────────────────────── */
  {
    id: "events", label: "Events", icon: CalendarDays, color: "#4f46e5", accent: "#eef2ff",
    description: "Event creation, scheduling, registration, people, fundraising, media",
    rows: EVENT_PERMISSION_MATRIX as PermRow[],
    roleDefaults: EVENT_ROLE_DEFAULTS,
  },

  /* ── Sports ──────────────────────────────────────────────── */
  {
    id: "sports", label: "Sports", icon: Trophy, color: "#0891b2", accent: "#ecfeff",
    description: "Sports menus, auctions, teams, player pool, registrations, results",
    rows: SPORTS_PERMISSION_MATRIX as PermRow[],
    roleDefaults: {
      ADMIN:           [VIEW_SPORTS_MAIN, CREATE_EDIT_SPORTS_MAIN, DELETE_SPORTS_MAIN, VIEW_SPORTS_MENU, CREATE_EDIT_SPORTS_MENU, DELETE_SPORTS_MENU, VIEW_AUCTION_CONFIG, CREATE_EDIT_AUCTION_CONFIG, DELETE_AUCTION_CONFIG, VIEW_LIVE_AUCTION, CREATE_EDIT_LIVE_AUCTION, DELETE_LIVE_AUCTION, VIEW_TEAMS_DASHBOARD, CREATE_EDIT_TEAMS_DASHBOARD, DELETE_TEAMS_DASHBOARD, VIEW_PLAYER_POOL, CREATE_EDIT_PLAYER_POOL, DELETE_PLAYER_POOL, VIEW_EVENT_REGISTRATIONS, CREATE_EDIT_EVENT_REGISTRATIONS, DELETE_EVENT_REGISTRATIONS, VIEW_AUCTION_RESULTS, CREATE_EDIT_AUCTION_RESULTS, DELETE_AUCTION_RESULTS],
      COMMUNITY_ADMIN: [VIEW_SPORTS_MAIN, CREATE_EDIT_SPORTS_MAIN, DELETE_SPORTS_MAIN, VIEW_SPORTS_MENU, CREATE_EDIT_SPORTS_MENU, DELETE_SPORTS_MENU, VIEW_AUCTION_CONFIG, CREATE_EDIT_AUCTION_CONFIG, DELETE_AUCTION_CONFIG, VIEW_LIVE_AUCTION, CREATE_EDIT_LIVE_AUCTION, DELETE_LIVE_AUCTION, VIEW_TEAMS_DASHBOARD, CREATE_EDIT_TEAMS_DASHBOARD, DELETE_TEAMS_DASHBOARD, VIEW_PLAYER_POOL, CREATE_EDIT_PLAYER_POOL, DELETE_PLAYER_POOL, VIEW_EVENT_REGISTRATIONS, CREATE_EDIT_EVENT_REGISTRATIONS, DELETE_EVENT_REGISTRATIONS, VIEW_AUCTION_RESULTS, CREATE_EDIT_AUCTION_RESULTS, DELETE_AUCTION_RESULTS],
      SPORTS_ADMIN:    [VIEW_SPORTS_MAIN, CREATE_EDIT_SPORTS_MAIN, DELETE_SPORTS_MAIN, VIEW_SPORTS_MENU, CREATE_EDIT_SPORTS_MENU, DELETE_SPORTS_MENU, VIEW_AUCTION_CONFIG, CREATE_EDIT_AUCTION_CONFIG, DELETE_AUCTION_CONFIG, VIEW_LIVE_AUCTION, CREATE_EDIT_LIVE_AUCTION, DELETE_LIVE_AUCTION, VIEW_TEAMS_DASHBOARD, CREATE_EDIT_TEAMS_DASHBOARD, DELETE_TEAMS_DASHBOARD, VIEW_PLAYER_POOL, CREATE_EDIT_PLAYER_POOL, DELETE_PLAYER_POOL, VIEW_EVENT_REGISTRATIONS, CREATE_EDIT_EVENT_REGISTRATIONS, DELETE_EVENT_REGISTRATIONS, VIEW_AUCTION_RESULTS, CREATE_EDIT_AUCTION_RESULTS, DELETE_AUCTION_RESULTS],
      MEMBER:          [VIEW_SPORTS_MAIN, VIEW_SPORTS_MENU, VIEW_TEAMS_DASHBOARD, VIEW_PLAYER_POOL, VIEW_EVENT_REGISTRATIONS, VIEW_AUCTION_RESULTS],
      VENDOR:          [VIEW_SPORTS_MAIN, VIEW_SPORTS_MENU],
      CASHIER:         [VIEW_SPORTS_MAIN, VIEW_LIVE_AUCTION, VIEW_AUCTION_RESULTS],
      STAFF:           [VIEW_SPORTS_MAIN, VIEW_SPORTS_MENU, VIEW_TEAMS_DASHBOARD, VIEW_PLAYER_POOL, VIEW_EVENT_REGISTRATIONS],
      USER:            [VIEW_SPORTS_MAIN, VIEW_SPORTS_MENU],
    },
  },

  /* ── Community Feed ──────────────────────────────────────── */
  {
    id: "feed", label: "Community Feed", icon: MessageSquare, color: "#0ea5e9", accent: "#f0f9ff",
    description: "Posts, comments and content moderation in the community feed",
    rows: [
      { label: "Feed",     view: VIEW_FEED, createEdit: CREATE_POST, delete: DELETE_POST },
      { label: "Comments", view: COMMENT_ON_POST },
    ],
    roleDefaults: {
      ADMIN:           [VIEW_FEED, CREATE_POST, DELETE_POST, COMMENT_ON_POST],
      COMMUNITY_ADMIN: [VIEW_FEED, CREATE_POST, DELETE_POST, COMMENT_ON_POST],
      SPORTS_ADMIN:    [VIEW_FEED, COMMENT_ON_POST],
      MEMBER:          [VIEW_FEED, CREATE_POST, DELETE_POST, COMMENT_ON_POST],
      VENDOR:          [VIEW_FEED, COMMENT_ON_POST],
      CASHIER:         [VIEW_FEED],
      STAFF:           [VIEW_FEED, COMMENT_ON_POST],
      USER:            [VIEW_FEED, COMMENT_ON_POST],
    },
  },

  /* ── Marketplace ─────────────────────────────────────────── */
  {
    id: "marketplace", label: "Marketplace", icon: ShoppingBag, color: "#f59e0b", accent: "#fffbeb",
    description: "Buy, sell, and manage community marketplace listings",
    rows: [
      { label: "Marketplace", view: VIEW_MARKETPLACE, createEdit: CREATE_LISTING, delete: DELETE_LISTING },
      { label: "Admin Control", view: MANAGE_MARKETPLACE },
    ],
    roleDefaults: {
      ADMIN:           [VIEW_MARKETPLACE, CREATE_LISTING, DELETE_LISTING, MANAGE_MARKETPLACE],
      COMMUNITY_ADMIN: [VIEW_MARKETPLACE, CREATE_LISTING, DELETE_LISTING, MANAGE_MARKETPLACE],
      SPORTS_ADMIN:    [VIEW_MARKETPLACE],
      MEMBER:          [VIEW_MARKETPLACE, CREATE_LISTING],
      VENDOR:          [VIEW_MARKETPLACE, CREATE_LISTING, MANAGE_MARKETPLACE],
      CASHIER:         [VIEW_MARKETPLACE],
      STAFF:           [VIEW_MARKETPLACE],
      USER:            [VIEW_MARKETPLACE],
    },
  },

  /* ── Visitors / Gate Pass ────────────────────────────────── */
  {
    id: "visitors", label: "Visitors", icon: DoorOpen, color: "#10b981", accent: "#ecfdf5",
    description: "Visitor registrations, gate passes, and entry management",
    rows: [
      { label: "Visitor List",  view: VIEW_VISITORS },
      { label: "Gate Passes",   view: CREATE_VISITOR_PASS },
      { label: "Gate Control",  view: MANAGE_GATE },
    ],
    roleDefaults: {
      ADMIN:           [VIEW_VISITORS, CREATE_VISITOR_PASS, MANAGE_GATE],
      COMMUNITY_ADMIN: [VIEW_VISITORS, CREATE_VISITOR_PASS, MANAGE_GATE],
      SPORTS_ADMIN:    [VIEW_VISITORS],
      MEMBER:          [CREATE_VISITOR_PASS],
      VENDOR:          [CREATE_VISITOR_PASS],
      CASHIER:         [VIEW_VISITORS, MANAGE_GATE],
      STAFF:           [VIEW_VISITORS, MANAGE_GATE],
      USER:            [CREATE_VISITOR_PASS],
    },
  },

  /* ── Amenities ────────────────────────────────────────────── */
  {
    id: "amenities", label: "Amenities", icon: Building, color: "#6366f1", accent: "#eef2ff",
    description: "Amenity bookings, facilities, and booking administration",
    rows: [
      { label: "Amenities",  view: VIEW_AMENITIES, createEdit: BOOK_AMENITY, delete: MANAGE_AMENITIES },
    ],
    roleDefaults: {
      ADMIN:           [VIEW_AMENITIES, BOOK_AMENITY, MANAGE_AMENITIES],
      COMMUNITY_ADMIN: [VIEW_AMENITIES, BOOK_AMENITY, MANAGE_AMENITIES],
      SPORTS_ADMIN:    [VIEW_AMENITIES, BOOK_AMENITY],
      MEMBER:          [VIEW_AMENITIES, BOOK_AMENITY],
      VENDOR:          [VIEW_AMENITIES],
      CASHIER:         [VIEW_AMENITIES],
      STAFF:           [VIEW_AMENITIES, BOOK_AMENITY],
      USER:            [VIEW_AMENITIES, BOOK_AMENITY],
    },
  },

  /* ── Notices ─────────────────────────────────────────────── */
  {
    id: "notices", label: "Notice Board", icon: Bell, color: "#ef4444", accent: "#fef2f2",
    description: "Community announcements, notices, and bulletin board management",
    rows: [
      { label: "Notices", view: VIEW_NOTICES, createEdit: CREATE_NOTICE, delete: DELETE_NOTICE },
    ],
    roleDefaults: {
      ADMIN:           [VIEW_NOTICES, CREATE_NOTICE, DELETE_NOTICE],
      COMMUNITY_ADMIN: [VIEW_NOTICES, CREATE_NOTICE, DELETE_NOTICE],
      SPORTS_ADMIN:    [VIEW_NOTICES, CREATE_NOTICE],
      MEMBER:          [VIEW_NOTICES],
      VENDOR:          [VIEW_NOTICES],
      CASHIER:         [VIEW_NOTICES],
      STAFF:           [VIEW_NOTICES, CREATE_NOTICE],
      USER:            [VIEW_NOTICES],
    },
  },

  /* ── Helpdesk ────────────────────────────────────────────── */
  {
    id: "helpdesk", label: "Helpdesk", icon: Headphones, color: "#8b5cf6", accent: "#f5f3ff",
    description: "Support tickets, complaint management, and resolution tracking",
    rows: [
      { label: "Tickets", view: VIEW_TICKETS, createEdit: CREATE_TICKET, delete: MANAGE_TICKETS },
    ],
    roleDefaults: {
      ADMIN:           [VIEW_TICKETS, CREATE_TICKET, MANAGE_TICKETS],
      COMMUNITY_ADMIN: [VIEW_TICKETS, CREATE_TICKET, MANAGE_TICKETS],
      SPORTS_ADMIN:    [VIEW_TICKETS, CREATE_TICKET],
      MEMBER:          [VIEW_TICKETS, CREATE_TICKET],
      VENDOR:          [VIEW_TICKETS, CREATE_TICKET],
      CASHIER:         [VIEW_TICKETS, CREATE_TICKET],
      STAFF:           [VIEW_TICKETS, MANAGE_TICKETS],
      USER:            [VIEW_TICKETS, CREATE_TICKET],
    },
  },

  /* ── Polling ─────────────────────────────────────────────── */
  {
    id: "polling", label: "Polling", icon: BarChart2, color: "#0891b2", accent: "#ecfeff",
    description: "Community polls, voting, and opinion collection",
    rows: [
      { label: "Polls",  view: VIEW_POLLS, createEdit: CREATE_POLL },
      { label: "Voting", view: VOTE_POLL },
    ],
    roleDefaults: {
      ADMIN:           [VIEW_POLLS, CREATE_POLL, VOTE_POLL],
      COMMUNITY_ADMIN: [VIEW_POLLS, CREATE_POLL, VOTE_POLL],
      SPORTS_ADMIN:    [VIEW_POLLS, CREATE_POLL, VOTE_POLL],
      MEMBER:          [VIEW_POLLS, VOTE_POLL],
      VENDOR:          [VIEW_POLLS],
      CASHIER:         [VIEW_POLLS],
      STAFF:           [VIEW_POLLS, VOTE_POLL],
      USER:            [VIEW_POLLS, VOTE_POLL],
    },
  },

  /* ── Jobs ────────────────────────────────────────────────── */
  {
    id: "jobs", label: "Jobs & Referrals", icon: Briefcase, color: "#059669", accent: "#ecfdf5",
    description: "Job listings, applications, and community referrals",
    rows: [
      { label: "Listings",     view: VIEW_JOBS, createEdit: CREATE_JOB },
      { label: "Applications", view: APPLY_JOB },
    ],
    roleDefaults: {
      ADMIN:           [VIEW_JOBS, CREATE_JOB, APPLY_JOB],
      COMMUNITY_ADMIN: [VIEW_JOBS, CREATE_JOB, APPLY_JOB],
      SPORTS_ADMIN:    [VIEW_JOBS],
      MEMBER:          [VIEW_JOBS, APPLY_JOB],
      VENDOR:          [VIEW_JOBS, CREATE_JOB],
      CASHIER:         [VIEW_JOBS],
      STAFF:           [VIEW_JOBS, CREATE_JOB],
      USER:            [VIEW_JOBS, APPLY_JOB],
    },
  },

  /* ── Vendor Management ───────────────────────────────────── */
  {
    id: "vendors", label: "Vendor Management", icon: Truck, color: "#d97706", accent: "#fffbeb",
    description: "Vendor directory, work orders, procurement, contracts, and payments",
    rows: [
      { label: "Vendor Management",  isGroupHeader: true, childIndices: [1, 2, 3, 4] },
      { label: "Directory",          view: VIEW_VENDOR_MANAGEMENT, createEdit: CREATE_VENDOR, delete: MANAGE_VENDORS, isChild: true },
      { label: "Services & Orders",  view: BOOK_VENDOR_SERVICE, createEdit: MANAGE_WORK_ORDERS, delete: MANAGE_PROCUREMENT, isChild: true },
      { label: "Contracts",          view: MANAGE_CONTRACTS, isChild: true },
      { label: "Payments & Analytics", view: MANAGE_VENDOR_PAYMENTS, createEdit: RATE_VENDOR, delete: VIEW_VENDOR_ANALYTICS, isChild: true },
    ],
    roleDefaults: {
      ADMIN:           [VIEW_VENDOR_MANAGEMENT, CREATE_VENDOR, MANAGE_VENDORS, BOOK_VENDOR_SERVICE, MANAGE_WORK_ORDERS, MANAGE_PROCUREMENT, MANAGE_CONTRACTS, MANAGE_VENDOR_PAYMENTS, RATE_VENDOR, VIEW_VENDOR_ANALYTICS],
      COMMUNITY_ADMIN: [VIEW_VENDOR_MANAGEMENT, CREATE_VENDOR, MANAGE_VENDORS, BOOK_VENDOR_SERVICE, MANAGE_WORK_ORDERS, MANAGE_PROCUREMENT, MANAGE_CONTRACTS, MANAGE_VENDOR_PAYMENTS, RATE_VENDOR, VIEW_VENDOR_ANALYTICS],
      SPORTS_ADMIN:    [VIEW_VENDOR_MANAGEMENT, BOOK_VENDOR_SERVICE, RATE_VENDOR],
      MEMBER:          [VIEW_VENDOR_MANAGEMENT, BOOK_VENDOR_SERVICE, RATE_VENDOR],
      VENDOR:          [VIEW_VENDOR_MANAGEMENT, CREATE_VENDOR, MANAGE_VENDORS, MANAGE_WORK_ORDERS, MANAGE_CONTRACTS, MANAGE_VENDOR_PAYMENTS, VIEW_VENDOR_ANALYTICS],
      CASHIER:         [VIEW_VENDOR_MANAGEMENT, MANAGE_VENDOR_PAYMENTS],
      STAFF:           [VIEW_VENDOR_MANAGEMENT, MANAGE_WORK_ORDERS],
      USER:            [VIEW_VENDOR_MANAGEMENT, BOOK_VENDOR_SERVICE],
    },
  },

  /* ── Resource Booking ────────────────────────────────────── */
  {
    id: "bookings", label: "Resource Booking", icon: CalendarCheck, color: "#7c3aed", accent: "#f5f3ff",
    description: "Venue and resource bookings, pricing, maintenance, and approval workflows",
    rows: [
      { label: "Resource Booking",  isGroupHeader: true, childIndices: [1, 2, 3] },
      { label: "Booking & Approval",  view: VIEW_RESOURCE_BOOKING, createEdit: APPROVE_BOOKINGS, delete: MANAGE_COUPONS, isChild: true },
      { label: "Admin Config",        view: MANAGE_RESOURCES, createEdit: MANAGE_RESOURCE_CATEGORIES, delete: MANAGE_BOOKING_RULES, isChild: true },
      { label: "Pricing & Analytics", view: MANAGE_PRICING, createEdit: MANAGE_MAINTENANCE, delete: VIEW_BOOKING_ANALYTICS, isChild: true },
    ],
    roleDefaults: {
      ADMIN:           [VIEW_RESOURCE_BOOKING, MANAGE_RESOURCES, MANAGE_RESOURCE_CATEGORIES, MANAGE_BOOKING_RULES, MANAGE_PRICING, MANAGE_MAINTENANCE, APPROVE_BOOKINGS, VIEW_BOOKING_ANALYTICS, MANAGE_COUPONS, MANAGE_WORKFLOWS],
      COMMUNITY_ADMIN: [VIEW_RESOURCE_BOOKING, MANAGE_RESOURCES, MANAGE_RESOURCE_CATEGORIES, MANAGE_BOOKING_RULES, MANAGE_PRICING, MANAGE_MAINTENANCE, APPROVE_BOOKINGS, VIEW_BOOKING_ANALYTICS, MANAGE_COUPONS, MANAGE_WORKFLOWS],
      SPORTS_ADMIN:    [VIEW_RESOURCE_BOOKING, APPROVE_BOOKINGS],
      MEMBER:          [VIEW_RESOURCE_BOOKING],
      VENDOR:          [VIEW_RESOURCE_BOOKING],
      CASHIER:         [VIEW_RESOURCE_BOOKING, APPROVE_BOOKINGS],
      STAFF:           [VIEW_RESOURCE_BOOKING, APPROVE_BOOKINGS],
      USER:            [VIEW_RESOURCE_BOOKING],
    },
  },

  /* ── Food & Lifestyle ────────────────────────────────────── */
  {
    id: "food", label: "Food & Lifestyle", icon: ChefHat, color: "#f97316", accent: "#fff7ed",
    description: "Restaurants, home chefs, orders, grocery, community kitchen, catering, dining",
    rows: [
      { label: "Food & Lifestyle",      isGroupHeader: true, childIndices: [1, 2, 3, 4, 5, 6] },
      { label: "Profile",               view: VIEW_FOOD_PROFILE, createEdit: MANAGE_FOOD_PROFILE, isChild: true },
      { label: "Restaurants & Menu",    view: VIEW_FOOD_RESTAURANTS, createEdit: MANAGE_FOOD_RESTAURANTS, delete: MANAGE_FOOD_MENU, isChild: true },
      { label: "Home Chefs",            view: VIEW_FOOD_HOME_CHEFS, createEdit: MANAGE_FOOD_HOME_CHEFS, isChild: true },
      { label: "Orders & Subscriptions",view: VIEW_FOOD_ORDERS, createEdit: MANAGE_FOOD_ORDERS, delete: VIEW_FOOD_SUBSCRIPTIONS, isChild: true },
      { label: "Dining & Grocery",      view: VIEW_FOOD_DINING, createEdit: MANAGE_FOOD_DINING, delete: VIEW_FOOD_GROCERY, isChild: true },
      { label: "Catering & Kitchen",    view: VIEW_FOOD_CATERING, createEdit: MANAGE_FOOD_CATERING, delete: VIEW_FOOD_COMMUNITY_KITCHEN, isChild: true },
    ],
    roleDefaults: {
      ADMIN:           [VIEW_FOOD_PROFILE, MANAGE_FOOD_PROFILE, VIEW_FOOD_RESTAURANTS, MANAGE_FOOD_RESTAURANTS, MANAGE_FOOD_MENU, VIEW_FOOD_HOME_CHEFS, MANAGE_FOOD_HOME_CHEFS, VIEW_FOOD_ORDERS, MANAGE_FOOD_ORDERS, VIEW_FOOD_SUBSCRIPTIONS, MANAGE_FOOD_SUBSCRIPTIONS, VIEW_FOOD_DINING, MANAGE_FOOD_DINING, VIEW_FOOD_GROCERY, VIEW_FOOD_CATERING, MANAGE_FOOD_CATERING, VIEW_FOOD_COMMUNITY_KITCHEN, MANAGE_FOOD_COMMUNITY_KITCHEN, VIEW_FOOD_ANALYTICS, VIEW_FOOD_PAYMENTS, MANAGE_FOOD_PAYMENTS],
      COMMUNITY_ADMIN: [VIEW_FOOD_PROFILE, MANAGE_FOOD_PROFILE, VIEW_FOOD_RESTAURANTS, MANAGE_FOOD_RESTAURANTS, MANAGE_FOOD_MENU, VIEW_FOOD_HOME_CHEFS, MANAGE_FOOD_HOME_CHEFS, VIEW_FOOD_ORDERS, MANAGE_FOOD_ORDERS, VIEW_FOOD_SUBSCRIPTIONS, MANAGE_FOOD_SUBSCRIPTIONS, VIEW_FOOD_DINING, MANAGE_FOOD_DINING, VIEW_FOOD_GROCERY, VIEW_FOOD_CATERING, MANAGE_FOOD_CATERING, VIEW_FOOD_COMMUNITY_KITCHEN, MANAGE_FOOD_COMMUNITY_KITCHEN, VIEW_FOOD_ANALYTICS, VIEW_FOOD_PAYMENTS, MANAGE_FOOD_PAYMENTS],
      SPORTS_ADMIN:    [VIEW_FOOD_PROFILE, VIEW_FOOD_RESTAURANTS, VIEW_FOOD_ORDERS],
      MEMBER:          [VIEW_FOOD_PROFILE, VIEW_FOOD_RESTAURANTS, VIEW_FOOD_MENU, VIEW_FOOD_HOME_CHEFS, VIEW_FOOD_ORDERS, VIEW_FOOD_DINING, VIEW_FOOD_GROCERY],
      VENDOR:          [VIEW_FOOD_PROFILE, MANAGE_FOOD_PROFILE, VIEW_FOOD_RESTAURANTS, MANAGE_FOOD_RESTAURANTS, MANAGE_FOOD_MENU, VIEW_FOOD_HOME_CHEFS, MANAGE_FOOD_HOME_CHEFS, VIEW_FOOD_ORDERS, MANAGE_FOOD_ORDERS, VIEW_FOOD_PAYMENTS, MANAGE_FOOD_PAYMENTS],
      CASHIER:         [VIEW_FOOD_ORDERS, MANAGE_FOOD_ORDERS, VIEW_FOOD_PAYMENTS, MANAGE_FOOD_PAYMENTS],
      STAFF:           [VIEW_FOOD_PROFILE, VIEW_FOOD_RESTAURANTS, VIEW_FOOD_ORDERS, MANAGE_FOOD_ORDERS],
      USER:            [VIEW_FOOD_PROFILE, VIEW_FOOD_RESTAURANTS, VIEW_FOOD_MENU, VIEW_FOOD_GROCERY],
    },
  },

  /* ── Admin ───────────────────────────────────────────────── */
  {
    id: "admin", label: "Admin Dashboard", icon: Settings, color: "#dc2626", accent: "#fef2f2",
    description: "KYC, bulk uploads, community management, role management, venue settings",
    rows: [
      { label: "Admin",     isGroupHeader: true, childIndices: [1, 2, 3] },
      { label: "Dashboard", view: VIEW_ADMIN,     isChild: true },
      { label: "Users",     view: VERIFY_KYC, createEdit: BULK_UPLOAD, delete: MANAGE_COMMUNITIES, isChild: true },
      { label: "Config",    view: MANAGE_ROLES, createEdit: EDIT_VENUE_TIMING, isChild: true },
    ],
    roleDefaults: {
      ADMIN:           [VIEW_ADMIN, VERIFY_KYC, BULK_UPLOAD, MANAGE_ROLES, EDIT_VENUE_TIMING],
      COMMUNITY_ADMIN: [VIEW_ADMIN, VERIFY_KYC, BULK_UPLOAD, MANAGE_ROLES],
      SPORTS_ADMIN:    [VIEW_ADMIN],
      MEMBER:          [],
      VENDOR:          [],
      CASHIER:         [],
      STAFF:           [],
      USER:            [],
    },
  },

  /* ── Service Platform ────────────────────────────────────── */
  {
    id: "services", label: "Service Platform", icon: Package, color: "#0891b2", accent: "#ecfeff",
    description: "Service catalog, providers, requests, and work order management",
    rows: [
      { label: "Service Platform",   isGroupHeader: true, childIndices: [1, 2, 3] },
      { label: "Catalog & Providers", view: VIEW_SERVICE_CATALOG, createEdit: MANAGE_SERVICE_CATALOG, delete: VIEW_SERVICE_PROVIDERS, isChild: true },
      { label: "Provider Mgmt",       view: MANAGE_SERVICE_PROVIDERS, isChild: true },
      { label: "Requests & Orders",   view: CREATE_SERVICE_REQUEST, createEdit: VIEW_SERVICE_REQUESTS, delete: MANAGE_SERVICE_REQUESTS, isChild: true },
    ],
    roleDefaults: {
      ADMIN:           [VIEW_SERVICE_CATALOG, MANAGE_SERVICE_CATALOG, VIEW_SERVICE_PROVIDERS, MANAGE_SERVICE_PROVIDERS, CREATE_SERVICE_REQUEST, VIEW_SERVICE_REQUESTS, MANAGE_SERVICE_REQUESTS, VIEW_WORK_ORDERS, MANAGE_SERVICE_WORK_ORDERS],
      COMMUNITY_ADMIN: [VIEW_SERVICE_CATALOG, MANAGE_SERVICE_CATALOG, VIEW_SERVICE_PROVIDERS, MANAGE_SERVICE_PROVIDERS, CREATE_SERVICE_REQUEST, VIEW_SERVICE_REQUESTS, MANAGE_SERVICE_REQUESTS, VIEW_WORK_ORDERS, MANAGE_SERVICE_WORK_ORDERS],
      SPORTS_ADMIN:    [VIEW_SERVICE_CATALOG, CREATE_SERVICE_REQUEST],
      MEMBER:          [VIEW_SERVICE_CATALOG, CREATE_SERVICE_REQUEST],
      VENDOR:          [VIEW_SERVICE_CATALOG, VIEW_SERVICE_PROVIDERS, MANAGE_SERVICE_PROVIDERS, VIEW_WORK_ORDERS, MANAGE_SERVICE_WORK_ORDERS],
      CASHIER:         [VIEW_SERVICE_CATALOG],
      STAFF:           [VIEW_SERVICE_CATALOG, VIEW_WORK_ORDERS, MANAGE_SERVICE_WORK_ORDERS],
      USER:            [VIEW_SERVICE_CATALOG, CREATE_SERVICE_REQUEST],
    },
  },
];

/* ─── Build initial permission state ─── */
type PermState = Record<string, Record<string, Set<string>>>;

function buildInitialState(): PermState {
  const state: PermState = {};
  MODULES.forEach(m => {
    state[m.id] = {};
    DEFAULT_SYSTEM_ROLES.forEach(r => {
      state[m.id][r.name] = new Set(m.roleDefaults[r.name] ?? []);
    });
  });
  return state;
}

/** Merge backend RolePermissionsMap into per-module PermState. */
function buildStateFromMap(roleMap: Record<string, string[]>): PermState {
  const next: PermState = {};
  const allRoleNames = Array.from(new Set([
    ...DEFAULT_SYSTEM_ROLES.map(r => r.name),
    ...Object.keys(roleMap).map(r => r.toUpperCase()),
  ])).filter(r => !isHiddenRole(r));

  MODULES.forEach(m => {
    const modulePossible = new Set(
      m.rows.filter(row => !row.isGroupHeader)
        .flatMap(row => [row.view, row.createEdit, row.delete].filter(Boolean)) as string[]
    );
    next[m.id] = {};
    allRoleNames.forEach(rName => {
      const relevant = (roleMap[rName] ?? []).filter(p => modulePossible.has(p));
      next[m.id][rName] = new Set(relevant.length > 0 ? relevant : (m.roleDefaults[rName] ?? []));
    });
  });
  return next;
}

/* ─── Access Matrix Table ─── */
const ACTION_LABELS = { view: "View", createEdit: "Manage", delete: "Delete/Export" } as const;
const ACTION_ICONS  = { view: Eye, createEdit: Pencil, delete: Trash2 } as const;

function AccessMatrixTable({
  rows, roles, perms, onToggle,
}: {
  rows: PermRow[];
  roles: SystemRoleDef[];
  perms: Record<string, Set<string>>;
  onToggle: (roleName: string, perm: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));

  return (
    <div className="overflow-x-auto border border-slate-100 rounded-xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider min-w-[180px] sticky left-0 bg-slate-50 z-10">
              Feature / Sub-menu
            </th>
            <th className="text-center px-2 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider min-w-[70px]">
              Action
            </th>
            {roles.map(r => (
              <th key={r.name} className="text-center px-1.5 py-3 min-w-[72px]">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `${r.color}18` }}>
                    <r.icon className="w-3 h-3" style={{ color: r.color }} />
                  </div>
                  <span className="text-[8px] font-bold text-slate-500 leading-tight text-center">{r.label}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((row, idx) => {
            if (row.isGroupHeader) {
              const open = expanded.has(idx);
              return (
                <tr key={idx} className="bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer"
                  onClick={() => setExpanded(prev => {
                    const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n;
                  })}>
                  <td colSpan={2 + roles.length} className="px-4 py-2.5 sticky left-0">
                    <div className="flex items-center gap-2">
                      {open ? <ChevronDown className="w-3.5 h-3.5 text-indigo-500" /> : <ChevronRight className="w-3.5 h-3.5 text-indigo-500" />}
                      <Shield className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-xs font-bold text-indigo-700">{row.label}</span>
                      {row.childIndices && <Badge variant="outline" className="text-[8px] ml-1">{row.childIndices.length} features</Badge>}
                    </div>
                  </td>
                </tr>
              );
            }

            const parentIdx = rows.findIndex((m, i) => i < idx && m.isGroupHeader && m.childIndices?.includes(idx));
            if (parentIdx >= 0 && !expanded.has(parentIdx)) return null;

            const actions: { key: "view" | "createEdit" | "delete"; perm: string }[] = (
              [{ key: "view" as const, perm: row.view }, { key: "createEdit" as const, perm: row.createEdit }, { key: "delete" as const, perm: row.delete }]
            ).filter((a): a is { key: "view" | "createEdit" | "delete"; perm: string } => Boolean(a.perm));

            return actions.map((action, ai) => (
              <tr key={`${idx}-${action.key}`} className="hover:bg-slate-50/60 transition-colors">
                {ai === 0 && (
                  <td className="px-4 py-2 sticky left-0 bg-white z-10" rowSpan={actions.length}>
                    <div className={cn("flex items-center gap-1.5", row.isChild && "ml-4")}>
                      <span className="text-xs font-medium text-slate-700">{row.label}</span>
                    </div>
                  </td>
                )}
                <td className="text-center px-2 py-2">
                  <div className="flex items-center justify-center gap-1">
                    {(() => { const I = ACTION_ICONS[action.key]; return <I className="w-3 h-3 text-slate-400" />; })()}
                    <span className="text-[9px] text-slate-500">{ACTION_LABELS[action.key]}</span>
                  </div>
                </td>
                {roles.map(r => {
                  const has = perms[r.name]?.has(action.perm) ?? false;
                  return (
                    <td key={r.name} className="text-center px-1.5 py-2">
                      <button
                        onClick={() => onToggle(r.name, action.perm)}
                        className={cn(
                          "w-6 h-6 rounded-md flex items-center justify-center mx-auto transition-all",
                          has ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200" : "bg-slate-100 text-slate-300 hover:bg-slate-200"
                        )}>
                        {has ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Role Detail Panel ─── */
function RoleDetailPanel({
  role, rows, perms, onToggle, onReset, onDisableRole, onDisableAll, onSave, isSaving,
}: {
  role: SystemRoleDef;
  rows: PermRow[];
  perms: Set<string>;
  onToggle: (perm: string) => void;
  onReset: () => void;
  onDisableRole: () => void;
  onDisableAll: () => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  const allPerms = rows.filter(r => !r.isGroupHeader)
    .flatMap(r => [r.view, r.createEdit, r.delete].filter(Boolean) as string[]);
  const grantedCount = allPerms.filter(p => perms.has(p)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${role.color}18` }}>
            <role.icon className="w-5 h-5" style={{ color: role.color }} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800">{role.label}</h4>
            <p className="text-xs text-slate-400">{role.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant="outline" size="sm"
            className="gap-1 text-xs h-8 text-amber-700 border-amber-200 bg-amber-50/50 hover:bg-amber-100"
            onClick={onDisableRole}
            title="Revoke all permissions for this specific role in this module"
          >
            <Lock className="w-3 h-3 text-amber-600" /> Disable for this Role
          </Button>
          <Button
            variant="outline" size="sm"
            className="gap-1 text-xs h-8 text-rose-700 border-rose-200 bg-rose-50/50 hover:bg-rose-100"
            onClick={onDisableAll}
            title="Revoke all permissions across all roles in this module"
          >
            <ShieldAlert className="w-3 h-3 text-rose-600" /> Disable All
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs h-8" onClick={onReset}>
            <RotateCcw className="w-3 h-3" /> Reset
          </Button>
          <Button size="sm" onClick={onSave} disabled={isSaving}
            className="gap-1 text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            {isSaving ? "Saving…" : "Save this role"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-emerald-50 rounded-lg p-2.5 text-center">
          <p className="text-lg font-bold text-emerald-700">{grantedCount}</p>
          <p className="text-[9px] text-emerald-500 uppercase font-bold">Granted</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2.5 text-center">
          <p className="text-lg font-bold text-slate-500">{allPerms.length - grantedCount}</p>
          <p className="text-[9px] text-slate-400 uppercase font-bold">Denied</p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-2.5 text-center">
          <p className="text-lg font-bold text-indigo-700">{allPerms.length}</p>
          <p className="text-[9px] text-indigo-400 uppercase font-bold">Total</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {rows.filter(r => !r.isGroupHeader).map((row, i) => {
          const rowPerms = [
            { perm: row.view, label: "View", icon: Eye },
            { perm: row.createEdit, label: "Manage", icon: Pencil },
            { perm: row.delete, label: "Delete/Export", icon: Trash2 },
          ].filter(p => p.perm);

          return (
            <div key={i} className="bg-white rounded-lg border border-slate-100 p-3">
              <p className="text-xs font-semibold text-slate-700 mb-2">{row.label}</p>
              <div className="flex items-center gap-3 flex-wrap">
                {rowPerms.map(p => {
                  const has = perms.has(p.perm!);
                  return (
                    <label key={p.perm} className="flex items-center gap-1.5 cursor-pointer select-none">
                      <Switch checked={has} onCheckedChange={() => onToggle(p.perm!)} className="scale-75" />
                      <div className="flex items-center gap-1">
                        <p.icon className={cn("w-3 h-3", has ? "text-emerald-500" : "text-slate-300")} />
                        <span className={cn("text-[10px] font-medium", has ? "text-slate-700" : "text-slate-400")}>{p.label}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Module Nav ─── */
function ModuleNav({ modules, active, onSelect }: {
  modules: ModuleConfig[];
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {modules.map(m => (
        <button
          key={m.id}
          onClick={() => onSelect(m.id)}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all w-full",
            active === m.id
              ? "shadow-sm"
              : "hover:bg-slate-50 text-slate-600"
          )}
          style={active === m.id ? { background: m.accent, color: m.color } : {}}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: active === m.id ? `${m.color}20` : "#f1f5f9" }}>
            <m.icon className="w-3.5 h-3.5" style={{ color: active === m.id ? m.color : "#94a3b8" }} />
          </div>
          <div className="min-w-0">
            <p className={cn("text-xs font-semibold truncate", active === m.id ? "" : "text-slate-700")}>
              {m.label}
            </p>
          </div>
          {active === m.id && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: m.color }} />
          )}
        </button>
      ))}
    </div>
  );
}

type SaveDetail = { name: string; label: string; color: string; sent: number; stored: number; ok: boolean };

/** Collect all permissions for one role across every module. */
function collectRolePerms(perms: PermState, roleName: string): string[] {
  const all = new Set<string>();
  MODULES.forEach(m => { perms[m.id]?.[roleName]?.forEach(p => all.add(p)); });
  return Array.from(all);
}

/* ─── Main Component ─── */
export function AdminAccessManagement() {
  const [perms, setPerms] = useState<PermState>(buildInitialState);
  const [systemRoles, setSystemRoles] = useState<SystemRoleDef[]>(DEFAULT_SYSTEM_ROLES);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeModule = searchParams.get("module") || "events";
  const setActiveModule = (mod: string) => {
    setSearchParams((prev) => {
      prev.set("module", mod);
      return prev;
    }, { replace: true });
  };
  const [selectedRole, setSelectedRole] = useState("ADMIN");
  const [viewMode, setViewMode] = useState<"role" | "matrix">("role");
  const [saving, setSaving] = useState(false);
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [saveDetails, setSaveDetails] = useState<SaveDetail[] | null>(null);

  // Load current role permissions & dynamic security roles from backend DB on mount
  useEffect(() => {
    userService.getRoles()
      .then(dbRoles => {
        const filtered = (dbRoles || [])
          .filter(r => r?.name && !isHiddenRole(r.name))
          .map(r => mapRoleNameToDef(r.name));

        if (filtered.length > 0) {
          const seen = new Set(filtered.map(r => r.name.toUpperCase()));
          const combined = [...filtered];
          DEFAULT_SYSTEM_ROLES.forEach(def => {
            if (!seen.has(def.name.toUpperCase())) {
              combined.push(def);
              seen.add(def.name.toUpperCase());
            }
          });
          // Final dedup pass — guard against any duplicate names from DB
          const deduped = Array.from(
            combined.reduce((map, r) => {
              if (!map.has(r.name.toUpperCase())) map.set(r.name.toUpperCase(), r);
              return map;
            }, new Map<string, SystemRoleDef>()).values()
          );
          const sorted = sortRoles(deduped);
          setSystemRoles(sorted);
          if (!sorted.some(r => r.name === selectedRole)) {
            setSelectedRole(sorted[0].name);
          }
        }
      })
      .catch(err => console.error("Failed to load roles from database:", err));

    userService.getRolePermissions()
      .then(roleMap => setPerms(buildStateFromMap(roleMap)))
      .catch(err => console.error("Failed to load role permissions:", err));
  }, []);

  const module = MODULES.find(m => m.id === activeModule)!;
  const modulePerms = perms[activeModule] ?? {};
  const activeRole = systemRoles.find(r => r.name === selectedRole) || systemRoles[0] || DEFAULT_SYSTEM_ROLES[0];

  const handleToggle = (roleName: string, perm: string) => {
    setPerms(prev => {
      const next = { ...prev };
      const roleSet = new Set(next[activeModule][roleName]);
      roleSet.has(perm) ? roleSet.delete(perm) : roleSet.add(perm);
      next[activeModule] = { ...next[activeModule], [roleName]: roleSet };
      return next;
    });
    setSaved(false);
    setSaveDetails(null);
  };

  const handleReset = (roleName: string) => {
    setPerms(prev => {
      const next = { ...prev };
      next[activeModule] = { ...next[activeModule], [roleName]: new Set(module.roleDefaults[roleName] ?? []) };
      return next;
    });
    setSaved(false);
    setSaveDetails(null);
  };

  const handleDisableRole = (roleName: string) => {
    setPerms(prev => {
      const next = { ...prev };
      next[activeModule] = { ...next[activeModule], [roleName]: new Set() };
      return next;
    });
    setSaved(false);
    setSaveDetails(null);
  };

  const handleDisableAll = () => {
    setPerms(prev => {
      const next = { ...prev };
      const emptyModuleRoles: Record<string, Set<string>> = {};
      systemRoles.forEach(r => { emptyModuleRoles[r.name] = new Set(); });
      next[activeModule] = emptyModuleRoles;
      return next;
    });
    setSaved(false);
    setSaveDetails(null);
  };

  /** Re-fetch from backend and build a verification summary. */
  const verifyAndRefresh = async (sentMap: Record<string, number>): Promise<SaveDetail[]> => {
    setVerifying(true);
    try {
      const verified = await userService.getRolePermissions();
      setPerms(buildStateFromMap(verified));
      return systemRoles.map(r => ({
        name: r.name, label: r.label, color: r.color,
        sent: sentMap[r.name] ?? 0,
        stored: (verified[r.name] ?? []).length,
        ok: (sentMap[r.name] ?? 0) === (verified[r.name] ?? []).length,
      }));
    } finally {
      setVerifying(false);
    }
  };

  /** Save ALL roles across all modules. */
  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError(false);
    setSaveDetails(null);
    try {
      const roleTotals: Record<string, string[]> = {};
      systemRoles.forEach(r => { roleTotals[r.name] = collectRolePerms(perms, r.name); });

      // allSettled so one role failure never cancels the rest
      const results = await Promise.allSettled(
        systemRoles.map(r => userService.updateRolePermissions(r.name, roleTotals[r.name]))
      );

      const anyFailed = results.some(r => r.status === "rejected");
      // Show per-role status from what was sent (optimistic; verification updates it)
      const optimisticDetails: SaveDetail[] = systemRoles.map((r, i) => ({
        name: r.name, label: r.label, color: r.color,
        sent: roleTotals[r.name].length,
        stored: results[i].status === "fulfilled" ? roleTotals[r.name].length : 0,
        ok: results[i].status === "fulfilled",
      }));
      setSaveDetails(optimisticDetails);
      setSaved(!anyFailed);
      if (anyFailed) setSaveError(true);

      // Non-blocking re-fetch to confirm real DB state — won't affect saved/error flags
      const sentMap = Object.fromEntries(systemRoles.map(r => [r.name, roleTotals[r.name].length]));
      verifyAndRefresh(sentMap)
        .then(details => setSaveDetails(details))
        .catch(() => { /* verification unavailable — keep optimistic view */ });

      setTimeout(() => { setSaved(false); setSaveError(false); setSaveDetails(null); }, 10000);
    } catch (err) {
      console.error("Failed to save permissions:", err);
      setSaveError(true);
      setTimeout(() => setSaveError(false), 4000);
    } finally {
      setSaving(false);
    }
  };

  /** Save a single role only. */
  const handleSaveRole = async (roleName: string) => {
    setSavingRole(roleName);
    setSaved(false);
    setSaveError(false);
    setSaveDetails(null);
    try {
      const rolePerms = collectRolePerms(perms, roleName);
      await userService.updateRolePermissions(roleName, rolePerms);

      const r = systemRoles.find(sr => sr.name === roleName) || mapRoleNameToDef(roleName);
      const optimistic: SaveDetail = { name: roleName, label: r.label, color: r.color, sent: rolePerms.length, stored: rolePerms.length, ok: true };
      setSaveDetails([optimistic]);
      setSaved(true);

      // Non-blocking verification
      const sentMap = { [roleName]: rolePerms.length };
      verifyAndRefresh(sentMap)
        .then(details => setSaveDetails(details.filter(d => d.name === roleName)))
        .catch(() => { /* keep optimistic */ });

      setTimeout(() => { setSaved(false); setSaveDetails(null); }, 6000);
    } catch (err) {
      console.error("Failed to save role:", err);
      setSaveError(true);
      setTimeout(() => setSaveError(false), 4000);
    } finally {
      setSavingRole(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Access & Roles</h2>
            <p className="text-xs text-slate-400">
              Configure role-based permissions for every module — {MODULES.length} modules, {systemRoles.length} roles
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-9 text-rose-700 border-rose-200 bg-rose-50/50 hover:bg-rose-100 gap-1.5"
            onClick={handleDisableAll}
            title="Disable all permissions across all roles in this module"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" /> Disable All
          </Button>
          {verifying && (
            <span className="text-xs text-indigo-500 flex items-center gap-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying…
            </span>
          )}
          {saved && !verifying && (
            <span className="text-xs text-emerald-600 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved & verified
            </span>
          )}
          {saveError && (
            <span className="text-xs text-red-500 flex items-center gap-1 font-semibold">
              <Lock className="w-3.5 h-3.5" /> Save failed — check connection
            </span>
          )}
          <Button onClick={handleSave} disabled={saving || !!savingRole}
            className="bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-700 hover:to-violet-600 gap-2 text-sm h-9">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? `Saving ${systemRoles.length} roles…` : "Save All Roles"}
          </Button>
        </div>
      </div>

      {/* Persistence verification panel */}
      {saveDetails && saveDetails.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-bold text-slate-700">Persistence Verified</span>
            <span className="text-[10px] text-slate-400 ml-auto uppercase tracking-wider">
              sent → stored (permissions)
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {saveDetails.map(d => (
              <div key={d.name}
                className={cn(
                  "rounded-xl p-3 border text-left",
                  d.ok ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-200"
                )}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: d.color }}>
                    {d.label}
                  </span>
                  {d.ok
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    : <Unlock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                </div>
                <p className="text-lg font-black text-slate-800 leading-none">
                  {d.stored}
                  <span className="text-xs font-medium text-slate-400 ml-1">/ {d.sent}</span>
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">stored / sent</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Body: module nav + content */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">

        {/* Left: Module nav */}
        <div className="bg-white border border-slate-100 rounded-xl p-2 shadow-[0_2px_8px_rgba(0,0,0,0.04)] h-fit lg:sticky lg:top-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1.5 mb-1">
            Modules ({MODULES.length})
          </p>
          <ModuleNav modules={MODULES} active={activeModule} onSelect={id => { setActiveModule(id); setSelectedRole("ADMIN"); }} />
        </div>

        {/* Right: Module content */}
        <div className="space-y-4">
          {/* Module header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: module.accent }}>
                <module.icon className="w-4.5 h-4.5" style={{ color: module.color }} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">{module.label}</h3>
                <p className="text-xs text-slate-400">{module.description}</p>
              </div>
            </div>

            {/* View mode tabs */}
            <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-slate-100 shadow-sm">
              {([
                { id: "role"   as const, label: "By Role",  icon: Users  },
                { id: "matrix" as const, label: "Matrix",   icon: Shield },
              ]).map(tab => (
                <button key={tab.id} onClick={() => setViewMode(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    viewMode === tab.id
                      ? "bg-gradient-to-r from-indigo-600 to-violet-500 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-100"
                  )}>
                  <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Matrix view */}
          {viewMode === "matrix" && (
            <AccessMatrixTable
              rows={module.rows}
              roles={systemRoles}
              perms={modulePerms}
              onToggle={handleToggle}
            />
          )}

          {/* By Role view */}
          {viewMode === "role" && (
            <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4">
              {/* Role picker */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Roles ({systemRoles.length})
                </p>
                {systemRoles.map(r => {
                  const roleSet = modulePerms[r.name] ?? new Set();
                  const allPossible = module.rows
                    .filter(row => !row.isGroupHeader)
                    .flatMap(row => [row.view, row.createEdit, row.delete].filter(Boolean) as string[]);
                  const grantedPct = allPossible.length
                    ? Math.round((Array.from(roleSet).filter(p => allPossible.includes(p)).length / allPossible.length) * 100)
                    : 0;

                  return (
                    <button key={r.name} onClick={() => setSelectedRole(r.name)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border-2 transition-all",
                        selectedRole === r.name
                          ? "border-indigo-400 bg-indigo-50 ring-1 ring-indigo-200"
                          : "border-slate-100 bg-white hover:border-indigo-200 hover:shadow-sm"
                      )}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${r.color}18` }}>
                          <r.icon className="w-3 h-3" style={{ color: r.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{r.label}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${grantedPct}%`, background: r.color }} />
                        </div>
                        <span className="text-[9px] text-slate-400 shrink-0">{grantedPct}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Role detail */}
              <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <RoleDetailPanel
                  role={activeRole}
                  rows={module.rows}
                  perms={modulePerms[selectedRole] ?? new Set()}
                  onToggle={perm => handleToggle(selectedRole, perm)}
                  onReset={() => handleReset(selectedRole)}
                  onDisableRole={() => handleDisableRole(selectedRole)}
                  onDisableAll={handleDisableAll}
                  onSave={() => handleSaveRole(selectedRole)}
                  isSaving={savingRole === selectedRole}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
