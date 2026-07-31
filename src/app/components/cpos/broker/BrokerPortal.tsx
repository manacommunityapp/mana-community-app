import React from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';
import PersonPinIcon from '@mui/icons-material/PersonPin';

const BrokerPortal: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
      <PersonPinIcon sx={{ color: '#F59E0B' }} /> Broker & Real Estate Agent Portal
    </Typography>
    <Paper sx={{ p: 3, borderRadius: '20px' }}>
      <Typography variant="body1" sx={{ color: '#fff' }}>Broker profile management, property allocation, lead assignment, and commission tracking.</Typography>
    </Paper>
  </Box>
);
export default BrokerPortal;
