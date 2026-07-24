import { useState, useEffect } from "react";
import {
  Search, Star, Clock, Flame, Leaf, BookOpen, Plus, Heart,
  Filter, ChefHat, Users, Share2, ShoppingCart, X, Check
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Skeleton } from "../ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import type { FoodRecipe } from "../../../types/food";

const mockRecipes: Partial<FoodRecipe>[] = [
  { id: 1, title: "Butter Chicken", cuisineType: "North Indian", mealType: "Dinner", difficulty: "MEDIUM", totalTime: 45, calories: 450, avgRating: 4.7, totalRatings: 125, isVeg: false, isVegan: false, authorName: "Chef Priya", viewCount: 2300, likeCount: 180, servings: 4, description: "Rich and creamy butter chicken made with tender marinated chicken pieces.", instructions: "1. Marinate chicken\n2. Grill in tandoor\n3. Make gravy\n4. Simmer together", ingredients: [{ id: 1, ingredientName: "Chicken", quantity: 500, unit: "gm", isOptional: false }, { id: 2, ingredientName: "Butter", quantity: 100, unit: "gm", isOptional: false }, { id: 3, ingredientName: "Tomato puree", quantity: 200, unit: "ml", isOptional: false }, { id: 4, ingredientName: "Cream", quantity: 100, unit: "ml", isOptional: false }], status: "APPROVED", createdAt: "2026-06-15" },
  { id: 2, title: "Masala Dosa", cuisineType: "South Indian", mealType: "Breakfast", difficulty: "HARD", totalTime: 60, calories: 320, avgRating: 4.5, totalRatings: 98, isVeg: true, isVegan: true, authorName: "Lakshmi K.", viewCount: 1800, likeCount: 140, servings: 4, description: "Crispy dosa with spiced potato filling.", instructions: "1. Soak rice and dal\n2. Grind batter\n3. Ferment overnight\n4. Make potato filling\n5. Spread and cook", ingredients: [{ id: 5, ingredientName: "Rice", quantity: 3, unit: "cups", isOptional: false }, { id: 6, ingredientName: "Urad Dal", quantity: 1, unit: "cup", isOptional: false }, { id: 7, ingredientName: "Potatoes", quantity: 4, unit: "pcs", isOptional: false }], status: "APPROVED", createdAt: "2026-06-20" },
  { id: 3, title: "Avocado Toast", cuisineType: "Continental", mealType: "Breakfast", difficulty: "EASY", totalTime: 10, calories: 280, avgRating: 4.2, totalRatings: 65, isVeg: true, isVegan: true, authorName: "Riya S.", viewCount: 1200, likeCount: 95, servings: 2, description: "Simple and healthy avocado toast.", instructions: "1. Toast bread\n2. Mash avocado\n3. Season and spread", ingredients: [{ id: 8, ingredientName: "Avocado", quantity: 1, unit: "pc", isOptional: false }, { id: 9, ingredientName: "Sourdough Bread", quantity: 2, unit: "slices", isOptional: false }], status: "APPROVED", createdAt: "2026-07-01" },
  { id: 4, title: "Paneer Tikka", cuisineType: "North Indian", mealType: "Snack", difficulty: "EASY", totalTime: 30, calories: 350, avgRating: 4.6, totalRatings: 110, isVeg: true, isVegan: false, authorName: "Chef Priya", viewCount: 2100, likeCount: 165, servings: 4, description: "Marinated paneer grilled to perfection.", instructions: "1. Cut paneer into cubes\n2. Marinate with spices and yogurt\n3. Grill or bake", ingredients: [{ id: 10, ingredientName: "Paneer", quantity: 250, unit: "gm", isOptional: false }, { id: 11, ingredientName: "Yogurt", quantity: 100, unit: "gm", isOptional: false }], status: "APPROVED", createdAt: "2026-06-25" },
  { id: 5, title: "Korean Bibimbap", cuisineType: "Korean", mealType: "Lunch", difficulty: "MEDIUM", totalTime: 40, calories: 520, avgRating: 4.8, totalRatings: 75, isVeg: false, isVegan: false, authorName: "Min-Ji L.", viewCount: 900, likeCount: 72, servings: 2, description: "Traditional Korean mixed rice bowl with vegetables and egg.", instructions: "1. Prepare rice\n2. Saute vegetables separately\n3. Fry egg\n4. Assemble and serve with gochujang", ingredients: [{ id: 12, ingredientName: "Short grain rice", quantity: 2, unit: "cups", isOptional: false }, { id: 13, ingredientName: "Gochujang", quantity: 2, unit: "tbsp", isOptional: false }], status: "APPROVED", createdAt: "2026-07-10" },
  { id: 6, title: "Mango Lassi", cuisineType: "Indian", mealType: "Snack", difficulty: "EASY", totalTime: 5, calories: 180, avgRating: 4.4, totalRatings: 200, isVeg: true, isVegan: false, authorName: "Anita M.", viewCount: 3200, likeCount: 250, servings: 2, description: "Refreshing mango yogurt smoothie.", instructions: "1. Blend mango, yogurt, sugar and ice", ingredients: [{ id: 14, ingredientName: "Mango", quantity: 1, unit: "cup", isOptional: false }, { id: 15, ingredientName: "Yogurt", quantity: 1, unit: "cup", isOptional: false }], status: "APPROVED", createdAt: "2026-07-05" },
];

