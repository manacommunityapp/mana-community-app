import React, { useState, useEffect, useCallback } from 'react';
import {
  Home, LogOut, FileText, Clock, Truck, Shield, AlertTriangle, CheckCircle, XCircle,
  Users, Key, Wifi, UserMinus, FileCheck, Archive, ArrowRight, RefreshCw, Eye,
  Upload, Search, Calendar, Building2, Zap
} from 'lucide-react';
import * as api from '../../../services/tenancy/tenancyWorkflowService';
import type {
  TenantRecord, MoveOutSaga, SagaSummary, DocumentPipelineSummary,
  SlotScheduleSummary, TenantDocument, MoveSlot, StepStatus
} from '../../../services/tenancy/tenancyWorkflowService';

// === Demo Fallback Data ===
const DEMO_TENANTS: TenantRecord[] = [
  { id: 1, communityId: 1, flatNumber: 'A-302', towerName: 'Tower A', tenantName: 'Rahul Sharma', tenantPhone: '9876543210', tenantEmail: 'rahul@email.com', ownerId: 100, status: 'ACTIVE', moveInDate: '2026-03-15', moveOutDate: '', leaseStartDate: '2026-03-15', leaseEndDate: '2027-02-15', appAccessActive: true, activeRfidTags: 3, linkedDailyHelps: 2, pendingDues: 0, kycStatus: 'APPROVED' },
  { id: 2, communityId: 1, flatNumber: 'B-105', towerName: 'Tower B', tenantName: 'Priya Patel', tenantPhone: '9876543211', tenantEmail: 'priya@email.com', ownerId: 101, status: 'ACTIVE', moveInDate: '2026-06-20', moveOutDate: '', leaseStartDate: '2026-06-20', leaseEndDate: '2027-05-20', appAccessActive: true, activeRfidTags: 2, linkedDailyHelps: 3, pendingDues: 4500, kycStatus: 'APPROVED' },
  { id: 3, communityId: 1, flatNumber: 'C-801', towerName: 'Tower C', tenantName: 'Amit Kumar', tenantPhone: '9876543212', tenantEmail: 'amit@email.com', ownerId: 102, status: 'KYC_PENDING', moveInDate: '', moveOutDate: '', leaseStartDate: '2026-11-27', leaseEndDate: '2027-10-27', appAccessActive: false, activeRfidTags: 0, linkedDailyHelps: 0, pendingDues: 0, kycStatus: 'NOT_STARTED' },
  { id: 4, communityId: 1, flatNumber: 'A-507', towerName: 'Tower A', tenantName: 'Sneha Reddy', tenantPhone: '9876543213', tenantEmail: 'sneha@email.com', ownerId: 103, status: 'ACTIVE', moveInDate: '2026-01-15', moveOutDate: '', leaseStartDate: '2026-01-15', leaseEndDate: '2026-12-15', appAccessActive: true, activeRfidTags: 1, linkedDailyHelps: 1, pendingDues: 0, kycStatus: 'APPROVED' },
];

const DEMO_SAGA_SUMMARY: SagaSummary = { completed: 3, inProgress: 1, failed: 1, avgCompletionMinutes: 4.2, sagas: [] };

