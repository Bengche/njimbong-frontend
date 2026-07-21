"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://njimbong-backend-production.up.railway.app";

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
  createdat?: string;
}

export default function BrowsePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    try {
      const res = await fetch(
        `${API_BASE}/home/listings/browse?page=${pageNum}&limit=10`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("Failed to load listings.");
      const data = await res.json();
      setListings((prev) =>
        append ? [...prev, ...data.listings] : data.listings,
      );
      setTotal(data.total);
      setHasMore(data.hasMore);
    } catch {
      setError("Could not load listings. Please try again.");
    }
  }, []);

  useEffect(() => {
    fetchPage(1, false).finally(() => setLoading(false));
  }, [fetchPage]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = page + 1;
    await fetchPage(next, true);
    setPage(next);
    setLoadingMore(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-yellow-50 to-white">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-emerald-700 transition-colors"
          >
            <svg
              className="w-4 h-4"
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
            Home
          </Link>
          <span className="text-gray-300 text-lg">/</span>
          <h1 className="font-bold text-gray-900 text-sm sm:text-base">
            All Listings
          </h1>
          {total !== null && (
            <span className="ml-auto text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-3 py-1">
              {total.toLocaleString()} listing{total !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Browse Listings
          </h2>
          <p className="mt-1.5 text-sm text-gray-500">
            All approved listings from sellers across Cameroon, newest first.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-5 py-4 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Skeleton loader */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl bg-white border border-gray-100 overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-gray-100" />
                <div className="p-2 space-y-1.5">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Listings grid */}
        {!loading && listings.length === 0 && !error && (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-24 text-center">
            <svg
              className="w-12 h-12 text-gray-200 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-gray-500">No listings available right now.</p>
            <p className="text-sm text-gray-400 mt-1">
              Check back soon — new items are added daily.
            </p>
          </div>
        )}

        {!loading && listings.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            {/* Load More */}
            <div className="mt-10 flex flex-col items-center gap-3">
              {hasMore ? (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3
                             text-sm font-semibold text-white shadow-md
                             hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      Loading…
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                      Load more listings
                    </>
                  )}
                </button>
              ) : (
                <p className="text-sm text-gray-400">
                  You&apos;ve seen all {total?.toLocaleString()} listing
                  {total !== 1 ? "s" : ""}.
                </p>
              )}
              <p className="text-xs text-gray-400">
                Showing {listings.length} of {total ?? "…"} total listings
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  const isAvailable = !listing.status || listing.status !== "Sold";

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group block bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {listing.imageurl ? (
          <img
            src={listing.imageurl}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
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
        {/* Sold overlay */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
            <span className="bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
              Sold
            </span>
          </div>
        )}
        {/* Escrow pill */}
        {listing.currency === "XAF" && isAvailable && (
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
        <h3 className="text-[11px] sm:text-xs font-semibold text-gray-900 line-clamp-2 leading-tight">
          {listing.title}
        </h3>
        <p className="text-xs sm:text-sm font-bold text-emerald-700 mt-1 leading-none">
          {listing.currency} {Number(listing.price).toLocaleString("en-US")}
        </p>
        {listing.city && (
          <p className="text-[10px] text-gray-400 mt-0.5 truncate">
            {listing.city}
            {listing.country ? `, ${listing.country}` : ""}
          </p>
        )}
      </div>
    </Link>
  );
}
