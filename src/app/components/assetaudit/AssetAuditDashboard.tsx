import React, { useState, useEffect } from 'react';
import {
  QrCode, Shield, AlertTriangle, Clock, CheckCircle2, TrendingDown,
  Wrench, Users, MapPin, Thermometer, Zap, Gauge, Eye, Star,
  ClipboardCheck, ArrowUpCircle, Package, Building2, Activity
} from 'lucide-react';
import { assetAuditApi, AssetDashboardSummary, HousekeepingDashboard, SocietyAsset, AssetInspection, HousekeepingTask } from '../../../services/assetaudit/assetAuditService';

// ─── Demo Fallback Data ───

const DEMO_ASSET_DASHBOARD: AssetDashboardSummary = {
  totalAssets: 5,
  byCategory: { FIRE_EXTINGUISHER: 1, STP_PUMP: 1, GYM_EQUIPMENT: 1, TRANSFORMER: 1, ELEVATOR: 1 },
  byStatus: { ACTIVE: 5 },
  byCompliance: { COMPLIANT: 3, DUE_SOON: 1, OVERDUE: 1 },
  totalPurchaseValue: 4164500, totalCurrentValue: 2811200, totalDepreciation: 1353300,
  overdueInspections: 1, nonCompliantAssets: 1, expiringWarranties: 1,
  criticalFindings: 1, tamperEvents: 1, totalInspections: 76,
  assets: [
    { id: 1, communityId: 1, name: 'Fire Extinguisher A-101', assetTag: 'FE-A101', qrCode: 'ASSET-FE-A101', category: 'FIRE_EXTINGUISHER', towerName: 'Tower A', floorNumber: 1, locationDescription: 'Near elevator lobby', manufacturer: 'Cease Fire', modelNumber: 'CF-ABC-5KG', purchaseDate: '2022-03-15', purchaseCost: 4500, warrantyEndDate: '2027-03-15', depreciationMethod: 'STRAIGHT_LINE', usefulLifeYears: 10, annualDepreciationRate: 10, currentBookValue: 2700, status: 'ACTIVE', complianceStatus: 'COMPLIANT', inspectionIntervalDays: 180, lastInspectionDate: '2026-05-12', nextInspectionDue: '2026-12-08', totalInspections: 3, overdueInspections: 0 },
    { id: 2, communityId: 1, name: 'STP Pump Unit-1', assetTag: 'STP-001', qrCode: 'ASSET-STP-001', category: 'STP_PUMP', towerName: 'Common Area', floorNumber: -1, locationDescription: 'Basement STP room', manufacturer: 'Grundfos', modelNumber: 'CR 32-2', purchaseDate: '2020-06-01', purchaseCost: 285000, warrantyEndDate: '2025-06-01', depreciationMethod: 'WRITTEN_DOWN_VALUE', usefulLifeYears: 15, annualDepreciationRate: 15, currentBookValue: 118500, status: 'ACTIVE', complianceStatus: 'DUE_SOON', inspectionIntervalDays: 30, lastInspectionDate: '2026-11-03', nextInspectionDue: '2026-12-03', totalInspections: 22, overdueInspections: 1 },
    { id: 3, communityId: 1, name: 'Treadmill Pro-3000', assetTag: 'GYM-TR-003', qrCode: 'ASSET-GYM-TR003', category: 'GYM_EQUIPMENT', towerName: 'Clubhouse', floorNumber: 0, locationDescription: 'Gymnasium', manufacturer: 'Technogym', modelNumber: 'Excite Run 1000', purchaseDate: '2023-01-10', purchaseCost: 175000, warrantyEndDate: '2026-01-10', depreciationMethod: 'STRAIGHT_LINE', usefulLifeYears: 7, annualDepreciationRate: 14.3, currentBookValue: 100000, status: 'ACTIVE', complianceStatus: 'COMPLIANT', inspectionIntervalDays: 90, lastInspectionDate: '2026-10-14', nextInspectionDue: '2027-01-12', totalInspections: 8, overdueInspections: 0 },
    { id: 4, communityId: 1, name: 'HT Transformer 500KVA', assetTag: 'ELEC-TR-01', qrCode: 'ASSET-ELEC-TR01', category: 'TRANSFORMER', towerName: 'Common Area', floorNumber: -1, locationDescription: 'Electrical room', manufacturer: 'Schneider Electric', modelNumber: 'Trihal 500', purchaseDate: '2019-08-20', purchaseCost: 1200000, warrantyEndDate: '2024-08-20', depreciationMethod: 'STRAIGHT_LINE', usefulLifeYears: 20, annualDepreciationRate: 5, currentBookValue: 840000, status: 'ACTIVE', complianceStatus: 'OVERDUE', inspectionIntervalDays: 60, lastInspectionDate: '2026-09-14', nextInspectionDue: '2026-11-13', totalInspections: 15, overdueInspections: 2 },
    { id: 5, communityId: 1, name: 'Passenger Elevator A-1', assetTag: 'LIFT-A-01', qrCode: 'ASSET-LIFT-A01', category: 'ELEVATOR', towerName: 'Tower A', floorNumber: 0, locationDescription: 'Main lobby elevator', manufacturer: 'KONE', modelNumber: 'MonoSpace 500', purchaseDate: '2019-03-01', purchaseCost: 2500000, warrantyEndDate: '2029-03-01', depreciationMethod: 'STRAIGHT_LINE', usefulLifeYears: 25, annualDepreciationRate: 4, currentBookValue: 1750000, status: 'ACTIVE', complianceStatus: 'COMPLIANT', inspectionIntervalDays: 30, lastInspectionDate: '2026-11-08', nextInspectionDue: '2026-12-08', totalInspections: 28, overdueInspections: 0 },
  ],
  overdueAssets: [
    { id: 4, communityId: 1, name: 'HT Transformer 500KVA', assetTag: 'ELEC-TR-01', qrCode: 'ASSET-ELEC-TR01', category: 'TRANSFORMER', towerName: 'Common Area', floorNumber: -1, locationDescription: 'Electrical room', manufacturer: 'Schneider Electric', modelNumber: 'Trihal 500', purchaseDate: '2019-08-20', purchaseCost: 1200000, warrantyEndDate: '2024-08-20', depreciationMethod: 'STRAIGHT_LINE', usefulLifeYears: 20, annualDepreciationRate: 5, currentBookValue: 840000, status: 'ACTIVE', complianceStatus: 'OVERDUE', inspectionIntervalDays: 60, lastInspectionDate: '2026-09-14', nextInspectionDue: '2026-11-13', totalInspections: 15, overdueInspections: 2 },
  ],
  criticalInspections: [
    { id: 3, assetId: 4, qrCodeScanned: 'ASSET-ELEC-TR01', technicianId: 'TECH-003', technicianName: 'Vikram Singh', inspectionType: 'REGULATORY_COMPLIANCE', result: 'CRITICAL', pressureReading: 0, temperatureReading: 72, voltageReading: 11000, runHours: 45000, partsReplacedJson: '', remarks: 'Oil temperature exceeding threshold — immediate cooling required', tamperDetected: true, qrMatchVerified: true, inspectedAt: '2026-09-14T10:30:00', inspectionDurationSec: 1800 },
  ],
};

