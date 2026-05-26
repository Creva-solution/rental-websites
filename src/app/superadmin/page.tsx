'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Building2, Globe, ShieldAlert, ShieldCheck, Play, Pause, 
  Search, RefreshCw, Copy, Check, Database, HelpCircle,
  Infinity, Calendar, Clock, Zap, Plus, FileText, X, Printer, Send, Upload
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  // States for Invoicing and Brand settings
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [billPlan, setBillPlan] = useState<string>('90');
  const [billPrice, setBillPrice] = useState<string>('1299');
  const [brandName, setBrandName] = useState<string>('StoreBuilder');
  const [brandLogo, setBrandLogo] = useState<string>('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [modalTab, setModalTab] = useState<'billing' | 'profile'>('billing');
  
  // Advanced filters and branding dashboard states
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isBrandingOpen, setIsBrandingOpen] = useState<boolean>(false);

  // States for Image Cropping tool
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [cropX, setCropX] = useState<number>(0);
  const [cropY, setCropY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const savedBrand = localStorage.getItem('saas_brand_name');
    const savedLogo = localStorage.getItem('saas_brand_logo');
    if (savedBrand) setBrandName(savedBrand);
    if (savedLogo) setBrandLogo(savedLogo);
  }, []);

  // HTML5 Canvas cropping renderer
  useEffect(() => {
    if (!rawImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = rawImage;
    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw dark indicator background
      ctx.fillStyle = "#090d16"; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const radius = canvas.width / 2;

      ctx.save();
      // Circular clipping path for perfect 1:1 circular crop preview
      ctx.beginPath();
      ctx.arc(radius, radius, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Calculate sizes maintaining aspect ratio
      const aspectRatio = img.width / img.height;
      let drawWidth = canvas.width * cropZoom;
      let drawHeight = canvas.height * cropZoom;

      if (aspectRatio > 1) {
        // Wide image
        drawWidth = canvas.height * aspectRatio * cropZoom;
      } else {
        // Tall image
        drawHeight = (canvas.width / aspectRatio) * cropZoom;
      }
      
      const dx = (canvas.width - drawWidth) / 2 + cropX;
      const dy = (canvas.height - drawHeight) / 2 + cropY;

      ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
      ctx.restore();

      // Premium glowing indicator outline
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(radius, radius, radius - 2, 0, Math.PI * 2);
      ctx.stroke();
    };
  }, [rawImage, cropZoom, cropX, cropY]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropX, y: e.clientY - cropY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setCropX(e.clientX - dragStart.x);
    setCropY(e.clientY - dragStart.y);
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - cropX, y: touch.clientY - cropY });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setCropX(touch.clientX - dragStart.x);
    setCropY(touch.clientY - dragStart.y);
  };

  const handleApplyCrop = () => {
    if (!canvasRef.current) return;
    // Extract base64 high-quality cropped PNG
    const croppedUrl = canvasRef.current.toDataURL('image/png');
    setBrandLogo(croppedUrl);
    setRawImage(null); // Close crop panel modal
    setActionStatus("Logo cropped successfully!");
    setTimeout(() => setActionStatus(null), 2000);
  };

  const handleOpenBilling = (store: any) => {
    setSelectedStore(store);
    setInvoiceNumber(`INV-${Math.floor(100000 + Math.random() * 900000)}`);
    setBillPlan('90');
    setBillPrice('1299');
    setModalTab('billing');
  };

  const handleSaveBrandSettings = () => {
    localStorage.setItem('saas_brand_name', brandName);
    localStorage.setItem('saas_brand_logo', brandLogo);
    setActionStatus('Brand settings saved locally!');
    setTimeout(() => setActionStatus(null), 2000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) {
        alert("⚠️ Logo image size is too large! Please choose a file under 800KB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setRawImage(event.target.result as string);
          setCropZoom(1);
          setCropX(0);
          setCropY(0);
          setActionStatus("Logo loaded. Please adjust crop!");
          setTimeout(() => setActionStatus(null), 2000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // SQL code for setting up custom columns in Supabase
  const sqlCommand = `-- Run this in your Supabase SQL Editor to add the new management columns:
ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT FALSE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS custom_domain_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;`;

  const fetchStores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStores(data || []);
    } catch (err: any) {
      console.error('Error loading stores:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleTogglePause = async (storeId: string, currentStatus: boolean) => {
    setActionStatus(`Updating store...`);
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from('stores')
        .update({ is_paused: newStatus })
        .eq('id', storeId);

      if (error) {
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          alert('⚠️ Columns missing! Please run the SQL command at the top of the dashboard in your Supabase SQL editor first.');
          return;
        }
        throw error;
      }

      setStores(stores.map(s => s.id === storeId ? { ...s, is_paused: newStatus } : s));
      setActionStatus(`Shop status updated successfully!`);
      setTimeout(() => setActionStatus(null), 3000);
    } catch (err: any) {
      alert(`Error updating store: ${err.message}`);
      setActionStatus(null);
    }
  };

  const handleToggleCustomDomain = async (storeId: string, currentStatus: boolean) => {
    setActionStatus(`Updating custom domain permission...`);
    try {
      const newStatus = currentStatus === false ? true : false;
      const { error } = await supabase
        .from('stores')
        .update({ custom_domain_enabled: newStatus })
        .eq('id', storeId);

      if (error) {
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          alert('⚠️ Columns missing! Please run the SQL command at the top of the dashboard in your Supabase SQL editor first.');
          return;
        }
        throw error;
      }

      setStores(stores.map(s => s.id === storeId ? { ...s, custom_domain_enabled: newStatus } : s));
      setActionStatus(`Custom domain permission updated!`);
      setTimeout(() => setActionStatus(null), 3000);
    } catch (err: any) {
      alert(`Error updating domain permission: ${err.message}`);
      setActionStatus(null);
    }
  };

  const handleExtendSubscription = async (
    storeId: string, 
    type: 'days' | 'ms' | 'lifetime', 
    amount: number | null
  ) => {
    setActionStatus(`Updating subscription...`);
    try {
      const store = stores.find(s => s.id === storeId);
      if (!store) return;

      if (type === 'lifetime') {
        // Set to Lifetime
        const { error } = await supabase
          .from('stores')
          .update({ subscription_expires_at: null })
          .eq('id', storeId);

        if (error) {
          if (error.message.includes('column') && error.message.includes('does not exist')) {
            alert('⚠️ subscription_expires_at column missing! Run the updated SQL query first.');
            return;
          }
          throw error;
        }

        setStores(stores.map(s => s.id === storeId ? { ...s, subscription_expires_at: null } : s));
        setActionStatus(`Subscription set to Lifetime!`);
        setTimeout(() => setActionStatus(null), 3000);
        return;
      }

      let baseDate = new Date();
      let newExpiry: Date;

      if (type === 'days') {
        // If store has an active subscription in the future, extend from that expiry date
        if (store.subscription_expires_at) {
          const currentExpiry = new Date(store.subscription_expires_at);
          if (currentExpiry > new Date()) {
            baseDate = currentExpiry;
          }
        }
        newExpiry = new Date(baseDate.getTime() + (amount || 0) * 24 * 60 * 60 * 1000);
      } else {
        // For custom milliseconds (trial period), start immediately from NOW
        newExpiry = new Date(new Date().getTime() + (amount || 0));
      }

      const { error } = await supabase
        .from('stores')
        .update({ subscription_expires_at: newExpiry.toISOString() })
        .eq('id', storeId);

      if (error) {
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          alert('⚠️ subscription_expires_at column missing! Run the updated SQL query first.');
          return;
        }
        throw error;
      }

      setStores(stores.map(s => s.id === storeId ? { ...s, subscription_expires_at: newExpiry.toISOString() } : s));
      setActionStatus(type === 'ms' ? `Trial activated successfully!` : `Subscription extended successfully!`);
      setTimeout(() => setActionStatus(null), 3000);
    } catch (err: any) {
      alert(`Error updating subscription: ${err.message}`);
      setActionStatus(null);
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(sqlCommand);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const filteredStores = stores.filter(store => {
    // 1. First apply search query filter
    const matchesSearch = store.store_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         store.subdomain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (store.contact_phone && store.contact_phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (store.contact_email && store.contact_email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    // 2. Apply advanced category tab filters
    if (activeFilter === 'all') return true;
    if (activeFilter === 'paused') return store.is_paused === true;
    if (activeFilter === 'custom_domain') return store.custom_domain_enabled !== false;
    
    const expiryDate = store.subscription_expires_at ? new Date(store.subscription_expires_at) : null;
    const isExpired = expiryDate ? expiryDate < new Date() : false;
    
    if (activeFilter === 'lifetime') return expiryDate === null;
    if (activeFilter === 'expired') return expiryDate !== null && isExpired;

    // Active plan range groupings in days remaining
    if (expiryDate && !isExpired) {
      const diffDays = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (activeFilter === '1month') return diffDays > 0 && diffDays <= 30;
      if (activeFilter === '3months') return diffDays > 30 && diffDays <= 90;
      if (activeFilter === '6months') return diffDays > 90 && diffDays <= 180;
      if (activeFilter === '1year') return diffDays > 180 && diffDays <= 365;
    }

    return false;
  });

  // Dynamic statistics calculations
  const totalStores = stores.length;
  const pausedStores = stores.filter(s => s.is_paused === true).length;
  const activeStores = totalStores - pausedStores;
  const customDomainStores = stores.filter(s => s.custom_domain_enabled !== false).length;

  // Real-time tab indicators counts
  const totalStoresCount = stores.length;
  const pausedStoresCount = stores.filter(s => s.is_paused === true).length;
  const customDomainStoresCount = stores.filter(s => s.custom_domain_enabled !== false).length;
  const lifetimeStoresCount = stores.filter(s => s.subscription_expires_at === null).length;
  
  const expiredStoresCount = stores.filter(s => {
    const expiry = s.subscription_expires_at ? new Date(s.subscription_expires_at) : null;
    return expiry !== null && expiry < new Date();
  }).length;

  const getActivePlanCount = (minDays: number, maxDays: number) => {
    return stores.filter(s => {
      const expiry = s.subscription_expires_at ? new Date(s.subscription_expires_at) : null;
      if (!expiry || expiry < new Date()) return false;
      const diffDays = Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > minDays && diffDays <= maxDays;
    }).length;
  };

  const oneMonthCount = getActivePlanCount(0, 30);
  const threeMonthsCount = getActivePlanCount(30, 90);
  const sixMonthsCount = getActivePlanCount(90, 180);
  const oneYearCount = getActivePlanCount(180, 365);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-6 sm:p-8">
      {/* Upper header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Super Admin Control Panel
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Manage platform stores, pause storefronts, and grant custom domain permissions.
            </p>
          </div>
          <button 
            onClick={fetchStores}
            className="flex items-center gap-2 self-start bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-700 text-sm font-medium transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh List
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">

        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-gray-800 border border-gray-700/60 rounded-xl p-5 shadow-sm">
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total registered shops</div>
            <div className="text-3xl font-extrabold text-white mt-1 flex items-baseline gap-2">
              {totalStores}
              <span className="text-xs font-normal text-blue-400">stores</span>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700/60 rounded-xl p-5 shadow-sm">
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Active stores</div>
            <div className="text-3xl font-extrabold text-green-400 mt-1 flex items-baseline gap-2">
              {activeStores}
              <span className="text-xs font-normal text-green-500">running</span>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700/60 rounded-xl p-5 shadow-sm">
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Paused stores</div>
            <div className="text-3xl font-extrabold text-red-400 mt-1 flex items-baseline gap-2">
              {pausedStores}
              <span className="text-xs font-normal text-red-500">paused</span>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700/60 rounded-xl p-5 shadow-sm">
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider">With Custom Domain</div>
            <div className="text-3xl font-extrabold text-indigo-400 mt-1 flex items-baseline gap-2">
              {customDomainStores}
              <span className="text-xs font-normal text-indigo-500">connected</span>
            </div>
          </div>
        </div>

        {/* Controls and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-800 p-4 rounded-xl border border-gray-700/60">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search by store name, subdomain, contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700/80 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {actionStatus && (
              <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 animate-pulse border border-blue-500/20 mr-2">
                {actionStatus}
              </div>
            )}
            <button 
              onClick={() => setIsBrandingOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md flex-shrink-0"
            >
              <Zap className="w-4 h-4" />
              Billing Settings
            </button>
          </div>
        </div>

        {/* Scrolling Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          {[
            { id: 'all', name: 'All Shops', count: totalStoresCount },
            { id: 'paused', name: 'Paused', count: pausedStoresCount },
            { id: 'custom_domain', name: 'Custom Domain', count: customDomainStoresCount },
            { id: '1month', name: '1 Month active', count: oneMonthCount },
            { id: '3months', name: '3 Months active', count: threeMonthsCount },
            { id: '6months', name: '6 Months active', count: sixMonthsCount },
            { id: '1year', name: '1 Year active', count: oneYearCount },
            { id: 'lifetime', name: 'Lifetime Plan', count: lifetimeStoresCount },
            { id: 'expired', name: 'Expired Plan', count: expiredStoresCount }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all shrink-0 ${
                activeFilter === tab.id
                  ? 'bg-blue-600 border-blue-500 text-white shadow-md scale-102'
                  : 'bg-gray-800/40 border-gray-750 text-gray-400 hover:bg-gray-800'
              }`}
            >
              <span>{tab.name}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeFilter === tab.id 
                  ? 'bg-white/20 text-white' 
                  : 'bg-gray-750 text-gray-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Table list of stores */}
        <div className="bg-gray-800 border border-gray-700/60 rounded-xl overflow-hidden shadow-md">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <span>Loading registered stores...</span>
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Building2 className="w-12 h-12 text-gray-600" />
              <span className="font-medium text-gray-500">No stores found matching your search.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-700/80 text-gray-400 text-xs font-bold uppercase bg-gray-900/40">
                    <th className="px-6 py-4">Shop details</th>
                    <th className="px-6 py-4">Subdomain / Domain</th>
                    <th className="px-6 py-4 text-center">Custom Domain Permission</th>
                    <th className="px-6 py-4 text-center">Subscription Plan</th>
                    <th className="px-6 py-4 text-center">Storefront Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {filteredStores.map((store) => {
                    const domainAllowed = store.custom_domain_enabled !== false;
                    const isPaused = store.is_paused === true;
                    
                    const expiryDate = store.subscription_expires_at ? new Date(store.subscription_expires_at) : null;
                    const isExpired = expiryDate ? expiryDate < new Date() : false;
                    const daysRemaining = expiryDate 
                      ? Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      : null;

                    return (
                      <tr key={store.id} className="hover:bg-gray-700/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-gray-200 font-extrabold text-sm border border-gray-600 flex-shrink-0">
                              {store.store_name?.[0]?.toUpperCase() || 'S'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-white truncate max-w-[180px]">{store.store_name}</div>
                              <div className="text-[10px] text-gray-500 font-mono mt-0.5 truncate max-w-[185px]">{store.id}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-xs text-blue-400 font-mono font-medium">
                              {store.subdomain}.crevasolution.in
                            </div>
                            {store.custom_domain ? (
                              <div className="text-xs text-indigo-400 font-mono font-semibold flex items-center gap-1.5">
                                <Globe className="w-3.5 h-3.5" />
                                {store.custom_domain}
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-500 font-normal">No custom domain linked</span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleToggleCustomDomain(store.id, domainAllowed)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                domainAllowed 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20' 
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500/20'
                              }`}
                            >
                              {domainAllowed ? (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  Domain Access: ALLOWED
                                </>
                              ) : (
                                <>
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                  Domain Access: RESTRICTED
                                </>
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center gap-2">
                            {/* Subscription Status Display */}
                            {expiryDate === null ? (
                              <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                <Infinity className="w-3.5 h-3.5" />
                                Lifetime Plan
                              </div>
                            ) : isExpired ? (
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
                                  <Clock className="w-3.5 h-3.5" />
                                  Expired
                                </div>
                                <span className="text-[10px] text-gray-500 mt-1 font-mono">
                                  End: {expiryDate.toLocaleDateString()} {expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {(() => {
                                    const diffMs = expiryDate.getTime() - new Date().getTime();
                                    if (diffMs < 60 * 1000) return 'Less than 1 min left';
                                    if (diffMs < 60 * 60 * 1000) {
                                      const mins = Math.ceil(diffMs / (60 * 1000));
                                      return `${mins} min left`;
                                    }
                                    if (diffMs < 24 * 60 * 60 * 1000) {
                                      const hrs = Math.ceil(diffMs / (60 * 60 * 1000));
                                      return `${hrs} hr left`;
                                    }
                                    const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
                                    return `${days} days left`;
                                  })()}
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1 font-mono">
                                  Ends: {expiryDate.toLocaleDateString()} {expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            )}

                            {/* Quick Extend Buttons */}
                            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1 border-t border-gray-700/60 pt-2 w-full max-w-[210px]">
                              <button
                                onClick={() => handleExtendSubscription(store.id, 'days', 30)}
                                title="Add 30 Days (1 Month)"
                                className="px-1 py-0.5 rounded bg-gray-900 hover:bg-gray-700 text-[10px] font-semibold text-gray-300 border border-gray-700 transition-colors"
                              >
                                +30d
                              </button>
                              <button
                                onClick={() => handleExtendSubscription(store.id, 'days', 90)}
                                title="Add 90 Days (3 Months)"
                                className="px-1 py-0.5 rounded bg-gray-900 hover:bg-gray-700 text-[10px] font-semibold text-gray-300 border border-gray-700 transition-colors"
                              >
                                +90d
                              </button>
                              <button
                                onClick={() => handleExtendSubscription(store.id, 'days', 180)}
                                title="Add 6 Months"
                                className="px-1 py-0.5 rounded bg-gray-900 hover:bg-gray-700 text-[10px] font-semibold text-gray-300 border border-gray-700 transition-colors"
                              >
                                +6 Mo
                              </button>
                              <button
                                onClick={() => handleExtendSubscription(store.id, 'days', 365)}
                                title="Add 365 Days (1 Year)"
                                className="px-1 py-0.5 rounded bg-gray-900 hover:bg-gray-700 text-[10px] font-semibold text-gray-300 border border-gray-700 transition-colors"
                              >
                                +365d
                              </button>
                              <button
                                onClick={() => handleExtendSubscription(store.id, 'lifetime', null)}
                                title="Set to Lifetime"
                                className="px-1 py-0.5 rounded bg-yellow-500/10 hover:bg-yellow-500/20 text-[10px] font-bold text-yellow-400 border border-yellow-500/20 transition-colors"
                              >
                                Lifetime
                              </button>
                            </div>

                            {/* Custom Trial Setup */}
                            <div className="flex items-center gap-1 mt-2 border-t border-gray-700/40 pt-2 w-full max-w-[210px]">
                              <input
                                type="number"
                                min="1"
                                defaultValue="5"
                                id={`trial-val-${store.id}`}
                                className="w-10 bg-gray-900 border border-gray-700 rounded px-1 py-0.5 text-center text-xs text-white focus:outline-none"
                              />
                              <select
                                id={`trial-unit-${store.id}`}
                                className="bg-gray-900 border border-gray-700 rounded px-1 py-0.5 text-[9px] text-gray-300 focus:outline-none"
                              >
                                <option value="min">Min</option>
                                <option value="hr">Hour</option>
                                <option value="day">Day</option>
                              </select>
                              <button
                                onClick={() => {
                                  const valEl = document.getElementById(`trial-val-${store.id}`) as HTMLInputElement;
                                  const unitEl = document.getElementById(`trial-unit-${store.id}`) as HTMLSelectElement;
                                  if (!valEl || !unitEl) return;
                                  const val = parseInt(valEl.value) || 1;
                                  const unit = unitEl.value;
                                  let ms = val * 60 * 1000;
                                  if (unit === 'hr') ms = val * 60 * 60 * 1000;
                                  if (unit === 'day') ms = val * 24 * 60 * 60 * 1000;
                                  handleExtendSubscription(store.id, 'ms', ms);
                                }}
                                className="px-2 py-0.5 rounded bg-blue-500 hover:bg-blue-600 text-[10px] font-bold text-white transition-colors flex-1"
                              >
                                Set Trial
                              </button>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <button
                              onClick={() => handleTogglePause(store.id, isPaused)}
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border transition-all shadow-sm w-full max-w-[120px] justify-center ${
                                isPaused 
                                  ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20' 
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              }`}
                            >
                              {isPaused ? (
                                <>
                                  <Pause className="w-3.5 h-3.5 fill-red-400" />
                                  PAUSED
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5 fill-emerald-400" />
                                  ACTIVE
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleOpenBilling(store)}
                              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-all shadow-sm w-full max-w-[120px] justify-center"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              INVOICE
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Invoice & Shop Details Modal */}
      {selectedStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 overflow-y-auto backdrop-blur-sm">
          {/* Custom style for absolute print control */}
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * {
                display: none !important;
              }
              #invoice-print-area, #invoice-print-area * {
                display: block !important;
                visibility: visible !important;
              }
              #invoice-print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                background: white !important;
                color: black !important;
                padding: 30px !important;
                box-shadow: none !important;
                border: none !important;
              }
            }
          `}} />

          <div className="relative w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-none text-left">
            
            {/* Left Panel: Customize details */}
            <div className="flex-1 p-6 sm:p-8 overflow-y-auto border-b md:border-b-0 md:border-r border-gray-800 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    Billing & Shop Profile
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Manage store records and generate subscription receipts</p>
                </div>
                <button 
                  onClick={() => setSelectedStore(null)}
                  className="p-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Advanced Tab Switchers */}
              <div className="flex border-b border-gray-850 gap-4">
                <button
                  type="button"
                  onClick={() => setModalTab('billing')}
                  className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    modalTab === 'billing'
                      ? 'border-blue-500 text-blue-400 font-extrabold'
                      : 'border-transparent text-gray-500 hover:text-gray-400'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  INVOICE GENERATOR
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('profile')}
                  className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    modalTab === 'profile'
                      ? 'border-blue-500 text-blue-400 font-extrabold'
                      : 'border-transparent text-gray-500 hover:text-gray-400'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  SHOP PROFILE PROFILE
                </button>
              </div>

              {modalTab === 'profile' ? (
                <div className="space-y-6">
                  {/* General Branding & Identity */}
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">Shop Identity</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gray-950 p-4 rounded-xl border border-gray-850">
                        <span className="text-[9px] text-gray-500 uppercase block font-semibold">Store Category</span>
                        <span className="text-sm font-bold text-white mt-1 block">{selectedStore.business_category || 'General Store'}</span>
                      </div>
                      <div className="bg-gray-950 p-4 rounded-xl border border-gray-850 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-gray-500 uppercase block font-semibold">Theme Primary Color</span>
                          <span className="text-sm font-mono font-bold text-white mt-1 block">{selectedStore.primary_color || '#3B82F6'}</span>
                        </div>
                        <div 
                          className="w-8 h-8 rounded-full border border-gray-800 shadow-inner"
                          style={{ backgroundColor: selectedStore.primary_color || '#3B82F6' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Settings and Currency */}
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">Platform & Currency Settings</h3>
                    <div className="bg-gray-950 p-4 rounded-xl border border-gray-850 space-y-4">
                      <div>
                        <span className="text-[9px] text-gray-500 uppercase block font-semibold font-sans">Active Currency Symbol</span>
                        <span className="text-sm font-bold text-white mt-1 block">{selectedStore.currency || 'INR (₹)'}</span>
                      </div>
                      {selectedStore.description && (
                        <div className="border-t border-gray-850 pt-3">
                          <span className="text-[9px] text-gray-500 uppercase block font-semibold">Store Description / Tagline</span>
                          <p className="text-xs text-gray-300 mt-1 leading-relaxed">{selectedStore.description}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Created timelines */}
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">Timeline & Status</h3>
                    <div className="bg-gray-950 p-4 rounded-xl border border-gray-850 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] text-gray-500 uppercase block font-semibold">Date Registered</span>
                        <span className="text-xs font-bold text-gray-300 mt-1 block">
                          {selectedStore.created_at ? new Date(selectedStore.created_at).toLocaleString('en-IN', {
                            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 uppercase block font-semibold">Custom Domain Access</span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold mt-1 ${
                          selectedStore.custom_domain_enabled !== false 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {selectedStore.custom_domain_enabled !== false ? 'ALLOWED' : 'REVOKED'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Owner Details */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Store Owner Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 uppercase">Store Name</label>
                        <div className="bg-gray-950 border border-gray-850 rounded-lg px-3 py-2 text-sm text-white font-medium mt-1">
                          {selectedStore.store_name}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 uppercase">Subdomain Alias</label>
                        <div className="bg-gray-950 border border-gray-850 rounded-lg px-3 py-2 text-sm text-blue-400 font-mono mt-1">
                          {selectedStore.subdomain}.crevasolution.in
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 uppercase">WhatsApp / Contact Phone</label>
                        <input 
                          type="text"
                          value={selectedStore.contact_phone || ''}
                          onChange={(e) => {
                            setSelectedStore({ ...selectedStore, contact_phone: e.target.value });
                          }}
                          placeholder="e.g. 9876543210"
                          className="w-full bg-gray-950 border border-gray-850 hover:border-gray-800 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-white mt-1 transition-all animate-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 uppercase">Contact Email</label>
                        <input 
                          type="email"
                          value={selectedStore.contact_email || ''}
                          onChange={(e) => {
                            setSelectedStore({ ...selectedStore, contact_email: e.target.value });
                          }}
                          placeholder="owner@email.com"
                          className="w-full bg-gray-950 border border-gray-850 hover:border-gray-800 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-white mt-1 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Plan & Price details */}
                  <div className="space-y-4 border-t border-gray-850 pt-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Renewal Plan & Price</h3>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { days: '30', name: '1 Month', price: '499' },
                        { days: '90', name: '3 Months', price: '1299' },
                        { days: '180', name: '6 Months', price: '2299' },
                        { days: '365', name: '1 Year', price: '3999' }
                      ].map((plan) => (
                        <button
                          type="button"
                          key={plan.days}
                          onClick={() => {
                            setBillPlan(plan.days);
                            setBillPrice(plan.price);
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                            billPlan === plan.days
                              ? 'bg-blue-500/20 text-blue-400 border-blue-500'
                              : 'bg-gray-950 border-gray-800 text-gray-400 hover:bg-gray-900'
                          }`}
                        >
                          {plan.name}
                        </button>
                      ))}
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-semibold text-gray-500 uppercase">Billing Price (₹)</label>
                      <input 
                        type="number"
                        value={billPrice}
                        onChange={(e) => setBillPrice(e.target.value)}
                        className="w-full max-w-[200px] bg-gray-950 border border-gray-850 hover:border-gray-800 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-white mt-1 transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel: Invoice Preview */}
            <div className="w-full md:w-[360px] bg-gray-950 p-6 sm:p-8 flex flex-col items-center justify-between gap-6 overflow-y-auto">
              <div className="w-full">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 text-center">Receipt Invoice Preview</h3>
                
                {/* Printable Invoice Container */}
                <div 
                  id="invoice-print-area"
                  className="bg-white text-gray-900 border border-gray-200 rounded-xl p-5 shadow-xl font-mono text-xs flex flex-col gap-4 w-full"
                >
                  {/* Logo header */}
                  <div className="flex items-start justify-between border-b border-gray-200 pb-3">
                    <div className="flex items-center gap-2">
                      {brandLogo && (
                        <img 
                          src={brandLogo} 
                          alt="Logo" 
                          className="w-8 h-8 rounded-full border border-gray-250 object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div>
                        <span className="font-extrabold text-sm tracking-tight">{brandName}</span>
                        <p className="text-[8px] text-gray-500 font-sans mt-0.5">Creva Platform billing</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-[10px] text-blue-600 block">TAX INVOICE</span>
                      <span className="text-[9px] text-gray-500 block mt-0.5">{invoiceNumber}</span>
                    </div>
                  </div>

                  {/* Bill to metadata */}
                  <div className="flex flex-col gap-1 text-[10px] border-b border-gray-150 pb-3">
                    <span className="text-gray-400 uppercase font-sans font-bold text-[8px]">Bill To:</span>
                    <span className="font-bold text-gray-800">{selectedStore.store_name}</span>
                    {selectedStore.contact_phone && (
                      <span className="text-gray-600">Ph: {selectedStore.contact_phone}</span>
                    )}
                    {selectedStore.contact_email && (
                      <span className="text-gray-600">Email: {selectedStore.contact_email}</span>
                    )}
                    <span className="text-gray-500 font-sans text-[8px] mt-1">Date: {new Date().toLocaleDateString('en-IN')}</span>
                  </div>

                  {/* Items list */}
                  <div className="flex flex-col gap-2 border-b border-gray-200 pb-3">
                    <div className="flex justify-between font-bold text-[9px] text-gray-400 uppercase font-sans">
                      <span>Description</span>
                      <span>Total</span>
                    </div>
                    <div className="flex justify-between gap-4 text-gray-850">
                      <div className="min-w-0">
                        <span className="font-semibold block truncate">SaaS Storefront Subscription</span>
                        <span className="text-[9px] text-gray-500 block mt-0.5 font-sans">
                          Validity: {billPlan} Days ({billPlan === '30' ? '1 Mo' : billPlan === '90' ? '3 Mo' : billPlan === '180' ? '6 Mo' : '1 Yr'})
                        </span>
                      </div>
                      <span className="font-bold shrink-0">₹{billPrice}.00</span>
                    </div>
                  </div>

                  {/* Total summary */}
                  <div className="flex flex-col gap-1.5 align-end self-end text-right w-full max-w-[150px]">
                    <div className="flex justify-between text-gray-500 font-sans text-[10px]">
                      <span>Subtotal:</span>
                      <span className="font-bold text-gray-800">₹{billPrice}.00</span>
                    </div>
                    <div className="flex justify-between font-black text-gray-900 border-t border-gray-200 pt-1.5 text-xs">
                      <span>Total:</span>
                      <span>₹{billPrice}.00</span>
                    </div>
                  </div>

                  {/* Expiry / Footer section */}
                  <div className="border-t border-gray-200 pt-3 text-center flex flex-col gap-2">
                    <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider inline-block self-center">
                      PAID & ACTIVE ✅
                    </div>
                    
                    <div className="text-[9px] text-gray-500 leading-relaxed font-sans mt-1">
                      <span>Your storefront is active from </span>
                      <strong className="text-gray-800 font-mono">{new Date().toLocaleDateString('en-IN')}</strong>
                      <span> to </span>
                      <strong className="text-gray-800 font-mono">
                        {new Date(new Date().getTime() + parseInt(billPlan) * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="w-full space-y-2 mt-auto">
                <button
                  onClick={() => {
                    const planName = billPlan === '30' ? '1 Month (30 Days)' :
                                     billPlan === '90' ? '3 Months (90 Days)' :
                                     billPlan === '180' ? '6 Months (180 Days)' : '1 Year (365 Days)';
                    const startDate = new Date().toLocaleDateString('en-IN');
                    const endDate = new Date(new Date().getTime() + parseInt(billPlan) * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN');
                    
                    const text = `*INVOICE FROM ${brandName.toUpperCase()}* 🚀\n-----------------------------------\n*Store Name:* ${selectedStore.store_name}\n*Subdomain:* ${selectedStore.subdomain}.crevasolution.in\n*Invoice No:* ${invoiceNumber}\n*Date:* ${startDate}\n\n*Subscription Details:*\n-----------------------------------\n*Plan Duration:* ${planName}\n*Validity Period:* ${startDate} to ${endDate}\n*Amount Paid:* ₹${billPrice}\n*Status:* PAID & ACTIVE ✅\n\nThank you for choosing *${brandName}* to power your online shop! Your online storefront has been recharged and is fully active. 🌟`;
                    
                    let phone = selectedStore.contact_phone || '';
                    phone = phone.replace(/\D/g, '');
                    if (phone.length === 10) {
                      phone = '91' + phone;
                    }
                    
                    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  <Send className="w-4 h-4" />
                  Send via WhatsApp
                </button>

                <button
                  onClick={() => window.print()}
                  className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-xl text-xs font-bold border border-gray-700 transition-all"
                >
                  <Printer className="w-4 h-4 text-blue-400" />
                  Print / Save as PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global SaaS Billing Settings Modal */}
      {isBrandingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden text-left p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-850 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap className="text-blue-400 w-5 h-5" />
                  SaaS Invoice Settings
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Customize default brand styling for payment receipts</p>
              </div>
              <button 
                onClick={() => setIsBrandingOpen(false)}
                className="p-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Branding / SaaS Name</label>
                <input 
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Creva Solutions"
                  className="w-full bg-gray-950 border border-gray-850 hover:border-gray-800 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-2.5 text-sm text-white mt-1 transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Branding Logo</label>
                <div className="flex flex-col gap-2.5">
                  <label 
                    htmlFor="global-logo-upload"
                    className="flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-gray-800 hover:border-blue-500 bg-gray-950 hover:bg-gray-950/70 cursor-pointer text-xs font-semibold text-gray-400 hover:text-white transition-all text-center"
                  >
                    <Upload className="w-4 h-4 text-blue-500" />
                    <span>Click to Upload Logo Image File</span>
                  </label>
                  <input 
                    type="file"
                    accept="image/*"
                    id="global-logo-upload"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />

                  <div className="relative">
                    <span className="text-[9px] text-gray-500 uppercase font-sans tracking-wide block mb-1">Or paste logo image link URL:</span>
                    <input 
                      type="text"
                      value={brandLogo}
                      onChange={(e) => setBrandLogo(e.target.value)}
                      placeholder="e.g. https://..."
                      className="w-full bg-gray-950 border border-gray-850 hover:border-gray-800 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-white transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              {brandLogo && (
                <div className="bg-gray-950 p-3 rounded-lg border border-gray-850 flex items-center gap-3">
                  <img 
                    src={brandLogo} 
                    alt="Preview" 
                    className="w-10 h-10 rounded-full object-cover border border-gray-800"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">{brandName}</span>
                    <span className="text-[10px] text-gray-500 block">Default branding live preview</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-gray-850 justify-end">
              <button
                type="button"
                onClick={() => setIsBrandingOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSaveBrandSettings();
                  setIsBrandingOpen(false);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors shadow-md"
              >
                Save Branding Default Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Logo Image Cropper Sub-Modal */}
      {rawImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-6 shadow-2xl text-left animate-none">
            
            <div className="flex items-center justify-between border-b border-gray-850 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-400" />
                  Crop & Adjust SaaS Logo
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Reposition and scale your logo to fit perfectly</p>
              </div>
              <button 
                onClick={() => setRawImage(null)}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Canvas Crop Area */}
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="relative bg-gray-950 p-6 rounded-2xl border border-gray-850 shadow-inner flex items-center justify-center">
                <canvas 
                  ref={canvasRef} 
                  width={220} 
                  height={220}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUpOrLeave}
                  onMouseLeave={handleMouseUpOrLeave}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleMouseUpOrLeave}
                  className="cursor-move rounded-full shadow-lg border border-gray-800"
                />
              </div>
              <p className="text-[10px] text-gray-400 font-sans text-center">
                👉 <strong>Drag directly</strong> inside the circle above to reposition your logo
              </p>
            </div>

            {/* Sliders Controls */}
            <div className="space-y-4 bg-gray-950/50 p-4 rounded-xl border border-gray-850">
              {/* Zoom Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  <span>Zoom / Scale</span>
                  <span className="font-mono text-blue-400">{cropZoom.toFixed(1)}x</span>
                </div>
                <input 
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.05"
                  value={cropZoom}
                  onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Advanced Fine-Tuning offsets */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Horizontal Offset (X)</label>
                  <input 
                    type="range"
                    min="-150"
                    max="150"
                    step="1"
                    value={cropX}
                    onChange={(e) => setCropX(parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Vertical Offset (Y)</label>
                  <input 
                    type="range"
                    min="-150"
                    max="150"
                    step="1"
                    value={cropY}
                    onChange={(e) => setCropY(parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 justify-end pt-4 border-t border-gray-850">
              <button
                type="button"
                onClick={() => setRawImage(null)}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCrop}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-750 text-xs font-semibold text-white transition-colors shadow-md flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Apply Circular Crop
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
