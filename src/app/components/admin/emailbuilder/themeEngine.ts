// themeEngine.ts — Pure CSS generation engine for the Email Theme Builder
// No React, no side effects. Fully testable in isolation.

export interface ThemeSettings {
  themeName: string;

  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  buttonTextColor: string;
  footerBgColor: string;
  footerTextColor: string;

  // Typography
  headingFont: string;
  bodyFont: string;
  headingSize: number;   // px
  bodySize: number;      // px

  // Shape
  buttonRadius: number;  // px
  cardRadius: number;    // px

  // Shadow
  shadow: "none" | "soft" | "medium" | "strong";

  // Layout
  containerWidth: number; // px
  padding: number;         // px
  sectionGap: number;      // px

  // Button
  buttonStyle: "rounded" | "square" | "pill" | "filled" | "outline" | "gradient";

  // Card
  cardStyle: "elevation" | "glass" | "border" | "gradient" | "minimal";

  // Banner
  bannerHeight: number;                             // px
  bannerOverlay: "dark" | "light" | "gradient" | "none";
  bannerAlignment: "center" | "left" | "right";

  // Background
  backgroundType: "solid" | "gradient" | "pattern";
}

// ─── Shadow map ──────────────────────────────────────────────────────────────

const SHADOW_MAP: Record<ThemeSettings["shadow"], string> = {
  none: "none",
  soft: "0 4px 16px rgba(0,0,0,0.08)",
  medium: "0 8px 24px rgba(0,0,0,0.15)",
  strong: "0 16px 40px rgba(0,0,0,0.25)",
};

// ─── Button styles ───────────────────────────────────────────────────────────

function buttonCss(settings: ThemeSettings): string {
  const r = settings.buttonRadius;
  const primary = settings.primaryColor;
  const accent = settings.accentColor;
  const textColor = settings.buttonTextColor;

  switch (settings.buttonStyle) {
    case "pill":
      return `background:${primary};color:${textColor};border-radius:999px;padding:12px 28px;border:none;`;
    case "square":
      return `background:${primary};color:${textColor};border-radius:4px;padding:12px 24px;border:none;`;
    case "outline":
      return `background:transparent;color:${primary};border-radius:${r}px;padding:11px 22px;border:2px solid ${primary};`;
    case "gradient":
      return `background:linear-gradient(135deg,${primary},${accent});color:${textColor};border-radius:${r}px;padding:12px 24px;border:none;`;
    case "rounded":
    case "filled":
    default:
      return `background:${primary};color:${textColor};border-radius:${r}px;padding:12px 24px;border:none;`;
  }
}

// ─── Card styles ─────────────────────────────────────────────────────────────

function cardCss(settings: ThemeSettings): string {
  const shadow = SHADOW_MAP[settings.shadow];
  const r = settings.cardRadius;
  const cardBg = settings.cardColor;
  const border = settings.secondaryColor + "30";

  switch (settings.cardStyle) {
    case "glass":
      return `background:rgba(255,255,255,0.15);backdrop-filter:blur(12px);border-radius:${r}px;border:1px solid rgba(255,255,255,0.3);box-shadow:${shadow};`;
    case "border":
      return `background:${cardBg};border-radius:${r}px;border:1px solid ${border};`;
    case "gradient":
      return `background:linear-gradient(135deg,${cardBg},${settings.primaryColor}10);border-radius:${r}px;box-shadow:${shadow};`;
    case "minimal":
      return `background:${cardBg};border-radius:${r}px;`;
    case "elevation":
    default:
      return `background:${cardBg};border-radius:${r}px;box-shadow:${shadow};`;
  }
}

// ─── Background styles ────────────────────────────────────────────────────────

function backgroundCss(settings: ThemeSettings): string {
  switch (settings.backgroundType) {
    case "gradient":
      return `background:linear-gradient(160deg,${settings.backgroundColor},${settings.secondaryColor}20);`;
    case "pattern":
      return `background-color:${settings.backgroundColor};background-image:radial-gradient(${settings.primaryColor}22 1px,transparent 1px);background-size:20px 20px;`;
    case "solid":
    default:
      return `background:${settings.backgroundColor};`;
  }
}

// ─── Google Fonts link ────────────────────────────────────────────────────────

