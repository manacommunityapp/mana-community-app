import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, FormControl, InputLabel, Select, MenuItem,
  Box, Typography, Alert, Chip, CircularProgress,
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import { crmService } from '../../../../services/cpos/crmService';
import type { EmailCampaignDto } from '../../../../services/cpos/crmService';
import { STAGES, STAGE_LABELS } from './crmData';

const SOURCES = ['WALK_IN','BROKER','PORTAL','WHATSAPP','REFERRAL','WEBSITE'];

interface Props {
  open: boolean;
  onClose: () => void;
  onSent?: (campaign: EmailCampaignDto) => void;
}

const PLACEHOLDERS = ['{{name}}', '{{phone}}'];

export default function BulkEmailCampaignDialog({ open, onClose, onSent }: Props) {
  const [subject, setSubject]     = useState('');
  const [bodyHtml, setBodyHtml]   = useState('');
  const [stage, setStage]         = useState('');
  const [source, setSource]       = useState('');
  const [sending, setSending]     = useState(false);
  const [result, setResult]       = useState<EmailCampaignDto | null>(null);
  const [error, setError]         = useState('');

  const handleClose = () => {
    if (!sending) {
      setSubject(''); setBodyHtml(''); setStage(''); setSource('');
      setResult(null); setError('');
      onClose();
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !bodyHtml.trim()) {
      setError('Subject and body are required.');
      return;
    }
    setSending(true); setError('');
    try {
      const campaign = await crmService.sendBulkEmailCampaign({
        subject: subject.trim(),
        bodyHtml: bodyHtml.trim(),
        filterStage: stage || undefined,
        filterSource: source || undefined,
      });
      setResult(campaign);
      onSent?.(campaign);
    } catch {
      setError('Failed to send campaign. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CampaignIcon color="primary" />
        Bulk Email Campaign
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
        {result ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Chip label={`✓ Sent to ${result.sentCount} lead${result.sentCount !== 1 ? 's' : ''}`}
                  color="success" sx={{ fontSize: 15, px: 2, py: 3 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              Subject: <strong>{result.subject}</strong>
            </Typography>
            {(result.filterStage || result.filterSource) && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Filter: {result.filterStage && `Stage = ${result.filterStage}`}
                {result.filterStage && result.filterSource && ', '}
                {result.filterSource && `Source = ${result.filterSource}`}
              </Typography>
            )}
          </Box>
        ) : (
          <>
            {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter Stage (optional)</InputLabel>
                <Select value={stage} label="Filter Stage (optional)" onChange={e => setStage(e.target.value)}>
                  <MenuItem value="">All Stages</MenuItem>
                  {STAGES.filter(s => s !== 'CLOSED').map(s => (
                    <MenuItem key={s} value={s}>{STAGE_LABELS[s]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Filter Source (optional)</InputLabel>
                <Select value={source} label="Filter Source (optional)" onChange={e => setSource(e.target.value)}>
                  <MenuItem value="">All Sources</MenuItem>
                  {SOURCES.map(s => (
                    <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <TextField
              label="Subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              size="small"
              fullWidth
            />

            <Box>
              <TextField
                label="Email body (HTML supported)"
                value={bodyHtml}
                onChange={e => setBodyHtml(e.target.value)}
                multiline
                rows={6}
                fullWidth
                size="small"
                placeholder="Hi {{name}}, thank you for your interest..."
              />
              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.75, flexWrap: 'wrap' }}>
                <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                  Placeholders:
                </Typography>
                {PLACEHOLDERS.map(p => (
                  <Chip
                    key={p}
                    label={p}
                    size="small"
                    clickable
                    sx={{ fontFamily: 'monospace', fontSize: 11 }}
                    onClick={() => setBodyHtml(prev => prev + p)}
                  />
                ))}
              </Box>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 1 }}>
              Emails will be sent to all leads matching the filter that have an email address on file.
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{result ? 'Close' : 'Cancel'}</Button>
        {!result && (
          <Button variant="contained" onClick={handleSend} disabled={sending || !subject.trim() || !bodyHtml.trim()}>
            {sending ? <><CircularProgress size={16} sx={{ mr: 1 }} />Sending…</> : 'Send Campaign'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
