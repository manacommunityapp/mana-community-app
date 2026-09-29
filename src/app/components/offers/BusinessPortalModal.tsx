import { useState } from 'react';
import {
  X,
  Store,
  Tag,
  Plus,
  QrCode,
  CheckCircle2,
  Building2,
  Percent,
  Sparkles,
  DollarSign,
} from 'lucide-react';
import { offersApi } from '../../../services/offers/offersApi';
import type { DealType } from '../../../types/offers';
import { toast } from 'sonner';

interface BusinessPortalModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function BusinessPortalModal({ onClose, onSuccess }: BusinessPortalModalProps) {
  const [activeTab, setActiveTab] = useState<'create_deal' | 'redeem_code'>('create_deal');

  // Create deal state
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('cat-health');
  const [dealType, setDealType] = useState<DealType>('COMMUNITY_PRICE');
  const [regularPrice, setRegularPrice] = useState<number>(1000);
  const [communityPrice, setCommunityPrice] = useState<number>(600);
  const [description, setDescription] = useState('');
  const [terms, setTerms] = useState('Prior appointment required. Valid for Mana Community residents only.');
  const [submitting, setSubmitting] = useState(false);

  // Redeem code state
  const [redemptionCode, setRedemptionCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemedResult, setRedeemedResult] = useState<any | null>(null);

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a deal title');
      return;
    }
    setSubmitting(true);
    try {
      await offersApi.createOffer({
        businessId: 'biz-dental',
        businessName: 'ABC Dental Clinic & Implant Centre',
        categoryId,
        title: title.trim(),
        dealType,
        regularPrice,
        communityPrice,
        discountPercentage: Math.round(((regularPrice - communityPrice) / regularPrice) * 100),
        description,
        termsAndConditions: terms,
        targetCommunityIds: ['comm-mana-residency'],
        targetCommunityNames: ['Mana Residency'],
      });
      toast.success('🎉 Community Deal published successfully!');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish deal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redemptionCode.trim()) {
      toast.error('Please enter a voucher code');
      return;
    }
    setRedeeming(true);
    try {
      const claim = await offersApi.redeemOffer(redemptionCode.trim(), 'biz-dental', 'Dr. Ramesh');
      setRedeemedResult(claim);
      toast.success('✓ Voucher successfully verified and marked as REDEEMED!');
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || 'Redemption failed');
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-5 text-white shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">
                Business Partner Portal
              </h2>
              <p className="text-xs text-slate-300">
                Publish exclusive offers &amp; verify resident vouchers
              </p>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-2 mt-4 bg-black/30 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('create_deal')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'create_deal'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Publish Community Deal
            </button>
            <button
              onClick={() => setActiveTab('redeem_code')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'redeem_code'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Verify &amp; Redeem Voucher
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-slate-700 dark:text-slate-300">
          {activeTab === 'create_deal' ? (
            <form onSubmit={handleCreateDeal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Offer Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Dental Consultation + Digital X-Ray"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="cat-health">Health &amp; Medical</option>
                    <option value="cat-food">Food &amp; Dining</option>
                    <option value="cat-beauty">Beauty &amp; Salon</option>
                    <option value="cat-fitness">Fitness &amp; Sports</option>
                    <option value="cat-home">Home &amp; Interiors</option>
                    <option value="cat-tech">Tech &amp; Electronics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Deal Type
                  </label>
                  <select
                    value={dealType}
                    onChange={(e) => setDealType(e.target.value as DealType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="COMMUNITY_PRICE">Community Price</option>
                    <option value="PERCENTAGE_OFF">Percentage Off</option>
                    <option value="BUY_ONE_GET_ONE">Buy 1 Get 1 Free</option>
                    <option value="FREE_SERVICE">Free Service Demo</option>
                    <option value="BUNDLE">Special Bundle</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Regular Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={regularPrice}
                    onChange={(e) => setRegularPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Community Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={communityPrice}
                    onChange={(e) => setCommunityPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description &amp; Deliverables
                </label>
                <textarea
                  rows={2}
                  placeholder="What is included in this offer for community residents..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300">
                  Target Audience:
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  Mana Residency (1,500 Families)
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{submitting ? 'Publishing Deal...' : 'Publish to Mana Deals'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleRedeemCode} className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-2">
                <QrCode className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  In-Store Voucher Redemption
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ask the resident for their 5-character voucher code (e.g. MANA-8F29K) or scan their pass
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Voucher Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MANA-8F29K"
                  value={redemptionCode}
                  onChange={(e) => setRedemptionCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-emerald-500/40 bg-white dark:bg-slate-800 text-center text-lg font-mono font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {redeemedResult && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1.5 animate-in zoom-in-95">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verified Active Resident Voucher</span>
                  </div>
                  <div>Offer: <strong>{redeemedResult.offerTitle}</strong></div>
                  <div>Resident: <strong>{redeemedResult.residentName} ({redeemedResult.unitNumber})</strong></div>
                  <div>Community Price to Charge: <strong className="text-sm text-emerald-600">₹{redeemedResult.communityPrice}</strong></div>
                </div>
              )}

              <button
                type="submit"
                disabled={redeeming || !redemptionCode.trim()}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{redeeming ? 'Verifying...' : 'Verify & Redeem Voucher'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
