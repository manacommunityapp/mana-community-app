import React, { useEffect, useState } from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { KioskScannerPanel } from '../../components/voucher/KioskScannerPanel';

const KIOSK_ID = 'kiosk-clubhouse-01';

/**
 * Full-screen kiosk operator page for clubhouse sample distribution events.
 * Dark-mode UI sized for a tablet in kiosk mode.
 * Listens to browser online/offline events to toggle the scanner's network mode.
 */
export default function KioskPage(): React.ReactElement {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = (): void => setIsOnline(true);
    const handleOffline = (): void => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0a0a0a',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: 2,
        py: 4,
      }}
    >
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography
          variant="h4"
          sx={{ color: '#ffffff', letterSpacing: 1, fontWeight: 800 }}
        >
          🎁 Sample Distribution Kiosk
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
          Mana Community · Clubhouse Ground Floor
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
          {KIOSK_ID}
        </Typography>
      </Box>

      <Divider sx={{ width: '100%', maxWidth: 720, borderColor: 'rgba(255,255,255,0.12)', mb: 3 }} />

      {/* Scanner panel — rendered on white background card for readability */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 720,
          bgcolor: '#ffffff',
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <KioskScannerPanel kioskId={KIOSK_ID} isOnline={isOnline} />
      </Box>

      {/* Footer */}
      <Typography
        variant="caption"
        sx={{ color: 'rgba(255,255,255,0.2)', mt: 4, textAlign: 'center' }}
      >
        Powered by Mana Community AdTech · All redemptions are logged and synced
      </Typography>
    </Box>
  );
}
