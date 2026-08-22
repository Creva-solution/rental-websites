import BusinessSetupWizard from '@/components/wizard/BusinessSetupWizard';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-800 flex flex-col relative overflow-hidden font-sans">
      {/* Subtle ambient light glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Top Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-slate-100 bg-white sticky top-0 z-50 shrink-0 select-none">
        <Link href="/" className="flex items-center group">
          <img src="/logo-creva.svg" alt="CrevaWebs" className="h-6 w-auto object-contain" />
        </Link>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-400 font-medium">Need Help?</span>
          <span className="font-extrabold text-blue-600">Chat with Webz AI</span>
          <span className="text-slate-300">|</span>
          <Link href="/login" className="text-slate-650 hover:text-slate-900 font-semibold transition-colors">Log in</Link>
        </div>
      </header>
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-start py-12 px-4 md:px-8 z-10 w-full max-w-5xl mx-auto">
        <div className="w-full text-center space-y-2 mb-8">
          <span className="text-[10px] font-black text-blue-600 bg-blue-50/70 border border-blue-150 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Onboarding
          </span>
          <h1 className="text-2xl sm:text-3.5xl font-black text-slate-950 tracking-tight">
            Let's set up your store
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">
            This information will help us personalize your online store experience.
          </p>
        </div>
        
        <div className="w-full bg-white border border-slate-100 rounded-3xl p-6 md:p-10 shadow-[0_15px_35px_rgba(15,23,42,0.02)]">
          <BusinessSetupWizard />
        </div>
      </main>
    </div>
  );
}
