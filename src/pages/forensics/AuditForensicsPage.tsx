import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  MenuItem,
  Paper,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { toast } from 'sonner';
import {
  anchorMerkleBatch,
  formatRupees,
  listExternalAnchors,
  listFlatLedgerEvents,
  listWormAuditEvents,
  reconstructAtPointInTime,
  recordSensitiveAudit,
  seedFlatB902Scenario,
  simulateRogueDbaTamper,
  verifyWormIntegrity,
} from '../../services/forensics/forensicsService';
import type {
  BitemporalLedgerEvent,
  ExternalMerkleAnchor,
  ForensicVerificationReport,
  SensitiveActionType,
  TimeTravelReconstruction,
  WormAuditEvent,
} from '../../types/forensics';

const SOCIETY_ID = 1;
const DEFAULT_FLAT_ID = 902;

export function AuditForensicsPage(): React.ReactElement {
  const [tab, setTab] = useState(0);

  // Tab 0: Bitemporal Time-Travel Ledger
  const [effectiveDate, setEffectiveDate] = useState('2026-03-31');
  const [recordedCutoff, setRecordedCutoff] = useState('2026-03-31T23:59:59+05:30');
  const [recon, setRecon] = useState<TimeTravelReconstruction | null>(null);
  const [events, setEvents] = useState<BitemporalLedgerEvent[]>([]);

  // Tab 1: Tamper-Proof WORM Audit & Merkle Anchors
  const [actionType, setActionType] = useState<SensitiveActionType>('PENALTY_WAIVER');
  const [resourceId, setResourceId] = useState('FLAT:B-902');
  const [reason, setReason] = useState('AGM-approved ₹25,000 construction penalty waiver');
  const [checkerId, setCheckerId] = useState('102');
  const [checkerName, setCheckerName] = useState('Treasurer Rao');
  const [auditLogs, setAuditLogs] = useState<WormAuditEvent[]>([]);
  const [anchors, setAnchors] = useState<ExternalMerkleAnchor[]>([]);
  const [verification, setVerification] = useState<ForensicVerificationReport | null>(null);

  const loadForensics = useCallback(async (): Promise<void> => {
    try {
      const [evts, audits, ancs, ver] = await Promise.all([
        listFlatLedgerEvents(SOCIETY_ID, DEFAULT_FLAT_ID),
        listWormAuditEvents(SOCIETY_ID),
        listExternalAnchors(SOCIETY_ID),
        verifyWormIntegrity(SOCIETY_ID),
      ]);
      setEvents(evts);
      setAuditLogs(audits);
      setAnchors(ancs);
      setVerification(ver);
    } catch {
      // Backend optional in offline preview
    }
  }, []);

  useEffect(() => {
    void loadForensics();
  }, [loadForensics]);

  const handleSeedB902 = async (): Promise<void> => {
    try {
      const res = await seedFlatB902Scenario(SOCIETY_ID);
      setRecon(res);
      toast.success('Seeded Flat B-902 bitemporal ledger (March 31 + April backdated events)');
      await loadForensics();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to seed scenario');
    }
  };

  const handleRunTimeTravel = async (): Promise<void> => {
    try {
      const isoRecorded = new Date(recordedCutoff).toISOString();
      const res = await reconstructAtPointInTime({
        societyId: SOCIETY_ID,
        flatId: DEFAULT_FLAT_ID,
        asOfEffectiveDate: effectiveDate,
        asOfRecordedAt: isoRecorded,
      });
      setRecon(res);
      toast.success(`Point-in-time balance reconstructed for ${res.unitCode}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Time-travel query failed');
    }
  };

  const handleRecordAudit = async (): Promise<void> => {
    try {
      await recordSensitiveAudit({
        societyId: SOCIETY_ID,
        actionType,
        resourceType: actionType === 'VISITOR_SOFT_DELETED' ? 'VISITOR_LOG' : 'ADMIN_ACTION',
        resourceId,
        actorId: 101,
        actorName: 'President Anil',
        checkerId: checkerId ? Number(checkerId) : undefined,
        checkerName: checkerName || undefined,
        monetaryImpactPaise: actionType === 'PENALTY_WAIVER' ? 2_500_000 : 0,
        reason,
        oldValueJson: '{"status":"ACTIVE","penalty":25000}',
        newValueJson:
          actionType === 'VISITOR_SOFT_DELETED'
            ? '{"status":"TOMBSTONED"}'
            : '{"status":"APPLIED","penalty":0}',
        tombstoneDelete: actionType === 'VISITOR_SOFT_DELETED',
      });
      toast.success(`Recorded KMS-ECDSA signed ${actionType} audit event`);
      await loadForensics();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record audit event');
    }
  };

  const handleAnchorBatch = async (): Promise<void> => {
    try {
      const a = await anchorMerkleBatch(SOCIETY_ID);
      toast.success(`Anchored seq ${a.seqFrom}..${a.seqTo} to ${a.wormBucketUri}`);
      await loadForensics();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Merkle anchor failed');
    }
  };

  const handleSimulateTamper = async (mode: 'MODIFY_ROW' | 'TRUNCATE_TAIL'): Promise<void> => {
    try {
      const report = await simulateRogueDbaTamper({
        societyId: SOCIETY_ID,
        mode,
        targetSeqNo: 1,
      });
      setVerification(report);
      toast.error(`Tamper alarm: ${report.failureReason}`);
      await loadForensics();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Simulation failed');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
        Audit Forensics, Bitemporal Event Ledger &amp; WORM Anchors
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Point-in-time financial reconstruction (effective vs. recorded time) and rogue-DBA-resistant admin/guard audit trails.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Flat B-902 Bitemporal Time-Travel" />
        <Tab label="Tamper-Proof WORM Audit & Merkle Anchors" />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ display: 'grid', gap: 3 }}>
          <Paper sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
              <TextField
                label="Effective Date (Period)"
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Recorded Cutoff (Knowledge Time ISO)"
                value={recordedCutoff}
                onChange={(e) => setRecordedCutoff(e.target.value)}
                size="small"
                sx={{ minWidth: 280 }}
              />
              <Button variant="contained" onClick={handleRunTimeTravel}>
                Reconstruct Balance
              </Button>
              <Button variant="outlined" onClick={handleSeedB902}>
                Load Flat B-902 March/April Scenario
              </Button>
            </Box>

            {recon && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                <Chip label={`Unit: ${recon.unitCode}`} color="primary" />
                <Chip
                  label={`As-Known on ${recon.asOfEffectiveDate}: ${formatRupees(recon.asKnownBalancePaise)}`}
                  color="success"
                />
                <Chip
                  label={`Restated (After April Entries): ${formatRupees(recon.restatedBalancePaise)}`}
                  color="warning"
                />
                <Chip
                  label={`Retroactive Variance: ${formatRupees(recon.retroactiveVariancePaise)}`}
                  color="error"
                />
                <Chip label={`Live Balance: ${formatRupees(recon.liveCurrentBalancePaise)}`} />
                <Chip
                  label={`Checkpoint + Tail Replayed: ${recon.eventsReplayedFromCheckpoint} events`}
                  variant="outlined"
                />
              </Box>
            )}
          </Paper>

          {recon && recon.retroactiveAdjustments.length > 0 && (
            <Paper sx={{ p: 2.5 }}>
              <Typography variant="h6" gutterBottom>
                April Retroactive Adjustments Affecting March 31 ({recon.retroactiveAdjustments.length} events)
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Ver</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Effective Date</TableCell>
                    <TableCell>Recorded At</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Reason / Causality</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recon.retroactiveAdjustments.map((ev) => (
                    <TableRow key={ev.eventId}>
                      <TableCell>v{ev.streamVersion}</TableCell>
                      <TableCell><Chip size="small" label={ev.eventType} color="warning" /></TableCell>
                      <TableCell>{ev.effectiveDate}</TableCell>
                      <TableCell>{ev.recordedAt}</TableCell>
                      <TableCell>{formatRupees(ev.signedAmountPaise)}</TableCell>
                      <TableCell>{ev.reasonCode}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}

          <Paper sx={{ p: 2.5 }}>
            <Typography variant="h6" gutterBottom>Append-Only Bitemporal Event Stream ({events.length})</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Stream Ver</TableCell>
                  <TableCell>Event Type</TableCell>
                  <TableCell>Effective Date</TableCell>
                  <TableCell>Recorded At</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Event Hash</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.map((ev) => (
                  <TableRow key={ev.eventId}>
                    <TableCell>v{ev.streamVersion}</TableCell>
                    <TableCell>{ev.eventType}</TableCell>
                    <TableCell>{ev.effectiveDate}</TableCell>
                    <TableCell>{ev.recordedAt}</TableCell>
                    <TableCell>{formatRupees(ev.signedAmountPaise)}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{ev.eventHash.slice(0, 14)}…</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      )}

      {tab === 1 && (
        <Box sx={{ display: 'grid', gap: 3 }}>
          {verification && (
            <Alert
              severity={
                verification.chainValid &&
                verification.signaturesValid &&
                verification.externalAnchorMatch &&
                !verification.tailTruncationDetected
                  ? 'success'
                  : 'error'
              }
            >
              <strong>
                {verification.chainValid && verification.externalAnchorMatch
                  ? 'WORM INTEGRITY VERIFIED'
                  : 'TAMPER / TRUNCATION DETECTED'}
              </strong>{' '}
              — {verification.failureReason} (Local Events: {verification.totalLocalEvents}, S3 Object Lock Anchors:{' '}
              {verification.totalExternalAnchors})
            </Alert>
          )}

          <Paper sx={{ p: 2.5 }}>
            <Typography variant="h6" gutterBottom>Record Dual-Control Sensitive Audit Event</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
              <TextField
                select
                label="Action Type"
                value={actionType}
                onChange={(e) => setActionType(e.target.value as SensitiveActionType)}
                size="small"
              >
                <MenuItem value="PENALTY_WAIVER">Waive ₹25,000 Penalty (Dual-Control)</MenuItem>
                <MenuItem value="VENDOR_BLACKLIST">Blacklist Vendor (Dual-Control)</MenuItem>
                <MenuItem value="VISITOR_SOFT_DELETED">Tombstone Visitor Record</MenuItem>
              </TextField>
              <TextField label="Resource ID" value={resourceId} onChange={(e) => setResourceId(e.target.value)} size="small" />
              <TextField label="Checker ID" value={checkerId} onChange={(e) => setCheckerId(e.target.value)} size="small" />
              <TextField label="Checker Name" value={checkerName} onChange={(e) => setCheckerName(e.target.value)} size="small" />
              <TextField label="Audit Reason" value={reason} onChange={(e) => setReason(e.target.value)} size="small" />
              <Button variant="contained" onClick={handleRecordAudit}>
                Sign &amp; Append Event
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 2 }}>
              <Button variant="outlined" onClick={handleAnchorBatch}>
                Seal &amp; Anchor Merkle Batch to S3 WORM
              </Button>
              <Button variant="outlined" color="warning" onClick={() => handleSimulateTamper('MODIFY_ROW')}>
                Simulate Rogue DBA Row Edit
              </Button>
              <Button variant="outlined" color="error" onClick={() => handleSimulateTamper('TRUNCATE_TAIL')}>
                Simulate Rogue DBA Tail Truncation
              </Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 2.5 }}>
            <Typography variant="h6" gutterBottom>External Cross-Account WORM Merkle Anchors ({anchors.length})</Typography>
            {anchors.map((a) => (
              <Typography key={a.anchorId} variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                seq[{a.seqFrom}..{a.seqTo}] • {a.objectLockMode} • root={a.merkleRoot.slice(0, 16)}… • {a.wormBucketUri}
              </Typography>
            ))}
          </Paper>

          <Paper sx={{ p: 2.5 }}>
            <Typography variant="h6" gutterBottom>KMS-ECDSA Signed Audit Log ({auditLogs.length})</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Seq</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Risk</TableCell>
                  <TableCell>Maker / Checker</TableCell>
                  <TableCell>Tombstone</TableCell>
                  <TableCell>Record Hash</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.auditId}>
                    <TableCell>#{log.seqNo}</TableCell>
                    <TableCell>{log.actionType}</TableCell>
                    <TableCell><Chip size="small" label={log.riskTier} color={log.riskTier === 'CRITICAL' ? 'error' : 'default'} /></TableCell>
                    <TableCell>{log.actorName} / {log.checkerName ?? '-'}</TableCell>
                    <TableCell>{log.tombstoned ? 'TOMBSTONED' : 'ACTIVE'}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{log.recordHash.slice(0, 14)}…</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      )}
    </Container>
  );
}
