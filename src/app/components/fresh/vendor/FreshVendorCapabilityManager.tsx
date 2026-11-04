import React, { useState, useEffect } from 'react';
import {
  Apple, Carrot, Scissors, Milk, Flame, HeartPulse,
  Nut, Drumstick, Beef, Fish, Cookie, Truck,
  CheckCircle2, Clock, XCircle, AlertTriangle, Plus, ShieldCheck,
  Building2, ThermometerSnowflake, Calendar, ArrowRight, Loader2
} from 'lucide-react';
import { freshVendorService } from '../../../../services/freshVendorService';
import type { VendorCapabilityDto, FreshVendorCapabilityType } from '../../../../types/freshVendor';
import { useAuth } from '../../../../contexts/AuthContext';

interface CapabilityMeta {
  type: FreshVendorCapabilityType;
  title: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeColor: string;
}

const CAPABILITY_CATALOG: CapabilityMeta[] = [
  {
    type: 'FRUIT_SUPPLIER',
    title: 'Farmer / Fruit Supplier',
    category: 'Fresh Produce',
    description: 'Whole seasonal fruits, orchard harvests, grading and direct-from-farm supplies.',
    icon: Apple,
    color: 'from-amber-500 to-orange-500',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  {
    type: 'VEGETABLE_SUPPLIER',
    title: 'Vegetable Supplier',
    category: 'Fresh Produce',
    description: 'Whole vegetables, fresh leafy greens, morning farm harvests.',
    icon: Carrot,
    color: 'from-emerald-500 to-green-600',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    type: 'FRESH_CUT_PROCESSOR',
    title: 'Fresh-Cut Processor',
    category: 'Value-Added Prep',
    description: 'Peeled & cubed fruits, diced vegetables, sanitized micro-greens and salad kits.',
    icon: Scissors,
    color: 'from-teal-500 to-cyan-600',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200'
  },
  {
    type: 'DAIRY_VENDOR',
    title: 'Dairy Vendor',
    category: 'Cold Chain',
    description: 'Farm-fresh A2 milk, curd, malai paneer, artisanal butter and yogurts.',
    icon: Milk,
    color: 'from-blue-500 to-indigo-600',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    type: 'BATTER_MANUFACTURER',
    title: 'Batter Manufacturer',
    category: 'Fermented Foods',
    description: 'Stone-ground Idly/Dosa batter, Ragi & multi-millet batters, vada batters.',
    icon: Flame,
    color: 'from-orange-500 to-red-500',
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  {
    type: 'NUTRITION_VENDOR',
    title: 'Nutrition Food Vendor',
    category: 'Wellness & Health',
    description: 'High-protein breakfast bowls, overnight chia-oats, dietitian macro boxes.',
    icon: HeartPulse,
    color: 'from-rose-500 to-pink-600',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  {
    type: 'DRY_FRUIT_SUPPLIER',
    title: 'Dry-Fruit & Seeds Supplier',
    category: 'Pantry & Bulk',
    description: 'Californian almonds, walnuts, chia seeds, roasted makhana and dry berries.',
    icon: Nut,
    color: 'from-amber-600 to-yellow-700',
    badgeColor: 'bg-yellow-50 text-yellow-800 border-yellow-200'
  },
  {
    type: 'CHICKEN_SUPPLIER',
    title: 'Fresh Poultry / Chicken Supplier',
    category: 'Fresh Protein',
    description: 'Hygienic chilled chicken curry cuts, boneless breast, drumsticks.',
    icon: Drumstick,
    color: 'from-red-500 to-rose-600',
    badgeColor: 'bg-red-50 text-red-700 border-red-200'
  },
  {
    type: 'MUTTON_SUPPLIER',
    title: 'Fresh Mutton Supplier',
    category: 'Fresh Protein',
    description: 'Tender goat/lamb cuts, chops, biryani cut, keema with cold-chain holding.',
    icon: Beef,
    color: 'from-rose-700 to-red-800',
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200'
  },
  {
    type: 'SEAFOOD_SUPPLIER',
    title: 'Seafood & Fish Supplier',
    category: 'Fresh Protein',
    description: 'Coastal catch, freshwater fish, cleaned tiger prawns, crab with ice-bed holding.',
    icon: Fish,
    color: 'from-cyan-600 to-blue-700',
    badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200'
  },
  {
    type: 'HEALTHY_SNACK_VENDOR',
    title: 'Healthy Snack Vendor',
    category: 'Packaged Health',
    description: 'Cold-pressed energy bars, millet cookies, vacuum-fried chips, trail mixes.',
    icon: Cookie,
    color: 'from-purple-500 to-indigo-600',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  {
    type: 'DELIVERY_PARTNER',
    title: 'Community Delivery Partner',
    category: 'Logistics',
    description: 'Morning doorstep delivery runs (6:00–8:00 AM), tower sorting and OTP handovers.',
    icon: Truck,
    color: 'from-slate-700 to-slate-900',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200'
  }
];

export function FreshVendorCapabilityManager() {
  const { user } = useAuth();
  const vendorId = user?.vendorId || 1;

  const [capabilities, setCapabilities] = useState<VendorCapabilityDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMeta, setSelectedMeta] = useState<CapabilityMeta | null>(null);

  // Form states
  const [fssaiLicense, setFssaiLicense] = useState('');
  const [fssaiValidity, setFssaiValidity] = useState('');
  const [facilityAddress, setFacilityAddress] = useState('');
  const [coldStorage, setColdStorage] = useState(false);
  const [dailyCapacity, setDailyCapacity] = useState(100);
  const [operatingDays, setOperatingDays] = useState('MON,TUE,WED,THU,FRI,SAT');

  const fetchCapabilities = async () => {
    try {
      setLoading(true);
      const data = await freshVendorService.getVendorCapabilities(vendorId);
      setCapabilities(data || []);
    } catch (err) {
      console.error('Failed to load vendor capabilities', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapabilities();
  }, [vendorId]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeta) return;

    try {
      setSubmitting(true);
      await freshVendorService.applyForCapability({
        vendorId,
        capabilityType: selectedMeta.type,
        fssaiLicenseNumber: fssaiLicense,
        fssaiValidUntil: fssaiValidity || undefined,
        facilityAddress,
        coldStorageAvailable: coldStorage,
        dailyCapacityUnits: dailyCapacity,
        operatingDays
      });
      setSelectedMeta(null);
      await fetchCapabilities();
    } catch (err: any) {
      alert(err.message || 'Failed to submit capability application');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active & Approved
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Admin Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejection / Resubmit
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-600" /> Suspended
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold tracking-wider uppercase mb-1">
            <ShieldCheck className="w-4 h-4" /> Mana Fresh Operational Hub
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white m-0">
            Vendor Capabilities & Operational Approvals
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl m-0">
            One unified vendor account with modular capabilities. Apply for specialized food categories to unlock tailored production, batch logging, cold-chain gates, and community demand.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center">
          <div className="text-2xl font-black text-emerald-300">
            {capabilities.filter(c => c.status === 'APPROVED').length} / {CAPABILITY_CATALOG.length}
          </div>
          <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
            Approved Modules
          </div>
        </div>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm font-semibold">Loading vendor capabilities...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CAPABILITY_CATALOG.map((meta) => {
            const cap = capabilities.find(c => c.capabilityType === meta.type);
            const Icon = meta.icon;
            const isApproved = cap?.status === 'APPROVED';

            return (
              <div
                key={meta.type}
                className={
                  'rounded-2xl border transition-all duration-200 bg-white shadow-sm hover:shadow-md flex flex-col justify-between p-5 relative overflow-hidden ' +
                  (isApproved ? 'border-emerald-200 ring-2 ring-emerald-500/10' : 'border-slate-200')
                }
              >
                {/* Top Bar */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className={'w-12 h-12 rounded-xl bg-gradient-to-br ' + meta.color + ' flex items-center justify-center text-white shadow-md shadow-emerald-900/10'}>
                      <Icon className="w-6 h-6" />
                    </div>
                    {cap ? (
                      getStatusBadge(cap.status)
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Not Applied
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-0.5">
                    {meta.category}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 m-0 mb-1.5">
                    {meta.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed m-0">
                    {meta.description}
                  </p>

                  {/* Capability Details if submitted */}
                  {cap && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                      {cap.fssaiLicenseNumber && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">FSSAI Lic:</span>
                          <span className="font-semibold text-slate-800">{cap.fssaiLicenseNumber}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Cold Chain:</span>
                        <span className="font-semibold text-slate-800">
                          {cap.coldStorageAvailable ? 'Equipped (2–4°C)' : 'Ambient Only'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Daily Cap:</span>
                        <span className="font-semibold text-slate-800">{cap.dailyCapacityUnits} units/day</span>
                      </div>
                      {cap.rejectionReason && (
                        <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[11px] mt-1">
                          <strong>Admin Note:</strong> {cap.rejectionReason}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action button */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  {isApproved ? (
                    <div className="text-xs font-bold text-emerald-700 flex items-center justify-between">
                      <span>Operational Dashboard Active</span>
                      <ArrowRight className="w-4 h-4 text-emerald-600" />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMeta(meta);
                        setFssaiLicense(cap?.fssaiLicenseNumber || '');
                        setFacilityAddress(cap?.facilityAddress || '');
                        setColdStorage(cap?.coldStorageAvailable || false);
                        setDailyCapacity(cap?.dailyCapacityUnits || 100);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {cap ? 'Update / Resubmit Application' : 'Apply for Capability'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal / Dialog for Applying */}
      {selectedMeta && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className={'w-9 h-9 rounded-xl bg-gradient-to-br ' + selectedMeta.color + ' flex items-center justify-center text-white'}>
                  <selectedMeta.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 m-0">
                    Apply: {selectedMeta.title}
                  </h3>
                  <p className="text-xs text-slate-500 m-0">Food Safety & Operational Verification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMeta(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">FSSAI License / Registration #</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 11521018000452"
                  value={fssaiLicense}
                  onChange={(e) => setFssaiLicense(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">License Validity Date</label>
                  <input
                    type="date"
                    value={fssaiValidity}
                    onChange={(e) => setFssaiValidity(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Daily Capacity (Units/Kg)</label>
                  <input
                    type="number"
                    min={1}
                    value={dailyCapacity}
                    onChange={(e) => setDailyCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Processing Facility / Warehouse Address</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Licensed premises location for quality audit inspections"
                  value={facilityAddress}
                  onChange={(e) => setFacilityAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Operating Days</label>
                <input
                  type="text"
                  value={operatingDays}
                  onChange={(e) => setOperatingDays(e.target.value)}
                  placeholder="e.g. MON,TUE,WED,THU,FRI,SAT"
                  className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  id="coldStorageCheck"
                  checked={coldStorage}
                  onChange={(e) => setColdStorage(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="coldStorageCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Facility possesses certified <strong>Cold Chain storage (2°C–4°C)</strong> & temperature probe sensors.
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedMeta(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}