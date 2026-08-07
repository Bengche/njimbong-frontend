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
import LoadingArt from "../components/LoadingArt";
import { useLanguage } from "../i18n/LanguageContext";
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
  const { t } = useLanguage();
  const pr = t("profile");
  const common = t("common");

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
        // "not_submitted" is a sentinel — treat it as no KYC record
        if (response.data && response.data.status !== "not_submitted") {
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
    return <LoadingArt fullScreen label={pr.loading} subLabel={pr.fetching} />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {pr.notFound}
          </h2>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            {pr.backToDashboard}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* ── TOAST MESSAGES ──────────────────────────────────────────────────── */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl text-sm font-medium max-w-xs animate-slide-in">
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
          {successMessage}
        </div>
      )}
      {errorMessage && !showPasswordModal && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 bg-red-600 text-white px-4 py-3 rounded-2xl shadow-xl text-sm font-medium max-w-xs">
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          {errorMessage}
        </div>
      )}

      {/* ── HERO COVER ──────────────────────────────────────────────────────── */}
      <div className="relative">
        <div className="h-36 sm:h-48 bg-slate-900 relative overflow-hidden">
          <button
            onClick={() => router.push("/dashboard")}
            className="absolute top-4 left-4 flex items-center gap-1.5 text-white/90 hover:text-white bg-black/20 hover:bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium transition-all"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            {pr.dashboard}
          </button>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:gap-5 -mt-14 sm:-mt-16 pb-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0 self-center sm:self-auto">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white">
                {profilePicturePreview ? (
                  <Image
                    src={profilePicturePreview}
                    alt={user.name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-3xl sm:text-4xl font-bold">
                    {user.name
                      .split(" ")
                      .map((n) => n.charAt(0))
                      .slice(0, 2)
                      .join("")}
                  </div>
                )}
              </div>
              {(user.verified || kycStatus?.status === "approved") && (
                <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
              {editMode && (
                <label
                  htmlFor="profilePicture"
                  className="absolute -bottom-1.5 -left-1.5 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-emerald-200 shadow-md cursor-pointer hover:bg-emerald-50 transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
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

            {/* Name + meta */}
            <div className="flex-1 mt-3 sm:mt-0 sm:mb-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                  {user.name}
                </h1>
                {kycLoading ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                    <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    {pr.checking}
                  </span>
                ) : user.verified || kycStatus?.status === "approved" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {pr.verified}
                  </span>
                ) : kycStatus?.status === "pending" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                    {pr.pendingReview}
                  </span>
                ) : kycStatus?.status === "rejected" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                    {pr.rejected}
                  </span>
                ) : null}
                {suspensionStatus?.isSuspended && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                    {pr.suspended}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>

            {/* Edit / Save buttons */}
            <div className="flex items-center gap-2 sm:mb-1 flex-shrink-0 justify-center sm:justify-end mt-3 sm:mt-0">
              {editMode ? (
                <>
                  <button
                    onClick={handleUpdateProfile}
                    disabled={isSavingProfile}
                    className="h-9 px-4 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {isSavingProfile ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                    ) : null}
                    {isSavingProfile ? common.saving : common.save}
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
                      const profileUrl = user.profilepictureurl;
                      setProfilePicturePreview(
                        profileUrl && !profileUrl.startsWith("http")
                          ? `${API_BASE}${profileUrl.startsWith("/") ? "" : "/"}${profileUrl}`
                          : profileUrl || "",
                      );
                      setErrorMessage("");
                    }}
                    disabled={isSavingProfile}
                    className="h-9 px-4 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    {common.cancel}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="h-9 px-4 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── KYC REJECTION REASON ─────────────────────────────────────────────── */}
      {kycStatus?.status === "rejected" && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-red-700">
                  {pr.kycRejectedBanner}
                </p>
                {kycStatus.rejectionreason && (
                  <p className="text-xs text-red-600 mt-0.5">
                    <span className="font-medium">Reason:</span>{" "}
                    {kycStatus.rejectionreason}
                  </p>
                )}
                <p className="text-xs text-red-500 mt-1">
                  Please re-submit with clearer documents to get verified.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowKYCModal(true)}
              className="flex-shrink-0 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 px-4 py-2.5 rounded-xl transition-colors shadow-sm"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              {pr.resubmit}
            </button>
          </div>
        </div>
      )}

      {/* ── STATS STRIP ─────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            className={`rounded-2xl border shadow-sm p-4 flex items-center gap-3 ${trustScore >= 75 ? "bg-emerald-50 border-emerald-200" : trustScore >= 45 ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100"}`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${trustScore >= 75 ? "bg-emerald-100" : trustScore >= 45 ? "bg-amber-100" : "bg-gray-100"}`}
            >
              <svg
                className={`w-5 h-5 ${trustScore >= 75 ? "text-emerald-600" : trustScore >= 45 ? "text-amber-500" : "text-gray-400"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <p
                className={`text-xl font-bold leading-none ${trustScore >= 75 ? "text-emerald-600" : trustScore >= 45 ? "text-amber-500" : "text-gray-400"}`}
              >
                {trustLoading ? "..." : `${trustScore}%`}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{pr.trustScore}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${user.verified || kycStatus?.status === "approved" ? "bg-emerald-100" : kycStatus?.status === "pending" ? "bg-amber-100" : "bg-gray-100"}`}
            >
              <svg
                className={`w-5 h-5 ${user.verified || kycStatus?.status === "approved" ? "text-emerald-600" : kycStatus?.status === "pending" ? "text-amber-500" : "text-gray-400"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">
                {user.verified || kycStatus?.status === "approved"
                  ? pr.verified
                  : kycStatus?.status === "pending"
                    ? "Pending"
                    : "Not Verified"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{pr.kycStatus}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">
                {new Date(user.updatedat).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{pr.memberSince}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-violet-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">
                {reviewStats?.total ?? 0} review
                {(reviewStats?.total ?? 0) !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {reviewStats && reviewStats.averageRating > 0
                  ? `${reviewStats.averageRating.toFixed(1)} ${pr.avgRating}`
                  : pr.noRatings}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-5 pb-16 space-y-4">
        {/* KYC CTA (if not verified and not pending) */}
        {!user.verified &&
          (!kycStatus || kycStatus.status === "not_submitted") && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-900">
                  {pr.getVerifiedTitle}
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  {pr.getVerifiedDesc}
                </p>
              </div>
              <button
                onClick={() => setShowKYCModal(true)}
                className="flex-shrink-0 h-9 px-4 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm"
              >
                {pr.getVerified}
              </button>
            </div>
          )}

        {/* Profile + Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              {pr.personalInfo}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  {pr.fullName}
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-gray-50"
                  />
                ) : (
                  <p className="text-sm font-semibold text-gray-900">
                    {user.name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  {pr.email}
                </label>
                <p className="text-sm font-semibold text-gray-900">
                  {user.email}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {pr.emailNote}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Contact
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                {editMode ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-gray-50"
                  />
                ) : (
                  <p className="text-sm font-semibold text-gray-900">
                    {user.phone || (
                      <span className="text-gray-400 font-normal">Not set</span>
                    )}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Country
                </label>
                {editMode ? (
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-gray-50"
                  >
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm font-semibold text-gray-900">
                    {user.country || (
                      <span className="text-gray-400 font-normal">Not set</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Password</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Keep your account secure with a strong password
            </p>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex-shrink-0 h-9 px-4 rounded-xl text-sm font-semibold bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-all"
          >
            Change
          </button>
        </div>

        {/* Reviews */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              My Reviews
            </p>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${trustScore >= 75 ? "bg-emerald-100 text-emerald-700" : trustScore >= 45 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}
            >
              {trustLoading ? "..." : `${trustScore}% trust`}
            </span>
          </div>
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

      {/* ── PASSWORD MODAL ───────────────────────────────────────────────────── */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 pb-20 md:pb-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 overflow-y-auto max-h-[calc(100dvh-6rem)] md:max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Change Password
                </h3>
              </div>
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
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
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
            <div className="space-y-4">
              {successMessage && (
                <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                  {successMessage}
                </div>
              )}
              {errorMessage && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                  {errorMessage}
                </div>
              )}
              {(
                ["currentPassword", "newPassword", "confirmPassword"] as const
              ).map((field) => (
                <div key={field}>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    {field === "currentPassword"
                      ? "Current Password"
                      : field === "newPassword"
                        ? "New Password"
                        : "Confirm New Password"}
                  </label>
                  <input
                    type="password"
                    name={field}
                    value={passwordData[field]}
                    onChange={handlePasswordInputChange}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-gray-50"
                  />
                </div>
              ))}
              <button
                onClick={handleUpdatePassword}
                disabled={isUpdatingPassword}
                className="w-full h-11 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isUpdatingPassword ? (
                  <span className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                ) : null}
                {isUpdatingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── KYC MODAL ───────────────────────────────────────────────────────── */}
      {userId && (
        <KYCVerificationModal
          isOpen={showKYCModal}
          onClose={() => setShowKYCModal(false)}
          userId={userId as number}
          onSuccess={handleKYCSuccess}
        />
      )}

      {/* ── NOTIFICATION BANNER ─────────────────────────────────────────────── */}
      <NotificationPermissionBanner />

      {/* ── REPORT REVIEW MODAL ─────────────────────────────────────────────── */}
      {reportReview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 pb-20 md:pb-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 overflow-y-auto max-h-[calc(100dvh-6rem)] md:max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Report Review</h3>
              <button
                onClick={() => setReportReview(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
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
            <p className="text-sm text-gray-500 mb-4">
              Describe why this review should be moderated. Our safety team will
              review it.
            </p>
            {reportError && (
              <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {reportError}
              </div>
            )}
            {reportSuccess && (
              <div className="mb-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                {reportSuccess}
              </div>
            )}
            <textarea
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-gray-50 resize-none"
              placeholder="Harassment, spam, false claim..."
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setReportReview(null)}
                disabled={reportSubmitting}
                className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {common.cancel}
              </button>
              <button
                onClick={submitReviewReport}
                disabled={reportSubmitting}
                className="flex-1 h-10 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-70"
              >
                {reportSubmitting ? common.submitting : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
