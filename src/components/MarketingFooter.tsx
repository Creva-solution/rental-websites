'use client';

import Link from 'next/link';

export default function MarketingFooter() {
  return (
    <footer className="bg-white border-t border-slate-100 py-16 w-full shrink-0 px-6 lg:px-14 z-10 relative">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 text-left mb-12">
        {/* Left Side Brand Info */}
        <div className="md:col-span-5 space-y-4">
          <Link className="flex items-center" href="/">
            <img src="/logo-creva.svg" alt="Creva Webzz" className="h-10 w-auto object-contain" />
          </Link>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            Everything you need to build, customize, and manage your premium online store. No coding required, zero commission transaction cuts.
          </p>
        </div>

        {/* Column 1: Product */}
        <div className="md:col-span-2 space-y-3">
          <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Product</h5>
          <ul className="space-y-2">
            <li>
              <Link className="text-xs text-slate-600 hover:text-blue-600 transition-colors" href="/features">
                Features
              </Link>
            </li>
            <li>
              <Link className="text-xs text-slate-600 hover:text-blue-600 transition-colors" href="/templates">
                Templates
              </Link>
            </li>
            <li>
              <Link className="text-xs text-slate-600 hover:text-blue-600 transition-colors" href="/pricing">
                Pricing
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 2: Company */}
        <div className="md:col-span-2 space-y-3">
          <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Company</h5>
          <ul className="space-y-2">
            <li>
              <Link className="text-xs text-slate-600 hover:text-blue-600 transition-colors" href="#">
                About Us
              </Link>
            </li>
            <li>
              <Link className="text-xs text-slate-600 hover:text-blue-600 transition-colors" href="#">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Support */}
        <div className="md:col-span-3 space-y-3">
          <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Support</h5>
          <ul className="space-y-2">
            <li>
              <Link className="text-xs text-slate-600 hover:text-blue-600 transition-colors" href="#">
                Help Center
              </Link>
            </li>
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
        <p>© 2026 RWeb. All rights reserved.</p>
        <div className="flex gap-6">
          <span className="text-[10px] font-bold text-slate-400">Creva Solution</span>
        </div>
      </div>
    </footer>
  );
}
