import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getOtaManifest,
  getOtaBundle,
  loadCachedOtaBundle,
  synthesizeTtsPrompt,
  submitVoiceGateEntry,
  listVoiceGateEntries,
} from "./otaLocalizationService";
import apiClient from "../apiClient";

vi.mock("../apiClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("OTA Vernacular Localization, TTS Prompt & Voice Gate Entry Service", () => {
  const memStorage = new Map<string, string>();

  beforeEach(() => {
    vi.clearAllMocks();
    memStorage.clear();
    if (typeof globalThis.localStorage === "undefined") {
      vi.stubGlobal("localStorage", {
        getItem: (k: string) => memStorage.get(k) ?? null,
        setItem: (k: string, v: string) => memStorage.set(k, v),
        removeItem: (k: string) => memStorage.delete(k),
        clear: () => memStorage.clear(),
      });
    }
  });

  it("fetches OTA locale manifest and caches downloaded Telugu gate bundle locally", async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      locale: "te",
      direction: "ltr",
      fontProfile: { family: "Noto Sans Telugu", fontUrl: "/fonts/te.woff2", lineHeightMultiplier: 1.5 },
      namespaces: { gate: { namespace: "gate", versionHash: "sha256-te-1", bundleUrl: "/cdn/te/gate.json", stringCount: 18 } },
    });

    const manifest = await getOtaManifest("te");
    expect(manifest.fontProfile.family).toBe("Noto Sans Telugu");
    expect(apiClient.get).toHaveBeenCalledWith("/i18n/manifest", { params: { locale: "te" } });

    const sampleBundle = {
      bundleId: "te:gate:v1",
      locale: "te",
      namespace: "gate",
      versionHash: "sha256-te-1",
      direction: "ltr",
      fontProfile: { family: "Noto Sans Telugu", fontUrl: "/fonts/te.woff2", lineHeightMultiplier: 1.5 },
      strings: { "gate.approve": "అనుమతించు" },
      ttsHints: { "gate.approve": "తెలుగు వాయిస్ సూచన" },
      publishedAt: "2026-11-28T00:00:00Z",
    };
    (apiClient.get as any).mockResolvedValueOnce(sampleBundle);

    const downloaded = await getOtaBundle("te", "gate");
    expect(downloaded.strings["gate.approve"]).toBe("అనుమతించు");
    expect(loadCachedOtaBundle("te", "gate")?.versionHash).toBe("sha256-te-1");
  });

  it("requests content-hashed TTS prompt and dispatches 2s voice gate clip for resident alert", async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      cacheKey: "te:female-v1:sha256",
      locale: "te",
      voiceId: "female-v1",
      normalizedText: "డెలివరీ వచ్చింది",
      audioUrl: "https://cdn.example/tts/deliv.opus",
      codec: "opus",
      durationMs: 1850,
      sizeBytes: 6200,
      cacheHit: true,
    });

    const tts = await synthesizeTtsPrompt("te", "డెలివరీ వచ్చింది", "female-v1");
    expect(tts.cacheHit).toBe(true);
    expect(tts.codec).toBe("opus");

    (apiClient.post as any).mockResolvedValueOnce({
      entryId: "vg-901",
      societyId: 412,
      guardUserId: "guard-7",
      flatNumber: "C-302",
      guardLocale: "te",
      residentLocale: "en",
      audioUrl: "https://cdn.example/voice/vg-901.opus",
      audioCodec: "opus",
      durationMs: 2100,
      audioSizeBytes: 5400,
      detectedVisitorName: "Ramesh",
      detectedOrgName: "Urban Company",
      status: "RINGING_RESIDENT",
      expiresAt: "2026-11-29T00:00:00Z",
      createdAt: "2026-11-28T00:00:00Z",
    });

    const entry = await submitVoiceGateEntry({
      societyId: 412,
      guardUserId: "guard-7",
      flatNumber: "C-302",
      guardLocale: "te",
      residentLocale: "en",
      audioCodec: "opus",
      durationMs: 2100,
      audioSizeBytes: 5400,
      spokenUtteranceHint: "Ramesh from Urban Company",
    });
    expect(entry.detectedVisitorName).toBe("Ramesh");
    expect(entry.detectedOrgName).toBe("Urban Company");

    (apiClient.get as any).mockResolvedValueOnce([entry]);
    const list = await listVoiceGateEntries(412);
    expect(list).toHaveLength(1);
  });
});
