"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Axios from "axios";
import Image from "next/image";
import { countries } from "../constants/countries";
import KYCVerificationModal from "../components/KYCVerificationModal";
import {
  NotificationPermissionBanner,
  useNotificationPoller,
} from "../components/BrowserNotifications";
import {
  Review,
  ReviewStats,
  ReviewSummary,
  ReviewList,
} from "../components/Reviews";
import PageHeader from "../components/PageHeader";
import LoadingArt from "../components/LoadingArt";
Axios.defaults.withCredentials = true;

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  profilepictureurl: string;
  verified: boolean;
  updatedat: string;
}

interface KYCStatus {
  id: number;
  status: string;
  documenttype: string;
  rejectionreason?: string;
  reviewedat?: string;
  createdat: string;
}

interface SuspensionStatus {
  isSuspended: boolean;
  suspensionReason?: string;
  suspensionDetails?: {
    suspension_type?: "temporary" | "permanent";
    reason?: string;
    ends_at?: string | null;
  } | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [kycLoading, setKycLoading] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null,
  );
  const [profilePicturePreview, setProfilePicturePreview] =
    useState<string>("");
  const [suspensionStatus, setSuspensionStatus] =
    useState<SuspensionStatus | null>(null);
  const [trustScore, setTrustScore] = useState<number>(0);
  const [trustLoading, setTrustLoading] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewFilter, setReviewFilter] = useState("all");

  const [reportReview, setReportReview] = useState<Review | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState("");

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

  const getErrorStatus = useCallback(
    (error: unknown) =>
      Axios.isAxiosError(error) ? error.response?.status : undefined,
    [],
  );

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    country: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Browser notification polling
  useNotificationPoller(userId);

  const fetchSuspensionStatus = useCallback(async () => {
    try {
      const response = await Axios.get(`${API_BASE}/api/account/status`);
      setSuspensionStatus(response.data);
    } catch (error: unknown) {
      if (getErrorStatus(error) !== 401) {
        console.error("Error fetching suspension status:", error);
      }
    }
  }, [API_BASE, getErrorStatus]);

  const fetchUserProfile = useCallback(
    async (uid?: number) => {
      const userIdToUse = uid || userId;
      if (!userIdToUse) return;

      try {
        const response = await Axios.get(
          `${API_BASE}/api/users/${userIdToUse}`,
          {},
        );
        setUser(response.data);
        setFormData({
          name: response.data.name,
          phone: response.data.phone,
          country: response.data.country,
        });
        // Prepend API_BASE to profile picture URL if it's a relative path
        const profileUrl = response.data.profilepictureurl;
        if (profileUrl && !profileUrl.startsWith("http")) {
          setProfilePicturePreview(
            `${API_BASE}${profileUrl.startsWith("/") ? "" : "/"}${profileUrl}`,
          );
        } else {
          setProfilePicturePreview(profileUrl || "");
        }
      } catch (error: unknown) {
        if (getErrorStatus(error) === 401) {
          window.location.href =
            process.env.NEXT_PUBLIC_LOGIN_ENDPOINT || "/login";
        }
        console.error("Error fetching user profile:", error);
        setErrorMessage("Failed to load profile");
      } finally {
        setLoading(false);
      }
    },
    [API_BASE, getErrorStatus, userId],
  );

  const fetchKYCStatus = useCallback(
    async (uid?: number) => {
      const userIdToUse = uid || userId;
      if (!userIdToUse) return;

      try {
        setKycLoading(true);
        const response = await Axios.get(
          `${API_BASE}/api/kyc/status/${userIdToUse}`,
          {},
        );
        if (response.data) {
          setKycStatus(response.data);
        }
      } catch (error: unknown) {
        if (getErrorStatus(error) === 401) {
          window.location.href =
            process.env.NEXT_PUBLIC_LOGIN_ENDPOINT || "/login";
        }
        if (getErrorStatus(error) !== 404) {
          console.error("Error fetching KYC status:", error);
        }
      } finally {
        setKycLoading(false);
      }
    },
    [API_BASE, getErrorStatus, userId],
  );

  const fetchTrustScore = useCallback(
    async (uid?: number) => {
      const userIdToUse = uid || userId;
      if (!userIdToUse) return;

      try {
        setTrustLoading(true);
        const response = await Axios.get(
          `${API_BASE}/api/user/${userIdToUse}/trust-score/breakdown`,
          {},
        );
        setTrustScore(response.data.trustScore || 0);
      } catch (error: unknown) {
        if (getErrorStatus(error) !== 401) {
          console.error("Error fetching trust score:", error);
        }
      } finally {
        setTrustLoading(false);
      }
    },
    [API_BASE, getErrorStatus, userId],
  );

  const fetchReviews = useCallback(
    async (filter = "all", uid?: number) => {
      const userIdToUse = uid || userId;
      if (!userIdToUse) return;

      try {
        setReviewsLoading(true);
        const response = await Axios.get(
          `${API_BASE}/api/user/${userIdToUse}/reviews?type=${filter}`,
        );
        setReviews(response.data.reviews || []);
        setReviewStats(response.data.stats || null);
      } catch (error: unknown) {
        console.error("Error fetching reviews:", error);
      } finally {
        setReviewsLoading(false);
      }
    },
    [API_BASE, userId],
  );

  useEffect(() => {
    // First get the current user ID, then fetch profile and KYC
    const initializeProfile = async () => {
      try {
        const meResponse = await Axios.get(`${API_BASE}/api/user/me`);
        const currentUserId = meResponse.data.id;
        setUserId(currentUserId);

        // Now fetch profile and KYC with the correct user ID
        await fetchUserProfile(currentUserId);
        await fetchKYCStatus(currentUserId);
        await fetchSuspensionStatus();
        await fetchTrustScore(currentUserId);
        await fetchReviews("all", currentUserId);
      } catch (error: unknown) {
        if (getErrorStatus(error) === 401) {
          window.location.href =
            process.env.NEXT_PUBLIC_LOGIN_ENDPOINT || "/login";
        }
        console.error("Error initializing profile:", error);
        setLoading(false);
      }
    };

    initializeProfile();
  }, [
    API_BASE,
    fetchKYCStatus,
    fetchSuspensionStatus,
    fetchUserProfile,
    fetchTrustScore,
    fetchReviews,
    getErrorStatus,
  ]);

  const handleKYCSuccess = () => {
    setSuccessMessage(
      "KYC verification submitted successfully! You will be notified once reviewed.",
    );
    fetchKYCStatus();
    fetchUserProfile();
  };

  const handleReviewFilterChange = (filter: string) => {
    setReviewFilter(filter);
    fetchReviews(filter);
  };

  const handleReportReview = (review: Review) => {
    setReportReview(review);
    setReportReason("");
    setReportError("");
    setReportSuccess("");
  };

  const submitReviewReport = async () => {
    if (!reportReview) return;
    if (!reportReason.trim()) {
      setReportError("Please provide a reason for reporting");
      return;
    }

    try {
      setReportSubmitting(true);
      const response = await Axios.post(
        `${API_BASE}/api/user/review/${reportReview.id}/report`,
        { reason: reportReason.trim() },
        {},
      );
      if (response.data?.message) {
        setReportSuccess(response.data.message);
        setTimeout(() => {
          setReportReview(null);
        }, 1200);
      }
    } catch (error: unknown) {
      const message = Axios.isAxiosError(error)
        ? error.response?.data?.error || "Failed to report review"
        : "Failed to report review";
      setReportError(message);
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    if (!userId) return;
    if (isSavingProfile) return;

    try {
      setIsSavingProfile(true);
      setErrorMessage("");
      setSuccessMessage("");

      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("country", formData.country);

      if (profilePictureFile) {
        formDataToSend.append("profilePicture", profilePictureFile);
      }

      await Axios.put(`${API_BASE}/api/users/${userId}`, formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccessMessage("Profile updated successfully!");
      setEditMode(false);
      setProfilePictureFile(null);
      await fetchUserProfile(userId);
    } catch (error: unknown) {
      if (getErrorStatus(error) === 401) {
        window.location.href =
          process.env.NEXT_PUBLIC_LOGIN_ENDPOINT || "/login";
      }
      console.error("Error updating profile:", error);
      setErrorMessage("Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (isUpdatingPassword) return;
    try {
      setIsUpdatingPassword(true);
      setErrorMessage("");
      setSuccessMessage("");

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setErrorMessage("New passwords do not match");
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setErrorMessage("Password must be at least 6 characters");
        return;
      }

      if (!userId) {
        setErrorMessage("User not found");
        return;
      }

      await Axios.put(
        `${API_BASE}/api/users/${userId}/password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {},
      );

      setSuccessMessage("Password updated successfully!");
      setTimeout(() => {
        setShowPasswordModal(false);
      }, 1200);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: unknown) {
      if (getErrorStatus(error) === 401) {
        window.location.href =
          process.env.NEXT_PUBLIC_LOGIN_ENDPOINT || "/login";
      }
      console.error("Error updating password:", error);
      setErrorMessage(
        Axios.isAxiosError(error)
          ? error.response?.data?.error || "Failed to update password"
          : "Failed to update password",
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <LoadingArt
        fullScreen
        label="Loading your profile"
        subLabel="Fetching account details"
      />
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Profile not found
          </h2>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
      <PageHeader
        title="My Profile"
        description="Manage your account details, verification status, and reviews."
        actions={
          <button
            onClick={() => router.push("/dashboard")}
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
            Back to Dashboard
          </button>
        }
      />

      <div className="mt-6 space-y-6">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {errorMessage}
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-green-600 via-yellow-500 to-green-600 h-32"></div>
          <div className="px-4 pb-6 sm:px-8 sm:pb-8">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16">
              {/* Profile Picture */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
                  {profilePicturePreview ? (
                    <Image
                      src={profilePicturePreview}
                      alt={user.name}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-400 to-yellow-400 text-white text-4xl font-bold">
                      {user.name
                        .split(" ")
                        .map((n) => n.charAt(0))
                        .slice(0, 2)
                        .join("")}
                    </div>
                  )}
                </div>
                {editMode && (
                  <label
                    htmlFor="profilePicture"
                    className="absolute bottom-0 right-0 bg-green-600 text-white rounded-full p-2 cursor-pointer hover:bg-green-700 transition-colors shadow-lg"
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
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <input
                      type="file"
                      id="profilePicture"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2 flex-wrap">
                  <h1 className="text-3xl font-bold text-gray-800">
                    {user.name}
                  </h1>

                  {/* KYC Status Badge - Professional Display */}
                  {kycLoading ? (
                    <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      Checking...
                    </span>
                  ) : user.verified || kycStatus?.status === "approved" ? (
                    /* Verified Badge */
                    <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Verified Seller
                    </span>
                  ) : kycStatus?.status === "pending" ? (
                    /* Pending Badge */
                    <span className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm">
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
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Verification Pending
                    </span>
                  ) : kycStatus?.status === "rejected" ? (
                    /* Rejected - Show Resubmit Button */
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm">
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
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        Verification Rejected
                      </span>
                      <button
                        onClick={() => setShowKYCModal(true)}
                        className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-full text-sm font-semibold transition-colors shadow-sm"
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
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Resubmit
                      </button>
                    </div>
                  ) : (
                    /* Not Started - Show Get Verified Button */
                    <button
                      onClick={() => setShowKYCModal(true)}
                      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-1.5 rounded-full text-sm font-semibold transition-all shadow-md hover:shadow-lg"
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
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      Get Verified
                    </button>
                  )}

                  {suspensionStatus?.isSuspended && (
                    <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.536-9.879a1 1 0 00-1.414-1.414L10 8.828 7.879 6.707a1 1 0 10-1.414 1.414L8.586 10l-2.121 2.121a1 1 0 101.414 1.414L10 11.172l2.121 2.121a1 1 0 001.414-1.414L11.414 10l2.122-2.121z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Account Suspended
                    </span>
                  )}
                </div>

                {/* Rejection Reason Tooltip */}
                {kycStatus?.status === "rejected" &&
                  kycStatus.rejectionreason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2 max-w-md">
                      <p className="text-xs text-red-600 font-medium">
                        Reason: {kycStatus.rejectionreason}
                      </p>
                    </div>
                  )}
                <p className="text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Member since{" "}
                  {new Date(user.updatedat).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Edit Button */}
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="w-full sm:w-auto bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Personal Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Full Name
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                ) : (
                  <p className="text-gray-800 font-medium">{user.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Email
                </label>
                <p className="text-gray-800 font-medium">{user.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
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
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              Contact Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Phone Number
                </label>
                {editMode ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                ) : (
                  <p className="text-gray-800 font-medium">{user.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Country
                </label>
                {editMode ? (
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  >
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-800 font-medium">{user.country}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Trust Score & Reviews */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Trust Score & Reviews
              </h2>
              <p className="text-sm text-gray-500">
                Transparent scoring with abuse reporting and moderation
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg font-semibold">
                {trustLoading ? "Loading..." : `${trustScore}% Trust Score`}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Received Reviews
            </h3>
            {reviewStats && reviewStats.total > 0 && (
              <ReviewSummary stats={reviewStats} />
            )}
            <div className="mt-4">
              <ReviewList
                reviews={reviews}
                stats={
                  reviewStats || {
                    total: 0,
                    positive: 0,
                    neutral: 0,
                    negative: 0,
                    averageRating: 0,
                    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
                  }
                }
                loading={reviewsLoading}
                apiBase={API_BASE}
                onFilterChange={handleReviewFilterChange}
                activeFilter={reviewFilter}
                onReportReview={handleReportReview}
              />
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Security
          </h2>

          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full sm:w-auto bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
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
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
            Change Password
          </button>
        </div>

        {/* Action Buttons (Edit Mode) */}
        {editMode && (
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleUpdateProfile}
              disabled={isSavingProfile}
              className={`flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold ${
                isSavingProfile ? "opacity-80 cursor-not-allowed" : ""
              }`}
            >
              <span className="inline-flex items-center justify-center gap-2">
                {isSavingProfile ? (
                  <span className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                ) : null}
                {isSavingProfile ? "Saving..." : "Save Changes"}
              </span>
            </button>
            <button
              onClick={() => {
                setEditMode(false);
                setFormData({
                  name: user.name,
                  phone: user.phone,
                  country: user.country,
                });
                setProfilePictureFile(null);
                // Prepend API_BASE to profile picture URL if it's a relative path
                const profileUrl = user.profilepictureurl;
                if (profileUrl && !profileUrl.startsWith("http")) {
                  setProfilePicturePreview(
                    `${API_BASE}${
                      profileUrl.startsWith("/") ? "" : "/"
                    }${profileUrl}`,
                  );
                } else {
                  setProfilePicturePreview(profileUrl || "");
                }
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
              disabled={isSavingProfile}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                Change Password
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                  setErrorMessage("");
                }}
                className="text-gray-500 hover:text-gray-700"
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

            <div className="space-y-4">
              {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {successMessage}
                </div>
              )}
              {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {errorMessage}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
              </div>

              <button
                onClick={handleUpdatePassword}
                disabled={isUpdatingPassword}
                className={`w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold ${
                  isUpdatingPassword ? "opacity-80 cursor-not-allowed" : ""
                }`}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {isUpdatingPassword ? (
                    <span className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  {isUpdatingPassword ? "Updating..." : "Update Password"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KYC Verification Modal */}
      {userId && (
        <KYCVerificationModal
          isOpen={showKYCModal}
          onClose={() => setShowKYCModal(false)}
          userId={userId as number}
          onSuccess={handleKYCSuccess}
        />
      )}

      {/* Browser Notification Permission Banner */}
      <NotificationPermissionBanner />

      {/* Report Review Modal */}
      {reportReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Report Review</h3>
              <button
                onClick={() => setReportReview(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-5 h-5"
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

            <p className="text-sm text-gray-600 mb-4">
              Explain why this review should be moderated. Your report will be
              reviewed by our safety team.
            </p>

            {reportError && (
              <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {reportError}
              </div>
            )}
            {reportSuccess && (
              <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                {reportSuccess}
              </div>
            )}

            <textarea
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Describe the issue (harassment, spam, false claim...)"
            />

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setReportReview(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={reportSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={submitReviewReport}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-70"
                disabled={reportSubmitting}
              >
                {reportSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
