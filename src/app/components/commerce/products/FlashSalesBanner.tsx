import React, { useEffect, useState } from "react";
import {
  commerceFlashSaleService,
  type CommerceFlashSaleDto,
} from "../../../../services/commerce/commerceFlashSaleService";

function Countdown({ endsAt }: { endsAt: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining("Ended"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return <span className="font-mono font-bold text-red-600">{remaining}</span>;
}

function SaleCard({ sale }: { sale: CommerceFlashSaleDto }) {
  return (
    <div className="rounded-2xl border-2 border-red-100 bg-gradient-to-br from-red-50 to-orange-50 p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="inline-flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-1">
            🔥 FLASH SALE
          </span>
          <h3 className="text-base font-bold text-gray-800">{sale.title}</h3>
          {sale.description && <p className="text-xs text-gray-500 mt-0.5">{sale.description}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-gray-500">Ends in</p>
          <Countdown endsAt={sale.endsAt} />
        </div>
      </div>

      {sale.items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {sale.items.map((item) => {
            const saved = item.originalPrice - item.flashPrice;
            const pct = Math.round((saved / item.originalPrice) * 100);
            return (
              <div key={item.id}
                className="rounded-xl bg-white border border-red-100 p-3 flex flex-col gap-1.5 hover:shadow-md transition-shadow">
                {item.thumbnailUrl && (
                  <img src={item.thumbnailUrl} alt={item.productTitle}
                    className="w-full h-24 object-cover rounded-lg" />
                )}
                <p className="text-xs font-semibold text-gray-700 line-clamp-2">{item.productTitle}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-red-600">
                    ₹{Number(item.flashPrice).toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-gray-400 line-through">
                    ₹{Number(item.originalPrice).toLocaleString("en-IN")}
                  </span>
                </div>
                <span className="inline-flex self-start px-1.5 py-0.5 rounded bg-red-100 text-red-600 text-xs font-semibold">
                  {pct}% OFF
                </span>
                {item.quantityLimit != null && (
                  <p className="text-xs text-gray-400">
                    {item.quantityLimit - item.quantitySold} left
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function FlashSalesBanner() {
  const [sales, setSales] = useState<CommerceFlashSaleDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    commerceFlashSaleService.getActive()
      .then(setSales)
      .catch(() => setSales([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || sales.length === 0) return null;

  return (
    <div className="space-y-4">
      {sales.map((sale) => <SaleCard key={sale.id} sale={sale} />)}
    </div>
  );
}
