import { useState, useEffect, useCallback } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Search, ArrowLeft, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useAuth } from "../../../contexts/AuthContext";
import { CREATE_SERVICE_REQUEST } from "../../../constants/permissions";
import { serviceCatalogService, serviceSearchService } from "../../../services/servicePlatformService";
import { ServiceRequestDialog } from "./ServiceRequestDialog";
import type {
  ServiceDomainResponse,
  ServiceCategoryResponse,
  ServiceSearchResult,
} from "../../../types/api";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PRICING_LABELS: Record<string, string> = {
  FLAT: "flat",
  HOURLY: "/hr",
  PER_UNIT: "/unit",
  CUSTOM: "custom",
};

export function ServiceBrowse() {
  const { hasPermission } = useAuth();
  const canRequest = hasPermission(CREATE_SERVICE_REQUEST);

  const [domains, setDomains] = useState<ServiceDomainResponse[]>([]);
  const [categories, setCategories] = useState<ServiceCategoryResponse[]>([]);
  const [offerings, setOfferings] = useState<ServiceSearchResult[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<ServiceDomainResponse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategoryResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Request dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogCategoryId, setDialogCategoryId] = useState(0);
  const [dialogCategoryName, setDialogCategoryName] = useState("");

  useEffect(() => {
    setLoading(true);
    serviceCatalogService
      .listDomains()
      .then(setDomains)
      .catch(() => toast.error("Failed to load service domains"))
      .finally(() => setLoading(false));
  }, []);

  const loadCategories = useCallback(async (domain: ServiceDomainResponse) => {
    setSelectedDomain(domain);
    setSelectedCategory(null);
    setOfferings([]);
    setLoading(true);
    try {
      const cats = await serviceCatalogService.listCategories(domain.id);
      setCategories(cats);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOfferings = useCallback(
    async (category: ServiceCategoryResponse, p = 0) => {
      setSelectedCategory(category);
      setPage(p);
      setLoading(true);
      try {
        const result = await serviceSearchService.search({ categoryId: category.id, page: p });
        setOfferings(result.content);
        setTotalPages(result.totalPages);
      } catch {
        toast.error("Failed to load offerings");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await serviceSearchService.search({
          q: searchQuery,
          domainId: selectedDomain?.id,
          page: 0,
        });
        setOfferings(result.content);
        setTotalPages(result.totalPages);
        setSelectedCategory(null);
      } catch {
        toast.error("Search failed");
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedDomain?.id]);

  const openRequestDialog = (categoryId: number, categoryName: string) => {
    setDialogCategoryId(categoryId);
    setDialogCategoryName(categoryName);
    setDialogOpen(true);
  };

  const goBack = () => {
    if (selectedCategory) {
      setSelectedCategory(null);
      setOfferings([]);
    } else if (selectedDomain) {
      setSelectedDomain(null);
      setCategories([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 sm:p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black mb-2">Community Services</h1>
          <p className="text-emerald-100 text-sm mb-4">
            Find trusted service providers in your community
          </p>
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/95 text-slate-900 border-0 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Breadcrumb / Back */}
      {(selectedDomain || selectedCategory) && (
        <button
          onClick={goBack}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {selectedCategory ? selectedDomain?.name : "all domains"}
        </button>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Domain Cards */}
      {!loading && !selectedDomain && !searchQuery && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {domains.map((domain) => (
            <button
              key={domain.id}
              onClick={() => loadCategories(domain)}
              className="group p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1E36] hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-3 text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                {domain.name.charAt(0)}
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {domain.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{domain.description}</p>
            </button>
          ))}
          {domains.length === 0 && (
            <p className="col-span-full text-center text-slate-400 py-8">No service domains available</p>
          )}
        </div>
      )}

      {/* Category Cards */}
      {!loading && selectedDomain && !selectedCategory && !searchQuery && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
            {selectedDomain.name} — Categories
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => loadOfferings(cat)}
                className="group p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1E36] hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all text-left"
              >
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cat.description}</p>
              </button>
            ))}
            {categories.length === 0 && (
              <p className="col-span-full text-center text-slate-400 py-8">No categories in this domain</p>
            )}
          </div>
        </div>
      )}

      {/* Offerings List */}
      {!loading && (selectedCategory || searchQuery) && (
        <div>
          {selectedCategory && (
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
              {selectedCategory.name} — Available Providers
            </h2>
          )}
          {searchQuery && !selectedCategory && (
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
              Search Results for &ldquo;{searchQuery}&rdquo;
            </h2>
          )}
          <div className="space-y-3">
            {offerings.map((offering) => (
              <div
                key={offering.offeringId}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1E36]"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {offering.providerName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{offering.offeringDescription}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="secondary" className="text-xs">
                      {offering.categoryName}
                    </Badge>
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <DollarSign className="w-3 h-3" />
                      {offering.basePrice} {PRICING_LABELS[offering.pricingUnit] ?? offering.pricingUnit}
                    </span>
                  </div>
                </div>
                {canRequest && (
                  <Button
                    size="sm"
                    className="ml-4 flex-shrink-0"
                    onClick={() =>
                      openRequestDialog(
                        offering.categoryId,
                        offering.categoryName
                      )
                    }
                  >
                    Request
                  </Button>
                )}
              </div>
            ))}
            {offerings.length === 0 && (
              <p className="text-center text-slate-400 py-8">No offerings found</p>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => selectedCategory && loadOfferings(selectedCategory, page - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center text-xs text-slate-500">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => selectedCategory && loadOfferings(selectedCategory, page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Request Dialog */}
      <ServiceRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categoryId={dialogCategoryId}
        categoryName={dialogCategoryName}
        onSuccess={() => {
          if (selectedCategory) loadOfferings(selectedCategory, page);
        }}
      />
    </div>
  );
}
