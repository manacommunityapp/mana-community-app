import React from 'react';
import { Box, Paper, Typography, Chip, Button } from '@mui/material';

const LeasePage: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>Lease Agreements Directory</Typography>
    <Paper sx={{ p: 3, borderRadius: '20px' }}>
      <Typography variant="body1" sx={{ color: '#fff' }}>Digital lease agreements, tenant background checks, and deposit records.</Typography>
    </Paper>
  </Box>
);
export default LeasePage;
