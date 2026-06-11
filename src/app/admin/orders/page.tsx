'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, ReceiptText, CheckCircle, Clock, Printer, RotateCw, Search, Filter, 
  Download, ArrowUpRight, Check, Send, Copy, AlertTriangle, Sparkles, MessageSquare, 
  Trash2, Calendar, ShoppingCart, Users, Award, ShieldAlert, BadgeAlert, HelpCircle,
  ShoppingBag, TrendingUp, X, BarChart3, Image
} from 'lucide-react';

function numberToWords(num: number): string {
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  function chunk(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' And ' + chunk(n % 100) : '');
  }

  let words = '';
  if (num >= 10000000) {
    words += chunk(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }
  if (num >= 100000) {
    words += chunk(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }
  if (num >= 1000) {
    words += chunk(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }
  if (num > 0) {
    words += chunk(num);
  }
  return words.trim();
}

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
};

const getInvoiceNumber = (orderId: string) => {
  let seed = 0;
  for (let i = 0; i < orderId.length; i++) {
    seed += orderId.charCodeAt(i);
  }
  const numericPart = Math.floor(1000000 + (seed * 12345) % 9000000);
  return `5154-${numericPart}`;
};

const tamilNaduDistricts = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 
  'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram', 
  'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai', 
  'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai', 
  'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi', 
  'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 
  'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 
  'Vellore', 'Viluppuram', 'Virudhunagar'
];

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

  // WhatsApp Action Dialog States
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState<boolean>(false);
  const [whatsappDialogOrder, setWhatsappDialogOrder] = useState<any>(null);
  const [whatsappUpdateStatus, setWhatsappUpdateStatus] = useState<'accepted' | 'shipped' | 'delivered'>('accepted');
  const [whatsappCustomMessage, setWhatsappCustomMessage] = useState<string>('');
  const [copiedPhoneOrderId, setCopiedPhoneOrderId] = useState<string | null>(null);
  const [activeProofOrder, setActiveProofOrder] = useState<any | null>(null);
  
  // Extra Fields states for Edit/drawer
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [payMethod, setPayMethod] = useState('WhatsApp Cash');
  const [payStatus, setPayStatus] = useState('unpaid');

  // Extra Tracking states
  const [trackingPost, setTrackingPost] = useState('');
  const [trackingTaluk, setTrackingTaluk] = useState('');
  const [trackingDistrict, setTrackingDistrict] = useState('');
  const [trackingState, setTrackingState] = useState('');
  const [isCustomDistrict, setIsCustomDistrict] = useState(false);
  const [isCustomState, setIsCustomState] = useState(false);

  const loadTrackingNumberComponents = (trackNum: string) => {
    if (trackNum && trackNum.includes(' || ')) {
      const parts = trackNum.split(' || ');
      const p = parts[0] === '-' ? '' : parts[0] || '';
      const t = parts[1] === '-' ? '' : parts[1] || '';
      const d = parts[2] === '-' ? '' : parts[2] || '';
      const s = parts[3] === '-' ? '' : parts[3] || '';
      
      setTrackingPost(p);
      setTrackingTaluk(t);
      setTrackingDistrict(d);
      setTrackingState(s);
      
      setIsCustomDistrict(d !== '' && !tamilNaduDistricts.includes(d));
      setIsCustomState(s !== '' && !['Tamil Nadu', 'Puducherry', 'Kerala', 'Karnataka', 'Andhra Pradesh'].includes(s));
    } else {
      setTrackingPost(trackNum || '');
      setTrackingTaluk('');
      setTrackingDistrict('');
      setTrackingState('');
      setIsCustomDistrict(false);
      setIsCustomState(false);
    }
  };

  const handleTrackingComponentChange = (field: 'post' | 'taluk' | 'district' | 'state', value: string) => {
    let post = trackingPost;
    let taluk = trackingTaluk;
    let dist = trackingDistrict;
    let st = trackingState;

    if (field === 'post') { post = value; setTrackingPost(value); }
    if (field === 'taluk') { taluk = value; setTrackingTaluk(value); }
    if (field === 'district') { dist = value; setTrackingDistrict(value); }
    if (field === 'state') { st = value; setTrackingState(value); }

    const parts = [post.trim(), taluk.trim(), dist.trim(), st.trim()];
    if (parts.every(p => !p)) {
      setTrackingNumber('');
      saveExtraFields(selectedOrder.id, { tracking_number: '' });
    } else {
      const combined = parts.map(p => p || '-').join(' || ');
      setTrackingNumber(combined);
      saveExtraFields(selectedOrder.id, { tracking_number: combined });
    }
  };

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
      if (ordData) {
        const processed = ordData.map((o: any) => {
          let email = o.customer_email || '';
          let screenshotUrl = o.payment_screenshot_url || '';
          let method = o.payment_method || '';
          let status = o.payment_status || '';

          if (email.includes('|')) {
            const parts = email.split('|');
            email = parts[0];
            if (parts[1]) screenshotUrl = parts[1];
            if (parts[2]) method = parts[2];
            if (parts[3]) status = parts[3];
          }

          return { 
            ...o, 
            customer_email: email, 
            payment_screenshot_url: screenshotUrl || null, 
            payment_method: method || 'WhatsApp Cash', 
            payment_status: status || 'unpaid' 
          };
        });
        setOrders(processed);
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

    setLoading(false);
    setRefreshing(false);
  };

  const currencySymbol = store?.currency === 'USD' ? '$' : '₹';

  // 1. FAIL-PROOF PERSISTENT SAVE FOR EXTRA FIELDS (LOCALSTORAGE FALLBACK)
  const getExtraFields = (orderOrId: any) => {
    let order: any = null;
    let orderId = '';
    
    if (typeof orderOrId === 'string') {
      orderId = orderOrId;
      order = orders.find(o => o.id === orderId);
    } else if (orderOrId && typeof orderOrId === 'object') {
      order = orderOrId;
      orderId = order.id;
    }

    if (typeof window === 'undefined') {
      return { 
        tracking_number: '', 
        delivery_date: '', 
        payment_method: order?.payment_method || 'WhatsApp Cash', 
        payment_status: order?.payment_status || 'unpaid' 
      };
    }

    const key = `creva_order_extra_${orderId}`;
    const local = localStorage.getItem(key);
    if (local) {
      const parsed = JSON.parse(local);
      return {
        tracking_number: parsed.tracking_number || '',
        delivery_date: parsed.delivery_date || '',
        payment_method: order?.payment_method || parsed.payment_method || 'WhatsApp Cash',
        payment_status: order?.payment_status || parsed.payment_status || 'unpaid'
      };
    }

    return {
      tracking_number: '',
      delivery_date: '',
      payment_method: order?.payment_method || 'WhatsApp Cash',
      payment_status: order?.payment_status || 'unpaid'
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
      const order = orders.find(o => o.id === orderId);
      const updatePayload: any = { ...fields };
      
      if (order) {
        const cleanEmail = order.customer_email?.includes('|')
          ? order.customer_email.split('|')[0]
          : (order.customer_email || `${order.customer_phone || 'customer'}@whatsapp.com`);
        
        const screenshotUrl = fields.payment_status === 'paid' || fields.payment_status === 'processing'
          ? ''
          : (order.payment_screenshot_url || '');

        updatePayload.customer_email = `${cleanEmail}|${screenshotUrl}|${fields.payment_method || order.payment_method || 'WhatsApp Cash'}|${fields.payment_status || order.payment_status || 'unpaid'}`;
        updatePayload.payment_screenshot_url = screenshotUrl || null;
      }

      await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId);
    } catch (e) {
      console.warn("Extra columns not present in database, relying on local sandbox:", e);
    }
  };

  // 2. DYNAMIC SEARCH & FILTER CONTROLS
  const processedOrders = useMemo(() => {
    return orders.filter(order => {
      const extra = getExtraFields(order);
      
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

  const handleVerifyPayment = async (order: any) => {
    try {
      const screenshot = order.payment_screenshot_url;
      const cleanEmail = order.customer_email?.includes('|')
        ? order.customer_email.split('|')[0]
        : (order.customer_email || `${order.customer_phone || 'customer'}@whatsapp.com`);
      
      const newEmailPayload = `${cleanEmail}||Direct UPI Transfer|paid`;

      const updatePayload = {
        status: 'processing', // Auto update order status to processing
        payment_status: 'paid',
        payment_method: 'Direct UPI Transfer',
        payment_screenshot_url: null,
        customer_email: newEmailPayload
      };

      const { error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', order.id);

      if (error) throw error;

      // Delete screenshot from storage
      if (screenshot) {
        supabase.storage.from('payment-screenshots').remove([screenshot]).catch(err => {
          console.warn("Failed to delete screenshot from storage:", err);
        });
      }

      // Update local state
      setOrders(prev => prev.map(o => 
        o.id === order.id 
          ? {
              ...o,
              status: 'processing',
              payment_status: 'paid',
              payment_method: 'Direct UPI Transfer',
              payment_screenshot_url: null,
              customer_email: cleanEmail
            }
          : o
      ));

      // Update local storage extra fields fallback
      const key = `creva_order_extra_${order.id}`;
      const existing = getExtraFields(order.id);
      localStorage.setItem(key, JSON.stringify({
        ...existing,
        payment_status: 'paid',
        payment_method: 'Direct UPI Transfer'
      }));

      if (selectedOrder?.id === order.id) {
        setSelectedOrder({
          ...selectedOrder,
          status: 'processing',
          payment_status: 'paid',
          payment_method: 'Direct UPI Transfer',
          payment_screenshot_url: null,
          customer_email: cleanEmail
        });
      }

      setActiveProofOrder(null);
      alert("Payment verified successfully! Order moved to 'processing'.");
    } catch (err) {
      console.error("Failed to verify payment:", err);
      alert("Failed to verify payment.");
    }
  };

  const handleRejectPayment = async (order: any) => {
    try {
      const screenshot = order.payment_screenshot_url;
      const cleanEmail = order.customer_email?.includes('|')
        ? order.customer_email.split('|')[0]
        : (order.customer_email || `${order.customer_phone || 'customer'}@whatsapp.com`);
      
      const newEmailPayload = `${cleanEmail}||Direct UPI Transfer|unpaid`;

      const updatePayload = {
        payment_status: 'unpaid',
        payment_method: 'Direct UPI Transfer',
        payment_screenshot_url: null,
        customer_email: newEmailPayload
      };

      const { error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', order.id);

      if (error) throw error;

      // Delete screenshot from storage
      if (screenshot) {
        supabase.storage.from('payment-screenshots').remove([screenshot]).catch(err => {
          console.warn("Failed to delete screenshot from storage:", err);
        });
      }

      // Update local state
      setOrders(prev => prev.map(o => 
        o.id === order.id 
          ? {
              ...o,
              payment_status: 'unpaid',
              payment_method: 'Direct UPI Transfer',
              payment_screenshot_url: null,
              customer_email: cleanEmail
            }
          : o
      ));

      // Update local storage extra fields fallback
      const key = `creva_order_extra_${order.id}`;
      const existing = getExtraFields(order.id);
      localStorage.setItem(key, JSON.stringify({
        ...existing,
        payment_status: 'unpaid',
        payment_method: 'Direct UPI Transfer'
      }));

      if (selectedOrder?.id === order.id) {
        setSelectedOrder({
          ...selectedOrder,
          payment_status: 'unpaid',
          payment_method: 'Direct UPI Transfer',
          payment_screenshot_url: null,
          customer_email: cleanEmail
        });
      }

      setActiveProofOrder(null);
      alert("Payment proof rejected. Screenshot deleted.");
    } catch (err) {
      console.error("Failed to reject payment:", err);
      alert("Failed to reject payment.");
    }
  };

  // 4. ORDER STATUS TRANSITION CONTROLS
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const orderToUpdate = orders.find(o => o.id === orderId);
      const isConfirmed = newStatus === 'completed' || newStatus === 'processing';
      const screenshot = orderToUpdate?.payment_screenshot_url;

      const updatePayload: any = { status: newStatus };
      if (isConfirmed && screenshot) {
        updatePayload.payment_screenshot_url = null;
      }

      if (orderToUpdate) {
        const cleanEmail = orderToUpdate.customer_email?.includes('|')
          ? orderToUpdate.customer_email.split('|')[0]
          : (orderToUpdate.customer_email || `${orderToUpdate.customer_phone || 'customer'}@whatsapp.com`);
        
        const currentExtra = getExtraFields(orderToUpdate);
        const updatedScreenshot = isConfirmed ? '' : (screenshot || '');
        const updatedPayStatus = isConfirmed ? 'paid' : (currentExtra.payment_status || 'unpaid');
        
        updatePayload.customer_email = `${cleanEmail}|${updatedScreenshot}|${currentExtra.payment_method || 'WhatsApp Cash'}|${updatedPayStatus}`;
        updatePayload.payment_screenshot_url = isConfirmed ? null : (screenshot || null);
        updatePayload.payment_status = updatedPayStatus;
      }

      const { error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId);
      
      if (error) throw error;

      if (isConfirmed && screenshot) {
        // Run storage deletion in background
        supabase.storage.from('payment-screenshots').remove([screenshot]).catch(err => {
          console.warn("Failed to delete screenshot from storage:", err);
        });
      }
      
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              status: newStatus,
              payment_screenshot_url: isConfirmed ? null : order.payment_screenshot_url,
              customer_email: isConfirmed && order.customer_email?.includes('|') ? order.customer_email.split('|')[0] : order.customer_email
            } 
          : order
      ));

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: newStatus,
          payment_screenshot_url: isConfirmed ? null : selectedOrder.payment_screenshot_url,
          customer_email: isConfirmed && selectedOrder.customer_email?.includes('|') ? selectedOrder.customer_email.split('|')[0] : selectedOrder.customer_email
        });
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update status");
    }
  };

  // 5. BULK STATUS UPDATES
  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedOrderIds.length === 0) return;
    try {
      const isConfirmed = newStatus === 'completed' || newStatus === 'processing';
      
      // If confirmed, find all orders that have screenshots to delete them
      const screenshotsToDelete: string[] = [];
      if (isConfirmed) {
        orders.forEach(o => {
          if (selectedOrderIds.includes(o.id) && o.payment_screenshot_url) {
            screenshotsToDelete.push(o.payment_screenshot_url);
          }
        });
      }

      // Update each order individually/in parallel to avoid overwriting email addresses
      await Promise.all(selectedOrderIds.map(async (orderId) => {
        const o = orders.find(ord => ord.id === orderId);
        if (!o) return;

        const cleanEmail = o.customer_email?.includes('|')
          ? o.customer_email.split('|')[0]
          : (o.customer_email || `${o.customer_phone || 'customer'}@whatsapp.com`);
        
        const currentExtra = getExtraFields(o);
        const screenshot = o.payment_screenshot_url;
        const updatedScreenshot = isConfirmed ? '' : (screenshot || '');
        const updatedPayStatus = isConfirmed ? 'paid' : (currentExtra.payment_status || 'unpaid');

        const payload: any = {
          status: newStatus,
          customer_email: `${cleanEmail}|${updatedScreenshot}|${currentExtra.payment_method || 'WhatsApp Cash'}|${updatedPayStatus}`,
          payment_screenshot_url: isConfirmed ? null : (screenshot || null),
          payment_status: updatedPayStatus
        };

        await supabase
          .from('orders')
          .update(payload)
          .eq('id', orderId);
      }));

      if (screenshotsToDelete.length > 0) {
        supabase.storage.from('payment-screenshots').remove(screenshotsToDelete).catch(err => {
          console.warn("Failed to delete bulk screenshots from storage:", err);
        });
      }

      setOrders(prev => prev.map(o => {
        if (selectedOrderIds.includes(o.id)) {
          return {
            ...o,
            status: newStatus,
            payment_screenshot_url: isConfirmed ? null : o.payment_screenshot_url,
            customer_email: isConfirmed && o.customer_email?.includes('|') ? o.customer_email.split('|')[0] : o.customer_email
          };
        }
        return o;
      }));

      if (selectedOrder && selectedOrderIds.includes(selectedOrder.id)) {
        setSelectedOrder({
          ...selectedOrder,
          status: newStatus,
          payment_screenshot_url: isConfirmed ? null : selectedOrder.payment_screenshot_url,
          customer_email: isConfirmed && selectedOrder.customer_email?.includes('|') ? selectedOrder.customer_email.split('|')[0] : selectedOrder.customer_email
        });
      }

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

  const handlePrintAll = () => {
    setBulkPrintOrders([...orders]);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // WhatsApp Redirect Text Generator
  const generateUpdateMessage = (order: any, status: 'accepted' | 'shipped' | 'delivered') => {
    if (!order) return '';
    const storeName = store?.store_name || 'Our Store';
    const customerName = order.customer_name || 'Valued Customer';
    const orderId = order.id.substring(0, 6).toUpperCase();
    const amount = `${currencySymbol}${Number(order.total_amount).toLocaleString()}`;
    const extra = getExtraFields(order);

    if (status === 'accepted') {
      return `Hi ${customerName}! Your order #${orderId} at ${storeName} has been accepted. Total amount: ${amount}. Thank you for shopping with us!`;
    } else if (status === 'shipped') {
      const tracking = extra.tracking_number ? `Tracking number: ${extra.tracking_number}` : 'It will be shipped via local courier shortly.';
      return `Hi ${customerName}! Good news! Your order #${orderId} at ${storeName} has been shipped. ${tracking} Thank you for shopping with us!`;
    } else {
      return `Hi ${customerName}! Your order #${orderId} at ${storeName} has been successfully delivered. We hope you love your products! Please let us know if you have any feedback.`;
    }
  };

  const handleOpenWhatsAppDialog = (order: any) => {
    setWhatsappDialogOrder(order);
    setWhatsappUpdateStatus('accepted');
    const defaultMsg = generateUpdateMessage(order, 'accepted');
    setWhatsappCustomMessage(defaultMsg);
    setIsWhatsAppDialogOpen(true);
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhoneOrderId(phone);
    setTimeout(() => setCopiedPhoneOrderId(null), 2500);
  };

  const handleWhatsAppRedirect = (order: any) => {
    let cleanPhone = order.customer_phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }
    const storeName = store?.store_name || 'Our Store';
    const text = `Hi ${order.customer_name}! Your order #${order.id.substring(0, 6).toUpperCase()} at ${storeName} has been marked as '${order.status || 'pending'}'. Total Amount: ${currencySymbol}${Number(order.total_amount).toLocaleString()}. Thank you for shopping with us!`;
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}&text=${encodeURIComponent(text)}`, '_blank');
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

  const renderInvoiceSheets = () => {
    if (!bulkPrintOrders.length) return null;
    let ss: any = {};
    try {
      if (store?.description?.startsWith('{')) ss = JSON.parse(store.description);
    } catch {}
    const accentColor = store?.primary_color || '#3C77C3';
    const addrLine = [ss.address, ss.city, ss.state].filter(Boolean).join(', ');
    const storePincode = ss.pincode || '';
    const storeGst = ss.gst_number || '';
    const hasBankDetails = !!ss.bank_account_number;
    const storeUpi = ss.paymentUpiId || '';
    const invoiceNotes = ss.invoice_notes || '';
    const invoiceTerms = ss.invoice_terms || '';

    return bulkPrintOrders.map((order, index) => {
      const totalPages = bulkPrintOrders.length;
      const isPaid = order.payment_status?.toLowerCase() === 'paid' || order.status?.toLowerCase() === 'delivered' || order.status?.toLowerCase() === 'completed';

      return (
        <div
          key={order.id}
          className="bg-white text-black rounded-xl shadow-sm overflow-hidden print-invoice-sheet"
          style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
        >
          <div style={{ backgroundColor: accentColor, height: '6px' }} />
          <div className="p-10 print:p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-2xl font-black tracking-tight" style={{ color: accentColor }}>
                  {store?.store_name}
                </h1>
                {addrLine && (
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {addrLine}{storePincode ? ` - ${storePincode}` : ''}
                  </p>
                )}
                {store?.contact_phone && (
                  <p className="text-xs text-gray-600 mt-0.5">Phone: {store.contact_phone}</p>
                )}
                {store?.contact_email && (
                  <p className="text-xs text-gray-600 mt-0.5">Email: {store.contact_email}</p>
                )}
                {storeGst && (
                  <p className="text-xs text-gray-500 mt-1 font-mono">GSTIN: {storeGst}</p>
                )}
              </div>
              <div className="text-right">
                <h2 className="text-4xl font-black tracking-widest uppercase mb-3 text-gray-200">INVOICE</h2>
                <div className="space-y-1 text-xs -mt-1">
                  <p className="text-gray-500">Invoice No: <span className="font-bold text-gray-900 font-mono">{getInvoiceNumber(order.id)}</span></p>
                  <p className="text-gray-500">Order Ref: <span className="font-bold text-gray-900 font-mono">#{order.id.substring(0, 8).toUpperCase()}</span></p>
                  <p className="text-gray-500">Date: <span className="font-bold text-gray-900">{formatDate(order.created_at)}</span></p>
                  <p className="text-gray-500">Method: <span className="font-medium text-gray-900">{order.payment_method || 'Bank Transfer'}</span></p>
                  <div className="mt-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {isPaid ? 'PAID' : 'UNPAID'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-px bg-gray-200 mb-6" />
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <div className="text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-sm mb-3 w-fit" style={{ backgroundColor: accentColor }}>
                  BILL TO
                </div>
                <p className="font-bold text-sm text-gray-900">{order.customer_name}</p>
                {order.shipping_address && (
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{order.shipping_address}</p>
                )}
                <p className="text-xs text-gray-600 mt-0.5">Phone: {order.customer_phone}</p>
                {order.customer_email && <p className="text-xs text-gray-600 mt-0.5">{order.customer_email}</p>}
              </div>
              <div>
                <div className="text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-sm mb-3 w-fit" style={{ backgroundColor: accentColor }}>
                  SHIP TO
                </div>
                <p className="font-bold text-sm text-gray-900">{order.customer_name}</p>
                {order.shipping_address && (
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{order.shipping_address}</p>
                )}
                <p className="text-xs text-gray-600 mt-0.5">Phone: {order.customer_phone}</p>
              </div>
            </div>
            <table className="w-full border-collapse mb-6 text-xs">
              <thead>
                <tr style={{ backgroundColor: accentColor }} className="text-white">
                  <th className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-wider w-1/2">Item Description</th>
                  <th className="px-4 py-3 text-center font-bold text-[10px] uppercase tracking-wider w-[12%]">Qty</th>
                  <th className="px-4 py-3 text-right font-bold text-[10px] uppercase tracking-wider">Unit Price</th>
                  <th className="px-4 py-3 text-right font-bold text-[10px] uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.order_items && order.order_items.length > 0 ? (
                  order.order_items.map((item: any, idx: number) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-3 font-medium text-gray-800 border-b border-gray-100">{item.products?.name || 'Item'}</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-b border-gray-100">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-gray-700 border-b border-gray-100">{Number(item.price_at_purchase).toLocaleString()} INR</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900 border-b border-gray-100">{(Number(item.price_at_purchase) * item.quantity).toLocaleString()} INR</td>
                    </tr>
                  ))
                ) : (
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800 border-b border-gray-100">WhatsApp Order</td>
                    <td className="px-4 py-3 text-center text-gray-700 border-b border-gray-100">1</td>
                    <td className="px-4 py-3 text-right text-gray-700 border-b border-gray-100">{Number(order.total_amount).toLocaleString()} INR</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 border-b border-gray-100">{Number(order.total_amount).toLocaleString()} INR</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="flex gap-8 mt-2 text-xs">
              <div className="flex-1 space-y-5">
                {hasBankDetails && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: accentColor }}>Bank Details</h4>
                    <div className="space-y-1 text-gray-700">
                      {ss.bank_beneficiary_name && <p><span className="text-gray-400 w-28 inline-block">Beneficiary</span><span className="font-bold text-gray-900">{ss.bank_beneficiary_name}</span></p>}
                      <p><span className="text-gray-400 w-28 inline-block">Account No.</span><span className="font-mono font-bold text-gray-900">{ss.bank_account_number}</span></p>
                      {ss.bank_ifsc && <p><span className="text-gray-400 w-28 inline-block">IFSC</span><span className="font-mono font-bold text-gray-900">{ss.bank_ifsc}</span></p>}
                      {ss.bank_name && <p><span className="text-gray-400 w-28 inline-block">Bank</span><span className="font-bold text-gray-900">{ss.bank_name}</span></p>}
                      {ss.bank_branch && <p><span className="text-gray-400 w-28 inline-block">Branch</span><span className="font-bold text-gray-900">{ss.bank_branch}</span></p>}
                      <p><span className="text-gray-400 w-28 inline-block">Account Type</span><span className="font-bold text-gray-900">{ss.bank_account_type || 'Savings'}</span></p>
                    </div>
                  </div>
                )}
                {storeUpi && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: accentColor }}>UPI Payment</h4>
                    <p className="font-mono font-bold text-gray-900 bg-gray-50 border border-dashed border-gray-300 px-3 py-1.5 rounded w-fit">{storeUpi}</p>
                  </div>
                )}
                {invoiceNotes && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: accentColor }}>Notes</h4>
                    <p className="text-gray-600 leading-relaxed">{invoiceNotes}</p>
                  </div>
                )}
                {invoiceTerms && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: accentColor }}>Terms & Conditions</h4>
                    <p className="text-gray-600 leading-relaxed">{invoiceTerms}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest mb-1 text-gray-400">Amount in Words</h4>
                  <p className="text-gray-800 font-bold italic capitalize">{numberToWords(Number(order.total_amount))} Rupees Only</p>
                </div>
              </div>
              <div className="w-56 space-y-2 shrink-0">
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-bold text-gray-900">{Number(order.total_amount).toLocaleString()} INR</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Delivery</span>
                  <span className="font-bold text-gray-900">0.00 INR</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Discount</span>
                  <span className="font-bold text-gray-900">— 0.00 INR</span>
                </div>
                <div className="flex justify-between py-2.5 border-y-2 mt-1 font-bold" style={{ borderColor: accentColor }}>
                  <span className="text-gray-900">Total</span>
                  <span style={{ color: accentColor }}>{Number(order.total_amount).toLocaleString()} INR</span>
                </div>
                <div className="flex justify-between py-2 font-bold">
                  <span className="text-gray-600">Due Balance</span>
                  <span className={isPaid ? 'text-emerald-600' : 'text-rose-600'}>{isPaid ? '0.00' : Number(order.total_amount).toLocaleString()} INR</span>
                </div>
                <div className="mt-8 pt-4 border-t border-gray-200 text-center">
                  <div className="h-12 border-b border-gray-300 mb-1" />
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest">Authorized Signature</p>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-4 border-t border-gray-100 text-center">
              <p className="text-[10px] text-gray-400">
                {store?.store_name} · {store?.subdomain}.crevasolution.in · Thank you for your business!
              </p>
              <p className="text-[9px] text-gray-400 mt-1 font-mono">
                Page {index + 1} of {totalPages}
              </p>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="space-y-8 w-full pb-16">
      
      {/* Print-only invoice rendering (outside modal, direct in document flow) */}
      <div className="hidden print:block print-invoice-root">
        {renderInvoiceSheets()}
      </div>

      <style>{`
        @media print {
          /* Hide non-printable elements */
          aside, header, nav, .print\\:hidden, button, select, input, .bottom-6, .fixed.inset-0, header * {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Reset root and body */
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
          }
          
          /* Override Next.js and layout wrappers to enable page breaks */
          #__next, 
          [data-reactroot],
          div.h-screen,
          main.flex-1,
          div.flex-1 {
            display: block !important;
            overflow: visible !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            position: relative !important;
          }

          @page {
            size: A4;
            margin: 1.5cm; /* standard margin for clean prints */
          }

          .print-invoice-root {
            display: block !important;
            visibility: visible !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            position: relative !important;
          }

          .print-invoice-sheet {
            display: block !important;
            width: 100% !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: always !important;
            break-after: page !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            position: relative !important;
          }

          .print-invoice-sheet:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
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
            Orders & Billing Center
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage incoming WhatsApp checkouts, update tracking details, bulk print invoices, and view AI operations metrics.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
          <button
            onClick={handlePrintAll}
            disabled={orders.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print All
          </button>
          <button
            onClick={fetchOrders}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground text-xs font-bold rounded-xl border border-border hover:bg-secondary/80 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Sync Orders'}
          </button>
        </div>
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
                      const extra = getExtraFields(order);
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
                                loadTrackingNumberComponents(extra.tracking_number || '');
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
                            {order.payment_screenshot_url ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveProofOrder(order);
                                }}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-750 text-[7px] font-black uppercase tracking-wider mt-1 border border-emerald-500/20 transition-all cursor-pointer animate-pulse"
                                title="Click to view payment proof verification receipt"
                              >
                                <Image className="w-2.5 h-2.5 text-emerald-600" /> Proof Attached ↗
                              </button>
                            ) : extra.payment_status === 'paid' ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-55 text-emerald-700 text-[7px] font-black uppercase tracking-wider mt-1 border border-emerald-200">
                                Verified ✅
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-50 text-gray-400 text-[7px] font-bold uppercase tracking-wider mt-1 border border-gray-200">
                                No Proof Attached
                              </span>
                            )}
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
                              {order.payment_screenshot_url && (
                                <button 
                                  onClick={() => setActiveProofOrder(order)}
                                  className="p-1 hover:bg-emerald-50 rounded text-emerald-600 transition-all flex items-center justify-center animate-pulse"
                                  title="View Payment Screenshot Receipt"
                                >
                                  <Image className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button 
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setEditingOrder(order);
                                  setTrackingNumber(extra.tracking_number || '');
                                  loadTrackingNumberComponents(extra.tracking_number || '');
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
                                onClick={() => handleOpenWhatsAppDialog(order)}
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
            const extra = getExtraFields(selectedOrder);
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

                {/* Payment Proof Screenshot */}
                {selectedOrder.payment_screenshot_url && (
                  <div className="space-y-3">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block">Payment Proof Screenshot</span>
                    <div className="bg-muted/15 border p-3 rounded-xl flex flex-col items-center justify-center gap-2">
                      <div className="relative group overflow-hidden rounded-lg border border-border bg-slate-50 w-full max-h-48 flex items-center justify-center cursor-zoom-in">
                        <img 
                          src={selectedOrder.payment_screenshot_url} 
                          alt="Direct UPI payment receipt proof" 
                          onClick={() => setActiveProofOrder(selectedOrder)}
                          className="object-contain max-h-44 w-auto rounded hover:scale-[1.02] transition-transform"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveProofOrder(selectedOrder)}
                        className="text-[10px] font-black text-[#3C77C3] uppercase tracking-wider hover:underline"
                      >
                        Verify / View Proof
                      </button>
                    </div>
                  </div>
                )}

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

                  <div className="space-y-3 pt-3 border-t border-dashed border-border">
                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block">Manual Tracking Location</span>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">1. Post (Town/Locality)</span>
                        <input
                          type="text"
                          placeholder="e.g. Sankarapuram"
                          value={trackingPost}
                          onChange={e => handleTrackingComponentChange('post', e.target.value)}
                          className="w-full bg-background border rounded-lg h-9 px-3 text-xs outline-none focus:border-[#3C77C3]"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">2. Taluk</span>
                        <input
                          type="text"
                          placeholder="e.g. Sankarapuram"
                          value={trackingTaluk}
                          onChange={e => handleTrackingComponentChange('taluk', e.target.value)}
                          className="w-full bg-background border rounded-lg h-9 px-3 text-xs outline-none focus:border-[#3C77C3]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">3. District</span>
                        <select
                          value={tamilNaduDistricts.includes(trackingDistrict) ? trackingDistrict : (trackingDistrict ? 'Other' : '')}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === 'Other') {
                              setIsCustomDistrict(true);
                              handleTrackingComponentChange('district', '');
                            } else {
                              setIsCustomDistrict(false);
                              handleTrackingComponentChange('district', val);
                            }
                          }}
                          className="w-full bg-background border rounded-lg h-9 px-2 text-xs outline-none focus:border-[#3C77C3]"
                        >
                          <option value="">-- Select District --</option>
                          {tamilNaduDistricts.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                          <option value="Other">Other (Type custom)</option>
                        </select>
                        {(isCustomDistrict || (!tamilNaduDistricts.includes(trackingDistrict) && trackingDistrict !== '')) && (
                          <input
                            type="text"
                            placeholder="Type District Name"
                            value={trackingDistrict}
                            onChange={e => handleTrackingComponentChange('district', e.target.value)}
                            className="w-full bg-background border rounded-lg h-9 px-3 text-xs mt-1.5 outline-none focus:border-[#3C77C3]"
                          />
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">4. State</span>
                        <select
                          value={['Tamil Nadu', 'Puducherry', 'Kerala', 'Karnataka', 'Andhra Pradesh'].includes(trackingState) ? trackingState : (trackingState ? 'Other' : '')}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === 'Other') {
                              setIsCustomState(true);
                              handleTrackingComponentChange('state', '');
                            } else {
                              setIsCustomState(false);
                              handleTrackingComponentChange('state', val);
                            }
                          }}
                          className="w-full bg-background border rounded-lg h-9 px-2 text-xs outline-none focus:border-[#3C77C3]"
                        >
                          <option value="">-- Select State --</option>
                          <option value="Tamil Nadu">Tamil Nadu</option>
                          <option value="Puducherry">Puducherry</option>
                          <option value="Kerala">Kerala</option>
                          <option value="Karnataka">Karnataka</option>
                          <option value="Andhra Pradesh">Andhra Pradesh</option>
                          <option value="Other">Other (Type custom)</option>
                        </select>
                        {(isCustomState || (!['Tamil Nadu', 'Puducherry', 'Kerala', 'Karnataka', 'Andhra Pradesh'].includes(trackingState) && trackingState !== '')) && (
                          <input
                            type="text"
                            placeholder="Type State Name"
                            value={trackingState}
                            onChange={e => handleTrackingComponentChange('state', e.target.value)}
                            className="w-full bg-background border rounded-lg h-9 px-3 text-xs mt-1.5 outline-none focus:border-[#3C77C3]"
                          />
                        )}
                      </div>
                    </div>
                    
                    {trackingNumber && (
                      <div className="bg-muted/30 p-2.5 rounded-lg border text-[10px] space-y-1">
                        <span className="font-bold text-gray-500 uppercase tracking-wider block">Combined Tracking Output:</span>
                        <span className="font-mono text-gray-850 break-all block">{trackingNumber.replace(/ \|\| /g, ', ')}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 pt-2">
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

                {/* Print and Bill Generator Quick Actions */}
                <div className="flex gap-2 border-t pt-4">
                  <button
                    onClick={() => setBulkPrintOrders([selectedOrder])}
                    className="flex-1 bg-secondary text-secondary-foreground font-bold uppercase tracking-wider text-[10px] py-3 rounded-xl border flex items-center justify-center gap-1 hover:bg-secondary/90 transition-all cursor-pointer shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" /> PDF Invoice
                  </button>
                  <button
                    onClick={() => handleOpenWhatsAppDialog(selectedOrder)}
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
                <h4 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Top Performing VIP Buyers</h4>
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

      {/* Bulk Invoice Print Preview Modal (Retained for preview only) */}
      {bulkPrintOrders.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex justify-between items-center">
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

            {/* Printable Area - renders each invoice page (screen preview only) */}
            <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
              {renderInvoiceSheets()}
            </div>
          </div>
        </div>
      )}

      {/* Premium WhatsApp Integration Modal */}
      {isWhatsAppDialogOpen && whatsappDialogOrder && (() => {
        const order = whatsappDialogOrder;
        let cleanPhone = order.customer_phone ? order.customer_phone.replace(/[^0-9]/g, '') : '';
        if (cleanPhone.startsWith('0')) {
          cleanPhone = cleanPhone.substring(1);
        }
        const whatsappNumberToUse = cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone;

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

        const isLocked = false;

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-background border border-border max-w-lg w-full shadow-2xl rounded-3xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 font-sans text-left">
              
              {/* Header */}
              <div className="p-6 border-b border-border flex items-center justify-between bg-muted/10 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-foreground uppercase tracking-wider">WhatsApp Contact Actions</h3>
                    <p className="text-[10px] text-muted-foreground">Order #{order.id.substring(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsWhatsAppDialogOpen(false)}
                  className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                {/* Customer Summary Card */}
                <div className="p-4 bg-muted/20 border rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Customer Details</span>
                    <strong className="text-sm font-black text-foreground block mt-0.5">{order.customer_name}</strong>
                    <span className="text-xs text-muted-foreground mt-0.5 font-mono">{order.customer_phone}</span>
                  </div>
                  <button
                    onClick={() => handleCopyPhone(order.customer_phone)}
                    className="flex items-center gap-1 bg-background hover:bg-muted text-foreground border px-3 py-2 rounded-xl font-bold uppercase tracking-wider text-[9px] transition-all shadow-sm shrink-0"
                  >
                    {copiedPhoneOrderId === order.customer_phone ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Number
                      </>
                    )}
                  </button>
                </div>

                {/* Lock Status Banner */}
                {isLocked && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex gap-3 text-left">
                    <span className="text-base shrink-0">🔒</span>
                    <div>
                      <strong className="block font-bold">Premium Subscription Feature</strong>
                      {!isGloballyEnabled ? (
                        "WhatsApp integration is globally deactivated by the platform super-administrator."
                      ) : !hasClickToChat ? (
                        "WhatsApp Integration is not unlocked in your current subscription plan. Upgrade your package to enable customer chat features."
                      ) : (
                        "Outgoing Order Updates require a Premium Plan. Your current plan only supports storefront Click-to-Chat queries. Upgrade now to enable automated and manual alerts."
                      )}
                      <div className="mt-3">
                        <a 
                          href="/admin/subscription"
                          className="inline-block px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                        >
                          Upgrade Now
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* WhatsApp Actions (Disabled if locked) */}
                <div className={`space-y-6 ${isLocked ? 'opacity-40 pointer-events-none' : ''}`}>
                  
                  {/* Action 1: Instant Quick Chat */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest block">1. Instant Customer Chat</h4>
                    <p className="text-[10px] text-muted-foreground">Open a blank WhatsApp chat instantly with the customer without sending status-specific alerts.</p>
                    <button
                      onClick={() => {
                        const welcomeText = store?.whatsappWelcomeMessage || globalSettings?.whatsappDefaultWelcome || "Hi, I am reaching out regarding your order.";
                        window.open(`https://api.whatsapp.com/send?phone=${whatsappNumberToUse}&text=${encodeURIComponent(welcomeText)}`, '_blank');
                      }}
                      disabled={isLocked}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-[9px] rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Start Instant WhatsApp Chat
                    </button>
                  </div>

                  {/* Action 2: Order Alert Campaign */}
                  <div className="space-y-3 pt-2 border-t border-border">
                    <h4 className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest block">2. Send Custom Order Alert Update</h4>
                    <p className="text-[10px] text-muted-foreground">Select a fulfillment status to load the correct message template, modify the text below manually if needed, and send.</p>
                    
                    {/* Status Tabs */}
                    <div className="grid grid-cols-3 gap-2 bg-muted/20 p-1.5 rounded-xl border border-border/80">
                      {(['accepted', 'shipped', 'delivered'] as const).map((status) => {
                        const isActive = whatsappUpdateStatus === status;
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => {
                              setWhatsappUpdateStatus(status);
                              const msg = generateUpdateMessage(order, status);
                              setWhatsappCustomMessage(msg);
                            }}
                            disabled={isLocked}
                            className={`py-2 px-1 text-center font-bold uppercase tracking-wider text-[9px] rounded-lg transition-all ${
                              isActive 
                                ? 'bg-background text-foreground shadow-sm' 
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>

                    {/* Preview Message Textarea */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Manual Message Preview (Editable)</label>
                      <textarea
                        value={whatsappCustomMessage}
                        onChange={(e) => setWhatsappCustomMessage(e.target.value)}
                        rows={4}
                        disabled={isLocked}
                        className="w-full bg-background border rounded-xl p-3 text-xs leading-normal focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-sans"
                        placeholder="Customize message here..."
                      />
                      <p className="text-[9px] text-muted-foreground">Edit this message manually if you want to add customized shipping links or notes.</p>
                    </div>

                    <button
                      onClick={() => {
                        window.open(`https://api.whatsapp.com/send?phone=${whatsappNumberToUse}&text=${encodeURIComponent(whatsappCustomMessage)}`, '_blank');
                      }}
                      disabled={isLocked || !whatsappCustomMessage.trim()}
                      className="w-full py-3 bg-[#3C77C3] hover:bg-[#3C77C3]/90 text-white font-bold uppercase tracking-widest text-[9px] rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#3C77C3]/15 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" /> Send Order {whatsappUpdateStatus.toUpperCase()} Update
                    </button>
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border bg-muted/10 flex justify-end shrink-0">
                <button
                  onClick={() => setIsWhatsAppDialogOpen(false)}
                  className="px-4 py-2 bg-background hover:bg-muted text-foreground border rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
                >
                  Close Actions
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Centered Payment Proof Verification Modal */}
      {activeProofOrder && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-background border border-border max-w-lg w-full shadow-2xl rounded-3xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 font-sans text-left">
            
            {/* Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/10 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
                  <Image className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-foreground uppercase tracking-wider">Payment Proof Verification</h3>
                  <p className="text-[10px] text-muted-foreground">Order #{activeProofOrder.id.substring(0, 8).toUpperCase()}</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveProofOrder(null)}
                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Image Body */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-slate-50/50">
              <div className="w-full max-h-[50vh] overflow-auto rounded-2xl border border-border shadow-inner bg-white flex items-center justify-center relative group p-2">
                <img 
                  src={activeProofOrder.payment_screenshot_url} 
                  alt="Uploaded Payment Screenshot Receipt" 
                  className="object-contain max-h-[46vh] w-auto rounded-xl"
                />
              </div>
              <div className="mt-4 text-center">
                <p className="text-[11px] font-bold text-gray-800">
                  Customer: <span className="font-extrabold text-primary">{activeProofOrder.customer_name}</span> ({activeProofOrder.customer_phone})
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                  Amount: {currencySymbol}{Number(activeProofOrder.total_amount).toLocaleString()} • Method: Direct UPI Transfer
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-border bg-muted/10 flex flex-col sm:flex-row gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setActiveProofOrder(null)}
                className="w-full sm:w-auto px-4 py-2.5 bg-background hover:bg-muted text-foreground border rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all text-center"
              >
                Close
              </button>
              <div className="flex-1 flex gap-2 w-full font-sans">
                <button
                  type="button"
                  onClick={() => handleRejectPayment(activeProofOrder)}
                  className="flex-1 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-250 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Reject Payment
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyPayment(activeProofOrder)}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-center shadow-md shadow-emerald-600/10 flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                >
                  <Check className="w-3.5 h-3.5" /> Verify Payment
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
