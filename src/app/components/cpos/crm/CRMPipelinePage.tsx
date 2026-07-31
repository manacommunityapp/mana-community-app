import React from 'react';
import { Box, Paper, Typography, Chip, Avatar } from '@mui/material';

const stages = ['NEW', 'CONTACTED', 'QUALIFIED', 'SITE_VISIT', 'NEGOTIATION', 'CLOSED'];
const stageColors: Record<string, string> = {
  NEW: '#8B5CF6', CONTACTED: '#4F6AF5', QUALIFIED: '#06B6D4', SITE_VISIT: '#F59E0B', NEGOTIATION: '#EC4899', CLOSED: '#10B981'
};

const cards: Record<string, any[]> = {
  NEW: [
    { name: 'Arun Prakash', phone: '+91 98111 22334', budget: '₹1.2 Cr', type: '3 BHK' },
    { name: 'Kavita Menon', phone: '+91 97222 33445', budget: '₹85L', type: '2 BHK' },
  ],
  CONTACTED: [
    { name: 'Deepak Joshi', phone: '+91 96333 44556', budget: '₹2.5 Cr', type: 'Villa' },
  ],
  QUALIFIED: [
    { name: 'Sanjay Reddy', phone: '+91 95444 55667', budget: '₹1.6 Cr', type: '3 BHK' },
  ],
  SITE_VISIT: [
    { name: 'Rohan Gupta', phone: '+91 94555 66778', budget: '₹3.2 Cr', type: 'Penthouse' },
  ],
  NEGOTIATION: [
    { name: 'Meera Nambiar', phone: '+91 93666 77889', budget: '₹1.4 Cr', type: '3 BHK' },
  ],
  CLOSED: [
    { name: 'Vikram Seth', phone: '+91 92777 88990', budget: '₹1.8 Cr', type: 'Commercial' },
  ],
};

const CRMPipelinePage: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <Box>
      <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>Property CRM Sales Pipeline</Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Drag-and-drop lead management from initial enquiry to final registration</Typography>
    </Box>

    <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
      {stages.map(s => (
        <Paper key={s} sx={{ width: 280, minWidth: 280, p: 2, borderRadius: '16px', bgcolor: '#0D1526', borderTop: `4px solid ${stageColors[s]}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700 }}>{s.replace('_', ' ')}</Typography>
            <Chip label={(cards[s] || []).length} size="small" sx={{ bgcolor: `${stageColors[s]}20`, color: stageColors[s], fontWeight: 800 }} />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {(cards[s] || []).map((c, i) => (
              <Box key={i} sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700 }}>{c.name}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>{c.phone}</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Chip label={c.type} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', fontSize: '0.65rem' }} />
                  <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700 }}>{c.budget}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      ))}
    </Box>
  </Box>
);
export default CRMPipelinePage;
