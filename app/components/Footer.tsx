import React from "react";

export default function Footer() {
  return (
    <footer className="relative border-t border-emerald-100/70 bg-gradient-to-b from-white via-emerald-50/30 to-white">
      {/* Trust bar */}
      <div className="border-b border-emerald-100/60 bg-emerald-50/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-gray-600">
            {([
              {
                label: "Fonlok Escrow Payments",
                icon: (
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
              },
              {
                label: "KYC-Verified Sellers",
                icon: (
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ),
              },
              {
                label: "Buyer Dispute Protection",
                icon: (
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
              },
              {
                label: "Secure On-Platform Chat",
                icon: (
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ),
              },
              {
                label: "Professional Moderation",
                icon: (
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                ),
              },
            ] as { label: string; icon: React.ReactNode }[]).map((b) => (
              <span
                key={b.label}
                className="flex items-center gap-1.5 font-medium"
              >
                {b.icon}
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="h-1 w-24 sm:w-32 rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-emerald-500 mb-8" />
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-3">
            <h3 className="text-base font-bold text-emerald-700">Njimbong</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Cameroon&apos;s safest online marketplace — powered by Fonlok
              escrow payments, KYC verification, and professional moderation.
            </p>
            <a
              href="/browse"
              className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline"
            >
              Explore listings
              <svg
                className="w-3.5 h-3.5"
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
            </a>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-bold text-gray-800">Marketplace</p>
            <a
              className="block text-gray-600 hover:text-emerald-700 transition-colors"
              href="/browse"
            >
              Browse listings
            </a>
            <a
              className="block text-gray-600 hover:text-emerald-700 transition-colors"
              href="/favorites"
            >
              Favorites
            </a>
            <a
              className="block text-gray-600 hover:text-emerald-700 transition-colors"
              href="/dashboard"
            >
              Sell on Njimbong
            </a>
            <a
              className="block text-gray-600 hover:text-emerald-700 transition-colors"
              href="/safety-trust"
            >
              Secure Payments
            </a>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-bold text-gray-800">Account</p>
            <a
              className="block text-gray-600 hover:text-emerald-700 transition-colors"
              href="/login"
            >
              Sign in
            </a>
            <a
              className="block text-gray-600 hover:text-emerald-700 transition-colors"
              href="/signup"
            >
              Create account
            </a>
            <a
              className="block text-gray-600 hover:text-emerald-700 transition-colors"
              href="/profile"
            >
              My profile
            </a>
            <a
              className="block text-gray-600 hover:text-emerald-700 transition-colors"
              href="/kyc"
            >
              Get KYC verified
            </a>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-bold text-gray-800">Support & Legal</p>
            <a
              className="block text-gray-600 hover:text-emerald-700 transition-colors"
              href="mailto:support@njimbong.com"
            >
              Help Center
            </a>
            <a
              className="block text-gray-600 hover:text-emerald-700 transition-colors"
              href="/safety-trust"
            >
              Safety &amp; Trust
            </a>
            <a
              className="block text-gray-600 hover:text-emerald-700 transition-colors"
              href="/safety-trust#fonlok-heading"
            >
              How Escrow Works
            </a>
            <a
              className="block text-gray-600 hover:text-emerald-700 transition-colors"
              href="/terms-privacy"
            >
              Terms &amp; Privacy
            </a>
          </div>
        </div>

        {/* Fonlok note */}
        <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-white"
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
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-emerald-800">
              Payments powered by Fonlok Escrow
            </p>
            <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
              Every XAF transaction on Njimbong is protected by Fonlok escrow.
              Your money is held securely and only released to the seller after
              you confirm receipt of your item.
            </p>
          </div>
          <a
            href="/safety-trust"
            className="text-xs font-semibold text-emerald-700 hover:underline flex-shrink-0"
          >
            Learn more
          </a>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-emerald-100/70 pt-6 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2025–2026 Njimbong Marketplace. All rights reserved.</span>
          <span>
            Built by{" "}
            <a
              href="https://brancodex.com/"
              className="hover:text-emerald-700 transition-colors"
            >
              BranCodeX
            </a>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            support@njimbong.com
          </span>
        </div>
      </div>
    </footer>
  );
}
