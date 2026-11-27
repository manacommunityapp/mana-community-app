import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  Skeleton,
  Chip,
  Button,
  Typography,
  Tooltip,
  Avatar,
} from '@mui/material';
import { requestAd, fireImpression, fireClick } from '../../services/adtech/adCampaignService';
import type { AdResponse } from '../../types/adtech';

interface AdBannerProps {
  placementId: string;
  userId: string;
  societyId: string;
  city: string;
  flatType: string;
}

export function AdBanner({
  placementId,
  userId,
  societyId,
  city,
  flatType,
}: AdBannerProps) {
  const [loading, setLoading] = useState(true);
  const [ad, setAd] = useState<AdResponse | null>(null);
  const impressionFiredRef = useRef(false);
  const impressionId = useRef<string>(crypto.randomUUID());

  const loadAd = useCallback(async () => {
    setLoading(true);
    impressionFiredRef.current = false;
    impressionId.current = crypto.randomUUID();

    try {
      const response = await requestAd({
        placementId,
        userId,
        societyId,
        city,
        flatType,
      });

      if (!response) {
        setAd(null);
        setLoading(false);
        return;
      }

      const delay = response.budgetPacingDelayMs ?? 0;
      if (delay > 0) {
        setTimeout(() => {
          setAd(response);
          setLoading(false);
        }, delay);
      } else {
        setAd(response);
        setLoading(false);
      }
    } catch {
      setAd(null);
      setLoading(false);
    }
  }, [placementId, userId, societyId, city, flatType]);

  useEffect(() => {
    loadAd();
  }, [loadAd]);

  const handleImageLoad = useCallback(() => {
    if (!impressionFiredRef.current && ad) {
      impressionFiredRef.current = true;
      fireImpression({
        impressionId: impressionId.current,
        campaignId: ad.campaignId,
        userId,
        societyId,
        placementId,
        firedAt: new Date().toISOString(),
      });
    }
  }, [ad, userId, societyId, placementId]);

  const handleCtaClick = useCallback(() => {
    if (!ad) return;
    fireClick(impressionId.current, ad.campaignId);
    window.open(ad.creative.ctaUrl, '_blank', 'noopener,noreferrer');
  }, [ad, userId, placementId]);

  if (loading) {
    return (
      <Box sx={{ width: '100%', borderRadius: 2, overflow: 'hidden' }}>
        <Skeleton variant="rectangular" width="100%" height={200} />
        <Box sx={{ p: 1 }}>
          <Skeleton width="40%" height={20} />
          <Skeleton width="60%" height={36} sx={{ mt: 1 }} />
        </Box>
      </Box>
    );
  }

  if (!ad) return null;

  const { creative, freqCapRemaining } = ad;
  const isLastImpression = freqCapRemaining === 1;

  const adBadge = (
    <Chip
      label="Ad"
      variant="outlined"
      size="small"
      sx={{
        fontSize: '0.65rem',
        height: 20,
        bgcolor: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(4px)',
      }}
    />
  );

  return (
    <Box
      sx={{
        width: '100%',
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'relative',
      }}
    >
      {/* Image area */}
      <Box sx={{ position: 'relative' }}>
        {/* Brand logo + name — top-left */}
        {(creative.brandLogoUrl || creative.brandName) && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              bgcolor: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(4px)',
              borderRadius: 2,
              px: 1,
              py: 0.5,
              zIndex: 1,
            }}
          >
            {creative.brandLogoUrl && (
              <Avatar
                src={creative.brandLogoUrl}
                alt={creative.brandName ?? 'Brand'}
                sx={{ width: 20, height: 20 }}
              />
            )}
            {creative.brandName && (
              <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1 }}>
                {creative.brandName}
              </Typography>
            )}
          </Box>
        )}

        {/* Ad badge — top-right */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
          }}
        >
          {isLastImpression ? (
            <Tooltip
              title="Last impression today"
              placement="left"
              arrow
            >
              {adBadge}
            </Tooltip>
          ) : (
            adBadge
          )}
        </Box>

        {/* Creative image */}
        <Box
          component="img"
          src={creative.assetUrl}
          alt={creative.headline ?? creative.brandName ?? 'Ad'}
          onLoad={handleImageLoad}
          sx={{
            width: '100%',
            display: 'block',
            objectFit: 'cover',
            maxHeight: 240,
          }}
        />
      </Box>

      {/* CTA area */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        {creative.headline && (
          <Typography variant="body2" noWrap sx={{ flex: 1, fontWeight: 500 }}>
            {creative.headline}
          </Typography>
        )}
        <Button
          variant="contained"
          size="small"
          onClick={handleCtaClick}
          sx={{ flexShrink: 0 }}
        >
          {creative.ctaText ?? 'Learn More'}
        </Button>
      </Box>
    </Box>
  );
}
