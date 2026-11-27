import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Box,
  Typography,
  Chip,
  Button,
  Avatar,
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import type { SampleVoucher, VoucherStatus } from '../../types/voucher';

interface VoucherCardProps {
  voucher: SampleVoucher;
  onClaim: (id: string) => void;
  onViewQr: (id: string) => void;
}

function formatValidUntil(isoDate: string): string {
  try {
    return 'Valid till ' + format(parseISO(isoDate), 'd MMM yyyy');
  } catch {
    return 'Valid till ' + isoDate;
  }
}

function StatusAction({
  status,
  onClaim,
  onViewQr,
  id,
}: {
  status: VoucherStatus;
  onClaim: () => void;
  onViewQr: () => void;
  id: string;
}): React.ReactElement {
  switch (status) {
    case 'UNCLAIMED':
      return (
        <Button variant="outlined" color="primary" onClick={onClaim} fullWidth>
          Claim Free Sample
        </Button>
      );
    case 'CLAIMED':
      return (
        <Button variant="contained" color="success" onClick={onViewQr} fullWidth>
          Show QR
        </Button>
      );
    case 'REDEEMED':
      return (
        <Button variant="contained" disabled fullWidth sx={{ bgcolor: 'grey.400', color: 'grey.700' }}>
          Redeemed ✓
        </Button>
      );
    case 'EXPIRED':
      return (
        <Button variant="contained" disabled fullWidth sx={{ bgcolor: 'grey.300', color: 'grey.600' }}>
          Expired
        </Button>
      );
    default:
      return (
        <Chip label={status} size="small" color="default" />
      );
  }
}

export function VoucherCard({ voucher, onClaim, onViewQr }: VoucherCardProps): React.ReactElement {
  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 6 },
      }}
    >
      {/* Product image */}
      {voucher.productImageUrl ? (
        <CardMedia
          component="img"
          height="160"
          image={voucher.productImageUrl}
          alt={voucher.productName}
          sx={{ objectFit: 'cover' }}
        />
      ) : (
        <Box
          sx={{
            height: 160,
            bgcolor: 'grey.100',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            No image
          </Typography>
        </Box>
      )}

      <CardContent sx={{ flexGrow: 1, pb: 0 }}>
        {/* Brand row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {voucher.brandLogoUrl && (
            <Avatar
              src={voucher.brandLogoUrl}
              alt={voucher.brandName}
              sx={{ width: 28, height: 28 }}
            />
          )}
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {voucher.brandName}
          </Typography>
        </Box>

        {/* Product name */}
        <Typography variant="subtitle1" gutterBottom sx={{ lineHeight: 1.3, fontWeight: 700 }}>
          {voucher.productName}
        </Typography>

        {/* Valid until */}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {formatValidUntil(voucher.validUntil)}
        </Typography>

        {/* Status chip */}
        <Box sx={{ mb: 1 }}>
          <Chip
            label={voucher.status}
            size="small"
            color={
              voucher.status === 'CLAIMED'
                ? 'success'
                : voucher.status === 'UNCLAIMED'
                ? 'primary'
                : 'default'
            }
            variant={voucher.status === 'UNCLAIMED' ? 'outlined' : 'filled'}
          />
        </Box>

        {/* Kiosk location */}
        {voucher.kioskLocation && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            📍 {voucher.kioskLocation}
            {voucher.kioskOpenFrom && voucher.kioskOpenUntil && (
              <> &bull; {voucher.kioskOpenFrom}–{voucher.kioskOpenUntil}</>
            )}
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 1 }}>
        <StatusAction
          status={voucher.status}
          id={voucher.id}
          onClaim={() => onClaim(voucher.id)}
          onViewQr={() => onViewQr(voucher.id)}
        />
      </CardActions>
    </Card>
  );
}

export default VoucherCard;
