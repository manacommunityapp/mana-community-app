import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Star, ChefHat, ShoppingBag
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Skeleton } from "../ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { foodHomeChefService } from "../../../services/food/foodHomeChefService";
import type { HomeChef, HomeChefRequest } from "../../../types/food";

const cuisineOptions = ["All", "South Indian", "North Indian", "Bengali", "Gujarati", "Korean", "Vegan", "Continental"];
const availabilityColors: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  BUSY: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  OFFLINE: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

const EMPTY_FORM: HomeChefRequest = { kitchenName: "", description: "", speciality: "", cuisineTypes: "", fssaiLicense: "" };

export function HomeChefMarketplace() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("All");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [showRegister, setShowRegister] = useState(false);
  const [regForm, setRegForm] = useState<HomeChefRequest>(EMPTY_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ["homeChefs", searchQuery],
    queryFn: () => foodHomeChefService.getHomeChefs(0, 50, undefined, searchQuery || undefined),
  });

  const allChefs: HomeChef[] = data?.content ?? [];

  const chefs = allChefs.filter((c) => {
    if (cuisineFilter !== "All" && !c.cuisineTypes?.toLowerCase().includes(cuisineFilter.toLowerCase())) return false;
    if (ratingFilter === "4plus" && (c.rating ?? 0) < 4) return false;
    if (ratingFilter === "4.5plus" && (c.rating ?? 0) < 4.5) return false;
    return true;
  });

  const registerMutation = useMutation({
    mutationFn: (data: HomeChefRequest) => foodHomeChefService.registerHomeChef(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homeChefs"] });
      setShowRegister(false);
      setRegForm(EMPTY_FORM);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 max-w-md rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Home Chefs</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Discover home-cooked meals from talented chefs in your community</p>
        </div>
        <Dialog open={showRegister} onOpenChange={setShowRegister}>
          <DialogTrigger asChild>
            <Button className="bg-pink-600 hover:bg-pink-700 text-white gap-2">
              <ChefHat className="w-4 h-4" /> Register as Chef
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register as a Home Chef</DialogTitle>
              <DialogDescription>Share your culinary skills with the community. Start your home kitchen business today.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Kitchen Name</label>
                <Input placeholder="e.g., Mom's Kitchen" value={regForm.kitchenName} onChange={(e) => setRegForm((f) => ({ ...f, kitchenName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Speciality</label>
                <Input placeholder="e.g., South Indian Meals" value={regForm.speciality ?? ""} onChange={(e) => setRegForm((f) => ({ ...f, speciality: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cuisine Types</label>
                <Input placeholder="e.g., South Indian, Tamil" value={regForm.cuisineTypes ?? ""} onChange={(e) => setRegForm((f) => ({ ...f, cuisineTypes: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input placeholder="Tell us about your kitchen..." value={regForm.description ?? ""} onChange={(e) => setRegForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">FSSAI License (if available)</label>
                <Input placeholder="License number" value={regForm.fssaiLicense ?? ""} onChange={(e) => setRegForm((f) => ({ ...f, fssaiLicense: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowRegister(false); setRegForm(EMPTY_FORM); }}>Cancel</Button>
              <Button
                className="bg-pink-600 hover:bg-pink-700 text-white"
                disabled={!regForm.kitchenName.trim() || registerMutation.isPending}
                onClick={() => registerMutation.mutate(regForm)}
              >
                {registerMutation.isPending ? "Submitting…" : "Submit Application"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search home chefs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Cuisine" /></SelectTrigger>
          <SelectContent>
            {cuisineOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Rating" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="4plus">4+ Stars</SelectItem>
            <SelectItem value="4.5plus">4.5+ Stars</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chef Grid */}
      {chefs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No home chefs found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {chefs.map((chef) => (
            <Card
              key={chef.id}
              className="border-0 shadow-sm overflow-hidden cursor-pointer group hover:shadow-lg transition-all"
              onClick={() => navigate(`/food/home-chefs/${chef.id}`)}
            >
              <CardContent className="p-0">
                <div className="h-32 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 flex items-center justify-center relative">
                  <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center">
                    <ChefHat className="w-8 h-8 text-pink-500" />
                  </div>
                  <Badge className={`absolute top-2 right-2 text-[10px] border-0 ${availabilityColors[chef.availabilityStatus ?? "OFFLINE"]}`}>
                    {chef.availabilityStatus}
                  </Badge>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-sm group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">{chef.kitchenName}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{chef.speciality}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {chef.cuisineTypes?.split(", ").map((c) => (
                      <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold">{chef.rating}</span>
                      <span className="text-xs text-slate-400">({chef.totalRatings})</span>
                    </div>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3" />
                      {chef.totalOrders} orders
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
