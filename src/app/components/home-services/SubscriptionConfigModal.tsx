import React, { useState } from 'react';
import { X, CheckCircle2, Sparkles, Car, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { homeServiceApi } from '../../../services/homeServices/homeServiceApi';
import type { HomeServiceWorker, ServiceCategoryCode } from '../../../types/homeServices';

interface SubscriptionConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker?: HomeServiceWorker | null;
  initialServiceType?: 'CAR_WASH' | 'IRONING' | 'MAID' | 'GENERAL';
  onSuccess?: () => void;
}

export function SubscriptionConfigModal({
  isOpen,
  onClose,
  worker,
  initialServiceType = 'CAR_WASH',
  onSuccess,
}: SubscriptionConfigModalProps) {
  const [serviceType, setServiceType] = useState<'CAR_WASH' | 'IRONING' | 'MAID' | 'GENERAL'>(initialServiceType);
  const [frequency, setFrequency] = useState<'DAILY' | 'ALTERNATE' | 'WEEKLY'>('DAILY');
  const [vehicleNumber, setVehicleNumber] = useState('TS09AB1234');
  const [vehicleType, setVehicleType] = useState<'HATCHBACK' | 'SEDAN' | 'SUV'>('SEDAN');
  const [timeSlot, setTimeSlot] = useState('06:30 AM');
  const [tower, setTower] = useState('A');
  const [flatNumber, setFlatNumber] = useState('A-204');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  let basePrice = 899;
  let serviceTitle = 'Daily Doorstep Car Wash';
  let categoryId = 'cat-carwash';
  let categoryName = 'Car / Bike Cleaning';
  let categoryCode: ServiceCategoryCode = 'VEHICLE_CLEANING';

  if (serviceType === 'CAR_WASH') {
    serviceTitle = frequency === 'DAILY' ? 'Daily Car Wash (Mon-Sat)' : frequency === 'ALTERNATE' ? 'Alternate Day Car Wash' : 'Weekly Foam Detailing';
    const vehicleAdd = vehicleType === 'SUV' ? 300 : vehicleType === 'SEDAN' ? 150 : 0;
    basePrice = (frequency === 'DAILY' ? 1050 : frequency === 'ALTERNATE' ? 750 : 450) + vehicleAdd;
    categoryId = 'cat-carwash';
    categoryName = 'Car / Bike Cleaning';
    categoryCode = 'VEHICLE_CLEANING';
  } else if (serviceType === 'IRONING') {
    serviceTitle = frequency === 'DAILY' ? 'Daily Steam Ironing Pickup' : '3x Weekly Ironing Service';
    basePrice = frequency === 'DAILY' ? 1199 : 799;
    categoryId = 'cat-ironing';
    categoryName = 'Ironing';
    categoryCode = 'IRONING';
  } else if (serviceType === 'MAID') {
    serviceTitle = 'Monthly Maid & House Cleaning';
    basePrice = 3500;
    categoryId = 'cat-maid';
    categoryName = 'Maid / House Help';
    categoryCode = 'MAID';
  }

  const assignedWorkerId = worker?.id || (serviceType === 'CAR_WASH' ? 'worker-manoj' : 'worker-lakshmi');
  const assignedWorkerName = worker?.displayName || (serviceType === 'CAR_WASH' ? 'Manoj Rathod' : 'Lakshmi Devi');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await homeServiceApi.subscribeToRecurringPackage({
        workerId: assignedWorkerId,
        workerName: assignedWorkerName,
        categoryId,
        categoryName,
        categoryCode,
        packageName: serviceTitle,
        frequency: frequency === 'DAILY' ? 'DAILY' : frequency === 'ALTERNATE' ? 'DAILY' : 'WEEKLY',
        vehicleNumber: serviceType === 'CAR_WASH' ? vehicleNumber : undefined,
        tower,
        flatNumber,
        price: basePrice,
        startTime: timeSlot.replace(' AM', '').replace(' PM', ''),
        notes: notes.trim() || undefined,
      });

      toast.success('Subscription activated! Your daily service schedule is live.');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error('Failed to activate subscription: ' + (err.message || 'Please try again'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150">
        <div className="relative bg-gradient-to-br from-indigo-900 via-primary to-violet-950 p-5 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-amber-300" />
            Hyperlocal Recurring Service
          </div>
          <h3 className="text-lg sm:text-xl font-black">Configure Doorstep Subscription</h3>
          <p className="text-xs text-white/80 mt-1">
            Automated recurring schedule with daily resident PIN validation and before/after proof.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-slate-900 dark:text-white">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Select Service</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'CAR_WASH' as const, label: 'Car Wash', icon: '🚗' },
                { id: 'IRONING' as const, label: 'Steam Ironing', icon: '👕' },
                { id: 'MAID' as const, label: 'Daily Maid', icon: '🧹' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setServiceType(s.id)}
                  className={`py-2.5 px-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    serviceType === s.id
                      ? 'border-primary bg-primary/10 text-primary font-black shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-xs font-bold">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {serviceType === 'CAR_WASH' && (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                <Car className="w-4 h-4 text-primary" />
                <span>Vehicle Specifications</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. TS09AB1234"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold tracking-wider outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="HATCHBACK">Hatchback / Small Car</option>
                    <option value="SEDAN">Sedan / Compact SUV</option>
                    <option value="SUV">Large SUV / Luxury</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Frequency</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'DAILY' as const, label: 'Daily (Mon-Sat)', desc: '6 days / week' },
                { id: 'ALTERNATE' as const, label: 'Alternate Days', desc: '3 days / week' },
                { id: 'WEEKLY' as const, label: 'Weekly', desc: 'Deep clean' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFrequency(f.id)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    frequency === f.id
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="text-xs font-extrabold">{f.label}</div>
                  <div className="text-[10px] text-slate-400">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Preferred Time Slot</label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold outline-none"
              >
                <option value="06:30 AM">06:30 AM (Early Morning)</option>
                <option value="07:00 AM">07:00 AM (Morning)</option>
                <option value="07:30 AM">07:30 AM</option>
                <option value="08:00 AM">08:00 AM</option>
                <option value="05:30 PM">05:30 PM (Evening)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Flat &amp; Tower</label>
              <input
                type="text"
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
                placeholder="e.g. A-204"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                required
              />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-xs">
                {assignedWorkerName[0]}
              </div>
              <div>
                <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  {assignedWorkerName}
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900 font-extrabold">
                    Community Verified
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Serving Tower {tower} &amp; neighbors</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">★ 4.9</div>
              <div className="text-[9px] text-slate-400">98% On-time</div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Monthly Plan Total</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">₹{basePrice.toLocaleString('en-IN')}<span className="text-xs text-slate-400 font-normal">/month</span></span>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Start Subscription</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
