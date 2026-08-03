import { useState } from "react";
import { ImageIcon, Play, Upload, Grid3X3, List, Star } from "lucide-react";

// TODO: wire to eventService
const albums = [
  { id: 1, name: "Day 1 – Morning Puja",   count: 84,  cover: "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=400&q=80", featured: true  },
  { id: 2, name: "Cultural Performances",  count: 136, cover: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&q=80", featured: false },
  { id: 3, name: "Sports & Competitions",  count: 72,  cover: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&q=80", featured: false },
  { id: 4, name: "Volunteers in Action",   count: 48,  cover: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&q=80", featured: false },
  { id: 5, name: "Sponsor Stalls",         count: 30,  cover: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80", featured: false },
  { id: 6, name: "Food & Prasadam",        count: 55,  cover: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80", featured: false },
];

// TODO: wire to eventService
const photos = [
  { id: 1, url: "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=300&q=70", album: "Puja", type: "photo" },
  { id: 2, url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=300&q=70", album: "Cultural", type: "photo" },
  { id: 3, url: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=300&q=70", album: "Sports", type: "photo" },
  { id: 4, url: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=300&q=70", album: "Volunteers", type: "photo" },
  { id: 5, url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&q=70", album: "Sponsors", type: "photo" },
  { id: 6, url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&q=70", album: "Food", type: "photo" },
  { id: 7, url: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=300&q=70", album: "Puja", type: "photo" },
  { id: 8, url: "https://images.unsplash.com/photo-1468971050039-be99497410af?w=300&q=70", album: "Cultural", type: "video" },
];

function GalleryImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`${className ?? ""} flex items-center justify-center bg-slate-100`}>
        <ImageIcon className="w-6 h-6 text-slate-300" />
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}

export function EventsGallery() {
  const [view, setView] = useState<"albums" | "grid">("albums");

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-slate-800">Event Gallery</h2>
          <p className="text-xs text-slate-400 mt-0.5">{albums.reduce((a, al) => a + al.count, 0)} photos & videos across {albums.length} albums</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            {(["albums", "grid"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all capitalize
                  ${view === v ? "bg-indigo-500 text-white" : "bg-white text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"}`}>
                {v === "albums" ? <List className="w-3.5 h-3.5" /> : <Grid3X3 className="w-3.5 h-3.5" />}
                {v}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-500 text-white hover:bg-indigo-600 transition-all shadow-sm">
            <Upload className="w-3.5 h-3.5" /> Upload
          </button>
        </div>
      </div>

      {view === "albums" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {albums.map((album, i) => (
            <div key={album.id}
              className={`animate-fade-in-up stagger-${Math.min(i, 8)} bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-lg transition-shadow group cursor-pointer`}>
              <div className="relative h-44 overflow-hidden">
                <GalleryImage src={album.cover} alt={album.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                {album.featured && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400 text-amber-900 text-[10px] font-black">
                    <Star className="w-3 h-3" /> Featured
                  </div>
                )}
                <div className="absolute bottom-3 left-3">
                  <p className="text-white font-bold text-sm">{album.name}</p>
                  <p className="text-white/70 text-[10px] mt-0.5">{album.count} items</p>
                </div>
              </div>
            </div>
          ))}
          {/* Upload album card */}
          <button className="min-h-[220px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-all">
              <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" />
            </div>
            <p className="text-sm font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">New Album</p>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((photo, i) => (
            <div key={photo.id}
              className={`animate-fade-in-up stagger-${Math.min(i, 8)} relative rounded-xl overflow-hidden group cursor-pointer bg-slate-100 aspect-square`}>
              <GalleryImage src={photo.url} alt={photo.album} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all" />
              {photo.type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-4 h-4 text-slate-800 ml-0.5" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-all">
                <span className="text-[10px] font-bold text-white bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">{photo.album}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
