import { useRef, useState } from "react";
import { Check, ImagePlus, Palette, PaintBucket, Type, Upload } from "lucide-react";
import type { Editor } from "grapesjs";
import { DynamicFields } from "./DynamicFields";
import { generateCss, GOOGLE_FONTS, type ThemeSettings } from "./themeEngine";
import type { EmailThemeRecord } from "./themePersistenceService";

// ─── Visual Style Quick Picker ────────────────────────────────────────────────
// Self-contained component so it maintains its own local state independently

function VisualStyleQuickPicker({ editor }: { editor: Editor | null }) {
  const [background, setBackground] = useState("#ffffff");
  const [buttonColor, setButtonColor] = useState("#2563eb");
  const [fontFamily, setFontFamily] = useState("Inter");

  const applyStyle = (style: Record<string, string>) => {
    const selected = editor?.getSelected();
    if (!selected) return;
    selected.addStyle(style);
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-background p-3">
      <div className="flex items-center gap-2 text-xs font-bold text-foreground">
        <PaintBucket className="h-4 w-4 text-primary" />
        Selected Block Style
      </div>
      <p className="text-[10px] text-muted-foreground">Select a block in the canvas, then adjust its style here.</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[10px] font-bold text-muted-foreground">
          Background
          <input
            type="color"
            value={background}
            onChange={(event) => {
              setBackground(event.target.value);
              applyStyle({ background: event.target.value });
            }}
            className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-border bg-background p-0.5"
          />
        </label>
        <label className="text-[10px] font-bold text-muted-foreground">
          Text / Button
          <input
            type="color"
            value={buttonColor}
            onChange={(event) => {
              setButtonColor(event.target.value);
              applyStyle({ color: event.target.value });
            }}
            className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-border bg-background p-0.5"
          />
        </label>
      </div>
      <label className="text-[10px] font-bold text-muted-foreground">
        Font
        <select
          value={fontFamily}
          onChange={(event) => {
            setFontFamily(event.target.value);
            applyStyle({ "font-family": `'${event.target.value}', Arial, sans-serif` });
          }}
          className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-primary/50"
        >
          {GOOGLE_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </label>
    </div>
  );
}

export function PropertyPanel({
  editor,
  communityId,
  templateName,
  subject,
  savedThemes,
  activeThemeName,
  onTemplateNameChange,
  onSubjectChange,
  onInsertField,
  onUploadImage,
  onThemeApplied,
}: {
  editor: Editor | null;
  communityId: number;
  templateName: string;
  subject: string;
  savedThemes?: EmailThemeRecord[];
  activeThemeName?: string;
  onTemplateNameChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onInsertField: (token: string) => void;
  onUploadImage: (file: File, communityId: number) => Promise<string>;
  onThemeApplied?: (settings: ThemeSettings, record: EmailThemeRecord) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [appliedThemeId, setAppliedThemeId] = useState<number | undefined>(undefined);

  const applyTheme = (record: EmailThemeRecord) => {
    try {
      const settings: ThemeSettings = JSON.parse(record.themeJson);
      const css = generateCss(settings);
      editor?.setStyle(css);
      setAppliedThemeId(record.id);
      onThemeApplied?.(settings, record);
    } catch { /* ignore malformed JSON */ }
  };

  const handleImageFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    setUploading(true);
    try {
      const url = await onUploadImage(file, communityId);
      const selected = editor.getSelected();
      if (selected?.is("image")) {
        selected.addAttributes({ src: url });
      } else if (selected) {
        selected.addStyle({ "background-image": `url(${url})`, "background-size": "cover", "background-position": "center" });
      } else {
        editor.addComponents(`<img src="${url}" alt="" style="display:block;width:100%;max-width:640px;margin:0 auto;border:0;" />`);
      }
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <aside className="w-full xl:w-80 shrink-0 bg-card border border-border rounded-2xl p-4 shadow-sm space-y-5">
      <div>
        <h3 className="text-sm font-bold text-foreground">Properties</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">Template metadata and selected block styles</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Template Name</label>
          <input
            value={templateName}
            onChange={(event) => onTemplateNameChange(event.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary/50"
          />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Subject</label>
          <input
            value={subject}
            onChange={(event) => onSubjectChange(event.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* Apply Theme */}
      {savedThemes && savedThemes.length > 0 && (
        <div className="space-y-2 rounded-xl border border-border bg-background p-3">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <Palette className="h-4 w-4 text-primary" />
            Apply Theme
          </div>
          <p className="text-[10px] text-muted-foreground">Select a saved community theme to instantly update email styles.</p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {savedThemes.map((t) => (
              <button
                key={t.id ?? t.name}
                type="button"
                onClick={() => applyTheme(t)}
                className={`flex w-full items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left text-[11px] cursor-pointer transition-all ${
                  appliedThemeId === t.id
                  || activeThemeName === t.name
                    ? "border-primary bg-primary/5 font-bold text-primary"
                    : "border-border text-foreground hover:border-primary/30 hover:bg-primary/5"
                }`}
              >
                {(appliedThemeId === t.id || activeThemeName === t.name) && <Check className="h-3 w-3 text-primary shrink-0" />}
                <span className="truncate">{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <VisualStyleQuickPicker editor={editor} />

      <div className="space-y-3 rounded-xl border border-border bg-background p-3">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <ImagePlus className="h-4 w-4 text-primary" />
          Upload Banner
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-input disabled:opacity-60 cursor-pointer transition-all"
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading..." : "Upload Image"}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-background p-3">
        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-foreground">
          <Type className="h-4 w-4 text-primary" />
          Merge Tags
        </div>
        <DynamicFields onInsert={onInsertField} />
      </div>
    </aside>
  );
}
