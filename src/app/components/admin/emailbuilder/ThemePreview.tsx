import { generateHtmlPreview, type ThemeSettings } from "./themeEngine";

interface ThemePreviewProps {
  settings: ThemeSettings;
  className?: string;
  savedBanner?: boolean;
}

export function ThemePreview({ settings, className = "", savedBanner = false }: ThemePreviewProps) {
  const previewHtml = generateHtmlPreview(settings);

  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm ${className}`}>
      {/* Preview header */}
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </div>
          <div className="rounded bg-background px-3 py-0.5 text-[10px] font-mono text-muted-foreground">
            {settings.themeName} — Live Preview
          </div>
        </div>

        {savedBanner && (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Theme Saved & Applied to Preview ✓
          </div>
        )}
      </div>

      {/* Iframe preview */}
      <div className="relative flex-1 overflow-hidden bg-slate-100">
        <iframe
          key={`${JSON.stringify(settings)}-${savedBanner ? 'saved' : 'live'}`}
          title="Theme Live Preview"
          srcDoc={previewHtml}
          sandbox="allow-same-origin"
          className="h-full w-full border-0"
          style={{ minHeight: "580px" }}
        />
      </div>
    </div>
  );
}
