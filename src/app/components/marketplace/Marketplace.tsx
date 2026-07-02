import { Search, Tag, MapPin, CheckCircle, Plus } from "lucide-react";
import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Marketplace() {
  const [activeCategory, setActiveCategory] = useState("All");
  
  const categories = ["All", "Homemade Food", "Electronics", "Vehicles", "Real Estate", "Services"];
  
  const listings = [
    {
      id: 1,
      title: "Authentic Hyderabadi Chicken Biryani",
      price: "₹350 / portion",
      category: "Homemade Food",
      seller: "Mrs. Fatima",
      verified: true,
      location: "Tower B, Apt 402",
      image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=80&w=400&h=300",
      description: "Taking pre-orders for Sunday lunch. Made with authentic spices, fresh ingredients, and premium basmati rice."
    },
    {
      id: 2,
      title: "PlayStation 5 - Disc Edition (Barely Used)",
      price: "₹38,000",
      category: "Electronics",
      seller: "Karan S.",
      verified: true,
      location: "Tower A, Apt 1205",
      image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=400&h=300",
      description: "Selling my PS5 disc edition. Comes with 2 DualSense controllers and 3 games. Relocating soon."
    },
    {
      id: 3,
      title: "Trek Mountain Bike (Adult size)",
      price: "₹18,500",
      category: "Vehicles",
      seller: "David M.",
      verified: true,
      location: "Villa 45",
      image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=400&h=300",
      description: "Excellent condition, recently serviced by Trek dealers. Perfect for weekend trails."
    }
  ];

  return (
    <div className="min-h-screen text-[#0d0d2b] p-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Resident Portal</span>
          <h1 className="text-3xl font-black text-[#0d0d2b] mt-1">Community Marketplace</h1>
          <p className="text-[#6b7094] text-sm mt-1">Buy and sell trusted items with verified neighbors.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 text-white text-sm font-bold rounded-full transition-all cursor-pointer self-start md:self-auto">
          <Plus className="w-4.5 h-4.5" />
          Post Advertisement
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7094] w-4.5 h-4.5" />
          <input 
            type="text" 
            placeholder="Search for biryani, bikes, electronics..." 
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-[#0d0d2b] placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border",
                activeCategory === cat
                  ? "bg-[#0d0d2b] text-white border-transparent shadow-sm"
                  : "bg-white text-[#6b7094] border-slate-200 hover:text-[#0d0d2b] hover:bg-slate-50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {listings.map((item) => (
          <div 
            key={item.id} 
            className="bg-white rounded-2xl border border-[#6366f1]/12 overflow-hidden flex flex-col hover:border-indigo-500/20 hover:shadow-md transition-all duration-300 shadow-[0_4px_20px_rgba(99,102,241,0.03)] group"
          >
            <div className="h-48 relative overflow-hidden bg-slate-50">
              <img 
                src={item.image} 
                alt={item.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" 
              />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3.5 py-1.5 rounded-full text-xs font-bold text-[#0d0d2b] shadow-md border border-[#6366f1]/12">
                {item.price}
              </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 font-bold uppercase tracking-wider mb-2">
                  <Tag className="w-3 h-3" /> {item.category}
                </div>
                <h3 className="font-extrabold text-[#0d0d2b] text-base leading-snug mb-2 group-hover:text-indigo-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-[#6b7094] text-xs leading-relaxed mb-4 line-clamp-3">
                  {item.description}
                </p>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center text-xs font-black text-indigo-600">
                    {item.seller.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0d0d2b] flex items-center gap-1">
                      {item.seller} {item.verified && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 fill-emerald-50" />}
                    </div>
                    <div className="text-[10px] text-[#6b7094] flex items-center gap-0.5 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#6b7094]" /> {item.location}
                    </div>
                  </div>
                </div>
                <button className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-lg transition-all cursor-pointer">
                  Contact
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
