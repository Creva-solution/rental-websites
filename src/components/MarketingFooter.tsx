'use client';

import Link from 'next/link';

export default function MarketingFooter() {
  return (
    <footer className="flex flex-col gap-4 sm:flex-row py-8 w-full shrink-0 items-center px-6 lg:px-14 border-t border-slate-100 bg-white z-10 relative mt-auto">
      <p className="text-xs text-slate-500">
        © 2026 Creva Webzz Inc. All rights reserved.
      </p>
      <nav className="sm:ml-auto flex gap-6">
        <Link className="text-xs text-slate-400 hover:text-blue-600 transition-colors" href="#">
          Terms of Service
        </Link>
        <Link className="text-xs text-slate-400 hover:text-blue-600 transition-colors" href="#">
          Privacy Policy
        </Link>
      </nav>
    </footer>
  );
}
