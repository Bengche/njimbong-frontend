"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PageHeader from "../components/PageHeader";

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

// ============================================
// Main Component
// ============================================
export default function FavoritesPage() {
  const router = useRouter();

  const [favorites, setFavorites] = useState<FavoriteUser[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [wishlist, setWishlist] = useState<WishlistListing[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "listings" | "wishlist">(
    "users"
  );
  const [removingId, setRemovingId] = useState<number | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

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
    currentValue: boolean
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
            : item
        )
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
          prev.filter((f) => f.favorite_user_id !== userId)
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
            : f
        )
      );
    } catch (err) {
      console.error("Error toggling notifications:", err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
      <PageHeader
        title="Favorites"
        description={`${favorites.length} favorite${
          favorites.length !== 1 ? "s" : ""
        } • Get notified about new listings`}
        actions={
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back
          </button>
        }
      />

      {/* Tabs */}
      <div className="mt-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-emerald-100">
          <div className="flex flex-col sm:flex-row border-b">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex-1 px-4 py-3 text-sm sm:px-6 sm:py-4 font-medium transition ${
                activeTab === "users"
                  ? "text-yellow-600 border-b-2 border-yellow-600 bg-yellow-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                Favorite Sellers ({favorites.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("listings")}
              className={`flex-1 px-4 py-3 text-sm sm:px-6 sm:py-4 font-medium transition ${
                activeTab === "listings"
                  ? "text-yellow-600 border-b-2 border-yellow-600 bg-yellow-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                Their Listings ({listings.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("wishlist")}
              className={`flex-1 px-4 py-3 text-sm sm:px-6 sm:py-4 font-medium transition ${
                activeTab === "wishlist"
                  ? "text-yellow-600 border-b-2 border-yellow-600 bg-yellow-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.172 5.172a4 4 0 015.656 0L12 8.343l3.172-3.171a4 4 0 115.656 5.656L12 21.657 3.172 10.828a4 4 0 010-5.656z"
                  />
                </svg>
                Wishlist ({wishlist.length})
              </div>
            </button>
          </div>

          <div className="p-6">
            {/* Favorite Users Tab */}
            {activeTab === "users" && (
              <>
                {favorites.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-10 h-10 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No favorite sellers yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Add sellers to your favorites to get notified when they
                      post new listings.
                    </p>
                    <button
                      onClick={() => router.push("/market")}
                      className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 transition font-medium"
                    >
                      Browse Marketplace
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {favorites.map((fav) => (
                      <div
                        key={fav.id}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                      >
                        {/* Profile Picture */}
                        <div
                          onClick={() =>
                            router.push(`/profile/${fav.favorite_user_id}`)
                          }
                          className="cursor-pointer"
                        >
                          {fav.profilepictureurl ? (
                            <Image
                              src={getImageUrl(fav.profilepictureurl) || ""}
                              alt={fav.name}
                              width={64}
                              height={64}
                              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center border-2 border-white shadow">
                              <span className="text-xl font-bold text-yellow-600">
                                {fav.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* User Info */}
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() =>
                            router.push(`/profile/${fav.favorite_user_id}`)
                          }
                        >
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                              {fav.name}
                            </h3>
                            {fav.verified && (
                              <svg
                                className="w-5 h-5 text-green-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                            {fav.user_is_suspended && (
                              <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                                Suspended
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {fav.country || "Location not specified"} •{" "}
                            {fav.active_listings} active listing
                            {fav.active_listings !== 1 ? "s" : ""}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Added {formatRelativeTime(fav.created_at)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          {/* Notification Toggle */}
                          <button
                            onClick={() =>
                              toggleNotifications(
                                fav.favorite_user_id,
                                fav.notify_new_listings
                              )
                            }
                            className={`p-2 rounded-lg transition ${
                              fav.notify_new_listings
                                ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                                : "bg-gray-200 text-gray-400 hover:bg-gray-300"
                            }`}
                            title={
                              fav.notify_new_listings
                                ? "Notifications on"
                                : "Notifications off"
                            }
                          >
                            <svg
                              className="w-5 h-5"
                              fill={
                                fav.notify_new_listings
                                  ? "currentColor"
                                  : "none"
                              }
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                              />
                            </svg>
                          </button>

                          {/* Message Button */}
                          <button
                            onClick={() =>
                              router.push(
                                `/chat?userId=${fav.favorite_user_id}`
                              )
                            }
                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition"
                            title="Message"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>
                          </button>

                          {/* Remove Button */}
                          <button
                            onClick={() => removeFavorite(fav.favorite_user_id)}
                            disabled={removingId === fav.favorite_user_id}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
                            title="Remove from favorites"
                          >
                            {removingId === fav.favorite_user_id ? (
                              <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Listings Tab */}
            {activeTab === "listings" && (
              <>
                {listings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-10 h-10 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No listings yet
                    </h3>
                    <p className="text-gray-600">
                      Your favorite sellers haven&apos;t posted any active
                      listings.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map((listing) => {
                      const mainImage =
                        listing.images?.find((img) => img.is_main) ||
                        listing.images?.[0];
                      const isNew =
                        new Date().getTime() -
                          new Date(listing.createdat).getTime() <
                        86400000;

                      return (
                        <div
                          key={listing.id}
                          onClick={() => router.push(`/listing/${listing.id}`)}
                          className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer group"
                        >
                          {/* Image */}
                          <div className="relative aspect-[4/3] bg-gray-100">
                            {mainImage ? (
                              <Image
                                src={getImageUrl(mainImage.imageurl) || ""}
                                alt={listing.title}
                                width={640}
                                height={480}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg
                                  className="w-16 h-16"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            )}

                            {/* Badges */}
                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                              <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                Favorite
                              </span>
                              {isNew && (
                                <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                  NEW
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-green-600 transition">
                              {listing.title}
                            </h3>
                            <p className="text-lg font-bold text-green-600 mt-1">
                              {listing.currency}{" "}
                              {listing.price.toLocaleString("en-US")}
                            </p>
                            <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                                {listing.seller_name}
                                {listing.user_is_suspended && (
                                  <span className="ml-1 inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                    Suspended
                                  </span>
                                )}
                              </span>
                              <span>
                                {formatRelativeTime(listing.createdat)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {listing.city}, {listing.country}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Wishlist Tab */}
            {activeTab === "wishlist" && (
              <>
                {wishlistLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
                  </div>
                ) : wishlist.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-10 h-10 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M3.172 5.172a4 4 0 015.656 0L12 8.343l3.172-3.171a4 4 0 115.656 5.656L12 21.657 3.172 10.828a4 4 0 010-5.656z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Your wishlist is empty
                    </h3>
                    <p className="text-gray-600">
                      Save listings you love and get price drop alerts.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((listing) => {
                      const mainImage =
                        listing.images?.find((img) => img.is_main) ||
                        listing.images?.[0];

                      return (
                        <div
                          key={listing.id}
                          onClick={() => router.push(`/listing/${listing.id}`)}
                          className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer group"
                        >
                          <div className="relative aspect-[4/3] bg-gray-100">
                            {mainImage ? (
                              <Image
                                src={getImageUrl(mainImage.imageurl) || ""}
                                alt={listing.title}
                                width={640}
                                height={480}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg
                                  className="w-16 h-16"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            )}

                            {listing.price_dropped && (
                              <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                Price Drop
                              </span>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromWishlist(listing.id);
                              }}
                              className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow-md text-gray-500 hover:text-red-600 transition"
                              title="Remove from wishlist"
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>

                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-green-600 transition">
                              {listing.title}
                            </h3>
                            <p className="text-lg font-bold text-green-600 mt-1">
                              {listing.currency}{" "}
                              {Number(listing.price).toLocaleString("en-US")}
                            </p>
                            <div className="text-xs text-gray-400 mt-1">
                              {listing.city}, {listing.country}
                            </div>

                            <div className="flex items-center justify-between mt-3 text-xs">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePriceDropAlert(
                                    listing.id,
                                    listing.notify_price_drop
                                  );
                                }}
                                className={`px-2 py-1 rounded-full border ${
                                  listing.notify_price_drop
                                    ? "border-green-500 text-green-600"
                                    : "border-gray-300 text-gray-500"
                                }`}
                              >
                                {listing.notify_price_drop
                                  ? "Price alerts on"
                                  : "Price alerts off"}
                              </button>
                              {listing.last_seen_price !== null &&
                                Number(listing.last_seen_price) !==
                                  Number(listing.price) && (
                                  <span className="text-gray-400">
                                    Was {listing.last_seen_price}
                                  </span>
                                )}
                            </div>
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
      </div>

      {/* Spacer */}
      <div className="h-16"></div>
    </main>
  );
}
