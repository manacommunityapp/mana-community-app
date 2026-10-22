import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormControl, InputLabel, Select,
  MenuItem, Chip, Alert, CircularProgress, LinearProgress, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import { CRMNav } from './CRMNav';
import { crmService } from '../../../../services/cpos/crmService';
import type { DripSequenceDto, DripStepDto } from '../../../../services/cpos/crmService';
import { STAGES, STAGE_LABELS } from './crmData';
import { useCrmRole } from '../../../../hooks/useCrmRole';

const emptyStep = (): DripStepDto => ({ delayDays: 1, subject: '', bodyHtml: '' });

export default function DripSequencesPage() {
  const { isAdmin } = useCrmRole();
  const [sequences, setSequences] = useState<DripSequenceDto[]>([]);
  const [loading, setLoading]     = useState(true);
  const [dlgOpen, setDlgOpen]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const [name, setName]               = useState('');
  const [triggerStage, setTriggerStage] = useState('');
  const [steps, setSteps]             = useState<DripStepDto[]>([emptyStep()]);

  useEffect(() => {
    crmService.getDripSequences()
      .then(setSequences)
      .catch(() => setSequences([]))
      .finally(() => setLoading(false));
  }, []);

  const resetForm = () => { setName(''); setTriggerStage(''); setSteps([emptyStep()]); setError(''); };

  const handleCreate = async () => {
    if (!name.trim()) { setError('Sequence name is required.'); return; }
    if (steps.some(s => !s.subject.trim() || !s.bodyHtml.trim())) {
      setError('All steps need a subject and body.'); return;
    }
    setSaving(true); setError('');
    try {
      const seq = await crmService.createDripSequence({ name, triggerStage, active: true, steps });
      setSequences(prev => [...prev, seq]);
      resetForm();
      setDlgOpen(false);
    } catch {
      setError('Failed to create sequence.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (seqId: number) => {
    if (!window.confirm('Delete this drip sequence?')) return;
    await crmService.deleteDripSequence(seqId).catch(() => {});
    setSequences(prev => prev.filter(s => s.id !== seqId));
  };

  const updateStep = (i: number, patch: Partial<DripStepDto>) =>
    setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <CRMNav />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon sx={{ color: '#4F6AF5' }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Email Drip Sequences</Typography>
        </Box>
        {isAdmin && (
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setDlgOpen(true)}>
            New Sequence
          </Button>
        )}
      </Box>

      {loading && <LinearProgress />}

      {!loading && sequences.length === 0 && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography color="text.secondary">No drip sequences yet. Create one to start nurturing leads automatically.</Typography>
        </Paper>
      )}

      {sequences.map(seq => (
        <Paper key={seq.id} sx={{ p: 3, borderRadius: '16px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{seq.name}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                {seq.triggerStage && (
                  <Chip label={`Triggers on: ${STAGE_LABELS[seq.triggerStage as keyof typeof STAGE_LABELS] ?? seq.triggerStage}`}
                    size="small" color="primary" variant="outlined" />
                )}
                <Chip label={seq.active ? 'Active' : 'Paused'} size="small"
                  color={seq.active ? 'success' : 'default'} />
                <Chip label={`${seq.steps.length} step${seq.steps.length !== 1 ? 's' : ''}`} size="small" />
              </Box>
            </Box>
            {isAdmin && (
              <IconButton size="small" color="error" onClick={() => handleDelete(seq.id!)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
          <Divider sx={{ mb: 1.5 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {seq.steps.map((step, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Chip label={`Day ${step.delayDays}`} size="small" sx={{ bgcolor: 'rgba(79,106,245,0.15)', color: '#7B93FF', minWidth: 56 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{step.subject}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      ))}

      <Dialog open={dlgOpen} onClose={() => { if (!saving) { resetForm(); setDlgOpen(false); } }} maxWidth="md" fullWidth>
        <DialogTitle>New Drip Sequence</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '12px !important' }}>
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Sequence Name" value={name} onChange={e => setName(e.target.value)} size="small" fullWidth />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Trigger Stage</InputLabel>
              <Select value={triggerStage} label="Trigger Stage" onChange={e => setTriggerStage(e.target.value)}>
                <MenuItem value="">Any stage change</MenuItem>
                {STAGES.map(s => <MenuItem key={s} value={s}>{STAGE_LABELS[s]}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Steps (sent after N days in stage)</Typography>
          {steps.map((step, i) => (
            <Paper key={i} variant="outlined" sx={{ p: 2, borderRadius: '12px' }}>
              <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'center' }}>
                <TextField label="Delay (days)" type="number" value={step.delayDays} size="small" sx={{ width: 120 }}
                  slotProps={{ htmlInput: { min: 0 } }} onChange={e => updateStep(i, { delayDays: parseInt(e.target.value) || 0 })} />
                <TextField label="Subject" value={step.subject} size="small" fullWidth
                  onChange={e => updateStep(i, { subject: e.target.value })} />
                {steps.length > 1 && (
                  <IconButton size="small" onClick={() => setSteps(prev => prev.filter((_, idx) => idx !== i))}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              <TextField label="Email Body (HTML supported)" value={step.bodyHtml} multiline rows={4} fullWidth size="small"
                placeholder="Hi {{name}}, just following up on your enquiry..."
                onChange={e => updateStep(i, { bodyHtml: e.target.value })} />
            </Paper>
          ))}
          <Button startIcon={<AddIcon />} variant="outlined" size="small" sx={{ alignSelf: 'flex-start' }}
            onClick={() => setSteps(prev => [...prev, emptyStep()])}>
            Add Step
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { resetForm(); setDlgOpen(false); }} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : 'Create Sequence'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
