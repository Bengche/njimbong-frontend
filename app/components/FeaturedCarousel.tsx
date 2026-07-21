"use client";
import { useRef, useCallback } from "react";
import Link from "next/link";

interface Listing {
  id: number;
  title: string;
  description?: string;
  price: number | string;
  currency: string;
  imageurl?: string;
  city?: string;
  country?: string;
  condition?: string;
  status?: string;
}

interface Props {
  listings: Listing[];
}

export default function FeaturedCarousel({ listings }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector("[data-card]") as HTMLElement | null;
    const step = (card?.offsetWidth ?? 280) + 16;
    el.scrollBy({
      left: direction === "right" ? step : -step,
      behavior: "smooth",
    });
  }, []);

  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
        <p className="text-gray-400 text-sm">
          No listings available right now. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="relative group/carousel">
      {/* Left arrow */}
      <button
        onClick={() => scroll("left")}
        aria-label="Scroll left"
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10
                   hidden md:flex items-center justify-center
                   w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100
                   text-gray-500 hover:text-emerald-700 hover:border-emerald-200
                   transition-all opacity-0 group-hover/carousel:opacity-100 hover:scale-110"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {/* Right arrow */}
      <button
        onClick={() => scroll("right")}
        aria-label="Scroll right"
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10
                   hidden md:flex items-center justify-center
                   w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100
                   text-gray-500 hover:text-emerald-700 hover:border-emerald-200
                   transition-all opacity-0 group-hover/carousel:opacity-100 hover:scale-110"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Scroll track */}
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-3
                   [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {listings.map((listing) => (
          <Link
            key={listing.id}
            href={`/listing/${listing.id}`}
            data-card
            className="group/card snap-start flex-none w-40 sm:w-48
                       bg-white rounded-xl border border-gray-100
                       hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
          >
            {/* Image */}
            <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
              {listing.imageurl ? (
                <img
                  src={listing.imageurl}
                  alt={listing.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover/card:scale-[1.04]"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-200">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
              {/* Condition badge */}
              {listing.condition && (
                <span className="absolute top-1.5 left-1.5 rounded-full bg-black/50 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-medium text-white capitalize leading-none">
                  {listing.condition}
                </span>
              )}
              {/* Escrow badge */}
              {listing.currency === "XAF" && listing.status !== "Sold" && (
                <span className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 rounded-full bg-emerald-600/85 px-1.5 py-0.5 text-[9px] font-semibold text-white pointer-events-none leading-none">
                  <svg
                    className="w-2.5 h-2.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  Escrow
                </span>
              )}
            </div>
            {/* Content */}
            <div className="p-2">
              <h3 className="text-[11px] font-semibold text-gray-900 line-clamp-2 leading-tight">
                {listing.title}
              </h3>
              <p className="text-xs font-bold text-emerald-700 mt-1 leading-none">
                {listing.currency}{" "}
                {Number(listing.price).toLocaleString("en-US")}
              </p>
              {listing.city && (
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                  {listing.city}
                </p>
              )}
            </div>
          </Link>
        ))}

        {/* Terminal "See All" card */}
        <Link
          href="/browse"
          className="snap-start flex-none w-48 sm:w-52
                     flex flex-col items-center justify-center gap-3
                     bg-gradient-to-br from-emerald-50 to-emerald-100
                     rounded-2xl border-2 border-dashed border-emerald-200
                     hover:border-emerald-400 hover:shadow-md hover:-translate-y-1
                     transition-all duration-200 px-6 py-8 text-center"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center shadow-md">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </div>
          <div>
            <p className="font-bold text-emerald-800 text-sm">Browse All</p>
            <p className="text-xs text-emerald-600 mt-1 leading-relaxed">
              Explore every listing
            </p>
          </div>
        </Link>
      </div>

      {/* Swipe hint — mobile only, shown for a moment */}
      <p className="text-center text-xs text-gray-400 mt-1 md:hidden select-none">
        Swipe to explore more listings
      </p>
    </div>
  );
}
