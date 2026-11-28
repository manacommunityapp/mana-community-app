import React, { useState, useEffect } from 'react';
import {
  Shield, Bus, AlertTriangle, Phone, CheckCircle, XCircle, Clock, Users,
  Baby, MapPin, Radio, Bell, Lock, Unlock, ChevronRight, Eye, PhoneCall,
  UserCheck, Zap, Info, ArrowRight
} from 'lucide-react';
import { childSecurityService, ExitSecurityDashboard, BusDashboard } from '../../../services/childsecurity/childSecurityService';

const DEMO_EXIT_DASHBOARD: ExitSecurityDashboard = {
  totalChildren: 5, exitLockEnabled: 4, pendingExits: 1, approvedToday: 3,
  deniedToday: 0, autoLockedToday: 1, avgResponseTime: 38, escalationRate: 25,
  recentExitRequests: [
    {
      id: 1, childId: 1, childName: 'Aarav Sharma', communityId: 'COMM-001',
      flatNumber: 'A-101', towerName: 'Tower A', exitType: 'WITH_AUTHORIZED_PICKUP',
      status: 'APPROVED', escalationState: 'GUARDIAN_RESPONDED',
      guardOnDuty: 'Guard Rajan', gateId: 'GATE-MAIN',
      requestedAt: '2026-11-28T16:30:00', primaryNotifiedAt: '2026-11-28T16:30:00',
      escalatedAt: '', ivrTriggeredAt: '', approvedAt: '2026-11-28T16:31:00',
      deniedAt: '', approvedByGuardianId: 1, approvedByName: 'Priya Sharma',
      approvalMethod: 'PRIMARY_PARENT', companionName: 'Meera Aunty',
      companionPhone: '9876599001', companionRelation: 'Family friend',
      escalationTimeoutSeconds: 60, totalEscalationAttempts: 1, remarks: ''
    },
    {
      id: 2, childId: 2, childName: 'Ananya Sharma', communityId: 'COMM-001',
      flatNumber: 'A-101', towerName: 'Tower A', exitType: 'UNACCOMPANIED',
      status: 'AUTO_LOCKED', escalationState: 'ALL_ESCALATIONS_EXHAUSTED',
      guardOnDuty: 'Guard Rajan', gateId: 'GATE-MAIN',
      requestedAt: '2026-11-27T17:00:00', primaryNotifiedAt: '2026-11-27T17:00:00',
      escalatedAt: '2026-11-27T17:01:00', ivrTriggeredAt: '2026-11-27T17:02:00',
      approvedAt: '', deniedAt: '', approvedByGuardianId: 0, approvedByName: '',
      approvalMethod: '', companionName: '', companionPhone: '', companionRelation: '',
      escalationTimeoutSeconds: 60, totalEscalationAttempts: 4,
      remarks: 'All escalation attempts exhausted. Child held at gate.'
    },
    {
      id: 3, childId: 3, childName: 'Vihaan Gupta', communityId: 'COMM-001',
      flatNumber: 'B-204', towerName: 'Tower B', exitType: 'WITH_GUARDIAN',
      status: 'PENDING', escalationState: 'AWAITING_PRIMARY',
      guardOnDuty: 'Guard Sunil', gateId: 'GATE-SIDE',
      requestedAt: '2026-11-28T17:45:00', primaryNotifiedAt: '2026-11-28T17:45:00',
      escalatedAt: '', ivrTriggeredAt: '', approvedAt: '', deniedAt: '',
      approvedByGuardianId: 0, approvedByName: '', approvalMethod: '',
      companionName: 'Neha Gupta', companionPhone: '9876543005',
      companionRelation: 'Mother', escalationTimeoutSeconds: 60,
      totalEscalationAttempts: 1, remarks: ''
    }
  ],
  escalationLogs: [
    {
      id: 1, exitRequestId: 1, guardianId: 1, guardianName: 'Priya Sharma',
      guardianPhone: '9876543001', method: 'PUSH_NOTIFICATION', outcome: 'APPROVED',
      initiatedAt: '2026-11-28T16:30:00', respondedAt: '2026-11-28T16:31:00',
      responseTimeSeconds: 45, attemptNumber: 1, ivrCallSid: '', remarks: ''
    },
    {
      id: 2, exitRequestId: 2, guardianId: 1, guardianName: 'Priya Sharma',
      guardianPhone: '9876543001', method: 'PUSH_NOTIFICATION', outcome: 'NO_RESPONSE',
      initiatedAt: '2026-11-27T17:00:00', respondedAt: '', responseTimeSeconds: 0,
      attemptNumber: 1, ivrCallSid: '', remarks: ''
    },
    {
      id: 3, exitRequestId: 2, guardianId: 2, guardianName: 'Rahul Sharma',
      guardianPhone: '9876543002', method: 'PUSH_NOTIFICATION', outcome: 'NO_RESPONSE',
      initiatedAt: '2026-11-27T17:01:00', respondedAt: '', responseTimeSeconds: 0,
      attemptNumber: 2, ivrCallSid: '', remarks: ''
    },
    {
      id: 4, exitRequestId: 2, guardianId: 1, guardianName: 'Priya Sharma',
      guardianPhone: '9876543001', method: 'IVR_CALL', outcome: 'CALL_FAILED',
      initiatedAt: '2026-11-27T17:02:00', respondedAt: '', responseTimeSeconds: 0,
      attemptNumber: 3, ivrCallSid: 'IVR-abc12345', remarks: ''
    },
    {
      id: 5, exitRequestId: 2, guardianId: 4, guardianName: 'Vikram Uncle',
      guardianPhone: '9876543004', method: 'IVR_CALL', outcome: 'VOICEMAIL',
      initiatedAt: '2026-11-27T17:03:00', respondedAt: '', responseTimeSeconds: 0,
      attemptNumber: 4, ivrCallSid: 'IVR-def67890', remarks: ''
    }
  ]
};

