import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  FormControlLabel,
  Paper,
  Switch,
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
  ackGateAlert,
  dispatchGateAlert,
  escalateGateAlert,
  getStorageSummary,
  getTelecomSummary,
  listDeliveryEvents,
  recordCompressionAudit,
} from '../../services/finops/finopsService';
import type {
  DeliveryEvent,
  DeliveryRoutePlan,
  StorageFinOpsSummary,
  TelecomFinOpsSummary,
} from '../../types/finops';

const SOCIETY_ID = 1;

export function FinOpsDashboardPage(): React.ReactElement {
  const [residentId, setResidentId] = useState('res_flat_a402');
  const [wsOnline, setWsOnline] = useState(true);
  const [dozeMode, setDozeMode] = useState(false);
  const [waOptIn, setWaOptIn] = useState(true);

  const [activePlan, setActivePlan] = useState<DeliveryRoutePlan | null>(null);
  const [telecomSummary, setTelecomSummary] = useState<TelecomFinOpsSummary | null>(null);
  const [storageSummary, setStorageSummary] = useState<StorageFinOpsSummary | null>(null);
  const [events, setEvents] = useState<DeliveryEvent[]>([]);

  const loadAll = useCallback(async (): Promise<void> => {
    try {
      const [tel, sto, evs] = await Promise.all([
        getTelecomSummary(SOCIETY_ID),
        getStorageSummary(SOCIETY_ID),
        listDeliveryEvents(SOCIETY_ID),
      ]);
      setTelecomSummary(tel);
      setStorageSummary(sto);
      setEvents(evs);
    } catch {
      // Backend optional in offline preview
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleDispatch = async (): Promise<void> => {
    try {
      const plan = await dispatchGateAlert({
        societyId: SOCIETY_ID,
        residentId,
        visitorType: 'DELIVERY',
        slaMs: 15_000,
        wsOnlineOverride: wsOnline,
        aggressiveDozeOverride: dozeMode,
        waOptInOverride: waOptIn,
      });
      setActivePlan(plan);
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to dispatch alert');
    }
  };

  const handleEscalate = async (): Promise<void> => {
    if (!activePlan) return;
    try {
      const ev = await escalateGateAlert(activePlan.alertId);
      setActivePlan((prev) =>
        prev
          ? {
              ...prev,
              currentChannel: ev.currentChannel,
              currentCostPaise: ev.totalCostPaise,
              status: ev.status,
            }
          : null,
      );
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Escalation failed');
    }
  };

  const handleAck = async (): Promise<void> => {
    if (!activePlan) return;
    try {
      const ev = await ackGateAlert(activePlan.alertId, activePlan.currentChannel, 2800);
      setActivePlan((prev) => (prev ? { ...prev, status: ev.status } : null));
      toast.success(`Resolved on ${ev.winningChannel} in ${ev.resolvedLatencyMs}ms`);
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ACK failed');
    }
  };

  const handleSimulateWebpUpload = async (): Promise<void> => {
    try {
      const summary = await recordCompressionAudit({
        societyId: SOCIETY_ID,
        assetClass: 'VISITOR_SNAPSHOT',
        originalBytes: 2_850_000,
        compressedBytes: 54_000,
        format: 'WEBP',
      });
      setStorageSummary(summary);
      toast.success('Recorded 2.85 MB JPEG -> 54 KB WebP optimization');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to log compression audit');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Cloud FinOps &amp; Telecom Cost Router
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        15-second SLA delivery waterfall (FCM ₹0.00 → WhatsApp ₹0.15 → IVR ₹0.40) and S3 WebP/AVIF lifecycle guardrails.
      </Typography>

      {/* KPI Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">Telecom SLA (≤ 15s)</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {telecomSummary ? `${telecomSummary.slaCompliancePct.toFixed(1)}%` : '—'}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">Saved vs IVR Baseline</Typography>
          <Typography variant="h5" color="success.main" sx={{ fontWeight: 800 }}>
            {telecomSummary ? `₹${(telecomSummary.totalSavedPaise / 100).toFixed(2)}` : '—'}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">WebP Compression Savings</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {storageSummary ? `${storageSummary.compressionSavingsPct.toFixed(1)}%` : '—'}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">Avg Approval Latency</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {telecomSummary ? `${Math.round(telecomSummary.avgLatencyMs)} ms` : '—'}
          </Typography>
        </Paper>
      </Box>

      {/* Telecom Router Simulator */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Gate Alert Delivery Router (15s SLA)
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
          <TextField
            label="Resident ID"
            value={residentId}
            onChange={(e) => setResidentId(e.target.value)}
            size="small"
          />
          <FormControlLabel
            control={<Switch checked={wsOnline} onChange={(e) => setWsOnline(e.target.checked)} />}
            label="WS/FCM Online"
          />
          <FormControlLabel
            control={<Switch checked={dozeMode} onChange={(e) => setDozeMode(e.target.checked)} />}
            label="OEM Doze Killer"
          />
          <FormControlLabel
            control={<Switch checked={waOptIn} onChange={(e) => setWaOptIn(e.target.checked)} />}
            label="WhatsApp Opt-In"
          />
          <Button variant="contained" onClick={() => void handleDispatch()}>
            Dispatch Gate Alert
          </Button>
        </Box>

        {activePlan && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              {activePlan.routingReason} · Status: <strong>{activePlan.status}</strong> · Current Cost: ₹
              {(activePlan.currentCostPaise / 100).toFixed(2)}
            </Alert>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {activePlan.escalationPath.map((step) => (
                <Chip
                  key={`${step.channel}-${step.triggerAtMs}`}
                  label={`${step.channel} (₹${(step.costPaise / 100).toFixed(2)} @ ${step.triggerAtMs}ms)`}
                  color={step.channel === activePlan.currentChannel ? 'primary' : 'default'}
                  variant={step.channel === activePlan.currentChannel ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
            {activePlan.status !== 'RESOLVED' && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" color="warning" onClick={() => void handleEscalate()}>
                  Simulate Timeout → Escalate Next
                </Button>
                <Button variant="contained" color="success" onClick={() => void handleAck()}>
                  Resident Taps Approve (Cancel Escalation)
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* S3 Lifecycle Policies */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            S3 Storage Tiering &amp; &lt;128 KB Guardrails
          </Typography>
          <Button size="small" variant="outlined" onClick={() => void handleSimulateWebpUpload()}>
            Log Sample WebP Compression
          </Button>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Asset Class</TableCell>
              <TableCell>Format</TableCell>
              <TableCell>Hot → Warm → Archive</TableCell>
              <TableCell>Min Billable</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(storageSummary?.policies ?? []).map((p) => (
              <TableRow key={p.assetClass}>
                <TableCell>{p.assetClass}</TableCell>
                <TableCell><Chip label={p.targetFormat} size="small" /></TableCell>
                <TableCell>
                  {p.hotTier} ({p.hotDays}d) → {p.warmTier} ({p.warmDays}d) → {p.archiveTier} ({p.retentionDays}d)
                </TableCell>
                <TableCell>{p.minBillableKb} KB</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Recent Routing Events */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          Recent Routing Events ({events.length})
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Resident</TableCell>
              <TableCell>Initial</TableCell>
              <TableCell>Winning</TableCell>
              <TableCell>Latency</TableCell>
              <TableCell align="right">Cost</TableCell>
              <TableCell align="right">Saved</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((e) => (
              <TableRow key={e.alertId}>
                <TableCell>{e.residentId}</TableCell>
                <TableCell>{e.initialChannel}</TableCell>
                <TableCell>{e.winningChannel ?? e.currentChannel}</TableCell>
                <TableCell>{e.resolvedLatencyMs ? `${e.resolvedLatencyMs} ms` : e.status}</TableCell>
                <TableCell align="right">₹{(e.totalCostPaise / 100).toFixed(2)}</TableCell>
                <TableCell align="right">₹{(e.savingsPaise / 100).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}

export default FinOpsDashboardPage;
