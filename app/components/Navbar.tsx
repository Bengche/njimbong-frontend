"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface AuthUser {
  id: number;
  name?: string;
  email?: string;
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

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
    if (isOpen) {
      fetchMe();
    }
  }, [fetchMe, isOpen]);

  const handleLogout = async () => {
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

  const navLinks = user
    ? [
        { label: "Marketplace", href: "/dashboard" },
        { label: "Dashboard", href: "/dashboard" },
        { label: "Favorites", href: "/favorites" },
        { label: "Chat", href: "/chat" },
        { label: "Profile", href: "/profile" },
      ]
    : loading
      ? [{ label: "Marketplace", href: "/dashboard" }]
      : [
          { label: "Marketplace", href: "/dashboard" },
          { label: "Sign in", href: "/login" },
          { label: "Create account", href: "/signup" },
        ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-emerald-100">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2 font-bold text-lg text-emerald-700"
          >
            <img
              src="/logo.svg"
              alt="Njimbong"
              className="h-9 w-9 rounded-lg"
            />
            Njimbong
          </a>

          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-semibold text-gray-700 hover:text-emerald-700 transition-colors"
              >
                {link.label}
              </a>
            ))}
            {user && (
              <button
                onClick={handleLogout}
                className="text-sm font-semibold text-red-500 hover:text-red-600"
              >
                Log out
              </button>
            )}
            {!user && (
              <a
                href="/signup"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
              >
                Start selling
              </a>
            )}
          </nav>

          <button
            className="md:hidden inline-flex items-center justify-center rounded-lg border border-emerald-100 p-2 text-emerald-700 transition-transform duration-300 ease-out active:scale-95"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation"
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <svg
                className="h-5 w-5"
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
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div
        className={`md:hidden overflow-hidden border-t border-emerald-100 bg-white/95 backdrop-blur transition-[max-height,opacity,transform] duration-500 ease-out ${
          isOpen
            ? "max-h-96 opacity-100 translate-y-0"
            : "max-h-0 opacity-0 -translate-y-2"
        }`}
      >
        <div
          className={`px-4 py-4 sm:px-6 space-y-3 transition-all duration-500 ease-out ${
            isOpen ? "translate-y-0" : "-translate-y-3"
          } ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        >
          {navLinks.map((link, index) => (
            <a
              key={link.label}
              href={link.href}
              className={`block text-sm font-semibold text-gray-700 hover:text-emerald-700 transition-all duration-300 ${
                isOpen
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-2"
              }`}
              style={{ transitionDelay: `${index * 45}ms` }}
            >
              {link.label}
            </a>
          ))}
          {user ? (
            <button
              onClick={handleLogout}
              className={`block text-sm font-semibold text-red-500 transition-all duration-300 ${
                isOpen
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-2"
              }`}
              style={{ transitionDelay: `${navLinks.length * 45}ms` }}
            >
              Log out
            </button>
          ) : (
            <a
              href="/signup"
              className={`inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition-all duration-300 ${
                isOpen
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-2"
              }`}
              style={{ transitionDelay: `${navLinks.length * 45}ms` }}
            >
              Start selling
            </a>
          )}
          {loading && (
            <p
              className={`text-xs text-gray-400 transition-all duration-300 ${
                isOpen
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-2"
              }`}
              style={{ transitionDelay: `${(navLinks.length + 1) * 45}ms` }}
            >
              Checking session...
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
