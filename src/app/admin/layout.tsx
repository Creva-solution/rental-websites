'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, Package, ShoppingCart, Settings, Palette, ExternalLink, Loader2, AlertCircle, CreditCard, Menu, X, PlayCircle,
  Truck, Users, FolderTree, Video, FileText, Layout, BarChart3, Tag, HelpCircle, LogOut, Sparkles, Megaphone, Plug,
  Maximize2, Minimize2, Bell, Globe, ChevronDown, User
} from 'lucide-react';
import StoreAssistant from '@/components/StoreAssistant';
import CrevaWebzLoader from '@/components/CrevaWebzLoader';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(true);
  const [store, setStore] = useState<any>(null);
  const [aiStudioEnabled, setAiStudioEnabled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [storeUrl, setStoreUrl] = useState<string>('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState<any>(null);
  const [knownOrdersCount, setKnownOrdersCount] = useState<number | null>(null);

  // Redesigned SaaS Header states & helpers
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.header-dropdown-trigger') || target.closest('.header-dropdown-container')) {
        return;
      }
      setShowProfileDropdown(false);
      setShowNotifications(false);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed:", err);
    }
  };

  const playNotificationChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // First note: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0.12, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.12);
      
      // Second note: A5 (880.00 Hz) - slightly delayed
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1);
      gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Audio Context failed to play chime:", e);
    }
  };

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
    if (!store?.id) return;
    fetch(`/api/backend/notifications?for_role=owner&store_id=${store.id}`, { cache: 'no-store' })
      .then(r => r.json())
      .then((rows: any[]) => {
        if (!Array.isArray(rows)) return;
        const mapped = rows.map(n => ({
          id: n.id,
          title: n.title,
          description: n.body ?? '',
          time: n.created_at ? new Date(n.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '',
          read: !!n.is_read,
        }));
        setNotifications(mapped);
      })
      .catch(() => {});
  }, [store?.id]);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        if (user.role === 'superadmin') {
          router.push('/superadmin');
          return;
        }
        setUser(user);
        
        const { data: storeData } = await supabase
          .from('stores')
          .select('*')
          .eq('owner_id', user.id)
          .neq('subdomain', '__creva_saas_global_settings__')
          .maybeSingle();
          
        setStore(storeData || null);
        
        // Fetch global settings
        const { data: globalSettings } = await supabase
          .from('stores')
          .select('description')
          .eq('subdomain', '__creva_saas_global_settings__')
          .maybeSingle();

        if (globalSettings?.description) {
          try {
            const parsed = JSON.parse(globalSettings.description);
            const gi = parsed.globalIntegrations || {};
            setAiStudioEnabled(!!gi.aiContentStudio);
          } catch (e) {
            console.error("Failed to parse global settings:", e);
          }
        }

        if (!storeData) {
          setShowLoader(false);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    if (!store) return;
    
    // Initial fetch to seed known orders count
    const seedOrders = async () => {
      try {
        const { data } = await supabase
          .from('orders')
          .select('id')
          .eq('store_id', store.id);
        if (data) {
          setKnownOrdersCount(data.length);
        }
      } catch (e) {}
    };
    seedOrders();

    // Auto-refresh order polling interval (every 60 seconds)
    const interval = setInterval(async () => {
      try {
        const { data: latestOrders } = await supabase
          .from('orders')
          .select('*')
          .eq('store_id', store.id)
          .order('created_at', { ascending: false });

        if (latestOrders && Array.isArray(latestOrders)) {
          if (knownOrdersCount !== null && latestOrders.length > knownOrdersCount) {
            // New order received!
            const newOrder = latestOrders[0];
            setNewOrderAlert(newOrder);
            playNotificationChime();
          }
          setKnownOrdersCount(latestOrders.length);
        }
      } catch (err) {
        console.warn("Real-time orders sync check failed:", err);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [store, knownOrdersCount]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navigationGroups = [
    {
      title: "Catalog & Sales",
      items: [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
        { href: "/admin/customers", label: "Customers", icon: Users },
        { href: "/admin/products", label: "Products", icon: Package },
        { href: "/admin/categories", label: "Categories", icon: FolderTree },
        { href: "/admin/video-commerce", label: "Video Commerce", icon: Video }
      ]
    },
    {
      title: "Store Styling & Content",
      items: [
        { href: "/admin/appearance", label: "Appearance", icon: Palette },
        { href: "/admin/pages", label: "Content", icon: Layout },
        { href: "/admin/discounts", label: "Offers & Coupons", icon: Tag },
        { href: "/admin/ai-content-studio", label: "AI Content Studio", icon: Sparkles },
        { href: "/admin/marketing-hub", label: "Marketing Hub", icon: Megaphone }
      ]
    },
    {
      title: "Business Operations",
      items: [
        { href: "/admin/reports", label: "Analytics", icon: BarChart3 },
        { href: "/admin/subscription", label: "Subscription", icon: CreditCard },
        { href: "/admin/integrations", label: "Integrations", icon: Plug },
        { href: "/admin/settings", label: "Settings", icon: Settings },
        { href: "/admin/tutorial", label: "Tutorial Video", icon: PlayCircle }
      ]
    }
  ];

  const filteredNavigationGroups = navigationGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (item.href === "/admin/marketing-hub") {
        return store?.marketing_hub_enabled !== false;
      }
      if (item.href === "/admin/ai-content-studio") {
        return aiStudioEnabled;
      }
      return true;
    })
  }));

  return (
    <>
      {showLoader && (
        <CrevaWebzLoader
          isAppReady={!loading && !!store}
          onFadeOutComplete={() => setShowLoader(false)}
        />
      )}

      {!loading && !store && (
        <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4 text-center">
          <div className="max-w-md space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">No store found</h2>
            <p className="text-muted-foreground">You haven't set up a store yet. Let's get started!</p>
            <Link href="/register" className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium">Create Store</Link>
          </div>
        </div>
      )}

      {store && (
        <div 
          className={`h-screen bg-muted/20 flex w-full relative overflow-hidden transition-opacity duration-700 ease-out ${
            loading ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
      {/* Flash Screen Overlay Alert for New Orders */}
      {newOrderAlert && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          {/* Glowing subtle background spots */}
          <div className="absolute w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -translate-x-16 -translate-y-16 pointer-events-none" />
          <div className="absolute w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl translate-x-16 translate-y-16 pointer-events-none" />
          
          <div className="relative bg-slate-900/95 text-slate-100 rounded-3xl border border-slate-800 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] w-full max-w-sm p-6 space-y-6 text-center animate-in zoom-in-95 duration-300">
            {/* Top glowing success badge */}
            <div className="relative w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white rounded-2xl flex items-center justify-center mx-auto shadow-[0_8px_20px_rgba(16,185,129,0.35)] rotate-3 hover:rotate-0 transition-transform duration-350 cursor-default">
              <ShoppingCart className="w-7 h-7" />
              {/* Outer pulsing ring */}
              <div className="absolute -inset-1.5 rounded-2xl border-2 border-emerald-500/35 animate-ping pointer-events-none" />
            </div>
            
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Live Cloud Sync
              </span>
              <h2 className="text-xl font-black tracking-tight text-white mt-2">New Order Received!</h2>
              <p className="text-xs text-slate-400">Order details loaded from live cloud sync.</p>
            </div>
            
            <div className="bg-slate-950/70 p-5 rounded-2xl space-y-3 text-left border border-slate-800/80 shadow-inner">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer Details</p>
                <p className="text-xs font-black text-slate-200 mt-1 truncate">{newOrderAlert.customer_name || 'Anonymous Customer'}</p>
              </div>
              <div className="h-px bg-slate-800/60 w-full" />
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Order Total</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Includes local taxes</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                    {store.currency === 'USD' ? '$' : '₹'}{Number(newOrderAlert.total_amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setNewOrderAlert(null)} 
                className="flex-1 bg-slate-800 hover:bg-slate-750 border border-slate-750 text-slate-300 hover:text-white px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-200 cursor-pointer shadow-sm"
              >
                Dismiss
              </button>
              <Link 
                href="/admin/orders" 
                onClick={() => setNewOrderAlert(null)} 
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-600 text-white shadow-[0_4px_15px_rgba(37,99,235,0.35)] px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-center transition-all duration-200 hover:scale-[1.02]"
              >
                View
              </Link>
            </div>
          </div>
        </div>
      )}
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
          <Link href="/" className="flex items-center">
            <span className="inline-flex items-center">
              <img src="/logo-creva.svg" alt="Creva Webzz" className="h-7 w-auto object-contain" />
            </span>
          </Link>
          <button 
            type="button" 
            onClick={() => setIsMobileOpen(false)}
            className="p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin">
          {filteredNavigationGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2 text-left">
              <span className="text-[9px] font-black text-[#3C77C3] tracking-[0.15em] uppercase px-3 opacity-80 block">
                {group.title}
              </span>
              <div className="space-y-1">
                {group.items.map((item, iIdx) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={iIdx}
                      href={item.href}
                      className={`relative flex items-center gap-3 pl-4 pr-3 py-2 rounded-xl font-semibold text-xs transition-all duration-150 ${
                        isActive
                          ? 'bg-[#3C77C3]/5 text-[#3C77C3]'
                          : 'text-slate-605 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#3C77C3] rounded-r-md animate-in slide-in-from-left duration-200" />
                      )}
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#3C77C3]' : 'text-slate-500'}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          {/* Support and System Item */}
          <div className="space-y-2 pt-4 border-t border-border text-left">
            <span className="text-[9px] font-black text-muted-foreground tracking-[0.15em] uppercase px-3 block">
              SUPPORT & OUTLETS
            </span>
            <div className="space-y-1">
              <Link
                href="/admin/support"
                className={`relative flex items-center gap-3 pl-4 pr-3 py-2 rounded-xl font-semibold text-xs transition-all duration-150 ${
                  pathname === '/admin/support'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-605 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {pathname === '/admin/support' && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-md animate-in slide-in-from-left duration-200" />
                )}
                <HelpCircle className="w-4 h-4 text-emerald-500" />
                Support Help
              </Link>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 pl-4 pr-3 py-2 rounded-xl font-semibold text-xs text-rose-600 hover:bg-rose-50/50 transition-all duration-150 text-left"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                Logout Account
              </button>
            </div>
          </div>
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
      <aside className="w-64 bg-background border-r border-border hidden md:flex flex-col flex-shrink-0 h-full">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center">
            <span className="inline-flex items-center">
              <img src="/logo-creva.svg" alt="Creva Webzz" className="h-7 w-auto object-contain" />
            </span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin">
          {filteredNavigationGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2 text-left">
              <span className="text-[9px] font-black text-[#3C77C3] tracking-[0.15em] uppercase px-3 opacity-80 block">
                {group.title}
              </span>
              <div className="space-y-1">
                {group.items.map((item, iIdx) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={iIdx}
                      href={item.href}
                      className={`relative flex items-center gap-3 pl-4 pr-3 py-2 rounded-xl font-semibold text-xs transition-all duration-150 ${
                        isActive
                          ? 'bg-[#3C77C3]/5 text-[#3C77C3]'
                          : 'text-slate-605 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#3C77C3] rounded-r-md animate-in slide-in-from-left duration-200" />
                      )}
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#3C77C3]' : 'text-slate-500'}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          {/* Support and System Item */}
          <div className="space-y-2 pt-4 border-t border-border text-left">
            <span className="text-[9px] font-black text-muted-foreground tracking-[0.15em] uppercase px-3 block">
              SUPPORT & OUTLETS
            </span>
            <div className="space-y-1">
              <Link
                href="/admin/support"
                className={`relative flex items-center gap-3 pl-4 pr-3 py-2 rounded-xl font-semibold text-xs transition-all duration-150 ${
                  pathname === '/admin/support'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-605 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {pathname === '/admin/support' && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-md animate-in slide-in-from-left duration-200" />
                )}
                <HelpCircle className="w-4 h-4 text-emerald-500" />
                Support Help
              </Link>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 pl-4 pr-3 py-2 rounded-xl font-semibold text-xs text-rose-600 hover:bg-rose-50/50 transition-all duration-150 text-left"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                Logout Account
              </button>
            </div>
          </div>
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

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-border bg-background flex-shrink-0 select-none">
          {/* Left section: Controls & Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Sidebar Toggle */}
            <button 
              type="button" 
              onClick={() => setIsMobileOpen(true)}
              className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors md:hidden shrink-0"
              title="Open Menu"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-base sm:text-lg font-bold capitalize truncate">
              {pathname === '/admin' ? 'Dashboard Overview' : pathname.replace('/admin/', '').replace(/-/g, ' ')}
            </h1>
          </div>

          {/* Right section: Profile, Visit Store, Notifications, Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Full Screen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors shrink-0 header-dropdown-trigger"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4.5 h-4.5" />
              ) : (
                <Maximize2 className="w-4.5 h-4.5" />
              )}
            </button>

            {/* Notifications Bell with Popover Dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNotifications(prev => !prev);
                  setShowProfileDropdown(false);
                }}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors relative header-dropdown-trigger"
                title="Notifications"
              >
                <Bell className="w-4.5 h-4.5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-background animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white text-gray-900 shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200 text-left header-dropdown-container"
                >
                  <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                    <span className="font-bold text-xs uppercase tracking-wider text-[#3C77C3]">Notifications</span>
                    <button
                      onClick={() => {
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                        fetch('/api/backend/notifications/all', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ for_role: 'owner' }),
                        }).catch(() => {});
                      }}
                      className="text-[10px] text-gray-400 hover:text-[#3C77C3] transition-colors uppercase font-black tracking-widest"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-gray-400">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`px-4 py-3 hover:bg-blue-50/50 transition-colors text-left ${n.read ? 'opacity-60' : ''}`}>
                          <p className="text-xs font-bold text-gray-800 leading-snug">{n.title}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{n.description}</p>
                          <span className="text-[9px] text-gray-400 mt-1.5 block font-mono">{n.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Visit Store globe button */}
            <a 
              href={storeUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs flex items-center gap-1.5 text-[#3C77C3] border border-[#3C77C3]/20 bg-[#3C77C3]/5 hover:bg-[#3C77C3]/10 px-3 py-1.5 rounded-lg transition-colors shrink-0 font-bold uppercase tracking-wider"
              title="Visit Storefront"
            >
              <Globe className="w-4 h-4 text-[#3C77C3]" />
              <span>Visit Store</span>
            </a>

            {/* Vertical Separator */}
            <span className="h-6 w-px bg-border shrink-0" />

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileDropdown(prev => !prev);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-muted/60 transition-colors border border-transparent hover:border-border text-left header-dropdown-trigger"
              >
                <div className="w-8 h-8 rounded-full bg-[#3C77C3]/10 text-[#3C77C3] flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                  {store.store_name?.[0] || 'S'}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-foreground truncate max-w-[120px]">
                    {store.store_name || 'Store Owner'}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                    {user?.email || 'admin@creva.com'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </button>

              {showProfileDropdown && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white text-gray-900 shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200 text-left header-dropdown-container"
                >
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-black text-gray-900 truncate">{store.store_name}</p>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">{user?.email}</p>
                  </div>

                  <div className="p-1.5">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      Logout Account
                    </button>
                  </div>
                </div>
              )}
            </div>
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
      <StoreAssistant />
    </div>
  )}
    </>
  );
}

import { LoadingProvider } from '@/context/LoadingContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <LoadingProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </LoadingProvider>
  );
}
