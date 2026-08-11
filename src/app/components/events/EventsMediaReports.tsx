import { ImageIcon, BarChart3 } from "lucide-react";
import { TabSwitcher } from "./shared";
import { EventsGallery } from "./EventsGallery";
import { EventsReports } from "./EventsReports";

export function EventsMediaReports() {
  return (
    <TabSwitcher tabs={[
      { id: "gallery", label: "Gallery",              icon: ImageIcon, content: <EventsGallery /> },
      { id: "reports", label: "Reports & Analytics",  icon: BarChart3, content: <EventsReports /> },
    ]} />
  );
}
