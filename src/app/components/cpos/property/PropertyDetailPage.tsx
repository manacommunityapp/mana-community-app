import React, { useState } from 'react';
import { useParams } from 'react-router';
import { Box, Grid, Paper, Typography, Chip, Tabs, Tab, Button, Avatar, Divider, LinearProgress } from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import TimelineIcon from '@mui/icons-material/Timeline';
import SecurityIcon from '@mui/icons-material/Security';
import DescriptionIcon from '@mui/icons-material/Description';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SmartToyIcon from '@mui/icons-material/SmartToy';

const PropertyDetailPage: React.FC = () => {
  const { propertyCode } = useParams();
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, borderRadius: '20px', background: 'linear-gradient(135deg, rgba(79,106,245,0.1) 0%, rgba(16,185,129,0.05) 100%)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center' }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: '#4F6AF5', borderRadius: '16px' }}>
              <ApartmentIcon fontSize="large" />
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>Unit A-101 (3 BHK Apartment)</Typography>
                <Chip label="ACTIVE" size="small" sx={{ bgcolor: 'rgba(16,185,129,0.2)', color: '#10B981', fontWeight: 700 }} />
                <Chip label="OWNER OCCUPIED" size="small" sx={{ bgcolor: 'rgba(79,106,245,0.2)', color: '#7B93FF', fontWeight: 700 }} />
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Permanent Digital Identity: <strong style={{ color: '#7B93FF' }}>{propertyCode || 'CPOS-MEADOWS-101'}</strong> • Tower A, Floor 1, Facing North-East
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button variant="outlined" sx={{ borderRadius: '12px' }}>Download Health Audit</Button>
            <Button variant="contained" sx={{ borderRadius: '12px' }}>Update Property Digital Twin</Button>
          </Box>
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 3, borderTop: '1px solid rgba(255,255,255,0.06)', '& .MuiTab-root': { color: 'rgba(255,255,255,0.6)', fontWeight: 700, minHeight: 48 }, '& .Mui-selected': { color: '#7B93FF' } }}>
          <Tab label="Digital Twin Overview" />
          <Tab label="Ownership History" />
          <Tab label="Occupancy & Residents" />
          <Tab label="Document Vault" />
          <Tab label="Financial Health" />
          <Tab label="AI Insights" />
        </Tabs>
      </Paper>

      {/* Tab 0 Content */}
      {tab === 0 && (
        <Grid container spacing={3}>
          {/* Main Details */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Grid container spacing={2}>
              {[
                { label: 'Carpet Area', val: '1,650 sq.ft' },
                { label: 'Super Built-up', val: '2,050 sq.ft' },
                { label: 'Bedrooms / Baths', val: '3 BHK / 3 Baths' },
                { label: 'Covered Parking', val: '2 Slots (P-101, P-102)' },
                { label: 'Construction Status', val: 'Ready Possession (2021)' },
                { label: 'Furnished Status', val: 'Fully Furnished' },
                { label: 'Property Tax PID', val: 'PID-99201482' },
                { label: 'Current Valuation', val: '₹1.45 Cr' },
              ].map((item, i) => (
                <Grid size={{ xs: 6, sm: 3 }} key={i}>
                  <Paper sx={{ p: 2, borderRadius: '16px', bgcolor: '#0D1526' }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block' }}>{item.label}</Typography>
                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700, mt: 0.5 }}>{item.val}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Lifecycle Timeline */}
            <Paper sx={{ p: 3, borderRadius: '20px', mt: 3 }}>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800, mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimelineIcon sx={{ color: '#4F6AF5' }} /> Complete Permanent Property Lifecycle
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'relative', pl: 2, '&::before': { content: '""', position: 'absolute', left: 8, top: 12, bottom: 12, width: 2, bgcolor: 'rgba(79,106,245,0.3)' } }}>
                {[
                  { title: 'Property Digital Twin Registered', date: 'Jan 2019', desc: 'Pre-construction registration by Builder (Prestige Group).' },
                  { title: 'First Sale & Booking', date: 'Mar 2019', desc: 'Booked by original owner Rajesh Sharma (Agreement No: AG-2019-881).' },
                  { title: 'Construction Completed & Possession', date: 'Nov 2021', desc: 'Occupancy Certificate issued (OC-88219). Possession handed over.' },
                  { title: 'Owner Occupied Move-In', date: 'Dec 2021', desc: 'Primary resident move-in verified & RFID tags issued.' },
                  { title: 'Rented to Tenant (Suresh Kumar)', date: 'May 2023', desc: 'Lease agreement signed for 24 months @ ₹45,000/mo.' },
                  { title: 'Current Status: Owner Re-Occupied', date: 'May 2025', desc: 'Owner moved back after lease completion. Fully active in CPOS.' },
                ].map((ev, idx) => (
                  <Box key={idx} sx={{ position: 'relative', pl: 3 }}>
                    <Box sx={{ position: 'absolute', left: -19, top: 4, width: 12, height: 12, borderRadius: '50%', bgcolor: '#4F6AF5', border: '3px solid #0D1526' }} />
                    <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700 }}>{ev.title}</Typography>
                    <Typography variant="caption" sx={{ color: '#7B93FF', fontWeight: 600, display: 'block' }}>{ev.date}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>{ev.desc}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* AI Health Score & Quick Info */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, borderRadius: '20px', background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(79,106,245,0.05) 100%)', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SmartToyIcon sx={{ color: '#10B981' }} />
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800 }}>Property Health Score</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                <Typography variant="h2" sx={{ color: '#10B981', fontWeight: 900 }}>87</Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)' }}>/ 100</Typography>
              </Box>
              <LinearProgress variant="determinate" value={87} sx={{ mb: 2, '& .MuiLinearProgress-bar': { bgcolor: '#10B981' } }} />

              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.08)' }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>AI Valuation Confidence</Typography>
                  <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700 }}>94% (High)</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Predicted 1-Yr Appreciation</Typography>
                  <Typography variant="caption" sx={{ color: '#7B93FF', fontWeight: 700 }}>+7.8% (₹1.56 Cr)</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Expected Rental Yield</Typography>
                  <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 700 }}>6.2% / year</Typography>
                </Box>
              </Box>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: '20px' }}>
              <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>Current Primary Resident</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#4F6AF5', width: 48, height: 48 }}>RS</Avatar>
                <Box>
                  <Typography variant="body1" sx={{ color: '#fff', fontWeight: 700 }}>Rajesh Sharma</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>Primary Owner Occupant</Typography>
                  <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>RFID Tag: RFID-99201</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};
export default PropertyDetailPage;
