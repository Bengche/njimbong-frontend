export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Axios from "axios";
import FeaturedCarousel from "./components/FeaturedCarousel";

export const metadata: Metadata = {
  title: "Njimbong Marketplace — Buy & Sell Safely in Cameroon",
  description:
    "Njimbong is Cameroon's #1 trusted online marketplace. Buy and sell electronics, fashion, vehicles, and more with Fonlok escrow payments, KYC-verified sellers, Njimbong AI assistant, visual search, real-time chat, and full buyer dispute protection.",
  keywords: [
    "Njimbong",
    "Njimbong Marketplace",
    "marketplace Cameroon",
    "buy and sell Cameroon",
    "secure payment Cameroon",
    "Fonlok escrow",
    "escrow payment Cameroon",
    "safe online shopping Cameroon",
    "KYC verified sellers Cameroon",
    "buy sell online Cameroon",
    "MoMo escrow",
    "trusted marketplace",
    "Cameroon classifieds",
    "online marketplace Cameroon",
    "Njimbong AI",
    "AI marketplace assistant",
    "visual search marketplace",
    "trust score marketplace",
    "buyer protection Cameroon",
    "sell online Cameroon free",
    "MTN MoMo payment marketplace",
    "Orange Money marketplace",
    "verified sellers Cameroon",
    "dispute resolution marketplace",
    "real-time chat marketplace",
    "reviews ratings sellers Cameroon",
    "buy electronics Cameroon",
    "buy phones Cameroon",
    "buy cars Cameroon",
    "buy fashion Cameroon",
  ],
};

