"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Axios from "axios";
Axios.defaults.withCredentials = true;

// â”€â”€â”€ types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type IconCfg = { bg: string; fg: string; path: string };

const ICON_MAP: Record<string, IconCfg> = {
  kyc_approved: {
    bg: "bg-emerald-50",
    fg: "text-emerald-600",
    path: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  kyc_rejected: {
    bg: "bg-red-50",
    fg: "text-red-600",
    path: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  warning: {
    bg: "bg-amber-50",
    fg: "text-amber-600",
    path: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  },
  info: {
    bg: "bg-blue-50",
    fg: "text-blue-600",
    path: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  saved_search_match: {
    bg: "bg-violet-50",
    fg: "text-violet-600",
    path: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  },
  price_drop: {
    bg: "bg-teal-50",
    fg: "text-teal-600",
    path: "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6",
  },
  success: {
    bg: "bg-emerald-50",
    fg: "text-emerald-600",
    path: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
};

const DEFAULT_ICON: IconCfg = {
  bg: "bg-gray-100",
  fg: "text-gray-400",
  path: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
};

function getLink(n: Notification): string | null {
  const { type, relatedtype, relatedid } = n;
  if (relatedid) {
    if (relatedtype === "listing") return `/listing/${relatedid}`;
    if (relatedtype === "conversation")
      return `/chat?conversation=${relatedid}`;
  }
  if (type === "kyc_approved" || type === "kyc_rejected") return "/profile";
  if (type === "saved_search_match" || type === "price_drop")
    return relatedid ? `/listing/${relatedid}` : "/dashboard";
  return "/dashboard";
}

function getTimeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function NIcon({ type }: { type: string }) {
  const c = ICON_MAP[type] ?? DEFAULT_ICON;
  return (
    <span
      className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${c.bg}`}
    >
      <svg
        className={`h-4 w-4 ${c.fg}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={c.path} />
      </svg>
    </span>
  );
}

// â”€â”€â”€ types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface Notification {
  id: number;
  userid: number;
  title: string;
  message: string;
  type: string;
  isread: boolean;
  relatedid: number | null;
  relatedtype: string | null;
  createdat: string;
}

interface NotificationsProps {
  userId: number;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://njimbong-backend-production.up.railway.app";

// --- notification item --------------------------------------------------------

function NotificationItem({
  notification: n,
  onClick,
  onDismiss,
}: {
  notification: Notification;
  onClick: (n: Notification) => void;
  onDismiss: (e: React.MouseEvent, id: number) => void;
}) {
  return (
    <li
      className={`group relative flex cursor-pointer items-start gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50/80 `}
      onClick={() => onClick(n)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick(n)}
    >
      {!n.isread && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
      )}
      <NIcon type={n.type} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-xs leading-snug `}>{n.title}</p>
          <span className="flex-shrink-0 text-[10px] tabular-nums text-gray-400 mt-0.5">
            {getTimeAgo(n.createdat)}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-gray-500 line-clamp-2 leading-snug">
          {n.message}
        </p>
        <span className="mt-1 inline-block text-[10px] font-medium text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity">
          View details
        </span>
      </div>
      <button
        onClick={(e) => onDismiss(e, n.id)}
        aria-label="Dismiss notification"
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 mt-0.5 flex h-5 w-5 items-center justify-center rounded text-gray-300 hover:text-gray-600 hover:bg-gray-200 transition-all"
      >
        <svg
          className="h-3 w-3"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </li>
  );
}

// --- main component -----------------------------------------------------------

export default function Notifications({ userId }: NotificationsProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await Axios.get(
        `${API_BASE}/api/notifications/${userId}/unread-count`,
      );
      setUnreadCount(res.data.unreadCount ?? 0);
    } catch {
      /* silent */
    }
  }, [userId]);

  const fetchNotifications = useCallback(
    async (lim: number) => {
      try {
        setLoading(true);
        const res = await Axios.get(
          `${API_BASE}/api/notifications/${userId}?limit=${lim}&offset=0`,
        );
        setNotifications(res.data.notifications ?? []);
        setUnreadCount(res.data.unreadCount ?? 0);
        setTotal(res.data.total ?? res.data.notifications?.length ?? 0);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    fetchUnreadCount();
    const id = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(id);
  }, [fetchUnreadCount]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isOpen) fetchNotifications(limit);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onMouse = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", onMouse);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouse);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await Axios.put(`${API_BASE}/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isread: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* silent */
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await Axios.put(`${API_BASE}/api/notifications/user/${userId}/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isread: true })));
      setUnreadCount(0);
    } catch {
      /* silent */
    }
  }, [userId]);

  const dismiss = useCallback(
    async (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      try {
        await Axios.delete(`${API_BASE}/api/notifications/${id}`);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        fetchUnreadCount();
      } catch {
        /* silent */
      }
    },
    [fetchUnreadCount],
  );

  const handleItemClick = useCallback(
    (n: Notification) => {
      if (!n.isread) markAsRead(n.id);
      const link = getLink(n);
      if (link) {
        setIsOpen(false);
        router.push(link);
      }
    },
    [markAsRead, router],
  );

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    const next = limit + 20;
    setLoadingMore(true);
    setLimit(next);
    await fetchNotifications(next);
    setLoadingMore(false);
  }, [limit, fetchNotifications, loadingMore]);

  const displayed =
    filter === "unread"
      ? notifications.filter((n) => !n.isread)
      : notifications;
  const hasMore = notifications.length < total && total > 10;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors `}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] md:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="fixed inset-x-3 top-[4.25rem] z-50 flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl shadow-black/10 md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-[22rem]"
            style={{ maxHeight: "min(520px, calc(100dvh - 5.5rem))" }}
          >
            <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-900">
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="rounded px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close"
                  className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex flex-shrink-0 gap-1 border-b border-gray-100 px-4 pt-1.5">
              {(["all", "unread"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`pb-2 px-1 text-xs font-medium border-b-2 transition-colors `}
                >
                  {f === "all" ? (
                    "All"
                  ) : (
                    <span className="flex items-center gap-1.5">
                      Unread
                      {unreadCount > 0 && (
                        <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-100 px-1 text-[9px] font-bold text-red-600">
                          {unreadCount}
                        </span>
                      )}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {loading && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-emerald-600" />
                  <span className="text-xs text-gray-400">
                    Loading notifications...
                  </span>
                </div>
              ) : displayed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    {filter === "unread"
                      ? "No unread notifications"
                      : "No notifications yet"}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {filter === "unread"
                      ? "You are all caught up."
                      : "Activity from your listings and purchases will appear here."}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {displayed.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onClick={handleItemClick}
                      onDismiss={dismiss}
                    />
                  ))}
                </ul>
              )}
              {hasMore && (
                <div className="border-t border-gray-100 px-4 py-3">
                  <button
                    onClick={loadMore}
                    disabled={loading || loadingMore}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loadingMore ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-300 border-t-emerald-700" />
                        Loading more notifications...
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                        Load more notifications
                      </>
                    )}
                  </button>
                  <p className="mt-1.5 text-center text-[11px] text-gray-400">
                    Showing {notifications.length} of {total}
                  </p>
                </div>
              )}
              {loading && notifications.length > 0 && (
                <div className="flex justify-center py-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-emerald-600" />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
