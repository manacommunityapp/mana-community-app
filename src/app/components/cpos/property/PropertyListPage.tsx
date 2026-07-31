import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, Grid, Paper, Typography, TextField, Button, Chip, Avatar, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ApartmentIcon from '@mui/icons-material/Apartment';
import AddIcon from '@mui/icons-material/Add';
import BedIcon from '@mui/icons-material/Bed';
import BathtubIcon from '@mui/icons-material/Bathtub';
import SquareFootIcon from '@mui/icons-material/SquareFoot';

const properties = [
  { code: 'CPOS-MEADOWS-101', type: 'APARTMENT', status: 'OWNER_OCCUPIED', unit: 'A-101', beds: 3, baths: 3, area: 1650, value: '₹1.45 Cr', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80' },
  { code: 'CPOS-MEADOWS-102', type: 'APARTMENT', status: 'TENANT_OCCUPIED', unit: 'A-102', beds: 2, baths: 2, area: 1200, value: '₹1.10 Cr', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80' },
  { code: 'CPOS-MEADOWS-V01', type: 'VILLA', status: 'OWNER_OCCUPIED', unit: 'Villa-01', beds: 4, baths: 5, area: 3200, value: '₹3.80 Cr', image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=400&q=80' },
  { code: 'CPOS-MEADOWS-201', type: 'APARTMENT', status: 'VACANT', unit: 'B-201', beds: 3, baths: 3, area: 1580, value: '₹1.35 Cr', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80' },
  { code: 'CPOS-MEADOWS-S05', type: 'RETAIL_SHOP', status: 'TENANT_OCCUPIED', unit: 'Shop G-05', beds: 0, baths: 1, area: 850, value: '₹95L', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80' },
  { code: 'CPOS-MEADOWS-P01', type: 'PENTHOUSE', status: 'OWNER_OCCUPIED', unit: 'PH-01', beds: 4, baths: 4, area: 2800, value: '₹2.90 Cr', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=400&q=80' },
  { code: 'CPOS-MEADOWS-202', type: 'APARTMENT', status: 'VACANT', unit: 'B-202', beds: 2, baths: 2, area: 1150, value: '₹1.05 Cr', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80' },
  { code: 'CPOS-MEADOWS-OFF1', type: 'COMMERCIAL_OFFICE', status: 'TENANT_OCCUPIED', unit: 'Off-301', beds: 0, baths: 2, area: 2100, value: '₹2.20 Cr', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80' },
];

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  OWNER_OCCUPIED: { bg: 'rgba(16,185,129,0.15)', color: '#10B981', label: 'Owner Occupied' },
  TENANT_OCCUPIED: { bg: 'rgba(79,106,245,0.15)', color: '#7B93FF', label: 'Tenant Occupied' },
  VACANT: { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B', label: 'Vacant' },
};

const PropertyListPage: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const filtered = properties.filter(p => {
    if (filter !== 'ALL' && p.type !== filter) return false;
    if (search && !p.code.toLowerCase().includes(search.toLowerCase()) && !p.unit.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>Property Digital Twin Master</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Manage and explore permanent digital identities for every property in your community</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/app/properties/new')}>Register Property</Button>
      </Box>

      {/* Filters & Search */}
      <Paper sx={{ p: 2, borderRadius: '16px', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search by Property Code or Unit..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 250 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'rgba(255,255,255,0.4)' }} /></InputAdornment> } }}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          {['ALL', 'APARTMENT', 'VILLA', 'RETAIL_SHOP', 'COMMERCIAL_OFFICE', 'PENTHOUSE'].map(t => (
            <Chip
              key={t}
              label={t.replace('_', ' ')}
              onClick={() => setFilter(t)}
              sx={{
                bgcolor: filter === t ? '#4F6AF5' : 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontWeight: 750,
                '&:hover': { bgcolor: filter === t ? '#435FD5' : 'rgba(255,255,255,0.08)' },
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Grid */}
      <Grid container spacing={2.5}>
        {filtered.map(p => {
          const s = statusColors[p.status] || { bg: 'rgba(255,255,255,0.1)', color: '#fff', label: p.status };
          return (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={p.code}>
              <Paper sx={{ overflow: 'hidden', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                <Box sx={{ height: 160, width: '100%', position: 'relative', overflow: 'hidden' }}>
                  <Box component="img" src={p.image} alt={p.unit} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <Chip label={s.label} size="small" sx={{ position: 'absolute', top: 12, right: 12, bgcolor: s.bg, color: s.color, fontWeight: 700, backdropFilter: 'blur(8px)' }} />
                  <Chip label={p.type} size="small" sx={{ position: 'absolute', bottom: 12, left: 12, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', fontWeight: 600 }} />
                </Box>
                <Box sx={{ p: 2.5 }}>
                  <Typography variant="caption" sx={{ color: '#7B93FF', fontWeight: 700, display: 'block' }}>{p.code}</Typography>
                  <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800, mb: 1 }}>{p.unit}</Typography>

                  <Box sx={{ display: 'flex', gap: 2, mb: 2, color: 'rgba(255,255,255,0.6)' }}>
                    {p.beds > 0 && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><BedIcon fontSize="small" /><Typography variant="caption">{p.beds} Beds</Typography></Box>}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><BathtubIcon fontSize="small" /><Typography variant="caption">{p.baths} Baths</Typography></Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><SquareFootIcon fontSize="small" /><Typography variant="caption">{p.area} sqft</Typography></Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block' }}>Market Value</Typography>
                      <Typography variant="subtitle1" sx={{ color: '#10B981', fontWeight: 800 }}>{p.value}</Typography>
                    </Box>
                    <Button size="small" variant="outlined" sx={{ borderRadius: '10px' }} onClick={() => navigate(`/app/properties/${p.code}`)}>
                      Digital Twin
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};
export default PropertyListPage;
