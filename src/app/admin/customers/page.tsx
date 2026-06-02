'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Users, Search, MessageSquare, PhoneCall, Sparkles, UserCheck, Lock, X } from 'lucide-react';

export default function CustomersPage() {
  const [store, setStore] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
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

        // Fetch all orders to group dynamically by customer phone / email
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .eq('store_id', storeData.id);

        if (orders) {
          // Group by customer phone
          const custMap = new Map<string, any>();
          
          orders.forEach((o: any) => {
            const phone = o.customer_phone || 'N/A';
            const name = o.customer_name || 'Anonymous Customer';
            const address = o.shipping_address || '';
            const amount = Number(o.total_amount) || 0;
            
            if (custMap.has(phone)) {
              const existing = custMap.get(phone);
              custMap.set(phone, {
                ...existing,
                orderCount: existing.orderCount + 1,
                totalSpend: existing.totalSpend + amount,
                address: o.shipping_address || existing.address,
                lastOrder: new Date(o.created_at) > new Date(existing.lastOrder) ? o.created_at : existing.lastOrder
              });
            } else {
              custMap.set(phone, {
                phone,
                name,
                address,
                orderCount: 1,
                totalSpend: amount,
                lastOrder: o.created_at
              });
            }
          });

          setCustomers(Array.from(custMap.values()).sort((a, b) => b.totalSpend - a.totalSpend));
        }
      }
      
      // Fetch global SaaS settings
      try {
        const { data: globalData } = await supabase
          .from('stores')
          .select('description')
          .eq('subdomain', '__creva_saas_global_settings__')
          .maybeSingle();

        if (globalData && globalData.description) {
          setGlobalSettings(JSON.parse(globalData.description));
        }
      } catch (err) {
        console.error("Failed to fetch global settings:", err);
      }
    } catch (err) {
      console.error("Failed to load customer profiles:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currencySymbol = store?.currency === 'USD' ? '$' : '₹';

  // Determine WhatsApp permissions
  const isGloballyEnabled = globalSettings?.whatsappEnabledGlobal !== false;
  let selectedPlan = '30';
  try {
    if (store?.description && store.description.startsWith('{')) {
      const parsed = JSON.parse(store.description);
      selectedPlan = parsed.selectedPlan || '30';
    }
  } catch (e) {}

  const plansCtc = globalSettings?.whatsappPlansEnabled || ['30', '365', 'lifetime'];
  const plansOua = globalSettings?.whatsappPlansOrderUpdatesEnabled || ['365', 'lifetime'];

  const hasClickToChat = plansCtc.includes(selectedPlan);
  const hasOrderUpdates = plansOua.includes(selectedPlan);

  const isLocked = !isGloballyEnabled || !hasClickToChat || !hasOrderUpdates;

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-border/40">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <Sparkles className="w-3.5 h-3.5" /> Customer Relationship Management
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-3">
            👥 Customers Directory
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track customer lifetime values, total order counts, and chat directly with them on WhatsApp.
          </p>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card text-card-foreground p-5 rounded-2xl border border-border/60 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Customer Profiles</span>
            <span className="text-xl font-black text-foreground mt-0.5 block">{customers.length}</span>
          </div>
        </div>

        <div className="bg-card text-card-foreground p-5 rounded-2xl border border-border/60 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Repeat Buyers</span>
            <span className="text-xl font-black text-foreground mt-0.5 block">
              {customers.filter(c => c.orderCount > 1).length}
            </span>
          </div>
        </div>

        <div className="bg-card text-card-foreground p-5 rounded-2xl border border-border/60 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
            <span className="text-lg">💎</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">VIP Customers (₹3000+ LTV)</span>
            <span className="text-xl font-black text-foreground mt-0.5 block">
              {customers.filter(c => c.totalSpend >= 3000).length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Directory Table */}
      <div className="bg-card text-card-foreground rounded-2xl border border-border/50 shadow-md flex flex-col overflow-hidden">
        {/* Search Header */}
        <div className="p-4 border-b border-border/40 bg-muted/10 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, phone or address..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary outline-none text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold">Customer</th>
                <th className="px-6 py-4 font-bold">Address</th>
                <th className="px-6 py-4 font-bold text-center">Orders</th>
                <th className="px-6 py-4 font-bold">Total Spent (LTV)</th>
                <th className="px-6 py-4 font-bold">Last Order</th>
                <th className="px-6 py-4 font-bold text-right">Quick Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No customer profiles matched your query.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust, idx) => (
                  <tr key={idx} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground flex items-center gap-1.5">
                        {cust.name}
                        {cust.totalSpend >= 3000 && (
                          <span className="text-[8px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full">VIP</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{cust.phone}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-muted-foreground">
                      {cust.address || <span className="italic text-gray-400">No address recorded</span>}
                    </td>
                    <td className="px-6 py-4 text-center font-black">
                      {cust.orderCount}
                    </td>
                    <td className="px-6 py-4 font-black text-foreground">
                      {currencySymbol}{cust.totalSpend.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {new Date(cust.lastOrder).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isLocked ? (
                          <button
                            onClick={() => setShowUpgradeModal(true)}
                            className="inline-flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-500 font-bold text-[9px] uppercase tracking-wider px-3 py-2 rounded-xl transition-all shadow-sm"
                          >
                            <Lock className="w-3 h-3 text-gray-400" /> WhatsApp
                          </button>
                        ) : (
                          <a
                            href={`https://wa.me/${cust.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[9px] uppercase tracking-wider px-3 py-2 rounded-xl transition-all shadow-sm shadow-emerald-500/10"
                          >
                            <MessageSquare className="w-3 h-3" /> WhatsApp
                          </a>
                        )}
                        <a
                          href={`tel:${cust.phone}`}
                          className="p-2 hover:bg-muted text-foreground border border-border/80 rounded-xl transition-all"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Premium Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-background border border-border max-w-sm w-full shadow-2xl rounded-3xl relative overflow-hidden flex flex-col p-6 animate-in zoom-in-95 duration-200 text-center font-sans">
            
            <div className="mx-auto w-12 h-12 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="font-black text-sm text-foreground uppercase tracking-wider">Premium Feature Locked</h3>
            
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Outgoing WhatsApp customer alerts and quick-contact actions require a **Premium Plan**. Your current plan only supports storefront Click-to-Chat query widgets.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2.5 bg-muted hover:bg-muted/80 text-foreground border rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
              >
                Close
              </button>
              <a 
                href="/admin/subscription"
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-center flex items-center justify-center"
              >
                Upgrade Plan
              </a>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
