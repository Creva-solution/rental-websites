import BusinessSetupWizard from '@/components/wizard/BusinessSetupWizard';
import Link from 'next/link';
import { Store } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col relative overflow-hidden font-sans">
      {/* Background Decorative Patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#fff_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="h-16 flex items-center px-6 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 shrink-0 shadow-sm shadow-blue-500/5">
        <Link href="/" className="font-extrabold text-lg text-primary flex items-center gap-2 group">
          <div className="p-1.5 bg-blue-600 rounded-lg group-hover:scale-105 transition-transform shadow-md shadow-blue-500/10">
            <Store className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-blue-900 to-slate-900">
            Creva Webzz
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-4 text-xs font-black uppercase tracking-wider">
          <span className="text-slate-500">Already have an account?</span>
          <Link href="/login" className="text-blue-600 hover:text-blue-500 transition-colors">Log in</Link>
        </div>
      </header>
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 z-10">
        <div className="w-full max-w-3xl mb-8 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-200 bg-blue-55/80 text-blue-600 text-[10px] font-black uppercase tracking-wider">
            Setup Wizard
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-blue-900 to-slate-800">
            Let's set up your store
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">
            Complete this quick wizard to launch your online business in minutes.
          </p>
        </div>
        
        <BusinessSetupWizard />
      </main>
    </div>
  );
}
