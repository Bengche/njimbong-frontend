import Card from "../components/Card";
import PageHeader from "../components/PageHeader";

export default function MarketPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
      <PageHeader
        title="Marketplace"
        description="Browse trusted listings and discover deals curated for your location and preferences."
      />
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900">
            Listings are loading here
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            This page will show curated listings, filters, and category
            highlights in the consistent Njimbong app layout.
          </p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-gray-900">Quick tips</h2>
          <p className="mt-2 text-sm text-gray-600">
            Use filters to narrow by category, price, and location. Save your
            favorite listings for quick access.
          </p>
        </Card>
      </div>
    </main>
  );
}