const DEMO_DOC_PIPELINE: DocumentPipelineSummary = {
  byStatus: { APPROVED: 5, MC_REVIEW_PENDING: 3, OCR_COMPLETE: 2, UPLOADED: 1 },
  byType: { AADHAAR: 4, RENTAL_AGREEMENT: 4, POLICE_VERIFICATION: 3 },
  avgOcrConfidence: 0.92, pendingMcReview: 3,
  expiryAlerts: [
    { documentId: 1, tenantRecordId: 1, documentType: 'RENTAL_AGREEMENT', expiryDate: '2026-12-20', daysRemaining: 23, severity: 'WARNING' },
    { documentId: 2, tenantRecordId: 4, documentType: 'POLICE_VERIFICATION', expiryDate: '2026-12-05', daysRemaining: 8, severity: 'CRITICAL' },
  ],
  documents: [
    { id: 1, tenantRecordId: 3, documentType: 'AADHAAR', originalFileName: 'amit_aadhaar.pdf', encryptedStoragePath: '/encrypted/tenant/3/1', watermarkedPreviewPath: '/previews/wm-1.pdf', encryptionKeyRef: 'AES-256-KMS-a1b2c3d4', verificationStatus: 'MC_REVIEW_PENDING', ocrExtractedData: '{name=Amit Kumar, aadhaarNumber=XXXX-XXXX-5432}', ocrConfidenceScore: 0.94, ocrProcessedAt: '2026-11-27T10:00:00', verifierRemarks: '', verifiedBy: '', verifiedAt: '', documentExpiryDate: '', expiryReminderSent: false, expiryReminderDate: '' },
    { id: 2, tenantRecordId: 3, documentType: 'RENTAL_AGREEMENT', originalFileName: 'amit_rental.pdf', encryptedStoragePath: '/encrypted/tenant/3/2', watermarkedPreviewPath: '/previews/wm-2.pdf', encryptionKeyRef: 'AES-256-KMS-e5f6g7h8', verificationStatus: 'MC_REVIEW_PENDING', ocrExtractedData: '{landlord=Owner, tenant=Amit Kumar, monthlyRent=₹25,000}', ocrConfidenceScore: 0.89, ocrProcessedAt: '2026-11-27T10:01:00', verifierRemarks: '', verifiedBy: '', verifiedAt: '', documentExpiryDate: '2027-10-27', expiryReminderSent: false, expiryReminderDate: '2027-09-27' },
    { id: 3, tenantRecordId: 3, documentType: 'POLICE_VERIFICATION', originalFileName: 'amit_pv.pdf', encryptedStoragePath: '/encrypted/tenant/3/3', watermarkedPreviewPath: '/previews/wm-3.pdf', encryptionKeyRef: 'AES-256-KMS-i9j0k1l2', verificationStatus: 'MC_REVIEW_PENDING', ocrExtractedData: '{stationName=Madhapur PS, status=CLEAR}', ocrConfidenceScore: 0.91, ocrProcessedAt: '2026-11-27T10:02:00', verifierRemarks: '', verifiedBy: '', verifiedAt: '', documentExpiryDate: '2027-11-27', expiryReminderSent: false, expiryReminderDate: '2027-10-27' },
  ]
};

const DEMO_SCHEDULE: SlotScheduleSummary = {
  date: new Date().toISOString().split('T')[0], totalSlots: 2,
  towerCapacities: {
    'Tower A': { tower: 'Tower A', moveIns: 1, moveOuts: 0, maxPerDay: 2, slots: [] },
    'Tower B': { tower: 'Tower B', moveIns: 0, moveOuts: 1, maxPerDay: 2, slots: [] },
    'Tower C': { tower: 'Tower C', moveIns: 0, moveOuts: 0, maxPerDay: 2, slots: [] },
    'Tower D': { tower: 'Tower D', moveIns: 0, moveOuts: 0, maxPerDay: 2, slots: [] },
  },
  elevatorUtilization: [
    { elevatorId: 'Tower A-SVC-1', bookings: 1, hoursBooked: 2 },
    { elevatorId: 'Tower B-SVC-2', bookings: 1, hoursBooked: 2 },
  ],
  allSlots: [
    { id: 1, communityId: 1, towerName: 'Tower A', slotDate: new Date().toISOString().split('T')[0], startTime: '10:00', endTime: '12:00', slotType: 'MOVE_IN', flatNumber: 'D-201', tenantRecordId: 0, serviceElevatorId: 'Tower A-SVC-1', gatePassIssued: true, gatePassNumber: 'GP-MI-001-5678', status: 'GATE_PASS_ISSUED', vehicleNumber: 'TS09AB1234', vehicleType: 'Tempo', driverName: 'Raju', driverPhone: '9999988888' },
    { id: 2, communityId: 1, towerName: 'Tower B', slotDate: new Date().toISOString().split('T')[0], startTime: '14:00', endTime: '16:00', slotType: 'MOVE_OUT', flatNumber: 'B-402', tenantRecordId: 0, serviceElevatorId: 'Tower B-SVC-2', gatePassIssued: false, gatePassNumber: '', status: 'APPROVED', vehicleNumber: 'AP07CD5678', vehicleType: 'Mini Truck', driverName: 'Suresh', driverPhone: '9999977777' },
  ]
};

