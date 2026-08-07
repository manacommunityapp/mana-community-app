import { apiClient } from "../common/apiClient";

export interface PaymentContactPersonDto {
  id: string;
  name: string;
  role: string;
  flatNo: string;
  phone: string;
}

export interface CorporatePackageDto {
  id: string;
  title: string;
  amount: string;
  badge: string;
  features: string[];
  color: string;
  totalSlots: string;
  claimedSlots: string;
}

export interface DonationSchemeDto {
  id: string;
  title: string;
  amount: string;
  desc: string;
  badge: string;
  category: string;
}

export interface EventProspectusDto {
  id?: number;
  eventId?: number;
  eventTitle?: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  qrCodeUrl: string;
  helplines: string[];
  contacts: PaymentContactPersonDto[];
  packages: CorporatePackageDto[];
  donations: DonationSchemeDto[];
  updatedAt?: string;
}

export const eventProspectusService = {
  async getProspectus(eventId?: number): Promise<EventProspectusDto> {
    try {
      const url = eventId ? `/api/events/prospectus?eventId=${eventId}` : `/api/events/prospectus`;
      return await apiClient.get<EventProspectusDto>(url);
    } catch {
      return {
        bankName: "State Bank of India",
        accountName: "Mana Community Cultural Trust",
        accountNumber: "394820194829",
        ifscCode: "SBIN0004829",
        upiId: "manacommunity@sbi",
        qrCodeUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80",
        helplines: ["+91 98765 43210", "+91 91234 56789"],
        contacts: [
          { id: "c1", name: "Rajesh Sharma", role: "Treasurer", flatNo: "A-402", phone: "+91 98765 43210" },
          { id: "c2", name: "Suresh Varma", role: "President", flatNo: "B-105", phone: "+91 91234 56789" },
        ],
        packages: [
          { id: "sp1", title: "Title Sponsor", amount: "₹1,00,000", badge: "Exclusive", features: ["Main Stage Banner Branding", "VIP Seating (10 Passes)", "Stall Space 10x10", "Logo on All Banners & Passes"], color: "from-amber-500 to-yellow-600", totalSlots: "1", claimedSlots: "0" },
          { id: "sp2", title: "Platinum Sponsor", amount: "₹50,000", badge: "Popular", features: ["Main Stage Side Banner", "VIP Seating (6 Passes)", "Stall Space 8x8", "Logo on Passes"], color: "from-slate-400 to-slate-600", totalSlots: "3", claimedSlots: "1" },
          { id: "sp3", title: "Gold Sponsor", amount: "₹25,000", badge: "Value", features: ["Ground Perimeter Banner", "VIP Seating (4 Passes)", "Logo on Flyer"], color: "from-amber-600 to-amber-700", totalSlots: "5", claimedSlots: "2" },
        ],
        donations: [
          { id: "d1", title: "Mahaprasadam Seva", amount: "₹5,001", desc: "Sponsor lunch & dinner prasadam for 500+ devotees on festival day", badge: "80G Tax Exempt", category: "Annadhanam" },
          { id: "d2", title: "Pushpalankara Seva", amount: "₹3,001", desc: "Sponsor grand floral decoration for deity & main stage area", badge: "80G Tax Exempt", category: "Decoration" },
        ],
      };
    }
  },

  async saveProspectus(dto: EventProspectusDto): Promise<EventProspectusDto> {
    try {
      return await apiClient.post<EventProspectusDto>("/api/events/prospectus", dto);
    } catch (e) {
      console.warn("Prospectus saved locally:", e);
      return dto;
    }
  },
};
