import { useState, useEffect } from 'react';
import {
  Ticket,
  CheckCircle2,
  Clock,
  Building2,
  Copy,
  QrCode,
  MapPin,
  Phone,
  AlertCircle,
} from 'lucide-react';
import type { OfferClaim } from '../../../types/offers';
import { offersApi } from '../../../services/offers/offersApi';
import { toast } from 'sonner';

export function MyClaimsView() {
  const [claims, setClaims] = useState<OfferClaim[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'REDEEMED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [activeQrModal, setActiveQrModal] = useState<OfferClaim | null>(null);

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const data = await offersApi.getMyClaims('user-sandeep');
      setClaims(data);
    } catch (err) {
      console.error('Failed to load claims', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Voucher code ${code} copied!`);
  };

  const filteredClaims = claims.filter((c) => {
    if (filter === 'ACTIVE') return c.status === 'ACTIVE';
    if (filter === 'REDEEMED') return c.status === 'REDEEMED';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            My Claimed Vouchers &amp; Passes
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Present your voucher code or QR pass at the store or market day booth
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {(['ALL', 'ACTIVE', 'REDEEMED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === f
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {f === 'ALL' ? `All (${claims.length})` : f === 'ACTIVE' ? `Active (${claims.filter(c => c.status === 'ACTIVE').length})` : `Used (${claims.filter(c => c.status === 'REDEEMED').length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Vouchers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 rounded-3xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Ticket className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No vouchers in this section
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Explore the Community Deals catalog to claim exclusive discounts from verified local partners!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredClaims.map((claim) => {
            const isActive = claim.status === 'ACTIVE';

            return (
              <div
                key={claim.id}
                className={`relative bg-white dark:bg-slate-900 rounded-3xl border ${
                  isActive
                    ? 'border-emerald-500/40 shadow-md shadow-emerald-500/5'
                    : 'border-slate-200 dark:border-slate-800 opacity-75'
                } p-5 flex flex-col justify-between gap-4 overflow-hidden`}
              >
                {/* Status Ribbon */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {claim.businessName}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isActive ? '● Active Voucher' : '✓ Redeemed'}
                  </span>
                </div>

                {/* Offer Title & Pricing */}
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {claim.offerTitle}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      ₹{claim.communityPrice ?? 0}
                    </span>
                    {claim.regularPrice && (
                      <span className="text-xs text-slate-400 line-through">
                        ₹{claim.regularPrice}
                      </span>
                    )}
                    {claim.savingsSummary && (
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        ({claim.savingsSummary})
                      </span>
                    )}
                  </div>
                </div>

                {/* Voucher Code Box & Quick Actions */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Voucher Code
                    </span>
                    <span className="text-base sm:text-lg font-mono font-black text-slate-900 dark:text-white tracking-wider">
                      {claim.redemptionCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopyCode(claim.redemptionCode)}
                      title="Copy code"
                      className="p-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-xs transition-colors cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActiveQrModal(claim)}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>QR Pass</span>
                    </button>
                  </div>
                </div>

                {/* Business Contact Footer */}
                <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                  {claim.businessAddress && (
                    <div className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{claim.businessAddress}</span>
                    </div>
                  )}
                  {claim.businessPhone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{claim.businessPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Pass Modal */}
      {activeQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
              <QrCode className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                In-Store Redemption Pass
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeQrModal.businessName}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-dashed border-emerald-500/40 inline-block shadow-xs">
              <QrCode className="w-36 h-36 text-slate-900 dark:text-white mx-auto" />
              <div className="mt-2 text-base font-mono font-black text-emerald-600 dark:text-emerald-400">
                {activeQrModal.redemptionCode}
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Resident: <strong className="text-slate-800 dark:text-slate-200">{activeQrModal.residentName} ({activeQrModal.unitNumber})</strong>
            </div>

            <button
              onClick={() => setActiveQrModal(null)}
              className="w-full py-2.5 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
