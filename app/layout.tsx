import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NotificationListener from "./components/NotificationListener";
import Navbar from "./components/Navbar";
import WalletBar from "./components/WalletBar";
import Footer from "./components/Footer";
import AppShellWrapper from "./components/AppShellWrapper";
import ClientPolyfills from "./components/ClientPolyfills";
import AuthClientInit from "./components/AuthClientInit";
import MobileBottomNav from "./components/MobileBottomNav";
import NjimbongChat from "./components/NjimbongChat";

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
    default: "Njimbong — Buy & Sell Online in Cameroon",
    template: "%s | Njimbong Marketplace",
  },
  description:
    "Njimbong is Cameroon's #1 trusted online marketplace. Buy and sell with Fonlok escrow payments, KYC-verified sellers, Njimbong AI, visual search, real-time chat, and full buyer protection.",
  applicationName: "Njimbong Marketplace",
  manifest: "/manifest.webmanifest",
  themeColor: "#16a34a",
  colorScheme: "light",
  metadataBase: new URL("https://njimbong.com"),
  alternates: {
    canonical: "/",
  },
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
    "marketplace Cameroon",
    "buy and sell online Cameroon",
    "buy online Cameroon",
    "sell online Cameroon",
    "local marketplace Cameroon",
    "trusted marketplace Cameroon",
    "safe marketplace Cameroon",
    "Cameroon classifieds",
    "secondhand marketplace Cameroon",
    "used items Cameroon",
    "buy used cars Cameroon",
    "Fonlok escrow",
    "escrow payments Cameroon",
    "KYC verified sellers",
    "buyer protection Cameroon",
    "MTN MoMo marketplace",
    "Orange Money marketplace",
    "secure payments Cameroon",
    "dispute resolution marketplace",
    "Njimbong AI",
    "AI marketplace assistant Cameroon",
    "visual search marketplace",
    "AI listing assistant",
    "trust score marketplace",
    "verified sellers Cameroon",
    "real-time chat marketplace",
    "reviews ratings Cameroon sellers",
    "buy electronics Cameroon",
    "buy phones Cameroon",
    "buy laptops Cameroon",
    "buy fashion Cameroon",
    "buy cars Cameroon",
    "buy real estate Cameroon",
    "local deals Cameroon",
    "free listing Cameroon",
  ],
  openGraph: {
    title: "Njimbong — Buy & Sell Online in Cameroon",
    description:
      "Cameroon's trusted marketplace with Fonlok escrow payments, KYC-verified sellers, Njimbong AI, visual search, and full buyer protection. Free to list.",
    type: "website",
    url: "https://njimbong.com",
    siteName: "Njimbong Marketplace",
    locale: "en_CM",
  },
  twitter: {
    card: "summary_large_image",
    title: "Njimbong — Buy & Sell Online in Cameroon",
    description:
      "Cameroon's trusted marketplace with Fonlok escrow, KYC verification, Njimbong AI, and buyer protection. Free to list.",
    site: "@njimbong",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
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
        <WalletBar />
        <AppShellWrapper>{children}</AppShellWrapper>
        <MobileBottomNav />
        <NjimbongChat />
        <Footer />
      </body>
    </html>
  );
}
