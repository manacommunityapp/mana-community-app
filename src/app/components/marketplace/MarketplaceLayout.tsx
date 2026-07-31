import { Outlet, useNavigate, useLocation } from "react-router";
import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  LayoutDashboard, ShoppingBag, Store, Wrench, Home, Utensils, Zap,
  ShoppingCart, Package, Gift, Search as SearchIcon, Heart, User,
  Sun, Moon
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { CREATE_LISTING } from "../../../constants/permissions";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function MarketplaceLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasPermission } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  };

  const currentTabParam = new URLSearchParams(location.search).get("tab") || "dashboard";

  const allTabs = [
    { id: "dashboard", label: "Dashboard", path: "/marketplace", icon: LayoutDashboard, exact: true },
    { id: "products", label: "Products", path: "/marketplace?tab=products", icon: Store },
    { id: "vendors", label: "Vendors", path: "/marketplace?tab=vendors", icon: ShoppingBag },
    { id: "services", label: "Services", path: "/marketplace?tab=services", icon: Wrench },
    { id: "rentals", label: "Rentals", path: "/marketplace?tab=rentals", icon: Home },
    { id: "food", label: "Homemade Food", path: "/marketplace?tab=food", icon: Utensils },
    { id: "deals", label: "Deals", path: "/marketplace?tab=deals", icon: Zap },
    { id: "cart", label: "Cart", path: "/marketplace?tab=cart", icon: ShoppingCart },
    { id: "orders", label: "Orders", path: "/marketplace/orders", icon: Package },
    { id: "donate", label: "Donations", path: "/marketplace/donations", icon: Gift },
    { id: "lostfound", label: "Lost & Found", path: "/marketplace/lost-found", icon: SearchIcon },
    { id: "wishlist", label: "Wishlist", path: "/marketplace/wishlist", icon: Heart },
  ];

  if (hasPermission(CREATE_LISTING)) {
    allTabs.splice(11, 0, { id: "my-listings", label: "My Listings", path: "/marketplace/my-listings", icon: User });
  }

  const isTabActive = (tab: typeof allTabs[0]) => {
    if (tab.path.includes("?tab=")) {
      return location.pathname === "/marketplace" && currentTabParam === tab.id;
    }
    if (tab.exact) {
      return location.pathname === "/marketplace" && !location.search;
    }
    return location.pathname.startsWith(tab.path);
  };

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "RM";

  return (
    <div className={cn("min-h-screen font-sans bg-[#F8F7FC] text-[#1A1A2E] transition-colors duration-200", isDark && "dark bg-[#16162A] text-[#F0EFF5]")}>
      
      {/* ── Marketplace Topbar ── */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-[#1E1E36]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 h-16 flex items-center justify-between gap-4 shadow-sm">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => navigate("/marketplace")}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20">
            M
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              Mana<span className="text-indigo-600 dark:text-indigo-400">Market</span>
            </span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Community Hub</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md relative">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products, services, food, rentals..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-slate-100/80 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-full focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400 transition-all text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

      </div>

      {/* ── Single Main Navigation Menu Bar (HTML Mockup) ── */}
      <div className="bg-white dark:bg-[#1E1E36] border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar -mb-px">
          {allTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isTabActive(tab);
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer",
                  active
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Page Content Outlet ── */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <Outlet />
      </div>
    </div>
  );
}
