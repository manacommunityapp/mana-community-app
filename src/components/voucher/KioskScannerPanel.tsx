import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import type {
  KioskScanResult,
  LocalRedemptionRecord,
} from '../../types/voucher';
import {
  parseQrString,
  isVoucherExpired,
} from '../../utils/voucherQrUtils';
import { verifyTotp } from '../../utils/totpUtils';
import {
  applySyncResult,
  getCachedCampaignTotpSecret,
  isRedeemedLocally,
  loadLocalRedemptions,
  saveLocalRedemption,
  verifyQrOnline,
  syncRedemptions,
} from '../../services/adtech/voucherService';

interface KioskScannerPanelProps {
  kioskId: string;
  isOnline: boolean;
}

/**
 * Offline QR verification.
 * Validates format, expiry, pre-loaded TOTP secret (when provisioned on the kiosk),
 * and local double-redemption state.
 */
async function verifyOffline(
  qrString: string,
  kioskId: string
): Promise<KioskScanResult> {
  const parsed = parseQrString(qrString);
  if (!parsed || !parsed.payload.vid || !parsed.payload.uid) {
    return {
      status: 'REJECTED_SIGNATURE',
      message: 'Invalid QR format',
    };
  }

  if (isVoucherExpired(parsed.payload)) {
    return {
      status: 'REJECTED_EXPIRED',
      vid: parsed.payload.vid,
      message: 'Voucher has expired',
    };
  }

  const campaignTotpSecret = getCachedCampaignTotpSecret(parsed.payload.cid);
  if (campaignTotpSecret) {
    const otpValid = await verifyTotp(campaignTotpSecret, parsed.totpCode);
    if (!otpValid) {
      return {
        status: 'REJECTED_OTP_MISMATCH',
        vid: parsed.payload.vid,
        message: 'OTP mismatch — possible screenshot or expired QR frame',
      };
    }
  }

  const existing = isRedeemedLocally(parsed.payload.vid);
  if (existing) {
    return {
      status: 'REJECTED_ALREADY_REDEEMED',
      vid: parsed.payload.vid,
      message: `Already redeemed at ${new Date(existing.redeemedAt).toLocaleTimeString()}`,
    };
  }

  saveLocalRedemption({
    vid: parsed.payload.vid,
    uid: parsed.payload.uid,
    redeemedAt: Date.now(),
    kioskId,
    synced: false,
    conflicted: false,
  });

  return {
    status: 'ACCEPTED',
    vid: parsed.payload.vid,
    uid: parsed.payload.uid,
    kioskId,
    message: 'Sample dispensed ✓',
  };
}

