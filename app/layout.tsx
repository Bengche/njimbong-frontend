import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NotificationListener from "./components/NotificationListener";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AppShellWrapper from "./components/AppShellWrapper";
import ClientPolyfills from "./components/ClientPolyfills";
import AuthClientInit from "./components/AuthClientInit";
import MobileBottomNav from "./components/MobileBottomNav";

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
  description:
    "Njimbong: The Trusted Marketplace to Buy and Sell Online in Cameroon",
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
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/icon-32x32.png"],
  },
  keywords: [
    "Njimbong",
    "Njimbong Marketplace",
    "marketplace",
    "Cameroon Marketplace",
    "buy and sell online",
    "buy and sell online in Cameroon",
    "buy online",
    "buy online in Cameroon",
    "sell online",
    "sell online in Cameroon",
    "local marketplace",
    "online marketplace",
    "online marketplace in Cameroon",
    "trusted marketplace",
    "trusted marketplace in Cameroon",
    "safe marketplace",
    "classifieds",
    "secondhand",
    "secondhand marketplace in Cameroon",
    "used items",
    "used items in Cameroon",
    "Buy Used Cars in Cameroon",
    "new listings",
    "local deals",
    "secure payments",
  ],
  openGraph: {
    title: "Njimbong",
    description:
      "Njimbong: The Trusted Marketplace to Buy and Sell Online in Cameroon",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Njimbong",
    description:
      "Njimbong: The Trusted Marketplace to Buy and Sell Online in Cameroon",
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
        <MobileBottomNav />
        <Footer />
      </body>
    </html>
  );
}
