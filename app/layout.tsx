import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NotificationListener from "./components/NotificationListener";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AppShellWrapper from "./components/AppShellWrapper";

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
        <NotificationListener />
        <Navbar />
        <AppShellWrapper>{children}</AppShellWrapper>
        <Footer />
      </body>
    </html>
  );
}
