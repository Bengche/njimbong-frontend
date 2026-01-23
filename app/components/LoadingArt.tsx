import React from "react";

type LoadingArtProps = {
  label?: string;
  subLabel?: string;
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizeClasses: Record<NonNullable<LoadingArtProps["size"]>, string> = {
  sm: "h-20 w-20",
  md: "h-28 w-28",
  lg: "h-36 w-36",
};

export default function LoadingArt({
  label = "Loading...",
  subLabel,
  fullScreen = false,
  size = "lg",
}: LoadingArtProps) {
  const wrapperClasses = fullScreen
    ? "min-h-screen w-full flex items-center justify-center px-6"
    : "w-full flex items-center justify-center px-4 py-6";

  return (
    <div className={wrapperClasses} role="status" aria-live="polite">
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className={`relative ${sizeClasses[size]}`}>
            <div className="absolute -inset-4 rounded-full bg-emerald-200/40 blur-2xl loading-glow" />
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_140deg,rgba(22,163,74,0.1),rgba(22,163,74,0.75),rgba(234,179,8,0.55),rgba(22,163,74,0.1))] loading-orbit shadow-[0_0_45px_rgba(22,163,74,0.35)]" />
            <div className="absolute inset-[6px] rounded-full bg-white" />
            <div className="absolute inset-[14px] rounded-full bg-gradient-to-br from-emerald-50 via-white to-yellow-50 ring-1 ring-emerald-200/60" />
            <div className="absolute inset-[26px] rounded-full bg-white/95 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-emerald-500/90 shadow-[0_0_18px_rgba(22,163,74,0.55)] loading-breathe" />
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="text-base font-semibold text-emerald-800">{label}</div>
          {subLabel && (
            <div className="mt-1 text-sm text-emerald-700/80">{subLabel}</div>
          )}
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="loading-dot h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="loading-dot loading-dot-delay-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="loading-dot loading-dot-delay-2 h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </div>
        </div>

        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}
