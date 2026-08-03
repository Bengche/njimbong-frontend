import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How Njimbong Works — Safe Buying & Selling in Cameroon",
  description:
    "Learn how Njimbong's escrow-protected marketplace works. Discover how to buy and sell safely in Cameroon using Fonlok escrow payments, KYC verification, dispute protection, and real-time chat.",
  keywords: [
    "how Njimbong works",
    "safe marketplace Cameroon",
    "Fonlok escrow explanation",
    "buy safely Cameroon",
    "sell online Cameroon",
    "KYC verification marketplace",
    "dispute protection Cameroon",
    "escrow payment MTN MoMo",
  ],
  alternates: { canonical: "/about" },
  openGraph: {
    title: "How Njimbong Works — Safe Buying & Selling in Cameroon",
    description:
      "Njimbong uses Fonlok escrow, KYC verification, and AI-powered tools to make buying and selling in Cameroon safe, fast, and trusted.",
    type: "website",
    url: "https://njimbong.com/about",
  },
};

const STEPS_BUY = [
  {
    n: "01",
    title: "Browse & Find",
    body: "Search thousands of listings by category, location, or keyword. Filter by condition, price range, and city.",
  },
  {
    n: "02",
    title: "Chat with the Seller",
    body: "Use the built-in real-time chat to ask questions, negotiate, and agree on terms before committing.",
  },
  {
    n: "03",
    title: "Pay via Escrow",
    body: "Pay securely via MTN MoMo or Orange Money into Fonlok's escrow vault. Your money is held safely — not released until you confirm.",
  },
  {
    n: "04",
    title: "Receive & Confirm",
    body: "Receive your item, inspect it, and if satisfied, confirm delivery. Funds are released to the seller instantly.",
  },
];

const STEPS_SELL = [
  {
    n: "01",
    title: "Create Your Listing",
    body: "Post your item for free in under 2 minutes. Add photos, set a price, describe the condition, and go live instantly.",
  },
  {
    n: "02",
    title: "Get KYC Verified",
    body: "Verify your identity to earn the blue KYC badge. Verified sellers attract more buyers and rank higher in search.",
  },
  {
    n: "03",
    title: "Receive Buyer Offers",
    body: "Chat with interested buyers, answer questions, and negotiate — all within the Njimbong platform.",
  },
  {
    n: "04",
    title: "Get Paid Securely",
    body: "Once the buyer confirms delivery, Fonlok releases funds to your MoMo wallet automatically. No cash-handling risk.",
  },
];

const FEATURES = [
  {
    title: "Fonlok Escrow",
    desc: "Cameroon's dedicated escrow service holds funds securely via MTN MoMo and Orange Money until delivery is confirmed.",
    emoji: "🔒",
  },
  {
    title: "KYC Verification",
    desc: "Sellers can submit a government ID for identity verification. KYC-verified accounts earn a blue badge and build buyer trust.",
    emoji: "✅",
  },
  {
    title: "Trust Score",
    desc: "A 0–100% rating calculated from KYC status, completed transactions, reviews, and dispute history. Visible on every profile.",
    emoji: "⭐",
  },
  {
    title: "Real-time Chat",
    desc: "Encrypted in-platform messaging between buyers and sellers. No need to share personal phone numbers.",
    emoji: "💬",
  },
  {
    title: "Dispute Resolution",
    desc: "If something goes wrong, open a dispute. Fonlok mediates with full chat context and makes a binding decision.",
    emoji: "🛡️",
  },
  {
    title: "Njimbong AI",
    desc: "AI assistant powered by Google Gemini. Helps buyers find items, spot scams, and helps sellers auto-fill listings from photos.",
    emoji: "🤖",
  },
  {
    title: "Visual Search",
    desc: "Upload any image and the AI finds matching listings. Perfect for finding the exact item you're looking for.",
    emoji: "🔍",
  },
  {
    title: "Push Notifications",
    desc: "Real-time alerts for messages, offers, payment events, and dispute updates — delivered to your phone instantly.",
    emoji: "🔔",
  },
];

