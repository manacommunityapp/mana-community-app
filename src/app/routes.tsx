import { createBrowserRouter } from "react-router";
import { Layout } from "./components/commons/layout/Layout";
import { Feed } from "./components/community/Feed";
import { Marketplace } from "./components/marketplace/Marketplace";
import { Jobs } from "./components/jobs/Jobs";
import { Events } from "./components/events/Events";
import { Login } from "./components/commons/login/Login";
import { Signup } from "./components/Signup";
import { KYCVerification } from "./components/commons/verification/KYCVerification";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { AdminHub } from "./components/admin/AdminHub";
import { ExpensesDashboard } from "./components/finance/ExpensesDashboard";
import { Chat } from "./components/chat/Chat";
import AppFlowChatbot from "./components/chat/AppFlowChatbot";
import { AssetCheckout } from "./components/assets/AssetCheckout";
import { ExpenseUpload } from "./components/assets/ExpenseUpload";
import { TreasurerQueue } from "./components/assets/TreasurerQueue";
import { InventoryDashboard } from "./components/inventory/InventoryDashboard";
import { InventoryManagement } from "./components/inventory/InventoryManagement";

// Community Management grouped pages
import { ProcurementDashboard } from "./components/community/ProcurementDashboard";
import { MaintenanceDashboard } from "./components/community/MaintenanceDashboard";
import { AssetAuditDashboard } from "./components/community/AssetAuditDashboard";

// Finance Management grouped pages
import { InvoicesDashboard } from "./components/finance/InvoicesDashboard";
import { BudgetDashboard } from "./components/finance/BudgetDashboard";
import { FinancialReports } from "./components/finance/FinancialReports";
import { LedgerFinance } from "./components/finance/LedgerFinance";

import { AdminCreateUser } from "./components/admin/AdminCreateUser";
import { AdminBulkUpload } from "./components/admin/AdminBulkUpload";
import { AdminVenues } from "./components/admin/AdminVenues";
import { AdminCommunity } from "./components/admin/AdminCommunity";
import { AdminRoleManagement } from "./components/admin/AdminRoleManagement";
import { LogsDashboard } from "./components/admin/LogsDashboard";
import { AuditTrail } from "./components/admin/AuditTrail";
import { ProfileDashboard } from "./components/profile/ProfileDashboard";
import { ArchitectureDocs } from "./components/architecture/ArchitectureDocs";
import { RootErrorElement } from "./components/commons/error/RootErrorElement";
import { PermissionGuard } from "./components/commons/guards/PermissionGuard";

// Sports pages
import { SportsLayout }       from "./components/sports/SportsLayout";
import { SportsDashboard }    from "./components/sports/SportsDashboard";
import { SportsRegistration } from "./components/sports/SportsRegistration";
import { SportsSchedule }     from "./components/sports/SportsSchedule";
import { SportsAuction }      from "./components/sports/SportsAuction";
import { SportsAdmin }        from "./components/sports/admin/SportsAdmin";
import { SportsRegister }     from "./components/sports/SportsRegister";
import { MySports }           from "./components/sports/MySports";
import { SportsAnalytics }    from "./components/sports/SportsAnalytics";

import { VisitorManagement } from "./components/visitors/VisitorManagement";
import { NoticeBoard } from "./components/notices/NoticeBoard";
import { AmenityBooking } from "./components/bookings/AmenityBooking";
import { Helpdesk } from "./components/helpdesk/Helpdesk";
import { Polling } from "./components/polling/Polling";

