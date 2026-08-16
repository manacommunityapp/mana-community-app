import React, { useState } from 'react';
import {
  Shield, Search, Filter, Download, CheckCircle2, Clock, XCircle,
  Users, DollarSign, Ticket, RefreshCw, QrCode, AlertTriangle, Sparkles,
  UserCheck, UtensilsCrossed, Radio, Plus, PhoneCall, Award, Check, Eye, ChevronRight
} from 'lucide-react';

/* ─── Types & Models ─── */
export type PassCategory = 'family' | 'individual' | 'volunteer' | 'sponsor';

export interface Member {
  id: string;
  name: string;
  age: number | '';
  gender: 'Male' | 'Female' | 'Other';
  relation: string;
  idProofType?: string;
  idProofNumber?: string;
}

export interface PassRecord {
  id: string;
  category: PassCategory;
  primaryName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  members: Member[];
  timeSlot: string;
  gate: string;
  totalAmount: number;
  issueDate: string;
  qrCodeData: string;
  status: 'active' | 'scanned' | 'cancelled';
  scanTime?: string;
  specialPerks: string[];
  prasadCouponsCount: number;
}

export interface GateStatus {
  id: string;
  name: string;
  code: 'Gate A' | 'Gate B' | 'Gate C' | 'Gate D';
  type: string;
  currentDensity: 'Low' | 'Moderate' | 'High Crowd' | 'Hold';
  scansToday: number;
  capacityPerHr: number;
  activeGuards: number;
  leadIncharge: string;
  status: 'Active' | 'Paused' | 'VIP Only';
}

export interface PrasadCounter {
  id: string;
  counterName: string;
  location: string;
  incharge: string;
  packetsDistributed: number;
  stockRemaining: number;
  status: 'Active' | 'Refilling' | 'Closed';
}

export interface VolunteerShift {
  id: string;
  name: string;
  role: string;
  assignedZone: string;
  shiftTime: string;
  contact: string;
  status: 'On Duty' | 'Break' | 'Upcoming';
}

export interface BroadcastAlert {
  id: string;
  time: string;
  level: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  postedBy: string;
}

/* ─── Initial Mock Data ─── */
const INITIAL_PASSES: PassRecord[] = [
  {
    id: 'GU2026-FAM-88492',
    category: 'family',
    primaryName: 'Rajesh Sharma',
    phone: '+91 98765 43210',
    email: 'rajesh.sharma@example.com',
    address: 'Flat 402, Shivam Enclave, M.G. Road',
    city: 'Mumbai',
    members: [
      { id: 'm1', name: 'Sunita Sharma', age: 42, gender: 'Female', relation: 'Spouse', idProofType: 'Aadhaar', idProofNumber: '4829' },
      { id: 'm2', name: 'Aarav Sharma', age: 14, gender: 'Male', relation: 'Son', idProofType: 'School ID', idProofNumber: '9182' },
      { id: 'm3', name: 'Kamla Sharma', age: 68, gender: 'Female', relation: 'Parent', idProofType: 'Aadhaar', idProofNumber: '1092' }
    ],
    timeSlot: 'Morning Aarti & Darshan (06:00 AM - 09:00 AM)',
    gate: 'Gate B (Priority Family Queue)',
    totalAmount: 300,
    issueDate: '2026-08-10',
    qrCodeData: 'GU2026-FAM-88492|Rajesh Sharma|Family-4|GateB',
    status: 'active',
    specialPerks: ['Priority Family Queue', 'Prasadam Box (x2)', 'Senior Seat Assist'],
    prasadCouponsCount: 2
  },
  {
    id: 'GU2026-VIP-10294',
    category: 'sponsor',
    primaryName: 'Meera Deshmukh',
    phone: '+91 91234 56789',
    email: 'meera.deshmukh@example.com',
    address: 'Bunglow 12, Sunrise Park, Worli',
    city: 'Mumbai',
    members: [
      { id: 'v1', name: 'Vikram Deshmukh', age: 48, gender: 'Male', relation: 'Spouse', idProofType: 'Aadhaar', idProofNumber: '3341' }
    ],
    timeSlot: 'Grand Evening Aarti (05:30 PM - 08:30 PM)',
    gate: 'Gate A (VIP Entry)',
    totalAmount: 1100,
    issueDate: '2026-08-10',
    qrCodeData: 'GU2026-VIP-10294|Meera Deshmukh|VIP-2|GateA',
    status: 'active',
    specialPerks: ['VIP Gate A Access', 'Maha Aarti Seating', 'Pooja Thali & Modak Box'],
    prasadCouponsCount: 2
  },
  {
    id: 'GU2026-IND-33910',
    category: 'individual',
    primaryName: 'Amit Verma',
    phone: '+91 99887 76655',
    email: 'amit.verma@example.com',
    address: '12, Lokhandwala Complex, Andheri West',
    city: 'Mumbai',
    members: [],
    timeSlot: 'Mid-Day Darshan Slot (09:30 AM - 12:30 PM)',
    gate: 'Gate C (General Entry)',
    totalAmount: 100,
    issueDate: '2026-08-10',
    qrCodeData: 'GU2026-IND-33910|Amit Verma|Individual|GateC',
    status: 'scanned',
    scanTime: '10:15 AM',
    specialPerks: ['General Darshan Queue', 'Prasadam Token'],
    prasadCouponsCount: 1
  }
];

