import apiClient from '../apiClient';
import type {
  OtaBundle,
  OtaManifestResponse,
  TtsAudioResponse,
  VoiceGateEntry,
} from '../../types/localization';

const BUNDLE_CACHE_PREFIX = 'mana_ota_bundle_';

export async function getOtaManifest(locale: string): Promise<OtaManifestResponse> {
  return apiClient.get<OtaManifestResponse>('/i18n/manifest', { params: { locale } });
}

export async function getOtaBundle(locale: string, namespace = 'gate'): Promise<OtaBundle> {
  const bundle = await apiClient.get<OtaBundle>(`/i18n/bundles/${locale}/${namespace}`);
  try {
    localStorage.setItem(`${BUNDLE_CACHE_PREFIX}${locale}_${namespace}`, JSON.stringify(bundle));
  } catch {
    // ignore storage quota
  }
  return bundle;
}

export function loadCachedOtaBundle(locale: string, namespace = 'gate'): OtaBundle | null {
  try {
    const raw = localStorage.getItem(`${BUNDLE_CACHE_PREFIX}${locale}_${namespace}`);
    return raw ? (JSON.parse(raw) as OtaBundle) : null;
  } catch {
    return null;
  }
}

export async function synthesizeTtsPrompt(locale: string, text: string, voiceId?: string): Promise<TtsAudioResponse> {
  return apiClient.post<TtsAudioResponse>('/tts/synthesize', { locale, voiceId, text });
}

export async function submitVoiceGateEntry(payload: {
  societyId: number;
  guardUserId: string;
  flatNumber: string;
  guardLocale: string;
  residentLocale: string;
  audioCodec?: string;
  durationMs?: number;
  audioSizeBytes?: number;
  spokenUtteranceHint?: string;
}): Promise<VoiceGateEntry> {
  return apiClient.post<VoiceGateEntry>('/gate/voice-entry', payload);
}

export async function listVoiceGateEntries(societyId: number): Promise<VoiceGateEntry[]> {
  return apiClient.get<VoiceGateEntry[]>('/gate/voice-entries', { params: { societyId } });
}
