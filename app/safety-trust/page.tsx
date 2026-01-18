import Card from "../components/Card";
import PageHeader from "../components/PageHeader";

export default function SafetyTrustPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
      <PageHeader
        title="Safety & Trust"
        description="Njimbong helps buyers and sellers connect with confidence through verification, moderation, and education."
      />

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        {[
          {
            title: "Verified profiles",
            text: "We encourage verified profiles to build trust across the marketplace. Look for consistent activity, complete profiles, and clear listing details.",
          },
          {
            title: "Moderation and reporting",
            text: "Our moderation team reviews reports and enforces marketplace policies. If you notice suspicious behavior, report it directly from a listing or review.",
          },
          {
            title: "Smart buying tips",
            text: "Meet in public places, verify item condition before paying, and keep communication on-platform for protection.",
          },
          {
            title: "Seller best practices",
            text: "Use accurate photos, clear pricing, and honest descriptions. Prompt responses help buyers feel confident.",
          },
        ].map((item) => (
          <Card key={item.title} className="h-full">
            <h2 className="text-lg font-semibold text-gray-900">
              {item.title}
            </h2>
            <p className="mt-2 text-sm text-gray-600">{item.text}</p>
          </Card>
        ))}
      </section>

      <Card className="mt-10">
        <h2 className="text-lg font-semibold">
          Need help or want to report an issue?
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Contact our support team and we will respond as quickly as possible.
        </p>
        <a
          className="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:underline"
          href="mailto:support@njimbong.com"
        >
          support@njimbong.com
        </a>
      </Card>
    </main>
  );
}