const INITIAL_GATES: GateStatus[] = [
  { id: 'gate-a', name: 'Gate A (VIP & Donors)', code: 'Gate A', type: 'VIP / Sponsor Entry', currentDensity: 'Low', scansToday: 142, capacityPerHr: 300, activeGuards: 4, leadIncharge: 'Sunil Patil (Head Security)', status: 'VIP Only' },
  { id: 'gate-b', name: 'Gate B (Priority Family Queue)', code: 'Gate B', type: 'Family Priority Queue', currentDensity: 'High Crowd', scansToday: 890, capacityPerHr: 800, activeGuards: 8, leadIncharge: 'Ramesh Sawant', status: 'Active' },
  { id: 'gate-c', name: 'Gate C (General Entry)', code: 'Gate C', type: 'General Public Entry', currentDensity: 'Moderate', scansToday: 1450, capacityPerHr: 1200, activeGuards: 12, leadIncharge: 'Anil Kadam', status: 'Active' },
  { id: 'gate-d', name: 'Gate D (Volunteers & Express)', code: 'Gate D', type: 'Volunteers & Staff Express', currentDensity: 'Low', scansToday: 320, capacityPerHr: 400, activeGuards: 3, leadIncharge: 'Pooja Joshi', status: 'Active' }
];

const INITIAL_PRASAD: PrasadCounter[] = [
  { id: 'pc-1', counterName: 'Counter #1 (Modak & Sheera)', location: 'North Pavilion', incharge: 'Kavita Shinde', packetsDistributed: 840, stockRemaining: 1600, status: 'Active' },
  { id: 'pc-2', counterName: 'Counter #2 (Special Family Boxes)', location: 'East Pavilion', incharge: 'Sanjay More', packetsDistributed: 620, stockRemaining: 880, status: 'Active' },
  { id: 'pc-3', counterName: 'Counter #3 (Bhandara Coupon Desk)', location: 'Dining Hall Gate', incharge: 'Ganesh Parab', packetsDistributed: 1250, stockRemaining: 2750, status: 'Active' },
  { id: 'pc-4', counterName: 'Counter #4 (VIP Pooja Thali)', location: 'Sanctum Rear', incharge: 'Preeti Naik', packetsDistributed: 110, stockRemaining: 390, status: 'Active' }
];

