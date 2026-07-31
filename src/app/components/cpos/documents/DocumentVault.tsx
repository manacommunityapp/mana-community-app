import React from 'react';
import { Box, Grid, Paper, Typography, Chip, Button, Avatar, LinearProgress, Tabs, Tab, Divider } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const categories = ['All Documents', 'Sale Deed', 'Lease Agreement', 'Property Tax', 'Insurance', 'Loan Documents', 'Society NOC', 'Utilities'];
const docs = [
  { name: 'Sale Deed', property: 'A-1204', type: 'SALE_DEED', date: '15 Mar 2021', expiry: null, status: 'VERIFIED', size: '2.4 MB' },
  { name: 'Lease Agreement', property: 'A-1204', type: 'LEASE', date: '01 Jan 2024', expiry: '31 Dec 2024', status: 'EXPIRING_SOON', size: '1.1 MB' },
  { name: 'Property Tax Receipt 2025', property: 'A-1204', type: 'PROPERTY_TAX', date: '10 Apr 2025', expiry: '09 Apr 2026', status: 'VALID', size: '0.8 MB' },
  { name: 'Home Insurance Policy', property: 'B-302', type: 'INSURANCE', date: '20 Jun 2024', expiry: '19 Jun 2025', status: 'EXPIRED', size: '3.2 MB' },
  { name: 'HDFC Home Loan Sanction Letter', property: 'B-302', type: 'LOAN', date: '05 Jan 2022', expiry: null, status: 'VERIFIED', size: '5.1 MB' },
  { name: 'Society NOC for Renovation', property: 'Villa-14', type: 'NOC', date: '12 Feb 2025', expiry: '12 Aug 2025', status: 'VALID', size: '0.3 MB' },
  { name: 'Khata Certificate', property: 'Shop G-05', type: 'KHATA', date: '20 Mar 2020', expiry: null, status: 'VERIFIED', size: '1.5 MB' },
  { name: 'Electricity Bill — Q2 2025', property: 'Villa-14', type: 'UTILITY', date: '05 Jul 2025', expiry: null, status: 'VALID', size: '0.2 MB' },
];

const statusColor: Record<string, string> = { VERIFIED: '#10B981', VALID: '#4F6AF5', EXPIRING_SOON: '#F59E0B', EXPIRED: '#EF4444' };

const DocumentVault: React.FC = () => {
  const [tab, setTab] = React.useState(0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon sx={{ color: '#4F6AF5' }} /> Property Document Vault
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Secure, version-controlled document management with expiry tracking.</Typography>
        </Box>
        <Button variant="contained" startIcon={<UploadFileIcon />}>Upload Document</Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2}>
        {[
          { label: 'Total Documents', value: '4,284', color: '#4F6AF5' },
          { label: 'Expiring in 30 Days', value: '38', color: '#F59E0B' },
          { label: 'Expired', value: '12', color: '#EF4444' },
          { label: 'Pending Verification', value: '24', color: '#8B5CF6' },
        ].map((s, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Paper sx={{ p: 2.5, borderRadius: '16px', borderLeft: `4px solid ${s.color}` }}>
              <Typography variant="h5" sx={{ color: s.color, fontWeight: 800 }}>{s.value}</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Document Table */}
      <Paper sx={{ borderRadius: '20px', overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700 }}>All Property Documents</Typography>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <Box component="thead">
              <Box component="tr" sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
                {['Document Name', 'Property', 'Category', 'Date', 'Expiry', 'Status', 'Size', 'Actions'].map(h => (
                  <Box key={h} component="th" sx={{ p: 2, textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }}>{h}</Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {docs.map((d, i) => (
                <Box key={i} component="tr" sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' }, '&:not(:last-child)': { borderBottom: '1px solid rgba(255,255,255,0.04)' } }}>
                  <Box component="td" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <DescriptionIcon sx={{ color: 'rgba(79,106,245,0.6)', fontSize: '1rem' }} />
                      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>{d.name}</Typography>
                    </Box>
                  </Box>
                  <Box component="td" sx={{ p: 2 }}><Chip label={d.property} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }} /></Box>
                  <Box component="td" sx={{ p: 2 }}><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{d.type}</Typography></Box>
                  <Box component="td" sx={{ p: 2 }}><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{d.date}</Typography></Box>
                  <Box component="td" sx={{ p: 2 }}>
                    {d.expiry ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {d.status === 'EXPIRING_SOON' && <WarningAmberIcon sx={{ color: '#F59E0B', fontSize: '0.9rem' }} />}
                        <Typography variant="caption" sx={{ color: d.status === 'EXPIRED' ? '#EF4444' : d.status === 'EXPIRING_SOON' ? '#F59E0B' : 'rgba(255,255,255,0.5)' }}>{d.expiry}</Typography>
                      </Box>
                    ) : <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>—</Typography>}
                  </Box>
                  <Box component="td" sx={{ p: 2 }}><Chip label={d.status.replace('_', ' ')} size="small" sx={{ bgcolor: `${statusColor[d.status]}15`, color: statusColor[d.status], fontWeight: 700, fontSize: '0.7rem' }} /></Box>
                  <Box component="td" sx={{ p: 2 }}><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>{d.size}</Typography></Box>
                  <Box component="td" sx={{ p: 2 }}>
                    <Button size="small" sx={{ color: '#4F6AF5', fontSize: '0.75rem', minWidth: 'auto' }}>View</Button>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};
export default DocumentVault;
