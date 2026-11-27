import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { SampleVoucher, SignedVoucherToken } from '../../types/voucher';
import {
  claimVoucher,
  getMyClaimedVouchers,
  listAvailableVouchers,
} from '../../services/adtech/voucherService';
import { VoucherCard } from '../../components/voucher/VoucherCard';
import { AnimatedQrDisplay } from '../../components/voucher/AnimatedQrDisplay';

const SOCIETY_ID = 'soc_hyd_001';

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps): React.ReactElement {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ py: 2 }}>
      {value === index && children}
    </Box>
  );
}

export function VouchersPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [availableVouchers, setAvailableVouchers] = useState<SampleVoucher[]>([]);
  const [myVouchers, setMyVouchers] = useState<SampleVoucher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // QR dialog
  const [qrDialogOpen, setQrDialogOpen] = useState<boolean>(false);
  const [qrToken, setQrToken] = useState<SignedVoucherToken | null>(null);
  const [qrVoucher, setQrVoucher] = useState<SampleVoucher | null>(null);
  const [qrLoading, setQrLoading] = useState<boolean>(false);

  const loadVouchers = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [available, mine] = await Promise.all([
        listAvailableVouchers(SOCIETY_ID),
        getMyClaimedVouchers(),
      ]);
      setAvailableVouchers(available);
      setMyVouchers(mine);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVouchers();
  }, [loadVouchers]);

  const handleClaim = useCallback(
    async (id: string): Promise<void> => {
      try {
        await claimVoucher(id);
        await loadVouchers();
      } catch (err) {
        console.error('Claim failed', err);
      }
    },
    [loadVouchers]
  );

  const handleViewQr = useCallback(
    async (id: string): Promise<void> => {
      const voucher =
        myVouchers.find((v) => v.id === id) ??
        availableVouchers.find((v) => v.id === id);
      if (!voucher) return;

      setQrVoucher(voucher);
      setQrDialogOpen(true);
      setQrLoading(false);

      // signedToken is included in the claimed voucher response from the backend
      if (voucher.signedToken) {
        setQrToken(voucher.signedToken);
      } else {
        // Refresh claimed vouchers to get the token (backend populates it on claim)
        setQrLoading(true);
        try {
          const updated = await getMyClaimedVouchers();
          const fresh = updated.find((v) => v.id === id);
          setQrToken(fresh?.signedToken ?? null);
        } catch (err) {
          console.error('Failed to refresh voucher token', err);
        } finally {
          setQrLoading(false);
        }
      }
    },
    [myVouchers, availableVouchers]
  );

  const handleCloseQr = (): void => {
    setQrDialogOpen(false);
    setQrToken(null);
    setQrVoucher(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        🎁 Free Sample Vouchers
      </Typography>

      <Tabs
        value={activeTab}
        onChange={(_e, v: number) => setActiveTab(v)}
        sx={{ mb: 1 }}
      >
        <Tab label={`Available (${availableVouchers.length})`} />
        <Tab label={`My Vouchers (${myVouchers.length})`} />
      </Tabs>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ py: 2 }}>
          {error}
        </Typography>
      )}

      {!loading && !error && (
        <>
          <TabPanel value={activeTab} index={0}>
            {availableVouchers.length === 0 ? (
              <Typography color="text.secondary">
                No vouchers available right now.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {availableVouchers.map((voucher) => (
                  <Grid key={voucher.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <VoucherCard
                      voucher={voucher}
                      onClaim={handleClaim}
                      onViewQr={handleViewQr}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {myVouchers.length === 0 ? (
              <Typography color="text.secondary">
                You haven't claimed any vouchers yet.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {myVouchers.map((voucher) => (
                  <Grid key={voucher.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <VoucherCard
                      voucher={voucher}
                      onClaim={handleClaim}
                      onViewQr={handleViewQr}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>
        </>
      )}

      {/* QR Display Dialog */}
      <Dialog open={qrDialogOpen} onClose={handleCloseQr} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Show QR Code
          <IconButton onClick={handleCloseQr} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          {qrLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}
          {qrToken && qrVoucher && (
            <AnimatedQrDisplay token={qrToken} voucher={qrVoucher} />
          )}
          {!qrLoading && !qrToken && (
            <Typography color="error" sx={{ textAlign: 'center' }}>
              Failed to load voucher token.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}

export default VouchersPage;
