import React from "react";

interface SkeletonProps {
  type?: "stat" | "feed";
  className?: string;
}

export function SkeletonCard({ type = "feed", className = "" }: SkeletonProps) {
  if (type === "stat") {
    return (
      <div
        className={`h-[72px] w-full rounded-xl p-4 border border-[#E2E8F0] flex flex-col justify-between ${className}`}
        style={{ backgroundColor: "#F1F5F9" }}
      >
        <div className="h-3 w-1/2 bg-slate-300/70 rounded-sm" />
        <div className="h-5 w-3/4 bg-slate-300/80 rounded-sm" />
      </div>
    );
  }

  return (
    <div
      className={`min-h-[96px] w-full rounded-xl p-4 border border-[#E2E8F0] flex gap-3 ${className}`}
      style={{ backgroundColor: "#F1F5F9" }}
    >
      <div className="w-10 h-10 rounded-full bg-slate-300/80 shrink-0" />
      <div className="flex-1 space-y-2.5">
        <div className="h-3.5 w-1/3 bg-slate-300/80 rounded-sm" />
        <div className="h-3 w-full bg-slate-300/60 rounded-sm" />
        <div className="h-3 w-4/5 bg-slate-300/60 rounded-sm" />
      </div>
    </div>
  );
}