export default async function Home() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;
  let listings = [];

  // 1. Fetch data directly inside the Server Component
  // 1. Fetch data directly inside the Server Component
  try {
    const response = await Axios.get(
      `https://njimbong-backend-production.up.railway.app/home/listings`,
      { headers: { "Cache-Control": "no-cache" } },
    );

    // Axios puts the backend response in .data
    // We ensure 'listings' is the array found in response.data
    listings = response.data || [];

    // This will now show the items in your VS Code terminal
    console.log("Success! Items found:", listings.length);
  } catch (error) {
    console.error("Error fetching listings:", error);
    listings = []; // Keep it as an empty array on error so the map doesn't crash
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-yellow-50 to-white text-gray-900">
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "@id": "https://njimbong.com/#website",
                name: "Njimbong Marketplace",
                description:
                  "Cameroon's trusted online marketplace with Fonlok escrow payments, KYC-verified sellers, and Njimbong AI.",
                url: "https://njimbong.com",
                inLanguage: ["en", "fr"],
                potentialAction: {
                  "@type": "SearchAction",
                  target:
                    "https://njimbong.com/dashboard?search={search_term_string}",
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@type": "Organization",
                "@id": "https://njimbong.com/#organization",
                name: "Njimbong Marketplace",
                url: "https://njimbong.com",
                logo: "https://njimbong.com/logo.svg",
                description:
                  "Njimbong is Cameroon's leading online marketplace for buying and selling electronics, fashion, vehicles, real estate, and services with Fonlok escrow payment protection and KYC-verified sellers.",
                foundingLocation: "Cameroon",
                areaServed: "CM",
                knowsAbout: [
                  "Online Marketplace",
                  "Escrow Payments",
                  "E-commerce Cameroon",
                  "Mobile Money Payments",
                ],
                sameAs: [],
              },
              {
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "Is Njimbong safe for online payments in Cameroon?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Yes. Every XAF payment on Njimbong is protected by Fonlok escrow. Your Mobile Money payment is held in a secure vault and only released to the seller after you confirm you have received your item as described. If anything goes wrong, our team mediates the dispute.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "How does Fonlok escrow work on Njimbong?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Fonlok is Cameroon's dedicated escrow payment service. When you buy on Njimbong, you pay via MTN MoMo or Orange Money into a secure escrow account. The seller ships or hands over the item. You inspect it, and if satisfied, confirm delivery — at which point the funds are released to the seller. If there is a problem, you open a dispute and our admin team resolves it.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "How do I become a verified seller on Njimbong?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "To become a verified seller, complete KYC (Know Your Customer) verification from your profile settings. You will need to submit a valid government-issued ID. Once verified, your profile displays a blue verification badge, your trust score improves, and buyers are more confident purchasing from you.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "What is the Trust Score on Njimbong?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "The Trust Score is a 0–100% rating visible on every seller profile. It is calculated from KYC verification status, transaction history, buyer reviews and ratings, dispute record, and account activity. A higher trust score builds buyer confidence and helps listings rank better in search results.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "What is Njimbong AI?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Njimbong AI is a built-in AI assistant powered by Google Gemini. It helps buyers find products, compare prices, understand platform features, and stay safe from scams. For sellers, it can auto-fill listing details from a photo, enhance descriptions, suggest fair XAF prices, and generate SEO-optimized text. It also supports visual search — upload any image to find matching products.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "What can I buy and sell on Njimbong?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Njimbong covers a wide range of categories including electronics (phones, laptops, TVs), fashion and clothing, vehicles (cars, motorbikes), home and furniture, real estate, agricultural products, food, services, and local deals. All listings are moderated and every XAF payment is escrow-protected.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Is listing on Njimbong free?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Yes. Creating an account and posting listings on Njimbong is completely free. There are no subscription fees or listing charges. You only interact with Fonlok escrow fees when conducting a secured transaction.",
                    },
                  },
                ],
              },
              {
                "@type": "Service",
                "@id": "https://njimbong.com/#escrow-service",
                name: "Fonlok Escrow Payment Protection",
                provider: { "@id": "https://njimbong.com/#organization" },
                description:
                  "Secure escrow payment service for online marketplace transactions in Cameroon via MTN MoMo and Orange Money.",
                areaServed: "CM",
                serviceType: "Escrow Payment",
              },
            ],
          }),
        }}
      />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700">
              Njimbong Marketplace
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Buy &amp; Sell Online in Cameroon.{" "}
              <span className="text-emerald-600">
                Your Money is Always Protected.
              </span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Njimbong is the safest online marketplace in Cameroon. Every XAF
              transaction is secured by{" "}
              <strong className="text-gray-800">Fonlok Escrow</strong> — your
              payment is held safely until you confirm you have received your
              item.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="/browse"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-white font-semibold shadow-lg hover:bg-emerald-700 transition-colors"
              >
                Browse Listings
              </a>
              <a
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl border-2 border-emerald-200 bg-white px-6 py-3 font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                Start Selling Free
              </a>
            </div>

            {/* Inline trust row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500 pt-1">
              <span className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4 text-emerald-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Fonlok Escrow Protection
              </span>
              <span className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4 text-emerald-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                KYC-Verified Sellers
              </span>
              <span className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Buyer Dispute Protection
              </span>
            </div>
          </div>

          {/* Hero card — escrow explained */}
          <div className="rounded-2xl bg-white shadow-xl border border-emerald-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-white"
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
                <div>
                  <p className="font-bold text-white text-sm">
                    Secure Payments — Powered by Fonlok
                  </p>
                  <p className="text-emerald-100 text-xs">
                    Your money is held safely until delivery is confirmed
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {[
                {
                  step: "1",
                  label: "You pay into escrow",
                  detail:
                    "Your MoMo payment is locked securely — not released to the seller yet.",
                },
                {
                  step: "2",
                  label: "Seller delivers the item",
                  detail:
                    "The seller knows payment is guaranteed. They ship or hand over the item.",
                },
                {
                  step: "3",
                  label: "You confirm receipt",
                  detail:
                    "Once you confirm everything is as described, funds are released to the seller.",
                },
              ].map((s) => (
                <div key={s.step} className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {s.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      {s.detail}
                    </p>
                  </div>
                </div>
              ))}
              <a
                href="/safety-trust"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline pt-1"
              >
                Learn how Fonlok escrow protects you
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
          </div>
        </section>

        {/* ── TRUST BADGES BAR ─────────────────────────────────────── */}
        <div className="mt-12 rounded-2xl border border-gray-100 bg-white shadow-sm px-6 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 text-center">
            {[
              {
                icon: (
                  <svg
                    className="w-6 h-6 text-emerald-600"
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
                ),
                label: "Fonlok Escrow",
                sub: "Payments held until delivery",
              },
              {
                icon: (
                  <svg
                    className="w-6 h-6 text-emerald-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ),
                label: "KYC Verification",
                sub: "Identity-verified sellers",
              },
              {
                icon: (
                  <svg
                    className="w-6 h-6 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                ),
                label: "Dispute Protection",
                sub: "Admin-mediated resolution",
              },
              {
                icon: (
                  <svg
                    className="w-6 h-6 text-emerald-600"
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
                ),
                label: "Secure Messaging",
                sub: "All chats stay on-platform",
              },
            ].map((b) => (
              <div key={b.label} className="flex flex-col items-center gap-1.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                  {b.icon}
                </div>
                <p className="text-xs font-semibold text-gray-900">{b.label}</p>
                <p className="text-xs text-gray-500 leading-tight">{b.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── VALUE PROPS ──────────────────────────────────────────── */}
        <section className="mt-14 grid gap-5 sm:grid-cols-3">
          {[
            {
              icon: (
                <svg
                  className="w-6 h-6 text-emerald-600"
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
              ),
              title: "Pay Only When Satisfied",
              text: "Fonlok escrow holds your payment in a secure vault. Funds are released to the seller only after you confirm receipt — so you never lose money on a bad deal.",
            },
            {
              icon: (
                <svg
                  className="w-6 h-6 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              ),
              title: "List & Sell in Minutes",
              text: "Post photos, set your price, and go live instantly. Reach thousands of active Cameroonian buyers without fees or subscriptions.",
            },
            {
              icon: (
                <svg
                  className="w-6 h-6 text-emerald-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ),
              title: "Buy from Verified Sellers",
              text: "KYC-verified sellers display a blue badge. Trust scores, reviews, and moderation keep the marketplace clean and the community honest.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                {card.icon}
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                {card.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                {card.text}
              </p>
            </div>
          ))}
        </section>

        {/* ── FEATURED LISTINGS CAROUSEL ───────────────────────────── */}
        <section className="mt-20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Featured Listings
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Fresh listings from verified sellers — XAF listings include
                escrow protection
              </p>
            </div>
            <a
              href="/browse"
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200
                         bg-white px-4 py-2 text-sm font-semibold text-emerald-700
                         hover:bg-emerald-50 hover:border-emerald-400 transition-colors shadow-sm flex-shrink-0"
            >
              See all
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>
          <FeaturedCarousel listings={listings} />
        </section>

        {/* ── FONLOK ESCROW DEEP DIVE ──────────────────────────────── */}
        <section className="mt-20" aria-labelledby="escrow-section">
          <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-800 to-gray-900 shadow-2xl">
            <div className="px-6 py-10 sm:px-10 sm:py-14 md:grid md:grid-cols-2 md:gap-12 md:items-center">
              {/* Left copy */}
              <div className="text-white space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-semibold text-emerald-200">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Secure Payments — Fonlok Escrow
                </div>
                <h2
                  id="escrow-section"
                  className="text-3xl font-bold leading-tight"
                >
                  Your money stays safe.
                  <br />
                  <span className="text-emerald-300">Every single time.</span>
                </h2>
                <p className="text-emerald-100 leading-relaxed text-sm sm:text-base">
                  Fonlok is Cameroon&apos;s dedicated escrow payment platform.
                  When you buy on Njimbong, your MoMo payment is locked in a
                  secure vault — invisible to the seller until you confirm
                  you&apos;ve received your item exactly as described.
                </p>
                <ul className="space-y-3 text-sm text-emerald-100">
                  {[
                    "Pay via Mobile Money — MTN MoMo or Orange Money",
                    "Seller cannot access funds until you confirm delivery",
                    "Open a dispute if the item is wrong or doesn't arrive",
                    "Admin-mediated resolution for every dispute",
                    "Instant release to seller once you confirm",
                  ].map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <svg
                        className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <a
                    href="/signup"
                    className="inline-flex items-center justify-center rounded-xl bg-white text-emerald-800 font-semibold px-6 py-3 text-sm hover:bg-emerald-50 transition-colors shadow-md"
                  >
                    Start Buying Safely
                  </a>
                  <a
                    href="/safety-trust"
                    className="inline-flex items-center justify-center rounded-xl border border-white/30 text-white font-semibold px-6 py-3 text-sm hover:bg-white/10 transition-colors"
                  >
                    How It Works
                  </a>
                </div>
              </div>

              {/* Right — visual steps */}
              <div className="mt-10 md:mt-0 space-y-4">
                {[
                  {
                    n: "01",
                    title: "Buyer pays into escrow",
                    body: "Your payment is locked securely via Fonlok. The seller is notified but cannot touch the funds.",
                    icon: (
                      <svg
                        className="w-5 h-5 text-emerald-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                    ),
                  },
                  {
                    n: "02",
                    title: "Seller prepares & delivers",
                    body: "With payment guaranteed, the seller ships or arranges handover. Both parties are protected.",
                    icon: (
                      <svg
                        className="w-5 h-5 text-emerald-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    ),
                  },
                  {
                    n: "03",
                    title: "You inspect & confirm",
                    body: "Inspect the item carefully. If satisfied, confirm delivery and the funds are instantly released.",
                    icon: (
                      <svg
                        className="w-5 h-5 text-emerald-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ),
                  },
                  {
                    n: "04",
                    title: "Dispute? We step in.",
                    body: "If something is wrong, open a dispute. Our team reviews evidence and resolves it fairly.",
                    icon: (
                      <svg
                        className="w-5 h-5 text-emerald-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    ),
                  },
                ].map((step) => (
                  <div
                    key={step.n}
                    className="flex gap-4 items-start rounded-2xl bg-white/10 border border-white/10 px-5 py-4"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                      {step.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-300 mb-0.5">
                        Step {step.n}
                      </p>
                      <p className="text-sm font-semibold text-white">
                        {step.title}
                      </p>
                      <p className="text-xs text-emerald-200 mt-0.5 leading-relaxed">
                        {step.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom stat bar */}
            <div className="border-t border-white/10 px-6 py-5 sm:px-10">
              <div className="grid grid-cols-3 gap-4 text-center text-white">
                {[
                  { value: "100%", label: "Escrow-secured XAF payments" },
                  { value: "MoMo", label: "MTN & Orange Money accepted" },
                  { value: "24h", label: "Dispute resolution target" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-xl font-bold text-emerald-300">
                      {stat.value}
                    </p>
                    <p className="text-xs text-emerald-200 mt-1 leading-tight">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CATEGORIES ───────────────────────────────────────────── */}
        <section
          className="mt-16 grid gap-10 md:grid-cols-2"
          aria-labelledby="categories"
        >
          <div className="space-y-4">
            <h2 id="categories" className="text-2xl font-bold">
              Every Category, All in One Place
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Njimbong covers electronics, fashion, home, vehicles, services,
              and more. Whether you&apos;re shopping locally or selling
              nationwide, every listing is moderated and every XAF payment is
              escrow-secured.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                "electronics",
                "phones",
                "laptops",
                "fashion",
                "home & living",
                "vehicles",
                "services",
                "furniture",
                "real estate",
                "jobs",
                "local deals",
              ].map((tag) => (
                <a
                  key={tag}
                  href={`/dashboard?category=${encodeURIComponent(tag)}`}
                  className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-200 transition-colors"
                >
                  {tag}
                </a>
              ))}
            </div>
            <p className="text-sm text-gray-500">
              Explore more on the{" "}
              <a
                className="text-emerald-700 hover:underline font-medium"
                href="/dashboard"
              >
                marketplace
              </a>{" "}
              or list your first item from your{" "}
              <a
                className="text-emerald-700 hover:underline font-medium"
                href="/dashboard"
              >
                seller dashboard
              </a>
              .
            </p>
          </div>

          <div className="rounded-2xl bg-emerald-700 p-8 text-white shadow-xl">
            <h2 className="text-2xl font-bold">Built for Trust</h2>
            <p className="mt-3 text-sm text-emerald-100 leading-relaxed">
              Every tool on Njimbong is designed around a single principle: your
              safety. From KYC verification and escrow payments to moderation
              and disputes, we have you covered at every step.
            </p>
            <div className="mt-6 grid gap-3 text-sm">
              {[
                {
                  label: "Fonlok escrow — every XAF transaction",
                  icon: (
                    <svg
                      className="w-4 h-4 text-emerald-300 flex-shrink-0"
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
                  ),
                },
                {
                  label: "KYC identity verification for sellers",
                  icon: (
                    <svg
                      className="w-4 h-4 text-emerald-300 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ),
                },
                {
                  label: "Admin-mediated dispute resolution",
                  icon: (
                    <svg
                      className="w-4 h-4 text-emerald-300 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  ),
                },
                {
                  label: "One-tap listing & user reporting",
                  icon: (
                    <svg
                      className="w-4 h-4 text-emerald-300 flex-shrink-0"
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
                  ),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-emerald-50"
                >
                  {item.icon}
                  {item.label}
                </div>
              ))}
            </div>
            <a
              href="/safety-trust"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-200 hover:text-white transition-colors"
            >
              Read our full safety guide
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
        <section className="mt-16" aria-labelledby="how-it-works">
          <div className="mb-8">
            <h2 id="how-it-works" className="text-2xl font-bold">
              How Njimbong Works
            </h2>
            <p className="mt-2 text-gray-600">
              From signup to a completed secure deal — four steps.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "1",
                title: "Create your account",
                text: "Sign up for free, verify your profile, and build trust with buyers and sellers.",
                link: "/signup",
                linkText: "Get started",
              },
              {
                step: "2",
                title: "Find or post a listing",
                text: "Browse thousands of listings or post your own item in under two minutes.",
                link: "/browse",
                linkText: "Browse now",
              },
              {
                step: "3",
                title: "Chat safely on-platform",
                text: "Negotiate details, ask questions, and agree a price — all within Njimbong's secure chat.",
                link: "/chat",
                linkText: "Open chat",
              },
              {
                step: "4",
                title: "Pay via escrow & confirm",
                text: "Pay with MoMo through Fonlok escrow. Your money is released only when you say so.",
                link: "/safety-trust",
                linkText: "Learn more",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-3xl flex items-end justify-start pb-2 pl-2.5">
                  <span className="text-2xl font-black text-emerald-200">
                    {item.step}
                  </span>
                </div>
                <div className="text-xs font-semibold text-emerald-600 mb-2">
                  Step {item.step}
                </div>
                <h3 className="text-sm font-bold text-gray-900 pr-10">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                  {item.text}
                </p>
                <a
                  href={item.link}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                >
                  {item.linkText}
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* ── PLATFORM FEATURES ────────────────────────────────────── */}
        <section className="mt-20" aria-labelledby="platform-features">
          <div className="mb-8 text-center">
            <h2 id="platform-features" className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Every Feature You Need
            </h2>
            <p className="mt-2 text-gray-500 max-w-xl mx-auto text-sm">
              Njimbong is more than a classifieds board. It&apos;s a complete, AI-powered marketplace built for Cameroon.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Fonlok Escrow Payments",
                desc: "Every XAF transaction is held securely until you confirm delivery. Powered by Fonlok via MTN MoMo and Orange Money.",
                color: "emerald",
              },
              {
                title: "KYC Identity Verification",
                desc: "Sellers verify their government ID to earn a blue badge and boost their trust score, giving buyers full confidence.",
                color: "blue",
              },
              {
                title: "Trust Score System",
                desc: "A 0–100% reputation score on every profile, calculated from verification, reviews, transaction history, and disputes.",
                color: "yellow",
              },
              {
                title: "Buyer Dispute Protection",
                desc: "If an item doesn't arrive or differs from the listing, open a dispute. Our team reviews evidence and resolves it fairly.",
                color: "red",
              },
              {
                title: "Njimbong AI Assistant",
                desc: "An AI chat powered by Google Gemini answers your questions about the platform, pricing, safety, and scam prevention — 24/7.",
                color: "violet",
              },
              {
                title: "AI Visual Search",
                desc: "Upload any photo to find similar products across all listings. No keywords needed — just show what you're looking for.",
                color: "violet",
              },
              {
                title: "AI Listing Auto-fill",
                desc: "Sellers can photograph an item and Njimbong AI will auto-generate the title, description, condition, category, and a fair XAF price range.",
                color: "violet",
              },
              {
                title: "AI Text Enhancement",
                desc: "AI rewrites your listing descriptions to be more compelling, SEO-friendly, and professional with one click.",
                color: "violet",
              },
              {
                title: "Real-time Secure Chat",
                desc: "Message buyers and sellers directly within the platform. All conversations are on-platform — never share your phone number.",
                color: "emerald",
              },
              {
                title: "Reviews & Star Ratings",
                desc: "After each transaction, buyers and sellers leave verified reviews. Honest, moderated, and visible to every future visitor.",
                color: "yellow",
              },
              {
                title: "Wishlist & Favorites",
                desc: "Save any listing to your personal wishlist. Get notified when saved items drop in price or go out of stock.",
                color: "red",
              },
              {
                title: "Advanced Search & Filters",
                desc: "Filter by category, price range, location, condition, currency, and more. Find exactly what you need — fast.",
                color: "blue",
              },
              {
                title: "Push Notifications",
                desc: "Receive instant browser notifications for new messages, order updates, price drops, and disputes — even when the app is closed.",
                color: "blue",
              },
              {
                title: "Listing Moderation",
                desc: "Every listing is reviewed against platform guidelines. Fraudulent or misleading listings are removed before they reach buyers.",
                color: "red",
              },
              {
                title: "Seller Analytics",
                desc: "Track views, saves, and engagement on your listings. Understand what performs best and optimise your sales strategy.",
                color: "emerald",
              },
              {
                title: "Installable PWA",
                desc: "Add Njimbong to your home screen for a native app experience — fast, offline-capable, and no app store required.",
                color: "slate",
              },
            ].map((f) => (
              <article
                key={f.title}
                className="rounded-xl bg-white border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <h3 className="text-sm font-bold text-gray-900 mb-1.5">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <section className="mt-20" aria-labelledby="faq">
          <div className="mb-8">
            <h2 id="faq" className="text-2xl font-bold text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-gray-500 text-sm">
              Everything you need to know before buying or selling on Njimbong.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                q: "Is Njimbong safe for online payments in Cameroon?",
                a: "Yes. Every XAF payment is protected by Fonlok escrow — your Mobile Money is held securely until you confirm delivery. If anything goes wrong, our dispute team steps in.",
              },
              {
                q: "How does Fonlok escrow work?",
                a: "You pay via MTN MoMo or Orange Money into escrow. The seller delivers the item. You inspect it and confirm — funds release to the seller instantly. Refuse delivery or open a dispute if there's a problem.",
              },
              {
                q: "How do I become a verified seller?",
                a: "Go to your profile settings and complete KYC verification by submitting a valid government-issued ID. Once approved, you receive a blue badge and a higher trust score.",
              },
              {
                q: "What is the Trust Score?",
                a: "A 0–100% reputation indicator on every profile, based on KYC status, transaction history, reviews, and dispute record. Higher scores build buyer confidence and improve listing visibility.",
              },
              {
                q: "What is Njimbong AI?",
                a: "Njimbong AI is your built-in marketplace assistant. It answers questions, helps sellers auto-fill listings from photos, enhances descriptions, powers visual search, and summarises chat conversations.",
              },
              {
                q: "Is listing on Njimbong free?",
                a: "Yes. Creating an account and posting listings is completely free. No subscriptions, no listing fees. Fonlok escrow fees only apply when you choose to secure a payment.",
              },
              {
                q: "What can I buy and sell on Njimbong?",
                a: "Electronics, phones, laptops, fashion, vehicles, home & furniture, real estate, agricultural products, food, services, and local deals — all in one place.",
              },
              {
                q: "Can I use Njimbong from outside Cameroon?",
                a: "Yes. Njimbong supports multiple currencies and countries. You can browse and list items from anywhere, though escrow payments are currently optimised for Cameroonian Mobile Money.",
              },
            ].map(({ q, a }) => (
              <div
                key={q}
                className="rounded-xl bg-white border border-gray-100 shadow-sm p-5"
              >
                <h3 className="text-sm font-bold text-gray-900 mb-2">{q}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────────────── */}
        <section className="mt-16 rounded-3xl bg-white p-8 sm:p-12 shadow-xl border border-emerald-100 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-4 py-1.5 text-xs font-semibold text-emerald-700 mb-5">
            <svg
              className="w-3.5 h-3.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            Fonlok Escrow — Payments Protected by Default
          </div>
          <h2 className="text-2xl font-bold sm:text-3xl">
            Join Njimbong Today
          </h2>
          <p className="mt-3 text-gray-600 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
            Buy and sell online with complete peace of mind. Every XAF payment
            is protected by Fonlok escrow — your money only moves when you say
            so.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-7 py-3 text-white font-semibold shadow-lg hover:bg-emerald-700 transition-colors"
            >
              Create Free Account
            </a>
            <a
              href="/browse"
              className="inline-flex items-center justify-center rounded-xl border-2 border-gray-200 px-7 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Browse Listings
            </a>
          </div>

          {/* Mini trust badges */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-gray-500">
            {[
              "Free to sign up",
              "Escrow-protected payments",
              "KYC-verified sellers",
              "Dispute resolution included",
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5 text-emerald-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {item}
              </span>
            ))}
          </div>

          <p className="mt-4 text-xs text-gray-400">
            Already a member?{" "}
            <a
              className="text-emerald-700 hover:underline font-medium"
              href="/login"
            >
              Sign in
            </a>{" "}
            · Need help?{" "}
            <a
              className="text-emerald-700 hover:underline font-medium"
              href="mailto:support@njimbong.com"
            >
              support@njimbong.com
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}
