import React from 'react';
import { QrCode, ShieldCheck, MapPin, X } from 'lucide-react';
import type { CommerceHandoverPassDto } from '../../types/commerceCore';

interface UniversalPickupPassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  handoverPass?: CommerceHandoverPassDto;
}

export const UniversalPickupPassDialog: React.FC<UniversalPickupPassDialogProps> = ({
  isOpen,
  onClose,
  orderNumber,
  handoverPass,
}) => {
  if (!isOpen) return null;

  const pin = handoverPass?.handoverOtp || '8421';
  const location = handoverPass?.pickupPoint || 'Clubhouse Gate 2 Handover Hub';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col items-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-full p-1 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg mb-1">
          <ShieldCheck className="w-6 h-6" />
          <span>Universal Pickup Pass</span>
        </div>
        <p className="text-xs text-slate-500 mb-5">Order #{orderNumber}</p>

        {/* QR Simulation Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col items-center w-full mb-5">
          <QrCode className="w-32 h-32 text-indigo-600 mb-2" />
          <span className="text-xs text-slate-500 font-medium text-center">
            Scan at Gate / Seller Pickup Desk
          </span>
        </div>

        {/* 4-digit PIN */}
        <div className="w-full flex flex-col items-center mb-5">
          <span className="text-xs text-slate-500 font-medium mb-2">Or share 4-Digit Pickup PIN</span>
          <div className="flex gap-2">
            {pin.split('').map((d: string, i: number) => (
              <div
                key={i}
                className="w-11 h-12 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center font-extrabold text-xl text-indigo-600 shadow-inner"
              >
                {d}
              </div>
            ))}
          </div>
        </div>

        {/* Location info */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 w-full flex items-start gap-2.5 mb-6">
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-left text-xs">
            <div className="font-bold text-emerald-900 uppercase text-[10px] tracking-wider">Pickup Location</div>
            <div className="text-emerald-800 font-medium">{location}</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-md hover:shadow-lg text-sm"
        >
          Done
        </button>
      </div>
    </div>
  );
};