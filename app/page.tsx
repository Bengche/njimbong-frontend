export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Axios from "axios";
import HomePageContent from "./components/HomePageContent";

export const metadata: Metadata = {
  title: "Njimbong Marketplace — Buy & Sell Safely in Cameroon",
  description:
    "Njimbong is Cameroon's #1 trusted online marketplace. Buy and sell electronics, fashion, vehicles, and more with Fonlok escrow payments, KYC-verified sellers, Njimbong AI assistant, visual search, real-time chat, and full buyer dispute protection.",
  keywords: [
    "Njimbong",
    "Njimbong Marketplace",
    "marketplace Cameroon",
    "buy and sell Cameroon",
    "secure payment Cameroon",
    "Fonlok escrow",
    "escrow payment Cameroon",
    "safe online shopping Cameroon",
    "KYC verified sellers Cameroon",
    "buy sell online Cameroon",
    "MoMo escrow",
    "trusted marketplace",
    "Cameroon classifieds",
    "online marketplace Cameroon",
    "Njimbong AI",
    "AI marketplace assistant",
    "visual search marketplace",
    "trust score marketplace",
    "buyer protection Cameroon",
    "sell online Cameroon free",
    "MTN MoMo payment marketplace",
    "Orange Money marketplace",
    "verified sellers Cameroon",
    "dispute resolution marketplace",
    "real-time chat marketplace",
    "reviews ratings sellers Cameroon",
    "buy electronics Cameroon",
    "buy phones Cameroon",
    "buy cars Cameroon",
    "buy fashion Cameroon",
  ],
};

export default async function Home() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;
  let listings = [];

  // 1. Fetch data directly inside the Server Component
  // 1. Fetch data directly inside the Server Component
  try {
    const response = await Axios.get(
      `https://njimbong-backend-production.up.railway.app/home/listings`,
      { headers: { "Cache-Control": "no-cache" } },
    );

    // Axios puts the backend response in .data
    // We ensure 'listings' is the array found in response.data
    listings = response.data || [];

    // This will now show the items in your VS Code terminal
    console.log("Success! Items found:", listings.length);
  } catch (error) {
    console.error("Error fetching listings:", error);
    listings = []; // Keep it as an empty array on error so the map doesn't crash
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-yellow-50 to-white text-gray-900">
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "@id": "https://njimbong.com/#website",
                name: "Njimbong Marketplace",
                description:
                  "Cameroon's trusted online marketplace with Fonlok escrow payments, KYC-verified sellers, and Njimbong AI.",
                url: "https://njimbong.com",
                inLanguage: ["en", "fr"],
                potentialAction: {
                  "@type": "SearchAction",
                  target:
                    "https://njimbong.com/dashboard?search={search_term_string}",
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@type": "Organization",
                "@id": "https://njimbong.com/#organization",
                name: "Njimbong Marketplace",
                url: "https://njimbong.com",
                logo: "https://njimbong.com/logo.svg",
                description:
                  "Njimbong is Cameroon's leading online marketplace for buying and selling electronics, fashion, vehicles, real estate, and services with Fonlok escrow payment protection and KYC-verified sellers.",
                foundingLocation: "Cameroon",
                areaServed: "CM",
                knowsAbout: [
                  "Online Marketplace",
                  "Escrow Payments",
                  "E-commerce Cameroon",
                  "Mobile Money Payments",
                ],
                sameAs: [],
              },
              {
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "Is Njimbong safe for online payments in Cameroon?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Yes. Every XAF payment on Njimbong is protected by Fonlok escrow. Your Mobile Money payment is held in a secure vault and only released to the seller after you confirm you have received your item as described. If anything goes wrong, our team mediates the dispute.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "How does Fonlok escrow work on Njimbong?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Fonlok is Cameroon's dedicated escrow payment service. When you buy on Njimbong, you pay via MTN MoMo or Orange Money into a secure escrow account. The seller ships or hands over the item. You inspect it, and if satisfied, confirm delivery — at which point the funds are released to the seller. If there is a problem, you open a dispute and our admin team resolves it.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "How do I become a verified seller on Njimbong?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "To become a verified seller, complete KYC (Know Your Customer) verification from your profile settings. You will need to submit a valid government-issued ID. Once verified, your profile displays a blue verification badge, your trust score improves, and buyers are more confident purchasing from you.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "What is the Trust Score on Njimbong?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "The Trust Score is a 0–100% rating visible on every seller profile. It is calculated from KYC verification status, transaction history, buyer reviews and ratings, dispute record, and account activity. A higher trust score builds buyer confidence and helps listings rank better in search results.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "What is Njimbong AI?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Njimbong AI is a built-in AI assistant powered by Google Gemini. It helps buyers find products, compare prices, understand platform features, and stay safe from scams. For sellers, it can auto-fill listing details from a photo, enhance descriptions, suggest fair XAF prices, and generate SEO-optimized text. It also supports visual search — upload any image to find matching products.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "What can I buy and sell on Njimbong?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Njimbong covers a wide range of categories including electronics (phones, laptops, TVs), fashion and clothing, vehicles (cars, motorbikes), home and furniture, real estate, agricultural products, food, services, and local deals. All listings are moderated and every XAF payment is escrow-protected.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Is listing on Njimbong free?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Yes. Creating an account and posting listings on Njimbong is completely free. There are no subscription fees or listing charges. You only interact with Fonlok escrow fees when conducting a secured transaction.",
                    },
                  },
                ],
              },
              {
                "@type": "Service",
                "@id": "https://njimbong.com/#escrow-service",
                name: "Fonlok Escrow Payment Protection",
                provider: { "@id": "https://njimbong.com/#organization" },
                description:
                  "Secure escrow payment service for online marketplace transactions in Cameroon via MTN MoMo and Orange Money.",
                areaServed: "CM",
                serviceType: "Escrow Payment",
              },
            ],
          }),
        }}
      />
      <HomePageContent listings={listings} />
    </div>
  );
}