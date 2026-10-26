import React, { useState } from "react";
import "../../styles/playo.css";

export const WebSportsPortal: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState("Mana Community Arena");

  const sports = [
    { id: "badminton", name: "Badminton", img: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&q=80", courts: 4, players: 48 },
    { id: "cricket", name: "Box Cricket", img: "https://images.unsplash.com/photo-1531415074868-036b1c5d53ec?w=400&q=80", courts: 2, players: 64 },
    { id: "pickleball", name: "Pickleball", img: "https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=400&q=80", courts: 2, players: 28 },
    { id: "football", name: "Football Turf", img: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&q=80", courts: 1, players: 36 },
    { id: "swimming", name: "Swimming Pool", img: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&q=80", courts: 2, players: 22 },
    { id: "tennis", name: "Lawn Tennis", img: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=400&q=80", courts: 2, players: 18 }
  ];

  return (
    <div className="playo-app min-h-screen p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#E3E8E6] shadow-sm">
        <div className="flex items-center gap-4">
          <span className="text-3xl font-black text-[#00b562] tracking-tighter">playo</span>
          <button className="playo-pill flex items-center gap-2">
            📍 <span>{selectedCity}</span> ▾
          </button>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 font-semibold text-[#3B4540] hover:text-[#00B562]">Venues</button>
          <button className="px-4 py-2 font-semibold text-[#3B4540] hover:text-[#00B562]">Matches</button>
          <button className="playo-btn-primary">Book Court</button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="playo-card p-8 bg-white flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-4 max-w-xl">
          <span className="bg-[#E6F8F0] text-[#00914E] text-xs font-black uppercase px-3 py-1 rounded-full">
            Community Sports & Courts
          </span>
          <h1 className="text-3xl md:text-4xl font-black uppercase text-[#3B4540] leading-tight">
            Book sports venues. <br /> Join games. <br /> Find trainers near you.
          </h1>
          <p className="text-[#758A80] text-base">
            Discover sports venues, book slots online, host matches, and connect with players in Mana Community.
          </p>
          <div className="flex gap-3 pt-2">
            <button className="playo-btn-primary">Explore Venues</button>
            <button className="playo-pill">Host a Match</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full md:w-80">
          <div className="bg-[#F1F3F2] p-4 rounded-2xl text-center space-y-1">
            <span className="text-2xl font-black text-[#00B562]">12+</span>
            <p className="text-xs font-bold text-[#3B4540]">Active Courts</p>
          </div>
          <div className="bg-[#F1F3F2] p-4 rounded-2xl text-center space-y-1">
            <span className="text-2xl font-black text-[#00B562]">240+</span>
            <p className="text-xs font-bold text-[#3B4540]">Community Players</p>
          </div>
          <div className="bg-[#F1F3F2] p-4 rounded-2xl text-center space-y-1">
            <span className="text-2xl font-black text-[#00B562]">8</span>
            <p className="text-xs font-bold text-[#3B4540]">Sports Leagues</p>
          </div>
          <div className="bg-[#F1F3F2] p-4 rounded-2xl text-center space-y-1">
            <span className="text-2xl font-black text-[#00B562]">4.9⭐</span>
            <p className="text-xs font-bold text-[#3B4540]">Court Rating</p>
          </div>
        </div>
      </div>

      {/* Popular Sports Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-baseline">
          <h2 className="text-2xl font-black text-[#3B4540]">Popular Sports</h2>
          <span className="text-sm font-bold text-[#00B562] cursor-pointer">View All Venues →</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {sports.map(s => (
            <div key={s.id} className="playo-sport-aspect cursor-pointer hover:scale-[1.02] transition">
              <img src={s.img} alt={s.name} />
              <div className="playo-sport-label">
                <h3>{s.name}</h3>
                <p className="text-xs text-gray-200 font-normal">{s.players} Players</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WebSportsPortal;