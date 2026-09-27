import { useState, useEffect } from 'react';
import {
  Tag,
  Search,
  Sparkles,
  ShieldCheck,
  TrendingDown,
  Building2,
  Ticket,
  ChevronRight,
  Filter,
  Flame,
  Clock,
  Store,
  Plus,
} from 'lucide-react';
import type { CommunityOffer, CommerceCategory, DealType } from '../../../types/offers';
import { offersApi } from '../../../services/offers/offersApi';
import { OfferDetailsModal } from './OfferDetailsModal';
import { BusinessPortalModal } from './BusinessPortalModal';

export function OffersDashboard() {
  const [offers, setOffers] = useState<CommunityOffer[]>([]);
  const [categories, setCategories] = useState<CommerceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDealType, setSelectedDealType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedOffer, setSelectedOffer] = useState<CommunityOffer | null>(null);
  const [showBusinessPortal, setShowBusinessPortal] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [offersData, catsData] = await Promise.all([
        offersApi.getOffers('comm-mana-residency', selectedCategory || undefined),
        offersApi.getCategories(),
      ]);
      setOffers(offersData);
      setCategories(catsData);
    } catch (err) {
      console.error('Failed to load deals', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOffers = offers.filter((o) => {
    if (selectedDealType !== 'ALL' && o.dealType !== selectedDealType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.title.toLowerCase().includes(q) ||
        o.businessName.toLowerCase().includes(q) ||
        (o.description && o.description.toLowerCase().includes(q)) ||
        (o.categoryName && o.categoryName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Hero Savings Highlights Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 p-5 sm:p-7 text-white shadow-xl relative overflow-hidden border border-emerald-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Flame className="w-3.5 h-3.5" />
              <span>Mana Community Advantage</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Hyperlocal Pricing You Won't Find Online
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Verified businesses near Mana Residency offer lower pricing directly to our residents by cutting out aggregators and middlemen.
            </p>
          </div>

          {/* Quick Metrics & Business Action */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 text-center">
              <div className="text-xl font-black text-emerald-400">₹1,84,500+</div>
              <div className="text-[11px] text-slate-300 font-semibold">Community Savings</div>
            </div>
            <button
              onClick={() => setShowBusinessPortal(true)}
              className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer shrink-0"
            >
              <Store className="w-4 h-4" />
              <span>Partner Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search deals, clinics, salons, groceries, tech repair..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              selectedCategory === ''
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            All Categories ({offers.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Deal Type Secondary Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
          {[
            { id: 'ALL', label: 'All Deals' },
            { id: 'COMMUNITY_PRICE', label: 'Community Price' },
            { id: 'PERCENTAGE_OFF', label: 'Discounts %' },
            { id: 'BUNDLE', label: 'Bundles' },
            { id: 'FREE_SERVICE', label: 'Free Demos' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedDealType(type.id)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer shrink-0 ${
                selectedDealType === type.id
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Offers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-800/50 animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Tag className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No deals found matching your filters
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try resetting your search filters or browse other community categories.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('');
              setSelectedDealType('ALL');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOffers.map((offer) => (
            <div
              key={offer.id}
              className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-lg hover:border-emerald-500/40 transition-all flex flex-col justify-between"
            >
              <div className="p-5 space-y-3.5">
                {/* Category & Badge Row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {offer.categoryName}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {offer.savingsSummary || `${offer.discountPercentage}% OFF`}
                  </span>
                </div>

                {/* Offer Title & Business */}
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {offer.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {offer.businessName}
                    </span>
                  </div>
                </div>

                {/* Tagline or Description */}
                {offer.tagline && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {offer.tagline}
                  </p>
                )}

                {/* Pricing Block */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Community Price
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                        ₹{offer.communityPrice ?? 0}
                      </span>
                      {offer.regularPrice && offer.regularPrice > (offer.communityPrice || 0) && (
                        <span className="text-xs text-slate-400 line-through">
                          ₹{offer.regularPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400">
                    <div>{offer.availableClaims} vouchers left</div>
                  </div>
                </div>
              </div>

              {/* Action Button Footer */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setSelectedOffer(offer)}
                  className="w-full py-2.5 rounded-2xl bg-slate-900 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer group-hover:shadow-md"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Claim Offer &amp; View Pass</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <OfferDetailsModal
        offer={selectedOffer}
        onClose={() => setSelectedOffer(null)}
        onClaimSuccess={() => loadData()}
      />

      {showBusinessPortal && (
        <BusinessPortalModal
          onClose={() => setShowBusinessPortal(false)}
          onSuccess={() => loadData()}
        />
      )}
    </div>
  );
}
