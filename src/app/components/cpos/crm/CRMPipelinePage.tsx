import React, { useState } from 'react';
import {
  Box, Paper, Typography, Chip, Avatar, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Tooltip, IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useNavigate } from 'react-router';
import {
  Lead, Stage, STAGES, STAGE_LABELS, stageColors, sourceColors, scoreColor,
  INITIAL_LEADS, LeadSource,
} from './crmData';

const PROPERTY_TYPES = ['2 BHK', '3 BHK', 'Villa', 'Penthouse', 'Commercial'];
const SOURCES: LeadSource[] = ['WALK_IN', 'BROKER', 'PORTAL', 'WHATSAPP', 'REFERRAL', 'WEBSITE'];
const AGENTS = ['Ravi Sharma', 'Priya Nair', 'Karthik Iyer'];

const initials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const CRMPipelinePage: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);
  const [addDialogStage, setAddDialogStage] = useState<Stage | null>(null);
  const [filterSource, setFilterSource] = useState<string>('ALL');

  const [form, setForm] = useState({
    name: '', phone: '', email: '', budget: '', budgetLakhs: '',
    type: '3 BHK', source: 'PORTAL' as LeadSource, assignedTo: 'Ravi Sharma',
  });

  const visibleLeads = filterSource === 'ALL'
    ? leads
    : leads.filter(l => l.source === filterSource);

  const leadsForStage = (stage: Stage) => visibleLeads.filter(l => l.stage === stage);

  const stageValue = (stage: Stage) =>
    leadsForStage(stage).reduce((sum, l) => sum + l.budgetLakhs, 0);

  const totalPipeline = leads.reduce((sum, l) => sum + l.budgetLakhs, 0);

  const handleDrop = (stage: Stage) => {
    if (!draggingId) return;
    setLeads(prev =>
      prev.map(l => l.id === draggingId ? { ...l, stage, daysInStage: 0 } : l)
    );
    setDraggingId(null);
    setDragOverStage(null);
  };

  const handleAddLead = () => {
    if (!addDialogStage || !form.name || !form.phone) return;
    const newLead: Lead = {
      id: `L${Date.now()}`,
      name: form.name,
      phone: form.phone,
      email: form.email,
      budget: form.budget || `₹${form.budgetLakhs} L`,
      budgetLakhs: Number(form.budgetLakhs) || 0,
      type: form.type,
      stage: addDialogStage,
      source: form.source,
      score: Math.floor(40 + Math.random() * 30),
      daysInStage: 0,
      daysTotal: 0,
      assignedTo: form.assignedTo,
      activities: [
        { id: `A${Date.now()}`, type: 'NOTE', by: 'System', notes: 'Lead manually added.', date: 'Oct 21, 2026' },
      ],
    };
    setLeads(prev => [...prev, newLead]);
    setAddDialogStage(null);
    setForm({ name: '', phone: '', email: '', budget: '', budgetLakhs: '', type: '3 BHK', source: 'PORTAL', assignedTo: 'Ravi Sharma' });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>Property CRM Sales Pipeline</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Drag cards between stages • Total pipeline: <strong style={{ color: '#10B981' }}>₹{totalPipeline} L</strong> across {leads.length} leads
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            select size="small"
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            sx={{ minWidth: 140, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            slotProps={{ select: { renderValue: v => v === 'ALL' ? '🔍 All Sources' : v as string } }}
          >
            <MenuItem value="ALL">All Sources</MenuItem>
            {SOURCES.map(s => <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>)}
          </TextField>
          <Button
            variant="contained" startIcon={<AddIcon />} size="small"
            onClick={() => setAddDialogStage('NEW')}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: '#4F6AF5', '&:hover': { bgcolor: '#3a55d4' } }}
          >
            New Lead
          </Button>
        </Box>
      </Box>

      {/* Stage summary row */}
      <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 0.5 }}>
        {STAGES.map(s => (
          <Paper key={s} sx={{ px: 2, py: 1.5, borderRadius: '12px', bgcolor: '#0D1526', borderLeft: `3px solid ${stageColors[s]}`, minWidth: 130, flexShrink: 0 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem' }}>{STAGE_LABELS[s]}</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 0.25 }}>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>
                {leadsForStage(s).length}
              </Typography>
              <Typography variant="caption" sx={{ color: stageColors[s], fontWeight: 700, fontSize: '0.7rem' }}>
                ₹{stageValue(s)} L
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Kanban board */}
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, alignItems: 'flex-start' }}>
        {STAGES.map(stage => (
          <Box
            key={stage}
            onDragOver={e => { e.preventDefault(); setDragOverStage(stage); }}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={() => handleDrop(stage)}
            sx={{
              width: 272, minWidth: 272, display: 'flex', flexDirection: 'column', gap: 1.5,
              p: 1.5, borderRadius: '16px',
              bgcolor: dragOverStage === stage ? 'rgba(79,106,245,0.08)' : 'rgba(255,255,255,0.02)',
              border: dragOverStage === stage ? '2px dashed rgba(79,106,245,0.5)' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {/* Column header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: stageColors[stage] }} />
                <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700 }}>
                  {STAGE_LABELS[stage]}
                </Typography>
                <Chip label={leadsForStage(stage).length} size="small"
                  sx={{ bgcolor: `${stageColors[stage]}20`, color: stageColors[stage], fontWeight: 800, height: 20, fontSize: '0.7rem' }} />
              </Box>
              <Tooltip title={`Add to ${STAGE_LABELS[stage]}`}>
                <IconButton size="small" onClick={() => setAddDialogStage(stage)}
                  sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: stageColors[stage] } }}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Cards */}
            {leadsForStage(stage).map(lead => (
              <Paper
                key={lead.id}
                draggable
                onDragStart={() => setDraggingId(lead.id)}
                onDragEnd={() => { setDraggingId(null); setDragOverStage(null); }}
                sx={{
                  p: 2, borderRadius: '12px',
                  bgcolor: draggingId === lead.id ? 'rgba(79,106,245,0.12)' : '#0D1526',
                  border: '1px solid rgba(255,255,255,0.07)',
                  cursor: 'grab',
                  opacity: draggingId === lead.id ? 0.5 : 1,
                  transition: 'all 0.1s',
                  '&:hover': { border: '1px solid rgba(79,106,245,0.4)', transform: 'translateY(-1px)' },
                  '&:active': { cursor: 'grabbing' },
                }}
              >
                {/* Card header: avatar + name + score */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: `${stageColors[stage]}25`, color: stageColors[stage], fontWeight: 700, fontSize: '0.75rem' }}>
                    {initials(lead.name)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>
                      {lead.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
                      {lead.phone}
                    </Typography>
                  </Box>
                  <Tooltip title={`AI Score: ${lead.score}`}>
                    <Box sx={{
                      minWidth: 30, height: 30, borderRadius: '8px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      bgcolor: `${scoreColor(lead.score)}15`,
                      border: `1px solid ${scoreColor(lead.score)}40`,
                    }}>
                      <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: scoreColor(lead.score) }}>
                        {lead.score}
                      </Typography>
                    </Box>
                  </Tooltip>
                </Box>

                {/* Budget + Type */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 700, fontSize: '0.85rem' }}>
                    {lead.budget}
                  </Typography>
                  <Chip label={lead.type} size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', height: 20 }} />
                </Box>

                {/* Source + days + action */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip label={lead.source.replace('_', ' ')} size="small"
                    sx={{ bgcolor: `${sourceColors[lead.source]}15`, color: sourceColors[lead.source], fontSize: '0.6rem', fontWeight: 700, height: 18 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem' }}>
                      {lead.daysInStage}d
                    </Typography>
                    <IconButton size="small" onClick={() => navigate(`/cpos/crm/leads/${lead.id}`)}
                      sx={{ color: 'rgba(255,255,255,0.25)', p: 0.25, '&:hover': { color: '#4F6AF5' } }}>
                      <OpenInNewIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            ))}

            {leadsForStage(stage).length === 0 && (
              <Box sx={{ border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px', p: 2.5, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem' }}>
                  Drop a lead here
                </Typography>
              </Box>
            )}
          </Box>
        ))}
      </Box>

      {/* Add Lead Dialog */}
      <Dialog open={!!addDialogStage} onClose={() => setAddDialogStage(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '20px', bgcolor: '#0D1526', border: '1px solid rgba(255,255,255,0.08)' } }}>
        <DialogTitle sx={{ color: '#fff', fontWeight: 800 }}>
          Add New Lead
          {addDialogStage && (
            <Chip label={STAGE_LABELS[addDialogStage]} size="small" sx={{ ml: 1.5, bgcolor: `${stageColors[addDialogStage]}20`, color: stageColors[addDialogStage], fontWeight: 700 }} />
          )}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Full Name *" size="small" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <TextField label="Phone *" size="small" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            <TextField label="Email" size="small" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            <TextField label="Budget (₹)" size="small" placeholder="e.g. ₹1.5 Cr" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} />
            <TextField label="Budget in Lakhs" type="number" size="small" value={form.budgetLakhs} onChange={e => setForm(p => ({ ...p, budgetLakhs: e.target.value }))} />
            <TextField select label="Property Type" size="small" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              {PROPERTY_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField select label="Source" size="small" value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value as LeadSource }))}>
              {SOURCES.map(s => <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>)}
            </TextField>
            <TextField select label="Assign To" size="small" value={form.assignedTo} onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))}>
              {AGENTS.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setAddDialogStage(null)} sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleAddLead} disabled={!form.name || !form.phone}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: '#4F6AF5' }}>
            Add Lead
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CRMPipelinePage;
