import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Paper, Typography, Chip, Avatar, Button, TextField, InputAdornment,
  Table, TableHead, TableRow, TableCell, TableBody, MenuItem, IconButton, Tooltip,
  LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CallIcon from '@mui/icons-material/Call';
import CampaignIcon from '@mui/icons-material/Campaign';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router';
import {
  Lead, Stage, STAGES, STAGE_LABELS, stageColors, sourceColors, scoreColor,
  LeadSource, isFollowUpDue, isFollowUpUpcoming, formatFollowUpDate,
} from '../crm/crmData';
import { CRMNav } from '../crm/CRMNav';
import { crmService } from '../../../../services/cpos/crmService';
import { CallLogDialog } from '../crm/CallLogDialog';
import { CrmExportButton } from '../crm/CrmExportButton';
import CrmImportButton from '../crm/CrmImportButton';
import BulkEmailCampaignDialog from '../crm/BulkEmailCampaignDialog';
import { useCrmRole } from '../../../../hooks/useCrmRole';

const ALL_STAGES = ['ALL', ...STAGES] as const;

const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, agentName } = useCrmRole();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [agentFilter, setAgentFilter] = useState<string>('ALL');
  const [agents, setAgents] = useState<string[]>([]);
  const [dueFilter, setDueFilter] = useState(false);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [campaignTemplate, setCampaignTemplate] = useState('initial');
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [callLogLead, setCallLogLead] = useState<Lead | null>(null);
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);

  const TEMPLATES: Record<string, string> = {
    initial: 'Hi {name}, this is regarding your property enquiry with MANA Community. How can I help you today?',
    siteVisit: 'Hi {name}, we would love to invite you for a site visit at our project. When would be a good time for you?',
    followUp: 'Hi {name}, just checking in on your property search. Did you get a chance to review the brochure we shared?',
    priceUpdate: 'Hi {name}, we have an exciting price update for the unit you were interested in. Would love to share the details.',
  };

  const buildWaLink = (phone: string, name: string) => {
    const clean = phone.replace(/[^0-9]/g, '').replace(/^0/, '').replace(/^91/, '');
    const msg = encodeURIComponent(TEMPLATES[campaignTemplate].replace('{name}', name.split(' ')[0]));
    return `https://wa.me/91${clean}?text=${msg}`;
  };

  useEffect(() => {
    crmService.getLeads().then(setLeads).catch(() => setLeads([]));
  }, []);

  useEffect(() => {
    if (isAdmin) crmService.getAgents().then(setAgents).catch(() => {});
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter(l => {
      const matchSearch = !q || l.name.toLowerCase().includes(q) || l.phone.includes(q) || l.email.toLowerCase().includes(q);
      const matchStage = stageFilter === 'ALL' || l.stage === stageFilter;
      const matchSource = sourceFilter === 'ALL' || l.source === sourceFilter;
      const matchDue = !dueFilter || isFollowUpDue(l) || isFollowUpUpcoming(l);
      const matchAgent = !isAdmin || agentFilter === 'ALL' || l.assignedTo === agentFilter;
      return matchSearch && matchStage && matchSource && matchDue && matchAgent;
    });
  }, [leads, search, stageFilter, sourceFilter, dueFilter, agentFilter, isAdmin]);

  const summary = useMemo(() => {
    const total = leads.reduce((s, l) => s + l.budgetLakhs, 0);
    const avg = leads.length > 0 ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length) : 0;
    const hot = leads.filter(l => l.score >= 85).length;
    const dueCount = leads.filter(l => isFollowUpDue(l) || isFollowUpUpcoming(l)).length;
    return { total, avg, hot, dueCount };
  }, [leads]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <CRMNav />
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>Buyer Leads & Enquiries</Typography>
            {!isAdmin && (
              <Chip label="My Leads" size="small"
                sx={{ bgcolor: 'rgba(79,106,245,0.15)', color: '#7B93FF', fontWeight: 700, fontSize: '0.68rem' }} />
            )}
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            {!isAdmin
              ? `Showing leads assigned to ${agentName || 'you'} · ₹${summary.total} L pipeline`
              : `${leads.length} total leads · ₹${summary.total} L pipeline · ${summary.hot} hot leads`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <CrmExportButton leads={filtered} filename="crm-leads" reportTitle="CRM Leads Report" />
          {isAdmin && <CrmImportButton onImported={() => crmService.getLeads().then(setLeads).catch(() => {})} />}
          {isAdmin && (
            <Button variant="outlined" startIcon={<CampaignIcon />} size="small"
              onClick={() => setBulkEmailOpen(true)}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, borderColor: '#4F6AF5', color: '#4F6AF5', '&:hover': { bgcolor: 'rgba(79,106,245,0.08)' } }}>
              Email Campaign
            </Button>
          )}
          <Button variant="outlined" startIcon={<CampaignIcon />} size="small"
            onClick={() => { setSentIds(new Set()); setCampaignOpen(true); }}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, borderColor: '#25D366', color: '#25D366', '&:hover': { bgcolor: 'rgba(37,211,102,0.08)' } }}>
            WA Campaign
          </Button>
          <Button
            variant="contained" startIcon={<AddIcon />} size="small"
            onClick={() => navigate('/cpos/crm')}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: '#4F6AF5', '&:hover': { bgcolor: '#3a55d4' } }}
          >
            Add Lead
          </Button>
        </Box>
      </Box>

      {/* Summary tiles */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 2 }}>
        {STAGES.map(s => {
          const count = leads.filter(l => l.stage === s).length;
          const val = leads.filter(l => l.stage === s).reduce((sum, l) => sum + l.budgetLakhs, 0);
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
        <Chip
          label={`🔔 Due Today${summary.dueCount > 0 ? ` (${summary.dueCount})` : ''}`}
          size="small"
          onClick={() => setDueFilter(d => !d)}
          sx={{
            fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer',
            bgcolor: dueFilter ? '#EF4444' : 'rgba(255,255,255,0.06)',
            color: dueFilter ? '#fff' : 'rgba(255,255,255,0.6)',
          }}
        />
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
        {isAdmin && agents.length > 0 && (
          <TextField
            select size="small" value={agentFilter}
            onChange={e => setAgentFilter(e.target.value)}
            sx={{ minWidth: 150, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          >
            <MenuItem value="ALL">All Agents</MenuItem>
            {agents.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
          </TextField>
        )}
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
                <TableCell>Follow-up</TableCell>
                <TableCell>Agent</TableCell>
                <TableCell>Days</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ color: 'rgba(255,255,255,0.3)', py: 4, border: 'none' }}>
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
                    {lead.followUpAt ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography sx={{ fontSize: '0.65rem' }}>🔔</Typography>
                        <Typography variant="caption" sx={{
                          color: isFollowUpDue(lead) ? '#EF4444' : isFollowUpUpcoming(lead) ? '#F59E0B' : 'rgba(255,255,255,0.4)',
                          fontWeight: isFollowUpDue(lead) || isFollowUpUpcoming(lead) ? 700 : 400,
                          fontSize: '0.68rem',
                        }}>
                          {formatFollowUpDate(lead.followUpAt)}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.68rem' }}>—</Typography>
                    )}
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
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.25 }}>
                      <Tooltip title={`Call ${lead.phone}`}>
                        <IconButton size="small"
                          onClick={e => {
                            e.stopPropagation();
                            window.open(`tel:+91${lead.phone.replace(/[^0-9]/g, '').replace(/^0/, '').replace(/^91/, '')}`, '_self');
                            setCallLogLead(lead);
                          }}
                          sx={{ color: '#10B981', opacity: 0.7, '&:hover': { opacity: 1, bgcolor: 'rgba(16,185,129,0.1)' } }}>
                          <CallIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="WhatsApp">
                        <IconButton size="small"
                          onClick={e => { e.stopPropagation(); const c = lead.phone.replace(/[^0-9]/g, '').replace(/^0/, '').replace(/^91/, ''); window.open(`https://wa.me/91${c}`, '_blank'); }}
                          sx={{ color: '#25D366', opacity: 0.7, '&:hover': { opacity: 1, bgcolor: 'rgba(37,211,102,0.1)' } }}>
                          <WhatsAppIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Open lead detail">
                        <IconButton size="small" onClick={e => { e.stopPropagation(); navigate(`/cpos/crm/leads/${lead.id}`); }}
                          sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: '#4F6AF5' } }}>
                          <ArrowForwardIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        {filtered.length > 0 && (
          <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>
              Showing {filtered.length} of {leads.length} leads
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>
              Pipeline value: ₹{filtered.reduce((s, l) => s + l.budgetLakhs, 0)} L
            </Typography>
          </Box>
        )}
      </Paper>
      {/* WhatsApp Campaign Modal */}
      <Dialog open={campaignOpen} onClose={() => setCampaignOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: '20px', bgcolor: '#0D1526', border: '1px solid rgba(255,255,255,0.08)' } }}>
        <DialogTitle sx={{ color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <WhatsAppIcon sx={{ color: '#25D366' }} />
            WhatsApp Campaign
          </Box>
          <IconButton size="small" onClick={() => setCampaignOpen(false)} sx={{ color: 'rgba(255,255,255,0.4)' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Template picker */}
            <TextField select label="Message Template" size="small" value={campaignTemplate}
              onChange={e => setCampaignTemplate(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}>
              <MenuItem value="initial">Initial Enquiry Follow-up</MenuItem>
              <MenuItem value="siteVisit">Site Visit Invitation</MenuItem>
              <MenuItem value="followUp">Re-engagement / Check-in</MenuItem>
              <MenuItem value="priceUpdate">Price Update Alert</MenuItem>
            </TextField>
            <Paper sx={{ p: 1.5, borderRadius: '10px', bgcolor: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)' }}>
              <Typography variant="caption" sx={{ color: '#25D366', fontWeight: 700, fontSize: '0.7rem', display: 'block', mb: 0.5 }}>PREVIEW</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', lineHeight: 1.6 }}>
                {TEMPLATES[campaignTemplate].replace('{name}', 'Arun')}
              </Typography>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                {filtered.length} lead{filtered.length !== 1 ? 's' : ''} · {sentIds.size} sent this session
              </Typography>
              <Button size="small" startIcon={<ContentCopyIcon />}
                onClick={() => navigator.clipboard?.writeText(filtered.map(l => l.phone).join('\n')).catch(() => {})}
                sx={{ textTransform: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>
                Copy all numbers
              </Button>
            </Box>

            {/* Lead list */}
            <Box sx={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {filtered.map(lead => (
                <Box key={lead.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25,
                  borderRadius: '10px', bgcolor: sentIds.has(lead.id) ? 'rgba(37,211,102,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${sentIds.has(lead.id) ? 'rgba(37,211,102,0.2)' : 'rgba(255,255,255,0.05)'}` }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: `${stageColors[lead.stage]}20`, color: stageColors[lead.stage], fontSize: '0.7rem', fontWeight: 700 }}>
                    {lead.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.82rem' }}>{lead.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem' }}>{lead.phone}</Typography>
                  </Box>
                  <Chip label={STAGE_LABELS[lead.stage]} size="small"
                    sx={{ bgcolor: `${stageColors[lead.stage]}18`, color: stageColors[lead.stage], fontWeight: 700, fontSize: '0.65rem', height: 18 }} />
                  {sentIds.has(lead.id) ? (
                    <Chip label="Sent ✓" size="small" sx={{ bgcolor: 'rgba(37,211,102,0.15)', color: '#25D366', fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
                  ) : (
                    <Button size="small" variant="contained" startIcon={<WhatsAppIcon sx={{ fontSize: '13px !important' }} />}
                      onClick={() => { window.open(buildWaLink(lead.phone, lead.name), '_blank'); setSentIds(prev => new Set([...prev, lead.id])); }}
                      sx={{ minWidth: 80, fontSize: '0.7rem', px: 1.5, py: 0.5, borderRadius: '8px', textTransform: 'none', fontWeight: 700, bgcolor: '#25D366', '&:hover': { bgcolor: '#1eb854' } }}>
                      Send
                    </Button>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Typography variant="caption" sx={{ flex: 1, color: 'rgba(255,255,255,0.3)', fontSize: '0.68rem' }}>
            Opens WhatsApp with pre-filled message. Sent status resets when you close.
          </Typography>
          <Button onClick={() => setCampaignOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>

      {callLogLead && (
        <CallLogDialog
          open={!!callLogLead}
          leadId={callLogLead.id}
          leadName={callLogLead.name}
          onClose={() => setCallLogLead(null)}
          onSaved={() => {
            setCallLogLead(null);
            crmService.getLeads().then(setLeads).catch(() => {});
          }}
        />
      )}

      <BulkEmailCampaignDialog
        open={bulkEmailOpen}
        onClose={() => setBulkEmailOpen(false)}
      />
    </Box>
  );
};

export default LeadsPage;
