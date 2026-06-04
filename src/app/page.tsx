'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  X, ArrowRight, Store, Layout, CreditCard, 
  ShoppingBag, MessageSquare, ShieldCheck, Zap, Globe, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const router = useRouter();

  const features = [
    {
      icon: Layout,
      title: "Stunning Layout Templates",
      desc: "Select from five hand-crafted visual systems to instantly change the structure, colors, and layout of your customer storefront."
    },
    {
      icon: CreditCard,
      title: "Seamless UPI & Card Payments",
      desc: "Connect UPI QR codes, direct wire transfers, or integrate card processing gateways in seconds to receive payments directly."
    },
    {
      icon: ShoppingBag,
      title: "Fulfillment & Blue Invoices",
      desc: "Track orders dynamically and generate beautiful blue-themed PDF invoices with automatically calculated amounts in words."
    },
    {
      icon: MessageSquare,
      title: "WhatsApp Alerts & Live Chat",
      desc: "Send pre-filled status updates directly to customers' WhatsApp and engage storefront users with a dynamic floating chat widget."
    }
  ];

  const templates = [
    { id: 'minimal', name: 'Minimal Elegance', desc: 'Clean, modern black & white design for premium boutique brands', path: '/templates/preview?template=minimal', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800' },
    { id: 'artisan', name: 'Artisan Craft', desc: 'Warm, hand-crafted organic classic serif aesthetic for natural goods', path: '/templates/preview?template=artisan', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800' },
    { id: 'bold', name: 'Bold Commerce', desc: 'Vibrant, high-contrast flat grid layout design that demands attention', path: '/templates/preview?template=bold', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800' },
    { id: 'luxe', name: 'Dark Luxe', desc: 'Exclusive gold details on a pitch black premium luxury storefront', path: '/templates/preview?template=luxe', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800' },
    { id: 'retro', name: 'Retro Grid', desc: 'Space-grotesk flat shadow neon creative layout with pop art details', path: '/templates/preview?template=retro', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800' }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-800 overflow-x-hidden antialiased font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#fff_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[600px] right-0 w-[400px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="px-6 lg:px-14 h-20 flex items-center border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm shadow-blue-500/5">
        <Link className="flex items-center gap-2 group" href="#">
          <div className="p-2 bg-blue-600 rounded-xl group-hover:scale-105 transition-transform shadow-lg shadow-blue-500/20">
            <Store className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-blue-900 to-slate-900">
            Creva Webzz
          </span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-8 items-center">
          <Link className="hidden md:inline-block text-xs uppercase tracking-widest font-black text-slate-550 hover:text-blue-600 transition-colors" href="#features">
            Features
          </Link>
          <Link className="hidden md:inline-block text-xs uppercase tracking-widest font-black text-slate-550 hover:text-blue-600 transition-colors" href="#templates">
            Templates
          </Link>
          <Link className="text-xs uppercase tracking-widest font-black text-slate-550 hover:text-blue-600 transition-colors px-2" href="/login">
            Login
          </Link>
          <Link
            className="text-xs font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 h-10 px-5 flex items-center rounded-xl transition-all hover:scale-102"
            href="/register"
          >
            Start Free Trial
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 relative z-10">
        <section className="w-full py-16 md:py-28 lg:py-36 flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-8 text-center">
              {/* Dynamic Tag */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50/80 text-blue-600 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Next-Gen Store Builder</span>
              </div>

              <div className="space-y-4 max-w-4xl">
                <h1 className="text-4xl font-black tracking-tight sm:text-6xl md:text-7xl/none bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-blue-900 to-slate-900">
                  Build Your Online Store <br className="hidden sm:inline" /> in 10 Minutes
                </h1>
                <p className="mx-auto max-w-[750px] text-slate-600 text-sm sm:text-base md:text-lg leading-relaxed">
                  No coding required. Launch your beautiful e-commerce storefront website, manage products, accept payments instantly, and coordinate with clients directly via WhatsApp integration.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 sm:px-0">
                <Link
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-8 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/25 hover:bg-blue-500 hover:scale-105 transition-all"
                  href="/register"
                >
                  Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
                <Link
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-8 text-sm font-black uppercase tracking-widest text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 hover:border-slate-350 hover:scale-105 transition-all"
                  href="#templates"
                >
                  View Templates
                </Link>
              </div>

              <div className="pt-8 flex flex-wrap justify-center gap-6 sm:gap-10 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  No Coding Required
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Instant Activation
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  Custom Domain Support
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-16 md:py-24 border-t border-slate-100 bg-white/60 relative">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="text-center space-y-3 mb-16">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900">
                Everything You Need To Sell Online
              </h2>
              <p className="text-slate-500 text-sm max-w-xl mx-auto">
                Power your boutique, store, or artisanal brand with an elegant SaaS storefront platform.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((f, i) => (
                <div 
                  key={i} 
                  className="p-6 bg-white border border-blue-50/60 rounded-2xl flex flex-col items-start gap-4 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all group hover:scale-102"
                >
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-800">{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed text-left">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Templates Preview Section */}
        <section id="templates" className="w-full py-16 md:py-24 border-t border-slate-100 bg-white">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900">
                  Stunning Hand-Crafted Visual Templates
                </h2>
                <p className="max-w-[700px] text-slate-500 text-xs sm:text-sm">
                  Select a template that represents your brand aesthetic. Click any card to preview the full layout live.
                </p>
              </div>
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 items-stretch">
              {templates.map((template) => (
                <div 
                  key={template.id} 
                  onClick={() => {
                    setPreviewUrl(template.path);
                    setSelectedTemplateId(template.id);
                  }}
                  className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-white text-slate-800 shadow-sm transition-all hover:border-blue-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/5 flex flex-col justify-between cursor-pointer"
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-blue-50">
                    <img 
                      src={template.image} 
                      alt={template.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-black uppercase tracking-widest bg-blue-600 px-4 py-2.5 rounded-xl shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                        Preview Layout
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-black text-blue-600 tracking-wider uppercase mb-1.5 block">Template {template.id === 'minimal' ? '1' : template.id === 'artisan' ? '2' : template.id === 'bold' ? '3' : template.id === 'luxe' ? '4' : '5'}</span>
                      <h3 className="font-bold text-sm mb-2 text-slate-850">{template.name}</h3>
                      <p className="text-[11px] text-slate-500 leading-normal text-left">{template.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-4 sm:flex-row py-8 w-full shrink-0 items-center px-6 lg:px-14 border-t border-slate-100 bg-white z-10 relative">
        <p className="text-xs text-slate-500">
          © 2026 Creva Webzz Inc. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-6">
          <Link className="text-xs text-slate-400 hover:text-blue-600 transition-colors" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs text-slate-400 hover:text-blue-600 transition-colors" href="#">
            Privacy Policy
          </Link>
        </nav>
      </footer>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewUrl && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-900/30 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-6xl h-full max-h-[85vh] bg-white border border-blue-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white/80 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <span className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="text-xs text-slate-500 font-bold ml-2 font-mono">Store Preview</span>
                </div>
                <button 
                  onClick={() => {
                    setPreviewUrl(null);
                    setSelectedTemplateId(null);
                  }}
                  className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 bg-white relative">
                <iframe 
                  src={previewUrl} 
                  className="w-full h-full border-none bg-white"
                  title="Template Preview"
                />
              </div>
              <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white shrink-0">
                <button 
                  onClick={() => {
                    setPreviewUrl(null);
                    setSelectedTemplateId(null);
                  }}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-650 hover:bg-slate-100 hover:text-slate-850 font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => router.push(`/register?template=${selectedTemplateId || '1'}`)}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all hover:scale-102"
                >
                  Use This Template
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
