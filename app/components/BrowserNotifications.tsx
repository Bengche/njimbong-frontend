"use client";
import { useEffect, useState, useCallback, useRef } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

interface BrowserNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: {
    url?: string;
    type?: string;
    relatedId?: number;
    relatedType?: string;
  };
}

export function useBrowserNotifications() {
  // Initialize with client-side values using lazy initial state
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "default";
  });
  const [isSupported] = useState(() => {
    return typeof window !== "undefined" && "Notification" in window;
  });
  const [swRegistration, setSwRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Register service worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);
          setSwRegistration(registration);
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [isSupported]);

  const subscribeToPush = useCallback(async () => {
    if (!swRegistration || !VAPID_PUBLIC_KEY || permission !== "granted") {
      return;
    }

    try {
      const existing = await swRegistration.pushManager.getSubscription();
      const subscription =
        existing ||
        (await swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));

      await fetch(`${API_BASE}/api/notifications/subscribe`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      });
    } catch (error) {
      console.error("Error subscribing to push:", error);
    }
  }, [API_BASE, permission, swRegistration]);

  useEffect(() => {
    if (permission === "granted" && swRegistration) {
      subscribeToPush();
    }
  }, [permission, swRegistration, subscribeToPush]);

  const showNotification = useCallback(
    async (options: BrowserNotificationOptions) => {
      if (!isSupported || permission !== "granted") {
        console.log("Notifications not available or not permitted");
        return false;
      }

      try {
        // Use service worker if available for better handling
        if (swRegistration) {
          await swRegistration.showNotification(options.title, {
            body: options.body,
            icon: options.icon || "/icon-192x192.png",
            badge: "/badge-72x72.svg",
            tag: options.tag || "marketplace-notification",
            requireInteraction: options.requireInteraction || false,
            data: options.data,
          } as NotificationOptions);
        } else {
          // Fallback to basic notification
          const notification = new Notification(options.title, {
            body: options.body,
            icon: options.icon || "/icon-192x192.png",
            badge: "/badge-72x72.svg",
            tag: options.tag || "marketplace-notification",
            requireInteraction: options.requireInteraction || false,
          });

          notification.onclick = () => {
            window.focus();
            if (options.data?.url) {
              window.location.href = options.data.url;
            }
            notification.close();
          };
        }
        return true;
      } catch (error) {
        console.error("Error showing notification:", error);
        return false;
      }
    },
    [isSupported, permission, swRegistration],
  );

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
  };
}

// Component to request notification permission
export function NotificationPermissionBanner({
  onGranted,
}: {
  onGranted?: () => void;
}) {
  const { isSupported, permission, requestPermission } =
    useBrowserNotifications();
  const [dismissed, setDismissed] = useState(() => {
    // Check if user has dismissed this banner before
    if (typeof window !== "undefined") {
      return localStorage.getItem("notification-banner-dismissed") === "true";
    }
    return false;
  });

  if (
    !isSupported ||
    permission === "granted" ||
    permission === "denied" ||
    dismissed
  ) {
    return null;
  }

  const handleEnable = async () => {
    const granted = await requestPermission();
    if (granted && onGranted) {
      onGranted();
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("notification-banner-dismissed", "true");
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 max-w-sm bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">
            Enable Notifications
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Get notified when your KYC is verified, listings are approved, or
            you receive messages.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <button
              onClick={handleEnable}
              className="w-full sm:w-auto px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
            >
              Enable
            </button>
            <button
              onClick={handleDismiss}
              className="w-full sm:w-auto px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600"
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
    </div>
  );
}

// Hook to poll for new notifications and show browser notifications
export function useNotificationPoller(userId: number | null) {
  const { permission, showNotification } = useBrowserNotifications();
  const lastCheckedRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const showNotificationRef = useRef(showNotification);

  // Keep showNotification ref up to date
  useEffect(() => {
    showNotificationRef.current = showNotification;
  }, [showNotification]);

  useEffect(() => {
    if (!userId || permission !== "granted") {
      // Cleanup if conditions not met
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Don't start a new interval if one is already running
    if (intervalRef.current) return;

    const checkNewNotifications = async () => {
      try {
        const params = new URLSearchParams();
        if (lastCheckedRef.current) {
          params.append("since", lastCheckedRef.current);
        }

        const response = await fetch(
          `${API_BASE}/api/notifications/${userId}/new?${params}`,
          {
            credentials: "include",
          },
        );

        if (response.ok) {
          const data = await response.json();

          // Show browser notification for each new notification
          if (data.notifications && data.notifications.length > 0) {
            for (const notif of data.notifications) {
              // Use link from notification if available, otherwise determine from type
              let url = notif.link || "/dashboard";

              if (!notif.link) {
                if (
                  notif.type === "kyc_approved" ||
                  notif.type === "kyc_rejected"
                ) {
                  url = "/profile";
                } else if (
                  notif.type === "listing_approved" ||
                  notif.type === "listing_rejected"
                ) {
                  url = notif.relatedid
                    ? `/listing/${notif.relatedid}`
                    : "/dashboard";
                } else if (
                  notif.type === "new_message" ||
                  notif.type === "message"
                ) {
                  url = "/chat";
                } else if (
                  notif.type === "favorite_new_listing" ||
                  notif.type === "favorite_listing"
                ) {
                  url = notif.relatedid
                    ? `/listing/${notif.relatedid}`
                    : "/dashboard";
                }
              }

              await showNotificationRef.current({
                title: notif.title,
                body: notif.message,
                tag: `notification-${notif.id}`,
                data: {
                  url,
                  type: notif.type,
                  relatedId: notif.relatedid,
                  relatedType: notif.relatedtype,
                },
              });
            }
          }

          lastCheckedRef.current = new Date().toISOString();
        }
      } catch (error) {
        console.error("Error checking notifications:", error);
      }
    };

    // Check immediately
    checkNewNotifications();

    // Then poll every 15 seconds for real-time experience
    intervalRef.current = setInterval(checkNewNotifications, 15000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [userId, permission]);
}

export default NotificationPermissionBanner;
