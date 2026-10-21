import React, { useState, useMemo } from 'react';
import {
  Box, Paper, Typography, Chip, Avatar, Button, TextField, InputAdornment,
  Table, TableHead, TableRow, TableCell, TableBody, MenuItem, IconButton, Tooltip,
  LinearProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router';
import {
  Lead, Stage, STAGES, STAGE_LABELS, stageColors, sourceColors, scoreColor,
  INITIAL_LEADS, LeadSource,
} from '../crm/crmData';

const ALL_STAGES = ['ALL', ...STAGES] as const;

const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return INITIAL_LEADS.filter(l => {
      const matchSearch = !q || l.name.toLowerCase().includes(q) || l.phone.includes(q) || l.email.toLowerCase().includes(q);
      const matchStage = stageFilter === 'ALL' || l.stage === stageFilter;
      const matchSource = sourceFilter === 'ALL' || l.source === sourceFilter;
      return matchSearch && matchStage && matchSource;
    });
  }, [search, stageFilter, sourceFilter]);

  const summary = useMemo(() => {
    const total = INITIAL_LEADS.reduce((s, l) => s + l.budgetLakhs, 0);
    const avg = Math.round(INITIAL_LEADS.reduce((s, l) => s + l.score, 0) / INITIAL_LEADS.length);
    const hot = INITIAL_LEADS.filter(l => l.score >= 85).length;
    return { total, avg, hot };
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>Buyer Leads & Enquiries</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            {INITIAL_LEADS.length} total leads · ₹{summary.total} L pipeline · {summary.hot} hot leads
          </Typography>
        </Box>
        <Button
          variant="contained" startIcon={<AddIcon />} size="small"
          onClick={() => navigate('/cpos/crm')}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: '#4F6AF5', '&:hover': { bgcolor: '#3a55d4' } }}
        >
          Add Lead
        </Button>
      </Box>

      {/* Summary tiles */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 2 }}>
        {STAGES.map(s => {
          const count = INITIAL_LEADS.filter(l => l.stage === s).length;
          const val = INITIAL_LEADS.filter(l => l.stage === s).reduce((sum, l) => sum + l.budgetLakhs, 0);
          return (
            <Paper key={s} sx={{ p: 2, borderRadius: '14px', borderTop: `3px solid ${stageColors[s]}`, cursor: 'pointer', '&:hover': { opacity: 0.85 } }}
              onClick={() => setStageFilter(stageFilter === s ? 'ALL' : s)}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: '0.65rem' }}>
                {STAGE_LABELS[s]}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 0.5 }}>
                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>{count}</Typography>
                <Typography variant="caption" sx={{ color: stageColors[s], fontWeight: 700 }}>₹{val} L</Typography>
              </Box>
            </Paper>
          );
        })}
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small" placeholder="Search name, phone, email…" value={search}
          onChange={e => setSearch(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }} /></InputAdornment> } }}
          sx={{ minWidth: 240, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
        />
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          {ALL_STAGES.map(s => (
            <Chip key={s} label={s === 'ALL' ? 'All Stages' : STAGE_LABELS[s as Stage]} size="small"
              onClick={() => setStageFilter(s)}
              sx={{
                fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer',
                bgcolor: stageFilter === s ? (s === 'ALL' ? '#4F6AF5' : stageColors[s as Stage]) : 'rgba(255,255,255,0.06)',
                color: stageFilter === s ? '#fff' : 'rgba(255,255,255,0.6)',
              }} />
          ))}
        </Box>
        <TextField
          select size="small" value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          sx={{ minWidth: 130, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
        >
          <MenuItem value="ALL">All Sources</MenuItem>
          {(['WALK_IN', 'BROKER', 'PORTAL', 'WHATSAPP', 'REFERRAL', 'WEBSITE'] as LeadSource[]).map(s => (
            <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Table */}
      <Paper sx={{ borderRadius: '16px', overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#0A1020', color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)' } }}>
                <TableCell>Buyer</TableCell>
                <TableCell>Budget</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Stage</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>AI Score</TableCell>
                <TableCell>Agent</TableCell>
                <TableCell>Days</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ color: 'rgba(255,255,255,0.3)', py: 4, border: 'none' }}>
                    No leads match your filters
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(lead => (
                <TableRow key={lead.id}
                  onClick={() => navigate(`/cpos/crm/leads/${lead.id}`)}
                  sx={{
                    cursor: 'pointer',
                    '& td': { borderBottom: '1px solid rgba(255,255,255,0.04)', py: 1.5 },
                    '&:hover td': { bgcolor: 'rgba(79,106,245,0.05)' },
                    '&:last-child td': { borderBottom: 'none' },
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: `${stageColors[lead.stage]}20`, color: stageColors[lead.stage], fontSize: '0.7rem', fontWeight: 700 }}>
                        {lead.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, lineHeight: 1.2 }}>{lead.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem' }}>{lead.phone}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 700 }}>{lead.budget}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={lead.type} size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', fontSize: '0.68rem', height: 20 }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={STAGE_LABELS[lead.stage]} size="small"
                      sx={{ bgcolor: `${stageColors[lead.stage]}18`, color: stageColors[lead.stage], fontWeight: 700, fontSize: '0.68rem', height: 20 }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={lead.source.replace('_', ' ')} size="small"
                      sx={{ bgcolor: `${sourceColors[lead.source]}15`, color: sourceColors[lead.source], fontWeight: 700, fontSize: '0.68rem', height: 20 }} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 80 }}>
                      <LinearProgress variant="determinate" value={lead.score}
                        sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.08)', '& .MuiLinearProgress-bar': { bgcolor: scoreColor(lead.score) } }} />
                      <Typography variant="caption" sx={{ color: scoreColor(lead.score), fontWeight: 700, fontSize: '0.72rem', minWidth: 24 }}>
                        {lead.score}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>{lead.assignedTo}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                      {lead.daysTotal}d total
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Open lead detail">
                      <IconButton size="small" onClick={e => { e.stopPropagation(); navigate(`/cpos/crm/leads/${lead.id}`); }}
                        sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: '#4F6AF5' } }}>
                        <ArrowForwardIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        {filtered.length > 0 && (
          <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>
              Showing {filtered.length} of {INITIAL_LEADS.length} leads
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>
              Pipeline value: ₹{filtered.reduce((s, l) => s + l.budgetLakhs, 0)} L
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default LeadsPage;
