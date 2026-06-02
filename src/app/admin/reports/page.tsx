'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, BarChart3, TrendingUp, ShoppingBag, Receipt, Users, Award, Sparkles } from 'lucide-react';

export default function ReportsPage() {
  const [store, setStore] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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

        // Fetch products
        const { data: prodData } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', storeData.id);
        if (prodData) setProducts(prodData);

        // Fetch orders and order items
        const { data: ordData } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              quantity,
              price_at_purchase,
              products (
                name,
                image_url
              )
            )
          `)
          .eq('store_id', storeData.id);
        if (ordData) setOrders(ordData);
      }
    } catch (err) {
      console.error("Failed to load reports data:", err);
    } finally {
      setLoading(false);
    }
  };

  const currencySymbol = store?.currency === 'USD' ? '$' : '₹';

  // Calculate statistics
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;
  
  // Calculate unique customers count
  const uniqueCustomers = new Set(orders.map(o => o.customer_phone)).size;

  // Calculate top selling products dynamically
  const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number; image: string }>();
  orders.forEach(order => {
    if (order.order_items && Array.isArray(order.order_items)) {
      order.order_items.forEach((item: any) => {
        const pName = item.products?.name || 'Deleted Product';
        const pQty = Number(item.quantity) || 0;
        const pRev = (Number(item.price_at_purchase) || 0) * pQty;
        const pImg = item.products?.image_url || '';

        if (productSalesMap.has(pName)) {
          const existing = productSalesMap.get(pName)!;
          productSalesMap.set(pName, {
            ...existing,
            quantity: existing.quantity + pQty,
            revenue: existing.revenue + pRev
          });
        } else {
          productSalesMap.set(pName, {
            name: pName,
            quantity: pQty,
            revenue: pRev,
            image: pImg
          });
        }
      });
    }
  });

  const topSellingProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Group monthly sales data dynamically (last 6 months) for visualization
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      monthName: d.toLocaleString('default', { month: 'short' }),
      monthIndex: d.getMonth(),
      year: d.getFullYear(),
      revenue: 0,
      orderCount: 0
    };
  }).reverse();

  orders.forEach(order => {
    const oDate = new Date(order.created_at);
    const month = oDate.getMonth();
    const year = oDate.getFullYear();
    const match = last6Months.find(m => m.monthIndex === month && m.year === year);
    if (match) {
      match.revenue += Number(order.total_amount) || 0;
      match.orderCount += 1;
    }
  });

  const maxMonthlyRevenue = Math.max(...last6Months.map(m => m.revenue), 1000);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-border/40">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <Sparkles className="w-3.5 h-3.5" /> Analytics Dashboard
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-3">
            📊 Sales & Performance Reports
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Analyze your storefront sales performance, top products leaderboard, and customer conversion rates.
          </p>
        </div>
      </div>

      {/* Main High-Fidelity Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card text-card-foreground p-5 rounded-2xl border border-border/60 shadow-sm flex items-center gap-4 hover:border-primary/20 transition-all">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Sales Revenue</span>
            <span className="text-lg font-black text-foreground mt-0.5 block">{currencySymbol}{totalRevenue.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-card text-card-foreground p-5 rounded-2xl border border-border/60 shadow-sm flex items-center gap-4 hover:border-primary/20 transition-all">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Orders placed</span>
            <span className="text-lg font-black text-foreground mt-0.5 block">{totalOrders}</span>
          </div>
        </div>

        <div className="bg-card text-card-foreground p-5 rounded-2xl border border-border/60 shadow-sm flex items-center gap-4 hover:border-primary/20 transition-all">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Average Order Value</span>
            <span className="text-lg font-black text-foreground mt-0.5 block">{currencySymbol}{Math.round(averageOrderValue).toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-card text-card-foreground p-5 rounded-2xl border border-border/60 shadow-sm flex items-center gap-4 hover:border-primary/20 transition-all">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Unique Shoppers</span>
            <span className="text-lg font-black text-foreground mt-0.5 block">{uniqueCustomers}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Graph - Widescreen CSS layout (2 columns) */}
        <div className="lg:col-span-2 bg-card text-card-foreground rounded-2xl border border-border/50 shadow-md p-6 space-y-6 flex flex-col justify-between">
          <div className="border-b pb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Revenue Trends (Last 6 Months)</h3>
          </div>

          {/* High-Fidelity Interactive CSS Column Chart */}
          <div className="h-[280px] flex items-end justify-between gap-4 px-4 pt-6 border-b border-border/40 pb-2">
            {last6Months.map((m, idx) => {
              const heightPercent = (m.revenue / maxMonthlyRevenue) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2.5 h-full justify-end group cursor-default">
                  {/* Floating tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 bg-gray-950 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border border-gray-800 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 text-center shadow-lg pointer-events-none">
                    <span className="block text-primary">{currencySymbol}{m.revenue.toLocaleString()}</span>
                    <span className="block text-gray-500 font-mono mt-0.5">{m.orderCount} orders</span>
                  </div>
                  
                  {/* Animated Column Bar */}
                  <div 
                    className="w-full bg-gradient-to-t from-primary/75 to-primary rounded-t-xl group-hover:from-primary group-hover:to-primary/90 transition-all duration-500 shadow-md shadow-primary/10 relative overflow-hidden" 
                    style={{ height: `${Math.max(heightPercent, 3)}%` }}
                  >
                    {/* Glowing highlight strip */}
                    <div className="absolute inset-y-0 left-0 w-1/3 bg-white/10 blur-[1px]" />
                  </div>
                  
                  {/* Label Month */}
                  <span className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-wider">{m.monthName}</span>
                </div>
              );
            })}
          </div>
          
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            💡 Hover over the bars to see month-on-month sales amounts and volumes. Data automatically updates with live WhatsApp checkout cloud syncs.
          </p>
        </div>

        {/* Top Products Leaderboard - 1 column */}
        <div className="bg-card text-card-foreground rounded-2xl border border-border/50 shadow-md p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b pb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-sm uppercase tracking-wider">Top Performing Products</h3>
            </div>

            {topSellingProducts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground italic text-xs">
                No product items sales recorded yet. Once checkout happens, rankings will populate!
              </div>
            ) : (
              <div className="space-y-4">
                {topSellingProducts.map((prod, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-muted/20 border p-3 rounded-xl shadow-inner relative group">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <h4 className="font-bold text-xs truncate text-foreground group-hover:text-primary transition-all">{prod.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{prod.quantity} units sold</p>
                    </div>
                    <div className="text-right shrink-0 font-black text-xs">
                      {currencySymbol}{prod.revenue.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-muted/40 p-4 rounded-xl text-[10px] text-muted-foreground border leading-relaxed text-left">
            📈 Leaderboards calculate total items checked out via verified WhatsApp checkout sessions.
          </div>
        </div>
      </div>
    </div>
  );
}