const DEMO_BUS_DASHBOARD: BusDashboard = {
  totalRoutes: 3, activeRoutes: 2, atGate: 1, enRoute: 1, completed: 1,
  totalBoardedToday: 5, safeDropoffs: 3, pendingDropoffs: 1, parentPickups: 1,
  routes: [
    {
      id: 1, communityId: 'COMM-001', routeCode: 'RT-DPS-01', schoolName: 'Delhi Public School',
      busNumber: 'KA-01-MN-5678', driverName: 'Ramesh Yadav', driverPhone: '9876500001',
      attendantName: 'Sunita Didi', attendantPhone: '9876500002', rfidTagId: 'RFID-BUS-001',
      morningPickupTime: '07:15', afternoonDropTime: '14:30', totalChildren: 12,
      isActive: true, currentStatus: 'AT_GATE'
    },
    {
      id: 2, communityId: 'COMM-001', routeCode: 'RT-RIS-01', schoolName: 'Ryan International',
      busNumber: 'KA-01-MN-9012', driverName: 'Suresh Kumar', driverPhone: '9876500003',
      attendantName: 'Meena Didi', attendantPhone: '9876500004', rfidTagId: 'RFID-BUS-002',
      morningPickupTime: '07:30', afternoonDropTime: '15:00', totalChildren: 8,
      isActive: true, currentStatus: 'EN_ROUTE_DROP'
    },
    {
      id: 3, communityId: 'COMM-001', routeCode: 'RT-KEN-01', schoolName: 'Kendriya Vidyalaya',
      busNumber: 'KA-01-MN-3456', driverName: 'Mohan Singh', driverPhone: '9876500005',
      attendantName: 'Priya Didi', attendantPhone: '9876500006', rfidTagId: 'RFID-BUS-003',
      morningPickupTime: '07:00', afternoonDropTime: '14:00', totalChildren: 15,
      isActive: true, currentStatus: 'COMPLETED'
    }
  ],
  recentBoardings: [
    {
      id: 1, busRouteId: 1, childId: 1, childName: 'Aarav Sharma', communityId: 'COMM-001',
      boardingDate: '2026-11-28', boardingType: 'AFTERNOON_DROP', boardingStatus: 'DROPPED_SAFE',
      boardedAt: '2026-11-28T13:30:00', droppedAt: '2026-11-28T14:00:00',
      droppedConfirmedBy: 'Guard Rajan', parentNotified: true,
      parentNotifiedAt: '2026-11-28T14:00:00', remarks: ''
    },
    {
      id: 2, busRouteId: 1, childId: 2, childName: 'Ananya Sharma', communityId: 'COMM-001',
      boardingDate: '2026-11-28', boardingType: 'AFTERNOON_DROP', boardingStatus: 'DROPPED_SAFE',
      boardedAt: '2026-11-28T13:30:00', droppedAt: '2026-11-28T14:02:00',
      droppedConfirmedBy: 'Guard Rajan', parentNotified: true,
      parentNotifiedAt: '2026-11-28T14:02:00', remarks: ''
    },
    {
      id: 3, busRouteId: 2, childId: 3, childName: 'Vihaan Gupta', communityId: 'COMM-001',
      boardingDate: '2026-11-28', boardingType: 'AFTERNOON_DROP', boardingStatus: 'BOARDED',
      boardedAt: '2026-11-28T14:15:00', droppedAt: '', droppedConfirmedBy: '',
      parentNotified: false, parentNotifiedAt: '', remarks: ''
    },
    {
      id: 4, busRouteId: 3, childId: 4, childName: 'Isha Patel', communityId: 'COMM-001',
      boardingDate: '2026-11-28', boardingType: 'AFTERNOON_DROP', boardingStatus: 'DROPPED_SAFE',
      boardedAt: '2026-11-28T12:30:00', droppedAt: '2026-11-28T13:30:00',
      droppedConfirmedBy: 'Guard Sunil', parentNotified: true,
      parentNotifiedAt: '2026-11-28T13:30:00', remarks: ''
    },
    {
      id: 5, busRouteId: 1, childId: 5, childName: 'Arjun Singh', communityId: 'COMM-001',
      boardingDate: '2026-11-28', boardingType: 'AFTERNOON_DROP', boardingStatus: 'PARENT_PICKUP',
      boardedAt: '', droppedAt: '', droppedConfirmedBy: '', parentNotified: false,
      parentNotifiedAt: '', remarks: 'Parent picked up directly from school'
    }
  ],
  recentGateEvents: [
    {
      id: 1, busRouteId: 1, communityId: 'COMM-001', rfidTagId: 'RFID-BUS-001',
      gateId: 'GATE-MAIN', eventType: 'RFID_ENTRY', scannedAt: '2026-11-28T13:55:00',
      childrenOnBoard: 3, childrenDropped: 2, allParentsNotified: true,
      notificationsSentAt: '2026-11-28T13:55:00', guardOnDuty: 'Guard Rajan'
    },
    {
      id: 2, busRouteId: 3, communityId: 'COMM-001', rfidTagId: 'RFID-BUS-003',
      gateId: 'GATE-MAIN', eventType: 'RFID_ENTRY', scannedAt: '2026-11-28T13:20:00',
      childrenOnBoard: 1, childrenDropped: 1, allParentsNotified: true,
      notificationsSentAt: '2026-11-28T13:20:00', guardOnDuty: 'Guard Sunil'
    }
  ]
};

