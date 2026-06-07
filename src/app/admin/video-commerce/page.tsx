'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Video, Trash2, Tag, Sparkles, AlertCircle, Edit3, X, Check } from 'lucide-react';

interface VideoSession {
  id: string;
  store_id: string;
  title: string;
  video_url: string;
  product_ids: string[];
  created_at: string;
}

const normalizeVideoUrl = (url: string): string => {
  const u = url.trim();
  if (u.includes('youtu.be/')) {
    const id = u.split('youtu.be/')[1]?.split(/[?#]/)[0] || '';
    if (id) return `https://www.youtube.com/embed/${id}`;
  } else if (u.includes('youtube.com/shorts/')) {
    const id = u.split('shorts/')[1]?.split(/[?#]/)[0] || '';
    if (id) return `https://www.youtube.com/embed/${id}`;
  } else if (u.includes('youtube.com/watch')) {
    const id = new URLSearchParams(u.split('?')[1] || '').get('v') || '';
    if (id) return `https://www.youtube.com/embed/${id}`;
  }
  return u;
};

const emptyForm = { title: '', video_url: '', product_id: '' };

export default function VideoCommercePage() {
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [sessions, setSessions] = useState<VideoSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<VideoSession | null>(null);
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
      const { data: prodData } = await supabase.from('products').select('id,name,price').eq('store_id', storeData.id).order('name', { ascending: true });
      const { data: sessData } = await supabase.from('video_sessions').select('*').eq('store_id', storeData.id).order('created_at', { ascending: false });
      setProducts(prodData || []);
      setSessions(sessData || []);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingSession(null);
    setForm(emptyForm);
    setMessage('');
    setShowModal(true);
  };

  const openEdit = (session: VideoSession) => {
    setEditingSession(session);
    setForm({
      title: session.title,
      video_url: session.video_url,
      product_id: session.product_ids?.[0] || '',
    });
    setMessage('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setMessage('Title is required.'); return; }
    if (!form.video_url.trim()) { setMessage('Video URL is required.'); return; }
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        title: form.title.trim(),
        video_url: normalizeVideoUrl(form.video_url),
        product_ids: form.product_id ? [form.product_id] : [],
      };
      if (editingSession) {
        const { error } = await supabase.from('video_sessions').update(payload).eq('id', editingSession.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('video_sessions').insert([{ ...payload, store_id: store.id }]);
        if (error) throw error;
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
    if (!confirm('Remove this shoppable reel?')) return;
    try {
      await supabase.from('video_sessions').delete().eq('id', id);
      await fetchData();
    } catch (e: any) {
      setMessage('Error: ' + e.message);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Video Commerce
          </span>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Video className="w-6 h-6 text-primary" />
            Shoppable Reels
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Link YouTube Shorts or embed videos to products in your store.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          New Reel
        </button>
      </div>

      {message && !showModal && (
        <div className={`text-sm px-4 py-3 rounded-xl border font-medium ${message.startsWith('Error') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
          {message}
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="bg-muted/30 border border-border rounded-2xl p-12 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h3 className="font-bold text-lg mb-2">No shoppable reels yet</h3>
          <p className="text-muted-foreground text-sm mb-6">Add YouTube Shorts or embed videos and tag products to make your store interactive.</p>
          <button onClick={openCreate} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add First Reel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map(session => {
            const taggedProducts = products.filter(p => session.product_ids?.includes(p.id));
            return (
              <div key={session.id} className="bg-background border border-border rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all">
                <div className="aspect-[9/16] max-h-72 bg-black relative overflow-hidden">
                  <iframe
                    className="w-full h-full border-none"
                    src={session.video_url}
                    title={session.title}
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col gap-3">
                  <div>
                    <p className="font-bold text-sm truncate">{session.title}</p>
                    {taggedProducts.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {taggedProducts.map(p => (
                          <span key={p.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold">
                            <Tag className="w-2.5 h-2.5" />
                            {p.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border mt-auto">
                    <button onClick={() => openEdit(session)} className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(session.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-black text-lg">{editingSession ? 'Edit Reel' : 'New Shoppable Reel'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Summer Collection Showcase"
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">Video URL *</label>
                <input
                  type="text"
                  value={form.video_url}
                  onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
                  placeholder="YouTube Shorts, embed URL, or direct video link"
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background font-mono"
                />
                <p className="text-[10px] text-muted-foreground mt-1">YouTube watch/shorts links are automatically converted to embed format.</p>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">Tag Product (optional)</label>
                <select
                  value={form.product_id}
                  onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background"
                >
                  <option value="">— No product tagged —</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>
                  ))}
                </select>
                {products.length === 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1">Add products to your catalog first to tag them in reels.</p>
                )}
              </div>
              {message && <p className={`text-xs font-medium ${message.startsWith('Error') ? 'text-destructive' : 'text-green-600'}`}>{message}</p>}
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-bold hover:bg-muted transition-colors">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? 'Saving...' : editingSession ? 'Update Reel' : 'Publish Reel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
