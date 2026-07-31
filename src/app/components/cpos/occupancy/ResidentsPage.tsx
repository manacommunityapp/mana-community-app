import React from 'react';
import { Box, Paper, Typography, Chip, TextField, InputAdornment, Avatar } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';

const residents = [
  { name: 'Rajesh Sharma', unit: 'A-101', type: 'OWNER', phone: '+91 98765 43210', moveIn: 'Dec 2021', rfid: 'RFID-99201', vehicle: 'KA-01-MJ-8821 (Car)' },
  { name: 'Suresh Kumar', unit: 'B-302', type: 'TENANT', phone: '+91 98123 45678', moveIn: 'May 2023', rfid: 'RFID-88102', vehicle: 'KA-05-AB-1234 (Car)' },
  { name: 'Anita Verma', unit: 'Villa-04', type: 'OWNER', phone: '+91 97654 32109', moveIn: 'Jun 2022', rfid: 'RFID-77210', vehicle: 'KA-03-EV-9900 (EV Car)' },
  { name: 'Vikram Malhotra', unit: 'C-801', type: 'TENANT', phone: '+91 99887 66554', moveIn: 'Jan 2024', rfid: 'RFID-66100', vehicle: 'KA-04-XY-5544 (Bike)' },
];

const ResidentsPage: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon sx={{ color: '#4F6AF5' }} /> Community Resident Directory
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Digital identity, RFID cards, vehicle registration, and move-in logs for all residents</Typography>
      </Box>
    </Box>

    <Paper sx={{ p: 2, borderRadius: '16px' }}>
      <TextField placeholder="Search by name, flat number, phone, or RFID..." fullWidth slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'rgba(255,255,255,0.4)' }} /></InputAdornment> } }} />
    </Paper>

    <Paper sx={{ borderRadius: '20px', overflow: 'hidden' }}>
      <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
        <Box component="thead">
          <Box component="tr" sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
            {['Resident Name', 'Flat Number', 'Role Type', 'Phone Number', 'Move-In Date', 'RFID Token', 'Registered Vehicle'].map(h => (
              <Box key={h} component="th" sx={{ p: 2, textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</Box>
            ))}
          </Box>
        </Box>
        <Box component="tbody">
          {residents.map((r, i) => (
            <Box key={i} component="tr" sx={{ '&:not(:last-child)': { borderBottom: '1px solid rgba(255,255,255,0.04)' } }}>
              <Box component="td" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: r.type === 'OWNER' ? '#10B981' : '#7B93FF', width: 32, height: 32, fontSize: '0.8rem' }}>{r.name.charAt(0)}</Avatar>
                  <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>{r.name}</Typography>
                </Box>
              </Box>
              <Box component="td" sx={{ p: 2 }}><Chip label={r.unit} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#fff', fontWeight: 700 }} /></Box>
              <Box component="td" sx={{ p: 2 }}><Chip label={r.type} size="small" sx={{ bgcolor: r.type === 'OWNER' ? 'rgba(16,185,129,0.15)' : 'rgba(79,106,245,0.15)', color: r.type === 'OWNER' ? '#10B981' : '#7B93FF', fontWeight: 700 }} /></Box>
              <Box component="td" sx={{ p: 2 }}><Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>{r.phone}</Typography></Box>
              <Box component="td" sx={{ p: 2 }}><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{r.moveIn}</Typography></Box>
              <Box component="td" sx={{ p: 2 }}><Typography variant="caption" sx={{ color: '#7B93FF', fontWeight: 700 }}>{r.rfid}</Typography></Box>
              <Box component="td" sx={{ p: 2 }}><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>{r.vehicle}</Typography></Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  </Box>
);
export default ResidentsPage;