const cuisineOptions = ["All", "North Indian", "South Indian", "Continental", "Korean", "Indian"];
const difficultyColors: Record<string, string> = {
  EASY: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  HARD: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function RecipePlatform() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("All");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [mealFilter, setMealFilter] = useState("all");
  const [dietFilter, setDietFilter] = useState("all");
  const [selectedRecipe, setSelectedRecipe] = useState<Partial<FoodRecipe> | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set([1, 4]));

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const filtered = mockRecipes.filter((r) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!r.title?.toLowerCase().includes(q) && !r.cuisineType?.toLowerCase().includes(q)) return false;
    }
    if (cuisineFilter !== "All" && r.cuisineType !== cuisineFilter) return false;
    if (difficultyFilter !== "all" && r.difficulty !== difficultyFilter) return false;
    if (mealFilter !== "all" && r.mealType?.toLowerCase() !== mealFilter) return false;
    if (dietFilter === "veg" && !r.isVeg) return false;
    if (dietFilter === "vegan" && !r.isVegan) return false;
    return true;
  });

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const featured = mockRecipes.filter((r) => (r.likeCount ?? 0) > 150);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 max-w-md" />
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
          <h2 className="text-xl font-bold">Recipes</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Discover and share recipes from the community</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
              <Plus className="w-4 h-4" /> Share Recipe
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Share a Recipe</DialogTitle>
              <DialogDescription>Share your favorite recipe with the community</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 p-1">
                <div className="space-y-2">
                  <Label>Recipe Title</Label>
                  <Input placeholder="e.g., Grandma's Dal Makhani" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Cuisine</Label>
                    <Input placeholder="e.g., North Indian" />
                  </div>
                  <div className="space-y-2">
                    <Label>Meal Type</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="dinner">Dinner</SelectItem>
                        <SelectItem value="snack">Snack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Prep Time (min)</Label>
                    <Input type="number" placeholder="30" />
                  </div>
                  <div className="space-y-2">
                    <Label>Servings</Label>
                    <Input type="number" placeholder="4" />
                  </div>
                  <div className="space-y-2">
                    <Label>Calories</Label>
                    <Input type="number" placeholder="350" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Ingredients (one per line)</Label>
                  <Textarea placeholder="500g chicken&#10;2 cups rice&#10;1 tbsp oil" rows={4} />
                </div>
                <div className="space-y-2">
                  <Label>Instructions</Label>
                  <Textarea placeholder="Step-by-step cooking instructions..." rows={5} />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => setShowCreate(false)}>Publish Recipe</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="favorites">My Favorites ({favorites.size})</TabsTrigger>
          <TabsTrigger value="mine">My Recipes</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-4 space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search recipes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Cuisine" /></SelectTrigger>
              <SelectContent>
                {cuisineOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Difficulty" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dietFilter} onValueChange={setDietFilter}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Diet" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="veg">Vegetarian</SelectItem>
                <SelectItem value="vegan">Vegan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Featured */}
          {featured.length > 0 && !searchQuery && cuisineFilter === "All" && (
            <div>
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" /> Popular Recipes
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featured.slice(0, 3).map((r) => (
                  <RecipeCard key={r.id} recipe={r} isFavorite={favorites.has(r.id!)} onToggleFavorite={toggleFavorite} onClick={() => setSelectedRecipe(r)} />
                ))}
              </div>
            </div>
          )}

          {/* All Recipes */}
          <div>
            <h3 className="text-sm font-bold mb-3">All Recipes ({filtered.length})</h3>
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No recipes found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((r) => (
                  <RecipeCard key={r.id} recipe={r} isFavorite={favorites.has(r.id!)} onToggleFavorite={toggleFavorite} onClick={() => setSelectedRecipe(r)} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="favorites" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockRecipes.filter((r) => favorites.has(r.id!)).map((r) => (
              <RecipeCard key={r.id} recipe={r} isFavorite onToggleFavorite={toggleFavorite} onClick={() => setSelectedRecipe(r)} />
            ))}
          </div>
          {favorites.size === 0 && (
            <div className="text-center py-16 text-slate-400">
              <Heart className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No favorites yet</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="mine" className="mt-4">
          <div className="text-center py-16 text-slate-400">
            <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">You have not shared any recipes yet</p>
            <Button className="mt-4 bg-orange-600 hover:bg-orange-700 text-white gap-2" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" /> Share Your First Recipe
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Recipe Detail Dialog */}
      <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
        <DialogContent className="max-w-2xl">
          {selectedRecipe && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedRecipe.title}</DialogTitle>
                <DialogDescription>by {selectedRecipe.authorName}</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-4 p-1">
                  {/* Meta */}
                  <div className="flex flex-wrap gap-2">
                    <Badge className={difficultyColors[selectedRecipe.difficulty ?? "EASY"]}>{selectedRecipe.difficulty}</Badge>
                    <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{selectedRecipe.totalTime} min</Badge>
                    <Badge variant="secondary"><Flame className="w-3 h-3 mr-1" />{selectedRecipe.calories} cal</Badge>
                    <Badge variant="secondary"><Users className="w-3 h-3 mr-1" />{selectedRecipe.servings} servings</Badge>
                    {selectedRecipe.isVeg && <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><Leaf className="w-3 h-3 mr-1" />Veg</Badge>}
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300">{selectedRecipe.description}</p>

                  <Separator />

                  {/* Ingredients */}
                  <div>
                    <h4 className="font-bold text-sm mb-2">Ingredients</h4>
                    <div className="space-y-1.5">
                      {selectedRecipe.ingredients?.map((ing) => (
                        <div key={ing.id} className="flex items-center gap-2 text-sm">
                          <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                          <span>{ing.quantity} {ing.unit} {ing.ingredientName}</span>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="mt-3 gap-1 text-xs">
                      <ShoppingCart className="w-3 h-3" /> Add to Shopping List
                    </Button>
                  </div>

                  <Separator />

                  {/* Instructions */}
                  <div>
                    <h4 className="font-bold text-sm mb-2">Instructions</h4>
                    <div className="space-y-2">
                      {selectedRecipe.instructions?.split("\n").map((step, i) => (
                        <div key={i} className="flex gap-3 text-sm">
                          <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-slate-600 dark:text-slate-300">{step.replace(/^\d+\.\s*/, "")}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-3 pt-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-4 h-4 ${s <= Math.round(selectedRecipe.avgRating ?? 0) ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}`} />
                      ))}
                    </div>
                    <span className="text-sm text-slate-500">{selectedRecipe.avgRating} ({selectedRecipe.totalRatings} ratings)</span>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RecipeCard({ recipe: r, isFavorite, onToggleFavorite, onClick }: {
  recipe: Partial<FoodRecipe>; isFavorite: boolean; onToggleFavorite: (id: number) => void; onClick: () => void;
}) {
  return (
    <Card className="border-0 shadow-sm overflow-hidden cursor-pointer group hover:shadow-lg transition-all" onClick={onClick}>
      <CardContent className="p-0">
        <div className="h-36 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 flex items-center justify-center relative">
          <BookOpen className="w-10 h-10 text-amber-300 dark:text-amber-800" />
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(r.id!); }}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
          </button>
          {r.isVeg && (
            <Badge className="absolute top-2 left-2 bg-green-600 text-white text-[9px] border-0">
              <Leaf className="w-2.5 h-2.5 mr-0.5" /> Veg
            </Badge>
          )}
        </div>
        <div className="p-4">
          <h4 className="font-bold text-sm group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{r.title}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{r.cuisineType} - {r.mealType}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge className={`text-[10px] border-0 ${difficultyColors[r.difficulty ?? "EASY"]}`}>{r.difficulty}</Badge>
            <span className="text-xs text-slate-500 flex items-center gap-0.5"><Clock className="w-3 h-3" />{r.totalTime} min</span>
            <span className="text-xs text-slate-500 flex items-center gap-0.5"><Flame className="w-3 h-3" />{r.calories} cal</span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold">{r.avgRating}</span>
              <span className="text-xs text-slate-400">({r.totalRatings})</span>
            </div>
            <span className="text-xs text-slate-400">by {r.authorName}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
