import React from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';

const LeadsPage: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>Buyer Leads & Enquiries</Typography>
    <Paper sx={{ p: 3, borderRadius: '20px' }}>
      <Typography variant="body1" sx={{ color: '#fff' }}>Manage incoming leads, site visits, and buyer requirements.</Typography>
    </Paper>
  </Box>
);
export default LeadsPage;
