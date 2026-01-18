"use client";
import { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// Helper function to get full image URL
const getImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
};

interface AnalyticsData {
  overview: {
    totalViews: number;
    totalClicks: number;
    ctr: number;
    totalListings: number;
    activeListings: number;
    totalRevenue: number;
  };
  trends: {
    views: number;
    clicks: number;
  };
  performanceData: Array<{
    date: string;
    day: string;
    views: number;
    clicks: number;
  }>;
  trafficSources: {
    search: number;
    browse: number;
    direct: number;
    external: number;
  };
  topListings: Array<{
    id: number;
    title: string;
    price: number;
    currency: string;
    status: string;
    views: number;
    clicks: number;
    ctr: number;
    image: string;
  }>;
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/analytics/dashboard`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        } else {
          setError("Failed to load analytics");
        }
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8">
        <div className="text-center py-8">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-gray-500">
            Analytics will appear once you have listing activity
          </p>
        </div>
      </div>
    );
  }

  const { overview, trends, performanceData, trafficSources, topListings } =
    analytics;

  // Calculate max value for chart scaling
  const maxViews = Math.max(...performanceData.map((d) => d.views), 1);
  const maxClicks = Math.max(...performanceData.map((d) => d.clicks), 1);
  const maxValue = Math.max(maxViews, maxClicks);

  // Calculate traffic source percentages
  const totalTraffic =
    trafficSources.search +
    trafficSources.browse +
    trafficSources.direct +
    trafficSources.external;
  const trafficPercentages = {
    search:
      totalTraffic > 0
        ? Math.round((trafficSources.search / totalTraffic) * 100)
        : 0,
    browse:
      totalTraffic > 0
        ? Math.round((trafficSources.browse / totalTraffic) * 100)
        : 0,
    direct:
      totalTraffic > 0
        ? Math.round((trafficSources.direct / totalTraffic) * 100)
        : 0,
    external:
      totalTraffic > 0
        ? Math.round((trafficSources.external / totalTraffic) * 100)
        : 0,
  };

  // Trend indicator component
  const TrendIndicator = ({
    value,
    label,
  }: {
    value: number;
    label: string;
  }) => (
    <div
      className={`flex items-center gap-1 text-xs font-medium ${
        value >= 0 ? "text-green-600" : "text-red-600"
      }`}
    >
      {value >= 0 ? (
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
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      ) : (
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
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      )}
      <span>
        {Math.abs(value)}% {label}
      </span>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <svg
            className="w-6 h-6 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Performance Analytics
        </h2>
        <span className="text-sm text-gray-500">Last 7 days</span>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {/* Total Views */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-600">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </span>
            <TrendIndicator value={trends.views} label="vs last week" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {overview.totalViews.toLocaleString()}
          </p>
          <p className="text-xs text-gray-600">Total Views</p>
        </div>

        {/* Total Clicks */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-600">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
              </svg>
            </span>
            <TrendIndicator value={trends.clicks} label="vs last week" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {overview.totalClicks.toLocaleString()}
          </p>
          <p className="text-xs text-gray-600">Total Clicks</p>
        </div>

        {/* CTR */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-600">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{overview.ctr}%</p>
          <p className="text-xs text-gray-600">Click Rate (CTR)</p>
        </div>

        {/* Active Listings */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-600">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {overview.activeListings}
          </p>
          <p className="text-xs text-gray-600">Active Listings</p>
        </div>

        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-emerald-600">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            ${overview.totalRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-gray-600">Total Revenue</p>
        </div>

        {/* Total Listings */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-orange-600">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {overview.totalListings}
          </p>
          <p className="text-xs text-gray-600">Total Listings</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 7-Day Performance Chart */}
        <div className="lg:col-span-2 bg-gray-50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            7-Day Performance
          </h3>
          <div className="h-48 flex items-end justify-between gap-2">
            {performanceData.map((day, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div className="w-full flex gap-1 justify-center items-end h-36">
                  {/* Views bar */}
                  <div
                    className="w-3 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                    style={{
                      height: `${
                        maxValue > 0 ? (day.views / maxValue) * 100 : 0
                      }%`,
                      minHeight: day.views > 0 ? "4px" : "0",
                    }}
                    title={`${day.views} views`}
                  />
                  {/* Clicks bar */}
                  <div
                    className="w-3 bg-green-500 rounded-t transition-all hover:bg-green-600"
                    style={{
                      height: `${
                        maxValue > 0 ? (day.clicks / maxValue) * 100 : 0
                      }%`,
                      minHeight: day.clicks > 0 ? "4px" : "0",
                    }}
                    title={`${day.clicks} clicks`}
                  />
                </div>
                <span className="text-xs text-gray-500">{day.day}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-xs text-gray-600">Views</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-xs text-gray-600">Clicks</span>
            </div>
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Traffic Sources
          </h3>
          <div className="space-y-3">
            {/* Search */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 flex items-center gap-1">
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  Search
                </span>
                <span className="font-medium">
                  {trafficPercentages.search}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${trafficPercentages.search}%` }}
                ></div>
              </div>
            </div>

            {/* Browse */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 flex items-center gap-1">
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
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                  Browse
                </span>
                <span className="font-medium">
                  {trafficPercentages.browse}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${trafficPercentages.browse}%` }}
                ></div>
              </div>
            </div>

            {/* Direct */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 flex items-center gap-1">
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
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  Direct
                </span>
                <span className="font-medium">
                  {trafficPercentages.direct}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${trafficPercentages.direct}%` }}
                ></div>
              </div>
            </div>

            {/* External */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 flex items-center gap-1">
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
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  External
                </span>
                <span className="font-medium">
                  {trafficPercentages.external}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all"
                  style={{ width: `${trafficPercentages.external}%` }}
                ></div>
              </div>
            </div>
          </div>

          {totalTraffic === 0 && (
            <p className="text-xs text-gray-400 text-center mt-4">
              No traffic data yet
            </p>
          )}
        </div>
      </div>

      {/* Top Performing Listings */}
      {topListings.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Top Performing Listings
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="pb-3 font-medium">Listing</th>
                  <th className="pb-3 font-medium text-right">Views</th>
                  <th className="pb-3 font-medium text-right">Clicks</th>
                  <th className="pb-3 font-medium text-right">CTR</th>
                  <th className="pb-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topListings.map((listing, index) => (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-gray-400 w-4">
                          {index + 1}
                        </span>
                        {listing.image ? (
                          <img
                            src={getImageUrl(listing.image) || ""}
                            alt={listing.title}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                            {listing.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {listing.currency}{" "}
                            {Number(listing.price).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-sm font-medium text-gray-800">
                        {listing.views.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-sm font-medium text-gray-800">
                        {listing.clicks.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`text-sm font-medium ${
                          listing.ctr >= 5
                            ? "text-green-600"
                            : listing.ctr >= 2
                            ? "text-yellow-600"
                            : "text-gray-600"
                        }`}
                      >
                        {listing.ctr}%
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          listing.status === "Available"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {listing.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {topListings.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-xl">
          <svg
            className="w-12 h-12 text-gray-300 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm text-gray-500">
            Create listings to see performance data
          </p>
        </div>
      )}
    </div>
  );
}
