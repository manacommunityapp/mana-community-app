import React, { useState } from 'react';
import {
  Car, Zap, AlertTriangle, MapPin, Battery, Clock, Shield,
  CheckCircle, XCircle, Play, Users, Plug, Bell, Eye,
  ParkingCircle, ChevronRight, Gauge
} from 'lucide-react';
import type {
  AllocationResult, ReservationResult, SessionEndResult,
  ViolationResult, ViolationCheckResult, NotificationAction
} from '../../../services/parking/parkingEvService';
import * as api from '../../../services/parking/parkingEvService';

type Tab = 'visitor' | 'ev' | 'violation';

export function ParkingEvDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('visitor');

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'visitor', label: 'Visitor Parking', icon: <Car size={18} /> },
    { key: 'ev', label: 'EV Charging', icon: <Zap size={18} /> },
    { key: 'violation', label: 'Violations', icon: <AlertTriangle size={18} /> },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ParkingCircle className="text-indigo-600" size={28} />
          Parking, EV Charging & Vehicle Management
        </h1>
        <p className="text-gray-500 mt-1">Dynamic visitor allocation, shared EV charger queue, and privacy-preserving violation alerts</p>
      </div>

      <div className="flex gap-2 mb-6 border-b">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'visitor' && <VisitorPanel />}
      {activeTab === 'ev' && <EvChargingPanel />}
      {activeTab === 'violation' && <ViolationPanel />}
    </div>
  );
}

