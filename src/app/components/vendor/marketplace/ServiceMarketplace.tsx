import { useState, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  Star,
  Clock,
  Loader2,
  AlertCircle,
  Store,
  ArrowUpDown,
} from "lucide-react";
import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import {
  vendorServiceCatalog,
  vendorCategoryService,
} from "../../../../services/vendorService";
import { showError } from "../../../../utils/ToastUtils";
import type {
  VendorServiceResponse,
  VendorCategoryResponse,
} from "../../../../types/api";
import { useNavigate } from "react-router";

const SORT_OPTIONS = [
  { value: "rating", label: "Top Rated" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Popular" },
] as const;

function ServiceCardSkeleton() {
  return (
    <Card className="animate-pulse overflow-hidden">
      <div className="h-40 bg-muted" />
      <CardContent className="pt-4 space-y-2">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="flex justify-between mt-3">
          <div className="h-5 w-16 rounded bg-muted" />
          <div className="h-5 w-12 rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ServiceMarketplace() {
  const [services, setServices] = useState<VendorServiceResponse[]>([]);
  const [categories, setCategories] = useState<VendorCategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(
    undefined
  );
  const [sortBy, setSortBy] = useState("rating");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [search, selectedCategory, sortBy]);

  useEffect(() => {
    loadServices();
  }, [search, selectedCategory, sortBy, page]);

  async function loadCategories() {
    try {
      const data = await vendorCategoryService.getCategories();
      setCategories(data);
    } catch {
      // Categories are optional for browsing
    }
  }

  async function loadServices() {
    setLoading(true);
    try {
      const result = await vendorServiceCatalog.browseServices(
        selectedCategory,
        search || undefined,
        sortBy,
        page,
        12
      );
      setServices(result.content);
      setTotalPages(result.totalPages);
    } catch {
      showError("Failed to load services");
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">
          Service Marketplace
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse and book services from verified vendors
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category filter */}
        <div className="relative">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <select
            value={selectedCategory ?? ""}
            onChange={(e) =>
              setSelectedCategory(
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            className="h-9 rounded-md border border-input bg-background pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 rounded-md border border-input bg-background pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedCategory === undefined ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(undefined)}
          >
            All
          </Badge>
          {categories.map((cat) => (
            <Badge
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === cat.id ? undefined : cat.id
                )
              }
            >
              {cat.icon && <span className="mr-1">{cat.icon}</span>}
              {cat.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && services.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Store className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium text-muted-foreground">
            No services found
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search or filters
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              setSearch("");
              setSelectedCategory(undefined);
              setSortBy("rating");
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Service Grid */}
      {!loading && services.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Card
              key={service.id}
              className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => navigate(`/marketplace/vendor/${service.vendorId}`)}
            >
              {/* Image */}
              <div className="h-40 bg-muted relative overflow-hidden">
                {service.imageUrl ? (
                  <img
                    src={service.imageUrl}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Store className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                )}
                {service.featured && (
                  <Badge className="absolute top-2 left-2" variant="default">
                    Featured
                  </Badge>
                )}
                {service.discountPrice != null &&
                  service.discountPrice < service.price && (
                    <Badge
                      className="absolute top-2 right-2 bg-red-500 text-white"
                      variant="default"
                    >
                      {Math.round(
                        ((service.price - service.discountPrice) /
                          service.price) *
                          100
                      )}
                      % OFF
                    </Badge>
                  )}
              </div>

              <CardContent className="pt-4">
                <h3 className="text-sm font-semibold text-foreground truncate">
                  {service.name}
                </h3>
                {service.vendorName && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    by {service.vendorName}
                  </p>
                )}
                {service.categoryName && (
                  <Badge variant="outline" className="mt-2 text-[10px]">
                    {service.categoryName}
                  </Badge>
                )}

                <div className="flex items-center justify-between mt-3">
                  <div>
                    {service.discountPrice != null &&
                    service.discountPrice < service.price ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-foreground">
                          {formatCurrency(service.discountPrice)}
                        </span>
                        <span className="text-xs text-muted-foreground line-through">
                          {formatCurrency(service.price)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-foreground">
                        {formatCurrency(service.price)}
                      </span>
                    )}
                    {service.priceUnit && (
                      <span className="text-[10px] text-muted-foreground">
                        /{service.priceUnit}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {service.duration != null && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {service.duration}
                        {service.durationUnit
                          ? ` ${service.durationUnit}`
                          : " min"}
                      </span>
                    )}
                    <span className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {service.avgRating > 0
                        ? service.avgRating.toFixed(1)
                        : "New"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
