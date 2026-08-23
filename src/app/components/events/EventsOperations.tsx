import { UtensilsCrossed, Landmark, FileText, Bell, Building2, QrCode } from "lucide-react";
import { TabSwitcher } from "./shared";
import { EventsFood } from "./EventsFood";
import { EventsFinance } from "./EventsFinance";
import { EventsInvoices } from "./EventsInvoices";
import { EventsNotifications } from "./EventsNotifications";
import { EventsDepartments } from "./EventsDepartments";
import { EventsGatePass } from "./EventsGatePass";

export function EventsOperations() {
  return (
    <TabSwitcher tabs={[
      { id: "food",          label: "Food & Catering",   icon: UtensilsCrossed, content: <EventsFood />          },
      { id: "finance",       label: "Finance",            icon: Landmark,        content: <EventsFinance />       },
      { id: "invoices",      label: "Invoices",           icon: FileText,        content: <EventsInvoices />      },
      { id: "notifications", label: "Notifications",      icon: Bell,            content: <EventsNotifications /> },
      { id: "departments",   label: "Departments",        icon: Building2,       content: <EventsDepartments />   },
      { id: "gate-pass",     label: "Gate Pass",          icon: QrCode,          content: <EventsGatePass />      },
    ]} />
  );
}
