import React from 'react';
import { Box, Grid, Paper, Typography, Chip, Button } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const AdminPortal: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AdminPanelSettingsIcon sx={{ color: '#4F6AF5' }} /> CPOS Super Admin Command Center
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Manage multi-tenant SaaS subscriptions, community configurations, RBAC, and system health</Typography>
      </Box>
    </Box>

    <Grid container spacing={2.5}>
      {[
        { label: 'Active Tenant Communities', val: '142', color: '#4F6AF5' },
        { label: 'Total Digital Twins Managed', val: '148,200', color: '#10B981' },
        { label: 'Platform ARR', val: '₹14.8 Cr', color: '#F59E0B' },
        { label: 'API Health & Uptime', val: '99.98%', color: '#06B6D4' },
      ].map((s, i) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
          <Paper sx={{ p: 2.5, borderRadius: '16px', borderTop: `4px solid ${s.color}` }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</Typography>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800, mt: 0.5 }}>{s.val}</Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  </Box>
);
export default AdminPortal;
