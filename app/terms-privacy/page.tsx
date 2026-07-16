import type { Metadata } from "next";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";

export const metadata: Metadata = {
  title: "Terms & Privacy — Njimbong Marketplace",
  description:
    "Njimbong's terms of use, privacy policy, and data protection practices. Learn how we protect your data and manage marketplace content.",
};

export default function TermsPrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10 lg:py-14">
      <PageHeader
        title="Terms & Privacy"
        description="How Njimbong protects users, manages content, handles payments, and keeps your data safe."
      />

      <section className="mt-8 grid gap-5 sm:grid-cols-2">
        {[
          {
            title: "Acceptable Use",
            text: "Listings must be lawful, accurate, and respectful. Prohibited items, deceptive practices, or misleading descriptions may result in listing removal or permanent account suspension.",
          },
          {
            title: "Content & Moderation",
            text: "We review every report and enforce marketplace policies. Njimbong may remove listings, reviews, or accounts that violate our standards. Moderation decisions may be appealed through the in-app appeals process.",
          },
          {
            title: "Privacy & Data Protection",
            text: "We collect only the data necessary to provide marketplace services, secure accounts, and improve your experience. We never sell personal data to third parties. You may request deletion of your account and data at any time.",
          },
          {
            title: "Account Security",
            text: "We use encryption, access controls, and continuous monitoring to protect user data. Keep your login credentials private. Enable email verification and report any suspicious activity to support@njimbong.com immediately.",
          },
          {
            title: "Escrow Payments — Fonlok",
            text: "XAF payments processed through Fonlok escrow are governed by Fonlok's payment terms in addition to Njimbong's policies. Funds are held in escrow until the buyer confirms delivery or a dispute is resolved. Njimbong is not liable for payment failures resulting from incorrect phone numbers or MoMo provider outages.",
          },
          {
            title: "Disputes & Refunds",
            text: "Buyers may open a dispute within the escrow window if an item is not as described or does not arrive. Our moderation team reviews evidence from both parties and mediates a fair outcome. Njimbong's decision on disputes is final within the platform.",
          },
          {
            title: "Intellectual Property",
            text: "You retain ownership of photos and content you post. By listing on Njimbong, you grant us a licence to display your content on the platform. Do not post content you do not own or have permission to use.",
          },
          {
            title: "Changes to These Terms",
            text: "We may update these terms as the platform evolves. Continued use of Njimbong after an update constitutes acceptance of the revised terms. We will notify users of significant changes via email and in-app notifications.",
          },
        ].map((item) => (
          <Card key={item.title} className="h-full">
            <h2 className="text-sm font-bold text-gray-900">{item.title}</h2>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">{item.text}</p>
          </Card>
        ))}
      </section>

      <Card className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-900">Questions about your account or data?</h2>
            <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
              Email our support team and we will respond as quickly as possible.
              For urgent security concerns, include &quot;SECURITY&quot; in your subject line.
            </p>
          </div>
          <a
            href="mailto:support@njimbong.com"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-5 py-2.5 text-sm font-semibold hover:bg-emerald-700 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            Contact support
          </a>
        </div>
      </Card>
    </main>
  );
}
