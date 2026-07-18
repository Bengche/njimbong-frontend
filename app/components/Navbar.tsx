"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Notifications from "./Notifications";

interface AuthUser {
  id: number;
  name?: string;
  email?: string;
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const drawerRef = useRef<HTMLDivElement>(null);

  const API_BASE = useMemo(() => process.env.NEXT_PUBLIC_API_URL || "", []);

  const fetchMe = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/user/me`, {
        credentials: "include",
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        setUser({ id: data.id, name: data.name, email: data.email });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchMe();
    const handleFocus = () => fetchMe();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchMe]);

  useEffect(() => {
    if (isOpen) fetchMe();
  }, [fetchMe, isOpen]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        if (subscription) {
          await fetch(`${API_BASE}/api/notifications/unsubscribe`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
        }
      }
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore logout errors
    } finally {
      window.localStorage.removeItem("authToken");
      window.localStorage.removeItem("adminAuthToken");
      setUser(null);
      window.location.href = "/login";
    }
  };

  const authedLinks = [
    {
      label: "Marketplace",
      href: "/dashboard",
      icon: "M3 3h2l.4 2M7 13h10l4-4H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    },
    {
      label: "Favorites",
      href: "/favorites",
      icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    },
    {
      label: "Chat",
      href: "/chat",
      icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    },
    {
      label: "Profile",
      href: "/profile",
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    },
    {
      label: "Safety & Trust",
      href: "/safety-trust",
      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    },
  ];

  const guestLinks = [
    {
      label: "Browse Listings",
      href: "/browse",
      icon: "M3 3h2l.4 2M7 13h10l4-4H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    },
    {
      label: "Safety & Trust",
      href: "/safety-trust",
      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    },
  ];

  const desktopLinks = user
    ? [
        { label: "Marketplace", href: "/dashboard" },
        { label: "Favorites", href: "/favorites" },
        { label: "Chat", href: "/chat" },
        { label: "Profile", href: "/profile" },
      ]
    : loading
      ? [{ label: "Marketplace", href: "/dashboard" }]
      : [
          { label: "Browse", href: "/browse" },
          { label: "Sign in", href: "/login" },
        ];

  const drawerLinks = user ? authedLinks : loading ? guestLinks : guestLinks;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-emerald-100/80 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <a
              href="/"
              className="flex items-center gap-2 font-bold text-lg text-emerald-700 select-none"
            >
              <img
                src="/logo.svg"
                alt="Njimbong"
                className="h-9 w-9 rounded-lg"
              />
              Njimbong
            </a>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-6 md:flex">
              {desktopLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-semibold text-gray-700 hover:text-emerald-700 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              {user && <Notifications userId={user.id} />}
              {user && (
                <button
                  onClick={handleLogout}
                  className="text-sm font-semibold text-red-500 hover:text-red-600 transition-colors"
                >
                  Log out
                </button>
              )}
              {!user && !loading && (
                <a
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition-colors"
                >
                  Start selling
                </a>
              )}
            </nav>

            {/* Mobile right cluster: notifications bell + hamburger */}
            <div className="flex items-center gap-1 md:hidden">
              {user && <Notifications userId={user.id} />}
              <button
                className="relative z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-white text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50 active:scale-95"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle navigation"
                aria-expanded={isOpen}
                aria-controls="mobile-nav"
              >
                <span className="sr-only">
                  {isOpen ? "Close menu" : "Open menu"}
                </span>
                {/* Animated burger icon */}
                <span className="flex h-5 w-5 flex-col items-center justify-center gap-[5px]">
                  <span
                    className={`block h-[2px] w-5 rounded-full bg-current origin-center transition-all duration-300 ease-in-out ${
                      isOpen ? "translate-y-[7px] rotate-45" : ""
                    }`}
                  />
                  <span
                    className={`block h-[2px] rounded-full bg-current transition-all duration-200 ease-in-out ${
                      isOpen ? "w-0 opacity-0" : "w-5"
                    }`}
                  />
                  <span
                    className={`block h-[2px] w-5 rounded-full bg-current origin-center transition-all duration-300 ease-in-out ${
                      isOpen ? "-translate-y-[7px] -rotate-45" : ""
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* â”€â”€ MOBILE SLIDE-OVER DRAWER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer panel */}
      <div
        id="mobile-nav"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed top-0 right-0 bottom-0 z-50 w-72 max-w-[85vw] flex flex-col bg-white shadow-2xl transition-transform duration-350 ease-[cubic-bezier(0.32,0,0.67,0)] md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <a
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2"
          >
            <img
              src="/logo.svg"
              alt="Njimbong"
              className="h-8 w-8 rounded-lg"
            />
            <span className="font-bold text-gray-900">Njimbong</span>
          </a>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <svg
              className="h-4 w-4"
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

        {/* User greeting */}
        {user && (
          <div className="border-b border-gray-100 px-5 py-3 bg-emerald-50/60">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-0.5">
              Signed in as
            </p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user.name || user.email || "User"}
            </p>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {drawerLinks.map((link, i) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
              style={{
                transitionDelay: isOpen ? `${i * 40}ms` : "0ms",
              }}
            >
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
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
                    d={link.icon}
                  />
                </svg>
              </span>
              {link.label}
            </a>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-gray-100 px-4 py-4 space-y-2.5">
          {loading && (
            <p className="text-xs text-center text-gray-400 py-1">
              Checking sessionâ€¦
            </p>
          )}
          {user ? (
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Log out
            </button>
          ) : (
            !loading && (
              <>
                <a
                  href="/signup"
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition-colors"
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
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                  Create Account
                </a>
                <a
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Sign in
                </a>
              </>
            )
          )}
        </div>

        {/* Escrow trust note */}
        <div
          className="border-t border-gray-100 px-4 pt-3 bg-emerald-50/40"
          style={{
            paddingBottom: user
              ? "calc(4rem + env(safe-area-inset-bottom))"
              : "0.75rem",
          }}
        >
          <a
            href="/safety-trust"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 text-xs text-emerald-700 font-medium hover:underline"
          >
            <svg
              className="w-3.5 h-3.5 flex-shrink-0"
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
            Payments protected by Fonlok Escrow
          </a>
        </div>
      </div>
    </>
  );
}