const DEMO_HK_DASHBOARD: HousekeepingDashboard = {
  totalTasks: 4, activeTasks: 3, activeEscalations: 1,
  byStatus: { COMPLETED: 1, REPORTED_DIRTY: 1, IN_PROGRESS: 1, ESCALATED: 1 },
  byPriority: { URGENT: 1, MEDIUM: 1, HIGH: 1 },
  byLocationType: { TOWER_LOBBY: 2, CLUBHOUSE_RESTROOM: 1, GYM: 1 },
  avgDurationMin: 30, residentReports: 2, completedToday: 1,
  staffPerformance: {
    'Lakshmi Devi': { staffName: 'Lakshmi Devi', totalTasks: 1, completedTasks: 1, avgDurationMin: 30, avgRating: 4.5 },
    'Meena Kumari': { staffName: 'Meena Kumari', totalTasks: 2, completedTasks: 0, avgDurationMin: 0, avgRating: 0 },
    'Ramu Prasad': { staffName: 'Ramu Prasad', totalTasks: 1, completedTasks: 0, avgDurationMin: 0, avgRating: 0 },
  },
  byTower: {},
  activeTasks2: [
    { id: 2, communityId: 1, qrCode: 'REST-CLB-01', locationId: 'LOC-REST-CLB-01', locationName: 'Clubhouse Restroom 1', locationType: 'CLUBHOUSE_RESTROOM', towerName: 'Clubhouse', floorNumber: 0, status: 'REPORTED_DIRTY', priority: 'URGENT', scheduledTime: '', assignedStaffId: 'HK-002', assignedStaffName: 'Meena Kumari', checklistJson: '["Scrub toilets","Clean wash basins","Mop floor","Refill dispensers"]', completedItemsJson: '', startedAt: '', completedAt: '', durationMinutes: 0, residentReported: true, residentReportQrScan: 'REST-CLB-01', residentReportedAt: new Date(Date.now() - 10 * 60000).toISOString(), residentRemarks: 'Floor is wet and dirty, soap dispenser empty', escalated: false, escalationLevel: 0, escalationReason: '', escalatedAt: '', photoBeforeUrl: '', photoAfterUrl: '', ratingScore: 0 },
    { id: 3, communityId: 1, qrCode: 'LOBBY-B-3F', locationId: 'LOC-LOBBY-B-3F', locationName: 'Tower B 3rd Floor Lobby', locationType: 'TOWER_LOBBY', towerName: 'Tower B', floorNumber: 3, status: 'IN_PROGRESS', priority: 'MEDIUM', scheduledTime: '', assignedStaffId: 'HK-003', assignedStaffName: 'Ramu Prasad', checklistJson: '["Sweep and mop floor","Wipe elevator buttons","Clean glass panels","Empty trash bins"]', completedItemsJson: '', startedAt: new Date(Date.now() - 20 * 60000).toISOString(), completedAt: '', durationMinutes: 0, residentReported: false, residentReportQrScan: '', residentReportedAt: '', residentRemarks: '', escalated: false, escalationLevel: 0, escalationReason: '', escalatedAt: '', photoBeforeUrl: '', photoAfterUrl: '', ratingScore: 0 },
    { id: 4, communityId: 1, qrCode: 'GYM-CLB', locationId: 'LOC-GYM-CLB', locationName: 'Clubhouse Gymnasium', locationType: 'GYM', towerName: 'Clubhouse', floorNumber: 0, status: 'ESCALATED', priority: 'HIGH', scheduledTime: '', assignedStaffId: 'HK-002', assignedStaffName: 'Meena Kumari', checklistJson: '["Wipe equipment","Mop rubber flooring","Clean mirrors","Check water cooler"]', completedItemsJson: '', startedAt: '', completedAt: '', durationMinutes: 0, residentReported: true, residentReportQrScan: 'GYM-CLB', residentReportedAt: new Date(Date.now() - 45 * 60000).toISOString(), residentRemarks: 'Equipment not wiped after morning session, water cooler empty', escalated: true, escalationLevel: 1, escalationReason: 'Unresolved for 30 min — escalated to Supervisor', escalatedAt: new Date(Date.now() - 15 * 60000).toISOString(), photoBeforeUrl: '', photoAfterUrl: '', ratingScore: 0 },
  ],
  escalations: [
    { id: 4, communityId: 1, qrCode: 'GYM-CLB', locationId: 'LOC-GYM-CLB', locationName: 'Clubhouse Gymnasium', locationType: 'GYM', towerName: 'Clubhouse', floorNumber: 0, status: 'ESCALATED', priority: 'HIGH', scheduledTime: '', assignedStaffId: 'HK-002', assignedStaffName: 'Meena Kumari', checklistJson: '["Wipe equipment","Mop rubber flooring","Clean mirrors","Check water cooler"]', completedItemsJson: '', startedAt: '', completedAt: '', durationMinutes: 0, residentReported: true, residentReportQrScan: 'GYM-CLB', residentReportedAt: new Date(Date.now() - 45 * 60000).toISOString(), residentRemarks: 'Equipment not wiped after morning session, water cooler empty', escalated: true, escalationLevel: 1, escalationReason: 'Unresolved for 30 min — escalated to Supervisor', escalatedAt: new Date(Date.now() - 15 * 60000).toISOString(), photoBeforeUrl: '', photoAfterUrl: '', ratingScore: 0 },
  ],
};