const statusColor = (s: string) => {
  const map: Record<string, string> = {
    APPROVED: 'bg-green-100 text-green-800', PENDING: 'bg-yellow-100 text-yellow-800',
    DENIED: 'bg-red-100 text-red-800', AUTO_LOCKED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-gray-100 text-gray-800', EMERGENCY_OVERRIDE: 'bg-orange-100 text-orange-800',
    DROPPED_SAFE: 'bg-green-100 text-green-800', BOARDED: 'bg-blue-100 text-blue-800',
    ABSENT: 'bg-gray-100 text-gray-800', PARENT_PICKUP: 'bg-purple-100 text-purple-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    AT_GATE: 'bg-green-100 text-green-800', EN_ROUTE_DROP: 'bg-blue-100 text-blue-800',
    EN_ROUTE_PICKUP: 'bg-blue-100 text-blue-800', AT_SCHOOL: 'bg-indigo-100 text-indigo-800',
    COMPLETED: 'bg-gray-100 text-gray-800', NOT_STARTED: 'bg-gray-100 text-gray-600',
    NO_RESPONSE: 'bg-yellow-100 text-yellow-800', CALL_FAILED: 'bg-red-100 text-red-800',
    VOICEMAIL: 'bg-orange-100 text-orange-800',
  };
  return map[s] || 'bg-gray-100 text-gray-800';
};

const escalationIcon = (method: string) => {
  switch (method) {
    case 'PUSH_NOTIFICATION': return <Bell className="w-4 h-4" />;
    case 'IVR_CALL': return <PhoneCall className="w-4 h-4" />;
    case 'SMS': return <Phone className="w-4 h-4" />;
    case 'WHATSAPP': return <Phone className="w-4 h-4" />;
    default: return <Bell className="w-4 h-4" />;
  }
};

