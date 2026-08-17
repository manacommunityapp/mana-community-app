import { Users, UserCheck, MapPin } from "lucide-react";
import { TabSwitcher } from "./shared";
import { OrganizerDashboard } from "./OrganizerDashboard";
import { EventsVolunteers } from "./EventsVolunteers";
import { EventsVenue } from "./EventsVenue";

export function EventsPeople() {
  return (
    <TabSwitcher tabs={[
      { id: "registered-users", label: "Registered Users", icon: UserCheck, content: <OrganizerDashboard initialTab="registrations" /> },
      { id: "volunteers",       label: "Volunteers",       icon: Users,     content: <EventsVolunteers />   },
      { id: "venue",            label: "Venue",            icon: MapPin,    content: <EventsVenue />        },
    ]} />
  );
}

