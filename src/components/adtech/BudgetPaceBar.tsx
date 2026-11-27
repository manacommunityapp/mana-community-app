import React from 'react';
import { Box, LinearProgress, Typography, Chip } from '@mui/material';

interface BudgetPaceBarProps {
  spentPaise: number;
  totalBudgetPaise: number;
  isHalted: boolean;
}

export function BudgetPaceBar({ spentPaise, totalBudgetPaise, isHalted }: BudgetPaceBarProps) {
  const pct =
    totalBudgetPaise > 0
      ? Math.min((spentPaise / totalBudgetPaise) * 100, 100)
      : 0;

  const spentRupees = (spentPaise / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
  const totalRupees = (totalBudgetPaise / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const barColor: 'success' | 'warning' | 'error' = isHalted
    ? 'error'
    : pct >= 90
    ? 'error'
    : pct >= 70
    ? 'warning'
    : 'success';

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5, gap: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {spentRupees} of {totalRupees}
        </Typography>
        {isHalted && (
          <Chip
            label="HALTED"
            size="small"
            color="error"
            sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20 }}
          />
        )}
        <Typography variant="caption" color="text.secondary">
          {pct.toFixed(1)}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        color={barColor}
        sx={{ borderRadius: 1, height: 8 }}
      />
    </Box>
  );
}
