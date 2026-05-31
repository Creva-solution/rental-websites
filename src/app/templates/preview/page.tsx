'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo, useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import StorefrontClient from '@/app/store/[subdomain]/StorefrontClient';

const unifiedMockStore = {
  id: 'demo-unified',
  store_name: 'CREVA Collective',
  logo_url: '',
  primary_color: '#3B82F6',
  currency: 'USD',
  description: JSON.stringify({
    selectedTemplate: 'minimal',
    description: 'Curated premium lifestyle items crafted for modern daily living.',
    announcement: '✨ INTRODUCING OUR LATEST CAPSULE COLLECTION — ENJOY COMPLIMENTARY SHIPPING ✨',
    banners: [
      {
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200',
        title: 'The Modern Era of Style',
        subtitle: 'Refined utilitarianism designed for daily life. Handcrafted with premium textiles.',
        cta: 'EXPLORE COLLECTIONS'
      },
      {
        image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1200',
        title: 'Artisanal Clay & Stoneware',
        subtitle: 'Hand-thrown ceramics created in collaboration with local master potter community.',
        cta: 'SHOP ARTISAN GOODS'
      }
    ],
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
    twitter: 'https://twitter.com'
  })
};

function PreviewContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template') || 'minimal';

  const [realStore, setRealStore] = useState<any>(null);
  const [realProducts, setRealProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMerchantData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: storeData } = await supabase
            .from('stores')
            .select('*')
            .eq('owner_id', user.id)
            .single();

          if (storeData) {
            setRealStore(storeData);

            const { data: productsData } = await supabase
              .from('products')
              .select('*')
              .eq('store_id', storeData.id);

            if (productsData) {
              setRealProducts(productsData);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch custom preview data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMerchantData();
  }, []);

  // Construct a premium store metadata & color preset matching the selected template
  const activeStore = useMemo(() => {
    const baseStore = realStore || unifiedMockStore;
    
    // Parse current description
    let currentDescObj: any = {};
    try {
      if (baseStore.description && baseStore.description.startsWith('{')) {
        currentDescObj = JSON.parse(baseStore.description);
      } else {
        currentDescObj = { description: baseStore.description || '' };
      }
    } catch (e) {
      currentDescObj = { description: baseStore.description || '' };
    }

    // Override the template layout selection with the currently previewed template
    currentDescObj.selectedTemplate = templateId;
    currentDescObj.template = templateId;

    // Preserve the merchant's real banners, color, logo etc, but enforce the current template
    return {
      ...baseStore,
      description: JSON.stringify(currentDescObj)
    };
  }, [realStore, templateId]);

  // Set the CSS variables for the preview storefront's primary color
  const customStyles = {
    '--store-primary': activeStore.primary_color || '#3B82F6',
  } as React.CSSProperties;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] text-zinc-600 font-sans gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B5A2B]" />
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Loading custom preview...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans" style={customStyles}>
      {/* Dynamic Storefront Client rendering in absolute high-fidelity preview mode */}
      <StorefrontClient store={activeStore} products={realProducts} />

      {/* Simple Preview Footer */}
      <footer className="mt-auto border-t bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
          <p className="mb-2 font-bold text-gray-900">{activeStore.store_name}</p>
          <p className="text-xs text-muted-foreground">Demo Interactive Storefront Preview • Powered by Creva Webzz</p>
        </div>
      </footer>
    </div>
  );
}

export default function TemplatePreviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] text-zinc-600 font-sans gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B5A2B]" />
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Initializing preview engine...</span>
      </div>
    }>
      <PreviewContent />
    </Suspense>
  );
}
