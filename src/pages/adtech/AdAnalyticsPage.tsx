import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Divider,
  Chip,
} from '@mui/material';
import { getCampaign } from '../../services/adtech/adCampaignService';
import { BudgetPaceBar } from '../../components/adtech/BudgetPaceBar';
import { FreqCapIndicator } from '../../components/adtech/FreqCapIndicator';
import type { AdCampaign, CampaignStatus } from '../../types/adtech';

function StatusChip({ status }: { status: CampaignStatus }) {
  const map: Record<CampaignStatus, { label: string; color: 'success' | 'warning' | 'error' | 'default' | 'info' }> = {
    ACTIVE:    { label: 'Active',    color: 'success' },
    PAUSED:    { label: 'Paused',    color: 'warning' },
    EXHAUSTED: { label: 'Exhausted', color: 'error'   },
    COMPLETED: { label: 'Completed', color: 'info'    },
    DRAFT:     { label: 'Draft',     color: 'default' },
  };
  const { label, color } = map[status] ?? { label: status, color: 'default' };
  return <Chip label={label} color={color} sx={{ fontWeight: 600 }} />;
}

export function AdAnalyticsPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [campaign, setCampaign] = useState<AdCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!campaignId) {
      setError('No campaign ID provided');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getCampaign(campaignId);
      setCampaign(data);
    } catch {
      setError('Failed to load campaign analytics');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !campaign) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error ?? 'Campaign not found'}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: 'auto' }}>
      {/* Campaign header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {campaign.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {campaign.brandName} · {campaign.campaignId}
          </Typography>
        </Box>
        <StatusChip status={campaign.status} />
      </Box>

      {/* Budget & Freq Cap */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            Budget Pacing
          </Typography>
          <BudgetPaceBar
            spentPaise={campaign.spentPaise}
            totalBudgetPaise={campaign.totalBudgetPaise}
            isHalted={campaign.status === 'PAUSED' || campaign.status === 'EXHAUSTED'}
          />
          {campaign.dailyCapPaise !== undefined && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Daily cap:{' '}
              {(campaign.dailyCapPaise / 100).toLocaleString('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0,
              })}
            </Typography>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            Frequency Cap Details
          </Typography>
          <FreqCapIndicator
            impressionCount={0}
            capLimit={campaign.freqCapPerDay}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Cap limit: {campaign.freqCapPerDay} impressions / user / day
          </Typography>
        </Paper>
      </Box>

      {/* Targeting */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
          Targeting
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Cities
            </Typography>
            <Typography variant="body2">
              {campaign.targeting.cities?.join(', ') ?? 'All cities'}
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Flat Types
            </Typography>
            <Typography variant="body2">
              {campaign.targeting.flatTypes?.join(', ') ?? 'All types'}
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Segments
            </Typography>
            <Typography variant="body2">
              {campaign.targeting.segments?.join(', ') ?? 'All segments'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Impression Heatmap Placeholder */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Impression Heatmap by Time of Day
        </Typography>
        <Box
          sx={{
            height: 180,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'action.hover',
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            📊 Heatmap visualization coming soon.
            <br />
            Will show impression volume per hour of the day.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