// ─── Helpers ───

const complianceColor = (status: string) => {
  switch (status) {
    case 'COMPLIANT': return 'text-green-400';
    case 'DUE_SOON': return 'text-yellow-400';
    case 'OVERDUE': return 'text-red-400';
    case 'NON_COMPLIANT': return 'text-red-500';
    default: return 'text-gray-400';
  }
};

const priorityColor = (p: string) => {
  switch (p) {
    case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'URGENT': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'HIGH': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'MEDIUM': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const statusColor = (s: string) => {
  switch (s) {
    case 'COMPLETED': case 'VERIFIED': return 'bg-green-500/20 text-green-400';
    case 'IN_PROGRESS': return 'bg-blue-500/20 text-blue-400';
    case 'REPORTED_DIRTY': return 'bg-orange-500/20 text-orange-400';
    case 'ESCALATED': return 'bg-red-500/20 text-red-400';
    case 'ASSIGNED': return 'bg-purple-500/20 text-purple-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
};

const formatCurrency = (n: number) => '₹' + n.toLocaleString('en-IN');

const categoryIcon = (cat: string) => {
  switch (cat) {
    case 'FIRE_EXTINGUISHER': return <Shield className="w-4 h-4 text-red-400" />;
    case 'STP_PUMP': return <Activity className="w-4 h-4 text-blue-400" />;
    case 'GYM_EQUIPMENT': return <Wrench className="w-4 h-4 text-purple-400" />;
    case 'TRANSFORMER': return <Zap className="w-4 h-4 text-yellow-400" />;
    case 'ELEVATOR': return <ArrowUpCircle className="w-4 h-4 text-cyan-400" />;
    default: return <Package className="w-4 h-4 text-gray-400" />;
  }
};

// ─── Sub-panels ───

const AssetPanel: React.FC<{ data: AssetDashboardSummary }> = ({ data }) => {
  const [selectedAsset, setSelectedAsset] = useState<SocietyAsset | null>(null);
  const [scanQr, setScanQr] = useState('');

  const depPct = data.totalPurchaseValue > 0 ? (data.totalDepreciation / data.totalPurchaseValue * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Assets', value: data.totalAssets, icon: <Package className="w-5 h-5 text-blue-400" />, color: 'border-blue-500/30' },
          { label: 'Book Value', value: formatCurrency(data.totalCurrentValue), icon: <TrendingDown className="w-5 h-5 text-green-400" />, color: 'border-green-500/30' },
          { label: 'Overdue Inspections', value: data.overdueInspections, icon: <AlertTriangle className="w-5 h-5 text-red-400" />, color: 'border-red-500/30' },
          { label: 'Critical Findings', value: data.criticalFindings, icon: <Shield className="w-5 h-5 text-orange-400" />, color: 'border-orange-500/30' },
        ].map((kpi, i) => (
          <div key={i} className={`bg-gray-800/50 rounded-lg p-4 border ${kpi.color}`}>
            <div className="flex items-center gap-2 mb-1">{kpi.icon}<span className="text-xs text-gray-400">{kpi.label}</span></div>
            <div className="text-2xl font-bold text-white">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Depreciation Summary */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><TrendingDown className="w-4 h-4" /> Depreciation Overview</h3>
        <div className="grid grid-cols-3 gap-4">
          <div><div className="text-xs text-gray-400">Purchase Value</div><div className="text-lg font-bold text-white">{formatCurrency(data.totalPurchaseValue)}</div></div>
          <div><div className="text-xs text-gray-400">Current Book Value</div><div className="text-lg font-bold text-green-400">{formatCurrency(data.totalCurrentValue)}</div></div>
          <div><div className="text-xs text-gray-400">Total Depreciation</div><div className="text-lg font-bold text-red-400">{formatCurrency(data.totalDepreciation)} ({depPct}%)</div></div>
        </div>
        <div className="mt-3 w-full bg-gray-700 rounded-full h-3">
          <div className="bg-gradient-to-r from-green-500 to-red-500 h-3 rounded-full" style={{ width: `${depPct}%` }} />
        </div>
      </div>

      {/* QR Scanner Simulation */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><QrCode className="w-4 h-4" /> QR Asset Scan</h3>
        <div className="flex gap-2">
          <select value={scanQr} onChange={e => setScanQr(e.target.value)} className="flex-1 bg-gray-700 text-white rounded px-3 py-2 text-sm border border-gray-600">
            <option value="">Select asset QR code...</option>
            {data.assets.map(a => <option key={a.qrCode} value={a.qrCode}>{a.qrCode} — {a.name}</option>)}
          </select>
          <button onClick={() => { const a = data.assets.find(x => x.qrCode === scanQr); if (a) setSelectedAsset(a); }} className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-500">Scan</button>
        </div>
        {selectedAsset && (
          <div className="mt-4 bg-gray-900/50 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">{categoryIcon(selectedAsset.category)}<span className="font-semibold text-white">{selectedAsset.name}</span></div>
              <span className={`text-xs px-2 py-1 rounded ${complianceColor(selectedAsset.complianceStatus)}`}>{selectedAsset.complianceStatus}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-400">Tag:</span> <span className="text-white">{selectedAsset.assetTag}</span></div>
              <div><span className="text-gray-400">Location:</span> <span className="text-white">{selectedAsset.towerName} / {selectedAsset.locationDescription}</span></div>
              <div><span className="text-gray-400">Manufacturer:</span> <span className="text-white">{selectedAsset.manufacturer}</span></div>
              <div><span className="text-gray-400">Model:</span> <span className="text-white">{selectedAsset.modelNumber}</span></div>
              <div><span className="text-gray-400">Purchase:</span> <span className="text-white">{formatCurrency(selectedAsset.purchaseCost)}</span></div>
              <div><span className="text-gray-400">Book Value:</span> <span className="text-green-400">{formatCurrency(selectedAsset.currentBookValue)}</span></div>
              <div><span className="text-gray-400">Warranty:</span> <span className="text-white">{selectedAsset.warrantyEndDate}</span></div>
              <div><span className="text-gray-400">Next Inspection:</span> <span className={complianceColor(selectedAsset.complianceStatus)}>{selectedAsset.nextInspectionDue}</span></div>
              <div><span className="text-gray-400">Depreciation:</span> <span className="text-white">{selectedAsset.depreciationMethod}</span></div>
              <div><span className="text-gray-400">Total Inspections:</span> <span className="text-white">{selectedAsset.totalInspections}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Compliance Grid */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Shield className="w-4 h-4" /> Compliance Status</h3>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(data.byCompliance).map(([status, count]) => (
            <div key={status} className="bg-gray-900/50 rounded p-3 text-center">
              <div className={`text-2xl font-bold ${complianceColor(status)}`}>{count}</div>
              <div className="text-xs text-gray-400 mt-1">{status.replace(/_/g, ' ')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Asset Register */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><ClipboardCheck className="w-4 h-4" /> Asset Register</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-gray-400 border-b border-gray-700">
              <th className="text-left py-2 px-2">Asset</th><th className="text-left py-2 px-2">Category</th><th className="text-left py-2 px-2">Location</th>
              <th className="text-right py-2 px-2">Book Value</th><th className="text-center py-2 px-2">Compliance</th><th className="text-center py-2 px-2">Inspections</th>
            </tr></thead>
            <tbody>{data.assets.map(a => (
              <tr key={a.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer" onClick={() => setSelectedAsset(a)}>
                <td className="py-2 px-2"><div className="flex items-center gap-2">{categoryIcon(a.category)}<span className="text-white">{a.name}</span></div></td>
                <td className="py-2 px-2 text-gray-300">{a.category.replace(/_/g, ' ')}</td>
                <td className="py-2 px-2 text-gray-300">{a.towerName}</td>
                <td className="py-2 px-2 text-right text-green-400">{formatCurrency(a.currentBookValue)}</td>
                <td className="py-2 px-2 text-center"><span className={`text-xs px-2 py-0.5 rounded ${complianceColor(a.complianceStatus)}`}>{a.complianceStatus}</span></td>
                <td className="py-2 px-2 text-center text-gray-300">{a.totalInspections}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {/* Critical Findings */}
      {data.criticalInspections.length > 0 && (
        <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
          <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Critical Findings & Tamper Events</h3>
          {data.criticalInspections.map(insp => (
            <div key={insp.id} className="bg-gray-900/50 rounded p-3 mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">QR: {insp.qrCodeScanned}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">{insp.result}</span>
                  {insp.tamperDetected && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">TAMPER DETECTED</span>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                <div className="flex items-center gap-1"><Thermometer className="w-3 h-3 text-red-400" /> {insp.temperatureReading}°C</div>
                <div className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-400" /> {insp.voltageReading}V</div>
                <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" /> {insp.runHours}h run</div>
              </div>
              <div className="text-xs text-gray-300">{insp.remarks}</div>
              <div className="text-xs text-gray-500 mt-1">Inspected by {insp.technicianName} • {new Date(insp.inspectedAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const HousekeepingPanel: React.FC<{ data: HousekeepingDashboard }> = ({ data }) => {
  const [reportQr, setReportQr] = useState('');

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Tasks', value: data.activeTasks, icon: <ClipboardCheck className="w-5 h-5 text-blue-400" />, color: 'border-blue-500/30' },
          { label: 'Completed Today', value: data.completedToday, icon: <CheckCircle2 className="w-5 h-5 text-green-400" />, color: 'border-green-500/30' },
          { label: 'Active Escalations', value: data.activeEscalations, icon: <AlertTriangle className="w-5 h-5 text-red-400" />, color: 'border-red-500/30' },
          { label: 'Resident Reports', value: data.residentReports, icon: <QrCode className="w-5 h-5 text-purple-400" />, color: 'border-purple-500/30' },
        ].map((kpi, i) => (
          <div key={i} className={`bg-gray-800/50 rounded-lg p-4 border ${kpi.color}`}>
            <div className="flex items-center gap-2 mb-1">{kpi.icon}<span className="text-xs text-gray-400">{kpi.label}</span></div>
            <div className="text-2xl font-bold text-white">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* QR Dirty Report */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><QrCode className="w-4 h-4" /> Resident QR Report (Scan to Report Dirty)</h3>
        <div className="flex gap-2">
          <select value={reportQr} onChange={e => setReportQr(e.target.value)} className="flex-1 bg-gray-700 text-white rounded px-3 py-2 text-sm border border-gray-600">
            <option value="">Select location QR...</option>
            <option value="LOBBY-A-GF">LOBBY-A-GF — Tower A Ground Floor</option>
            <option value="REST-CLB-01">REST-CLB-01 — Clubhouse Restroom 1</option>
            <option value="LOBBY-B-3F">LOBBY-B-3F — Tower B 3rd Floor</option>
            <option value="GYM-CLB">GYM-CLB — Clubhouse Gym</option>
          </select>
          <button className="px-4 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Report</button>
        </div>
      </div>

      {/* Active Tasks Pipeline */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Activity className="w-4 h-4" /> Active Tasks</h3>
        <div className="space-y-3">
          {data.activeTasks2.map(task => (
            <div key={task.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-white">{task.locationName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded border ${priorityColor(task.priority)}`}>{task.priority}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusColor(task.status)}`}>{task.status.replace(/_/g, ' ')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div><span className="text-gray-400">Staff:</span> <span className="text-white">{task.assignedStaffName || 'Unassigned'}</span></div>
                <div><span className="text-gray-400">Type:</span> <span className="text-white">{task.locationType.replace(/_/g, ' ')}</span></div>
              </div>

              {task.residentReported && (
                <div className="bg-orange-500/10 rounded p-2 border border-orange-500/20 mb-2">
                  <div className="text-xs text-orange-400 font-medium flex items-center gap-1"><QrCode className="w-3 h-3" /> Resident Reported</div>
                  <div className="text-xs text-gray-300 mt-1">{task.residentRemarks}</div>
                  <div className="text-xs text-gray-500 mt-1">Reported: {task.residentReportedAt ? new Date(task.residentReportedAt).toLocaleTimeString() : 'N/A'}</div>
                </div>
              )}

              {task.escalated && (
                <div className="bg-red-500/10 rounded p-2 border border-red-500/20 mb-2">
                  <div className="text-xs text-red-400 font-medium flex items-center gap-1"><ArrowUpCircle className="w-3 h-3" /> Escalation Level {task.escalationLevel}</div>
                  <div className="text-xs text-gray-300 mt-1">{task.escalationReason}</div>
                </div>
              )}

              {/* Checklist */}
              {task.checklistJson && (
                <div className="mt-2">
                  <div className="text-xs text-gray-400 mb-1">Checklist:</div>
                  <div className="flex flex-wrap gap-1">
                    {JSON.parse(task.checklistJson).map((item: string, i: number) => {
                      const completed = task.completedItemsJson ? JSON.parse(task.completedItemsJson).includes(item) : false;
                      return (
                        <span key={i} className={`text-xs px-2 py-0.5 rounded ${completed ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                          {completed ? '✓' : '○'} {item}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Staff Performance */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Staff Performance</h3>
        <div className="space-y-3">
          {Object.values(data.staffPerformance).map(staff => (
            <div key={staff.staffName} className="bg-gray-900/50 rounded p-3 flex items-center justify-between">
              <div>
                <div className="text-white font-medium">{staff.staffName}</div>
                <div className="text-xs text-gray-400">{staff.completedTasks}/{staff.totalTasks} tasks completed</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-sm text-blue-400">{staff.avgDurationMin > 0 ? `${staff.avgDurationMin.toFixed(0)}m` : '—'}</div>
                  <div className="text-xs text-gray-500">Avg Time</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-sm text-yellow-400">
                    <Star className="w-3 h-3" /> {staff.avgRating > 0 ? staff.avgRating.toFixed(1) : '—'}
                  </div>
                  <div className="text-xs text-gray-500">Rating</div>
                </div>
                <div className="w-20 bg-gray-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${staff.totalTasks > 0 ? (staff.completedTasks / staff.totalTasks * 100) : 0}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Escalation Alerts */}
      {data.escalations.length > 0 && (
        <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
          <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Active Escalations</h3>
          {data.escalations.map(esc => (
            <div key={esc.id} className="bg-gray-900/50 rounded p-3 mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-medium">{esc.locationName}</span>
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Level {esc.escalationLevel}</span>
              </div>
              <div className="text-xs text-gray-300">{esc.escalationReason}</div>
              <div className="text-xs text-gray-500 mt-1">Assigned: {esc.assignedStaffName} • Escalated: {esc.escalatedAt ? new Date(esc.escalatedAt).toLocaleTimeString() : 'N/A'}</div>
            </div>
          ))}
        </div>
      )}

      {/* Status Distribution */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Task Distribution</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-400 mb-2">By Status</div>
            {Object.entries(data.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between py-1">
                <span className={`text-xs px-2 py-0.5 rounded ${statusColor(status)}`}>{status.replace(/_/g, ' ')}</span>
                <span className="text-sm text-white">{count}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-2">By Location</div>
            {Object.entries(data.byLocationType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between py-1">
                <span className="text-xs text-gray-300">{type.replace(/_/g, ' ')}</span>
                <span className="text-sm text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Dashboard ───

const AssetAuditDashboard: React.FC = () => {
  const [tab, setTab] = useState<'assets' | 'housekeeping'>('assets');
  const [assetData, setAssetData] = useState<AssetDashboardSummary>(DEMO_ASSET_DASHBOARD);
  const [hkData, setHkData] = useState<HousekeepingDashboard>(DEMO_HK_DASHBOARD);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [assets, hk] = await Promise.all([
          assetAuditApi.getAssetDashboard(),
          assetAuditApi.getHousekeepingDashboard(),
        ]);
        setAssetData(assets);
        setHkData(hk);
      } catch {
        // Use demo data
      }
      setLoading(false);
    };
    load();
  }, []);

  const tabs = [
    { key: 'assets' as const, label: 'Asset Lifecycle', icon: <Package className="w-4 h-4" /> },
    { key: 'housekeeping' as const, label: 'Housekeeping', icon: <ClipboardCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg"><QrCode className="w-6 h-6 text-blue-400" /></div>
              Society Asset Tracking & QR Audits
            </h1>
            <p className="text-gray-400 text-sm mt-1">QR-based asset lifecycle • Dynamic housekeeping • Real-time escalation</p>
          </div>
          {loading && <div className="text-xs text-gray-500 animate-pulse">Loading live data...</div>}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-700 pb-2">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t text-sm transition-colors ${tab === t.key ? 'bg-gray-800 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'assets' && <AssetPanel data={assetData} />}
        {tab === 'housekeeping' && <HousekeepingPanel data={hkData} />}
      </div>
    </div>
  );
};

export default AssetAuditDashboard;
