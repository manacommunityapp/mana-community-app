import { createBrowserRouter } from "react-router";
import { Layout } from "./components/commons/layout/Layout";
import { Feed } from "./components/community/Feed";
import { Marketplace } from "./components/marketplace/Marketplace";
import { MarketplaceLayout } from "./components/marketplace/MarketplaceLayout";
import { ProductDetail } from "./components/marketplace/ProductDetail";
import { MyListings } from "./components/marketplace/MyListings";
import { WishlistPage } from "./components/marketplace/WishlistPage";
import { OrdersPage } from "./components/marketplace/OrdersPage";
import { DonationsPage } from "./components/marketplace/DonationsPage";
import { LostAndFoundPage } from "./components/marketplace/LostAndFoundPage";
import { Jobs } from "./components/jobs/Jobs";
import { Events } from "./components/events/Events.legacy";
import { EventsLayout } from "./components/events/EventsLayout";
import { EventsDashboard } from "./components/events/EventsDashboard";
import { EventsSchedule } from "./components/events/EventsSchedule";
import { EventsRegistrationHub } from "./components/events/EventsRegistrationHub";
import { EventsPeople } from "./components/events/EventsPeople";
import { EventsFundraising } from "./components/events/EventsFundraising";
import { EventsOperations } from "./components/events/EventsOperations";
import { EventsMediaReports } from "./components/events/EventsMediaReports";

import { EventsAccessManagement } from "./components/events/EventsAccessManagement";
import { EventEditor } from "./components/events/EventEditor";
import { EventPublicRegistration } from "./components/events/EventPublicRegistration";
import { Login } from "./components/commons/login/Login";
import { Signup } from "./components/commons/login/Signup";
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
import { EmailTemplateBuilder } from "./components/admin/EmailTemplateBuilder";
import { ProfileDashboard } from "./components/profile/ProfileDashboard";
import { ArchitectureDocs } from "./components/architecture/ArchitectureDocs";
import { RootErrorElement } from "./components/commons/error/RootErrorElement";
import { PermissionGuard } from "./components/commons/guards/PermissionGuard";

// CPN (Community Professional Network) pages
import { CPNHub } from "./components/cpn/CPNHub";
import { CPNFeed } from "./components/cpn/CPNFeed";
import { CPNJobs } from "./components/cpn/CPNJobs";
import { CPNMentorship } from "./components/cpn/CPNMentorship";
import { CPNAIAssistant } from "./components/cpn/CPNAIAssistant";
import {
  CPNReferrals, CPNFreelance, CPNLearning, CPNCompanies,
  CPNBusiness, CPNStartups, CPNCollaborate, CPNResume,
  CPNGamification, CPNAnalytics, CPNNetwork
} from "./components/cpn/CPNSubViews";

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
import { ResourceBookingDashboard } from "./components/bookings/ResourceBookingDashboard";
import { ResourceAdmin } from "./components/bookings/admin/ResourceAdmin";
import { Helpdesk } from "./components/helpdesk/Helpdesk";
import { Polling } from "./components/polling/Polling";

// Vendor Management System pages
import { VendorAdminLayout } from "./components/vendor/admin/VendorAdminLayout";
import { VendorDashboard as VendorAdminDashboard } from "./components/vendor/admin/VendorDashboard";
import { VendorDirectory } from "./components/vendor/admin/VendorDirectory";
import { VendorRegistrations } from "./components/vendor/admin/VendorRegistrations";
import { VendorCategories } from "./components/vendor/admin/VendorCategories";
import { WorkOrdersManagement } from "./components/vendor/admin/WorkOrdersManagement";
import { ContractsManagement } from "./components/vendor/admin/ContractsManagement";
import { PaymentsManagement } from "./components/vendor/admin/PaymentsManagement";
import { VendorAnalytics } from "./components/vendor/admin/VendorAnalytics";
import { VendorPortalLayout } from "./components/vendor/portal/VendorPortalLayout";
import { VendorPortalDashboard } from "./components/vendor/portal/VendorPortalDashboard";
import { MyServices } from "./components/vendor/portal/MyServices";
import { MyBookings } from "./components/vendor/portal/MyBookings";
import { MyAvailability } from "./components/vendor/portal/MyAvailability";
import { MyPayments } from "./components/vendor/portal/MyPayments";
import { MyDocuments } from "./components/vendor/portal/MyDocuments";
import { MyRatings } from "./components/vendor/portal/MyRatings";
import { VendorProfile } from "./components/vendor/portal/VendorProfile";
import { ServiceMarketplace } from "./components/vendor/marketplace/ServiceMarketplace";
import { VendorProfilePublic } from "./components/vendor/marketplace/VendorProfilePublic";
import { BookingFlow } from "./components/vendor/marketplace/BookingFlow";
import { MyBookingsResident } from "./components/vendor/marketplace/MyBookingsResident";
import { FavoriteVendors } from "./components/vendor/marketplace/FavoriteVendors";

