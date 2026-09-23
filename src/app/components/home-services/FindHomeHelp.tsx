import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import {
  Search,
  Filter,
  Star,
  ShieldCheck,
  MapPin,
  SlidersHorizontal,
  X,
  Sparkles,
} from "lucide-react";
import type { ServiceCategory, HomeServiceWorker } from "../../../types/homeServices";
import { homeServiceApi } from "../../../services/homeServices/homeServiceApi";
import { WorkerCard } from "./WorkerCard";
import { WorkerProfileView } from "./WorkerProfileView";
import { BookHomeServiceModal } from "./BookHomeServiceModal";

export function FindHomeHelp() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [workers, setWorkers] = useState<HomeServiceWorker[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "ALL");
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get("q") || "");
  const [selectedTower, setSelectedTower] = useState<string>("ALL");
  const [minRating, setMinRating] = useState<number>(0);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(true);

  const [activeWorkerForProfile, setActiveWorkerForProfile] = useState<HomeServiceWorker | null>(null);
  const [activeWorkerForBooking, setActiveWorkerForBooking] = useState<HomeServiceWorker | null>(null);

  useEffect(() => {
    homeServiceApi.getCategories().then(setCategories);
    loadWorkers();
  }, [selectedCategory, minRating, selectedTower, verifiedOnly]);

  const loadWorkers = async () => {
    setLoading(true);
    const data = await homeServiceApi.getWorkers({
      categoryId: selectedCategory === "ALL" ? undefined : selectedCategory,
      minRating: minRating > 0 ? minRating : undefined,
      tower: selectedTower === "ALL" ? undefined : selectedTower,
      searchQuery: searchQuery.trim() ? searchQuery : undefined,
    });
    setWorkers(verifiedOnly ? data.filter((w) => w.verificationStatus === "VERIFIED") : data);
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadWorkers();
  };

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    setSearchParams((prev) => {
      if (catId === "ALL") prev.delete("category");
      else prev.set("category", catId);
      return prev;
    });
  };

  return (
    <div className="space-y-5">
      {/* Search & Header */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by worker name, language (e.g. Telugu, Hindi), or skill..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedTower}
              onChange={(e) => setSelectedTower(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none cursor-pointer flex-1 sm:flex-initial"
            >
              <option value="ALL">All Towers</option>
              <option value="A">Tower A (Nearby)</option>
              <option value="B">Tower B</option>
              <option value="C">Tower C</option>
            </select>

            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none cursor-pointer flex-1 sm:flex-initial"
            >
              <option value={0}>Any Rating</option>
              <option value={4.0}>⭐ 4.0 &amp; above</option>
              <option value={4.5}>⭐ 4.5 &amp; above</option>
              <option value={4.8}>⭐ 4.8 &amp; above</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:opacity-90 cursor-pointer shrink-0"
            >
              Filter
            </button>
          </div>
        </form>

        {/* Category Horizontal Scroll Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => handleCategoryClick("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            All Services
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => handleCategoryClick(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === c.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <span>{c.icon}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
        <span>Showing {workers.length} Community Workers</span>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="rounded border-slate-300 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
          />
          <span className="text-slate-700 dark:text-slate-300">
            Verified Workers Only
          </span>
        </label>
      </div>

      {/* Worker List Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs font-bold text-slate-400 animate-pulse">
          Searching available community workers...
        </div>
      ) : workers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers.map((worker) => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              onSelect={(w) => setActiveWorkerForProfile(w)}
              onRequestBooking={(w) => setActiveWorkerForBooking(w)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No workers found matching your filter criteria.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Try clearing filters or posting a custom requirement for your slot.
          </p>
          <button
            onClick={() => {
              setSelectedCategory("ALL");
              setSelectedTower("ALL");
              setMinRating(0);
              setSearchQuery("");
            }}
            className="mt-3 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Modals */}
      {activeWorkerForProfile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto">
          <WorkerProfileView
            workerId={activeWorkerForProfile.id}
            onClose={() => setActiveWorkerForProfile(null)}
            onRequestBooking={(w) => {
              setActiveWorkerForProfile(null);
              setActiveWorkerForBooking(w);
            }}
          />
        </div>
      )}

      {activeWorkerForBooking && (
        <BookHomeServiceModal
          worker={activeWorkerForBooking}
          onClose={() => setActiveWorkerForBooking(null)}
          onSuccess={() => {
            setActiveWorkerForBooking(null);
            alert("Booking request sent successfully to worker!");
          }}
        />
      )}
    </div>
  );
}
