import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Button, Paper, IconButton, Tooltip,
  CircularProgress, LinearProgress, Chip,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { crmService, type CrmDocumentDto } from '../../../../services/cpos/crmService';

const ALLOWED_TYPES = [
  'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const MAX_MB = 10;

function fileIcon(mimeType: string | null) {
  if (!mimeType) return <DescriptionIcon sx={{ color: '#7B93FF' }} />;
  if (mimeType.startsWith('image/')) return <ImageIcon sx={{ color: '#10B981' }} />;
  if (mimeType === 'application/pdf') return <PictureAsPdfIcon sx={{ color: '#EF4444' }} />;
  return <DescriptionIcon sx={{ color: '#7B93FF' }} />;
}

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  leadId: string | number;
}

export function DocumentVaultSection({ leadId }: Props) {
  const [docs, setDocs] = useState<CrmDocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    crmService.getDocuments(leadId)
      .then(setDocs)
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [leadId]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('File type not supported. Allowed: PDF, images, Word, Excel.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${MAX_MB} MB.`);
      return;
    }
    setError('');
    setUploading(true);
    setUploadProgress(20);
    try {
      const doc = await crmService.uploadDocument(leadId, file);
      setUploadProgress(100);
      setDocs(prev => [doc, ...prev]);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (docId: number) => {
    try {
      await crmService.deleteDocument(leadId, docId);
      setDocs(prev => prev.filter(d => d.id !== docId));
    } catch {
      setError('Failed to delete document.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Drop zone */}
      <Paper
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        sx={{
          p: 3, borderRadius: '14px', cursor: 'pointer', textAlign: 'center',
          border: `2px dashed ${dragOver ? '#4F6AF5' : 'rgba(255,255,255,0.12)'}`,
          bgcolor: dragOver ? 'rgba(79,106,245,0.06)' : 'rgba(255,255,255,0.02)',
          transition: 'all 0.15s',
          '&:hover': { border: '2px dashed #4F6AF5', bgcolor: 'rgba(79,106,245,0.04)' },
        }}
      >
        <input
          ref={inputRef}
          type="file"
          hidden
          accept={ALLOWED_TYPES.join(',')}
          onChange={e => handleFiles(e.target.files)}
        />
        <UploadFileIcon sx={{ color: '#4F6AF5', fontSize: 32, mb: 1 }} />
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
          Drop a file here or click to browse
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)' }}>
          PDF, images, Word, Excel · max {MAX_MB} MB
        </Typography>
        {uploading && (
          <LinearProgress value={uploadProgress} variant="determinate"
            sx={{ mt: 1.5, borderRadius: 1, '& .MuiLinearProgress-bar': { bgcolor: '#4F6AF5' } }} />
        )}
      </Paper>

      {error && (
        <Typography variant="caption" sx={{ color: '#EF4444' }}>{error}</Typography>
      )}

      {/* Document list */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} sx={{ color: '#4F6AF5' }} />
        </Box>
      ) : docs.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', py: 2 }}>
          No documents attached yet.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {docs.map(doc => (
            <Paper key={doc.id}
              sx={{ p: 1.5, borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ flexShrink: 0 }}>{fileIcon(doc.mimeType)}</Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {doc.fileName}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.25 }}>
                  {doc.fileSize && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)' }}>
                      {formatSize(doc.fileSize)}
                    </Typography>
                  )}
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.25)' }}>
                    {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Typography>
                  {doc.uploadedBy && (
                    <Chip label={doc.uploadedBy} size="small"
                      sx={{ height: 16, fontSize: '0.6rem', bgcolor: 'rgba(79,106,245,0.12)', color: '#7B93FF' }} />
                  )}
                </Box>
              </Box>
              <Tooltip title="Open">
                <IconButton size="small" component="a" href={doc.fileUrl} target="_blank" rel="noopener"
                  sx={{ color: '#4F6AF5', opacity: 0.7, '&:hover': { opacity: 1 } }}>
                  <OpenInNewIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" onClick={() => handleDelete(doc.id)}
                  sx={{ color: '#EF4444', opacity: 0.6, '&:hover': { opacity: 1 } }}>
                  <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
