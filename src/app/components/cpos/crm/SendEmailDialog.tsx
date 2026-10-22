import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, MenuItem,
  CircularProgress, Chip,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import { crmService, type CrmEmailTemplateDto } from '../../../../services/cpos/crmService';

interface Props {
  open: boolean;
  leadId: string | number;
  leadName: string;
  leadEmail: string | null;
  onClose: () => void;
  onSent: () => void;
}

export function SendEmailDialog({ open, leadId, leadName, leadEmail, onClose, onSent }: Props) {
  const [templates, setTemplates] = useState<CrmEmailTemplateDto[]>([]);
  const [selectedId, setSelectedId] = useState<number | ''>('');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setTo(leadEmail ?? '');
      setError('');
      crmService.getEmailTemplates().then(setTemplates).catch(() => setTemplates([]));
    }
  }, [open, leadEmail]);

  const handleTemplateChange = (id: number | '') => {
    setSelectedId(id);
    if (id === '') { setSubject(''); setBody(''); return; }
    const tpl = templates.find(t => t.id === id);
    if (tpl) { setSubject(tpl.subject); setBody(tpl.body); }
  };

  const handleSend = async () => {
    if (!to.trim() || !subject.trim()) {
      setError('Recipient email and subject are required.');
      return;
    }
    setError('');
    setSending(true);
    try {
      await crmService.sendLeadEmail(leadId, { to, subject, body });
      onSent();
      onClose();
    } catch {
      setError('Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { bgcolor: '#0D1526', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 } }}>
      <DialogTitle sx={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
        <EmailIcon sx={{ color: '#4F6AF5', fontSize: 20 }} />
        Send Email to {leadName}
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        {/* Template picker */}
        {templates.length > 0 && (
          <TextField select size="small" label="Use template (optional)"
            value={selectedId}
            onChange={e => handleTemplateChange(e.target.value === '' ? '' : Number(e.target.value))}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}>
            <MenuItem value="">— None —</MenuItem>
            {templates.map(t => (
              <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
            ))}
          </TextField>
        )}

        <TextField size="small" label="To (email)" value={to}
          onChange={e => setTo(e.target.value)}
          placeholder="lead@example.com"
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />

        <TextField size="small" label="Subject" value={subject}
          onChange={e => setSubject(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />

        <TextField
          label="Body (HTML supported)" value={body}
          onChange={e => setBody(e.target.value)}
          multiline rows={8}
          placeholder="<p>Dear {{leadName}},</p>..."
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontFamily: 'monospace', fontSize: '0.82rem' } }} />

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {['{{leadName}}', '{{agentName}}', '{{phone}}', '{{email}}'].map(tag => (
            <Chip key={tag} label={tag} size="small" onClick={() => setBody(b => b + tag)}
              sx={{ cursor: 'pointer', bgcolor: 'rgba(79,106,245,0.12)', color: '#7B93FF', fontSize: '0.7rem' }} />
          ))}
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', alignSelf: 'center', ml: 0.5 }}>
            click to insert
          </Typography>
        </Box>

        {error && (
          <Typography variant="caption" sx={{ color: '#EF4444' }}>{error}</Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: 'rgba(255,255,255,0.5)' }}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSend} disabled={sending}
          startIcon={sending ? <CircularProgress size={14} /> : <EmailIcon />}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', bgcolor: '#4F6AF5' }}>
          {sending ? 'Sending…' : 'Send Email'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
