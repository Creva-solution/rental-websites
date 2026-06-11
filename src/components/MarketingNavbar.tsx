'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function MarketingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/features' },
    { name: 'Templates', href: '/templates' },
    { name: 'Pricing', href: '/pricing' }
  ];

  return (
    <header className="px-6 lg:px-14 h-20 flex items-center justify-between border-b border-blue-100/50 bg-blue-600/[0.08] backdrop-blur-md fixed top-0 left-0 right-0 z-50 shadow-sm shadow-blue-500/5 w-full">
      <Link className="flex items-center group" href="/">
        <span className="inline-flex items-center">
          <img src="/logo-creva.svg" alt="Creva Webzz" className="h-8 w-auto object-contain" />
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
