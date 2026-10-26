import { useState, useEffect } from 'react';
import {
  Lightbulb,
  ThumbsUp,
  Plus,
  Users,
  Sparkles,
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  X,
} from 'lucide-react';
import type { CommunityDemand } from '../../../types/offers';
import { offersApi } from '../../../services/offers/offersApi';
import { toast } from 'sonner';

export function CommunityDemandView() {
  const [demands, setDemands] = useState<CommunityDemand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('cat-fitness');
  const [description, setDescription] = useState('');
  const [expectedFrequency, setExpectedFrequency] = useState('Every Sunday Morning');
  const [preferredTiming, setPreferredTiming] = useState('7:30 AM - 10:30 AM');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDemands();
  }, []);

  const loadDemands = async () => {
    setLoading(true);
    try {
      const data = await offersApi.getDemands('comm-mana-residency', 'user-sandeep');
      setDemands(data);
    } catch (err) {
      console.error('Failed to load demands', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleInterest = async (demandId: string) => {
    try {
      const updated = await offersApi.toggleDemandInterest(demandId, 'user-sandeep', 'Sandeep Patil', 'B-402');
      setDemands((prev) => prev.map((d) => (d.id === demandId ? updated : d)));
      if (updated.userHasExpressedInterest) {
        toast.success('👍 Your interest was recorded! Businesses will see aggregated demand.');
      } else {
        toast.info('Interest removed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update interest');
    }
  };

  const handleCreateDemand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a title for your community want');
      return;
    }
    setSubmitting(true);
    try {
      await offersApi.createDemand({
        communityId: 'comm-mana-residency',
        communityName: 'Mana Residency',
        title: title.trim(),
        categoryId,
        description,
        expectedFrequency,
        preferredTiming,
        createdByUserId: 'user-sandeep',
        createdByName: 'Sandeep Patil',
      });
      toast.success('🎉 Community Want posted! Neighbors can now upvote their interest.');
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      loadDemands();
    } catch (err: any) {
      toast.error(err.message || 'Failed to post demand');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-yellow-950 p-6 sm:p-7 text-white shadow-xl border border-amber-500/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Community Wants Board</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              What does our community need?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Express collective interest for services, Sunday pop-ups, sports coaching, or health camps. Local businesses see verified demand and respond with exclusive group pricing!
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Post a Community Want</span>
          </button>
        </div>
      </div>

      {/* Demands Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 rounded-3xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : demands.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Lightbulb className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No community requests yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Be the first to propose a service or workshop for your apartment community!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {demands.map((demand) => (
            <div
              key={demand.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                {/* Category & Verified Demand Count */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {demand.categoryName}
                  </span>

                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>{demand.interestedFamiliesCount} Families Interested</span>
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                  {demand.title}
                </h3>

                {/* Description */}
                {demand.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {demand.description}
                  </p>
                )}

                {/* Preferred Schedule Info */}
                <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
                  {demand.expectedFrequency && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Frequency: <strong>{demand.expectedFrequency}</strong></span>
                    </div>
                  )}
                  {demand.preferredTiming && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Timing: <strong>{demand.preferredTiming}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Upvote Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-400">
                  Posted by {demand.createdByName || 'Resident'}
                </span>

                <button
                  onClick={() => handleToggleInterest(demand.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    demand.userHasExpressedInterest
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{demand.userHasExpressedInterest ? 'Interested ✓' : '+1 Interested'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Community Want Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Propose a Community Need
                  </h3>
                  <p className="text-xs text-slate-500">
                    Aggregate demand to invite vendors or coaches
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDemand} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  What service or stall do we need? *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekend swimming classes for kids, Sunday organic market..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="cat-fitness">Fitness &amp; Sports</option>
                  <option value="cat-food">Food &amp; Dining</option>
                  <option value="cat-health">Health &amp; Medical</option>
                  <option value="cat-home">Home &amp; Interiors</option>
                  <option value="cat-kids">Kids &amp; Education</option>
                  <option value="cat-tech">Tech &amp; Electronics</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description &amp; Specific Requirements
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe what you are looking for (e.g. beginner batches, certified instructor)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Frequency
                  </label>
                  <input
                    type="text"
                    value={expectedFrequency}
                    onChange={(e) => setExpectedFrequency(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Preferred Time
                  </label>
                  <input
                    type="text"
                    value={preferredTiming}
                    onChange={(e) => setPreferredTiming(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                {submitting ? 'Posting...' : 'Post Community Want'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
