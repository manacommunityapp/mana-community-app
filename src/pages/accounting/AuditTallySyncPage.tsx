import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { toast } from 'sonner';
import {
  getTallyOutbox,
  getTallySummary,
  listAuditEntries,
  listTallyConflicts,
  resolveTallyConflict,
  verifyAuditChain,
} from '../../services/accounting/statutoryAccountingService';
import type {
  AuditChainVerification,
  AuditLedgerEntry,
  TallyOutboxItem,
  TallySyncConflict,
  TallySyncSummary,
} from '../../types/accounting';

const SOCIETY_ID = 1;

export function AuditTallySyncPage(): React.ReactElement {
  const [verification, setVerification] = useState<AuditChainVerification | null>(null);
  const [entries, setEntries] = useState<AuditLedgerEntry[]>([]);
  const [summary, setSummary] = useState<TallySyncSummary | null>(null);
  const [outbox, setOutbox] = useState<TallyOutboxItem[]>([]);
  const [conflicts, setConflicts] = useState<TallySyncConflict[]>([]);
  const [xmlPreview, setXmlPreview] = useState<TallyOutboxItem | null>(null);

  const loadAll = useCallback(async (): Promise<void> => {
    try {
      const [ver, ents, sum, ob, conf] = await Promise.all([
        verifyAuditChain(SOCIETY_ID),
        listAuditEntries(SOCIETY_ID),
        getTallySummary(SOCIETY_ID),
        getTallyOutbox(SOCIETY_ID),
        listTallyConflicts(SOCIETY_ID),
      ]);
      setVerification(ver);
      setEntries(ents);
      setSummary(sum);
      setOutbox(ob);
      setConflicts(conf);
    } catch {
      // Backend optional in offline preview
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleResolve = async (conflictId: string, action: 'REVERT_TALLY' | 'ACCEPT_REVERSAL'): Promise<void> => {
    try {
      await resolveTallyConflict(conflictId, SOCIETY_ID, action);
      toast.success(`Conflict resolved via ${action}`);
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resolve conflict');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Immutable Audit Ledger &amp; Tally Sync
          </Typography>
          <Typography variant="body2" color="text.secondary">
            SHA-256 hash-chained vouchers, daily Merkle roots, deterministic Tally GUIDs, and conflict quarantine.
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => void loadAll()}>
          Verify Chain &amp; Refresh
        </Button>
      </Box>

      {verification && (
        <Alert severity={verification.chainValid ? 'success' : 'error'} sx={{ mb: 3 }}>
          <strong>{verification.chainValid ? 'CHAIN VERIFIED' : 'TAMPER ALERT'}</strong> — {verification.message}
          <Typography variant="caption" sx={{ display: 'block', fontFamily: 'monospace', mt: 0.5 }}>
            Merkle Root: {verification.merkleRoot}
          </Typography>
        </Alert>
      )}

      {summary && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">Pending Tally Outbox</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{summary.pendingOutboxCount}</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">Synced Vouchers</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{summary.syncedCount}</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">Quarantined Conflicts</Typography>
            <Typography variant="h5" color={summary.openConflictsCount > 0 ? 'error.main' : 'text.primary'} sx={{ fontWeight: 800 }}>
              {summary.openConflictsCount}
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Open Tally Conflicts */}
      {conflicts.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            Tally Sync Conflicts ({conflicts.length})
          </Typography>
          {conflicts.map((c) => (
            <Box
              key={c.conflictId}
              sx={{
                p: 2,
                mb: 1.5,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'error.light',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  GUID: {c.tallyGuid}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Cloud Hash mismatch vs offline Tally edit
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="outlined" onClick={() => void handleResolve(c.conflictId, 'REVERT_TALLY')}>
                  Revert Tally to Cloud
                </Button>
                <Button size="small" variant="contained" color="warning" onClick={() => void handleResolve(c.conflictId, 'ACCEPT_REVERSAL')}>
                  Post Cloud Reversal
                </Button>
              </Box>
            </Box>
          ))}
        </Paper>
      )}

      {/* Tally Outbox */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          Tally XML Outbox ({outbox.length})
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Voucher #</TableCell>
              <TableCell>Deterministic GUID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">XML</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {outbox.map((item) => (
              <TableRow key={item.voucherId}>
                <TableCell>{item.voucherNumber}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{item.tallyGuid}</TableCell>
                <TableCell><Chip label={item.syncStatus} size="small" color="warning" /></TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => setXmlPreview(item)}>
                    View XML
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Immutable Audit Chain Table */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          Append-Only Hash Chain ({entries.length})
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Seq</TableCell>
              <TableCell>Voucher #</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Prev Hash</TableCell>
              <TableCell>Entry Hash</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((e) => (
              <TableRow key={e.entryId}>
                <TableCell>{e.seqNo}</TableCell>
                <TableCell>{e.voucherNumber}</TableCell>
                <TableCell><Chip label={e.sourceSystem} size="small" /></TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {e.prevEntryHash.slice(0, 14)}…
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {e.entryHash.slice(0, 14)}…
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={xmlPreview !== null} onClose={() => setXmlPreview(null)} maxWidth="md" fullWidth>
        <DialogTitle>Tally XML — {xmlPreview?.voucherNumber}</DialogTitle>
        <DialogContent>
          <Box
            component="pre"
            sx={{
              bgcolor: '#111827',
              color: '#E5E7EB',
              p: 2,
              borderRadius: 1,
              overflowX: 'auto',
              fontSize: '0.75rem',
            }}
          >
            {xmlPreview?.tallyXml}
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
}

export default AuditTallySyncPage;
