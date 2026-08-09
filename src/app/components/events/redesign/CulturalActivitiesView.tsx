import React, { useState } from "react";
import { Sparkles, Users, Award, Clock, ArrowRight, Search, CheckCircle2 } from "lucide-react";
import { GlassCard, TouchButton, StatusChip, BottomSheet } from "./EventDesignSystem";

interface CulturalActivitiesViewProps {
  isDark?: boolean;
}

export const CulturalActivitiesView: React.FC<CulturalActivitiesViewProps> = ({ isDark = false }) => {
  const [selectedCat, setSelectedCat] = useState<any>(null);
  const [registeredActs, setRegisteredActs] = useState<string[]>([]);

  const categories = [
    {
      id: "act-1",
      title: "Solo & Group Dance Competition",
      category: "Dance",
      image: "https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=600&q=80",
      participants: 48,
      totalSeats: 60,
      ageGroup: "Age 6 – 18 Yrs",
      date: "Aug 28 • 05:00 PM",
      venue: "Grand Stage A",
      status: "Registration Open",
    },
    {
      id: "act-2",
      title: "Voice of Community Singing Idol",
      category: "Singing",
      image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80",
      participants: 32,
      totalSeats: 40,
      ageGroup: "Open for All",
      date: "Aug 29 • 06:00 PM",
      venue: "Auditorium",
      status: "Registration Open",
    },
    {
      id: "act-3",
      title: "Rangoli & Canvas Drawing Contest",
      category: "Drawing",
      image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80",
      participants: 80,
      totalSeats: 80,
      ageGroup: "Kids & Adults",
      date: "Aug 30 • 10:00 AM",
      venue: "Community Hall",
      status: "Seats Full",
    },
    {
      id: "act-4",
      title: "Street Drama & Skit Showcase",
      category: "Drama",
      image: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=600&q=80",
      participants: 12,
      totalSeats: 20,
      ageGroup: "Teams (5-8 members)",
      date: "Sep 01 • 04:00 PM",
      venue: "Open Air Theatre",
      status: "Registration Open",
    },
    {
      id: "act-5",
      title: "MasterChef Culinary Feast",
      category: "Cooking",
      image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80",
      participants: 25,
      totalSeats: 30,
      ageGroup: "Adults (18+)",
      date: "Sep 02 • 11:00 AM",
      venue: "Dining Pavilion",
      status: "Registration Open",
    },
    {
      id: "act-6",
      title: "Kids Fancy Dress Parade",
      category: "Fancy Dress",
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80",
      participants: 45,
      totalSeats: 50,
      ageGroup: "Kids Under 10",
      date: "Sep 03 • 04:30 PM",
      venue: "Grand Stage A",
      status: "Registration Open",
    },
  ];

  const handleEnroll = (id: string) => {
    setRegisteredActs((prev) => [...prev, id]);
    setSelectedCat(null);
  };

  return (
    <div className="space-y-5 pb-8">
      <div>
        <span className="text-[11px] font-extrabold text-[#FF6B00] uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" /> Cultural Extravaganza
        </span>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Cultural Competitions</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Register your family members for music, dance, drama and art contests.
        </p>
      </div>

      {/* Grid of Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categories.map((act) => {
          const seatsLeft = act.totalSeats - act.participants;
          const isRegistered = registeredActs.includes(act.id);

          return (
            <GlassCard
              key={act.id}
              isDark={isDark}
              hoverScale={false}
              className="overflow-hidden border flex flex-col justify-between"
            >
              <div className="relative h-44">
                <img src={act.image} alt={act.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-white/20 backdrop-blur-md text-white">
                      {act.category}
                    </span>
                    <StatusChip status={act.status} isDark={true} />
                  </div>

                  <div>
                    <h3 className="text-base font-black text-white drop-shadow-md">{act.title}</h3>
                    <p className="text-[11px] text-slate-200 mt-0.5">{act.venue} • {act.date}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#FF6B00]" /> {act.participants} / {act.totalSeats} Enrolled
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-orange-50 dark:bg-slate-800 text-[#FF6B00] font-bold text-[10px]">
                    {act.ageGroup}
                  </span>
                </div>

                {/* Seats Left Bar */}
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                    <span className="text-slate-400">Seats Remaining</span>
                    <span className={seatsLeft > 5 ? "text-emerald-500" : "text-rose-500"}>
                      {seatsLeft > 0 ? `${seatsLeft} seats left` : "FULL"}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      style={{ width: `${(act.participants / act.totalSeats) * 100}%` }}
                      className="h-full bg-gradient-to-r from-[#FF6B00] to-[#4F46E5] rounded-full"
                    />
                  </div>
                </div>

                <TouchButton
                  variant={isRegistered ? "glass" : seatsLeft === 0 ? "ghost" : "primary"}
                  size="sm"
                  fullWidth
                  disabled={seatsLeft === 0}
                  onClick={() => setSelectedCat(act)}
                >
                  {isRegistered ? "✅ Registered" : seatsLeft === 0 ? "Registration Closed" : "Register Now"}
                </TouchButton>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Enroll Sheet Modal */}
      <BottomSheet
        isOpen={!!selectedCat}
        onClose={() => setSelectedCat(null)}
        title={selectedCat?.title}
        subtitle={`Confirm participation details for ${selectedCat?.category} competition.`}
        isDark={isDark}
      >
        {selectedCat && (
          <div className="space-y-4 p-2">
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 space-y-1 text-xs">
              <p className="font-bold text-slate-900 dark:text-white">Venue: {selectedCat.venue}</p>
              <p className="text-slate-500">Date & Time: {selectedCat.date}</p>
              <p className="text-slate-500">Age Requirement: {selectedCat.ageGroup}</p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Participant Name</label>
              <input
                type="text"
                defaultValue="Aarav Kumar (Son)"
                className="w-full h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold outline-none text-slate-900 dark:text-white"
              />
            </div>

            <TouchButton variant="primary" fullWidth onClick={() => handleEnroll(selectedCat.id)}>
              Confirm & Book Contest Slot
            </TouchButton>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
