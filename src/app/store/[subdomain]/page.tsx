import { notFound } from 'next/navigation';
import { ShoppingCart, Menu, Search, Star } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching for preview

import StorefrontClient from './StorefrontClient';
import StorePaused from '@/components/store/StorePaused';
import StoreExpired from '@/components/store/StoreExpired';

export async function generateMetadata({ params }: { params: { subdomain: string } }) {
  const { data: store } = await supabase
    .from('stores')
    .select('store_name, logo_url')
    .eq('subdomain', params.subdomain)
    .single();

  return {
    title: store?.store_name || 'Storefront',
    icons: {
      icon: store?.logo_url || '/favicon.ico',
      apple: store?.logo_url || '/favicon.ico',
    }
  };
}

export default async function StorefrontPage({ params }: { params: { subdomain: string } }) {
  // 1. Fetch store data based on subdomain
  const { data: store, error } = await supabase
    .from('stores')
    .select('*')
    .eq('subdomain', params.subdomain)
    .single();

  if (error || !store) {
    notFound();
  }

  // Check if storefront is paused by super admin
  let paymentStatus = null;
  try {
    if (store.description && store.description.trim().startsWith('{')) {
      const parsed = JSON.parse(store.description);
      paymentStatus = parsed.paymentStatus;
    }
  } catch (e) {}

  if (store.is_paused === true) {
    return <StorePaused storeName={store.store_name} paymentStatus={paymentStatus} />;
  }

  // Check if subscription has expired
  if (store.subscription_expires_at && new Date(store.subscription_expires_at) < new Date()) {
    return <StoreExpired storeName={store.store_name} planExpiresAt={store.subscription_expires_at} />;
  }

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', store.id)
    .eq('is_active', true);

  const { data: vsPsData } = await supabase.from('platform_settings').select('*').eq('key', `video_sessions_${store.id}`);
  const videoSessions: any[] = vsPsData?.[0]?.value ? (() => { try { return JSON.parse(vsPsData[0].value); } catch { return []; } })() : [];

  // Set CSS variables for the store's primary color
  const customStyles = {
    '--store-primary': store.primary_color || '#3B82F6',
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans" style={customStyles}>
      <StorefrontClient store={store} products={products || []} videoSessions={videoSessions || []} />
      
      {/* Simple Footer */}
      <footer className="mt-auto border-t bg-white py-12">
        <div className="max-w-[95%] xl:max-w-[1550px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
          <p className="mb-4 font-bold text-gray-900">{store.store_name}</p>
          <p className="text-sm">Powered by Creva Webzz © 2026</p>
        </div>
      </footer>
    </div>
  );
}
