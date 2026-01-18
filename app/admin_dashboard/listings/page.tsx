"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Axios from "axios";
import PageHeader from "../../components/PageHeader";

// Configure axios defaults
Axios.defaults.withCredentials = true;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// =====================================================
// TYPE DEFINITIONS
// =====================================================

interface ListingImage {
  id: number;
  listingid: number;
  imageurl: string;
  is_main: boolean;
}

interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  category_name: string;
  categoryid: number;
  location: string;
  country: string;
  city: string;
  condition: string;
  phone: string;
  tags: string[];
  status: string;
  moderation_status: string;
  rejection_reason: string | null;
  reviewed_by: number | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  createdat: string;
  userid: number;
  username: string;
  useremail: string;
  userverified: boolean;
  userprofilepicture: string | null;
  images: ListingImage[];
}

interface ListingStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function AdminListingsPage() {
  const router = useRouter();

  // State management
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<ListingStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "pending" | "approved" | "rejected" | "all"
  >("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // =====================================================
  // API CALLS
  // =====================================================

  const fetchStats = useCallback(async () => {
    try {
      const response = await Axios.get(
        `${API_BASE}/api/admin/listings/stats`,
        {}
      );
      setStats(response.data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number } };
      if (
        axiosError.response?.status === 401 ||
        axiosError.response?.status === 403
      ) {
        router.push("/auth/admin");
      }
      console.error("Error fetching stats:", error);
    }
  }, [router]);

