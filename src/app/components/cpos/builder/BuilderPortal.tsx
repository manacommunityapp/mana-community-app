import React from 'react';
import { Box, Grid, Paper, Typography, Chip, Button } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';

const BuilderPortal: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    {/* Header */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon sx={{ color: '#4F6AF5' }} /> Builder & Project Developer Portal
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Manage projects, construction phases, tower progress, inventory, and customer bookings</Typography>
      </Box>
      <Button variant="contained">Add Builder Project</Button>
    </Box>

    <Grid container spacing={2.5}>
      {[
        { name: 'Prestige Palm Meadows Phase 2', towers: '4 Towers (480 units)', progress: '78% Complete', rera: 'PRM/KA/RERA/1251', status: 'IN_PROGRESS' },
        { name: 'Embassy Springs Commercial Hub', towers: '2 Blocks (180 units)', progress: '92% Complete', rera: 'PRM/KA/RERA/9921', status: 'NEAR_COMPLETION' },
      ].map((p, i) => (
        <Grid size={{ xs: 12, md: 6 }} key={i}>
          <Paper sx={{ p: 3, borderRadius: '20px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800 }}>{p.name}</Typography>
              <Chip label={p.status} size="small" sx={{ bgcolor: 'rgba(79,106,245,0.15)', color: '#7B93FF', fontWeight: 700 }} />
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>{p.towers} • RERA: {p.rera}</Typography>
            <Typography variant="subtitle2" sx={{ color: '#10B981', fontWeight: 700 }}>Overall Progress: {p.progress}</Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  </Box>
);
export default BuilderPortal;
