'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Layout, Trash2, Edit3, X, Check, Eye, EyeOff, GripVertical } from 'lucide-react';

interface Page {
  id: string;
  store_id: string;
  title: string;
  slug: string;
  content: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const emptyForm = {
  title: '',
  slug: '',
  content: '',
  is_active: true,
  sort_order: 0,
};

export default function PagesPage() {
  const [store, setStore] = useState<any>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: storeData } = await supabase.from('stores').select('*').eq('owner_id', user.id).maybeSingle();
      if (!storeData) return;
      setStore(storeData);
      const { data } = await supabase.from('pages').select('*').eq('store_id', storeData.id).order('sort_order', { ascending: true });
      setPages(data || []);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingPage(null);
    setForm({ ...emptyForm, sort_order: pages.length });
    setMessage('');
    setShowModal(true);
  };

  const openEdit = (page: Page) => {
    setEditingPage(page);
    setForm({
      title: page.title,
      slug: page.slug,
      content: page.content || '',
      is_active: page.is_active,
      sort_order: page.sort_order,
    });
    setMessage('');
    setShowModal(true);
  };

  const handleTitleChange = (title: string) => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setForm(f => ({ ...f, title, slug }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setMessage('Page title is required.'); return; }
    setSaving(true);
    setMessage('');
    try {
      if (editingPage) {
        const { error } = await supabase.from('pages').update({
          title: form.title, slug: form.slug, content: form.content,
          is_active: form.is_active, sort_order: form.sort_order,
        }).eq('id', editingPage.id);
        if (error) throw error;
        setMessage('Page updated.');
      } else {
        const { error } = await supabase.from('pages').insert([{ ...form, store_id: store.id }]);
        if (error) throw error;
        setMessage('Page created.');
      }
      setShowModal(false);
      await fetchData();
    } catch (e: any) {
      setMessage('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this page permanently?')) return;
    try {
      await supabase.from('pages').delete().eq('id', id);
      await fetchData();
    } catch (e: any) {
      setMessage('Error: ' + e.message);
    }
  };

  const toggleActive = async (page: Page) => {
    await supabase.from('pages').update({ is_active: !page.is_active }).eq('id', page.id);
    await fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Layout className="w-6 h-6 text-primary" />
            Content Pages
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Create pages like About Us, FAQ, Privacy Policy, and Terms.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          New Page
        </button>
      </div>

      {message && !showModal && (
        <div className={`text-sm px-4 py-3 rounded-xl border font-medium ${message.startsWith('Error') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
          {message}
        </div>
      )}

      {/* Quick Templates */}
      {pages.length === 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['About Us', 'FAQ', 'Privacy Policy', 'Return Policy'].map(title => (
            <button
              key={title}
              onClick={() => {
                setEditingPage(null);
                const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                setForm({ title, slug, content: `# ${title}\n\nWrite your ${title.toLowerCase()} content here.`, is_active: true, sort_order: pages.length });
                setMessage('');
                setShowModal(true);
              }}
              className="flex flex-col items-center gap-2 p-4 bg-muted/30 border border-border border-dashed rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-colors text-center"
            >
              <Layout className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs font-bold text-muted-foreground">{title}</span>
            </button>
          ))}
        </div>
      )}

      {pages.length === 0 ? (
        <div className="bg-muted/30 border border-border rounded-2xl p-12 text-center">
          <Layout className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h3 className="font-bold text-lg mb-2">No pages yet</h3>
          <p className="text-muted-foreground text-sm mb-6">Add informational pages like About Us, FAQ, or Privacy Policy.</p>
          <button onClick={openCreate} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create First Page
          </button>
        </div>
      ) : (
        <div className="bg-background border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {pages.map(page => (
            <div key={page.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
              <GripVertical className="w-4 h-4 text-muted-foreground/40 cursor-grab flex-shrink-0" />
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <Layout className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{page.title}</p>
                <p className="text-xs text-muted-foreground font-mono truncate">/{page.slug}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(page)}
                  className={`text-xs px-3 py-1 rounded-full font-bold border transition-colors flex items-center gap-1 ${
                    page.is_active
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {page.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {page.is_active ? 'Visible' : 'Hidden'}
                </button>
                <button onClick={() => openEdit(page)} className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(page.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
              <h3 className="font-black text-lg">{editingPage ? 'Edit Page' : 'New Page'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">Page Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="e.g. About Us"
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">URL Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">Page Content</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Write your page content here. HTML is supported."
                  rows={16}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background resize-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div className="flex items-end">
                  <label className="flex items-center justify-between w-full cursor-pointer bg-muted/30 rounded-xl px-4 py-2.5 border border-border">
                    <span className="text-sm font-bold">Visible</span>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                      className={`w-10 h-5.5 rounded-full transition-colors flex items-center px-0.5 ${form.is_active ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                    >
                      <div className={`w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-4.5' : 'translate-x-0'}`} />
                    </button>
                  </label>
                </div>
              </div>

              {message && <p className={`text-xs font-medium ${message.startsWith('Error') ? 'text-destructive' : 'text-green-600'}`}>{message}</p>}
            </div>

            <div className="flex gap-3 p-6 border-t border-border flex-shrink-0">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-bold hover:bg-muted transition-colors">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? 'Saving...' : editingPage ? 'Update Page' : 'Create Page'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
