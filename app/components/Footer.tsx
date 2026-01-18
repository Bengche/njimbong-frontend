export default function Footer() {
  return (
    <footer className="relative border-t border-emerald-100/70 bg-gradient-to-b from-white via-emerald-50/40 to-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="h-1 w-24 sm:w-32 rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-emerald-500 mb-8" />
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-emerald-700">Njimbong</h3>
            <p className="text-sm text-gray-600">
              Njimbong: The Trusted Marketplace to Buy and Sell Online.
            </p>
            <a
              href="/market"
              className="inline-flex text-sm font-semibold text-emerald-700 hover:underline"
            >
              Explore the marketplace
            </a>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold text-gray-800">Marketplace</p>
            <a
              className="block text-gray-600 hover:text-emerald-700"
              href="/market"
            >
              Browse listings
            </a>
            <a
              className="block text-gray-600 hover:text-emerald-700"
              href="/favorites"
            >
              Favorites
            </a>
            <a
              className="block text-gray-600 hover:text-emerald-700"
              href="/dashboard"
            >
              Sell on Njimbong
            </a>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold text-gray-800">Account</p>
            <a
              className="block text-gray-600 hover:text-emerald-700"
              href="/login"
            >
              Sign in
            </a>
            <a
              className="block text-gray-600 hover:text-emerald-700"
              href="/signup"
            >
              Create account
            </a>
            <a
              className="block text-gray-600 hover:text-emerald-700"
              href="/profile"
            >
              Profile
            </a>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold text-gray-800">Support</p>
            <a
              className="block text-gray-600 hover:text-emerald-700"
              href="mailto:support@njimbong.com"
            >
              Help Center
            </a>
            <a
              className="block text-gray-600 hover:text-emerald-700"
              href="/safety-trust"
            >
              Safety & Trust
            </a>
            <a
              className="block text-gray-600 hover:text-emerald-700"
              href="/terms-privacy"
            >
              Terms & Privacy
            </a>
            <a
              className="block text-gray-600 hover:text-emerald-700"
              href="mailto:support@njimbong.com"
            >
              support@njimbong.com
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-emerald-100/70 pt-6 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Njimbong Marketplace. All rights reserved.</span>
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Need help? Contact support@njimbong.com
          </span>
        </div>
      </div>
    </footer>
  );
}
