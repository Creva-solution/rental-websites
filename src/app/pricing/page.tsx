'use client';

import MarketingNavbar from '@/components/MarketingNavbar';
import MarketingFooter from '@/components/MarketingFooter';
import Link from 'next/link';
import { Check, Info, ShieldCheck, HelpCircle, Smartphone, AlertTriangle } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      id: '30',
      name: 'Trial Package',
      price: '₹499',
      duration: '30 Days Access',
      desc: 'Ideal for testing storefront layouts and AI catalog guidelines.',
      features: [
        'Complete Storefront access',
        '1 Template selection',
        'AI Assistant dashboard guidance',
        'Basic order tracking',
        'Direct UPI Payments'
      ],
      popular: false
    },
    {
      id: '365',
      name: 'Professional Pack',
      price: '₹3,999',
      duration: '365 Days Access',
      desc: 'Our most popular tier for growing small shops and local retailers.',
      features: [
        'Complete Storefront access',
        'Select from all 5 Templates',
        'Full AI Assistant guide panel',
        'Fulfillment & Blue invoices in words',
        'WhatsApp alerts & tracking codes',
        'Custom Domain support'
      ],
      popular: true
    },
    {
      id: 'lifetime',
      name: 'Lifetime Plan',
      price: '₹9,999',
      duration: 'Unlimited Access',
      desc: 'Ultimate value for established merchants seeking permanent store setups.',
      features: [
        'Everything in Professional Pack',
        'Lifetime access (no renewals)',
        'Priority customer hotline access',
        'Advanced templates premium support',
        'Unlimited products & coupons'
      ],
      popular: false
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-800 font-sans antialiased">
      <MarketingNavbar />

      {/* Decorative Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#fff_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-[100px] left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <main className="flex-1 relative z-10 py-16 md:py-24 max-w-7xl mx-auto px-4 md:px-6 w-full">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
            Plans & Pricing
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-slate-900 leading-tight">
            Transparent Pricing with <br className="hidden sm:inline" /> Zero Transaction Fees
          </h1>
          <p className="text-slate-500 text-sm sm:text-base">
            Select a package that fits your storefront scale. All payments are verified offline with zero hidden commission rates.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-20">
          {plans.map((p) => (
            <div 
              key={p.id}
              className={`p-8 bg-white border rounded-3xl flex flex-col justify-between relative shadow-sm transition-all hover:shadow-lg ${
                p.popular 
                  ? 'border-blue-500 ring-2 ring-blue-500/20 scale-[1.02]' 
                  : 'border-slate-200 hover:border-blue-200'
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-extrabold text-[9px] uppercase tracking-widest px-3.5 py-1 rounded-full shadow-sm">
                  Most Popular
                </span>
              )}

              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">{p.name}</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-black text-slate-850 font-mono">{p.price}</span>
                    <span className="text-xs text-slate-400 font-semibold">/ {p.duration}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-3.5 leading-relaxed">{p.desc}</p>
                </div>

                <hr className="border-slate-100" />

                <ul className="space-y-3.5 text-xs text-slate-600 font-medium">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href="/register"
                  className={`w-full h-11 flex items-center justify-center rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                    p.popular
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20'
                      : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Choose {p.name}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Off-Platform UPI Verification Callout */}
        <div className="border border-slate-200 rounded-3xl bg-slate-50/50 p-6 md:p-8 max-w-4xl mx-auto space-y-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-2 text-left">
              <h4 className="font-bold text-sm text-slate-800">Standard NPCI & Mobile App Safety Note</h4>
              <p className="text-xs text-slate-550 leading-relaxed">
                When initiating transfers via mobile UPI apps (like Google Pay), you may occasionally see safety alerts such as <em>"This payment cannot be verified as safe" / "Unverified merchant URL"</em>. 
              </p>
              <p className="text-xs text-slate-550 leading-relaxed">
                This is a standard default check for web-to-app deep-linking protocols. The licensing payment process is fully verified and secure. If your application blocks the transaction, simply copy the merchant VPA ID (<strong className="font-mono text-blue-600">creva@ybl</strong>) and complete the transfer manually in GPay or PhonePe!
              </p>
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
