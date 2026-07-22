"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import LoadingArt from "../components/LoadingArt";

// ============================================
// Types
// ============================================
interface FavoriteUser {
  id: number;
  favorite_user_id: number;
  notify_new_listings: boolean;
  created_at: string;
  name: string;
  profilepictureurl: string | null;
  country: string | null;
  verified: boolean;
  user_is_suspended?: boolean;
  active_listings: number;
}

interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  city: string;
  country: string;
  condition: string;
  createdat: string;
  status: string;
  is_favorite_seller: boolean;
  seller_name: string;
  seller_id: number;
  user_is_suspended?: boolean;
  images: { imageurl: string; is_main: boolean }[];
}

interface WishlistListing {
  id: number;
  title: string;
  price: number;
  currency: string;
  city: string;
  country: string;
  createdat: string;
  category_name?: string;
  seller_name?: string;
  seller_id?: number;
  seller_picture?: string | null;
  notify_price_drop: boolean;
  last_seen_price: number | null;
  price_dropped?: boolean;
  images: { imageurl: string; is_main: boolean }[];
}

// ============================================
// Helper Functions
// ============================================
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return date.toLocaleDateString();
};

// ── Shared sub-components ─────────────────────────────────────────────────────

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      <div className="w-20 h-20 rounded-2xl bg-amber-50 flex items-center justify-center mb-5 shadow-sm">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs leading-relaxed">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-amber-500/20"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

