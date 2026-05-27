'use client';

import { PauseCircle, AlertTriangle, Clock } from 'lucide-react';

interface StorePausedProps {
  storeName: string;
  isExpired?: boolean;
  paymentStatus?: 'pending' | 'rejected' | 'verified' | null;
}

export default function StorePaused({ storeName, isExpired = false, paymentStatus = null }: StorePausedProps) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.08),transparent_50%)] pointer-events-none" />

      <div className="relative max-w-md w-full bg-gray-900/50 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 sm:p-10 shadow-2xl flex flex-col items-center">
        {/* Glowing pulsing pause icon */}
        <div className="relative mb-6">
          <div className={`absolute inset-0 rounded-full blur-xl animate-pulse ${
            paymentStatus === 'rejected' ? 'bg-amber-500/20' : paymentStatus === 'pending' ? 'bg-blue-500/20' : 'bg-red-500/20'
          }`} />
          <div className={`relative p-4 rounded-full border ${
            paymentStatus === 'rejected' 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
              : paymentStatus === 'pending' 
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {paymentStatus === 'rejected' ? (
              <AlertTriangle className="w-12 h-12" />
            ) : paymentStatus === 'pending' ? (
              <Clock className="w-12 h-12" />
            ) : (
              <PauseCircle className="w-12 h-12" />
            )}
          </div>
        </div>

        {/* Store Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
          {storeName}
        </h1>
        
        {/* Status Badge */}
        <span className={`mt-3 px-3 py-1 border rounded-full text-xs font-bold uppercase tracking-widest animate-pulse ${
          paymentStatus === 'rejected'
            ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
            : paymentStatus === 'pending'
              ? 'bg-blue-500/10 border-blue-500/25 text-blue-400'
              : 'bg-red-500/10 border-red-500/25 text-red-400'
        }`}>
          {isExpired 
            ? 'Subscription Expired' 
            : paymentStatus === 'rejected' 
              ? 'Verification Rejected' 
              : paymentStatus === 'pending' 
                ? 'Verification Pending' 
                : 'Temporarily Paused'}
        </span>

        {/* Friendly explanation */}
        <p className="mt-6 text-gray-405 text-sm leading-relaxed">
          {isExpired 
            ? "This store's subscription plan has expired. If you are the store owner, please log in and renew your subscription plan to reactivate your storefront."
            : paymentStatus === 'rejected'
              ? "Your onboarding setup payment was rejected by our verification compliance team because the screenshot was invalid or empty. Please log in to your admin dashboard and re-upload your receipt to reactivate your store!"
              : paymentStatus === 'pending'
                ? "This storefront is currently undergoing onboarding verification review. Our team is verifying your payment screenshot and your storefront will automatically go live as soon as it is approved!"
                : "The owner of this store has temporarily suspended this storefront. We are sorry for the inconvenience, please check back again in a bit!"}
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
