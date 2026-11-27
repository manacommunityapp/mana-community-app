import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

interface FreqCapIndicatorProps {
  impressionCount: number;
  capLimit: number;
}

function getBarColor(pct: number): 'success' | 'warning' | 'error' {
  if (pct >= 80) return 'error';
  if (pct >= 50) return 'warning';
  return 'success';
}

export function FreqCapIndicator({ impressionCount, capLimit }: FreqCapIndicatorProps) {
  const pct = capLimit > 0 ? Math.min((impressionCount / capLimit) * 100, 100) : 0;
  const color = getBarColor(pct);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Frequency Cap
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {impressionCount} / {capLimit} impressions today
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        color={color}
        sx={{ borderRadius: 1, height: 6 }}
      />
    </Box>
  );
}
