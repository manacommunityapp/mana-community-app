import { toast } from "sonner";

export function ManaFreshPage() {
  function handleNotify() {
    toast.success("You're on the list!", {
      description: "We'll notify you when Mana Fresh launches in your community.",
    });
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16 sm:py-24 flex flex-col items-center text-center">
      {/* Icon */}
      <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-[#00D09C] to-[#00A87E] flex items-center justify-center text-4xl shadow-lg shadow-[#00D09C]/25 mb-6">
        🥬
      </div>

      {/* Heading */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#44475B] leading-tight mb-3">
        Mana Fresh — Coming Soon
      </h1>

      {/* Description */}
      <p className="text-sm text-[#7C7E8C] leading-relaxed mb-8 max-w-sm">
        Fresh groceries and hyperlocal delivery for your community. Farm-fresh produce, daily essentials,
        and curated health foods — delivered straight to your door within hours.
      </p>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-10">
        {[
          { icon: '🌿', label: 'Farm Fresh', desc: 'Sourced daily from local farms' },
          { icon: '⚡', label: 'Hyperlocal', desc: 'Delivered within your community' },
          { icon: '📦', label: 'Subscriptions', desc: 'Daily & weekly delivery plans' },
        ].map((f) => (
          <div key={f.label} className="p-3.5 rounded-2xl bg-[#F9FAFC] border border-[#EBEFF2] text-center">
            <div className="text-2xl mb-1.5">{f.icon}</div>
            <p className="text-xs font-bold text-[#44475B]">{f.label}</p>
            <p className="text-[11px] text-[#7C7E8C] mt-0.5">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={handleNotify}
        className="px-8 py-3 rounded-2xl bg-[#00D09C] hover:bg-[#00B887] text-white font-bold text-sm shadow-md shadow-[#00D09C]/25 hover:shadow-lg hover:shadow-[#00D09C]/30 transition-all active:scale-95 cursor-pointer"
      >
        Notify me when it launches
      </button>

      <p className="text-[11px] text-[#9CA3AF] mt-4">
        No spam. We'll only reach out when Mana Fresh is live.
      </p>
    </div>
  );
}
