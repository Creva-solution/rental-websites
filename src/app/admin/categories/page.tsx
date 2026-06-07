'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Trash2, Edit, FolderTree, Upload, Check, X, GripVertical } from 'lucide-react';

interface Category {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export default function CategoriesPage() {
  const [store, setStore] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    image_url: '',
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (!storeData) return;
      setStore(storeData);

      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', storeData.id)
        .order('sort_order', { ascending: true });

      setCategories(cats || []);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingCategory(null);
    setForm({ name: '', slug: '', image_url: '', sort_order: categories.length, is_active: true });
    setMessage('');
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      image_url: cat.image_url || '',
      sort_order: cat.sort_order,
      is_active: cat.is_active,
    });
    setMessage('');
    setShowModal(true);
  };

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setForm(f => ({ ...f, name, slug }));
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `category-images/${Math.random().toString(36).slice(2)}-${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage.from('assets').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(data.path);
      setForm(f => ({ ...f, image_url: publicUrl }));
    } catch (e: any) {
      setMessage('Image upload failed: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setMessage('Category name is required.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({ name: form.name, slug: form.slug, image_url: form.image_url, sort_order: form.sort_order, is_active: form.is_active })
          .eq('id', editingCategory.id);
        if (error) throw error;
        setMessage('Category updated successfully.');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([{ ...form, store_id: store.id }]);
        if (error) throw error;
        setMessage('Category created successfully.');
      }
      setShowModal(false);
      await fetchData();
    } catch (e: any) {
      setMessage('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (catId: string) => {
    if (!confirm('Delete this category? Products in this category will become uncategorized.')) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', catId);
      if (error) throw error;
      setMessage('Category deleted.');
      await fetchData();
    } catch (e: any) {
      setMessage('Error: ' + e.message);
    }
  };

  const toggleActive = async (cat: Category) => {
    try {
      await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
      await fetchData();
    } catch (e: any) {
      setMessage('Error: ' + e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-primary" />
            Categories
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Organize products into collections customers can browse.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Category
        </button>
      </div>

      {message && !showModal && (
        <div className={`text-sm px-4 py-3 rounded-xl border font-medium ${
          message.startsWith('Error') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
        }`}>
          {message}
        </div>
      )}

      {categories.length === 0 ? (
        <div className="bg-muted/30 border border-border rounded-2xl p-12 text-center">
          <FolderTree className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h3 className="font-bold text-lg mb-2">No categories yet</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Create categories to help customers navigate your store.
          </p>
          <button
            onClick={openCreate}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create First Category
          </button>
        </div>
      ) : (
        <div className="bg-background border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
              <GripVertical className="w-4 h-4 text-muted-foreground/40 cursor-grab flex-shrink-0" />
              {cat.image_url ? (
                <img src={cat.image_url} alt={cat.name} className="w-12 h-12 rounded-xl object-cover border border-border flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <FolderTree className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{cat.name}</p>
                <p className="text-xs text-muted-foreground font-mono truncate">/{cat.slug}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(cat)}
                  className={`text-xs px-3 py-1 rounded-full font-bold border transition-colors ${
                    cat.is_active
                      ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                      : 'bg-muted text-muted-foreground border-border hover:bg-muted/60'
                  }`}
                >
                  {cat.is_active ? 'Active' : 'Hidden'}
                </button>
                <button onClick={() => openEdit(cat)} className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors" title="Edit">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(cat.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg">{editingCategory ? 'Edit Category' : 'New Category'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-2">Category Image (optional)</label>
                <div className="flex items-center gap-3">
                  {form.image_url ? (
                    <img src={form.image_url} alt="" className="w-16 h-16 rounded-xl object-cover border border-border flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center border border-border flex-shrink-0">
                      <FolderTree className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <label className="flex-1 cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} />
                    <span className="flex items-center gap-2 text-sm border border-dashed border-border rounded-xl px-4 py-2.5 text-muted-foreground hover:text-foreground hover:border-primary transition-colors font-medium">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploading ? 'Uploading...' : 'Upload image'}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="e.g. Summer Collection"
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">URL Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                  placeholder="summer-collection"
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background font-mono"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Auto-generated from name. Used in store URL.</p>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">Display Order</label>
                <input
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background"
                />
              </div>

              <label className="flex items-center justify-between cursor-pointer bg-muted/30 rounded-xl px-4 py-3 border border-border">
                <div>
                  <p className="text-sm font-bold">Visible in storefront</p>
                  <p className="text-xs text-muted-foreground">Hidden categories won&apos;t appear to customers</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${form.is_active ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </label>
            </div>

            {message && (
              <p className={`text-xs font-medium ${message.startsWith('Error') ? 'text-destructive' : 'text-green-600'}`}>{message}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-bold hover:bg-muted transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? 'Saving...' : editingCategory ? 'Update' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
