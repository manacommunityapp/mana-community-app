import { useCallback, useEffect, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  BookMarked,
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  Layout,
  Loader2,
  Palette,
  Save,
  Sliders,
  Square,
  Type,
} from "lucide-react";
import { GOOGLE_FONTS, type ThemeSettings } from "./themeEngine";
import { ThemeGallery } from "./ThemeGallery";
import { ThemePreview } from "./ThemePreview";
import { themePersistenceService } from "./themePersistenceService";
import { showError, showSuccess } from "../../../../utils/ToastUtils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ColorRow({ label, field, settings, onChange }: { label: string; field: keyof ThemeSettings; settings: ThemeSettings; onChange: (k: keyof ThemeSettings, v: ThemeSettings[keyof ThemeSettings]) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-mono text-muted-foreground">{String(settings[field])}</span>
        <input
          type="color"
          value={String(settings[field])}
          onChange={(e) => onChange(field, e.target.value)}
          className="h-7 w-7 cursor-pointer rounded-md border border-border p-0.5 bg-background"
        />
      </div>
    </div>
  );
}

function SliderRow({ label, field, min, max, unit = "px", settings, onChange }: { label: string; field: keyof ThemeSettings; min: number; max: number; unit?: string; settings: ThemeSettings; onChange: (k: keyof ThemeSettings, v: number) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
        <span className="text-[11px] font-bold text-foreground">{String(settings[field])}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={Number(settings[field])}
        onChange={(e) => onChange(field, Number(e.target.value))}
        className="w-full accent-primary h-1.5 rounded-full"
      />
    </div>
  );
}

