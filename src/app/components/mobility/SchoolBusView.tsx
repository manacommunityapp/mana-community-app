import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Chip, Table, TableHead, TableRow,
  TableCell, TableBody, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControlLabel, Switch, Slider, Tooltip
} from '@mui/material';
import { toast } from 'sonner';
import {
  schoolBusService,
  type BusRoute,
  type StudentPassenger,
  type GeofenceAlertConfig,
} from '../../../services/mobility/schoolBusService';

const statusBadge = (status: string) => {
  switch (status) {
    case 'ON_TIME':
      return { label: 'On Time · Transit', bg: 'rgba(16,185,129,0.15)', color: '#10B981' };
    case 'DELAYED':
      return { label: 'Traffic Delay · +10m', bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' };
    case 'AT_GATE':
      return { label: 'Arrived at Gate 1', bg: 'rgba(59,130,246,0.15)', color: '#3B82F6' };
    case 'COMPLETED':
      return { label: 'Trip Completed', bg: 'rgba(255,255,255,0.1)', color: '#94A3B8' };
    default:
      return { label: 'Depot Idle', bg: 'rgba(255,255,255,0.05)', color: '#64748B' };
  }
};

const passengerBadge = (status: string) => {
  switch (status) {
    case 'BOARDED':
      return { label: 'Boarded (RFID Verified)', bg: 'rgba(16,185,129,0.15)', color: '#10B981' };
    case 'DEBOARDED':
      return { label: 'Deboarded at Gate', bg: 'rgba(59,130,246,0.15)', color: '#3B82F6' };
    case 'ABSENT':
      return { label: 'Absent / Parent Leave', bg: 'rgba(239,68,68,0.15)', color: '#EF4444' };
    default:
      return { label: 'Awaiting Boarding', bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' };
  }
};

export const SchoolBusView: React.FC = () => {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number>(1);
  const [passengers, setPassengers] = useState<StudentPassenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGeofenceModal, setShowGeofenceModal] = useState(false);

  const [geofenceConfig, setGeofenceConfig] = useState<GeofenceAlertConfig>({
    proximityMeters: 1000,
    notifyOnSchoolDeparture: true,
    notifyOnGateArrival: true,
    smsNotifications: true,
    pushNotifications: true,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const rList = await schoolBusService.listRoutes();
        setRoutes(rList);
        if (rList.length > 0) {
          const pass = await schoolBusService.getPassengers(rList[0].id);
          setPassengers(pass);
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSelectRoute = async (routeId: number) => {
    setSelectedRouteId(routeId);
    const pass = await schoolBusService.getPassengers(routeId);
    setPassengers(pass);
  };

  const activeRoute = routes.find(r => r.id === selectedRouteId) || routes[0];

  const handleSaveGeofence = async () => {
    if (!activeRoute) return;
    await schoolBusService.updateGeofenceAlerts(activeRoute.id, geofenceConfig);
    toast.success(`Parent geofence alert updated for ${activeRoute.schoolName}`);
    setShowGeofenceModal(false);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header Banner */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.02em' }}>
              School Bus Live GPS Transit & Parent Hub
            </Typography>
            <Chip label="LIVE RADAR" size="small" sx={{ bgcolor: 'rgba(239,68,68,0.2)', color: '#EF4444', fontWeight: 800, fontSize: '0.65rem' }} />
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
            Real-time RFID student attendance, campus departure ETA, and live vehicle telemetry
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => setShowGeofenceModal(true)}
            sx={{ borderColor: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: '10px', textTransform: 'none' }}
          >
            🔔 Geofence Proximity Alert
          </Button>
          <Button
            variant="contained"
            component="a"
            href={`tel:${activeRoute?.driverPhone || ''}`}
            sx={{ bgcolor: '#10B981', borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
          >
            📞 Call Driver
          </Button>
        </Box>
      </Box>

      {/* Route Selector Tabs */}
      <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 0.5 }}>
        {routes.map(r => {
          const isSelected = r.id === activeRoute?.id;
          const status = statusBadge(r.status);
          return (
            <Paper
              key={r.id}
              onClick={() => handleSelectRoute(r.id)}
              sx={{
                p: 2,
                minWidth: 260,
                cursor: 'pointer',
                borderRadius: '16px',
                border: isSelected ? '2px solid #4F6AF5' : '1px solid rgba(255,255,255,0.06)',
                bgcolor: isSelected ? 'rgba(79,106,245,0.1)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#4F6AF5', fontWeight: 800, fontFamily: 'monospace' }}>
                  {r.routeNumber}
                </Typography>
                <Chip label={status.label} size="small" sx={{ bgcolor: status.bg, color: status.color, fontSize: '0.65rem', height: 20 }} />
              </Box>
              <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700, mt: 0.5 }} noWrap>
                {r.schoolName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mt: 0.5 }}>
                ETA Gate: <strong style={{ color: '#10B981' }}>{r.etaMinutes === 0 ? 'At Society Gate' : `${r.etaMinutes} mins`}</strong> · {r.occupancy}/{r.capacity} Students
              </Typography>
            </Paper>
          );
        })}
      </Box>

      {activeRoute && (
        <>
          {/* Live Telemetry & Transit Visualizer Card */}
          <Paper sx={{ p: 3, borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', bgcolor: '#0D1526' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  ACTIVE VEHICLE TELEMETRY
                </Typography>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800 }}>
                  {activeRoute.busNumber} · {activeRoute.routeName}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>CURRENT SPEED</Typography>
                  <Typography variant="h5" sx={{ color: '#4F6AF5', fontWeight: 900 }}>{activeRoute.speedKmph} <span style={{ fontSize: '0.8rem' }}>km/h</span></Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>GATE ETA</Typography>
                  <Typography variant="h5" sx={{ color: '#10B981', fontWeight: 900 }}>{activeRoute.etaMinutes} <span style={{ fontSize: '0.8rem' }}>min</span></Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>STUDENTS ONBOARD</Typography>
                  <Typography variant="h5" sx={{ color: '#F59E0B', fontWeight: 900 }}>{activeRoute.occupancy} <span style={{ fontSize: '0.8rem' }}>/ {activeRoute.capacity}</span></Typography>
                </Box>
              </Box>
            </Box>

            {/* Graphical Transit Line Radar */}
            <Box sx={{ p: 2.5, bgcolor: '#080E1C', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="caption" sx={{ color: '#7B93FF', fontWeight: 700 }}>🏫 {activeRoute.schoolName}</Typography>
                <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700 }}>🏡 Mana Uber Verde Gate 1</Typography>
              </Box>
              {/* Progress bar with bus icon marker */}
              <Box sx={{ position: 'relative', height: 12, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'visible' }}>
                <Box
                  sx={{
                    height: '100%',
                    width: `${activeRoute.liveCoordinates.progressPercent}%`,
                    bgcolor: 'linear-gradient(90deg, #4F6AF5, #10B981)',
                    borderRadius: '6px',
                    transition: 'width 0.5s ease',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: -12,
                    left: `calc(${activeRoute.liveCoordinates.progressPercent}% - 14px)`,
                    bgcolor: '#4F6AF5',
                    color: '#fff',
                    borderRadius: '50%',
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 12px rgba(79,106,245,0.8)',
                    fontSize: '0.85rem'
                  }}
                >
                  🚌
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                <span>Departed: 03:15 PM</span>
                <span>Current: <strong>{activeRoute.currentStop}</strong></span>
                <span>Next: <strong>{activeRoute.nextStop}</strong></span>
                <span>Drop Slot: {activeRoute.afternoonDropTime}</span>
              </Box>
            </Box>

            {/* Crew Details strip */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
              <Paper sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>Driver Contact:</Typography>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700 }}>{activeRoute.driverName}</Typography>
                <Typography variant="caption" sx={{ color: '#4F6AF5', fontFamily: 'monospace' }}>{activeRoute.driverPhone}</Typography>
              </Paper>
              <Paper sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>Bus Attendant / Matron:</Typography>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700 }}>{activeRoute.attendantName}</Typography>
                <Typography variant="caption" sx={{ color: '#10B981', fontFamily: 'monospace' }}>{activeRoute.attendantPhone}</Typography>
              </Paper>
              <Paper sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>Emergency Transport Helpdesk:</Typography>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700 }}>Society Security Gate 1</Typography>
                <Typography variant="caption" sx={{ color: '#EF4444', fontFamily: 'monospace' }}>Ext: 101 / +91 80 4910 2000</Typography>
              </Paper>
            </Box>
          </Paper>

          {/* Student Passenger Manifest */}
          <Paper sx={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
                  Student Attendance & Boarding Manifest ({passengers.length} Registered)
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                  Automated contactless RFID badge scan at bus door entry and gate arrival
                </Typography>
              </Box>
              <Chip label="RFID GATEWAY ACTIVE" size="small" sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10B981', fontWeight: 700, fontSize: '0.65rem' }} />
            </Box>
            <Table>
              <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
                <TableRow>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Student Name</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Grade / Class</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Apartment Unit</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Parent Contact</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>RFID Badge ID</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Last Gate / Bus Scan</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {passengers.map(p => {
                  const badge = passengerBadge(p.boardingStatus);
                  return (
                    <TableRow key={p.id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700 }}>
                          {p.studentName}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                        {p.gradeClass}
                      </TableCell>
                      <TableCell sx={{ color: '#7B93FF', fontWeight: 600 }}>
                        {p.unitNumber}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#fff' }}>{p.parentName}</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{p.parentPhone}</Typography>
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {p.rfidCardNumber}
                      </TableCell>
                      <TableCell>
                        <Chip label={badge.label} size="small" sx={{ bgcolor: badge.bg, color: badge.color, fontWeight: 700, fontSize: '0.68rem', height: 22 }} />
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
                        {p.lastScanTimestamp || '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}

      {/* Modal: Geofence Proximity Alert Configuration */}
      <Dialog
        open={showGeofenceModal}
        onClose={() => setShowGeofenceModal(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { bgcolor: '#0D1526', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' } } }}
      >
        <DialogTitle sx={{ color: '#fff', fontWeight: 800 }}>Parent Geofence Proximity Alert</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Configure when you receive automated push notifications and SMS as the school bus approaches Society Main Gate:
          </Typography>

          <Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', mb: 1 }}>
              Alert Distance Radius: <strong>{geofenceConfig.proximityMeters} meters (~{Math.round(geofenceConfig.proximityMeters / 250)} mins ETA)</strong>
            </Typography>
            <Slider
              value={geofenceConfig.proximityMeters}
              min={250}
              max={3000}
              step={250}
              onChange={(_, val) => setGeofenceConfig(prev => ({ ...prev, proximityMeters: val as number }))}
              sx={{ color: '#4F6AF5' }}
            />
          </Box>

          <FormControlLabel
            control={<Switch checked={geofenceConfig.notifyOnSchoolDeparture} onChange={e => setGeofenceConfig(prev => ({ ...prev, notifyOnSchoolDeparture: e.target.checked }))} />}
            label={<Typography variant="body2" sx={{ color: '#fff' }}>Notify when bus leaves school campus</Typography>}
          />
          <FormControlLabel
            control={<Switch checked={geofenceConfig.notifyOnGateArrival} onChange={e => setGeofenceConfig(prev => ({ ...prev, notifyOnGateArrival: e.target.checked }))} />}
            label={<Typography variant="body2" sx={{ color: '#fff' }}>Notify when bus enters Society Security Gate 1</Typography>}
          />
          <FormControlLabel
            control={<Switch checked={geofenceConfig.pushNotifications} onChange={e => setGeofenceConfig(prev => ({ ...prev, pushNotifications: e.target.checked }))} />}
            label={<Typography variant="body2" sx={{ color: '#fff' }}>Enable High-Priority Push Alerts</Typography>}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setShowGeofenceModal(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveGeofence} sx={{ bgcolor: '#4F6AF5' }}>Save Preference</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default SchoolBusView;
