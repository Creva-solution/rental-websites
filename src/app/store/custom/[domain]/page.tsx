import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import StorefrontClient from '../../[subdomain]/StorefrontClient';

export const revalidate = 0; // Dynamic server-side rendering for storefront

export async function generateMetadata({ params }: { params: { domain: string } }) {
  const decodedDomain = params.domain.replace(/_dot_/g, '.');
  const cleanDomain = decodedDomain.replace('www.', '').toLowerCase();
  
  const { data: store } = await supabase
    .from('stores')
    .select('store_name, logo_url')
    .or(`custom_domain.eq.${cleanDomain},custom_domain.eq.www.${cleanDomain}`)
    .single();

  return {
    title: store?.store_name || 'Storefront',
    icons: {
      icon: store?.logo_url || '/favicon.ico',
      apple: store?.logo_url || '/favicon.ico',
    }
  };
}

export default async function CustomDomainStorefrontPage({ params }: { params: { domain: string } }) {
  const decodedDomain = params.domain.replace(/_dot_/g, '.');
  const cleanDomain = decodedDomain.replace('www.', '').toLowerCase();
  
  // Fetch store data based on custom domain (matching both apex and www)
  const { data: store, error } = await supabase
    .from('stores')
    .select('*')
    .or(`custom_domain.eq.${cleanDomain},custom_domain.eq.www.${cleanDomain}`)
    .single();

  if (error || !store) {
    notFound();
  }

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', store.id)
    .eq('is_active', true);

  const customStyles = {
    '--store-primary': store.primary_color || '#3B82F6',
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans" style={customStyles}>
      <StorefrontClient store={store} products={products || []} />
      
      {/* Simple Footer */}
      <footer className="mt-auto border-t bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
          <p className="mb-4 font-bold text-gray-900">{store.store_name}</p>
          <p className="text-sm">Powered by StoreBuilder © 2026</p>
        </div>
      </footer>
    </div>
  );
}
