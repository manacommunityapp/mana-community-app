import React from 'react';
import { Box, Grid, Paper, Typography, Chip, Avatar, Button, LinearProgress } from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const cashFlow = [
  { month: 'Jan', income: 184, expense: 42 }, { month: 'Feb', income: 186, expense: 38 },
  { month: 'Mar', income: 190, expense: 45 }, { month: 'Apr', income: 188, expense: 41 },
  { month: 'May', income: 192, expense: 39 }, { month: 'Jun', income: 195, expense: 44 },
];

const FinanceDashboard: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AttachMoneyIcon sx={{ color: '#10B981' }} /> Property Finance Engine
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Complete financial health — portfolio value, loans, rental income, ROI, tax, insurance.
        </Typography>
      </Box>
    </Box>

    {/* Finance Stats */}
    <Grid container spacing={2.5}>
      {[
        { label: 'Portfolio Value', value: '₹2,840 Cr', sub: '+4.2% YoY', color: '#4F6AF5', icon: <TrendingUpIcon /> },
        { label: 'Monthly Rental Income', value: '₹1.95 Cr', sub: '96.2% collection rate', color: '#10B981', icon: <AttachMoneyIcon /> },
        { label: 'Outstanding Loans', value: '₹680 Cr', sub: 'Across 480 properties', color: '#F59E0B', icon: <AccountBalanceIcon /> },
        { label: 'Security Deposits Held', value: '₹5.2 Cr', sub: '1,180 active leases', color: '#8B5CF6', icon: <ReceiptIcon /> },
      ].map((s, i) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
          <Paper sx={{ p: 3, borderRadius: '20px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</Typography>
              <Avatar sx={{ bgcolor: `${s.color}20`, width: 36, height: 36 }}><Box sx={{ color: s.color, display: 'flex' }}>{s.icon}</Box></Avatar>
            </Box>
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>{s.value}</Typography>
            <Typography variant="caption" sx={{ color: s.color, fontWeight: 700 }}>{s.sub}</Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>

    {/* Cash Flow Chart + Loan Summary */}
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, md: 7 }}>
        <Paper sx={{ p: 3, borderRadius: '20px' }}>
          <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700, mb: 3 }}>Monthly Cash Flow — ₹ Lakhs</Typography>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={cashFlow}>
              <defs>
                <linearGradient id="incomeG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
              <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#0D1526', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
              <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} fill="url(#incomeG)" name="Rental Income" />
              <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} fill="url(#expG)" name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      <Grid size={{ xs: 12, md: 5 }}>
        <Paper sx={{ p: 3, borderRadius: '20px' }}>
          <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700, mb: 2.5 }}>ROI by Property Type</Typography>
          {[
            { type: 'Villas', roi: '9.2%', yield: '8.1%', pct: 92 },
            { type: 'Commercial', roi: '10.4%', yield: '9.3%', pct: 87 },
            { type: 'Apartments', roi: '6.8%', yield: '6.1%', pct: 68 },
            { type: 'Parking Units', roi: '11.2%', yield: '10.8%', pct: 96 },
          ].map((r, i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>{r.type}</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip label={`ROI ${r.roi}`} size="small" sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10B981', fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
                  <Chip label={`Yield ${r.yield}`} size="small" sx={{ bgcolor: 'rgba(79,106,245,0.1)', color: '#7B93FF', fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
                </Box>
              </Box>
              <LinearProgress variant="determinate" value={r.pct} sx={{ '& .MuiLinearProgress-bar': { bgcolor: '#10B981' } }} />
            </Box>
          ))}
        </Paper>
      </Grid>
    </Grid>

    {/* Upcoming Financial Obligations */}
    <Paper sx={{ p: 3, borderRadius: '20px' }}>
      <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700, mb: 2.5 }}>Upcoming Financial Obligations</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {[
          { item: 'Property Tax — A-1204', due: '30 Jul 2025', amount: '₹28,400', type: 'TAX', days: 6 },
          { item: 'Insurance Premium — Villa 14', due: '15 Aug 2025', amount: '₹42,000', type: 'INSURANCE', days: 22 },
          { item: 'EMI — HDFC Loan B-302', due: '01 Aug 2025', amount: '₹38,500', type: 'EMI', days: 8 },
          { item: 'Maintenance Charge — Q3 2025', due: '05 Aug 2025', amount: '₹12,000', type: 'MAINTENANCE', days: 12 },
        ].map((o, i) => {
          const colors: Record<string, string> = { TAX: '#EF4444', INSURANCE: '#F59E0B', EMI: '#4F6AF5', MAINTENANCE: '#8B5CF6' };
          return (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2.5, p: 2, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.02)', borderLeft: `3px solid ${colors[o.type]}` }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>{o.item}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>Due: {o.due}</Typography>
              </Box>
              <Typography variant="body1" sx={{ color: colors[o.type], fontWeight: 800 }}>{o.amount}</Typography>
              <Chip label={`${o.days} days`} size="small" sx={{ bgcolor: `${colors[o.type]}15`, color: colors[o.type], fontWeight: 700 }} />
            </Box>
          );
        })}
      </Box>
    </Paper>
  </Box>
);

export default FinanceDashboard;
