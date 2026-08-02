"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import SellModal from "./SellModal";
import { useLanguage } from "../i18n/LanguageContext";

const AUTH_ROUTES = new Set([
  "/dashboard",
  "/favorites",
  "/chat",
  "/profile",
  "/safety-trust",
]);

function isAuthRoute(pathname: string) {
  return (
    AUTH_ROUTES.has(pathname) ||
    pathname.startsWith("/listing/") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile")
  );
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const API_BASE = useMemo(() => process.env.NEXT_PUBLIC_API_URL || "", []);
  const { t } = useLanguage();
  const nav = t("nav");
  const common = t("common");
  const dash = t("dashboard");

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users/me`, {
        credentials: "include",
        cache: "no-store",
      });
      setLoggedIn(res.ok);
    } catch {
      setLoggedIn(false);
    }
  }, [API_BASE]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/chat/unread-count`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadMessages(data.unreadCount || data.unread_count || 0);
      }
    } catch {
      // Silently ignore
    }
  }, [API_BASE]);

  useEffect(() => {
    checkAuth();
    const handler = () => checkAuth();
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, [checkAuth]);

  // Re-check auth on route change
  useEffect(() => {
    checkAuth();
  }, [pathname, checkAuth]);

  // Poll unread message count
  useEffect(() => {
    if (!loggedIn) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [loggedIn, fetchUnreadCount]);

  if (!loggedIn || !isAuthRoute(pathname)) return null;

  const isDashboard = pathname === "/dashboard";

  function goTo(tab: "my-listings" | "search") {
    if (isDashboard) {
      window.dispatchEvent(new CustomEvent("mobileNav", { detail: { tab } }));
    } else {
      router.push(`/dashboard?tab=${tab}`);
    }
  }

  return (
    <>
      {/* Bottom Nav Bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch h-16">
          {/* Home */}
          <button
            onClick={() => router.push("/dashboard")}
            aria-label="Home"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              isDashboard
                ? "text-green-600"
                : "text-gray-500 hover:text-green-600"
            }`}
          >
            <svg
              className="w-6 h-6"
              fill={isDashboard ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={isDashboard ? 0 : 1.8}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75v-4.5h-4.5V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z"
              />
            </svg>
            <span className="text-[10px] font-medium">{nav.marketplace}</span>
          </button>

          {/* Search & Filter */}
          <button
            onClick={() => goTo("search")}
            aria-label="Search & Filter"
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-500 hover:text-green-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <span className="text-[10px] font-medium">{common.search}</span>
          </button>

          {/* Sell (center CTA) */}
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={() => setShowSellModal(true)}
              aria-label="Create Listing"
              className="w-14 h-14 -mt-5 rounded-full bg-gradient-to-br from-green-600 to-green-500 text-white shadow-lg flex items-center justify-center hover:scale-105 hover:shadow-xl transition-all duration-200 active:scale-95"
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>

          {/* My Listings */}
          <button
            onClick={() => goTo("my-listings")}
            aria-label="My Listings"
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-500 hover:text-yellow-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span className="text-[10px] font-medium">
              {dash.tabs.myListings}
            </span>
          </button>

          {/* Chat */}
          <button
            onClick={() => router.push("/chat")}
            aria-label="Chat"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              pathname === "/chat"
                ? "text-green-600"
                : "text-gray-500 hover:text-green-600"
            }`}
          >
            <span className="relative">
              <svg
                className="w-6 h-6"
                fill={pathname === "/chat" ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={pathname === "/chat" ? 0 : 1.8}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                />
              </svg>
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 flex items-center justify-center px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full leading-none">
                  {unreadMessages > 99 ? "99+" : unreadMessages}
                </span>
              )}
            </span>
            <span className="text-[10px] font-medium">{nav.chat}</span>
          </button>
        </div>
      </nav>

      {/* Sell Modal */}
      <SellModal
        isOpen={showSellModal}
        onClose={() => setShowSellModal(false)}
      />
    </>
  );
}
