'use client';

import { PauseCircle } from 'lucide-react';

interface StorePausedProps {
  storeName: string;
}

export default function StorePaused({ storeName }: StorePausedProps) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.08),transparent_50%)] pointer-events-none" />

      <div className="relative max-w-md w-full bg-gray-900/50 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 sm:p-10 shadow-2xl flex flex-col items-center">
        {/* Glowing pulsing pause icon */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
          <div className="relative p-4 bg-red-500/10 rounded-full border border-red-500/30 text-red-400">
            <PauseCircle className="w-12 h-12" />
          </div>
        </div>

        {/* Store Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
          {storeName}
        </h1>
        
        {/* Status Badge */}
        <span className="mt-3 px-3 py-1 bg-red-500/10 border border-red-500/25 rounded-full text-xs font-bold text-red-400 uppercase tracking-widest animate-pulse">
          Temporarily Paused
        </span>

        {/* Friendly explanation */}
        <p className="mt-6 text-gray-400 text-sm leading-relaxed">
          The owner of this store has temporarily suspended this storefront. We are sorry for the inconvenience, please check back again in a bit!
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
            className="text-xs text-red-400/80 hover:text-red-400 font-medium transition-colors"
          >
            Create your own online store
          </a>
        </div>
      </div>
    </div>
  );
}
