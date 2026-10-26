import React, { useState } from 'react';
import {
  Button, Menu, MenuItem, ListItemIcon, ListItemText, CircularProgress,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TableChartIcon from '@mui/icons-material/TableChart';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import Papa from 'papaparse';
import type { Lead } from './crmData';

interface CsvRow {
  [key: string]: string | number | null | undefined;
}

function buildLeadRows(leads: Lead[]): CsvRow[] {
  return leads.map(l => ({
    'ID': l.id,
    'Lead Name': l.name,
    'Email': l.email,
    'Phone': l.phone,
    'Source': l.source,
    'Stage': l.stage,
    'Lead Type': l.type,
    'Budget (L)': l.budgetLakhs,
    'Assigned To': l.assignedTo,
    'AI Score': l.score,
    'Days in Pipeline': l.daysTotal,
    'Days in Stage': l.daysInStage,
    'Follow-up At': l.followUpAt ?? '',
  }));
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function openPrintWindow(leads: Lead[], title: string) {
  const rows = leads.map(l => `
    <tr>
      <td>${l.id}</td>
      <td>${l.name}</td>
      <td>${l.email ?? ''}</td>
      <td>${l.phone ?? ''}</td>
      <td>${l.stage}</td>
      <td>${l.source}</td>
      <td>₹${l.budgetLakhs}L</td>
      <td>${l.assignedTo ?? ''}</td>
      <td>${l.score}</td>
      <td>${l.daysTotal}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; margin: 24px; }
    h1 { font-size: 16px; margin-bottom: 4px; }
    p { color: #666; font-size: 10px; margin: 0 0 12px; }
    table { border-collapse: collapse; width: 100%; }
    th { background: #1a237e; color: #fff; padding: 6px 8px; text-align: left; font-size: 10px; }
    td { border-bottom: 1px solid #e0e0e0; padding: 5px 8px; font-size: 10px; }
    tr:nth-child(even) td { background: #f5f5f5; }
    @media print { @page { size: A4 landscape; margin: 12mm; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>Generated ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · ${leads.length} leads</p>
  <table>
    <thead>
      <tr><th>ID</th><th>Lead Name</th><th>Email</th><th>Phone</th><th>Stage</th><th>Source</th><th>Budget</th><th>Assigned To</th><th>Score</th><th>Days</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
}

interface Props {
  leads: Lead[];
  filename?: string;
  reportTitle?: string;
  disabled?: boolean;
}

export function CrmExportButton({ leads, filename = 'crm-leads', reportTitle = 'CRM Leads Report', disabled }: Props) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleCsv = () => {
    setAnchor(null);
    setExporting(true);
    try {
      const rows = buildLeadRows(leads);
      const csv = Papa.unparse(rows);
      downloadBlob(csv, `${filename}-${Date.now()}.csv`, 'text/csv;charset=utf-8;');
    } finally {
      setExporting(false);
    }
  };

  const handlePdf = () => {
    setAnchor(null);
    openPrintWindow(leads, reportTitle);
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        disabled={disabled || exporting || leads.length === 0}
        startIcon={exporting ? <CircularProgress size={14} /> : <FileDownloadIcon />}
        onClick={e => setAnchor(e.currentTarget)}
        sx={{
          textTransform: 'none', fontWeight: 700, borderRadius: '10px',
          borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)',
          '&:hover': { borderColor: '#4F6AF5', color: '#7B93FF' },
        }}
      >
        Export
      </Button>

      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { bgcolor: '#0D1526', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' } } }}>
        <MenuItem onClick={handleCsv}>
          <ListItemIcon><TableChartIcon sx={{ color: '#10B981', fontSize: 18 }} /></ListItemIcon>
          <ListItemText primary="Download CSV" slotProps={{ primary: { variant: 'body2', sx: { color: '#fff' } } }} />
        </MenuItem>
        <MenuItem onClick={handlePdf}>
          <ListItemIcon><PictureAsPdfIcon sx={{ color: '#EF4444', fontSize: 18 }} /></ListItemIcon>
          <ListItemText primary="Print / Save PDF" slotProps={{ primary: { variant: 'body2', sx: { color: '#fff' } } }} />
        </MenuItem>
      </Menu>
    </>
  );
}
