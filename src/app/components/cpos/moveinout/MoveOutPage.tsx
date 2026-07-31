import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

const MoveOutPage: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>Move-Out & Exit Automation</Typography>
    <Paper sx={{ p: 3, borderRadius: '20px' }}>
      <Typography variant="body1" sx={{ color: '#fff' }}>Final inspection workflow, damage assessment, security deposit refund, and RFID access deactivation.</Typography>
    </Paper>
  </Box>
);
export default MoveOutPage;
