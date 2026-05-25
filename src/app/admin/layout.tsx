'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, Package, ShoppingCart, Settings, Palette, ExternalLink, Loader2, AlertCircle 
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      
      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .single();
        
      setStore(storeData);
      setLoading(false);
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-muted/20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4 text-center">
        <div className="max-w-md space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">No store found</h2>
          <p className="text-muted-foreground">You haven't set up a store yet. Let's get started!</p>
          <Link href="/register" className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium">Create Store</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex w-full">
      <aside className="w-64 bg-background border-r border-border hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/" className="font-bold text-xl text-primary">StoreBuilder</Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <Link href="/admin" className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname === '/admin' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}>
            <LayoutDashboard className="w-[18px] h-[18px]" /> Dashboard
          </Link>
          <Link href="/admin/products" className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname === '/admin/products' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}>
            <Package className="w-[18px] h-[18px]" /> Products
          </Link>
          <Link href="/admin/orders" className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname === '/admin/orders' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}>
            <ShoppingCart className="w-[18px] h-[18px]" /> Orders
          </Link>
          <Link href="/admin/appearance" className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname === '/admin/appearance' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}>
            <Palette className="w-[18px] h-[18px]" /> Appearance
          </Link>
          <Link href="/admin/settings" className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname === '/admin/settings' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}>
            <Settings className="w-[18px] h-[18px]" /> Settings
          </Link>
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs flex-shrink-0">
                {store.store_name?.[0]?.toUpperCase() || 'S'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{store.store_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background">
          <h1 className="text-xl font-bold capitalize">
            {pathname === '/admin' ? 'Dashboard Overview' : pathname.replace('/admin/', '')}
          </h1>
          <div className="flex items-center gap-4">
            <Link href={`/store/${store.subdomain}`} target="_blank" className="text-sm flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 font-medium transition-colors">
              <ExternalLink className="w-4 h-4" /> View Store
            </Link>
            <button onClick={handleLogout} className="text-sm bg-muted px-4 py-2 rounded-md hover:bg-muted/80 font-medium transition-colors">
              Log out
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
