import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Alert, CircularProgress, Chip, Box,
} from '@mui/material';
import SmsIcon from '@mui/icons-material/Sms';
import { crmService } from '../../../../services/cpos/crmService';

const TEMPLATES = [
  'Hi {{name}}, thank you for your enquiry. Our team will reach out shortly.',
  'Hello {{name}}, your site visit has been confirmed. Please reach us at {{phone}} for any queries.',
  'Hi {{name}}, just checking if you have any questions about the project. Happy to help!',
];

interface Props {
  open: boolean;
  leadId: number | string;
  leadName: string;
  phone: string;
  onClose: () => void;
}

export default function SendSmsDialog({ open, leadId, leadName, phone, onClose }: Props) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState('');
  const [sent, setSent]       = useState(false);

  const handleClose = () => {
    if (!sending) { setMessage(''); setError(''); setSent(false); onClose(); }
  };

  const handleSend = async () => {
    if (!message.trim()) { setError('Message is required.'); return; }
    setSending(true); setError('');
    try {
      await crmService.sendLeadSms(leadId, message.trim());
      setSent(true);
    } catch {
      setError('Failed to send SMS. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SmsIcon color="primary" /> Send SMS to {leadName}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
        {sent ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Chip label="✓ SMS Sent" color="success" sx={{ fontSize: 15, px: 2, py: 3 }} />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Message sent to {phone}
            </Typography>
          </Box>
        ) : (
          <>
            {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
            <Typography variant="caption" color="text.secondary">Quick templates:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {TEMPLATES.map((t, i) => (
                <Chip key={i} label={`Template ${i + 1}`} size="small" clickable
                  onClick={() => setMessage(t.replace('{{name}}', leadName).replace('{{phone}}', phone))} />
              ))}
            </Box>
            <TextField
              label="Message"
              multiline
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              slotProps={{ htmlInput: { maxLength: 320 } }}
              helperText={`${message.length}/320 characters`}
              fullWidth
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{sent ? 'Close' : 'Cancel'}</Button>
        {!sent && (
          <Button variant="contained" onClick={handleSend} disabled={sending || !message.trim()}>
            {sending ? <><CircularProgress size={16} sx={{ mr: 1 }} />Sending…</> : 'Send SMS'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
