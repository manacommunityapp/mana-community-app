import React from 'react';
import { Box, Grid, Paper, Typography, Chip, Button, Avatar } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AddIcon from '@mui/icons-material/Add';

const SalesDashboard: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUpIcon sx={{ color: '#10B981' }} /> Property Sales & Listings Engine
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Manage property listings, buyer leads, site visits, offers, and digital sale agreements</Typography>
      </Box>
      <Button variant="contained" startIcon={<AddIcon />}>Post Property for Sale</Button>
    </Box>

    <Grid container spacing={2.5}>
      {[
        { label: 'Active Listings', val: '48', color: '#4F6AF5' },
        { label: 'Buyer Leads', val: '127', color: '#10B981' },
        { label: 'Site Visits Scheduled', val: '23', color: '#F59E0B' },
        { label: 'Offers Under Negotiation', val: '9', color: '#8B5CF6' },
        { label: 'Deals Closed This Month', val: '7 (₹14.2 Cr)', color: '#06B6D4' },
      ].map((s, i) => (
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={i}>
          <Paper sx={{ p: 2.5, borderRadius: '16px', borderTop: `4px solid ${s.color}` }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</Typography>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800, mt: 0.5 }}>{s.val}</Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  </Box>
);
export default SalesDashboard;
