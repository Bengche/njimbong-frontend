import type { Metadata } from "next";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";

export const metadata: Metadata = {
  title: "Safety & Trust — Njimbong Marketplace",
  description:
    "Learn how Njimbong protects every buyer and seller with Fonlok escrow payments, KYC verification, dispute resolution, and professional moderation.",
  keywords: [
    "Fonlok escrow Cameroon",
    "secure payment Cameroon",
    "safe online marketplace",
    "buyer protection Cameroon",
    "escrow dispute resolution",
    "Njimbong safety",
  ],
};

export default function SafetyTrustPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10 lg:py-14">
      <PageHeader
        title="Safety & Trust"
        description="Every feature on Njimbong is built around one goal — keeping you and your money safe."
      />

      {/* ── FONLOK ESCROW ─────────────────────────────────────────── */}
      <section className="mt-10" aria-labelledby="fonlok-heading">
        <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-700 to-emerald-900 shadow-xl">
          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-7 h-7 text-white"
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
                <h2
                  id="fonlok-heading"
                  className="text-2xl font-bold text-white"
                >
                  Fonlok Escrow Payments
                </h2>
                <p className="text-emerald-200 text-sm mt-1">
                  Your money is protected on every XAF transaction
                </p>
              </div>
            </div>

            <p className="text-emerald-100 leading-relaxed mb-8 text-sm sm:text-base">
              Njimbong integrates with{" "}
              <strong className="text-white">Fonlok</strong> — Cameroon&apos;s
              dedicated escrow payment platform — to protect both buyers and
              sellers on every transaction. When you pay via Fonlok, your MoMo
              funds are held securely and only released when you confirm you
              have received your item in the expected condition.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 mb-8">
              {[
                {
                  icon: "🛒",
                  title: "For Buyers",
                  points: [
                    "Pay safely via MTN MoMo or Orange Money",
                    "Funds locked — seller cannot access them until delivery",
                    "Inspect the item before confirming receipt",
                    "Open a dispute if the item is wrong or never arrives",
                    "Full refund if the dispute is resolved in your favour",
                  ],
                },
                {
                  icon: "🏪",
                  title: "For Sellers",
                  points: [
                    "Payment is guaranteed before you prepare delivery",
                    "No risk of buyer backing out after item is handed over",
                    "Funds released instantly once buyer confirms receipt",
                    "Dispute process is fair and evidence-based",
                    "Build trust with verified escrow transactions",
                  ],
                },
              ].map((col) => (
                <div
                  key={col.title}
                  className="rounded-2xl bg-white/10 border border-white/10 px-5 py-5"
                >
                  <p className="text-lg mb-3">
                    {col.icon}{" "}
                    <span className="font-bold text-white text-sm">
                      {col.title}
                    </span>
                  </p>
                  <ul className="space-y-2.5">
                    {col.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-2 text-xs text-emerald-100"
                      >
                        <svg
                          className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0"
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
                </div>
              ))}
            </div>

            {/* Step-by-step */}
            <h3 className="text-white font-bold mb-4">
              How an Escrow Payment Works — Step by Step
            </h3>
            <div className="space-y-3">
              {[
                {
                  n: "01",
                  label: "Buyer initiates escrow payment",
                  detail:
                    'Select "Buy Securely via Fonlok Escrow" on a listing and enter your MoMo number. The payment prompt is sent to your phone.',
                },
                {
                  n: "02",
                  label: "Funds locked in escrow vault",
                  detail:
                    "Your MoMo payment is deducted and locked inside the Fonlok escrow vault. The seller is notified that funds are secured.",
                },
                {
                  n: "03",
                  label: "Seller prepares and delivers the item",
                  detail:
                    "With payment guaranteed, the seller ships the item or arranges a safe in-person handover.",
                },
                {
                  n: "04",
                  label: "Buyer inspects and confirms",
                  detail:
                    "Once you receive the item, inspect it carefully. If satisfied, confirm delivery on Njimbong and funds are instantly released to the seller.",
                },
                {
                  n: "05",
                  label: "Dispute? Open a case",
                  detail:
                    "If the item is not as described, wrong, or never arrives, open a dispute. Our moderation team reviews evidence from both parties and mediates a fair resolution.",
                },
              ].map((s) => (
                <div
                  key={s.n}
                  className="flex gap-4 items-start rounded-xl bg-white/8 border border-white/10 px-4 py-3.5"
                >
                  <span className="text-xs font-black text-emerald-300 mt-0.5 flex-shrink-0 w-6">
                    {s.n}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {s.label}
                    </p>
                    <p className="text-xs text-emerald-200 mt-0.5 leading-relaxed">
                      {s.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-white text-emerald-800 font-semibold px-6 py-3 text-sm hover:bg-emerald-50 transition-colors shadow"
              >
                Start Buying Safely
              </a>
              <a
                href="/browse"
                className="inline-flex items-center justify-center rounded-xl border border-white/30 text-white font-semibold px-6 py-3 text-sm hover:bg-white/10 transition-colors"
              >
                Browse Listings
              </a>
            </div>
          </div>

          {/* Stat bar */}
          <div className="border-t border-white/10 px-6 py-4 sm:px-10">
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { v: "100%", l: "XAF payments escrow-secured" },
                { v: "MoMo", l: "MTN & Orange Money" },
                { v: "24h", l: "Dispute resolution target" },
              ].map((s) => (
                <div key={s.l}>
                  <p className="text-lg font-bold text-emerald-300">{s.v}</p>
                  <p className="text-xs text-emerald-300 mt-0.5 leading-tight">
                    {s.l}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── OTHER PROTECTIONS ────────────────────────────────────── */}
      <section
        className="mt-10 grid gap-5 sm:grid-cols-2"
        aria-labelledby="other-protections"
      >
        <h2
          id="other-protections"
          className="sm:col-span-2 text-xl font-bold text-gray-900"
        >
          More Ways We Keep You Safe
        </h2>
        {[
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
            title: "KYC Identity Verification",
            text: "Sellers can submit government ID, a selfie, and supporting documents for KYC verification. Verified sellers display a blue badge on their profile and listings, giving buyers greater confidence.",
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            ),
            title: "One-Tap Reporting",
            text: "Any listing, seller, or message can be reported in one tap. Our moderation team reviews every report, removes harmful content, and takes action against bad actors — including account suspensions.",
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
            title: "Secure On-Platform Messaging",
            text: "All buyer-seller communication happens within Njimbong's chat. Never share your phone number, bank details, or external payment links. If a seller pressures you to pay outside the platform, report it immediately.",
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
            title: "Listing Moderation",
            text: "Every listing is reviewed before going live. Our team checks for prohibited items, misleading descriptions, and policy violations. Approved listings carry the assurance that the basics have been verified.",
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
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            ),
            title: "Trust Scores & Reviews",
            text: "Every user on Njimbong earns a trust score based on completed transactions, KYC status, response rate, and community feedback. Check a seller's trust score and read reviews before committing to a deal.",
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ),
            title: "Smart Buying Tips",
            text: "For high-value items, always use escrow. Meet in public places for in-person handovers. Verify condition before accepting delivery. Keep all communication on Njimbong — never move to WhatsApp or share financial details.",
          },
        ].map((item) => (
          <Card key={item.title} className="h-full">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                  {item.text}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </section>

      {/* ── RED FLAGS ─────────────────────────────────────────────── */}
      <section className="mt-10">
        <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-6 sm:px-8">
          <h2 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-red-600"
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
            Red Flags — Stop and Report Immediately
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            {[
              "Seller asks you to pay outside Njimbong (WhatsApp, bank transfer, Western Union)",
              "Price is suspiciously far below market value",
              "Seller refuses to use Fonlok escrow for XAF transactions",
              "Listing images look professionally stolen or inconsistent",
              "Seller pushes you to finalize urgently before you inspect the item",
              "Request for personal details such as national ID or bank credentials",
            ].map((flag) => (
              <div key={flag} className="flex items-start gap-2.5 text-red-800">
                <svg
                  className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs leading-relaxed">{flag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUPPORT ──────────────────────────────────────────────── */}
      <Card className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-900">
              Need help or want to report an issue?
            </h2>
            <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
              Our support team responds as quickly as possible. Whether you have
              a dispute, spotted a suspicious listing, or have a question about
              an escrow payment — we are here.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end flex-shrink-0">
            <a
              href="mailto:support@njimbong.com"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-5 py-2.5 text-sm font-semibold hover:bg-emerald-700 transition-colors"
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              support@njimbong.com
            </a>
            <a
              href="/terms-privacy"
              className="text-xs text-emerald-700 hover:underline font-medium"
            >
              Terms &amp; Privacy Policy →
            </a>
          </div>
        </div>
      </Card>
    </main>
  );
}
