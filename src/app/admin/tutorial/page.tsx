'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  PlayCircle, BookOpen, Package, Palette, Globe, ShoppingBag, 
  ChevronRight, Sparkles, CheckCircle2, ArrowRight
} from 'lucide-react';

export default function TutorialsPage() {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const toggleStep = (stepId: string) => {
    if (completedSteps.includes(stepId)) {
      setCompletedSteps(completedSteps.filter(id => id !== stepId));
    } else {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const steps = [
    {
      id: 'products',
      title: '1. Catalog Setup: Add Your Products',
      desc: 'Populate your digital catalog with names, pricing, SKUs, inventory counts, and rich descriptions.',
      link: '/admin/products',
      btnText: 'Go to Products Catalog',
      icon: Package,
      iconColor: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20'
    },
    {
      id: 'appearance',
      title: '2. Storefront Branding & Styling',
      desc: 'Customize your primary colors, upload your custom logo, and select modern design styles.',
      link: '/admin/appearance',
      btnText: 'Customize Layout & Theme',
      icon: Palette,
      iconColor: 'text-pink-500 bg-pink-500/10 border-pink-500/20'
    },
    {
      id: 'domain',
      title: '3. Custom Domain & settings',
      desc: 'Map your custom commercial domain or customize your primary subdomain details to launch.',
      link: '/admin/settings',
      btnText: 'Configure Store Domain',
      icon: Globe,
      iconColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      id: 'orders',
      title: '4. Orders & Invoicing Workflow',
      desc: 'Keep track of sales orders, verify payment screenshots, and trigger real-time WhatsApp updates.',
      link: '/admin/orders',
      btnText: 'Check Sales Orders',
      icon: ShoppingBag,
      iconColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-border/40">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <Sparkles className="w-3.5 h-3.5" /> Tutorial Portal
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-3">
            🏪 Merchant Training Center
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Watch the video setup tutorial below and complete the setup checklist to launch your e-commerce storefront.
          </p>
        </div>
        <Link 
          href="/admin"
          className="flex items-center gap-1.5 bg-muted hover:bg-muted/80 text-foreground px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all self-start md:self-auto border border-border shadow-sm"
        >
          Back to Dashboard
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Video Theater Mode - Occupies 2 columns on desktop */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card text-card-foreground rounded-2xl border border-border/50 shadow-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border/40 bg-muted/20 flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-amber-500" />
              <span className="text-xs font-black uppercase tracking-wider">Video Guide: Quick Start Storefront Setup</span>
            </div>

            {/* Widescreen 16:9 Aspect Video Embed Container */}
            <div className="relative w-full aspect-video bg-black shadow-inner">
              <iframe 
                className="absolute inset-0 w-full h-full border-none"
                src="https://www.youtube.com/embed/7V2eS8W1cCc"
                title="Creva Merchant Storefront Setup Tutorial Guide"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>

            <div className="p-5 space-y-3">
              <h3 className="font-bold text-base">Creva SaaS Storefront Walkthrough Video</h3>
              <p className="text-xs text-muted-foreground leading-relaxed text-justify">
                This comprehensive guide covers everything you need to set up your online store. You will learn how to create your account, configure templates, add your initial product collection, map your custom domains, and manage client orders securely in the admin dashboard panel.
              </p>
            </div>
          </div>

          {/* Quick Tips Box */}
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-5 flex gap-4 text-xs leading-relaxed text-left items-start">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
              💡
            </div>
            <div className="space-y-1">
              <strong className="text-foreground block font-bold text-sm">💡 Quick Merchant Tips:</strong>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Remember, subscription plans do not bill you automatically. To renew, simply click the <strong>Enquire</strong> buttons under your active subscriptions panel to request WhatsApp payments directly. Keep your products lists updated to keep customers engaged!
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Steps Checklist - Occupies 1 column */}
        <div className="space-y-6">
          <div className="bg-card text-card-foreground rounded-2xl border border-border/50 p-6 shadow-md space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b pb-3 border-border/40">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Store Launch List
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Complete these 4 steps to launch successfully.</p>
              </div>

              {/* Steps Progress */}
              <div className="space-y-4">
                {steps.map((step) => {
                  const isCompleted = completedSteps.includes(step.id);
                  const StepIcon = step.icon;
                  return (
                    <div 
                      key={step.id} 
                      className={`p-4 rounded-xl border transition-all flex flex-col gap-3 text-left ${
                        isCompleted 
                          ? 'bg-emerald-500/5 border-emerald-500/20 shadow-sm' 
                          : 'bg-muted/30 border-border/60 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className={`p-2 rounded-lg border ${step.iconColor} shrink-0`}>
                          <StepIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-xs font-bold truncate ${isCompleted ? 'text-emerald-700 dark:text-emerald-400 line-through opacity-70' : 'text-foreground'}`}>
                            {step.title}
                          </h4>
                          <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">{step.desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleStep(step.id)}
                          className="shrink-0 focus:outline-none"
                        >
                          <CheckCircle2 className={`w-5 h-5 transition-all ${isCompleted ? 'text-emerald-500 fill-emerald-500' : 'text-muted-foreground/45 hover:text-muted-foreground'}`} />
                        </button>
                      </div>

                      <Link 
                        href={step.link}
                        className={`flex items-center justify-between text-[10px] font-black uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all ${
                          isCompleted 
                            ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20' 
                            : 'bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm'
                        }`}
                      >
                        <span>{step.btnText}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Checklist Progress Meter */}
            <div className="bg-muted/40 p-4 border rounded-xl space-y-2 mt-4 text-left">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                <span>Checklist Progress</span>
                <span>{completedSteps.length} of {steps.length} Done</span>
              </div>
              <div className="w-full bg-muted border border-border h-2 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500 rounded-full" 
                  style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
                ></div>
              </div>
              {completedSteps.length === steps.length && (
                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-center mt-2 flex items-center justify-center gap-1 animate-bounce">
                  🎉 Ready to Launch!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
