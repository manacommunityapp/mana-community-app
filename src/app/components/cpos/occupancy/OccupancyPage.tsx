import React from 'react';
import { Box, Grid, Paper, Typography, Chip, LinearProgress } from '@mui/material';
import HomeWorkIcon from '@mui/icons-material/HomeWork';

const OccupancyPage: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <Box>
      <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
        <HomeWorkIcon sx={{ color: '#4F6AF5' }} /> Occupancy & Resident Lifecycle
      </Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Real-time breakdown of owner-occupied, tenant-occupied, and vacant units</Typography>
    </Box>

    <Grid container spacing={2.5}>
      {[
        { label: 'Total Units', val: '2,847', color: '#4F6AF5' },
        { label: 'Owner Occupied', val: '1,240 (43.5%)', color: '#10B981' },
        { label: 'Tenant Occupied', val: '1,180 (41.4%)', color: '#7B93FF' },
        { label: 'Vacant', val: '322 (11.3%)', color: '#F59E0B' },
        { label: 'Reserved / Inventory', val: '105 (3.7%)', color: '#8B5CF6' },
      ].map((s, i) => (
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={i}>
          <Paper sx={{ p: 2.5, borderRadius: '16px', borderTop: `4px solid ${s.color}` }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</Typography>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800, mt: 0.5 }}>{s.val}</Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>

    <Paper sx={{ p: 3, borderRadius: '20px' }}>
      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>Tower-wise Occupancy Breakdown</Typography>
      {[
        { tower: 'North Tower (A)', total: 480, owner: 220, tenant: 210, vacant: 50 },
        { tower: 'South Tower (B)', total: 480, owner: 200, tenant: 210, vacant: 70 },
        { tower: 'East Tower (C)', total: 480, owner: 240, tenant: 190, vacant: 50 },
        { tower: 'West Tower (D)', total: 480, owner: 210, tenant: 220, vacant: 50 },
      ].map((t, i) => (
        <Box key={i} sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body1" sx={{ color: '#fff', fontWeight: 700 }}>{t.tower}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Owner: {t.owner} | Tenant: {t.tenant} | Vacant: {t.vacant} ({Math.round(((t.owner + t.tenant) / t.total) * 100)}% occupied)
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={Math.round(((t.owner + t.tenant) / t.total) * 100)} sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { bgcolor: '#10B981' } }} />
        </Box>
      ))}
    </Paper>
  </Box>
);
export default OccupancyPage;
