import { NavLink, Outlet } from "react-router";
import { useState } from "react";
import {
  UtensilsCrossed, ChefHat, ShoppingCart, Package, CalendarDays,
  BookOpen, Heart, PartyPopper, Refrigerator, Truck, Search,
  Bell, LayoutDashboard, Menu, X
} from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

const foodTabs = [
  { to: "/food", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/food/restaurants", icon: UtensilsCrossed, label: "Restaurants" },
  { to: "/food/home-chefs", icon: ChefHat, label: "Home Chefs" },
  { to: "/food/orders", icon: ShoppingCart, label: "Orders" },
  { to: "/food/subscriptions", icon: Package, label: "Subscriptions" },
  { to: "/food/grocery", icon: ShoppingCart, label: "Grocery" },
  { to: "/food/recipes", icon: BookOpen, label: "Recipes" },
  { to: "/food/nutrition", icon: Heart, label: "Nutrition" },
  { to: "/food/dining", icon: CalendarDays, label: "Dining" },
  { to: "/food/events", icon: PartyPopper, label: "Events" },
  { to: "/food/pantry", icon: Refrigerator, label: "Pantry" },
  { to: "/food/catering", icon: Truck, label: "Catering" },
];

export function FoodLayout() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Brand */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-base font-extrabold tracking-tight leading-tight">
                  Mana<span className="text-orange-600 dark:text-orange-400">Food</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Community Kitchen
                </span>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search restaurants, recipes, groceries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 h-9 text-sm bg-slate-100/80 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-full"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-red-500 text-white border-0">
                  3
                </Badge>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <ScrollArea className="w-full">
              <div className="flex items-center gap-1 -mb-px">
                {foodTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <NavLink
                      key={tab.to}
                      to={tab.to}
                      end={tab.end}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                          isActive
                            ? "border-orange-600 text-orange-600 dark:text-orange-400 dark:border-orange-400 bg-orange-50/50 dark:bg-orange-950/20"
                            : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600"
                        }`
                      }
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </NavLink>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>

        {/* Mobile Expanded Menu */}
        {showMobileMenu && (
          <div className="sm:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 grid grid-cols-3 gap-2">
            {foodTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.end}
                  onClick={() => setShowMobileMenu(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 p-3 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400"
                        : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </NavLink>
              );
            })}
          </div>
        )}
      </div>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <Outlet />
      </div>
    </div>
  );
}
