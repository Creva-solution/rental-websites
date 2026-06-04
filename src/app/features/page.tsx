'use client';

import MarketingNavbar from '@/components/MarketingNavbar';
import MarketingFooter from '@/components/MarketingFooter';
import Link from 'next/link';
import { 
  Layout, CreditCard, ShoppingBag, MessageSquare, 
  Bot, Sparkles, HelpCircle, ArrowRight, ShieldCheck, Zap, Globe 
} from 'lucide-react';

export default function FeaturesPage() {
  const primaryFeatures = [
    {
      icon: Layout,
      title: "Visual Theme Customization",
      desc: "Instantly switch your storefront layout. Customize colors, buttons, grid alignment, typography styles, and logo positioning to match your exact brand guidelines."
    },
    {
      icon: CreditCard,
      title: "Offline VPA & QR Payments",
      desc: "Connect your UPI QR code and wire details. Allow direct checkout scans with digital screenshot uploads for seamless off-platform merchant processing."
    },
    {
      icon: ShoppingBag,
      title: "Order Invoicing in Words",
      desc: "Track orders and generate blue-themed professional PDF customer invoices. The billing system automatically calculates transaction totals in English or local language words."
    },
    {
      icon: MessageSquare,
      title: "WhatsApp Status Alerts",
      desc: "Coordinate deliveries and update tracking codes. The checkout flows automatically prepare pre-formatted messaging templates to dispatch directly to clients via WhatsApp."
    }
  ];

  const adminFeatures = [
    {
      icon: Bot,
      title: "AI Store Assistant Widget",
      desc: "Get guidance on product creation, coupons, and payments right inside your admin dashboard via our custom-trained chatbot agent."
    },
    {
      icon: Sparkles,
      title: "Discount Campaigns Setup",
      desc: "Create flexible coupon codes, configure minimum order boundaries, and run seasonal sales with automatic conversion-rate suggestions."
    },
    {
      icon: ShieldCheck,
      title: "Local Language Agreements",
      desc: "Onboard merchants securely with digital licensing agreements translated into EN, TA, HI, TE, ML, or KN with integrated canvas signature logs."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-800 font-sans antialiased">
      <MarketingNavbar />
      
      {/* Background Decorative Patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#fff_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-[100px] left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <main className="flex-1 relative z-10 py-16 md:py-24 max-w-7xl mx-auto px-4 md:px-6 w-full">
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
            Capabilities
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-slate-900 leading-tight">
            Everything you need to <br className="hidden sm:inline" /> run your digital store
          </h1>
          <p className="text-slate-500 text-sm sm:text-base">
            Power your retail brand or local boutique storefront using our easy layout widgets and zero-transaction-fee checkout payments.
          </p>
        </div>

        {/* Primary Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {primaryFeatures.map((f, i) => (
            <div key={i} className="p-8 bg-white border border-slate-200 rounded-3xl space-y-4 shadow-sm hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="p-3 bg-blue-55 text-blue-600 rounded-xl w-fit">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-800">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Extended Features */}
        <div className="border-t border-slate-100 pt-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-800">Advanced Store Owner Management</h2>
            <p className="text-xs text-slate-500 mt-1">Supercharge operations with built-in digital signature verification and AI guidance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {adminFeatures.map((f, i) => (
              <div key={i} className="bg-slate-50/40 border border-slate-200 p-6 rounded-2xl space-y-3">
                <div className="p-2 bg-white text-blue-600 rounded-lg w-fit border border-slate-200">
                  <f.icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-800">{f.title}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 p-8 md:p-12 bg-blue-50/20 border border-blue-100 rounded-3xl text-center space-y-6 max-w-4xl mx-auto shadow-sm">
          <h2 className="text-2xl font-bold text-slate-850">Ready to launch your e-commerce website?</h2>
          <p className="text-xs text-slate-500 max-w-lg mx-auto">Build your visual branding system, sign your local agreement, and upload your UPI qr codes to start receiving direct payments today.</p>
          <div className="flex justify-center">
            <Link
              href="/register"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 text-xs uppercase tracking-widest shadow-lg shadow-blue-500/25 transition-all hover:scale-102"
            >
              Start Onboarding Wizard <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
