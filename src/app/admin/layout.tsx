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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [storeUrl, setStoreUrl] = useState<string>('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState<any>(null);
  const [knownOrdersCount, setKnownOrdersCount] = useState<number | null>(null);
  const [globalSettings, setGlobalSettings] = useState<any>(null);

  // Redesigned SaaS Header states & helpers
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([
    { id: 1, title: 'Welcome to your SaaS Dashboard!', description: 'Get started by configuring your theme in Appearance settings.', time: 'Just now', read: false },
    { id: 2, title: 'Store setup complete', description: 'Your direct checkout is ready to receive orders.', time: '1 hour ago', read: false }
  ]);

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
    const checkUser = async () => {
      try {
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
          .neq('subdomain', '__creva_saas_global_settings__')
          .maybeSingle();
          
        setStore(storeData || null);

        // Fetch global SaaS settings
        const { data: globalData } = await supabase
          .from('stores')
          .select('description')
          .eq('subdomain', '__creva_saas_global_settings__')
          .maybeSingle();
        if (globalData && globalData.description) {
          setGlobalSettings(JSON.parse(globalData.description));
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

    // Auto-refresh order polling interval (every 10 seconds)
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
    }, 10000);

    return () => clearInterval(interval);
  }, [store, knownOrdersCount]);

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

  // Determine WhatsApp permissions to show/hide Marketing Hub
  const isGloballyEnabled = true;
  let selectedPlan = '30';
  try {
    if (store?.description && store.description.startsWith('{')) {
      const parsed = JSON.parse(store.description);
      selectedPlan = parsed.selectedPlan || '30';
    }
  } catch (e) {}

  const plansCtc = globalSettings?.whatsappPlansEnabled || ['30', '365', 'lifetime'];
  const plansOua = globalSettings?.whatsappPlansOrderUpdatesEnabled || ['365', 'lifetime'];

  const hasClickToChat = true;
  const hasOrderUpdates = true;

  const isWhatsAppEnabled = !globalSettings || (isGloballyEnabled && (hasClickToChat || hasOrderUpdates));

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
        ...(isWhatsAppEnabled ? [{ href: "/admin/marketing-hub", label: "Marketing Hub", icon: Megaphone }] : [])
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

  return (
    <div className="h-screen bg-muted/20 flex w-full relative overflow-hidden">
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
          <Link href="/" className="font-bold text-xl text-primary flex items-center gap-2">
            <svg width="24" height="22" viewBox="0 0 206 189" fill="none" xmlns="http://www.w3.org/2000/svg" className="select-none flex-shrink-0">
              <rect width="41.0051" height="41.0051" transform="translate(0 86)" fill="#3C77C3"/>
              <path d="M11.5973 106.619C11.5973 104.889 11.9876 103.336 12.7681 101.962C13.5486 100.57 14.6091 99.4844 15.9496 98.7039C17.307 97.9234 18.8086 97.5331 20.4545 97.5331C22.3888 97.5331 24.0771 97.9997 25.5194 98.933C26.9616 99.8662 28.0136 101.19 28.6754 102.903H25.9012C25.4091 101.834 24.6964 101.012 23.7632 100.435C22.847 99.8577 21.7441 99.5692 20.4545 99.5692C19.2159 99.5692 18.1045 99.8577 17.1203 100.435C16.1362 101.012 15.3642 101.834 14.8043 102.903C14.2443 103.955 13.9643 105.194 13.9643 106.619C13.9643 108.028 14.2443 109.266 14.8043 110.335C15.3642 111.387 16.1362 112.202 17.1203 112.779C18.1045 113.356 19.2159 113.644 20.4545 113.644C21.7441 113.644 22.847 113.364 23.7632 112.804C24.6964 112.227 25.4091 111.404 25.9012 110.335H28.6754C28.0136 112.032 26.9616 113.347 25.5194 114.28C24.0771 115.197 22.3888 115.655 20.4545 115.655C18.8086 115.655 17.307 115.273 15.9496 114.509C14.6091 113.729 13.5486 112.651 12.7681 111.277C11.9876 109.903 11.5973 108.35 11.5973 106.619Z" fill="white"/>
              <rect width="41.0051" height="41.0051" transform="translate(41.0039 98.7246)" fill="#3C77C3"/>
              <path d="M64.8074 128.227L60.5824 120.973H57.7827V128.227H55.4666V110.487H61.1932C62.5337 110.487 63.662 110.716 64.5783 111.174C65.5115 111.632 66.2072 112.251 66.6653 113.032C67.1234 113.812 67.3525 114.703 67.3525 115.704C67.3525 116.926 66.9962 118.003 66.2835 118.937C65.5879 119.87 64.5359 120.489 63.1275 120.795L67.5816 128.227H64.8074ZM57.7827 119.115H61.1932C62.4488 119.115 63.3905 118.809 64.0184 118.199C64.6462 117.571 64.9601 116.739 64.9601 115.704C64.9601 114.652 64.6462 113.838 64.0184 113.261C63.4075 112.684 62.4658 112.396 61.1932 112.396H57.7827V119.115Z" fill="white"/>
              <rect width="41.0051" height="41.0051" transform="translate(82.0088 86)" fill="#3C77C3"/>
              <path d="M99.7876 99.6456V105.576H106.252V107.485H99.7876V113.593H107.016V115.502H97.4715V97.7367H107.016V99.6456H99.7876Z" fill="white"/>
              <rect width="41.0051" height="41.0051" transform="translate(123.015 98.7246)" fill="#3C77C3"/>
              <path d="M151.137 110.487L144.444 128.227H141.771L135.078 110.487H137.546L143.12 125.783L148.694 110.487H151.137Z" fill="white"/>
              <rect width="41.0051" height="41.0051" transform="translate(164.021 86)" fill="#3C77C3"/>
              <path d="M187.969 111.557H180.232L178.807 115.502H176.363L182.777 97.864H185.45L191.838 115.502H189.395L187.969 111.557ZM187.308 109.674L184.101 100.715L180.894 109.674H187.308Z" fill="white"/>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M151.609 0.266528C150.787 0.443259 149.224 1.0234 148.136 1.5553C143.392 3.87416 140.27 8.63054 139.851 14.1765L139.703 16.1346L134.13 16.2005L128.557 16.2667L127.436 16.888C125.665 17.869 124.797 19.2248 124.416 21.6028C123.447 27.6533 122.677 31.4413 122.315 31.9388C122.095 32.241 121.492 32.7046 120.975 32.9687C120.048 33.4427 119.926 33.4489 111.64 33.4489H103.244L102.721 33.9729C101.97 34.7238 101.988 36.0288 102.759 36.635C103.303 37.0632 103.565 37.0779 110.923 37.0894C116.236 37.098 118.744 37.1782 119.252 37.3562C120.232 37.6997 120.807 38.5396 120.915 39.7831C121.029 41.1126 120.459 42.0699 119.214 42.6347C118.354 43.0255 117.653 43.0447 104.101 43.0492L89.8914 43.0539L89.4272 43.5478C88.7141 44.3072 88.7984 45.4387 89.6199 46.1298L90.2765 46.6825L103.761 46.6833C116.758 46.684 117.269 46.6991 117.928 47.1008C118.892 47.6888 119.345 48.6621 119.21 49.8581C119.121 50.6467 118.938 50.9804 118.234 51.6371L117.368 52.4454H108.598C98.9653 52.4454 98.8808 52.4559 98.359 53.7161C98.1419 54.2396 98.1419 54.4932 98.359 55.0168C98.8751 56.2631 99.0529 56.2874 107.649 56.2874C114.507 56.2874 115.544 56.3305 116.062 56.6366C116.879 57.119 117.351 58.0044 117.351 59.0524C117.351 60.3138 116.841 61.1584 115.79 61.6357C114.992 61.9975 114.344 62.0415 109.752 62.0457L104.607 62.0504L104.042 62.5738C103.285 63.2754 103.267 64.4209 104.001 65.155C104.524 65.6779 104.534 65.679 108.991 65.679C111.446 65.679 113.767 65.7413 114.147 65.8173C115.132 66.0143 116.209 67.1677 116.386 68.2151C116.692 70.0245 118.977 72.3531 121.074 72.9922C121.743 73.1962 128.318 73.2562 150.008 73.2562C182.384 73.2562 179.408 73.4558 181.737 71.1284C182.845 70.0204 183.119 69.5908 183.497 68.3656C183.744 67.5675 183.945 66.5645 183.943 66.1368C183.942 65.7088 183.602 62.7654 183.188 59.5958C182.383 53.4384 182.226 52.1897 181.708 47.8564C181.525 46.3303 181.16 43.3527 180.896 41.2396L180.416 37.3976L159.822 37.2892L139.229 37.181L159.773 37.1291L180.317 37.0775V36.4604C180.317 36.121 180.082 33.984 179.795 31.7113C179.508 29.4387 179.121 26.1865 178.935 24.4843C178.749 22.7821 178.547 20.9909 178.487 20.504C178.358 19.4712 177.423 17.9619 176.48 17.2644C175.295 16.3886 174.251 16.16 171.432 16.16H168.791L168.788 15.0394C168.781 12.0397 167.431 8.12062 165.521 5.54926C162.458 1.42766 156.581 -0.80368 151.609 0.266528ZM151.374 4.18344C146.936 5.45407 143.946 9.38635 143.476 14.5718L143.332 16.16H154.254H165.175L165.043 14.7192C164.742 11.4104 163.724 8.9601 161.822 6.96675C159.204 4.22143 155.079 3.12284 151.374 4.18344ZM147.393 26.1385C152.823 26.1701 161.707 26.1701 167.137 26.1385C172.567 26.1067 168.124 26.0808 157.265 26.0808C146.406 26.0808 141.964 26.1067 147.393 26.1385ZM177.708 26.6196C178.614 27.172 178.911 27.1713 178.076 26.6187C177.724 26.3854 177.34 26.1944 177.222 26.194C177.105 26.1938 177.323 26.3852 177.708 26.6196ZM159.464 30.1408C158.494 30.8201 158.668 32.7172 159.744 33.2077C161.086 33.8195 162.388 33.0449 162.388 31.6347C162.388 30.1557 160.685 29.2857 159.464 30.1408ZM165.971 30.1113C165.05 30.8116 165.079 32.7339 166.019 33.2372C167.255 33.8984 168.791 33.0319 168.791 31.6731C168.791 30.5894 168.094 29.8187 167.121 29.8272C166.69 29.8308 166.172 29.9587 165.971 30.1113ZM172.282 30.3262C171.065 31.3732 171.831 33.4489 173.434 33.4489C174.272 33.4489 175.408 32.4812 175.408 31.7678C175.408 30.0964 173.547 29.2381 172.282 30.3262ZM128.718 41.2127C128.512 41.3248 128.273 41.521 128.187 41.6484C127.887 42.0911 128.026 43.0565 128.45 43.4808C128.831 43.8614 129.162 43.9077 131.504 43.9077H134.131L136.651 51.645C138.037 55.9007 139.309 59.6031 139.479 59.8728C139.648 60.1424 140.093 60.5503 140.468 60.7791C141.118 61.1757 141.613 61.1951 151.075 61.1951C160.527 61.1951 161.033 61.1753 161.681 60.7804C162.055 60.5522 162.468 60.1646 162.6 59.919C162.731 59.6733 163.638 56.8161 164.616 53.5696C166.127 48.5469 166.36 47.574 166.175 47.0449C165.749 45.8229 165.82 45.8287 151.126 45.8287H137.716L137.143 44.0678C136.417 41.8396 136.112 41.4142 135.031 41.1231C134.007 40.8475 129.263 40.915 128.718 41.2127ZM139.21 50.3644C139.474 51.2156 140.159 53.3231 140.731 55.048C141.648 57.8106 141.834 58.1999 142.301 58.3171C143.258 58.5572 159.81 58.3753 160.139 58.1211C160.304 57.9931 160.792 56.6876 161.223 55.2202C161.654 53.7528 162.236 51.8028 162.517 50.8869C162.798 49.971 163.028 49.1307 163.028 49.0192C163.028 48.8942 158.395 48.8169 150.878 48.8169H138.729L139.21 50.3644ZM142.792 63.7509C142.403 63.9947 141.935 64.5522 141.751 64.99C140.834 67.1739 143.407 69.2887 145.459 68.0375C146.394 67.467 146.66 66.8757 146.54 65.6288C146.408 64.2529 145.727 63.5349 144.43 63.4028C143.736 63.3319 143.318 63.4207 142.792 63.7509ZM156.859 63.8805C155.943 64.651 155.632 65.7863 156.058 66.8051C156.429 67.6951 157.503 68.4518 158.396 68.4529C160.854 68.4563 161.863 65.0297 159.779 63.7588C158.791 63.1567 157.663 63.2036 156.859 63.8805Z" fill="#3C77C3"/>
              <path d="M128.644 29.2416L127.363 35.0046H135.474C137.144 34.9122 137.833 35.454 138.783 37.139H180.191L178.91 28.1743C178.621 27.0979 178.04 26.7687 176.562 26.4668H131.952C129.712 26.719 129.042 27.3728 128.644 29.2416Z" fill="black" stroke="white" stroke-width="0.640332"/>
              <circle cx="161.194" cy="31.9086" r="2.02772" fill="#D9D9D9"/>
              <circle cx="166.744" cy="31.9086" r="2.02772" fill="#D9D9D9"/>
              <circle cx="172.292" cy="31.9086" r="2.02772" fill="#D9D9D9"/>
              <circle cx="132.779" cy="79.8652" r="6.60545" fill="#D9D9D9"/>
              <circle cx="132.78" cy="79.8658" r="3.00248" fill="black"/>
              <circle cx="168.209" cy="79.8652" r="6.60545" fill="#D9D9D9"/>
              <circle cx="168.209" cy="79.8658" r="3.00248" fill="black"/>
              <path d="M69.1792 151.022L62.9284 175H55.8578L52.0322 159.219L48.0699 175H40.9994L34.9194 151.022H41.1702L44.6201 168.476L48.8897 151.022H55.3113L59.4102 168.476L62.8942 151.022H69.1792ZM83.4145 155.701V160.551H91.2366V165.06H83.4145V170.32H92.2613V175H77.5736V151.022H92.2613V155.701H83.4145ZM116.035 162.703C117.424 162.999 118.54 163.694 119.383 164.787C120.225 165.857 120.647 167.087 120.647 168.476C120.647 170.48 119.941 172.074 118.529 173.258C117.14 174.419 115.193 175 112.688 175H101.518V151.022H112.312C114.749 151.022 116.65 151.579 118.016 152.695C119.406 153.811 120.1 155.325 120.1 157.238C120.1 158.65 119.724 159.823 118.973 160.756C118.244 161.69 117.265 162.339 116.035 162.703ZM107.359 160.722H111.185C112.141 160.722 112.87 160.517 113.371 160.107C113.895 159.675 114.157 158.229C114.157 158.229C114.157 158.229 114.157 158.229ZM111.663 170.286C112.642 170.286 113.394 170.07 113.918 169.637C114.464 169.182 114.737 168.533 114.737 167.69C114.737 166.848 114.453 166.187 113.883 165.709C113.337 165.231 112.574 164.992 111.595 164.992H107.359V170.286H111.663Z" fill="black"/>
              <path d="M135.716 170.218H146.032V175H129.09V170.56L139.337 155.804H129.09V151.022H146.032V155.462L135.716 170.218ZM161.529 170.218H171.844V175H154.902V170.56L165.15 155.804H154.902V151.022H171.844V155.462L161.529 170.218Z" fill="#3C77C3"/>
              <path d="M13.9434 163.318H34.0181" stroke="#3C77C3" stroke-width="2.50935"/>
              <path d="M172.868 163.318H192.943" stroke="#3C77C3" stroke-width="2.50935"/>
            </svg>
            <span>Creva Webzz</span>
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
          {navigationGroups.map((group, gIdx) => (
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
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                        isActive
                          ? 'bg-[#3C77C3]/10 text-[#3C77C3]'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#3C77C3]' : 'text-muted-foreground'}`} />
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
              <a 
                href="https://wa.me/919876543210?text=Hi%20Creva%20Support!%20I%20need%20assistance%2520with%2520my%2520merchant%2520storefront." 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-emerald-600 hover:bg-emerald-50/50 transition-all duration-200"
              >
                <HelpCircle className="w-4 h-4 text-emerald-500" />
                Support Help
              </a>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-rose-600 hover:bg-rose-50/50 transition-all duration-200 text-left"
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
          <Link href="/" className="font-bold text-xl text-primary flex items-center gap-2">
            <svg width="24" height="22" viewBox="0 0 206 189" fill="none" xmlns="http://www.w3.org/2000/svg" className="select-none flex-shrink-0">
              <rect width="41.0051" height="41.0051" transform="translate(0 86)" fill="#3C77C3"/>
              <path d="M11.5973 106.619C11.5973 104.889 11.9876 103.336 12.7681 101.962C13.5486 100.57 14.6091 99.4844 15.9496 98.7039C17.307 97.9234 18.8086 97.5331 20.4545 97.5331C22.3888 97.5331 24.0771 97.9997 25.5194 98.933C26.9616 99.8662 28.0136 101.19 28.6754 102.903H25.9012C25.4091 101.834 24.6964 101.012 23.7632 100.435C22.847 99.8577 21.7441 99.5692 20.4545 99.5692C19.2159 99.5692 18.1045 99.8577 17.1203 100.435C16.1362 101.012 15.3642 101.834 14.8043 102.903C14.2443 103.955 13.9643 105.194 13.9643 106.619C13.9643 108.028 14.2443 109.266 14.8043 110.335C15.3642 111.387 16.1362 112.202 17.1203 112.779C18.1045 113.356 19.2159 113.644 20.4545 113.644C21.7441 113.644 22.847 113.364 23.7632 112.804C24.6964 112.227 25.4091 111.404 25.9012 110.335H28.6754C28.0136 112.032 26.9616 113.347 25.5194 114.28C24.0771 115.197 22.3888 115.655 20.4545 115.655C18.8086 115.655 17.307 115.273 15.9496 114.509C14.6091 113.729 13.5486 112.651 12.7681 111.277C11.9876 109.903 11.5973 108.35 11.5973 106.619Z" fill="white"/>
              <rect width="41.0051" height="41.0051" transform="translate(41.0039 98.7246)" fill="#3C77C3"/>
              <path d="M64.8074 128.227L60.5824 120.973H57.7827V128.227H55.4666V110.487H61.1932C62.5337 110.487 63.662 110.716 64.5783 111.174C65.5115 111.632 66.2072 112.251 66.6653 113.032C67.1234 113.812 67.3525 114.703 67.3525 115.704C67.3525 116.926 66.9962 118.003 66.2835 118.937C65.5879 119.87 64.5359 120.489 63.1275 120.795L67.5816 128.227H64.8074ZM57.7827 119.115H61.1932C62.4488 119.115 63.3905 118.809 64.0184 118.199C64.6462 117.571 64.9601 116.739 64.9601 115.704C64.9601 114.652 64.6462 113.838 64.0184 113.261C63.4075 112.684 62.4658 112.396 61.1932 112.396H57.7827V119.115Z" fill="white"/>
              <rect width="41.0051" height="41.0051" transform="translate(82.0088 86)" fill="#3C77C3"/>
              <path d="M99.7876 99.6456V105.576H106.252V107.485H99.7876V113.593H107.016V115.502H97.4715V97.7367H107.016V99.6456H99.7876Z" fill="white"/>
              <rect width="41.0051" height="41.0051" transform="translate(123.015 98.7246)" fill="#3C77C3"/>
              <path d="M151.137 110.487L144.444 128.227H141.771L135.078 110.487H137.546L143.12 125.783L148.694 110.487H151.137Z" fill="white"/>
              <rect width="41.0051" height="41.0051" transform="translate(164.021 86)" fill="#3C77C3"/>
              <path d="M187.969 111.557H180.232L178.807 115.502H176.363L182.777 97.864H185.45L191.838 115.502H189.395L187.969 111.557ZM187.308 109.674L184.101 100.715L180.894 109.674H187.308Z" fill="white"/>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M151.609 0.266528C150.787 0.443259 149.224 1.0234 148.136 1.5553C143.392 3.87416 140.27 8.63054 139.851 14.1765L139.703 16.1346L134.13 16.2005L128.557 16.2667L127.436 16.888C125.665 17.869 124.797 19.2248 124.416 21.6028C123.447 27.6533 122.677 31.4413 122.315 31.9388C122.095 32.241 121.492 32.7046 120.975 32.9687C120.048 33.4427 119.926 33.4489 111.64 33.4489H103.244L102.721 33.9729C101.97 34.7238 101.988 36.0288 102.759 36.635C103.303 37.0632 103.565 37.0779 110.923 37.0894C116.236 37.098 118.744 37.1782 119.252 37.3562C120.232 37.6997 120.807 38.5396 120.915 39.7831C121.029 41.1126 120.459 42.0699 119.214 42.6347C118.354 43.0255 117.653 43.0447 104.101 43.0492L89.8914 43.0539L89.4272 43.5478C88.7141 44.3072 88.7984 45.4387 89.6199 46.1298L90.2765 46.6825L103.761 46.6833C116.758 46.684 117.269 46.6991 117.928 47.1008C118.892 47.6888 119.345 48.6621 119.21 49.8581C119.121 50.6467 118.938 50.9804 118.234 51.6371L117.368 52.4454H108.598C98.9653 52.4454 98.8808 52.4559 98.359 53.7161C98.1419 54.2396 98.1419 54.4932 98.359 55.0168C98.8751 56.2631 99.0529 56.2874 107.649 56.2874C114.507 56.2874 115.544 56.3305 116.062 56.6366C116.879 57.119 117.351 58.0044 117.351 59.0524C117.351 60.3138 116.841 61.1584 115.79 61.6357C114.992 61.9975 114.344 62.0415 109.752 62.0457L104.607 62.0504L104.042 62.5738C103.285 63.2754 103.267 64.4209 104.001 65.155C104.524 65.6779 104.534 65.679 108.991 65.679C111.446 65.679 113.767 65.7413 114.147 65.8173C115.132 66.0143 116.209 67.1677 116.386 68.2151C116.692 70.0245 118.977 72.3531 121.074 72.9922C121.743 73.1962 128.318 73.2562 150.008 73.2562C182.384 73.2562 179.408 73.4558 181.737 71.1284C182.845 70.0204 183.119 69.5908 183.497 68.3656C183.744 67.5675 183.945 66.5645 183.943 66.1368C183.942 65.7088 183.602 62.7654 183.188 59.5958C182.383 53.4384 182.226 52.1897 181.708 47.8564C181.525 46.3303 181.16 43.3527 180.896 41.2396L180.416 37.3976L159.822 37.2892L139.229 37.181L159.773 37.1291L180.317 37.0775V36.4604C180.317 36.121 180.082 33.984 179.795 31.7113C179.508 29.4387 179.121 26.1865 178.935 24.4843C178.749 22.7821 178.547 20.9909 178.487 20.504C178.358 19.4712 177.423 17.9619 176.48 17.2644C175.295 16.3886 174.251 16.16 171.432 16.16H168.791L168.788 15.0394C168.781 12.0397 167.431 8.12062 165.521 5.54926C162.458 1.42766 156.581 -0.80368 151.609 0.266528ZM151.374 4.18344C146.936 5.45407 143.946 9.38635 143.476 14.5718L143.332 16.16H154.254H165.175L165.043 14.7192C164.742 11.4104 163.724 8.9601 161.822 6.96675C159.204 4.22143 155.079 3.12284 151.374 4.18344ZM147.393 26.1385C152.823 26.1701 161.707 26.1701 167.137 26.1385C172.567 26.1067 168.124 26.0808 157.265 26.0808C146.406 26.0808 141.964 26.1067 147.393 26.1385ZM177.708 26.6196C178.614 27.172 178.911 27.1713 178.076 26.6187C177.724 26.3854 177.34 26.1944 177.222 26.194C177.105 26.1938 177.323 26.3852 177.708 26.6196ZM159.464 30.1408C158.494 30.8201 158.668 32.7172 159.744 33.2077C161.086 33.8195 162.388 33.0449 162.388 31.6347C162.388 30.1557 160.685 29.2857 159.464 30.1408ZM165.971 30.1113C165.05 30.8116 165.079 32.7339 166.019 33.2372C167.255 33.8984 168.791 33.0319 168.791 31.6731C168.791 30.5894 168.094 29.8187 167.121 29.8272C166.69 29.8308 166.172 29.9587 165.971 30.1113ZM172.282 30.3262C171.065 31.3732 171.831 33.4489 173.434 33.4489C174.272 33.4489 175.408 32.4812 175.408 31.7678C175.408 30.0964 173.547 29.2381 172.282 30.3262ZM128.718 41.2127C128.512 41.3248 128.273 41.521 128.187 41.6484C127.887 42.0911 128.026 43.0565 128.45 43.4808C128.831 43.8614 129.162 43.9077 131.504 43.9077H134.131L136.651 51.645C138.037 55.9007 139.309 59.6031 139.479 59.8728C139.648 60.1424 140.093 60.5503 140.468 60.7791C141.118 61.1757 141.613 61.1951 151.075 61.1951C160.527 61.1951 161.033 61.1753 161.681 60.7804C162.055 60.5522 162.468 60.1646 162.6 59.919C162.731 59.6733 163.638 56.8161 164.616 53.5696C166.127 48.5469 166.36 47.574 166.175 47.0449C165.749 45.8229 165.82 45.8287 151.126 45.8287H137.716L137.143 44.0678C136.417 41.8396 136.112 41.4142 135.031 41.1231C134.007 40.8475 129.263 40.915 128.718 41.2127ZM139.21 50.3644C139.474 51.2156 140.159 53.3231 140.731 55.048C141.648 57.8106 141.834 58.1999 142.301 58.3171C143.258 58.5572 159.81 58.3753 160.139 58.1211C160.304 57.9931 160.792 56.6876 161.223 55.2202C161.654 53.7528 162.236 51.8028 162.517 50.8869C162.798 49.971 163.028 49.1307 163.028 49.0192C163.028 48.8942 158.395 48.8169 150.878 48.8169H138.729L139.21 50.3644ZM142.792 63.7509C142.403 63.9947 141.935 64.5522 141.751 64.99C140.834 67.1739 143.407 69.2887 145.459 68.0375C146.394 67.467 146.66 66.8757 146.54 65.6288C146.408 64.2529 145.727 63.5349 144.43 63.4028C143.736 63.3319 143.318 63.4207 142.792 63.7509ZM156.859 63.8805C155.943 64.651 155.632 65.7863 156.058 66.8051C156.429 67.6951 157.503 68.4518 158.396 68.4529C160.854 68.4563 161.863 65.0297 159.779 63.7588C158.791 63.1567 157.663 63.2036 156.859 63.8805Z" fill="#3C77C3"/>
              <path d="M128.644 29.2416L127.363 35.0046H135.474C137.144 34.9122 137.833 35.454 138.783 37.139H180.191L178.91 28.1743C178.621 27.0979 178.04 26.7687 176.562 26.4668H131.952C129.712 26.719 129.042 27.3728 128.644 29.2416Z" fill="black" stroke="white" stroke-width="0.640332"/>
              <circle cx="161.194" cy="31.9086" r="2.02772" fill="#D9D9D9"/>
              <circle cx="166.744" cy="31.9086" r="2.02772" fill="#D9D9D9"/>
              <circle cx="172.292" cy="31.9086" r="2.02772" fill="#D9D9D9"/>
              <circle cx="132.779" cy="79.8652" r="6.60545" fill="#D9D9D9"/>
              <circle cx="132.78" cy="79.8658" r="3.00248" fill="black"/>
              <circle cx="168.209" cy="79.8652" r="6.60545" fill="#D9D9D9"/>
              <circle cx="168.209" cy="79.8658" r="3.00248" fill="black"/>
              <path d="M69.1792 151.022L62.9284 175H55.8578L52.0322 159.219L48.0699 175H40.9994L34.9194 151.022H41.1702L44.6201 168.476L48.8897 151.022H55.3113L59.4102 168.476L62.8942 151.022H69.1792ZM83.4145 155.701V160.551H91.2366V165.06H83.4145V170.32H92.2613V175H77.5736V151.022H92.2613V155.701H83.4145ZM116.035 162.703C117.424 162.999 118.54 163.694 119.383 164.787C120.225 165.857 120.647 167.087 120.647 168.476C120.647 170.48 119.941 172.074 118.529 173.258C117.14 174.419 115.193 175 112.688 175H101.518V151.022H112.312C114.749 151.022 116.65 151.579 118.016 152.695C119.406 153.811 120.1 155.325 120.1 157.238C120.1 158.65 119.724 159.823 118.973 160.756C118.244 161.69 117.265 162.339 116.035 162.703ZM107.359 160.722H111.185C112.141 160.722 112.87 160.517 113.371 160.107C113.895 159.675 114.157 158.229C114.157 158.229C114.157 158.229 114.157 158.229ZM111.663 170.286C112.642 170.286 113.394 170.07 113.918 169.637C114.464 169.182 114.737 168.533 114.737 167.69C114.737 166.848 114.453 166.187 113.883 165.709C113.337 165.231 112.574 164.992 111.595 164.992H107.359V170.286H111.663Z" fill="black"/>
              <path d="M135.716 170.218H146.032V175H129.09V170.56L139.337 155.804H129.09V151.022H146.032V155.462L135.716 170.218ZM161.529 170.218H171.844V175H154.902V170.56L165.15 155.804H154.902V151.022H171.844V155.462L161.529 170.218Z" fill="#3C77C3"/>
              <path d="M13.9434 163.318H34.0181" stroke="#3C77C3" stroke-width="2.50935"/>
              <path d="M172.868 163.318H192.943" stroke="#3C77C3" stroke-width="2.50935"/>
            </svg>
            <span>Creva Webzz</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin">
          {navigationGroups.map((group, gIdx) => (
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
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                        isActive
                          ? 'bg-[#3C77C3]/10 text-[#3C77C3]'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#3C77C3]' : 'text-muted-foreground'}`} />
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
              <a 
                href="https://wa.me/919876543210?text=Hi%20Creva%20Support!%20I%20need%20assistance%2520with%2520my%2520merchant%2520storefront." 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-emerald-600 hover:bg-emerald-50/50 transition-all duration-200"
              >
                <HelpCircle className="w-4 h-4 text-emerald-500" />
                Support Help
              </a>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-rose-600 hover:bg-rose-50/50 transition-all duration-200 text-left"
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
                  className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-white dark:bg-zinc-950 text-foreground shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200 text-left header-dropdown-container"
                >
                  <div className="px-4 py-2 border-b border-border flex justify-between items-center">
                    <span className="font-bold text-xs uppercase tracking-wider text-[#3C77C3]">Notifications</span>
                    <button 
                      onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                      className="text-[10px] text-muted-foreground hover:text-primary transition-colors uppercase font-black tracking-widest"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-border">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`px-4 py-3 hover:bg-muted/40 transition-colors text-left ${n.read ? 'opacity-70' : ''}`}>
                          <p className="text-xs font-bold text-foreground leading-snug">{n.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{n.description}</p>
                          <span className="text-[9px] text-muted-foreground mt-1.5 block font-mono">{n.time}</span>
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
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-white dark:bg-zinc-950 text-foreground shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200 text-left header-dropdown-container"
                >
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-xs font-black text-foreground truncate">{store.store_name}</p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{user?.email}</p>
                  </div>
                  
                  <div className="p-1.5">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50/50 hover:text-rose-700 transition-all text-left"
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
  );
}
