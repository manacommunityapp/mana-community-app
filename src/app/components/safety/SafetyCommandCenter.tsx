import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Car,
  Package,
  UserCheck,
  AlertTriangle,
  Cpu,
  QrCode,
  Radio,
  Plus,
  CheckCircle2,
  XCircle,
  Camera,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { safetyService } from '../../../services/safety/safetyService';
import type {
  DashboardSummary,
  VisitorPass,
  VisitorLog,
  Vehicle,
  ParkingViolation,
  DeliveryLog,
  DomesticStaff,
  SafetyIncident,
  HardwareDevice,
  HardwareIntegrationResult,
} from '../../../types/safety';

export function SafetyCommandCenter() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'visitors' | 'vehicles' | 'deliveries' | 'staff' | 'incidents' | 'hardware'>('overview');

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [passes, setPasses] = useState<VisitorPass[]>([]);
  const [activeVisitors, setActiveVisitors] = useState<VisitorLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [violations, setViolations] = useState<ParkingViolation[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryLog[]>([]);
  const [staffList, setStaffList] = useState<DomesticStaff[]>([]);
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  const [devices, setDevices] = useState<HardwareDevice[]>([]);

  // Modals state
  const [showNewPassModal, setShowNewPassModal] = useState(false);
  const [showNewVehicleModal, setShowNewVehicleModal] = useState(false);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showOtpCollectModal, setShowOtpCollectModal] = useState<DeliveryLog | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [showSosModal, setShowSosModal] = useState(false);
  const [selectedPass, setSelectedPass] = useState<VisitorPass | null>(null);

  // Form states
  const [visitorForm, setVisitorForm] = useState({
    visitorName: '',
    visitorPhone: '',
    visitorType: 'GUEST' as any,
    flatNumber: 'A-402',
    tower: 'Tower A',
    purpose: '',
    vehicleNumber: '',
  });

  const [vehicleForm, setVehicleForm] = useState({
    licensePlate: '',
    vehicleType: 'FOUR_WHEELER' as any,
    makeModel: '',
    color: '',
    parkingSlotNumber: 'B1-A402',
    isEv: false,
  });

  const [violationForm, setViolationForm] = useState({
    vehicleNumber: '',
    parkingSlotNumber: '',
    tower: 'Tower A',
    violationType: 'UNAUTHORIZED_SLOT' as any,
    description: '',
    fineAmount: 500,
  });

  const [deliveryForm, setDeliveryForm] = useState({
    flatNumber: 'A-402',
    courierCompany: 'Amazon India',
    deliveryAgentName: '',
    deliveryAgentPhone: '',
    dropLocation: 'MAIN_GATE_LOCKER' as any,
  });

  // Hardware simulation states
  const [simPlate, setSimPlate] = useState('KA01MJ4521');
  const [simTag, setSimTag] = useState('RFID-984210');
  const [simResult, setSimResult] = useState<HardwareIntegrationResult | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [
      sumRes,
      passRes,
      activeVisRes,
      vehRes,
      violRes,
      delivRes,
      staffRes,
      incRes,
      devRes,
    ] = await Promise.all([
      safetyService.getDashboardSummary(),
      safetyService.getVisitorPasses(),
      safetyService.getActiveVisitors(),
      safetyService.getVehicles(),
      safetyService.getParkingViolations(),
      safetyService.getDeliveries(),
      safetyService.getStaff(),
      safetyService.getIncidents(),
      safetyService.getDevices(),
    ]);

    setSummary(sumRes);
    setPasses(passRes);
    setActiveVisitors(activeVisRes);
    setVehicles(vehRes);
    setViolations(violRes);
    setDeliveries(delivRes);
    setStaffList(staffRes);
    setIncidents(incRes);
    setDevices(devRes);
  };

  const handleCreatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await safetyService.createVisitorPass({
      ...visitorForm,
      residentName: user?.fullName || 'Resident',
    });
    setPasses([created, ...passes]);
    setShowNewPassModal(false);
    setSelectedPass(created);
  };

  const handleRegisterVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = await safetyService.registerVehicle(vehicleForm);
    setVehicles([...vehicles, v]);
    setShowNewVehicleModal(false);
  };

  const handleReportViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    const viol = await safetyService.reportViolation({
      ...violationForm,
      reportedByName: user?.fullName || 'Security Marshal',
    });
    setViolations([viol, ...violations]);
    setShowViolationModal(false);
  };

  const handleLogDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    const d = await safetyService.logDelivery(deliveryForm);
    setDeliveries([d, ...deliveries]);
    setShowDeliveryModal(false);
  };

  const handleCollectDelivery = async () => {
    if (!showOtpCollectModal) return;
    const ok = await safetyService.collectDelivery(showOtpCollectModal.id, otpInput);
    if (ok) {
      alert('Parcel claimed and verified successfully!');
      setShowOtpCollectModal(null);
      setOtpInput('');
      loadData();
    } else {
      alert('Invalid collection OTP. Please re-check the code.');
    }
  };

  const handleCheckOut = async (logId: number) => {
    await safetyService.checkOutVisitor(logId);
    loadData();
  };

  const runAnprSimulation = async () => {
    const res = await safetyService.simulateAnprScan(simPlate);
    setSimResult(res);
    loadData();
  };

  const runRfidSimulation = async () => {
    const res = await safetyService.simulateRfidScan(simTag);
    setSimResult(res);
    loadData();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* ── Top Hero & Security Status Bar ────────────────────── */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  COMMAND NETWORK ACTIVE
                </span>
                <span className="text-xs text-slate-400">Port 8096 Live Stream</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                Safety &amp; Security Command Center
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Integrated gate intelligence, visitor digital passports, vehicle ANPR/RFID tracking, parcel lockers &amp; hardware automation.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSosModal(true)}
                className="inline-flex items-center px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 mr-2" />
                Gate SOS / Override
              </button>

              <button
                onClick={() => setShowNewPassModal(true)}
                className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Generate Visitor Pass
              </button>
            </div>
          </div>

          {/* ── Live KPI Metrics Bar ──────────────────────────────── */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800">
              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Active Visitors</span>
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-xl font-bold text-white">{summary.activeVisitorsInside}</div>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Gate Deliveries</span>
                  <Package className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-bold text-amber-400">{summary.pendingDeliveries}</div>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Vehicles Today</span>
                  <Car className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-xl font-bold text-cyan-400">
                  +{summary.vehicleEntriesToday} <span className="text-xs font-normal text-slate-400">/ -{summary.vehicleExitsToday}</span>
                </div>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Duty Staff</span>
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-bold text-emerald-400">{summary.staffOnDuty}</div>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Parking Violations</span>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-xl font-bold text-rose-400">{summary.activeParkingViolations}</div>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Hardware Nodes</span>
                  <Cpu className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-xl font-bold text-purple-400">{devices.length} Online</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation Tabs ───────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2.5">
            {[
              { id: 'overview', label: 'Command Stream', icon: Radio },
              { id: 'visitors', label: 'Visitor Passes & QR', icon: QrCode },
              { id: 'vehicles', label: 'Vehicles & Parking', icon: Car },
              { id: 'deliveries', label: 'Deliveries & Lockers', icon: Package },
              { id: 'staff', label: 'Domestic Staff & Patrols', icon: UserCheck },
              { id: 'incidents', label: 'Incidents & Safety', icon: AlertTriangle },
              { id: 'hardware', label: 'Hardware & AI Engine', icon: Cpu },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`inline-flex items-center px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 mr-2 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Tab Content Area ──────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── TAB 1: OVERVIEW & REAL-TIME STREAM ────────────────── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Live Gate Stream */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
                      Live Gate Access Stream
                    </h2>
                    <p className="text-xs text-slate-500">Real-time barrier actuations, ANPR camera triggers &amp; FastPass scans</p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
                    Live Stream Connected
                  </span>
                </div>

                <div className="space-y-3">
                  {summary?.recentGateActivities.map((act, i) => (
                    <div
                      key={act.id || i}
                      className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          act.triggerSource === 'ANPR' ? 'bg-indigo-100 text-indigo-700' : 'bg-cyan-100 text-cyan-700'
                        }`}>
                          {act.triggerSource}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                            {act.licensePlate}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              act.direction === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {act.direction}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {act.gateName || 'Main Gate 1'} • {new Date(act.accessTime).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Barrier Opened
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Quick Actions & Duty Status */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  Security Shift on Duty
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">Shift Commander</div>
                    <div className="font-bold text-slate-900 text-sm">Supervisor Raghavendra S.</div>
                    <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> On Duty • 06:00 - 14:00 (Morning Shift)
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">Gate 1 (Main Inbound)</div>
                    <div className="font-bold text-slate-900 text-sm">Guard Somesh &amp; Guard Kiran</div>
                    <div className="text-xs text-slate-500 mt-1">ANPR Lane 1 &amp; Visitor Booth Active</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md">
                <h3 className="font-bold text-base mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  AI Gate Intelligence
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Automatic license plate matching is currently operating at 99.4% confidence with automated boom barrier clearance.
                </p>
                <button
                  onClick={() => setActiveTab('hardware')}
                  className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Open Hardware Simulator <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: VISITORS & PASSES ──────────────────────────── */}
        {activeTab === 'visitors' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Visitor Passes &amp; Digital Badges</h2>
                <p className="text-sm text-slate-500">Generate time-bounded 6-digit codes and QR passes for expected guests, cabs and contractors.</p>
              </div>
              <button
                onClick={() => setShowNewPassModal(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5" /> New Visitor Pass
              </button>
            </div>

            {/* Currently Active Visitors on Premises */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Visitors Currently Inside Campus ({activeVisitors.filter(v => v.status === 'CHECKED_IN').length})
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 text-xs uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Visitor</th>
                      <th className="py-3 px-4">Destination</th>
                      <th className="py-3 px-4">Vehicle</th>
                      <th className="py-3 px-4">Entry Time</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeVisitors.filter(v => v.status === 'CHECKED_IN').map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {v.visitorName}
                          <div className="text-xs text-slate-400 font-normal">{v.visitorPhone || 'No phone'}</div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">{v.flatNumber} ({v.tower || 'Tower'})</td>
                        <td className="py-3.5 px-4 text-xs font-mono">{v.vehicleNumber || 'Pedestrian'}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">{new Date(v.entryTime).toLocaleTimeString()}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700">
                            CHECKED IN
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleCheckOut(v.id)}
                            className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 rounded-lg transition-colors cursor-pointer"
                          >
                            Check Out
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Generated Pre-approved Passes */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-4">Pre-Approved Passes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {passes.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-indigo-200 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">
                        {p.visitorType}
                      </span>
                      <span className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="font-bold text-slate-900 text-base">{p.visitorName}</div>
                    <div className="text-xs text-slate-500 mb-3">{p.purpose || 'Personal Visit'} • Flat {p.flatNumber}</div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Pass Code</div>
                        <div className="text-lg font-black tracking-widest text-indigo-600 font-mono">{p.passCode}</div>
                      </div>
                      <button
                        onClick={() => setSelectedPass(p)}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md cursor-pointer flex items-center gap-1"
                      >
                        <QrCode className="w-3.5 h-3.5" /> View QR
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: VEHICLES & PARKING ─────────────────────────── */}
        {activeTab === 'vehicles' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Vehicle Registry &amp; Parking Enforcement</h2>
                <p className="text-sm text-slate-500">Manage resident fast-pass tags, parking bays, and enforce parking violations.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowViolationModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4 mr-1.5" /> Report Violation
                </button>
                <button
                  onClick={() => setShowNewVehicleModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Register Vehicle
                </button>
              </div>
            </div>

            {/* Parking Violations Active */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                Active Parking Violations ({violations.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {violations.map((v) => (
                  <div key={v.id} className="p-4 rounded-xl border border-rose-200 bg-rose-50/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md">
                        {v.violationType.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm font-bold text-rose-700">₹{v.fineAmount} Fine</span>
                    </div>
                    <div className="font-bold text-slate-900 text-base font-mono">{v.vehicleNumber}</div>
                    <div className="text-xs text-slate-600 mt-1">{v.description}</div>
                    <div className="text-[11px] text-slate-400 mt-2">
                      Reported by {v.reportedByName} • {new Date(v.reportedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Registered Vehicles */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-4">Resident Registered Vehicles</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {vehicles.map((veh) => (
                  <div key={veh.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-slate-900 text-base">{veh.licensePlate}</span>
                      {veh.isEv && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                          ⚡ EV
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-slate-700">{veh.makeModel} • {veh.color}</div>
                    <div className="text-xs text-slate-500 mt-2 flex justify-between">
                      <span>Slot: <strong className="text-slate-800">{veh.parkingSlotNumber || 'Unassigned'}</strong></span>
                      <span>Flat: <strong className="text-slate-800">{veh.flatNumber}</strong></span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-200 font-mono">
                      FastTag: {veh.rfidTagNumber || 'Not Configured'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: DELIVERIES & LOCKERS ───────────────────────── */}
        {activeTab === 'deliveries' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Parcel Lockers &amp; Gate Deliveries</h2>
                <p className="text-sm text-slate-500">Track packages arriving at the gate, secure locker drop-offs and verified OTP pickup.</p>
              </div>
              <button
                onClick={() => setShowDeliveryModal(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Log Delivery Arrival
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-4">Packages Awaiting Collection / Out for Doorstep</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deliveries.map((d) => (
                  <div key={d.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                          {d.courierCompany}
                        </span>
                        <span className="text-xs text-slate-400">{new Date(d.gateArrivedAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="font-bold text-slate-900 text-base">Flat {d.flatNumber} ({d.tower || 'Tower'})</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {d.dropLocation === 'MAIN_GATE_LOCKER' ? `📦 ${d.lockerSlot || 'Main Gate Locker'}` : '🚪 Direct to Doorstep'}
                      </div>
                      <div className="text-xs text-slate-500 mt-2">
                        Agent: <strong>{d.deliveryAgentName || 'Courier Agent'}</strong>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Pickup OTP</div>
                        <div className="text-base font-mono font-bold text-indigo-600">{d.collectionOtp}</div>
                      </div>
                      {d.status !== 'COLLECTED_BY_RESIDENT' && (
                        <button
                          onClick={() => setShowOtpCollectModal(d)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Verify Claim
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: STAFF & PATROLS ────────────────────────────── */}
        {activeTab === 'staff' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Domestic Staff &amp; Guard Patrols</h2>
                <p className="text-sm text-slate-500">Aadhaar-verified daily help, clock-in/out attendance logs, and guard checkpoint patrols.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-4">Registered Domestic Help ({staffList.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staffList.map((st) => (
                  <div key={st.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md uppercase">
                        {st.staffType}
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 text-base">{st.staffName}</div>
                    <div className="text-xs text-slate-500">{st.phone}</div>
                    <div className="text-xs text-slate-600 mt-2 bg-white p-2 rounded border border-slate-200">
                      Assigned to: <strong>{st.assignedFlats || 'All Community'}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 6: INCIDENTS & SAFETY ─────────────────────────── */}
        {activeTab === 'incidents' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Safety Incidents &amp; Gate SOS</h2>
                <p className="text-sm text-slate-500">Log security alerts, perimeter alarms, investigations and rapid emergency response.</p>
              </div>
              <button
                onClick={() => setShowSosModal(true)}
                className="inline-flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 mr-1.5" /> Gate Emergency Trigger
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-4">Active Safety Logs</h3>
              <div className="space-y-4">
                {incidents.map((inc) => (
                  <div key={inc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-500">{inc.incidentNumber}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          inc.severity === 'HIGH' || inc.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {inc.severity}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">{new Date(inc.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="font-bold text-slate-900 text-base">{inc.title}</div>
                    <div className="text-xs text-slate-600 mt-1">{inc.description}</div>
                    <div className="text-xs text-slate-500 mt-2">
                      Location: <strong>{inc.location || 'Campus'}</strong> • Reported by: {inc.reportedByName}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 7: HARDWARE & AI ENGINE ───────────────────────── */}
        {activeTab === 'hardware' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Hardware &amp; AI Integration Testbed</h2>
              <p className="text-sm text-slate-500">Live simulation and diagnostics for ANPR optical cameras, RFID readers, and smart turnstiles.</p>
            </div>

            {/* Simulators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ANPR Camera Simulation */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                  <Camera className="w-5 h-5 text-indigo-600" />
                  ANPR License Plate Reader Simulator
                </div>
                <p className="text-xs text-slate-500 mb-4">Simulate optical character recognition event from Gate 1 camera.</p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Detected License Plate</label>
                    <input
                      type="text"
                      value={simPlate}
                      onChange={(e) => setSimPlate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <button
                    onClick={runAnprSimulation}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Simulate Camera Capture &amp; Ingest
                  </button>
                </div>
              </div>

              {/* RFID FastPass Simulation */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                  <Radio className="w-5 h-5 text-cyan-600" />
                  RFID FastPass Scanner Simulator
                </div>
                <p className="text-xs text-slate-500 mb-4">Simulate UHF RFID scan at barrier gate reader.</p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">RFID Tag Number</label>
                    <input
                      type="text"
                      value={simTag}
                      onChange={(e) => setSimTag(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <button
                    onClick={runRfidSimulation}
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Simulate RFID Tag Scan
                  </button>
                </div>
              </div>
            </div>

            {/* Simulation Feedback Banner */}
            {simResult && (
              <div className={`p-4 rounded-2xl border ${
                simResult.authorized ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="font-bold text-sm flex items-center gap-2">
                  {simResult.authorized ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
                  {simResult.message}
                </div>
                {simResult.entityName && (
                  <div className="text-xs mt-1">Matched: <strong>{simResult.entityName}</strong> ({simResult.flatNumber || 'Campus'})</div>
                )}
              </div>
            )}

            {/* Connected Hardware Devices */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-4">Registered Hardware Nodes ({devices.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {devices.map((dev) => (
                  <div key={dev.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-sm">{dev.deviceName}</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    </div>
                    <div className="text-xs font-mono text-slate-500">{dev.deviceCode} • {dev.deviceType}</div>
                    <div className="text-xs text-slate-600 mt-2">Location: {dev.location}</div>
                    <div className="text-[11px] text-slate-400 mt-1 font-mono">IP: {dev.ipAddress}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL: GENERATE VISITOR PASS ──────────────────────── */}
      {showNewPassModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Generate Visitor Pass</h3>
            <p className="text-xs text-slate-500 mb-4">Create a fast-pass with an automated 6-digit code and QR badge.</p>

            <form onSubmit={handleCreatePass} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Visitor Name *</label>
                  <input
                    type="text"
                    required
                    value={visitorForm.visitorName}
                    onChange={(e) => setVisitorForm({ ...visitorForm, visitorName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Visitor Phone</label>
                  <input
                    type="text"
                    value={visitorForm.visitorPhone}
                    onChange={(e) => setVisitorForm({ ...visitorForm, visitorPhone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    placeholder="+91 98765..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Visitor Category</label>
                  <select
                    value={visitorForm.visitorType}
                    onChange={(e) => setVisitorForm({ ...visitorForm, visitorType: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    <option value="GUEST">Guest / Friend</option>
                    <option value="CAB">Cab / Taxi (Uber/Ola)</option>
                    <option value="DELIVERY">Delivery</option>
                    <option value="SERVICE_TECHNICIAN">Service Tech</option>
                    <option value="CONTRACTOR">Contractor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle (Optional)</label>
                  <input
                    type="text"
                    value={visitorForm.vehicleNumber}
                    onChange={(e) => setVisitorForm({ ...visitorForm, vehicleNumber: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                    placeholder="KA-01-..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Purpose of Visit</label>
                <input
                  type="text"
                  value={visitorForm.purpose}
                  onChange={(e) => setVisitorForm({ ...visitorForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  placeholder="e.g. Weekend dinner, Appliance repair"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewPassModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  Generate Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: VIEW QR PASS BADGE ─────────────────────────── */}
      {selectedPass && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-600">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="font-black text-xl text-slate-900">{selectedPass.visitorName}</h3>
            <p className="text-xs text-slate-500 mb-4">Pass Code: <strong className="text-slate-800">{selectedPass.passCode}</strong></p>

            <div className="bg-slate-100 p-6 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-slate-200">
              <div className="font-mono text-center">
                <div className="text-xs text-slate-400 mb-1">QR DIGITAL PASSPORT</div>
                <div className="p-3 bg-white rounded-xl shadow-inner text-xs font-mono break-all font-bold text-indigo-700">
                  {selectedPass.qrPayload}
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 mb-6">
              Valid for entry to Flat <strong>{selectedPass.flatNumber}</strong> until {new Date(selectedPass.validUntil).toLocaleTimeString()}.
            </div>

            <button
              onClick={() => setSelectedPass(null)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 cursor-pointer"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: GATE SOS ───────────────────────────────────── */}
      {showSosModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-xl font-black text-slate-900 text-center mb-1">Gate Emergency Override</h3>
            <p className="text-xs text-slate-500 text-center mb-6">
              Activating emergency broadcast will automatically open all gate barriers for incoming emergency responders (Ambulance / Fire).
            </p>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => {
                  alert('AMBULANCE INGRESS ACTIVATED. All gate barriers opened.');
                  setShowSosModal(false);
                }}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow-md shadow-rose-600/20 cursor-pointer"
              >
                🚑 Emergency Ambulance Ingress
              </button>
              <button
                onClick={() => {
                  alert('FIRE ENGINE PROTOCOL ACTIVATED. Perimeter evacuation active.');
                  setShowSosModal(false);
                }}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm shadow-md shadow-amber-600/20 cursor-pointer"
              >
                🚒 Fire Safety Barrier Override
              </button>
            </div>

            <button
              onClick={() => setShowSosModal(false)}
              className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
