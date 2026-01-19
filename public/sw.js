// Service Worker for Push Notifications
const CACHE_NAME = "marketplace-v1";

// Install event
self.addEventListener("install", (event) => {
  console.log("Service Worker installed");
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
  event.waitUntil(clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener("push", (event) => {
  console.log("Push notification received:", event);

  let notificationData = {
    title: "Marketplace Notification",
    body: "You have a new notification",
    icon: "/logo.svg",
    badge: "/logo.svg",
    tag: "marketplace-notification",
    requireInteraction: false,
    data: {},
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || data.message || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || data.type || notificationData.tag,
        requireInteraction: data.requireInteraction || false,
        data: {
          url: data.url || "/",
          relatedId: data.relatedId,
          relatedType: data.relatedType,
          type: data.type,
        },
      };
    } catch (e) {
      console.error("Error parsing push data:", e);
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      vibrate: [200, 100, 200],
      actions: [
        { action: "view", title: "View" },
        { action: "dismiss", title: "Dismiss" },
      ],
    })
  );
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event);
  event.notification.close();

  const data = event.notification.data || {};
  let url = "/dashboard";

  // Determine URL based on notification type
  if (data.type === "kyc_approved" || data.type === "kyc_rejected") {
    url = "/profile";
  } else if (
    data.type === "listing_approved" ||
    data.type === "listing_rejected"
  ) {
    url = data.relatedId ? `/listing/${data.relatedId}` : "/dashboard";
  } else if (data.type === "new_message" || data.type === "message") {
    url = "/chat";
  } else if (data.type === "favorite_new_listing") {
    url = data.relatedId ? `/listing/${data.relatedId}` : "/dashboard";
  } else if (data.url) {
    url = data.url;
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event);
});
