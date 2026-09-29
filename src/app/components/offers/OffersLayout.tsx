import type { ReactNode } from 'react';
import { NavLink, useLocation, Outlet } from 'react-router';
import {
  Tag,
  Store,
  Building2,
  Lightbulb,
  Ticket,
  Briefcase,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

interface OffersLayoutProps {
  children?: ReactNode;
}

export function OffersLayout({ children }: OffersLayoutProps) {
  const location = useLocation();
  const { isAnyAdmin } = useAuth();

  const navItems = [
    { to: '/deals', label: 'Community Deals', icon: Tag, exact: true },
    { to: '/deals/market-days', label: 'Market Day & Pop-ups', icon: Store },
    { to: '/deals/partners', label: 'Local Partners', icon: Building2 },
    { to: '/deals/demands', label: 'Community Wants', icon: Lightbulb },
    { to: '/deals/my-claims', label: 'My Vouchers', icon: Ticket },
    ...(isAnyAdmin
      ? [{ to: '/deals/admin', label: 'Commerce Admin', icon: ShieldCheck }]
      : []),
  ];

  return (
    <div className="min-h-full bg-slate-50/50 dark:bg-slate-950/50 pb-16">
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white border-b border-emerald-900/40 px-4 sm:px-6 lg:px-8 py-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mana Deals &amp; Commerce Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
              <span>Community Deals &amp; Market Day</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal">
              Exclusive resident-only pricing, physical clubhouse shopping festivals, pop-up stores, and trusted local partner discovery.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 text-xs">
              <span className="text-slate-300">Target Community:</span>{' '}
              <span className="font-bold text-emerald-300">Mana Residency</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-2.5">
            {navItems.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content View Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children || <Outlet />}
      </main>
    </div>
  );
}