const GOOGLE_FONT_MAP: Record<string, string> = {
  Poppins: "Poppins:wght@400;600;700;800",
  Inter: "Inter:wght@400;500;600;700;800",
  Roboto: "Roboto:wght@400;500;700;900",
  Nunito: "Nunito:wght@400;600;700;800",
  Montserrat: "Montserrat:wght@400;600;700;800",
  Lato: "Lato:wght@400;700;900",
  Raleway: "Raleway:wght@400;600;700;800",
  "Open Sans": "Open+Sans:wght@400;600;700",
};

function googleFontsLink(font: string): string {
  const key = GOOGLE_FONT_MAP[font];
  if (!key) return "";
  return `https://fonts.googleapis.com/css2?family=${key}&display=swap`;
}

// ─── CSS generation ───────────────────────────────────────────────────────────

export function generateCss(settings: ThemeSettings): string {
  const headingFontStack = `'${settings.headingFont}', Arial, sans-serif`;
  const bodyFontStack = `'${settings.bodyFont}', Arial, sans-serif`;
  const shadow = SHADOW_MAP[settings.shadow];
  const btnCss = buttonCss(settings);
  const crdCss = cardCss(settings);
  const bgCss = backgroundCss(settings);

  return `
/* === Generated by Mana Email Theme Engine === */
/* Theme: ${settings.themeName} */

@import url('${googleFontsLink(settings.headingFont)}');
@import url('${googleFontsLink(settings.bodyFont)}');

:root {
  --primary: ${settings.primaryColor};
  --secondary: ${settings.secondaryColor};
  --accent: ${settings.accentColor};
  --bg: ${settings.backgroundColor};
  --card: ${settings.cardColor};
  --text: ${settings.textColor};
  --footer-bg: ${settings.footerBgColor};
  --footer-text: ${settings.footerTextColor};
  --btn-radius: ${settings.buttonRadius}px;
  --card-radius: ${settings.cardRadius}px;
  --shadow: ${shadow};
  --container-width: ${settings.containerWidth}px;
  --padding: ${settings.padding}px;
  --section-gap: ${settings.sectionGap}px;
  --heading-font: ${headingFontStack};
  --body-font: ${bodyFontStack};
  --heading-size: ${settings.headingSize}px;
  --body-size: ${settings.bodySize}px;
}

body {
  margin: 0;
  padding: 0;
  font-family: ${bodyFontStack};
  font-size: ${settings.bodySize}px;
  line-height: 1.6;
  color: ${settings.textColor};
  ${bgCss}
}

.email-wrapper {
  padding: ${settings.padding}px 16px;
}

.email-container {
  width: 100%;
  max-width: ${settings.containerWidth}px;
  margin: 0 auto;
  border-collapse: collapse;
  background: ${settings.cardColor};
  border-radius: ${settings.cardRadius}px;
  overflow: hidden;
  box-shadow: ${shadow};
}

/* Header */
.email-header {
  background: ${settings.primaryColor};
  padding: ${settings.padding}px ${Math.round(settings.padding * 1.25)}px;
  color: #ffffff;
}

.email-header h1,
.email-header .email-title {
  font-family: ${headingFontStack};
  font-size: ${settings.headingSize}px;
  font-weight: 800;
  line-height: 1.15;
  margin: 0;
  color: #ffffff;
}

.email-header .email-subtitle {
  font-size: ${Math.round(settings.bodySize * 1.05)}px;
  color: rgba(255,255,255,0.85);
  margin: 8px 0 0;
}

/* Body */
.email-body {
  padding: ${settings.padding}px ${Math.round(settings.padding * 1.25)}px;
  ${crdCss}
}

.email-body h2 {
  font-family: ${headingFontStack};
  font-size: ${Math.round(settings.headingSize * 0.65)}px;
  font-weight: 700;
  color: ${settings.textColor};
  margin: 0 0 12px;
}

.email-body p {
  font-size: ${settings.bodySize}px;
  color: ${settings.textColor};
  line-height: 1.7;
  margin: 0 0 16px;
}

/* Button */
.btn-primary {
  display: inline-block;
  ${btnCss}
  font-family: ${bodyFontStack};
  font-size: ${settings.bodySize}px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  text-align: center;
}

/* Sport Event Card */
.sport-card {
  ${crdCss}
  padding: 16px;
  margin-bottom: ${settings.sectionGap}px;
}

.sport-card .sport-icon {
  font-size: 28px;
  margin-bottom: 8px;
  display: block;
}

.sport-card .sport-name {
  font-family: ${headingFontStack};
  font-size: ${Math.round(settings.bodySize * 1.1)}px;
  font-weight: 700;
  color: ${settings.primaryColor};
}

/* Timeline */
.timeline-item {
  display: flex;
  gap: 14px;
  padding: 10px 0;
  border-bottom: 1px solid ${settings.secondaryColor}22;
}

.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${settings.primaryColor};
  margin-top: 5px;
  flex-shrink: 0;
}

.timeline-date {
  font-size: ${Math.round(settings.bodySize * 0.8)}px;
  color: ${settings.primaryColor};
  font-weight: 700;
}

.timeline-title {
  font-size: ${settings.bodySize}px;
  color: ${settings.textColor};
  font-weight: 600;
}

/* Gallery */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: ${settings.padding}px ${Math.round(settings.padding * 1.25)}px;
}

.gallery-item {
  height: 80px;
  border-radius: ${Math.round(settings.cardRadius * 0.6)}px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
}

/* Footer */
.email-footer {
  background: ${settings.footerBgColor};
  color: ${settings.footerTextColor};
  padding: 18px ${Math.round(settings.padding * 1.25)}px;
  font-size: ${Math.round(settings.bodySize * 0.8)}px;
  text-align: center;
  line-height: 1.6;
}

/* Divider */
.email-divider {
  border: none;
  border-top: 1px solid ${settings.secondaryColor}20;
  margin: ${settings.sectionGap}px 0;
}

/* Announcement badge */
.announcement-badge {
  display: inline-block;
  background: ${settings.accentColor}22;
  color: ${settings.accentColor};
  border-radius: ${Math.round(settings.buttonRadius * 0.5)}px;
  padding: 3px 10px;
  font-size: ${Math.round(settings.bodySize * 0.75)}px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
`.trim();
}

