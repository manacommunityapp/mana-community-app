import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Chip, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControlLabel,
  Switch, Tabs, Tab, MenuItem, IconButton, Tooltip
} from '@mui/material';
import { toast } from 'sonner';
import {
  carpoolService,
  type CarpoolRide,
  type CreateRideRequest,
  type BookRideRequest,
} from '../../../services/mobility/carpoolService';

export const CarpoolHubView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'FIND' | 'OFFER' | 'MY_RIDES'>('FIND');
  const [rides, setRides] = useState<CarpoolRide[]>([]);
  const [searchDest, setSearchDest] = useState('');
  const [ladiesOnlyFilter, setLadiesOnlyFilter] = useState(false);
  const [loading, setLoading] = useState(true);

  // Booking modal
  const [selectedRideForBook, setSelectedRideForBook] = useState<CarpoolRide | null>(null);
  const [bookSeats, setBookSeats] = useState(1);
  const [bookNotes, setBookNotes] = useState('');

  // Offer ride form
  const [offerForm, setOfferForm] = useState<CreateRideRequest>({
    origin: 'Mana Uber Verde Main Gate',
    destination: 'EcoSpace Business Park, Outer Ring Road',
    waypoints: ['Sarjapur Signal', 'Bellandur Flyover'],
    departureDate: new Date().toISOString().split('T')[0],
    departureTime: '08:30 AM',
    totalSeats: 3,
    costPerSeat: 80,
    vehicleModel: 'Honda City (White)',
    vehiclePlate: 'KA-01-MJ-1234',
    ladiesOnly: false,
    notes: 'Leaving on time. AC available.',
  });

  const loadRides = async () => {
    try {
      setLoading(true);
      const data = await carpoolService.listRides({
        destination: searchDest || undefined,
        ladiesOnly: ladiesOnlyFilter || undefined,
      });
      setRides(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRides();
  }, [searchDest, ladiesOnlyFilter]);

  const handleBookSeat = async () => {
    if (!selectedRideForBook) return;
    try {
      await carpoolService.bookSeat(selectedRideForBook.id, {
        seats: bookSeats,
        notes: bookNotes,
      });
      toast.success(`Successfully booked ${bookSeats} seat(s) with ${selectedRideForBook.driverName}!`);
      setSelectedRideForBook(null);
      setBookSeats(1);
      setBookNotes('');
      await loadRides();
    } catch {
      toast.error('Failed to book seat');
    }
  };

  const handleCreateOffer = async () => {
    if (!offerForm.destination || !offerForm.departureTime) {
      toast.error('Please enter destination and departure time');
      return;
    }
    try {
      const created = await carpoolService.createRide(offerForm);
      toast.success('Your carpool ride has been posted to society neighbors!');
      setRides(prev => [created, ...prev]);
      setActiveTab('FIND');
    } catch {
      toast.error('Failed to post ride');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header Banner */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Society Carpool & Commute Hub
            </Typography>
            <Chip label="COMMUNITY COMMUTE" size="small" sx={{ bgcolor: 'rgba(16,185,129,0.15)', color: '#10B981', fontWeight: 800, fontSize: '0.65rem' }} />
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
            Share daily office rides with verified neighbors, cut carbon footprint, and save commute costs
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            onClick={() => setActiveTab('OFFER')}
            sx={{ bgcolor: '#4F6AF5', borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
          >
            🚗 Offer a Ride
          </Button>
        </Box>
      </Box>

      {/* Tabs Navigation */}
      <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.6)', textTransform: 'none', fontWeight: 700, fontSize: '0.9rem' },
            '& .Mui-selected': { color: '#4F6AF5 !important' },
            '& .MuiTabs-indicator': { bgcolor: '#4F6AF5' },
          }}
        >
          <Tab value="FIND" label="🔍 Find a Ride" />
          <Tab value="OFFER" label="➕ Offer a Ride" />
          <Tab value="MY_RIDES" label="📋 My Active Rides & Bookings" />
        </Tabs>
      </Box>

      {/* TAB 1: FIND A RIDE */}
      {activeTab === 'FIND' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Filters Bar */}
          <Paper sx={{ p: 2, borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.02)', display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search destination (EcoSpace, Whitefield, E-City, Indiranagar)..."
              value={searchDest}
              onChange={e => setSearchDest(e.target.value)}
              sx={{ minWidth: 320, '& .MuiInputBase-input': { color: '#fff', fontSize: '0.85rem' } }}
            />
            <FormControlLabel
              control={<Switch checked={ladiesOnlyFilter} onChange={e => setLadiesOnlyFilter(e.target.checked)} />}
              label={<Typography variant="body2" sx={{ color: '#fff' }}>👩 Ladies Only Rides</Typography>}
            />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', ml: 'auto' }}>
              Showing {rides.length} live rides from society residents
            </Typography>
          </Paper>

          {/* Rides Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
            {rides.map(r => (
              <Paper
                key={r.id}
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  bgcolor: '#0D1526',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 800 }}>
                          {r.driverName}
                        </Typography>
                        <Chip label={`★ ${r.driverRating}`} size="small" sx={{ bgcolor: 'rgba(245,158,11,0.15)', color: '#F59E0B', fontWeight: 800, fontSize: '0.65rem', height: 20 }} />
                        {r.ladiesOnly && (
                          <Chip label="Ladies Only" size="small" sx={{ bgcolor: 'rgba(236,72,153,0.15)', color: '#EC4899', fontWeight: 800, fontSize: '0.65rem', height: 20 }} />
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ color: '#7B93FF', display: 'block' }}>
                        {r.unitNumber} · {r.vehicleModel} ({r.vehiclePlate})
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" sx={{ color: '#10B981', fontWeight: 900, lineHeight: 1.1 }}>
                        ₹{r.costPerSeat}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>per seat</Typography>
                    </Box>
                  </Box>

                  {/* Route & Timing */}
                  <Box sx={{ p: 1.5, bgcolor: '#080E1C', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 800 }}>FROM:</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>{r.origin}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ color: '#4F6AF5', fontWeight: 800 }}>TO:</Typography>
                      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700 }}>{r.destination}</Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                      Via: {r.waypoints.join(' → ')}
                    </Typography>
                  </Box>

                  {r.notes && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mt: 1, fontStyle: 'italic' }}>
                      "{r.notes}"
                    </Typography>
                  )}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block' }}>
                      Departure: <strong style={{ color: '#fff' }}>{r.departureTime}</strong> ({r.departureDate})
                    </Typography>
                    <Typography variant="caption" sx={{ color: r.availableSeats > 0 ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                      {r.availableSeats} of {r.totalSeats} seats remaining
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    size="small"
                    disabled={r.availableSeats <= 0}
                    onClick={() => {
                      setSelectedRideForBook(r);
                      setBookSeats(1);
                    }}
                    sx={{ bgcolor: '#4F6AF5', borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
                  >
                    {r.availableSeats > 0 ? 'Book Seat' : 'Fully Booked'}
                  </Button>
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      )}

      {/* TAB 2: OFFER A RIDE */}
      {activeTab === 'OFFER' && (
        <Paper sx={{ p: 3, maxWidth: 650, mx: 'auto', borderRadius: '16px', bgcolor: '#0D1526', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800, mb: 2 }}>
            Offer a Carpool Ride to Society Neighbors
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Starting Pickup Point"
              fullWidth
              value={offerForm.origin}
              onChange={e => setOfferForm(prev => ({ ...prev, origin: e.target.value }))}
              sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
            />
            <TextField
              label="Primary Destination (Office / Tech Park) *"
              fullWidth
              value={offerForm.destination}
              onChange={e => setOfferForm(prev => ({ ...prev, destination: e.target.value }))}
              placeholder="e.g. EcoSpace Bellandur, Manyata Tech Park, ITPB"
              sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Departure Date"
                type="date"
                fullWidth
                value={offerForm.departureDate}
                onChange={e => setOfferForm(prev => ({ ...prev, departureDate: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
              />
              <TextField
                label="Departure Time"
                fullWidth
                value={offerForm.departureTime}
                onChange={e => setOfferForm(prev => ({ ...prev, departureTime: e.target.value }))}
                placeholder="08:30 AM"
                sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Available Seats (1 - 4)"
                type="number"
                fullWidth
                value={offerForm.totalSeats}
                onChange={e => setOfferForm(prev => ({ ...prev, totalSeats: parseInt(e.target.value, 10) || 1 }))}
                sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
              />
              <TextField
                label="Fuel Contribution per Seat (₹)"
                type="number"
                fullWidth
                value={offerForm.costPerSeat}
                onChange={e => setOfferForm(prev => ({ ...prev, costPerSeat: parseInt(e.target.value, 10) || 50 }))}
                sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Vehicle Model & Color"
                fullWidth
                value={offerForm.vehicleModel}
                onChange={e => setOfferForm(prev => ({ ...prev, vehicleModel: e.target.value }))}
                placeholder="e.g. Honda City White"
                sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
              />
              <TextField
                label="License Plate Number"
                fullWidth
                value={offerForm.vehiclePlate}
                onChange={e => setOfferForm(prev => ({ ...prev, vehiclePlate: e.target.value }))}
                placeholder="KA-01-AB-1234"
                sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
              />
            </Box>
            <FormControlLabel
              control={<Switch checked={offerForm.ladiesOnly ?? false} onChange={e => setOfferForm(prev => ({ ...prev, ladiesOnly: e.target.checked }))} />}
              label={<Typography variant="body2" sx={{ color: '#fff' }}>👩 Ladies Only Carpool (Female co-riders only)</Typography>}
            />
            <TextField
              label="Ride Notes / Pickup Instructions"
              multiline
              rows={2}
              fullWidth
              value={offerForm.notes}
              onChange={e => setOfferForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g. Leaving strictly on time from Tower B porch."
              sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
            />
            <Button
              variant="contained"
              size="large"
              onClick={handleCreateOffer}
              sx={{ bgcolor: '#4F6AF5', borderRadius: '10px', textTransform: 'none', fontWeight: 800, mt: 1 }}
            >
              Post Carpool Ride
            </Button>
          </Box>
        </Paper>
      )}

      {/* TAB 3: MY RIDES */}
      {activeTab === 'MY_RIDES' && (
        <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: '#0D1526', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800, mb: 2 }}>
            My Active Rides & Reservations
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Paper sx={{ p: 2, bgcolor: '#080E1C', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Chip label="CONFIRMED" size="small" sx={{ bgcolor: 'rgba(16,185,129,0.15)', color: '#10B981', fontWeight: 800, fontSize: '0.65rem', mb: 0.5 }} />
                <Typography variant="body1" sx={{ color: '#fff', fontWeight: 700 }}>
                  Ride with Arun Venkat · EcoSpace Business Park
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                  Today at 08:30 AM · Hyundai Creta (KA-03-NB-8821) · 1 Seat Reserved (₹80)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" component="a" href="tel:+919845189201" sx={{ color: '#4F6AF5' }}>Call Driver</Button>
                <Button size="small" sx={{ color: '#EF4444' }} onClick={() => toast.success('Booking cancelled')}>Cancel</Button>
              </Box>
            </Paper>
          </Box>
        </Paper>
      )}

      {/* Modal: Book Seat */}
      <Dialog
        open={Boolean(selectedRideForBook)}
        onClose={() => setSelectedRideForBook(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { bgcolor: '#0D1526', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' } } }}
      >
        <DialogTitle sx={{ color: '#fff', fontWeight: 800 }}>Reserve Carpool Seat</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {selectedRideForBook && (
            <Paper sx={{ p: 2, bgcolor: '#080E1C', borderRadius: '10px' }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>Driver & Route:</Typography>
              <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700 }}>
                {selectedRideForBook.driverName} ({selectedRideForBook.unitNumber})
              </Typography>
              <Typography variant="caption" sx={{ color: '#4F6AF5', display: 'block' }}>
                To: {selectedRideForBook.destination}
              </Typography>
              <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 800 }}>
                Departure: {selectedRideForBook.departureTime} · ₹{selectedRideForBook.costPerSeat} / seat
              </Typography>
            </Paper>
          )}

          <TextField
            select
            label="Number of Seats"
            fullWidth
            value={bookSeats}
            onChange={e => setBookSeats(parseInt(e.target.value, 10) || 1)}
            sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
          >
            {[1, 2, 3].map(s => (
              <MenuItem key={s} value={s}>{s} Seat{s > 1 ? 's' : ''}</MenuItem>
            ))}
          </TextField>

          <TextField
            label="Pickup Note / Tower Location"
            fullWidth
            value={bookNotes}
            onChange={e => setBookNotes(e.target.value)}
            placeholder="e.g. Will be waiting at Tower A lobby."
            sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
          />

          <Paper sx={{ p: 1.5, bgcolor: 'rgba(16,185,129,0.1)', borderRadius: '10px', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Total Fuel Contribution:</Typography>
            <Typography variant="h6" sx={{ color: '#10B981', fontWeight: 900 }}>
              ₹{(selectedRideForBook?.costPerSeat || 80) * bookSeats}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setSelectedRideForBook(null)} sx={{ color: 'rgba(255,255,255,0.5)' }}>Cancel</Button>
          <Button variant="contained" onClick={handleBookSeat} sx={{ bgcolor: '#10B981' }}>Confirm Booking</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default CarpoolHubView;
