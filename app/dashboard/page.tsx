"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Axios from "axios";
import Image from "next/image";
import SellModal from "../components/SellModal";
import SearchFilters from "../components/SearchFilters";
import Notifications from "../components/Notifications";
import LoadingArt from "../components/LoadingArt";
import ReportModal from "../components/ReportModal";
import SuspensionBanner from "../components/SuspensionBanner";
import OnboardingModal from "../components/OnboardingModal";
import {
  NotificationPermissionBanner,
  useNotificationPoller,
} from "../components/BrowserNotifications";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import TopSellers from "../components/TopSellers";
Axios.defaults.withCredentials = true;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// Helper function to get full image URL
const getImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
};
interface Category {
  id: number;
  name: string;
}

interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  category_id: number;
  category_name: string;
  country: string;
  city: string;
  location?: string;
  condition: string;
  phone: string;
  status: string;
  moderation_status?: string;
  rejection_reason?: string;
  user_id: number;
  username: string;
  userverified: boolean;
  kyc_verified?: boolean;
  user_profile_picture?: string;
  user_is_suspended?: boolean;
  createdat: string;
  images: { id: number; imageurl: string; is_main: boolean }[];
}

interface UserLocation {
  city?: string;
  country?: string;
  neighborhood?: string;
  suburb?: string;
  postcode?: string;
  accuracy?: number;
  source: "gps" | "cached" | "profile" | "unknown";
}

const normalizeText = (value: string | undefined | null) =>
  (value || "").toLowerCase().trim();

const sortListingsByLocation = (
  items: Listing[],
  location: UserLocation | null
) => {
  if (!location) return [...items];

  const city = normalizeText(location.city);
  const country = normalizeText(location.country);
  const neighborhood = normalizeText(location.neighborhood || location.suburb);
  const postcode = normalizeText(location.postcode);

  const getRank = (listing: Listing) => {
    const listingCity = normalizeText(listing.city);
    const listingCountry = normalizeText(listing.country);
    const listingLocation = normalizeText(listing.location);

    const veryCloseMatch =
      (neighborhood && listingLocation.includes(neighborhood)) ||
      (postcode && listingLocation.includes(postcode));

    if (veryCloseMatch) return 0;
    if (city && listingCity === city) return 1;
    if (country && listingCountry === country) return 2;
    return 3;
  };

  return [...items].sort((a, b) => {
    const rankDiff = getRank(a) - getRank(b);
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.createdat).getTime() - new Date(a.createdat).getTime();
  });
};

interface SavedSearch {
  id: number;
  name: string;
  filters: {
    category: string;
    search: string;
    country: string;
    city: string;
    minPrice: string;
    maxPrice: string;
    currency: string;
    condition: string;
  };
  notify_new_listings: boolean;
  created_at: string;
}

// Helper function to format relative time professionally
const formatRelativeTime = (
  dateString: string
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
    return { text: "Just now", isNew };
  }

  // 1-59 minutes ago
  if (diffMinutes === 1) {
    return { text: "1 min ago", isNew };
  }
  if (diffMinutes < 60) {
    return { text: `${diffMinutes} mins ago`, isNew };
  }

  // 1-23 hours ago
  if (diffHours === 1) {
    return { text: "1 hour ago", isNew };
  }
  if (diffHours < 24) {
    return { text: `${diffHours} hours ago`, isNew };
  }

  // 1-6 days ago
  if (diffDays === 1) {
    return { text: "1 day ago", isNew: false };
  }
  if (diffDays < 7) {
    return { text: `${diffDays} days ago`, isNew: false };
  }

  // 1-4 weeks ago
  if (diffWeeks === 1) {
    return { text: "1 week ago", isNew: false };
  }
  if (diffWeeks < 4) {
    return { text: `${diffWeeks} weeks ago`, isNew: false };
  }

  // 1-11 months ago
  if (diffMonths === 1) {
    return { text: "1 month ago", isNew: false };
  }
  if (diffMonths < 12) {
    return { text: `${diffMonths} months ago`, isNew: false };
  }

  // 1+ years ago
  if (diffYears === 1) {
    return { text: "1 year ago", isNew: false };
  }
  return { text: `${diffYears} years ago`, isNew: false };
};

