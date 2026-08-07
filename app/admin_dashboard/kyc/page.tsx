"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Axios from "axios";
import PageHeader from "../../components/PageHeader";
Axios.defaults.withCredentials = true;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface KYCVerification {
  id: number;
  userid: number;
  name: string;
  email: string;
  username: string;
  documenttype: string;
  documentfronturl: string;
  documentbackurl: string | null;
  selfieurl: string;
  status: string;
  rejectionreason: string | null;
  reviewedby: number | null;
  reviewedat: string | null;
  createdat: string;
  updatedat: string;
}

export default function AdminKYCPage() {
  const router = useRouter();
  const [adminChecked, setAdminChecked] = useState(false);
  const [verifications, setVerifications] = useState<KYCVerification[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<
    KYCVerification[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVerification, setSelectedVerification] =
    useState<KYCVerification | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [currentImage, setCurrentImage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, text });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  };

  const fetchVerifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await Axios.get(`${API_BASE}/api/kyc/all`);
      setVerifications(response.data);
    } catch (error: any) {
      console.error("Error fetching verifications:", error);
      showToast("error", "Failed to load verifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await Axios.get(`${API_BASE}/api/admin/reports/stats`);
        if (response.status === 200) {
          setAdminChecked(true);
          return;
        }
        router.push(
          process.env.NEXT_PUBLIC_ADMIN_LOGIN_ENDPOINT || "/auth/admin",
        );
      } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          router.push(
            process.env.NEXT_PUBLIC_ADMIN_LOGIN_ENDPOINT || "/auth/admin",
          );
          return;
        }
        console.error("Error checking admin auth:", error);
      }
    };

    checkAdmin();
  }, [router]);

  useEffect(() => {
    if (!adminChecked) return;
    fetchVerifications();
  }, [adminChecked, fetchVerifications]);

  useEffect(() => {
    let filtered = verifications;
    if (statusFilter !== "all") {
      filtered = filtered.filter((v) => v.status === statusFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(q) || v.email.toLowerCase().includes(q),
      );
    }
    setFilteredVerifications(filtered);
  }, [verifications, statusFilter, searchQuery]);

  if (!adminChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  const handleApprove = async (verificationId: number) => {
    try {
      setActionLoading(true);
      await Axios.put(`${API_BASE}/api/kyc/approve/${verificationId}`, {});
      showToast("success", "Verification approved successfully.");
      setShowApproveConfirm(false);
      setShowDocumentModal(false);
      setSelectedVerification(null);
      await fetchVerifications();
    } catch (error: any) {
      if (error.response?.status === 401) {
        window.location.href =
          process.env.NEXT_PUBLIC_ADMIN_LOGIN_ENDPOINT || "/auth/admin";
      }
      showToast(
        "error",
        error.response?.data?.error || "Failed to approve verification",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showToast("error", "Please provide a reason for rejection");
      return;
    }
    if (!selectedVerification) return;

    try {
      setActionLoading(true);
      await Axios.put(`${API_BASE}/api/kyc/reject/${selectedVerification.id}`, {
        reason: rejectReason,
      });
      showToast("success", "Verification rejected.");
      setShowRejectModal(false);
      setShowDocumentModal(false);
      setSelectedVerification(null);
      setRejectReason("");
      await fetchVerifications();
    } catch (error: any) {
      if (error.response?.status === 401) {
        window.location.href =
          process.env.NEXT_PUBLIC_ADMIN_LOGIN_ENDPOINT || "/auth/admin";
      }
      showToast(
        "error",
        error.response?.data?.error || "Failed to reject verification",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openDocumentModal = (verification: KYCVerification) => {
    setSelectedVerification(verification);
    setCurrentImage(verification.documentfronturl);
    setShowApproveConfirm(false);
    setShowDocumentModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "id_card":
        return "National ID Card";
      case "passport":
        return "Passport";
      case "drivers_license":
        return "Driver's License";
      default:
        return type;
    }
  };

  const pendingCount = verifications.filter(
    (v) => v.status === "pending",
  ).length;
  const approvedCount = verifications.filter(
    (v) => v.status === "approved",
  ).length;
  const rejectedCount = verifications.filter(
    (v) => v.status === "rejected",
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  const canAct = (status: string) =>
    status === "pending" || status === "rejected";

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
      {/* Fixed toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[300] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium text-white max-w-sm transition-all ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? (
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z"
              />
            </svg>
          )}
          {toast.text}
          <button
            onClick={() => setToast(null)}
            className="ml-auto opacity-75 hover:opacity-100"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      <PageHeader
        title="KYC Verification Management"
        description="Review and manage user identity verifications."
        actions={
          <button
            onClick={() => router.push("/admin_dashboard")}
            className="flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {[
          { label: "Total", count: verifications.length, color: "slate" },
          { label: "Pending", count: pendingCount, color: "amber" },
          { label: "Approved", count: approvedCount, color: "emerald" },
          { label: "Rejected", count: rejectedCount, color: "red" },
        ].map(({ label, count, color }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
          >
            <p className={`text-2xl font-bold text-${color}-600`}>{count}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Verification cards */}
      {filteredVerifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="font-semibold text-slate-700">No verifications found</p>
          <p className="text-sm text-slate-400 mt-1">
            Try adjusting your search or filter
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVerifications.map((v) => (
            <div
              key={v.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              {/* User info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-700 font-bold text-sm">
                  {v.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">
                    {v.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{v.email}</p>
                </div>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500">
                <span className="bg-slate-100 px-2.5 py-1 rounded-lg font-medium">
                  {getDocumentTypeLabel(v.documenttype)}
                </span>
                <span>{new Date(v.createdat).toLocaleDateString()}</span>
              </div>

              {/* Status + action */}
              <div className="flex items-center gap-3 sm:flex-shrink-0">
                {getStatusBadge(v.status)}
                <button
                  onClick={() => openDocumentModal(v)}
                  className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 border border-emerald-200 hover:border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-xl transition-colors"
                >
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Viewer Modal */}
      {showDocumentModal &&
        selectedVerification &&
        (() => {
          const v = selectedVerification;
          return (
            <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
              <div className="bg-white w-full sm:rounded-2xl shadow-2xl sm:max-w-4xl max-h-[95dvh] overflow-y-auto">
                {/* Modal header */}
                <div className="sticky top-0 z-10 bg-emerald-700 text-white px-5 py-4 sm:rounded-t-2xl flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold leading-tight">
                      KYC Review
                    </h2>
                    <p className="text-sm text-emerald-200 truncate">
                      {v.name} Â· {getDocumentTypeLabel(v.documenttype)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDocumentModal(false);
                      setSelectedVerification(null);
                      setShowApproveConfirm(false);
                    }}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center flex-shrink-0 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="p-5 sm:p-6 space-y-6">
                  {/* User meta */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "User ID", value: `#${v.userid}` },
                      { label: "Status", value: getStatusBadge(v.status) },
                      {
                        label: "Submitted",
                        value: new Date(v.createdat).toLocaleDateString(),
                      },
                      { label: "Email", value: v.email },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          {label}
                        </p>
                        <div className="text-sm font-medium text-slate-800 truncate">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Main document image */}
                  <div className="bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center min-h-64 sm:min-h-80">
                    <img
                      src={currentImage}
                      alt="Document"
                      className="max-h-96 max-w-full object-contain"
                    />
                  </div>

                  {/* Image tabs */}
                  <div
                    className={`grid gap-3 ${v.documentbackurl ? "grid-cols-3" : "grid-cols-2"}`}
                  >
                    {[
                      { url: v.documentfronturl, label: "Front" },
                      ...(v.documentbackurl
                        ? [{ url: v.documentbackurl, label: "Back" }]
                        : []),
                      { url: v.selfieurl, label: "Selfie" },
                    ].map(({ url, label }) => (
                      <button
                        key={label}
                        onClick={() => setCurrentImage(url)}
                        className={`rounded-xl border-2 overflow-hidden transition-all ${
                          currentImage === url
                            ? "border-emerald-500 ring-2 ring-emerald-200"
                            : "border-slate-200 hover:border-emerald-300"
                        }`}
                      >
                        <img
                          src={url}
                          alt={label}
                          className="w-full h-20 sm:h-28 object-cover"
                        />
                        <p className="text-xs font-semibold text-slate-600 py-1.5 text-center">
                          {label}
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* Previous rejection reason */}
                  {v.status === "rejected" && v.rejectionreason && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                      <svg
                        className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v2m0 4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z"
                        />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-red-700">
                          Previous rejection reason
                        </p>
                        <p className="text-sm text-red-600 mt-0.5">
                          {v.rejectionreason}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action area */}
                  {v.status === "approved" ? (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                      <svg
                        className="w-4 h-4 text-emerald-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-sm font-semibold text-emerald-700">
                        This verification has been approved.
                      </p>
                    </div>
                  ) : showApproveConfirm ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-amber-800 mb-3">
                        Confirm approval for{" "}
                        <span className="font-bold">{v.name}</span>?
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowApproveConfirm(false)}
                          disabled={actionLoading}
                          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleApprove(v.id)}
                          disabled={actionLoading}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                          {actionLoading && (
                            <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                          )}
                          {actionLoading ? "Approving..." : "Yes, approve"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setShowApproveConfirm(true)}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Approve Verification
                      </button>
                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        {v.status === "rejected" ? "Re-reject" : "Reject"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
          <div className="bg-white w-full sm:rounded-2xl shadow-2xl sm:max-w-md p-5 sm:p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              Reject Verification
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Provide a clear reason. This will be sent directly to the user.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., The document image is blurry. Please resubmit with a clearer photo."
              rows={4}
              className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none resize-none mb-4"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {actionLoading && (
                  <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                )}
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
