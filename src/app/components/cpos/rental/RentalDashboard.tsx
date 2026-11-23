import React, { useState } from 'react';
import {
  Box, Grid, Paper, Typography, Chip, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Alert, Divider,
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BuildIcon from '@mui/icons-material/Build';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import BusinessIcon from '@mui/icons-material/Business';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AssessmentIcon from '@mui/icons-material/Assessment';
import {
  automationService,
  type CommercialTenantKycAuditResponse,
  type LeaseRentEscalationResponse,
  type CommercialFitoutAuditResponse,
  type TenantChurnRenewalResponse,
} from '../../../../services/automation/automationService';

interface CommercialLeaseItem {
  id: string;
  tenantName: string;
  tradeName: string;
  category: string;
  unit: string;
  areaSqFt: number;
  monthlyRent: number;
  escalationPct: number;
  expiryDate: string;
  pan: string;
  gstin: string;
  status: 'ACTIVE' | 'UPCOMING_EXPIRY' | 'FITOUT_PENDING';
}

const SAMPLE_LEASES: CommercialLeaseItem[] = [
  {
    id: 'CPOS-TEN-001',
    tenantName: 'Blue Tokai Coffee Roasters Pvt Ltd',
    tradeName: 'Blue Tokai Coffee',
    category: 'Retail & Café',
    unit: 'C-101 (Ground Floor)',
    areaSqFt: 1450,
    monthlyRent: 125000,
    escalationPct: 5.0,
    expiryDate: '2026-12-31',
    pan: 'AABCB1234D',
    gstin: '29AABCB1234D1Z5',
    status: 'ACTIVE',
  },
  {
    id: 'CPOS-TEN-002',
    tenantName: 'Apollo Health & Lifestyle Ltd',
    tradeName: 'Apollo 24|7 Pharmacy & Clinic',
    category: 'Healthcare & Retail',
    unit: 'C-102 (Ground Floor)',
    areaSqFt: 980,
    monthlyRent: 95000,
    escalationPct: 4.5,
    expiryDate: '2027-05-15',
    pan: 'AABCA9876K',
    gstin: '29AABCA9876K1Z2',
    status: 'ACTIVE',
  },
  {
    id: 'CPOS-TEN-003',
    tenantName: 'NexGen Co-Working Solutions LLP',
    tradeName: 'NexGen Workspace',
    category: 'Commercial Office',
    unit: 'C-201 (Second Floor)',
    areaSqFt: 5200,
    monthlyRent: 420000,
    escalationPct: 6.0,
    expiryDate: '2028-03-31',
    pan: 'AAACN4567L',
    gstin: '29AAACN4567L1Z9',
    status: 'ACTIVE',
  },
  {
    id: 'CPOS-TEN-004',
    tenantName: 'Urban Fitness & Wellness Collective',
    tradeName: 'Cult Collective Gym',
    category: 'Fitness & Sports',
    unit: 'C-301 (Third Floor)',
    areaSqFt: 3100,
    monthlyRent: 210000,
    escalationPct: 5.0,
    expiryDate: '2026-11-30',
    pan: 'AABCU3321M',
    gstin: '29AABCU3321M1Z1',
    status: 'UPCOMING_EXPIRY',
  },
];

const RentalDashboard: React.FC = () => {
  // Modal states
  const [selectedLease, setSelectedLease] = useState<CommercialLeaseItem>(SAMPLE_LEASES[0]);

  // 1. Tenant KYC Audit State
  const [kycLoading, setKycLoading] = useState(false);
  const [kycResult, setKycResult] = useState<CommercialTenantKycAuditResponse | null>(null);
  const [kycOpen, setKycOpen] = useState(false);

  // 2. Lease Escalation & GST State
  const [escalationLoading, setEscalationLoading] = useState(false);
  const [escalationResult, setEscalationResult] = useState<LeaseRentEscalationResponse | null>(null);
  const [escalationOpen, setEscalationOpen] = useState(false);

  // 3. Commercial Fitout State
  const [fitoutLoading, setFitoutLoading] = useState(false);
  const [fitoutResult, setFitoutResult] = useState<CommercialFitoutAuditResponse | null>(null);
  const [fitoutOpen, setFitoutOpen] = useState(false);

  // 4. Tenant Churn & Renewal State
  const [churnLoading, setChurnLoading] = useState(false);
  const [churnResult, setChurnResult] = useState<TenantChurnRenewalResponse | null>(null);
  const [churnOpen, setChurnOpen] = useState(false);

  // KYC Trigger
  const handleTriggerKyc = async (lease: CommercialLeaseItem) => {
    setSelectedLease(lease);
    setKycLoading(true);
    setKycOpen(true);
    try {
      const res = await automationService.screenCommercialTenantKyc({
        tenantName: lease.tenantName,
        tradeName: lease.tradeName,
        pan: lease.pan,
        gstin: lease.gstin,
        cin: 'U74999KA2015PTC082341',
        authorizedSignatory: 'Sandeep Varma',
        businessNature: lease.category,
        requestedUnitId: lease.unit,
        proposedMonthlyRent: lease.monthlyRent,
      });
      setKycResult(res);
    } catch (err) {
      console.error('KYC Audit failed:', err);
    } finally {
      setKycLoading(false);
    }
  };

  // Rent Escalation Trigger
  const handleTriggerEscalation = async (lease: CommercialLeaseItem) => {
    setSelectedLease(lease);
    setEscalationLoading(true);
    setEscalationOpen(true);
    try {
      const res = await automationService.calculateLeaseRentEscalation({
        leaseId: lease.id,
        tenantName: lease.tenantName,
        unitNumber: lease.unit,
        currentBaseRent: lease.monthlyRent,
        escalationRatePercent: lease.escalationPct,
        effectiveDate: '2027-01-01',
        leaseTermYears: 3,
        camChargesPerSqFt: 15,
        unitAreaSqFt: lease.areaSqFt,
        gstRatePercent: 18,
      });
      setEscalationResult(res);
    } catch (err) {
      console.error('Rent Escalation calculation failed:', err);
    } finally {
      setEscalationLoading(false);
    }
  };

  // Fitout Inspector Trigger
  const handleTriggerFitout = async (lease: CommercialLeaseItem) => {
    setSelectedLease(lease);
    setFitoutLoading(true);
    setFitoutOpen(true);
    try {
      const res = await automationService.inspectCommercialFitout({
        unitId: lease.unit,
        tenantName: lease.tenantName,
        fitoutStage: 'ELECTRICAL_AND_HVAC',
        checklistItems: [
          { item: 'Structural load test for commercial kitchen/machinery', status: 'PASS' },
          { item: 'Fire sprinkler heads clearance and smoke detector matrix', status: 'PASS' },
          { item: 'Dedicated 3-phase commercial electrical submeter installed', status: 'PASS' },
          { item: 'Grease trap and plumbing drainage slope verification', status: 'PASS' },
          { item: 'Acoustic insulation compliant with community noise threshold', status: 'PASS' },
        ],
      });
      setFitoutResult(res);
    } catch (err) {
      console.error('Fitout inspection failed:', err);
    } finally {
      setFitoutLoading(false);
    }
  };

  // Churn & Renewal Trigger
  const handleTriggerChurn = async (lease: CommercialLeaseItem) => {
    setSelectedLease(lease);
    setChurnLoading(true);
    setChurnOpen(true);
    try {
      const res = await automationService.predictTenantChurnRenewal({
        leaseId: lease.id,
        tenantName: lease.tenantName,
        unitId: lease.unit,
        leaseExpiryDate: lease.expiryDate,
        paymentDelayHistoryDays: lease.status === 'UPCOMING_EXPIRY' ? 12 : 2,
        maintenanceTicketCount: lease.status === 'UPCOMING_EXPIRY' ? 5 : 1,
        footfallDropPercent: lease.status === 'UPCOMING_EXPIRY' ? 8 : 0,
        currentRent: lease.monthlyRent,
      });
      setChurnResult(res);
    } catch (err) {
      console.error('Tenant churn prediction failed:', err);
    } finally {
      setChurnLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachMoneyIcon sx={{ color: '#10B981' }} /> Commercial Tenancy & Lease CRM
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Automated commercial tenant screening, escalation schedules, fitout audits, and AI churn predictors
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => handleTriggerKyc(SAMPLE_LEASES[0])}
            startIcon={<VerifiedUserIcon sx={{ color: '#4F6AF5' }} />}
            sx={{ borderColor: 'rgba(79,106,245,0.4)', color: '#fff', textTransform: 'none' }}
          >
            AI KYC Screener
          </Button>
          <Button
            variant="outlined"
            onClick={() => handleTriggerEscalation(SAMPLE_LEASES[0])}
            startIcon={<TrendingUpIcon sx={{ color: '#10B981' }} />}
            sx={{ borderColor: 'rgba(16,185,129,0.4)', color: '#fff', textTransform: 'none' }}
          >
            AI Escalation & GST
          </Button>
          <Button
            variant="outlined"
            onClick={() => handleTriggerFitout(SAMPLE_LEASES[0])}
            startIcon={<BuildIcon sx={{ color: '#F59E0B' }} />}
            sx={{ borderColor: 'rgba(245,158,11,0.4)', color: '#fff', textTransform: 'none' }}
          >
            AI Fitout Inspector
          </Button>
          <Button
            variant="outlined"
            onClick={() => handleTriggerChurn(SAMPLE_LEASES[3])}
            startIcon={<AutorenewIcon sx={{ color: '#EC4899' }} />}
            sx={{ borderColor: 'rgba(236,72,153,0.4)', color: '#fff', textTransform: 'none' }}
          >
            AI Churn & Renewal
          </Button>
        </Box>
      </Box>

      {/* KPI Stats */}
      <Grid container spacing={2.5}>
        {[
          { label: 'Active Leases', val: '1,180', color: '#4F6AF5' },
          { label: 'Monthly Rent Collected', val: '₹1.84 Cr', color: '#10B981' },
          { label: 'Collection Rate', val: '96.2%', color: '#06B6D4' },
          { label: 'Leases Expiring (30 days)', val: '18', color: '#F59E0B' },
        ].map((s, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
            <Paper sx={{ p: 2.5, borderRadius: '16px', borderTop: `4px solid ${s.color}`, bgcolor: 'rgba(255,255,255,0.03)' }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</Typography>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800, mt: 0.5 }}>{s.val}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Commercial Tenancies Directory */}
      <Paper sx={{ p: 3, borderRadius: '20px', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <StorefrontIcon sx={{ color: '#06B6D4' }} /> Commercial Tenancies & Retailers
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Integrated with n8n AI workflows for statutory KYC, CAM/GST calculations, and unit fitout approvals
            </Typography>
          </Box>
          <Chip label="4 Active Leases" size="small" sx={{ bgcolor: 'rgba(79,106,245,0.15)', color: '#4F6AF5', fontWeight: 700 }} />
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { color: 'rgba(255,255,255,0.6)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.1)' } }}>
                <TableCell>Tenant & Brand</TableCell>
                <TableCell>Unit & Area</TableCell>
                <TableCell>Monthly Base</TableCell>
                <TableCell>Escalation</TableCell>
                <TableCell>Lease Expiry</TableCell>
                <TableCell align="right">AI CRM Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {SAMPLE_LEASES.map((lease) => (
                <TableRow key={lease.id} sx={{ '& td': { color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' } }}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>{lease.tradeName}</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{lease.tenantName}</Typography>
                    <Chip label={lease.category} size="small" sx={{ fontSize: '0.65rem', height: 18, mt: 0.5, bgcolor: 'rgba(255,255,255,0.06)' }} />
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.85rem' }}>{lease.unit}</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{lease.areaSqFt.toLocaleString('en-IN')} sq.ft</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, color: '#10B981' }}>
                      ₹{lease.monthlyRent.toLocaleString('en-IN')}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>+ 18% GST</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={`+${lease.escalationPct}% / yr`} size="small" sx={{ bgcolor: 'rgba(16,185,129,0.15)', color: '#10B981', fontWeight: 700, fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.85rem' }}>{lease.expiryDate}</Typography>
                    {lease.status === 'UPCOMING_EXPIRY' && (
                      <Chip label="Expiring Soon" size="small" sx={{ bgcolor: 'rgba(245,158,11,0.2)', color: '#F59E0B', fontSize: '0.65rem', height: 18 }} />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleTriggerKyc(lease)}
                        sx={{ fontSize: '0.7rem', py: 0.25, px: 1, borderColor: 'rgba(79,106,245,0.4)', color: '#818CF8', textTransform: 'none' }}
                      >
                        KYC
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleTriggerEscalation(lease)}
                        sx={{ fontSize: '0.7rem', py: 0.25, px: 1, borderColor: 'rgba(16,185,129,0.4)', color: '#34D399', textTransform: 'none' }}
                      >
                        Escalation
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleTriggerFitout(lease)}
                        sx={{ fontSize: '0.7rem', py: 0.25, px: 1, borderColor: 'rgba(245,158,11,0.4)', color: '#FBBF24', textTransform: 'none' }}
                      >
                        Fitout
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleTriggerChurn(lease)}
                        sx={{ fontSize: '0.7rem', py: 0.25, px: 1, borderColor: 'rgba(236,72,153,0.4)', color: '#F472B6', textTransform: 'none' }}
                      >
                        Renewal
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ── 1. AI Tenant KYC Audit Dialog ────────────────────────────── */}
      <Dialog open={kycOpen} onClose={() => setKycOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VerifiedUserIcon sx={{ color: '#4F6AF5' }} />
          AI Commercial Tenant KYC Screener
        </DialogTitle>
        <DialogContent dividers>
          {kycLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={36} />
            </Box>
          ) : kycResult ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{selectedLease.tradeName}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>GSTIN: {selectedLease.gstin}</Typography>
                </Box>
                <Chip
                  label={kycResult.verificationStatus}
                  color={kycResult.verificationStatus === 'VERIFIED' ? 'success' : 'warning'}
                  sx={{ fontWeight: 800 }}
                />
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Corporate Risk Score</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#10B981' }}>{kycResult.riskScore} / 100</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Security Deposit Policy</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{kycResult.recommendedSecurityDepositMonths} Months</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Chip icon={<CheckCircleIcon />} label={`GSTIN: ${kycResult.gstinStatus}`} size="small" color="success" variant="outlined" />
                <Chip icon={<CheckCircleIcon />} label={`CIN: ${kycResult.cinStatus}`} size="small" color="success" variant="outlined" />
                <Chip label={`Litigation: ${kycResult.litigationFlags?.length === 0 ? 'Clear' : 'Pending'}`} size="small" variant="outlined" />
              </Box>

              {kycResult.recommendations && kycResult.recommendations.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                    Lease Risk Governance Directives
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, m: 0.5, fontSize: '0.85rem' }}>
                    {kycResult.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Alert severity="info">No audit data available</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setKycOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── 2. AI Rent Escalation & GST Dialog ────────────────────────── */}
      <Dialog open={escalationOpen} onClose={() => setEscalationOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUpIcon sx={{ color: '#10B981' }} />
          AI Lease Rent Escalation & GST Schedule
        </DialogTitle>
        <DialogContent dividers>
          {escalationLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={36} />
            </Box>
          ) : escalationResult ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{selectedLease.tradeName}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Unit {selectedLease.unit} ({selectedLease.areaSqFt} sq.ft)</Typography>
                </Box>
                <Chip label={`+${selectedLease.escalationPct}% Escalation`} color="success" sx={{ fontWeight: 700 }} />
              </Box>

              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">New Escalated Base Rent</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>₹{escalationResult.newBaseRent?.toLocaleString('en-IN')}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">CAM Charges (₹15/sq.ft)</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>₹{escalationResult.camChargesTotal?.toLocaleString('en-IN')}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">GST (18% CGST + SGST)</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#F59E0B' }}>₹{escalationResult.gstAmount?.toLocaleString('en-IN')}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Total Monthly Payable</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#10B981' }}>₹{escalationResult.totalMonthlyPayable?.toLocaleString('en-IN')}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {escalationResult.annualSchedule && escalationResult.annualSchedule.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                    Multi-Year Forward Escalation Schedule
                  </Typography>
                  <Table size="small" sx={{ mt: 1 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Year</TableCell>
                        <TableCell>Base Rent</TableCell>
                        <TableCell>CAM</TableCell>
                        <TableCell>Monthly Total (incl GST)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {escalationResult.annualSchedule.map((s) => (
                        <TableRow key={s.year}>
                          <TableCell sx={{ fontWeight: 700 }}>Year {s.year}</TableCell>
                          <TableCell>₹{s.baseRent?.toLocaleString('en-IN')}</TableCell>
                          <TableCell>₹{s.cam?.toLocaleString('en-IN')}</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: '#10B981' }}>₹{s.totalMonthly?.toLocaleString('en-IN')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Box>
          ) : (
            <Alert severity="info">No calculation data available</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEscalationOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── 3. AI Commercial Fitout Inspector Dialog ──────────────────── */}
      <Dialog open={fitoutOpen} onClose={() => setFitoutOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BuildIcon sx={{ color: '#F59E0B' }} />
          AI Commercial Unit Fitout Compliance Audit
        </DialogTitle>
        <DialogContent dividers>
          {fitoutLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={36} />
            </Box>
          ) : fitoutResult ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{selectedLease.tradeName}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Unit: {selectedLease.unit}</Typography>
                </Box>
                <Chip
                  label={fitoutResult.fitoutStatus}
                  color={fitoutResult.fitoutStatus === 'APPROVED' ? 'success' : 'warning'}
                  sx={{ fontWeight: 800 }}
                />
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Fitout Compliance Score</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#10B981' }}>{fitoutResult.complianceScore} / 100</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Next Inspection Date</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{fitoutResult.nextInspectionDate}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Chip
                  icon={<CheckCircleIcon />}
                  label={`Fire Safety NOC: ${fitoutResult.fireSafetyApproved ? 'Approved' : 'Pending'}`}
                  size="small"
                  color={fitoutResult.fireSafetyApproved ? 'success' : 'warning'}
                  variant="outlined"
                />
                <Chip
                  icon={<CheckCircleIcon />}
                  label={`Structural Clearance: ${fitoutResult.structuralClearance ? 'Certified' : 'Pending'}`}
                  size="small"
                  color={fitoutResult.structuralClearance ? 'success' : 'warning'}
                  variant="outlined"
                />
              </Box>

              {fitoutResult.passedItems && fitoutResult.passedItems.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                    Passed Technical Checklist ({fitoutResult.passedItems.length})
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, m: 0.5, fontSize: '0.85rem' }}>
                    {fitoutResult.passedItems.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Alert severity="info">No fitout inspection data</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFitoutOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── 4. AI Tenant Churn & Renewal Predictor Dialog ──────────────── */}
      <Dialog open={churnOpen} onClose={() => setChurnOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutorenewIcon sx={{ color: '#EC4899' }} />
          AI Tenant Retention & Churn Predictor
        </DialogTitle>
        <DialogContent dividers>
          {churnLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={36} />
            </Box>
          ) : churnResult ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{selectedLease.tradeName}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Expiry: {selectedLease.expiryDate}</Typography>
                </Box>
                <Chip
                  label={`${churnResult.churnRisk} CHURN RISK`}
                  color={churnResult.churnRisk === 'LOW' ? 'success' : churnResult.churnRisk === 'MODERATE' ? 'warning' : 'error'}
                  sx={{ fontWeight: 800 }}
                />
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Renewal Likelihood</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: (churnResult.renewalLikelihoodPercent ?? 0) > 70 ? '#10B981' : '#F59E0B' }}>
                      {churnResult.renewalLikelihoodPercent}%
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Estimated Vacancy Loss</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#EF4444' }}>
                      ₹{churnResult.predictedVacancyLoss?.toLocaleString('en-IN')}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {churnResult.suggestedIncentives && churnResult.suggestedIncentives.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                    AI Recommended Retention Incentives
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, m: 0.5, fontSize: '0.85rem' }}>
                    {churnResult.suggestedIncentives.map((inc, i) => (
                      <li key={i}>{inc}</li>
                    ))}
                  </Box>
                </Box>
              )}

              {churnResult.recommendedAccountAction && (
                <Alert severity={churnResult.churnRisk === 'LOW' ? 'success' : 'info'} sx={{ fontSize: '0.85rem' }}>
                  <strong>Account Executive Action:</strong> {churnResult.recommendedAccountAction}
                </Alert>
              )}
            </Box>
          ) : (
            <Alert severity="info">No prediction data available</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChurnOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RentalDashboard;
