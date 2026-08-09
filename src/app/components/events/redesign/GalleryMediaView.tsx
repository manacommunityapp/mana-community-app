import React, { useState } from "react";
import { Image as ImageIcon, Video, Heart, Share2, Sparkles, X, Download } from "lucide-react";
import { GlassCard, BottomSheet } from "./EventDesignSystem";

interface GalleryMediaViewProps {
  isDark?: boolean;
}

export const GalleryMediaView: React.FC<GalleryMediaViewProps> = ({ isDark = false }) => {
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

  const stories = [
    { name: "Live Aarti", image: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=150&q=80" },
    { name: "Dance Acts", image: "https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=150&q=80" },
    { name: "Prasadam", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=150&q=80" },
    { name: "Sports Day", image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=150&q=80" },
  ];

  const galleryItems = [
    { id: "g1", title: "Grand Ganesh Sthapana 2026", likes: 142, views: "1.2k", height: "h-64", image: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=600&q=80" },
    { id: "g2", title: "Children Garba Dance Competition", likes: 98, views: "850", height: "h-48", image: "https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=600&q=80" },
    { id: "g3", title: "Live Orchestra & Bhajan Night", likes: 210, views: "2.4k", height: "h-56", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80" },
    { id: "g4", title: "Maha Prasadam Community Cooking", likes: 175, views: "1.5k", height: "h-72", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80" },
  ];

  return (
    <div className="space-y-5 pb-8">
      <div>
        <span className="text-[11px] font-extrabold text-[#FF6B00] uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" /> Media & Memories
        </span>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Event Media Gallery</h2>
      </div>

      {/* Stories / Highlights Bubble Bar */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 hide-scrollbar">
        {stories.map((st, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group">
            <div className="p-0.5 rounded-full bg-gradient-to-tr from-[#FF6B00] to-[#4F46E5] group-hover:scale-105 transition-transform">
              <img src={st.image} alt={st.name} className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-slate-900" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{st.name}</span>
          </div>
        ))}
      </div>

      {/* Pinterest-style Masonry Grid */}
      <div className="grid grid-cols-2 gap-3">
        {galleryItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedMedia(item)}
            className={`relative rounded-3xl overflow-hidden shadow-lg group cursor-pointer ${item.height}`}
          >
            <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent p-3 flex flex-col justify-end text-white">
              <h4 className="text-xs font-bold line-clamp-1">{item.title}</h4>
              <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-300 mt-1">
                <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> {item.likes}</span>
                <span>• {item.views} views</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      <BottomSheet
        isOpen={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
        title={selectedMedia?.title}
        isDark={isDark}
      >
        {selectedMedia && (
          <div className="space-y-4 p-2">
            <img src={selectedMedia.image} alt={selectedMedia.title} className="w-full h-64 object-cover rounded-2xl" />
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> {selectedMedia.likes} Likes</span>
              <button onClick={() => alert("Photo saved to gallery!")} className="text-[#FF6B00] flex items-center gap-1">
                <Download className="w-4 h-4" /> Download High-Res
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
