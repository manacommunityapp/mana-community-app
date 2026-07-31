import { Monitor, Moon, Smartphone, Sun, Tablet, X } from "lucide-react";
import { generateCss, type ThemeSettings } from "./themeEngine";

export type PreviewDevice = "desktop" | "tablet" | "mobile";
export type PreviewTheme = "light" | "dark";

const deviceWidths: Record<PreviewDevice, string> = {
  desktop: "640px",
  tablet: "520px",
  mobile: "360px",
};

export function PreviewModal({
  open,
  html,
  css,
  device,
  theme,
  onDeviceChange,
  onThemeChange,
  onClose,
  themeSettings,
}: {
  open: boolean;
  html: string;
  css: string;
  device: PreviewDevice;
  theme: PreviewTheme;
  onDeviceChange: (device: PreviewDevice) => void;
  onThemeChange: (theme: PreviewTheme) => void;
  onClose: () => void;
  themeSettings?: ThemeSettings;
}) {
  if (!open) return null;

  const generatedThemeCss = themeSettings ? generateCss(themeSettings) : "";
  const themeOverrideCss = themeSettings ? `
    body { background:${themeSettings.backgroundColor} !important; color:${themeSettings.textColor} !important; font-family:'${themeSettings.bodyFont}',Arial,sans-serif !important; }
    body table[role="presentation"] { font-family:'${themeSettings.bodyFont}',Arial,sans-serif !important; }
    body table[role="presentation"] table[role="presentation"] { max-width:${themeSettings.containerWidth}px !important; }
    body td[style*="background:#0f766e"],
    body td[style*="background:#0f172a"],
    body td[style*="background: #0f766e"],
    body td[style*="background: #0f172a"] { background:${themeSettings.primaryColor} !important; color:#ffffff !important; }
    body h1 { font-family:'${themeSettings.headingFont}',Arial,sans-serif !important; font-size:${themeSettings.headingSize}px !important; }
    body h2 { font-family:'${themeSettings.headingFont}',Arial,sans-serif !important; color:${themeSettings.textColor} !important; }
    body a { background:${themeSettings.buttonStyle === "gradient" ? `linear-gradient(135deg,${themeSettings.primaryColor},${themeSettings.accentColor})` : themeSettings.primaryColor} !important; color:${themeSettings.buttonTextColor} !important; border-radius:${themeSettings.buttonRadius}px !important; }
  ` : "";

  const previewHtml = `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          ${generatedThemeCss}
          ${css}
          ${themeOverrideCss}
          body { margin:0; background:${themeSettings?.backgroundColor ?? (theme === "dark" ? "#0f172a" : "#f8fafc")}; }
        </style>
      </head>
      <body>${html}</body>
    </html>
  `;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div>
            <h3 className="text-sm font-bold text-foreground">Email Preview</h3>
            <p className="text-[11px] text-muted-foreground">
              {themeSettings ? `${themeSettings.themeName} theme applied to this preview.` : "Check responsive and color-mode rendering before saving."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: "desktop" as const, icon: Monitor },
              { id: "tablet" as const, icon: Tablet },
              { id: "mobile" as const, icon: Smartphone },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.id}
                  onClick={() => onDeviceChange(item.id)}
                  className={`h-9 w-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${device === item.id ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
            <button
              type="button"
              title={theme === "light" ? "Switch to dark preview" : "Switch to light preview"}
              onClick={() => onThemeChange(theme === "light" ? "dark" : "light")}
              className="h-9 w-9 rounded-xl border border-border text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-all"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <button
              type="button"
              title="Close preview"
              onClick={onClose}
              className="h-9 w-9 rounded-xl border border-border text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-muted/40 p-6">
          <div className="mx-auto h-full transition-all" style={{ width: deviceWidths[device], maxWidth: "100%" }}>
            <iframe title="Email template preview" srcDoc={previewHtml} className="h-full w-full rounded-xl border border-border bg-white shadow-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
