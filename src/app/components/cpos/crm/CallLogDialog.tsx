import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, ToggleButton, ToggleButtonGroup, TextField,
  Box, Typography, Stack, Chip, Switch, FormControlLabel,
} from '@mui/material';
import CallIcon from '@mui/icons-material/Call';
import PhoneMissedIcon from '@mui/icons-material/PhoneMissed';
import PhoneDisabledIcon from '@mui/icons-material/PhoneDisabled';
import { crmService, type LogCallRequest } from '../../../../services/cpos/crmService';

export type CallOutcome = 'CONNECTED' | 'MISSED' | 'BUSY';

interface Props {
  open: boolean;
  leadId: string | number;
  leadName: string;
  onClose: () => void;
  onSaved: () => void;
}

const OUTCOMES: { value: CallOutcome; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'CONNECTED', label: 'Connected', icon: <CallIcon fontSize="small" />, color: '#10B981' },
  { value: 'MISSED',    label: 'Missed',    icon: <PhoneMissedIcon fontSize="small" />, color: '#EF4444' },
  { value: 'BUSY',      label: 'Busy',      icon: <PhoneDisabledIcon fontSize="small" />, color: '#F59E0B' },
];

export function CallLogDialog({ open, leadId, leadName, onClose, onSaved }: Props) {
  const [outcome, setOutcome] = useState<CallOutcome>('CONNECTED');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduleCallback, setScheduleCallback] = useState(false);
  const [callbackDate, setCallbackDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const req: LogCallRequest = {
        outcome,
        durationMin: duration ? parseInt(duration, 10) : null,
        notes: notes.trim() || undefined,
        followUpAt: scheduleCallback && callbackDate ? callbackDate : null,
      };
      await crmService.logCall(leadId, req);
      onSaved();
      handleClose();
    } catch {
      setError('Failed to save call log. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setOutcome('CONNECTED');
    setDuration('');
    setNotes('');
    setScheduleCallback(false);
    setCallbackDate('');
    setError('');
    onClose();
  };

  const selectedOutcome = OUTCOMES.find(o => o.value === outcome)!;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { bgcolor: '#0D1526', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 } }}>
      <DialogTitle sx={{ color: '#fff', pb: 1 }}>
        <Stack direction="row" alignItems="center" gap={1}>
          <CallIcon sx={{ color: '#4F6AF5' }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Log Call</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{leadName}</Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Stack gap={2.5}>
          {/* Outcome */}
          <Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mb: 1, display: 'block' }}>
              OUTCOME
            </Typography>
            <ToggleButtonGroup
              value={outcome}
              exclusive
              onChange={(_, v) => v && setOutcome(v)}
              fullWidth
              size="small"
              sx={{ gap: 1 }}
            >
              {OUTCOMES.map(o => (
                <ToggleButton
                  key={o.value}
                  value={o.value}
                  sx={{
                    flex: 1,
                    border: `1px solid ${outcome === o.value ? o.color : 'rgba(255,255,255,0.1)'} !important`,
                    borderRadius: '8px !important',
                    color: outcome === o.value ? o.color : 'rgba(255,255,255,0.5)',
                    bgcolor: outcome === o.value ? `${o.color}18` : 'transparent',
                    gap: 0.5,
                    '&.Mui-selected': { bgcolor: `${o.color}18` },
                    '&.Mui-selected:hover': { bgcolor: `${o.color}28` },
                  }}
                >
                  {o.icon}
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>{o.label}</Typography>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {/* Duration — only meaningful for CONNECTED */}
          {outcome === 'CONNECTED' && (
            <TextField
              label="Duration (minutes)"
              type="number"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              size="small"
              inputProps={{ min: 0, max: 999 }}
              sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' } }}
            />
          )}

          {/* Notes */}
          <TextField
            label="Notes"
            multiline
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            size="small"
            placeholder="What was discussed?"
            sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' } }}
          />

          {/* Schedule callback for MISSED / BUSY */}
          {(outcome === 'MISSED' || outcome === 'BUSY') && (
            <Box sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 1.5, p: 1.5 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={scheduleCallback}
                    onChange={e => setScheduleCallback(e.target.checked)}
                    size="small"
                    sx={{ '& .MuiSwitch-track': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Schedule callback
                  </Typography>
                }
              />
              {scheduleCallback && (
                <TextField
                  type="datetime-local"
                  value={callbackDate}
                  onChange={e => setCallbackDate(e.target.value)}
                  size="small"
                  fullWidth
                  sx={{ mt: 1, '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' } }}
                />
              )}
            </Box>
          )}

          {/* Outcome summary chip */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={selectedOutcome.icon as React.ReactElement}
              label={selectedOutcome.label}
              size="small"
              sx={{ bgcolor: `${selectedOutcome.color}18`, color: selectedOutcome.color, border: `1px solid ${selectedOutcome.color}40` }}
            />
            {duration && outcome === 'CONNECTED' && (
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                {duration} min
              </Typography>
            )}
          </Box>

          {error && (
            <Typography variant="caption" sx={{ color: '#EF4444' }}>{error}</Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={handleClose} size="small" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          variant="contained"
          size="small"
          sx={{ bgcolor: '#4F6AF5', '&:hover': { bgcolor: '#3d55d4' }, borderRadius: 1.5, px: 3 }}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