// Permission constants
import {
  VIEW_FEED, VIEW_SPORTS_MENU, VIEW_EVENT_REGISTRATIONS,
  VIEW_LIVE_AUCTION, VIEW_AUCTION_CONFIG, VIEW_TEAMS_DASHBOARD,
  VIEW_PLAYER_POOL, VIEW_AUCTION_RESULTS,
  CREATE_EDIT_SPORTS_MAIN, VIEW_ADMIN, BULK_UPLOAD, MANAGE_COMMUNITIES,
  MANAGE_ROLES, VIEW_MARKETPLACE, VIEW_JOBS, VIEW_EVENTS, VIEW_VISITORS,
  VIEW_NOTICES, VIEW_AMENITIES, VIEW_TICKETS, VIEW_POLLS,
} from "../constants/permissions";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/signup",
    Component: Signup,
  },
  {
    path: "/kyc-verification",
    Component: KYCVerification,
  },
  {
    path: "/items/:id",
    Component: AssetCheckout,
  },
  {
    path: "/",
    Component: Layout,
    errorElement: <RootErrorElement />,
    children: [
      { 
        index: true, 
        element: <PermissionGuard permission={VIEW_FEED} requiredModule="COMMUNITY_FEED"><Feed /></PermissionGuard> 
      },
      {
        path: "sports",
        Component: SportsLayout,
        children: [
          { 
            index: true, 
            element: <PermissionGuard permission={VIEW_SPORTS_MENU} requiredModule="SPORTS"><SportsDashboard /></PermissionGuard> 
          },
          { 
            path: "my-sports", 
            element: <PermissionGuard permission={VIEW_EVENT_REGISTRATIONS} requiredModule="SPORTS"><MySports /></PermissionGuard> 
          },
          { 
            path: "register", 
            element: <PermissionGuard permission={VIEW_EVENT_REGISTRATIONS} requiredModule="SPORTS"><MySports /></PermissionGuard> 
          },
          {
            path: "register/:eventUuid",
            element: <PermissionGuard permission={VIEW_EVENT_REGISTRATIONS} requiredModule="SPORTS"><SportsRegister /></PermissionGuard>
          },
          {
            path: "schedule",
            element: <PermissionGuard permission={VIEW_SPORTS_MENU} requiredModule="SPORTS"><SportsSchedule /></PermissionGuard>
          },
          {
            path: "schedule/:eventId",
            element: <PermissionGuard permission={VIEW_SPORTS_MENU} requiredModule="SPORTS"><SportsSchedule /></PermissionGuard>
          },
          {
            path: "auction",
            element: <PermissionGuard anyPermissions={[VIEW_LIVE_AUCTION, VIEW_AUCTION_CONFIG, VIEW_TEAMS_DASHBOARD, VIEW_PLAYER_POOL, VIEW_EVENT_REGISTRATIONS, VIEW_AUCTION_RESULTS]} requiredModule="SPORTS"><SportsAuction /></PermissionGuard>
          },
          {
            path: "auction/:eventId",
            element: <PermissionGuard anyPermissions={[VIEW_LIVE_AUCTION, VIEW_AUCTION_CONFIG, VIEW_TEAMS_DASHBOARD, VIEW_PLAYER_POOL, VIEW_EVENT_REGISTRATIONS, VIEW_AUCTION_RESULTS]} requiredModule="SPORTS"><SportsAuction /></PermissionGuard>
          },
          { 
            path: "admin", 
            element: <PermissionGuard permission={CREATE_EDIT_SPORTS_MAIN} requiredModule="SPORTS"><SportsAdmin /></PermissionGuard> 
          },
          { 
            path: "analytics", 
            element: <PermissionGuard permission={VIEW_SPORTS_MENU} requiredModule="SPORTS"><SportsAnalytics /></PermissionGuard> 
          },
        ],
      },
      {
        path: "admin",
        children: [
          { 
            index: true, 
            element: <PermissionGuard permission={VIEW_ADMIN} requiredModule="ADMIN_HUB"><AdminHub /></PermissionGuard> 
          },
          { 
            path: "create-user", 
            element: <PermissionGuard permission={VIEW_ADMIN} requiredModule="ADMIN_HUB"><AdminCreateUser /></PermissionGuard> 
          },
          { 
            path: "bulk-upload", 
            element: <PermissionGuard permission={BULK_UPLOAD} requiredModule="ADMIN_HUB"><AdminBulkUpload /></PermissionGuard> 
          },
          { 
            path: "venues", 
            element: <PermissionGuard permission={VIEW_ADMIN} requiredModule="ADMIN_HUB"><AdminVenues /></PermissionGuard> 
          },
          { 
            path: "create-community", 
            element: <PermissionGuard permission={MANAGE_COMMUNITIES} requiredModule="ADMIN_HUB"><AdminCommunity /></PermissionGuard> 
          },
          { 
            path: "roles", 
            element: <PermissionGuard permission={MANAGE_ROLES} requiredModule="ADMIN_HUB"><AdminRoleManagement /></PermissionGuard> 
          },
          {
            path: "audit-logs",
            element: <PermissionGuard superAdminOnly><AuditTrail /></PermissionGuard>
          },
          {
            path: "expenses",
            element: <PermissionGuard permission={VIEW_ADMIN} requiredModule="ADMIN_HUB"><ExpensesDashboard /></PermissionGuard>
          },
        ]
      },
      {
        path: "marketplace",
        element: <PermissionGuard permission={VIEW_MARKETPLACE} requiredModule="MARKETPLACE"><Marketplace /></PermissionGuard>
      },
      {
        path: "visitors",
        element: <PermissionGuard permission={VIEW_VISITORS} requiredModule="VISITORS"><VisitorManagement /></PermissionGuard>
      },
      {
        path: "notices",
        element: <PermissionGuard permission={VIEW_NOTICES} requiredModule="NOTICES"><NoticeBoard /></PermissionGuard>
      },
      {
        path: "bookings",
        element: <PermissionGuard permission={VIEW_AMENITIES} requiredModule="BOOKINGS"><AmenityBooking /></PermissionGuard>
      },
      {
        path: "helpdesk",
        element: <PermissionGuard permission={VIEW_TICKETS} requiredModule="HELPDESK"><Helpdesk /></PermissionGuard>
      },
      {
        path: "polls",
        element: <PermissionGuard permission={VIEW_POLLS} requiredModule="POLLS"><Polling /></PermissionGuard>
      },
      {
        path: "jobs", 
        element: <PermissionGuard permission={VIEW_JOBS} requiredModule="JOBS"><Jobs /></PermissionGuard> 
      },
      { 
        path: "events", 
        element: <PermissionGuard permission={VIEW_EVENTS} requiredModule="EVENTS"><Events /></PermissionGuard> 
      },
      { 
        path: "inventory", 
        element: <InventoryDashboard /> 
      },
      {
        path: "community",
        children: [
          {
            path: "inventory",
            element: <PermissionGuard requiredModule="COMMUNITY_MGMT"><InventoryDashboard /></PermissionGuard>
          },
          {
            path: "inventory-management",
            element: <PermissionGuard requiredModule="COMMUNITY_MGMT"><InventoryManagement /></PermissionGuard>
          },
          {
            path: "procurement",
            element: <PermissionGuard permission={VIEW_ADMIN} requiredModule="COMMUNITY_MGMT"><ProcurementDashboard /></PermissionGuard>
          },
          {
            path: "maintenance",
            element: <PermissionGuard permission={VIEW_ADMIN} requiredModule="COMMUNITY_MGMT"><MaintenanceDashboard /></PermissionGuard>
          },
          {
            path: "audit",
            element: <PermissionGuard permission={VIEW_ADMIN} requiredModule="COMMUNITY_MGMT"><AssetAuditDashboard /></PermissionGuard>
          }
        ]
      },
      {
        path: "finance",
        children: [
          {
            path: "expenses",
            element: <PermissionGuard permission={VIEW_ADMIN} requiredModule="FINANCE_MGMT"><LedgerFinance section="expense" /></PermissionGuard>
          },
          {
            path: "invoices",
            element: <PermissionGuard permission={VIEW_ADMIN} requiredModule="FINANCE_MGMT"><LedgerFinance section="invoice" /></PermissionGuard>
          },
          {
            path: "budget",
            element: <PermissionGuard permission={VIEW_ADMIN} requiredModule="FINANCE_MGMT"><BudgetDashboard /></PermissionGuard>
          },
          {
            path: "reports",
            element: <PermissionGuard permission={VIEW_ADMIN} requiredModule="FINANCE_MGMT"><FinancialReports /></PermissionGuard>
          }
        ]
      },
      {
        path: "chat",
        element: <Chat />,
      },
      {
        path: "flow-chatbot",
        element: <AppFlowChatbot />,
      },
      {
        path: "profile",
        Component: ProfileDashboard
      },
      {
        path: "architecture",
        element: <PermissionGuard permission={VIEW_ADMIN}><ArchitectureDocs /></PermissionGuard>,
      },
      {
        path: "architecture/logs",
        element: <PermissionGuard permission={VIEW_ADMIN} requiredModule="ADMIN_HUB"><LogsDashboard /></PermissionGuard>
      },
    ],
  },
]);