export default function Dashboard() {
  const router = useRouter();
  const [showSellModal, setShowSellModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMyListings, setShowMyListings] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Onboarding & Personalization states
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [recommendedListings, setRecommendedListings] = useState<Listing[]>([]);

  // Report modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: "listing" | "user";
    id: number;
    name: string;
  } | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [updatingListingStatus, setUpdatingListingStatus] = useState<
    number | null
  >(null);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState("");
  const [saveSearchNotify, setSaveSearchNotify] = useState(true);
  const [saveSearchError, setSaveSearchError] = useState<string | null>(null);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [insightsTab, setInsightsTab] = useState<"analytics" | "top-sellers">(
    "analytics"
  );

  // Filter states
  const [filters, setFilters] = useState({
    category: "",
    search: "",
    country: "",
    city: "",
    minPrice: "",
    maxPrice: "",
    currency: "",
    condition: "",
  });

  // Browser notification polling
  useNotificationPoller(currentUserId);

  // Fetch current user ID
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await Axios.get(`${API_BASE}/api/users/me`);
        setCurrentUserId(response.data.id);
        setAuthChecked(true);
      } catch (error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          window.location.href =
            process.env.NEXT_PUBLIC_LOGIN_ENDPOINT || "/login";
          return;
        }
        console.error("Error fetching current user:", error);
        setAuthChecked(true);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchSavedSearches();
      fetchWishlistIds();
    }
  }, [currentUserId]);

  useEffect(() => {
    const cacheKey = "marketplace_user_location";
    const cacheRaw = window.localStorage.getItem(cacheKey);
    if (cacheRaw) {
      try {
        const cached = JSON.parse(cacheRaw) as {
          data: UserLocation;
          timestamp: number;
        };
        const isFresh = Date.now() - cached.timestamp < 1000 * 60 * 60 * 6;
        if (isFresh && cached.data) {
          setUserLocation({ ...cached.data, source: "cached" });
        }
      } catch {
        window.localStorage.removeItem(cacheKey);
      }
    }

    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation not supported");
      return;
    }

    const fetchGeolocation = () => {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude, accuracy } = position.coords;
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
              {
                headers: { "Accept-Language": "en" },
              }
            );
            const data = await response.json();
            const address = data?.address || {};
            const nextLocation: UserLocation = {
              city:
                address.city ||
                address.town ||
                address.village ||
                address.county,
              country: address.country,
              neighborhood: address.neighbourhood,
              suburb: address.suburb,
              postcode: address.postcode,
              accuracy,
              source: "gps",
            };
            setUserLocation(nextLocation);
            window.localStorage.setItem(
              cacheKey,
              JSON.stringify({ data: nextLocation, timestamp: Date.now() })
            );
            setLocationError(null);
          } catch (error) {
            console.error("Error resolving location:", error);
            setLocationError("Unable to resolve location");
          } finally {
            setLocationLoading(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationError("Location permission denied");
          setLocationLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 1000 * 60 * 10,
        }
      );
    };

    fetchGeolocation();
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await Axios.get(`${API_BASE}/api/categories`);
        setCategories(response.data);
      } catch (error: unknown) {
        if (Axios.isAxiosError(error) && error.response?.status === 401) {
          window.location.href =
            process.env.NEXT_PUBLIC_LOGIN_ENDPOINT || "/login";
        }
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Check onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const response = await Axios.get(
          `${API_BASE}/api/preferences/onboarding-status`
        );

        if (!response.data.onboarding_complete) {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      }
    };
    checkOnboarding();
  }, []);

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/chat/unread-count`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadMessages(data.unreadCount || data.unread_count || 0);
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch user's own listings
  const fetchMyListings = async () => {
    try {
      const response = await Axios.get(`${API_BASE}/api/my-listings`);
      setMyListings(response.data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 401) {
        window.location.href =
          process.env.NEXT_PUBLIC_LOGIN_ENDPOINT || "/login";
      }
      console.error("Error fetching my listings:", error);
    }
  };

  // Fetch listings - now uses personalized endpoint
  const fetchListings = async () => {
    setLoading(true);
    try {
      // Check if we have active filters
      const hasFilters = Object.values(filters).some((v) => v !== "");

      if (hasFilters) {
        // Use regular filtered listings
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });

        const response = await Axios.get(
          `${API_BASE}/api/listings?${params.toString()}`
        );
        setListings(sortListingsByLocation(response.data, userLocation));
        setIsPersonalized(false);

        // Record search if there's a search term
        if (filters.search) {
          try {
            await Axios.post(`${API_BASE}/api/preferences/search`, {
              searchTerm: filters.search,
              categoryId: filters.category || null,
            });
          } catch (searchErr) {
            console.log("Could not record search:", searchErr);
          }
        }
      } else {
        // Use personalized listings
        const response = await Axios.get(
          `${API_BASE}/api/personalized-listings`
        );
        setListings(
          sortListingsByLocation(
            response.data.listings || response.data,
            userLocation
          )
        );
        setIsPersonalized(response.data.personalized || false);
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 401) {
        window.location.href =
          process.env.NEXT_PUBLIC_LOGIN_ENDPOINT || "/login";
      }
      console.error("Error fetching listings:", error);

      // Fallback to regular listings
      try {
        const response = await Axios.get(`${API_BASE}/api/listings`);
        setListings(sortListingsByLocation(response.data, userLocation));
      } catch (fallbackErr) {
        console.error("Fallback fetch also failed:", fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch recommended listings based on search history
  const fetchRecommendations = async () => {
    try {
      const response = await Axios.get(
        `${API_BASE}/api/recommended-listings?limit=6`
      );
      if (response.data.listings && response.data.listings.length > 0) {
        setRecommendedListings(response.data.listings);
      }
    } catch (error) {
      console.log("Could not fetch recommendations:", error);
    }
  };

  useEffect(() => {
    fetchListings();
    fetchMyListings();
    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userLocation) {
      setListings((prev) =>
        prev.length > 0 ? sortListingsByLocation(prev, userLocation) : prev
      );
    }
  }, [userLocation]);

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

  // Handle report click (stops event propagation)
  const handleReportClick = (
    e: React.MouseEvent,
    type: "listing" | "user",
    id: number,
    name: string
  ) => {
    e.stopPropagation();
    setReportTarget({ type, id, name });
    setShowReportModal(true);
  };

  // Handle user profile click (stops event propagation)
  const handleUserClick = (e: React.MouseEvent, userId: number) => {
    e.stopPropagation();
    router.push(`/profile/${userId}`);
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    fetchListings();
  };

  const resetFilters = () => {
    setFilters({
      category: "",
      search: "",
      country: "",
      city: "",
      minPrice: "",
      maxPrice: "",
      currency: "",
      condition: "",
    });
    setTimeout(() => fetchListings(), 0);
  };

  const hasActiveFilters = (value: typeof filters) =>
    Object.values(value).some((entry) => String(entry).trim() !== "");

  const fetchSavedSearches = async () => {
    try {
      const response = await Axios.get(
        `${API_BASE}/api/preferences/saved-searches`
      );

      setSavedSearches(response.data.savedSearches || []);
    } catch (error) {
      console.error("Error fetching saved searches:", error);
    }
  };

  const openSaveSearchModal = () => {
    setSaveSearchName(
      filters.search ? `Search: ${filters.search}` : "My Search"
    );
    setSaveSearchNotify(true);
    setSaveSearchError(null);
    setShowSaveSearchModal(true);
  };

  const handleSaveSearch = async () => {
    if (!hasActiveFilters(filters)) {
      setSaveSearchError("Add at least one filter before saving.");
      return;
    }

    if (!saveSearchName.trim()) {
      setSaveSearchError("Please provide a name for this search.");
      return;
    }

    try {
      const response = await Axios.post(
        `${API_BASE}/api/preferences/saved-searches`,
        {
          name: saveSearchName.trim(),
          filters,
          notifyNewListings: saveSearchNotify,
        }
      );

      setSavedSearches((prev) => [response.data.savedSearch, ...prev]);
      setShowSaveSearchModal(false);
    } catch (error: unknown) {
      if (Axios.isAxiosError(error)) {
        setSaveSearchError(
          error.response?.data?.error || "Failed to save search"
        );
      } else {
        setSaveSearchError("Failed to save search");
      }
    }
  };

  const applySavedSearch = (savedSearch: SavedSearch) => {
    setFilters(savedSearch.filters);
    setShowFilters(true);
    setTimeout(() => fetchListings(), 0);
  };

  const toggleSavedSearchAlerts = async (
    savedSearchId: number,
    notify: boolean
  ) => {
    try {
      await Axios.put(
        `${API_BASE}/api/preferences/saved-searches/${savedSearchId}`,
        { notifyNewListings: notify },
        {}
      );

      setSavedSearches((prev) =>
        prev.map((saved) =>
          saved.id === savedSearchId
            ? { ...saved, notify_new_listings: notify }
            : saved
        )
      );
    } catch (error) {
      console.error("Error updating saved search alerts:", error);
    }
  };

  const deleteSavedSearch = async (savedSearchId: number) => {
    try {
      await Axios.delete(
        `${API_BASE}/api/preferences/saved-searches/${savedSearchId}`
      );

      setSavedSearches((prev) =>
        prev.filter((saved) => saved.id !== savedSearchId)
      );
    } catch (error) {
      console.error("Error deleting saved search:", error);
    }
  };

  const fetchWishlistIds = async () => {
    try {
      const response = await Axios.get(`${API_BASE}/api/wishlist/ids`);

      setWishlistIds(response.data.listingIds || []);
    } catch (error) {
      console.error("Error fetching wishlist ids:", error);
    }
  };

  const toggleWishlist = async (e: React.MouseEvent, listingId: number) => {
    e.stopPropagation();
    try {
      setWishlistLoading(listingId);

      if (wishlistIds.includes(listingId)) {
        await Axios.delete(`${API_BASE}/api/wishlist/${listingId}`);
        setWishlistIds((prev) => prev.filter((id) => id !== listingId));
      } else {
        await Axios.post(`${API_BASE}/api/wishlist/${listingId}`);
        setWishlistIds((prev) => [...prev, listingId]);
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    } finally {
      setWishlistLoading(null);
    }
  };

  const formatSavedSearchSummary = (savedFilters: SavedSearch["filters"]) => {
    const summaryParts: string[] = [];

    if (savedFilters.search)
      summaryParts.push(`Search: ${savedFilters.search}`);
    if (savedFilters.category) {
      const categoryLabel =
        categories.find((cat) => String(cat.id) === savedFilters.category)
          ?.name || savedFilters.category;
      summaryParts.push(`Category: ${categoryLabel}`);
    }
    if (savedFilters.country)
      summaryParts.push(`Country: ${savedFilters.country}`);
    if (savedFilters.city) summaryParts.push(`City: ${savedFilters.city}`);
    if (savedFilters.minPrice)
      summaryParts.push(`Min: ${savedFilters.minPrice}`);
    if (savedFilters.maxPrice)
      summaryParts.push(`Max: ${savedFilters.maxPrice}`);
    if (savedFilters.currency)
      summaryParts.push(`Currency: ${savedFilters.currency}`);
    if (savedFilters.condition)
      summaryParts.push(`Condition: ${savedFilters.condition}`);

    return summaryParts.length > 0 ? summaryParts.join(" • ") : "No filters";
  };

  // Mark listing as sold or available
  const toggleListingStatus = async (
    listingId: number,
    currentStatus: string
  ) => {
    try {
      setUpdatingListingStatus(listingId);
      const endpoint =
        currentStatus === "Available"
          ? `${API_BASE}/api/listings/${listingId}/mark-sold`
          : `${API_BASE}/api/listings/${listingId}/mark-available`;

      await Axios.put(endpoint, {});

      // Update the local state
      setMyListings((prev) =>
        prev.map((listing) =>
          listing.id === listingId
            ? {
                ...listing,
                status: currentStatus === "Available" ? "Sold" : "Available",
              }
            : listing
        )
      );
    } catch (error: unknown) {
      console.error("Error updating listing status:", error);
      alert("Failed to update listing status. Please try again.");
    } finally {
      setUpdatingListingStatus(null);
    }
  };

  if (!authChecked) {
    return (
      <LoadingArt
        fullScreen
        label="Loading dashboard"
        subLabel="Setting up your workspace"
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
        {currentUserId && <Notifications userId={currentUserId} />}
        <button
          onClick={() => router.push("/chat")}
          className="relative p-2 bg-white text-green-600 rounded-lg shadow-sm hover:shadow-md transition-all"
          title="Messages"
        >
          <svg
            className="w-6 h-6"
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
          {unreadMessages > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center px-1 bg-red-500 text-white text-xs font-bold rounded-full">
              {unreadMessages > 99 ? "99+" : unreadMessages}
            </span>
          )}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-8">
        <button
          onClick={() => setShowSellModal(true)}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-green-600 via-yellow-500 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 flex items-center gap-2"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Listing
        </button>

        <button
          onClick={() => setShowMyListings(!showMyListings)}
          className={`w-full sm:w-auto px-6 py-3 font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 ${
            showMyListings
              ? "bg-yellow-500 text-white hover:bg-yellow-600"
              : "bg-white border-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50"
          }`}
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
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          My Listings ({myListings.length})
        </button>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full sm:w-auto px-6 py-3 bg-white border-2 border-green-600 text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-all duration-300 flex items-center gap-2"
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {showFilters ? "Hide Filters" : "Search & Filter Listings"}
        </button>
      </div>

      {/* My Listings Section */}
      {showMyListings && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <svg
              className="w-6 h-6 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            My Listings
          </h2>

          {myListings.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-gray-500 text-lg mb-4">
                You haven&apos;t created any listings yet.
              </p>
              <button
                onClick={() => setShowSellModal(true)}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                Create Your First Listing
              </button>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
              {myListings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-white rounded-none md:rounded-2xl md:border md:border-gray-200/80 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                >
                  {/* Moderation Status Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    {listing.moderation_status === "pending" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-500 text-white shadow-md">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Pending Review
                      </span>
                    )}
                    {listing.moderation_status === "approved" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-500 text-white shadow-md">
                        <svg
                          className="w-3 h-3"
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
                        Live
                      </span>
                    )}
                    {listing.moderation_status === "rejected" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500 text-white shadow-md">
                        <svg
                          className="w-3 h-3"
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
                        Rejected
                      </span>
                    )}
                  </div>

                  {/* Image */}
                  <div className="relative aspect-[4/3] sm:aspect-[16/10] bg-gray-200">
                    {listing.images && listing.images.length > 0 ? (
                      <Image
                        src={getImageUrl(listing.images[0].imageurl) || ""}
                        alt={listing.title}
                        width={640}
                        height={384}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-5">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 truncate mb-2">
                      {listing.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {listing.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-lg sm:text-xl font-bold text-green-600">
                        {listing.currency}{" "}
                        {Number(listing.price).toLocaleString("en-US")}
                      </span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full">
                        {listing.category_name}
                      </span>
                    </div>

                    <div className="text-sm text-gray-500 space-y-1 mb-3">
                      <p>
                        📍 {listing.city}, {listing.country}
                      </p>
                      {listing.createdat &&
                        (() => {
                          const timeInfo = formatRelativeTime(
                            listing.createdat
                          );
                          return (
                            <p
                              className={`flex items-center gap-1 ${
                                timeInfo.isNew
                                  ? "text-blue-600 font-medium"
                                  : ""
                              }`}
                            >
                              {timeInfo.isNew ? "🆕" : "🕐"} {timeInfo.text}
                            </p>
                          );
                        })()}
                    </div>

                    {/* Rejection Reason */}
                    {listing.moderation_status === "rejected" &&
                      listing.rejection_reason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                          <p className="text-xs font-semibold text-red-700 mb-1">
                            Rejection Reason:
                          </p>
                          <p className="text-xs text-red-600">
                            {listing.rejection_reason}
                          </p>
                        </div>
                      )}

                    {/* Availability Status & Mark as Sold Button */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-100">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          listing.status === "Available"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {listing.status === "Available" ? (
                          <>
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Available
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Sold
                          </>
                        )}
                      </span>

                      {listing.moderation_status === "approved" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleListingStatus(listing.id, listing.status);
                          }}
                          disabled={updatingListingStatus === listing.id}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                            listing.status === "Available"
                              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          } disabled:opacity-50`}
                        >
                          {updatingListingStatus === listing.id ? (
                            <span className="flex items-center gap-1">
                              <svg
                                className="w-3 h-3 animate-spin"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Updating...
                            </span>
                          ) : listing.status === "Available" ? (
                            "Mark as Sold"
                          ) : (
                            "Mark as Available"
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-200/80 to-transparent md:hidden" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters Section - Conditional Render */}
      {showFilters && (
        <SearchFilters
          filters={filters}
          categories={categories}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          onReset={resetFilters}
          onSaveSearch={openSaveSearchModal}
        />
      )}

      {/* Saved Searches */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              Saved Searches & Alerts
            </h3>
            <p className="text-sm text-gray-500">
              Save filters and get notified when new listings match.
            </p>
          </div>
          <button
            onClick={openSaveSearchModal}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition"
          >
            Save Current Search
          </button>
        </div>

        {savedSearches.length === 0 ? (
          <div className="text-sm text-gray-500">
            No saved searches yet. Apply filters and save them for quick access.
          </div>
        ) : (
          <div className="space-y-3">
            {savedSearches.map((savedSearch) => (
              <div
                key={savedSearch.id}
                className="border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <div className="font-semibold text-gray-800">
                    {savedSearch.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatSavedSearchSummary(savedSearch.filters)}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => applySavedSearch(savedSearch)}
                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() =>
                      toggleSavedSearchAlerts(
                        savedSearch.id,
                        !savedSearch.notify_new_listings
                      )
                    }
                    className={`px-3 py-1.5 text-sm rounded-lg border ${
                      savedSearch.notify_new_listings
                        ? "border-green-500 text-green-600"
                        : "border-gray-300 text-gray-500"
                    }`}
                  >
                    {savedSearch.notify_new_listings
                      ? "Alerts On"
                      : "Alerts Off"}
                  </button>
                  <button
                    onClick={() => deleteSavedSearch(savedSearch.id)}
                    className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Insights (Collapsed by default) */}
      <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 mb-8">
        <button
          type="button"
          onClick={() => setInsightsOpen((prev) => !prev)}
          className="w-full px-4 sm:px-6 py-4 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
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
                  d="M9 17v-2m3 2v-4m3 4V7m-9 8h12"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Performance Insights
              </h2>
              <p className="text-sm text-gray-500">
                Analytics and top sellers are tucked away to keep the dashboard
                tidy.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
            {insightsOpen ? "Hide" : "View"}
            <svg
              className={`w-4 h-4 transition-transform ${
                insightsOpen ? "rotate-180" : ""
              }
              `}
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
          </span>
        </button>

        {insightsOpen && (
          <div className="border-t border-emerald-100">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 px-4 sm:px-6 py-4">
              <button
                type="button"
                onClick={() => setInsightsTab("analytics")}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  insightsTab === "analytics"
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                Performance Analytics
              </button>
              <button
                type="button"
                onClick={() => setInsightsTab("top-sellers")}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  insightsTab === "top-sellers"
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                Top Sellers by Category
              </button>
            </div>

            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
              {insightsTab === "analytics" && <AnalyticsDashboard />}
              {insightsTab === "top-sellers" && <TopSellers className="mb-0" />}
            </div>
          </div>
        )}
      </div>

      {/* Personalized Section Header */}
      {isPersonalized && (
        <div className="mb-4 flex items-center gap-2 text-green-600">
          <span className="text-xl">🎯</span>
          <span className="font-medium">
            Personalized for you based on your interests
          </span>
        </div>
      )}

      {/* Recommended Based on Searches */}
      {recommendedListings.length > 0 && !showFilters && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🔍</span>
            <h3 className="text-lg font-semibold text-gray-700">
              Based on your recent searches
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recommendedListings.slice(0, 6).map((listing) => (
              <div
                key={`rec-${listing.id}`}
                onClick={() => router.push(`/listing/${listing.id}`)}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1"
              >
                <div className="relative h-24 bg-gray-200">
                  {listing.images && listing.images.length > 0 ? (
                    <Image
                      src={getImageUrl(listing.images[0].imageurl) || ""}
                      alt={listing.title}
                      width={320}
                      height={192}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No Image
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <h4 className="text-xs font-medium text-gray-800 truncate">
                    {listing.title}
                  </h4>
                  <p className="text-xs font-bold text-green-600">
                    {listing.currency}{" "}
                    {Number(listing.price).toLocaleString("en-US")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Listings Grid */}
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        {loading ? (
          "Loading..."
        ) : (
          <>
            {isPersonalized ? (
              <>
                <span className="text-2xl">✨</span>
                {`${listings.length} Listings For You`}
              </>
            ) : (
              `${listings.length} Listings Found`
            )}
          </>
        )}
      </h2>

      {userLocation && !loading && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
            Sorted by proximity
          </span>
          {userLocation.city && (
            <span>
              Near {userLocation.city}
              {userLocation.country ? `, ${userLocation.country}` : ""}
            </span>
          )}
          {locationLoading && <span>Updating location...</span>}
          {locationError && !userLocation.city && (
            <span className="text-gray-500">{locationError}</span>
          )}
        </div>
      )}

      {listings.length === 0 && !loading ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <p className="text-gray-500 text-lg">
            No listings found. Try adjusting your filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
          {listings.map((listing) => {
            const timeInfo = formatRelativeTime(listing.createdat);
            const isWishlisted = wishlistIds.includes(listing.id);
            return (
              <div
                key={listing.id}
                onClick={() => router.push(`/listing/${listing.id}`)}
                className="bg-white rounded-none md:rounded-2xl md:border md:border-gray-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] sm:aspect-[16/10] bg-gray-200">
                  {listing.images.length > 0 ? (
                    <Image
                      src={getImageUrl(listing.images[0].imageurl) || ""}
                      alt={listing.title}
                      width={640}
                      height={384}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  {/* New Badge - only show within 24 hours */}
                  {timeInfo.isNew && (
                    <span className="absolute top-2 left-10 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                      ✨ NEW
                    </span>
                  )}
                  {currentUserId && listing.user_id !== currentUserId && (
                    <button
                      onClick={(e) => toggleWishlist(e, listing.id)}
                      disabled={wishlistLoading === listing.id}
                      className={`absolute top-2 right-2 p-1.5 rounded-full shadow-md transition ${
                        isWishlisted
                          ? "bg-red-500 text-white"
                          : "bg-white/90 text-gray-500 hover:text-red-500"
                      }`}
                      title={
                        isWishlisted
                          ? "Remove from wishlist"
                          : "Add to wishlist"
                      }
                    >
                      <svg
                        className="w-4 h-4"
                        fill={isWishlisted ? "currentColor" : "none"}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3.172 5.172a4 4 0 015.656 0L12 8.343l3.172-3.171a4 4 0 115.656 5.656L12 21.657 3.172 10.828a4 4 0 010-5.656z"
                        />
                      </svg>
                    </button>
                  )}
                  {/* Report button */}
                  <button
                    onClick={(e) =>
                      handleReportClick(e, "listing", listing.id, listing.title)
                    }
                    className="absolute top-2 left-2 bg-white/90 hover:bg-white p-1.5 rounded-full shadow-md transition opacity-0 group-hover:opacity-100"
                    title="Report this listing"
                  >
                    <svg
                      className="w-4 h-4 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </button>
                </div>

                {/* User Info Section */}
                <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex items-center gap-3">
                  {currentUserId && listing.user_id === currentUserId ? (
                    // Current user's own listing
                    <div className="flex items-center gap-2">
                      {listing.user_profile_picture ? (
                        <Image
                          src={getImageUrl(listing.user_profile_picture) || ""}
                          alt="You"
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover border-2 border-green-500"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-yellow-500 flex items-center justify-center text-white text-xs font-bold border-2 border-green-500">
                          {getInitials(listing.username)}
                        </div>
                      )}
                      <span className="text-sm font-semibold text-green-600">
                        You
                      </span>
                    </div>
                  ) : (
                    // Other user's listing
                    <button
                      onClick={(e) => handleUserClick(e, listing.user_id)}
                      className="flex items-center gap-2 hover:opacity-80 transition group/user"
                    >
                      {listing.user_profile_picture ? (
                        <Image
                          src={getImageUrl(listing.user_profile_picture) || ""}
                          alt={listing.username}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 group-hover/user:border-green-500 transition"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-yellow-500 flex items-center justify-center text-white text-xs font-bold border-2 border-gray-200 group-hover/user:border-green-500 transition">
                          {getInitials(listing.username)}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-700 group-hover/user:text-green-600 transition">
                        {listing.username}
                      </span>
                    </button>
                  )}
                  {listing.kyc_verified && (
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 rounded-full"
                      title="KYC Verified Seller"
                    >
                      <svg
                        className="w-3 h-3 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}
                  {listing.user_is_suspended && (
                    <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                      Suspended
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 truncate mb-2">
                    {listing.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {listing.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-lg sm:text-xl font-bold text-green-600">
                      {listing.currency}{" "}
                      {Number(listing.price).toLocaleString("en-US")}
                    </span>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full">
                      {listing.category_name}
                    </span>
                  </div>

                  <div className="text-sm text-gray-500 space-y-1">
                    <p>
                      📍 {listing.city}, {listing.country}
                    </p>
                    <div className="flex items-center justify-between">
                      <p>📞 {listing.phone}</p>
                      <span
                        className={`text-xs ${
                          timeInfo.isNew
                            ? "text-blue-600 font-medium"
                            : "text-gray-400"
                        }`}
                      >
                        {timeInfo.isNew ? "🆕 " : "🕐 "}
                        {timeInfo.text}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-200/80 to-transparent md:hidden" />
              </div>
            );
          })}
        </div>
      )}
      {showSaveSearchModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-4 sm:p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">Save Search</h3>
              <p className="text-sm text-gray-500">
                Save your current filters and enable alerts.
              </p>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Name
                </label>
                <input
                  value={saveSearchName}
                  onChange={(e) => setSaveSearchName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. Budget Laptops"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={saveSearchNotify}
                  onChange={(e) => setSaveSearchNotify(e.target.checked)}
                  className="h-4 w-4 text-green-600 border-gray-300 rounded"
                />
                Notify me when new listings match
              </label>
              {saveSearchError && (
                <p className="text-sm text-red-600">{saveSearchError}</p>
              )}
            </div>
            <div className="p-4 sm:p-6 border-t bg-gray-50 flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setShowSaveSearchModal(false)}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSearch}
                className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save Search
              </button>
            </div>
          </div>
        </div>
      )}

      <SellModal
        isOpen={showSellModal}
        onClose={() => {
          setShowSellModal(false);
          fetchListings(); // Refresh listings after creating new one
          fetchMyListings(); // Also refresh user's own listings
        }}
      />

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setReportTarget(null);
          }}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          targetName={reportTarget.name}
        />
      )}

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={() => {
          setShowOnboarding(false);
          fetchListings(); // Refresh with personalized listings
        }}
        onSkip={() => {
          setShowOnboarding(false);
        }}
      />

      {/* Suspension Banner */}
      <SuspensionBanner />

      {/* Browser Notification Permission Banner */}
      <NotificationPermissionBanner />
    </main>
  );
}
