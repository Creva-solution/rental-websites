'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function MarketingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/features' },
    { name: 'Templates', href: '/templates' },
    { name: 'Pricing', href: '/pricing' }
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 border-b ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-md border-slate-200/80 shadow-[0_2px_20px_rgba(0,0,0,0.02)] h-16' 
        : 'bg-white border-slate-100 h-20'
    } px-6 lg:px-14 flex items-center justify-between`}>
      <Link className="flex items-center" href="/">
        <span className="inline-flex items-center">
          <img src="/logo-creva.svg" alt="Creva Webzz" className="h-10 w-auto object-contain" />
        </span>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex gap-8 items-center">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm font-semibold transition-colors duration-150 ${
              pathname === link.href 
                ? 'text-blue-600' 
                : 'text-slate-600 hover:text-blue-600'
            }`}
          >
            {link.name}
          </Link>
        ))}
      </nav>

      <div className="hidden md:flex items-center gap-6">
        <Link 
          className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors" 
          href="/login"
        >
          Login
        </Link>
        <Link
          className="text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-650 text-white shadow-md shadow-blue-500/10 h-10 px-5 flex items-center rounded-xl hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
          href="/register"
        >
          Start Free Trial
        </Link>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden h-10 w-10 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all duration-200"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-[100%] left-0 right-0 bg-white border-b border-slate-200 shadow-xl p-6 flex flex-col gap-4 animate-in slide-in-from-top duration-200 md:hidden z-45">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`text-sm font-semibold py-1 ${
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
            className="text-sm font-semibold text-slate-600 hover:text-blue-600 py-1"
          >
            Login
          </Link>
          <Link
            href="/register"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-650 text-white text-center py-2.5 rounded-xl shadow-md transition-colors"
          >
            Start Free Trial
          </Link>
        </div>
      )}
    </header>
  );
}
