import BusinessSetupWizard from '@/components/wizard/BusinessSetupWizard';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col relative overflow-hidden font-sans">
      {/* Background Decorative Patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#fff_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="h-16 flex items-center px-6 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 shrink-0 shadow-sm shadow-blue-500/5">
        <Link href="/" className="flex items-center group">
          <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-900 group-hover:bg-slate-800 transition-colors">
            <img src="/logo-creva.svg" alt="Creva Webzz" className="h-7 w-auto object-contain" />
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-4 text-xs font-black uppercase tracking-wider">
          <span className="text-slate-500">Already have an account?</span>
          <Link href="/login" className="text-blue-600 hover:text-blue-500 transition-colors">Log in</Link>
        </div>
      </header>
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 z-10 w-full">
        <div className="w-full max-w-5xl mb-8 text-center space-y-2">
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
