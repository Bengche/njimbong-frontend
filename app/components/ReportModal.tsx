"use client";

import React, { useState, useEffect, useCallback } from "react";
// import { headers } from "next/headers";

interface ReportReason {
  id: number;
  name: string;
  description: string;
  severity: string;
  category: string;
}

type RawReason = {
  id?: number | string;
  name?: string;
  reason?: string;
  description?: string;
  severity?: number | string;
  category?: string;
};

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "listing" | "user";
  targetId: number;
  targetName: string;
}

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName,
}: ReportModalProps) {
  const [reasons, setReasons] = useState<ReportReason[]>([]);
  const [selectedReason, setSelectedReason] = useState<number | null>(null);
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

  const normalizeReasons = (raw: unknown): ReportReason[] => {
    const list = Array.isArray(raw)
      ? raw
      : typeof raw === "object" &&
        raw !== null &&
        Array.isArray((raw as any).reasons)
      ? (raw as { reasons: unknown[] }).reasons
      : [];

    return list
      .filter(
        (reason): reason is RawReason =>
          typeof reason === "object" && reason !== null
      )
      .map((reason) => ({
        id: Number(reason.id),
        name: reason.name ?? reason.reason ?? "Unknown",
        description: reason.description ?? "",
        severity:
          typeof reason.severity === "number"
            ? reason.severity >= 3
              ? "high"
              : reason.severity === 2
              ? "medium"
              : "low"
            : String(reason.severity || "low").toLowerCase(),
        category: reason.category ?? "Other",
      }));
  };

  // Fetch report reasons
  const fetchReasons = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/reports/reasons?type=${targetType}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) throw new Error("Failed to fetch reasons");
      const data = await response.json();
      setReasons(normalizeReasons(data));
    } catch (err) {
      console.error("Error fetching reasons:", err);
      setError("Failed to load report reasons");
    } finally {
      setLoading(false);
    }
  }, [API_BASE, targetType]);

  useEffect(() => {
    if (isOpen) {
      fetchReasons();
      setSelectedReason(null);
      setCustomReason("");
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, fetchReasons]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedReason) {
      setError("Please select a reason for reporting");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const endpoint =
        targetType === "listing"
          ? `${API_BASE}/api/reports/listing/${targetId}`
          : `${API_BASE}/api/reports/user/${targetId}`;

      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reasonId: selectedReason,
          customReason: customReason.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit report");
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to submit report";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
      case "critical":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-green-600 bg-green-50";
    }
  };

  // Group reasons by category
  const groupedReasons = reasons.reduce((acc, reason) => {
    const category = reason.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(reason);
    return acc;
  }, {} as Record<string, ReportReason[]>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b bg-gradient-to-r from-red-500 to-orange-500 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">
                Report {targetType === "listing" ? "Listing" : "User"}
              </h2>
              <p className="text-sm opacity-90 mt-1 truncate max-w-[250px]">
                {targetName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Report Submitted
              </h3>
              <p className="text-gray-600">
                Thank you for helping keep our community safe. We will review
                your report soon.
              </p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Why are you reporting this {targetType}?
                </label>

                <div className="space-y-3">
                  {Object.entries(groupedReasons).length === 0 ? (
                    <div className="text-sm text-gray-500">
                      No report reasons are available right now. Please try
                      again later.
                    </div>
                  ) : (
                    Object.entries(groupedReasons).map(
                      ([category, categoryReasons]) => (
                        <div key={category}>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                            {category}
                          </h4>
                          <div className="space-y-2">
                            {categoryReasons.map((reason) => (
                              <label
                                key={reason.id}
                                className={`flex items-start p-3 rounded-lg border cursor-pointer transition ${
                                  selectedReason === reason.id
                                    ? "border-red-500 bg-red-50"
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="reason"
                                  value={reason.id}
                                  checked={selectedReason === reason.id}
                                  onChange={() => setSelectedReason(reason.id)}
                                  className="mt-0.5 mr-3 text-red-500 focus:ring-red-500"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">
                                      {reason.name}
                                    </span>
                                    <span
                                      className={`text-xs px-1.5 py-0.5 rounded ${getSeverityColor(
                                        reason.severity
                                      )}`}
                                    >
                                      {reason.severity}
                                    </span>
                                  </div>
                                  {reason.description && (
                                    <p className="text-sm text-gray-500 mt-1">
                                      {reason.description}
                                    </p>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  rows={3}
                  placeholder="Provide any additional context that might help us review this report..."
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {customReason.length}/1000 characters
                </p>
              </div>

              <div className="bg-gray-50 -mx-6 -mb-6 mt-6 p-6 border-t">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !selectedReason}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Submitting...
                      </span>
                    ) : (
                      "Submit Report"
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
