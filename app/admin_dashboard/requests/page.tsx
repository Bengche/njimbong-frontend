"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Axios from "axios";
import PageHeader from "../../components/PageHeader";

Axios.defaults.withCredentials = true;
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface PendingRequest {
  id: number;
  title: string;
  description: string;
  category_name: string | null;
  country: string;
  moderation_status: string;
  created_at: string;
  user_id: number;
  username: string;
  user_email: string;
  image_url: string | null;
  tags: string[] | null;
}

export default function AdminRequestsPage() {
  const router = useRouter();
  const [adminChecked, setAdminChecked] = useState(false);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "ok" | "err";
  } | null>(null);

  // Auth check
  useEffect(() => {
    Axios.get(`${API_BASE}/api/admin/reports/stats`)
      .then(() => setAdminChecked(true))
      .catch(() =>
        router.push(
          process.env.NEXT_PUBLIC_ADMIN_LOGIN_ENDPOINT || "/auth/admin",
        ),
      );
  }, [router]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Axios.get(`${API_BASE}/api/admin/requests`);
      setRequests(res.data.requests || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (adminChecked) fetchRequests();
  }, [adminChecked, fetchRequests]);

  function showToast(msg: string, type: "ok" | "err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleAction(id: number, action: "approve" | "reject") {
    setActioningId(id);
    try {
      await Axios.put(`${API_BASE}/api/admin/requests/${id}/${action}`);
      showToast(
        action === "approve"
          ? "Request approved and now live."
          : "Request rejected.",
        "ok",
      );
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      showToast(err.response?.data?.error || "Action failed.", "err");
    } finally {
      setActioningId(null);
    }
  }

  if (!adminChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Request Moderation"
        showBack
        backHref="/admin_dashboard"
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Toast */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition ${
              toast.type === "ok" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {toast.msg}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Pending Buyer Requests
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Review and approve or reject buyer requests before they go live.
            </p>
          </div>
          <button
            onClick={fetchRequests}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-gray-700 font-semibold text-lg">All clear</p>
            <p className="text-gray-400 text-sm mt-1">
              No pending requests to review.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {req.image_url && (
                      <img
                        src={req.image_url}
                        alt={req.title}
                        className="w-20 h-20 object-cover rounded-xl border border-gray-100 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold text-gray-900 leading-tight">
                          {req.title}
                        </h3>
                        <span className="flex-shrink-0 text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-semibold">
                          Pending
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1.5 line-clamp-3 leading-relaxed">
                        {req.description}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
                        {req.category_name && (
                          <span className="text-xs text-gray-400">
                            Category:{" "}
                            <span className="text-gray-600">
                              {req.category_name}
                            </span>
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          Country:{" "}
                          <span className="text-gray-600">{req.country}</span>
                        </span>
                        <span className="text-xs text-gray-400">
                          Posted:{" "}
                          <span className="text-gray-600">
                            {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        </span>
                      </div>
                      {req.tags && req.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {req.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Buyer info */}
                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-sm text-gray-500">
                      Buyer:{" "}
                      <span className="font-semibold text-gray-700">
                        {req.username}
                      </span>
                      {" · "}
                      <span className="text-gray-400">{req.user_email}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(req.id, "reject")}
                        disabled={actioningId === req.id}
                        className="px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleAction(req.id, "approve")}
                        disabled={actioningId === req.id}
                        className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2"
                      >
                        {actioningId === req.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          "Approve"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
