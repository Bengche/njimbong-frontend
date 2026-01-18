"use client";

import React, { useState, useEffect, useCallback } from "react";

interface SuspensionInfo {
  isSuspended: boolean;
  suspensionId?: number;
  type?: "temporary" | "permanent";
  reason?: string;
  suspendedAt?: string;
  expiresAt?: string;
  hasPendingAppeal?: boolean;
}

interface Appeal {
  id: number;
  appeal_reason: string;
  submitted_at: string;
  status: string;
  admin_response?: string;
  reviewed_at?: string;
}

interface SuspensionBannerProps {
  onAppealSubmitted?: () => void;
}

export default function SuspensionBanner({
  onAppealSubmitted,
}: SuspensionBannerProps) {
  const [suspensionInfo, setSuspensionInfo] = useState<SuspensionInfo | null>(
    null
  );
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [appealReason, setAppealReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

  // Check account status
  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/account/status`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) return;
        throw new Error("Failed to check account status");
      }

      const data = await response.json();
      const suspensionDetails = data.suspensionDetails || null;

      setSuspensionInfo({
        isSuspended: Boolean(data.isSuspended),
        suspensionId: suspensionDetails?.id,
        type: suspensionDetails?.suspension_type,
        reason: data.suspensionReason || suspensionDetails?.reason,
        suspendedAt:
          suspensionDetails?.starts_at || suspensionDetails?.created_at,
        expiresAt: suspensionDetails?.ends_at || null,
        hasPendingAppeal: (data.pendingAppeals || []).some(
          (appeal: Appeal) => appeal.status === "pending"
        ),
      });

      if (data.isSuspended) {
        // Fetch appeals
        const appealsRes = await fetch(`${API_BASE}/api/appeals/my-appeals`, {
          credentials: "include",
        });

        if (appealsRes.ok) {
          const appealsData = await appealsRes.json();
          setAppeals(appealsData.appeals || []);
        }
      }
    } catch (err) {
      console.error("Error checking suspension status:", err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Submit appeal
  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appealReason.trim()) {
      setError("Please explain why your suspension should be lifted");
      return;
    }

    if (appealReason.trim().length < 20) {
      setError("Please provide at least 20 characters for your appeal");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/appeals/submit`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appealType: "suspension",
          suspensionId: suspensionInfo?.suspensionId,
          reason: appealReason.trim(),
          evidenceUrls: null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit appeal");
      }

      setSuccess(true);
      setSuccessMessage(
        "Appeal submitted successfully. Our team will review it shortly."
      );
      setAppealReason("");
      setTimeout(() => setShowAppealForm(false), 1200);
      setTimeout(() => setSuccess(false), 4000);
      await checkStatus();
      onAppealSubmitted?.();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to submit appeal";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate remaining time
  const getRemainingTime = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} remaining`;
    return `${hours} hour${hours > 1 ? "s" : ""} remaining`;
  };

  if (loading || !suspensionInfo?.isSuspended) {
    return null;
  }

  const isPermanent = suspensionInfo.type === "permanent";
  const hasPendingAppeal = appeals.some((a) => a.status === "pending");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Backdrop */}
      <div className="bg-gradient-to-t from-black/50 to-transparent h-32 pointer-events-none"></div>

      {/* Banner */}
      <div
        className={`${isPermanent ? "bg-red-600" : "bg-yellow-600"} text-white`}
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Icon and Message */}
            <div className="flex items-start gap-3 flex-1">
              <div
                className={`flex-shrink-0 ${
                  isPermanent ? "bg-red-700" : "bg-yellow-700"
                } rounded-full p-2`}
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg">
                  {isPermanent
                    ? "Account Permanently Suspended"
                    : "Account Temporarily Suspended"}
                </h3>
                <p className="text-sm opacity-90 mt-1">
                  {suspensionInfo.reason ||
                    "Your account has been suspended due to policy violations."}
                </p>
                {!isPermanent && suspensionInfo.expiresAt && (
                  <p className="text-sm font-medium mt-1">
                    ⏱️ {getRemainingTime(suspensionInfo.expiresAt)}
                  </p>
                )}
                <p className="text-xs opacity-75 mt-2">
                  You can view content but cannot post, create listings, or
                  report other users.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 md:flex-shrink-0">
              {hasPendingAppeal || success ? (
                <span className="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium">
                  ✅ Appeal submitted — awaiting review
                </span>
              ) : (
                <button
                  onClick={() => setShowAppealForm(true)}
                  className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                >
                  Submit Appeal
                </button>
              )}
            </div>
          </div>

          {(successMessage || hasPendingAppeal) && (
            <div className="mt-3 bg-white/15 rounded-lg px-4 py-2 text-sm">
              {successMessage ||
                "Your appeal is on file. We will notify you once a decision is made."}
            </div>
          )}
        </div>
      </div>

      {/* Appeal Form Modal */}
      {showAppealForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b bg-gradient-to-r from-green-600 to-yellow-500 text-white rounded-t-xl">
              <h2 className="text-xl font-bold">Submit an Appeal</h2>
              <p className="text-sm opacity-90 mt-1">
                Explain why you believe your suspension should be lifted
              </p>
            </div>

            <form
              onSubmit={handleSubmitAppeal}
              className="p-4 sm:p-6 space-y-4"
            >
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  Your appeal has been submitted successfully. We will review it
                  soon.
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Suspension Details
                </h4>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Type:</strong>{" "}
                  {isPermanent ? "Permanent" : "Temporary"}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Reason:</strong>{" "}
                  {suspensionInfo.reason || "Policy violation"}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Since:</strong>{" "}
                  {formatDate(suspensionInfo.suspendedAt || "")}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why should your suspension be lifted?
                </label>
                <textarea
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows={5}
                  placeholder="Please provide a detailed explanation. Include any relevant context or evidence that supports your appeal..."
                  maxLength={2000}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {appealReason.length}/2000 characters
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Your appeal will be reviewed by our
                  moderation team. Please be honest and respectful in your
                  explanation. False or abusive appeals may result in extended
                  suspension.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAppealForm(false);
                    setError(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !appealReason.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </span>
                  ) : (
                    "Submit Appeal"
                  )}
                </button>
              </div>
            </form>

            {/* Previous Appeals */}
            {appeals.length > 0 && (
              <div className="p-6 border-t bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-3">
                  Previous Appeals
                </h4>
                <div className="space-y-3">
                  {appeals.map((appeal) => (
                    <div
                      key={appeal.id}
                      className="bg-white p-3 rounded-lg border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">
                          {formatDate(appeal.submitted_at)}
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded ${
                            appeal.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : appeal.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {appeal.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {appeal.appeal_reason}
                      </p>
                      {appeal.admin_response && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs text-gray-500 mb-1">
                            Admin Response:
                          </p>
                          <p className="text-sm text-gray-700">
                            {appeal.admin_response}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
