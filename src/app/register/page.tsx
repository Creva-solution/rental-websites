import BusinessSetupWizard from '@/components/wizard/BusinessSetupWizard';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <header className="h-16 flex items-center px-6 border-b bg-background">
        <Link href="/" className="font-bold text-xl text-primary">CREVA WEbzz</Link>
        <div className="ml-auto flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">Already have an account?</span>
          <Link href="/login" className="font-medium hover:text-primary transition-colors">Log in</Link>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-3xl mb-8 text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Let's set up your store</h1>
          <p className="text-muted-foreground">Complete this quick wizard to launch your online business.</p>
        </div>
        
        <BusinessSetupWizard />
      </main>
    </div>
  );
}
