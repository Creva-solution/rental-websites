'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Search, Edit, Trash2, Package, Upload } from 'lucide-react';

export default function ProductsPage() {
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add Product Modal State
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', sku: '', description: '', inventory_quantity: 10, category: 'Fashion', sizes: 'S, M, L, XL', image_url: '', colors: 'Black, White, Purple' });
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  
  // Category Selection/Creation States
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [showEditCategoryInput, setShowEditCategoryInput] = useState(false);
  
  const uploadImage = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (error) {
        console.error("Storage upload failed for products bucket, trying assets bucket...", error);
        
        const { data: dataAlt, error: errorAlt } = await supabase.storage
          .from('assets')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (errorAlt) throw errorAlt;
        
        const { data: { publicUrl } } = supabase.storage
          .from('assets')
          .getPublicUrl(filePath);
        return publicUrl;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);
      return publicUrl;
    } catch (err) {
      console.error("Upload error:", err);
      throw err;
    }
  };

  // Canvas Cropper State
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<'new' | 'edit' | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'new' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropTarget(target);
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
    };
    reader.readAsDataURL(file);
  };

  const handleCropSave = () => {
    const canvas = document.getElementById('cropper-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    // Compress to a highly optimized base64 string
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    if (cropTarget === 'new') {
      setNewProduct(prev => ({ ...prev, image_url: croppedDataUrl }));
    } else if (cropTarget === 'edit') {
      setEditingProduct((prev: any) => prev ? { ...prev, image_url: croppedDataUrl } : null);
    }
    
    setCropImageSrc(null);
    setCropTarget(null);
  };

  useEffect(() => {
    if (!cropImageSrc) return;
    const canvas = document.getElementById('cropper-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.src = cropImageSrc;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const size = Math.min(img.width, img.height);
      const drawWidth = (img.width / size) * canvas.width * zoom;
      const drawHeight = (img.height / size) * canvas.height * zoom;
      
      const x = (canvas.width - drawWidth) / 2 + offsetX;
      const y = (canvas.height - drawHeight) / 2 + offsetY;
      
      ctx.drawImage(img, x, y, drawWidth, drawHeight);
    };
  }, [cropImageSrc, zoom, offsetX, offsetY]);

  // Real-time ticker to update countdowns inside table
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const getProductImage = (product: any) => {
    try {
      if (product.description && product.description.startsWith('{')) {
        const parsed = JSON.parse(product.description);
        return parsed.image_url || '';
      }
    } catch (e) {}
    return product.image_url || '';
  };

  const existingCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      try {
        if (p.description && p.description.startsWith('{')) {
          const parsed = JSON.parse(p.description);
          if (parsed.category) set.add(parsed.category);
        }
      } catch (e) {}
    });
    if (set.size === 0) {
      set.add('Fashion');
      set.add('Electronics');
      set.add('Home');
    }
    return Array.from(set);
  }, [products]);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data: storeData } = await supabase.from('stores').select('*').eq('owner_id', user.id).single();
    if (storeData) {
      setStore(storeData);
      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeData.id)
        .order('created_at', { ascending: false });
      if (prodData) setProducts(prodData);
    }
    setLoading(false);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const customSizes = newProduct.sizes ? newProduct.sizes.split(',').map(s => s.trim()).filter(Boolean) : [];
      const customColors = newProduct.colors ? newProduct.colors.split(',').map(s => s.trim()).filter(Boolean) : [];
      const descData = {
        description: newProduct.description,
        category: newProduct.category || 'Fashion',
        sizes: customSizes,
        colors: customColors,
        image_url: newProduct.image_url
      };

      const { error } = await supabase.from('products').insert([{
        store_id: store.id,
        name: newProduct.name,
        price: Number(newProduct.price),
        sku: newProduct.sku,
        description: JSON.stringify(descData),
        is_active: true,
        inventory_quantity: Number(newProduct.inventory_quantity)
      }]);
      
      if (error) throw error;
      
      setShowModal(false);
      setShowNewCategoryInput(false);
      setNewProduct({ name: '', price: '', sku: '', description: '', inventory_quantity: 10, category: 'Fashion', sizes: 'S, M, L, XL', image_url: '', colors: 'Black, White, Purple' });
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert("Failed to add product: " + (err?.message || err?.error_description || JSON.stringify(err)));
    } finally {
      setSaving(false);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSaving(true);
    try {
      const customSizes = editingProduct.sizes ? editingProduct.sizes.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
      const customColors = editingProduct.colors ? editingProduct.colors.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
      
      let promoData: any = {
        description: editingProduct.description,
        category: editingProduct.category || 'Fashion',
        sizes: customSizes,
        colors: customColors,
        image_url: editingProduct.image_url
      };

      if (editingProduct.is_promo) {
        const discPrice = Math.round(Number(editingProduct.price) * (1 - Number(editingProduct.offer_percent) / 100));
        const totalMinutes = (Number(editingProduct.offer_hours) * 60) + Number(editingProduct.offer_minutes);
        const endTime = new Date(Date.now() + totalMinutes * 60 * 1000).toISOString();
        
        promoData.offer_percent = Number(editingProduct.offer_percent);
        promoData.offer_price = discPrice;
        promoData.offer_ends_at = endTime;
      }

      const { error } = await supabase
        .from('products')
        .update({
          name: editingProduct.name,
          price: Number(editingProduct.price),
          sku: editingProduct.sku,
          description: JSON.stringify(promoData),
          inventory_quantity: Number(editingProduct.inventory_quantity),
          is_active: editingProduct.is_active
        })
        .eq('id', editingProduct.id);
        
      if (error) throw error;
      
      setEditingProduct(null);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert("Failed to update product: " + (err?.message || err?.error_description || JSON.stringify(err)));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete product");
    }
  };

  if (loading && !store) return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const currencySymbol = store?.currency === 'USD' ? '$' : '₹';
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">Manage your store inventory and product catalog.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Product Name</th>
                <th className="px-6 py-4 font-medium">SKU</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Inventory</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Package className="w-12 h-12 mb-3 opacity-20" />
                      <p>No products found.</p>
                      {searchQuery ? <p className="text-sm">Try a different search term.</p> : <p className="text-sm">Click "Add Product" to create your first product.</p>}
                    </div>
                  </td>
                </tr>
              ) : (
              filteredProducts.map((product) => {
                let descText = product.description || '';
                let hasActiveOffer = false;
                let offerPrice = Number(product.price);
                let offerPercent = 0;
                let timeLeftText = '';

                try {
                  if (product.description && product.description.startsWith('{')) {
                    const parsed = JSON.parse(product.description);
                    descText = parsed.description || '';
                    if (parsed.offer_ends_at && parsed.offer_price) {
                      const endTime = new Date(parsed.offer_ends_at).getTime();
                      const now = Date.now();
                      if (endTime > now) {
                        hasActiveOffer = true;
                        offerPrice = Number(parsed.offer_price);
                        offerPercent = Number(parsed.offer_percent) || 50;
                        
                        const diffMs = endTime - now;
                        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                        const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
                        if (diffHrs > 0) {
                          timeLeftText = `${diffHrs}h ${diffMins}m`;
                        } else if (diffMins > 0) {
                          timeLeftText = `${diffMins}m ${diffSecs}s`;
                        } else {
                          timeLeftText = `${diffSecs}s`;
                        }
                      }
                    }
                  }
                } catch (e) {
                  // fallback
                }

                return (
                  <tr key={product.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getProductImage(product) ? (
                          <div className="w-10 h-10 rounded overflow-hidden border border-border bg-muted flex-shrink-0">
                            <img src={getProductImage(product)} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs font-black text-muted-foreground border border-border flex-shrink-0">
                            IMG
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-foreground">{product.name}</div>
                          {descText && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{descText}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{product.sku || '-'}</td>
                    <td className="px-6 py-4">
                      {hasActiveOffer ? (
                        <div className="space-y-0.5">
                          <div className="font-semibold text-foreground">{currencySymbol}{offerPrice.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground line-through">{currencySymbol}{Number(product.price).toLocaleString()}</div>
                          <div className="text-[10px] text-red-600 font-extrabold flex items-center gap-0.5">
                            🔥 {offerPercent}% OFF ({timeLeftText})
                          </div>
                        </div>
                      ) : (
                        <span className="font-medium">{currencySymbol}{Number(product.price).toLocaleString()}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${product.inventory_quantity > 10 ? 'bg-green-100 text-green-800' : product.inventory_quantity > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {product.inventory_quantity} in stock
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${product.is_active ? 'bg-blue-100 text-blue-800' : 'bg-muted text-muted-foreground'}`}>
                        {product.is_active ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            let desc = product.description || '';
                            let isPromo = false;
                            let offerPercent = 50;
                            let offerHours = 0;
                            let offerMinutes = 30;
                            let sizes = 'S, M, L, XL';
                            let colors = 'Black, White, Purple';
                            let imageUrl = '';
                            let category = 'Fashion';
                            try {
                              if (product.description && product.description.startsWith('{')) {
                                const parsed = JSON.parse(product.description);
                                desc = parsed.description || '';
                                if (parsed.sizes && Array.isArray(parsed.sizes)) {
                                  sizes = parsed.sizes.join(', ');
                                }
                                if (parsed.colors && Array.isArray(parsed.colors)) {
                                  colors = parsed.colors.join(', ');
                                } else {
                                  colors = '';
                                }
                                imageUrl = parsed.image_url || '';
                                category = parsed.category || 'Fashion';
                                if (parsed.offer_ends_at) {
                                  const endTime = new Date(parsed.offer_ends_at).getTime();
                                  if (endTime > Date.now()) {
                                    isPromo = true;
                                    offerPercent = parsed.offer_percent || 50;
                                    const diffMs = endTime - Date.now();
                                    const totalMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
                                    offerHours = Math.floor(totalMinutes / 60);
                                    offerMinutes = totalMinutes % 60;
                                  }
                                }
                              }
                            } catch (e) {}

                            setEditingProduct({
                              id: product.id,
                              name: product.name,
                              price: product.price,
                              sku: product.sku || '',
                              description: desc,
                              inventory_quantity: product.inventory_quantity,
                              is_active: product.is_active,
                              is_promo: isPromo,
                              offer_percent: offerPercent,
                              offer_hours: offerHours,
                              offer_minutes: offerMinutes,
                              sizes: sizes,
                              colors: colors,
                              category: category,
                              image_url: imageUrl || product.image_url || ''
                            });
                          }}
                          className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors" 
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 hover:bg-red-100 rounded-md text-muted-foreground hover:text-red-600 transition-colors" 
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-background rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold">Add New Product</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-4 flex-1">
              <form id="add-product-form" onSubmit={handleAddProduct} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product Name *</label>
                  <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. Handmade Organic Soap" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price ({currencySymbol}) *</label>
                    <input required type="number" step="0.01" min="0" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Inventory Quantity *</label>
                    <input required type="number" min="0" value={newProduct.inventory_quantity} onChange={e => setNewProduct({...newProduct, inventory_quantity: Number(e.target.value)})} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">SKU (Optional)</label>
                  <input type="text" value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. SOAP-ORG-001" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Category</label>
                    <button
                      type="button"
                      onClick={() => setShowNewCategoryInput(!showNewCategoryInput)}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      {showNewCategoryInput ? "Choose Existing" : "+ Create New Category"}
                    </button>
                  </div>
                  
                  {showNewCategoryInput ? (
                    <input 
                      type="text" 
                      value={newProduct.category} 
                      onChange={e => setNewProduct({...newProduct, category: e.target.value})} 
                      className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none text-sm animate-in slide-in-from-top-1 duration-200" 
                      placeholder="Type new category name..." 
                    />
                  ) : (
                    <select 
                      value={newProduct.category} 
                      onChange={e => setNewProduct({...newProduct, category: e.target.value})} 
                      className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none text-sm"
                    >
                      {existingCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Product Image</label>
                  <div className="flex gap-4 items-center">
                    {newProduct.image_url ? (
                      <div className="relative w-20 h-20 rounded-md border border-border overflow-hidden bg-muted flex-shrink-0 group">
                        <img src={newProduct.image_url} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => setNewProduct({...newProduct, image_url: ''})}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="w-20 h-20 rounded-md border border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors bg-muted/20 flex flex-col items-center justify-center cursor-pointer flex-shrink-0">
                        <Upload className="w-5 h-5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground font-bold mt-1 text-center">Upload & Crop</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleFileChange(e, 'new')}
                        />
                      </label>
                    )}
                    
                    <div className="flex-1 space-y-1">
                      <input 
                        type="text" 
                        value={newProduct.image_url} 
                        onChange={e => setNewProduct({...newProduct, image_url: e.target.value})} 
                        className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none text-xs" 
                        placeholder="Paste image URL or click square to upload..." 
                      />
                      <span className="text-[10px] text-muted-foreground block font-medium">
                        Supported: PNG, JPG, JPEG, WEBP.
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sizes (Comma separated for clothing sizes selection)</label>
                  <input 
                    type="text" 
                    value={newProduct.sizes} 
                    onChange={e => setNewProduct({...newProduct, sizes: e.target.value})} 
                    className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none text-sm" 
                    placeholder="e.g. S, M, L, XL" 
                  />
                </div>
                
                <div className="flex gap-1.5 flex-wrap pt-0.5">
                  <button 
                    type="button" 
                    onClick={() => setNewProduct({...newProduct, sizes: 'S, M, L, XL'})}
                    className="px-2.5 py-1 bg-secondary text-[10px] font-bold rounded hover:bg-secondary/80 transition-colors"
                  >
                    Clothing (S, M, L, XL)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setNewProduct({...newProduct, sizes: 'S, M, L, XL, XXL, XXXL'})}
                    className="px-2.5 py-1 bg-secondary text-[10px] font-bold rounded hover:bg-secondary/80 transition-colors"
                  >
                    Extended Clothing
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setNewProduct({...newProduct, sizes: '7, 8, 9, 10, 11'})}
                    className="px-2.5 py-1 bg-secondary text-[10px] font-bold rounded hover:bg-secondary/80 transition-colors"
                  >
                    Shoes (7, 8, 9, 10)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setNewProduct({...newProduct, sizes: ''})}
                    className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold rounded hover:bg-red-100/50 transition-colors"
                  >
                    No Sizes (None)
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Colors (Comma separated for color swatches selection)</label>
                  <input 
                    type="text" 
                    value={newProduct.colors} 
                    onChange={e => setNewProduct({...newProduct, colors: e.target.value})} 
                    className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none text-sm" 
                    placeholder="e.g. Black, White, Purple" 
                  />
                </div>
                
                <div className="flex gap-1.5 flex-wrap pt-0.5">
                  <button 
                    type="button" 
                    onClick={() => setNewProduct({...newProduct, colors: 'Black, White, Gray'})}
                    className="px-2.5 py-1 bg-secondary text-[10px] font-bold rounded hover:bg-secondary/80 transition-colors"
                  >
                    Neutrals (Black, White, Gray)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setNewProduct({...newProduct, colors: 'Blue, Navy, Purple, Green'})}
                    className="px-2.5 py-1 bg-secondary text-[10px] font-bold rounded hover:bg-secondary/80 transition-colors"
                  >
                    Cool Tones
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setNewProduct({...newProduct, colors: 'Red, Pink, Yellow, Orange'})}
                    className="px-2.5 py-1 bg-secondary text-[10px] font-bold rounded hover:bg-secondary/80 transition-colors"
                  >
                    Warm Tones
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setNewProduct({...newProduct, colors: ''})}
                    className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold rounded hover:bg-red-100/50 transition-colors"
                  >
                    No Colors (None)
                  </button>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full p-3 rounded-md border border-input bg-background min-h-[120px] focus:ring-2 focus:ring-primary outline-none" placeholder="Describe your product..." />
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3 mt-auto">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-input rounded-md font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
              <button type="submit" form="add-product-form" disabled={saving} className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-background rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold">Edit Product</h2>
              <button onClick={() => setEditingProduct(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-4 flex-1">
              <form id="edit-product-form" onSubmit={handleEditProduct} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product Name *</label>
                  <input required type="text" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price ({currencySymbol}) *</label>
                    <input required type="number" step="0.01" min="0" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Inventory Quantity *</label>
                    <input required type="number" min="0" value={editingProduct.inventory_quantity} onChange={e => setEditingProduct({...editingProduct, inventory_quantity: Number(e.target.value)})} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">SKU (Optional)</label>
                    <input type="text" value={editingProduct.sku} onChange={e => setEditingProduct({...editingProduct, sku: e.target.value})} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Product Status</label>
                    <select 
                      value={editingProduct.is_active ? 'active' : 'draft'} 
                      onChange={e => setEditingProduct({...editingProduct, is_active: e.target.value === 'active'})}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Category</label>
                    <button
                      type="button"
                      onClick={() => setShowEditCategoryInput(!showEditCategoryInput)}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      {showEditCategoryInput ? "Choose Existing" : "+ Create New Category"}
                    </button>
                  </div>
                  
                  {showEditCategoryInput ? (
                    <input 
                      type="text" 
                      value={editingProduct.category || ''} 
                      onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} 
                      className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none text-sm animate-in slide-in-from-top-1 duration-200" 
                      placeholder="Type new category name..." 
                    />
                  ) : (
                    <select 
                      value={editingProduct.category || ''} 
                      onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} 
                      className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none text-sm"
                    >
                      {existingCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Product Image</label>
                  <div className="flex gap-4 items-center">
                    {editingProduct.image_url ? (
                      <div className="relative w-20 h-20 rounded-md border border-border overflow-hidden bg-muted flex-shrink-0 group">
                        <img src={editingProduct.image_url} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => setEditingProduct({...editingProduct, image_url: ''})}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="w-20 h-20 rounded-md border border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors bg-muted/20 flex flex-col items-center justify-center cursor-pointer flex-shrink-0">
                        <Upload className="w-5 h-5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground font-bold mt-1 text-center">Upload & Crop</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleFileChange(e, 'edit')}
                        />
                      </label>
                    )}
                    
                    <div className="flex-1 space-y-1">
                      <input 
                        type="text" 
                        value={editingProduct.image_url || ''} 
                        onChange={e => setEditingProduct({...editingProduct, image_url: e.target.value})} 
                        className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none text-xs" 
                        placeholder="Paste image URL or click square to upload..." 
                      />
                      <span className="text-[10px] text-muted-foreground block font-medium">
                        Supported: PNG, JPG, JPEG, WEBP.
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sizes (Comma separated for clothing sizes selection)</label>
                  <input 
                    type="text" 
                    value={editingProduct.sizes || ''} 
                    onChange={e => setEditingProduct({...editingProduct, sizes: e.target.value})} 
                    className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none text-sm" 
                  />
                </div>
                
                <div className="flex gap-1.5 flex-wrap pt-0.5">
                  <button 
                    type="button" 
                    onClick={() => setEditingProduct({...editingProduct, sizes: 'S, M, L, XL'})}
                    className="px-2.5 py-1 bg-secondary text-[10px] font-bold rounded hover:bg-secondary/80 transition-colors"
                  >
                    Clothing (S, M, L, XL)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEditingProduct({...editingProduct, sizes: 'S, M, L, XL, XXL, XXXL'})}
                    className="px-2.5 py-1 bg-secondary text-[10px] font-bold rounded hover:bg-secondary/80 transition-colors"
                  >
                    Extended Clothing
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEditingProduct({...editingProduct, sizes: '7, 8, 9, 10, 11'})}
                    className="px-2.5 py-1 bg-secondary text-[10px] font-bold rounded hover:bg-secondary/80 transition-colors"
                  >
                    Shoes (7, 8, 9, 10)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEditingProduct({...editingProduct, sizes: ''})}
                    className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold rounded hover:bg-red-100/50 transition-colors"
                  >
                    No Sizes (None)
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Colors (Comma separated for color swatches selection)</label>
                  <input 
                    type="text" 
                    value={editingProduct.colors || ''} 
                    onChange={e => setEditingProduct({...editingProduct, colors: e.target.value})} 
                    className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none text-sm" 
                  />
                </div>
                
                <div className="flex gap-1.5 flex-wrap pt-0.5">
                  <button 
                    type="button" 
                    onClick={() => setEditingProduct({...editingProduct, colors: 'Black, White, Gray'})}
                    className="px-2.5 py-1 bg-secondary text-[10px] font-bold rounded hover:bg-secondary/80 transition-colors"
                  >
                    Neutrals (Black, White, Gray)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEditingProduct({...editingProduct, colors: 'Blue, Navy, Purple, Green'})}
                    className="px-2.5 py-1 bg-secondary text-[10px] font-bold rounded hover:bg-secondary/80 transition-colors"
                  >
                    Cool Tones
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEditingProduct({...editingProduct, colors: 'Red, Pink, Yellow, Orange'})}
                    className="px-2.5 py-1 bg-secondary text-[10px] font-bold rounded hover:bg-secondary/80 transition-colors"
                  >
                    Warm Tones
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEditingProduct({...editingProduct, colors: ''})}
                    className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold rounded hover:bg-red-100/50 transition-colors"
                  >
                    No Colors (None)
                  </button>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full p-3 rounded-md border border-input bg-background min-h-[80px] focus:ring-2 focus:ring-primary outline-none" />
                </div>

                {/* LIMITED TIME PROMOTIONS (FLASH SALE SCHEDULE) */}
                <div className="border border-red-100 rounded-lg p-4 bg-red-50/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-bold text-red-600 flex items-center gap-1">🔥 Limited-Time Flash Sale</label>
                      <p className="text-xs text-muted-foreground">Select to enable a countdown-scheduled discount offer.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={editingProduct.is_promo} 
                      onChange={e => setEditingProduct({...editingProduct, is_promo: e.target.checked})} 
                      className="w-4.5 h-4.5 accent-red-600" 
                    />
                  </div>

                  {editingProduct.is_promo && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-red-100/50 animate-in slide-in-from-top-2 duration-200">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700">Discount Percent (%)</label>
                        <input 
                          type="number" 
                          min="1" 
                          max="99" 
                          value={editingProduct.offer_percent} 
                          onChange={e => setEditingProduct({...editingProduct, offer_percent: e.target.value})} 
                          className="w-full h-9 px-3 rounded border border-input bg-background focus:ring-2 focus:ring-primary outline-none text-xs" 
                        />
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Calculated Price: <span className="font-extrabold text-red-600">{currencySymbol}{Math.round(Number(editingProduct.price) * (1 - Number(editingProduct.offer_percent) / 100))}</span>
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700">Duration *</label>
                        <div className="flex gap-2">
                          <div className="flex-1 flex items-center gap-1.5 bg-background border border-input rounded px-2 h-9">
                            <input 
                              type="number" 
                              min="0" 
                              required
                              value={editingProduct.offer_hours} 
                              onChange={e => setEditingProduct({...editingProduct, offer_hours: e.target.value})} 
                              className="w-full text-xs bg-transparent outline-none text-right font-medium" 
                            />
                            <span className="text-[10px] text-gray-400 font-bold">hrs</span>
                          </div>
                          <div className="flex-1 flex items-center gap-1.5 bg-background border border-input rounded px-2 h-9">
                            <input 
                              type="number" 
                              min="0" 
                              max="59" 
                              required
                              value={editingProduct.offer_minutes} 
                              onChange={e => setEditingProduct({...editingProduct, offer_minutes: e.target.value})} 
                              className="w-full text-xs bg-transparent outline-none text-right font-medium" 
                            />
                            <span className="text-[10px] text-gray-400 font-bold">mins</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Expires in exactly: <span className="font-extrabold text-red-600">{editingProduct.offer_hours || 0}h {editingProduct.offer_minutes || 0}m</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3 mt-auto">
              <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 border border-input rounded-md font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
              <button type="submit" form="edit-product-form" disabled={saving} className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Canvas Cropper Modal */}
      {cropImageSrc && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-background rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="font-bold text-base">Crop & Resize Product Image</h3>
              <button 
                onClick={() => {
                  setCropImageSrc(null);
                  setCropTarget(null);
                }} 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4 flex flex-col items-center">
              <p className="text-xs text-muted-foreground text-center">
                Drag the image to adjust position, and use the slider below to zoom.
              </p>
              
              {/* Canvas Wrapper */}
              <div className="relative w-64 h-64 border-2 border-primary rounded-lg overflow-hidden bg-muted flex items-center justify-center shadow-inner cursor-move">
                <canvas 
                  id="cropper-canvas"
                  width={256}
                  height={256}
                  className="w-full h-full"
                  onMouseDown={(e) => {
                    setIsDragging(true);
                    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
                  }}
                  onMouseMove={(e) => {
                    if (!isDragging) return;
                    setOffsetX(e.clientX - dragStart.x);
                    setOffsetY(e.clientY - dragStart.y);
                  }}
                  onMouseUp={() => setIsDragging(false)}
                  onMouseLeave={() => setIsDragging(false)}
                  onTouchStart={(e) => {
                    if (e.touches.length === 1) {
                      setIsDragging(true);
                      setDragStart({ x: e.touches[0].clientX - offsetX, y: e.touches[0].clientY - offsetY });
                    }
                  }}
                  onTouchMove={(e) => {
                    if (!isDragging || e.touches.length !== 1) return;
                    setOffsetX(e.touches[0].clientX - dragStart.x);
                    setOffsetY(e.touches[0].clientY - dragStart.y);
                  }}
                  onTouchEnd={() => setIsDragging(false)}
                />
                {/* Square crop guide overlay */}
                <div className="absolute inset-0 pointer-events-none border border-white/40 ring-1 ring-black/45 bg-black/10"></div>
              </div>
              
              {/* Zoom Slider */}
              <div className="w-full space-y-1">
                <div className="flex justify-between text-[10px] font-extrabold text-muted-foreground">
                  <span>Zoom Out</span>
                  <span>Zoom In</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="3" 
                  step="0.05"
                  value={zoom} 
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary" 
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => {
                  setCropImageSrc(null);
                  setCropTarget(null);
                }} 
                className="px-4 py-2 border border-input rounded-md text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => handleCropSave()} 
                className="px-5 py-2 bg-primary text-primary-foreground rounded-md text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm"
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
