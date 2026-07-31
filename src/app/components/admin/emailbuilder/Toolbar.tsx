import { Eye, Monitor, Save, Smartphone, Tablet } from "lucide-react";
import type { PreviewDevice } from "./PreviewModal";

export function Toolbar({
  device,
  saving,
  onDeviceChange,
  onPreview,
  onSave,
}: {
  device: PreviewDevice;
  saving: boolean;
  onDeviceChange: (device: PreviewDevice) => void;
  onPreview: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-card rounded-2xl px-4 py-3 shadow-sm">
      <div className="flex items-center gap-1 rounded-xl bg-input p-1">
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
              title={`${item.id} canvas`}
              onClick={() => onDeviceChange(item.id)}
              className={`h-8 w-9 rounded-lg flex items-center justify-center cursor-pointer transition-all ${device === item.id ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPreview}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-input transition-all cursor-pointer"
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-60 transition-all cursor-pointer"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
