import React, { useState } from 'react';
import {
  Box, Paper, Typography, Button, FormControl, InputLabel, Select, MenuItem,
  Chip, Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Alert, CircularProgress, LinearProgress, OutlinedInput,
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import { CRMNav } from './CRMNav';
import { crmService } from '../../../../services/cpos/crmService';
import type { Lead } from './crmData';
import { STAGES, STAGE_LABELS, stageColors } from './crmData';

const COLUMNS: { key: keyof Lead | 'stageName'; label: string }[] = [
  { key: 'name',        label: 'Name' },
  { key: 'phone',       label: 'Phone' },
  { key: 'email',       label: 'Email' },
  { key: 'stageName',   label: 'Stage' },
  { key: 'source',      label: 'Source' },
  { key: 'budgetLakhs', label: 'Budget (₹L)' },
  { key: 'assignedTo',  label: 'Assigned To' },
  { key: 'createdAt',   label: 'Created' },
  { key: 'followUpDate',label: 'Follow-up' },
];

const STAGE_OPTIONS = STAGES.map(s => ({ value: s, label: STAGE_LABELS[s] }));

export default function CustomReportPage() {
  const [selectedCols, setSelectedCols] = useState<string[]>(['name', 'stageName', 'source', 'budgetLakhs', 'assignedTo']);
  const [filterStages, setFilterStages] = useState<string[]>([]);
  const [rows, setRows]                 = useState<Lead[] | null>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  const runReport = async () => {
    setLoading(true); setError(''); setRows(null);
    try {
      const all = await crmService.getLeads();
      const filtered = filterStages.length ? all.filter(l => filterStages.includes(l.stage)) : all;
      setRows(filtered);
    } catch {
      setError('Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  const getCellValue = (row: Lead, key: string): string => {
    if (key === 'stageName') return STAGE_LABELS[row.stage as keyof typeof STAGE_LABELS] ?? row.stage ?? '';
    const v = (row as any)[key];
    if (v == null) return '—';
    if (typeof v === 'number') return String(v);
    if (typeof v === 'string' && (key === 'createdAt' || key === 'followUpDate'))
      return v.split('T')[0];
    return String(v);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <CRMNav />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BarChartIcon sx={{ color: '#4F6AF5' }} />
        <Typography variant="h5" fontWeight={700}>Custom Report Builder</Typography>
      </Box>

      <Paper sx={{ p: 3, borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Typography variant="subtitle2" fontWeight={700}>Configure Report</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 320, flex: 1 }}>
            <InputLabel>Columns to Show</InputLabel>
            <Select
              multiple
              value={selectedCols}
              label="Columns to Show"
              onChange={e => setSelectedCols(e.target.value as string[])}
              input={<OutlinedInput label="Columns to Show" />}
              renderValue={(sel) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(sel as string[]).map(v => {
                    const col = COLUMNS.find(c => c.key === v);
                    return <Chip key={v} label={col?.label ?? v} size="small" />;
                  })}
                </Box>
              )}
            >
              {COLUMNS.map(col => (
                <MenuItem key={col.key} value={col.key}>{col.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 260, flex: 1 }}>
            <InputLabel>Filter by Stage</InputLabel>
            <Select
              multiple
              value={filterStages}
              label="Filter by Stage"
              onChange={e => setFilterStages(e.target.value as string[])}
              input={<OutlinedInput label="Filter by Stage" />}
              renderValue={(sel) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(sel as string[]).map(v => <Chip key={v} label={STAGE_LABELS[v as keyof typeof STAGE_LABELS] ?? v} size="small" />)}
                </Box>
              )}
            >
              {STAGE_OPTIONS.map(s => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Button variant="contained" sx={{ alignSelf: 'flex-start' }} onClick={runReport} disabled={loading || selectedCols.length === 0}>
          {loading ? <><CircularProgress size={16} sx={{ mr: 1 }} />Running…</> : 'Run Report'}
        </Button>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}
      {loading && <LinearProgress />}

      {rows !== null && (
        <Paper sx={{ borderRadius: '16px', overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>{rows.length} lead{rows.length !== 1 ? 's' : ''}</Typography>
            <Chip label={filterStages.length ? filterStages.map(s => STAGE_LABELS[s as keyof typeof STAGE_LABELS]).join(', ') : 'All Stages'} size="small" />
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {selectedCols.map(key => {
                    const col = COLUMNS.find(c => c.key === key);
                    return <TableCell key={key} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{col?.label ?? key}</TableCell>;
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row: Lead) => (
                  <TableRow key={row.id} hover>
                    {selectedCols.map(key => {
                      const val = getCellValue(row, key);
                      if (key === 'stageName') {
                        const color = stageColors[row.stage as keyof typeof stageColors];
                        return (
                          <TableCell key={key}>
                            <Chip label={val} size="small"
                              sx={{ bgcolor: `${color}22`, color, fontWeight: 600, fontSize: '0.72rem' }} />
                          </TableCell>
                        );
                      }
                      return <TableCell key={key} sx={{ whiteSpace: 'nowrap' }}>{val}</TableCell>;
                    })}
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={selectedCols.length} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      No leads match the selected filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}
