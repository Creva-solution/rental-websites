'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store, Menu, X } from 'lucide-react';

export default function MarketingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { name: 'Features', href: '/features' },
    { name: 'Templates', href: '/templates' },
    { name: 'Pricing', href: '/pricing' }
  ];

  return (
    <header className="px-6 lg:px-14 h-20 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm shadow-blue-500/5 w-full">
      <Link className="flex items-center gap-2 group" href="/">
        <div className="p-2 bg-blue-600 rounded-xl group-hover:scale-105 transition-transform shadow-lg shadow-blue-500/20">
          <Store className="w-5 h-5 text-white" />
        </div>
        <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-blue-900 to-slate-900">
          Creva Webzz
        </span>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex gap-8 items-center">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-xs uppercase tracking-widest font-bold transition-colors ${
              pathname === link.href 
                ? 'text-blue-600 font-extrabold' 
                : 'text-slate-550 hover:text-blue-600'
            }`}
          >
            {link.name}
          </Link>
        ))}
      </nav>

      <div className="hidden md:flex items-center gap-4">
        <Link 
          className="text-xs uppercase tracking-widest font-black text-slate-550 hover:text-blue-600 transition-colors px-2" 
          href="/login"
        >
          Login
        </Link>
        <Link
          className="text-xs font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 h-10 px-5 flex items-center rounded-xl transition-all hover:scale-102"
          href="/register"
        >
          Start Free Trial
        </Link>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden p-2 text-slate-600 hover:text-blue-600 transition-colors"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-20 left-0 w-full bg-white border-b border-slate-100 shadow-xl p-6 flex flex-col gap-4 animate-in slide-in-from-top duration-200 md:hidden z-40">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`text-sm font-bold uppercase tracking-wider py-1 ${
                pathname === link.href ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <hr className="border-slate-100" />
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-bold uppercase tracking-wider text-slate-600 hover:text-blue-600 py-1"
          >
            Login
          </Link>
          <Link
            href="/register"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white text-center py-2.5 rounded-xl shadow-md transition-colors"
          >
            Start Free Trial
          </Link>
        </div>
      )}
    </header>
  );
}
