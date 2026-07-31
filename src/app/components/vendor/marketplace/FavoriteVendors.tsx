import { useState, useEffect } from "react";
import {
  Heart,
  Star,
  Loader2,
  AlertCircle,
  Store,
  Trash2,
  HeartOff,
} from "lucide-react";
import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { vendorFavoriteService } from "../../../../services/vendorService";
import { showSuccess, showError } from "../../../../utils/ToastUtils";
import type { VendorFavoriteResponse } from "../../../../types/api";
import { useNavigate } from "react-router";

function FavoriteSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="pt-5">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-xl bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-3 w-24 rounded bg-muted" />
          </div>
          <div className="h-8 w-8 rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

export function FavoriteVendors() {
  const [favorites, setFavorites] = useState<VendorFavoriteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadFavorites();
  }, []);

  async function loadFavorites() {
    setLoading(true);
    try {
      const data = await vendorFavoriteService.getMyFavorites();
      setFavorites(data);
    } catch {
      showError("Failed to load favorites");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(vendorId: number) {
    setRemovingId(vendorId);
    try {
      await vendorFavoriteService.removeFavorite(vendorId);
      setFavorites((prev) => prev.filter((f) => f.vendorId !== vendorId));
      showSuccess("Removed from favorites");
    } catch {
      showError("Failed to remove from favorites");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Favorite Vendors</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your saved vendors for quick access
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <FavoriteSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && favorites.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <HeartOff className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium text-muted-foreground">
            No favorite vendors yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Browse the marketplace and save vendors you like
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => navigate("/marketplace")}
          >
            Browse Marketplace
          </Button>
        </div>
      )}

      {/* Favorites Grid */}
      {!loading && favorites.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((fav) => (
            <Card
              key={fav.id}
              className="hover:shadow-md transition-shadow group"
            >
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  {/* Vendor Logo */}
                  <div
                    className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
                    onClick={() =>
                      navigate(`/marketplace/vendor/${fav.vendorId}`)
                    }
                  >
                    {fav.vendorLogo ? (
                      <img
                        src={fav.vendorLogo}
                        alt={fav.vendorName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-sm font-semibold text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                      onClick={() =>
                        navigate(`/marketplace/vendor/${fav.vendorId}`)
                      }
                    >
                      {fav.vendorName}
                    </h3>
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {fav.vendorCategory}
                    </Badge>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-medium text-foreground">
                        {fav.vendorRating > 0
                          ? fav.vendorRating.toFixed(1)
                          : "New"}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Added {new Date(fav.addedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(fav.vendorId)}
                    disabled={removingId === fav.vendorId}
                  >
                    {removingId === fav.vendorId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* View Profile Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() =>
                    navigate(`/marketplace/vendor/${fav.vendorId}`)
                  }
                >
                  View Profile
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
