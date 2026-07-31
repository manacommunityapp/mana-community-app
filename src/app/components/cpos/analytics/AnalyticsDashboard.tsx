import React from 'react';
import { Box, Grid, Paper, Typography, Avatar, Chip, LinearProgress } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import BarChartIcon from '@mui/icons-material/BarChart';
import ApartmentIcon from '@mui/icons-material/Apartment';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const monthlyValues = [
  { month: 'Jan', occupied: 2480, vacant: 367, value: 2640 },
  { month: 'Feb', occupied: 2510, vacant: 337, value: 2680 },
  { month: 'Mar', occupied: 2540, vacant: 307, value: 2710 },
  { month: 'Apr', occupied: 2570, vacant: 277, value: 2750 },
  { month: 'May', occupied: 2600, vacant: 247, value: 2790 },
  { month: 'Jun', occupied: 2620, vacant: 227, value: 2840 },
];

const yieldData = [
  { month: 'Jan', yield: 6.1 }, { month: 'Feb', yield: 6.3 }, { month: 'Mar', yield: 6.4 },
  { month: 'Apr', yield: 6.5 }, { month: 'May', yield: 6.7 }, { month: 'Jun', yield: 6.8 },
];

const typeDistribution = [
  { name: 'Apartment', value: 1840, color: '#4F6AF5' },
  { name: 'Villa', value: 420, color: '#10B981' },
  { name: 'Commercial', value: 380, color: '#F59E0B' },
  { name: 'Parking', value: 207, color: '#8B5CF6' },
];

const AnalyticsDashboard: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <BarChartIcon sx={{ color: '#4F6AF5' }} /> Property Analytics Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Real-time insights across your entire property portfolio
        </Typography>
      </Box>
      <Chip label="Live Data" sx={{ bgcolor: 'rgba(16,185,129,0.15)', color: '#10B981', fontWeight: 700 }} />
    </Box>

    {/* Charts Row 1 */}
    <Grid container spacing={2.5}>
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3, borderRadius: '20px' }}>
          <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700, mb: 3 }}>Occupancy Trend — 6 Months</Typography>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyValues} barCategoryGap="30%">
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#0D1526', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
              <Bar dataKey="occupied" fill="#4F6AF5" radius={[6,6,0,0]} name="Occupied" />
              <Bar dataKey="vacant" fill="rgba(245,158,11,0.5)" radius={[6,6,0,0]} name="Vacant" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3, borderRadius: '20px', height: '100%' }}>
          <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700, mb: 3 }}>Property Type Distribution</Typography>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={typeDistribution} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                {typeDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0D1526', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 1 }}>
            {typeDistribution.map(t => (
              <Box key={t.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: t.color }} />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>{t.name}</Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700 }}>{t.value}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Grid>
    </Grid>

    {/* Charts Row 2 */}
    <Grid container spacing={2.5}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, borderRadius: '20px' }}>
          <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700, mb: 3 }}>Rental Yield Trend</Typography>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={yieldData}>
              <defs>
                <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} domain={[5.5, 7.5]} />
              <Tooltip contentStyle={{ background: '#0D1526', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
              <Area type="monotone" dataKey="yield" stroke="#10B981" strokeWidth={3} fill="url(#yieldGrad)" name="Yield %" />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, borderRadius: '20px' }}>
          <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700, mb: 2.5 }}>Portfolio Value — ₹ Crore</Typography>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthlyValues}>
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#0D1526', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
              <Line type="monotone" dataKey="value" stroke="#4F6AF5" strokeWidth={3} dot={false} name="Portfolio ₹Cr" />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>

    {/* Performance Table */}
    <Paper sx={{ p: 3, borderRadius: '20px' }}>
      <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700, mb: 2.5 }}>Tower-wise Performance</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {[
          { tower: 'North Tower', units: 480, occupied: 452, yield: '7.1%', value: '₹580 Cr', score: 94 },
          { tower: 'South Tower', units: 480, occupied: 438, yield: '6.8%', value: '₹564 Cr', score: 91 },
          { tower: 'East Wing Villa', units: 120, occupied: 108, yield: '8.2%', value: '₹380 Cr', score: 90 },
          { tower: 'Commercial Block A', units: 86, occupied: 74, yield: '9.1%', value: '₹220 Cr', score: 86 },
        ].map((t, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2.5, p: 2, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.02)' }}>
            <Avatar sx={{ bgcolor: 'rgba(79,106,245,0.15)', color: '#4F6AF5', width: 40, height: 40 }}>
              <ApartmentIcon fontSize="small" />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700 }}>{t.tower}</Typography>
              <LinearProgress variant="determinate" value={Math.round(t.occupied / t.units * 100)} sx={{ mt: 0.75, '& .MuiLinearProgress-bar': { bgcolor: '#4F6AF5' } }} />
            </Box>
            <Chip label={`Yield ${t.yield}`} size="small" sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10B981', fontWeight: 700 }} />
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', minWidth: 80, textAlign: 'right' }}>{t.value}</Typography>
            <Chip label={`Score: ${t.score}`} size="small" sx={{ bgcolor: 'rgba(79,106,245,0.15)', color: '#7B93FF', fontWeight: 700 }} />
          </Box>
        ))}
      </Box>
    </Paper>
  </Box>
);

export default AnalyticsDashboard;
