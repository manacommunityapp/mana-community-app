import React from 'react';
import { Box, Button } from '@mui/material';
import { useNavigate, useLocation } from 'react-router';

const CRM_TABS = [
  { label: 'Pipeline',  path: '/cpos/crm' },
  { label: 'Leads',     path: '/cpos/crm/leads' },
  { label: 'Analytics', path: '/cpos/crm/analytics' },
  { label: 'Brokers',   path: '/cpos/crm/brokers' },
];

export const CRMNav: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
      {CRM_TABS.map(tab => {
        const active = tab.path === '/cpos/crm'
          ? pathname === '/cpos/crm'
          : pathname.startsWith(tab.path);
        return (
          <Button
            key={tab.path}
            size="small"
            onClick={() => navigate(tab.path)}
            sx={{
              borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: '0.8rem',
              px: 2, py: 0.75,
              bgcolor: active ? '#4F6AF5' : 'rgba(255,255,255,0.05)',
              color: active ? '#fff' : 'rgba(255,255,255,0.55)',
              '&:hover': { bgcolor: active ? '#3a55d4' : 'rgba(255,255,255,0.08)' },
            }}
          >
            {tab.label}
          </Button>
        );
      })}
    </Box>
  );
};
