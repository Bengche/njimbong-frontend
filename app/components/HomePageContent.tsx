"use client";

import { useState, useCallback, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ── Types ─────────────────────────────────────────────────────────────── */
interface Listing {
  id: number;
  title: string;
  price: number | string;
  currency: string;
  imageurl?: string;
  image_url?: string;
  city?: string;
  country?: string;
  condition?: string;
  status?: string;
}

interface Props {
  listings: Listing[];
}

/* ── Category config ────────────────────────────────────────────────────── */
const CATEGORIES = [
  { emoji: "📱", label: "Phones" },
  { emoji: "💻", label: "Electronics" },
  { emoji: "👗", label: "Fashion" },
  { emoji: "🚗", label: "Vehicles" },
  { emoji: "🏠", label: "Home & Living" },
  { emoji: "🛋️", label: "Furniture" },
  { emoji: "🌾", label: "Agriculture" },
  { emoji: "💼", label: "Services" },
  { emoji: "🏗️", label: "Real Estate" },
  { emoji: "📚", label: "Books" },
  { emoji: "🎮", label: "Gaming" },
  { emoji: "🛒", label: "Local Deals" },
];

/* ── Listing card ───────────────────────────────────────────────────────── */
function ListingCard({ listing }: { listing: Listing }) {
  const img = listing.imageurl || listing.image_url;
  const rawPrice =
    typeof listing.price === "string"
      ? parseFloat(listing.price)
      : listing.price;
  const displayPrice = isNaN(rawPrice)
    ? String(listing.price)
    : Number(rawPrice).toLocaleString();
  const isNew = listing.condition?.toLowerCase() === "new";

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-gray-100/80 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-900/10 hover:-translate-y-1 transition-all duration-200 ease-out"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
        {img ? (
          <img
            src={img}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-300 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50">
            <svg
              className="w-10 h-10 text-gray-200"
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
          <span
            className={`absolute top-2 left-2 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm tracking-wide ${
              isNew
                ? "bg-emerald-500 text-white"
                : "bg-black/55 text-white backdrop-blur-sm"
            }`}
          >
            {listing.condition.toUpperCase()}
          </span>
        )}

        {/* Hover shimmer */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>

      {/* Details */}
      <div className="p-3 sm:p-3.5">
        <p className="font-black text-gray-900 text-[15px] leading-none tabular-nums">
          {displayPrice}
          <span className="text-[10px] font-bold text-emerald-600 ml-1 tracking-wide">
            {listing.currency}
          </span>
        </p>
        <p className="text-[12px] sm:text-[13px] text-gray-500 mt-1.5 line-clamp-2 leading-snug font-medium">
          {listing.title}
        </p>
        {listing.city && (
          <p className="mt-2 text-[10px] sm:text-[11px] text-gray-400 flex items-center gap-1">
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
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="truncate">{listing.city}</span>
          </p>
        )}
      </div>
    </Link>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */
export default function HomePageContent({ listings }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [searchCategory, setSearchCategory] = useState("");

  const handleSearch = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (searchCategory) params.set("category", searchCategory);
      router.push(`/browse?${params.toString()}`);
    },
    [search, searchCategory, router],
  );

  const activeListings = listings.filter(
    (l) => !l.status || l.status.toLowerCase() !== "sold",
  );

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* HERO                                                            */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <section className="bg-[#050e09]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">

          <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-[0.18em] mb-7">
            Cameroon&apos;s marketplace
          </p>

          <h1 className="text-[38px] sm:text-5xl md:text-[58px] font-bold text-white leading-[1.1] tracking-tight max-w-2xl">
            Find anything.<br />
            Buy it safely.
          </h1>

          <p className="mt-5 text-[15px] text-gray-400 max-w-lg leading-relaxed">
            Thousands of verified listings across Cameroon. Escrow-protected
            payments and KYC-verified sellers on every transaction.
          </p>

          {/* Search form */}
          <form onSubmit={handleSearch} className="mt-8 max-w-xl">
            <div className="flex rounded-lg overflow-hidden border border-white/10 bg-white">
              <select
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="hidden sm:block px-4 py-0 text-[13px] text-gray-500 bg-white border-r border-gray-200 focus:outline-none cursor-pointer w-36 flex-shrink-0"
                aria-label="Select category"
              >
                <option value="">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.label} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search phones, cars, fashion..."
                className="flex-1 px-4 py-3.5 text-gray-900 text-sm focus:outline-none placeholder:text-gray-400 min-w-0 bg-white"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <button
                type="submit"
                className="px-5 sm:px-6 bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors flex items-center gap-2 flex-shrink-0"
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
                    d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                  />
                </svg>
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </form>

          {/* Category text links */}
          <div className="mt-5 flex flex-wrap items-center text-[12px]">
            {["Phones", "Laptops", "Cars", "Fashion", "Services", "Furniture"].map(
              (cat, i) => (
                <span key={cat} className="flex items-center">
                  {i > 0 && (
                    <span className="text-gray-700 px-2 select-none">·</span>
                  )}
                  <Link
                    href={`/browse?category=${encodeURIComponent(cat)}`}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    {cat}
                  </Link>
                </span>
              ),
            )}
            <span className="text-gray-700 px-2 select-none">·</span>
            <Link
              href="/browse"
              className="text-emerald-600 hover:text-emerald-400 transition-colors"
            >
              All categories
            </Link>
          </div>

          {/* Trust line */}
          <p className="mt-7 text-[11px] text-gray-600">
            Escrow protected&nbsp;·&nbsp;KYC-verified sellers&nbsp;·&nbsp;Dispute resolution&nbsp;·&nbsp;Free to list
          </p>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* CATEGORY BAR                                                    */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <nav
        className="bg-white border-b border-gray-100 shadow-sm"
        aria-label="Browse by category"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex gap-0.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1">
            <Link
              href="/browse"
              className="flex flex-col items-center gap-1 flex-none px-3.5 py-2.5 rounded-xl hover:bg-emerald-50 active:bg-emerald-100 transition-colors group"
            >
              <span className="text-xl leading-none" role="img" aria-label="All">🏪</span>
              <span className="text-[10px] font-semibold text-gray-500 group-hover:text-emerald-700 whitespace-nowrap">All</span>
            </Link>
            {CATEGORIES.map((c) => (
              <Link
                key={c.label}
                href={`/browse?category=${encodeURIComponent(c.label)}`}
                className="flex flex-col items-center gap-1 flex-none px-3.5 py-2.5 rounded-xl hover:bg-emerald-50 active:bg-emerald-100 transition-colors group"
              >
                <span className="text-xl leading-none" role="img" aria-label={c.label}>{c.emoji}</span>
                <span className="text-[10px] font-semibold text-gray-500 group-hover:text-emerald-700 whitespace-nowrap">{c.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* LISTINGS GRID                                                   */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">
              Fresh Listings
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {activeListings.length > 0
                ? `${activeListings.length} items available right now`
                : "New items added daily"}
            </p>
          </div>
          <Link
            href="/browse"
            className="flex items-center gap-1 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors group"
          >
            View all
            <svg
              className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {activeListings.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-gray-200 py-24 text-center bg-white">
            <p className="text-4xl mb-3">🛍️</p>
            <p className="text-gray-500 font-semibold">No listings yet</p>
            <p className="text-xs text-gray-400 mt-1">Be the first to list something!</p>
            <Link
              href="/signup"
              className="inline-flex mt-5 items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
            >
              Start Selling Free
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {activeListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link
                href="/browse"
                className="inline-flex items-center gap-2.5 rounded-2xl border-2 border-gray-200 bg-white px-8 py-3.5 text-sm font-bold text-gray-700 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all shadow-sm hover:shadow-md"
              >
                Browse all listings
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* SELL CTA BANNER                                                 */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <section className="bg-emerald-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-16 flex flex-col sm:flex-row sm:items-center justify-between gap-10">
          <div>
            <p className="text-[11px] font-semibold text-emerald-500 uppercase tracking-[0.18em] mb-4">
              For sellers
            </p>
            <h2 className="text-2xl sm:text-[30px] font-bold text-white leading-tight">
              Sell to buyers across Cameroon.
            </h2>
            <p className="mt-3 text-sm text-white/50 max-w-sm leading-relaxed">
              Free to list. Secure escrow payments via MTN MoMo and Orange
              Money. Your item, live in minutes.
            </p>
          </div>
          <div className="flex flex-col gap-3 flex-shrink-0">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-white text-emerald-900 font-semibold px-7 py-3 text-sm hover:bg-emerald-50 transition-colors whitespace-nowrap"
            >
              Create an account
            </Link>
            <Link
              href="/about"
              className="text-center text-[13px] text-white/40 hover:text-white/75 transition-colors"
            >
              How it works &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* TRUST STRIP                                                     */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <section className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-7">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-6">
            {[
              { emoji: "🔒", label: "Escrow Protection", sub: "Funds held safely until delivery confirmed" },
              { emoji: "✅", label: "KYC Verified Sellers", sub: "ID-checked accounts for your safety" },
              { emoji: "🛡️", label: "Dispute Resolution", sub: "Fonlok mediates and resolves every case" },
              { emoji: "💬", label: "Real-time Chat", sub: "Message sellers directly, no middleman" },
            ].map((b) => (
              <div key={b.label} className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0 leading-none mt-0.5">{b.emoji}</span>
                <div>
                  <p className="text-xs font-bold text-gray-800 leading-tight">{b.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t border-gray-50 text-center">
            <Link
              href="/about"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
            >
              Learn how Njimbong keeps you safe →
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
