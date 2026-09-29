import { useState, useEffect } from "react";
import { Package, Plus, CheckCircle2, Star, Clock } from "lucide-react";
import type { ServicePackage, ServiceCategory } from "../../../types/homeServices";
import { homeServiceApi } from "../../../services/homeServices/homeServiceApi";

export function WorkerPackagesView() {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);

  useEffect(() => {
    homeServiceApi.getAllPackages().then(setPackages);
    homeServiceApi.getCategories().then(setCategories);
  }, []);

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            Predefined Service Packages
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent, all-inclusive bundles for recurring home cleaning, cooking and maintenance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase">
                  {pkg.frequency}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {pkg.pricingModel}
                </span>
              </div>

              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {pkg.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {pkg.description}
              </p>

              <div className="mt-4 space-y-1.5 text-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Included Tasks
                </span>
                {pkg.includedTasks.map((t) => (
                  <div key={t} className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Price</span>
                <div className="text-lg font-black text-slate-900 dark:text-white">
                  ₹{pkg.price.toLocaleString("en-IN")}
                  <span className="text-xs font-normal text-slate-400">
                    {pkg.pricingModel === "FIXED_MONTHLY" ? "/mo" : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
