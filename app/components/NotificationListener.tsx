"use client";

import { useEffect, useState } from "react";
import {
  NotificationPermissionBanner,
  useNotificationPoller,
} from "./BrowserNotifications";

export default function NotificationListener() {
  const [userId, setUserId] = useState<number | null>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/user/me`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setUserId(data.id ?? null);
        }
      } catch {
        // Silent fail
      }
    };

    fetchMe();
  }, [API_BASE]);

  useNotificationPoller(userId);

  return <NotificationPermissionBanner />;
}
