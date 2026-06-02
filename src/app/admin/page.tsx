'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Plus, Loader2 } from 'lucide-react';

export default function DashboardHome() {
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', sku: '', description: '' });

  useEffect(() => {
    fetchData();
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
      if (ordData) setOrders(ordData);
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
        <div className="bg-card text-card-foreground p-6 rounded-xl border border-border/50 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Revenue</h3>
          <div className="text-3xl font-bold">{currencySymbol}{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="bg-card text-card-foreground p-6 rounded-xl border border-border/50 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Orders</h3>
          <div className="text-3xl font-bold">{orders.length}</div>
        </div>
        <div className="bg-card text-card-foreground p-6 rounded-xl border border-border/50 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Products</h3>
          <div className="text-3xl font-bold">{products.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card text-card-foreground rounded-xl border border-border/50 shadow-sm flex flex-col">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h2 className="font-semibold text-lg">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-primary hover:underline">View All</Link>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-border">
                <tr>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">No orders yet.</td>
                  </tr>
                ) : (
                  orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-6 py-4">
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                      </td>
                      <td className="px-6 py-4 font-medium">{currencySymbol}{order.total_amount}</td>
                      <td className="px-6 py-4">
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full capitalize">{order.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-xl border border-border/50 shadow-sm flex flex-col">
          <div className="p-6 border-b border-border">
            <h2 className="font-semibold text-lg">Inventory Alerts</h2>
          </div>
          <div className="p-6 flex-1 space-y-4">
            {lowInventory.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">All products are well stocked.</div>
            ) : (
              lowInventory.map(product => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs font-medium">IMG</div>
                    <div>
                      <p className="font-medium text-sm truncate max-w-[120px]">{product.name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {product.sku || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-destructive">{product.inventory_quantity} left</p>
                  </div>
                </div>
              ))
            )}
            <button onClick={() => setShowAddProduct(true)} className="w-full mt-4 py-2 border border-input rounded-md text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>
        </div>
      </div>

      {showAddProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold">Add New Product</h2>
              <button onClick={() => setShowAddProduct(false)} className="text-muted-foreground hover:text-foreground text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name *</label>
                <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price ({currencySymbol}) *</label>
                <input required type="number" step="0.01" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SKU</label>
                <input type="text" value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full p-3 rounded-md border border-input bg-background min-h-[100px] focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddProduct(false)} className="px-4 py-2 border border-input rounded-md font-medium hover:bg-muted">Cancel</button>
                <button type="submit" disabled={addingProduct} className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                  {addingProduct && <Loader2 className="w-4 h-4 animate-spin" />} Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
