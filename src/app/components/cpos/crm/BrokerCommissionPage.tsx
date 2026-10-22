import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, Chip, Avatar, Table, TableHead, TableRow,
  TableCell, TableBody, TextField, MenuItem, CircularProgress, Button,
} from '@mui/material';
import { useNavigate } from 'react-router';
import { CRMNav } from './CRMNav';
import { STAGE_LABELS, stageColors } from './crmData';
import { crmService, BrokerDto, BrokerCommissionDto } from '../../../../services/cpos/crmService';

const BROKER_COLORS = ['#4F6AF5', '#10B981', '#8B5CF6', '#F59E0B'];

const statusStyle = (status: string): { label: string; bg: string; color: string } => {
  if (status === 'APPROVED') return { label: 'Approved',       bg: 'rgba(16,185,129,0.15)',  color: '#10B981' };
  if (status === 'PENDING_REVIEW') return { label: 'Pending Review', bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' };
  return                               { label: 'Pending',          bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' };
};

const BrokerCommissionPage: React.FC = () => {
  const navigate = useNavigate();
  const [brokers, setBrokers] = useState<BrokerDto[]>([]);
  const [commissions, setCommissions] = useState<BrokerCommissionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBroker, setFilterBroker] = useState('ALL');

  useEffect(() => {
    Promise.all([crmService.getBrokers(), crmService.getCommissions()])
      .then(([b, c]) => { setBrokers(b); setCommissions(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredCommissions = useMemo(() =>
    filterBroker === 'ALL'
      ? commissions
      : commissions.filter(c => String(c.brokerId) === filterBroker),
    [commissions, filterBroker]);

  const totalCommission    = commissions.reduce((s, c) => s + Number(c.commissionLakhs), 0);
  const approvedCommission = commissions.filter(c => c.status === 'APPROVED').reduce((s, c) => s + Number(c.commissionLakhs), 0);
  const pendingCommission  = totalCommission - approvedCommission;

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

      <Box>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>Broker Commission Engine</Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Track broker referrals, compute commissions, and manage approval status
        </Typography>
      </Box>

      {/* Summary tiles */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
        {[
          { label: 'Total Commission Pool', value: `₹${totalCommission.toFixed(2)} L`,    color: '#4F6AF5' },
          { label: 'Approved & Payable',    value: `₹${approvedCommission.toFixed(2)} L`, color: '#10B981' },
          { label: 'Pending Approval',      value: `₹${pendingCommission.toFixed(2)} L`,  color: '#F59E0B' },
          { label: 'Registered Brokers',    value: brokers.length,                         color: '#8B5CF6' },
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
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="caption"
                        onClick={() => navigate(`/cpos/crm/leads/${c.leadId}`)}
                        sx={{ color: '#4F6AF5', fontWeight: 700, cursor: 'pointer', fontSize: '0.72rem', '&:hover': { textDecoration: 'underline' } }}
                      >
                        View Lead →
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Box>
  );
};

export default BrokerCommissionPage;