// Food & Lifestyle OS pages
import { FoodLayout } from "./components/food/FoodLayout";
import { FoodDashboard } from "./components/food/FoodDashboard";
import { RestaurantBrowse } from "./components/food/RestaurantBrowse";
import { RestaurantDetail } from "./components/food/RestaurantDetail";
import { HomeChefMarketplace } from "./components/food/HomeChefMarketplace";
import { FoodOrders } from "./components/food/FoodOrders";
import { MealSubscriptions } from "./components/food/MealSubscriptions";
import { GroceryMarketplace } from "./components/food/GroceryMarketplace";
import { RecipePlatform } from "./components/food/RecipePlatform";
import { NutritionTracker } from "./components/food/NutritionTracker";
import { DiningReservations } from "./components/food/DiningReservations";
import { FoodEvents } from "./components/food/FoodEvents";
import { SmartPantry } from "./components/food/SmartPantry";
import { CateringPlatform } from "./components/food/CateringPlatform";
import { FoodProfile } from "./components/food/FoodProfile";
import { FoodAnalyticsDashboard } from "./components/food/FoodAnalyticsDashboard";

// CPOS (Community Property Operating System) modules
import CPOSDashboardPage from "./components/cpos/dashboard/DashboardPage";
import CPOSPropertyListPage from "./components/cpos/property/PropertyListPage";
import CPOSPropertyDetailPage from "./components/cpos/property/PropertyDetailPage";
import CPOSPropertyCreatePage from "./components/cpos/property/PropertyCreatePage";
import CPOSOwnershipPage from "./components/cpos/ownership/OwnershipPage";
import CPOSOccupancyPage from "./components/cpos/occupancy/OccupancyPage";
import CPOSResidentsPage from "./components/cpos/occupancy/ResidentsPage";
import CPOSFinanceDashboard from "./components/cpos/finance/FinanceDashboard";
import CPOSAIAdvisorPage from "./components/cpos/ai/AIAdvisorPage";
import CPOSAnalyticsDashboard from "./components/cpos/analytics/AnalyticsDashboard";
import CPOSDocumentVault from "./components/cpos/documents/DocumentVault";
import CPOSCRMPipelinePage from "./components/cpos/crm/CRMPipelinePage";

// CPN (Community Professional Network) modules


// Service Platform pages
import { ServicesLayout } from "./components/services/ServicesLayout";
import { ServiceBrowse } from "./components/services/ServiceBrowse";
import { MyRequests } from "./components/services/MyRequests";
import { ProviderDashboard } from "./components/services/ProviderDashboard";
import { AdminServices } from "./components/services/AdminServices";