const stepIcon = (s: StepStatus) => {
  if (s === 'COMPLETED') return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (s === 'FAILED') return <XCircle className="w-4 h-4 text-red-500" />;
  if (s === 'IN_PROGRESS') return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
  if (s === 'COMPENSATED') return <RefreshCw className="w-4 h-4 text-orange-500" />;
  return <Clock className="w-4 h-4 text-gray-400" />;
};

const statusColor = (s: string) => {
  const map: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800', APPROVED: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-green-100 text-green-800', GATE_PASS_ISSUED: 'bg-blue-100 text-blue-800',
    KYC_PENDING: 'bg-yellow-100 text-yellow-800', MC_REVIEW_PENDING: 'bg-yellow-100 text-yellow-800',
    MOVE_OUT_INITIATED: 'bg-orange-100 text-orange-800', IN_PROGRESS: 'bg-blue-100 text-blue-800',
    FAILED: 'bg-red-100 text-red-800', REJECTED: 'bg-red-100 text-red-800',
    MOVED_OUT: 'bg-gray-100 text-gray-800', COMPENSATED: 'bg-purple-100 text-purple-800',
  };
  return map[s] || 'bg-gray-100 text-gray-700';
};

// === Saga Panel ===
const SagaPanel: React.FC<{ tenants: TenantRecord[] }> = ({ tenants }) => {
  const [summary, setSummary] = useState<SagaSummary>(DEMO_SAGA_SUMMARY);
  const [activeSaga, setActiveSaga] = useState<MoveOutSaga | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const handleInitiate = async (tenantId: number) => {
    const tenant = tenants.find(t => t.id === tenantId);
    addLog(`Initiating move-out for ${tenant?.tenantName} (${tenant?.flatNumber})`);
    try {
      const saga = await api.initiateMoveOut(tenantId);
      setActiveSaga(saga);
      addLog(`Saga created: ID ${saga.id}, Status: ${saga.overallStatus}`);
    } catch {
      addLog(`Using demo mode — saga initiated for tenant ${tenantId}`);
      setActiveSaga({
        id: 99, tenantRecordId: tenantId, flatNumber: tenant?.flatNumber || 'A-302',
        towerName: tenant?.towerName || 'Tower A', overallStatus: 'INITIATED',
        duesVerification: 'PENDING', pendingAmount: tenant?.pendingDues || 0,
        appAccessRevocation: 'PENDING', rfidDeactivation: 'PENDING',
        dailyHelpUnlinking: 'PENDING', gatePassIssuance: 'PENDING',
        auditPreservation: 'PENDING', totalTags: tenant?.activeRfidTags || 3,
        tagsDeactivated: 0, helpsUnlinked: 0, auditRecordsArchived: 0,
        gatePassNumber: '', failedStep: '', failureReason: '', compensationLog: '',
        duesCheckedAt: '', accessRevokedAt: '', rfidDeactivatedAt: '',
        helpsUnlinkedAt: '', gatePassIssuedAt: '', auditPreservedAt: '', completedAt: '',
      } as MoveOutSaga);
    }
  };

  const handleExecute = async () => {
    if (!activeSaga) return;
    addLog('Executing distributed saga steps...');
    try {
      const result = await api.executeMoveOut(activeSaga.id);
      setActiveSaga(result);
      if (result.overallStatus === 'COMPLETED') {
        addLog(`Saga COMPLETED — all 6 steps passed. Gate pass: ${result.gatePassNumber}`);
        addLog(`${result.auditRecordsArchived} audit records archived for owner`);
      } else {
        addLog(`Saga FAILED at step: ${result.failedStep} — ${result.failureReason}`);
      }
    } catch {
      // Demo execution
      const steps: (keyof MoveOutSaga)[] = ['duesVerification', 'appAccessRevocation', 'rfidDeactivation', 'dailyHelpUnlinking', 'gatePassIssuance', 'auditPreservation'];
      const names = ['Dues Verification', 'App Access Revocation', 'RFID Deactivation', 'Daily Help Unlinking', 'Gate Pass Issuance', 'Audit Preservation'];
      const updated = { ...activeSaga };

      if (updated.pendingAmount > 0) {
        (updated as any).duesVerification = 'FAILED';
        updated.overallStatus = 'FAILED';
        updated.failedStep = 'DUES_VERIFICATION';
        updated.failureReason = `Pending dues of ₹${updated.pendingAmount}`;
        addLog(`FAILED: Pending dues of ₹${updated.pendingAmount}`);
      } else {
        for (let i = 0; i < steps.length; i++) {
          (updated as any)[steps[i]] = 'COMPLETED';
          addLog(`✓ ${names[i]} — completed`);
        }
        updated.overallStatus = 'COMPLETED';
        updated.tagsDeactivated = updated.totalTags;
        updated.helpsUnlinked = 2;
        updated.gatePassNumber = 'GP-MO-99-' + Math.floor(Math.random() * 10000);
        updated.auditRecordsArchived = 87;
        updated.completedAt = new Date().toISOString();
        addLog(`Saga COMPLETED. Gate pass: ${updated.gatePassNumber}. ${updated.auditRecordsArchived} audit records archived.`);
      }
      setActiveSaga(updated);
    }
  };

  const handleCompensate = async () => {
    if (!activeSaga) return;
    addLog('Initiating compensation (reverse order)...');
    try {
      const result = await api.compensateMoveOut(activeSaga.id);
      setActiveSaga(result);
      addLog(`Compensation complete: ${result.compensationLog}`);
    } catch {
      const updated = { ...activeSaga, overallStatus: 'COMPENSATED' as const, compensationLog: 'All steps reversed in reverse order' };
      setActiveSaga(updated);
      addLog('Compensation complete (demo): all steps reversed');
    }
  };

  const eligibleTenants = tenants.filter(t => t.status === 'ACTIVE');

  const sagaSteps = activeSaga ? [
    { key: 'duesVerification', label: 'Verify Zero Dues', icon: <Shield className="w-4 h-4" />, detail: activeSaga.pendingAmount > 0 ? `₹${activeSaga.pendingAmount} pending` : 'No dues' },
    { key: 'appAccessRevocation', label: 'Revoke App Access', icon: <Key className="w-4 h-4" />, detail: 'OAuth tokens + sessions' },
    { key: 'rfidDeactivation', label: `Deactivate RFID Tags (${activeSaga.totalTags})`, icon: <Wifi className="w-4 h-4" />, detail: `${activeSaga.tagsDeactivated}/${activeSaga.totalTags} deactivated` },
    { key: 'dailyHelpUnlinking', label: 'Unlink Daily Helps', icon: <UserMinus className="w-4 h-4" />, detail: `${activeSaga.helpsUnlinked} unlinked` },
    { key: 'gatePassIssuance', label: 'Issue Moving Truck Pass', icon: <Truck className="w-4 h-4" />, detail: activeSaga.gatePassNumber || 'Pending' },
    { key: 'auditPreservation', label: 'Preserve Audit Logs', icon: <Archive className="w-4 h-4" />, detail: `${activeSaga.auditRecordsArchived} records` },
  ] : [];

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Completed', value: summary.completed, color: 'text-green-600' },
          { label: 'In Progress', value: summary.inProgress, color: 'text-blue-600' },
          { label: 'Failed', value: summary.failed, color: 'text-red-600' },
          { label: 'Avg Time', value: `${summary.avgCompletionMinutes.toFixed(1)}m`, color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tenant Selection */}
      {!activeSaga && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><LogOut className="w-4 h-4" /> Select Tenant for Move-Out</h3>
          <div className="space-y-2">
            {eligibleTenants.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div>
                  <div className="font-medium text-sm">{t.tenantName}</div>
                  <div className="text-xs text-gray-500">{t.towerName} / {t.flatNumber} · {t.activeRfidTags} RFID · {t.linkedDailyHelps} daily helps · Dues: ₹{t.pendingDues}</div>
                </div>
                <button onClick={() => handleInitiate(t.id)} className="px-3 py-1.5 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700">
                  Initiate Move-Out
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Saga */}
      {activeSaga && (
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Zap className="w-4 h-4" /> Saga: {activeSaga.flatNumber} ({activeSaga.towerName})
            </h3>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(activeSaga.overallStatus)}`}>
              {activeSaga.overallStatus}
            </span>
          </div>

          {/* Step Pipeline */}
          <div className="space-y-2 mb-4">
            {sagaSteps.map((step, i) => (
              <div key={step.key} className="flex items-center gap-3 p-2 rounded border bg-gray-50">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                {stepIcon((activeSaga as any)[step.key])}
                <div className="flex-shrink-0">{step.icon}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{step.label}</div>
                  <div className="text-xs text-gray-500">{step.detail}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs ${statusColor((activeSaga as any)[step.key])}`}>
                  {(activeSaga as any)[step.key]}
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {activeSaga.overallStatus === 'INITIATED' && (
              <button onClick={handleExecute} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1">
                <ArrowRight className="w-4 h-4" /> Execute Saga
              </button>
            )}
            {activeSaga.overallStatus === 'FAILED' && (
              <button onClick={handleCompensate} className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 flex items-center gap-1">
                <RefreshCw className="w-4 h-4" /> Compensate
              </button>
            )}
            <button onClick={() => { setActiveSaga(null); setLog([]); }} className="px-4 py-2 border text-sm rounded-lg hover:bg-gray-50">
              Reset
            </button>
          </div>

          {/* Compensation Log */}
          {activeSaga.compensationLog && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
              <strong>Compensation:</strong> {activeSaga.compensationLog}
            </div>
          )}
        </div>
      )}

      {/* Execution Log */}
      {log.length > 0 && (
        <div className="bg-gray-900 text-green-400 rounded-lg p-3 font-mono text-xs max-h-48 overflow-y-auto">
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </div>
  );
};

