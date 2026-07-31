import { useState, useEffect } from "react";
import {
  Star,
  MapPin,
  Phone,
  Globe,
  Mail,
  Clock,
  Heart,
  Loader2,
  AlertCircle,
  Store,
  BadgeCheck,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  vendorService,
  vendorServiceCatalog,
  vendorRatingService,
  vendorFavoriteService,
} from "../../../../services/vendorService";
import { showSuccess, showError } from "../../../../utils/ToastUtils";
import type {
  VendorResponse,
  VendorServiceResponse,
  VendorRatingResponse,
} from "../../../../types/api";
import { useParams, useNavigate } from "react-router";

function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-48 rounded-xl bg-muted" />
      <div className="flex gap-4">
        <div className="h-20 w-20 rounded-xl bg-muted shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-5">
              <div className="h-32 rounded bg-muted mb-3" />
              <div className="h-4 w-3/4 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function VendorProfilePublic() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<VendorResponse | null>(null);
  const [services, setServices] = useState<VendorServiceResponse[]>([]);
  const [reviews, setReviews] = useState<VendorRatingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const id = Number(vendorId);

  useEffect(() => {
    if (!vendorId || isNaN(id)) return;
    loadVendorProfile();
  }, [vendorId]);

  async function loadVendorProfile() {
    setLoading(true);
    try {
      const [vendorData, servicesData, ratingsData, favCheck] =
        await Promise.all([
          vendorService.getVendorById(id),
          vendorServiceCatalog.getServicesByVendor(id, 0, 20),
          vendorRatingService.getRatings({ vendorId: id, page: 0, size: 10 }),
          vendorFavoriteService
            .checkFavorite(id)
            .catch(() => ({ favorited: false })),
        ]);
      setVendor(vendorData);
      setServices(servicesData.content);
      setReviews(ratingsData.content);
      setIsFavorited(favCheck.favorited);
    } catch {
      showError("Failed to load vendor profile");
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite() {
    setFavLoading(true);
    try {
      if (isFavorited) {
        await vendorFavoriteService.removeFavorite(id);
        setIsFavorited(false);
        showSuccess("Removed from favorites");
      } else {
        await vendorFavoriteService.addFavorite(id);
        setIsFavorited(true);
        showSuccess("Added to favorites");
      }
    } catch {
      showError("Failed to update favorites");
    } finally {
      setFavLoading(false);
    }
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);

  if (loading) return <ProfileSkeleton />;

  if (!vendor) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm font-medium text-muted-foreground">
          Vendor not found
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => navigate("/marketplace")}
        >
          Back to Marketplace
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative h-48 rounded-xl overflow-hidden bg-muted">
        {vendor.bannerUrl ? (
          <img
            src={vendor.bannerUrl}
            alt={`${vendor.businessName} banner`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20" />
        )}
      </div>

      {/* Vendor Info */}
      <div className="flex flex-col sm:flex-row gap-4 -mt-12 sm:-mt-10 px-4 sm:px-0">
        {/* Logo */}
        <div className="h-20 w-20 rounded-xl border-4 border-background bg-muted shrink-0 overflow-hidden shadow-md">
          {vendor.logoUrl ? (
            <img
              src={vendor.logoUrl}
              alt={vendor.businessName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Store className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">
                  {vendor.businessName}
                </h1>
                {vendor.isVerified && (
                  <BadgeCheck className="h-5 w-5 text-blue-500 shrink-0" />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="outline">{vendor.category.name}</Badge>
                {vendor.isFeatured && (
                  <Badge variant="default">Featured</Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={isFavorited ? "default" : "outline"}
                size="sm"
                onClick={toggleFavorite}
                disabled={favLoading}
              >
                <Heart
                  className={`h-4 w-4 mr-1.5 ${isFavorited ? "fill-current" : ""}`}
                />
                {isFavorited ? "Favorited" : "Favorite"}
              </Button>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold text-foreground">
                {vendor.avgRating > 0 ? vendor.avgRating.toFixed(1) : "New"}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {vendor.totalRatings}{" "}
              {vendor.totalRatings === 1 ? "review" : "reviews"}
            </span>
            <span className="text-xs text-muted-foreground">
              {vendor.totalBookings} bookings
            </span>
          </div>

          {vendor.description && (
            <p className="text-sm text-muted-foreground mt-3 line-clamp-3">
              {vendor.description}
            </p>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <Card>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{vendor.address}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{vendor.phone}</span>
            </div>
            {vendor.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">{vendor.email}</span>
              </div>
            )}
            {vendor.website && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-4 w-4 shrink-0" />
                <a
                  href={vendor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate hover:text-foreground transition-colors"
                >
                  {vendor.website}
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Services</h2>
        {services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services
              .filter((s) => s.active)
              .map((service) => (
                <Card
                  key={service.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  {service.imageUrl && (
                    <div className="h-36 bg-muted overflow-hidden">
                      <img
                        src={service.imageUrl}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className={service.imageUrl ? "pt-4" : "pt-5"}>
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {service.name}
                    </h3>
                    {service.shortDescription && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {service.shortDescription}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <span className="text-sm font-bold text-foreground">
                          {formatCurrency(
                            service.discountPrice != null &&
                              service.discountPrice < service.price
                              ? service.discountPrice
                              : service.price
                          )}
                        </span>
                        {service.priceUnit && (
                          <span className="text-[10px] text-muted-foreground">
                            /{service.priceUnit}
                          </span>
                        )}
                      </div>
                      {service.duration != null && (
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {service.duration}
                          {service.durationUnit
                            ? ` ${service.durationUnit}`
                            : " min"}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="w-full mt-3"
                      onClick={() =>
                        navigate(
                          `/marketplace/vendor/${vendor.id}/book/${service.id}`
                        )
                      }
                    >
                      <Calendar className="h-3.5 w-3.5 mr-1.5" />
                      Book Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No services available yet
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reviews */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Reviews</h2>
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-5">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {review.customer.profilePicUrl ? (
                        <img
                          src={review.customer.profilePicUrl}
                          alt={review.customer.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-semibold text-muted-foreground">
                          {review.customer.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">
                          {review.customer.fullName}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>

                      {review.title && (
                        <p className="text-sm font-medium text-foreground mt-2">
                          {review.title}
                        </p>
                      )}
                      {review.comment && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {review.comment}
                        </p>
                      )}

                      {/* Vendor Reply */}
                      {review.reply && (
                        <div className="mt-3 pl-3 border-l-2 border-muted">
                          <p className="text-xs font-medium text-foreground">
                            Vendor Reply
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {review.reply}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No reviews yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