function SectionHeader({ icon: Icon, title, open, onToggle }: { icon: React.ComponentType<{ className?: string }>; title: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-left transition-all hover:bg-muted/50 cursor-pointer"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-xs font-bold text-foreground">{title}</span>
      </div>
      {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ThemeBuilderProps {
  communityId: number;
  initialSettings: ThemeSettings;
  savedThemes: { id?: number; name: string; themeJson: string }[];
  onThemeSaved?: (settings: ThemeSettings) => void;
  onThemeSelected?: (settings: ThemeSettings) => void;
}

export function ThemeBuilder({ communityId, initialSettings, savedThemes, onThemeSaved, onThemeSelected }: ThemeBuilderProps) {
  const [settings, setSettings] = useState<ThemeSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Accordion state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    colors: true,
    typography: true,
    buttons: false,
    cards: false,
    spacing: false,
    banner: false,
    background: false,
    gallery: false,
  });

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const toggleSection = useCallback((key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const update = useCallback(<K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setJustSaved(false);
  }, []);

  const applyPreset = useCallback((preset: ThemeSettings) => {
    setSettings(preset);
    setJustSaved(false);
    onThemeSelected?.(preset);
  }, [onThemeSelected]);

  const handleSave = async () => {
    if (!settings.themeName.trim()) { showError("Theme name is required"); return; }
    setSaving(true);
    try {
      // Check if a theme with the same name already exists in saved themes
      const existing = savedThemes.find((t) => t.name === settings.themeName);
      const payload = themePersistenceService.recordFromSettings(settings, communityId, existing?.id);
      await themePersistenceService.save(payload);
      setJustSaved(true);
      showSuccess(`Theme "${settings.themeName}" saved & applied to email preview!`);
      onThemeSaved?.(settings);
    } catch {
      showError("Failed to save theme");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* ── Left panel: Settings ── */}
      <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0 space-y-3">

        {/* Theme name + Save */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Email Theme Builder</h3>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Theme Name</label>
            <input
              value={settings.themeName}
              onChange={(e) => update("themeName", e.target.value)}
              placeholder="e.g. Corporate Blue"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary/60"
            />
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-60 cursor-pointer transition-all"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Saving..." : "Save Theme"}
          </button>
        </div>

        {/* Colors */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <SectionHeader icon={Palette} title="Colors" open={openSections.colors} onToggle={() => toggleSection("colors")} />
          {openSections.colors && (
            <div className="p-3 space-y-2.5">
              <ColorRow label="Primary" field="primaryColor" settings={settings} onChange={update} />
              <ColorRow label="Secondary" field="secondaryColor" settings={settings} onChange={update} />
              <ColorRow label="Accent" field="accentColor" settings={settings} onChange={update} />
              <div className="h-px bg-border my-1" />
              <ColorRow label="Background" field="backgroundColor" settings={settings} onChange={update} />
              <ColorRow label="Card" field="cardColor" settings={settings} onChange={update} />
              <ColorRow label="Text" field="textColor" settings={settings} onChange={update} />
              <div className="h-px bg-border my-1" />
              <ColorRow label="Button Text" field="buttonTextColor" settings={settings} onChange={update} />
              <ColorRow label="Footer BG" field="footerBgColor" settings={settings} onChange={update} />
              <ColorRow label="Footer Text" field="footerTextColor" settings={settings} onChange={update} />
            </div>
          )}
        </div>

        {/* Typography */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <SectionHeader icon={Type} title="Typography" open={openSections.typography} onToggle={() => toggleSection("typography")} />
          {openSections.typography && (
            <div className="p-3 space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Heading Font</label>
                <select
                  value={settings.headingFont}
                  onChange={(e) => update("headingFont", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none"
                >
                  {GOOGLE_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Body Font</label>
                <select
                  value={settings.bodyFont}
                  onChange={(e) => update("bodyFont", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none"
                >
                  {GOOGLE_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <SliderRow label="Heading Size" field="headingSize" min={22} max={52} settings={settings} onChange={update} />
              <SliderRow label="Body Size" field="bodySize" min={12} max={22} settings={settings} onChange={update} />
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <SectionHeader icon={Square} title="Buttons" open={openSections.buttons} onToggle={() => toggleSection("buttons")} />
          {openSections.buttons && (
            <div className="p-3 space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Button Style</label>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {(["filled", "outline", "gradient", "rounded", "square", "pill"] as const).map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => update("buttonStyle", style)}
                      className={`rounded-lg py-1.5 text-[10px] font-bold capitalize transition-all cursor-pointer ${settings.buttonStyle === style ? "bg-primary text-white shadow" : "border border-border text-foreground hover:border-primary/40"}`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
              <SliderRow label="Button Radius" field="buttonRadius" min={0} max={32} settings={settings} onChange={update} />
            </div>
          )}
        </div>

        {/* Cards */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <SectionHeader icon={Layout} title="Cards" open={openSections.cards} onToggle={() => toggleSection("cards")} />
          {openSections.cards && (
            <div className="p-3 space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Card Style</label>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {(["elevation", "glass", "border", "gradient", "minimal"] as const).map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => update("cardStyle", style)}
                      className={`rounded-lg py-1.5 text-[10px] font-bold capitalize transition-all cursor-pointer ${settings.cardStyle === style ? "bg-primary text-white shadow" : "border border-border text-foreground hover:border-primary/40"}`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
              <SliderRow label="Card Radius" field="cardRadius" min={0} max={32} settings={settings} onChange={update} />

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Shadow</label>
                <div className="mt-2 space-y-1">
                  {(["none", "soft", "medium", "strong"] as const).map((s) => (
                    <label key={s} className="flex cursor-pointer items-center gap-2 text-xs">
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all ${settings.shadow === s ? "border-primary" : "border-border"}`}>
                        {settings.shadow === s && <span className="h-2 w-2 rounded-full bg-primary block" />}
                      </span>
                      <input type="radio" className="sr-only" name="shadow" value={s} checked={settings.shadow === s} onChange={() => update("shadow", s)} />
                      <span className="capitalize text-foreground">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Spacing */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <SectionHeader icon={Sliders} title="Spacing & Layout" open={openSections.spacing} onToggle={() => toggleSection("spacing")} />
          {openSections.spacing && (
            <div className="p-3 space-y-3">
              <SliderRow label="Container Width" field="containerWidth" min={480} max={800} settings={settings} onChange={update} />
              <SliderRow label="Padding" field="padding" min={12} max={56} settings={settings} onChange={update} />
              <SliderRow label="Section Gap" field="sectionGap" min={8} max={48} settings={settings} onChange={update} />
            </div>
          )}
        </div>

        {/* Banner */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <SectionHeader icon={BookMarked} title="Banner" open={openSections.banner} onToggle={() => toggleSection("banner")} />
          {openSections.banner && (
            <div className="p-3 space-y-3">
              <SliderRow label="Height" field="bannerHeight" min={160} max={480} settings={settings} onChange={update} />
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Overlay</label>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {(["none", "dark", "light", "gradient"] as const).map((o) => (
                    <button key={o} type="button" onClick={() => update("bannerOverlay", o)}
                      className={`rounded-lg py-1.5 text-[10px] font-bold capitalize cursor-pointer transition-all ${settings.bannerOverlay === o ? "bg-primary text-white shadow" : "border border-border text-foreground hover:border-primary/40"}`}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Title Alignment</label>
                <div className="mt-2 flex gap-1.5">
                  {([
                    { val: "left" as const, icon: AlignLeft },
                    { val: "center" as const, icon: AlignCenter },
                    { val: "right" as const, icon: AlignRight },
                  ]).map(({ val, icon: Icon }) => (
                    <button key={val} type="button" onClick={() => update("bannerAlignment", val)}
                      className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-bold cursor-pointer transition-all ${settings.bannerAlignment === val ? "bg-primary text-white shadow" : "border border-border text-foreground hover:border-primary/40"}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Background */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <SectionHeader icon={Circle} title="Background" open={openSections.background} onToggle={() => toggleSection("background")} />
          {openSections.background && (
            <div className="p-3 space-y-2">
              <div className="grid grid-cols-3 gap-1.5">
                {(["solid", "gradient", "pattern"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => update("backgroundType", t)}
                    className={`rounded-lg py-1.5 text-[10px] font-bold capitalize cursor-pointer transition-all ${settings.backgroundType === t ? "bg-primary text-white shadow" : "border border-border text-foreground hover:border-primary/40"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Saved themes list */}
        {savedThemes.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-2">
            <h4 className="text-xs font-bold text-foreground">Community Saved Themes</h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {savedThemes.map((t) => {
                let parsed: ThemeSettings | null = null;
                try { parsed = JSON.parse(t.themeJson) as ThemeSettings; } catch { /* ignore */ }
                return (
                  <button
                    key={t.id ?? t.name}
                    type="button"
                    onClick={() => parsed && applyPreset(parsed)}
                    className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-all cursor-pointer ${settings.themeName === t.name ? "border-primary bg-primary/5 font-bold text-primary" : "border-border text-foreground hover:border-primary/30 hover:bg-primary/5"}`}
                  >
                    {settings.themeName === t.name && <Check className="h-3 w-3 text-primary shrink-0" />}
                    <span className="truncate">{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Right panel: Preview + Gallery ── */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <ThemePreview settings={settings} savedBanner={justSaved} className="flex-1" />
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <ThemeGallery onSelect={applyPreset} currentThemeName={settings.themeName} />
        </div>
      </div>
    </div>
  );
}
