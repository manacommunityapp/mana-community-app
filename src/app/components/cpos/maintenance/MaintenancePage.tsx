import React from 'react';
import { Box, Grid, Paper, Typography, Chip, Button } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';

const MaintenancePage: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <BuildIcon sx={{ color: '#EF4444' }} /> Property Maintenance & Helpdesk
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Repair history, AMC contracts, vendor performance, and warranty tracking linked to property digital twins</Typography>
      </Box>
      <Button variant="contained">Create Service Request</Button>
    </Box>

    <Grid container spacing={2.5}>
      {[
        { title: 'Plumbing Seepage in Master Bath', unit: 'Unit A-101', priority: 'HIGH', status: 'IN_PROGRESS', vendor: 'Apex Plumbing Works' },
        { title: 'AC Compressor Noise', unit: 'Villa-04', priority: 'MEDIUM', status: 'OPEN', vendor: 'Cooling Solutions Ltd' },
        { title: 'Electrical Switchboard Sparking', unit: 'Unit C-302', priority: 'CRITICAL', status: 'ASSIGNED', vendor: 'Spark Electricians' },
      ].map((m, i) => (
        <Grid size={{ xs: 12, md: 4 }} key={i}>
          <Paper sx={{ p: 3, borderRadius: '20px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Chip label={m.priority} size="small" sx={{ bgcolor: m.priority === 'CRITICAL' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)', color: m.priority === 'CRITICAL' ? '#EF4444' : '#F59E0B', fontWeight: 800 }} />
              <Chip label={m.status} size="small" sx={{ bgcolor: 'rgba(79,106,245,0.15)', color: '#7B93FF', fontWeight: 700 }} />
            </Box>
            <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700, mt: 1 }}>{m.title}</Typography>
            <Typography variant="caption" sx={{ color: '#7B93FF', display: 'block' }}>{m.unit}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mt: 1 }}>Vendor: {m.vendor}</Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  </Box>
);
export default MaintenancePage;
