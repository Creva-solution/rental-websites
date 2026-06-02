'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, ReceiptText, CheckCircle, Clock, Printer, RotateCw, Search, Filter, 
  Download, ArrowUpRight, Check, Send, Copy, AlertTriangle, Sparkles, MessageSquare, 
  Trash2, Calendar, ShoppingCart, Users, Award, ShieldAlert, BadgeAlert, HelpCircle,
  ShoppingBag, TrendingUp, X, BarChart3
} from 'lucide-react';

export default function OrdersPage() {
  const [store, setStore] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Selected Order Drawer/Modal
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // Bulk Actions Selection
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkPrintOrders, setBulkPrintOrders] = useState<any[]>([]);
  
  // Extra Fields states for Edit/drawer
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [payMethod, setPayMethod] = useState('WhatsApp Cash');
  const [payStatus, setPayStatus] = useState('unpaid');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');

  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setRefreshing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setRefreshing(false);
      return;
    }
    
    const { data: storeData } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', user.id)
      .neq('subdomain', '__creva_saas_global_settings__')
      .maybeSingle();

    if (storeData) {
      setStore(storeData);
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
        .eq('store_id', storeData.id)
        .order('created_at', { ascending: false });
      if (ordData) setOrders(ordData);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const currencySymbol = store?.currency === 'USD' ? '$' : '₹';

  // 1. FAIL-PROOF PERSISTENT SAVE FOR EXTRA FIELDS (LOCALSTORAGE FALLBACK)
  const getExtraFields = (orderId: string) => {
    if (typeof window === 'undefined') return { tracking_number: '', delivery_date: '', payment_method: 'WhatsApp Cash', payment_status: 'unpaid' };
    const key = `creva_order_extra_${orderId}`;
    const local = localStorage.getItem(key);
    if (local) return JSON.parse(local);
    return {
      tracking_number: '',
      delivery_date: '',
      payment_method: 'WhatsApp Cash',
      payment_status: 'unpaid'
    };
  };

  const saveExtraFields = async (orderId: string, fields: { tracking_number?: string; delivery_date?: string; payment_method?: string; payment_status?: string }) => {
    const key = `creva_order_extra_${orderId}`;
    const existing = getExtraFields(orderId);
    const updated = { ...existing, ...fields };
    localStorage.setItem(key, JSON.stringify(updated));

    // Optimistically update orders local state as well
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...fields } : o));

    try {
      await supabase
        .from('orders')
        .update(fields)
        .eq('id', orderId);
    } catch (e) {
      console.warn("Extra columns not present in database, relying on local sandbox:", e);
    }
  };

  // 2. DYNAMIC SEARCH & FILTER CONTROLS
  const processedOrders = useMemo(() => {
    return orders.filter(order => {
      const extra = getExtraFields(order.id);
      
      // Order ID or Customer Name search
      const matchesSearch = 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_phone?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Product Name search
      const matchesProduct = !productSearchQuery.trim() || (order.order_items && order.order_items.some((item: any) => 
        item.products?.name?.toLowerCase().includes(productSearchQuery.toLowerCase())
      ));

      // Status filters
      const matchesStatus = statusFilter === 'all' || (order.status || 'pending') === statusFilter;
      
      // Payment Method filters
      const matchesPayMethod = paymentMethodFilter === 'all' || extra.payment_method === paymentMethodFilter;

      // Payment Status filters
      const matchesPayStatus = paymentStatusFilter === 'all' || extra.payment_status === paymentStatusFilter;

      // Date range filters
      let matchesDate = true;
      const oDate = new Date(order.created_at);
      const now = new Date();
      if (dateFilter === 'today') {
        matchesDate = oDate.toDateString() === now.toDateString();
      } else if (dateFilter === '7days') {
        matchesDate = (now.getTime() - oDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
      } else if (dateFilter === '30days') {
        matchesDate = (now.getTime() - oDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
      }

      return matchesSearch && matchesProduct && matchesStatus && matchesPayMethod && matchesPayStatus && matchesDate;
    });
  }, [orders, searchQuery, productSearchQuery, statusFilter, paymentMethodFilter, paymentStatusFilter, dateFilter]);

  // 3. STATS SUMMARY CARDS CALCULATIONS
  const statsSummary = useMemo(() => {
    const today = new Date().toDateString();
    
    const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === today);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    
    const pendingCount = orders.filter(o => (o.status || 'pending') === 'pending').length;
    const cancelledCount = orders.filter(o => o.status === 'cancelled').length;
    
    // Extract refund count based on status or comments
    const refundCount = orders.filter(o => o.status === 'refunded' || o.status === 'refund_requested').length;
    
    const grossTotal = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const aov = orders.length > 0 ? Math.round(grossTotal / orders.length) : 0;

    return {
      todayCount: todayOrders.length,
      todayRevenue,
      pendingCount,
      cancelledCount,
      refundCount,
      aov
    };
  }, [orders]);

  // 4. ORDER STATUS TRANSITION CONTROLS
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (error) throw error;
      
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update status");
    }
  };

  // 5. BULK STATUS UPDATES
  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedOrderIds.length === 0) return;
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .in('id', selectedOrderIds);

      if (error) throw error;

      setOrders(prev => prev.map(o => 
        selectedOrderIds.includes(o.id) ? { ...o, status: newStatus } : o
      ));
      setSelectedOrderIds([]);
      alert(`Successfully updated status to '${newStatus}' for selected orders!`);
    } catch (e) {
      alert("Failed to update selected orders.");
    }
  };

  // Bulk CSV Export
  const handleBulkExport = () => {
    if (selectedOrderIds.length === 0) return alert("Select orders to export");
    const target = orders.filter(o => selectedOrderIds.includes(o.id));
    let csvContent = "data:text/csv;charset=utf-8,Order ID,Customer,Phone,Amount,Status,Date\n";
    target.forEach(o => {
      csvContent += `${o.id},${o.customer_name},${o.customer_phone},${o.total_amount},${o.status},${new Date(o.created_at).toLocaleDateString()}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "creva_bulk_orders_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBulkPrint = () => {
    const ordersToPrint = orders.filter(o => selectedOrderIds.includes(o.id));
    setBulkPrintOrders(ordersToPrint);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // WhatsApp Redirect Text Generator
  const handleWhatsAppRedirect = (order: any) => {
    const cleanPhone = order.customer_phone.replace(/[^0-9]/g, '');
    const storeName = store?.store_name || 'Our Store';
    const text = `Hi ${order.customer_name}! Your order #${order.id.substring(0, 6).toUpperCase()} at ${storeName} has been marked as '${order.status || 'pending'}'. Total Amount: ${currencySymbol}${Number(order.total_amount).toLocaleString()}. Thank you for shopping with us!`;
    window.open(`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Copy storefront order tracking link
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const handleCopyLink = (orderId: string) => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port ? `:${window.location.port}` : '';
    const trackingLink = hostname === 'localhost' || hostname.includes('127.0.0.1')
      ? `${protocol}//${store?.subdomain}.localhost${port}/?trackOrder=${orderId}`
      : `${protocol}//${store?.subdomain}.crevasolution.in/?trackOrder=${orderId}`;

    navigator.clipboard.writeText(trackingLink);
    setCopiedOrderId(orderId);
    setTimeout(() => setCopiedOrderId(null), 2500);
  };

  // AI-POWERED STORE INSIGHTS ALGORITHMS
  const aiInsights = useMemo(() => {
    const delayed = orders.filter(o => {
      const diff = new Date().getTime() - new Date(o.created_at).getTime();
      return (o.status === 'pending' || o.status === 'processing') && (diff > 48 * 60 * 60 * 1000);
    });

    // Suggest frequently bought together items
    const prodCounts: Record<string, number> = {};
    orders.forEach(o => {
      if (o.order_items) {
        o.order_items.forEach((i: any) => {
          const name = i.products?.name || 'Deleted Product';
          prodCounts[name] = (prodCounts[name] || 0) + i.quantity;
        });
      }
    });

    const topProducts = Object.entries(prodCounts).sort((a, b) => b[1] - a[1]).map(e => e[0]);
    const pair = topProducts.length >= 2 ? `${topProducts[0]} and ${topProducts[1]}` : 'N/A';

    // Highlight VIP customer with highest spending
    const vipSales: Record<string, { name: string; amount: number }> = {};
    orders.forEach(o => {
      const phone = o.customer_phone;
      vipSales[phone] = {
        name: o.customer_name || 'Anonymous VIP',
        amount: (vipSales[phone]?.amount || 0) + (Number(o.total_amount) || 0)
      };
    });

    const topVip = Object.values(vipSales).sort((a, b) => b.amount - a.amount)[0];

    return {
      delayedCount: delayed.length,
      frequentlyBoughtPair: pair,
      vipName: topVip?.name || 'N/A',
      vipAmount: topVip?.amount || 0
    };
  }, [orders]);

  // Analytics Trends (Last 7 Days) for Sidebar section in Orders
  const last7DaysSummary = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        label: d.toLocaleDateString(undefined, { weekday: 'short' }),
        dateStr: d.toDateString(),
        count: 0
      };
    });

    orders.forEach(o => {
      const dateStr = new Date(o.created_at).toDateString();
      const match = days.find(d => d.dateStr === dateStr);
      if (match) match.count++;
    });

    return days;
  }, [orders]);

  const customerLeaderboard = useMemo(() => {
    const customerMap = new Map<string, { name: string; phone: string; count: number; spend: number }>();
    processedOrders.forEach(o => {
      const phone = o.customer_phone;
      if (customerMap.has(phone)) {
        const existing = customerMap.get(phone)!;
        customerMap.set(phone, {
          ...existing,
          count: existing.count + 1,
          spend: existing.spend + (Number(o.total_amount) || 0)
        });
      } else {
        customerMap.set(phone, {
          name: o.customer_name || 'Anonymous Customer',
          phone,
          count: 1,
          spend: Number(o.total_amount) || 0
        });
      }
    });
    return Array.from(customerMap.values()).sort((a, b) => b.spend - a.spend);
  }, [processedOrders]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 px-2 sm:px-0">
      
      <style>{`
        @media print {
          aside, header, nav, .print\\:hidden, button, select, input, .bottom-6 {
            display: none !important;
            visibility: hidden !important;
          }
          html, body {
            background: white !important;
            color: black !important;
          }
          .fixed.inset-0 {
            position: absolute !important;
            background: white !important;
            display: block !important;
          }
          .print-invoice-sheet {
            page-break-after: always !important;
            break-after: page !important;
            display: block !important;
            padding: 2cm !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* Header Print:Hidden */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-border/40 text-left print:hidden">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#3C77C3] bg-[#3C77C3]/10 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <ShoppingCart className="w-3.5 h-3.5" /> Order Operations Dashboard
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-3 text-gray-950">
            📦 Orders & Billing Center
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage incoming WhatsApp checkouts, update tracking details, bulk print invoices, and view AI operations metrics.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground text-xs font-bold rounded-xl border border-border hover:bg-secondary/80 disabled:opacity-50 transition-all shadow-sm shrink-0 self-start md:self-auto cursor-pointer"
        >
          <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Sync Orders'}
        </button>
      </div>

      {/* AI Store Insights Notification Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left print:hidden">
        
        {/* Insight 1: Delayed Alert */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex gap-3 text-[11px] leading-relaxed text-amber-800 shadow-sm relative overflow-hidden animate-in fade-in duration-200">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <strong className="block text-amber-950 font-extrabold text-xs">AI Operations: Delayed Orders Alert</strong>
            {aiInsights.delayedCount > 0 ? (
              <span className="block mt-0.5 font-medium">{aiInsights.delayedCount} orders have been pending for over 48 hours. Consider sending friendly WhatsApp dispatch updates.</span>
            ) : (
              <span className="block mt-0.5 font-medium text-amber-700">Excellent fulfillment cycle! Zero orders are delayed beyond the standard 48-hour SLA.</span>
            )}
          </div>
        </div>

        {/* Insight 2: Recommendations */}
        <div className="bg-[#3C77C3]/5 border border-[#3C77C3]/15 rounded-2xl p-4 flex gap-3 text-[11px] leading-relaxed text-[#3C77C3] shadow-sm relative overflow-hidden animate-in fade-in duration-200">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#3C77C3]/5 rounded-full blur-xl pointer-events-none" />
          <Sparkles className="w-5 h-5 text-[#3C77C3] shrink-0" />
          <div>
            <strong className="block text-slate-900 font-extrabold text-xs">AI Marketing: Bought Together Recommendation</strong>
            <span className="block mt-0.5 font-medium text-slate-600">
              {aiInsights.frequentlyBoughtPair !== 'N/A' ? (
                <>Users checked out <strong className="text-[#3C77C3]">{aiInsights.frequentlyBoughtPair}</strong> together frequently. Suggest automated combo discount voucher.</>
              ) : (
                'Fulfillment data loading. Paired item suggestions will populate after higher catalog checkouts.'
              )}
            </span>
          </div>
        </div>

        {/* Insight 3: High Value VIP */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex gap-3 text-[11px] leading-relaxed text-emerald-800 shadow-sm relative overflow-hidden animate-in fade-in duration-200">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <Users className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <strong className="block text-emerald-950 font-extrabold text-xs">AI CRM: High Value VIP Spotlight</strong>
            <span className="block mt-0.5 font-medium text-emerald-700">
              {aiInsights.vipAmount > 0 ? (
                <>Merchant VIP <strong className="text-emerald-950 font-black">{aiInsights.vipName}</strong> has placed multiple orders totaling <strong className="text-emerald-950">{currencySymbol}{aiInsights.vipAmount.toLocaleString()}</strong>. Send a loyalty thank-you!</>
              ) : (
                'VIP analysis index compiling. Loyalty highlights will sync as repeat purchases accumulate.'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Orders Summary Metrics Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-left print:hidden">
        {[
          { label: "Today's Orders", val: statsSummary.todayCount, icon: ShoppingBag, color: 'text-[#3C77C3] bg-[#3C77C3]/10 border-[#3C77C3]/10' },
          { label: "Today's Revenue", val: `${currencySymbol}${statsSummary.todayRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/10' },
          { label: "Pending Orders", val: statsSummary.pendingCount, icon: Clock, color: 'text-amber-500 bg-amber-500/10 border-amber-500/10' },
          { label: "Cancelled Orders", val: statsSummary.cancelledCount, icon: AlertTriangle, color: 'text-rose-500 bg-rose-500/10 border-rose-500/10' },
          { label: "Refund Requests", val: statsSummary.refundCount, icon: BadgeAlert, color: 'text-purple-500 bg-purple-500/10 border-purple-500/10' },
          { label: "Average Value", val: `${currencySymbol}${statsSummary.aov.toLocaleString()}`, icon: ReceiptText, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/10' }
        ].map((card, idx) => (
          <div key={idx} className="bg-card border p-4 rounded-xl shadow-inner flex flex-col justify-between hover:border-[#3C77C3]/20 transition-all">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{card.label}</span>
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center border ${card.color}`}>
                <card.icon className="w-3.5 h-3.5" />
              </span>
            </div>
            <span className="text-base font-black text-gray-950 mt-3 block">{card.val}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: Advanced Filters and Orders Table (2 columns on lg) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Advanced Multi-Filters Panel */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4 text-left print:hidden">
            <div className="flex items-center gap-2 border-b pb-2">
              <Filter className="w-4 h-4 text-[#3C77C3]" />
              <h3 className="font-bold text-xs uppercase tracking-widest text-gray-800">Advanced Dashboard Filters</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Filter 1: Status */}
              <div className="space-y-1">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block">Order Status</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full bg-background border rounded-lg h-9 px-2 text-xs outline-none focus:border-[#3C77C3]"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed / Shipped</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Filter 2: Payment Method */}
              <div className="space-y-1">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block">Payment Method</span>
                <select
                  value={paymentMethodFilter}
                  onChange={e => setPaymentMethodFilter(e.target.value)}
                  className="w-full bg-background border rounded-lg h-9 px-2 text-xs outline-none focus:border-[#3C77C3]"
                >
                  <option value="all">All Methods</option>
                  <option value="WhatsApp Cash">WhatsApp Cash</option>
                  <option value="UPI Transfer">UPI Transfer</option>
                  <option value="Razorpay Online">Razorpay Online</option>
                </select>
              </div>

              {/* Filter 3: Payment Status */}
              <div className="space-y-1">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block">Payment Status</span>
                <select
                  value={paymentStatusFilter}
                  onChange={e => setPaymentStatusFilter(e.target.value)}
                  className="w-full bg-background border rounded-lg h-9 px-2 text-xs outline-none focus:border-[#3C77C3]"
                >
                  <option value="all">All statuses</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="pending">Pending Approval</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Date Filters */}
              <div className="space-y-1">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block">Date Range</span>
                <select
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value as any)}
                  className="w-full bg-background border rounded-lg h-9 px-2 text-xs outline-none focus:border-[#3C77C3]"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                </select>
              </div>

              {/* Customer Search */}
              <div className="space-y-1 sm:col-span-2 relative">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block">Search Customer or ID</span>
                <div className="relative mt-1">
                  <input
                    type="text"
                    placeholder="e.g. customer name, phone number, order ID..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-background border rounded-lg h-9 pl-8 pr-3 text-xs outline-none focus:border-[#3C77C3]"
                  />
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block">Search by Catalog Product</span>
              <div className="relative mt-1">
                <input
                  type="text"
                  placeholder="Filter orders containing a specific product item..."
                  value={productSearchQuery}
                  onChange={e => setProductSearchQuery(e.target.value)}
                  className="w-full bg-background border rounded-lg h-9 pl-8 pr-3 text-xs outline-none focus:border-[#3C77C3]"
                />
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Improved Order Table */}
          <div className="bg-card text-card-foreground rounded-2xl border shadow-sm flex flex-col print:hidden overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] font-black uppercase tracking-wider bg-muted/40 border-b text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 w-12 text-center">
                      <input 
                        type="checkbox"
                        checked={processedOrders.length > 0 && selectedOrderIds.length === processedOrders.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrderIds(processedOrders.map(o => o.id));
                          } else {
                            setSelectedOrderIds([]);
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-[#3C77C3] focus:ring-[#3C77C3] cursor-pointer accent-[#3C77C3]"
                      />
                    </th>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Amt</th>
                    <th className="px-6 py-4">Payment</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
                  ) : processedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <ReceiptText className="w-12 h-12 mb-3 opacity-20" />
                          <p className="font-bold text-xs uppercase tracking-widest">No matching orders found</p>
                          <p className="text-[10px] mt-0.5">Modify your filters or search criteria above.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    processedOrders.map((order) => {
                      const extra = getExtraFields(order.id);
                      return (
                        <tr key={order.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4 w-12 text-center">
                            <input 
                              type="checkbox"
                              checked={selectedOrderIds.includes(order.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedOrderIds(prev => [...prev, order.id]);
                                } else {
                                  setSelectedOrderIds(prev => prev.filter(id => id !== order.id));
                                }
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-[#3C77C3] focus:ring-[#3C77C3] cursor-pointer accent-[#3C77C3]"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => {
                                setSelectedOrder(order);
                                setEditingOrder(order);
                                setTrackingNumber(extra.tracking_number || '');
                                setDeliveryDate(extra.delivery_date || '');
                                setPayMethod(extra.payment_method || 'WhatsApp Cash');
                                setPayStatus(extra.payment_status || 'unpaid');
                              }}
                              className="font-mono text-xs font-bold text-[#3C77C3] hover:underline uppercase block text-left"
                            >
                              #{order.id.substring(0, 8).toUpperCase()}
                            </button>
                            <span className="text-[9px] text-muted-foreground mt-0.5 font-bold uppercase tracking-wider block">
                              {order.order_items?.length || 0} items
                            </span>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground text-xs leading-normal">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-left">
                            <div className="font-bold text-xs text-gray-900 truncate max-w-[100px]">{order.customer_name}</div>
                            <div className="text-[10px] text-muted-foreground font-medium">{order.customer_phone}</div>
                          </td>
                          <td className="px-6 py-4 font-black text-xs">
                            {currencySymbol}{Number(order.total_amount).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                              extra.payment_status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-rose-50 text-rose-700 border-rose-100'
                            }`}>
                              {extra.payment_status}
                            </span>
                            <span className="block text-[8px] text-muted-foreground font-mono mt-0.5">{extra.payment_method}</span>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={order.status || 'pending'}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className={`text-[9px] font-black uppercase tracking-widest rounded-full px-2.5 py-1 outline-none border cursor-pointer transition-all ${
                                order.status === 'completed' 
                                  ? 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100' 
                                  : order.status === 'processing'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                                  : order.status === 'cancelled'
                                  ? 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                                  : 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100'
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button 
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setEditingOrder(order);
                                  setTrackingNumber(extra.tracking_number || '');
                                  setDeliveryDate(extra.delivery_date || '');
                                  setPayMethod(extra.payment_method || 'WhatsApp Cash');
                                  setPayStatus(extra.payment_status || 'unpaid');
                                }}
                                className="p-1 hover:bg-muted rounded text-[#3C77C3] transition-all flex items-center justify-center"
                                title="View Details"
                              >
                                <ReceiptText className="w-3.5 h-3.5" />
                              </button>

                              <button 
                                onClick={() => handleWhatsAppRedirect(order)}
                                className="p-1 hover:bg-emerald-50 rounded text-emerald-600 transition-all flex items-center justify-center"
                                title="WhatsApp Customer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>

                              <button 
                                onClick={() => handleCopyLink(order.id)}
                                className={`p-1 hover:bg-indigo-50 rounded transition-all flex items-center justify-center ${copiedOrderId === order.id ? 'text-emerald-600' : 'text-indigo-650'}`}
                                title="Copy Storefront tracking link"
                              >
                                {copiedOrderId === order.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Trends Summary & Detailed Order Inspector (1 column on lg) */}
        <div className="space-y-6">
          
          {/* Detailed Order Inspector Card / Edit drawer (Pops up when selectedOrder is active) */}
          {selectedOrder ? (() => {
            const extra = getExtraFields(selectedOrder.id);
            const timelineSteps = [
              { label: 'Placed', active: true, desc: 'WhatsApp Checkout matched' },
              { label: 'Payment', active: extra.payment_status === 'paid', desc: extra.payment_method },
              { label: 'Accepted', active: selectedOrder.status === 'processing' || selectedOrder.status === 'completed', desc: 'Fulfillment agreed' },
              { label: 'Packed', active: selectedOrder.status === 'processing' || selectedOrder.status === 'completed', desc: 'Luxury soap wrap' },
              { label: 'Shipped', active: selectedOrder.status === 'completed', desc: extra.tracking_number ? `TRK: ${extra.tracking_number}` : 'Awaiting courier' },
              { label: 'Delivered', active: selectedOrder.status === 'completed', desc: extra.delivery_date ? `Date: ${extra.delivery_date}` : 'Awaiting confirmation' }
            ];

            return (
              <div className="bg-card border rounded-2xl p-6 shadow-md text-left space-y-6 animate-in slide-in-from-right duration-300">
                <div className="border-b pb-4 flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-[#3C77C3] bg-[#3C77C3]/10 px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                      #{selectedOrder.id.substring(0, 8).toUpperCase()}
                    </span>
                    <h3 className="font-extrabold text-sm text-gray-900 mt-2">Active Order Inspection</h3>
                    <p className="text-[10px] text-gray-400">Manage payment status, dispatch timeline, and print bills.</p>
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="p-1 hover:bg-muted text-gray-400 hover:text-foreground rounded-full transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Purchase Items List */}
                <div className="space-y-3">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block">Ordered Items</span>
                  <div className="bg-muted/15 border p-3 rounded-xl space-y-2">
                    {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                      selectedOrder.order_items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-800 truncate max-w-[150px]">{item.products?.name}</span>
                          <span className="text-muted-foreground">x{item.quantity}</span>
                          <span className="font-extrabold text-gray-900">{currencySymbol}{(Number(item.price_at_purchase) * item.quantity).toLocaleString()}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-muted-foreground italic">No item list. Direct checkout sum total matches.</p>
                    )}
                    <div className="border-t pt-2 mt-2 flex justify-between items-center font-black text-xs text-[#3C77C3]">
                      <span>Order Total</span>
                      <span>{currencySymbol}{Number(selectedOrder.total_amount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Horizontal Order Timeline Tracking */}
                <div className="space-y-3">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block">Fulfillment Timeline Status</span>
                  
                  {/* Timeline Row */}
                  <div className="grid grid-cols-6 gap-1 relative pb-2 before:absolute before:left-3 before:right-3 before:top-[11px] before:h-[2px] before:bg-gray-100">
                    {timelineSteps.map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center text-center space-y-2 z-10 relative">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center border text-[9px] font-bold shadow-sm transition-all ${
                          step.active 
                            ? 'bg-[#3C77C3] border-[#3C77C3] text-white ring-4 ring-[#3C77C3]/10' 
                            : 'bg-white border-gray-200 text-gray-400'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <span className={`text-[8px] font-black uppercase tracking-wider block ${step.active ? 'text-[#3C77C3]' : 'text-gray-400'}`}>
                            {step.label}
                          </span>
                          <span className="text-[6px] text-gray-400 leading-none truncate max-w-[50px] block mt-0.5">{step.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Edit Form Drawer */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block">Update Logistics Details</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Payment Method</span>
                      <select
                        value={payMethod}
                        onChange={e => {
                          setPayMethod(e.target.value);
                          saveExtraFields(selectedOrder.id, { payment_method: e.target.value });
                        }}
                        className="w-full bg-background border rounded-lg h-9 px-2 text-xs outline-none focus:border-[#3C77C3]"
                      >
                        <option value="WhatsApp Cash">WhatsApp Cash</option>
                        <option value="UPI Transfer">UPI Transfer</option>
                        <option value="Razorpay Online">Razorpay Online</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Payment Status</span>
                      <select
                        value={payStatus}
                        onChange={e => {
                          setPayStatus(e.target.value);
                          saveExtraFields(selectedOrder.id, { payment_status: e.target.value });
                        }}
                        className="w-full bg-background border rounded-lg h-9 px-2 text-xs outline-none focus:border-[#3C77C3]"
                      >
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="pending">Pending Approval</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Tracking Code</span>
                      <input
                        type="text"
                        placeholder="e.g. DEL-9932"
                        value={trackingNumber}
                        onChange={e => {
                          setTrackingNumber(e.target.value);
                          saveExtraFields(selectedOrder.id, { tracking_number: e.target.value });
                        }}
                        className="w-full bg-background border rounded-lg h-9 px-3 text-xs outline-none focus:border-[#3C77C3]"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Delivery Date</span>
                      <input
                        type="date"
                        value={deliveryDate}
                        onChange={e => {
                          setDeliveryDate(e.target.value);
                          saveExtraFields(selectedOrder.id, { delivery_date: e.target.value });
                        }}
                        className="w-full bg-background border rounded-lg h-9 px-3 text-xs outline-none focus:border-[#3C77C3]"
                      />
                    </div>
                  </div>
                </div>

                {/* Print and Bill Generator Quick Actions */}
                <div className="flex gap-2 border-t pt-4">
                  <button
                    onClick={() => setBulkPrintOrders([selectedOrder])}
                    className="flex-1 bg-secondary text-secondary-foreground font-bold uppercase tracking-wider text-[10px] py-3 rounded-xl border flex items-center justify-center gap-1 hover:bg-secondary/90 transition-all cursor-pointer shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" /> PDF Invoice
                  </button>
                  <button
                    onClick={() => handleWhatsAppRedirect(selectedOrder)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider text-[10px] py-3 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md shadow-emerald-600/10"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Ping Customer
                  </button>
                </div>

              </div>
            );
          })() : (
            /* Graph Trends Summary (If no active order inspector is open) */
            <div className="bg-card border rounded-2xl p-6 shadow-sm text-left space-y-6 print:hidden">
              <div className="border-b pb-3 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#3C77C3]" />
                <h3 className="font-bold text-xs uppercase tracking-widest text-gray-800">Weekly Order Influx Volume</h3>
              </div>

              {/* Weekly Influx Chart */}
              <div className="h-[180px] flex items-end justify-between gap-3 px-2 pt-6 border-b pb-1">
                {last7DaysSummary.map((item, idx) => {
                  const maxCount = Math.max(...last7DaysSummary.map(d => d.count), 2);
                  const barHeight = (item.count / maxCount) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <div className="opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded border border-slate-800 transition-all duration-200 transform translate-y-1 block shadow-md pointer-events-none z-10">
                        {item.count} orders
                      </div>
                      <div
                        className="w-full bg-[#3C77C3]/20 hover:bg-[#3C77C3] rounded-t transition-all duration-300 relative overflow-hidden"
                        style={{ height: `${Math.max(barHeight, 5)}%` }}
                      />
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1 block">{item.label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-4 pt-2">
                <h4 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">🏆 Top Performing VIP Buyers</h4>
                {customerLeaderboard.slice(0, 3).map((vip, idx) => (
                  <div key={idx} className="bg-muted/15 border p-2.5 rounded-lg flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-gray-800">{vip.name}</span>
                      <span className="block text-[8px] text-gray-400 mt-0.5">{vip.phone}</span>
                    </div>
                    <span className="font-black text-[#3C77C3]">{currencySymbol}{vip.spend.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Floating Bulk Actions Bar (Pops up when checkboxes are active) */}
      {selectedOrderIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-slate-950 border border-slate-800 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-5 duration-300 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#3C77C3] text-white flex items-center justify-center font-bold text-xs shadow-md">
              {selectedOrderIds.length}
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Selected</span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkStatusUpdate('processing')}
              className="px-3 py-2 bg-[#3C77C3] hover:bg-[#3C77C3]/90 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer shadow-sm shadow-[#3C77C3]/10"
            >
              Accept
            </button>
            <button
              onClick={() => handleBulkStatusUpdate('completed')}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer shadow-sm shadow-emerald-600/10"
            >
              Ship
            </button>
            <button
              onClick={handleBulkPrint}
              className="px-3 py-2 bg-secondary text-secondary-foreground border hover:bg-secondary/90 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer"
            >
              Print Bills
            </button>
            <button
              onClick={handleBulkExport}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer"
            >
              Export CSV
            </button>
            <button
              onClick={() => setSelectedOrderIds([])}
              className="px-3 py-2 text-slate-400 hover:text-white text-[9px] font-bold uppercase tracking-widest"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Bulk Invoice Print Preview Modal (Retained) */}
      {bulkPrintOrders.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:block">
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col print:shadow-none print:max-w-none print:h-auto print:max-h-none print:rounded-none">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex justify-between items-center print:hidden">
              <div>
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Printer className="w-4 h-4 text-primary" />
                  Bulk Invoice Print Preview
                </h2>
                <p className="text-xs text-muted-foreground">Preparing {bulkPrintOrders.length} invoices for batch printing.</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handlePrint}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-md hover:bg-primary/90 flex items-center gap-2 shadow-md shadow-primary/10"
                >
                  <Printer className="w-3.5 h-3.5" /> Trigger Batch Print
                </button>
                <button 
                  onClick={() => setBulkPrintOrders([])} 
                  className="px-4 py-2 bg-muted text-foreground text-xs font-medium rounded-md hover:bg-muted/80"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Area - renders each invoice page */}
            <div className="flex-1 overflow-y-auto p-6 bg-muted/10 print:bg-white print:p-0 space-y-8 print:space-y-0 print:overflow-visible print-invoice-container">
              {bulkPrintOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="bg-white text-black p-10 border border-border rounded-xl shadow-sm print:shadow-none print:border-none print:p-8 print:bg-white print-invoice-sheet"
                  style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
                >
                  {/* Invoice Header */}
                  <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8 text-left">
                    <div>
                      <div className="mb-4">
                        <svg width="120" height="110" viewBox="0 0 206 189" fill="none" xmlns="http://www.w3.org/2000/svg" className="select-none">
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
                          <path fill-rule="evenodd" clip-rule="evenodd" d="M151.609 0.266528C150.787 0.443259 149.224 1.0234 148.136 1.5553C143.392 3.87416 140.27 8.63054 139.851 14.1765L139.703 16.1346L134.13 16.2005L128.557 16.2667L127.436 16.888C125.665 17.869 124.797 19.2248 124.416 21.6028C123.447 27.6533 122.677 31.4413 122.315 31.9388C122.095 32.241 121.492 32.7046 120.975 32.9687C120.048 33.4427 119.926 33.4489 111.64 33.4489H103.244L102.721 33.9729C101.97 34.7238 101.988 36.0288 102.759 36.635C103.303 37.0632 103.565 37.0779 110.923 37.0894C116.236 37.098 117.269 46.6991 117.928 47.1008C118.892 47.6888 119.345 48.6621 119.21 49.8581C119.121 50.6467 118.938 50.9804 118.234 51.6371L117.368 52.4454H108.598C98.9653 52.4454 98.8808 52.4559 98.359 53.7161C98.1419 54.2396 98.1419 54.4932 98.359 55.0168C98.8751 56.2631 99.0529 56.2874 107.649 56.2874C114.507 56.2874 115.544 56.3305 116.062 56.6366C116.879 57.119 117.351 58.0044 117.351 59.0524C117.351 60.3138 116.841 61.1584 115.79 61.6357C114.992 61.9975 114.344 62.0415 109.752 62.0457L104.607 62.0504L104.042 62.5738C103.285 63.2754 103.267 64.4209 104.001 65.155C104.524 65.6779 104.534 65.679 108.991 65.679C111.446 65.679 113.767 65.7413 114.147 65.8173C115.132 66.0143 116.209 67.1677 116.386 68.2151C116.692 70.0245 118.977 72.3531 121.074 72.9922C121.743 73.1962 128.318 73.2562 150.008 73.2562C182.384 73.2562 179.408 73.4558 181.737 71.1284C182.845 70.0204 183.119 69.5908 183.497 68.3656C183.744 67.5675 183.945 66.5645 183.943 66.1368C183.942 65.7088 183.602 62.7654 183.188 59.5958C182.383 53.4384 182.226 52.1897 181.708 47.8564C181.525 46.3303 181.16 43.3527 180.896 41.2396L180.416 37.3976L159.822 37.2892L139.229 37.181L159.773 37.1291L180.317 37.0775V36.4604C180.317 36.121 180.082 33.984 179.795 31.7113C179.508 29.4387 179.121 26.1865 178.935 24.4843C178.749 22.7821 178.547 20.9909 178.487 20.504C178.358 19.4712 177.423 17.9619 176.48 17.2644C175.295 16.3886 174.251 16.16 171.432 16.16H168.791L168.788 15.0394C168.781 12.0397 167.431 8.12062 165.521 5.54926C162.458 1.42766 156.581 -0.80368 151.609 0.266528ZM151.374 4.18344C146.936 5.45407 143.946 9.38635 143.476 14.5718L143.332 16.16H154.254H165.175L165.043 14.7192C164.742 11.4104 163.724 8.9601 161.822 6.96675C159.204 4.22143 155.079 3.12284 151.374 4.18344ZM147.393 26.1385C152.823 26.1701 161.707 26.1701 167.137 26.1385C172.567 26.1067 168.124 26.0808 157.265 26.0808C146.406 26.0808 141.964 26.1067 147.393 26.1385ZM177.708 26.6196C178.614 27.172 178.911 27.1713 178.076 26.6187C177.724 26.3854 177.34 26.1944 177.222 26.194C177.105 26.1938 177.323 26.3852 177.708 26.6196ZM159.464 30.1408C158.494 30.8201 158.668 32.7172 159.744 33.2077C161.086 33.8195 162.388 33.0449 162.388 31.6347C162.388 30.1557 160.685 29.2857 159.464 30.1408ZM165.971 30.1113C165.05 30.8116 165.079 32.7339 166.019 33.2372C167.255 33.8984 168.791 33.0319 168.791 31.6731C168.791 30.5894 168.094 29.8187 167.121 29.8272C166.69 29.8308 166.172 29.9587 165.971 30.1113ZM172.282 30.3262C171.065 31.3732 171.831 33.4489 173.434 33.4489C174.272 33.4489 175.408 32.4812 175.408 31.7678C175.408 30.0964 173.547 29.2381 172.282 30.3262ZM128.718 41.2127C128.512 41.3248 128.273 41.521 128.187 41.6484C127.887 42.0911 128.026 43.0565 128.45 43.4808C128.831 43.8614 129.162 43.9077 131.504 43.9077H134.131L136.651 51.645C138.037 55.9007 139.309 59.6031 139.479 59.8728C139.648 60.1424 140.093 60.5503 140.468 60.7791C141.118 61.1757 141.613 61.1951 151.075 61.1951C160.527 61.1951 161.033 61.1753 161.681 60.7804C162.055 60.5522 162.468 60.1646 162.6 59.919C162.731 59.6733 163.638 56.8161 164.616 53.5696C166.127 48.5469 166.36 47.574 166.175 47.0449C165.749 45.8229 165.82 45.8287 151.126 45.8287H137.716L137.143 44.0678C136.417 41.8396 136.112 41.4142 135.031 41.1231C134.007 40.8475 129.263 40.915 128.718 41.2127ZM139.21 50.3644C139.474 51.2156 140.159 53.3231 140.731 55.048C141.648 57.8106 141.834 58.1999 142.301 58.3171C143.258 58.5572 159.81 58.3753 160.139 58.1211C160.304 57.9931 160.792 56.6876 161.223 55.2202C161.654 53.7528 162.236 51.8028 162.517 50.8869C162.798 49.971 163.028 49.1307 163.028 49.0192C163.028 48.8942 158.395 48.8169 150.878 48.8169H138.729L139.21 50.3644ZM142.792 63.7509C142.403 63.9947 141.935 64.5522 141.751 64.99C140.834 67.1739 143.407 69.2887 145.459 68.0375C146.394 67.467 146.66 66.8757 146.54 65.6288C146.408 64.2529 145.727 63.5349 144.43 63.4028C143.736 63.3319 143.318 63.4207 142.792 63.7509ZM156.859 63.8805C155.943 64.651 155.632 65.7863 156.058 66.8051C156.429 67.6951 157.503 68.4518 158.396 68.4529C160.854 68.4563 161.863 65.0297 159.779 63.7588C158.791 63.1567 157.663 63.2036 156.859 63.8805Z" fill="#3C77C3"/>
                          <path d="M128.644 29.2416L127.363 35.0046H135.474C137.144 34.9122 137.833 35.454 138.783 37.139H180.191L178.91 28.1743C178.621 27.0979 178.04 26.7687 176.562 26.4668H131.952C129.712 26.719 129.042 27.3728 128.644 29.2416Z" fill="black" stroke="white" stroke-width="0.640332"/>
                          <circle cx="161.194" cy="31.9086" r="2.02772" fill="#D9D9D9"/>
                          <circle cx="166.744" cy="31.9086" r="2.02772" fill="#D9D9D9"/>
                          <circle cx="172.292" cy="31.9086" r="2.02772" fill="#D9D9D9"/>
                          <circle cx="132.779" cy="79.8652" r="6.60545" fill="#D9D9D9"/>
                          <circle cx="132.78" cy="79.8658" r="3.00248" fill="black"/>
                          <circle cx="168.209" cy="79.8652" r="6.60545" fill="#D9D9D9"/>
                          <circle cx="168.209" cy="79.8658" r="3.00248" fill="black"/>
                          <path d="M69.1792 151.022L62.9284 175H55.8578L52.0322 159.219L48.0699 175H40.9994L34.9194 151.022H41.1702L44.6201 168.476L48.8897 151.022H55.3113L59.4102 168.476L62.8942 151.022H69.1792ZM83.4145 155.701V160.551H91.2366V165.06H83.4145V170.32H92.2613V175H77.5736V151.022H92.2613V155.701H83.4145ZM116.035 162.703C117.424 162.999 118.54 163.694 119.383 164.787C120.225 165.857 120.647 167.087 120.647 168.476C120.647 170.48 119.941 172.074 118.529 173.258C117.14 174.419 115.193 175 112.688 175H101.518V151.022H112.312C114.749 151.022 116.65 151.579 118.016 152.695C119.406 153.811 120.1 155.325 120.1 157.238C120.1 158.65 119.724 159.823 118.973 160.756C118.244 161.69 117.265 162.339 116.035 162.703ZM107.359 160.722H111.185C112.141 160.722 112.87 160.517 113.371 160.107C113.895 159.675 114.157 159.049 114.157 158.229C114.157 157.409 113.895 156.783 113.371 156.35C112.87 155.917 112.141 155.701 111.185 155.701H107.359V160.722ZM111.663 170.286C112.642 170.286 113.394 170.07 113.918 169.637C114.464 169.182 114.737 168.533 114.737 167.69C114.737 166.848 114.453 166.187 113.883 165.709C113.337 165.231 112.574 164.992 111.595 164.992H107.359V170.286H111.663Z" fill="black"/>
                          <path d="M135.716 170.218H146.032V175H129.09V170.56L139.337 155.804H129.09V151.022H146.032V155.462L135.716 170.218ZM161.529 170.218H171.844V175H154.902V170.56L165.15 155.804H154.902V151.022H171.844V155.462L161.529 170.218Z" fill="#3C77C3"/>
                          <path d="M13.9434 163.318H34.0181" stroke="#3C77C3" stroke-width="2.50935"/>
                          <path d="M172.868 163.318H192.943" stroke="#3C77C3" stroke-width="2.50935"/>
                        </svg>
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900">{store.store_name}</h1>
                      <p className="text-sm text-gray-500 mt-1">{store.contact_email}</p>
                      <p className="text-sm text-gray-500">{store.contact_phone}</p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-3xl font-light text-gray-300 uppercase tracking-widest mb-4">Invoice</h2>
                      <p className="text-sm text-gray-500 font-medium">Invoice No:</p>
                      <p className="font-mono text-sm text-gray-900 mb-2">INV-{order.id.substring(0, 8).toUpperCase()}</p>
                      <p className="text-sm text-gray-500 font-medium">Date:</p>
                      <p className="text-sm text-gray-900">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-10">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To</p>
                    <h3 className="text-lg font-bold text-gray-900">{order.customer_name}</h3>
                    <p className="text-gray-650 font-medium mt-0.5">WhatsApp: {order.customer_phone}</p>
                    {order.shipping_address && (
                      <p className="text-gray-600 mt-1 max-w-xs">{order.shipping_address}</p>
                    )}
                  </div>

                  {/* Order Items */}
                  <table className="w-full text-left mb-10">
                    <thead>
                      <tr className="border-b-2 border-gray-900 text-sm">
                        <th className="pb-3 font-bold text-gray-900">Description</th>
                        <th className="pb-3 font-bold text-gray-900 text-center">Qty</th>
                        <th className="pb-3 font-bold text-gray-900 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.order_items && order.order_items.length > 0 ? (
                        order.order_items.map((item: any, idx: number) => (
                          <tr key={idx} className="border-b border-gray-200 text-xs">
                            <td className="py-4 text-gray-800">
                              <div className="font-bold">{item.products?.name || 'Unknown Product'}</div>
                              <div className="text-[10px] text-gray-500 mt-1">{currencySymbol}{Number(item.price_at_purchase).toLocaleString()} per item</div>
                            </td>
                            <td className="py-4 text-gray-900 font-medium text-center">{item.quantity}</td>
                            <td className="py-4 text-gray-900 font-bold text-right">{currencySymbol}{(Number(item.price_at_purchase) * item.quantity).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr className="border-b border-gray-200 text-xs">
                          <td className="py-4 text-gray-800">
                            <div className="font-bold">Total WhatsApp Order</div>
                            <div className="text-[10px] text-gray-500 mt-1">Order processed via WhatsApp checkout. Itemized list available in chat history.</div>
                          </td>
                          <td className="py-4 text-gray-900 font-medium text-center">-</td>
                          <td className="py-4 text-gray-900 font-bold text-right">{currencySymbol}{Number(order.total_amount).toLocaleString()}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Total Calculation */}
                  <div className="flex justify-end">
                    <div className="w-1/2">
                      <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
                        <span className="text-gray-500 font-medium">Subtotal</span>
                        <span className="font-bold text-gray-950">{currencySymbol}{Number(order.total_amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-4 text-lg font-bold">
                        <span className="text-gray-900">Total Due</span>
                        <span style={{ color: store.primary_color || '#3C77C3' }}>{currencySymbol}{Number(order.total_amount).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-16 pt-8 border-t border-gray-200 text-center text-xs text-gray-400 font-medium">
                    <p>Thank you for shopping with {store.store_name}!</p>
                    <p className="mt-1 font-mono text-[9px]">Verified Creva Websz Billing Invoice</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
