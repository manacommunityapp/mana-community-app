import { useParams, useNavigate } from "react-router";
import { EventCreateWizard } from "./EventsCreate";

export function EventEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden" style={{ height: "calc(100vh - 220px)", minHeight: "600px" }}>
      <EventCreateWizard
        eventId={id}
        isEdit={!!id}
        onClose={() => navigate("/events")}
        onCreated={() => navigate("/events")}
        onSaved={() => navigate("/events")}
      />
    </div>
  );
}
