import React, { useState } from 'react';
import { Search, QrCode, CheckCircle2, AlertCircle, X, Download, Share2, Printer, ShieldCheck, Wallet, MapPin, Calendar, Clock, Users, Gift } from 'lucide-react';
import { useEscapeKey } from '../../../hooks/useEscapeKey';

export interface GatePassRecord {
  id: string;
  category: string;
  primaryName: string;
  phone: string;
  email: string;
  city: string;
  gate: string;
  timeSlot: string;
  attendeesCount: number;
  qrCodeData: string;
  status: 'active' | 'scanned' | 'expired';
  scanTime?: string;
  prasadTokensCount: number;
}

interface GatePassModalProps {
  isOpen: boolean;
  onClose: () => void;
  pass?: GatePassRecord;
  onPassScanned?: (id: string) => void;
}

const SAMPLE_PASSES: GatePassRecord[] = [
  {
    id: "GU2026-FAM-88492",
    category: "family",
    primaryName: "Sandeep K. Patel",
    phone: "+91 98200 12345",
    email: "sandeep.patel@example.com",
    city: "Hyderabad, Miyapur",
    gate: "Gate B (Priority Family Queue)",
    timeSlot: "Evening Utsav (05:00 PM - 09:00 PM)",
    attendeesCount: 4,
    qrCodeData: "GU2026-FAM-88492|Sandeep Patel|Gate B|4 Persons",
    status: "active",
    prasadTokensCount: 4
  },
  {
    id: "GU2026-SPO-10294",
    category: "sponsor",
    primaryName: "Rajesh Sharma",
    phone: "+91 98765 43210",
    email: "rajesh.sharma@example.com",
    city: "Hyderabad, Gachibowli",
    gate: "Gate A (VIP Entry & Lounge)",
    timeSlot: "Morning Aarti (07:00 AM - 11:00 AM)",
    attendeesCount: 2,
    qrCodeData: "GU2026-SPO-10294|Rajesh Sharma|Gate A|2 Persons",
    status: "active",
    prasadTokensCount: 5
  },
  {
    id: "GU2026-VOL-55219",
    category: "volunteer",
    primaryName: "Priya Sundaram",
    phone: "+91 99123 45678",
    email: "priya.s@example.com",
    city: "Hyderabad, Kukatpally",
    gate: "Gate D (Duty Control Desk)",
    timeSlot: "All-Day Duty Pass",
    attendeesCount: 1,
    qrCodeData: "GU2026-VOL-55219|Priya Sundaram|Gate D|Volunteer",
    status: "scanned",
    scanTime: "10:15 AM",
    prasadTokensCount: 2
  }
];

