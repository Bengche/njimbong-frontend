"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import ReportModal from "../../components/ReportModal";
import {
  Review,
  ReviewList,
  ReviewStats,
  ReviewSummary,
  WriteReviewModal,
} from "../../components/Reviews";
import PageHeader from "../../components/PageHeader";
import LoadingArt from "../../components/LoadingArt";

// ============================================
// Types
interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  profilepicture: string | null;
  country: string | null;
  is_verified: boolean;
  is_suspended?: boolean;
  suspension_reason?: string | null;
  kyc_status: string;
  member_since: string;
  months_as_member: number;
  createdat?: string;
  created_at?: string;
}

interface UserStats {
  total_listings: number;
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
  category_name: string;
  images: string[];
}

// ============================================
// Helper Components
// ============================================
const StatCard = ({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
    <div className="flex justify-center mb-2 text-green-600">{icon}</div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    <div className="text-sm text-gray-500">{label}</div>
  </div>
);

const TrustIndicator = ({
  passed,
  label,
}: {
  passed: boolean;
  label: string;
}) => (
  <div className="flex items-center gap-2">
    <div
      className={`w-5 h-5 rounded-full flex items-center justify-center ${
        passed ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
      }`}
    >
      {passed ? (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </div>
    <span className={passed ? "text-gray-700" : "text-gray-400"}>{label}</span>
  </div>
);

// ============================================
// Main Component
// ============================================
export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<"listings" | "reviews" | "about">(
    "listings"
  );
  const [trustScore, setTrustScore] = useState<number>(0);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewFilter, setReviewFilter] = useState("all");
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [canReviewReason, setCanReviewReason] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Favorites state
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

  // Helper: Get full image URL
  const getImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  // Helper: Format month and year only (safe)
  const formatMonthYear = (dateString?: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  // Helper: Format full date (safe)
  const formatFullDate = (dateString?: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Helper: Format price
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "XAF",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Helper: Get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper: Format member duration
  const formatMemberDuration = (months: number) => {
    if (months < 1) return "Less than a month";
    if (months === 1) return "1 month";
    if (months < 12) return `${months} months`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years} year${years > 1 ? "s" : ""}`;
    return `${years} year${years > 1 ? "s" : ""}, ${remainingMonths} month${
      remainingMonths > 1 ? "s" : ""
    }`;
  };

  const getMemberSinceValue = (profile: UserProfile) =>
    profile.member_since || profile.createdat || profile.created_at || null;

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/user/${userId}/public-profile`,
        { credentials: "include" }
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError("User not found");
        } else {
          throw new Error("Failed to fetch user profile");
        }
        return;
      }

      const data = await response.json();
      setUser(data.user);
      setStats(data.stats);
      setListings(data.listings || []);

      // Fetch trust score from server
      try {
        const trustResponse = await fetch(
          `${API_BASE}/api/user/${userId}/trust-score`,
          { credentials: "include" }
        );
        if (trustResponse.ok) {
          const trustData = await trustResponse.json();
          setTrustScore(trustData.trustScore || 0);
        }
      } catch (trustErr) {
        console.error("Error fetching trust score:", trustErr);
        // Fallback: use basic calculation if server fails
        setTrustScore(calculateFallbackTrustScore(data.user, data.stats));
      }

      // Check if viewing own profile
      try {
        const meResponse = await fetch(`${API_BASE}/api/user/me`, {
          credentials: "include",
        });
        if (meResponse.ok) {
          const meData = await meResponse.json();
          setIsOwnProfile(meData.id === parseInt(userId));

          // Check if user is favorited
          if (meData.id !== parseInt(userId)) {
            const favResponse = await fetch(
              `${API_BASE}/api/favorites/${userId}/check`,
              { credentials: "include" }
            );
            if (favResponse.ok) {
              const favData = await favResponse.json();
              setIsFavorited(favData.isFavorited);
            }
          }
        }
      } catch {
        // Ignore
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError("Failed to load user profile");
    } finally {
      setLoading(false);
    }
  }, [API_BASE, userId]);

  useEffect(() => {
    if (userId) fetchUserProfile();
  }, [userId, fetchUserProfile]);

  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => {
      fetchUserProfile();
    }, 60000);
    return () => clearInterval(interval);
  }, [userId, fetchUserProfile]);

  // Fallback trust score calculation (used only if server call fails)
  const calculateFallbackTrustScore = (
    userData: UserProfile | null,
    statsData: UserStats | null
  ): number => {
    if (!userData) return 0;
    let score = 0;
    // KYC verification (most important factor)
    if (userData.kyc_status === "approved") score += 30;
    // Account age
    if (userData.months_as_member >= 3) score += 10;
    if (userData.months_as_member >= 12) score += 10;
    // Active listings (capped)
    if (statsData && statsData.active_listings >= 10) score += 5;
    return Math.min(score, 100);
  };

  // Fetch reviews for user
  const fetchReviews = useCallback(
    async (filter = "all") => {
      setReviewsLoading(true);
      try {
        const response = await fetch(
          `${API_BASE}/api/user/${userId}/reviews?type=${filter}`,
          { credentials: "include" }
        );
        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews || []);
          setReviewStats(data.stats || null);
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setReviewsLoading(false);
      }
    },
    [API_BASE, userId]
  );

  // Check if current user can review
  const checkCanReview = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/user/can-review/${userId}`,
        {
          credentials: "include",
        }
      );
      if (response.ok) {
        const data = await response.json();
        setCanReview(data.canReview);
        setCanReviewReason(data.message || data.reason || "");
      } else if (response.status === 401) {
        setCanReview(false);
        setCanReviewReason("Please log in to leave a review");
      }
    } catch (err) {
      console.error("Error checking review eligibility:", err);
      setCanReview(false);
    }
  }, [API_BASE, userId]);

  // Submit review
  const handleSubmitReview = async (data: {
    rating: number;
    title: string;
    reviewText: string;
    reviewSentiment: "positive" | "neutral" | "negative";
  }) => {
    setSubmittingReview(true);
    try {
      const response = await fetch(`${API_BASE}/api/user/${userId}/review`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || errorData.message || "Failed to submit review"
        );
      }

      // Refresh reviews
      await fetchReviews(reviewFilter);
      setShowWriteReview(false);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle filter change
  const handleFilterChange = (filter: string) => {
    setReviewFilter(filter);
    fetchReviews(filter);
  };

  // Toggle favorite status
  const toggleFavorite = async () => {
    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        // Remove from favorites
        const response = await fetch(`${API_BASE}/api/favorites/${userId}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (response.ok) {
          setIsFavorited(false);
        } else if (response.status === 401) {
          router.push("/login");
        }
      } else {
        // Add to favorites
        const response = await fetch(`${API_BASE}/api/favorites/${userId}`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notifyNewListings: true }),
        });
        if (response.ok) {
          setIsFavorited(true);
        } else if (response.status === 401) {
          router.push("/login");
        }
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Fetch reviews when tab changes
  useEffect(() => {
    if (activeTab === "reviews" && userId) {
      fetchReviews(reviewFilter);
      checkCanReview();
    }
  }, [activeTab, userId, fetchReviews, checkCanReview, reviewFilter]);

  // ============================================
  // Render: Loading
  // ============================================
  if (loading) {
    return (
      <LoadingArt
        fullScreen
        label="Loading profile"
        subLabel="Gathering seller details"
      />
    );
  }

  // ============================================
  // Render: Error
  // ============================================
  if (error || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || "User Not Found"}
          </h1>
          <p className="text-gray-600 mb-6">
            The profile you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium"
          >
            Browse Marketplace
          </button>
        </div>
      </div>
    );
  }

  const memberSinceLabel = formatMonthYear(getMemberSinceValue(user)) || "N/A";

  // ============================================
  // Render: Profile
  // ============================================
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
      <PageHeader
        title={user.name}
        description={`Member since ${memberSinceLabel}`}
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

      <div className="mt-6 rounded-2xl border border-emerald-100 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Profile Picture */}
          <div className="relative">
            {user.profilepicture ? (
              <Image
                src={getImageUrl(user.profilepicture) || ""}
                alt={user.name}
                width={160}
                height={160}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-md"
              />
            ) : (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white flex items-center justify-center border-4 border-white shadow-md">
                <span className="text-4xl md:text-5xl font-bold text-green-600">
                  {getInitials(user.name)}
                </span>
              </div>
            )}
            {(user.is_verified || user.kyc_status === "approved") && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-2 border-4 border-white shadow">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">
              {user.name}
            </h1>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
              {user.kyc_status === "approved" && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Identity Verified
                </span>
              )}
              {user.is_verified && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verified Seller
                </span>
              )}
              {user.is_suspended && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.536-9.879a1 1 0 00-1.414-1.414L10 8.828 7.879 6.707a1 1 0 10-1.414 1.414L8.586 10l-2.121 2.121a1 1 0 101.414 1.414L10 11.172l2.121 2.121a1 1 0 001.414-1.414L11.414 10l2.122-2.121z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Account Suspended
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start text-gray-600 text-sm">
              {user.country && (
                <span className="flex items-center gap-1.5">
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {user.country}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons - Only show for other users, not own profile */}
          {!isOwnProfile && (
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <button
                onClick={() => router.push(`/chat?userId=${user.id}`)}
                className="w-full sm:w-auto bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition font-medium flex items-center gap-2 shadow-sm"
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
                Message
              </button>
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full sm:w-auto border border-red-200 text-red-600 px-6 py-2.5 rounded-lg hover:bg-red-50 transition font-medium flex items-center gap-2"
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
                    d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                  />
                </svg>
                Report
              </button>
              <button
                onClick={toggleFavorite}
                disabled={favoriteLoading}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-lg transition font-medium flex items-center gap-2 border ${
                  isFavorited
                    ? "bg-amber-100 border-amber-200 text-amber-800 hover:bg-amber-200"
                    : "bg-white border-emerald-100 text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                {favoriteLoading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill={isFavorited ? "currentColor" : "none"}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                )}
                {isFavorited ? "Favorited" : "Add to Favorites"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="mt-6 rounded-2xl border border-emerald-100 bg-white p-4 sm:p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            icon={
              <svg
                className="w-6 h-6"
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
            }
            value={stats?.active_listings || 0}
            label="Active Listings"
          />
          <StatCard
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            }
            value={`${trustScore}%`}
            label="Trust Score"
          />
          <StatCard
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            }
            value={formatMonthYear(getMemberSinceValue(user)) || "N/A"}
            label="Joined"
          />
          <StatCard
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
            }
            value={user.country || "N/A"}
            label="Location"
          />
        </div>
        <div className="mt-6 border-t border-gray-100 pt-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Trust Indicators
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <TrustIndicator
              passed={user.kyc_status === "approved"}
              label="ID Verified"
            />
            <TrustIndicator passed={user.is_verified} label="Email Verified" />
            <TrustIndicator passed={!!user.phone} label="Phone Added" />
            <TrustIndicator
              passed={user.months_as_member >= 3}
              label="3+ Months Member"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <div className="flex flex-wrap justify-center sm:justify-start gap-2 bg-gray-100 p-2 rounded-xl w-full sm:w-fit">
          <button
            onClick={() => setActiveTab("listings")}
            className={`w-full sm:w-auto px-4 py-2 text-sm sm:px-6 sm:py-2.5 sm:text-base rounded-lg font-medium transition ${
              activeTab === "listings"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Listings ({stats?.active_listings || 0})
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`w-full sm:w-auto px-4 py-2 text-sm sm:px-6 sm:py-2.5 sm:text-base rounded-lg font-medium transition ${
              activeTab === "reviews"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Reviews {reviewStats ? `(${reviewStats.total})` : ""}
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`w-full sm:w-auto px-4 py-2 text-sm sm:px-6 sm:py-2.5 sm:text-base rounded-lg font-medium transition ${
              activeTab === "about"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            About
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-12">
        {activeTab === "listings" && listings.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-12 text-center">
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
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No listings yet
            </h3>
            <p className="text-gray-500">
              {isOwnProfile
                ? "You haven't posted any listings yet. Start selling today!"
                : `${user.name} hasn't posted any listings yet.`}
            </p>
            {isOwnProfile && (
              <button
                onClick={() => router.push("/dashboard")}
                className="mt-6 bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition font-medium"
              >
                Create Listing
              </button>
            )}
          </div>
        )}

        {activeTab === "listings" && listings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <a
                key={listing.id}
                href={`/listing/${listing.id}`}
                className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
              >
                <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                  {listing.images && listing.images[0] ? (
                    <Image
                      src={getImageUrl(listing.images[0]) || ""}
                      alt={listing.title}
                      width={640}
                      height={480}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
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
                  <div className="absolute top-3 left-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        listing.condition === "new"
                          ? "bg-green-500 text-white"
                          : "bg-gray-700 text-white"
                      }`}
                    >
                      {listing.condition === "new" ? "New" : "Used"}
                    </span>
                  </div>
                  {user.is_suspended && (
                    <div className="absolute bottom-3 left-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-600 text-white">
                        Seller Suspended
                      </span>
                    </div>
                  )}
                  {listing.category_name && (
                    <div className="absolute top-3 right-3">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/90 text-gray-700 backdrop-blur-sm">
                        {listing.category_name}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-green-600 transition">
                    {listing.title}
                  </h3>
                  <p className="text-xl font-bold text-green-600 mb-2">
                    {formatPrice(listing.price, listing.currency)}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
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
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                    </svg>
                    {listing.city}, {listing.country}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            {/* Header with Write Review button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Reviews for {user.name}
              </h2>
              {!isOwnProfile && (
                <button
                  onClick={() => setShowWriteReview(true)}
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition font-medium"
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Write a Review
                </button>
              )}
            </div>

            {/* Review Summary */}
            {reviewStats && reviewStats.total > 0 && (
              <ReviewSummary stats={reviewStats} />
            )}

            {/* Review List */}
            <ReviewList
              reviews={reviews}
              stats={
                reviewStats || {
                  total: 0,
                  positive: 0,
                  neutral: 0,
                  negative: 0,
                  averageRating: 0,
                  distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
                }
              }
              loading={reviewsLoading}
              apiBase={API_BASE}
              onFilterChange={handleFilterChange}
              activeFilter={reviewFilter}
            />
          </div>
        )}

        {/* About Tab */}
        {activeTab === "about" && (
          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              About {user.name}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
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
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{user.email}</p>
                    </div>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
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
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium text-gray-900">
                          {user.phone}
                        </p>
                      </div>
                    </div>
                  )}
                  {user.country && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
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
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium text-gray-900">
                          {user.country}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Account Details
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Member Since</p>
                      <p className="font-medium text-gray-900">
                        {formatFullDate(getMemberSinceValue(user)) ||
                          formatMonthYear(getMemberSinceValue(user)) ||
                          "N/A"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Member since{" "}
                        {formatMemberDuration(user.months_as_member)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
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
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        Verification Status
                      </p>
                      <p className="font-medium text-gray-900">
                        {user.kyc_status === "approved"
                          ? "Identity Verified ✓"
                          : user.kyc_status === "pending"
                          ? "Verification Pending"
                          : "Not Verified"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
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
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Trust Score</p>
                      <p className="font-medium text-gray-900">{trustScore}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Safety Tips
              </h3>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <svg
                    className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div>
                    <p className="font-medium text-amber-800 mb-1">
                      Stay Safe When Trading
                    </p>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• Meet in public places for transactions</li>
                      <li>• Verify items before making payment</li>
                      <li>• Use secure payment methods when possible</li>
                      <li>
                        • Trust your instincts - if something feels wrong, walk
                        away
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="user"
        targetId={user.id}
        targetName={user.name}
      />

      {/* Write Review Modal */}
      <WriteReviewModal
        isOpen={showWriteReview}
        onClose={() => setShowWriteReview(false)}
        onSubmit={handleSubmitReview}
        userName={user.name}
        loading={submittingReview}
        canReview={canReview}
        canReviewReason={canReviewReason}
      />
    </main>
  );
}
