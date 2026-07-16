export default function Footer() {
  return (
    <footer className="relative border-t border-emerald-100/70 bg-gradient-to-b from-white via-emerald-50/30 to-white">
      {/* Trust bar */}
      <div className="border-b border-emerald-100/60 bg-emerald-50/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-gray-600">
            {[
              { icon: "🔒", label: "Fonlok Escrow Payments" },
              { icon: "✅", label: "KYC-Verified Sellers" },
              { icon: "🛡️", label: "Buyer Dispute Protection" },
              { icon: "💬", label: "Secure On-Platform Chat" },
              { icon: "🚨", label: "Professional Moderation" },
            ].map((b) => (
              <span key={b.label} className="flex items-center gap-1.5 font-medium">
                <span>{b.icon}</span>
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="h-1 w-24 sm:w-32 rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-emerald-500 mb-8" />
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-3">
            <h3 className="text-base font-bold text-emerald-700">Njimbong</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Cameroon&apos;s safest online marketplace — powered by Fonlok escrow payments,
              KYC verification, and professional moderation.
            </p>
            <a
              href="/browse"
              className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline"
            >
              Explore listings
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-bold text-gray-800">Marketplace</p>
            <a className="block text-gray-600 hover:text-emerald-700 transition-colors" href="/browse">Browse listings</a>
            <a className="block text-gray-600 hover:text-emerald-700 transition-colors" href="/favorites">Favorites</a>
            <a className="block text-gray-600 hover:text-emerald-700 transition-colors" href="/dashboard">Sell on Njimbong</a>
            <a className="block text-gray-600 hover:text-emerald-700 transition-colors" href="/safety-trust">Secure Payments</a>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-bold text-gray-800">Account</p>
            <a className="block text-gray-600 hover:text-emerald-700 transition-colors" href="/login">Sign in</a>
            <a className="block text-gray-600 hover:text-emerald-700 transition-colors" href="/signup">Create account</a>
            <a className="block text-gray-600 hover:text-emerald-700 transition-colors" href="/profile">My profile</a>
            <a className="block text-gray-600 hover:text-emerald-700 transition-colors" href="/kyc">Get KYC verified</a>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-bold text-gray-800">Support & Legal</p>
            <a className="block text-gray-600 hover:text-emerald-700 transition-colors" href="mailto:support@njimbong.com">Help Center</a>
            <a className="block text-gray-600 hover:text-emerald-700 transition-colors" href="/safety-trust">Safety &amp; Trust</a>
            <a className="block text-gray-600 hover:text-emerald-700 transition-colors" href="/safety-trust#fonlok-heading">How Escrow Works</a>
            <a className="block text-gray-600 hover:text-emerald-700 transition-colors" href="/terms-privacy">Terms &amp; Privacy</a>
          </div>
        </div>

        {/* Fonlok note */}
        <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-emerald-800">Payments powered by Fonlok Escrow</p>
            <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
              Every XAF transaction on Njimbong is protected by Fonlok escrow. Your money is held
              securely and only released to the seller after you confirm receipt of your item.
            </p>
          </div>
          <a href="/safety-trust" className="text-xs font-semibold text-emerald-700 hover:underline flex-shrink-0">
            Learn more →
          </a>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-emerald-100/70 pt-6 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2025–2026 Njimbong Marketplace. All rights reserved.</span>
          <span>
            Built with ❣ by <a href="https://brancodex.com/" className="hover:text-emerald-700 transition-colors">BranCodeX</a>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            support@njimbong.com
          </span>
        </div>
      </div>
    </footer>
  );
}
