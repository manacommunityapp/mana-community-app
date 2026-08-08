import React, { useState } from "react";
import {
  Calendar, MapPin, Share2, Ticket, QrCode, Users, Star,
  Clock, Navigation, ShieldCheck, Heart, Award, ArrowLeft,
  Sparkles, Download, CheckCircle2, ChevronRight, MessageSquare
} from "lucide-react";
import { GlassCard, TouchButton, StatusChip, BottomSheet } from "./EventDesignSystem";

interface EventDetailViewProps {
  isDark?: boolean;
  onBack: () => void;
  onOpenRegister: () => void;
}

export const EventDetailView: React.FC<EventDetailViewProps> = ({
  isDark = false,
  onBack,
  onOpenRegister,
}) => {
  const [showQRModal, setShowQRModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const eventData = {
    title: "Ganesh Chaturthi Utsav 2026",
    subtitle: "Grand 10-Day Festival, Cultural Competitions & Community Feasts",
    category: "Grand Community Festival",
    status: "Live Registration",
    dates: "August 27 – September 06, 2026",
    location: "Main Community Grounds & Grand Pavilion, Sector 4",
    organizer: "Mana Community Cultural & Festival Committee",
    organizerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    coverImage: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=1200&q=80",
    totalPasses: "2,500",
    bookedPasses: "1,842",
    sponsorsCount: "19 Platinum & Gold",
    description: "Join over 5,000 residents and guests for the annual Ganesh Chaturthi Utsav 2026. Featuring daily grand aartis, cultural performances, kids drawing competition, grand maha-prasadam feast, live orchestra, and lucky draw prizes.",
    timeline: [
      { day: "Day 1 (Aug 27)", title: "Ganesh Sthapana & Grand Procession", time: "08:00 AM - 12:00 PM", status: "Upcoming" },
      { day: "Day 2 (Aug 28)", title: "Children's Cultural Night & Quiz", time: "05:00 PM - 09:00 PM", status: "Upcoming" },
      { day: "Day 5 (Aug 31)", title: "Grand Maha Prasadam Feast", time: "12:00 PM - 04:00 PM", status: "Upcoming" },
      { day: "Day 10 (Sep 06)", title: "Visarjan Yatra & Dhol Tasha", time: "03:00 PM - 09:00 PM", status: "Upcoming" },
    ],
    sponsors: [
      { name: "Apex Builders", tier: "Platinum", logo: "🏢" },
      { name: "Reliance Retail", tier: "Platinum", logo: "🛍️" },
      { name: "HDFC Bank", tier: "Gold", logo: "🏦" },
      { name: "Apollo Hospitals", tier: "Gold", logo: "🏥" },
    ],
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs hover:bg-orange-50 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShareModal(true)}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-[#FF6B00] shadow-xs cursor-pointer"
          >
            <Share2 className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => setShowQRModal(true)}
            className="p-2.5 rounded-2xl bg-[#FF6B00] text-white shadow-md hover:scale-105 cursor-pointer flex items-center gap-1 text-xs font-bold"
          >
            <QrCode className="w-4.5 h-4.5" />
            <span className="hidden sm:inline">My Pass</span>
          </button>
        </div>
      </div>

      {/* Large Cover Banner */}
      <div className="relative rounded-[28px] overflow-hidden shadow-2xl h-64 sm:h-80 group">
        <img
          src={eventData.coverImage}
          alt={eventData.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-between p-6">
          <div className="flex items-center justify-between">
            <StatusChip status={eventData.status} isDark={true} />
            <span className="px-3 py-1 rounded-full text-xs font-black bg-white/20 backdrop-blur-md text-white border border-white/30">
              {eventData.category}
            </span>
          </div>

          <div className="text-white">
            <h1 className="text-2xl sm:text-3xl font-black drop-shadow-md">{eventData.title}</h1>
            <p className="text-xs text-slate-200 mt-1 max-w-xl line-clamp-2">{eventData.subtitle}</p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300 mt-3">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#FF6B00]" /> {eventData.dates}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#FF6B00]" /> {eventData.location}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TouchButton variant="primary" icon={Ticket} onClick={onOpenRegister} fullWidth>
          Register / Book Pass
        </TouchButton>

        <TouchButton
          variant="glass"
          icon={Navigation}
          isDark={isDark}
          onClick={() => window.open("https://maps.google.com", "_blank")}
          fullWidth
        >
          Get Directions
        </TouchButton>

        <TouchButton
          variant="secondary"
          icon={QrCode}
          onClick={() => setShowQRModal(true)}
          fullWidth
        >
          Show QR Entry Pass
        </TouchButton>
      </div>

      {/* Key Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <GlassCard isDark={isDark} hoverScale={false} className="p-3.5 border text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Seats</span>
          <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{eventData.totalPasses}</p>
        </GlassCard>
        <GlassCard isDark={isDark} hoverScale={false} className="p-3.5 border text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400">Passes Booked</span>
          <p className="text-lg font-black text-[#FF6B00] mt-0.5">{eventData.bookedPasses}</p>
        </GlassCard>
        <GlassCard isDark={isDark} hoverScale={false} className="p-3.5 border text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400">Sponsors</span>
          <p className="text-lg font-black text-[#4F46E5] mt-0.5">19 Partners</p>
        </GlassCard>
        <GlassCard isDark={isDark} hoverScale={false} className="p-3.5 border text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400">Food Capacity</span>
          <p className="text-lg font-black text-[#16A34A] mt-0.5">4,500 Plates</p>
        </GlassCard>
      </div>

      {/* Description & Organizer */}
      <GlassCard isDark={isDark} hoverScale={false} className="p-5 border space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">About Event</h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {eventData.description}
        </p>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={eventData.organizerAvatar}
              alt="Organizer"
              className="w-10 h-10 rounded-full object-cover border border-[#FF6B00]"
            />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Organized By</p>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">{eventData.organizer}</h4>
            </div>
          </div>
          <button className="px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-slate-800 text-[#FF6B00] text-xs font-bold hover:underline">
            Contact Host
          </button>
        </div>
      </GlassCard>

      {/* Event Timeline Stepper */}
      <GlassCard isDark={isDark} hoverScale={false} className="p-5 border">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#FF6B00]" />
          Event Timeline & Programs
        </h3>

        <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
          {eventData.timeline.map((item, idx) => (
            <div key={idx} className="relative pl-8">
              <div className="absolute left-1.5 top-1 w-3.5 h-3.5 rounded-full bg-[#FF6B00] border-2 border-white dark:border-slate-900 shadow-xs" />
              <span className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-wider">{item.day}</span>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5">{item.title}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.time}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Sponsor Reel */}
      <GlassCard isDark={isDark} hoverScale={false} className="p-5 border">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3">Event Partners & Sponsors</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {eventData.sponsors.map((sp, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-center border border-slate-100 dark:border-slate-700/50"
            >
              <span className="text-2xl">{sp.logo}</span>
              <h5 className="text-xs font-extrabold text-slate-900 dark:text-white mt-1">{sp.name}</h5>
              <span className="text-[9px] uppercase font-bold text-[#FF6B00]">{sp.tier} Sponsor</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Digital QR Entry Pass Bottom Sheet Modal */}
      <BottomSheet
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="Digital QR Pass"
        subtitle="Present this QR code at the event gate for instant check-in"
        isDark={isDark}
      >
        <div className="p-4 text-center space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border-2 border-dashed border-[#FF6B00] inline-block shadow-inner">
            {/* Simulated QR Code graphic */}
            <div className="w-48 h-48 bg-slate-900 rounded-2xl p-3 flex flex-col items-center justify-between text-white mx-auto">
              <div className="grid grid-cols-5 gap-1.5 w-full h-full p-2 bg-white rounded-xl">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-xs ${
                      (i % 2 === 0 || i % 7 === 0 || i === 0 || i === 24) ? "bg-slate-900" : "bg-orange-500/20"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-mono text-[#FF6B00] font-bold">PASS-8849-2026-GANESH</span>
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Sandeep Kumar (VIP Pass)</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Main Gate Entry • Seat Row A-12</p>
          </div>

          <TouchButton variant="primary" icon={Download} fullWidth onClick={() => alert("Pass downloaded!")}>
            Download Digital Ticket PDF
          </TouchButton>
        </div>
      </BottomSheet>

      {/* Share Modal */}
      <BottomSheet
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Event"
        subtitle="Invite friends and family to join the festival"
        isDark={isDark}
      >
        <div className="grid grid-cols-3 gap-3 p-2">
          {["WhatsApp", "Telegram", "Copy Link", "Email", "Instagram", "Facebook"].map((platform, idx) => (
            <button
              key={idx}
              onClick={() => {
                alert(`Shared via ${platform}`);
                setShowShareModal(false);
              }}
              className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 text-xs font-bold text-slate-800 dark:text-slate-200 text-center cursor-pointer transition-colors"
            >
              {platform}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
};
