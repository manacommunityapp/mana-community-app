import React, { useRef, useState } from 'react';
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Alert, LinearProgress, Chip,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { crmService } from '../../../../services/cpos/crmService';
import type { ImportResultDto } from '../../../../services/cpos/crmService';

interface Props {
  onImported: () => void;
}

export default function CrmImportButton({ onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResultDto | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError('');
    setResult(null);
    setOpen(true);
    try {
      const res = await crmService.importLeads(file);
      setResult(res);
      if (res.created > 0) onImported();
    } catch {
      setError('Import failed. Check your file format and try again.');
    } finally {
      setImporting(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <Button
        variant="outlined"
        startIcon={<UploadFileIcon />}
        size="small"
        onClick={() => inputRef.current?.click()}
        sx={{ textTransform: 'none', borderRadius: 2 }}
      >
        Import CSV
      </Button>

      <Dialog open={open} onClose={() => !importing && setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>CSV Import</DialogTitle>
        <DialogContent>
          {importing && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Importing leads…
              </Typography>
              <LinearProgress />
            </Box>
          )}
          {error && <Alert severity="error">{error}</Alert>}
          {result && !importing && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label={`${result.created} created`} color="success" size="small" />
                <Chip label={`${result.duplicates} skipped`} color="warning" size="small" />
                <Chip label={`${result.errors} errors`} color={result.errors > 0 ? 'error' : 'default'} size="small" />
              </Box>
              {result.errorMessages.length > 0 && (
                <Box sx={{ bgcolor: 'error.main', bgcolor: 'action.hover', borderRadius: 1, p: 1.5 }}>
                  <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 0.5 }}>Errors:</Typography>
                  {result.errorMessages.slice(0, 5).map((msg, i) => (
                    <Typography key={i} variant="caption" display="block" color="error.main">{msg}</Typography>
                  ))}
                  {result.errorMessages.length > 5 && (
                    <Typography variant="caption" color="text.secondary">+{result.errorMessages.length - 5} more</Typography>
                  )}
                </Box>
              )}
              <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 1.5 }}>
                <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 0.5 }}>
                  Expected CSV columns:
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                  lead_name, phone, email, source, stage, budget_l, assigned_to
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={importing}>Close</Button>
          {!importing && (
            <Button variant="outlined" onClick={() => inputRef.current?.click()}>
              Import Another
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
