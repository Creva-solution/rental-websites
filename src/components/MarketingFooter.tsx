'use client';

import Link from 'next/link';

export default function MarketingFooter() {
  return (
    <footer className="bg-white border-t border-slate-100 py-16 w-full shrink-0 px-6 lg:px-14 z-10 relative">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-12 gap-8 text-left mb-12">
        {/* Column 1: Brand Info */}
        <div className="col-span-2 md:col-span-4 space-y-4">
          <Link className="flex items-center" href="/">
            <img src="/logo-creva.svg" alt="CrevaWebs" className="h-9 w-auto object-contain" />
          </Link>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            Build, manage, and grow your online store with one simple platform.
          </p>
        </div>

        {/* Column 2: Product */}
        <div className="col-span-1 md:col-span-2 space-y-3">
          <h5 className="text-[10px] font-bold uppercase text-slate-405 tracking-wider">Product</h5>
          <ul className="space-y-2">
            <li>
              <Link className="text-xs text-slate-600 hover:text-blue-600 transition-colors" href="/#features">
                Features
              </Link>
            </li>
            <li>
              <Link className="text-xs text-slate-600 hover:text-blue-600 transition-colors" href="/#templates">
                Templates
              </Link>
            </li>
            <li>
              <Link className="text-xs text-slate-600 hover:text-blue-600 transition-colors" href="/#pricing">
                Pricing
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Company */}
        <div className="col-span-1 md:col-span-2 space-y-3">
          <h5 className="text-[10px] font-bold uppercase text-slate-405 tracking-wider">Company</h5>
          <ul className="space-y-2">
            <li>
              <Link className="text-xs text-slate-600 hover:text-blue-600 transition-colors" href="#">
                About
              </Link>
            </li>
            <li>
              <Link className="text-xs text-slate-600 hover:text-blue-600 transition-colors" href="#">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Support */}
        <div className="col-span-1 md:col-span-2 space-y-3">
          <h5 className="text-[10px] font-bold uppercase text-slate-405 tracking-wider">Support</h5>
          <ul className="space-y-2">
            <li>
              <Link className="text-xs text-slate-600 hover:text-blue-600 transition-colors" href="#">
                Help Center
              </Link>
            </li>
            <li>
              <Link className="text-xs text-slate-600 hover:text-blue-600 transition-colors" href="/#faq">
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 5: Legal */}
        <div className="col-span-1 md:col-span-2 space-y-3">
          <h5 className="text-[10px] font-bold uppercase text-slate-405 tracking-wider">Legal</h5>
          <ul className="space-y-2">
            <li>
              <Link className="text-xs text-slate-600 hover:text-blue-600 transition-colors" href="#">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link className="text-xs text-slate-600 hover:text-blue-600 transition-colors" href="#">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-450">
        <p>© 2026 CrevaWebs. All rights reserved.</p>
        <span className="text-[10px] font-bold text-slate-400">Creva Solution</span>
      </div>
    </footer>
  );
}
