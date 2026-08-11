import { UtensilsCrossed, Landmark, FileText } from "lucide-react";
import { TabSwitcher } from "./shared";
import { EventsFood } from "./EventsFood";
import { EventsFinance } from "./EventsFinance";
import { EventsInvoices } from "./EventsInvoices";

export function EventsOperations() {
  return (
    <TabSwitcher tabs={[
      { id: "food",     label: "Food & Catering", icon: UtensilsCrossed, content: <EventsFood />     },
      { id: "finance",  label: "Finance",         icon: Landmark,        content: <EventsFinance />  },
      { id: "invoices", label: "Invoices",        icon: FileText,        content: <EventsInvoices /> },
    ]} />
  );
}