function ActionButton({
  active,
  activeClass,
  inactiveClass,
  title,
  onClick,
  icon,
}: {
  active: boolean;
  activeClass: string;
  inactiveClass: string;
  title: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-9 h-9 flex items-center justify-center rounded-xl ring-1 ring-transparent transition ${
        active ? activeClass : inactiveClass
      }`}
    >
      {icon}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function FavoritesPage() {
  const router = useRouter();

  const [favorites, setFavorites] = useState<FavoriteUser[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [wishlist, setWishlist] = useState<WishlistListing[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "listings" | "wishlist">(
    "users",
  );
  const [removingId, setRemovingId] = useState<number | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/users/me`, {
          credentials: "include",
        });
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        setAuthChecked(true);
      } catch {
        router.push("/login");
      }
    };

    checkAuth();
  }, [API_BASE, router]);

  // Get image URL
  const getImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  // Fetch favorites
  const fetchFavorites = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/favorites`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      } else if (response.status === 401) {
        router.push("/login");
      }
    } catch (err) {
      console.error("Error fetching favorites:", err);
    }
  }, [API_BASE, router]);

  // Fetch listings from favorite users
  const fetchFavoriteListings = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/favorites/listings`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setListings(data.listings || []);
      }
    } catch (err) {
      console.error("Error fetching favorite listings:", err);
    }
  }, [API_BASE]);

  const fetchWishlist = useCallback(async () => {
    try {
      setWishlistLoading(true);
      const response = await fetch(`${API_BASE}/api/wishlist`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setWishlist(data.listings || []);
      }
    } catch (err) {
      console.error("Error fetching wishlist:", err);
    } finally {
      setWishlistLoading(false);
    }
  }, [API_BASE]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchFavorites(),
        fetchFavoriteListings(),
        fetchWishlist(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchFavorites, fetchFavoriteListings, fetchWishlist]);

  useEffect(() => {
    if (activeTab === "wishlist") {
      fetchWishlist();
    }
  }, [activeTab, fetchWishlist]);

  const removeFromWishlist = async (listingId: number) => {
    try {
      await fetch(`${API_BASE}/api/wishlist/${listingId}`, {
        method: "DELETE",
        credentials: "include",
      });

      setWishlist((prev) => prev.filter((item) => item.id !== listingId));
    } catch (err) {
      console.error("Error removing wishlist item:", err);
    }
  };

  const togglePriceDropAlert = async (
    listingId: number,
    currentValue: boolean,
  ) => {
    try {
      await fetch(`${API_BASE}/api/wishlist/${listingId}/price-alert`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notify: !currentValue }),
      });

      setWishlist((prev) =>
        prev.map((item) =>
          item.id === listingId
            ? { ...item, notify_price_drop: !currentValue }
            : item,
        ),
      );
    } catch (err) {
      console.error("Error toggling price drop alert:", err);
    }
  };

  // Remove from favorites
  const removeFavorite = async (userId: number) => {
    setRemovingId(userId);
    try {
      const response = await fetch(`${API_BASE}/api/favorites/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setFavorites((prev) =>
          prev.filter((f) => f.favorite_user_id !== userId),
        );
        // Refresh listings too
        fetchFavoriteListings();
      }
    } catch (err) {
      console.error("Error removing favorite:", err);
    } finally {
      setRemovingId(null);
    }
  };

  // Toggle notifications
  const toggleNotifications = async (userId: number, currentValue: boolean) => {
    try {
      // Re-add with new notification preference
      await fetch(`${API_BASE}/api/favorites/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      await fetch(`${API_BASE}/api/favorites/${userId}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notifyNewListings: !currentValue }),
      });

      // Update local state
      setFavorites((prev) =>
        prev.map((f) =>
          f.favorite_user_id === userId
            ? { ...f, notify_new_listings: !currentValue }
            : f,
        ),
      );
    } catch (err) {
      console.error("Error toggling notifications:", err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <LoadingArt
        fullScreen
        label="Loading favorites"
        subLabel="Curating your saved items"
      />
    );
  }

  if (!authChecked) {
    return (
      <LoadingArt
        fullScreen
        label="Checking your account"
        subLabel="Securing your favorites"
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">

      {/* â”€â”€ Sticky top bar + tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white sticky top-0 z-20 shadow-[0_1px_0_0_#e5e7eb]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* Title row */}
          <div className="flex items-center gap-3 pt-4 pb-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 transition text-gray-600 flex-shrink-0"
              aria-label="Go back"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Favorites</h1>
              <p className="text-xs text-gray-400 mt-0.5 leading-none">
                {favorites.length} seller{favorites.length !== 1 ? "s" : ""}&nbsp;&middot;&nbsp;{wishlist.length} wishlisted
              </p>
            </div>
          </div>

          {/* Tab row */}
          <div className="flex overflow-x-auto gap-0 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ scrollbarWidth: "none" }}>
            {(
              [
                {
                  key: "users",
                  label: "Sellers",
                  count: favorites.length,
                  icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m7-5a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ),
                },
                {
                  key: "listings",
                  label: "Their Listings",
                  count: listings.length,
                  icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  ),
                },
                {
                  key: "wishlist",
                  label: "Wishlist",
                  count: wishlist.length,
                  icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                    </svg>
                  ),
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all duration-150 flex-shrink-0 ${
                  activeTab === tab.key
                    ? "border-amber-500 text-amber-600"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                }`}
              >
                <span className={activeTab === tab.key ? "text-amber-500" : "text-gray-400"}>{tab.icon}</span>
                {tab.label}
                <span
                  className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold transition-all ${
                    activeTab === tab.key
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* â”€â”€ Tab content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 pb-24">

        {/* â”€â”€ Favorite Sellers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {activeTab === "users" && (
          <>
            {favorites.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-9 h-9 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                }
                title="No favorite sellers yet"
                description="Browse the marketplace and follow sellers you love. You'll get notified when they post new items."
                action={{ label: "Browse Marketplace", onClick: () => router.push("/market") }}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {favorites.map((fav) => (
                  <div
                    key={fav.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <button
                          onClick={() => router.push(`/profile/${fav.favorite_user_id}`)}
                          className="flex-shrink-0 relative"
                        >
                          {fav.profilepictureurl ? (
                            <Image
                              src={getImageUrl(fav.profilepictureurl) || ""}
                              alt={fav.name}
                              width={56}
                              height={56}
                              className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center ring-2 ring-white shadow">
                              <span className="text-lg font-bold text-white">
                                {fav.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                              </span>
                            </div>
                          )}
                          {fav.verified && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
                              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </button>

                        {/* Info */}
                        <button
                          className="flex-1 min-w-0 text-left"
                          onClick={() => router.push(`/profile/${fav.favorite_user_id}`)}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base font-bold text-gray-900 leading-tight">{fav.name}</span>
                            {fav.user_is_suspended && (
                              <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                                Suspended
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5 leading-snug">
                            {fav.country || "Unknown location"}&nbsp;&middot;&nbsp;
                            <span className="text-gray-700 font-medium">{fav.active_listings}</span>
                            {" "}listing{fav.active_listings !== 1 ? "s" : ""}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Following since {formatRelativeTime(fav.created_at)}
                          </p>
                        </button>

                        {/* Desktop actions (sm+) */}
                        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                          <ActionButton
                            active={fav.notify_new_listings}
                            activeClass="bg-amber-50 text-amber-600 ring-amber-200"
                            inactiveClass="bg-gray-100 text-gray-400"
                            title={fav.notify_new_listings ? "Notifications on" : "Notifications off"}
                            onClick={() => toggleNotifications(fav.favorite_user_id, fav.notify_new_listings)}
                            icon={
                              <svg className="w-4.5 h-4.5" fill={fav.notify_new_listings ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                              </svg>
                            }
                          />
                          <ActionButton
                            active={false}
                            activeClass=""
                            inactiveClass="bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                            title="Send message"
                            onClick={() => router.push(`/chat?userId=${fav.favorite_user_id}`)}
                            icon={
                              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            }
                          />
                          <button
                            onClick={() => removeFavorite(fav.favorite_user_id)}
                            disabled={removingId === fav.favorite_user_id}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-50"
                            title="Remove from favorites"
                          >
                            {removingId === fav.favorite_user_id ? (
                              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Mobile actions (< sm) */}
                      <div className="sm:hidden flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
                        <button
                          onClick={() => toggleNotifications(fav.favorite_user_id, fav.notify_new_listings)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition ${
                            fav.notify_new_listings
                              ? "bg-amber-50 text-amber-600 ring-1 ring-amber-200"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <svg className="w-4 h-4" fill={fav.notify_new_listings ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          {fav.notify_new_listings ? "Alerts on" : "Alerts off"}
                        </button>
                        <button
                          onClick={() => router.push(`/chat?userId=${fav.favorite_user_id}`)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-blue-50 hover:text-blue-600 transition"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Message
                        </button>
                        <button
                          onClick={() => removeFavorite(fav.favorite_user_id)}
                          disabled={removingId === fav.favorite_user_id}
                          className="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-50 flex-shrink-0"
                          title="Remove"
                        >
                          {removingId === fav.favorite_user_id ? (
                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* â”€â”€ Listings from favorite sellers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {activeTab === "listings" && (
          <>
            {listings.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-9 h-9 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                }
                title="No listings to show"
                description="Your favorite sellers haven't posted any active listings yet. Check back soon."
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {listings.map((listing) => {
                  const mainImage = listing.images?.find((img) => img.is_main) || listing.images?.[0];
                  const isNew = new Date().getTime() - new Date(listing.createdat).getTime() < 86400000;

                  return (
                    <div
                      key={listing.id}
                      onClick={() => router.push(`/listing/${listing.id}`)}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                        {mainImage ? (
                          <Image
                            src={getImageUrl(mainImage.imageurl) || ""}
                            alt={listing.title}
                            width={640}
                            height={480}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-50">
                            <svg className="w-12 h-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full leading-tight shadow-sm">
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Fav
                          </span>
                          {isNew && (
                            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full leading-tight shadow-sm">NEW</span>
                          )}
                        </div>
                        {listing.condition && (
                          <span className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            {listing.condition}
                          </span>
                        )}
                      </div>

                      <div className="p-3 sm:p-4">
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight group-hover:text-amber-600 transition-colors">
                          {listing.title}
                        </h3>
                        <p className="text-base font-bold text-gray-900 mt-1.5">
                          <span className="text-xs font-semibold text-gray-400 mr-0.5">{listing.currency}</span>
                          {listing.price.toLocaleString("en-US")}
                        </p>
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                          <span className="truncate max-w-[60%]">{listing.seller_name}</span>
                          <span className="flex-shrink-0">{formatRelativeTime(listing.createdat)}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{listing.city}, {listing.country}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* â”€â”€ Wishlist â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {activeTab === "wishlist" && (
          <>
            {wishlistLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-[3px] border-amber-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : wishlist.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-9 h-9 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                  </svg>
                }
                title="Your wishlist is empty"
                description="Save listings you love and enable price drop alerts to be notified when the price falls."
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {wishlist.map((listing) => {
                  const mainImage = listing.images?.find((img) => img.is_main) || listing.images?.[0];

                  return (
                    <div
                      key={listing.id}
                      onClick={() => router.push(`/listing/${listing.id}`)}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                        {mainImage ? (
                          <Image
                            src={getImageUrl(mainImage.imageurl) || ""}
                            alt={listing.title}
                            width={640}
                            height={480}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-50">
                            <svg className="w-12 h-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}

                        {listing.price_dropped && (
                          <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Price drop
                          </span>
                        )}

                        <button
                          onClick={(e) => { e.stopPropagation(); removeFromWishlist(listing.id); }}
                          className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow text-gray-400 hover:text-red-500 hover:bg-white transition"
                          title="Remove from wishlist"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div className="p-3 sm:p-4">
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight group-hover:text-amber-600 transition-colors">
                          {listing.title}
                        </h3>

                        <div className="flex items-baseline gap-2 mt-1.5">
                          <p className="text-base font-bold text-gray-900">
                            <span className="text-xs font-semibold text-gray-400 mr-0.5">{listing.currency}</span>
                            {Number(listing.price).toLocaleString("en-US")}
                          </p>
                          {listing.last_seen_price !== null && Number(listing.last_seen_price) !== Number(listing.price) && (
                            <span className="text-xs text-gray-400 line-through">
                              {Number(listing.last_seen_price).toLocaleString("en-US")}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-400 mt-0.5 truncate">{listing.city}, {listing.country}</p>

                        {/* Price drop toggle */}
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePriceDropAlert(listing.id, listing.notify_price_drop); }}
                          className={`mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition ${
                            listing.notify_price_drop
                              ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          <svg className="w-3.5 h-3.5" fill={listing.notify_price_drop ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          {listing.notify_price_drop ? "Price alerts on" : "Enable price alerts"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
