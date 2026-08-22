'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X, ArrowRight, Layout, CreditCard, ShoppingBag, MessageSquare, 
  ShieldCheck, Zap, Globe, Sparkles, HelpCircle, Bot, Smartphone, 
  CheckCircle2, Clipboard, AlertTriangle, Gem, UserCheck, Star, Check, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MarketingNavbar from '@/components/MarketingNavbar';
import MarketingFooter from '@/components/MarketingFooter';

type DynamicTemplate = { id: string; name: string; category: string; thumb: string; previewPath: string };

export default function Home() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [dynamicTemplates, setDynamicTemplates] = useState<DynamicTemplate[]>([]);
  const [heroStoreName, setHeroStoreName] = useState('');
  const [finalStoreName, setFinalStoreName] = useState('');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/templates').then(r => r.json()).then(setDynamicTemplates).catch(() => {});
  }, []);

  const fallbackTemplates: DynamicTemplate[] = [
    { id: 'minimal', name: 'Minimal Elegance', category: 'Fashion & Boutique', thumb: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800', previewPath: '/templates/preview?template=minimal' },
    { id: 'artisan', name: 'Artisan Craft', category: 'Natural Goods', thumb: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800', previewPath: '/templates/preview?template=artisan' },
    { id: 'bold', name: 'Bold Commerce', category: 'Electronics & Retail', thumb: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800', previewPath: '/templates/preview?template=bold' },
    { id: 'luxe', name: 'Dark Luxe', category: 'Luxury & Jewelry', thumb: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800', previewPath: '/templates/preview?template=luxe' },
    { id: 'retro', name: 'Retro Grid', category: 'Creative & Beauty', thumb: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800', previewPath: '/templates/preview?template=retro' },
  ];

  const templates = dynamicTemplates.length > 0 ? dynamicTemplates : fallbackTemplates;

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroStoreName.trim()) {
      router.push(`/register?subdomain=${encodeURIComponent(heroStoreName.trim().toLowerCase())}`);
    } else {
      router.push('/register');
    }
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (finalStoreName.trim()) {
      router.push(`/register?subdomain=${encodeURIComponent(finalStoreName.trim().toLowerCase())}`);
    } else {
      router.push('/register');
    }
  };

  const faqs = [
    {
      q: "What is CrevaWebs?",
      a: "CrevaWebs is a premium, no-code online store builder designed to help local retail brands, boutiques, and merchants build their custom storefronts, list inventory, accept UPI payments directly, and run order management pipelines without writing code."
    },
    {
      q: "Do I need coding knowledge?",
      a: "No. You do not need any coding or web development skills. All sections, colors, banners, and settings are managed through a clean visual merchant dashboard."
    },
    {
      q: "How long does it take to create a store?",
      a: "You can go live in less than 10 minutes. Enter your business details, choose a template style, sign your license agreement on-screen, upload your payment verification screenshot, and launch."
    },
    {
      q: "Can I customize my store?",
      a: "Yes. You can instantly select from five hand-crafted storefront layouts, adjust brand theme colors, edit navigation tabs, and upload your custom logo."
    },
    {
      q: "Can I use my own custom domain?",
      a: "Yes! On our Professional and Lifetime packages, you can connect your custom commercial domain (e.g. www.yourbrand.com) directly to your CrevaWebs storefront."
    },
    {
      q: "Are there transaction fees?",
      a: "No. We process payments directly through offline UPI intents and QR scans. All customer transactions go directly to your merchant account with 0% commission cuts."
    }
  ];

  const comparisonRows = [
    { name: "No coding required", creva: true, trad: false, complex: false },
    { name: "Quick 10-min setup", creva: true, trad: false, complex: false },
    { name: "Zero transaction cuts (0% fee)", creva: true, trad: true, complex: false },
    { name: "Direct WhatsApp notifications", creva: true, trad: false, complex: true },
    { name: "AI Store Assistant support", creva: true, trad: false, complex: false },
    { name: "Onboard PDF invoicing in words", creva: true, trad: false, complex: false },
    { name: "Affordable flat yearly pricing", creva: true, trad: false, complex: false }
  ];

  const pricingPlans = [
    { id: '30', name: 'Starter Plan', price: '499', days: 30, desc: 'For businesses getting started online.', badge: '' },
    { id: '365', name: 'Growth Pack', price: '3,999', days: 365, desc: 'For growing online businesses seeking custom domains.', badge: 'Most Popular' },
    { id: 'lifetime', name: 'Business Lifetime', price: '9,999', days: 99999, desc: 'For businesses that need permanent flexibility.', badge: 'Best Value' }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-800 overflow-x-hidden antialiased font-sans pt-20 relative">
      <MarketingNavbar />

      <main className="flex-1 relative z-10">
        
        {/* 1. HERO SECTION */}
        <section className="w-full py-16 lg:py-24 bg-white flex justify-center border-b border-slate-100">
          <div className="container px-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column: Conversion Copy & Store Input */}
              <div className="lg:col-span-6 space-y-8 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold w-fit">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>No-code online store builder</span>
                </div>
                
                <div className="space-y-4">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                    Your business deserves its own online store.
                  </h1>
                  <p className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-xl">
                    Create a professional online store with CrevaWebs. Customize your storefront, add products, manage customer orders, and collect UPI payments — all without writing code.
                  </p>
                </div>

                {/* Interactive Store URL Input */}
                <form onSubmit={handleHeroSubmit} className="space-y-3 max-w-lg">
                  <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 flex-1 focus-within:border-blue-500 transition-colors">
                      <span className="text-xs font-bold text-slate-400 select-none">crevawebs.in/</span>
                      <input 
                        type="text" 
                        placeholder="your-store-name" 
                        value={heroStoreName}
                        onChange={e => setHeroStoreName(e.target.value)}
                        className="bg-transparent border-none outline-none pl-1 py-3 text-xs font-bold text-slate-800 w-full placeholder:text-slate-350"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-md transition-all shrink-0 hover:-translate-y-0.5"
                    >
                      Create My Store →
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-4 text-[10px] text-slate-400 font-bold justify-start">
                    <span>✓ No coding required</span>
                    <span>✓ Easy store setup</span>
                    <span>✓ Mobile-friendly storefronts</span>
                    <span>✓ Built for growing businesses</span>
                  </div>
                </form>
              </div>

              {/* Right Column: Premium Dashboard Mockup Preview */}
              <div className="lg:col-span-6 w-full">
                <div className="border border-slate-200 rounded-2xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col h-[400px]">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                      <span className="text-[10px] text-slate-400 font-semibold ml-2 font-mono">crevawebs.in/admin</span>
                    </div>
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  </div>
                  
                  <div className="flex-1 p-6 bg-slate-50/40 text-left space-y-6 overflow-y-auto">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-base font-black text-slate-900">CrevaWebs Admin Panel</h4>
                        <span className="text-[10px] text-slate-450 uppercase font-semibold">Storefront Overview</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-250/70 px-2.5 py-1 rounded-lg">Active</span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm relative">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Sales</span>
                        <span className="text-base font-black text-slate-900 mt-0.5 block">₹18,490</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Pending Orders</span>
                        <span className="text-base font-black text-slate-900 mt-0.5 block">3</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Delivered</span>
                        <span className="text-base font-black text-slate-900 mt-0.5 block">42</span>
                      </div>
                    </div>

                    {/* Simulated Notifications */}
                    <div className="space-y-2">
                      <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-blue-700">🔔 New Order Received from Priya (₹890)</span>
                        <span className="text-[9px] text-blue-600 font-bold bg-white px-2 py-0.5 rounded border border-blue-100">Just Now</span>
                      </div>
                      <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-emerald-700">✓ Custom Domain mappings published successfully</span>
                        <span className="text-[9px] text-emerald-600 font-bold bg-white px-2 py-0.5 rounded border border-emerald-100">Live</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 2. TRUST / SOCIAL PROOF STRIP */}
        <section className="w-full py-10 bg-slate-50 border-b border-slate-100 flex justify-center">
          <div className="container px-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center md:text-left text-slate-600">
              <div>
                <span className="text-3xl font-black text-slate-900 block">500+</span>
                <span className="text-xs text-slate-500 font-semibold mt-1 block">Businesses Building With Us</span>
              </div>
              <div>
                <span className="text-3xl font-black text-slate-900 block">1,200+</span>
                <span className="text-xs text-slate-500 font-semibold mt-1 block">Custom Stores Created</span>
              </div>
              <div>
                <span className="text-3xl font-black text-slate-900 block">50,000+</span>
                <span className="text-xs text-slate-500 font-semibold mt-1 block">Catalog Products Managed</span>
              </div>
              <div>
                <span className="text-3xl font-black text-slate-900 block">98%</span>
                <span className="text-xs text-slate-500 font-semibold mt-1 block">Customer Satisfaction Rate</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. WHY CREVAWEBS (Alternating showcase) */}
        <section id="features" className="w-full py-16 lg:py-24 bg-white flex justify-center">
          <div className="container px-6 max-w-7xl mx-auto space-y-24">
            
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                Everything You Need To Sell Online
              </h2>
              <p className="text-slate-550 text-sm sm:text-base">
                From creating your storefront layout to managing inventory and tracking deliveries, CrevaWebs handles your digital business operations in one place.
              </p>
            </div>

            {/* Alternating Feature 1: Create Store */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 space-y-6 text-left">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Layout className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Create Your Store</h3>
                <p className="text-slate-550 text-xs sm:text-sm leading-relaxed">
                  Choose a hand-crafted visual theme, input your company details, set highlight coloring, and launch a branded customer storefront immediately.
                </p>
              </div>
              <div className="lg:col-span-7 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800" 
                  alt="Create Store Setup preview" 
                  className="rounded-xl border border-slate-200/80 shadow-md w-full object-cover h-[260px]"
                />
              </div>
            </div>

            {/* Alternating Feature 2: Manage Products */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 bg-slate-50 p-6 rounded-2xl border border-slate-100 order-last lg:order-first">
                <div className="bg-white rounded-xl border border-slate-200 shadow-md p-5 text-xs text-slate-650 text-left space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-bold text-slate-800">Product Manager</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-bold">120 In Stock</span>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400">PRODUCT TITLE</span>
                        <span className="block border border-slate-100 bg-slate-50 p-2 rounded text-slate-800 font-semibold mt-1">Lavender Face Soap</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400">PRICE</span>
                        <span className="block border border-slate-100 bg-slate-50 p-2 rounded text-slate-800 font-semibold mt-1">₹349.00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5 space-y-6 text-left">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Manage Products</h3>
                <p className="text-slate-550 text-xs sm:text-sm leading-relaxed">
                  List items with specific tag names, prices, SKUs, and inventory thresholds. Update catalog attributes instantly to keep your storefront listings synchronized.
                </p>
              </div>
            </div>

            {/* Alternating Feature 3: Payments & Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 space-y-6 text-left">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Accept Payments & Orders</h3>
                <p className="text-slate-550 text-xs sm:text-sm leading-relaxed">
                  Avoid payment gateway fees. Collect customer payments directly through offline UPI QR codes and wire confirmations. Verify screenshot receipts inside your order queue to ship products.
                </p>
              </div>
              <div className="lg:col-span-7 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <img 
                  src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=800" 
                  alt="UPI payments and receipts" 
                  className="rounded-xl border border-slate-200/80 shadow-md w-full object-cover h-[260px]"
                />
              </div>
            </div>

          </div>
        </section>

        {/* 4. HOW IT WORKS (3 steps) */}
        <section className="w-full py-16 lg:py-24 border-t border-slate-100 bg-slate-50/50 flex justify-center">
          <div className="container px-6 max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-3 max-w-xl mx-auto">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                From Idea to Online Store in 3 Steps
              </h2>
              <p className="text-slate-500 text-sm">
                RWeb pipelines make storefront initialization smooth and beginner-friendly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative text-left">
              <div className="space-y-4">
                <div className="text-5xl font-black text-blue-600/10">01</div>
                <h3 className="font-bold text-base text-slate-900">Create Your Store</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Enter your store name on the dashboard and initiate registration. Instantly configure the storefront subdomain details.
                </p>
              </div>
              <div className="space-y-4">
                <div className="text-5xl font-black text-blue-600/10">02</div>
                <h3 className="font-bold text-base text-slate-900">Make It Yours</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Choose your brand visual template theme, upload custom business logo placeholders, and populate your inventory catalog items.
                </p>
              </div>
              <div className="space-y-4">
                <div className="text-5xl font-black text-blue-600/10">03</div>
                <h3 className="font-bold text-base text-slate-900">Start Selling</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Go live with direct customer checkout, accept UPI payments directly, and trigger order updates to clients via WhatsApp links.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. CREVAWEBS DASHBOARD SHOWCASE (With highlights callout labels) */}
        <section className="w-full py-16 lg:py-24 bg-white border-t border-slate-100 flex justify-center">
          <div className="container px-6 max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-3 max-w-xl mx-auto">
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-wider">One Powerful Dashboard</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Everything You Need. All In One Place.
              </h2>
              <p className="text-slate-550 text-sm">
                Control templates, stock counts, invoices, order statuses, and custom domain configurations directly.
              </p>
            </div>

            {/* Dashboard Mockup with Highlight Pointers */}
            <div className="relative border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.03)] bg-white p-6 max-w-5xl mx-auto text-left">
              <div className="grid grid-cols-12 gap-6 items-stretch">
                
                {/* Left Side: Mock Navigation Menu */}
                <div className="col-span-3 border-r border-slate-150 pr-4 space-y-5 hidden md:block">
                  <div className="font-bold text-xs text-slate-400 tracking-wide uppercase">Workspace</div>
                  <div className="space-y-2">
                    <span className="block px-3 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl">Overview</span>
                    <span className="block px-3 py-2 text-slate-500 hover:bg-slate-50 text-xs font-medium rounded-xl">Products Catalog</span>
                    <span className="block px-3 py-2 text-slate-500 hover:bg-slate-50 text-xs font-medium rounded-xl">Sales Orders</span>
                    <span className="block px-3 py-2 text-slate-500 hover:bg-slate-50 text-xs font-medium rounded-xl">Customer Directory</span>
                    <span className="block px-3 py-2 text-slate-500 hover:bg-slate-50 text-xs font-medium rounded-xl">Domain Settings</span>
                  </div>
                </div>

                {/* Right Side: Active Workspace */}
                <div className="col-span-12 md:col-span-9 space-y-6">
                  <div className="flex justify-between items-center border-b pb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Merchant Dashboard</h3>
                      <span className="text-[10px] text-slate-400">All live sync channels are active</span>
                    </div>
                    <span className="text-xs bg-emerald-50 text-emerald-600 font-bold px-3 py-1 rounded-full border border-emerald-100">Live</span>
                  </div>

                  {/* Highlights Callouts Content Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Callout 1 */}
                    <div className="p-5 border border-slate-200/80 rounded-2xl relative bg-slate-50/40">
                      <span className="absolute -top-3 left-4 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Products</span>
                      <h5 className="font-bold text-xs text-slate-800 mt-2">Active Inventory Manager</h5>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">List new items, configure descriptions, set prices, and control stock status instantly.</p>
                    </div>
                    {/* Callout 2 */}
                    <div className="p-5 border border-slate-200/80 rounded-2xl relative bg-slate-50/40">
                      <span className="absolute -top-3 left-4 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Orders</span>
                      <h5 className="font-bold text-xs text-slate-800 mt-2">Order Fulfillment Logs</h5>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Review customer order lists, payment receipt screenshots, and download invoices in words.</p>
                    </div>
                    {/* Callout 3 */}
                    <div className="p-5 border border-slate-200/80 rounded-2xl relative bg-slate-50/40">
                      <span className="absolute -top-3 left-4 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Payments</span>
                      <h5 className="font-bold text-xs text-slate-800 mt-2">UPI Verification Settings</h5>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Map your merchant UPI virtual payment address to allow scanner checkouts.</p>
                    </div>
                    {/* Callout 4 */}
                    <div className="p-5 border border-slate-200/80 rounded-2xl relative bg-slate-50/40">
                      <span className="absolute -top-3 left-4 bg-amber-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">WhatsApp</span>
                      <h5 className="font-bold text-xs text-slate-800 mt-2">WhatsApp Logs & CRM</h5>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Dispatch shipping updates and order receipt intents directly to customer phones.</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* 6. TEMPLATES SHOWCASE */}
        <section id="templates" className="w-full py-16 lg:py-24 bg-slate-50 border-t border-slate-100 flex justify-center">
          <div className="container px-6 max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-3 max-w-xl mx-auto">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                A store that looks like your brand
              </h2>
              <p className="text-slate-500 text-sm">
                Choose from professionally designed storefront themes. Click any card to preview the full layout structure live.
              </p>
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {templates.map((template, idx) => (
                <div
                  key={template.id}
                  onClick={() => {
                    setPreviewUrl(template.previewPath);
                    setSelectedTemplateId(template.id);
                  }}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm transition-all hover:border-blue-500/30 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between cursor-pointer"
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-slate-50 border-b border-slate-100">
                    <img
                      src={template.thumb}
                      alt={template.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold uppercase tracking-wider bg-blue-600 px-4 py-2 rounded-lg shadow-md transform translate-y-3 group-hover:translate-y-0 transition-transform">
                        Preview Store →
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between text-left">
                    <div>
                      <span className="text-[9px] font-bold text-blue-600 tracking-wider uppercase mb-1 block">{template.category || `Template ${idx + 1}`}</span>
                      <h3 className="font-bold text-sm text-slate-850">{template.name}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center pt-4">
              <Link href="#templates" className="inline-flex items-center gap-1.5 font-bold text-xs text-blue-600 hover:text-blue-700 uppercase tracking-wider">
                Explore All Templates →
              </Link>
            </div>
          </div>
        </section>

        {/* 7. COMPARISON / BENEFITS MATRIX */}
        <section className="w-full py-16 lg:py-24 bg-white border-t border-slate-100 flex justify-center">
          <div className="container px-6 max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-3 max-w-xl mx-auto">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                A simpler way to build your store
              </h2>
              <p className="text-slate-500 text-sm">
                Compare CrevaWebs capabilities directly against traditional developments and complex e-commerce systems.
              </p>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-slate-400">Features</th>
                    <th className="px-6 py-4 font-black text-xs uppercase tracking-wider text-blue-600 text-center">CrevaWebs</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-slate-500 text-center">Traditional Web</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-slate-500 text-center">Complex Platform</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {comparisonRows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/30">
                      <td className="px-6 py-4 font-semibold text-slate-700 text-xs">{row.name}</td>
                      <td className="px-6 py-4 text-center">
                        {row.creva ? <Check className="w-4 h-4 text-blue-600 mx-auto" /> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.trad ? <Check className="w-4 h-4 text-slate-400 mx-auto" /> : <span className="text-slate-350">—</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.complex ? <Check className="w-4 h-4 text-slate-400 mx-auto" /> : <span className="text-slate-350">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 8. CUSTOMER STORIES / TESTIMONIALS */}
        <section className="w-full py-16 lg:py-24 bg-slate-50 border-t border-slate-100 flex justify-center">
          <div className="container px-6 max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-3 max-w-xl mx-auto">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Built for real businesses
              </h2>
              <p className="text-slate-500 text-sm">
                Hear how growing retail merchants and local shop owners manage custom digital storefronts.
              </p>
            </div>

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex gap-0.5 text-amber-500">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-xs text-slate-650 leading-relaxed">
                  "Listing items, setting pricing rules, and setting brand colors took less than 10 minutes. The direct UPI setup prevents card cuts."
                </p>
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Sakthi Saravanan</span>
                  <span className="text-[10px] text-slate-400 font-semibold block">Elite Clothing Store • Fashion</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex gap-0.5 text-amber-500">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-xs text-slate-650 leading-relaxed">
                  "Connecting the payment QR codes offline saved thousands in gateway setup commission rates. The PDF invoicing calculates totals perfectly."
                </p>
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Vignesh Kumar</span>
                  <span className="text-[10px] text-slate-400 font-semibold block">Pure Organic Soap Co • Beauty</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex gap-0.5 text-amber-500">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-xs text-slate-650 leading-relaxed">
                  "Our customers love direct WhatsApp communication. Placing order receipts and tracking delivery numbers works seamlessly."
                </p>
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Meera Nair</span>
                  <span className="text-[10px] text-slate-400 font-semibold block">Artisanal Bakery • Food & Local Business</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. PRICING SECTION */}
        <section id="pricing" className="w-full py-16 lg:py-24 bg-white border-t border-slate-100 flex justify-center">
          <div className="container px-6 max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-3 max-w-xl mx-auto">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Simple Pricing. Built for Every Stage.
              </h2>
              <p className="text-slate-500 text-sm">
                No hidden charges. Select a package to launch your storefront with zero setup commission rates.
              </p>
            </div>

            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
              {pricingPlans.map((plan) => {
                const isPopular = plan.badge !== '';
                return (
                  <div 
                    key={plan.id}
                    className={`p-8 bg-white border rounded-2xl flex flex-col justify-between relative text-left shadow-sm transition-all duration-200 ${
                      isPopular 
                        ? 'border-blue-600 shadow-[0_10px_30px_rgba(37,99,235,0.06)] scale-[1.01]' 
                        : 'border-slate-200 hover:border-slate-350'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-3 left-6 bg-blue-600 text-white font-bold text-[9px] uppercase tracking-wider px-3 py-1 rounded-full">
                        {plan.badge}
                      </span>
                    )}

                    <div className="space-y-6">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{plan.name}</span>
                        <div className="flex items-baseline gap-1 mt-2">
                          <span className="text-4xl font-black text-slate-900">₹{plan.price}</span>
                          <span className="text-xs text-slate-400 font-semibold">
                            {plan.days >= 99999 ? '/ lifetime' : plan.days >= 365 ? `/ ${Math.round(plan.days / 365)} yr` : `/ ${plan.days} days`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-4 leading-relaxed">{plan.desc}</p>
                      </div>

                      <hr className="border-slate-100" />

                      <ul className="space-y-4 text-xs text-slate-650 font-medium">
                        <li className="flex items-center gap-2.5">
                          <Check className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>Complete Storefront Access</span>
                        </li>
                        <li className="flex items-center gap-2.5">
                          <Check className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>Offline UPI QR code billing</span>
                        </li>
                        <li className="flex items-center gap-2.5">
                          <Check className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>AI Assistant chatbot widget</span>
                        </li>
                      </ul>
                    </div>

                    <div className="pt-8">
                      <Link
                        href="/register"
                        className={`w-full h-11 flex items-center justify-center rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                          isPopular 
                            ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-500/10' 
                            : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        Choose {plan.name}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 10. FAQ SECTION */}
        <section id="faq" className="w-full py-16 lg:py-24 bg-slate-50 border-t border-slate-100 flex justify-center">
          <div className="container px-6 max-w-3xl mx-auto space-y-12">
            <div className="text-center space-y-3 max-w-xl mx-auto">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Frequently Asked Questions
              </h2>
              <p className="text-slate-500 text-sm">
                Get quick answers about RWeb e-commerce setup workflows.
              </p>
            </div>

            {/* Accordion FAQ */}
            <div className="space-y-4 text-left">
              {faqs.map((faq, idx) => {
                const isActive = activeFaq === idx;
                return (
                  <div key={idx} className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
                    <button
                      onClick={() => setActiveFaq(isActive ? null : idx)}
                      className="w-full p-5 flex items-center justify-between text-left font-bold text-slate-800 text-xs sm:text-sm hover:bg-slate-50/50 transition-colors"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-550 transition-transform duration-200 ${isActive ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="p-5 border-t border-slate-100 text-slate-500 text-xs leading-relaxed bg-slate-50/20">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 11. FINAL CTA */}
        <section className="w-full py-16 lg:py-24 bg-white flex justify-center border-t border-slate-100">
          <div className="container px-6 max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-650 rounded-3xl p-8 sm:p-12 text-center text-white shadow-xl shadow-blue-500/10 space-y-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Your online store starts with CrevaWebs.
              </h2>
              <p className="text-blue-100 text-sm max-w-md mx-auto leading-relaxed">
                Create your store, add your products, and start building your online business today.
              </p>
              
              <form onSubmit={handleFinalSubmit} className="space-y-3 max-w-lg mx-auto text-left pt-2">
                <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                  <div className="flex items-center bg-white border border-slate-200/50 rounded-xl px-3 flex-1">
                    <span className="text-xs font-bold text-slate-400 select-none">crevawebs.in/</span>
                    <input 
                      type="text" 
                      placeholder="your-store-name" 
                      value={finalStoreName}
                      onChange={e => setFinalStoreName(e.target.value)}
                      className="bg-transparent border-none outline-none pl-1 py-3 text-xs font-bold text-slate-800 w-full placeholder:text-slate-350"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-md transition-all shrink-0"
                  >
                    Start Free →
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

      </main>

      <MarketingFooter />

      {/* Preview Modal Overlay */}
      <AnimatePresence>
        {previewUrl && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-900/30 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-6xl h-full max-h-[85vh] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white/80 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <span className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="text-xs text-slate-500 font-semibold ml-2 font-mono">Store Preview</span>
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
                  className="px-6 py-2.5 rounded-xl border border-slate-250 text-slate-650 hover:bg-slate-100 font-bold text-xs uppercase tracking-wider transition-colors"
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
