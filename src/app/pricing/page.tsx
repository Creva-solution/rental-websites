'use client';

import { useState, useEffect } from 'react';
import MarketingNavbar from '@/components/MarketingNavbar';
import MarketingFooter from '@/components/MarketingFooter';
import Link from 'next/link';
import { Check, Info, ShieldCheck, HelpCircle } from 'lucide-react';

type DynamicPlan = { id: string; name: string; price: string; days: number; description: string; badge: string };

export default function PricingPage() {
  const [plans, setPlans] = useState<DynamicPlan[]>([]);

  useEffect(() => {
    fetch('/api/plans').then(r => r.json()).then(setPlans).catch(() => {});
  }, []);

  const fallbackPlans: DynamicPlan[] = [
    {
      id: '30',
      name: 'Trial Package',
      price: '499',
      days: 30,
      description: 'Ideal for testing storefront layouts and AI catalog guidelines.',
      badge: ''
    },
    {
      id: '365',
      name: 'Professional Pack',
      price: '3999',
      days: 365,
      description: 'Our most popular tier for growing small shops and local retailers.',
      badge: 'Most Popular'
    },
    {
      id: 'lifetime',
      name: 'Lifetime Plan',
      price: '9999',
      days: 99999,
      description: 'Ultimate value for established merchants seeking permanent store setups.',
      badge: 'Best Value'
    }
  ];

  const planFeatures: Record<string, string[]> = {
    '30': [
      'Complete Storefront access',
      '1 Template selection',
      'AI Assistant dashboard guidance',
      'Basic order tracking',
      'Direct UPI Payments'
    ],
    '365': [
      'Complete Storefront access',
      'Select from all 5 Templates',
      'Full AI Assistant guide panel',
      'Fulfillment & Blue invoices in words',
      'WhatsApp alerts & tracking codes',
      'Custom Domain support'
    ],
    'lifetime': [
      'Everything in Professional Pack',
      'Lifetime access (no renewals)',
      'Priority customer hotline access',
      'Advanced templates premium support',
      'Unlimited products & coupons'
    ]
  };

  const displayPlans = plans.length > 0 ? plans : fallbackPlans;

  const faqs = [
    {
      question: 'How are UPI payments verified?',
      answer: 'After you scan the dynamic payment QR code or copy the VPA ID and complete the payment in your banking app, simply upload the payment confirmation screenshot in the setup wizard. Our support administrators verify the transaction details offline and activate your merchant credentials immediately.'
    },
    {
      question: 'Why does GPay or PhonePe show a warning for the payment link?',
      answer: 'When opening newly generated custom VPA deep-links in mobile payment apps, NPCI standards prompt default security popups like "Unverified Merchant URL" to ensure security. RWeb payment transfers are fully verified. You can copy the merchant VPA ID (creva@ybl) and complete payments manually inside your UPI app to bypass these checks.'
    },
    {
      question: 'Are there any transaction fees or commission cuts?',
      answer: 'No. RWeb does not act as a payment gateway intermediary. Payments go directly from your customers to your configured UPI accounts, ensuring zero hidden fees, zero commission percentages, and instant settlement.'
    },
    {
      question: 'Can I connect a custom domain name later?',
      answer: 'Yes! While on the Professional or Lifetime packages, you can map your custom commercial domain (e.g. www.yourbrand.com) directly to your RWeb storefront from your dashboard settings at any time.'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-800 font-sans antialiased pt-20 relative overflow-x-hidden">
      <MarketingNavbar />

      <main className="flex-1 relative z-10 py-16 md:py-24 max-w-7xl mx-auto px-6 w-full">
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
            Plans & Pricing
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-slate-900 leading-tight">
            Transparent Pricing. Zero Transaction Fees.
          </h1>
          <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto">
            Select a package that fits your storefront scale. All payments are settled directly into your accounts without commissions.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-24">
          {displayPlans.map((p) => {
            const features = planFeatures[p.id] || [
              'Complete Storefront access',
              'AI Assistant dashboard guidance',
              'Direct UPI Payments'
            ];
            const isPopular = p.badge?.toLowerCase().includes('popular') || p.badge?.toLowerCase().includes('best') || p.badge?.toLowerCase().includes('value');

            return (
              <div 
                key={p.id}
                className={`p-8 bg-white border rounded-2xl flex flex-col justify-between relative shadow-sm transition-all duration-200 ${
                  isPopular 
                    ? 'border-blue-600 shadow-[0_10px_30px_rgba(37,99,235,0.06)]' 
                    : 'border-slate-200 hover:border-slate-350'
                }`}
              >
                {p.badge && (
                  <span className="absolute -top-3 left-6 bg-blue-600 text-white font-bold text-[9px] uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                    {p.badge}
                  </span>
                )}

                <div className="space-y-6">
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{p.name}</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-4xl font-black text-slate-900">₹{Number(p.price || 0).toLocaleString()}</span>
                      <span className="text-xs text-slate-450 font-semibold">
                        {p.days >= 99999 ? '/ lifetime' : p.days >= 365 ? `/ ${Math.round(p.days / 365)} yr` : `/ ${p.days} days`}
                      </span>
                    </div>
                    {p.description && (
                      <p className="text-xs text-slate-500 mt-4 leading-relaxed">{p.description}</p>
                    )}
                  </div>

                  <hr className="border-slate-100" />

                  <ul className="space-y-4 text-xs text-slate-600 font-medium text-left">
                    {features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-blue-650 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <Link
                    href="/register"
                    className={`w-full h-11 flex items-center justify-center rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-150 ${
                      isPopular
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                        : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    Choose {p.name}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Structured FAQs / Safety Guidelines Section */}
        <div className="border border-slate-200/80 rounded-2xl bg-white p-8 max-w-4xl mx-auto text-left space-y-8">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base text-slate-900">Frequently Asked Questions</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {faqs.map((faq, i) => (
              <div key={i} className="space-y-2">
                <h4 className="font-bold text-xs text-slate-800">{faq.question}</h4>
                <p className="text-slate-500 text-xs leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
