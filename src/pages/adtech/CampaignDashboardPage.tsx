import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { toast } from 'sonner';
import { listCampaigns, pauseCampaign, resumeCampaign } from '../../services/adtech/adCampaignService';
import { BudgetPaceBar } from '../../components/adtech/BudgetPaceBar';
import { FreqCapIndicator } from '../../components/adtech/FreqCapIndicator';
import type { AdCampaign, CampaignStatus } from '../../types/adtech';

function StatusChip({ status }: { status: CampaignStatus }) {
  const map: Record<CampaignStatus, { label: string; color: 'success' | 'warning' | 'error' | 'default' | 'info' }> = {
    ACTIVE:    { label: 'Active',     color: 'success' },
    PAUSED:    { label: 'Paused',     color: 'warning' },
    EXHAUSTED: { label: 'Exhausted',  color: 'error'   },
    COMPLETED: { label: 'Completed',  color: 'info'    },
    DRAFT:     { label: 'Draft',      color: 'default' },
  };
  const { label, color } = map[status] ?? { label: status, color: 'default' };
  return <Chip label={label} color={color} size="small" sx={{ fontWeight: 600 }} />;
}

export function CampaignDashboardPage() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCampaigns();
      setCampaigns(data);
    } catch {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePause = async (campaignId: string) => {
    try {
      await pauseCampaign(campaignId);
      toast.success('Campaign paused');
      load();
    } catch {
      toast.error('Failed to pause campaign');
    }
  };

  const handleResume = async (campaignId: string) => {
    try {
      await resumeCampaign(campaignId);
      toast.success('Campaign resumed');
      load();
    } catch {
      toast.error('Failed to resume campaign');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Ad Campaigns
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and monitor your advertising campaigns
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => toast.info('New Campaign wizard coming soon!')}
        >
          New Campaign
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Campaign</strong></TableCell>
                <TableCell><strong>Brand</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell sx={{ minWidth: 180 }}><strong>Budget Used</strong></TableCell>
                <TableCell sx={{ minWidth: 160 }}><strong>Freq Cap</strong></TableCell>
                <TableCell><strong>Targeting</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {campaigns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No campaigns found
                  </TableCell>
                </TableRow>
              )}
              {campaigns.map((c) => (
                <TableRow key={c.campaignId} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {c.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {c.campaignId}
                    </Typography>
                  </TableCell>
                  <TableCell>{c.brandName}</TableCell>
                  <TableCell><StatusChip status={c.status} /></TableCell>
                  <TableCell>
                    <BudgetPaceBar
                      spentPaise={c.spentPaise}
                      totalBudgetPaise={c.totalBudgetPaise}
                      isHalted={c.status === 'PAUSED' || c.status === 'EXHAUSTED'}
                    />
                  </TableCell>
                  <TableCell>
                    <FreqCapIndicator
                      impressionCount={0}
                      capLimit={c.freqCapPerDay}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      {c.targeting.cities?.join(', ') ?? '—'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {c.targeting.flatTypes?.join(', ') ?? 'All types'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {c.status === 'ACTIVE' ? (
                      <Tooltip title="Pause">
                        <IconButton size="small" onClick={() => handlePause(c.campaignId)}>
                          <PauseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : c.status === 'PAUSED' ? (
                      <Tooltip title="Resume">
                        <IconButton size="small" color="success" onClick={() => handleResume(c.campaignId)}>
                          <PlayArrowIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