// === Document Panel ===
const DocumentPanel: React.FC = () => {
  const [pipeline, setPipeline] = useState<DocumentPipelineSummary>(DEMO_DOC_PIPELINE);

  useEffect(() => { api.getDocumentPipeline().then(setPipeline).catch(() => {}); }, []);

  const handleReview = async (docId: number, approved: boolean) => {
    try {
      await api.reviewDocument(docId, approved, approved ? 'Verified and approved' : 'Document unclear', 'MC Secretary');
      const updated = await api.getDocumentPipeline();
      setPipeline(updated);
    } catch {
      setPipeline(prev => ({
        ...prev,
        documents: prev.documents.map(d =>
          d.id === docId ? { ...d, verificationStatus: approved ? 'APPROVED' : 'REJECTED', verifiedBy: 'MC Secretary', verifierRemarks: approved ? 'Verified' : 'Rejected' } : d
        ),
        pendingMcReview: Math.max(0, prev.pendingMcReview - 1),
      }));
    }
  };

  const pendingDocs = pipeline.documents.filter(d => d.verificationStatus === 'MC_REVIEW_PENDING');

  return (
    <div className="space-y-4">
      {/* Pipeline Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'OCR Confidence', value: `${(pipeline.avgOcrConfidence * 100).toFixed(0)}%`, color: 'text-blue-600' },
          { label: 'Pending Review', value: pipeline.pendingMcReview, color: 'text-yellow-600' },
          { label: 'Expiry Alerts', value: pipeline.expiryAlerts.length, color: 'text-red-600' },
          { label: 'Total Docs', value: pipeline.documents.length, color: 'text-gray-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Document Pipeline Visualization */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> OCR + Verification Pipeline</h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {['UPLOADED', 'OCR_QUEUED', 'OCR_COMPLETE', 'PII_ENCRYPTED', 'WATERMARK_GENERATED', 'MC_REVIEW_PENDING', 'APPROVED'].map((stage, i, arr) => (
            <React.Fragment key={stage}>
              <div className="flex-shrink-0 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold ${
                  pipeline.byStatus[stage] ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  {pipeline.byStatus[stage] || 0}
                </div>
                <div className="text-xs mt-1 max-w-[80px] leading-tight">{stage.replace(/_/g, ' ')}</div>
              </div>
              {i < arr.length - 1 && <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* MC Review Queue */}
      {pendingDocs.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Eye className="w-4 h-4" /> MC Review Queue ({pendingDocs.length})</h3>
          <div className="space-y-2">
            {pendingDocs.map(doc => (
              <div key={doc.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium">{doc.documentType.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-gray-500 ml-2">{doc.originalFileName}</span>
                  </div>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    OCR: {(doc.ocrConfidenceScore * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="bg-gray-50 rounded p-2 text-xs font-mono mb-2">{doc.ocrExtractedData}</div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <Shield className="w-3 h-3" /> PII encrypted: {doc.encryptionKeyRef}
                  <span className="mx-1">·</span>
                  <FileCheck className="w-3 h-3" /> Watermark: {doc.watermarkedPreviewPath}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleReview(doc.id, true)} className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Approve
                  </button>
                  <button onClick={() => handleReview(doc.id, false)} className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expiry Alerts */}
      {pipeline.expiryAlerts.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" /> Document Expiry Alerts</h3>
          <div className="space-y-2">
            {pipeline.expiryAlerts.map((alert, i) => (
              <div key={i} className={`flex items-center justify-between p-2 rounded border ${
                alert.severity === 'CRITICAL' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="text-sm">
                  <span className="font-medium">{alert.documentType.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-gray-500 ml-2">Tenant #{alert.tenantRecordId}</span>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${alert.severity === 'CRITICAL' ? 'text-red-600' : 'text-yellow-600'}`}>
                    {alert.daysRemaining} days left
                  </div>
                  <div className="text-xs text-gray-500">Expires: {alert.expiryDate}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Type Distribution */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-sm mb-3">Documents by Type</h3>
        <div className="space-y-2">
          {Object.entries(pipeline.byType).map(([type, count]) => (
            <div key={type} className="flex items-center gap-3">
              <div className="text-xs w-40">{type.replace(/_/g, ' ')}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-4">
                <div className="bg-blue-500 h-4 rounded-full" style={{ width: `${(count / Math.max(...Object.values(pipeline.byType))) * 100}%` }} />
              </div>
              <div className="text-xs font-bold w-6 text-right">{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// === Slot Panel ===
const SlotPanel: React.FC = () => {
  const [schedule, setSchedule] = useState<SlotScheduleSummary>(DEMO_SCHEDULE);

  useEffect(() => { api.getDaySchedule(1).then(setSchedule).catch(() => {}); }, []);

  const handleIssuePass = async (slotId: number) => {
    try {
      await api.issueGatePass(slotId);
      const updated = await api.getDaySchedule(1);
      setSchedule(updated);
    } catch {
      setSchedule(prev => ({
        ...prev,
        allSlots: prev.allSlots.map(s =>
          s.id === slotId ? { ...s, gatePassIssued: true, gatePassNumber: 'GP-' + Math.floor(Math.random() * 10000), status: 'GATE_PASS_ISSUED' as const } : s
        )
      }));
    }
  };

  const towers = Object.values(schedule.towerCapacities);

  return (
    <div className="space-y-4">
      {/* Tower Capacity Grid */}
      <div className="grid grid-cols-4 gap-3">
        {towers.map(t => {
          const used = t.moveIns + t.moveOuts;
          const pct = (used / t.maxPerDay) * 100;
          return (
            <div key={t.tower} className="bg-white rounded-lg border p-3">
              <div className="font-medium text-sm mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> {t.tower}
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 bg-gray-100 rounded-full h-3">
                  <div className={`h-3 rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <span className="text-xs font-bold">{used}/{t.maxPerDay}</span>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="text-green-600">{t.moveIns} in</span>
                <span className="text-orange-600">{t.moveOuts} out</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Freight Elevator Hours */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Service Elevator Hours (10:00 AM – 5:00 PM)</h3>
        <div className="relative">
          <div className="flex border rounded overflow-hidden">
            {Array.from({ length: 7 }, (_, i) => i + 10).map(hour => {
              const slotInHour = schedule.allSlots.find(s => {
                const startHour = parseInt(s.startTime.split(':')[0]);
                const endHour = parseInt(s.endTime.split(':')[0]);
                return hour >= startHour && hour < endHour;
              });
              return (
                <div key={hour} className={`flex-1 h-16 border-r last:border-r-0 p-1 text-center ${
                  slotInHour ? (slotInHour.slotType === 'MOVE_IN' ? 'bg-green-100' : 'bg-orange-100') : 'bg-gray-50'
                }`}>
                  <div className="text-xs text-gray-500">{hour}:00</div>
                  {slotInHour && (
                    <div className="text-xs mt-1">
                      <div className="font-medium">{slotInHour.flatNumber}</div>
                      <div className="text-gray-500">{slotInHour.slotType === 'MOVE_IN' ? 'IN' : 'OUT'}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Today's Slots */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Truck className="w-4 h-4" /> Today's Move Slots</h3>
        <div className="space-y-2">
          {schedule.allSlots.map(slot => (
            <div key={slot.id} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    slot.slotType === 'MOVE_IN' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                  }`}>{slot.slotType.replace('_', ' ')}</span>
                  <span className="font-medium text-sm">{slot.towerName} / {slot.flatNumber}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(slot.status)}`}>
                  {slot.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div><Calendar className="w-3 h-3 inline mr-1" /> {slot.startTime} – {slot.endTime}</div>
                <div><Truck className="w-3 h-3 inline mr-1" /> {slot.vehicleType}: {slot.vehicleNumber}</div>
                <div><Users className="w-3 h-3 inline mr-1" /> Driver: {slot.driverName} ({slot.driverPhone})</div>
                <div><Building2 className="w-3 h-3 inline mr-1" /> Elevator: {slot.serviceElevatorId}</div>
              </div>
              {slot.gatePassIssued ? (
                <div className="mt-2 p-2 bg-blue-50 rounded flex items-center gap-2 text-xs">
                  <CheckCircle className="w-3 h-3 text-blue-600" />
                  <span className="font-medium text-blue-700">Gate Pass: {slot.gatePassNumber}</span>
                </div>
              ) : (
                <button onClick={() => handleIssuePass(slot.id)}
                  className="mt-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center gap-1">
                  <FileCheck className="w-3 h-3" /> Issue Gate Pass
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Elevator Utilization */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-sm mb-3">Elevator Utilization</h3>
        <div className="space-y-2">
          {schedule.elevatorUtilization.map(e => (
            <div key={e.elevatorId} className="flex items-center gap-3">
              <div className="text-xs w-32 font-medium">{e.elevatorId}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-4">
                <div className="bg-purple-500 h-4 rounded-full" style={{ width: `${(e.hoursBooked / 7) * 100}%` }} />
              </div>
              <div className="text-xs text-gray-600">{e.bookings} bookings · {e.hoursBooked}h</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// === Main Dashboard ===
const TenancyWorkflowDashboard: React.FC = () => {
  const [tab, setTab] = useState<'saga' | 'documents' | 'slots'>('saga');
  const [tenants, setTenants] = useState<TenantRecord[]>(DEMO_TENANTS);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    api.getAllTenants().then(data => { if (data.length > 0) { setTenants(data); setSeeded(true); } }).catch(() => {});
  }, []);

  const handleSeed = async () => {
    try {
      await api.seedDemoData();
      const data = await api.getAllTenants();
      setTenants(data);
      setSeeded(true);
    } catch { setSeeded(true); }
  };

  const tabs = [
    { key: 'saga' as const, label: 'Move-Out Saga', icon: <LogOut className="w-4 h-4" /> },
    { key: 'documents' as const, label: 'KYC Pipeline', icon: <FileText className="w-4 h-4" /> },
    { key: 'slots' as const, label: 'Slot Throttling', icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Home className="w-5 h-5" /> Tenant Move-In / Move-Out & NOC</h1>
          <p className="text-sm text-gray-500">Distributed saga, document verification, slot throttling</p>
        </div>
        {!seeded && (
          <button onClick={handleSeed} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 flex items-center gap-1">
            <Upload className="w-3 h-3" /> Seed Demo Data
          </button>
        )}
      </div>

      {/* Tenant Summary */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        {tenants.map(t => (
          <div key={t.id} className="bg-white rounded-lg border p-2.5">
            <div className="font-medium text-sm">{t.tenantName}</div>
            <div className="text-xs text-gray-500">{t.towerName} / {t.flatNumber}</div>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${statusColor(t.status)}`}>
              {t.status.replace(/_/g, ' ')}
            </span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:text-gray-900'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'saga' && <SagaPanel tenants={tenants} />}
      {tab === 'documents' && <DocumentPanel />}
      {tab === 'slots' && <SlotPanel />}
    </div>
  );
};

export default TenancyWorkflowDashboard;