const INITIAL_VOLUNTEERS: VolunteerShift[] = [
  { id: 'vs-1', name: 'Sandeep V. Kurmi', role: 'Gate Security Lead', assignedZone: 'Gate B (Family)', shiftTime: '06:00 AM - 02:00 PM', contact: '+91 98200 11223', status: 'On Duty' },
  { id: 'vs-2', name: 'Rajesh Kulkarni', role: 'Prasadam Distribution', assignedZone: 'Counter #1', shiftTime: '08:00 AM - 04:00 PM', contact: '+91 98334 55667', status: 'On Duty' },
  { id: 'vs-3', name: 'Priyanka Jadhav', role: 'Senior Citizen Escort', assignedZone: 'Darshan Queue B', shiftTime: '09:00 AM - 05:00 PM', contact: '+91 99671 22334', status: 'On Duty' },
  { id: 'vs-4', name: 'Mahesh Bhole', role: 'Crowd & Parking Manager', assignedZone: 'Pandal Outer Field', shiftTime: '02:00 PM - 10:00 PM', contact: '+91 97654 88990', status: 'Upcoming' },
  { id: 'vs-5', name: 'Dr. Archana Raut', role: 'First Aid Desk Incharge', assignedZone: 'Control Room 2', shiftTime: '24x7 On-Call', contact: '+91 98199 00112', status: 'On Duty' }
];

const INITIAL_ALERTS: BroadcastAlert[] = [
  { id: 'alt-1', time: '10:45 AM', level: 'warning', title: 'High Crowd Alert at Gate B', message: 'Queue length exceeded 150m. Divert non-family single entries to Gate C.', postedBy: 'Control Room Officer' },
  { id: 'alt-2', time: '09:15 AM', level: 'info', title: 'VIP Morning Aarti Concluded', message: 'Sanctum stage clear for regular Family & Individual Darshan queues.', postedBy: 'Stage Manager' }
];

