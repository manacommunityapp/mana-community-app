import { NavLink, Outlet, useLocation } from "react-router";
import {
  GraduationCap,
  Compass,
  BookOpen,
  Sparkles,
  Users,
  ShieldCheck,
  PlusCircle,
} from "lucide-react";

export function AcademyLayout() {
  const location = useLocation();

  const navItems = [
    { to: "/academy", label: "Explore Programs", icon: Compass, end: true },
    { to: "/academy/my-learning", label: "My Learning", icon: BookOpen },
    { to: "/academy/teaching", label: "Instructor Hub", icon: Users },
    { to: "/academy/admin", label: "Academy Admin", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-5">
      {/* ── HEADER NAVIGATION BAR ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Mana Academy
                </h1>
                <span className="px-2 py-0.2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase border border-indigo-200 dark:border-indigo-800">
                  Skill Hub
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Learn from your community. Teach your community. Grow together.
              </p>
            </div>
          </div>

          {/* Navigation Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.end
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── SUB-VIEW CONTENT ── */}
      <Outlet />
    </div>
  );
}
