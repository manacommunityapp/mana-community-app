import React from 'react';
import { Box, Paper, Typography, Chip, Button, Stepper, Step, StepLabel } from '@mui/material';
import MoveUpIcon from '@mui/icons-material/MoveUp';

const steps = ['Move-In Request', 'Document Verification', 'Parking & RFID Assignment', 'Security Clearance', 'Community Access Activated'];

const MoveInPage: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <Box>
      <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
        <MoveUpIcon sx={{ color: '#10B981' }} /> Move-In Automation Workflow
      </Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Automated resident account creation, RFID issuance, parking allocation, and gate security notification</Typography>
    </Box>

    <Paper sx={{ p: 4, borderRadius: '24px' }}>
      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 3 }}>Active Move-In Checklist: Flat B-302 (Suresh Kumar)</Typography>
      <Stepper activeStep={3} alternativeLabel sx={{ '& .MuiStepLabel-label': { color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }, '& .Mui-active': { color: '#4F6AF5' }, '& .Mui-completed': { color: '#10B981' } }}>
        {steps.map(label => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>
    </Paper>
  </Box>
);
export default MoveInPage;
