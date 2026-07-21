"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Axios from "axios";
import Image from "next/image";
import { currencies } from "../../constants/currencies";
import ReportModal from "../../components/ReportModal";
import PageHeader from "../../components/PageHeader";
import LoadingArt from "../../components/LoadingArt";
import FonlokCheckoutModal from "../../components/FonlokCheckoutModal";
import MakeOfferModal from "../../components/MakeOfferModal";
Axios.defaults.withCredentials = true;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// Helper function to get full image URL
const getImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
};

interface Image {
  id: number;
  imageurl: string;
  is_main: boolean;
}

interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  categoryid: number;
  categoryname: string;
  location: string;
  country: string;
  city: string;
  condition: string;
  phone: string;
  tags: string[];
  status: string;
  user_id: number;
  username: string;
  userverified: boolean;
  kyc_verified?: boolean;
  user_profile_picture?: string;
  user_is_suspended?: boolean;
  createdat: string;
  images: Image[];
}

// Helper function to format relative time professionally
const formatRelativeTime = (
  dateString: string,
): { text: string; isNew: boolean } => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  // "New" badge only for listings < 6 hours old
  const isNew = diffHours < 6;

  // Less than 1 minute
  if (diffSeconds < 60) {
    return { text: "Posted just now", isNew };
  }

  // 1-59 minutes ago
  if (diffMinutes === 1) {
    return { text: "Posted 1 min ago", isNew };
  }
  if (diffMinutes < 60) {
    return { text: `Posted ${diffMinutes} mins ago`, isNew };
  }

  // 1-23 hours ago
  if (diffHours === 1) {
    return { text: "Posted 1 hour ago", isNew };
  }
  if (diffHours < 24) {
    return { text: `Posted ${diffHours} hours ago`, isNew };
  }

  // 1-6 days ago
  if (diffDays === 1) {
    return { text: "Posted 1 day ago", isNew: false };
  }
  if (diffDays < 7) {
    return { text: `Posted ${diffDays} days ago`, isNew: false };
  }

  // 1-4 weeks ago
  if (diffWeeks === 1) {
    return { text: "Posted 1 week ago", isNew: false };
  }
  if (diffWeeks < 4) {
    return { text: `Posted ${diffWeeks} weeks ago`, isNew: false };
  }

  // 1-11 months ago
  if (diffMonths === 1) {
    return { text: "Posted 1 month ago", isNew: false };
  }
  if (diffMonths < 12) {
    return { text: `Posted ${diffMonths} months ago`, isNew: false };
  }

  // 1+ years ago
  if (diffYears === 1) {
    return { text: "Posted 1 year ago", isNew: false };
  }
  return { text: `Posted ${diffYears} years ago`, isNew: false };
};

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id;

  const [listing, setListing] = useState<Listing | null>(null);
  const [relatedListings, setRelatedListings] = useState<Listing[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [showFullImage, setShowFullImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [reportType, setReportType] = useState<"listing" | "user">("listing");
  const [startingChat, setStartingChat] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerSent, setOfferSent] = useState(false);
  const [acceptedOffer, setAcceptedOffer] = useState<{
    id: number;
    amount: number;
  } | null>(null);

  // Compute the display image URL with proper fallback
  // Always ensure we show an image if one exists
  const displayImageUrl = useMemo(() => {
    // First try selectedImage if it's a non-empty string
    if (selectedImage && selectedImage.trim() !== "") {
      return selectedImage;
    }
    // Fallback to first image from listing
    if (
      listing?.images &&
      listing.images.length > 0 &&
      listing.images[0]?.imageurl
    ) {
      const url = getImageUrl(listing.images[0].imageurl);
      return url;
    }
    return null;
  }, [selectedImage, listing]);

  // Debug: Log image state
  useEffect(() => {
    if (listing) {
      console.log("Listing images:", listing.images);
      console.log("Selected image:", selectedImage);
      console.log("Display image URL:", displayImageUrl);
    }
  }, [listing, selectedImage, displayImageUrl]);

  // Get initials from username
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Navigate to next/previous image
  const navigateImage = useCallback(
    (direction: "next" | "prev") => {
      if (!listing?.images || listing.images.length <= 1) return;

      const currentIndex = listing.images.findIndex(
        (img) => getImageUrl(img.imageurl) === selectedImage,
      );

      let newIndex;
      if (direction === "next") {
        newIndex =
          currentIndex < listing.images.length - 1 ? currentIndex + 1 : 0;
      } else {
        newIndex =
          currentIndex > 0 ? currentIndex - 1 : listing.images.length - 1;
      }

      setSelectedImage(getImageUrl(listing.images[newIndex].imageurl) || "");
    },
    [listing, selectedImage],
  );

  // Keyboard navigation for image modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showFullImage) return;

      switch (e.key) {
        case "Escape":
          setShowFullImage(false);
          break;
        case "ArrowLeft":
          navigateImage("prev");
          break;
        case "ArrowRight":
          navigateImage("next");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showFullImage, navigateImage]);

  // Fetch current user ID
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await Axios.get(`${API_BASE}/api/users/me`);
        setCurrentUserId(response.data.id);
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Check if the current buyer has an accepted offer on this listing
  useEffect(() => {
    if (!listingId || !currentUserId) return;
    Axios.get(`${API_BASE}/api/offers/listing/${listingId}`)
      .then((res) => {
        const accepted = (res.data.offers || []).find(
          (o: { buyer_id: number; status: string; amount: string | number }) =>
            o.buyer_id === currentUserId && o.status === "accepted",
        );
        if (accepted) {
          setAcceptedOffer({
            id: accepted.id,
            amount: Number(accepted.amount),
          });
        }
      })
      .catch(() => {});
  }, [listingId, currentUserId]);

  useEffect(() => {
    const checkWishlist = async () => {
      try {
        if (!listingId) return;

        const response = await Axios.get(
          `${API_BASE}/api/wishlist/${listingId}/check`,
        );

        setIsWishlisted(Boolean(response.data.isWishlisted));
      } catch (error) {
        console.error("Error checking wishlist:", error);
      }
    };

    checkWishlist();
  }, [listingId, currentUserId]);

  const toggleWishlist = async () => {
    try {
      if (!listingId) return;
      setWishlistLoading(true);

      if (isWishlisted) {
        await Axios.delete(`${API_BASE}/api/wishlist/${listingId}`);
        setIsWishlisted(false);
      } else {
        await Axios.post(`${API_BASE}/api/wishlist/${listingId}`);
        setIsWishlisted(true);
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    } finally {
      setWishlistLoading(false);
    }
  };
  const startChatWithSeller = async () => {
    if (!listing) return;

    setStartingChat(true);

    // Track click for analytics
    try {
      await Axios.post(`${API_BASE}/api/analytics/track/click`, {
        listingId: listing.id,
        clickType: "contact",
        source: "listing_page",
      });
    } catch (err) {
      console.log("Could not track click:", err);
    }

    try {
      const response = await fetch(`${API_BASE}/api/chat/conversations`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sellerId: listing.user_id,
          listingId: listing.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/chat?conversation=${data.conversation.id}`);
      } else {
        const errData = await response.json();
        alert(errData.message || "Failed to start conversation");
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      alert("Failed to start conversation");
    } finally {
      setStartingChat(false);
    }
  };

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await Axios.get(
          `${API_BASE}/api/listings/${listingId}`,
        );
        setListing(response.data);
        if (response.data.images && response.data.images.length > 0) {
          setSelectedImage(getImageUrl(response.data.images[0].imageurl) || "");
        }

        // Record this view for personalization
        try {
          await Axios.post(`${API_BASE}/api/preferences/view`, {
            listingId: parseInt(listingId as string),
          });
        } catch (viewErr) {
          console.log("Could not record view:", viewErr);
        }

        // Track view for analytics
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const source = urlParams.get("source") || "direct";
          await Axios.post(`${API_BASE}/api/analytics/track/view`, {
            listingId: parseInt(listingId as string),
            source,
          });
        } catch (analyticsErr) {
          console.log("Could not track view:", analyticsErr);
        }

        // Fetch related listings
        const relatedResponse = await Axios.get(
          `${API_BASE}/api/listings/related/${listingId}`,
        );
        setRelatedListings(relatedResponse.data);
      } catch (error: unknown) {
        if (Axios.isAxiosError(error) && error.response?.status === 401) {
          window.location.href =
            process.env.NEXT_PUBLIC_LOGIN_ENDPOINT || "/login";
        }
        console.error("Error fetching listing:", error);
      } finally {
        setLoading(false);
      }
    };

    if (listingId) {
      fetchListing();
    }
  }, [listingId]);

  if (loading) {
    return (
      <LoadingArt
        fullScreen
        label="Loading listing"
        subLabel="Preparing the details"
      />
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Listing not found
          </h2>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Back to Market
          </button>
        </div>
      </div>
    );
  }

  const currencySymbol =
    currencies.find((c) => c.code === listing.currency)?.symbol || "$";

  const handleShare = () => {
    const url = window.location.href;
    const text = `Check this out: ${listing.title} — ${currencySymbol}${Number(listing.price).toLocaleString()} on Njimbong`;
    if (navigator.share) {
      navigator.share({ title: listing.title, text, url }).catch(() => {});
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard
        .writeText(url)
        .then(() => alert("Link copied to clipboard!"))
        .catch(() => {});
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
      <PageHeader
        title={listing.title}
        description={`${listing.city}, ${listing.country}`}
        actions={
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
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
            Back
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image Display */}
          <div
            className="rounded-2xl shadow-lg cursor-pointer"
            onClick={() => setShowFullImage(true)}
          >
            {listing.images && listing.images.length > 0 ? (
              <Image
                src={
                  selectedImage || getImageUrl(listing.images[0].imageurl) || ""
                }
                alt={listing.title}
                width={800}
                height={600}
                style={{
                  width: "100%",
                  height: "auto",
                  maxHeight: "500px",
                  objectFit: "contain",
                  borderRadius: "1rem",
                  display: "block",
                }}
              />
            ) : (
              <div
                className="w-full flex items-center justify-center bg-gray-200 rounded-2xl"
                style={{ minHeight: "350px" }}
              >
                <div className="text-center">
                  <svg
                    className="w-20 h-20 text-gray-400 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-gray-500 mt-2">No images available</p>
                </div>
              </div>
            )}
          </div>

          {/* Thumbnail Images */}
          {listing.images && listing.images.length > 1 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {listing.images.map((image, index) => {
                const imageUrl = getImageUrl(image.imageurl) || "";
                const isSelected = selectedImage === imageUrl;
                return (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(imageUrl)}
                    className={`rounded-lg overflow-hidden border-2 transition-all aspect-square ${
                      isSelected
                        ? "border-green-600 ring-2 ring-green-600 ring-offset-2 scale-105"
                        : "border-gray-200 hover:border-green-400"
                    }`}
                  >
                    <Image
                      src={imageUrl}
                      alt={`${listing.title} ${index + 1}`}
                      width={120}
                      height={120}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-4">

          {/* ── Listing info card ───────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Title + wishlist */}
            <div className="relative px-5 pt-5 pb-4">
              {currentUserId && listing.user_id !== currentUserId && (
                <button
                  onClick={toggleWishlist}
                  disabled={wishlistLoading}
                  aria-label={isWishlisted ? "Remove from saved" : "Save listing"}
                  className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                    isWishlisted
                      ? "text-red-500 bg-red-50"
                      : "text-gray-300 hover:text-red-400 hover:bg-red-50"
                  }`}
                >
                  <svg className="w-5 h-5" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.172 5.172a4 4 0 015.656 0L12 8.343l3.172-3.171a4 4 0 115.656 5.656L12 21.657 3.172 10.828a4 4 0 010-5.656z"/>
                  </svg>
                </button>
              )}
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug pr-10">
                {listing.title}
              </h1>
              {/* Status + KYC badges */}
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                {listing.status === "Available" && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Available
                  </span>
                )}
                {listing.status === "In Escrow" && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                    Payment in progress
                  </span>
                )}
                {listing.status !== "Available" && listing.status !== "In Escrow" && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
                    Sold
                  </span>
                )}
                {listing.kyc_verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                    Verified seller
                  </span>
                )}
                {(listing as any).view_count > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-400 ml-auto">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    {(listing as any).view_count.toLocaleString()} {(listing as any).view_count === 1 ? "view" : "views"}
                  </span>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="px-5 py-4 border-t border-gray-100">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-3xl font-bold text-gray-900 tracking-tight">
                  {currencySymbol}
                  {(acceptedOffer ? acceptedOffer.amount : Number(listing.price)).toLocaleString("en-US")}
                </span>
                <span className="text-sm text-gray-400 font-normal">{listing.currency}</span>
              </div>
              {acceptedOffer && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-400 line-through">
                    {currencySymbol}{Number(listing.price).toLocaleString("en-US")}
                  </span>
                  <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                    Offer accepted
                  </span>
                </div>
              )}
            </div>

            {/* Meta rows */}
            <dl className="divide-y divide-gray-50 border-t border-gray-100">
              {listing.condition && (
                <div className="flex items-center justify-between px-5 py-3 gap-4">
                  <dt className="text-xs uppercase tracking-wide text-gray-400 font-medium shrink-0">Condition</dt>
                  <dd className="text-sm font-medium text-gray-800 capitalize text-right">{listing.condition}</dd>
                </div>
              )}
              {listing.categoryname && (
                <div className="flex items-center justify-between px-5 py-3 gap-4">
                  <dt className="text-xs uppercase tracking-wide text-gray-400 font-medium shrink-0">Category</dt>
                  <dd className="text-sm font-medium text-gray-800 text-right">{listing.categoryname}</dd>
                </div>
              )}
              <div className="flex items-center justify-between px-5 py-3 gap-4">
                <dt className="text-xs uppercase tracking-wide text-gray-400 font-medium shrink-0">Location</dt>
                <dd className="text-sm font-medium text-gray-800 text-right">
                  {[listing.city, listing.country].filter(Boolean).join(", ") || listing.location || "—"}
                  {listing.location && listing.city && (
                    <span className="block text-xs text-gray-400 font-normal">{listing.location}</span>
                  )}
                </dd>
              </div>
              {listing.createdat && (() => {
                const timeInfo = formatRelativeTime(listing.createdat);
                return (
                  <div className="flex items-center justify-between px-5 py-3 gap-4">
                    <dt className="text-xs uppercase tracking-wide text-gray-400 font-medium shrink-0">Listed</dt>
                    <dd className="text-sm font-medium text-gray-800 text-right">
                      {timeInfo.isNew ? (
                        <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded text-xs">New</span>
                      ) : (
                        timeInfo.text.replace("Posted ", "")
                      )}
                    </dd>
                  </div>
                );
              })()}
              {(listing as any).delivery_type && (listing as any).delivery_type !== "pickup" && (
                <div className="flex items-center justify-between px-5 py-3 gap-4">
                  <dt className="text-xs uppercase tracking-wide text-gray-400 font-medium shrink-0">Delivery</dt>
                  <dd className="text-sm font-medium text-gray-800 text-right">
                    {({"delivery": "Available", "both": "Pickup or delivery", "ships": "Ships nationwide"} as Record<string, string>)[(listing as any).delivery_type] || (listing as any).delivery_type}
                    {(listing as any).delivery_notes && (
                      <span className="block text-xs text-gray-400 font-normal">{(listing as any).delivery_notes}</span>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* ── Seller + actions card ───────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

            {/* Seller profile row */}
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100">
              {currentUserId && currentUserId === listing.user_id ? (
                <>
                  {listing.user_profile_picture ? (
                    <Image src={getImageUrl(listing.user_profile_picture) || ""} alt="You" width={44} height={44} className="w-11 h-11 rounded-full object-cover shrink-0"/>
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-bold shrink-0">{getInitials(listing.username)}</div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">You</p>
                    <p className="text-xs text-gray-400 mt-0.5">Your listing</p>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => listing.user_id && router.push(`/profile/${listing.user_id}`)}
                  className="flex items-center gap-3 flex-1 min-w-0 group text-left"
                >
                  {listing.user_profile_picture ? (
                    <Image src={getImageUrl(listing.user_profile_picture) || ""} alt={listing.username} width={44} height={44} className="w-11 h-11 rounded-full object-cover shrink-0"/>
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-bold shrink-0">{getInitials(listing.username)}</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700 transition truncate">{listing.username}</span>
                      {listing.kyc_verified && (
                        <svg className="w-4 h-4 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                      )}
                      {listing.user_is_suspended && (
                        <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded shrink-0">Suspended</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">View profile</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </button>
              )}
            </div>

            {/* Phone number */}
            {listing.phone && currentUserId !== listing.user_id && (
              <a href={`tel:${listing.phone}`} className="flex items-center gap-2.5 text-gray-700 hover:text-emerald-700 transition group mb-4">
                <svg className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 shrink-0 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                <span className="font-semibold text-base">{listing.phone}</span>
              </a>
            )}

            {/* Buy Securely via Fonlok — only for XAF listings, available, not own listing */}
            {currentUserId &&
              currentUserId !== listing.user_id &&
              listing.status === "Available" &&
              listing.currency === "XAF" && (
                <>
                  {/* Fonlok Protected badge */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl mb-2">
                    <svg
                      className="w-5 h-5 text-emerald-600 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className="text-xs font-bold text-emerald-700">
                        Fonlok Protected
                      </p>
                      <p className="text-xs text-emerald-600">
                        Funds held in escrow until you confirm receipt
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCheckout(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-semibold mb-2"
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
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    Buy Securely via Fonlok Escrow
                  </button>
                  {/* Make Offer button */}
                  {!offerSent ? (
                    <button
                      onClick={() => setShowOfferModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-amber-500 text-amber-600 rounded-xl hover:bg-amber-50 transition font-semibold mb-3 text-sm"
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
                          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                        />
                      </svg>
                      Make an Offer
                    </button>
                  ) : (
                    <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm font-semibold mb-3">
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Offer sent — awaiting seller response
                    </div>
                  )}
                </>
              )}

            {/* Visitor escrow CTA — not logged in, XAF listing, available */}
            {!currentUserId &&
              listing.status === "Available" &&
              listing.currency === "XAF" && (
                <a
                  href={`/login?redirect=/listing/${listing.id}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3
                             bg-emerald-600 text-white rounded-xl hover:bg-emerald-700
                             transition font-semibold mb-3 text-center"
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  Sign in to Buy Securely via Escrow
                </a>
              )}

            {/* Visitor message CTA — not logged in */}
            {!currentUserId && listing.status === "Available" && (
              <a
                href={`/login?redirect=/listing/${listing.id}`}
                className="w-full flex items-center justify-center gap-2 px-4 py-3
                           bg-green-600 text-white rounded-lg hover:bg-green-700
                           transition font-medium mb-3 text-center"
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
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                Sign in to Message Seller
              </a>
            )}

            {/* Message Seller Button in Seller Section */}
            {currentUserId &&
              currentUserId !== listing.user_id &&
              (listing.status === "Available" ||
                listing.status === "In Escrow") && (
                <button
                  onClick={startChatWithSeller}
                  disabled={startingChat}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium mb-3 disabled:opacity-50"
                >
                  {startingChat ? (
                    <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
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
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  )}
                  {startingChat ? "Starting chat..." : "Message Seller"}
                </button>
              )}

            {/* Action buttons */}
            <div className="space-y-2">

              {/* ── Buyer: XAF + Available ── */}
              {currentUserId &&
                currentUserId !== listing.user_id &&
                listing.status === "Available" &&
                listing.currency === "XAF" && (
                  <>
                    <button
                      onClick={() => setShowCheckout(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 active:bg-emerald-800 transition font-semibold text-sm"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                      Buy via Fonlok Escrow
                    </button>
                    <p className="text-center text-xs text-gray-400">Funds held securely until you confirm receipt</p>
                    {!offerSent ? (
                      <button
                        onClick={() => setShowOfferModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition font-medium text-sm"
                      >
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>
                        Make an Offer
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-500 rounded-xl text-sm">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                        Offer sent — awaiting response
                      </div>
                    )}
                  </>
                )}

              {/* ── Visitor: not logged in, XAF + Available ── */}
              {!currentUserId && listing.status === "Available" && listing.currency === "XAF" && (
                <a
                  href={`/login?redirect=/listing/${listing.id}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-semibold text-sm text-center"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  Sign in to Buy Securely
                </a>
              )}

              {/* ── Message seller ── */}
              {!currentUserId && listing.status === "Available" && (
                <a
                  href={`/login?redirect=/listing/${listing.id}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium text-sm text-center"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                  Sign in to Message Seller
                </a>
              )}
              {currentUserId &&
                currentUserId !== listing.user_id &&
                (listing.status === "Available" || listing.status === "In Escrow") && (
                  <button
                    onClick={startChatWithSeller}
                    disabled={startingChat}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition font-medium text-sm disabled:opacity-50"
                  >
                    {startingChat ? (
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                    ) : (
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                    )}
                    {startingChat ? "Starting chat…" : "Message Seller"}
                  </button>
                )}

              {/* ── Status notices ── */}
              {listing.status === "In Escrow" && currentUserId !== listing.user_id && (
                <div className="flex items-start gap-2.5 px-3.5 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                  <svg className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  <p className="text-xs leading-relaxed">Payment secured in escrow. The seller is preparing delivery.</p>
                </div>
              )}
              {listing.status === "Sold" && currentUserId !== listing.user_id && (
                <div className="flex items-center justify-center gap-2 px-3.5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  <span className="text-xs font-medium">This item has been sold</span>
                </div>
              )}
            </div>

            {/* Report + Share — secondary actions */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                Share
              </button>
              <button
                onClick={() => { setReportType("listing"); setShowReportModal(true); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                Report listing
              </button>
              {currentUserId && currentUserId !== listing.user_id && (
                <button
                  onClick={() => { setReportType("user"); setShowReportModal(true); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                  Report user
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-10">
        <h2 className="text-base font-semibold text-gray-900 mb-3">About this listing</h2>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {listing.description}
        </p>

        {/* Tags */}
        {listing.tags && listing.tags.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {listing.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* You May Also Like */}
      {relatedListings.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            You May Also Like
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedListings.map((relatedListing) => {
              const mainImage = relatedListing.images?.find(
                (img) => img.is_main,
              );
              const relatedCurrencySymbol =
                currencies.find((c) => c.code === relatedListing.currency)
                  ?.symbol || "$";

              return (
                <div
                  key={relatedListing.id}
                  onClick={() => router.push(`/listing/${relatedListing.id}`)}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                >
                  <div className="relative h-48">
                    {mainImage ? (
                      <Image
                        src={getImageUrl(mainImage.imageurl) || ""}
                        alt={relatedListing.title}
                        width={640}
                        height={384}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <svg
                          className="w-16 h-16 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                    <span className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold capitalize">
                      {relatedListing.condition}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-800 mb-2 truncate">
                      {relatedListing.title}
                    </h3>
                    <p className="text-2xl font-bold text-green-600 mb-2">
                      {relatedCurrencySymbol}
                      {Number(relatedListing.price).toLocaleString("en-US")}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
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
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {relatedListing.city}, {relatedListing.country}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Full Image Modal */}
      {showFullImage && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex flex-col"
          onClick={() => setShowFullImage(false)}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 text-white">
            <h3 className="text-lg font-medium truncate max-w-md">
              {listing.title}
            </h3>
            <button
              onClick={() => setShowFullImage(false)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <svg
                className="w-8 h-8"
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

          {/* Main Image Area */}
          <div
            className="flex-1 flex items-center justify-center relative px-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={displayImageUrl || ""}
              alt={listing.title}
              width={1200}
              height={800}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
            />

            {/* Navigation arrows if multiple images */}
            {listing.images && listing.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage("prev");
                  }}
                  className="absolute left-4 text-white hover:bg-white/20 bg-black/40 backdrop-blur-sm rounded-full p-3 transition-all hover:scale-110"
                >
                  <svg
                    className="w-8 h-8"
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

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage("next");
                  }}
                  className="absolute right-4 text-white hover:bg-white/20 bg-black/40 backdrop-blur-sm rounded-full p-3 transition-all hover:scale-110"
                >
                  <svg
                    className="w-8 h-8"
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
              </>
            )}
          </div>

          {/* Thumbnails & Counter */}
          {listing.images && listing.images.length > 1 && (
            <div className="p-4" onClick={(e) => e.stopPropagation()}>
              {/* Image counter */}
              <div className="text-center text-white/80 text-sm mb-3">
                {listing.images.findIndex(
                  (img) => getImageUrl(img.imageurl) === selectedImage,
                ) + 1}{" "}
                of {listing.images.length} images
              </div>

              {/* Thumbnail strip */}
              <div className="flex justify-center gap-2 overflow-x-auto pb-2">
                {listing.images.map((image, index) => {
                  const imageUrl = getImageUrl(image.imageurl) || "";
                  const isSelected = selectedImage === imageUrl;
                  return (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImage(imageUrl)}
                      className={`flex-shrink-0 rounded-lg overflow-hidden transition-all ${
                        isSelected
                          ? "ring-2 ring-white ring-offset-2 ring-offset-black scale-105"
                          : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={imageUrl}
                        alt={`${listing.title} ${index + 1}`}
                        width={64}
                        height={64}
                        className="w-16 h-16 object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Keyboard hint */}
          <div className="absolute bottom-4 left-4 text-white/40 text-xs hidden md:block">
            Press ESC to close • Use arrow keys to navigate
          </div>
        </div>
      )}

      {/* Fonlok Checkout Modal */}
      {showCheckout && listing && (
        <FonlokCheckoutModal
          listing={{
            id: listing.id,
            title: listing.title,
            price: acceptedOffer?.amount ?? listing.price,
            currency: listing.currency,
          }}
          onClose={() => setShowCheckout(false)}
        />
      )}

      {/* Report Modal */}
      {listing && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          targetType={reportType}
          targetId={reportType === "listing" ? listing.id : listing.user_id}
          targetName={
            reportType === "listing" ? listing.title : listing.username
          }
        />
      )}

      {/* Make Offer Modal */}
      {listing && showOfferModal && (
        <MakeOfferModal
          isOpen={showOfferModal}
          onClose={() => setShowOfferModal(false)}
          listingId={listing.id}
          listingTitle={listing.title}
          askingPrice={listing.price}
          currency={listing.currency}
          currencySymbol={
            currencies.find((c) => c.code === listing.currency)?.symbol || ""
          }
          onOfferSent={() => {
            setShowOfferModal(false);
            setOfferSent(true);
          }}
        />
      )}
    </main>
  );
}
