'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, ReceiptText, CheckCircle, Clock, Printer } from 'lucide-react';

export default function OrdersPage() {
  const [store, setStore] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Invoice Modal State
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // Bulk Selection & Printing States
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkPrintOrders, setBulkPrintOrders] = useState<any[]>([]);
  
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data: storeData } = await supabase.from('stores').select('*').eq('owner_id', user.id).single();
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

  const currencySymbol = store?.currency === 'USD' ? '$' : '₹';

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          /* Hide all non-printable elements by default */
          body * {
            visibility: hidden !important;
          }
          /* Only show the print target container and its children */
          .print-invoice-container,
          .print-invoice-container * {
            visibility: visible !important;
          }
          /* Position the print target container at the absolute top-left of the viewport */
          .print-invoice-container {
            visibility: visible !important;
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Reset page margins and scroll overflows on parent layouts */
          html, body {
            background: white !important;
            color: black !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
          }
          /* Prevent display: flex or height restrictions from shrinking pages */
          div, main, section, aside {
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            display: block !important;
          }
          /* Define clean layout specs for printed sheets */
          .print-invoice-sheet {
            page-break-after: always !important;
            break-after: page !important;
            display: block !important;
            background: white !important;
            padding: 2cm !important;
            box-sizing: border-box !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
          }
        }
      `}</style>
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Orders & Billing</h2>
          <p className="text-muted-foreground">Manage your WhatsApp orders and generate bills.</p>
        </div>
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
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ReceiptText className="w-12 h-12 mb-3 opacity-20" />
                      <p>No orders yet.</p>
                      <p className="text-sm">When customers checkout via WhatsApp, orders will appear here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
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
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-2xl mb-4" style={{ backgroundColor: store.primary_color || '#000' }}>
                    {store.store_name?.charAt(0).toUpperCase()}
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
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-2xl mb-4" style={{ backgroundColor: store.primary_color || '#000' }}>
                        {store.store_name?.charAt(0).toUpperCase()}
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
