'use client';

import { ShieldAlert, Calendar } from 'lucide-react';

interface StoreExpiredProps {
  storeName: string;
  planExpiresAt: string;
}

export default function StoreExpired({ storeName, planExpiresAt }: StoreExpiredProps) {
  const expiryDate = new Date(planExpiresAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.06),transparent_50%)] pointer-events-none" />

      <div className="relative max-w-md w-full bg-gray-900/50 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-8 sm:p-10 shadow-2xl flex flex-col items-center">
        {/* Glowing pulsing amber icon */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
          <div className="relative p-4 bg-amber-500/10 rounded-full border border-amber-500/30 text-amber-400">
            <ShieldAlert className="w-12 h-12" />
          </div>
        </div>

        {/* Store Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
          {storeName}
        </h1>
        
        {/* Expiry Status Badge */}
        <span className="mt-3 px-3 py-1 bg-amber-500/10 border border-amber-500/25 rounded-full text-xs font-bold text-amber-400 uppercase tracking-widest">
          Store Subscription Expired
        </span>

        {/* Expiry details */}
        <div className="mt-6 flex items-center gap-2 text-gray-300 bg-gray-800/50 border border-gray-800 px-4 py-2.5 rounded-xl text-xs font-mono">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>Validity Expired on: {expiryDate}</span>
        </div>

        {/* Explanation */}
        <p className="mt-5 text-gray-400 text-sm leading-relaxed">
          The subscription plan for this storefront has ended. If you are the owner, please complete a recharge plan to reactivate the website.
        </p>

        {/* Bottom border / Powered logo */}
        <div className="w-full border-t border-gray-800/80 my-8" />

        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">
            Powered by StoreBuilder
          </p>
          <a 
            href="https://crevasolution.in" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-amber-400/80 hover:text-amber-400 font-medium transition-colors"
          >
            Recharge or extend validity
          </a>
        </div>
      </div>
    </div>
  );
}
