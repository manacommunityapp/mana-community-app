import { CalendarType } from "../../../services/calendar/calendarService";
import { CALENDAR_CONFIG, ALL_CALENDAR_TYPES } from "./calendarConfig";

interface Props {
  active: CalendarType[];
  onToggle: (c: CalendarType) => void;
  onAll: () => void;
}

export function CalendarTypeFilter({ active, onToggle, onAll }: Props) {
  const allSelected = active.length === 0;

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingBottom: 4 }}>
      <button
        onClick={onAll}
        style={{
          fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer",
          background: allSelected ? "#2563EB" : "rgba(148,163,184,0.12)",
          color: allSelected ? "#fff" : "var(--muted)",
          transition: "all 0.15s",
        }}
      >
        All
      </button>
      {ALL_CALENDAR_TYPES.map((ct) => {
        const { label, color, icon } = CALENDAR_CONFIG[ct];
        const isOn = active.includes(ct);
        return (
          <button
            key={ct}
            onClick={() => onToggle(ct)}
            style={{
              fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 20, cursor: "pointer",
              border: `1px solid ${isOn ? color : "rgba(148,163,184,0.2)"}`,
              background: isOn ? `${color}18` : "transparent",
              color: isOn ? color : "var(--muted)",
              display: "flex", alignItems: "center", gap: 5,
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 13 }}>{icon}</span>
            {label}
          </button>
        );
      })}
    </div>
  );
}
