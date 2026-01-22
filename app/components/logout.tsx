"use client";
import Axios from "axios";
Axios.defaults.withCredentials = true;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function Logout() {
  const handleLogout = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        if (subscription) {
          await Axios.post(`${API_BASE}/api/notifications/unsubscribe`, {
            endpoint: subscription.endpoint,
          });
        }
      }
      await Axios.post(`${API_BASE}/auth/logout`);
      window.localStorage.removeItem("authToken");
      window.localStorage.removeItem("adminAuthToken");
      console.log("Logged out successfully");

      // Optionally, redirect to login page or homepage
      window.location.href = process.env.NEXT_PUBLIC_LOGIN_ENDPOINT || "/login";
    } catch (error) {
      window.localStorage.removeItem("authToken");
      window.localStorage.removeItem("adminAuthToken");
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white p-2 m-2 rounded-md hover:bg-red-600 transition-colors flex items-center gap-2 text-bold"
      >
        Logout
      </button>
    </>
  );
}
