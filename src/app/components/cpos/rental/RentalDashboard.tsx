import React from 'react';
import { Box, Grid, Paper, Typography, Chip, Button } from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const RentalDashboard: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AttachMoneyIcon sx={{ color: '#10B981' }} /> Rental & Lease Management Engine
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Manage 1,180 active leases, digital e-signatures, security deposits, and auto-rent collection</Typography>
      </Box>
      <Button variant="contained">Create Digital Lease</Button>
    </Box>

    <Grid container spacing={2.5}>
      {[
        { label: 'Active Leases', val: '1,180', color: '#4F6AF5' },
        { label: 'Monthly Rent Collected', val: '₹1.84 Cr', color: '#10B981' },
        { label: 'Collection Rate', val: '96.2%', color: '#06B6D4' },
        { label: 'Leases Expiring (30 days)', val: '18', color: '#F59E0B' },
      ].map((s, i) => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <Paper sx={{ p: 2.5, borderRadius: '16px', borderTop: `4px solid ${s.color}` }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</Typography>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800, mt: 0.5 }}>{s.val}</Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  </Box>
);
export default RentalDashboard;
