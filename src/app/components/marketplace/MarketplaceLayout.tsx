import { Outlet, useNavigate, useLocation } from "react-router";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Store, Heart, Package, Gift, Search as SearchIcon, User } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { CREATE_LISTING } from "../../../constants/permissions";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function MarketplaceLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useAuth();

  const tabs = [
    { path: "/marketplace", label: "Browse", icon: Store, exact: true },
    { path: "/marketplace/wishlist", label: "Wishlist", icon: Heart },
    { path: "/marketplace/orders", label: "Orders", icon: Package },
    { path: "/marketplace/donations", label: "Donations", icon: Gift },
    { path: "/marketplace/lost-found", label: "Lost & Found", icon: SearchIcon },
  ];

  // Add "My Listings" tab if user can create
  if (hasPermission(CREATE_LISTING)) {
    tabs.splice(1, 0, { path: "/marketplace/my-listings", label: "My Listings", icon: User });
  }

  const isActive = (tab: typeof tabs[0]) => {
    if (tab.exact) return location.pathname === tab.path;
    return location.pathname.startsWith(tab.path);
  };

  return (
    <div className="min-h-screen font-sans">
      {/* Header */}
      <div className="px-6 pt-6 pb-0">
        <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Resident Portal</span>
        <h1 className="text-3xl font-black text-[#0d0d2b] mt-1">Community Marketplace</h1>
        <p className="text-[#6b7094] text-sm mt-1">Buy, sell, donate, and connect with verified neighbors.</p>
      </div>

      {/* Tab Bar */}
      <div className="px-6 mt-6 border-b border-slate-200">
        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab);
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer",
                  active
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-[#6b7094] hover:text-[#0d0d2b] hover:border-slate-300"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Page Content */}
      <div className="p-6">
        <Outlet />
      </div>
    </div>
  );
}
