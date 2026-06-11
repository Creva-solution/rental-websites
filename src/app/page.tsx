'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X, ArrowRight, Store, Layout, CreditCard,
  ShoppingBag, MessageSquare, ShieldCheck, Zap, Globe, Sparkles,
  HelpCircle, Bot, Smartphone, CheckCircle2, FileText, Landmark, Clipboard, AlertTriangle
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

  const fallbackTemplates: DynamicTemplate[] = [
    { id: 'minimal', name: 'Minimal Elegance', category: 'Boutique', thumb: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800', previewPath: '/templates/preview?template=minimal' },
    { id: 'artisan', name: 'Artisan Craft', category: 'Natural Goods', thumb: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800', previewPath: '/templates/preview?template=artisan' },
    { id: 'bold', name: 'Bold Commerce', category: 'Commerce', thumb: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800', previewPath: '/templates/preview?template=bold' },
    { id: 'luxe', name: 'Dark Luxe', category: 'Luxury', thumb: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800', previewPath: '/templates/preview?template=luxe' },
    { id: 'retro', name: 'Retro Grid', category: 'Creative', thumb: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800', previewPath: '/templates/preview?template=retro' },
  ];

  const templates = dynamicTemplates.length > 0 ? dynamicTemplates : fallbackTemplates;

  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-800 overflow-x-hidden antialiased font-sans pt-20">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#fff_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[600px] right-0 w-[400px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <MarketingNavbar />

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
                  href="/templates"
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

        {/* How It Works Section */}
        <section className="w-full py-16 md:py-24 border-t border-slate-100 bg-blue-50/20 relative">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="text-center space-y-3 mb-16">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                Simple Setup
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900">
                How{' '}
                <span className="inline-flex items-center align-middle mx-1">
                  <img src="/logo-creva.svg" alt="Creva Webzz" className="h-6 w-auto object-contain" />
                </span>{' '}
                Works
              </h2>
              <p className="text-slate-500 text-sm max-w-xl mx-auto">
                Follow our step-by-step setup wizard to customize, license, pay, and go live instantly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm relative">
                <span className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-md">1</span>
                <div className="pt-2">
                  <h3 className="font-bold text-base text-slate-800">Branding & Store Setup</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Enter your shop details, set custom brand colors, and upload your business logo. Choose from five modern visual templates tailored for your catalog.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm relative">
                <span className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-md">2</span>
                <div className="pt-2">
                  <h3 className="font-bold text-base text-slate-800">Plan & Digital Contract</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Select a trial or annual subscription plan. Draw your digital signature on the screen to instantly lock your merchant licensing agreement in your local language.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm relative">
                <span className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-md">3</span>
                <div className="pt-2">
                  <h3 className="font-bold text-base text-slate-800">UPI Payment & Activation</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Scan the dynamic merchant QR code or trigger mobile app UPI intents. Upload a screenshot to activate your store, set your credentials, and access the admin dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Store Assistant Feature Highlight */}
        <section className="w-full py-16 md:py-24 border-t border-slate-100 bg-white relative">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Feature Text */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                  Dashboard Helper
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900 leading-tight">
                  Meet Your AI Store Assistant
                </h2>
                <p className="text-slate-650 text-sm leading-relaxed">
                  Inside the store owner admin panel, you'll find our dynamic, floating <strong>Store Assistant</strong> chatbot designed to guide you step-by-step through catalog creation and shop operations.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">Interactive Setup Guidance</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Instant directions on how to add products, configure discount coupons, manage order fulfillment, customize banners, or link custom subdomains.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">Smart Sales Suggestions</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Get automatic recommendations on setting up discount campaigns, featuring best-selling products, or tweaking homepage sections for higher conversion.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">Human Escalation & Support Tickets</h4>
                      <p className="text-xs text-slate-500 mt-0.5">If the AI helper cannot address your query, submit support tickets directly or access active platform hotlines and click-to-chat WhatsApp links.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chatbot Interface Mockup Graphic */}
              <div className="lg:col-span-5">
                <div className="border border-slate-200 rounded-3xl bg-white shadow-xl shadow-blue-500/5 overflow-hidden flex flex-col h-[400px]">
                  {/* Mock Chatbot Header */}
                  <div className="p-4 border-b border-slate-100 bg-blue-50/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="block font-bold text-xs text-slate-800">Store Assistant</span>
                        <span className="text-[9px] text-blue-600 font-bold uppercase tracking-wider block">AI Agent Online</span>
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  </div>

                  {/* Mock Chatbot Tabs */}
                  <div className="flex border-b border-slate-100 text-[10px] font-bold text-slate-500">
                    <span className="flex-1 py-2 text-center bg-white border-b-2 border-blue-500 text-blue-600">AI Assistant</span>
                    <span className="flex-1 py-2 text-center hover:bg-slate-50">Setup Guide</span>
                    <span className="flex-1 py-2 text-center hover:bg-slate-50">Escalate</span>
                  </div>

                  {/* Mock Chatbot Body */}
                  <div className="flex-1 p-4 bg-slate-50/40 space-y-3.5 overflow-y-auto text-left">
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div className="bg-white border border-blue-50/80 rounded-2xl rounded-tl-none p-3 text-[11px] text-slate-650 leading-relaxed shadow-sm max-w-[85%]">
                        Hello! I am your Store Assistant. I can show you how to list your products, configure coupons, or link UPI accounts. What would you like to set up first?
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <div className="bg-blue-600 text-white rounded-2xl rounded-tr-none p-3 text-[11px] leading-relaxed shadow-sm max-w-[80%]">
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

        {/* UPI Payments & Verification Warning Solution Section */}
        <section className="w-full py-16 md:py-24 border-t border-slate-100 bg-blue-50/20 relative">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Device Graphic Mockup */}
              <div className="lg:col-span-5 order-last lg:order-first">
                <div className="border border-slate-200 rounded-3xl bg-white shadow-xl shadow-blue-500/5 p-5 space-y-4 text-left">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-xs text-slate-800">Simulated UPI App / Intent</span>
                  </div>

                  {/* Warning dialog simulation */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-[11px] leading-relaxed text-amber-900 space-y-2">
                    <p className="flex items-start gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>Security & Safety Check</span>
                    </p>
                    <p className="text-[10px] text-amber-800 font-medium">
                      Google Pay or PhonePe may display a warning such as <em>"This payment cannot be verified as safe" / "Unverified Merchant"</em> when paying a newly created direct VPA link. This is a normal standard security notification for custom browser redirections.
                    </p>
                    <div className="pt-1.5 border-t border-amber-200/50 flex justify-between items-center text-[9px] font-bold text-amber-900">
                      <span>NPCI Standard Guidelines</span>
                      <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 rounded-lg">Verified Link</span>
                    </div>
                  </div>

                  {/* VPA copy clipboard box helper */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Simple Fix: Copy Merchant VPA ID</span>
                    <div className="flex items-center">
                      <span className="font-mono text-[11px] bg-slate-100 border border-slate-200 border-r-0 rounded-l-xl px-3 py-2 text-slate-700 flex-1 overflow-hidden text-ellipsis shadow-inner">
                        creva@ybl
                      </span>
                      <button type="button" className="font-bold text-[10px] bg-blue-600 hover:bg-blue-500 text-white rounded-r-xl px-3.5 py-2 flex items-center gap-1 shadow-sm">
                        <Clipboard className="w-3.5 h-3.5" /> Copy VPA
                      </button>
                    </div>
                    <span className="text-[9px] text-slate-400 block">Copy the VPA ID and pay manually inside your UPI app to avoid app verification limits.</span>
                  </div>
                </div>
              </div>

              {/* Explanatory text */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                  Safe Checkout
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900 leading-tight">
                  Verified Offline Payments & Simple Fixes
                </h2>
                <p className="text-slate-650 text-sm leading-relaxed">
                  To keep platform setup costs low, we utilize direct UPI merchant settlement transfers. We provide dynamic Scan-to-Pay QR codes and direct VPA ID copy tools.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">Dynamic Scan-To-Pay QR Codes</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Displays a real-time QR code configured with your exact subscription amount. Open any banking app, scan, pay, and take a screenshot to upload.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5">
                      <HelpCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">Standard NPCI Guidelines Clarification</h4>
                      <p className="text-xs text-slate-500 mt-0.5">GPay occasionally throws a warning check for custom URLs to ensure the payer reviews the VPA destination. Use our one-click **Copy VPA ID** tool, paste it directly in your app, and complete payments seamlessly.</p>
                    </div>
                  </div>
                </div>
              </div>
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

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 items-stretch">
              {templates.map((template, idx) => (
                <div
                  key={template.id}
                  onClick={() => {
                    setPreviewUrl(template.previewPath);
                    setSelectedTemplateId(template.id);
                  }}
                  className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-white text-slate-800 shadow-sm transition-all hover:border-blue-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/5 flex flex-col justify-between cursor-pointer"
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-blue-50">
                    <img
                      src={template.thumb}
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
                      <span className="text-[9px] font-black text-blue-600 tracking-wider uppercase mb-1.5 block">{template.category || `Template ${idx + 1}`}</span>
                      <h3 className="font-bold text-sm mb-2 text-slate-850">{template.name}</h3>
                    </div>
                  </div>
                </div>
              ))}
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
