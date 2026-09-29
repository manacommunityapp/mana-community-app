import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Tag,
  CheckCircle2,
  XCircle,
  BarChart3,
  TrendingUp,
  Store,
  Users,
  AlertCircle,
} from 'lucide-react';
import type { CommerceAnalytics, CommunityOffer, OfferStatus } from '../../../types/offers';
import { offersApi } from '../../../services/offers/offersApi';
import { toast } from 'sonner';

export function CommerceAdminHub() {
  const [analytics, setAnalytics] = useState<CommerceAnalytics | null>(null);
  const [pendingOffers, setPendingOffers] = useState<CommunityOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [stats, offers] = await Promise.all([
        offersApi.getAnalytics('comm-mana-residency'),
        offersApi.getOffers('comm-mana-residency'),
      ]);
      setAnalytics(stats);
      setPendingOffers(offers);
    } catch (err) {
      console.error('Failed to load admin analytics', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDeal = (offerId: string) => {
    toast.success('✓ Deal approved and published to Mana Residency feed!');
  };

  const handleRejectDeal = (offerId: string) => {
    toast.info('Deal rejected');
  };

  return (
    <div className="space-y-6">
      {/* Admin Hub Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Community Commerce Governance &amp; Moderation</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Approve business deals, allocate market booths, and track society savings
          </p>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500">Active Partners</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {analytics.totalActiveBusinesses}
            </div>
            <span className="text-[11px] text-emerald-600 font-bold block">
              100% Verified Local
            </span>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500">Active Deals</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {analytics.totalActiveOffers}
            </div>
            <span className="text-[11px] text-slate-400 block">
              Exclusive Community Offers
            </span>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500">Voucher Redemptions</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {analytics.totalRedemptions}
            </div>
            <span className="text-[11px] text-emerald-600 font-bold block">
              {analytics.redemptionRate}% Conversion Rate
            </span>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500">Est. Resident Savings</span>
            <div className="text-2xl font-black text-emerald-600">
              ₹{analytics.totalEstimatedSavings.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 block">
              Direct Society Value
            </span>
          </div>
        </div>
      )}

      {/* Offer Moderation List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white">
          Active &amp; Pending Community Deals ({pendingOffers.length})
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {pendingOffers.map((offer) => (
            <div key={offer.id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {offer.categoryName}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {offer.businessName}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {offer.title}
                </h4>
                <div className="text-xs text-slate-500">
                  Community Price: <strong className="text-emerald-600">₹{offer.communityPrice}</strong> (Reg: ₹{offer.regularPrice}) • {offer.claimedCount} Claimed • {offer.redeemedCount} Redeemed
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                  ✓ Published &amp; Active
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