// ─── HTML Preview Generator ───────────────────────────────────────────────────

export function generateHtmlPreview(settings: ThemeSettings): string {
  const css = generateCss(settings);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${settings.themeName} — Preview</title>
  <style>${css}</style>
</head>
<body>
<div class="email-wrapper">
<table class="email-container" role="presentation" cellpadding="0" cellspacing="0">

  <!-- HEADER -->
  <tr>
    <td class="email-header">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;opacity:.8;">Community Logo</div>
      <h1 class="email-title">Tournament Announcement</h1>
      <p class="email-subtitle">Summer Cricket Tournament · Season 2026</p>
    </td>
  </tr>

  <!-- BODY -->
  <tr>
    <td class="email-body">
      <p>Hello <strong>Resident</strong>,</p>
      <p>We are delighted to announce the upcoming <strong>Summer Cricket Tournament</strong>. Registration is now open — secure your spot today!</p>
      <a href="#" class="btn-primary">Register Now</a>
    </td>
  </tr>

  <!-- UPCOMING SPORTS EVENTS -->
  <tr>
    <td style="padding:${settings.padding}px ${Math.round(settings.padding * 1.25)}px 0;">
      <h2 style="font-family:'${settings.headingFont}',Arial,sans-serif;font-size:${Math.round(settings.headingSize * 0.6)}px;font-weight:700;color:${settings.textColor};margin:0 0 12px;">Upcoming Sports Events</h2>
      <div class="sport-card"><span class="sport-icon">🏏</span><div class="sport-name">Cricket — Men's T20</div><div style="font-size:12px;color:#6b7280;margin-top:4px;">20 Jun · Main Ground · 18–45 Yrs</div></div>
      <div class="sport-card"><span class="sport-icon">🏸</span><div class="sport-name">Badminton — Mixed Doubles</div><div style="font-size:12px;color:#6b7280;margin-top:4px;">21 Jun · Indoor Court · All Ages</div></div>
      <div class="sport-card"><span class="sport-icon">⚽</span><div class="sport-name">Football — 5-a-side</div><div style="font-size:12px;color:#6b7280;margin-top:4px;">22 Jun · Turf Ground · 16–40 Yrs</div></div>
    </td>
  </tr>

  <!-- TIMELINE -->
  <tr>
    <td style="padding:${settings.padding}px ${Math.round(settings.padding * 1.25)}px;">
      <h2 style="font-family:'${settings.headingFont}',Arial,sans-serif;font-size:${Math.round(settings.headingSize * 0.6)}px;font-weight:700;color:${settings.textColor};margin:0 0 12px;">Tournament Timeline</h2>
      <div class="timeline-item"><div class="timeline-dot"></div><div><div class="timeline-date">01 Jun</div><div class="timeline-title">Announcement</div></div></div>
      <div class="timeline-item"><div class="timeline-dot"></div><div><div class="timeline-date">05 Jun</div><div class="timeline-title">Registration Opens</div></div></div>
      <div class="timeline-item"><div class="timeline-dot"></div><div><div class="timeline-date">20 Jun</div><div class="timeline-title">Opening Ceremony</div></div></div>
      <div class="timeline-item"><div class="timeline-dot"></div><div><div class="timeline-date">25 Jun</div><div class="timeline-title">Finals &amp; Prizes</div></div></div>
    </td>
  </tr>

  <!-- GALLERY -->
  <tr>
    <td>
      <div class="gallery-grid">
        <div class="gallery-item" style="background:${settings.primaryColor}22;">🏆</div>
        <div class="gallery-item" style="background:${settings.accentColor}22;">🎉</div>
        <div class="gallery-item" style="background:${settings.secondaryColor}22;">🥇</div>
        <div class="gallery-item" style="background:${settings.primaryColor}11;">🙌</div>
      </div>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td class="email-footer">
      Bringing Communities Together Through Sports 🏆<br/>
      <a href="mailto:sports@manacommunity.app" style="color:${settings.footerTextColor};opacity:.7;">sports@manacommunity.app</a> · &copy; 2026 Mana Community
    </td>
  </tr>

</table>
</div>
</body>
</html>`;
}

// ─── Preset Themes ────────────────────────────────────────────────────────────

const BASE: Omit<ThemeSettings, "themeName" | "primaryColor" | "secondaryColor" | "accentColor" | "backgroundColor" | "cardColor" | "textColor" | "footerBgColor" | "footerTextColor" | "headingFont" | "bodyFont"> = {
  headingSize: 34,
  bodySize: 15,
  buttonRadius: 10,
  cardRadius: 16,
  shadow: "soft",
  containerWidth: 650,
  padding: 28,
  sectionGap: 16,
  buttonStyle: "filled",
  cardStyle: "elevation",
  bannerHeight: 300,
  bannerOverlay: "dark",
  bannerAlignment: "center",
  backgroundType: "solid",
  buttonTextColor: "#ffffff",
};

export const PRESET_THEMES: Record<string, ThemeSettings> = {
  "Modern Blue": { ...BASE, themeName: "Modern Blue", primaryColor: "#2563EB", secondaryColor: "#1E293B", accentColor: "#F97316", backgroundColor: "#F1F5F9", cardColor: "#FFFFFF", textColor: "#1E293B", footerBgColor: "#1E293B", footerTextColor: "#94A3B8", headingFont: "Poppins", bodyFont: "Inter" },
  "Corporate": { ...BASE, themeName: "Corporate", primaryColor: "#1A237E", secondaryColor: "#283593", accentColor: "#00ACC1", backgroundColor: "#FAFAFA", cardColor: "#FFFFFF", textColor: "#212121", footerBgColor: "#1A237E", footerTextColor: "#C5CAE9", headingFont: "Montserrat", bodyFont: "Roboto", buttonRadius: 6, cardRadius: 8, buttonStyle: "square", cardStyle: "border" },
  "Dark": { ...BASE, themeName: "Dark", primaryColor: "#6366F1", secondaryColor: "#312E81", accentColor: "#A78BFA", backgroundColor: "#0F0F0F", cardColor: "#1C1C1E", textColor: "#E5E7EB", footerBgColor: "#111111", footerTextColor: "#6B7280", headingFont: "Inter", bodyFont: "Inter", shadow: "strong", cardStyle: "elevation", backgroundType: "solid" },
  "Nature Green": { ...BASE, themeName: "Nature Green", primaryColor: "#16A34A", secondaryColor: "#14532D", accentColor: "#84CC16", backgroundColor: "#F0FDF4", cardColor: "#FFFFFF", textColor: "#14532D", footerBgColor: "#14532D", footerTextColor: "#86EFAC", headingFont: "Nunito", bodyFont: "Nunito", buttonStyle: "rounded", buttonRadius: 14, cardRadius: 20 },
  "Luxury Gold": { ...BASE, themeName: "Luxury Gold", primaryColor: "#B45309", secondaryColor: "#1C1917", accentColor: "#D97706", backgroundColor: "#1C1917", cardColor: "#292524", textColor: "#E7E5E4", footerBgColor: "#111110", footerTextColor: "#A8A29E", headingFont: "Montserrat", bodyFont: "Lato", shadow: "strong", cardStyle: "elevation" },
  "Sports Red": { ...BASE, themeName: "Sports Red", primaryColor: "#DC2626", secondaryColor: "#1F2937", accentColor: "#F59E0B", backgroundColor: "#F9FAFB", cardColor: "#FFFFFF", textColor: "#111827", footerBgColor: "#1F2937", footerTextColor: "#9CA3AF", headingFont: "Poppins", bodyFont: "Roboto", buttonStyle: "pill", buttonRadius: 999 },
  "Minimal": { ...BASE, themeName: "Minimal", primaryColor: "#111827", secondaryColor: "#6B7280", accentColor: "#374151", backgroundColor: "#FFFFFF", cardColor: "#F9FAFB", textColor: "#111827", footerBgColor: "#F3F4F6", footerTextColor: "#6B7280", headingFont: "Inter", bodyFont: "Inter", shadow: "none", cardStyle: "border", buttonStyle: "outline", buttonRadius: 6, cardRadius: 8 },
  "Glass": { ...BASE, themeName: "Glass", primaryColor: "#6366F1", secondaryColor: "#0F172A", accentColor: "#A78BFA", backgroundColor: "#1E1B4B", cardColor: "rgba(255,255,255,0.1)", textColor: "#E0E7FF", footerBgColor: "#0F0F23", footerTextColor: "#818CF8", headingFont: "Poppins", bodyFont: "Inter", shadow: "strong", cardStyle: "glass", backgroundType: "gradient" },
  "Gradient": { ...BASE, themeName: "Gradient", primaryColor: "#7C3AED", secondaryColor: "#DB2777", accentColor: "#F59E0B", backgroundColor: "#FAF5FF", cardColor: "#FFFFFF", textColor: "#4C1D95", footerBgColor: "#4C1D95", footerTextColor: "#DDD6FE", headingFont: "Nunito", bodyFont: "Nunito", buttonStyle: "gradient", cardStyle: "gradient", backgroundType: "gradient" },
  "Material": { ...BASE, themeName: "Material", primaryColor: "#1565C0", secondaryColor: "#0D47A1", accentColor: "#00BCD4", backgroundColor: "#E3F2FD", cardColor: "#FFFFFF", textColor: "#212121", footerBgColor: "#0D47A1", footerTextColor: "#90CAF9", headingFont: "Roboto", bodyFont: "Roboto", buttonRadius: 4, cardRadius: 4, buttonStyle: "filled", shadow: "medium" },
  "Apple": { ...BASE, themeName: "Apple", primaryColor: "#0071E3", secondaryColor: "#1D1D1F", accentColor: "#34C759", backgroundColor: "#F5F5F7", cardColor: "#FFFFFF", textColor: "#1D1D1F", footerBgColor: "#1D1D1F", footerTextColor: "#6E6E73", headingFont: "Inter", bodyFont: "Inter", buttonRadius: 8, cardRadius: 18, shadow: "soft", cardStyle: "elevation" },
  "Microsoft": { ...BASE, themeName: "Microsoft", primaryColor: "#00A4EF", secondaryColor: "#7FBA00", accentColor: "#FFB900", backgroundColor: "#F3F2F1", cardColor: "#FFFFFF", textColor: "#201F1E", footerBgColor: "#201F1E", footerTextColor: "#C8C6C4", headingFont: "Roboto", bodyFont: "Roboto", buttonRadius: 2, cardRadius: 4, buttonStyle: "square", cardStyle: "border", shadow: "none" },
  "Netflix": { ...BASE, themeName: "Netflix", primaryColor: "#E50914", secondaryColor: "#141414", accentColor: "#E50914", backgroundColor: "#141414", cardColor: "#1F1F1F", textColor: "#FFFFFF", footerBgColor: "#000000", footerTextColor: "#808080", headingFont: "Montserrat", bodyFont: "Roboto", shadow: "strong", cardStyle: "elevation", buttonStyle: "filled", buttonRadius: 4 },
  "Amazon": { ...BASE, themeName: "Amazon", primaryColor: "#FF9900", secondaryColor: "#131921", accentColor: "#146EB4", backgroundColor: "#EAEDED", cardColor: "#FFFFFF", textColor: "#0F1111", footerBgColor: "#131921", footerTextColor: "#888C90", headingFont: "Roboto", bodyFont: "Roboto", buttonRadius: 3, cardRadius: 4, buttonStyle: "filled", shadow: "soft" },
};

export const GOOGLE_FONTS = [
  "Poppins", "Inter", "Roboto", "Nunito", "Montserrat", "Lato", "Raleway", "Open Sans",
];

export const DEFAULT_THEME: ThemeSettings = PRESET_THEMES["Modern Blue"];
