'use client';

import { useState } from 'react';
import MarketingNavbar from '@/components/MarketingNavbar';
import MarketingFooter from '@/components/MarketingFooter';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TemplatesPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const router = useRouter();

  const templates = [
    { id: 'minimal', name: 'Minimal Elegance', desc: 'Clean, modern black & white design for premium boutique brands', path: '/templates/preview?template=minimal', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800' },
    { id: 'artisan', name: 'Artisan Craft', desc: 'Warm, hand-crafted organic classic serif aesthetic for natural goods', path: '/templates/preview?template=artisan', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800' },
    { id: 'bold', name: 'Bold Commerce', desc: 'Vibrant, high-contrast flat grid layout design that demands attention', path: '/templates/preview?template=bold', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800' },
    { id: 'luxe', name: 'Dark Luxe', desc: 'Exclusive gold details on a pitch black premium luxury storefront', path: '/templates/preview?template=luxe', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800' },
    { id: 'retro', name: 'Retro Grid', desc: 'Space-grotesk flat shadow neon creative layout with pop art details', path: '/templates/preview?template=retro', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800' }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-800 font-sans antialiased pt-20 relative overflow-x-hidden">
      <MarketingNavbar />

      <main className="flex-1 relative z-10 py-16 md:py-24 max-w-7xl mx-auto px-6 w-full">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
            Designs
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-slate-900 leading-tight">
            Tailored E-Commerce Visual Systems
          </h1>
          <p className="text-slate-500 text-sm sm:text-base max-w-md mx-auto">
            Select a theme to instantly match your store's style guidelines. Click any template card below to open its live interactive layout.
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-stretch mb-20">
          {templates.map((template, idx) => (
            <div 
              key={template.id} 
              onClick={() => {
                setPreviewUrl(template.path);
                setSelectedTemplateId(template.id);
              }}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm transition-all hover:border-blue-500/30 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between cursor-pointer"
            >
              <div className="aspect-[4/3] relative overflow-hidden bg-slate-50 border-b border-slate-100">
                <img 
                  src={template.image} 
                  alt={template.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold uppercase tracking-wider bg-blue-600 px-4 py-2 rounded-lg shadow-md transform translate-y-3 group-hover:translate-y-0 transition-transform">
                    Preview Layout
                  </span>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between text-left">
                <div>
                  <span className="text-[9px] font-bold text-blue-600 tracking-wider uppercase mb-1 block">Template 0{idx + 1}</span>
                  <h3 className="font-bold text-base mb-2 text-slate-900">{template.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{template.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
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
