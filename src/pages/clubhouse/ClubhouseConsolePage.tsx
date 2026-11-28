import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  FormControlLabel,
  MenuItem,
  Paper,
  Switch,
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
  authorizePosOrder,
  cancelGuestPass,
  enqueueOfflinePosOrder,
  formatRupees,
  getFlatTabAccount,
  issueGuestPasses,
  listDailyBatches,
  listGuestPasses,
  listPendingChallenges,
  listPosOrders,
  loadOfflinePosOutbox,
  quoteGuestPasses,
  reconcileDailyBatch,
  resolvePushChallenge,
  syncOfflinePosOrders,
  validateTurnstileScan,
} from '../../services/clubhouse/clubhouseService';
import type {
  FlatTabAccount,
  GuestAccessPass,
  GuestPassQuote,
  OfflineOrderQueueItem,
  PosAuthMethod,
  PosDailyBatch,
  PosOrder,
  PosTabChallenge,
  SettlementMode,
  TurnstileValidateResponse,
} from '../../types/clubhouse';

const SOCIETY_ID = 1;
const FLAT_ID = 1204;
const UNIT_CODE = 'Tower A - 1204';
const TERMINAL_ID = 'CAFE-POS-1';

export function ClubhouseConsolePage(): React.ReactElement {
  const [tab, setTab] = useState(0);

  // Café POS state
  const [account, setAccount] = useState<FlatTabAccount | null>(null);
  const [itemsSummary, setItemsSummary] = useState('Flat White x2 + Croissant');
  const [subtotalRupees, setSubtotalRupees] = useState('420');
  const [settlementMode, setSettlementMode] = useState<SettlementMode>('FLAT_TAB');
  const [authMethod, setAuthMethod] = useState<PosAuthMethod>('PUSH_CHALLENGE');
  const [pin, setPin] = useState('4829');
  const [offlineDeadZone, setOfflineDeadZone] = useState(false);
  const [outbox, setOutbox] = useState<OfflineOrderQueueItem[]>(() => loadOfflinePosOutbox());
  const [challenges, setChallenges] = useState<PosTabChallenge[]>([]);
  const [orders, setOrders] = useState<PosOrder[]>([]);
  const [batches, setBatches] = useState<PosDailyBatch[]>([]);

  // Pool Guest Pass state
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [guestNamesText, setGuestNamesText] = useState('Anita Rao, Vikram Mehta, Kabir Sen');
  const [quote, setQuote] = useState<GuestPassQuote | null>(null);
  const [passes, setPasses] = useState<GuestAccessPass[]>([]);
  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState<TurnstileValidateResponse | null>(null);

  const loadAll = useCallback(async (): Promise<void> => {
    try {
      const [acc, chs, ords, bts, pss] = await Promise.all([
        getFlatTabAccount(SOCIETY_ID, FLAT_ID, UNIT_CODE),
        listPendingChallenges(SOCIETY_ID, FLAT_ID),
        listPosOrders(SOCIETY_ID),
        listDailyBatches(SOCIETY_ID),
        listGuestPasses(SOCIETY_ID, FLAT_ID),
      ]);
      setAccount(acc);
      setChallenges(chs);
      setOrders(ords);
      setBatches(bts);
      setPasses(pss);
    } catch {
      // Backend optional in offline preview
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleChargeOrder = async (): Promise<void> => {
    const subtotalPaise = Math.max(100, Math.round(Number(subtotalRupees || '0') * 100));
    const gstPaise = Math.round(subtotalPaise * 0.05);
    const txUuid = `pos-${Date.now()}`;

    if (offlineDeadZone) {
      try {
        const updated = enqueueOfflinePosOrder(
          {
            clientTxUuid: txUuid,
            flatId: FLAT_ID,
            unitCode: UNIT_CODE,
            terminalId: TERMINAL_ID,
            outletName: 'Clubhouse Brew & Bean Café',
            itemsSummary,
            subtotalPaise,
            gstPaise,
            authMethod: 'OFFLINE_QR',
            orderedAt: new Date().toISOString(),
          },
          account?.availableCreditPaise ?? 1_000_000,
          account?.offlineFloorCapPaise ?? 150_000,
        );
        setOutbox(updated);
        toast.info('Offline dead-zone mode: ticket queued in encrypted SQLite outbox');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Offline limit check failed');
      }
      return;
    }

    try {
      const res = await authorizePosOrder({
        societyId: SOCIETY_ID,
        flatId: FLAT_ID,
        unitCode: UNIT_CODE,
        terminalId: TERMINAL_ID,
        outletName: 'Clubhouse Brew & Bean Café',
        clientTxUuid: txUuid,
        itemsSummary,
        subtotalPaise,
        gstPaise,
        settlementMode,
        authMethod,
        pin: authMethod === 'PIN' ? pin : undefined,
      });
      toast.success(`POS Outcome: ${res.outcome}`);
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'POS authorization failed');
    }
  };

  const handleResolveChallenge = async (challengeId: string, approve: boolean): Promise<void> => {
    try {
      const res = await resolvePushChallenge(challengeId, 'Resident (A-1204)', approve);
      toast.success(`Challenge ${res.outcome}`);
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resolve challenge');
    }
  };

  const handleSyncOfflineQueue = async (): Promise<void> => {
    if (outbox.length === 0) return;
    try {
      const res = await syncOfflinePosOrders(SOCIETY_ID, outbox);
      setOutbox([]);
      toast.success(
        `Synced ${res.syncedCount} offline orders (${res.overrunFreezeCount} overrun freezes, ${res.deduplicatedCount} deduped)`,
      );
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Offline sync failed');
    }
  };

  const handleReconcileBatch = async (): Promise<void> => {
    try {
      const batch = await reconcileDailyBatch(SOCIETY_ID, TERMINAL_ID, new Date().toISOString().slice(0, 10));
      toast.success(`ERP Batch ${batch.erpVoucherRef} (${batch.erpStatus})`);
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'EOD batch reconciliation failed');
    }
  };

  const parsedGuests = guestNamesText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const handlePreviewQuote = async (): Promise<void> => {
    try {
      const q = await quoteGuestPasses({
        societyId: SOCIETY_ID,
        facilityCode: 'SWIMMING_POOL',
        flatId: FLAT_ID,
        visitDate,
        guestCount: Math.max(1, parsedGuests.length),
      });
      setQuote(q);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Pricing quote failed');
    }
  };

  const handleIssuePasses = async (): Promise<void> => {
    try {
      const issued = await issueGuestPasses({
        societyId: SOCIETY_ID,
        facilityCode: 'SWIMMING_POOL',
        flatId: FLAT_ID,
        unitCode: UNIT_CODE,
        visitDate,
        guestNames: parsedGuests,
        paymentMode: 'FLAT_TAB',
      });
      setQuote(issued.quote);
      if (issued.passes[0]) {
        setQrInput(issued.passes[0].qrToken);
      }
      toast.success(`Issued ${issued.passes.length} pool guest passes`);
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Pass issuance failed');
    }
  };

  const handleTurnstileScan = async (): Promise<void> => {
    try {
      const res = await validateTurnstileScan({
        societyId: SOCIETY_ID,
        facilityCode: 'SWIMMING_POOL',
        turnstileId: 'POOL-TURNSTILE-1',
        qrToken: qrInput.trim(),
      });
      setScanResult(res);
      if (res.accessGranted) {
        toast.success(res.message);
      } else {
        toast.error(`${res.reasonCode}: ${res.message}`);
      }
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Turnstile scan failed');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
        Clubhouse Café POS, Flat-Tab Settlement &amp; Pool Guest Passes
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Offline-resilient billing for {UNIT_CODE}, 2FA PIN/Push tab holds, EOD ERP Z-Report reconciliation,
        2-free/month guest quotas, and dynamic turnstile QR access.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Café POS & EOD Batch Reconciliation" />
        <Tab label="Pool Guest Quotas & Turnstile QR" />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ display: 'grid', gap: 3 }}>
          <Paper sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
              <Chip label={account?.unitCode ?? UNIT_CODE} color="primary" />
              <Chip
                label={`Available Credit: ${account ? formatRupees(account.availableCreditPaise) : '₹10,000.00'}`}
                color={account?.overdueFrozen ? 'error' : 'success'}
              />
              <Chip label={`Unbilled Tab: ${account ? formatRupees(account.unbilledTabPaise) : '₹0.00'}`} />
              <Chip label={`Active 90s Holds: ${account ? formatRupees(account.activeHoldsPaise) : '₹0.00'}`} />
              <FormControlLabel
                control={<Switch checked={offlineDeadZone} onChange={(e) => setOfflineDeadZone(e.target.checked)} />}
                label="Simulate Basement Wi-Fi Dead Zone"
              />
            </Box>

            {account?.overdueFrozen && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Flat tab is frozen due to overdue dues or offline overrun. Counter staff must collect via UPI/Wallet.
              </Alert>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
              <TextField label="Café Items" value={itemsSummary} onChange={(e) => setItemsSummary(e.target.value)} size="small" />
              <TextField label="Subtotal (₹)" value={subtotalRupees} onChange={(e) => setSubtotalRupees(e.target.value)} size="small" />
              <TextField
                select
                label="Settlement Mode"
                value={settlementMode}
                onChange={(e) => setSettlementMode(e.target.value as SettlementMode)}
                size="small"
              >
                <MenuItem value="FLAT_TAB">Monthly Flat Tab</MenuItem>
                <MenuItem value="WALLET_WITH_TAB_OVERFLOW">Wallet + Tab Overflow</MenuItem>
                <MenuItem value="PREPAID_WALLET">Prepaid Wallet</MenuItem>
              </TextField>
              <TextField
                select
                label="2FA Verification"
                value={authMethod}
                onChange={(e) => setAuthMethod(e.target.value as PosAuthMethod)}
                size="small"
              >
                <MenuItem value="PUSH_CHALLENGE">Resident App Push</MenuItem>
                <MenuItem value="PIN">4-Digit Resident PIN</MenuItem>
              </TextField>
              {authMethod === 'PIN' && (
                <TextField label="4-Digit PIN (demo 4829)" value={pin} onChange={(e) => setPin(e.target.value)} size="small" />
              )}
              <Button variant="contained" onClick={handleChargeOrder}>
                {offlineDeadZone ? 'Queue Offline Ticket' : 'Authorize POS Order'}
              </Button>
            </Box>
          </Paper>

          {outbox.length > 0 && (
            <Paper sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">Offline POS Outbox ({outbox.length} queued)</Typography>
                <Button variant="contained" color="warning" onClick={handleSyncOfflineQueue}>
                  Reconnect &amp; Sync Batch Now
                </Button>
              </Box>
              {outbox.map((item) => (
                <Typography key={item.clientTxUuid} variant="body2">
                  • {item.clientTxUuid}: {item.itemsSummary} — {formatRupees(item.subtotalPaise + item.gstPaise)}
                </Typography>
              ))}
            </Paper>
          )}

          {challenges.length > 0 && (
            <Paper sx={{ p: 2.5 }}>
              <Typography variant="h6" gutterBottom>Pending Resident Push Confirmations (90s TTL)</Typography>
              {challenges.map((ch) => (
                <Box key={ch.challengeId} sx={{ display: 'flex', gap: 2, alignItems: 'center', py: 1 }}>
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {ch.outletName}: {ch.itemsSummary} — <strong>{formatRupees(ch.totalPaise)}</strong>
                  </Typography>
                  <Button size="small" variant="contained" color="success" onClick={() => handleResolveChallenge(ch.challengeId, true)}>
                    Resident Approve
                  </Button>
                  <Button size="small" variant="outlined" color="error" onClick={() => handleResolveChallenge(ch.challengeId, false)}>
                    Decline
                  </Button>
                </Box>
              ))}
            </Paper>
          )}

          <Paper sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Hash-Chained POS Ledger &amp; Daily ERP Z-Report</Typography>
              <Button variant="outlined" onClick={handleReconcileBatch}>
                Close &amp; Reconcile EOD Batch
              </Button>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Order Ref</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Auth / Mode</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Hash Digest</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.orderId}>
                    <TableCell>{o.clientTxUuid}</TableCell>
                    <TableCell>{o.itemsSummary}</TableCell>
                    <TableCell>{formatRupees(o.totalPaise)}</TableCell>
                    <TableCell>{o.authMethod} / {o.settlementMode}</TableCell>
                    <TableCell>
                      <Chip size="small" label={o.offlineOverrun ? 'OVERRUN_FREEZE' : o.status} color={o.offlineOverrun ? 'error' : 'default'} />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{o.hashChainDigest.slice(0, 12)}…</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {batches.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Reconciled ERP Batches</Typography>
                {batches.map((b) => (
                  <Typography key={b.batchId} variant="body2">
                    {b.erpVoucherRef} • {b.orderCount} orders • Gross {formatRupees(b.grossPaise)} • Status: <strong>{b.erpStatus}</strong>
                  </Typography>
                ))}
              </Box>
            )}
          </Paper>
        </Box>
      )}

      {tab === 1 && (
        <Box sx={{ display: 'grid', gap: 3 }}>
          <Paper sx={{ p: 2.5 }}>
            <Typography variant="h6" gutterBottom>Swimming Pool Guest Quotas &amp; Dynamic Pricing</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 2 }}>
              <TextField label="Visit Date" type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} size="small" slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Guest Names (comma-separated)" value={guestNamesText} onChange={(e) => setGuestNamesText(e.target.value)} size="small" />
              <Button variant="outlined" onClick={handlePreviewQuote}>Preview Dynamic Quote</Button>
              <Button variant="contained" onClick={handleIssuePasses}>Issue Guest QR Passes</Button>
            </Box>

            {quote && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>{quote.dayCategory}</strong> pricing ({formatRupees(quote.paidUnitPricePaise)}/paid guest) • Free Remaining: {quote.freeRemainingBefore}/2 • Free Allocated: {quote.freeSlotsAllocated} • Paid Slots: {quote.paidSlotsRequired} • Total Payable: <strong>{formatRupees(quote.totalPayablePaise)}</strong>
              </Alert>
            )}

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Guest</TableCell>
                  <TableCell>Tier</TableCell>
                  <TableCell>Fee</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Signed QR Token</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {passes.map((p) => (
                  <TableRow key={p.passId}>
                    <TableCell>{p.guestName}</TableCell>
                    <TableCell>{p.pricingTier}</TableCell>
                    <TableCell>{formatRupees(p.totalPaise)}</TableCell>
                    <TableCell><Chip size="small" label={p.status} /></TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.qrToken}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => setQrInput(p.qrToken)}>Load in Scanner</Button>
                      {p.status === 'ACTIVE' && (
                        <Button size="small" color="warning" onClick={() => void cancelGuestPass(p.passId).then(loadAll)}>
                          Cancel &amp; Release
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Paper sx={{ p: 2.5 }}>
            <Typography variant="h6" gutterBottom>Pool Turnstile QR Validator (Anti-Passback &amp; Occupancy)</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField fullWidth label="Signed QR Token" value={qrInput} onChange={(e) => setQrInput(e.target.value)} size="small" />
              <Button variant="contained" onClick={handleTurnstileScan}>Scan Turnstile</Button>
            </Box>
            {scanResult && (
              <Alert severity={scanResult.accessGranted ? 'success' : 'error'}>
                <strong>{scanResult.reasonCode}</strong> — {scanResult.message} (Occupancy: {scanResult.poolOccupancy}/{scanResult.poolCapacity})
              </Alert>
            )}
          </Paper>
        </Box>
      )}
    </Container>
  );
}
