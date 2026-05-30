'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo, Suspense } from 'react';
import StorefrontClient from '@/app/store/[subdomain]/StorefrontClient';

function PreviewContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template') || 'minimal';

  // Construct a premium mock store metadata & color preset matching the selected template
  const mockStore = useMemo(() => {
    switch (templateId) {
      case 'artisan':
        return {
          id: 'demo-artisan',
          store_name: 'The Clay Studio',
          logo_url: '',
          primary_color: '#8B5A2B',
          currency: 'USD',
          description: JSON.stringify({
            selectedTemplate: 'artisan',
            description: 'Hand-thrown ceramics and organic apothecary crafted in small batches.',
            announcement: '🌿 ALL HANDMADE APOTHECARY ITEMS ARE BACK IN STOCK 🌿',
            instagram: 'https://instagram.com',
            facebook: 'https://facebook.com',
            twitter: 'https://twitter.com'
          })
        };
      case 'bold':
        return {
          id: 'demo-bold',
          store_name: 'KINETIC™ Gear',
          logo_url: '',
          primary_color: '#E11D48',
          currency: 'USD',
          description: JSON.stringify({
            selectedTemplate: 'bold',
            description: 'High-performance outerwear and streetwear crafted for movement.',
            announcement: '⚡️ METROPOLIS V1 DROP IS NOW LIVE — SECURE YOUR PIECES ⚡️',
            instagram: 'https://instagram.com',
            facebook: 'https://facebook.com',
            twitter: 'https://twitter.com'
          })
        };
      case 'luxe':
        return {
          id: 'demo-luxe',
          store_name: 'AURELIA Fine Jewelry',
          logo_url: '',
          primary_color: '#D4AF37',
          currency: 'USD',
          description: JSON.stringify({
            selectedTemplate: 'luxe',
            description: 'Exquisite fine jewelry and high-end accessories crafted in 18k gold.',
            announcement: '✨ MEMBERS-ONLY PRIVATE SALE: COMPLIMENTARY EXPEDITED SHIPPING ✨',
            instagram: 'https://instagram.com',
            facebook: 'https://facebook.com',
            twitter: 'https://twitter.com'
          })
        };
      case 'retro':
        return {
          id: 'demo-retro',
          store_name: 'NEON RADICAL',
          logo_url: '',
          primary_color: '#8B5CF6',
          currency: 'USD',
          description: JSON.stringify({
            selectedTemplate: 'retro',
            description: 'Vintage hardware, neon goods, and lo-fi gadgets for creative spaces.',
            announcement: '📟 RADICAL DROP: GET A FREE STICKER PACK WITH EVERY RAD DETECTOR 📟',
            instagram: 'https://instagram.com',
            facebook: 'https://facebook.com',
            twitter: 'https://twitter.com'
          })
        };
      case 'minimal':
      default:
        return {
          id: 'demo-minimal',
          store_name: 'Studio Minimal',
          logo_url: '',
          primary_color: '#000000',
          currency: 'USD',
          description: JSON.stringify({
            selectedTemplate: 'minimal',
            description: 'Curated objects and apparel for modern living. Designed in Copenhagen.',
            announcement: '✨ ARCHIVE SALE: UP TO 50% OFF SELECT HOME ITEMS ✨',
            instagram: 'https://instagram.com',
            facebook: 'https://facebook.com',
            twitter: 'https://twitter.com'
          })
        };
    }
  }, [templateId]);

  // Set the CSS variables for the preview storefront's primary color
  const customStyles = {
    '--store-primary': mockStore.primary_color,
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans" style={customStyles}>
      {/* Dynamic Storefront Client rendering in absolute high-fidelity preview mode */}
      <StorefrontClient store={mockStore} products={[]} />

      {/* Simple Preview Footer */}
      <footer className="mt-auto border-t bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
          <p className="mb-2 font-bold text-gray-900">{mockStore.store_name}</p>
          <p className="text-xs text-muted-foreground">Demo Interactive Storefront Preview • Powered by StoreBuilder</p>
        </div>
      </footer>
    </div>
  );
}

export default function TemplatePreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-sans">Loading dynamic preview...</div>}>
      <PreviewContent />
    </Suspense>
  );
}

