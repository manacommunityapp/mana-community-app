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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { toast } from 'sonner';
import {
  calculateMaintenanceGst,
  calculateVendorTds,
  listTaxRules,
  publishTaxRule,
  recalculateMidFy,
} from '../../services/accounting/statutoryAccountingService';
import type {
  MaintenanceGstResult,
  RecalculationBatch,
  TaxRuleVersion,
  VendorTdsResult,
} from '../../types/accounting';

const SOCIETY_ID = 1;
const FY_CODE = '2026-27';

function formatInrFromPaise(paise: number): string {
  return (paise / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  });
}

export function StatutoryTaxEnginePage(): React.ReactElement {
  const [tab, setTab] = useState(0);

  // GST calculator state
  const [maintAmountRupees, setMaintAmountRupees] = useState('8500');
  const [pureAgentRupees, setPureAgentRupees] = useState('1800');
  const [gstRegistered, setGstRegistered] = useState(true);
  const [gstResult, setGstResult] = useState<MaintenanceGstResult | null>(null);

  // TDS calculator state
  const [vendorPan, setVendorPan] = useState('ABCPD1234F');
  const [panStatus, setPanStatus] = useState<'VALID' | 'INOPERATIVE'>('VALID');
  const [tdsSection, setTdsSection] = useState('194C');
  const [billRupees, setBillRupees] = useState('45000');
  const [tdsResult, setTdsResult] = useState<VendorTdsResult | null>(null);

  // Rule versions & mid-FY recalculation
  const [rules, setRules] = useState<TaxRuleVersion[]>([]);
  const [newThresholdRupees, setNewThresholdRupees] = useState('10000');
  const [effectiveFrom, setEffectiveFrom] = useState('2026-10-01');
  const [recalcBatch, setRecalcBatch] = useState<RecalculationBatch | null>(null);

  const loadRules = useCallback(async (): Promise<void> => {
    try {
      const data = await listTaxRules();
      setRules(data);
    } catch {
      // Backend optional in offline preview
    }
  }, []);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  const handleComputeGst = async (): Promise<void> => {
    try {
      const maintPaise = Math.round(Number(maintAmountRupees || '0') * 100);
      const elecPaise = Math.round(Number(pureAgentRupees || '0') * 100);
      const res = await calculateMaintenanceGst({
        societyId: SOCIETY_ID,
        fyCode: FY_CODE,
        supplyDate: '2026-11-01',
        flatNumber: 'A-402',
        voucherNumber: `MNT/${FY_CODE}/PREVIEW`,
        societyGstRegistered: gstRegistered,
        societyTurnoverPaise: 300_000_000,
        lines: [
          { code: 'MAINT', label: 'Monthly Maintenance', amountPaise: maintPaise, pureAgentPassThrough: false },
          ...(elecPaise > 0
            ? [{ code: 'ELEC', label: 'Electricity Pass-through', amountPaise: elecPaise, pureAgentPassThrough: true }]
            : []),
        ],
        persistSnapshot: true,
      });
      setGstResult(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to evaluate GST rule');
    }
  };

  const handleComputeTds = async (): Promise<void> => {
    try {
      const grossPaise = Math.round(Number(billRupees || '0') * 100);
      const res = await calculateVendorTds({
        societyId: SOCIETY_ID,
        fyCode: FY_CODE,
        creditOrPaymentDate: '2026-11-15',
        voucherNumber: `PUR/${FY_CODE}/PREVIEW`,
        vendorPan,
        panStatusOverride: panStatus,
        tdsSection,
        grossAmountPaise: grossPaise,
        persistSnapshot: false,
      });
      setTdsResult(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to compute TDS');
    }
  };

  const handlePublishRule = async (): Promise<void> => {
    try {
      const thresholdPaise = Math.round(Number(newThresholdRupees || '7500') * 100);
      const created = await publishTaxRule({
        ruleFamily: 'GST_MAINTENANCE',
        fyCode: FY_CODE,
        effectiveFrom,
        gazetteRef: 'CBIC Circular Amendment (Demo)',
        ruleSpec: {
          perUnitMonthlyThresholdPaise: thresholdPaise,
          gstRateBps: 1800,
          turnoverThresholdPaise: 200_000_000,
        },
      });
      toast.success(`Published rule v${created.versionNo}`);
      await loadRules();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish rule version');
    }
  };

  const handleRecalculate = async (ruleVersionId: string): Promise<void> => {
    try {
      const batch = await recalculateMidFy({
        societyId: SOCIETY_ID,
        fyCode: FY_CODE,
        ruleFamily: 'GST_MAINTENANCE',
        targetRuleVersionId: ruleVersionId,
        fromDate: '2026-04-01',
        toDate: '2026-11-28',
      });
      setRecalcBatch(batch);
      toast.success(`Evaluated ${batch.evaluatedCount} snapshots, generated ${batch.adjustedCount} adjustment notes`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Recalculation failed');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Statutory GST &amp; TDS Rule Engine
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Bi-temporal Indian RWA tax engine: ₹7,500 GST cliff, PAN-aware TDS (194C/194J/206AA), and mid-FY delta adjustments.
      </Typography>

      <Tabs value={tab} onChange={(_e, v: number) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Maintenance GST (₹7,500 Cliff)" />
        <Tab label="Vendor TDS & PAN Validator" />
        <Tab label="Rule Versions & Mid-FY Recalc" />
      </Tabs>

      {tab === 0 && (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
            <TextField
              label="Monthly Maintenance Base (₹)"
              value={maintAmountRupees}
              onChange={(e) => setMaintAmountRupees(e.target.value)}
              type="number"
              size="small"
            />
            <TextField
              label="Pure-Agent Utility Pass-through (₹)"
              value={pureAgentRupees}
              onChange={(e) => setPureAgentRupees(e.target.value)}
              type="number"
              size="small"
            />
          </Box>
          <FormControlLabel
            control={<Switch checked={gstRegistered} onChange={(e) => setGstRegistered(e.target.checked)} />}
            label="Society GST Registered (Turnover > ₹20L)"
            sx={{ mb: 2, display: 'block' }}
          />
          <Button variant="contained" onClick={() => void handleComputeGst()}>
            Calculate &amp; Snapshot GST
          </Button>

          {gstResult && (
            <Box sx={{ mt: 3 }}>
              <Alert severity={gstResult.gstApplicable ? 'warning' : 'success'} sx={{ mb: 2 }}>
                {gstResult.reason}
              </Alert>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Taxable Base</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {formatInrFromPaise(gstResult.maintenanceBasePaise)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">CGST (9%)</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {formatInrFromPaise(gstResult.cgstPaise)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">SGST (9%)</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {formatInrFromPaise(gstResult.sgstPaise)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Grand Total</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {formatInrFromPaise(gstResult.grandTotalPaise)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {tab === 1 && (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
            <TextField
              label="Vendor PAN"
              value={vendorPan}
              onChange={(e) => setVendorPan(e.target.value.toUpperCase())}
              size="small"
            />
            <TextField
              select
              label="PAN Registry Status"
              value={panStatus}
              onChange={(e) => setPanStatus(e.target.value as 'VALID' | 'INOPERATIVE')}
              size="small"
            >
              <MenuItem value="VALID">VALID</MenuItem>
              <MenuItem value="INOPERATIVE">INOPERATIVE (206AA → 20%)</MenuItem>
            </TextField>
            <TextField
              select
              label="TDS Section"
              value={tdsSection}
              onChange={(e) => setTdsSection(e.target.value)}
              size="small"
            >
              <MenuItem value="194C">194C (Contractor 1%/2%)</MenuItem>
              <MenuItem value="194J_TECH">194J(a) (Technical 2%)</MenuItem>
              <MenuItem value="194J_PROF">194J(b) (Professional 10%)</MenuItem>
              <MenuItem value="194I_EQUIP">194I(a) (Equipment Rent 2%)</MenuItem>
              <MenuItem value="194I_LAND">194I(b) (Premises Rent 10%)</MenuItem>
            </TextField>
            <TextField
              label="Gross Payout (₹)"
              value={billRupees}
              onChange={(e) => setBillRupees(e.target.value)}
              type="number"
              size="small"
            />
          </Box>
          <Button variant="contained" onClick={() => void handleComputeTds()}>
            Evaluate PAN &amp; TDS
          </Button>

          {tdsResult && (
            <Box sx={{ mt: 3 }}>
              <Alert
                severity={tdsResult.panValidation.penal206aaTriggered ? 'error' : 'info'}
                sx={{ mb: 2 }}
              >
                {tdsResult.reason} · Entity: {tdsResult.panValidation.entityCategory} (4th char &apos;
                {tdsResult.panValidation.entityTypeChar}&apos;)
              </Alert>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Applied Rate</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {(tdsResult.appliedRateBps / 100).toFixed(2)}%
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">TDS Deducted</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {formatInrFromPaise(tdsResult.tdsDeductedPaise)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Net Vendor Payout</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {formatInrFromPaise(tdsResult.netPayablePaise)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {tab === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Publish New Effective-Dated GST Rule Version
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                label="Per-Flat Monthly Cliff (₹)"
                value={newThresholdRupees}
                onChange={(e) => setNewThresholdRupees(e.target.value)}
                type="number"
                size="small"
              />
              <TextField
                label="Effective From (YYYY-MM-DD)"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                size="small"
              />
              <Button variant="contained" onClick={() => void handlePublishRule()}>
                Publish Rule Version
              </Button>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Rule Versions ({rules.length})
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Family</TableCell>
                  <TableCell>FY</TableCell>
                  <TableCell>Ver</TableCell>
                  <TableCell>Effective Window</TableCell>
                  <TableCell align="right">Mid-FY Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rules.map((r) => (
                  <TableRow key={r.ruleVersionId}>
                    <TableCell>{r.ruleFamily}</TableCell>
                    <TableCell>{r.fyCode}</TableCell>
                    <TableCell>
                      <Chip label={`v${r.versionNo}`} size="small" color="primary" />
                    </TableCell>
                    <TableCell>
                      {r.effectiveFrom} → {r.effectiveTo ?? 'Active'}
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" onClick={() => void handleRecalculate(r.ruleVersionId)}>
                        Run Mid-FY Recalc
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          {recalcBatch && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Recalculation Delta Notes ({recalcBatch.adjustedCount} adjusted)
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Note #</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Original Voucher</TableCell>
                    <TableCell align="right">Tax Delta</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recalcBatch.notes.map((n) => (
                    <TableRow key={n.noteId}>
                      <TableCell>{n.noteNumber}</TableCell>
                      <TableCell>
                        <Chip
                          label={n.noteType}
                          size="small"
                          color={n.noteType === 'CREDIT_NOTE' ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>{n.originalVoucherId.slice(0, 12)}…</TableCell>
                      <TableCell align="right">{formatInrFromPaise(n.deltaPaise)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </Box>
      )}
    </Container>
  );
}

export default StatutoryTaxEnginePage;
