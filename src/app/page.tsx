'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X, ArrowRight, Layout, CreditCard, ShoppingBag, MessageSquare, 
  ShieldCheck, Zap, Globe, Sparkles, HelpCircle, Bot, Smartphone, 
  CheckCircle2, Clipboard, AlertTriangle, Gem, UserCheck, Play, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MarketingNavbar from '@/components/MarketingNavbar';
import MarketingFooter from '@/components/MarketingFooter';

type DynamicTemplate = { id: string; name: string; category: string; thumb: string; previewPath: string };

export default function Home() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [dynamicTemplates, setDynamicTemplates] = useState<DynamicTemplate[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/templates').then(r => r.json()).then(setDynamicTemplates).catch(() => {});
  }, []);

  const fallbackTemplates: DynamicTemplate[] = [
    { id: 'minimal', name: 'Minimal Elegance', category: 'Boutique', thumb: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800', previewPath: '/templates/preview?template=minimal' },
    { id: 'artisan', name: 'Artisan Craft', category: 'Natural Goods', thumb: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800', previewPath: '/templates/preview?template=artisan' },
    { id: 'bold', name: 'Bold Commerce', category: 'Commerce', thumb: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800', previewPath: '/templates/preview?template=bold' },
    { id: 'luxe', name: 'Dark Luxe', category: 'Luxury', thumb: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800', previewPath: '/templates/preview?template=luxe' },
    { id: 'retro', name: 'Retro Grid', category: 'Creative', thumb: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800', previewPath: '/templates/preview?template=retro' },
  ];

  const templates = dynamicTemplates.length > 0 ? dynamicTemplates : fallbackTemplates;

  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-800 overflow-x-hidden antialiased font-sans pt-20 relative">
      
      {/* Header */}
      <MarketingNavbar />

      <main className="flex-1 relative z-10">
        
        {/* Hero Section */}
        <section className="w-full py-16 lg:py-24 bg-white flex justify-center border-b border-slate-100">
          <div className="container px-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column: Headline and CTAs */}
              <div className="lg:col-span-6 space-y-8 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold w-fit">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>Build your online store</span>
                </div>
                <div className="space-y-4">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                    Launch your online store. Without the complexity.
                  </h1>
                  <p className="text-slate-650 text-base sm:text-lg leading-relaxed max-w-xl">
                    Create, customize, and manage a beautiful e-commerce storefront. Connect with customers directly on WhatsApp, accept UPI payments instantly, and track orders from one clean dashboard.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <Link
                    className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-8 text-sm font-bold text-white shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-200"
                    href="/register"
                  >
                    Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                  <Link
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-8 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:-translate-y-0.5 transition-all duration-200"
                    href="#templates"
                  >
                    Explore Templates
                  </Link>
                </div>
                <div className="pt-4 flex flex-wrap gap-6 text-xs text-slate-500 font-semibold">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    No Coding Required
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Instant Setup
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-500" />
                    Custom Domains
                  </div>
                </div>
              </div>

              {/* Right Column: Realistic Product Workspace Mockup */}
              <div className="lg:col-span-6 w-full">
                <div className="border border-slate-200/80 rounded-2xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col h-[420px]">
                  {/* Mock Workspace Titlebar */}
                  <div className="p-3 bg-slate-50 border-b border-slate-200/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-250" />
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-250" />
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-250" />
                      <span className="text-[11px] text-slate-400 font-medium ml-2">crevawebzz.com/admin/dashboard</span>
                    </div>
                    <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-md">Live Store</span>
                  </div>
                  {/* Mock Workspace Content */}
                  <div className="flex-1 bg-slate-50/50 p-6 flex flex-col gap-6 overflow-y-auto text-left">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-lg font-black text-slate-900">Elite Lifestyle Store</h4>
                        <span className="text-xs text-slate-400">Merchant Portal Overview</span>
                      </div>
                      <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl">Today</span>
                    </div>
                    
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sales</span>
                        <span className="text-lg font-black text-slate-900 mt-1 block">₹24,850</span>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Orders</span>
                        <span className="text-lg font-black text-slate-900 mt-1 block">18</span>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Products</span>
                        <span className="text-lg font-black text-slate-900 mt-1 block">142</span>
                      </div>
                    </div>

                    {/* Order Row list */}
                    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
                      <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-800">Recent Orders</span>
                        <span className="text-[10px] font-bold text-blue-600 cursor-default">View All</span>
                      </div>
                      <div className="p-3 divide-y divide-slate-100">
                        <div className="py-2.5 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-800 block">Karthik Raja</span>
                            <span className="text-[10px] text-slate-400">Order #ORD-9284 • 1 item</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-800 block">₹1,250</span>
                            <span className="text-[9px] bg-emerald-50 text-emerald-600 font-bold px-1.5 py-0.5 rounded-md">Paid</span>
                          </div>
                        </div>
                        <div className="py-2.5 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-800 block">Ananya Sharma</span>
                            <span className="text-[10px] text-slate-400">Order #ORD-9283 • 2 items</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-800 block">₹3,400</span>
                            <span className="text-[9px] bg-amber-50 text-amber-600 font-bold px-1.5 py-0.5 rounded-md">Pending</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Social Proof metrics strip */}
        <section className="w-full py-8 bg-slate-50 border-b border-slate-100 flex justify-center">
          <div className="container px-6 max-w-7xl mx-auto">
            <div className="flex flex-wrap justify-between items-center gap-8 text-slate-600">
              <div className="flex flex-col text-left">
                <span className="text-2xl font-black text-slate-900">500+</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5">Active Merchants Live</span>
              </div>
              <div className="w-px h-8 bg-slate-200 hidden md:block" />
              <div className="flex flex-col text-left">
                <span className="text-2xl font-black text-slate-900">10,000+</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5">Monthly Transactions Processed</span>
              </div>
              <div className="w-px h-8 bg-slate-200 hidden md:block" />
              <div className="flex flex-col text-left">
                <span className="text-2xl font-black text-slate-900">99.9%</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5">Uptime SLA Guaranteed</span>
              </div>
              <div className="w-px h-8 bg-slate-200 hidden md:block" />
              <div className="flex flex-col text-left">
                <span className="text-2xl font-black text-slate-900">24/7</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5">Dedicated Customer Support</span>
              </div>
            </div>
          </div>
        </section>

        {/* Editorial Features Section */}
        <section id="features" className="w-full py-16 lg:py-24 bg-white flex justify-center">
          <div className="container px-6 max-w-7xl mx-auto space-y-24">
            
            {/* Header Text */}
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                Everything you need to sell online
              </h2>
              <p className="text-slate-500 text-sm sm:text-base">
                From your first product listing to your first order fulfillment, RWeb provides a unified, structured suite to power your online catalog operations.
              </p>
            </div>

            {/* Alternating Feature Grid 1: Layout Themes */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 space-y-6 text-left">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Layout className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Stunning Visual Templates</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Select from five hand-crafted responsive themes designed specifically for digital product storefronts. Change your brand’s layout structure, primary highlight colors, and navigation behaviors instantly in one click.
                </p>
                <Link href="#templates" className="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-700 gap-1">
                  Preview themes <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="lg:col-span-7 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800" 
                  alt="Visual Templates Mockup" 
                  className="rounded-xl border border-slate-200/80 shadow-md w-full object-cover h-[280px]"
                />
              </div>
            </div>

            {/* Alternating Feature Grid 2: Product & Inventory */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 bg-slate-50 p-6 rounded-2xl border border-slate-100 order-last lg:order-first">
                <div className="bg-white rounded-xl border border-slate-200 shadow-md p-5 text-xs text-slate-600">
                  <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <span className="font-bold text-slate-800">Add New Product</span>
                    <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">In Stock</span>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">PRODUCT NAME</label>
                        <span className="block border border-slate-200 rounded p-2 bg-slate-50 font-bold text-slate-800">Lavender Soap</span>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">PRICE (INR)</label>
                        <span className="block border border-slate-200 rounded p-2 bg-slate-50 font-bold text-slate-800">₹249.00</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">DESCRIPTION</label>
                      <span className="block border border-slate-200 rounded p-2 bg-slate-50 text-[11px] text-slate-500 leading-relaxed">
                        Handmade organic soap infused with premium French lavender essence and moisturizing raw citrus extracts.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5 space-y-6 text-left">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Structured Catalog Management</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  List products with rich attributes, custom pricing models, SKU codes, stock quantities, and categorization rules. The backend automatically handles pagination and search structures on your customer site.
                </p>
              </div>
            </div>

            {/* Alternating Feature Grid 3: Order Fulfilment */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 space-y-6 text-left">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Seamless UPI Payments</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Avoid paying transactional cuts. Configure your UPI VPA ID and let customers checkout smoothly. They pay instantly using their mobile banking apps and upload receipt screenshots which you verify in the admin panel.
                </p>
              </div>
              <div className="lg:col-span-7 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <img 
                  src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=800" 
                  alt="UPI Payments Mockup" 
                  className="rounded-xl border border-slate-200/80 shadow-md w-full object-cover h-[280px]"
                />
              </div>
            </div>

          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full py-16 lg:py-24 border-t border-slate-100 bg-slate-50/50 flex justify-center">
          <div className="container px-6 max-w-7xl mx-auto">
            <div className="text-center space-y-3 mb-16">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                A simple 3-step setup flow
              </h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                No complex forms or configuration checklists. Go live with your fully active brand domain in minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {/* Step 1 */}
              <div className="text-left space-y-4 relative">
                <div className="text-5xl font-black text-blue-600/10">01</div>
                <h3 className="font-bold text-base text-slate-900">Branding & Store Setup</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Enter your business name, select your primary highlight brand colors, and upload your custom logo placeholder. Choose a responsive theme structure.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-left space-y-4 relative">
                <div className="text-5xl font-black text-blue-600/10">02</div>
                <h3 className="font-bold text-base text-slate-900">Select Plan & Signature</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Select a trial package or an annual tier. Provide your electronic signature directly on the screen to generate a localized digital license agreement.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-left space-y-4 relative">
                <div className="text-5xl font-black text-blue-600/10">03</div>
                <h3 className="font-bold text-base text-slate-900">UPI Pay & Go Live</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Scan the dynamic UPI QR code or pay manually using VPA details. Once you upload a transaction screenshot, your shop instantly launches live on the internet!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Store Onboarding AI Assistant Section */}
        <section className="w-full py-16 lg:py-24 bg-white flex justify-center border-t border-slate-100">
          <div className="container px-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column: AI Assistant Copy */}
              <div className="lg:col-span-6 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold w-fit">
                  <Bot className="w-3.5 h-3.5" />
                  <span>RWeb Assistant</span>
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                  Get help while you build your business.
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Inside your merchant dashboard portal, you will have access to a dedicated AI Store Assistant chatbot designed to provide step-by-step guidance on setting up your storefront.
                </p>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 font-medium">Instantly learn how to list new inventory categories, edit discounts, and add tags.</p>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 font-medium">Get suggestions on design layouts and branding modifications tailored to your products.</p>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 font-medium">Escalate issues directly to real customer support representatives via integrated WhatsApp hotlines.</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Clean Chat Mockup UI */}
              <div className="lg:col-span-6 w-full">
                <div className="border border-slate-200/80 rounded-2xl bg-white shadow-[0_15px_40px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col h-[380px]">
                  {/* Chat Mockup Header */}
                  <div className="p-4 bg-slate-50 border-b border-slate-200/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                        <Bot className="w-4.5 h-4.5" />
                      </div>
                      <div className="text-left">
                        <span className="block font-bold text-xs text-slate-800">Store Assistant</span>
                        <span className="text-[9px] text-blue-600 font-bold uppercase tracking-wider block">AI Agent Online</span>
                      </div>
                    </div>
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  </div>

                  {/* Chat Content Body */}
                  <div className="flex-1 p-4 bg-slate-50/20 space-y-4 overflow-y-auto text-left">
                    <div className="flex gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 text-xs">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-none p-3 text-xs text-slate-650 leading-relaxed shadow-sm max-w-[85%]">
                        Hello! I am your Store Assistant. I can show you how to list your products, configure coupons, or link UPI accounts. What would you like to set up first?
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <div className="bg-blue-600 text-white rounded-2xl rounded-tr-none p-3 text-xs leading-relaxed shadow-sm max-w-[80%]">
                        How do I configure coupons?
                      </div>
                    </div>

                    <div className="space-y-1.5 pl-8">
                      <span className="block text-[9px] uppercase font-bold text-slate-400">Quick Actions</span>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2.5 py-1 text-[10px] bg-white border border-slate-200 rounded-lg font-semibold text-slate-600 cursor-default">Add Product</span>
                        <span className="px-2.5 py-1 text-[10px] bg-white border border-blue-200 rounded-lg font-semibold text-blue-600 cursor-default">Create Coupon</span>
                        <span className="px-2.5 py-1 text-[10px] bg-white border border-slate-200 rounded-lg font-semibold text-slate-600 cursor-default">View Orders</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* UPI Payments & Verification Section */}
        <section className="w-full py-16 lg:py-24 border-t border-slate-100 bg-slate-50/50 flex justify-center">
          <div className="container px-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column: UI QR Code payment simulation */}
              <div className="lg:col-span-5 w-full order-last lg:order-first">
                <div className="border border-slate-200/85 rounded-2xl bg-white shadow-[0_15px_40px_rgba(0,0,0,0.03)] p-6 space-y-4 text-left">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-xs text-slate-800">Dynamic Payment Intent</span>
                  </div>

                  {/* QR Image Placeholder mockup */}
                  <div className="flex justify-center p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="w-40 h-40 bg-slate-200 flex items-center justify-center rounded-lg border border-slate-300">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">[ QR CODE ]</span>
                    </div>
                  </div>

                  {/* Copy clipboard action box */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Alternative: Copy VPA ID</span>
                    <div className="flex items-center">
                      <span className="font-mono text-xs bg-slate-50 border border-slate-200 border-r-0 rounded-l-lg px-3 py-2 text-slate-600 flex-1 overflow-hidden">
                        creva@ybl
                      </span>
                      <button type="button" className="font-bold text-[10px] bg-blue-600 hover:bg-blue-500 text-white rounded-r-lg px-4 py-2">
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Safe checkouts copy */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold w-fit">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Simple Payments</span>
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                  Accept payments with confidence.
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  We use standard direct UPI settlement transfers to keep setup transaction costs 100% free for all merchant packages.
                </p>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">Dynamic Scan-To-Pay QR Codes</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Calculates exact subscription values instantly on checkout dialogs. Use any local banking application to finalize transfers.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">Zero Transaction Cuts</h4>
                      <p className="text-xs text-slate-500 mt-0.5">We charge no processing percentages or commissions. Everything your customers pay enters your UPI merchant accounts directly.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Templates Gallery Preview Showcase Section */}
        <section id="templates" className="w-full py-16 lg:py-24 bg-white flex justify-center border-t border-slate-100">
          <div className="container px-6 max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-3 max-w-xl mx-auto">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Choose a store that fits your brand.
              </h2>
              <p className="text-slate-500 text-sm">
                Select from our collection of hand-crafted layouts. Tap to preview any storefront layout structure live.
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
                  className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white text-slate-800 shadow-sm transition-all hover:border-blue-500/30 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between cursor-pointer"
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-slate-50 border-b border-slate-100">
                    <img
                      src={template.thumb}
                      alt={template.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold uppercase tracking-wider bg-blue-600 px-4 py-2 rounded-lg shadow-md transform translate-y-3 group-hover:translate-y-0 transition-transform">
                        Preview template
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between text-left">
                    <div>
                      <span className="text-[9px] font-bold text-blue-600 tracking-wider uppercase mb-1 block">{template.category || `Template ${idx + 1}`}</span>
                      <h3 className="font-bold text-sm text-slate-800">{template.name}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why RWeb Section */}
        <section className="w-full py-16 lg:py-24 bg-slate-50 border-t border-b border-slate-100 flex justify-center">
          <div className="container px-6 max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-3 max-w-xl mx-auto">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Built for businesses that want to move faster.
              </h2>
              <p className="text-slate-500 text-sm">
                RWeb streamlines e-commerce setups by replacing complex catalog setups with clean, visual controls.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-950 text-base">No coding required</h4>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Design storefront layouts, list items, structure pricing, configure subdomains, and invite team administrators without entering a single line of script.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Zap className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-950 text-base">Launch faster</h4>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Follow a guided setup pipeline. Activate your custom shop instantly upon transaction upload verification to skip multi-day platform approvals.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-950 text-base">Direct communication</h4>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Avoid paying intermediary fees. Engage directly with customers via WhatsApp integrations to confirm deliveries, screenshots, and custom item sizes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="w-full py-16 lg:py-24 bg-white flex justify-center">
          <div className="container px-6 max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-650 rounded-3xl p-8 sm:p-12 text-center text-white shadow-xl shadow-blue-500/10 space-y-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Ready to build your online store?
              </h2>
              <p className="text-blue-100 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                Start with RWeb and launch your storefront without the usual complex setup pipelines. Get started free today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <Link
                  className="bg-white hover:bg-slate-50 text-blue-600 font-bold h-12 px-8 rounded-xl flex items-center justify-center transition-colors shadow-lg"
                  href="/register"
                >
                  Start Free Trial
                </Link>
                <Link
                  className="border border-blue-300 hover:bg-white/10 text-white font-bold h-12 px-8 rounded-xl flex items-center justify-center transition-colors"
                  href="#templates"
                >
                  View Templates
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <MarketingFooter />

      {/* Preview Modal */}
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
                  className="px-6 py-2.5 rounded-xl border border-slate-250 text-slate-600 hover:bg-slate-100 font-bold text-xs uppercase tracking-wider transition-colors"
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