/* ─── Main Component ─── */
export function OrganizerDashboard() {
  // Enabled tabs: 'passes' (Pass Register) and 'volunteers' (Volunteer Roster)
  const [activeTab, setActiveTab] = useState<'passes' | 'volunteers' | 'overview' | 'scanner' | 'gates' | 'prasad'>('passes');
  const [passesList, setPassesList] = useState<PassRecord[]>(INITIAL_PASSES);
  const [gatesList, setGatesList] = useState<GateStatus[]>(INITIAL_GATES);
  const [prasadList, setPrasadList] = useState<PrasadCounter[]>(INITIAL_PRASAD);
  const [volunteersList, setVolunteersList] = useState<VolunteerShift[]>(INITIAL_VOLUNTEERS);
  const [alertsList, setAlertsList] = useState<BroadcastAlert[]>(INITIAL_ALERTS);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Broadcast Alert Form State
  const [newAlertTitle, setNewAlertTitle] = useState('');
  const [newAlertMsg, setNewAlertMsg] = useState('');
  const [newAlertLevel, setNewAlertLevel] = useState<'info' | 'warning' | 'critical'>('warning');

  // Metrics
  const totalPasses = passesList.length;
  const activePasses = passesList.filter(p => p.status === 'active').length;
  const scannedPasses = passesList.filter(p => p.status === 'scanned').length;
  const totalRevenue = passesList.reduce((acc, p) => acc + p.totalAmount, 0);

  // Filtered passes list
  const filteredPasses = passesList.filter(p => {
    const matchesSearch = p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.primaryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.phone.includes(searchTerm);
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Toggle Pass Status (Active <-> Scanned)
  const handleToggleStatus = (id: string) => {
    setPassesList(prev => prev.map(p => {
      if (p.id === id) {
        const isNextScanned = p.status === 'active';
        return {
          ...p,
          status: isNextScanned ? 'scanned' : 'active',
          scanTime: isNextScanned ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
        };
      }
      return p;
    }));
  };

  // Add Emergency Alert
  const handlePostAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertTitle || !newAlertMsg) return;
    const newAlert: BroadcastAlert = {
      id: `alt-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      level: newAlertLevel,
      title: newAlertTitle,
      message: newAlertMsg,
      postedBy: 'Committee Desk'
    };
    setAlertsList([newAlert, ...alertsList]);
    setNewAlertTitle('');
    setNewAlertMsg('');
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Pass ID', 'Category', 'Primary Name', 'Phone', 'Email', 'Gate', 'Time Slot', 'Attendees', 'Total Fee', 'Status', 'Issue Date'];
    const rows = passesList.map(p => [
      p.id,
      p.category,
      `"${p.primaryName}"`,
      p.phone,
      p.email,
      `"${p.gate}"`,
      `"${p.timeSlot}"`,
      p.members.length + 1,
      p.totalAmount,
      p.status,
      p.issueDate
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ganesh_Utsav_Committee_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-fadeIn font-sans text-slate-800">

      {/* ─── 1. APPLICATION HEADER & COMMITTEE DESK ACTIONS ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3.5">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 mb-0.5">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Event Management Console</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0d0d2b] flex items-center gap-2">
            Organizer Dashboard & Committee Desk
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Session
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ─── 2. COMMITTEE BROADCAST BANNER ─── */}
      {alertsList.length > 0 && (
        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs ${
          alertsList[0].level === 'critical' ? 'bg-rose-50 border-rose-200 text-rose-800' :
          alertsList[0].level === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900' :
          'bg-indigo-50 border-indigo-200 text-indigo-900'
        }`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Committee Announcement ({alertsList[0].time}):</strong> {alertsList[0].title} — {alertsList[0].message}
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white/80 text-slate-600 border border-slate-200 shrink-0">
            {alertsList[0].postedBy}
          </span>
        </div>
      )}

      {/* ─── 3. METRICS CARDS TOP DECK (APPLICATION THEME) ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-1 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Registered Passes</span>
          <p className="text-xl sm:text-2xl font-bold text-[#0d0d2b]">{totalPasses}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">100% Validated</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-1 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <span className="text-[10px] font-bold uppercase text-slate-400">Scanned / Entered</span>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600">{scannedPasses}</p>
          <span className="text-[10px] text-slate-400">Inside Pandal Now</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-1 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <span className="text-[10px] font-bold uppercase text-slate-400">Pending Queue</span>
          <p className="text-xl sm:text-2xl font-bold text-amber-600">{activePasses}</p>
          <span className="text-[10px] text-slate-400">Active Passes</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-1 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <span className="text-[10px] font-bold uppercase text-slate-400">Pass & Seva Revenue</span>
          <p className="text-xl sm:text-2xl font-bold text-indigo-600 font-mono">₹{totalRevenue.toLocaleString()}</p>
          <span className="text-[10px] text-slate-400">Seva & Pass Revenue</span>
        </div>
      </div>

      {/* ─── 4. SUB-TAB SWITCHER NAVIGATION (APPLICATION THEME) ─── */}
      <div className="flex items-center gap-1.5 border-b border-slate-200/80 overflow-x-auto pb-1.5 hide-scrollbar">
        
        {/* 1st Menu: Pass Register & Master Table (ENABLED) */}
        <button
          onClick={() => setActiveTab('passes')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'passes'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50'
          }`}
        >
          <span>📋 Pass Register & Master Table</span>
        </button>

        {/* 2nd Menu: Volunteer Roster & Broadcast (ENABLED) */}
        <button
          onClick={() => setActiveTab('volunteers')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'volunteers'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50'
          }`}
        >
          <span>🛡️ Volunteer Roster & Broadcast</span>
        </button>

        {/* Disabled Modules */}
        <button
          disabled
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap bg-slate-50 border border-slate-200/60 text-slate-400 cursor-not-allowed opacity-60"
        >
          <span>📊 Real-Time Overview</span>
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-500">Disabled</span>
        </button>

        <button
          disabled
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap bg-slate-50 border border-slate-200/60 text-slate-400 cursor-not-allowed opacity-60"
        >
          <span>📷 Gate Scanner Terminal</span>
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-500">Disabled</span>
        </button>

        <button
          disabled
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap bg-slate-50 border border-slate-200/60 text-slate-400 cursor-not-allowed opacity-60"
        >
          <span>🚪 Gate Controls</span>
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-500">Disabled</span>
        </button>

        <button
          disabled
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap bg-slate-50 border border-slate-200/60 text-slate-400 cursor-not-allowed opacity-60"
        >
          <span>🪔 Prasad Operations</span>
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-500">Disabled</span>
        </button>
      </div>

      {/* ─── 5. ACTIVE TAB 1: PASS REGISTER DATA TABLE ─── */}
      {activeTab === 'passes' && (
        <div className="space-y-3.5">
          
          {/* Controls Bar */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex flex-col md:flex-row gap-3 items-center justify-between text-xs shadow-2xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by Pass ID, Name, Phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="family">Family Pass</option>
                <option value="individual">Individual Pass</option>
                <option value="volunteer">Volunteer Pass</option>
                <option value="sponsor">Sponsor / VIP</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active (Pending)</option>
                <option value="scanned">Scanned (Entered)</option>
              </select>
            </div>
          </div>

          {/* Master Table */}
          <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] border-b border-slate-200">
                    <th className="p-3">Pass ID</th>
                    <th className="p-3">Primary Registrant</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Attendees</th>
                    <th className="p-3">Gate & Slot</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Gate Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPasses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                        No pass records match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPasses.map((pass) => (
                      <tr key={pass.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-mono font-bold text-indigo-600">{pass.id}</td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{pass.primaryName}</div>
                          <div className="text-[10px] text-slate-400">{pass.phone}</div>
                        </td>
                        <td className="p-3 capitalize font-medium text-slate-700">{pass.category} Pass</td>
                        <td className="p-3 font-semibold">{pass.members.length + 1} Pers.</td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{pass.gate}</div>
                          <div className="text-[10px] text-indigo-600">{pass.timeSlot.split('(')[0]}</div>
                        </td>
                        <td className="p-3 font-mono font-semibold text-slate-900">₹{pass.totalAmount}</td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            pass.status === 'active'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {pass.status === 'active' ? '● Active' : '✓ Scanned'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleToggleStatus(pass.id)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 transition-all cursor-pointer border border-slate-200"
                          >
                            {pass.status === 'active' ? 'Mark Scanned' : 'Reset Active'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── 6. ACTIVE TAB 2: VOLUNTEER ROSTER & BROADCAST ─── */}
      {activeTab === 'volunteers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Volunteer Roster */}
          <div className="lg:col-span-7 space-y-3">
            <h3 className="text-sm font-bold text-[#0d0d2b]">Active Duty Volunteer Roster</h3>
            <div className="space-y-2.5">
              {volunteersList.map((v) => (
                <div key={v.id} className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between text-xs shadow-2xs">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{v.name}</div>
                    <div className="text-slate-500">{v.role} • <strong className="text-indigo-600">{v.assignedZone}</strong></div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Shift: {v.shiftTime}</div>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 block">
                      {v.status}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 block">{v.contact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Alert Broadcaster */}
          <div className="lg:col-span-5 p-4 rounded-xl border border-slate-200/80 bg-white space-y-3.5 shadow-2xs h-fit">
            <h3 className="text-sm font-bold text-[#0d0d2b] flex items-center gap-2">
              <Radio className="w-4 h-4 text-indigo-600" />
              Broadcast Committee Alert
            </h3>

            <form onSubmit={handlePostAlert} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Alert Level</label>
                <select
                  value={newAlertLevel}
                  onChange={(e: any) => setNewAlertLevel(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-800"
                >
                  <option value="info">Info Announcement</option>
                  <option value="warning">Warning / Queue Divert</option>
                  <option value="critical">Critical / Security Alert</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Alert Title</label>
                <input
                  type="text"
                  placeholder="e.g. Gate B Queue Overflow"
                  value={newAlertTitle}
                  onChange={(e) => setNewAlertTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Alert Message</label>
                <textarea
                  rows={2}
                  placeholder="Enter broadcast message..."
                  value={newAlertMsg}
                  onChange={(e) => setNewAlertMsg(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-800"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-xs cursor-pointer shadow-sm hover:from-indigo-700 hover:to-violet-700 transition-all"
              >
                Post Broadcast Alert
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