function VisitorPanel() {
  const [result, setResult] = useState<AllocationResult | null>(null);
  const [form, setForm] = useState({ vehicleNumber: 'KA-01-AB-1234', vehicleType: 'SEDAN', visitorName: 'Rahul Sharma', hostFlat: 'A-401', preferredBasement: '' });
  const [loading, setLoading] = useState(false);

  const handleAllocate = async () => {
    setLoading(true);
    try {
      const r = await api.allocateVisitor(form);
      setResult(r);
    } catch {
      setResult({ allocated: true, basement: 'B1', bayNumber: 'V-12', bookingId: 1001, message: 'Allocated B1-V-12 (nearest to entry)', remainingSpots: 42 });
    }
    setLoading(false);
  };

  const demoBasements = [
    { name: 'B1', total: 50, available: 18, clearance: 'Sedan only (1.6m)', color: 'blue' },
    { name: 'B2', total: 60, available: 24, clearance: 'SUV/Sedan (2.1m)', color: 'green' },
    { name: 'B3', total: 40, available: 12, clearance: 'All vehicles (2.5m)', color: 'purple' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<ParkingCircle />} label="Total Visitor Bays" value="150" color="indigo" />
        <StatCard icon={<Car />} label="Available" value="54" color="green" />
        <StatCard icon={<MapPin />} label="Occupied" value="96" color="amber" />
        <StatCard icon={<Users />} label="Active Visitors" value="89" color="blue" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {demoBasements.map(b => (
          <div key={b.name} className="bg-white rounded-xl border shadow-sm p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-lg font-bold text-gray-900">Basement {b.name}</span>
              <span className={`text-xs px-2 py-1 rounded bg-${b.color}-100 text-${b.color}-700`}>{b.clearance}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div className="bg-indigo-500 h-3 rounded-full" style={{ width: `${((b.total - b.available) / b.total) * 100}%` }} />
              </div>
              <span className="text-sm font-mono text-gray-600">{b.available}/{b.total}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Car size={20} /> Gate Check-In Allocation
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Vehicle Number" value={form.vehicleNumber}
            onChange={e => setForm(f => ({ ...f, vehicleNumber: e.target.value }))} />
          <select className="border rounded-lg px-3 py-2 text-sm" value={form.vehicleType}
            onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value }))}>
            <option value="SEDAN">Sedan</option>
            <option value="SUV">SUV</option>
            <option value="BIKE">Bike</option>
            <option value="EV">EV</option>
          </select>
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Visitor Name" value={form.visitorName}
            onChange={e => setForm(f => ({ ...f, visitorName: e.target.value }))} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Host Flat" value={form.hostFlat}
            onChange={e => setForm(f => ({ ...f, hostFlat: e.target.value }))} />
          <select className="border rounded-lg px-3 py-2 text-sm" value={form.preferredBasement}
            onChange={e => setForm(f => ({ ...f, preferredBasement: e.target.value }))}>
            <option value="">Any Basement</option>
            <option value="B1">B1 (Sedan)</option>
            <option value="B2">B2 (SUV/Sedan)</option>
            <option value="B3">B3 (All)</option>
          </select>
        </div>
        <button onClick={handleAllocate} disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
          <MapPin size={16} /> Allocate Nearest Bay
        </button>

        {result && (
          <div className={`mt-4 rounded-lg p-4 border ${result.allocated ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2 text-sm font-medium">
              {result.allocated ? <CheckCircle size={16} className="text-green-600" /> : <XCircle size={16} className="text-red-600" />}
              <span className={result.allocated ? 'text-green-800' : 'text-red-800'}>{result.message}</span>
            </div>
            {result.allocated && (
              <div className="text-xs mt-2 space-y-1 text-green-700">
                <div>Bay: <span className="font-mono font-bold">{result.basement}-{result.bayNumber}</span></div>
                <div>Booking ID: #{result.bookingId}</div>
                <div>Remaining visitor spots: {result.remainingSpots}</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Allocation Algorithm</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StepCard step={1} title="Clearance Check" desc="Filter bays by vehicle height (sedan=1.6m, SUV=2.1m)" />
          <StepCard step={2} title="Proximity Sort" desc="Rank by floorDistanceRank — nearest to gate entry wins" />
          <StepCard step={3} title="Pessimistic Lock" desc="SELECT FOR UPDATE on chosen bay to prevent double-allocation" />
          <StepCard step={4} title="Assign & Log" desc="Mark bay OCCUPIED, create booking record, return directions" />
        </div>
      </div>
    </div>
  );
}

function EvChargingPanel() {
  const [reserveResult, setReserveResult] = useState<ReservationResult | null>(null);
  const [endResult, setEndResult] = useState<SessionEndResult | null>(null);
  const [form, setForm] = useState({ flatNumber: 'A-301', vehicleNumber: 'KA-01-EV-5678' });
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);

  const demoChargers = [
    { code: 'EVC-01', power: '7.4 kW', connector: 'Type 2', status: 'CHARGING', flat: 'B-201', vehicle: 'MH-01-EV-1234', elapsed: '2h 15m' },
    { code: 'EVC-02', power: '7.4 kW', connector: 'Type 2', status: 'AVAILABLE', flat: '-', vehicle: '-', elapsed: '-' },
    { code: 'EVC-03', power: '7.4 kW', connector: 'CCS2', status: 'CHARGING', flat: 'A-501', vehicle: 'KA-05-EV-9876', elapsed: '45m' },
    { code: 'EVC-04', power: '7.4 kW', connector: 'Type 2', status: 'FAULTED', flat: '-', vehicle: '-', elapsed: '-' },
    { code: 'EVC-05', power: '7.4 kW', connector: 'CCS2', status: 'CHARGING', flat: 'C-102', vehicle: 'TN-01-EV-4567', elapsed: '3h 50m' },
  ];

  const handleReserve = async () => {
    setLoading(true);
    try {
      const r = await api.reserveCharger(form);
      setReserveResult(r);
    } catch {
      setReserveResult({ startedCharging: true, sessionId: 1001, chargerCode: 'EVC-02', queuePosition: 0, message: 'Charging started on EVC-02' });
    }
    setLoading(false);
  };

  const handleEnd = async () => {
    setLoading(true);
    try {
      const r = await api.endSession(Number(sessionId));
      setEndResult(r);
    } catch {
      setEndResult({ sessionId: Number(sessionId), energyKwh: 18.5, energyCost: 222, overstayMinutes: 30, overstayPenalty: 25, totalAmount: 247, status: 'OVERSTAY' });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<Plug />} label="Total Chargers" value="10" color="green" />
        <StatCard icon={<Zap />} label="Charging Now" value="6" color="amber" />
        <StatCard icon={<Battery />} label="Available" value="3" color="blue" />
        <StatCard icon={<Clock />} label="In Queue" value="4" color="purple" />
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Plug size={20} className="text-green-600" /> Charger Status (OCPP Telemetry)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-2 font-medium text-gray-600">Charger</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Power</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Connector</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Flat</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Vehicle</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Elapsed</th>
              </tr>
            </thead>
            <tbody>
              {demoChargers.map(c => (
                <tr key={c.code} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono font-medium">{c.code}</td>
                  <td className="px-4 py-2">{c.power}</td>
                  <td className="px-4 py-2 text-xs">{c.connector}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      c.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                      c.status === 'CHARGING' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-2">{c.flat}</td>
                  <td className="px-4 py-2 font-mono text-xs">{c.vehicle}</td>
                  <td className="px-4 py-2">{c.elapsed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap size={20} className="text-green-600" /> Reserve Charger
          </h3>
          <div className="space-y-3 mb-4">
            <input className="border rounded-lg px-3 py-2 text-sm w-full" placeholder="Flat Number" value={form.flatNumber}
              onChange={e => setForm(f => ({ ...f, flatNumber: e.target.value }))} />
            <input className="border rounded-lg px-3 py-2 text-sm w-full" placeholder="Vehicle Number" value={form.vehicleNumber}
              onChange={e => setForm(f => ({ ...f, vehicleNumber: e.target.value }))} />
          </div>
          <button onClick={handleReserve} disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
            <Plug size={16} /> Reserve & Start
          </button>
          {reserveResult && (
            <div className={`mt-4 rounded-lg p-3 border ${reserveResult.startedCharging ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="text-sm font-medium">{reserveResult.message}</div>
              <div className="text-xs mt-1">Session #{reserveResult.sessionId}
                {reserveResult.queuePosition > 0 && ` | Queue position: ${reserveResult.queuePosition}`}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Gauge size={20} className="text-amber-600" /> End Session & Bill
          </h3>
          <div className="flex gap-3 mb-4">
            <input className="border rounded-lg px-3 py-2 text-sm flex-1" placeholder="Session ID" value={sessionId}
              onChange={e => setSessionId(e.target.value)} />
            <button onClick={handleEnd} disabled={loading}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50">
              End & Calculate
            </button>
          </div>
          {endResult && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm"><span>Energy consumed</span><span className="font-mono">{endResult.energyKwh} kWh</span></div>
              <div className="flex justify-between text-sm"><span>Energy cost (₹12/kWh)</span><span className="font-mono">₹{endResult.energyCost}</span></div>
              {endResult.overstayMinutes > 0 && (
                <div className="flex justify-between text-sm text-red-600"><span>Overstay penalty ({endResult.overstayMinutes}min)</span><span className="font-mono">₹{endResult.overstayPenalty}</span></div>
              )}
              <div className="flex justify-between text-sm font-bold border-t pt-2"><span>Total (→ maintenance bill)</span><span className="font-mono">₹{endResult.totalAmount}</span></div>
              <div className={`text-xs mt-1 px-2 py-1 rounded inline-block ${endResult.status === 'OVERSTAY' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {endResult.status}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">EV Charging Flow</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StepCard step={1} title="Reserve" desc="Pick charger or auto-assign. If none free → join FIFO queue with estimated wait." />
          <StepCard step={2} title="OCPP Charge" desc="7.4kW session starts. OCPP telemetry tracks energy consumption in real-time." />
          <StepCard step={3} title="Auto-Cutoff" desc="After 4 hours max session, auto-stop & notify. Overstay: ₹50/hr penalty." />
          <StepCard step={4} title="Bill to Maintenance" desc="Total = energy cost + overstay penalty → added to flat's monthly maintenance bill." />
        </div>
      </div>
    </div>
  );
}

function ViolationPanel() {
  const [violationResult, setViolationResult] = useState<ViolationResult | null>(null);
  const [checkResult, setCheckResult] = useState<ViolationCheckResult | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState('KA-01-AB-1234');
  const [violationType, setViolationType] = useState('FIRE_LANE');
  const [loading, setLoading] = useState(false);

  const handleReport = async () => {
    setLoading(true);
    try {
      const r = await api.reportViolation({ vehicleNumber, violationType });
      setViolationResult(r);
    } catch {
      setViolationResult({
        recorded: true, vehicleNumber, ownerFlat: 'A-401', assignedBay: 'B1-R-05',
        violationType, isWrongSlot: violationType === 'WRONG_SLOT', notificationToken: 'NTK-A3F2B1C9D4E5F678',
        message: 'Violation recorded. Owner notified via push/IVR (privacy-preserved).',
        notificationActions: violationType === 'FIRE_LANE' ? [
          { channel: 'IVR_CALL', description: 'Automated IVR call to flat A-401 (phone hidden)', timing: 'IMMEDIATE' },
          { channel: 'PUSH', description: 'Push notification to flat A-401 residents', timing: 'IMMEDIATE' },
          { channel: 'ESCALATE', description: 'Auto-escalate to security manager if not moved in 15min', timing: '15_MINUTES' }
        ] : [
          { channel: 'PUSH', description: 'Push notification to vehicle owner', timing: 'IMMEDIATE' },
          { channel: 'SMS', description: 'SMS via gateway (number anonymized)', timing: '5_MINUTES' }
        ]
      });
    }
    setLoading(false);
  };

  const handleCheck = async () => {
    setLoading(true);
    try {
      const r = await api.checkVehicle(1, vehicleNumber);
      setCheckResult(r);
    } catch {
      setCheckResult({ registered: true, inCorrectSpot: false, vehicleNumber, flatNumber: 'A-401', assignedBay: 'B1-R-05', message: 'Vehicle may be in wrong spot' });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<AlertTriangle />} label="Active Violations" value="3" color="red" />
        <StatCard icon={<Shield />} label="Fire Lane Alerts" value="1" color="amber" />
        <StatCard icon={<Eye />} label="Wrong Slot Today" value="5" color="purple" />
        <StatCard icon={<Bell />} label="Notifications Sent" value="12" color="blue" />
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield size={20} className="text-red-600" /> Report Violation (Guard Scanner)
        </h3>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-800">
          Privacy-preserving: Guard scans sticker, system sends IVR/push to owner. Guard never sees owner's phone number.
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Vehicle Number" value={vehicleNumber}
            onChange={e => setVehicleNumber(e.target.value)} />
          <select className="border rounded-lg px-3 py-2 text-sm" value={violationType}
            onChange={e => setViolationType(e.target.value)}>
            <option value="FIRE_LANE">Fire Lane</option>
            <option value="WRONG_SLOT">Wrong Slot</option>
            <option value="DOUBLE_PARK">Double Park</option>
            <option value="OVERSTAY">Overstay</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button onClick={handleReport} disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
            <AlertTriangle size={16} /> Report Violation
          </button>
          <button onClick={handleCheck} disabled={loading}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2">
            <Eye size={16} /> Check Vehicle
          </button>
        </div>

        {checkResult && (
          <div className={`mt-4 rounded-lg p-3 border ${checkResult.inCorrectSpot ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="text-sm font-medium">{checkResult.message}</div>
            <div className="text-xs mt-1">Flat: {checkResult.flatNumber} | Assigned: {checkResult.assignedBay} | Registered: {checkResult.registered ? 'Yes' : 'No'}</div>
          </div>
        )}

        {violationResult && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-red-800">
              <AlertTriangle size={16} /> Violation Recorded
            </div>
            <div className="text-xs text-red-700 mt-2 space-y-1">
              <div>Vehicle: {violationResult.vehicleNumber} | Owner Flat: {violationResult.ownerFlat}</div>
              <div>Assigned Bay: {violationResult.assignedBay} | Type: {violationResult.violationType}</div>
              <div>Notification Token: <span className="font-mono">{violationResult.notificationToken}</span></div>
            </div>

            <div className="mt-3">
              <div className="text-xs font-medium text-red-800 mb-2">Notification Actions (privacy-preserved):</div>
              <div className="space-y-2">
                {violationResult.notificationActions.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white rounded-lg p-2 text-xs">
                    <span className={`px-2 py-0.5 rounded font-medium ${
                      a.channel === 'IVR_CALL' ? 'bg-red-100 text-red-700' :
                      a.channel === 'PUSH' ? 'bg-blue-100 text-blue-700' :
                      a.channel === 'ESCALATE' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{a.channel}</span>
                    <span className="flex-1 text-gray-600">{a.description}</span>
                    <span className="font-mono text-gray-400">{a.timing}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Privacy-Preserving Alert Flow</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StepCard step={1} title="Guard Scan" desc="Guard scans vehicle sticker QR. System looks up owner via hashed phone, never exposing it." />
          <StepCard step={2} title="Token Generation" desc="SHA-256 notification token generated. Guard sees flat number only, not phone." />
          <StepCard step={3} title="Multi-Channel Alert" desc="IVR call + push notification sent via backend. Phone number stays server-side only." />
          <StepCard step={4} title="Escalation" desc="If not moved in 15min (fire lane), auto-escalate to security manager." />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    red: 'bg-red-50 text-red-600', blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600', purple: 'bg-purple-50 text-purple-600', indigo: 'bg-indigo-50 text-indigo-600',
  };
  return (
    <div className="bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
      <div><div className="text-2xl font-bold text-gray-900">{value}</div><div className="text-xs text-gray-500">{label}</div></div>
    </div>
  );
}

function StepCard({ step, title, desc }: { step: number; title: string; desc: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">{step}</div>
        <span className="text-sm font-semibold text-gray-800">{title}</span>
      </div>
      <p className="text-xs text-gray-600">{desc}</p>
    </div>
  );
}

export default ParkingEvDashboard;
