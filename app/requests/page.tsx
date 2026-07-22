"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Axios from "axios";
import Image from "next/image";
import PostRequestModal from "../components/PostRequestModal";
import FulfillRequestModal from "../components/FulfillRequestModal";
import AppShellWrapper from "../components/AppShellWrapper";

Axios.defaults.withCredentials = true;
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Category {
  id: number;
  name: string;
}

interface BuyerRequest {
  id: number;
  title: string;
  description: string;
  category_id: number | null;
  category_name: string | null;
  tags: string[] | null;
  image_url: string | null;
  budget_min: number | null;
  budget_max: number | null;
  currency: string;
  country: string | null;
  city: string | null;
  status: string;
  view_count: number;
  fulfillment_count: number;
  created_at: string;
  expires_at: string;
  user_id: number;
  username: string;
  user_avatar: string | null;
  user_kyc_status: string | null;
}

interface CurrentUser {
  id: number;
  name: string;
  email: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function formatBudget(req: BuyerRequest): string | null {
  if (!req.budget_min && !req.budget_max) return null;
  const fmt = (n: number) => n.toLocaleString("en-US");
  if (req.budget_min && req.budget_max) {
    return `${req.currency} ${fmt(req.budget_min)} – ${fmt(req.budget_max)}`;
  }
  if (req.budget_min) return `${req.currency} ${fmt(req.budget_min)}+`;
  return `Up to ${req.currency} ${fmt(req.budget_max!)}`;
}

const AVATAR_COLORS = [
  "bg-emerald-100 text-emerald-700",
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

// ── Request Card ──────────────────────────────────────────────────────────────
function RequestCard({
  req,
  currentUserId,
  onFulfill,
  onDelete,
}: {
  req: BuyerRequest;
  currentUserId: number | null;
  onFulfill: (r: BuyerRequest) => void;
  onDelete: (id: number) => void;
}) {
  const budget = formatBudget(req);
  const isOwner = currentUserId === req.user_id;
  const expiresIn = Math.max(
    0,
    Math.ceil((new Date(req.expires_at).getTime() - Date.now()) / 86400000),
  );

  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col group">
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-orange-400" />

      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Header row: avatar + user + time */}
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor(req.username)}`}
          >
            {req.user_avatar ? (
              <Image
                src={req.user_avatar}
                alt={req.username}
                width={32}
                height={32}
                className="rounded-full object-cover w-full h-full"
              />
            ) : (
              req.username.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-gray-700 truncate block">
              {req.username}
              {req.user_kyc_status === "approved" && (
                <span className="ml-1 inline-flex items-center">
                  <svg
                    className="w-3 h-3 text-blue-500"
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
            </span>
            <span className="text-xs text-gray-400">
              {timeAgo(req.created_at)}
            </span>
          </div>
          <span className="flex-shrink-0 text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
            Wanted
          </span>
        </div>

        {/* Image + content */}
        <div className="flex gap-3 mb-3">
          {req.image_url && (
            <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden border border-gray-100">
              <Image
                src={req.image_url}
                alt={req.title}
                width={96}
                height={96}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug mb-1.5 line-clamp-2">
              {req.title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed line-clamp-3">
              {req.description}
            </p>
          </div>
        </div>

        {/* Tags / metadata chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {req.category_name && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
              {req.category_name}
            </span>
          )}
          {(req.city || req.country) && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {[req.city, req.country].filter(Boolean).join(", ")}
            </span>
          )}
          {budget && (
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.028 2.353 1.118V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.028-2.354-1.118V5z"
                  clipRule="evenodd"
                />
              </svg>
              {budget}
            </span>
          )}
          {req.tags?.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer: stats + CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              {req.view_count}
            </span>
            <span className="flex items-center gap-1 font-semibold text-emerald-600">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {req.fulfillment_count} seller
              {req.fulfillment_count !== 1 ? "s" : ""} responded
            </span>
          </div>

          {/* Actions */}
          {isOwner ? (
            <button
              onClick={() => onDelete(req.id)}
              className="text-xs text-red-500 hover:text-red-700 font-medium transition px-2 py-1 rounded-lg hover:bg-red-50"
            >
              Close Request
            </button>
          ) : (
            <button
              onClick={() => onFulfill(req)}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm shadow-emerald-600/20 flex items-center gap-1.5"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              I Have This
            </button>
          )}
        </div>

        {/* Expiry hint */}
        {expiresIn <= 5 && (
          <p className="text-xs text-orange-500 mt-2 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Expires in {expiresIn} day{expiresIn !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </article>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({
  hasFilters,
  onPost,
}: {
  hasFilters: boolean;
  onPost: () => void;
}) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-5">
        <svg
          className="w-10 h-10 text-amber-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        {hasFilters ? "No matching requests" : "No requests yet"}
      </h3>
      <p className="text-sm text-gray-500 max-w-sm leading-relaxed mb-6">
        {hasFilters
          ? "Try adjusting your filters or search term."
          : "Be the first to post a request! If you can't find what you need in the marketplace, ask here and let sellers come to you."}
      </p>
      {!hasFilters && (
        <button
          onClick={onPost}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-amber-500/25"
        >
          Post the First Request
        </button>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RequestsPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Modals
  const [showPostModal, setShowPostModal] = useState(false);
  const [fulfillTarget, setFulfillTarget] = useState<BuyerRequest | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  // My Requests tab
  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");
  const [myRequests, setMyRequests] = useState<BuyerRequest[]>([]);
  const [myLoading, setMyLoading] = useState(false);

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  // Fetch current user
  useEffect(() => {
    Axios.get(`${API_BASE}/api/users/me`, { withCredentials: true })
      .then((r) => setCurrentUser(r.data))
      .catch(() => setCurrentUser(null));
  }, []);

  // Fetch categories
  useEffect(() => {
    Axios.get(`${API_BASE}/api/categories`)
      .then((r) => setCategories(r.data))
      .catch(() => {});
  }, []);

  // Fetch all requests
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 24 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedCategory) params.category = selectedCategory;

      const r = await Axios.get(`${API_BASE}/api/requests`, { params });
      setRequests(r.data.requests);
      setTotalPages(r.data.pages);
      setTotal(r.data.total);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedCategory]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Fetch my requests
  const fetchMyRequests = useCallback(async () => {
    if (!currentUser) return;
    setMyLoading(true);
    try {
      const r = await Axios.get(`${API_BASE}/api/requests/mine`, {
        withCredentials: true,
      });
      setMyRequests(r.data.requests);
    } catch {
      setMyRequests([]);
    } finally {
      setMyLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeTab === "mine") fetchMyRequests();
  }, [activeTab, fetchMyRequests]);

  function handleFulfillSuccess(listingId: number) {
    setSuccessMessage(
      "Listing created! The buyer has been notified and can now proceed to purchase.",
    );
    fetchRequests();
    setTimeout(() => {
      router.push(`/listing/${listingId}`);
    }, 2500);
  }

  async function handleDeleteRequest(id: number) {
    if (!confirm("Close this request? This cannot be undone.")) return;
    try {
      await Axios.delete(`${API_BASE}/api/requests/${id}`, {
        withCredentials: true,
      });
      fetchRequests();
      fetchMyRequests();
      setSuccessMessage("Your request has been closed.");
    } catch {
      alert("Failed to delete request.");
    }
  }

  function handlePostSuccess() {
    setSuccessMessage(
      "Your request has been submitted and is pending admin review. It will appear once approved.",
    );
    setPage(1);
    fetchRequests();
    if (activeTab === "mine") fetchMyRequests();
  }

  const hasFilters = !!(debouncedSearch || selectedCategory);

  const displayRequests = activeTab === "mine" ? myRequests : requests;
  const displayLoading = activeTab === "mine" ? myLoading : loading;

  return (
    <AppShellWrapper>
      <main className="min-h-screen bg-gray-50">
        {/* ── Hero header ── */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-amber-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                    Buyer Requests
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                  Can&apos;t find it? Request it.
                </h1>
                <p className="text-gray-500 mt-1.5 text-sm sm:text-base max-w-lg">
                  Post what you&apos;re looking for — sellers who have it will
                  create a listing and you can pay via secure escrow.
                </p>
                {/* Stats */}
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-sm text-gray-400">
                    <strong className="text-gray-700">{total}</strong> active
                    request{total !== 1 ? "s" : ""}
                  </span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  <span className="text-sm text-gray-400">
                    Secure escrow payments
                  </span>
                </div>
              </div>

              {currentUser ? (
                <button
                  onClick={() => setShowPostModal(true)}
                  className="self-start sm:self-auto flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition shadow-lg shadow-amber-500/25 text-sm flex-shrink-0"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Post a Request
                </button>
              ) : (
                <a
                  href="/login"
                  className="self-start sm:self-auto flex items-center gap-2 px-5 py-3 border-2 border-amber-500 text-amber-600 font-semibold rounded-xl transition hover:bg-amber-50 text-sm flex-shrink-0"
                >
                  Sign in to Post a Request
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── How it works ── */}
        <div className="bg-amber-50 border-b border-amber-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 text-xs sm:text-sm text-amber-800">
              {[
                { n: "1", text: "Buyer posts a detailed request" },
                {
                  n: "2",
                  text: "Seller with the item fulfills it — listing is auto-created",
                },
                {
                  n: "3",
                  text: "Buyer is notified and pays via secure escrow",
                },
              ].map((step) => (
                <div key={step.n} className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {step.n}
                  </div>
                  <span className="font-medium">{step.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* ── Success toast ── */}
          {successMessage && (
            <div className="mb-5 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
              <svg
                className="w-5 h-5 text-emerald-500 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm font-semibold text-emerald-800 flex-1">
                {successMessage}
              </p>
              <button
                onClick={() => setSuccessMessage("")}
                className="text-emerald-400 hover:text-emerald-600 transition"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* ── Tabs (All / Mine) ── */}
          {currentUser && (
            <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
              {(["all", "mine"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={[
                    "px-4 py-2 rounded-lg text-sm font-semibold transition",
                    activeTab === tab
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700",
                  ].join(" ")}
                >
                  {tab === "all" ? "All Requests" : "My Requests"}
                </button>
              ))}
            </div>
          )}

          {/* ── Filters (All tab only) ── */}
          {activeTab === "all" && (
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {/* Search */}
              <div className="relative flex-1">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search requests…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm transition bg-white"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
              {/* Category filter */}
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="py-2.5 px-4 rounded-xl border border-gray-200 focus:border-amber-400 outline-none text-sm bg-white sm:w-52 transition"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Clear filters */}
              {hasFilters && (
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("");
                    setPage(1);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 text-sm font-medium transition hover:bg-gray-50"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* ── Grid ── */}
          {displayLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-100 h-64 animate-pulse"
                >
                  <div className="h-1 w-full bg-amber-200 rounded-t-2xl" />
                  <div className="p-5 space-y-3">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                        <div className="h-2.5 bg-gray-100 rounded w-1/3" />
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                    <div className="h-3 bg-gray-100 rounded" />
                    <div className="h-3 bg-gray-100 rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayRequests.length === 0 ? (
            <div className="grid grid-cols-1">
              <EmptyState
                hasFilters={hasFilters}
                onPost={() => setShowPostModal(true)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayRequests.map((req) => (
                <RequestCard
                  key={req.id}
                  req={req}
                  currentUserId={currentUser?.id ?? null}
                  onFulfill={(r) => {
                    if (!currentUser) {
                      router.push("/login");
                      return;
                    }
                    setFulfillTarget(r);
                  }}
                  onDelete={handleDeleteRequest}
                />
              ))}
            </div>
          )}

          {/* ── Pagination (all tab) ── */}
          {activeTab === "all" && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Previous
              </button>
              <span className="px-4 py-2.5 text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition"
              >
                Next
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* ── Modals ── */}
        <PostRequestModal
          isOpen={showPostModal}
          onClose={() => setShowPostModal(false)}
          onSuccess={handlePostSuccess}
        />

        {fulfillTarget && (
          <FulfillRequestModal
            isOpen={true}
            onClose={() => setFulfillTarget(null)}
            onSuccess={handleFulfillSuccess}
            request={fulfillTarget}
          />
        )}
      </main>
    </AppShellWrapper>
  );
}
