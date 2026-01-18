"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// Helper function to get full image URL
const getImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
};

interface Seller {
  name: string;
  picture: string | null;
  verified: boolean;
}

interface TopListing {
  id: number;
  title: string;
  price: number;
  currency: string;
  status: string;
  image: string | null;
  views: number;
  clicks: number;
  seller: Seller;
  isSold: boolean;
  isHot: boolean;
}

interface CategoryTopSellers {
  category: {
    id: number;
    name: string;
  };
  listings: TopListing[];
}

interface TopSellersProps {
  className?: string;
}

export default function TopSellers({ className = "" }: TopSellersProps) {
  const router = useRouter();
  const [topSellers, setTopSellers] = useState<CategoryTopSellers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  useEffect(() => {
    const fetchTopSellers = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/analytics/top-sellers?limit=4`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          setTopSellers(data.topSellers || []);
        } else {
          setError("Failed to load top sellers");
        }
      } catch (err) {
        console.error("Error fetching top sellers:", err);
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    };

    fetchTopSellers();
  }, []);

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-4 sm:p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Top Sellers</h2>
            <p className="text-sm text-gray-500">What&apos;s selling well</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || topSellers.length === 0) {
    return null; // Don't show section if no data
  }

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-4 sm:p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Top Sellers by Category
            </h2>
            <p className="text-sm text-gray-500">
              See what&apos;s trending in each category
            </p>
          </div>
        </div>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
              clipRule="evenodd"
            />
          </svg>
          Updated live
        </span>
      </div>

      {/* Categories Grid */}
      <div className="space-y-4">
        {topSellers.map((categoryData) => (
          <div
            key={categoryData.category.id}
            className="border border-gray-100 rounded-xl overflow-hidden hover:border-green-200 transition-all"
          >
            {/* Category Header */}
            <button
              onClick={() =>
                setExpandedCategory(
                  expandedCategory === categoryData.category.id
                    ? null
                    : categoryData.category.id
                )
              }
              className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between hover:from-green-50 hover:to-white transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-gray-800">
                  {categoryData.category.name}
                </span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  {categoryData.listings.length} hot items
                </span>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  expandedCategory === categoryData.category.id
                    ? "rotate-180"
                    : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Listings Grid - Always visible for first 2, expandable for rest */}
            <div
              className={`px-4 pb-4 ${
                expandedCategory === categoryData.category.id
                  ? ""
                  : "max-h-[180px] overflow-hidden"
              }`}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
                {categoryData.listings.map((listing, index) => (
                  <div
                    key={listing.id}
                    onClick={() => router.push(`/listing/${listing.id}`)}
                    className={`relative bg-white rounded-lg border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md hover:border-green-300 transition-all transform hover:-translate-y-0.5 ${
                      index >= 2 &&
                      expandedCategory !== categoryData.category.id
                        ? "hidden md:block"
                        : ""
                    }`}
                  >
                    {/* Hot Badge */}
                    {listing.isHot && (
                      <div className="absolute top-1 left-1 z-10">
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                          🔥 HOT
                        </span>
                      </div>
                    )}

                    {/* Sold Badge */}
                    {listing.isSold && (
                      <div className="absolute top-1 right-1 z-10">
                        <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-900 text-white text-[10px] font-bold rounded-full">
                          SOLD
                        </span>
                      </div>
                    )}

                    {/* Image */}
                    <div className="relative h-20 bg-gray-100">
                      {listing.image ? (
                        <img
                          src={getImageUrl(listing.image) || ""}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <svg
                            className="w-8 h-8"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-2">
                      <h4 className="text-xs font-medium text-gray-800 truncate mb-1">
                        {listing.title}
                      </h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-green-600">
                          {listing.currency}{" "}
                          {Number(listing.price).toLocaleString()}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path
                              fillRule="evenodd"
                              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {listing.views}
                        </div>
                      </div>

                      {/* Seller Info */}
                      <div className="flex items-center gap-1 mt-1.5">
                        {listing.seller.picture ? (
                          <img
                            src={getImageUrl(listing.seller.picture) || ""}
                            alt={listing.seller.name}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-400 to-yellow-400 flex items-center justify-center text-white text-[8px] font-bold">
                            {listing.seller.name?.charAt(0) || "?"}
                          </div>
                        )}
                        <span className="text-[10px] text-gray-500 truncate">
                          {listing.seller.name}
                        </span>
                        {listing.seller.verified && (
                          <svg
                            className="w-3 h-3 text-blue-500 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
