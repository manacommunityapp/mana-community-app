import { Sparkles } from "lucide-react";
import { PRESET_THEMES, type ThemeSettings } from "./themeEngine";

const THEME_ICONS: Record<string, string> = {
  "Modern Blue": "🔷",
  "Corporate": "🏢",
  "Dark": "🌑",
  "Nature Green": "🌿",
  "Luxury Gold": "✨",
  "Sports Red": "🔴",
  "Minimal": "◻️",
  "Glass": "🔮",
  "Gradient": "🎨",
  "Material": "📐",
  "Apple": "🍎",
  "Microsoft": "🪟",
  "Netflix": "🎬",
  "Amazon": "📦",
};

interface ThemeGalleryProps {
  onSelect: (settings: ThemeSettings) => void;
  currentThemeName?: string;
}

export function ThemeGallery({ onSelect, currentThemeName }: ThemeGalleryProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Ready-Made Themes</h3>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary">
          {Object.keys(PRESET_THEMES).length}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground">One click changes the entire email design</p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
        {Object.entries(PRESET_THEMES).map(([name, theme]) => {
          const isActive = currentThemeName === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelect(theme)}
              className={`group relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all cursor-pointer hover:scale-[1.03] ${
                isActive
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-background hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
              }`}
            >
              {/* Color swatch */}
              <div className="relative h-8 w-full overflow-hidden rounded-lg" style={{ background: theme.primaryColor }}>
                <div
                  className="absolute right-0 top-0 h-full w-5"
                  style={{ background: theme.secondaryColor }}
                />
                <div
                  className="absolute right-2 top-0 h-full w-2"
                  style={{ background: theme.accentColor }}
                />
              </div>

              {/* Icon + Name */}
              <span className="text-base leading-none">{THEME_ICONS[name] ?? "🎨"}</span>
              <span className="text-[10px] font-bold leading-tight text-foreground">{name}</span>

              {/* Active badge */}
              {isActive && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-black text-white shadow">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
