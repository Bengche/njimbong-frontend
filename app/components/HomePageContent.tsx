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
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg,#050e09 0%,#0a1f13 45%,#071510 100%)",
        }}
      >
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #10b981 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Radial glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-80 opacity-25 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 100% at 50% 0%, #059669 0%, transparent 70%)",
          }}
        />

        <div className="relative max-w-4xl mx-auto px-4 pt-12 pb-16 sm:pt-16 sm:pb-20 text-center">
          {/* Country badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-4 py-1.5 text-[11px] font-bold text-emerald-400 mb-6 tracking-wide">
            🇨🇲 Cameroon&apos;s #1 Marketplace
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-[58px] font-extrabold text-white leading-[1.08] tracking-tight">
            Find anything.
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(90deg,#34d399 0%,#10b981 50%,#06b6d4 100%)",
              }}
            >
              Buy it safely.
            </span>
          </h1>

          <p className="mt-5 text-gray-400 text-sm sm:text-[15px] max-w-md mx-auto leading-relaxed">
            Thousands of verified listings across Cameroon — escrow-protected
            payments, KYC-verified sellers, zero compromise on safety.
          </p>

          {/* Search form */}
          <form onSubmit={handleSearch} className="mt-8 max-w-2xl mx-auto">
            <div className="flex rounded-2xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/5">
              {/* Category selector */}
              <select
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="hidden sm:block px-4 py-0 text-[13px] font-semibold text-gray-600 bg-white border-r border-gray-100 focus:outline-none cursor-pointer w-36 flex-shrink-0"
                aria-label="Select category"
              >
                <option value="">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.label} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </select>

              {/* Text input */}
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search phones, cars, clothes, furniture..."
                className="flex-1 px-4 py-4 sm:py-3.5 text-gray-900 bg-white text-[13px] focus:outline-none placeholder:text-gray-400 min-w-0"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />

              {/* Search button */}
              <button
                type="submit"
                className="px-5 sm:px-7 bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 active:bg-emerald-700 transition-colors flex items-center gap-2 flex-shrink-0"
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
                    strokeWidth={2.5}
                    d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                  />
                </svg>
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </form>

          {/* Quick category pills */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {["Phones", "Laptops", "Cars", "Fashion", "Services", "Furniture"].map(
              (cat) => (
                <Link
                  key={cat}
                  href={`/browse?category=${encodeURIComponent(cat)}`}
                  className="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-[11px] text-gray-500 hover:bg-white/10 hover:text-gray-200 hover:border-white/15 transition-all"
                >
                  {cat}
                </Link>
              ),
            )}
            <Link
              href="/browse"
              className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all font-semibold"
            >
              All listings →
            </Link>
          </div>

          {/* Trust micro-indicators */}
          <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2">
            {[
              "Escrow-protected payments",
              "KYC-verified sellers",
              "Full dispute protection",
              "Free to list",
            ].map((item) => (
              <span
                key={item}
                className="flex items-center gap-1.5 text-[11px] text-gray-600"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 inline-block" />
                {item}
              </span>
            ))}
          </div>
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
      <section className="px-4 sm:px-6 pb-8 max-w-7xl mx-auto">
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg,#064e3b 0%,#065f46 35%,#047857 65%,#0f766e 100%)",
          }}
        >
          {/* Dot pattern */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle, white 1.5px, transparent 1.5px)",
              backgroundSize: "22px 22px",
            }}
          />
          {/* Decorative rings */}
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-10 border-2 border-white pointer-events-none" />
          <div className="absolute -right-8 top-8 w-40 h-40 rounded-full opacity-10 border border-white pointer-events-none" />

          <div className="relative px-6 py-10 sm:px-10 sm:py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
            <div className="text-white max-w-sm">
              <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-[0.18em] mb-2">
                For Sellers
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                List your item in under{" "}
                <span className="text-emerald-300">2 minutes.</span>
              </h2>
              <p className="mt-3 text-emerald-100/75 text-sm leading-relaxed">
                Free to list. Reach thousands of buyers across Cameroon. Secure
                escrow payments via MTN MoMo and Orange Money.
              </p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                {["Free listing", "Secure escrow", "KYC badge", "AI listing help"].map((f) => (
                  <span key={f} className="flex items-center gap-1.5 text-[11px] text-emerald-200">
                    <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-row sm:flex-col gap-3 flex-shrink-0 w-full sm:w-auto">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-2xl bg-white text-emerald-800 font-extrabold px-6 py-3.5 text-sm hover:bg-emerald-50 transition-all shadow-xl hover:shadow-2xl flex-1 sm:flex-none text-center"
              >
                Start Selling — Free
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 text-white font-semibold px-6 py-3.5 text-sm hover:bg-white/10 transition-colors flex-1 sm:flex-none text-center"
              >
                How it works
              </Link>
            </div>
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
