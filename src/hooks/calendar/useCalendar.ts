import { useState, useEffect, useCallback, useRef } from "react";
import { calendarService, CalendarEventDto, CalendarType } from "../../services/calendar/calendarService";

function fmtDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function useCalendar(initialDate = new Date()) {
  const [viewDate, setViewDate] = useState(initialDate);
  const [activeCalendars, setActiveCalendars] = useState<CalendarType[]>([]);
  const [events, setEvents] = useState<CalendarEventDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const calKey = activeCalendars.slice().sort().join(",");
  const abortRef = useRef<AbortController | null>(null);

  const reload = useCallback(async (date: Date, cals: CalendarType[]) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    const from = new Date(date.getFullYear(), date.getMonth(), 1);
    from.setDate(from.getDate() - 7);
    const to = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    to.setDate(to.getDate() + 7);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const data = await calendarService.getEvents(fmtDate(from), fmtDate(to), cals.length ? cals : undefined, tz);
      setEvents(data);
      setError(null);
    } catch (e: unknown) {
      if ((e as { name?: string }).name !== "AbortError") {
        const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to load calendar";
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload(viewDate, activeCalendars);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewDate.getFullYear(), viewDate.getMonth(), calKey]);

  const toggleCalendar = (c: CalendarType) =>
    setActiveCalendars((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  const manualReload = useCallback(() => reload(viewDate, activeCalendars), [reload, viewDate, activeCalendars]);

  return { viewDate, setViewDate, activeCalendars, toggleCalendar, events, loading, error, reload: manualReload };
}
