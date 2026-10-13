import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
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
import { CommunityTrustAndSafetyDashboard } from './CommunityTrustAndSafetyDashboard';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'trust-hub' | 'visitors' | 'vehicles' | 'deliveries' | 'staff' | 'incidents' | 'hardware'>('overview');

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
    <div className="min-h-screen bg-[#F9FAFC] text-[#44475B] pb-16">
      {/* ── Top Hero & Security Status Bar (Groww Clean Slate) ────────────────────── */}
      <div className="bg-white border-b border-[#EBEFF2] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E6FAF5] text-[#008767] border border-[#A7F3D0]">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#00D09C]" />
                  COMMAND NETWORK ACTIVE
                </span>
                <span className="text-xs text-[#7C7E8C] font-mono">Port 8096 Live Stream</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#44475B] flex items-center gap-2">
                Safety &amp; Security Command Center
              </h1>
              <p className="text-sm text-[#7C7E8C] mt-1 max-w-3xl">
                Integrated gate intelligence, visitor digital passports, vehicle ANPR/RFID tracking, parcel lockers &amp; hardware automation.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSosModal(true)}
                className="inline-flex items-center px-4 py-2.5 bg-[#EB5B5B] hover:bg-[#DC2626] text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <ShieldAlert className="w-4 h-4 mr-2" />
                Gate SOS / Override
              </button>

              <button
                onClick={() => setShowNewPassModal(true)}
                className="inline-flex items-center px-4 py-2.5 bg-[#00D09C] hover:bg-[#008767] text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm shadow-[#00D09C]/25 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Generate Visitor Pass
              </button>
            </div>
          </div>

          {/* ── Live KPI Metrics Bar (Groww Clean Cards) ────────────────────── */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-[#EBEFF2]">
              <div className="bg-[#F9FAFC] hover:bg-white rounded-xl p-3.5 border border-[#EBEFF2] transition-all shadow-xs">
                <div className="flex items-center justify-between text-xs text-[#7C7E8C] mb-1 font-medium">
                  <span>Active Visitors</span>
                  <div className="w-6 h-6 rounded-lg bg-[#EEF2FF] flex items-center justify-center text-[#5367FF]">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl font-bold text-[#44475B] mt-1">{summary.activeVisitorsInside}</div>
                <div className="text-[10px] text-[#7C7E8C] mt-0.5">On campus now</div>
              </div>

              <div className="bg-[#F9FAFC] hover:bg-white rounded-xl p-3.5 border border-[#EBEFF2] transition-all shadow-xs">
                <div className="flex items-center justify-between text-xs text-[#7C7E8C] mb-1 font-medium">
                  <span>Gate Deliveries</span>
                  <div className="w-6 h-6 rounded-lg bg-[#FFFBEB] flex items-center justify-center text-[#FFB800]">
                    <Package className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl font-bold text-[#FFB800] mt-1">{summary.pendingDeliveries}</div>
                <div className="text-[10px] text-[#7C7E8C] mt-0.5">Pending claim</div>
              </div>

              <div className="bg-[#F9FAFC] hover:bg-white rounded-xl p-3.5 border border-[#EBEFF2] transition-all shadow-xs">
                <div className="flex items-center justify-between text-xs text-[#7C7E8C] mb-1 font-medium">
                  <span>Vehicles Today</span>
                  <div className="w-6 h-6 rounded-lg bg-[#E6FAF5] flex items-center justify-center text-[#008767]">
                    <Car className="w-3.5 h-3.5 text-[#00D09C]" />
                  </div>
                </div>
                <div className="text-xl font-bold text-[#008767] mt-1">
                  +{summary.vehicleEntriesToday} <span className="text-xs font-normal text-[#7C7E8C]">/ -{summary.vehicleExitsToday}</span>
                </div>
                <div className="text-[10px] text-[#7C7E8C] mt-0.5">In / Out gates</div>
              </div>

              <div className="bg-[#F9FAFC] hover:bg-white rounded-xl p-3.5 border border-[#EBEFF2] transition-all shadow-xs">
                <div className="flex items-center justify-between text-xs text-[#7C7E8C] mb-1 font-medium">
                  <span>Duty Staff</span>
                  <div className="w-6 h-6 rounded-lg bg-[#E6FAF5] flex items-center justify-center text-[#008767]">
                    <UserCheck className="w-3.5 h-3.5 text-[#00D09C]" />
                  </div>
                </div>
                <div className="text-xl font-bold text-[#008767] mt-1">{summary.staffOnDuty}</div>
                <div className="text-[10px] text-[#7C7E8C] mt-0.5">Active on shift</div>
              </div>

              <div className="bg-[#F9FAFC] hover:bg-white rounded-xl p-3.5 border border-[#EBEFF2] transition-all shadow-xs">
                <div className="flex items-center justify-between text-xs text-[#7C7E8C] mb-1 font-medium">
                  <span>Parking Violations</span>
                  <div className="w-6 h-6 rounded-lg bg-[#FEEFEF] flex items-center justify-center text-[#DC2626]">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#EB5B5B]" />
                  </div>
                </div>
                <div className="text-xl font-bold text-[#DC2626] mt-1">{summary.activeParkingViolations}</div>
                <div className="text-[10px] text-[#7C7E8C] mt-0.5">Requires action</div>
              </div>

              <div className="bg-[#F9FAFC] hover:bg-white rounded-xl p-3.5 border border-[#EBEFF2] transition-all shadow-xs">
                <div className="flex items-center justify-between text-xs text-[#7C7E8C] mb-1 font-medium">
                  <span>Hardware Nodes</span>
                  <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl font-bold text-purple-700 mt-1">{devices.length} Online</div>
                <div className="text-[10px] text-[#7C7E8C] mt-0.5">Zero packet drop</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation Tabs (Groww Clean Slate Pill Bar) ───────── */}
      <div className="bg-white border-b border-[#EBEFF2] sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1.5 sm:space-x-2 overflow-x-auto py-2.5 hide-scrollbar">
            {[
              { id: 'overview', label: 'Command Stream', icon: Radio },
              { id: 'trust-hub', label: 'Trust & Safety Hub', icon: Shield },
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
                  className={`inline-flex items-center px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer border ${
                    active
                      ? 'bg-[#E6FAF5] text-[#008767] border-[#A7F3D0] shadow-xs'
                      : 'border-transparent text-[#7C7E8C] hover:text-[#44475B] hover:bg-[#F9FAFC] hover:border-[#EBEFF2]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 ${active ? 'text-[#00D09C]' : 'text-[#9CA3AF]'}`} />
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Left 2 Cols: Live Gate Stream */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EBEFF2] shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#EBEFF2]">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#44475B] flex items-center gap-2">
                      <Radio className="w-4.5 h-4.5 text-[#00D09C] animate-pulse" />
                      Live Gate Access Stream
                    </h2>
                    <p className="text-xs text-[#7C7E8C] mt-0.5">Real-time barrier actuations, ANPR camera triggers &amp; FastPass scans</p>
                  </div>
                  <span className="self-start sm:self-auto text-xs bg-[#E6FAF5] text-[#008767] border border-[#A7F3D0] px-2.5 py-1 rounded-full font-bold">
                    ● Live Stream Connected
                  </span>
                </div>

                <div className="space-y-2.5">
                  {summary?.recentGateActivities.map((act, i) => (
                    <div
                      key={act.id || i}
                      className="flex items-center justify-between p-3.5 bg-[#F9FAFC] hover:bg-white rounded-xl border border-[#EBEFF2] hover:border-[#A7F3D0] transition-all shadow-2xs group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          act.triggerSource === 'ANPR' ? 'bg-[#EEF2FF] text-[#5367FF]' : 'bg-[#E6FAF5] text-[#008767]'
                        }`}>
                          {act.triggerSource}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-[#44475B] text-sm flex items-center gap-2 truncate">
                            <span className="font-mono">{act.licensePlate}</span>
                            <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              act.direction === 'IN' ? 'bg-[#E6FAF5] text-[#008767] border border-[#A7F3D0]' : 'bg-[#F1F4F7] text-[#7C7E8C]'
                            }`}>
                              {act.direction}
                            </span>
                          </div>
                          <div className="text-xs text-[#7C7E8C] mt-0.5 truncate">
                            {act.gateName || 'Main Gate 1'} • {new Date(act.accessTime).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center text-xs font-semibold text-[#008767] bg-[#E6FAF5] border border-[#A7F3D0] px-2.5 py-1 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-[#00D09C]" />
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
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EBEFF2] shadow-xs">
                <h3 className="font-bold text-[#44475B] text-base mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#00D09C]" />
                  Security Shift on Duty
                </h3>
                <div className="space-y-3">
                  <div className="p-3.5 bg-[#F9FAFC] rounded-xl border border-[#EBEFF2]">
                    <div className="text-[11px] text-[#7C7E8C] font-semibold uppercase tracking-wider">Shift Commander</div>
                    <div className="font-bold text-[#44475B] text-sm mt-0.5">Supervisor Raghavendra S.</div>
                    <div className="text-xs text-[#008767] mt-1.5 flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-[#00D09C] animate-pulse"></span> On Duty • 06:00 - 14:00 (Morning Shift)
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#F9FAFC] rounded-xl border border-[#EBEFF2]">
                    <div className="text-[11px] text-[#7C7E8C] font-semibold uppercase tracking-wider">Gate 1 (Main Inbound)</div>
                    <div className="font-bold text-[#44475B] text-sm mt-0.5">Guard Somesh &amp; Guard Kiran</div>
                    <div className="text-xs text-[#7C7E8C] mt-1">ANPR Lane 1 &amp; Visitor Booth Active</div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#EBEFF2] rounded-2xl p-6 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-[#E6FAF5] rounded-bl-full pointer-events-none -mr-6 -mt-6"></div>
                <h3 className="font-bold text-base text-[#44475B] mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#00D09C]" />
                  AI Gate Intelligence
                </h3>
                <p className="text-xs text-[#7C7E8C] leading-relaxed">
                  Automatic license plate matching is currently operating at <strong className="text-[#008767]">99.4% confidence</strong> with automated boom barrier clearance and real-time ANPR logging.
                </p>
                <button
                  onClick={() => setActiveTab('hardware')}
                  className="mt-4 w-full py-2.5 bg-[#F9FAFC] hover:bg-[#E6FAF5] text-[#008767] border border-[#A7F3D0] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                >
                  Open Hardware Simulator <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: TRUST & SAFETY HUB ───────────────────────────── */}
        {activeTab === 'trust-hub' && (
          <div className="space-y-6">
            <CommunityTrustAndSafetyDashboard />
          </div>
        )}

        {/* ── TAB 2: VISITORS & PASSES ──────────────────────────── */}
        {activeTab === 'visitors' && (
          <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#44475B]">Visitor Passes &amp; Digital Badges</h2>
                <p className="text-sm text-[#7C7E8C]">Generate time-bounded 6-digit codes and QR passes for expected guests, cabs and contractors.</p>
              </div>
              <button
                onClick={() => setShowNewPassModal(true)}
                className="inline-flex items-center px-4 py-2.5 bg-[#00D09C] hover:bg-[#008767] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 mr-1.5" /> New Visitor Pass
              </button>
            </div>

            {/* Currently Active Visitors on Premises */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EBEFF2] shadow-xs">
              <h3 className="font-bold text-[#44475B] text-base mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#00D09C]" />
                Visitors Currently Inside Campus ({activeVisitors.filter(v => v.status === 'CHECKED_IN').length})
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#44475B]">
                  <thead className="bg-[#F9FAFC] text-[#7C7E8C] text-xs uppercase border-b border-[#EBEFF2]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Visitor</th>
                      <th className="py-3 px-4 font-semibold">Destination</th>
                      <th className="py-3 px-4 font-semibold">Vehicle</th>
                      <th className="py-3 px-4 font-semibold">Entry Time</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBEFF2]">
                    {activeVisitors.filter(v => v.status === 'CHECKED_IN').map((v) => (
                      <tr key={v.id} className="hover:bg-[#F9FAFC] transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-[#44475B]">
                          {v.visitorName}
                          <div className="text-xs text-[#7C7E8C] font-normal">{v.visitorPhone || 'No phone'}</div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#44475B]">{v.flatNumber} ({v.tower || 'Tower'})</td>
                        <td className="py-3.5 px-4 text-xs font-mono">{v.vehicleNumber || 'Pedestrian'}</td>
                        <td className="py-3.5 px-4 text-xs text-[#7C7E8C]">{new Date(v.entryTime).toLocaleTimeString()}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-[#E6FAF5] text-[#008767] border border-[#A7F3D0]">
                            CHECKED IN
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleCheckOut(v.id)}
                            className="text-xs font-semibold px-3 py-1.5 bg-[#F1F4F7] hover:bg-[#FEEFEF] hover:text-[#DC2626] text-[#44475B] rounded-lg transition-colors cursor-pointer"
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
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EBEFF2] shadow-xs">
              <h3 className="font-bold text-[#44475B] text-base mb-4">Pre-Approved Passes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {passes.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl border border-[#EBEFF2] bg-[#F9FAFC] hover:border-[#A7F3D0] hover:bg-white transition-all shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-[#E6FAF5] text-[#008767] border border-[#A7F3D0] rounded-md">
                        {p.visitorType}
                      </span>
                      <span className="text-xs text-[#7C7E8C]">{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="font-bold text-[#44475B] text-base">{p.visitorName}</div>
                    <div className="text-xs text-[#7C7E8C] mb-3">{p.purpose || 'Personal Visit'} • Flat {p.flatNumber}</div>

                    <div className="p-3 bg-white rounded-xl border border-[#EBEFF2] flex items-center justify-between shadow-xs">
                      <div>
                        <div className="text-[10px] text-[#7C7E8C] font-semibold uppercase tracking-wider">Pass Code</div>
                        <div className="text-lg font-black tracking-widest text-[#008767] font-mono">{p.passCode}</div>
                      </div>
                      <button
                        onClick={() => setSelectedPass(p)}
                        className="px-2.5 py-1 text-xs font-semibold bg-[#F1F4F7] hover:bg-[#E6FAF5] hover:text-[#008767] text-[#44475B] rounded-lg cursor-pointer flex items-center gap-1 transition-colors"
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
          <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#44475B]">Vehicle Registry &amp; Parking Enforcement</h2>
                <p className="text-sm text-[#7C7E8C]">Manage resident fast-pass tags, parking bays, and enforce parking violations.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowViolationModal(true)}
                  className="inline-flex items-center px-4 py-2.5 bg-[#EB5B5B] hover:bg-[#DC2626] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <AlertTriangle className="w-4 h-4 mr-1.5" /> Report Violation
                </button>
                <button
                  onClick={() => setShowNewVehicleModal(true)}
                  className="inline-flex items-center px-4 py-2.5 bg-[#00D09C] hover:bg-[#008767] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Register Vehicle
                </button>
              </div>
            </div>

            {/* Parking Violations Active */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EBEFF2] shadow-xs">
              <h3 className="font-bold text-[#44475B] text-base mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#EB5B5B]" />
                Active Parking Violations ({violations.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {violations.map((v) => (
                  <div key={v.id} className="p-4 rounded-xl border border-[#FECACA] bg-[#FEEFEF]/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 bg-[#FEEFEF] text-[#DC2626] border border-[#FECACA] rounded-md">
                        {v.violationType.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm font-bold text-[#DC2626]">₹{v.fineAmount} Fine</span>
                    </div>
                    <div className="font-bold text-[#44475B] text-base font-mono">{v.vehicleNumber}</div>
                    <div className="text-xs text-[#7C7E8C] mt-1">{v.description}</div>
                    <div className="text-[11px] text-[#9CA3AF] mt-2">
                      Reported by {v.reportedByName} • {new Date(v.reportedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Registered Vehicles */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EBEFF2] shadow-xs">
              <h3 className="font-bold text-[#44475B] text-base mb-4">Resident Registered Vehicles</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {vehicles.map((veh) => (
                  <div key={veh.id} className="p-4 rounded-xl border border-[#EBEFF2] bg-[#F9FAFC] hover:border-[#A7F3D0] hover:bg-white transition-all shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-[#44475B] text-base">{veh.licensePlate}</span>
                      {veh.isEv && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-[#E6FAF5] text-[#008767] border border-[#A7F3D0] rounded-full">
                          ⚡ EV
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-[#44475B]">{veh.makeModel} • {veh.color}</div>
                    <div className="text-xs text-[#7C7E8C] mt-2 flex justify-between">
                      <span>Slot: <strong className="text-[#44475B]">{veh.parkingSlotNumber || 'Unassigned'}</strong></span>
                      <span>Flat: <strong className="text-[#44475B]">{veh.flatNumber}</strong></span>
                    </div>
                    <div className="text-[11px] text-[#7C7E8C] mt-2 pt-2 border-t border-[#EBEFF2] font-mono">
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
          <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#44475B]">Parcel Lockers &amp; Gate Deliveries</h2>
                <p className="text-sm text-[#7C7E8C]">Track packages arriving at the gate, secure locker drop-offs and verified OTP pickup.</p>
              </div>
              <button
                onClick={() => setShowDeliveryModal(true)}
                className="inline-flex items-center px-4 py-2.5 bg-[#00D09C] hover:bg-[#008767] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Log Delivery Arrival
              </button>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EBEFF2] shadow-xs">
              <h3 className="font-bold text-[#44475B] text-base mb-4">Packages Awaiting Collection / Out for Doorstep</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deliveries.map((d) => (
                  <div key={d.id} className="p-4 rounded-xl border border-[#EBEFF2] bg-[#F9FAFC] hover:border-[#A7F3D0] hover:bg-white transition-all shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold px-2 py-0.5 bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] rounded-md">
                          {d.courierCompany}
                        </span>
                        <span className="text-xs text-[#7C7E8C]">{new Date(d.gateArrivedAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="font-bold text-[#44475B] text-base">Flat {d.flatNumber} ({d.tower || 'Tower'})</div>
                      <div className="text-xs text-[#7C7E8C] mt-0.5">
                        {d.dropLocation === 'MAIN_GATE_LOCKER' ? `📦 ${d.lockerSlot || 'Main Gate Locker'}` : '🚪 Direct to Doorstep'}
                      </div>
                      <div className="text-xs text-[#7C7E8C] mt-2">
                        Agent: <strong className="text-[#44475B]">{d.deliveryAgentName || 'Courier Agent'}</strong>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#EBEFF2] flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-[#7C7E8C] font-semibold uppercase">Pickup OTP</div>
                        <div className="text-base font-mono font-bold text-[#008767]">{d.collectionOtp}</div>
                      </div>
                      {d.status !== 'COLLECTED_BY_RESIDENT' && (
                        <button
                          onClick={() => setShowOtpCollectModal(d)}
                          className="px-3 py-1.5 bg-[#00D09C] hover:bg-[#008767] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer active:scale-95"
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
          <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#44475B]">Domestic Staff &amp; Guard Patrols</h2>
                <p className="text-sm text-[#7C7E8C]">Aadhaar-verified daily help, clock-in/out attendance logs, and guard checkpoint patrols.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EBEFF2] shadow-xs">
              <h3 className="font-bold text-[#44475B] text-base mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#00D09C]" />
                Registered Domestic Help ({staffList.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staffList.map((st) => (
                  <div key={st.id} className="p-4 rounded-xl border border-[#EBEFF2] bg-[#F9FAFC] hover:border-[#A7F3D0] hover:bg-white transition-all shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 bg-[#EEF2FF] text-[#5367FF] border border-[#C7D2FE] rounded-md uppercase">
                        {st.staffType}
                      </span>
                      <span className="text-xs font-semibold text-[#008767] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00D09C]" /> Verified
                      </span>
                    </div>
                    <div className="font-bold text-[#44475B] text-base">{st.staffName}</div>
                    <div className="text-xs text-[#7C7E8C]">{st.phone}</div>
                    <div className="text-xs text-[#7C7E8C] mt-2 bg-white p-2.5 rounded-lg border border-[#EBEFF2]">
                      Assigned to: <strong className="text-[#44475B]">{st.assignedFlats || 'All Community'}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 6: INCIDENTS & SAFETY ─────────────────────────── */}
        {activeTab === 'incidents' && (
          <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#44475B]">Safety Incidents &amp; Gate SOS</h2>
                <p className="text-sm text-[#7C7E8C]">Log security alerts, perimeter alarms, investigations and rapid emergency response.</p>
              </div>
              <button
                onClick={() => setShowSosModal(true)}
                className="inline-flex items-center px-4 py-2.5 bg-[#EB5B5B] hover:bg-[#DC2626] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 self-start sm:self-auto"
              >
                <ShieldAlert className="w-4 h-4 mr-1.5" /> Gate Emergency Trigger
              </button>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EBEFF2] shadow-xs">
              <h3 className="font-bold text-[#44475B] text-base mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#EB5B5B]" />
                Active Safety Logs
              </h3>
              <div className="space-y-3">
                {incidents.map((inc) => (
                  <div key={inc.id} className="p-4 rounded-xl border border-[#EBEFF2] bg-[#F9FAFC] hover:border-[#DFE4E8] transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#7C7E8C]">{inc.incidentNumber}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          inc.severity === 'HIGH' || inc.severity === 'CRITICAL' ? 'bg-[#FEEFEF] text-[#DC2626] border border-[#FECACA]' : 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
                        }`}>
                          {inc.severity}
                        </span>
                      </div>
                      <span className="text-xs text-[#9CA3AF]">{new Date(inc.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="font-bold text-[#44475B] text-base">{inc.title}</div>
                    <div className="text-xs text-[#7C7E8C] mt-1">{inc.description}</div>
                    <div className="text-xs text-[#7C7E8C] mt-2">
                      Location: <strong className="text-[#44475B]">{inc.location || 'Campus'}</strong> • Reported by: {inc.reportedByName}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 7: HARDWARE & AI ENGINE ───────────────────────── */}
        {activeTab === 'hardware' && (
          <div className="space-y-6 sm:space-y-8">
            <div>
              <h2 className="text-xl font-bold text-[#44475B]">Hardware &amp; AI Integration Testbed</h2>
              <p className="text-sm text-[#7C7E8C]">Live simulation and diagnostics for ANPR optical cameras, RFID readers, and smart turnstiles.</p>
            </div>

            {/* Simulators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ANPR Camera Simulation */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EBEFF2] shadow-xs">
                <div className="flex items-center gap-2 font-bold text-[#44475B] mb-1">
                  <Camera className="w-5 h-5 text-[#5367FF]" />
                  ANPR License Plate Reader Simulator
                </div>
                <p className="text-xs text-[#7C7E8C] mb-4">Simulate optical character recognition event from Gate 1 camera.</p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#44475B] mb-1">Detected License Plate</label>
                    <input
                      type="text"
                      value={simPlate}
                      onChange={(e) => setSimPlate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#EBEFF2] rounded-xl font-mono font-bold text-[#44475B] bg-[#F9FAFC] focus:border-[#00D09C] outline-none"
                    />
                  </div>
                  <button
                    onClick={runAnprSimulation}
                    className="w-full py-2.5 bg-[#5367FF] hover:bg-[#4338CA] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs active:scale-98"
                  >
                    Simulate Camera Capture &amp; Ingest
                  </button>
                </div>
              </div>

              {/* RFID FastPass Simulation */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EBEFF2] shadow-xs">
                <div className="flex items-center gap-2 font-bold text-[#44475B] mb-1">
                  <Radio className="w-5 h-5 text-[#00D09C]" />
                  RFID FastPass Scanner Simulator
                </div>
                <p className="text-xs text-[#7C7E8C] mb-4">Simulate UHF RFID scan at barrier gate reader.</p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#44475B] mb-1">RFID Tag Number</label>
                    <input
                      type="text"
                      value={simTag}
                      onChange={(e) => setSimTag(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#EBEFF2] rounded-xl font-mono font-bold text-[#44475B] bg-[#F9FAFC] focus:border-[#00D09C] outline-none"
                    />
                  </div>
                  <button
                    onClick={runRfidSimulation}
                    className="w-full py-2.5 bg-[#00D09C] hover:bg-[#008767] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs active:scale-98"
                  >
                    Simulate RFID Tag Scan
                  </button>
                </div>
              </div>
            </div>

            {/* Simulation Feedback Banner */}
            {simResult && (
              <div className={`p-4 rounded-2xl border ${
                simResult.authorized ? 'bg-[#E6FAF5] border-[#A7F3D0] text-[#008767]' : 'bg-[#FEEFEF] border-[#FECACA] text-[#DC2626]'
              }`}>
                <div className="font-bold text-sm flex items-center gap-2">
                  {simResult.authorized ? <CheckCircle2 className="w-5 h-5 text-[#00D09C]" /> : <XCircle className="w-5 h-5 text-[#EB5B5B]" />}
                  {simResult.message}
                </div>
                {simResult.entityName && (
                  <div className="text-xs mt-1">Matched: <strong className="font-semibold">{simResult.entityName}</strong> ({simResult.flatNumber || 'Campus'})</div>
                )}
              </div>
            )}

            {/* Connected Hardware Devices */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EBEFF2] shadow-xs">
              <h3 className="font-bold text-[#44475B] text-base mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#00D09C]" />
                Registered Hardware Nodes ({devices.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {devices.map((dev) => (
                  <div key={dev.id} className="p-4 rounded-xl border border-[#EBEFF2] bg-[#F9FAFC] hover:border-[#A7F3D0] hover:bg-white transition-all shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#44475B] text-sm">{dev.deviceName}</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#00D09C]"></span>
                    </div>
                    <div className="text-xs font-mono text-[#7C7E8C]">{dev.deviceCode} • {dev.deviceType}</div>
                    <div className="text-xs text-[#7C7E8C] mt-2">Location: <strong className="text-[#44475B]">{dev.location}</strong></div>
                    <div className="text-[11px] text-[#9CA3AF] mt-1 font-mono">IP: {dev.ipAddress}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL: GENERATE VISITOR PASS ──────────────────────── */}
      {showNewPassModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#EBEFF2] animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-[#44475B] mb-1">Generate Visitor Pass</h3>
            <p className="text-xs text-[#7C7E8C] mb-4">Create a fast-pass with an automated 6-digit code and QR badge.</p>

            <form onSubmit={handleCreatePass} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#44475B] mb-1">Visitor Name *</label>
                  <input
                    type="text"
                    required
                    value={visitorForm.visitorName}
                    onChange={(e) => setVisitorForm({ ...visitorForm, visitorName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#EBEFF2] rounded-xl bg-[#F9FAFC] focus:border-[#00D09C] outline-none text-[#44475B]"
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#44475B] mb-1">Visitor Phone</label>
                  <input
                    type="text"
                    value={visitorForm.visitorPhone}
                    onChange={(e) => setVisitorForm({ ...visitorForm, visitorPhone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#EBEFF2] rounded-xl bg-[#F9FAFC] focus:border-[#00D09C] outline-none text-[#44475B]"
                    placeholder="+91 98765..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#44475B] mb-1">Visitor Category</label>
                  <select
                    value={visitorForm.visitorType}
                    onChange={(e) => setVisitorForm({ ...visitorForm, visitorType: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-[#EBEFF2] rounded-xl bg-[#F9FAFC] focus:border-[#00D09C] outline-none text-[#44475B]"
                  >
                    <option value="GUEST">Guest / Friend</option>
                    <option value="CAB">Cab / Taxi (Uber/Ola)</option>
                    <option value="DELIVERY">Delivery</option>
                    <option value="SERVICE_TECHNICIAN">Service Tech</option>
                    <option value="CONTRACTOR">Contractor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#44475B] mb-1">Vehicle (Optional)</label>
                  <input
                    type="text"
                    value={visitorForm.vehicleNumber}
                    onChange={(e) => setVisitorForm({ ...visitorForm, vehicleNumber: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#EBEFF2] rounded-xl bg-[#F9FAFC] focus:border-[#00D09C] outline-none font-mono text-[#44475B]"
                    placeholder="KA-01-..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#44475B] mb-1">Purpose of Visit</label>
                <input
                  type="text"
                  value={visitorForm.purpose}
                  onChange={(e) => setVisitorForm({ ...visitorForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#EBEFF2] rounded-xl bg-[#F9FAFC] focus:border-[#00D09C] outline-none text-[#44475B]"
                  placeholder="e.g. Weekend dinner, Appliance repair"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#EBEFF2]">
                <button
                  type="button"
                  onClick={() => setShowNewPassModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#7C7E8C] hover:bg-[#F1F4F7] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00D09C] hover:bg-[#008767] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer active:scale-95"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-[#EBEFF2] animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-[#E6FAF5] rounded-2xl flex items-center justify-center mx-auto mb-3 text-[#008767]">
              <QrCode className="w-6 h-6 text-[#00D09C]" />
            </div>
            <h3 className="font-extrabold text-xl text-[#44475B]">{selectedPass.visitorName}</h3>
            <p className="text-xs text-[#7C7E8C] mb-4">Pass Code: <strong className="text-[#008767] font-mono text-sm">{selectedPass.passCode}</strong></p>

            <div className="bg-[#F9FAFC] p-5 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-[#EBEFF2]">
              <div className="font-mono text-center">
                <div className="text-[10px] text-[#7C7E8C] uppercase tracking-wider mb-1 font-bold">QR DIGITAL PASSPORT</div>
                <div className="p-3 bg-white rounded-xl shadow-xs text-xs font-mono break-all font-bold text-[#008767] border border-[#A7F3D0]">
                  {selectedPass.qrPayload}
                </div>
              </div>
            </div>

            <div className="text-xs text-[#7C7E8C] mb-6">
              Valid for entry to Flat <strong className="text-[#44475B]">{selectedPass.flatNumber}</strong> until {new Date(selectedPass.validUntil).toLocaleTimeString()}.
            </div>

            <button
              onClick={() => setSelectedPass(null)}
              className="w-full py-2.5 bg-[#F1F4F7] hover:bg-[#E6FAF5] text-[#008767] rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: GATE SOS ───────────────────────────────────── */}
      {showSosModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#FECACA] animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-[#FEEFEF] text-[#DC2626] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-xl font-extrabold text-[#44475B] text-center mb-1">Gate Emergency Override</h3>
            <p className="text-xs text-[#7C7E8C] text-center mb-6">
              Activating emergency broadcast will automatically open all gate barriers for incoming emergency responders (Ambulance / Fire).
            </p>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => {
                  alert('AMBULANCE INGRESS ACTIVATED. All gate barriers opened.');
                  setShowSosModal(false);
                }}
                className="w-full py-3 bg-[#EB5B5B] hover:bg-[#DC2626] text-white font-bold rounded-xl text-sm shadow-xs transition-colors cursor-pointer active:scale-98"
              >
                🚑 Emergency Ambulance Ingress
              </button>
              <button
                onClick={() => {
                  alert('FIRE ENGINE PROTOCOL ACTIVATED. Perimeter evacuation active.');
                  setShowSosModal(false);
                }}
                className="w-full py-3 bg-[#FFB800] hover:bg-[#D97706] text-white font-bold rounded-xl text-sm shadow-xs transition-colors cursor-pointer active:scale-98"
              >
                🚒 Fire Safety Barrier Override
              </button>
            </div>

            <button
              onClick={() => setShowSosModal(false)}
              className="w-full py-2 text-xs font-semibold text-[#7C7E8C] hover:text-[#44475B] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
