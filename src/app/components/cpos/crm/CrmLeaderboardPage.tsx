import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, LinearProgress, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Button,
  Select, MenuItem, FormControl, InputLabel, Alert, CircularProgress,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EditIcon from '@mui/icons-material/Edit';
import { crmService } from '../../../../services/cpos/crmService';
import type { LeaderboardEntryDto, SalesTargetDto } from '../../../../services/cpos/crmService';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const medalColors = ['#F59E0B', '#9CA3AF', '#CD7F32'];

export default function CrmLeaderboardPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryDto[]>([]);
  const [targets, setTargets]         = useState<SalesTargetDto[]>([]);
  const [loading, setLoading]         = useState(false);
  const [agents, setAgents]           = useState<string[]>([]);

  // Target upsert dialog
  const [dlgOpen, setDlgOpen] = useState(false);
  const [dlgAgent, setDlgAgent] = useState('');
  const [dlgClosed, setDlgClosed] = useState('');
  const [dlgRevenue, setDlgRevenue] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');

  useEffect(() => {
    crmService.getAgents().then(setAgents).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      crmService.getLeaderboard(month, year),
      crmService.getSalesTargets(month, year),
    ])
      .then(([lb, tgts]) => { setLeaderboard(lb); setTargets(tgts); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [month, year]);

  const getTarget = (agent: string) => targets.find(t => t.agentName === agent);

  const openDlg = (agent: string) => {
    const existing = getTarget(agent);
    setDlgAgent(agent);
    setDlgClosed(String(existing?.targetLeadsClosed ?? ''));
    setDlgRevenue(String(existing?.targetRevenueLakhs ?? ''));
    setSaveErr('');
    setDlgOpen(true);
  };

  const handleSave = async () => {
    if (!dlgAgent) return;
    setSaving(true); setSaveErr('');
    try {
      await crmService.upsertSalesTarget({
        agentName: dlgAgent,
        month, year,
        targetLeadsClosed: parseInt(dlgClosed) || 0,
        targetRevenueLakhs: parseInt(dlgRevenue) || 0,
      });
      const [lb, tgts] = await Promise.all([
        crmService.getLeaderboard(month, year),
        crmService.getSalesTargets(month, year),
      ]);
      setLeaderboard(lb); setTargets(tgts);
      setDlgOpen(false);
    } catch {
      setSaveErr('Failed to save target.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <EmojiEventsIcon sx={{ color: '#F59E0B', fontSize: 28 }} />
        <Typography variant="h5" fontWeight={700}>
          Leaderboard & Targets
        </Typography>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Month</InputLabel>
            <Select value={month} label="Month" onChange={e => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => (
                <MenuItem key={i + 1} value={i + 1}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 90 }}>
            <InputLabel>Year</InputLabel>
            <Select value={year} label="Year" onChange={e => setYear(Number(e.target.value))}>
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {leaderboard.length === 0 && !loading ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography color="text.secondary">
            No closed leads in {MONTHS[month - 1]} {year} yet.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: 'text.secondary', textTransform: 'uppercase' } }}>
                <TableCell>#</TableCell>
                <TableCell>Agent</TableCell>
                <TableCell align="right">Closed</TableCell>
                <TableCell align="right">Revenue (₹L)</TableCell>
                <TableCell align="right">Target Closed</TableCell>
                <TableCell align="right">Target Revenue</TableCell>
                <TableCell align="right">Progress</TableCell>
                <TableCell align="right">Set Target</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaderboard.map(row => {
                const tgt = getTarget(row.agent);
                const closedPct  = tgt && tgt.targetLeadsClosed  > 0 ? Math.min(100, Math.round(row.closedLeads  * 100 / tgt.targetLeadsClosed))  : null;
                const revPct     = tgt && tgt.targetRevenueLakhs > 0 ? Math.min(100, Math.round(row.revenueLakhs * 100 / tgt.targetRevenueLakhs)) : null;
                return (
                  <TableRow key={row.agent} hover>
                    <TableCell>
                      {row.rank <= 3
                        ? <EmojiEventsIcon sx={{ fontSize: 18, color: medalColors[row.rank - 1] }} />
                        : <Typography variant="body2" fontWeight={600}>{row.rank}</Typography>}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{row.agent}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip label={row.closedLeads} size="small" color="success" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>₹{row.revenueLakhs}L</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        {tgt?.targetLeadsClosed ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        {tgt?.targetRevenueLakhs ? `₹${tgt.targetRevenueLakhs}L` : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ minWidth: 100 }}>
                      {closedPct !== null ? (
                        <Box>
                          <LinearProgress
                            variant="determinate"
                            value={closedPct}
                            color={closedPct >= 100 ? 'success' : closedPct >= 70 ? 'warning' : 'error'}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption" color="text.secondary">{closedPct}%</Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">No target</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openDlg(row.agent)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Set target for agents not on leaderboard */}
      {agents.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            SET TARGET FOR:
          </Typography>
          {agents
            .filter(a => !leaderboard.some(r => r.agent === a))
            .map(a => (
              <Chip key={a} label={a} size="small" variant="outlined" onClick={() => openDlg(a)}
                    icon={<EditIcon sx={{ fontSize: '14px !important' }} />} clickable />
            ))}
        </Box>
      )}

      <Dialog open={dlgOpen} onClose={() => setDlgOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Set Target — {dlgAgent}</DialogTitle>
        <DialogContent sx={{ pt: '12px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {MONTHS[month - 1]} {year}
          </Typography>
          {saveErr && <Alert severity="error">{saveErr}</Alert>}
          <TextField
            label="Target deals to close"
            type="number"
            value={dlgClosed}
            onChange={e => setDlgClosed(e.target.value)}
            inputProps={{ min: 0 }}
          />
          <TextField
            label="Target revenue (₹L)"
            type="number"
            value={dlgRevenue}
            onChange={e => setDlgRevenue(e.target.value)}
            inputProps={{ min: 0 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
