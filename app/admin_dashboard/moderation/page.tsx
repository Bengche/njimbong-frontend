"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "../../components/PageHeader";

// Type definitions
interface ReportStats {
  total: number;
  pending: number;
  reviewed: number;
  escalated: number;
  totalSuspensions: number;
  activeSuspensions: number;
  pendingAppeals: number;
  warningsIssued: number;
}

interface Report {
  id: number;
  report_type: "listing" | "user";
  reason_name: string;
  severity: string;
  custom_reason: string | null;
  status: string;
  priority: string;
  created_at: string;
  reporter_name: string;
  reporter_email: string;
  reported_user_id: number | null;
  reported_user_name: string | null;
  reported_user_email: string | null;
  reported_listing_id: number | null;
  reported_listing_title: string | null;
  admin_notes: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
}

interface Warning {
  id: number;
  severity: string;
  reason: string;
  created_at: string;
  admin_name: string;
}

interface Suspension {
  id: number;
  suspension_type: string;
  reason: string;
  suspended_at: string;
  suspended_until: string | null;
  is_lifted: boolean;
  admin_name: string;
}

interface Appeal {
  id: number;
  appeal_reason: string;
  submitted_at: string;
  status: string;
  user_id: number;
  user_name: string;
  user_email: string;
  suspension_type: string;
  suspension_reason: string;
  suspended_at: string;
}

interface UserDetails {
  id: number;
  username: string;
  email: string;
  profilepicture: string | null;
  created_at: string;
  role?: string;
  is_suspended?: boolean;
  suspension_reason?: string | null;
  warning_count?: number;
  warnings: Warning[];
  suspensions: Suspension[];
  report_count: number;
}

interface UserSummary {
  id: number;
  name: string;
  email: string;
  profilepictureurl: string | null;
  created_at: string;
  role: string;
  is_suspended: boolean;
  warning_count: number;
  report_count: number;
  total_listings: number;
  active_listings: number;
  total_reports: number;
}

function ModerationDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [adminChecked, setAdminChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "reports" | "appeals" | "users" | "broadcast"
  >("reports");
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Broadcast state
  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    message: "",
    type: "announcement",
    priority: "normal",
  });
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userSortBy, setUserSortBy] = useState("created_at");
  const [userSortOrder, setUserSortOrder] = useState("desc");

  // Modals
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);

  // Form states
  const [warningForm, setWarningForm] = useState({
    severity: "low",
    reason: "",
  });
  const [suspensionForm, setSuspensionForm] = useState({
    type: "temporary",
    reason: "",
    duration: 7,
  });
  const [appealResponse, setAppealResponse] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
  const adminLoginUrl =
    process.env.NEXT_PUBLIC_ADMIN_LOGIN_ENDPOINT || "/auth/admin";

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/admin/reports/stats`, {
          credentials: "include",
        });
        if (response.status === 200) {
          setAdminChecked(true);
          return;
        }
        router.push(adminLoginUrl);
      } catch (error) {
        console.error("Error checking admin auth:", error);
        router.push(adminLoginUrl);
      }
    };

    checkAdmin();
  }, [API_BASE, adminLoginUrl, router]);

  const getNumberValue = useCallback((value: unknown) => {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }, []);

  const getNullableNumber = useCallback((value: unknown) => {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  }, []);

  const getStringValue = useCallback(
    (value: unknown, fallback = "") =>
      typeof value === "string" ? value : fallback,
    []
  );

  const getNullableString = useCallback(
    (value: unknown) =>
      typeof value === "string" && value.trim() !== "" ? value : null,
    []
  );

  const toSeverityLabel = useCallback((value: unknown) => {
    if (typeof value === "number") {
      return value >= 3 ? "high" : value === 2 ? "medium" : "low";
    }
    if (typeof value === "string" && value.trim() !== "") {
      return value.toLowerCase();
    }
    return "low";
  }, []);

  const toPriorityLabel = useCallback((value: unknown) => {
    if (typeof value === "number") {
      return value >= 3 ? "high" : value === 2 ? "medium" : "low";
    }
    if (typeof value === "string" && value.trim() !== "") {
      return value.toLowerCase();
    }
    return "low";
  }, []);

  const priorityFilterToValue = useCallback((value: string) => {
    switch (value) {
      case "critical":
      case "high":
        return "3";
      case "medium":
        return "2";
      case "low":
        return "1";
      default:
        return undefined;
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/reports/stats`, {
        credentials: "include",
      });

      if (response.status === 401) {
        router.push(adminLoginUrl);
        return;
      }
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      const stats = data as Record<string, unknown>;
      setStats({
        total: getNumberValue(stats.total_reports ?? stats.total),
        pending: getNumberValue(stats.pending_reports ?? stats.pending),
        reviewed: getNumberValue(stats.resolved_reports ?? stats.reviewed),
        escalated: getNumberValue(stats.high_priority ?? stats.escalated),
        totalSuspensions: getNumberValue(
          stats.active_suspensions ?? stats.totalSuspensions
        ),
        activeSuspensions: getNumberValue(
          stats.active_suspensions ?? stats.activeSuspensions
        ),
        pendingAppeals: getNumberValue(
          stats.pending_appeals ?? stats.pendingAppeals
        ),
        warningsIssued: getNumberValue(stats.warningsIssued),
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, [API_BASE, adminLoginUrl, getNumberValue, router]);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "50",
      });

      if (statusFilter && statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (typeFilter && typeFilter !== "all") {
        params.set("type", typeFilter);
      }
      const priorityValue = priorityFilterToValue(priorityFilter);
      if (priorityValue) {
        params.set("priority", priorityValue);
      }

      const response = await fetch(`${API_BASE}/api/admin/reports?${params}`, {
        credentials: "include",
      });

      if (response.status === 401) {
        router.push(adminLoginUrl);
        return;
      }
      if (!response.ok) throw new Error("Failed to fetch reports");
      const data = await response.json();
      const normalizedReports: Report[] = (data.reports || []).map(
        (report: Record<string, unknown>) => ({
          id: getNumberValue(report.id),
          report_type: report.report_type === "user" ? "user" : "listing",
          reason_name:
            typeof report.reason_name === "string"
              ? report.reason_name
              : typeof report.reason_text === "string"
              ? report.reason_text
              : "",
          severity: toSeverityLabel(report.severity),
          custom_reason: getNullableString(report.custom_reason),
          status: getStringValue(report.status, "pending"),
          priority: toPriorityLabel(report.priority),
          created_at: getStringValue(report.created_at, ""),
          reporter_name: getStringValue(report.reporter_name, ""),
          reporter_email: getStringValue(report.reporter_email, ""),
          reported_user_id: getNullableNumber(report.reported_user_id),
          reported_user_name: getNullableString(report.reported_user_name),
          reported_user_email: getNullableString(report.reported_user_email),
          reported_listing_id: getNullableNumber(report.reported_listing_id),
          reported_listing_title:
            getNullableString(report.reported_listing_title) ??
            getNullableString(report.listing_title),
          admin_notes: getNullableString(report.admin_notes),
          reviewed_by_name: getNullableString(report.reviewed_by_name),
          reviewed_at: getNullableString(report.reviewed_at),
        })
      );
      setReports(normalizedReports);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports");
    }
  }, [
    API_BASE,
    adminLoginUrl,
    getNumberValue,
    getNullableNumber,
    getNullableString,
    getStringValue,
    priorityFilterToValue,
    router,
    statusFilter,
    toPriorityLabel,
    toSeverityLabel,
    typeFilter,
    priorityFilter,
  ]);

  // Fetch appeals
  const fetchAppeals = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/appeals`, {
        credentials: "include",
      });

      if (response.status === 401) {
        router.push(adminLoginUrl);
        return;
      }
      if (!response.ok) throw new Error("Failed to fetch appeals");
      const data = await response.json();
      setAppeals(data.appeals || []);
    } catch (err) {
      console.error("Error fetching appeals:", err);
    }
  }, [API_BASE, adminLoginUrl, router]);

  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const params = new URLSearchParams({
        page: usersPage.toString(),
        limit: "20",
        sortBy: userSortBy,
        sortOrder: userSortOrder,
      });

      if (userSearch.trim()) params.set("search", userSearch.trim());
      if (userStatusFilter !== "all") params.set("status", userStatusFilter);
      if (userRoleFilter !== "all") params.set("role", userRoleFilter);

      const response = await fetch(
        `${API_BASE}/api/admin/users?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      if (response.status === 401) {
        router.push(adminLoginUrl);
        return;
      }
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data.users || []);
      setUsersTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  }, [
    API_BASE,
    adminLoginUrl,
    router,
    userRoleFilter,
    userSearch,
    userSortBy,
    userSortOrder,
    userStatusFilter,
    usersPage,
  ]);

  // Fetch user details
  const fetchUserDetails = async (userId: number) => {
    try {
      const moderationRes = await fetch(
        `${API_BASE}/api/admin/users/${userId}/moderation-history`,
        {
          credentials: "include",
        }
      );

      if (moderationRes.status === 401) {
        router.push(adminLoginUrl);
        return;
      }
      if (!moderationRes.ok) {
        throw new Error("Failed to fetch moderation history");
      }

      const moderationData = await moderationRes.json();

      setSelectedUser({
        ...moderationData.user,
        username: moderationData.user?.name ?? moderationData.user?.username,
        warnings: moderationData.warnings || [],
        suspensions: moderationData.suspensions || [],
        report_count: moderationData.user?.report_count ?? 0,
        warning_count: moderationData.user?.warning_count ?? 0,
        is_suspended: Boolean(moderationData.user?.is_suspended),
        suspension_reason: moderationData.user?.suspension_reason ?? null,
        role: moderationData.user?.role ?? "user",
      });
    } catch (err) {
      console.error("Error fetching user details:", err);
      setError("Failed to load user details");
    }
  };

  const handleUnsuspendUser = async (userId: number) => {
    const liftReason = window.prompt(
      "Provide a reason for lifting the suspension:"
    );
    if (!liftReason) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/users/${userId}/unsuspend`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ liftReason }),
        }
      );

      if (!response.ok) throw new Error("Failed to lift suspension");

      await fetchUsers();
      if (selectedUser?.id === userId) {
        await fetchUserDetails(userId);
      }
    } catch (err) {
      console.error("Error unsuspending user:", err);
      setError("Failed to lift suspension");
    } finally {
      setActionLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (!adminChecked) return;
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchReports(), fetchAppeals()]);
      setLoading(false);
    };

    loadData();
  }, [adminChecked, router, fetchStats, fetchReports, fetchAppeals]);

  useEffect(() => {
    if (!adminChecked) return;
    const tabParam = searchParams.get("tab");
    if (
      tabParam === "users" ||
      tabParam === "reports" ||
      tabParam === "appeals" ||
      tabParam === "broadcast"
    ) {
      setActiveTab(tabParam);
    }
  }, [adminChecked, searchParams]);

  // Reload reports when filters change
  useEffect(() => {
    if (!adminChecked) return;
    if (!loading) {
      fetchReports();
    }
  }, [adminChecked, statusFilter, typeFilter, priorityFilter, fetchReports, loading]);

  useEffect(() => {
    if (!adminChecked) return;
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [
    adminChecked,
    activeTab,
    fetchUsers,
    userRoleFilter,
    userSearch,
    userSortBy,
    userSortOrder,
    userStatusFilter,
    usersPage,
  ]);

  useEffect(() => {
    if (!adminChecked) return;
    if (activeTab === "users") {
      setUsersPage(1);
    }
  }, [
    adminChecked,
    activeTab,
    userSearch,
    userStatusFilter,
    userRoleFilter,
    userSortBy,
    userSortOrder,
  ]);

  if (!adminChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-700">Loading...</div>
      </div>
    );
  }

  // Report actions
  const handleDismissReport = async (reportId: number) => {
    setActionLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/reports/${reportId}/status`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "dismissed",
            adminNotes,
            actionTaken: "dismissed",
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to dismiss report");

      await fetchReports();
      await fetchStats();
      setSelectedReport(null);
      setAdminNotes("");
    } catch (err) {
      console.error("Error dismissing report:", err);
      setError("Failed to dismiss report");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcknowledgeReport = async (reportId: number) => {
    setActionLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/reports/${reportId}/status`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "reviewing",
            adminNotes,
            actionTaken: "reviewing",
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to acknowledge report");

      await fetchReports();
      await fetchStats();
      setSelectedReport(null);
      setAdminNotes("");
    } catch (err) {
      console.error("Error acknowledging report:", err);
      setError("Failed to acknowledge report");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalateReport = async (reportId: number, priority: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/reports/${reportId}/status`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "reviewing",
            adminNotes: adminNotes || `Escalated priority: ${priority}`,
            actionTaken: "escalated",
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to escalate report");

      await fetchReports();
      await fetchStats();
      setSelectedReport(null);
      setAdminNotes("");
    } catch (err) {
      console.error("Error escalating report:", err);
      setError("Failed to escalate report");
    } finally {
      setActionLoading(false);
    }
  };

  // Issue warning
  const handleIssueWarning = async () => {
    if (!selectedUser || !warningForm.reason) return;

    setActionLoading(true);
    try {
      const warningType =
        warningForm.severity === "high"
          ? "severe"
          : warningForm.severity === "medium"
          ? "moderate"
          : "mild";

      const response = await fetch(
        `${API_BASE}/api/admin/users/${selectedUser.id}/warn`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            warningType,
            reason: warningForm.reason,
            relatedReportId: selectedReport?.id,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to issue warning");

      setShowWarningModal(false);
      setWarningForm({ severity: "low", reason: "" });
      await fetchUserDetails(selectedUser.id);
      await fetchStats();
    } catch (err) {
      console.error("Error issuing warning:", err);
      setError("Failed to issue warning");
    } finally {
      setActionLoading(false);
    }
  };

  // Suspend user
  const handleSuspendUser = async () => {
    if (!selectedUser || !suspensionForm.reason) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/users/${selectedUser.id}/suspend`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            suspensionType: suspensionForm.type,
            reason: suspensionForm.reason,
            endsAt:
              suspensionForm.type === "temporary"
                ? new Date(
                    Date.now() + suspensionForm.duration * 24 * 60 * 60 * 1000
                  ).toISOString()
                : null,
            relatedReportId: selectedReport?.id,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to suspend user");

      setShowSuspensionModal(false);
      setSuspensionForm({ type: "temporary", reason: "", duration: 7 });
      setSelectedUser(null);
      await fetchStats();
    } catch (err) {
      console.error("Error suspending user:", err);
      setError("Failed to suspend user");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete listing
  const handleDeleteListing = async (listingId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this listing? This action cannot be undone."
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/listings/${listingId}/remove`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: adminNotes || "Removed due to policy violation",
            relatedReportId: selectedReport?.id,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to delete listing");

      await fetchReports();
      await fetchStats();
      setSelectedReport(null);
      setAdminNotes("");
    } catch (err) {
      console.error("Error deleting listing:", err);
      setError("Failed to delete listing");
    } finally {
      setActionLoading(false);
    }
  };

  // Appeal actions
  const handleApproveAppeal = async (appealId: number) => {
    setActionLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/appeals/${appealId}/review`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            decision: "approved",
            adminNotes: appealResponse,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to approve appeal");

      await fetchAppeals();
      await fetchStats();
      setSelectedAppeal(null);
      setAppealResponse("");
    } catch (err) {
      console.error("Error approving appeal:", err);
      setError("Failed to approve appeal");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectAppeal = async (appealId: number) => {
    if (!appealResponse) {
      setError("Please provide a reason for rejecting the appeal");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/appeals/${appealId}/review`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            decision: "denied",
            adminNotes: appealResponse,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to reject appeal");

      await fetchAppeals();
      await fetchStats();
      setSelectedAppeal(null);
      setAppealResponse("");
    } catch (err) {
      console.error("Error rejecting appeal:", err);
      setError("Failed to reject appeal");
    } finally {
      setActionLoading(false);
    }
  };

  // Send broadcast to all users
  const handleSendBroadcast = async () => {
    if (!broadcastForm.title || !broadcastForm.message) {
      setError("Please fill in both title and message");
      return;
    }

    setActionLoading(true);
    setBroadcastSuccess(null);
    try {
      const response = await fetch(`${API_BASE}/api/admin/broadcast`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(broadcastForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send broadcast");
      }

      const data = await response.json();
      setBroadcastSuccess(
        `Broadcast sent successfully to ${data.recipientsCount} users!`
      );
      setBroadcastForm({
        title: "",
        message: "",
        type: "announcement",
        priority: "normal",
      });
    } catch (err: unknown) {
      console.error("Error sending broadcast:", err);
      const message =
        err instanceof Error ? err.message : "Failed to send broadcast";
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
      case "critical":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "reviewing":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "dismissed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-600 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      case "low":
        return "bg-gray-400 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
      <PageHeader
        title="Moderation Dashboard"
        description="Manage reports, warnings, and suspensions."
        actions={
          <button
            onClick={() => router.push("/admin_dashboard")}
            className="flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            ← Back to Dashboard
          </button>
        }
      />

      {/* Stats Cards */}
      {stats && (
        <div className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="text-3xl font-bold text-yellow-600">
                {stats.pending}
              </div>
              <div className="text-sm text-gray-600">Pending Reports</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="text-3xl font-bold text-red-600">
                {stats.escalated}
              </div>
              <div className="text-sm text-gray-600">Escalated</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="text-3xl font-bold text-orange-600">
                {stats.activeSuspensions}
              </div>
              <div className="text-sm text-gray-600">Active Suspensions</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="text-3xl font-bold text-blue-600">
                {stats.pendingAppeals}
              </div>
              <div className="text-sm text-gray-600">Pending Appeals</div>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b">
            <div className="flex flex-wrap gap-2 sm:gap-0">
              <button
                onClick={() => setActiveTab("reports")}
                className={`px-4 py-3 text-sm sm:px-6 sm:py-4 sm:text-base font-medium transition ${
                  activeTab === "reports"
                    ? "text-green-600 border-b-2 border-green-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Reports {stats && `(${stats.pending})`}
              </button>
              <button
                onClick={() => setActiveTab("appeals")}
                className={`px-4 py-3 text-sm sm:px-6 sm:py-4 sm:text-base font-medium transition ${
                  activeTab === "appeals"
                    ? "text-green-600 border-b-2 border-green-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Appeals {stats && `(${stats.pendingAppeals})`}
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`px-4 py-3 text-sm sm:px-6 sm:py-4 sm:text-base font-medium transition ${
                  activeTab === "users"
                    ? "text-green-600 border-b-2 border-green-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab("broadcast")}
                className={`px-4 py-3 text-sm sm:px-6 sm:py-4 sm:text-base font-medium transition flex items-center gap-2 ${
                  activeTab === "broadcast"
                    ? "text-green-600 border-b-2 border-green-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
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
                    d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                  />
                </svg>
                Broadcast
              </button>
            </div>
          </div>

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <div className="p-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="listing">Listings</option>
                  <option value="user">Users</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Priority</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Reports Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Reason
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Target
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Reporter
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Priority
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reports.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          No reports found
                        </td>
                      </tr>
                    ) : (
                      reports.map((report) => (
                        <tr key={report.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                report.report_type === "listing"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {report.report_type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {report.reason_name}
                            </div>
                            {report.custom_reason && (
                              <div className="text-xs text-gray-500 truncate max-w-xs">
                                {report.custom_reason}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {report.report_type === "listing" ? (
                              <span className="truncate max-w-xs block">
                                {report.reported_listing_title}
                              </span>
                            ) : (
                              <span>{report.reported_user_name}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {report.reporter_name}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(
                                report.priority
                              )}`}
                            >
                              {report.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                report.status
                              )}`}
                            >
                              {report.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {formatDate(report.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setSelectedReport(report)}
                              className="text-green-600 hover:text-green-800 text-sm font-medium"
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
          )}

          {/* Appeals Tab */}
          {activeTab === "appeals" && (
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Suspension Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Original Reason
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Appeal Reason
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Submitted
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {appeals.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          No pending appeals
                        </td>
                      </tr>
                    ) : (
                      appeals.map((appeal) => (
                        <tr key={appeal.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {appeal.user_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {appeal.user_email}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                appeal.suspension_type === "permanent"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {appeal.suspension_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                            {appeal.suspension_reason}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                            {appeal.appeal_reason}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {formatDate(appeal.submitted_at)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setSelectedAppeal(appeal)}
                              className="text-green-600 hover:text-green-800 text-sm font-medium"
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
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="p-4 space-y-4">
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center">
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name or email"
                  className="w-full sm:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <select
                  value={userSortBy}
                  onChange={(e) => setUserSortBy(e.target.value)}
                  className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="created_at">Newest</option>
                  <option value="report_count">Most Reported</option>
                  <option value="warning_count">Most Warnings</option>
                  <option value="active_listings">Active Listings</option>
                  <option value="total_listings">Total Listings</option>
                </select>
                <select
                  value={userSortOrder}
                  onChange={(e) => setUserSortOrder(e.target.value)}
                  className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Listings
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Reports
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Warnings
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Joined
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {usersLoading ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center">
                          <div className="inline-flex items-center gap-2 text-gray-500">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                            Loading users...
                          </div>
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {user.email}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.is_suspended
                                  ? "bg-red-100 text-red-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {user.is_suspended ? "Suspended" : "Active"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {user.active_listings}/{user.total_listings}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {user.total_reports}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {user.warning_count}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {formatDate(user.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  fetchUserDetails(user.id);
                                  setShowUserModal(true);
                                }}
                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                              >
                                View
                              </button>
                              <button
                                onClick={() => {
                                  fetchUserDetails(user.id);
                                  setShowWarningModal(true);
                                }}
                                className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                              >
                                Warn
                              </button>
                              {user.is_suspended ? (
                                <button
                                  onClick={() => handleUnsuspendUser(user.id)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                  Unsuspend
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    fetchUserDetails(user.id);
                                    setShowSuspensionModal(true);
                                  }}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Suspend
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Page {usersPage} of {usersTotalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setUsersPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={usersPage <= 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setUsersPage((prev) =>
                        Math.min(prev + 1, usersTotalPages)
                      )
                    }
                    disabled={usersPage >= usersTotalPages}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Broadcast Tab */}
          {activeTab === "broadcast" && (
            <div className="p-4 sm:p-6">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
                        d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Broadcast Message
                  </h2>
                  <p className="text-gray-500">
                    Send a notification to all active users on the platform
                  </p>
                </div>

                {broadcastSuccess && (
                  <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-green-600"
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
                    <span className="text-green-700">{broadcastSuccess}</span>
                  </div>
                )}

                <div className="bg-gray-50 rounded-xl p-4 sm:p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notification Title *
                    </label>
                    <input
                      type="text"
                      value={broadcastForm.title}
                      onChange={(e) =>
                        setBroadcastForm({
                          ...broadcastForm,
                          title: e.target.value,
                        })
                      }
                      placeholder="e.g., Platform Maintenance Notice"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      maxLength={100}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {broadcastForm.title.length}/100 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message Content *
                    </label>
                    <textarea
                      value={broadcastForm.message}
                      onChange={(e) =>
                        setBroadcastForm({
                          ...broadcastForm,
                          message: e.target.value,
                        })
                      }
                      placeholder="Write your broadcast message here..."
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      maxLength={1000}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {broadcastForm.message.length}/1000 characters
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message Type
                      </label>
                      <select
                        value={broadcastForm.type}
                        onChange={(e) =>
                          setBroadcastForm({
                            ...broadcastForm,
                            type: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="announcement">📢 Announcement</option>
                        <option value="update">🔄 Platform Update</option>
                        <option value="maintenance">🔧 Maintenance</option>
                        <option value="promotion">🎉 Promotion</option>
                        <option value="alert">⚠️ Alert</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={broadcastForm.priority}
                        onChange={(e) =>
                          setBroadcastForm({
                            ...broadcastForm,
                            priority: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <svg
                        className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
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
                      <div className="text-sm text-amber-700">
                        <p className="font-medium mb-1">Important</p>
                        <p>
                          This message will be sent to all active users on the
                          platform. Make sure your message is clear and
                          appropriate before sending.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSendBroadcast}
                    disabled={
                      actionLoading ||
                      !broadcastForm.title ||
                      !broadcastForm.message
                    }
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
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
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                        Send Broadcast to All Users
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Report Details
                  </h2>
                  <p className="text-sm text-gray-500">
                    ID: {selectedReport.id}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedReport(null);
                    setAdminNotes("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
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

            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Report Type
                  </label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedReport.report_type === "listing"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {selectedReport.report_type}
                  </span>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Priority
                  </label>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(
                      selectedReport.priority
                    )}`}
                  >
                    {selectedReport.priority}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Reason
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {selectedReport.reason_name}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${getSeverityColor(
                      selectedReport.severity
                    )}`}
                  >
                    {selectedReport.severity}
                  </span>
                </div>
              </div>

              {selectedReport.custom_reason && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Additional Details
                  </label>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedReport.custom_reason}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Reporter
                  </label>
                  <p className="font-medium">{selectedReport.reporter_name}</p>
                  <p className="text-sm text-gray-500">
                    {selectedReport.reporter_email}
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    {selectedReport.report_type === "listing"
                      ? "Reported Listing"
                      : "Reported User"}
                  </label>
                  {selectedReport.report_type === "listing" ? (
                    <p className="font-medium">
                      {selectedReport.reported_listing_title}
                    </p>
                  ) : (
                    <>
                      <p className="font-medium">
                        {selectedReport.reported_user_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedReport.reported_user_email}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                  rows={3}
                  placeholder="Add notes about this report..."
                />
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleDismissReport(selectedReport.id)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => handleAcknowledgeReport(selectedReport.id)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  Acknowledge
                </button>
                <button
                  onClick={() =>
                    handleEscalateReport(selectedReport.id, "high")
                  }
                  disabled={actionLoading}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  Escalate
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {selectedReport.reported_user_id && (
                  <>
                    <button
                      onClick={() => {
                        fetchUserDetails(selectedReport.reported_user_id!);
                        setShowWarningModal(true);
                      }}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                    >
                      Issue Warning
                    </button>
                    <button
                      onClick={() => {
                        fetchUserDetails(selectedReport.reported_user_id!);
                        setShowSuspensionModal(true);
                      }}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                    >
                      Suspend User
                    </button>
                  </>
                )}
                {selectedReport.reported_listing_id && (
                  <button
                    onClick={() =>
                      handleDeleteListing(selectedReport.reported_listing_id!)
                    }
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Delete Listing
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedUser.username}
                </h2>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="font-semibold">
                    {selectedUser.is_suspended ? "Suspended" : "Active"}
                  </p>
                  {selectedUser.is_suspended &&
                    selectedUser.suspension_reason && (
                      <p className="text-xs text-red-600 mt-1">
                        {selectedUser.suspension_reason}
                      </p>
                    )}
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-xs text-gray-500">Warnings</p>
                  <p className="font-semibold">
                    {selectedUser.warning_count ?? selectedUser.warnings.length}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-xs text-gray-500">Reports</p>
                  <p className="font-semibold">{selectedUser.report_count}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setShowWarningModal(true);
                  }}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                >
                  Issue Warning
                </button>
                {selectedUser.is_suspended ? (
                  <button
                    onClick={() => handleUnsuspendUser(selectedUser.id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Unsuspend
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowUserModal(false);
                      setShowSuspensionModal(true);
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Suspend
                  </button>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  Recent Warnings
                </h3>
                {selectedUser.warnings.length === 0 ? (
                  <p className="text-sm text-gray-500">No warnings issued.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedUser.warnings.map((warning) => (
                      <div
                        key={warning.id}
                        className="p-3 border rounded-lg flex flex-col gap-1"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full ${getSeverityColor(
                              warning.severity
                            )}`}
                          >
                            {warning.severity}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(warning.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {warning.reason}
                        </p>
                        <p className="text-xs text-gray-500">
                          Issued by {warning.admin_name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  Suspensions
                </h3>
                {selectedUser.suspensions.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No suspensions recorded.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedUser.suspensions.map((suspension) => (
                      <div
                        key={suspension.id}
                        className="p-3 border rounded-lg"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">
                            {suspension.suspension_type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(suspension.suspended_at)}
                          </span>
                          {suspension.suspended_until && (
                            <span className="text-xs text-gray-500">
                              Until {formatDate(suspension.suspended_until)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mt-1">
                          {suspension.reason}
                        </p>
                        <p className="text-xs text-gray-500">
                          By {suspension.admin_name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarningModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-4 sm:p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Issue Warning</h2>
              <p className="text-sm text-gray-500">
                To: {selectedUser.username}
              </p>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity
                </label>
                <select
                  value={warningForm.severity}
                  onChange={(e) =>
                    setWarningForm({ ...warningForm, severity: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <textarea
                  value={warningForm.reason}
                  onChange={(e) =>
                    setWarningForm({ ...warningForm, reason: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2"
                  rows={4}
                  placeholder="Explain the warning reason..."
                />
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t bg-gray-50 flex flex-col sm:flex-row sm:justify-end gap-2">
              <button
                onClick={() => {
                  setShowWarningModal(false);
                  setWarningForm({ severity: "low", reason: "" });
                }}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleIssueWarning}
                disabled={actionLoading || !warningForm.reason}
                className="w-full sm:w-auto px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
              >
                {actionLoading ? "Sending..." : "Issue Warning"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspension Modal */}
      {showSuspensionModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-4 sm:p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                Suspend Account
              </h2>
              <p className="text-sm text-gray-500">
                User: {selectedUser.username}
              </p>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Suspension Type
                </label>
                <select
                  value={suspensionForm.type}
                  onChange={(e) =>
                    setSuspensionForm({
                      ...suspensionForm,
                      type: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2"
                >
                  <option value="temporary">Temporary</option>
                  <option value="permanent">Permanent</option>
                </select>
              </div>

              {suspensionForm.type === "temporary" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    value={suspensionForm.duration}
                    onChange={(e) =>
                      setSuspensionForm({
                        ...suspensionForm,
                        duration: parseInt(e.target.value) || 1,
                      })
                    }
                    min={1}
                    max={365}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <textarea
                  value={suspensionForm.reason}
                  onChange={(e) =>
                    setSuspensionForm({
                      ...suspensionForm,
                      reason: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2"
                  rows={4}
                  placeholder="Explain the suspension reason..."
                />
              </div>

              {suspensionForm.type === "permanent" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    <strong>Warning:</strong> Permanent suspension will block
                    this user from all activities. They can only submit an
                    appeal.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 border-t bg-gray-50 flex flex-col sm:flex-row sm:justify-end gap-2">
              <button
                onClick={() => {
                  setShowSuspensionModal(false);
                  setSuspensionForm({
                    type: "temporary",
                    reason: "",
                    duration: 7,
                  });
                }}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendUser}
                disabled={actionLoading || !suspensionForm.reason}
                className="w-full sm:w-auto px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {actionLoading ? "Suspending..." : "Suspend Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appeal Review Modal */}
      {selectedAppeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Review Appeal
                  </h2>
                  <p className="text-sm text-gray-500">
                    From: {selectedAppeal.user_name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedAppeal(null);
                    setAppealResponse("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
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

            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    User
                  </label>
                  <p className="font-medium">{selectedAppeal.user_name}</p>
                  <p className="text-sm text-gray-500">
                    {selectedAppeal.user_email}
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Suspension Type
                  </label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedAppeal.suspension_type === "permanent"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {selectedAppeal.suspension_type}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Original Suspension Reason
                </label>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {selectedAppeal.suspension_reason}
                </p>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Appeal Reason
                </label>
                <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">
                  {selectedAppeal.appeal_reason}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Response
                </label>
                <textarea
                  value={appealResponse}
                  onChange={(e) => setAppealResponse(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                  rows={4}
                  placeholder="Enter your response to the appeal..."
                />
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => handleRejectAppeal(selectedAppeal.id)}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Reject Appeal"}
              </button>
              <button
                onClick={() => handleApproveAppeal(selectedAppeal.id)}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Approve Appeal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ModerationDashboardPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <ModerationDashboardContent />
    </Suspense>
  );
}
