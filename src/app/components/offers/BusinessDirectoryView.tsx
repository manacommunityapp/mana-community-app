import { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Star,
  MapPin,
  Phone,
  ShieldCheck,
  Tag,
  Sparkles,
  Award,
  HeartPulse,
} from 'lucide-react';
import type { BusinessPartner, CommerceCategory } from '../../../types/offers';
import { offersApi } from '../../../services/offers/offersApi';

export function BusinessDirectoryView() {
  const [businesses, setBusinesses] = useState<BusinessPartner[]>([]);
  const [categories, setCategories] = useState<CommerceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusinesses();
  }, [selectedCategory]);

  const loadBusinesses = async () => {
    setLoading(true);
    try {
      const [bizData, catData] = await Promise.all([
        offersApi.getBusinesses(selectedCategory || undefined),
        offersApi.getCategories(),
      ]);
      setBusinesses(bizData);
      setCategories(catData);
    } catch (err) {
      console.error('Failed to load businesses', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = businesses.filter((b) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q)) ||
        (b.tagline && b.tagline.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Directory Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Verified Local Business Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Trusted community partners offering reliable doorstep service &amp; special pricing
          </p>
        </div>

        {/* Free Health Camp Strip */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          <HeartPulse className="w-4 h-4 text-rose-500 shrink-0" />
          <span>Next Camp: Dental &amp; Eye Checkup (Saturday)</span>
        </div>
      </div>

      {/* Search & Category Pills */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search partners by business name, medical clinic, salon, gym, groceries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              selectedCategory === ''
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            All Partners ({businesses.length})
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
      </div>

      {/* Business Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 rounded-3xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No local partners found
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((biz) => (
            <div
              key={biz.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-emerald-500/30 transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                {/* Badges Row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {biz.categoryName}
                  </span>

                  {biz.partnershipTier !== 'NONE' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {biz.partnershipTier === 'PLATINUM_PARTNER' ? 'Platinum Partner' : biz.partnershipTier === 'GOLD_PARTNER' ? 'Gold Partner' : 'Silver Partner'}
                    </span>
                  )}
                </div>

                {/* Business Name & Tagline */}
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {biz.name}
                  </h3>
                  {biz.tagline && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                      {biz.tagline}
                    </p>
                  )}
                </div>

                {/* Rating & Distance */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{biz.averageRating}</span>
                    <span className="text-slate-400 font-normal">({biz.reviewCount})</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-1 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{biz.distanceKm} km away</span>
                  </div>
                </div>

                {/* Description */}
                {biz.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {biz.description}
                  </p>
                )}
              </div>

              {/* Card Footer: Active deals count & Phone */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                  <Tag className="w-3.5 h-3.5" />
                  <span>{biz.activeDealsCount} Active Deals</span>
                </span>

                {biz.phone && (
                  <a
                    href={`tel:${biz.phone}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>Contact</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
