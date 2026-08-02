"use client";

import FeaturedCarousel from "./FeaturedCarousel";
import { useLanguage } from "../i18n/LanguageContext";

interface Listing {
  id: number;
  title: string;
  description?: string;
  price: number | string;
  currency: string;
  imageurl?: string;
  image_url?: string;
  city?: string;
  country?: string;
  condition?: string;
  status?: string;
}

interface Props {
  listings: Listing[];
}

export default function HomePageContent({ listings }: Props) {
  const { t } = useLanguage();
  const h = t("home");
  const common = t("common");

  const escrowCardSteps = [
    {
      step: "1",
      label: h.escrowCard.step1Label,
      detail: h.escrowCard.step1Detail,
    },
    {
      step: "2",
      label: h.escrowCard.step2Label,
      detail: h.escrowCard.step2Detail,
    },
    {
      step: "3",
      label: h.escrowCard.step3Label,
      detail: h.escrowCard.step3Detail,
    },
  ];

  const fonlokSteps = [
    {
      n: "01",
      title: h.fonlokSection.step01Title,
      body: h.fonlokSection.step01Body,
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
      title: h.fonlokSection.step02Title,
      body: h.fonlokSection.step02Body,
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
      title: h.fonlokSection.step03Title,
      body: h.fonlokSection.step03Body,
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
      title: h.fonlokSection.step04Title,
      body: h.fonlokSection.step04Body,
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
  ];

  const categoryTags = [
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
  ];

  const trustItems = [
    {
      label: h.categories.trustItems[0],
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
      label: h.categories.trustItems[1],
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
      label: h.categories.trustItems[2],
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
      label: h.categories.trustItems[3],
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
  ];

  const howItWorksSteps = [
    {
      step: "1",
      title: h.howItWorks.step1Title,
      text: h.howItWorks.step1Text,
      link: "/signup",
      linkText: h.howItWorks.step1Link,
    },
    {
      step: "2",
      title: h.howItWorks.step2Title,
      text: h.howItWorks.step2Text,
      link: "/browse",
      linkText: h.howItWorks.step2Link,
    },
    {
      step: "3",
      title: h.howItWorks.step3Title,
      text: h.howItWorks.step3Text,
      link: "/chat",
      linkText: h.howItWorks.step3Link,
    },
    {
      step: "4",
      title: h.howItWorks.step4Title,
      text: h.howItWorks.step4Text,
      link: "/safety-trust",
      linkText: h.howItWorks.step4Link,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-yellow-50 to-white text-gray-900">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700">
              {h.badge}
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              {h.hero.title1}{" "}
              <span className="text-emerald-600">{h.hero.title2}</span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              {h.hero.desc}{" "}
              <strong className="text-gray-800">{h.hero.fonlok}</strong>{" "}
              {h.hero.fonlokDesc}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="/browse"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-white font-semibold shadow-lg hover:bg-emerald-700 transition-colors"
              >
                {h.hero.browseCta}
              </a>
              <a
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl border-2 border-emerald-200 bg-white px-6 py-3 font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                {h.hero.sellCta}
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
                {h.hero.trustEscrow}
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
                {h.hero.trustKyc}
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
                {h.hero.trustDispute}
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
                    {h.escrowCard.title}
                  </p>
                  <p className="text-emerald-100 text-xs">
                    {h.escrowCard.subtitle}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {escrowCardSteps.map((s) => (
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
                {h.escrowCard.learnLink}
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
                label: h.trustBadges.escrowLabel,
                sub: h.trustBadges.escrowSub,
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
                label: h.trustBadges.kycLabel,
                sub: h.trustBadges.kycSub,
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
                label: h.trustBadges.disputeLabel,
                sub: h.trustBadges.disputeSub,
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
                label: h.trustBadges.chatLabel,
                sub: h.trustBadges.chatSub,
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
              title: h.valueProps.v1Title,
              text: h.valueProps.v1Text,
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
              title: h.valueProps.v2Title,
              text: h.valueProps.v2Text,
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
              title: h.valueProps.v3Title,
              text: h.valueProps.v3Text,
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
                {h.featured.title}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {h.featured.subtitle}
              </p>
            </div>
            <a
              href="/browse"
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 transition-colors shadow-sm flex-shrink-0"
            >
              {common.seeAll}
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
                  {h.fonlokSection.badge}
                </div>
                <h2
                  id="escrow-section"
                  className="text-3xl font-bold leading-tight"
                >
                  {h.fonlokSection.title1}
                  <br />
                  <span className="text-emerald-300">
                    {h.fonlokSection.title2}
                  </span>
                </h2>
                <p className="text-emerald-100 leading-relaxed text-sm sm:text-base">
                  {h.fonlokSection.desc}
                </p>
                <ul className="space-y-3 text-sm text-emerald-100">
                  {h.fonlokSection.bullets.map((point: string) => (
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
                    {h.fonlokSection.cta1}
                  </a>
                  <a
                    href="/safety-trust"
                    className="inline-flex items-center justify-center rounded-xl border border-white/30 text-white font-semibold px-6 py-3 text-sm hover:bg-white/10 transition-colors"
                  >
                    {h.fonlokSection.cta2}
                  </a>
                </div>
              </div>

              <div className="mt-10 md:mt-0 space-y-4">
                {fonlokSteps.map((step) => (
                  <div
                    key={step.n}
                    className="flex gap-4 items-start rounded-2xl bg-white/10 border border-white/10 px-5 py-4"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                      {step.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-300 mb-0.5">
                        {common.step} {step.n}
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

            <div className="border-t border-white/10 px-6 py-5 sm:px-10">
              <div className="grid grid-cols-3 gap-4 text-center text-white">
                {[
                  {
                    value: h.fonlokSection.stat1Value,
                    label: h.fonlokSection.stat1Label,
                  },
                  {
                    value: h.fonlokSection.stat2Value,
                    label: h.fonlokSection.stat2Label,
                  },
                  {
                    value: h.fonlokSection.stat3Value,
                    label: h.fonlokSection.stat3Label,
                  },
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
              {h.categories.title}
            </h2>
            <p className="text-gray-600 leading-relaxed">{h.categories.desc}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {categoryTags.map((tag) => (
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
              {h.categories.exploreMore}{" "}
              <a
                className="text-emerald-700 hover:underline font-medium"
                href="/dashboard"
              >
                {h.categories.marketplace}
              </a>{" "}
              {h.categories.orList}{" "}
              <a
                className="text-emerald-700 hover:underline font-medium"
                href="/dashboard"
              >
                {h.categories.sellerDashboard}
              </a>
              .
            </p>
          </div>

          <div className="rounded-2xl bg-emerald-700 p-8 text-white shadow-xl">
            <h2 className="text-2xl font-bold">
              {h.categories.builtForTrustTitle}
            </h2>
            <p className="mt-3 text-sm text-emerald-100 leading-relaxed">
              {h.categories.builtForTrustDesc}
            </p>
            <div className="mt-6 grid gap-3 text-sm">
              {trustItems.map((item) => (
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
              {h.categories.safetyGuide}
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
              {h.howItWorks.title}
            </h2>
            <p className="mt-2 text-gray-600">{h.howItWorks.subtitle}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorksSteps.map((item) => (
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
                  {common.step} {item.step}
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
            <h2
              id="platform-features"
              className="text-2xl font-bold text-gray-900 sm:text-3xl"
            >
              {h.features.title}
            </h2>
            <p className="mt-2 text-gray-500 max-w-xl mx-auto text-sm">
              {h.features.subtitle}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {h.features.items.map((feat: { title: string; desc: string }) => (
              <article
                key={feat.title}
                className="rounded-xl bg-white border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <h3 className="text-sm font-bold text-gray-900 mb-1.5">
                  {feat.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {feat.desc}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <section className="mt-20" aria-labelledby="faq">
          <div className="mb-8">
            <h2 id="faq" className="text-2xl font-bold text-gray-900">
              {h.faq.title}
            </h2>
            <p className="mt-2 text-gray-500 text-sm">{h.faq.subtitle}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {h.faq.items.map((item: { q: string; a: string }) => (
              <div
                key={item.q}
                className="rounded-xl bg-white border border-gray-100 shadow-sm p-5"
              >
                <h3 className="text-sm font-bold text-gray-900 mb-2">
                  {item.q}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {item.a}
                </p>
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
            {h.cta.badge}
          </div>
          <h2 className="text-2xl font-bold sm:text-3xl">{h.cta.title}</h2>
          <p className="mt-3 text-gray-600 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
            {h.cta.desc}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-7 py-3 text-white font-semibold shadow-lg hover:bg-emerald-700 transition-colors"
            >
              {h.cta.createAccount}
            </a>
            <a
              href="/browse"
              className="inline-flex items-center justify-center rounded-xl border-2 border-gray-200 px-7 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {h.cta.browseListings}
            </a>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-gray-500">
            {h.cta.trustItems.map((item: string) => (
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
            {h.cta.alreadyMember}{" "}
            <a
              className="text-emerald-700 hover:underline font-medium"
              href="/login"
            >
              {h.cta.signIn}
            </a>{" "}
            · {h.cta.needHelp}{" "}
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
