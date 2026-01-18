"use client";

import React, { useState } from "react";
import Image from "next/image";

// ============================================
// Types
// ============================================
interface Reviewer {
  id: number;
  name: string;
  picture: string | null;
  isVerified: boolean;
}

interface ListingInfo {
  id: number;
  title: string;
  image: string | null;
}

export interface Review {
  id: number;
  rating: number;
  title: string | null;
  text: string;
  type: string;
  sentiment?: "positive" | "neutral" | "negative";
  createdAt: string;
  sellerResponse: string | null;
  sellerResponseAt: string | null;
  reviewer: Reviewer;
  listing: ListingInfo | null;
}

export interface ReviewStats {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  averageRating: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ReviewCardProps {
  review: Review;
  apiBase: string;
  onReport?: (review: Review) => void;
}

interface ReviewSummaryProps {
  stats: ReviewStats;
}

interface ReviewListProps {
  reviews: Review[];
  stats: ReviewStats;
  loading: boolean;
  apiBase: string;
  onFilterChange: (filter: string) => void;
  activeFilter: string;
  onReportReview?: (review: Review) => void;
}

// ============================================
// Helper Functions
// ============================================
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;
  return `${Math.floor(seconds / 31536000)} years ago`;
};

const getImageUrl = (url: string | null, apiBase: string): string | null => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${apiBase}${url.startsWith("/") ? "" : "/"}${url}`;
};

// ============================================
// Star Rating Component
// ============================================
const StarRating = ({
  rating,
  size = "md",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${sizeClasses[size]} ${
            star <= rating ? "text-yellow-400" : "text-gray-200"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

// ============================================
// Rating Bar Component (for distribution)
// ============================================
const RatingBar = ({
  stars,
  count,
  total,
}: {
  stars: number;
  count: number;
  total: number;
}) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3 text-gray-600">{stars}</span>
      <svg
        className="w-4 h-4 text-yellow-400"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-right text-gray-500">{count}</span>
    </div>
  );
};

// ============================================
// Review Summary Component
// ============================================
export const ReviewSummary: React.FC<ReviewSummaryProps> = ({ stats }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Average Rating */}
        <div className="flex flex-col items-center justify-center md:w-48">
          <div className="text-5xl font-bold text-gray-900">
            {stats.averageRating.toFixed(1)}
          </div>
          <StarRating rating={Math.round(stats.averageRating)} size="lg" />
          <div className="text-sm text-gray-500 mt-2">
            Based on {stats.total} review{stats.total !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => (
            <RatingBar
              key={stars}
              stars={stars}
              count={
                stats.distribution[stars as keyof typeof stats.distribution]
              }
              total={stats.total}
            />
          ))}
        </div>

        {/* Sentiment Summary */}
        <div className="flex flex-row md:flex-col gap-4 md:w-40 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-gray-900">
                {stats.positive}
              </div>
              <div className="text-xs text-gray-500">Positive</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-gray-900">{stats.neutral}</div>
              <div className="text-xs text-gray-500">Neutral</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-gray-900">
                {stats.negative}
              </div>
              <div className="text-xs text-gray-500">Negative</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Review Card Component
// ============================================
export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  apiBase,
  onReport,
}) => {
  const [expanded, setExpanded] = useState(false);
  const isLongReview = review.text.length > 300;

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "bg-green-100 text-green-700";
    if (rating === 3) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const getRatingLabel = (rating: number) => {
    if (rating === 5) return "Excellent";
    if (rating === 4) return "Good";
    if (rating === 3) return "Average";
    if (rating === 2) return "Poor";
    return "Very Poor";
  };

  const getSentiment = () => {
    if (review.sentiment) return review.sentiment;
    if (review.rating >= 4) return "positive";
    if (review.rating === 3) return "neutral";
    return "negative";
  };

  const sentiment = getSentiment();
  const sentimentStyles =
    sentiment === "positive"
      ? "bg-green-100 text-green-700"
      : sentiment === "neutral"
      ? "bg-gray-100 text-gray-700"
      : "bg-red-100 text-red-700";

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Reviewer Avatar */}
          {review.reviewer.picture ? (
            <Image
              src={getImageUrl(review.reviewer.picture, apiBase) || ""}
              alt={review.reviewer.name}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold">
              {review.reviewer.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {review.reviewer.name}
              </span>
              {review.reviewer.isVerified && (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verified
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {formatTimeAgo(review.createdAt)}
            </div>
          </div>
        </div>

        {/* Rating Badge */}
        <div className="flex items-center gap-2">
          {onReport && (
            <button
              onClick={() => onReport(review)}
              className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
            >
              Report
            </button>
          )}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${getRatingColor(
              review.rating
            )}`}
          >
            <StarRating rating={review.rating} size="sm" />
            <span className="hidden sm:inline ml-1">
              {getRatingLabel(review.rating)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${sentimentStyles}`}
        >
          {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
        </span>
      </div>

      {/* Title */}
      {review.title && (
        <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
      )}

      {/* Review Text */}
      <p className="text-gray-600 leading-relaxed">
        {isLongReview && !expanded ? (
          <>
            {review.text.substring(0, 300)}...
            <button
              onClick={() => setExpanded(true)}
              className="text-green-600 hover:text-green-700 font-medium ml-1"
            >
              Read more
            </button>
          </>
        ) : (
          review.text
        )}
        {isLongReview && expanded && (
          <button
            onClick={() => setExpanded(false)}
            className="text-green-600 hover:text-green-700 font-medium ml-1"
          >
            Show less
          </button>
        )}
      </p>

      {/* Listing Reference */}
      {review.listing && (
        <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          {review.listing.image && (
            <Image
              src={getImageUrl(review.listing.image, apiBase) || ""}
              alt={review.listing.title}
              width={48}
              height={48}
              className="w-12 h-12 rounded-lg object-cover"
            />
          )}
          <div>
            <div className="text-xs text-gray-500">Review for</div>
            <div className="text-sm font-medium text-gray-900">
              {review.listing.title}
            </div>
          </div>
        </div>
      )}

      {/* Seller Response */}
      {review.sellerResponse && (
        <div className="mt-4 pl-4 border-l-3 border-green-500 bg-green-50 rounded-r-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-4 h-4 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            <span className="text-sm font-medium text-green-700">
              Seller Response
            </span>
            {review.sellerResponseAt && (
              <span className="text-xs text-gray-500">
                • {formatTimeAgo(review.sellerResponseAt)}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{review.sellerResponse}</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// Review List Component
// ============================================
export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  stats,
  loading,
  apiBase,
  onFilterChange,
  activeFilter,
  onReportReview,
}) => {
  const filters = [
    { key: "all", label: "All", count: stats.total },
    { key: "positive", label: "Positive", count: stats.positive },
    { key: "neutral", label: "Neutral", count: stats.neutral },
    { key: "negative", label: "Negative", count: stats.negative },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === filter.key
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>

      {/* Reviews */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-gray-200 rounded" />
                  <div className="w-16 h-3 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-4 bg-gray-200 rounded" />
                <div className="w-3/4 h-4 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No Reviews Yet
          </h3>
          <p className="text-gray-500">
            {activeFilter === "all"
              ? "This user hasn't received any reviews yet."
              : `No ${activeFilter} reviews found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              apiBase={apiBase}
              onReport={onReportReview}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// Write Review Modal Component
// ============================================
interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    rating: number;
    title: string;
    reviewText: string;
    reviewSentiment: "positive" | "neutral" | "negative";
  }) => Promise<void>;
  userName: string;
  loading: boolean;
  canReview: boolean;
  canReviewReason?: string;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userName,
  loading,
  canReview,
  canReviewReason,
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reviewSentiment, setReviewSentiment] = useState<
    "positive" | "neutral" | "negative"
  >("positive");
  const [sentimentTouched, setSentimentTouched] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (reviewText.trim().length < 10) {
      setError("Review must be at least 10 characters long");
      return;
    }

    try {
      await onSubmit({ rating, title, reviewText, reviewSentiment });
      setSuccess("Review submitted successfully.");
      setRating(0);
      setTitle("");
      setReviewText("");
      setSentimentTouched(false);
      setReviewSentiment("positive");
      setTimeout(() => {
        onClose();
        setSuccess("");
      }, 1200);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to submit review";
      setError(message);
    }
  };

  const getRatingText = (r: number) => {
    if (r === 5) return "Excellent!";
    if (r === 4) return "Good";
    if (r === 3) return "Average";
    if (r === 2) return "Poor";
    if (r === 1) return "Very Poor";
    return "Select a rating";
  };

  const getSentimentLabel = (
    sentiment: "positive" | "neutral" | "negative"
  ) => {
    if (sentiment === "positive") return "Positive";
    if (sentiment === "neutral") return "Neutral";
    return "Negative";
  };

  const getSentimentStyle = (
    sentiment: "positive" | "neutral" | "negative"
  ) => {
    if (sentiment === "positive")
      return "border-green-200 bg-green-50 text-green-700";
    if (sentiment === "neutral")
      return "border-gray-200 bg-gray-50 text-gray-700";
    return "border-red-200 bg-red-50 text-red-700";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b">
          <h2 className="text-xl font-bold text-gray-900">Write a Review</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          {!canReview ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-yellow-600"
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
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Cannot Leave Review
              </h3>
              <p className="text-gray-600">{canReviewReason}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* User info */}
              <p className="text-gray-600">
                Share your experience with{" "}
                <span className="font-semibold">{userName}</span>
              </p>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Rating
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => {
                          setRating(star);
                          if (!sentimentTouched) {
                            setReviewSentiment(
                              star >= 4
                                ? "positive"
                                : star === 3
                                ? "neutral"
                                : "negative"
                            );
                          }
                        }}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 focus:outline-none"
                      >
                        <svg
                          className={`w-8 h-8 transition-colors ${
                            star <= (hoverRating || rating)
                              ? "text-yellow-400"
                              : "text-gray-200"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    {getRatingText(hoverRating || rating)}
                  </span>
                </div>
              </div>

              {/* Sentiment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Sentiment
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["positive", "neutral", "negative"] as const).map(
                    (sentiment) => (
                      <button
                        key={sentiment}
                        type="button"
                        onClick={() => {
                          setReviewSentiment(sentiment);
                          setSentimentTouched(true);
                        }}
                        className={`px-3 py-2 rounded-lg border text-sm font-semibold transition ${
                          reviewSentiment === sentiment
                            ? getSentimentStyle(sentiment)
                            : "border-gray-200 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {getSentimentLabel(sentiment)}
                      </button>
                    )
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Choose how you feel overall about the experience.
                </p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize your experience"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  maxLength={100}
                />
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Review
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell others about your experience..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  maxLength={1000}
                />
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {reviewText.length}/1000
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                  {success}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {loading ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
