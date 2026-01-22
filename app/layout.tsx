import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NotificationListener from "./components/NotificationListener";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AppShellWrapper from "./components/AppShellWrapper";
import ClientPolyfills from "./components/ClientPolyfills";
import AuthClientInit from "./components/AuthClientInit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Njimbong",
    template: "%s | Njimbong",
  },
  description: "Njimbong: The Trusted Marketplace to Buy and Sell Online",
  applicationName: "Njimbong Marketplace",
  manifest: "/manifest.webmanifest",
  themeColor: "#16a34a",
  colorScheme: "light",
  appleWebApp: {
    capable: true,
    title: "Njimbong",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: ["/icon-192x192.png"],
  },
  keywords: [
    "Njimbong",
    "Njimbong Marketplace",
    "marketplace",
    "buy and sell online",
    "buy online",
    "sell online",
    "local marketplace",
    "online marketplace",
    "trusted marketplace",
    "safe marketplace",
    "classifieds",
    "secondhand",
    "used items",
    "new listings",
    "local deals",
    "secure payments",
  ],
  openGraph: {
    title: "Njimbong",
    description: "Njimbong: The Trusted Marketplace to Buy and Sell Online",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Njimbong",
    description: "Njimbong: The Trusted Marketplace to Buy and Sell Online",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientPolyfills />
        <AuthClientInit />
        <NotificationListener />
        <Navbar />
        <AppShellWrapper>{children}</AppShellWrapper>
        <Footer />
      </body>
    </html>
  );
}
