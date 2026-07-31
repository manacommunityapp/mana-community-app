import React from 'react';
import { Box, Grid, Paper, Typography, Chip, Button, Avatar } from '@mui/material';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import HistoryIcon from '@mui/icons-material/History';
import AddIcon from '@mui/icons-material/Add';

const OwnershipPage: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentIndIcon sx={{ color: '#4F6AF5' }} /> Property Ownership Engine
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Track complete ownership history, joint owners, NRI deeds, and transfer logs</Typography>
      </Box>
      <Button variant="contained" startIcon={<AddIcon />}>Record Ownership Transfer</Button>
    </Box>

    <Grid container spacing={3}>
      <Grid item xs={12} md={7}>
        <Paper sx={{ p: 3, borderRadius: '20px' }}>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>Current Active Owners</Typography>
          {[
            { name: 'Rajesh Sharma', type: 'INDIVIDUAL', share: '100%', date: '15 Mar 2021', price: '₹1.25 Cr', unit: 'Unit A-101' },
            { name: 'Priya & Vikram Malhotra', type: 'JOINT', share: '50% / 50%', date: '20 Jun 2022', price: '₹2.10 Cr', unit: 'Villa-04' },
            { name: 'Sunil Mehta (NRI)', type: 'NRI_OWNER', share: '100%', date: '10 Jan 2023', price: '₹1.80 Cr', unit: 'Unit B-802' },
          ].map((o, i) => (
            <Box key={i} sx={{ p: 2, borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.02)', mb: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: '#4F6AF5' }}>{o.name.charAt(0)}</Avatar>
                  <Box>
                    <Typography variant="body1" sx={{ color: '#fff', fontWeight: 700 }}>{o.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{o.unit}</Typography>
                  </Box>
                </Box>
                <Chip label={o.type} size="small" sx={{ bgcolor: 'rgba(79,106,245,0.15)', color: '#7B93FF', fontWeight: 700 }} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Share: {o.share}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Purchase: {o.price} on {o.date}</Typography>
              </Box>
            </Box>
          ))}
        </Paper>
      </Grid>

      <Grid item xs={12} md={5}>
        <Paper sx={{ p: 3, borderRadius: '20px' }}>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon sx={{ color: '#10B981' }} /> Recent Transfer Deed Log
          </Typography>
          {[
            { event: 'Resale Transfer', unit: 'Unit A-101', date: 'May 2021', deed: 'DEED-9921' },
            { event: 'Gift Deed', unit: 'Villa-04', date: 'Jun 2022', deed: 'GIFT-8821' },
            { event: 'Inheritance Transfer', unit: 'Unit C-301', date: 'Nov 2023', deed: 'INH-1029' },
          ].map((t, i) => (
            <Box key={i} sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.02)', mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700 }}>{t.event} — {t.unit}</Typography>
              <Typography variant="caption" sx={{ color: '#10B981', display: 'block' }}>Registered: {t.date} ({t.deed})</Typography>
            </Box>
          ))}
        </Paper>
      </Grid>
    </Grid>
  </Box>
);
export default OwnershipPage;
