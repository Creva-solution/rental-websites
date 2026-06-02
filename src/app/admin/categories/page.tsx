'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Trash2, FolderHeart, Sparkles, Tag, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CategoriesPage() {
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ old: string; new: string } | null>(null);

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
        
        // Fetch products to extract active categories dynamically
        const { data: prodData } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', storeData.id);

        if (prodData) {
          setProducts(prodData);
          
          // Generate unique categories set
          const uniqueCats = new Set<string>();
          // Default baseline categories
          uniqueCats.add('Essential Oils');
          uniqueCats.add('Handmade Soaps');
          uniqueCats.add('Herbal Cosmetics');
          uniqueCats.add('Wellness Packages');
          
          prodData.forEach((p: any) => {
            try {
              if (p.category) {
                uniqueCats.add(p.category);
              } else if (p.description && p.description.startsWith('{')) {
                const parsed = JSON.parse(p.description);
                if (parsed.category) uniqueCats.add(parsed.category);
              }
            } catch (e) {}
          });

          // Fetch explicit list if stored in store description
          try {
            if (storeData.description && storeData.description.startsWith('{')) {
              const parsedDesc = JSON.parse(storeData.description);
              if (parsedDesc.customCategories && Array.isArray(parsedDesc.customCategories)) {
                parsedDesc.customCategories.forEach((c: string) => uniqueCats.add(c));
              }
            }
          } catch (e) {}

          setCategories(Array.from(uniqueCats));
        }
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    const formattedCat = newCategoryName.trim();
    if (categories.includes(formattedCat)) {
      alert("⚠️ Category already exists!");
      return;
    }

    setSaving(true);
    try {
      const updatedCats = [...categories, formattedCat];
      setCategories(updatedCats);

      // Persist in store.description
      let currentDesc = {};
      try {
        if (store.description && store.description.startsWith('{')) {
          currentDesc = JSON.parse(store.description);
        }
      } catch (e) {}

      const updatedDesc = {
        ...currentDesc,
        customCategories: updatedCats
      };

      const { error } = await supabase
        .from('stores')
        .update({ description: JSON.stringify(updatedDesc) })
        .eq('id', store.id);

      if (error) throw error;
      setNewCategoryName('');
      alert("🎉 Category created successfully!");
    } catch (err: any) {
      console.error(err);
      alert("Failed to create category: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (categoryToDelete: string) => {
    const isAssigned = products.some(p => p.category === categoryToDelete);
    if (isAssigned) {
      alert("⚠️ Cannot delete this category because there are products currently assigned to it! Please change their categories first.");
      return;
    }

    if (!confirm(`Are you sure you want to delete "${categoryToDelete}"?`)) return;

    setSaving(true);
    try {
      const updatedCats = categories.filter(c => c !== categoryToDelete);
      setCategories(updatedCats);

      let currentDesc = {};
      try {
        if (store.description && store.description.startsWith('{')) {
          currentDesc = JSON.parse(store.description);
        }
      } catch (e) {}

      const updatedDesc = {
        ...currentDesc,
        customCategories: updatedCats
      };

      const { error } = await supabase
        .from('stores')
        .update({ description: JSON.stringify(updatedDesc) })
        .eq('id', store.id);

      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete category");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-border/40">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <Sparkles className="w-3.5 h-3.5" /> Product Management
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-3">
            🗂️ Product Categories
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Group your soap, cosmetics, and wellness catalogs into interactive categories for easy storefront navigation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Create Category Card */}
        <div className="bg-card text-card-foreground p-6 rounded-2xl border border-border/50 shadow-md space-y-4 h-fit">
          <div className="flex items-center gap-2 border-b pb-3">
            <Tag className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Create New Category</h3>
          </div>
          
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Category Name</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="e.g. Lavender Soaps"
                className="w-full h-10 px-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none text-xs font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest rounded-xl hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Create Category
            </button>
          </form>
        </div>

        {/* Right Side: Categories Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card text-card-foreground rounded-2xl border border-border/50 shadow-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                <FolderHeart className="w-4 h-4 text-pink-500" />
                Active Categories
              </h3>
              <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-black font-mono">
                {categories.length} Categories
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categories.map((cat, index) => {
                const count = products.filter(p => p.category === cat).length;
                return (
                  <div 
                    key={index} 
                    className="p-4 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-all flex items-center justify-between gap-3 shadow-inner group"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">{cat}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{count} {count === 1 ? 'Product' : 'Products'} active</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/admin/products?category=${encodeURIComponent(cat)}`}
                        className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-colors border border-transparent hover:border-primary/20"
                        title="View products"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        disabled={saving}
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-200"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
