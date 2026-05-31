'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, Package, ShoppingCart, Settings, Palette, ExternalLink, Loader2, AlertCircle, CreditCard, Menu, X
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [storeUrl, setStoreUrl] = useState<string>('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!store) return;
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port ? `:${window.location.port}` : '';
    
    let url = '';
    if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
      url = `${protocol}//${store.subdomain}.localhost${port}`;
    } else {
      url = `${protocol}//${store.subdomain}.crevasolution.in`;
    }
    setStoreUrl(url);
  }, [store]);

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

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

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
    <div className="min-h-screen bg-muted/20 flex w-full relative">
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)} 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out md:hidden ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <Link href="/" className="font-bold text-xl text-primary">Creva Webzz</Link>
          <button 
            type="button" 
            onClick={() => setIsMobileOpen(false)}
            className="p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </button>
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
          <Link href="/admin/subscription" className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname === '/admin/subscription' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}>
            <CreditCard className="w-[18px] h-[18px]" /> Subscription
          </Link>
        </nav>
        <div className="p-4 border-t border-border bg-muted/20">
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
      </aside>

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-background border-r border-border hidden md:flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/" className="font-bold text-xl text-primary">Creva Webzz</Link>
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
          <Link href="/admin/subscription" className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname === '/admin/subscription' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}>
            <CreditCard className="w-[18px] h-[18px]" /> Subscription
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
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-border bg-background flex-shrink-0">
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={() => setIsMobileOpen(true)}
              className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors md:hidden"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-base sm:text-xl font-bold capitalize truncate max-w-[150px] sm:max-w-none">
              {pathname === '/admin' ? 'Dashboard Overview' : pathname.replace('/admin/', '')}
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary/90 font-medium transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> <span className="hidden sm:inline">View Store</span>
            </a>
            <button onClick={handleLogout} className="text-xs sm:text-sm bg-muted px-3 py-2 rounded-md hover:bg-muted/80 font-medium transition-colors">
              Log out
            </button>
          </div>
        </header>

        {store.is_paused && (() => {
          let paymentStatus = null;
          try {
            if (store.description && store.description.trim().startsWith('{')) {
              const parsed = JSON.parse(store.description);
              paymentStatus = parsed.paymentStatus;
            }
          } catch (e) {}

          if (paymentStatus === 'rejected') {
            return (
              <div className="bg-red-50 border-b border-red-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-800">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <div className="text-xs">
                    <strong className="block font-bold">🚨 Onboarding Payment Screenshot Rejected</strong>
                    Our verification compliance team reviewed and rejected your payment screenshot (marked as invalid or unverified). Please re-upload a valid receipt immediately to activate your storefront.
                  </div>
                </div>
                <Link 
                  href="/admin/subscription" 
                  className="text-[10px] uppercase font-black tracking-widest text-red-900 bg-red-500/10 border border-red-500/25 px-3 py-1.5 rounded-lg hover:bg-red-500/20 self-start sm:self-auto shrink-0 transition-all font-sans"
                >
                  Re-Upload Screenshot
                </Link>
              </div>
            );
          }

          return (
            <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-800">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="text-xs">
                  <strong className="block font-bold">Storefront Under Verification Review</strong>
                  Your payment screenshot is currently being reviewed by our verification compliance team. Your customer facing storefront remains in paused maintenance mode until approved.
                </div>
              </div>
              <Link 
                href="/admin/subscription" 
                className="text-[10px] uppercase font-black tracking-widest text-amber-900 bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 rounded-lg hover:bg-amber-500/20 self-start sm:self-auto shrink-0 transition-all"
              >
                Check Setup Details
              </Link>
            </div>
          );
        })()}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
