import { Gem, HandHeart, Gavel } from "lucide-react";
import { TabSwitcher } from "./shared";
import { EventsSponsors } from "./EventsSponsors";
import { EventsDonations } from "./EventsDonations";
import { EventsAuction } from "./EventsAuction";

export function EventsFundraising() {
  return (
    <TabSwitcher tabs={[
      { id: "sponsors",  label: "Sponsors",  icon: Gem,       content: <EventsSponsors />  },
      { id: "donations", label: "Donations", icon: HandHeart, content: <EventsDonations /> },
      { id: "auction",   label: "Auction",   icon: Gavel,     content: <EventsAuction />   },
    ]} />
  );
}
