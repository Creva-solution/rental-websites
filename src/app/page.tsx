'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

export default function Home() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 lg:px-14 h-20 flex items-center border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <Link className="flex items-center justify-center" href="#">
          <span className="font-bold text-2xl tracking-tighter text-primary">StoreBuilder</span>
        </Link>
        <nav className="ml-auto flex gap-2.5 sm:gap-6 items-center">
          <Link className="hidden md:inline-block text-sm font-medium hover:text-primary transition-colors" href="#features">
            Features
          </Link>
          <Link className="hidden md:inline-block text-sm font-medium hover:text-primary transition-colors" href="#templates">
            Templates
          </Link>
          <Link className="hidden md:inline-block text-sm font-medium hover:text-primary transition-colors" href="#pricing">
            Pricing
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors px-2" href="/login">
            Login
          </Link>
          <Link
            className="text-xs sm:text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 sm:h-9 px-3 sm:px-4 flex items-center rounded-md transition-colors"
            href="/register"
          >
            Start Free Trial
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 flex justify-center bg-gradient-to-b from-background to-muted/20">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="space-y-4 max-w-3xl">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-500">
                  Build Your Online Store in 10 Minutes
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground text-sm sm:text-base md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  No coding required. Launch your beautiful e-commerce website, manage products, and accept payments instantly. Perfect for artisans, boutique owners, and small businesses.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-4 sm:px-0">
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary/90 hover:scale-105 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  href="/register"
                >
                  Start Free Trial →
                </Link>
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground hover:scale-105 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  href="#templates"
                >
                  View Templates
                </Link>
              </div>
              <div className="pt-4 flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  No coding required
                </div>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  14-day free trial
                </div>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Custom domain support
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Templates Preview Section */}
        <section id="templates" className="w-full py-12 md:py-24 lg:py-32 flex justify-center bg-background">
           <div className="container px-4 md:px-6">
             <div className="flex flex-col items-center justify-center space-y-4 text-center">
               <div className="space-y-2">
                 <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter md:text-4xl">Stunning Pre-built Templates</h2>
                 <p className="max-w-[900px] text-muted-foreground text-xs sm:text-sm md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                   Choose from our professionally designed templates that look great on any device.
                 </p>
               </div>
             </div>
             <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
                {[
                  { name: 'Minimal Elegance', desc: 'Clean, modern design for premium products', path: '/templates/minimal/index.html', image: '/images/minimal.png' },
                  { name: 'Artisan Craft', desc: 'Warm, handmade aesthetic', path: '/templates/artisan/index.html', image: '/images/artisan.png' },
                  { name: 'Bold Commerce', desc: 'Vibrant, product-focused layout', path: '/templates/bold/index.html', image: '/images/bold.png' }
                ].map((template, i) => (
                  <div 
                    key={i} 
                    onClick={() => setPreviewUrl(template.path)}
                    className="group relative overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:-translate-y-1 block cursor-pointer"
                  >
                    <div className="aspect-[4/3] relative overflow-hidden">
                       <img 
                         src={template.image} 
                         alt={template.name}
                         className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                       />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <span className="text-white font-bold bg-primary px-4 py-2 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">Preview Template</span>
                       </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-semibold text-xl mb-2">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.desc}</p>
                    </div>
                  </div>
                ))}
             </div>
           </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          © 2026 StoreBuilder Inc. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4 text-muted-foreground" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4 text-muted-foreground" href="#">
            Privacy
          </Link>
        </nav>
      </footer>

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-6xl h-full max-h-[90vh] bg-background rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Template Preview</h3>
              <button 
                onClick={() => setPreviewUrl(null)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-muted/20 relative">
              <iframe 
                src={previewUrl} 
                className="w-full h-full border-none"
                title="Template Preview"
              />
            </div>
            <div className="p-4 border-t flex justify-end gap-3 bg-background">
              <button 
                onClick={() => setPreviewUrl(null)}
                className="px-6 py-2 rounded-md border border-input bg-background hover:bg-muted font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => router.push('/register')}
                className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-sm transition-colors"
              >
                Start Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
