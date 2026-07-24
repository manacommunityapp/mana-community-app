import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Search, Star, Clock, MapPin, Filter, ChevronLeft, ChevronRight,
  UtensilsCrossed, Leaf, Award, SlidersHorizontal, X
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Skeleton } from "../ui/skeleton";
import type { FoodRestaurant } from "../../../types/food";

const mockRestaurants: Partial<FoodRestaurant>[] = [
  { id: 1, name: "Spice Garden", cuisineTypes: "North Indian, Mughlai", rating: 4.5, totalRatings: 230, avgDeliveryTime: 35, featured: true, status: "APPROVED", deliveryEnabled: true, dineInEnabled: true, address: "Block A, Community Center" },
  { id: 2, name: "Sushi Station", cuisineTypes: "Japanese, Asian", rating: 4.7, totalRatings: 180, avgDeliveryTime: 40, featured: true, status: "APPROVED", deliveryEnabled: true, dineInEnabled: false, address: "Block C, Main Road" },
  { id: 3, name: "Green Bowl", cuisineTypes: "Healthy, Salads, Vegan", rating: 4.3, totalRatings: 145, avgDeliveryTime: 25, featured: false, status: "APPROVED", deliveryEnabled: true, dineInEnabled: true, address: "Block B, Market" },
  { id: 4, name: "Desi Bites", cuisineTypes: "South Indian, Street Food", rating: 4.6, totalRatings: 310, avgDeliveryTime: 30, featured: true, status: "APPROVED", deliveryEnabled: true, dineInEnabled: true, address: "Block D, Food Court" },
  { id: 5, name: "Pizza Hub", cuisineTypes: "Italian, Pizza, Pasta", rating: 4.2, totalRatings: 200, avgDeliveryTime: 35, featured: false, status: "APPROVED", deliveryEnabled: true, dineInEnabled: false, address: "Block A, Shop 12" },
  { id: 6, name: "Wok This Way", cuisineTypes: "Chinese, Thai", rating: 4.4, totalRatings: 165, avgDeliveryTime: 30, featured: false, status: "APPROVED", deliveryEnabled: true, dineInEnabled: true, address: "Block E, Corner" },
  { id: 7, name: "Biryani Palace", cuisineTypes: "Hyderabadi, Mughlai", rating: 4.8, totalRatings: 420, avgDeliveryTime: 45, featured: true, status: "APPROVED", deliveryEnabled: true, dineInEnabled: true, address: "Block F, Main Gate" },
  { id: 8, name: "Cafe Bloom", cuisineTypes: "Continental, Cafe", rating: 4.1, totalRatings: 90, avgDeliveryTime: 20, featured: false, status: "APPROVED", deliveryEnabled: true, dineInEnabled: true, address: "Block B, Garden Area" },
  { id: 9, name: "Tandoor Express", cuisineTypes: "North Indian, Tandoor", rating: 4.3, totalRatings: 175, avgDeliveryTime: 30, featured: false, status: "APPROVED", deliveryEnabled: true, dineInEnabled: false, address: "Block C, Shop 5" },
];

const cuisineFilters = ["All", "North Indian", "South Indian", "Chinese", "Italian", "Japanese", "Healthy", "Continental", "Street Food"];
const sortOptions = [
  { value: "rating", label: "Rating" },
  { value: "delivery", label: "Delivery Time" },
  { value: "popularity", label: "Popularity" },
  { value: "new", label: "Newest" },
];

export function RestaurantBrowse() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<Partial<FoodRestaurant>[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [sortBy, setSortBy] = useState("rating");
  const [showFilters, setShowFilters] = useState(false);
  const [deliveryOnly, setDeliveryOnly] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 6;

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      let filtered = [...mockRestaurants];
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter((r) => r.name?.toLowerCase().includes(q) || r.cuisineTypes?.toLowerCase().includes(q));
      }
      if (selectedCuisine !== "All") {
        filtered = filtered.filter((r) => r.cuisineTypes?.toLowerCase().includes(selectedCuisine.toLowerCase()));
      }
      if (deliveryOnly) {
        filtered = filtered.filter((r) => r.deliveryEnabled);
      }
      if (sortBy === "rating") filtered.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      else if (sortBy === "delivery") filtered.sort((a, b) => (a.avgDeliveryTime ?? 0) - (b.avgDeliveryTime ?? 0));
      else if (sortBy === "popularity") filtered.sort((a, b) => (b.totalRatings ?? 0) - (a.totalRatings ?? 0));
      setRestaurants(filtered);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCuisine, sortBy, deliveryOnly]);

  const featured = restaurants.filter((r) => r.featured);
  const totalPages = Math.ceil(restaurants.length / pageSize);
  const paged = restaurants.slice(page * pageSize, (page + 1) * pageSize);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full max-w-md rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search restaurants or cuisines..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }} className="pl-10" />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              {sortOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant={showFilters ? "default" : "outline"} size="icon" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filter Chips */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          {cuisineFilters.map((c) => (
            <Button key={c} variant={selectedCuisine === c ? "default" : "outline"} size="sm" className="text-xs" onClick={() => { setSelectedCuisine(c); setPage(0); }}>
              {c}
            </Button>
          ))}
          <Button variant={deliveryOnly ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setDeliveryOnly(!deliveryOnly)}>
            Delivery Only
          </Button>
        </div>
      )}

      {/* Featured Section */}
      {featured.length > 0 && page === 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            Featured Restaurants
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.slice(0, 3).map((r) => (
              <RestaurantCard key={r.id} restaurant={r} onClick={() => navigate(`/food/restaurants/${r.id}`)} isFeatured />
            ))}
          </div>
        </div>
      )}

      {/* All Restaurants */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            All Restaurants ({restaurants.length})
          </h3>
        </div>
        {paged.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No restaurants found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paged.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} onClick={() => navigate(`/food/restaurants/${r.id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-500">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function RestaurantCard({ restaurant: r, onClick, isFeatured }: { restaurant: Partial<FoodRestaurant>; onClick: () => void; isFeatured?: boolean }) {
  return (
    <Card className="border-0 shadow-sm overflow-hidden cursor-pointer group hover:shadow-lg transition-all" onClick={onClick}>
      <div className={`h-36 bg-gradient-to-br ${isFeatured ? "from-orange-100 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20" : "from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50"} flex items-center justify-center relative`}>
        <UtensilsCrossed className="w-10 h-10 text-slate-300 dark:text-slate-600" />
        {isFeatured && (
          <Badge className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] border-0">
            <Award className="w-3 h-3 mr-1" /> Featured
          </Badge>
        )}
        {r.cuisineTypes?.toLowerCase().includes("vegan") || r.cuisineTypes?.toLowerCase().includes("healthy") ? (
          <Badge className="absolute top-2 right-2 bg-green-500 text-white text-[10px] border-0">
            <Leaf className="w-3 h-3 mr-1" /> Veg
          </Badge>
        ) : null}
      </div>
      <CardContent className="p-4">
        <h4 className="font-semibold text-sm group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{r.name}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{r.cuisineTypes}</p>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold">{r.rating}</span>
            <span className="text-xs text-slate-400">({r.totalRatings})</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {r.avgDeliveryTime} min
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          {r.deliveryEnabled && <Badge variant="secondary" className="text-[10px]">Delivery</Badge>}
          {r.dineInEnabled && <Badge variant="secondary" className="text-[10px]">Dine-in</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}
