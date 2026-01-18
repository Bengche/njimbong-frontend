import Card from "../components/Card";
import PageHeader from "../components/PageHeader";

export default function TermsPrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
      <PageHeader
        title="Terms & Privacy"
        description="Learn how Njimbong protects users, manages content, and handles data in the marketplace."
      />

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        {[
          {
            title: "Acceptable use",
            text: "Listings must be lawful, accurate, and respectful. Prohibited items or deceptive practices may result in removal or account suspension.",
          },
          {
            title: "Content and moderation",
            text: "We review reports to maintain marketplace safety. Njimbong may remove listings or reviews that violate our policies.",
          },
          {
            title: "Privacy and data protection",
            text: "We collect only the data needed to provide marketplace services, secure accounts, and improve the experience. We never sell personal data.",
          },
          {
            title: "Security",
            text: "We use encryption, access controls, and monitoring to protect user data. Keep your login details private and report suspicious activity.",
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
        <h2 className="text-lg font-semibold">Contact support</h2>
        <p className="mt-2 text-sm text-gray-600">
          Questions about your account or data? Email us and we will help.
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
