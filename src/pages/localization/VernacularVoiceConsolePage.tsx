import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { toast } from 'sonner';
import {
  getOtaBundle,
  getOtaManifest,
  listVoiceGateEntries,
  submitVoiceGateEntry,
  synthesizeTtsPrompt,
} from '../../services/localization/otaLocalizationService';
import type {
  OtaBundle,
  OtaManifestResponse,
  SupportedLocale,
  TtsAudioResponse,
  VoiceGateEntry,
} from '../../types/localization';

const SOCIETY_ID = 1;

const LOCALES: Array<{ code: SupportedLocale; label: string }> = [
  { code: 'te', label: 'Telugu (తెలుగు)' },
  { code: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ta', label: 'Tamil (தமிழ்)' },
  { code: 'hi', label: 'Hindi (हिन्दी)' },
  { code: 'mr', label: 'Marathi (मराठी)' },
  { code: 'ur', label: 'Urdu (اردو · RTL)' },
  { code: 'en', label: 'English' },
];

export function VernacularVoiceConsolePage(): React.ReactElement {
  const [locale, setLocale] = useState<SupportedLocale>('te');
  const [manifest, setManifest] = useState<OtaManifestResponse | null>(null);
  const [bundle, setBundle] = useState<OtaBundle | null>(null);
  const [ttsInfo, setTtsInfo] = useState<TtsAudioResponse | null>(null);

  const [flatNumber, setFlatNumber] = useState('A-402');
  const [utterance, setUtterance] = useState('Urban Company nundi Ramesh');
  const [entries, setEntries] = useState<VoiceGateEntry[]>([]);

  const loadLocale = useCallback(async (loc: SupportedLocale): Promise<void> => {
    try {
      const [m, b, ents] = await Promise.all([
        getOtaManifest(loc),
        getOtaBundle(loc, 'gate'),
        listVoiceGateEntries(SOCIETY_ID),
      ]);
      setManifest(m);
      setBundle(b);
      setEntries(ents);
    } catch {
      // Backend optional in offline preview
    }
  }, []);

  useEffect(() => {
    void loadLocale(locale);
  }, [locale, loadLocale]);

  const handlePlayPrompt = async (): Promise<void> => {
    const text = bundle?.strings['gate.audioPrompt'] ?? 'Tap green button to approve visitor entry';
    try {
      const res = await synthesizeTtsPrompt(locale, text);
      setTtsInfo(res);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = `${locale}-IN`;
        window.speechSynthesis.speak(utt);
      }
      toast.success(res.cacheHit ? 'Played from Redis/S3 TTS cache' : 'Synthesized & cached Opus audio');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'TTS request failed');
    }
  };

  const handleRecordVoiceEntry = async (): Promise<void> => {
    try {
      const created = await submitVoiceGateEntry({
        societyId: SOCIETY_ID,
        guardUserId: 'guard_hyd_01',
        flatNumber,
        guardLocale: locale,
        residentLocale: 'en',
        audioCodec: 'OPUS_16K',
        durationMs: 2000,
        audioSizeBytes: 5120,
        spokenUtteranceHint: utterance,
      });
      setEntries((prev) => [created, ...prev]);
      toast.success(`Dispatched 5 KB Opus voice clip (${created.transcriptTranslated ?? 'audio-only'})`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Voice entry failed');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }} dir={manifest?.direction ?? 'ltr'}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Vernacular OTA i18n &amp; Voice Gate Console
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Over-the-air language bundles, pre-cached Indic TTS prompts, RTL/Indic line-height shaping, and 2-second Opus voice entries.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
        {/* OTA Localization & TTS */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            OTA Bundle &amp; Audio Voiceover ({manifest?.direction?.toUpperCase() ?? 'LTR'})
          </Typography>
          <TextField
            select
            fullWidth
            label="Guard / Staff Language"
            value={locale}
            onChange={(e) => setLocale(e.target.value as SupportedLocale)}
            size="small"
            sx={{ mb: 2 }}
          >
            {LOCALES.map((l) => (
              <MenuItem key={l.code} value={l.code}>
                {l.label}
              </MenuItem>
            ))}
          </TextField>

          {manifest && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Font: <strong>{manifest.fontProfile.family}</strong> · Line Height:{' '}
              <strong>{manifest.fontProfile.lineHeightMultiplier}x</strong> · Direction:{' '}
              <strong>{manifest.direction.toUpperCase()}</strong>
            </Alert>
          )}

          {bundle && (
            <Box
              sx={{
                p: 2,
                bgcolor: 'action.hover',
                borderRadius: 1,
                mb: 2,
                lineHeight: manifest?.fontProfile.lineHeightMultiplier ?? 1.5,
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 'inherit' }}>
                {bundle.strings['gate.audioPrompt']}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                <Chip label={bundle.strings['gate.approve'] ?? 'Approve'} color="success" />
                <Chip label={bundle.strings['gate.deny'] ?? 'Deny'} color="error" variant="outlined" />
              </Box>
            </Box>
          )}

          <Button variant="contained" onClick={() => void handlePlayPrompt()}>
            🔊 Play Cached TTS Voiceover
          </Button>
          {ttsInfo && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              {ttsInfo.codec} · {ttsInfo.sizeBytes} bytes · {ttsInfo.cacheHit ? 'CACHE HIT' : 'SYNTHESIZED'}
            </Typography>
          )}
        </Paper>

        {/* 2-second Voice Gate Entry */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Voice-First Gate Entry (2s Opus → Lock Screen)
          </Typography>
          <TextField
            fullWidth
            label="Destination Flat"
            value={flatNumber}
            onChange={(e) => setFlatNumber(e.target.value)}
            size="small"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Spoken Guard Utterance (Code-Switched)"
            value={utterance}
            onChange={(e) => setUtterance(e.target.value)}
            size="small"
            sx={{ mb: 2 }}
          />
          <Button variant="contained" color="success" onClick={() => void handleRecordVoiceEntry()}>
            🎙️ Simulate 2s Voice Clip Dispatch (5 KB Opus)
          </Button>
        </Paper>
      </Box>

      {/* Recent Voice Entries */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          Recent Voice Gate Entries ({entries.length})
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Flat</TableCell>
              <TableCell>Audio Payload</TableCell>
              <TableCell>Raw Utterance</TableCell>
              <TableCell>Resident Lock-Screen Card</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((e) => (
              <TableRow key={e.entryId}>
                <TableCell>{e.flatNumber}</TableCell>
                <TableCell>{e.audioCodec} ({e.audioSizeBytes} B)</TableCell>
                <TableCell>{e.transcriptRaw ?? '—'}</TableCell>
                <TableCell>{e.transcriptTranslated ?? 'Audio Clip Only'}</TableCell>
                <TableCell><Chip label={e.status} size="small" color="primary" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}

export default VernacularVoiceConsolePage;
