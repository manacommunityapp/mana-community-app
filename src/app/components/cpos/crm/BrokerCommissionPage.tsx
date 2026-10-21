import React, { useMemo, useState } from 'react';
import {
  Box, Paper, Typography, Chip, Avatar, Table, TableHead, TableRow,
  TableCell, TableBody, TextField, MenuItem,
} from '@mui/material';
import { useNavigate } from 'react-router';
import { CRMNav } from './CRMNav';
import { INITIAL_LEADS, Stage, STAGE_LABELS, stageColors } from './crmData';

interface Broker {
  id: string;
  name: string;
  firm: string;
  phone: string;
  commissionRate: number;
  leadIds: string[];
}

const BROKERS: Broker[] = [
  { id: 'BR001', name: 'Suresh Kumar',  firm: 'Anand Properties',      phone: '+91 98001 12345', commissionRate: 2.00, leadIds: ['L003'] },
  { id: 'BR002', name: 'Rahul Mehta',   firm: 'Prime Realty Advisors', phone: '+91 97001 23456', commissionRate: 1.75, leadIds: ['L008'] },
];

const BROKER_COLORS = ['#4F6AF5', '#10B981'];

const commissionStatus = (stage: Stage): { label: string; bg: string; color: string } => {
  if (stage === 'CLOSED')       return { label: 'Approved',      bg: 'rgba(16,185,129,0.15)', color: '#10B981' };
  if (stage === 'NEGOTIATION')  return { label: 'Pending Review', bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' };
  return                               { label: 'Pending',        bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' };
};

const BrokerCommissionPage: React.FC = () => {
  const navigate = useNavigate();
  const [filterBroker, setFilterBroker] = useState('ALL');

  const deals = useMemo(() =>
    BROKERS.flatMap(broker =>
      broker.leadIds.flatMap(leadId => {
        const lead = INITIAL_LEADS.find(l => l.id === leadId);
        if (!lead) return [];
        const commissionLakhs = parseFloat(((lead.budgetLakhs * broker.commissionRate) / 100).toFixed(2));
        return [{ broker, lead, commissionLakhs }];
      })
    ), []);

  const filteredDeals = filterBroker === 'ALL' ? deals : deals.filter(d => d.broker.id === filterBroker);

  const totalCommission    = deals.reduce((s, d) => s + d.commissionLakhs, 0);
  const approvedCommission = deals.filter(d => d.lead.stage === 'CLOSED').reduce((s, d) => s + d.commissionLakhs, 0);
  const pendingCommission  = totalCommission - approvedCommission;

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
          { label: 'Registered Brokers',    value: BROKERS.length,                         color: '#8B5CF6' },
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
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>
          {BROKERS.map((broker, i) => {
            const brokerLeads   = broker.leadIds.map(id => INITIAL_LEADS.find(l => l.id === id)).filter(Boolean) as typeof INITIAL_LEADS;
            const closed        = brokerLeads.filter(l => l.stage === 'CLOSED').length;
            const commission    = brokerLeads.reduce((s, l) => s + parseFloat(((l.budgetLakhs * broker.commissionRate) / 100).toFixed(2)), 0);
            const accentColor   = BROKER_COLORS[i % BROKER_COLORS.length];
            return (
              <Paper key={broker.id} sx={{ p: 3, borderRadius: '20px', background: 'linear-gradient(135deg, rgba(79,106,245,0.06) 0%, rgba(16,185,129,0.03) 100%)', border: `1px solid ${accentColor}25` }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2.5 }}>
                  <Avatar sx={{ bgcolor: `${accentColor}20`, color: accentColor, fontWeight: 800, borderRadius: '14px', width: 50, height: 50, fontSize: '1rem' }}>
                    {broker.name.split(' ').map(w => w[0]).join('')}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 800, lineHeight: 1.2 }}>{broker.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>{broker.firm}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5, mb: 2 }}>
                  {[
                    { label: 'Leads',   val: brokerLeads.length, color: accentColor },
                    { label: 'Closed',  val: closed,             color: '#10B981' },
                    { label: 'Rate',    val: `${broker.commissionRate}%`, color: '#F59E0B' },
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
                    <Typography variant="subtitle2" sx={{ color: '#10B981', fontWeight: 800 }}>₹{commission.toFixed(2)} L</Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem' }}>{broker.phone}</Typography>
                </Box>
              </Paper>
            );
          })}
        </Box>
      </Box>

      {/* Commission ledger */}
      <Paper sx={{ borderRadius: '20px', overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: 1.5 }}>
          <Box>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>Commission Ledger</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
              {filteredDeals.length} deal{filteredDeals.length !== 1 ? 's' : ''} · ₹{filteredDeals.reduce((s, d) => s + d.commissionLakhs, 0).toFixed(2)} L total
            </Typography>
          </Box>
          <TextField
            select size="small" value={filterBroker}
            onChange={e => setFilterBroker(e.target.value)}
            sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          >
            <MenuItem value="ALL">All Brokers</MenuItem>
            {BROKERS.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
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
              {filteredDeals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ color: 'rgba(255,255,255,0.3)', py: 4, border: 'none' }}>
                    No deals match this filter
                  </TableCell>
                </TableRow>
              )}
              {filteredDeals.map(({ broker, lead, commissionLakhs }) => {
                const status = commissionStatus(lead.stage);
                return (
                  <TableRow key={`${broker.id}-${lead.id}`}
                    sx={{ '& td': { borderBottom: '1px solid rgba(255,255,255,0.04)', py: 1.5 }, '&:last-child td': { borderBottom: 'none' } }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700 }}>{lead.name}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem' }}>
                        {lead.id} · {lead.type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: '#7B93FF', fontWeight: 700, display: 'block' }}>{broker.name}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.67rem' }}>{broker.firm}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 700 }}>{lead.budget}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={`${broker.commissionRate}%`} size="small"
                        sx={{ bgcolor: 'rgba(245,158,11,0.15)', color: '#F59E0B', fontWeight: 700, fontSize: '0.68rem', height: 20 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#4F6AF5', fontWeight: 800 }}>₹{commissionLakhs} L</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={STAGE_LABELS[lead.stage]} size="small"
                        sx={{ bgcolor: `${stageColors[lead.stage]}18`, color: stageColors[lead.stage], fontWeight: 700, fontSize: '0.68rem', height: 20 }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={status.label} size="small"
                        sx={{ bgcolor: status.bg, color: status.color, fontWeight: 700, fontSize: '0.68rem', height: 20 }} />
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="caption"
                        onClick={() => navigate(`/cpos/crm/leads/${lead.id}`)}
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