const FAQ = [
  {
    q: "Is Njimbong safe for online payments in Cameroon?",
    a: "Yes. Every payment on Njimbong is protected by Fonlok escrow. Your Mobile Money payment is held securely and only released to the seller after you confirm receipt. If anything goes wrong, you can open a dispute.",
  },
  {
    q: "How does Fonlok escrow actually work?",
    a: "When you buy, you pay via MTN MoMo or Orange Money into a secure Fonlok escrow vault — not directly to the seller. The seller ships or hands over the item. You inspect it, and if satisfied, confirm delivery. Only then are funds released to the seller.",
  },
  {
    q: "What happens if there is a problem with my order?",
    a: "Open a dispute from your orders page. Fonlok receives the full chat transcript and evidence, then mediates the case. They can issue a refund or release funds to the seller depending on the evidence.",
  },
  {
    q: "How do I become a KYC-verified seller?",
    a: "Go to your Profile settings and submit a valid government-issued ID. Once reviewed and approved, your profile shows a blue KYC badge. Verified sellers attract significantly more buyers.",
  },
  {
    q: "What is the Trust Score?",
    a: "The Trust Score is a 0–100% rating visible on every seller profile. It is calculated from KYC status, completed transactions, reviews, and dispute record. A higher Trust Score ranks your listings better in search results.",
  },
  {
    q: "Is listing on Njimbong free?",
    a: "Yes. Creating an account and posting listings is completely free. There are no subscription fees or listing charges. Fonlok escrow fees apply only when a secure payment transaction is processed.",
  },
  {
    q: "What categories can I sell on Njimbong?",
    a: "Electronics, phones, laptops, fashion, vehicles, home & living, furniture, real estate, agricultural products, services, books, gaming, and local deals — with more categories being added regularly.",
  },
  {
    q: "What is Njimbong AI?",
    a: "Njimbong AI is a built-in assistant powered by Google Gemini. It helps buyers find products, compare prices, and avoid scams. For sellers, it auto-fills listing details from a photo, suggests fair prices in XAF, and optimises descriptions for search.",
  },
];

