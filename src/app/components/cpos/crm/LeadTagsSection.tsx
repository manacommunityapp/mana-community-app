import React, { useState, useEffect } from 'react';
import {
  Box, Chip, IconButton, Popover, Typography, TextField,
  List, ListItemButton, ListItemText, Button, CircularProgress,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LabelIcon from '@mui/icons-material/Label';
import { crmService } from '../../../../services/cpos/crmService';
import type { LeadTag } from './crmData';

const TAG_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#4F6AF5', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#64748B',
];

interface Props {
  leadId: string;
  tags: LeadTag[];
  onTagsChanged: (tags: LeadTag[]) => void;
  readonly?: boolean;
}

export default function LeadTagsSection({ leadId, tags, onTagsChanged, readonly }: Props) {
  const [allTags, setAllTags] = useState<LeadTag[]>([]);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[3]);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  const open = Boolean(anchorEl);

  useEffect(() => {
    if (open) {
      crmService.getTags().then(setAllTags).catch(() => {});
    }
  }, [open]);

  const handleAdd = async (tag: LeadTag) => {
    if (tags.some(t => t.id === tag.id)) return;
    setLoading(true);
    try {
      const updated = await crmService.addTagToLead(leadId, tag.id);
      onTagsChanged(updated.tags ?? []);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (tagId: number) => {
    if (readonly) return;
    setLoading(true);
    try {
      const updated = await crmService.removeTagFromLead(leadId, tagId);
      onTagsChanged(updated.tags ?? []);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    setCreating(true);
    try {
      const created = await crmService.createTag(newTagName.trim(), newTagColor);
      setAllTags(prev => [...prev, created]);
      setNewTagName('');
      await handleAdd(created);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75 }}>
      {tags.map(tag => (
        <Chip
          key={tag.id}
          label={tag.name}
          size="small"
          onDelete={readonly ? undefined : () => handleRemove(tag.id)}
          sx={{
            bgcolor: tag.color + '22',
            color: tag.color,
            border: `1px solid ${tag.color}55`,
            fontWeight: 600,
            fontSize: '11px',
            '& .MuiChip-deleteIcon': { color: tag.color + 'aa' },
          }}
        />
      ))}
      {loading && <CircularProgress size={14} />}
      {!readonly && (
        <Tooltip title="Add tag">
          <IconButton
            size="small"
            onClick={e => setAnchorEl(e.currentTarget)}
            sx={{ width: 22, height: 22, border: '1px dashed', borderColor: 'divider', color: 'text.secondary' }}
          >
            <AddIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      )}

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { width: 240, p: 1.5, borderRadius: 2 } } }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
          ADD TAG
        </Typography>
        {allTags.filter(t => !tags.some(lt => lt.id === t.id)).length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            All tags applied or none created yet.
          </Typography>
        )}
        <List dense disablePadding>
          {allTags
            .filter(t => !tags.some(lt => lt.id === t.id))
            .map(tag => (
              <ListItemButton key={tag.id} onClick={() => handleAdd(tag)} sx={{ borderRadius: 1, py: 0.25 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: tag.color, mr: 1, flexShrink: 0 }} />
                <ListItemText primary={tag.name} slotProps={{ primary: { sx: { fontSize: 13 } } }} />
              </ListItemButton>
            ))}
        </List>

        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 0.5, display: 'block' }}>
            CREATE NEW TAG
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
            {TAG_COLORS.map(c => (
              <Box
                key={c}
                onClick={() => setNewTagColor(c)}
                sx={{
                  width: 18, height: 18, borderRadius: '50%', bgcolor: c, cursor: 'pointer',
                  outline: c === newTagColor ? `2px solid ${c}` : 'none',
                  outlineOffset: 2,
                }}
              />
            ))}
          </Box>
          <TextField
            size="small"
            fullWidth
            placeholder="Tag name"
            value={newTagName}
            onChange={e => setNewTagName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateTag()}
            sx={{ mb: 0.75 }}
          />
          <Button
            size="small"
            variant="contained"
            fullWidth
            disabled={!newTagName.trim() || creating}
            onClick={handleCreateTag}
            startIcon={<LabelIcon />}
          >
            {creating ? 'Creating…' : 'Create & Apply'}
          </Button>
        </Box>
      </Popover>
    </Box>
  );
}
