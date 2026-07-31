import React from 'react';
import { useNavigate } from 'react-router';
import { Box, Paper, Typography, Grid, TextField, MenuItem, Button, Divider } from '@mui/material';

const PropertyCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Property Digital Twin created successfully!');
    navigate('/app/properties');
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>Register New Property Digital Twin</Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Create a permanent digital identity for a property in CPOS</Typography>
      </Box>

      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4, borderRadius: '24px' }}>
        <Typography variant="h6" sx={{ color: '#4F6AF5', fontWeight: 800, mb: 2 }}>1. Basic Identity & Location</Typography>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField select fullWidth label="Property Type" defaultValue="APARTMENT">
              <MenuItem value="APARTMENT">Apartment</MenuItem>
              <MenuItem value="VILLA">Villa</MenuItem>
              <MenuItem value="COMMERCIAL_OFFICE">Commercial Office</MenuItem>
              <MenuItem value="RETAIL_SHOP">Retail Shop</MenuItem>
              <MenuItem value="PARKING">Parking Slot</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth label="Unit / Flat Number" placeholder="e.g. A-101" required />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth label="Tower / Building Name" placeholder="e.g. North Tower" />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth label="Floor Number" type="number" defaultValue="1" />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField select fullWidth label="Facing Direction" defaultValue="NORTH_EAST">
              <MenuItem value="NORTH">North</MenuItem>
              <MenuItem value="SOUTH">South</MenuItem>
              <MenuItem value="EAST">East</MenuItem>
              <MenuItem value="WEST">West</MenuItem>
              <MenuItem value="NORTH_EAST">North-East</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth label="Survey / Khata Number" placeholder="e.g. KH-99210" />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3.5, borderColor: 'rgba(255,255,255,0.06)' }} />

        <Typography variant="h6" sx={{ color: '#10B981', fontWeight: 800, mb: 2 }}>2. Area Measurements & Configuration</Typography>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth label="Carpet Area (sq ft)" type="number" placeholder="e.g. 1450" required />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth label="Built-up Area (sq ft)" type="number" placeholder="e.g. 1650" />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth label="Super Built-up Area (sq ft)" type="number" placeholder="e.g. 1950" />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth label="Bedrooms" type="number" defaultValue="3" />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth label="Bathrooms" type="number" defaultValue="3" />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth label="Covered Parking Slots" type="number" defaultValue="1" />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3.5, borderColor: 'rgba(255,255,255,0.06)' }} />

        <Typography variant="h6" sx={{ color: '#F59E0B', fontWeight: 800, mb: 2 }}>3. Financial & Initial Status</Typography>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label="Estimated Market Value (₹)" placeholder="e.g. 14500000" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label="Monthly Maintenance Charge (₹)" placeholder="e.g. 4500" />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
          <Button variant="outlined" onClick={() => navigate('/app/properties')}>Cancel</Button>
          <Button type="submit" variant="contained" size="large" sx={{ px: 4 }}>Register Digital Twin</Button>
        </Box>
      </Paper>
    </Box>
  );
};
export default PropertyCreatePage;
