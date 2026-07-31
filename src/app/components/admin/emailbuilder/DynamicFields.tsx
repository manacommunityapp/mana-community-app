import { CopyPlus } from "lucide-react";
import { dynamicFieldGroups } from "./emailBuilderData";

export function DynamicFields({ onInsert }: { onInsert: (token: string) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-xs font-black text-foreground uppercase tracking-wider">Dynamic Fields</h4>
        <p className="text-[11px] text-muted-foreground mt-1">Click a field to place a backend placeholder.</p>
      </div>
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {dynamicFieldGroups.map((group) => (
          <div key={group.group}>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{group.group}</p>
            <div className="space-y-1.5">
              {group.fields.map((field) => (
                <button
                  key={field.token}
                  type="button"
                  onClick={() => onInsert(field.token)}
                  className="w-full flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2 text-left text-[11px] text-foreground hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all"
                >
                  <CopyPlus className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="flex-1 truncate">{field.label}</span>
                  <code className="text-[10px] text-muted-foreground">{field.token}</code>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
