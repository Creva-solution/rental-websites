'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, ReceiptText, CheckCircle, Clock, Printer, RotateCw } from 'lucide-react';

export default function OrdersPage() {
  const [store, setStore] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Invoice Modal State
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // Bulk Selection & Printing States
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkPrintOrders, setBulkPrintOrders] = useState<any[]>([]);
  
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const filterStatus = params.get('status');
      if (filterStatus === 'completed') {
        setStatusFilter('completed');
      } else {
        setStatusFilter('all');
      }
    }
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
      .single();
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
              name
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

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (error) throw error;
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update status");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBulkPrint = () => {
    const ordersToPrint = orders.filter(o => selectedOrderIds.includes(o.id));
    setBulkPrintOrders(ordersToPrint);
    
    // Automatically trigger browser print dialog after DOM updates
    setTimeout(() => {
      window.print();
    }, 500);
  };

  if (loading && !store) return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return (order.status || 'pending') === statusFilter;
  });

  const currencySymbol = store?.currency === 'USD' ? '$' : '₹';

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          /* Hide sidebars, main dashboard headers, navigation, and floating action elements */
          aside, 
          header, 
          nav, 
          .print\:hidden,
          .fixed.bottom-6,
          .bg-card.text-card-foreground.rounded-xl {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Reset root layout wrapper constraints to standard flow and visible overflow so pages can break */
          html, body, #__next, [data-reactroot] {
            background: white !important;
            color: black !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
          }

          /* Strip flex grids, static max-heights, and hidden overflows from parent divs to let layout flow natively */
          div, main, section {
            display: block !important;
            position: static !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }

          /* Force the fixed modal overlay backdrop to position absolute top-left of document flow */
          .fixed.inset-0.bg-black\\/50 {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            background: white !important;
            display: block !important;
            z-index: 99999 !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Beautiful premium corporate styling for each individual printed page sheet */
          .print-invoice-sheet {
            page-break-after: always !important;
            break-after: page !important;
            display: block !important;
            background: white !important;
            color: black !important;
            padding: 2.5cm !important;
            margin: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Orders & Billing</h2>
          <p className="text-muted-foreground">Manage your WhatsApp orders and generate bills.</p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground text-xs font-bold rounded-lg border border-border hover:bg-secondary/80 disabled:opacity-50 transition-all shadow-sm"
        >
          <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Orders'}
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 border-b border-border pb-px print:hidden">
        {['all', 'pending', 'processing', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              statusFilter === status 
                ? 'border-primary text-primary font-black' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {status === 'all' ? 'All Orders' : status === 'completed' ? 'Shipped / Completed' : status}
          </button>
        ))}
      </div>

      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm flex flex-col print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-4 w-12 text-center">
                  <input 
                    type="checkbox"
                    checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrderIds(orders.map(o => o.id));
                      } else {
                        setSelectedOrderIds([]);
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                  />
                </th>
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Items Ordered</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ReceiptText className="w-12 h-12 mb-3 opacity-20" />
                      <p>No {statusFilter === 'all' ? '' : statusFilter} orders found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
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
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                      />
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      #{order.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{order.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs space-y-1">
                        {order.order_items && order.order_items.length > 0 ? (
                          order.order_items.map((item: any, i: number) => (
                            <div key={i} className="font-semibold text-gray-800">
                              {item.products?.name || 'Unknown Product'} <span className="text-gray-500 font-normal ml-1">x{item.quantity}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-400 italic">No items recorded</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold">
                      {currencySymbol}{Number(order.total_amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status || 'pending'}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`text-xs font-semibold rounded-full px-3 py-1.5 outline-none border cursor-pointer transition-all ${
                          order.status === 'completed' 
                            ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' 
                            : order.status === 'processing'
                            ? 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200'
                            : order.status === 'cancelled'
                            ? 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                            : 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        <ReceiptText className="w-3 h-3" /> Generate Bill
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:block">
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col print:shadow-none print:max-w-none print:h-auto print:max-h-none print:rounded-none">
            
            {/* Modal Header (Hidden in Print) */}
            <div className="p-4 border-b border-border flex justify-between items-center print:hidden">
              <h2 className="text-lg font-bold">Order Invoice</h2>
              <div className="flex gap-2">
                <button 
                  onClick={handlePrint}
                  className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-md hover:bg-secondary/80 flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Save as PDF/PNG
                </button>
                <button onClick={() => setSelectedOrder(null)} className="p-2 text-muted-foreground hover:bg-muted rounded-md">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            </div>

            {/* Printable Invoice Area */}
            <div ref={invoiceRef} className="p-10 overflow-y-auto print:overflow-visible print:p-8 bg-white text-black print-invoice-container print-invoice-sheet">
              {/* Invoice Header */}
              <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
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
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M151.609 0.266528C150.787 0.443259 149.224 1.0234 148.136 1.5553C143.392 3.87416 140.27 8.63054 139.851 14.1765L139.703 16.1346L134.13 16.2005L128.557 16.2667L127.436 16.888C125.665 17.869 124.797 19.2248 124.416 21.6028C123.447 27.6533 122.677 31.4413 122.315 31.9388C122.095 32.241 121.492 32.7046 120.975 32.9687C120.048 33.4427 119.926 33.4489 111.64 33.4489H103.244L102.721 33.9729C101.97 34.7238 101.988 36.0288 102.759 36.635C103.303 37.0632 103.565 37.0779 110.923 37.0894C116.236 37.098 118.744 37.1782 119.252 37.3562C120.232 37.6997 120.807 38.5396 120.915 39.7831C121.029 41.1126 120.459 42.0699 119.214 42.6347C118.354 43.0255 117.653 43.0447 104.101 43.0492L89.8914 43.0539L89.4272 43.5478C88.7141 44.3072 88.7984 45.4387 89.6199 46.1298L90.2765 46.6825L103.761 46.6833C116.758 46.684 117.269 46.6991 117.928 47.1008C118.892 47.6888 119.345 48.6621 119.21 49.8581C119.121 50.6467 118.938 50.9804 118.234 51.6371L117.368 52.4454H108.598C98.9653 52.4454 98.8808 52.4559 98.359 53.7161C98.1419 54.2396 98.1419 54.4932 98.359 55.0168C98.8751 56.2631 99.0529 56.2874 107.649 56.2874C114.507 56.2874 115.544 56.3305 116.062 56.6366C116.879 57.119 117.351 58.0044 117.351 59.0524C117.351 60.3138 116.841 61.1584 115.79 61.6357C114.992 61.9975 114.344 62.0415 109.752 62.0457L104.607 62.0504L104.042 62.5738C103.285 63.2754 103.267 64.4209 104.001 65.155C104.524 65.6779 104.534 65.679 108.991 65.679C111.446 65.679 113.767 65.7413 114.147 65.8173C115.132 66.0143 116.209 67.1677 116.386 68.2151C116.692 70.0245 118.977 72.3531 121.074 72.9922C121.743 73.1962 128.318 73.2562 150.008 73.2562C182.384 73.2562 179.408 73.4558 181.737 71.1284C182.845 70.0204 183.119 69.5908 183.497 68.3656C183.744 67.5675 183.945 66.5645 183.943 66.1368C183.942 65.7088 183.602 62.7654 183.188 59.5958C182.383 53.4384 182.226 52.1897 181.708 47.8564C181.525 46.3303 181.16 43.3527 180.896 41.2396L180.416 37.3976L159.822 37.2892L139.229 37.181L159.773 37.1291L180.317 37.0775V36.4604C180.317 36.121 180.082 33.984 179.795 31.7113C179.508 29.4387 179.121 26.1865 178.935 24.4843C178.749 22.7821 178.547 20.9909 178.487 20.504C178.358 19.4712 177.423 17.9619 176.48 17.2644C175.295 16.3886 174.251 16.16 171.432 16.16H168.791L168.788 15.0394C168.781 12.0397 167.431 8.12062 165.521 5.54926C162.458 1.42766 156.581 -0.80368 151.609 0.266528ZM151.374 4.18344C146.936 5.45407 143.946 9.38635 143.476 14.5718L143.332 16.16H154.254H165.175L165.043 14.7192C164.742 11.4104 163.724 8.9601 161.822 6.96675C159.204 4.22143 155.079 3.12284 151.374 4.18344ZM147.393 26.1385C152.823 26.1701 161.707 26.1701 167.137 26.1385C172.567 26.1067 168.124 26.0808 157.265 26.0808C146.406 26.0808 141.964 26.1067 147.393 26.1385ZM177.708 26.6196C178.614 27.172 178.911 27.1713 178.076 26.6187C177.724 26.3854 177.34 26.1944 177.222 26.194C177.105 26.1938 177.323 26.3852 177.708 26.6196ZM159.464 30.1408C158.494 30.8201 158.668 32.7172 159.744 33.2077C161.086 33.8195 162.388 33.0449 162.388 31.6347C162.388 30.1557 160.685 29.2857 159.464 30.1408ZM165.971 30.1113C165.05 30.8116 165.079 32.7339 166.019 33.2372C167.255 33.8984 168.791 33.0319 168.791 31.6731C168.791 30.5894 168.094 29.8187 167.121 29.8272C166.69 29.8308 166.172 29.9587 165.971 30.1113ZM172.282 30.3262C171.065 31.3732 171.831 33.4489 173.434 33.4489C174.272 33.4489 175.408 32.4812 175.408 31.7678C175.408 30.0964 173.547 29.2381 172.282 30.3262ZM128.718 41.2127C128.512 41.3248 128.273 41.521 128.187 41.6484C127.887 42.0911 128.026 43.0565 128.45 43.4808C128.831 43.8614 129.162 43.9077 131.504 43.9077H134.131L136.651 51.645C138.037 55.9007 139.309 59.6031 139.479 59.8728C139.648 60.1424 140.093 60.5503 140.468 60.7791C141.118 61.1757 141.613 61.1951 151.075 61.1951C160.527 61.1951 161.033 61.1753 161.681 60.7804C162.055 60.5522 162.468 60.1646 162.6 59.919C162.731 59.6733 163.638 56.8161 164.616 53.5696C166.127 48.5469 166.36 47.574 166.175 47.0449C165.749 45.8229 165.82 45.8287 151.126 45.8287H137.716L137.143 44.0678C136.417 41.8396 136.112 41.4142 135.031 41.1231C134.007 40.8475 129.263 40.915 128.718 41.2127ZM139.21 50.3644C139.474 51.2156 140.159 53.3231 140.731 55.048C141.648 57.8106 141.834 58.1999 142.301 58.3171C143.258 58.5572 159.81 58.3753 160.139 58.1211C160.304 57.9931 160.792 56.6876 161.223 55.2202C161.654 53.7528 162.236 51.8028 162.517 50.8869C162.798 49.971 163.028 49.1307 163.028 49.0192C163.028 48.8942 158.395 48.8169 150.878 48.8169H138.729L139.21 50.3644ZM142.792 63.7509C142.403 63.9947 141.935 64.5522 141.751 64.99C140.834 67.1739 143.407 69.2887 145.459 68.0375C146.394 67.467 146.66 66.8757 146.54 65.6288C146.408 64.2529 145.727 63.5349 144.43 63.4028C143.736 63.3319 143.318 63.4207 142.792 63.7509ZM156.859 63.8805C155.943 64.651 155.632 65.7863 156.058 66.8051C156.429 67.6951 157.503 68.4518 158.396 68.4529C160.854 68.4563 161.863 65.0297 159.779 63.7588C158.791 63.1567 157.663 63.2036 156.859 63.8805Z" fill="#3C77C3"/>
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
                  <p className="font-mono text-sm text-gray-900 mb-2">INV-{selectedOrder.id.substring(0, 8).toUpperCase()}</p>
                  <p className="text-sm text-gray-500 font-medium">Date:</p>
                  <p className="text-sm text-gray-900">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-10">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To</p>
                <h3 className="text-lg font-bold text-gray-900">{selectedOrder.customer_name}</h3>
                <p className="text-gray-600">WhatsApp: {selectedOrder.customer_phone}</p>
                {selectedOrder.shipping_address && (
                  <p className="text-gray-600 mt-1 max-w-xs">{selectedOrder.shipping_address}</p>
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
                  {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                    selectedOrder.order_items.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-200">
                        <td className="py-4 text-gray-800">
                          <div className="font-medium">{item.products?.name || 'Unknown Product'}</div>
                          <div className="text-sm text-gray-500 mt-1">{currencySymbol}{Number(item.price_at_purchase).toLocaleString()} per item</div>
                        </td>
                        <td className="py-4 text-gray-900 font-medium text-center">{item.quantity}</td>
                        <td className="py-4 text-gray-900 font-medium text-right">{currencySymbol}{(Number(item.price_at_purchase) * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-b border-gray-200">
                      <td className="py-4 text-gray-800">
                        <div className="font-medium">Total WhatsApp Order</div>
                        <div className="text-sm text-gray-500 mt-1">Order processed via WhatsApp checkout. Itemized list available in chat history.</div>
                      </td>
                      <td className="py-4 text-gray-900 font-medium text-center">-</td>
                      <td className="py-4 text-gray-900 font-medium text-right">{currencySymbol}{Number(selectedOrder.total_amount).toLocaleString()}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Total Calculation */}
              <div className="flex justify-end">
                <div className="w-1/2">
                  <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium text-gray-900">{currencySymbol}{Number(selectedOrder.total_amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-4 text-lg font-bold">
                    <span className="text-gray-900">Total Due</span>
                    <span style={{ color: store.primary_color || '#000' }}>{currencySymbol}{Number(selectedOrder.total_amount).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
                <p>Thank you for shopping with {store.store_name}!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-gray-900 border border-gray-800 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-5 duration-300 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
              {selectedOrderIds.length}
            </div>
            <span className="text-sm font-medium text-gray-250">Orders Selected</span>
          </div>
          <div className="h-6 w-px bg-gray-850" />
          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkPrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/95 transition-all shadow-md shadow-primary/20"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Selected Bills (Single Click)
            </button>
            <button
              onClick={() => setSelectedOrderIds([])}
              className="px-3 py-2 bg-gray-850 hover:bg-gray-800 text-gray-300 text-xs font-medium rounded-lg transition-all"
            >
              Cancel Selection
            </button>
          </div>
        </div>
      )}

      {/* Bulk Invoice Print Preview Modal */}
      {bulkPrintOrders.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:block">
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col print:shadow-none print:max-w-none print:h-auto print:max-h-none print:rounded-none">
            
            {/* Modal Header (Hidden in Print) */}
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
                  <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
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
                          <path fill-rule="evenodd" clip-rule="evenodd" d="M151.609 0.266528C150.787 0.443259 149.224 1.0234 148.136 1.5553C143.392 3.87416 140.27 8.63054 139.851 14.1765L139.703 16.1346L134.13 16.2005L128.557 16.2667L127.436 16.888C125.665 17.869 124.797 19.2248 124.416 21.6028C123.447 27.6533 122.677 31.4413 122.315 31.9388C122.095 32.241 121.492 32.7046 120.975 32.9687C120.048 33.4427 119.926 33.4489 111.64 33.4489H103.244L102.721 33.9729C101.97 34.7238 101.988 36.0288 102.759 36.635C103.303 37.0632 103.565 37.0779 110.923 37.0894C116.236 37.098 118.744 37.1782 119.252 37.3562C120.232 37.6997 120.807 38.5396 120.915 39.7831C121.029 41.1126 120.459 42.0699 119.214 42.6347C118.354 43.0255 117.653 43.0447 104.101 43.0492L89.8914 43.0539L89.4272 43.5478C88.7141 44.3072 88.7984 45.4387 89.6199 46.1298L90.2765 46.6825L103.761 46.6833C116.758 46.684 117.269 46.6991 117.928 47.1008C118.892 47.6888 119.345 48.6621 119.21 49.8581C119.121 50.6467 118.938 50.9804 118.234 51.6371L117.368 52.4454H108.598C98.9653 52.4454 98.8808 52.4559 98.359 53.7161C98.1419 54.2396 98.1419 54.4932 98.359 55.0168C98.8751 56.2631 99.0529 56.2874 107.649 56.2874C114.507 56.2874 115.544 56.3305 116.062 56.6366C116.879 57.119 117.351 58.0044 117.351 59.0524C117.351 60.3138 116.841 61.1584 115.79 61.6357C114.992 61.9975 114.344 62.0415 109.752 62.0457L104.607 62.0504L104.042 62.5738C103.285 63.2754 103.267 64.4209 104.001 65.155C104.524 65.6779 104.534 65.679 108.991 65.679C111.446 65.679 113.767 65.7413 114.147 65.8173C115.132 66.0143 116.209 67.1677 116.386 68.2151C116.692 70.0245 118.977 72.3531 121.074 72.9922C121.743 73.1962 128.318 73.2562 150.008 73.2562C182.384 73.2562 179.408 73.4558 181.737 71.1284C182.845 70.0204 183.119 69.5908 183.497 68.3656C183.744 67.5675 183.945 66.5645 183.943 66.1368C183.942 65.7088 183.602 62.7654 183.188 59.5958C182.383 53.4384 182.226 52.1897 181.708 47.8564C181.525 46.3303 181.16 43.3527 180.896 41.2396L180.416 37.3976L159.822 37.2892L139.229 37.181L159.773 37.1291L180.317 37.0775V36.4604C180.317 36.121 180.082 33.984 179.795 31.7113C179.508 29.4387 179.121 26.1865 178.935 24.4843C178.749 22.7821 178.547 20.9909 178.487 20.504C178.358 19.4712 177.423 17.9619 176.48 17.2644C175.295 16.3886 174.251 16.16 171.432 16.16H168.791L168.788 15.0394C168.781 12.0397 167.431 8.12062 165.521 5.54926C162.458 1.42766 156.581 -0.80368 151.609 0.266528ZM151.374 4.18344C146.936 5.45407 143.946 9.38635 143.476 14.5718L143.332 16.16H154.254H165.175L165.043 14.7192C164.742 11.4104 163.724 8.9601 161.822 6.96675C159.204 4.22143 155.079 3.12284 151.374 4.18344ZM147.393 26.1385C152.823 26.1701 161.707 26.1701 167.137 26.1385C172.567 26.1067 168.124 26.0808 157.265 26.0808C146.406 26.0808 141.964 26.1067 147.393 26.1385ZM177.708 26.6196C178.614 27.172 178.911 27.1713 178.076 26.6187C177.724 26.3854 177.34 26.1944 177.222 26.194C177.105 26.1938 177.323 26.3852 177.708 26.6196ZM159.464 30.1408C158.494 30.8201 158.668 32.7172 159.744 33.2077C161.086 33.8195 162.388 33.0449 162.388 31.6347C162.388 30.1557 160.685 29.2857 159.464 30.1408ZM165.971 30.1113C165.05 30.8116 165.079 32.7339 166.019 33.2372C167.255 33.8984 168.791 33.0319 168.791 31.6731C168.791 30.5894 168.094 29.8187 167.121 29.8272C166.69 29.8308 166.172 29.9587 165.971 30.1113ZM172.282 30.3262C171.065 31.3732 171.831 33.4489 173.434 33.4489C174.272 33.4489 175.408 32.4812 175.408 31.7678C175.408 30.0964 173.547 29.2381 172.282 30.3262ZM128.718 41.2127C128.512 41.3248 128.273 41.521 128.187 41.6484C127.887 42.0911 128.026 43.0565 128.45 43.4808C128.831 43.8614 129.162 43.9077 131.504 43.9077H134.131L136.651 51.645C138.037 55.9007 139.309 59.6031 139.479 59.8728C139.648 60.1424 140.093 60.5503 140.468 60.7791C141.118 61.1757 141.613 61.1951 151.075 61.1951C160.527 61.1951 161.033 61.1753 161.681 60.7804C162.055 60.5522 162.468 60.1646 162.6 59.919C162.731 59.6733 163.638 56.8161 164.616 53.5696C166.127 48.5469 166.36 47.574 166.175 47.0449C165.749 45.8229 165.82 45.8287 151.126 45.8287H137.716L137.143 44.0678C136.417 41.8396 136.112 41.4142 135.031 41.1231C134.007 40.8475 129.263 40.915 128.718 41.2127ZM139.21 50.3644C139.474 51.2156 140.159 53.3231 140.731 55.048C141.648 57.8106 141.834 58.1999 142.301 58.3171C143.258 58.5572 159.81 58.3753 160.139 58.1211C160.304 57.9931 160.792 56.6876 161.223 55.2202C161.654 53.7528 162.236 51.8028 162.517 50.8869C162.798 49.971 163.028 49.1307 163.028 49.0192C163.028 48.8942 158.395 48.8169 150.878 48.8169H138.729L139.21 50.3644ZM142.792 63.7509C142.403 63.9947 141.935 64.5522 141.751 64.99C140.834 67.1739 143.407 69.2887 145.459 68.0375C146.394 67.467 146.66 66.8757 146.54 65.6288C146.408 64.2529 145.727 63.5349 144.43 63.4028C143.736 63.3319 143.318 63.4207 142.792 63.7509ZM156.859 63.8805C155.943 64.651 155.632 65.7863 156.058 66.8051C156.429 67.6951 157.503 68.4518 158.396 68.4529C160.854 68.4563 161.863 65.0297 159.779 63.7588C158.791 63.1567 157.663 63.2036 156.859 63.8805Z" fill="#3C77C3"/>
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
                    <p className="text-gray-600 font-medium">WhatsApp: {order.customer_phone}</p>
                    {order.shipping_address && (
                      <p className="text-gray-650 mt-1.5 max-w-xs">{order.shipping_address}</p>
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
                          <tr key={idx} className="border-b border-gray-200">
                            <td className="py-4 text-gray-800">
                              <div className="font-medium">{item.products?.name || 'Unknown Product'}</div>
                              <div className="text-sm text-gray-500 mt-1">{currencySymbol}{Number(item.price_at_purchase).toLocaleString()} per item</div>
                            </td>
                            <td className="py-4 text-gray-900 font-medium text-center">{item.quantity}</td>
                            <td className="py-4 text-gray-900 font-medium text-right">{currencySymbol}{(Number(item.price_at_purchase) * item.quantity).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr className="border-b border-gray-200">
                          <td className="py-4 text-gray-800">
                            <div className="font-medium">Total WhatsApp Order</div>
                            <div className="text-sm text-gray-500 mt-1">Order processed via WhatsApp checkout. Itemized list available in chat history.</div>
                          </td>
                          <td className="py-4 text-gray-900 font-medium text-center">-</td>
                          <td className="py-4 text-gray-900 font-medium text-right">{currencySymbol}{Number(order.total_amount).toLocaleString()}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Total Calculation */}
                  <div className="flex justify-end">
                    <div className="w-1/2">
                      <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="font-medium text-gray-900">{currencySymbol}{Number(order.total_amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-4 text-lg font-bold">
                        <span className="text-gray-900">Total Due</span>
                        <span style={{ color: store.primary_color || '#000' }}>{currencySymbol}{Number(order.total_amount).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
                    <p>Thank you for shopping with {store.store_name}!</p>
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
