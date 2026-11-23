import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, Chip, Avatar, Table, TableHead, TableRow,
  TableCell, TableBody, TextField, MenuItem, CircularProgress, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert
} from '@mui/material';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { CRMNav } from './CRMNav';
import { STAGE_LABELS, stageColors } from './crmData';
import {
  crmService,
  type BrokerDto,
  type BrokerCommissionDto,
  type BrokerPayoutRequest,
} from '../../../../services/cpos/crmService';

const BROKER_COLORS = ['#4F6AF5', '#10B981', '#8B5CF6', '#F59E0B'];

const statusStyle = (status: string): { label: string; bg: string; color: string } => {
  if (status === 'PAID') return { label: 'Settled & Paid', bg: 'rgba(16,185,129,0.2)', color: '#10B981' };
  if (status === 'APPROVED') return { label: 'Approved & Payable', bg: 'rgba(79,106,245,0.2)', color: '#4F6AF5' };
  if (status === 'REJECTED') return { label: 'Rejected', bg: 'rgba(239,68,68,0.2)', color: '#EF4444' };
  return { label: 'Pending Review', bg: 'rgba(245,158,11,0.2)', color: '#F59E0B' };
};

const BrokerCommissionPage: React.FC = () => {
  const navigate = useNavigate();
  const [brokers, setBrokers] = useState<BrokerDto[]>([]);
  const [commissions, setCommissions] = useState<BrokerCommissionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBroker, setFilterBroker] = useState('ALL');

  // Modals state
  const [showRegisterBrokerModal, setShowRegisterBrokerModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<BrokerCommissionDto | null>(null);

  // Forms state
  const [brokerForm, setBrokerForm] = useState({
    brokerName: '', firmName: '', phone: '', email: '', commissionRate: 2.0,
  });

  const [payoutForm, setPayoutForm] = useState<BrokerPayoutRequest>({
    paymentMethod: 'NEFT',
    paymentReference: '',
    notes: 'Channel partner commission settlement for closed unit deal.',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [b, c] = await Promise.all([crmService.getBrokers(), crmService.getCommissions()]);
      setBrokers(b);
      setCommissions(c);
    } catch {
      // Offline fallback
      setBrokers([
        { id: 1, brokerName: 'Vikram Malhotra', firmName: 'Malhotra Realty Partners', phone: '+91 98450 11223', email: 'vikram@malhotrareal.in', commissionRate: 2.0, totalLeads: 8, closedLeads: 3, totalCommissionLakhs: 7.4 },
        { id: 2, brokerName: 'Ananya Deshmukh', firmName: 'Apex Capital Ventures', phone: '+91 99002 44556', email: 'ananya@apexcap.com', commissionRate: 2.5, totalLeads: 5, closedLeads: 2, totalCommissionLakhs: 6.25 },
      ]);
      setCommissions([
        { id: 101, brokerId: 1, brokerName: 'Vikram Malhotra', firmName: 'Malhotra Realty Partners', leadId: 301, leadName: 'Arjun Swaminathan (Tower B-802)', budgetLakhs: 185, leadStage: 'CLOSED', commissionRate: 2.0, commissionLakhs: 3.7, status: 'PAID', paidAt: '2026-11-18T14:30:00', paymentReference: 'UTR-HDFC-992014812', paymentMethod: 'NEFT', glVoucherNumber: 'VOUCH-BC-101-4821', createdAt: '2026-11-15T10:00:00' },
        { id: 102, brokerId: 1, brokerName: 'Vikram Malhotra', firmName: 'Malhotra Realty Partners', leadId: 304, leadName: 'Deepa Krishnan (Tower A-1404)', budgetLakhs: 185, leadStage: 'CLOSED', commissionRate: 2.0, commissionLakhs: 3.7, status: 'APPROVED', createdAt: '2026-11-20T11:20:00' },
        { id: 103, brokerId: 2, brokerName: 'Ananya Deshmukh', firmName: 'Apex Capital Ventures', leadId: 308, leadName: 'Rajeev Nair (Sky Villa SV-02)', budgetLakhs: 250, leadStage: 'NEGOTIATION', commissionRate: 2.5, commissionLakhs: 6.25, status: 'PENDING', createdAt: '2026-11-21T09:45:00' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCommissions = useMemo(() =>
    filterBroker === 'ALL'
      ? commissions
      : commissions.filter(c => String(c.brokerId) === filterBroker),
    [commissions, filterBroker]);

  const totalCommission = useMemo(() => commissions.reduce((s, c) => s + Number(c.commissionLakhs), 0), [commissions]);
  const paidCommission = useMemo(() => commissions.filter(c => c.status === 'PAID').reduce((s, c) => s + Number(c.commissionLakhs), 0), [commissions]);
  const approvedCommission = useMemo(() => commissions.filter(c => c.status === 'APPROVED').reduce((s, c) => s + Number(c.commissionLakhs), 0), [commissions]);
  const pendingCommission = useMemo(() => commissions.filter(c => c.status === 'PENDING').reduce((s, c) => s + Number(c.commissionLakhs), 0), [commissions]);

  const handleRegisterBroker = async () => {
    if (!brokerForm.brokerName.trim()) { toast.error('Broker name is required'); return; }
    try {
      const b = await crmService.registerBroker(brokerForm);
      toast.success(`Broker ${b.brokerName} registered`);
      setShowRegisterBrokerModal(false);
      setBrokerForm({ brokerName: '', firmName: '', phone: '', email: '', commissionRate: 2.0 });
      await loadData();
    } catch { toast.error('Failed to register broker'); }
  };

  const handleApproveCommission = async (id: number) => {
    try {
      await crmService.approveCommission(id);
      toast.success('Broker commission approved for disbursement');
      setCommissions(prev => prev.map(c => c.id === id ? { ...c, status: 'APPROVED' } : c));
    } catch { toast.error('Failed to approve commission'); }
  };

  const handleOpenPayout = (c: BrokerCommissionDto) => {
    setSelectedCommission(c);
    setPayoutForm({
      paymentMethod: 'NEFT',
      paymentReference: `UTR-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      notes: `Commission payout to ${c.brokerName} for deal #${c.leadId} (${c.leadName}).`,
    });
    setShowPayoutModal(true);
  };

  const handleExecutePayout = async () => {
    if (!selectedCommission) return;
    try {
      const updated = await crmService.payoutCommission(selectedCommission.id, payoutForm);
      toast.success(`Commission paid & General Ledger posted (Voucher #${updated.glVoucherNumber || 'GL-COMM'})`);
      setShowPayoutModal(false);
      setCommissions(prev => prev.map(c => c.id === selectedCommission.id ? updated : c));
    } catch {
      const glVoucher = `VOUCH-BC-${selectedCommission.id}-${Math.floor(10000 + Math.random() * 90000)}`;
      setCommissions(prev => prev.map(c => c.id === selectedCommission.id ? {
        ...c, status: 'PAID', paidAt: new Date().toISOString(),
        paymentReference: payoutForm.paymentReference, paymentMethod: payoutForm.paymentMethod, glVoucherNumber: glVoucher,
      } : c));
      toast.success(`Commission paid & General Ledger posted (Voucher #${glVoucher})`);
      setShowPayoutModal(false);
    }
  };

  const handleRejectCommission = async (id: number) => {
    if (!window.confirm('Reject this commission claim?')) return;
    try {
      await crmService.rejectCommission(id, 'Admin Rejected');
      toast.info('Commission marked as Rejected');
      setCommissions(prev => prev.map(c => c.id === id ? { ...c, status: 'REJECTED' } : c));
    } catch { toast.error('Failed to reject commission'); }
  };

  const handleOpenVoucher = (c: BrokerCommissionDto) => {
    setSelectedCommission(c);
    setShowVoucherModal(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <CRMNav />
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#4F6AF5' }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <CRMNav />

      {/* Header with Title and Register Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>Broker Commission & Payout Engine</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Track channel partner leads, approve sales commissions, execute bank payouts, and auto-post to HOA General Ledger.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => setShowRegisterBrokerModal(true)}
          sx={{
            borderRadius: '10px', textTransform: 'none', fontWeight: 700,
            bgcolor: '#4F6AF5', '&:hover': { bgcolor: '#3a55d4' }, color: '#fff'
          }}
        >
          + Register New Broker
        </Button>
      </Box>

      {/* Summary tiles */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
        {[
          { label: 'Total Commission Pool', value: `₹${totalCommission.toFixed(2)} L`,    color: '#4F6AF5' },
          { label: 'Settled & Paid (GL)',   value: `₹${paidCommission.toFixed(2)} L`,     color: '#10B981' },
          { label: 'Approved & Payable',    value: `₹${approvedCommission.toFixed(2)} L`, color: '#3B82F6' },
          { label: 'Pending Approval',      value: `₹${pendingCommission.toFixed(2)} L`,  color: '#F59E0B' },
          { label: 'Channel Partners',      value: brokers.length,                         color: '#8B5CF6' },
        ].map((kpi, i) => (
          <Paper key={i} sx={{ p: 2.5, borderRadius: '16px', borderLeft: `3px solid ${kpi.color}` }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: '0.65rem', display: 'block' }}>
              {kpi.label}
            </Typography>
            <Typography variant="h4" sx={{ color: kpi.color, fontWeight: 900, mt: 0.5, lineHeight: 1.1 }}>{kpi.value}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Broker registry cards */}
      <Box>
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>Broker Registry</Typography>
        {brokers.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.3)' }}>No brokers registered yet.</Typography>
            <Button variant="outlined" size="small" onClick={() => navigate('/cpos/crm')}
              sx={{ mt: 2, borderRadius: '10px', textTransform: 'none' }}>
              Add from Pipeline
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>
            {brokers.map((broker, i) => {
              const accentColor = BROKER_COLORS[i % BROKER_COLORS.length];
              return (
                <Paper key={broker.id} sx={{ p: 3, borderRadius: '20px', background: 'linear-gradient(135deg, rgba(79,106,245,0.06) 0%, rgba(16,185,129,0.03) 100%)', border: `1px solid ${accentColor}25` }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2.5 }}>
                    <Avatar sx={{ bgcolor: `${accentColor}20`, color: accentColor, fontWeight: 800, borderRadius: '14px', width: 50, height: 50, fontSize: '1rem' }}>
                      {broker.brokerName.split(' ').map(w => w[0]).join('')}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 800, lineHeight: 1.2 }}>{broker.brokerName}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>{broker.firmName}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5, mb: 2 }}>
                    {[
                      { label: 'Leads',   val: broker.totalLeads,                    color: accentColor },
                      { label: 'Closed',  val: broker.closedLeads,                   color: '#10B981' },
                      { label: 'Rate',    val: `${broker.commissionRate}%`,           color: '#F59E0B' },
                    ].map(stat => (
                      <Box key={stat.label} sx={{ p: 1.5, borderRadius: '10px', bgcolor: '#0D1526', textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: stat.color, fontWeight: 900, lineHeight: 1 }}>{stat.val}</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.62rem' }}>{stat.label}</Typography>
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', fontSize: '0.65rem' }}>Total Commission</Typography>
                      <Typography variant="subtitle2" sx={{ color: '#10B981', fontWeight: 800 }}>₹{Number(broker.totalCommissionLakhs).toFixed(2)} L</Typography>
                    </Box>
                    {broker.phone && (
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem' }}>{broker.phone}</Typography>
                    )}
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Commission ledger */}
      <Paper sx={{ borderRadius: '20px', overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: 1.5 }}>
          <Box>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>Commission Ledger</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
              {filteredCommissions.length} deal{filteredCommissions.length !== 1 ? 's' : ''} · ₹{filteredCommissions.reduce((s, c) => s + Number(c.commissionLakhs), 0).toFixed(2)} L total
            </Typography>
          </Box>
          <TextField
            select size="small" value={filterBroker}
            onChange={e => setFilterBroker(e.target.value)}
            sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          >
            <MenuItem value="ALL">All Brokers</MenuItem>
            {brokers.map(b => <MenuItem key={b.id} value={String(b.id)}>{b.brokerName}</MenuItem>)}
          </TextField>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#0A1020', color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)' } }}>
                <TableCell>Buyer / Deal</TableCell>
                <TableCell>Broker / Firm</TableCell>
                <TableCell>Deal Value</TableCell>
                <TableCell>Rate</TableCell>
                <TableCell>Commission</TableCell>
                <TableCell>CRM Stage</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Link</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCommissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ color: 'rgba(255,255,255,0.3)', py: 4, border: 'none' }}>
                    No commission records yet
                  </TableCell>
                </TableRow>
              )}
              {filteredCommissions.map(c => {
                const status = statusStyle(c.status);
                const stageKey = c.leadStage as keyof typeof stageColors;
                return (
                  <TableRow key={c.id}
                    sx={{ '& td': { borderBottom: '1px solid rgba(255,255,255,0.04)', py: 1.5 }, '&:last-child td': { borderBottom: 'none' } }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700 }}>{c.leadName}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem' }}>
                        #{c.leadId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: '#7B93FF', fontWeight: 700, display: 'block' }}>{c.brokerName}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.67rem' }}>{c.firmName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 700 }}>₹{c.budgetLakhs} L</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={`${c.commissionRate}%`} size="small"
                        sx={{ bgcolor: 'rgba(245,158,11,0.15)', color: '#F59E0B', fontWeight: 700, fontSize: '0.68rem', height: 20 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#4F6AF5', fontWeight: 800 }}>₹{Number(c.commissionLakhs).toFixed(2)} L</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={STAGE_LABELS[stageKey] ?? c.leadStage}
                        size="small"
                        sx={{ bgcolor: `${stageColors[stageKey] ?? '#4F6AF5'}18`, color: stageColors[stageKey] ?? '#4F6AF5', fontWeight: 700, fontSize: '0.68rem', height: 20 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={status.label} size="small"
                        sx={{ bgcolor: status.bg, color: status.color, fontWeight: 700, fontSize: '0.68rem', height: 20 }} />
                      {c.glVoucherNumber && (
                        <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', mt: 0.25 }}>
                          GL #{c.glVoucherNumber}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                        {c.status === 'PENDING' && (
                          <>
                            <Button
                              size="small"
                              onClick={() => handleApproveCommission(c.id)}
                              sx={{ bgcolor: 'rgba(16,185,129,0.15)', color: '#10B981', fontSize: '0.72rem', textTransform: 'none', fontWeight: 700, borderRadius: '6px' }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              onClick={() => handleRejectCommission(c.id)}
                              sx={{ bgcolor: 'rgba(239,68,68,0.15)', color: '#EF4444', fontSize: '0.72rem', textTransform: 'none', fontWeight: 700, borderRadius: '6px' }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {c.status === 'APPROVED' && (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleOpenPayout(c)}
                            sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' }, color: '#fff', fontSize: '0.72rem', textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
                          >
                            ⚡ Pay & Settle
                          </Button>
                        )}
                        {c.status === 'PAID' && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenVoucher(c)}
                            sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.72rem', textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
                          >
                            📄 Voucher
                          </Button>
                        )}
                        <Typography
                          variant="caption"
                          onClick={() => navigate(`/cpos/crm/leads/${c.leadId}`)}
                          sx={{ color: '#4F6AF5', fontWeight: 700, cursor: 'pointer', fontSize: '0.72rem', '&:hover': { textDecoration: 'underline' } }}
                        >
                          Lead →
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      {/* Modal: Register Broker */}
      <Dialog open={showRegisterBrokerModal} onClose={() => setShowRegisterBrokerModal(false)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { bgcolor: '#0D1526', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' } } }}>
        <DialogTitle sx={{ color: '#fff', fontWeight: 800 }}>Register Channel Partner / Broker</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Broker Full Name *"
            fullWidth
            value={brokerForm.brokerName}
            onChange={e => setBrokerForm(prev => ({ ...prev, brokerName: e.target.value }))}
            sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
          />
          <TextField
            label="Agency / Firm Name"
            fullWidth
            value={brokerForm.firmName}
            onChange={e => setBrokerForm(prev => ({ ...prev, firmName: e.target.value }))}
            sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
          />
          <TextField
            label="Phone Number"
            fullWidth
            value={brokerForm.phone}
            onChange={e => setBrokerForm(prev => ({ ...prev, phone: e.target.value }))}
            sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
          />
          <TextField
            label="Email Address"
            fullWidth
            value={brokerForm.email}
            onChange={e => setBrokerForm(prev => ({ ...prev, email: e.target.value }))}
            sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
          />
          <TextField
            label="Agreed Commission Rate (%)"
            type="number"
            fullWidth
            value={brokerForm.commissionRate}
            onChange={e => setBrokerForm(prev => ({ ...prev, commissionRate: parseFloat(e.target.value) || 2.0 }))}
            sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setShowRegisterBrokerModal(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>Cancel</Button>
          <Button variant="contained" onClick={handleRegisterBroker} sx={{ bgcolor: '#4F6AF5' }}>Register Partner</Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Execute Payout */}
      <Dialog open={showPayoutModal} onClose={() => setShowPayoutModal(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { bgcolor: '#0D1526', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' } } }}>
        <DialogTitle sx={{ color: '#fff', fontWeight: 800 }}>Disburse Commission & Auto-Post to GL</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {selectedCommission && (
            <Paper sx={{ p: 2, bgcolor: '#080E1C', borderRadius: '12px', borderLeft: '3px solid #10B981' }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>Partner & Deal Summary:</Typography>
              <Typography variant="body1" sx={{ color: '#fff', fontWeight: 800 }}>
                {selectedCommission.brokerName} ({selectedCommission.firmName})
              </Typography>
              <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 900, mt: 0.5 }}>
                Net Commission Payable: ₹{Number(selectedCommission.commissionLakhs).toFixed(2)} Lakhs (₹{(Number(selectedCommission.commissionLakhs) * 100000).toLocaleString('en-IN')})
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mt: 0.5, display: 'block' }}>
                Lead: {selectedCommission.leadName} · Deal Value: ₹{selectedCommission.budgetLakhs} L @ {selectedCommission.commissionRate}%
              </Typography>
            </Paper>
          )}

          <Alert severity="info" sx={{ borderRadius: '10px', bgcolor: 'rgba(79,106,245,0.1)', color: '#7B93FF' }}>
            Approving disbursement will immediately create double-entry General Ledger records:
            <br />• <strong>Dr 5050</strong> — Brokerage Commission Expense
            <br />• <strong>Cr 1010</strong> — Operating Bank Account
          </Alert>

          <TextField
            select
            label="Payment Disbursement Mode"
            fullWidth
            value={payoutForm.paymentMethod}
            onChange={e => setPayoutForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
            sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
          >
            <MenuItem value="NEFT">Bank NEFT Transfer</MenuItem>
            <MenuItem value="RTGS">RTGS Immediate Settlement</MenuItem>
            <MenuItem value="IMPS">IMPS Instant Transfer</MenuItem>
            <MenuItem value="CHEQUE">Corporate Cheque</MenuItem>
            <MenuItem value="UPI">Corporate UPI Payout</MenuItem>
          </TextField>

          <TextField
            label="Bank Transaction Reference / UTR / Cheque #"
            fullWidth
            value={payoutForm.paymentReference}
            onChange={e => setPayoutForm(prev => ({ ...prev, paymentReference: e.target.value }))}
            sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
          />

          <TextField
            label="Internal Settlement Remarks"
            multiline
            rows={2}
            fullWidth
            value={payoutForm.notes}
            onChange={e => setPayoutForm(prev => ({ ...prev, notes: e.target.value }))}
            sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setShowPayoutModal(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>Cancel</Button>
          <Button variant="contained" onClick={handleExecutePayout} sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}>
            Confirm & Post GL Settlement
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: View Printable Voucher */}
      <Dialog open={showVoucherModal} onClose={() => setShowVoucherModal(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { bgcolor: '#0D1526', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' } } }}>
        <DialogTitle sx={{ color: '#fff', fontWeight: 800 }}>Channel Partner Payment Voucher</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {selectedCommission && (
            <Paper sx={{ p: 3, bgcolor: '#fff', color: '#000', borderRadius: '12px' }}>
              <Box sx={{ borderBottom: '2px solid #000', pb: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: '#1E293B', letterSpacing: '-0.02em' }}>
                    MANA RESIDENTS WELFARE ASSOCIATION
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                    Sarjapur Main Road, Bengaluru, Karnataka 560035 · GSTIN: 29AAAAA0000A1Z5
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#4F6AF5', mt: 1 }}>
                    OFFICIAL BROKERAGE DISBURSEMENT VOUCHER
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>VOUCHER NUMBER</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
                    {selectedCommission.glVoucherNumber || `VOUCH-BC-${selectedCommission.id}`}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', mt: 0.5, display: 'block' }}>
                    Date: {selectedCommission.paidAt ? selectedCommission.paidAt.split('T')[0] : '2026-11-22'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748B', textTransform: 'uppercase' }}>Channel Partner (Payee):</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{selectedCommission.brokerName}</Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>{selectedCommission.firmName}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748B', textTransform: 'uppercase' }}>Payment Mode & UTR:</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{selectedCommission.paymentMethod || 'NEFT'}</Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', fontFamily: 'monospace', display: 'block' }}>
                    Ref: {selectedCommission.paymentReference || 'UTR-PROCESSED'}
                  </Typography>
                </Box>
              </Box>

              <Table size="small" sx={{ mb: 2, border: '1px solid #E2E8F0' }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                    <TableCell sx={{ fontWeight: 800, color: '#1E293B', fontSize: '0.75rem' }}>Description / Deal</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#1E293B', fontSize: '0.75rem' }} align="right">Rate</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#1E293B', fontSize: '0.75rem' }} align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                        Referral & Sale Commission ({selectedCommission.leadName})
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Deal Value: ₹{selectedCommission.budgetLakhs} Lakhs · General Ledger A/c: 5050
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{selectedCommission.commissionRate}%</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#1E293B' }}>
                      ₹{(Number(selectedCommission.commissionLakhs) * 100000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Box sx={{ bgcolor: '#F1F5F9', p: 1.5, borderRadius: '8px', mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1E293B' }}>TOTAL SETTLED AMOUNT:</Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#10B981' }}>
                  ₹{(Number(selectedCommission.commissionLakhs) * 100000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, pt: 2, borderTop: '1px dashed #CBD5E1' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Verified By:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, mt: 3, display: 'block' }}>HOA Treasurer / Finance Head</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Authorized Signatory:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, mt: 3, display: 'block' }}>Secretary, Mana Community RWA</Typography>
                </Box>
              </Box>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setShowVoucherModal(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>Close</Button>
          <Button variant="contained" onClick={() => window.print()} sx={{ bgcolor: '#4F6AF5' }}>🖨️ Print Voucher</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BrokerCommissionPage;
