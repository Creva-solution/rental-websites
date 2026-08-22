'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Plus, Loader2, DollarSign, ShoppingCart, Package } from 'lucide-react';

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return 'https://www.youtube.com/embed/7V2eS8W1cCc';
  if (url.includes('youtube.com/embed/')) return url;
  
  // Handle shorts e.g. youtube.com/shorts/ID
  const shortsMatch = url.match(/youtube\.com\/shorts\/([^/?#]+)/);
  if (shortsMatch && shortsMatch[1]) {
    return `https://www.youtube.com/embed/${shortsMatch[1]}`;
  }
  
  // Handle watch?v=ID
  const watchMatch = url.match(/[?&]v=([^&#]+)/);
  if (watchMatch && watchMatch[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }
  
  // Handle youtu.be/ID
  const beMatch = url.match(/youtu\.be\/([^/?#]+)/);
  if (beMatch && beMatch[1]) {
    return `https://www.youtube.com/embed/${beMatch[1]}`;
  }
  
  return url;
};

export default function DashboardHome() {
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/embed/7V2eS8W1cCc');

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', sku: '', description: '' });

  useEffect(() => {
    fetchData();
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('creva_merchant_onboarded_v1');
      if (!dismissed) {
        setShowTutorialModal(true);
      }
    }
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data: storeData } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', user.id)
      .neq('subdomain', '__creva_saas_global_settings__')
      .single();
    if (storeData) {
      setStore(storeData);
      const { data: prodData } = await supabase.from('products').select('*').eq('store_id', storeData.id);
      if (prodData) setProducts(prodData);
      const { data: ordData } = await supabase.from('orders').select('*').eq('store_id', storeData.id).order('created_at', { ascending: false });
      if (ordData) {
        const processed = ordData.map((o: any) => {
          let email = o.customer_email || '';
          if (email.includes('|')) {
            email = email.split('|')[0];
          }
          return { ...o, customer_email: email };
        });
        setOrders(processed);
      }
    }

    // Fetch global onboarding video link
    try {
      const { data: globalData } = await supabase
        .from('stores')
        .select('description')
        .eq('subdomain', '__creva_saas_global_settings__')
        .maybeSingle();

      if (globalData && globalData.description) {
        const parsed = JSON.parse(globalData.description);
        if (parsed.onboardVideoUrl) {
          setVideoUrl(getYouTubeEmbedUrl(parsed.onboardVideoUrl));
        }
      }
    } catch (err) {
      console.error("Failed to fetch global video URL:", err);
    }

    setLoading(false);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingProduct(true);
    try {
      const { error } = await supabase.from('products').insert([{
        store_id: store.id,
        name: newProduct.name,
        price: Number(newProduct.price),
        sku: newProduct.sku,
        description: newProduct.description,
        is_active: true,
        inventory_quantity: 10
      }]);
      
      if (error) throw error;
      
      setShowAddProduct(false);
      setNewProduct({ name: '', price: '', sku: '', description: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to add product");
    } finally {
      setAddingProduct(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!store) return null;

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const currencySymbol = store.currency === 'USD' ? '$' : '₹';
  const lowInventory = products.filter(p => p.inventory_quantity <= 5);

  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'paid' || s === 'completed' || s === 'delivered') {
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200/50';
    }
    if (s === 'pending' || s === 'processing') {
      return 'bg-amber-50 text-amber-700 border border-amber-200/50';
    }
    return 'bg-slate-50 text-slate-700 border border-slate-200/50';
  };

  return (
    <div className="space-y-6">
      {store.is_paused && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 p-5 rounded-xl flex items-start gap-3.5 shadow-sm">
          <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-black shrink-0 text-lg">
            ⚠️
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Onboarding Verification Pending</h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Our compliance team is currently reviewing your payment screenshot. Your storefront (<a href={`http://${store.subdomain}.crevasolution.in`} target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline">{store.subdomain}.crevasolution.in</a>) is temporarily paused and will automatically go live as soon as it is approved by the Super Admin!
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-[0_4px_12px_rgba(0,0,0,0.01)] flex items-center justify-between hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Total Revenue</h3>
            <div className="text-2xl font-black text-slate-800">{currencySymbol}{totalRevenue.toLocaleString()}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#3C77C3] flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-[0_4px_12px_rgba(0,0,0,0.01)] flex items-center justify-between hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Total Orders</h3>
            <div className="text-2xl font-black text-slate-800">{orders.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-[0_4px_12px_rgba(0,0,0,0.01)] flex items-center justify-between hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Active Products</h3>
            <div className="text-2xl font-black text-slate-800">{products.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_12px_rgba(0,0,0,0.01)] flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-sm text-slate-800">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs font-bold text-[#3C77C3] hover:underline">View All</Link>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] font-black text-slate-500 bg-slate-50 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5 font-medium">Customer</th>
                  <th className="px-6 py-3.5 font-medium">Amount</th>
                  <th className="px-6 py-3.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-400 text-xs">No orders yet.</td>
                  </tr>
                ) : (
                  orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="border-b border-slate-100/60 hover:bg-slate-50/50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-xs text-slate-700">{order.customer_name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{order.customer_email}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-xs text-slate-750">{currencySymbol}{order.total_amount}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${getStatusStyle(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_12px_rgba(0,0,0,0.01)] flex flex-col">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-bold text-sm text-slate-800">Inventory Alerts</h2>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-4 flex-1">
              {lowInventory.length === 0 ? (
                <div className="text-center text-slate-400 py-8 text-xs">All products are well stocked.</div>
              ) : (
                lowInventory.map(product => (
                  <div key={product.id} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-450 border border-slate-100 flex items-center justify-center text-[10px] font-bold">PKG</div>
                      <div>
                        <p className="font-semibold text-xs text-slate-700 truncate max-w-[120px]">{product.name}</p>
                        <p className="text-[10px] text-slate-400">SKU: {product.sku || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-rose-600">{product.inventory_quantity} left</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button onClick={() => setShowAddProduct(true)} className="w-full mt-4 py-2.5 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-sm hover:border-slate-300 transition-all duration-200 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4 text-[#3C77C3]" /> Add Product
            </button>
          </div>
        </div>
      </div>

      {showAddProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-800">Add New Product</h2>
              <button onClick={() => setShowAddProduct(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none">&times;</button>
            </div>
            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Product Name *</label>
                <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full h-10 px-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#3C77C3]/10 focus:border-[#3C77C3] transition-all text-sm text-slate-700" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Price ({currencySymbol}) *</label>
                <input required type="number" step="0.01" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full h-10 px-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#3C77C3]/10 focus:border-[#3C77C3] transition-all text-sm text-slate-700" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">SKU</label>
                <input type="text" value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} className="w-full h-10 px-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#3C77C3]/10 focus:border-[#3C77C3] transition-all text-sm text-slate-700" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Description</label>
                <textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 bg-white min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#3C77C3]/10 focus:border-[#3C77C3] transition-all text-sm text-slate-700" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddProduct(false)} className="px-5 py-2.5 border border-slate-200 text-slate-605 hover:bg-slate-50 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-200">Cancel</button>
                <button type="submit" disabled={addingProduct} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 flex items-center gap-2">
                  {addingProduct && <Loader2 className="w-4 h-4 animate-spin" />} Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onboarding YouTube Tutorial Flash Screen Modal */}
      {showTutorialModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-card text-card-foreground rounded-2xl border border-border/80 shadow-2xl w-full max-w-2xl p-6 md:p-8 space-y-6 text-center animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="flex items-center justify-between border-b pb-4 border-border/40 text-left">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full">🚀 Getting Started</span>
                <h2 className="text-xl md:text-2xl font-black tracking-tight mt-2 flex items-center gap-2">
                  🎥 Welcome to{' '}
                  <span className="inline-flex items-center align-middle px-2 py-0.5 rounded-lg bg-slate-900 mx-1">
                    <img src="/logo-creva.svg" alt="Creva Webzz" className="h-5 w-auto object-contain" />
                  </span>!
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Let's watch this quick 2-minute tutorial video to set up your online storefront.</p>
              </div>
              <button 
                onClick={() => {
                  setShowTutorialModal(false);
                  localStorage.setItem('creva_merchant_onboarded_v1', 'true');
                }}
                className="text-muted-foreground hover:text-foreground text-2xl font-bold p-1 leading-none"
              >
                &times;
              </button>
            </div>
            
            {/* Embedded Responsive YouTube Video */}
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border shadow-inner bg-black">
              <iframe 
                className="absolute inset-0 w-full h-full"
                src={`${videoUrl}${videoUrl.includes('?') ? '&' : '?'}autoplay=1`}
                title="Creva Store Setup Tutorial"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button 
                onClick={() => {
                  setShowTutorialModal(false);
                  localStorage.setItem('creva_merchant_onboarded_v1', 'true');
                }}
                className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
              >
                Skip Tutorial
              </button>
              <Link 
                href="/admin/tutorial" 
                onClick={() => {
                  setShowTutorialModal(false);
                  localStorage.setItem('creva_merchant_onboarded_v1', 'true');
                }}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all text-center shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                Go to Tutorial Page & Guides
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
