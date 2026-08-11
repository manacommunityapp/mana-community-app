import { Users, MapPin } from "lucide-react";
import { TabSwitcher } from "./shared";
import { EventsVolunteers } from "./EventsVolunteers";
import { EventsVenue } from "./EventsVenue";

export function EventsPeople() {
  return (
    <TabSwitcher tabs={[
      { id: "volunteers", label: "Volunteers", icon: Users,  content: <EventsVolunteers /> },
      { id: "venue",      label: "Venue",      icon: MapPin, content: <EventsVenue />      },
    ]} />
  );
}
