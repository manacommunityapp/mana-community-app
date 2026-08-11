import { Ticket, UserCheck, FileText } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { REGISTER_EVENT } from "../../../constants/permissions";
import { TabSwitcher } from "./shared";
import { EventsRegistration } from "./EventsRegistration";
import { EventsUserRegistration } from "./EventsUserRegistration";
import { EventsRegistrationForms } from "./EventsRegistrationForms";

export function EventsRegistrationHub() {
  const { hasPermission, isAdmin } = useAuth();
  const canRegister = hasPermission(REGISTER_EVENT);

  return (
    <TabSwitcher tabs={[
      {
        id: "admin",  label: "Manage Registrations", icon: Ticket,
        hidden: !isAdmin,
        content: <EventsRegistration />,
      },
      {
        id: "forms",  label: "Registration Forms",   icon: FileText,
        hidden: !isAdmin,
        content: <EventsRegistrationForms />,
      },
      {
        id: "public", label: "Public Registration",  icon: UserCheck,
        hidden: !canRegister && !isAdmin,
        content: <EventsUserRegistration />,
      },
    ]} />
  );
}
