import React from 'react';
import { Box, Paper, Typography, Chip, Button } from '@mui/material';

const ListingsPage: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>Property Listings Directory</Typography>
    <Paper sx={{ p: 3, borderRadius: '20px' }}>
      <Typography variant="body1" sx={{ color: '#fff' }}>Listings table with active property sale and rent listings.</Typography>
    </Paper>
  </Box>
);
export default ListingsPage;
