"use client";

import { useEffect } from "react";
import Axios, { AxiosHeaders } from "axios";

declare global {
  interface Window {
    __authInit?: boolean;
  }
}

const isAdminEndpoint = (url: string | undefined): boolean => {
  if (!url) return false;

  return (
    url.includes("/api/admin") ||
    url.includes("/api/kyc/all") ||
    url.includes("/api/kyc/pending") ||
    url.includes("/api/kyc/approve") ||
    url.includes("/api/kyc/reject") ||
    url.includes("/api/categories")
  );
};

const getAuthTokenForUrl = (url: string | undefined): string | null => {
  if (typeof window === "undefined") return null;
  const adminToken = window.localStorage.getItem("adminAuthToken");
  const userToken = window.localStorage.getItem("authToken");

  if (adminToken && (isAdminEndpoint(url) || !userToken)) {
    return adminToken;
  }

  return userToken;
};

export default function AuthClientInit() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.__authInit) return;
    window.__authInit = true;

    Axios.defaults.withCredentials = true;

    Axios.interceptors.request.use((config) => {
      const url = config.url;
      const token = getAuthTokenForUrl(url || "");
      if (token) {
        if (
          config.headers &&
          typeof (config.headers as AxiosHeaders).set === "function"
        ) {
          (config.headers as AxiosHeaders).set(
            "Authorization",
            `Bearer ${token}`,
          );
        } else {
          config.headers = AxiosHeaders.from({
            ...(config.headers || {}),
            Authorization: `Bearer ${token}`,
          });
        }
      }
      if (typeof config.withCredentials === "undefined") {
        config.withCredentials = true;
      }
      return config;
    });

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      const headers = new Headers(
        init?.headers || (input instanceof Request ? input.headers : undefined),
      );

      if (!headers.has("Authorization")) {
        const token = getAuthTokenForUrl(url);
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }

      const nextInit: RequestInit = {
        ...init,
        headers,
      };

      return originalFetch(input, nextInit);
    };
  }, []);

  return null;
}