// Permission constants
import {
  VIEW_FEED, VIEW_SPORTS_MENU, VIEW_EVENT_REGISTRATIONS,
  VIEW_LIVE_AUCTION, VIEW_AUCTION_CONFIG, VIEW_TEAMS_DASHBOARD,
  VIEW_PLAYER_POOL, VIEW_AUCTION_RESULTS,
  CREATE_EDIT_SPORTS_MAIN, VIEW_ADMIN, BULK_UPLOAD, MANAGE_COMMUNITIES,
  MANAGE_ROLES, VIEW_MARKETPLACE, CREATE_LISTING, VIEW_JOBS, VIEW_EVENTS, REGISTER_EVENT, VIEW_VISITORS,
  VIEW_NOTICES, VIEW_AMENITIES, VIEW_TICKETS, VIEW_POLLS,
  VIEW_VENDOR_MANAGEMENT, MANAGE_VENDORS, BOOK_VENDOR_SERVICE,
  MANAGE_WORK_ORDERS, MANAGE_CONTRACTS, MANAGE_VENDOR_PAYMENTS,
  VIEW_VENDOR_ANALYTICS,
  VIEW_RESOURCE_BOOKING, MANAGE_RESOURCES,
  VIEW_FOOD_RESTAURANTS, VIEW_FOOD_ORDERS, VIEW_FOOD_SUBSCRIPTIONS,
  VIEW_FOOD_GROCERY, VIEW_FOOD_RECIPES, VIEW_FOOD_NUTRITION,
  VIEW_FOOD_DINING, VIEW_FOOD_EVENTS, VIEW_FOOD_PANTRY,
  VIEW_FOOD_CATERING, VIEW_FOOD_PROFILE, VIEW_FOOD_ANALYTICS,
  VIEW_FOOD_HOME_CHEFS,
  VIEW_SERVICE_CATALOG, VIEW_SERVICE_REQUESTS, MANAGE_SERVICE_CATALOG,
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
    path: "/event-register/:eventId?",
    Component: EventPublicRegistration,
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
          {
            path: "email-templates",
            element: <PermissionGuard permission={VIEW_ADMIN} requiredModule="ADMIN_HUB"><EmailTemplateBuilder /></PermissionGuard>
          },
        ]
      },
      {
        path: "marketplace",
        element: <PermissionGuard permission={VIEW_MARKETPLACE} requiredModule="MARKETPLACE"><MarketplaceLayout /></PermissionGuard>,
        children: [
          { index: true, Component: Marketplace },
          { path: ":id", Component: ProductDetail },
          {
            path: "my-listings",
            element: <PermissionGuard permission={CREATE_LISTING} requiredModule="MARKETPLACE"><MyListings /></PermissionGuard>,
          },
          { path: "wishlist", Component: WishlistPage },
          { path: "orders", Component: OrdersPage },
          { path: "donations", Component: DonationsPage },
          { path: "lost-found", Component: LostAndFoundPage },
        ],
      },
      {
        path: "services",
        element: <PermissionGuard permission={VIEW_SERVICE_CATALOG} requiredModule="SERVICE_PLATFORM"><ServicesLayout /></PermissionGuard>,
        children: [
          { index: true, Component: ServiceBrowse },
          {
            path: "requests",
            element: <PermissionGuard permission={VIEW_SERVICE_REQUESTS} requiredModule="SERVICE_PLATFORM"><MyRequests /></PermissionGuard>,
          },
          {
            path: "requests/:id",
            element: <PermissionGuard permission={VIEW_SERVICE_REQUESTS} requiredModule="SERVICE_PLATFORM"><MyRequests /></PermissionGuard>,
          },
          { path: "provider", Component: ProviderDashboard },
          {
            path: "admin",
            element: <PermissionGuard permission={MANAGE_SERVICE_CATALOG} requiredModule="SERVICE_PLATFORM"><AdminServices /></PermissionGuard>,
          },
        ],
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
        element: <PermissionGuard permission={VIEW_RESOURCE_BOOKING} requiredModule="BOOKINGS"><ResourceBookingDashboard /></PermissionGuard>
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
        element: <PermissionGuard requiredModule="EVENTS"><EventsLayout /></PermissionGuard>,
        children: [
          { index: true, element: <PermissionGuard permission={VIEW_EVENTS}><EventsDashboard /></PermissionGuard> },
          { path: "schedule", element: <PermissionGuard permission={VIEW_EVENTS}><EventsSchedule /></PermissionGuard> },
          { path: "registration", element: <PermissionGuard anyPermissions={[VIEW_EVENTS, REGISTER_EVENT]}><EventsRegistrationHub /></PermissionGuard> },
          { path: "people", element: <PermissionGuard permission={VIEW_EVENTS}><EventsPeople /></PermissionGuard> },
          { path: "fundraising", element: <PermissionGuard permission={VIEW_EVENTS}><EventsFundraising /></PermissionGuard> },
          { path: "operations", element: <PermissionGuard permission={VIEW_EVENTS}><EventsOperations /></PermissionGuard> },
          { path: "media", element: <EventsMediaReports /> },
          { path: "access", element: <PermissionGuard permission={MANAGE_ROLES}><EventsAccessManagement /></PermissionGuard> },
          { path: "create", element: <EventEditor /> },
          { path: ":id/edit", element: <EventEditor /> },
        ],
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
          },
          {
            path: "resource-booking",
            element: <PermissionGuard permission={MANAGE_RESOURCES} requiredModule="BOOKINGS"><ResourceAdmin /></PermissionGuard>
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
        path: "vendor-admin",
        element: <PermissionGuard permission={VIEW_VENDOR_MANAGEMENT} requiredModule="VENDOR_MANAGEMENT"><VendorAdminLayout /></PermissionGuard>,
        children: [
          { index: true, Component: VendorAdminDashboard },
          { path: "vendors", Component: VendorDirectory },
          { path: "registrations", element: <PermissionGuard permission={MANAGE_VENDORS}><VendorRegistrations /></PermissionGuard> },
          { path: "categories", element: <PermissionGuard permission={MANAGE_VENDORS}><VendorCategories /></PermissionGuard> },
          { path: "work-orders", element: <PermissionGuard permission={MANAGE_WORK_ORDERS}><WorkOrdersManagement /></PermissionGuard> },
          { path: "contracts", element: <PermissionGuard permission={MANAGE_CONTRACTS}><ContractsManagement /></PermissionGuard> },
          { path: "payments", element: <PermissionGuard permission={MANAGE_VENDOR_PAYMENTS}><PaymentsManagement /></PermissionGuard> },
          { path: "analytics", element: <PermissionGuard permission={VIEW_VENDOR_ANALYTICS}><VendorAnalytics /></PermissionGuard> },
        ],
      },
      {
        path: "vendor-portal",
        element: <PermissionGuard permission={VIEW_VENDOR_MANAGEMENT}><VendorPortalLayout /></PermissionGuard>,
        children: [
          { index: true, Component: VendorPortalDashboard },
          { path: "services", Component: MyServices },
          { path: "bookings", Component: MyBookings },
          { path: "availability", Component: MyAvailability },
          { path: "payments", Component: MyPayments },
          { path: "documents", Component: MyDocuments },
          { path: "ratings", Component: MyRatings },
          { path: "profile", Component: VendorProfile },
        ],
      },
      {
        path: "vendor-marketplace",
        children: [
          {
            index: true,
            element: <PermissionGuard permission={BOOK_VENDOR_SERVICE} requiredModule="VENDOR_MANAGEMENT"><ServiceMarketplace /></PermissionGuard>,
          },
          {
            path: "vendor/:vendorId",
            element: <PermissionGuard permission={BOOK_VENDOR_SERVICE} requiredModule="VENDOR_MANAGEMENT"><VendorProfilePublic /></PermissionGuard>,
          },
          {
            path: "vendor/:vendorId/book/:serviceId",
            element: <PermissionGuard permission={BOOK_VENDOR_SERVICE} requiredModule="VENDOR_MANAGEMENT"><BookingFlow /></PermissionGuard>,
          },
          {
            path: "my-bookings",
            element: <PermissionGuard permission={BOOK_VENDOR_SERVICE} requiredModule="VENDOR_MANAGEMENT"><MyBookingsResident /></PermissionGuard>,
          },
          {
            path: "favorites",
            element: <PermissionGuard permission={BOOK_VENDOR_SERVICE} requiredModule="VENDOR_MANAGEMENT"><FavoriteVendors /></PermissionGuard>,
          },
        ],
      },
      {
        path: "food",
        element: <PermissionGuard permission={VIEW_FOOD_RESTAURANTS} requiredModule="FOOD_OS"><FoodLayout /></PermissionGuard>,
        children: [
          { index: true, Component: FoodDashboard },
          { path: "restaurants", Component: RestaurantBrowse },
          { path: "restaurants/:restaurantId", Component: RestaurantDetail },
          { path: "home-chefs", element: <PermissionGuard permission={VIEW_FOOD_HOME_CHEFS}><HomeChefMarketplace /></PermissionGuard> },
          { path: "orders", element: <PermissionGuard permission={VIEW_FOOD_ORDERS}><FoodOrders /></PermissionGuard> },
          { path: "subscriptions", element: <PermissionGuard permission={VIEW_FOOD_SUBSCRIPTIONS}><MealSubscriptions /></PermissionGuard> },
          { path: "grocery", element: <PermissionGuard permission={VIEW_FOOD_GROCERY}><GroceryMarketplace /></PermissionGuard> },
          { path: "recipes", element: <PermissionGuard permission={VIEW_FOOD_RECIPES}><RecipePlatform /></PermissionGuard> },
          { path: "nutrition", element: <PermissionGuard permission={VIEW_FOOD_NUTRITION}><NutritionTracker /></PermissionGuard> },
          { path: "dining", element: <PermissionGuard permission={VIEW_FOOD_DINING}><DiningReservations /></PermissionGuard> },
          { path: "events", element: <PermissionGuard permission={VIEW_FOOD_EVENTS}><FoodEvents /></PermissionGuard> },
          { path: "pantry", element: <PermissionGuard permission={VIEW_FOOD_PANTRY}><SmartPantry /></PermissionGuard> },
          { path: "catering", element: <PermissionGuard permission={VIEW_FOOD_CATERING}><CateringPlatform /></PermissionGuard> },
          { path: "profile", element: <PermissionGuard permission={VIEW_FOOD_PROFILE}><FoodProfile /></PermissionGuard> },
          { path: "analytics", element: <PermissionGuard permission={VIEW_FOOD_ANALYTICS}><FoodAnalyticsDashboard /></PermissionGuard> },
        ],
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
        path: "cpn",
        element: <PermissionGuard permission={VIEW_JOBS} requiredModule="JOBS"><CPNHub /></PermissionGuard>,
        children: [
          { index: true, element: <CPNFeed /> },
          { path: "feed", element: <CPNFeed /> },
          { path: "profile", element: <ProfileDashboard /> },
          { path: "network", element: <CPNNetwork /> },
          { path: "jobs", element: <CPNJobs /> },
          { path: "referrals", element: <CPNReferrals /> },
          { path: "freelance", element: <CPNFreelance /> },
          { path: "mentorship", element: <CPNMentorship /> },
          { path: "learning", element: <CPNLearning /> },
          { path: "companies", element: <CPNCompanies /> },
          { path: "business", element: <CPNBusiness /> },
          { path: "startups", element: <CPNStartups /> },
          { path: "events", element: <Events /> },
          { path: "collaborate", element: <CPNCollaborate /> },
          { path: "resume", element: <CPNResume /> },
          { path: "ai-assistant", element: <CPNAIAssistant /> },
          { path: "messages", element: <Chat /> },
          { path: "gamification", element: <CPNGamification /> },
          { path: "analytics", element: <CPNAnalytics /> },
        ]
      },
      {
        path: "architecture",
        element: <PermissionGuard permission={VIEW_ADMIN}><ArchitectureDocs /></PermissionGuard>,
      },
      {
        path: "architecture/logs",
        element: <PermissionGuard permission={VIEW_ADMIN} requiredModule="ADMIN_HUB"><LogsDashboard /></PermissionGuard>
      },
      // ── CPOS (Community Property Operating System) Routes ─────────
      { path: "cpos", element: <CPOSDashboardPage /> },
      { path: "cpos/properties", element: <CPOSPropertyListPage /> },
      { path: "cpos/properties/new", element: <CPOSPropertyCreatePage /> },
      { path: "cpos/properties/:propertyCode", element: <CPOSPropertyDetailPage /> },
      { path: "cpos/ownership", element: <CPOSOwnershipPage /> },
      { path: "cpos/occupancy", element: <CPOSOccupancyPage /> },
      { path: "cpos/residents", element: <CPOSResidentsPage /> },
      { path: "cpos/finance", element: <CPOSFinanceDashboard /> },
      { path: "cpos/ai", element: <CPOSAIAdvisorPage /> },
      { path: "cpos/analytics", element: <CPOSAnalyticsDashboard /> },
      { path: "cpos/documents", element: <CPOSDocumentVault /> },
      { path: "cpos/crm", element: <CPOSCRMPipelinePage /> },
    ],
  },
]);

