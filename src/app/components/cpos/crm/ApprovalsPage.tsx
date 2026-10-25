import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, CircularProgress, Alert,
  LinearProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { CRMNav } from './CRMNav';
import { crmService } from '../../../../services/cpos/crmService';
import { useCrmRole } from '../../../../hooks/useCrmRole';
import type { Lead } from './crmData';
import { STAGE_LABELS, stageColors } from './crmData';

export default function ApprovalsPage() {
  const { isAdmin } = useCrmRole();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const [dlgLead, setDlgLead] = useState<Lead | null>(null);
  const [approve, setApprove] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    crmService.getLeadsAwaitingApproval()
      .then(setLeads)
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, []);

  const openDlg = (lead: Lead, approving: boolean) => {
    setDlgLead(lead); setApprove(approving); setComment(''); setError('');
  };

  const handleDecide = async () => {
    if (!dlgLead || approve === null) return;
    setSaving(true); setError('');
    try {
      await crmService.approveOrRejectLead(dlgLead.id, approve, comment || undefined);
      setLeads(prev => prev.filter(l => l.id !== dlgLead.id));
      setDlgLead(null);
    } catch {
      setError('Action failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <CRMNav />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Approval Queue</Typography>
        <Chip label={leads.length} color="warning" size="small" sx={{ ml: 1 }} />
      </Box>

      {loading && <LinearProgress />}

      {!loading && leads.length === 0 && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <CheckCircleIcon sx={{ color: '#10B981', fontSize: 40, mb: 1 }} />
          <Typography color="text.secondary">No leads awaiting approval.</Typography>
        </Paper>
      )}

      {leads.map(lead => (
        <Paper key={lead.id} sx={{ p: 3, borderRadius: '16px' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{lead.name}</Typography>
              <Typography variant="body2" color="text.secondary">{lead.phone} · {lead.email}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                <Chip label={STAGE_LABELS[lead.stage as keyof typeof STAGE_LABELS] ?? lead.stage}
                  size="small" sx={{ bgcolor: `${stageColors[lead.stage as keyof typeof stageColors]}22`,
                    color: stageColors[lead.stage as keyof typeof stageColors] }} />
                <Chip label={`₹${lead.budgetLakhs}L`} size="small" />
                {lead.assignedTo && <Chip label={lead.assignedTo} size="small" variant="outlined" />}
              </Box>
              {(lead as any).approvalReason && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Reason: {(lead as any).approvalReason}
                </Typography>
              )}
            </Box>
            {isAdmin && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" color="success" size="small"
                  startIcon={<CheckCircleIcon />} onClick={() => openDlg(lead, true)}>
                  Approve
                </Button>
                <Button variant="outlined" color="error" size="small"
                  startIcon={<CancelIcon />} onClick={() => openDlg(lead, false)}>
                  Reject
                </Button>
              </Box>
            )}
          </Box>
        </Paper>
      ))}

      <Dialog open={!!dlgLead} onClose={() => !saving && setDlgLead(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{approve ? '✓ Approve' : '✗ Reject'} — {dlgLead?.name}</DialogTitle>
        <DialogContent sx={{ pt: '12px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Typography variant="body2" color="text.secondary">
            {approve
              ? 'Approving will move this lead to NEGOTIATION stage.'
              : 'Rejecting will mark this lead as rejected and notify the agent.'}
          </Typography>
          <TextField
            label="Comment (optional)"
            multiline rows={3}
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgLead(null)} disabled={saving}>Cancel</Button>
          <Button variant="contained" color={approve ? 'success' : 'error'}
            onClick={handleDecide} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : (approve ? 'Approve' : 'Reject')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
