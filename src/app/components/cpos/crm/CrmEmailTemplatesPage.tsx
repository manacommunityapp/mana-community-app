import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, TextField, IconButton, Tooltip,
  CircularProgress, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router';
import { crmService, type CrmEmailTemplateDto } from '../../../../services/cpos/crmService';

const EMPTY = { name: '', subject: '', body: '' };

export const CrmEmailTemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<CrmEmailTemplateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    crmService.getEmailTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => { setEditId(null); setForm(EMPTY); setError(''); setEditOpen(true); };
  const openEdit = (t: CrmEmailTemplateDto) => {
    setEditId(t.id); setForm({ name: t.name, subject: t.subject, body: t.body }); setError(''); setEditOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.subject.trim()) {
      setError('Name and subject are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editId != null) {
        await crmService.updateEmailTemplate(editId, form);
      } else {
        await crmService.createEmailTemplate(form);
      }
      setEditOpen(false);
      load();
    } catch {
      setError('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await crmService.deleteEmailTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <IconButton size="small" onClick={() => navigate(-1)}
          sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#fff' } }}>
          <ArrowBackIcon />
        </IconButton>
        <EmailIcon sx={{ color: '#4F6AF5', fontSize: 22 }} />
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800 }}>Email Templates</Typography>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', bgcolor: '#4F6AF5' }}>
          New Template
        </Button>
      </Box>

      {/* Template list */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress sx={{ color: '#4F6AF5' }} />
        </Box>
      ) : templates.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: '16px', bgcolor: '#0D1526', textAlign: 'center' }}>
          <EmailIcon sx={{ color: 'rgba(255,255,255,0.2)', fontSize: 40, mb: 1 }} />
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            No email templates yet. Create one to get started.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {templates.map(t => (
            <Paper key={t.id} sx={{ p: 2.5, borderRadius: '14px', bgcolor: '#0D1526', border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700 }}>{t.name}</Typography>
                <Typography variant="caption" sx={{ color: '#7B93FF', display: 'block', mt: 0.25 }}>
                  {t.subject}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mt: 0.5,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 600 }}>
                  {t.body.replace(/<[^>]+>/g, ' ').trim().slice(0, 120)}…
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.25)', mt: 0.5, display: 'block' }}>
                  By {t.createdBy} · {new Date(t.updatedAt ?? t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => openEdit(t)}
                    sx={{ color: '#4F6AF5', opacity: 0.7, '&:hover': { opacity: 1 } }}>
                    <EditOutlinedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => handleDelete(t.id)}
                    disabled={deleting === t.id}
                    sx={{ color: '#EF4444', opacity: 0.6, '&:hover': { opacity: 1 } }}>
                    {deleting === t.id
                      ? <CircularProgress size={16} sx={{ color: '#EF4444' }} />
                      : <DeleteIcon sx={{ fontSize: 18 }} />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { bgcolor: '#0D1526', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 } } }}>
        <DialogTitle sx={{ color: '#fff' }}>{editId ? 'Edit Template' : 'New Template'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField size="small" label="Template name" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Site Visit Invitation"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
          <TextField size="small" label="Subject line" value={form.subject}
            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            placeholder="e.g. Let's schedule your site visit, {{leadName}}"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
          <TextField label="Body (HTML)" value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            multiline rows={10}
            placeholder={'<p>Dear {{leadName}},</p>\n<p>...</p>'}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontFamily: 'monospace', fontSize: '0.82rem' } }} />
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>
            Placeholders: {'{{leadName}}  {{agentName}}  {{phone}}  {{email}}'}
          </Typography>
          {error && <Typography variant="caption" sx={{ color: '#EF4444' }}>{error}</Typography>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditOpen(false)} sx={{ textTransform: 'none', color: 'rgba(255,255,255,0.5)' }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            startIcon={saving ? <CircularProgress size={14} /> : null}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', bgcolor: '#4F6AF5' }}>
            {saving ? 'Saving…' : 'Save Template'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
