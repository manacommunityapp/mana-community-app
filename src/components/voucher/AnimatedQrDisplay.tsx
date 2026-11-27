import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Paper, Typography, Alert } from '@mui/material';
import type { SignedVoucherToken, SampleVoucher } from '../../types/voucher';
import { generateTotp } from '../../utils/totpUtils';
import { encodeQrString, isVoucherExpired } from '../../utils/voucherQrUtils';

interface AnimatedQrDisplayProps {
  token: SignedVoucherToken;
  voucher: SampleVoucher;
}

interface QrState {
  qrString: string;
  secondsLeft: number;
  otp: string;
}

const TOTP_PERIOD = 30;

/** Draws a simple placeholder grid pattern on a canvas to look QR-code-ish */
function drawPlaceholderQr(canvas: HTMLCanvasElement, seed: string): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const size = canvas.width;
  const cells = 21;
  const cellSize = size / cells;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Pseudo-random fill based on seed characters
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      const charCode = seed.charCodeAt((r * cells + c) % seed.length) || 0;
      const isBlack = (charCode + r * 3 + c * 7) % 3 !== 0;
      ctx.fillStyle = isBlack ? '#000000' : '#ffffff';
      ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
    }
  }

  // Draw 3 finder patterns (top-left, top-right, bottom-left)
  const drawFinder = (x: number, y: number): void => {
    const s = cellSize;
    ctx.fillStyle = '#000000';
    ctx.fillRect(x * s, y * s, 7 * s, 7 * s);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect((x + 1) * s, (y + 1) * s, 5 * s, 5 * s);
    ctx.fillStyle = '#000000';
    ctx.fillRect((x + 2) * s, (y + 2) * s, 3 * s, 3 * s);
  };
  drawFinder(0, 0);
  drawFinder(cells - 7, 0);
  drawFinder(0, cells - 7);
}

export function AnimatedQrDisplay({ token, voucher }: AnimatedQrDisplayProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [qrState, setQrState] = useState<QrState>({
    qrString: '',
    secondsLeft: TOTP_PERIOD,
    otp: '',
  });

  const isExpired = isVoucherExpired(token.payload);

  const generateNewQr = useCallback(async (): Promise<void> => {
    const otp = await generateTotp(token.totpSecret);
    const qrString = encodeQrString(token, otp);
    setQrState((prev) => ({
      ...prev,
      qrString,
      otp,
    }));
  }, [token]);

  // Draw the canvas whenever qrString changes
  useEffect(() => {
    if (canvasRef.current && qrState.qrString) {
      drawPlaceholderQr(canvasRef.current, qrState.qrString);
    }
  }, [qrState.qrString]);

  // Bootstrap + interval
  useEffect(() => {
    void generateNewQr();

    const now = Math.floor(Date.now() / 1000);
    const initialSecondsLeft = TOTP_PERIOD - (now % TOTP_PERIOD);
    setQrState((prev) => ({ ...prev, secondsLeft: initialSecondsLeft }));

    intervalRef.current = setInterval(() => {
      const epoch = Math.floor(Date.now() / 1000);
      const secondsLeft = TOTP_PERIOD - (epoch % TOTP_PERIOD);

      setQrState((prev) => {
        // Regenerate QR at TOTP boundary
        if (secondsLeft > prev.secondsLeft) {
          void generateNewQr();
        }
        return { ...prev, secondsLeft };
      });
    }, 1000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [generateNewQr]);

  // SVG countdown ring params
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const progress = qrState.secondsLeft / TOTP_PERIOD;
  const dashOffset = circumference * (1 - progress);

  return (
    <Box sx={{ position: 'relative', textAlign: 'center', p: 2 }}>
      {/* Header */}
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {voucher.brandName}
      </Typography>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
        {voucher.productName}
      </Typography>

      {/* Countdown ring */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
        <Box sx={{ position: 'relative', width: 60, height: 60 }}>
          <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="30"
              cy="30"
              r={radius}
              fill="none"
              stroke="#e0e0e0"
              strokeWidth="4"
            />
            <circle
              cx="30"
              cy="30"
              r={radius}
              fill="none"
              stroke={qrState.secondsLeft <= 5 ? '#f44336' : '#4caf50'}
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
            />
          </svg>
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: qrState.secondsLeft <= 5 ? 'error.main' : 'success.main',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            {qrState.secondsLeft}s
          </Typography>
        </Box>
      </Box>

      {/* QR canvas placeholder */}
      <Paper
        variant="outlined"
        sx={{
          display: 'inline-block',
          p: 1,
          borderRadius: 1,
          mb: 1,
        }}
      >
        <canvas
          ref={canvasRef}
          width={200}
          height={200}
          style={{ display: 'block' }}
          aria-label="QR Code (scan with kiosk camera)"
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          QR Code (scan with kiosk camera)
        </Typography>
      </Paper>

      {/* Raw QR string (small) */}
      <Box
        sx={{
          maxWidth: 240,
          mx: 'auto',
          wordBreak: 'break-all',
          bgcolor: 'grey.100',
          borderRadius: 1,
          p: 0.5,
          mb: 1,
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.6rem' }}>
          {qrState.qrString}
        </Typography>
      </Box>

      {/* OTP fallback */}
      <Typography variant="h4" sx={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 6, mb: 1 }}>
        {qrState.otp}
      </Typography>

      {/* Disclaimer */}
      <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
        Screenshot won't work — QR refreshes every 30 seconds
      </Typography>

      {/* EXPIRED overlay */}
      {isExpired && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1,
          }}
        >
          <Alert severity="error" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
            EXPIRED
          </Alert>
        </Box>
      )}
    </Box>
  );
}

export default AnimatedQrDisplay;
