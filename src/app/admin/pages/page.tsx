'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Layout, Trash2, Tag, Sparkles, SlidersHorizontal } from 'lucide-react';

interface CustomPage {
  slug: string;
  title: string;
  content: string;
  isActive: boolean;
}

export default function PagesManagerPage() {
  const [store, setStore] = useState<any>(null);
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New Page States
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
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

        // Fetch pages from description metadata
        try {
          if (storeData.description && storeData.description.startsWith('{')) {
            const parsed = JSON.parse(storeData.description);
            if (parsed.customPages && Array.isArray(parsed.customPages)) {
              setPages(parsed.customPages);
            }
          }
        } catch (e) {}
      }
    } catch (err) {
      console.error("Failed to load custom page configurations:", err);
    } finally {
      setLoading(false);
    }
  };

  const persistPages = async (updatedPages: CustomPage[]) => {
    setSaving(true);
    try {
      setPages(updatedPages);

      let currentDesc = {};
      try {
        if (store.description && store.description.startsWith('{')) {
          currentDesc = JSON.parse(store.description);
        }
      } catch (e) {}

      const updatedDesc = {
        ...currentDesc,
        customPages: updatedPages
      };

      const { error } = await supabase
        .from('stores')
        .update({ description: JSON.stringify(updatedDesc) })
        .eq('id', store.id);

      if (error) throw error;
      setStore({ ...store, description: JSON.stringify(updatedDesc) });
    } catch (err: any) {
      console.error(err);
      alert("Failed to save page: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedSlug = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').trim();
    if (!title.trim() || !formattedSlug) {
      alert("Please fill in a title and valid URL slug first!");
      return;
    }

    if (pages.some(p => p.slug === formattedSlug)) {
      alert("⚠️ A page with this URL slug already exists!");
      return;
    }

    const newPage: CustomPage = {
      slug: formattedSlug,
      title: title.trim(),
      content: content.trim(),
      isActive: true
    };

    const updated = [...pages, newPage];
    await persistPages(updated);

    // Reset fields
    setTitle('');
    setSlug('');
    setContent('');
    alert(`🎉 Custom page "${title}" created successfully!`);
  };

  const handleDeletePage = async (pageSlug: string) => {
    if (!confirm(`Are you sure you want to delete static page with slug "${pageSlug}"?`)) return;
    const updated = pages.filter(p => p.slug !== pageSlug);
    await persistPages(updated);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-border/40">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <Sparkles className="w-3.5 h-3.5" /> Pages Engine
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-3">
            📄 Custom Static Pages
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Publish custom standalone pages such as About Us, Frequently Asked Questions (FAQs), and store return policies.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Compose Custom Page Card */}
        <div className="bg-card text-card-foreground p-6 rounded-2xl border border-border/50 shadow-md space-y-4 h-fit">
          <div className="flex items-center gap-2 border-b pb-3">
            <Layout className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Create Custom Page</h3>
          </div>

          <form onSubmit={handleCreatePage} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Page Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  // Auto slug generation
                  setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                }}
                placeholder="e.g. Frequently Asked Questions"
                className="w-full h-10 px-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none text-xs font-semibold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">URL Path Slug *</label>
              <input
                type="text"
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="e.g. faq"
                className="w-full h-10 px-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Page Body HTML / Text Content *</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Enter rich text page content or HTML segments..."
                rows={8}
                className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none text-xs leading-relaxed resize-y min-h-[160px]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest rounded-xl hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Publish Static Page
            </button>
          </form>
        </div>

        {/* Right: Published list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card text-card-foreground rounded-2xl border border-border/50 shadow-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                Active Pages
              </h3>
              <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-black font-mono">
                {pages.length} Pages
              </span>
            </div>

            {pages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-xs italic">
                No custom sub-pages published yet. Custom pages will display links in your storefront footer!
              </div>
            ) : (
              <div className="space-y-4">
                {pages.map((p) => (
                  <div key={p.slug} className="p-4 border border-border/60 bg-muted/20 rounded-2xl flex items-center justify-between shadow-sm hover:bg-muted/30 transition-all text-left">
                    <div className="text-left space-y-1.5 min-w-0">
                      <h4 className="font-bold text-xs text-foreground">{p.title}</h4>
                      <div className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full text-[9px] font-mono">
                        URL Slug: /{p.slug}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeletePage(p.slug)}
                      disabled={saving}
                      className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors border border-transparent hover:border-red-200 shrink-0"
                      title="Delete page"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