export function KioskScannerPanel({
  kioskId,
  isOnline,
}: KioskScannerPanelProps): React.ReactElement {
  const [scanInput, setScanInput] = useState<string>('');
  const [scanResult, setScanResult] = useState<KioskScanResult | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [localRedemptions, setLocalRedemptions] = useState<LocalRedemptionRecord[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  const refreshRedemptions = useCallback((): void => {
    const all = loadLocalRedemptions();
    setLocalRedemptions(all.slice(-10).reverse());
    setPendingSyncCount(all.filter((r) => !r.synced).length);
  }, []);

  const runSync = useCallback(async (): Promise<void> => {
    const pending = loadLocalRedemptions().filter((r) => !r.synced);
    if (pending.length === 0) return;

    setIsSyncing(true);
    try {
      const result = await syncRedemptions({
        kioskId,
        records: pending,
        syncedAt: new Date().toISOString(),
      });
      applySyncResult(result);
      refreshRedemptions();
    } catch {
      // Keep pending in local store for next reconnect
    } finally {
      setIsSyncing(false);
    }
  }, [kioskId, refreshRedemptions]);

  // Auto-sync on mount and whenever connectivity returns
  useEffect(() => {
    refreshRedemptions();
    if (isOnline) {
      void runSync();
    }
  }, [isOnline, refreshRedemptions, runSync]);

  const handleVerify = useCallback(async (): Promise<void> => {
    const trimmed = scanInput.trim();
    if (!trimmed) return;
    setIsScanning(true);
    setScanResult(null);

    try {
      let result: KioskScanResult;
      if (isOnline) {
        try {
          result = await verifyQrOnline(trimmed, kioskId);
          if (result.status === 'ACCEPTED' && result.vid && result.uid) {
            saveLocalRedemption({
              vid: result.vid,
              uid: result.uid,
              redeemedAt: Date.now(),
              kioskId,
              synced: true,
              conflicted: false,
            });
          }
        } catch {
          // Graceful fallback to offline verification if network call fails
          result = await verifyOffline(trimmed, kioskId);
        }
      } else {
        result = await verifyOffline(trimmed, kioskId);
      }
      setScanResult(result);
      if (result.status === 'ACCEPTED') {
        setScanInput('');
      }
      refreshRedemptions();
    } catch (err) {
      setScanResult({
        status: 'REJECTED_SIGNATURE',
        message: err instanceof Error ? err.message : 'Verification failed',
      });
    } finally {
      setIsScanning(false);
    }
  }, [scanInput, isOnline, kioskId, refreshRedemptions]);

  const isAccepted = scanResult?.status === 'ACCEPTED';

  return (
    <Box sx={{ width: '100%', maxWidth: 720, mx: 'auto', p: 2 }}>
      {/* Status bar */}
      <Alert
        severity={isOnline ? 'success' : 'warning'}
        sx={{ mb: 2, fontWeight: 600 }}
        icon={false}
        action={
          isOnline && pendingSyncCount > 0 ? (
            <Button
              color="inherit"
              size="small"
              onClick={() => void runSync()}
              disabled={isSyncing}
            >
              {isSyncing ? 'Syncing…' : `Sync (${pendingSyncCount})`}
            </Button>
          ) : undefined
        }
      >
        {isOnline
          ? pendingSyncCount > 0
            ? `🟢 Online — ${pendingSyncCount} pending sync`
            : '🟢 Online — Synced'
          : `🔴 Offline — ${pendingSyncCount} pending sync`}
      </Alert>

      {/* QR input */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          Scan QR Code
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Paste or type the QR string below (simulates camera scan on web)
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          value={scanInput}
          onChange={(e) => setScanInput(e.target.value)}
          placeholder="MANA:v1:..."
          variant="outlined"
          size="small"
          sx={{ mb: 1.5, fontFamily: 'monospace' }}
        />
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => void handleVerify()}
          disabled={isScanning || !scanInput.trim()}
          startIcon={isScanning ? <CircularProgress size={18} color="inherit" /> : undefined}
          fullWidth
        >
          {isScanning ? 'Verifying…' : 'Verify QR'}
        </Button>
      </Paper>

      {/* Result panel */}
      {scanResult && (
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 2,
            bgcolor: isAccepted ? 'success.light' : 'error.light',
            textAlign: 'center',
          }}
        >
          <Typography variant="h2" sx={{ mb: 1 }}>
            {isAccepted ? '✅' : '❌'}
          </Typography>
          <Typography
            variant="h5"
            color={isAccepted ? 'success.dark' : 'error.dark'}
            gutterBottom
            sx={{ fontWeight: 800 }}
          >
            {isAccepted ? 'ACCEPTED' : scanResult.status}
          </Typography>
          <Typography variant="body1" color="text.primary">
            {scanResult.message}
          </Typography>
          {scanResult.vid && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              VID: {scanResult.vid}
            </Typography>
          )}
        </Paper>
      )}

      {/* Recent redemptions table */}
      <Paper elevation={1} sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          Recent Redemptions
        </Typography>
        {localRedemptions.length === 0 ? (
          <Typography variant="caption" color="text.secondary">
            No redemptions recorded yet.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>VID</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {localRedemptions.map((r) => (
                <TableRow key={`${r.vid}-${r.redeemedAt}`}>
                  <TableCell>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {r.vid.slice(0, 12)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(r.redeemedAt).toLocaleTimeString()}
                  </TableCell>
                  <TableCell>
                    {r.conflicted ? (
                      <Chip label="Conflict" color="error" size="small" />
                    ) : r.synced ? (
                      <Chip label="Synced" color="success" size="small" />
                    ) : (
                      <Chip label="Pending" color="warning" size="small" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
}

export default KioskScannerPanel;