  const fetchListings = useCallback(
    async (status?: string, page: number = 1) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
        });

        if (status && status !== "all") {
          params.append("status", status);
        }
        if (searchQuery) {
          params.append("search", searchQuery);
        }

        const response = await Axios.get(
          `${API_BASE}/api/admin/listings/all?${params.toString()}`,
          {}
        );

        setListings(response.data.listings);
        setPagination(response.data.pagination);
      } catch (error: unknown) {
        const axiosError = error as { response?: { status?: number } };
        if (
          axiosError.response?.status === 401 ||
          axiosError.response?.status === 403
        ) {
          router.push("/auth/admin");
        }
        console.error("Error fetching listings:", error);
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit, searchQuery, router]
  );

  const approveListing = async (id: number) => {
    try {
      setActionLoading(true);
      await Axios.put(`${API_BASE}/api/admin/listings/${id}/approve`, {}, {});

      showNotification("success", "Listing approved successfully!");
      fetchListings(activeTab, pagination.page);
      fetchStats();
      setShowDetailModal(false);
      setSelectedListing(null);
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { status?: number; data?: { error?: string } };
      };
      console.error("Error approving listing:", error);
      showNotification(
        "error",
        axiosError.response?.data?.error || "Failed to approve listing"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const rejectListing = async (id: number) => {
    if (!rejectionReason.trim()) {
      showNotification("error", "Please provide a rejection reason");
      return;
    }

    try {
      setActionLoading(true);
      await Axios.put(
        `${API_BASE}/api/admin/listings/${id}/reject`,
        { reason: rejectionReason },
        {}
      );

      showNotification("success", "Listing rejected");
      fetchListings(activeTab, pagination.page);
      fetchStats();
      setShowRejectModal(false);
      setShowDetailModal(false);
      setSelectedListing(null);
      setRejectionReason("");
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { status?: number; data?: { error?: string } };
      };
      console.error("Error rejecting listing:", error);
      showNotification(
        "error",
        axiosError.response?.data?.error || "Failed to reject listing"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // HELPER FUNCTIONS
  // =====================================================

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            Pending Review
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  // =====================================================
  // EFFECTS
  // =====================================================

  useEffect(() => {
    fetchStats();
    fetchListings(activeTab);
  }, [activeTab, fetchStats, fetchListings]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery !== undefined) {
        fetchListings(activeTab, 1);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeTab, fetchListings]);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
      <PageHeader
        title="Listing Management"
        description="Review, approve, or reject user listings."
        actions={
          <button
            onClick={() => router.push("/admin_dashboard")}
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
            Back to Dashboard
          </button>
        }
      />

      {/* Notification */}
      {notification && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            notification.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-auto text-gray-500 hover:text-gray-700"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div
          className={`bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md ${
            activeTab === "pending" ? "ring-2 ring-yellow-500" : ""
          }`}
          onClick={() => setActiveTab("pending")}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg
                className="w-6 h-6 text-yellow-600"
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
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {stats.pending}
              </p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </div>

        <div
          className={`bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md ${
            activeTab === "approved" ? "ring-2 ring-green-500" : ""
          }`}
          onClick={() => setActiveTab("approved")}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
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
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {stats.approved}
              </p>
              <p className="text-sm text-gray-500">Approved</p>
            </div>
          </div>
        </div>

        <div
          className={`bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md ${
            activeTab === "rejected" ? "ring-2 ring-red-500" : ""
          }`}
          onClick={() => setActiveTab("rejected")}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <svg
                className="w-6 h-6 text-red-600"
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
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {stats.rejected}
              </p>
              <p className="text-sm text-gray-500">Rejected</p>
            </div>
          </div>
        </div>

        <div
          className={`bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md ${
            activeTab === "all" ? "ring-2 ring-blue-500" : ""
          }`}
          onClick={() => setActiveTab("all")}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
          <input
            type="text"
            placeholder="Search listings by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
        </div>
      </div>

      {/* Listings Table/Cards */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
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
            <h3 className="text-lg font-medium text-gray-700">
              No listings found
            </h3>
            <p className="text-gray-500 mt-1">
              {activeTab === "pending"
                ? "No pending listings to review"
                : "No listings match your criteria"}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Listing
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Seller
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listings.map((listing) => (
                    <tr
                      key={listing.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {listing.images && listing.images.length > 0 ? (
                              <img
                                src={listing.images[0].imageurl}
                                alt={listing.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg
                                  className="w-8 h-8 text-gray-300"
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
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate max-w-xs">
                              {listing.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {listing.category_name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {listing.city}, {listing.country}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">
                            {listing.username}
                          </span>
                          {listing.userverified && (
                            <svg
                              className="w-4 h-4 text-green-500"
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
                        </div>
                        <p className="text-xs text-gray-400">
                          {listing.useremail}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-gray-800">
                          {formatPrice(listing.price, listing.currency)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(listing.moderation_status)}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-500">
                          {formatDate(listing.createdat)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedListing(listing);
                              setShowDetailModal(true);
                            }}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          {listing.moderation_status === "pending" && (
                            <>
                              <button
                                onClick={() => approveListing(listing.id)}
                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                                title="Approve"
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
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedListing(listing);
                                  setShowRejectModal(true);
                                }}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                title="Reject"
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
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100">
              {listings.map((listing) => (
                <div key={listing.id} className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {listing.images && listing.images.length > 0 ? (
                        <img
                          src={listing.images[0].imageurl}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-300"
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
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {listing.title}
                        </h3>
                        {getStatusBadge(listing.moderation_status)}
                      </div>
                      <p className="text-sm text-gray-500">
                        {listing.category_name}
                      </p>
                      <p className="text-sm font-semibold text-gray-800 mt-1">
                        {formatPrice(listing.price, listing.currency)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">
                          by {listing.username}
                        </span>
                        {listing.userverified && (
                          <svg
                            className="w-3 h-3 text-green-500"
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
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-3">
                    <button
                      onClick={() => {
                        setSelectedListing(listing);
                        setShowDetailModal(true);
                      }}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      View
                    </button>
                    {listing.moderation_status === "pending" && (
                      <>
                        <button
                          onClick={() => approveListing(listing.id)}
                          className="px-3 py-1.5 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedListing(listing);
                            setShowRejectModal(true);
                          }}
                          className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} listings
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      fetchListings(activeTab, pagination.page - 1)
                    }
                    disabled={pagination.page === 1}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg">
                    {pagination.page}
                  </span>
                  <button
                    onClick={() =>
                      fetchListings(activeTab, pagination.page + 1)
                    }
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {/* Detail Modal */}
      {showDetailModal && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                Listing Details
              </h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedListing(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
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

            {/* Modal Content */}
            <div className="p-4 sm:p-6">
              {/* Status Banner */}
              <div
                className={`rounded-lg p-4 mb-6 ${
                  selectedListing.moderation_status === "pending"
                    ? "bg-yellow-50 border border-yellow-200"
                    : selectedListing.moderation_status === "approved"
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(selectedListing.moderation_status)}
                    {selectedListing.reviewed_at && (
                      <span className="text-sm text-gray-500">
                        Reviewed on {formatDate(selectedListing.reviewed_at)}
                        {selectedListing.reviewed_by_name &&
                          ` by ${selectedListing.reviewed_by_name}`}
                      </span>
                    )}
                  </div>
                </div>
                {selectedListing.rejection_reason && (
                  <div className="mt-3 p-3 bg-white rounded-lg">
                    <p className="text-sm font-medium text-red-700">
                      Rejection Reason:
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      {selectedListing.rejection_reason}
                    </p>
                  </div>
                )}
              </div>

              {/* Images Gallery */}
              {selectedListing.images && selectedListing.images.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Images
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {selectedListing.images.map((image, index) => (
                      <div
                        key={image.id}
                        className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                      >
                        <img
                          src={image.imageurl}
                          alt={`${selectedListing.title} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {image.is_main && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                            Main
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Listing Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Listing Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500">Title</label>
                      <p className="font-semibold text-gray-800">
                        {selectedListing.title}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">
                        Description
                      </label>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {selectedListing.description}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500">Price</label>
                        <p className="font-semibold text-gray-800">
                          {formatPrice(
                            selectedListing.price,
                            selectedListing.currency
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">
                          Condition
                        </label>
                        <p className="text-gray-700 capitalize">
                          {selectedListing.condition}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500">
                          Category
                        </label>
                        <p className="text-gray-700">
                          {selectedListing.category_name}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">
                          Location
                        </label>
                        <p className="text-gray-700">
                          {selectedListing.city}, {selectedListing.country}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">
                        Contact Phone
                      </label>
                      <p className="text-gray-700">{selectedListing.phone}</p>
                    </div>
                    {selectedListing.tags &&
                      selectedListing.tags.length > 0 && (
                        <div>
                          <label className="text-xs text-gray-500">Tags</label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedListing.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Seller Information
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                        {selectedListing.userprofilepicture ? (
                          <img
                            src={selectedListing.userprofilepicture}
                            alt={selectedListing.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-gray-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-800">
                            {selectedListing.username}
                          </p>
                          {selectedListing.userverified && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
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
                        <p className="text-sm text-gray-500">
                          {selectedListing.useremail}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-xs text-gray-500">
                      Submitted On
                    </label>
                    <p className="text-gray-700">
                      {formatDate(selectedListing.createdat)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            {selectedListing.moderation_status === "pending" && (
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(true);
                  }}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-6 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Reject Listing
                </button>
                <button
                  onClick={() => approveListing(selectedListing.id)}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-6 py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Approve Listing
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <svg
                    className="w-6 h-6 text-red-600"
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
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    Reject Listing
                  </h3>
                  <p className="text-sm text-gray-500">
                    Please provide a reason for rejection
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this listing is being rejected..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This message will be sent to the seller.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason("");
                  }}
                  className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => rejectListing(selectedListing.id)}
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="w-full sm:w-auto px-6 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    "Reject Listing"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
