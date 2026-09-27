import { useState } from 'react';
import {
  X,
  Tag,
  ShieldCheck,
  Calendar,
  Sparkles,
  Ticket,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  QrCode,
  Building2,
} from 'lucide-react';
import type { CommunityOffer, OfferClaim } from '../../../types/offers';
import { offersApi } from '../../../services/offers/offersApi';
import { toast } from 'sonner';

interface OfferDetailsModalProps {
  offer: CommunityOffer | null;
  onClose: () => void;
  onClaimSuccess?: (claim: OfferClaim) => void;
}

export function OfferDetailsModal({ offer, onClose, onClaimSuccess }: OfferDetailsModalProps) {
  const [claiming, setClaiming] = useState(false);
  const [claimedVoucher, setClaimedVoucher] = useState<OfferClaim | null>(null);
  const [copied, setCopied] = useState(false);

  if (!offer) return null;

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const claim = await offersApi.claimOffer({
        offerId: offer.id,
        communityId: 'comm-mana-residency',
        residentUserId: 'user-sandeep',
        residentName: 'Sandeep Patil',
        unitNumber: 'B-402',
      });
      setClaimedVoucher(claim);
      toast.success('🎉 Deal claimed successfully! Your voucher is ready.');
      onClaimSuccess?.(claim);
    } catch (err: any) {
      toast.error(err.message || 'Failed to claim offer');
    } finally {
      setClaiming(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Voucher code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-5 text-white shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {offer.categoryName || 'Community Offer'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Verified Partner
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black tracking-tight text-white pr-8">
            {offer.title}
          </h2>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Offered by <span className="text-emerald-300 font-bold">{offer.businessName}</span>
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-700 dark:text-slate-300 text-sm">
          {/* If already claimed in this session: Show Voucher Pass */}
          {claimedVoucher ? (
            <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border-2 border-dashed border-emerald-500/40 rounded-3xl p-5 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Exclusive Community Voucher Pass
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Present this voucher code or QR code at the business checkout or event booth
                </p>
              </div>

              {/* Voucher Code Box */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 shadow-xs flex items-center justify-between gap-3">
                <div className="text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Voucher Code
                  </span>
                  <span className="text-xl sm:text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 tracking-wider">
                    {claimedVoucher.redemptionCode}
                  </span>
                </div>
                <button
                  onClick={() => handleCopyCode(claimedVoucher.redemptionCode)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              {/* QR Mockup Box */}
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center gap-4 text-left">
                <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-900 p-2 border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0">
                  <QrCode className="w-12 h-12 text-slate-800 dark:text-slate-200" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Quick In-Store Scan
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Valid for: Sandeep Patil (B-402)
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                    Valid until {claimedVoucher.validUntil || '30 Days'}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 italic">
                Saved to <span className="font-semibold text-emerald-600">My Vouchers</span> tab. You can access it anytime!
              </div>
            </div>
          ) : (
            <>
              {/* Pricing & Savings Gauge Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Community Resident Pricing
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      ₹{offer.communityPrice ?? 0}
                    </span>
                    {offer.regularPrice && offer.regularPrice > (offer.communityPrice || 0) && (
                      <span className="text-sm font-medium text-slate-400 line-through">
                        ₹{offer.regularPrice}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-xl bg-emerald-600 text-white font-extrabold text-xs sm:text-sm shadow-xs">
                    {offer.savingsSummary || `${offer.discountPercentage || 0}% OFF`}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    {offer.availableClaims} vouchers remaining
                  </span>
                </div>
              </div>

              {/* Tagline & Description */}
              {offer.tagline && (
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  "{offer.tagline}"
                </p>
              )}

              {offer.description && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Offer Highlights
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {offer.description}
                  </p>
                </div>
              )}

              {/* Eligibility & Target Communities */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Valid Communities</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(offer.targetCommunityNames && offer.targetCommunityNames.length > 0
                    ? offer.targetCommunityNames
                    : ['Mana Residency']
                  ).map((comm, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-medium text-slate-700 dark:text-slate-200"
                    >
                      ✓ {comm}
                    </span>
                  ))}
                </div>
              </div>

              {/* Terms & Validity */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Valid until: <strong className="text-slate-800 dark:text-slate-200">{offer.validUntil || '30 Days from claim'}</strong></span>
                </div>

                {offer.termsAndConditions && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">Terms &amp; Conditions:</strong>
                      <span>{offer.termsAndConditions}</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!claimedVoucher && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-500">
              Zero upfront payment • Pay directly at store
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleClaim}
                disabled={claiming || !offer.isClaimable}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Ticket className="w-4 h-4" />
                <span>{claiming ? 'Generating Voucher...' : 'Claim Community Offer'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