export default function ChildSecurityDashboard() {
  const [activeTab, setActiveTab] = useState<'exit' | 'bus' | 'architecture'>('exit');
  const [exitData, setExitData] = useState<ExitSecurityDashboard>(DEMO_EXIT_DASHBOARD);
  const [busData, setBusData] = useState<BusDashboard>(DEMO_BUS_DASHBOARD);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [exit, bus] = await Promise.all([
          childSecurityService.getExitDashboard(),
          childSecurityService.getBusDashboard(),
        ]);
        setExitData(exit);
        setBusData(bus);
      } catch {
        // use demo data
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const tabs = [
    { key: 'exit' as const, label: 'Exit Security & Escalation', icon: Shield },
    { key: 'bus' as const, label: 'School Bus & Boarding', icon: Bus },
    { key: 'architecture' as const, label: 'Architecture', icon: Info },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-600" />
            Child Security & School Bus Gates
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Exit lock escalation, guardian authorization & RFID bus tracking
          </p>
        </div>
        {loading && (
          <span className="text-sm text-gray-400 animate-pulse">Loading live data...</span>
        )}
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}>
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'exit' && <ExitSecurityTab data={exitData} />}
      {activeTab === 'bus' && <SchoolBusTab data={busData} />}
      {activeTab === 'architecture' && <ArchitectureTab />}
    </div>
  );
}