/* ── Section header component ────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.15em] mb-3">
      {children}
    </p>
  );
}

export default function AboutPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="border-b border-gray-100 bg-gradient-to-br from-emerald-50 via-white to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-emerald-600 transition-colors mb-8"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to marketplace
          </Link>

          <SectionLabel>How it works</SectionLabel>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
            Buying & selling in Cameroon,{" "}
            <span className="text-emerald-600">done right.</span>
          </h1>
          <p className="mt-5 text-gray-500 text-base sm:text-lg max-w-2xl leading-relaxed">
            Njimbong is built on one principle: every transaction in Cameroon
            should be safe, transparent, and fair — for both buyers and sellers.
            Here&apos;s how the platform makes that happen.
          </p>

          {/* Quick trust badges */}
          <div className="mt-8 flex flex-wrap gap-3">
            {[
              "🔒 Fonlok Escrow",
              "✅ KYC Verified Sellers",
              "🛡️ Dispute Protection",
              "💬 Real-time Chat",
              "🤖 Njimbong AI",
              "⭐ Trust Scores",
            ].map((b) => (
              <span
                key={b}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* ── HOW TO BUY ──────────────────────────────────────────────── */}
        <section className="py-14 sm:py-16 border-b border-gray-100">
          <SectionLabel>For Buyers</SectionLabel>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
            How to buy safely on Njimbong
          </h2>
          <p className="text-gray-500 text-sm sm:text-base mb-10 max-w-xl leading-relaxed">
            Every purchase is protected by Fonlok escrow. You pay — but the
            seller only receives funds after you confirm everything is in order.
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
            {STEPS_BUY.map((s) => (
              <div
                key={s.n}
                className="flex gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-5 hover:border-emerald-100 hover:bg-emerald-50/30 transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-600 text-white text-sm font-black flex items-center justify-center">
                  {s.n}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{s.title}</p>
                  <p className="text-gray-500 text-sm mt-1 leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-white text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm"
            >
              Browse listings now
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>

        {/* ── HOW TO SELL ─────────────────────────────────────────────── */}
        <section className="py-14 sm:py-16 border-b border-gray-100">
          <SectionLabel>For Sellers</SectionLabel>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
            How to sell on Njimbong
          </h2>
          <p className="text-gray-500 text-sm sm:text-base mb-10 max-w-xl leading-relaxed">
            Free to list. No subscription fees. Get paid securely via Mobile
            Money when the buyer confirms receipt.
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
            {STEPS_SELL.map((s) => (
              <div
                key={s.n}
                className="flex gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-5 hover:border-emerald-100 hover:bg-emerald-50/30 transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-900 text-white text-sm font-black flex items-center justify-center">
                  {s.n}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{s.title}</p>
                  <p className="text-gray-500 text-sm mt-1 leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-white text-sm font-bold hover:bg-gray-800 transition-colors shadow-sm"
            >
              Start selling — it&apos;s free
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>

        {/* ── FONLOK ESCROW DEEP DIVE ──────────────────────────────────── */}
        <section className="py-14 sm:py-16 border-b border-gray-100">
          <SectionLabel>Payment Protection</SectionLabel>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
            What is Fonlok escrow?
          </h2>
          <p className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-2xl">
            Fonlok is Cameroon&apos;s dedicated escrow payment service. It acts
            as a neutral third-party that holds your payment securely while the
            transaction is completed.
          </p>

          <div className="mt-8 rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-800 to-gray-900 p-7 sm:p-10 text-white">
            <div className="grid gap-8 md:grid-cols-2 md:items-start">
              <div>
                <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-4">
                  How Fonlok works
                </p>
                <div className="space-y-5">
                  {[
                    {
                      icon: "💳",
                      title: "Buyer pays via MoMo",
                      body: "Funds go to Fonlok's escrow vault via MTN MoMo or Orange Money — never directly to the seller.",
                    },
                    {
                      icon: "📦",
                      title: "Item is delivered",
                      body: "The seller ships or hands over the item while funds are safely held.",
                    },
                    {
                      icon: "✅",
                      title: "Buyer confirms receipt",
                      body: "You inspect the item. If everything is as described, you confirm delivery.",
                    },
                    {
                      icon: "💸",
                      title: "Seller gets paid",
                      body: "Fonlok releases funds to the seller's MoMo wallet automatically.",
                    },
                  ].map((step) => (
                    <div key={step.title} className="flex gap-4 items-start">
                      <span className="text-2xl flex-shrink-0 leading-none">{step.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-white">{step.title}</p>
                        <p className="text-xs text-emerald-200 mt-0.5 leading-relaxed">{step.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-4">
                  If something goes wrong
                </p>
                <div className="rounded-2xl bg-white/10 border border-white/10 p-5 space-y-3">
                  <p className="text-sm font-semibold text-white">
                    Dispute Resolution
                  </p>
                  <p className="text-xs text-emerald-200 leading-relaxed">
                    If you receive the wrong item, a damaged item, or nothing at
                    all — open a dispute from your Orders page. Fonlok receives
                    the full chat transcript as evidence and mediates the case.
                  </p>
                  <ul className="space-y-2 text-xs text-emerald-200">
                    {[
                      "Submit dispute with description and photos",
                      "Fonlok reviews chat history and evidence",
                      "Binding decision: refund or release to seller",
                      "Both parties notified by email",
                    ].map((p) => (
                      <li key={p} className="flex items-start gap-2">
                        <svg
                          className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl bg-white/10 border border-white/10 p-5">
                  <p className="text-xs text-emerald-200 leading-relaxed">
                    <strong className="text-white">Important:</strong> Never
                    agree to pay outside the Njimbong platform. Any seller
                    asking for a direct MoMo payment before listing is a scam
                    attempt. Escrow is only effective when payment goes through
                    Fonlok.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PLATFORM FEATURES ───────────────────────────────────────── */}
        <section className="py-14 sm:py-16 border-b border-gray-100">
          <SectionLabel>Platform</SectionLabel>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
            Everything built for trust
          </h2>
          <p className="text-gray-500 text-sm sm:text-base mb-10 max-w-xl leading-relaxed">
            Njimbong isn&apos;t just a listings board. Every feature is designed
            to protect you and make transactions as smooth as possible.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-5 hover:border-emerald-100 hover:bg-emerald-50/40 transition-colors"
              >
                <span className="text-2xl mb-3 block">{f.emoji}</span>
                <p className="text-sm font-bold text-gray-900 mb-1.5">{f.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <section className="py-14 sm:py-16 border-b border-gray-100">
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
            Common questions
          </h2>
          <p className="text-gray-500 text-sm mb-10">
            Can&apos;t find what you&apos;re looking for?{" "}
            <a
              href="mailto:support@njimbong.com"
              className="text-emerald-600 font-semibold hover:underline"
            >
              Email our team
            </a>
            .
          </p>

          <div className="space-y-4">
            {FAQ.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-gray-100 p-5 hover:border-gray-200 transition-colors"
              >
                <p className="text-sm font-bold text-gray-900 mb-2">{item.q}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FINAL CTA ───────────────────────────────────────────────── */}
        <section className="py-14 sm:py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Ready to get started?
          </h2>
          <p className="mt-3 text-gray-500 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            Join thousands of Cameroonians buying and selling safely on
            Njimbong. Free account, no hidden fees.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-8 py-3.5 text-white font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Create free account
            </Link>
            <Link
              href="/browse"
              className="inline-flex items-center justify-center rounded-2xl border-2 border-gray-200 px-8 py-3.5 text-gray-700 font-bold text-sm hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Browse listings
            </Link>
          </div>
          <p className="mt-6 text-xs text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-600 font-semibold hover:underline">
              Sign in
            </Link>
            {" · "}
            Questions?{" "}
            <a
              href="mailto:support@njimbong.com"
              className="text-emerald-600 font-semibold hover:underline"
            >
              support@njimbong.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
