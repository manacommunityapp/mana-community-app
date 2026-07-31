import type { EmailBlockDefinition } from "./emailBuilderData";

export function ComponentPalette({
  blocks,
  onInsertBlock,
}: {
  blocks: EmailBlockDefinition[];
  onInsertBlock: (block: EmailBlockDefinition) => void;
}) {
  const categories = Array.from(new Set(blocks.map((block) => block.category)));

  return (
    <aside className="w-full xl:w-64 shrink-0 bg-card border border-border rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">Components</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Drag-free reusable email blocks</p>
        </div>
      </div>

      <div className="space-y-5">
        {categories.map((category) => (
          <div key={category}>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2">{category}</p>
            <div className="grid grid-cols-2 xl:grid-cols-1 gap-2">
              {blocks.filter((block) => block.category === category).map((block) => {
                const Icon = block.icon;
                return (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() => onInsertBlock(block)}
                    className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-left text-xs font-semibold text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    <Icon className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">{block.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
