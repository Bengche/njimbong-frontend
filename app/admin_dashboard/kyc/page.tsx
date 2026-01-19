"use client";
import { useState, useEffect } from "react";
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
  const [rejectReason, setRejectReason] = useState("");
  const [currentImage, setCurrentImage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await Axios.get(`${API_BASE}/api/admin/reports/stats`);
        if (response.status === 200) {
          setAdminChecked(true);
          return;
        }
        router.push(
          process.env.NEXT_PUBLIC_ADMIN_LOGIN_ENDPOINT || "/auth/admin"
        );
      } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          router.push(
            process.env.NEXT_PUBLIC_ADMIN_LOGIN_ENDPOINT || "/auth/admin"
          );
          return;
        }
        console.error("Error checking admin auth:", error);
      }
    };

    checkAdmin();
  }, [router]);

  if (!adminChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-700">Loading...</div>
      </div>
    );
  }

  useEffect(() => {
    fetchVerifications();
  }, []);

  useEffect(() => {
    let filtered = verifications;

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((v) => v.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredVerifications(filtered);
  }, [verifications, statusFilter, searchQuery]);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const response = await Axios.get(`${API_BASE}/api/kyc/all`, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });
      setVerifications(response.data);
    } catch (error: any) {
      // if (error.response?.status === 401) {
      //   window.location.href =
      //     process.env.NEXT_PUBLIC_ADMIN_LOGIN_ENDPOINT ||
      // }
      console.error("Error fetching verifications:", error);
      setErrorMessage("Failed to load verifications");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (verificationId: number) => {
    if (!confirm("Are you sure you want to approve this verification?")) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await Axios.put(
        `${API_BASE}/api/kyc/approve/${verificationId}`,
        { adminId: 1 }, // TODO: Replace with actual admin ID
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setSuccessMessage("Verification approved successfully!");
      setShowDocumentModal(false);
      setSelectedVerification(null);
      await fetchVerifications();
    } catch (error: any) {
      if (error.response?.status === 401) {
        window.location.href =
          process.env.NEXT_PUBLIC_ADMIN_LOGIN_ENDPOINT || "/auth/admin";
      }
      console.error("Error approving verification:", error);
      setErrorMessage(
        error.response?.data?.error || "Failed to approve verification"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setErrorMessage("Please provide a reason for rejection");
      return;
    }

    if (!selectedVerification) return;

    try {
      setActionLoading(true);
      const response = await Axios.put(
        `${API_BASE}/api/kyc/reject/${selectedVerification.id}`,
        {
          adminId: 1, // TODO: Replace with actual admin ID
          reason: rejectReason,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setSuccessMessage("Verification rejected successfully!");
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
      console.error("Error rejecting verification:", error);
      setErrorMessage(
        error.response?.data?.error || "Failed to reject verification"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openDocumentModal = (verification: KYCVerification) => {
    setSelectedVerification(verification);
    setCurrentImage(verification.documentfronturl);
    setShowDocumentModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            Pending
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
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
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
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
    (v) => v.status === "pending"
  ).length;
  const approvedCount = verifications.filter(
    (v) => v.status === "approved"
  ).length;
  const rejectedCount = verifications.filter(
    (v) => v.status === "rejected"
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
      <PageHeader
        title="KYC Verification Management"
        description="Review and manage user identity verifications."
        actions={
          <button
            onClick={() => router.push("/admin_dashboard")}
            className="flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Admin Dashboard
          </button>
        }
      />

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage("")}
            className="text-green-700 hover:text-green-900"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}
      {errorMessage && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage("")}
            className="text-red-700 hover:text-red-900"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Verifications</p>
              <p className="text-3xl font-bold text-blue-600">
                {verifications.length}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending Review</p>
              <p className="text-3xl font-bold text-yellow-600">
                {pendingCount}
              </p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <svg
                className="w-8 h-8 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Approved</p>
              <p className="text-3xl font-bold text-green-600">
                {approvedCount}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg
                className="w-8 h-8 text-green-600"
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
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Rejected</p>
              <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Search User
            </label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Verifications Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-gradient-to-r from-green-600 via-yellow-500 to-green-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  User
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Document Type
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Submitted
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredVerifications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <svg
                        className="w-16 h-16 mx-auto mb-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="text-lg font-semibold">
                        No verifications found
                      </p>
                      <p className="text-sm">
                        Try adjusting your filters or search query
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVerifications.map((verification) => (
                  <tr
                    key={verification.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {verification.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {verification.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-800">
                        {getDocumentTypeLabel(verification.documenttype)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-800">
                        {new Date(verification.createdat).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(verification.createdat).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(verification.status)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openDocumentModal(verification)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {showDocumentModal && selectedVerification
        ? (() => {
            const verification = selectedVerification;
            return (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
                  {/* Modal Header */}
                  <div className="sticky top-0 bg-gradient-to-r from-green-600 via-yellow-500 to-green-600 text-white p-4 sm:p-6 rounded-t-2xl flex justify-between items-center z-10">
                    <div>
                      <h2 className="text-2xl font-bold">
                        Review KYC Verification
                      </h2>
                      <p className="text-sm opacity-90">
                        {verification.name} -{" "}
                        {getDocumentTypeLabel(verification.documenttype)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowDocumentModal(false);
                        setSelectedVerification(null);
                        setCurrentImage("");
                      }}
                      className="text-white hover:text-gray-200 transition-colors"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
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

                  <div className="p-4 sm:p-6">
                    {/* User Info */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">User ID</p>
                          <p className="font-semibold text-gray-800">
                            {verification.userid}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-semibold text-gray-800">
                            {verification.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Submitted On</p>
                          <p className="font-semibold text-gray-800">
                            {new Date(verification.createdat).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Current Status
                          </p>
                          <div className="mt-1">
                            {getStatusBadge(verification.status)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Current Image Display */}
                    <div className="mb-6">
                      <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center min-h-[400px]">
                        <img
                          src={currentImage}
                          alt="Document"
                          className="max-h-[500px] max-w-full rounded-lg shadow-lg"
                        />
                      </div>
                    </div>

                    {/* Image Navigation */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <button
                        onClick={() =>
                          setCurrentImage(verification.documentfronturl)
                        }
                        className={`p-4 rounded-lg border-2 transition-all ${
                          currentImage === verification.documentfronturl
                            ? "border-green-600 bg-green-50"
                            : "border-gray-300 hover:border-green-400"
                        }`}
                      >
                        <img
                          src={verification.documentfronturl}
                          alt="Front"
                          className="w-full h-32 object-cover rounded-lg mb-2"
                        />
                        <p className="text-sm font-semibold text-center">
                          Document Front
                        </p>
                      </button>

                      {verification.documentbackurl && (
                        <button
                          onClick={() =>
                            setCurrentImage(verification.documentbackurl || "")
                          }
                          className={`p-4 rounded-lg border-2 transition-all ${
                            currentImage ===
                            (verification.documentbackurl || "")
                              ? "border-green-600 bg-green-50"
                              : "border-gray-300 hover:border-green-400"
                          }`}
                        >
                          <img
                            src={verification.documentbackurl || ""}
                            alt="Back"
                            className="w-full h-32 object-cover rounded-lg mb-2"
                          />
                          <p className="text-sm font-semibold text-center">
                            Document Back
                          </p>
                        </button>
                      )}

                      <button
                        onClick={() => setCurrentImage(verification.selfieurl)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          currentImage === verification.selfieurl
                            ? "border-green-600 bg-green-50"
                            : "border-gray-300 hover:border-green-400"
                        }`}
                      >
                        <img
                          src={verification.selfieurl}
                          alt="Selfie"
                          className="w-full h-32 object-cover rounded-lg mb-2"
                        />
                        <p className="text-sm font-semibold text-center">
                          Selfie Photo
                        </p>
                      </button>
                    </div>

                    {/* Rejection Reason (if rejected) */}
                    {verification.status === "rejected" &&
                      verification.rejectionreason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                          <p className="text-sm font-semibold text-red-800 mb-2">
                            Rejection Reason:
                          </p>
                          <p className="text-red-700">
                            {verification.rejectionreason}
                          </p>
                        </div>
                      )}

                    {/* Action Buttons (only for pending) */}
                    {verification.status === "pending" && (
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleApprove(verification.id)}
                          disabled={actionLoading}
                          className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {actionLoading ? (
                            <>
                              <svg
                                className="animate-spin h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Processing...
                            </>
                          ) : (
                            <>
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
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Approve Verification
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setShowRejectModal(true)}
                          disabled={actionLoading}
                          className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          Reject Verification
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()
        : null}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Reject Verification
            </h3>
            <p className="text-gray-600 mb-4">
              Please provide a detailed reason for rejecting this verification.
              This will be sent to the user.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Document is blurry, information is not clearly visible..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none mb-4"
            />

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="w-full sm:flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="w-full sm:flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
