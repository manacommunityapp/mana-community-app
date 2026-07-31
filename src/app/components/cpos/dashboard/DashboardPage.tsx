import React from 'react';
import { Box, Grid, Paper, Typography, Chip, LinearProgress, Avatar } from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import BuildIcon from '@mui/icons-material/Build';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { motion } from 'framer-motion';

const stats = [
  { label: 'Total Properties', value: '2,847', icon: <ApartmentIcon />, color: '#4F6AF5', trend: '+12 this week', pct: 78 },
  { label: 'Active Residents', value: '6,214', icon: <PeopleIcon />, color: '#10B981', trend: '+38 this month', pct: 91 },
  { label: 'Portfolio Value', value: '₹2,840 Cr', icon: <AttachMoneyIcon />, color: '#F59E0B', trend: '+4.2% YoY', pct: 64 },
  { label: 'Rental Yield', value: '6.8%', icon: <TrendingUpIcon />, color: '#06B6D4', trend: '+0.3% vs Q3', pct: 68 },
  { label: 'Occupancy Rate', value: '91.4%', icon: <HomeWorkIcon />, color: '#8B5CF6', trend: '↑ 2.1% MoM', pct: 91 },
  { label: 'Open Maintenance', value: '143', icon: <BuildIcon />, color: '#EF4444', trend: '12 critical', pct: 32 },
];

const recentActivity = [
  { action: 'Ownership Transferred', property: 'A-1204, Prestige Palm Meadows', time: '5 min ago', type: 'SALE' },
  { action: 'Lease Agreement Signed', property: 'Villa 14, Brigade Orchards', time: '23 min ago', type: 'RENT' },
  { action: 'Move-In Completed', property: 'B-302, Sobha Dream Acres', time: '1 hr ago', type: 'MOVE_IN' },
  { action: 'AI Valuation Generated', property: 'Penthouse P1, Embassy Springs', time: '2 hrs ago', type: 'AI' },
  { action: 'Document Expiry Alert', property: 'Shop G-05, Commercial Block', time: '3 hrs ago', type: 'ALERT' },
];

const chipColor: Record<string, string> = {
  SALE: '#10B981', RENT: '#4F6AF5', MOVE_IN: '#8B5CF6', AI: '#06B6D4', ALERT: '#EF4444',
};

const DashboardPage: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    {/* Header */}
    <Box>
      <Typography variant="h4" sx={{ color: '#fff', fontWeight: 800, mb: 0.5 }}>
        Property Command Center
      </Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
        Digital twin view of all community properties — Prestige Palm Meadows Community
      </Typography>
    </Box>

    {/* Stats */}
    <Grid container spacing={2.5}>
      {stats.map((s, i) => (
        <Grid item xs={12} sm={6} md={4} key={i}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Paper sx={{ p: 3, borderRadius: '20px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</Typography>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 800, mt: 0.5 }}>{s.value}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: `${s.color}20`, width: 48, height: 48 }}>
                  <Box sx={{ color: s.color }}>{s.icon}</Box>
                </Avatar>
              </Box>
              <LinearProgress variant="determinate" value={s.pct} sx={{ mb: 1, '& .MuiLinearProgress-bar': { bgcolor: s.color } }} />
              <Typography variant="caption" sx={{ color: s.color, fontWeight: 700 }}>{s.trend}</Typography>
            </Paper>
          </motion.div>
        </Grid>
      ))}
    </Grid>

    {/* Activity + AI Insights */}
    <Grid container spacing={2.5}>
      <Grid item xs={12} md={7}>
        <Paper sx={{ p: 3, borderRadius: '20px' }}>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 2.5 }}>Recent Property Lifecycle Events</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {recentActivity.map((a, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.02)', '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}>
                <Chip label={a.type} size="small" sx={{ bgcolor: `${chipColor[a.type]}20`, color: chipColor[a.type], fontWeight: 700, minWidth: 80 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>{a.action}</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>{a.property}</Typography>
                </Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>{a.time}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={5}>
        <Paper sx={{ p: 3, borderRadius: '20px', height: '100%', background: 'linear-gradient(135deg, rgba(79,106,245,0.08) 0%, rgba(16,185,129,0.04) 100%)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <SmartToyIcon sx={{ color: '#4F6AF5' }} />
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>AI Property Insights</Typography>
          </Box>
          {[
            { insight: '14 properties have rental yield below community average. AI recommends rent revision.', type: 'YIELD' },
            { insight: '3 lease agreements expiring in 30 days. Initiate renewal workflow now.', type: 'LEASE' },
            { insight: 'Market value appreciation of 8.4% predicted for North Tower units in next 12 months.', type: 'VALUE' },
            { insight: '7 vacant units have been empty for >60 days. AI suggests pricing adjustment.', type: 'VACANCY' },
          ].map((item, i) => (
            <Box key={i} sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.04)', mb: 1.5, borderLeft: `3px solid #4F6AF5` }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, fontSize: '0.82rem' }}>{item.insight}</Typography>
            </Box>
          ))}
        </Paper>
      </Grid>
    </Grid>
  </Box>
);

export default DashboardPage;
