import type { Metadata } from "next";
import Axios from "axios";

export const metadata: Metadata = {
  title: "Njimbong Marketplace",
  description:
    "Njimbong: The Trusted Marketplace to Buy and Sell Online. Discover local deals, verified sellers, and secure messaging for a safer buying and selling experience.",
  keywords: [
    "Njimbong",
    "Njimbong Marketplace",
    "marketplace",
    "buy and sell",
    "buy and sell online",
    "online marketplace",
    "local marketplace",
    "trusted marketplace",
    "safe marketplace",
    "sell items online",
    "buy used items",
    "local deals",
    "classifieds",
    "buy sell near me",
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Njimbong Marketplace",
            description:
              "Njimbong: The Trusted Marketplace to Buy and Sell Online.",
            url: "https://njimbong.com",
          }),
        }}
      />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 md:py-20">
        <section className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1 text-sm font-semibold text-emerald-700">
              Njimbong Marketplace
            </p>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Njimbong: The Trusted Marketplace to Buy and Sell Online
            </h1>
            <p className="text-lg text-gray-600">
              Njimbong Marketplace helps people buy and sell online with
              confidence. Discover trusted listings, connect with real buyers
              and sellers, and manage your marketplace activity in one
              professional place.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-white font-semibold shadow-lg hover:bg-emerald-700"
              >
                Browse the Marketplace
              </a>
              <a
                href="/signup"
                className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-white px-6 py-3 font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                Create a Seller Account
              </a>
            </div>
            <p className="text-sm text-gray-500">
              Popular searches: marketplace, buy and sell online, local
              marketplace, Njimbong Marketplace.
            </p>
          </div>

          {/* 2. FIXED PART: Map over the fetched 'listings' array */}

          <div className="rounded-2xl bg-white/80 p-6 shadow-xl border border-emerald-100">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Why Njimbong?</h2>
              <ul className="space-y-3 text-sm text-gray-600">
                <li>• Trusted marketplace with verified profiles</li>
                <li>• Simple navigation with smart discovery</li>
                <li>• High-quality listings and fast search filters</li>
                <li>• Professional moderation and reporting tools</li>
              </ul>
              <div className="flex flex-wrap gap-2 text-xs">
                <a
                  href="/login"
                  className="rounded-full border border-emerald-200 px-3 py-1 text-emerald-700 hover:bg-emerald-50"
                >
                  Sign in
                </a>
                <a
                  href="/favorites"
                  className="rounded-full border border-emerald-200 px-3 py-1 text-emerald-700 hover:bg-emerald-50"
                >
                  Wishlist
                </a>
                <a
                  href="/profile"
                  className="rounded-full border border-emerald-200 px-3 py-1 text-emerald-700 hover:bg-emerald-50"
                >
                  My profile
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Buy with Confidence",
              text: "Shop trusted listings, compare prices, and connect instantly with sellers.",
            },
            {
              title: "Sell Faster",
              text: "List items in minutes, reach local buyers, and manage offers in one place.",
            },
            {
              title: "Safe & Transparent",
              text: "Reviews, reporting, and trust signals help keep the marketplace safe.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl bg-white p-6 shadow-md border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {card.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600">{card.text}</p>
            </div>
          ))}
        </section>

        {/* listings */}
        {/* SECTION 2: NEW LISTINGS SECTION (Now below the hero!) */}
        <section className="mt-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Featured Listings</h2>
            <a
              href="/dashboard"
              className="text-emerald-700 font-semibold hover:underline"
            >
              View all
            </a>
          </div>

          {listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing: any) => (
                <div
                  key={listing.id}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:shadow-lg"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                    {listing.imageurl ? (
                      <img
                        src={listing.imageurl}
                        alt={listing.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 truncate">
                      {listing.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {listing.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xl font-bold text-emerald-700">
                        {listing.currency} {listing.price}
                      </span>
                      <a
                        href={`/listings/${listing.id}`}
                        className="rounded-md bg-gray-50 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        Details
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-gray-200 py-20 text-center">
              <p className="text-gray-500 italic">
                No featured listings available right now.
              </p>
            </div>
          )}
        </section>

        <section
          className="mt-16 grid gap-10 md:grid-cols-2"
          aria-labelledby="categories"
        >
          <div className="space-y-4">
            <h2 id="categories" className="text-2xl font-bold">
              The Marketplace for Every Category
            </h2>
            <p className="text-gray-600">
              Njimbong Marketplace helps you buy and sell online across
              electronics, fashion, home, vehicles, services, and more. Whether
              you are shopping locally or looking to sell items online, Njimbong
              is your marketplace destination.
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
                  className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 hover:bg-emerald-100"
                >
                  {tag}
                </a>
              ))}
            </div>
            <p className="text-sm text-gray-500">
              Explore more on the{" "}
              <a className="text-emerald-700 hover:underline" href="/dashboard">
                marketplace
              </a>{" "}
              or list your first item from the{" "}
              <a className="text-emerald-700 hover:underline" href="/dashboard">
                seller dashboard
              </a>
              .
            </p>
          </div>

          <div className="rounded-2xl bg-emerald-700 p-8 text-white shadow-xl">
            <h2 className="text-2xl font-bold">Built for Trust</h2>
            <p className="mt-3 text-sm text-emerald-100">
              Njimbong combines verification tools, moderation, and clear
              feedback to keep your marketplace experience reliable. Buy and
              sell online with confidence and clarity.
            </p>
            <div className="mt-6 grid gap-3 text-sm">
              <div className="rounded-lg bg-emerald-600/60 px-4 py-3">
                Clean UX with fast navigation
              </div>
              <div className="rounded-lg bg-emerald-600/60 px-4 py-3">
                Smart search and category discovery
              </div>
              <div className="rounded-lg bg-emerald-600/60 px-4 py-3">
                Professional moderation and seller verification
              </div>
            </div>
          </div>
        </section>

        <section
          className="mt-16 grid gap-6 md:grid-cols-3"
          aria-labelledby="how-it-works"
        >
          <div className="md:col-span-3">
            <h2 id="how-it-works" className="text-2xl font-bold">
              How Njimbong Marketplace Works
            </h2>
            <p className="mt-2 text-gray-600">
              Buy and sell online in three simple steps designed for speed and
              trust.
            </p>
          </div>
          {[
            {
              step: "1",
              title: "Create your account",
              text: "Sign up, verify your profile, and start building trust in the marketplace.",
              link: "/signup",
              linkText: "Create account",
            },
            {
              step: "2",
              title: "List or shop",
              text: "Post listings or browse the marketplace to find the right deal.",
              link: "/dashboard",
              linkText: "Browse listings",
            },
            {
              step: "3",
              title: "Chat and close",
              text: "Message safely, manage offers, and close the deal with confidence.",
              link: "/chat",
              linkText: "Open chat",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-2xl bg-white p-6 shadow-md border border-gray-100"
            >
              <div className="text-sm font-semibold text-emerald-700">
                Step {item.step}
              </div>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600">{item.text}</p>
              <a
                href={item.link}
                className="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:underline"
              >
                {item.linkText}
              </a>
            </div>
          ))}
        </section>

        <section className="mt-16 rounded-3xl bg-white p-10 shadow-xl border border-emerald-100 text-center">
          <h2 className="text-3xl font-bold">
            Join Njimbong Marketplace Today
          </h2>
          <p className="mt-3 text-gray-600">
            Start buying and selling online on a trusted marketplace built for
            the next generation of commerce.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-white font-semibold shadow-lg hover:bg-emerald-700"
            >
              Create Account
            </a>
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Explore Listings
            </a>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Already a member?{" "}
            <a className="text-emerald-700 hover:underline" href="/login">
              Sign in
            </a>{" "}
            to manage your listings and offers.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Need help?{" "}
            <a
              className="text-emerald-700 hover:underline"
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