function ExitSecurityTab({ data }: { data: ExitSecurityDashboard }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Baby} label="Registered Children" value={data.totalChildren} color="blue" />
        <StatCard icon={Lock} label="Exit Lock Active" value={data.exitLockEnabled} color="indigo" />
        <StatCard icon={Clock} label="Pending Exits" value={data.pendingExits} color="yellow" />
        <StatCard icon={CheckCircle} label="Approved Today" value={data.approvedToday} color="green" />
        <StatCard icon={XCircle} label="Denied Today" value={data.deniedToday} color="red" />
        <StatCard icon={AlertTriangle} label="Auto-Locked" value={data.autoLockedToday} color="orange" />
        <StatCard icon={Zap} label="Avg Response (s)" value={data.avgResponseTime} color="purple" />
        <StatCard icon={ArrowRight} label="Escalation Rate" value={`${data.escalationRate}%`} color="pink" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Recent Exit Requests
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Child</th>
                <th className="px-4 py-3 text-left">Flat</th>
                <th className="px-4 py-3 text-left">Exit Type</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Escalation</th>
                <th className="px-4 py-3 text-left">Companion</th>
                <th className="px-4 py-3 text-left">Approved By</th>
                <th className="px-4 py-3 text-left">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.recentExitRequests.map(req => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{req.childName}</td>
                  <td className="px-4 py-3 text-gray-600">{req.flatNumber}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs">{req.exitType.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(req.status)}`}>
                      {req.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusColor(req.escalationState)}`}>
                      {req.escalationState.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {req.companionName ? `${req.companionName} (${req.companionRelation})` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {req.approvedByName || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(req.requestedAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Phone className="w-5 h-5 text-orange-500" />
            Escalation Trail
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {data.escalationLogs.map(log => (
            <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className={`p-2 rounded-lg ${log.outcome === 'APPROVED' ? 'bg-green-100 text-green-600' :
                log.outcome === 'NO_RESPONSE' ? 'bg-yellow-100 text-yellow-600' :
                'bg-red-100 text-red-600'}`}>
                {escalationIcon(log.method)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900 text-sm">{log.guardianName}</span>
                  <span className="text-xs text-gray-500">{log.guardianPhone}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(log.outcome)}`}>
                    {log.outcome.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span>Attempt #{log.attemptNumber}</span>
                  <span>{log.method.replace(/_/g, ' ')}</span>
                  {log.responseTimeSeconds > 0 && <span>Responded in {log.responseTimeSeconds}s</span>}
                  {log.ivrCallSid && <span className="font-mono">{log.ivrCallSid}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SchoolBusTab({ data }: { data: BusDashboard }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Bus} label="Total Routes" value={data.totalRoutes} color="blue" />
        <StatCard icon={MapPin} label="At Gate" value={data.atGate} color="green" />
        <StatCard icon={Radio} label="En Route" value={data.enRoute} color="yellow" />
        <StatCard icon={CheckCircle} label="Completed" value={data.completed} color="gray" />
        <StatCard icon={Users} label="Boarded Today" value={data.totalBoardedToday} color="indigo" />
        <StatCard icon={UserCheck} label="Safe Dropoffs" value={data.safeDropoffs} color="green" />
        <StatCard icon={Clock} label="Pending Drops" value={data.pendingDropoffs} color="orange" />
        <StatCard icon={Eye} label="Parent Pickups" value={data.parentPickups} color="purple" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Bus className="w-5 h-5 text-blue-500" />
            Bus Routes & Live Status
          </h3>
        </div>
        <div className="grid gap-4 p-4">
          {data.routes.map(route => (
            <div key={route.id} className="p-4 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Bus className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{route.schoolName}</div>
                    <div className="text-xs text-gray-500">{route.routeCode} • {route.busNumber}</div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(route.currentStatus)}`}>
                  {route.currentStatus.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-xs">
                <div className="bg-gray-50 rounded-lg p-2">
                  <span className="text-gray-500">Driver</span>
                  <div className="font-medium text-gray-900">{route.driverName}</div>
                  <div className="text-gray-400">{route.driverPhone}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <span className="text-gray-500">Attendant</span>
                  <div className="font-medium text-gray-900">{route.attendantName}</div>
                  <div className="text-gray-400">{route.attendantPhone}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <span className="text-gray-500">Schedule</span>
                  <div className="font-medium text-gray-900">Pick: {route.morningPickupTime}</div>
                  <div className="font-medium text-gray-900">Drop: {route.afternoonDropTime}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <span className="text-gray-500">RFID</span>
                  <div className="font-mono font-medium text-gray-900">{route.rfidTagId}</div>
                  <div className="text-gray-400">{route.totalChildren} children</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-green-500" />
            Today's Boarding Log
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Child</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Boarded</th>
                <th className="px-4 py-3 text-left">Dropped</th>
                <th className="px-4 py-3 text-left">Confirmed By</th>
                <th className="px-4 py-3 text-left">Parent Notified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.recentBoardings.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{b.childName}</td>
                  <td className="px-4 py-3 text-xs">{b.boardingType.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(b.boardingStatus)}`}>
                      {b.boardingStatus.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {b.boardedAt ? new Date(b.boardedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {b.droppedAt ? new Date(b.droppedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{b.droppedConfirmedBy || '—'}</td>
                  <td className="px-4 py-3">
                    {b.parentNotified
                      ? <span className="text-green-600 flex items-center gap-1 text-xs"><CheckCircle className="w-3 h-3" /> Yes</span>
                      : <span className="text-gray-400 text-xs">No</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-500" />
            RFID Gate Events
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {data.recentGateEvents.map(evt => (
            <div key={evt.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Radio className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium text-gray-900">{evt.rfidTagId}</span>
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                  <span className="text-sm text-gray-700">{evt.gateId}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(evt.eventType === 'RFID_ENTRY' ? 'AT_GATE' : 'COMPLETED')}`}>
                    {evt.eventType.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span>{evt.childrenOnBoard} on board</span>
                  <span>{evt.childrenDropped} dropped</span>
                  <span>{evt.guardOnDuty}</span>
                  <span>{new Date(evt.scannedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  {evt.allParentsNotified && <span className="text-green-600">All parents notified</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ArchitectureTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          Exit Escalation State Machine
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs leading-relaxed">
          <pre className="whitespace-pre-wrap text-gray-700">{`
┌─────────────────┐    60s timeout    ┌──────────────────────────────┐
│ AWAITING_PRIMARY │──────────────────▶│ PRIMARY_TIMEOUT_ESCALATE_   │
│                  │                   │ BACKUP                       │
│ Push notification│                   │ Notify secondary parent      │
│ to primary parent│                   │                              │
└────────┬─────────┘                   └──────────────┬───────────────┘
         │                                            │
    Parent responds                              60s timeout
         │                                            │
         ▼                                            ▼
┌─────────────────┐                   ┌──────────────────────────────┐
│ GUARDIAN_        │                   │ IVR_TRIGGERED                │
│ RESPONDED        │                   │                              │
│                  │                   │ Automated IVR call to        │
│ APPROVED/DENIED  │                   │ primary + emergency contact  │
└─────────────────┘                   └──────────────┬───────────────┘
                                                     │
                                               IVR fails/no answer
                                                     │
                                                     ▼
                                      ┌──────────────────────────────┐
                                      │ ALL_ESCALATIONS_EXHAUSTED    │
                                      │                              │
                                      │ AUTO_DENY + AUTO_LOCKED      │
                                      │ Child held at gate safely    │
                                      └──────────────────────────────┘

Escalation Chain: PRIMARY_PARENT → SECONDARY_PARENT → IVR to Primary → IVR to Emergency Contact
Timeout: 60 seconds per level | Max attempts: 4
          `}</pre>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bus className="w-5 h-5 text-blue-500" />
          RFID Bus Gate Entry Pipeline
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs leading-relaxed">
          <pre className="whitespace-pre-wrap text-gray-700">{`
┌───────────────┐     ┌──────────────────┐     ┌───────────────────────┐
│ RFID Scanner  │────▶│ Gate Controller  │────▶│ Bus Lookup by RFID    │
│ at Society    │     │ POST /bus/rfid-  │     │ rfidTagId → routeId   │
│ Gate          │     │ scan             │     │                       │
└───────────────┘     └──────────────────┘     └───────────┬───────────┘
                                                           │
                                                           ▼
                                               ┌───────────────────────┐
                                               │ Find Children on      │
                                               │ This Route            │
                                               │                       │
                                               │ NOT community-wide    │
                                               │ Only this bus's kids  │
                                               └───────────┬───────────┘
                                                           │
                                                           ▼
                                               ┌───────────────────────┐
                                               │ Create Boarding Logs  │
                                               │ per child             │
                                               │                       │
                                               │ Status: BOARDED       │
                                               └───────────┬───────────┘
                                                           │
                                                           ▼
                                               ┌───────────────────────┐
                                               │ Targeted Parent       │
                                               │ Notifications         │
                                               │                       │
                                               │ Only parents of       │
                                               │ children on THIS bus  │
                                               │ get notified          │
                                               └───────────────────────┘

Key Design: Route-specific notifications prevent alert fatigue.
A bus arriving with 3 children notifies only 3 families, not 4,000 flats.
          `}</pre>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Design Decisions
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { title: 'Targeted vs Broadcast Notifications', desc: 'Bus arrival notifications go ONLY to parents of children on that specific route. 3 children on the bus = 3 families notified, not 4,000 flats. Prevents alert fatigue and builds trust.' },
            { title: 'Escalation State Machine', desc: '4-level escalation chain with 60-second timeouts per level. Push → Push → IVR → IVR. If all 4 attempts exhaust, child is AUTO_LOCKED at gate. No child exits unverified.' },
            { title: 'IVR Integration Points', desc: 'State machine tracks IVR call SIDs for audit trail. Supports Twilio/Exotel webhook callbacks to process IVR responses. Voicemail detection triggers next escalation level.' },
            { title: 'RFID Gate Entry', desc: 'Each bus has a unique RFID tag. Gate scanner reads the tag, system looks up the bus route, finds all children assigned to that route, creates boarding logs, and notifies parents — all in one atomic operation.' },
            { title: 'Companion Tracking', desc: 'When a child exits with an authorized pickup person, the system records their name, phone, and relationship. This creates an audit trail of exactly who took the child and when.' },
            { title: 'Safe Dropoff Confirmation', desc: 'After a child is dropped at the gate, a guard must explicitly confirm the safe dropoff. Only then is the parent notified. Two-step verification prevents premature notifications.' },
          ].map((d, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4">
              <div className="font-semibold text-gray-900 text-sm mb-1">{d.title}</div>
              <div className="text-xs text-gray-600 leading-relaxed">{d.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  const bg: Record<string, string> = {
    blue: 'bg-blue-50', green: 'bg-green-50', red: 'bg-red-50', yellow: 'bg-yellow-50',
    purple: 'bg-purple-50', indigo: 'bg-indigo-50', orange: 'bg-orange-50', pink: 'bg-pink-50', gray: 'bg-gray-50',
  };
  const fg: Record<string, string> = {
    blue: 'text-blue-600', green: 'text-green-600', red: 'text-red-600', yellow: 'text-yellow-600',
    purple: 'text-purple-600', indigo: 'text-indigo-600', orange: 'text-orange-600', pink: 'text-pink-600', gray: 'text-gray-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg[color]}`}>
          <Icon className={`w-5 h-5 ${fg[color]}`} />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
}