export const GatePassModal: React.FC<GatePassModalProps> = ({
  isOpen,
  onClose,
  pass,
  onPassScanned
}) => {
  useEscapeKey(onClose, isOpen);
  const [query, setQuery] = useState<string>('');
  const [activePass, setActivePass] = useState<GatePassRecord>(pass || SAMPLE_PASSES[0]);
  const [searched, setSearched] = useState<boolean>(false);
  const [scannedStatus, setScannedStatus] = useState<boolean>(activePass.status === 'scanned');

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const trimmed = query.trim().toLowerCase();
    const found = SAMPLE_PASSES.find(
      p => p.id.toLowerCase().includes(trimmed) || p.phone.replaceAll(' ', '').includes(trimmed) || p.primaryName.toLowerCase().includes(trimmed)
    );

    if (found) {
      setActivePass(found);
      setScannedStatus(found.status === 'scanned');
    }
    setSearched(true);
  };

  const handleSimulateScan = () => {
    setScannedStatus(true);
    const updatedPass = { ...activePass, status: 'scanned' as const, scanTime: new Date().toLocaleTimeString() };
    setActivePass(updatedPass);
    if (onPassScanned) onPassScanned(activePass.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-orange-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-[#EA580C]">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Gate Entry E-Pass</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                  Ganesh Utsav 2026
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Present this digital badge & QR code at gate scanner</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Pass Search & Lookup Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Pass ID (e.g. GU2026-FAM-88492), Name or Phone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-[#EA580C]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </form>

        {/* Sample Pass Selector Pills */}
        <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold">
          <span className="text-slate-400">Sample Passes:</span>
          {SAMPLE_PASSES.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setActivePass(p);
                setScannedStatus(p.status === 'scanned');
                setQuery(p.id);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border cursor-pointer transition-all ${
                activePass.id === p.id
                  ? 'bg-orange-50 dark:bg-orange-950 text-[#EA580C] border-orange-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {p.id}
            </button>
          ))}
        </div>

        {/* Digital E-Pass Card Display */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-orange-400/50 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-slate-900/90 dark:to-slate-950 p-4 sm:p-5 space-y-4 shadow-xl">
          
          {/* Card Top: Banner & Status */}
          <div className="flex items-start justify-between border-b border-orange-200/40 dark:border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#EA580C]">Ganesh Utsav 2026 Official Gate Pass</span>
              <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{activePass.primaryName}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">{activePass.phone} • {activePass.city}</p>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono font-black text-[#EA580C] bg-orange-100 dark:bg-orange-950/60 px-2.5 py-1 rounded-lg border border-orange-300 dark:border-orange-800 block">
                {activePass.id}
              </span>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border mt-1.5 inline-flex items-center gap-1 ${
                scannedStatus
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300'
              }`}>
                {scannedStatus ? `✓ ENTERED (${activePass.scanTime || 'Just now'})` : '● VALID FOR GATE ENTRY'}
              </span>
            </div>
          </div>

          {/* QR Code & Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            
            {/* SVG QR Code Simulation */}
            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-sm sm:col-span-1">
              <div className="w-28 h-28 bg-slate-900 rounded-lg p-2 flex items-center justify-center relative">
                {/* SVG QR Placeholder */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current">
                  <rect x="0" y="0" width="30" height="30" rx="4" fill="white" />
                  <rect x="5" y="5" width="20" height="20" rx="2" fill="black" />
                  <rect x="10" y="10" width="10" height="10" fill="white" />

                  <rect x="70" y="0" width="30" height="30" rx="4" fill="white" />
                  <rect x="75" y="5" width="20" height="20" rx="2" fill="black" />
                  <rect x="80" y="10" width="10" height="10" fill="white" />

                  <rect x="0" y="70" width="30" height="30" rx="4" fill="white" />
                  <rect x="5" y="75" width="20" height="20" rx="2" fill="black" />
                  <rect x="10" y="80" width="10" height="10" fill="white" />

                  <rect x="35" y="35" width="30" height="30" fill="white" />
                  <rect x="40" y="40" width="20" height="20" fill="black" />
                  <circle cx="50" cy="50" r="4" fill="#EA580C" />
                </svg>
              </div>
              <span className="text-[9px] font-mono font-bold text-slate-500 mt-1">Scan at Gate Scanner</span>
            </div>

            {/* Pass Metadata Roster */}
            <div className="sm:col-span-2 space-y-2 text-xs">
              <div className="bg-slate-100/90 dark:bg-slate-800/90 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Gate Allotment:</span>
                <strong className="text-sm font-black text-[#EA580C]">{activePass.gate}</strong>
              </div>

              <div className="bg-slate-100/90 dark:bg-slate-800/90 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Time Slot:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{activePass.timeSlot}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Attendees:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{activePass.attendeesCount} Persons</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10.5px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-900">
                <Gift className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Includes {activePass.prasadTokensCount}x Mahaprasad Token & Devotional Gift Kit</span>
              </div>
            </div>

          </div>

          {/* Simulate Scanner Action */}
          {!scannedStatus && (
            <button
              type="button"
              onClick={handleSimulateScan}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer flex items-center justify-center gap-2 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Simulate Gate QR Scan (Mark as Entered)</span>
            </button>
          )}

        </div>

        {/* Bottom Actions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold pt-1">
          <button
            type="button"
            onClick={() => alert(`Pass ${activePass.id} downloaded successfully as PNG/PDF!`)}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#EA580C]" />
            <span>Download</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const text = `Ganesh Utsav 2026 Gate Pass ${activePass.id} for ${activePass.primaryName}. Gate: ${activePass.gate}, Slot: ${activePass.timeSlot}`;
              window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
            }}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-pointer hover:bg-emerald-100"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-blue-500" />
            <span>Print Badge</span>
          </button>

          <button
            type="button"
            onClick={() => alert('Pass saved to Apple Wallet / Google Pay successfully!')}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 cursor-pointer hover:bg-purple-100"
          >
            <Wallet className="w-3.5 h-3.5 text-purple-500" />
            <span>Save Wallet</span>
          </button>
        </div>

        {/* Modal Close Button */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl cursor-pointer"
          >
            Close Gate Pass
          </button>
        </div>

      </div>
    </div>
  );
};
