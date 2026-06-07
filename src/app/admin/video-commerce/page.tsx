'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Video, Trash2, Tag, Sparkles, AlertCircle, Edit3, X, Check, Link2, Youtube, Instagram, ChevronLeft, ChevronRight } from 'lucide-react';

interface VideoItem {
  video_url: string;
  product_id: string;
}

interface VideoSession {
  id: string;
  store_id: string;
  title: string;
  video_url: string;       // backward compat: first video URL
  video_urls: string[];    // backward compat: all URLs
  video_items: VideoItem[]; // per-video product tagging
  product_ids: string[];   // backward compat: all product IDs
  created_at: string;
  updated_at?: string;
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
  } else if (u.includes('instagram.com/reel/') || u.includes('instagram.com/p/')) {
    const match = u.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/);
    if (match?.[1]) return `https://www.instagram.com/p/${match[1]}/embed/`;
  }
  return u;
};

const detectPlatform = (url: string) => {
  if (url.includes('youtube') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('instagram')) return 'instagram';
  return 'direct';
};

const PlatformBadge = ({ url }: { url: string }) => {
  const p = detectPlatform(url);
  if (p === 'youtube') return <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-full"><Youtube className="w-2.5 h-2.5" /> YouTube</span>;
  if (p === 'instagram') return <span className="inline-flex items-center gap-1 text-[9px] font-bold text-purple-600 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded-full"><Instagram className="w-2.5 h-2.5" /> Instagram</span>;
  return <span className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full"><Link2 className="w-2.5 h-2.5" /> Direct</span>;
};

const MAX_VIDEOS = 5;
const emptyItem: VideoItem = { video_url: '', product_id: '' };
const emptyForm = { title: '', video_items: [{ ...emptyItem }] };

export default function VideoCommercePage() {
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [sessions, setSessions] = useState<VideoSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<VideoSession | null>(null);
  const [form, setForm] = useState<{ title: string; video_items: VideoItem[] }>(emptyForm);
  const [previewIdx, setPreviewIdx] = useState<Record<string, number>>({});

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
      const storeDesc = (() => { try { return JSON.parse(storeData.description || '{}'); } catch { return {}; } })();
      setProducts(prodData || []);
      setSessions(storeDesc.video_sessions || []);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingSession(null);
    setForm({ title: '', video_items: [{ ...emptyItem }] });
    setMessage('');
    setShowModal(true);
  };

  const openEdit = (session: VideoSession) => {
    setEditingSession(session);
    // Prefer new video_items; fall back to old video_urls + product_ids
    let items: VideoItem[];
    if (session.video_items?.length) {
      items = session.video_items.map(vi => ({ video_url: vi.video_url, product_id: vi.product_id || '' }));
    } else {
      const urls = session.video_urls?.length ? session.video_urls : [session.video_url].filter(Boolean);
      items = urls.map((url, i) => ({
        video_url: url,
        product_id: session.product_ids?.[i] || session.product_ids?.[0] || '',
      }));
    }
    setForm({ title: session.title, video_items: items });
    setMessage('');
    setShowModal(true);
  };

  const updateItem = (idx: number, field: keyof VideoItem, val: string) => {
    setForm(f => {
      const items = f.video_items.map((item, i) => i === idx ? { ...item, [field]: val } : item);
      return { ...f, video_items: items };
    });
  };

  const addVideoSlot = () => {
    if (form.video_items.length >= MAX_VIDEOS) return;
    setForm(f => ({ ...f, video_items: [...f.video_items, { ...emptyItem }] }));
  };

  const removeVideoSlot = (idx: number) => {
    if (form.video_items.length <= 1) return;
    setForm(f => ({ ...f, video_items: f.video_items.filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setMessage('Title is required.'); return; }
    const validItems = form.video_items.filter(item => item.video_url.trim());
    if (validItems.length === 0) { setMessage('At least one video URL is required.'); return; }

    setSaving(true);
    setMessage('');
    try {
      const normalizedItems: VideoItem[] = validItems.map(item => ({
        video_url: normalizeVideoUrl(item.video_url.trim()),
        product_id: item.product_id,
      }));

      const payload = {
        title: form.title.trim(),
        video_url: normalizedItems[0].video_url,
        video_urls: normalizedItems.map(i => i.video_url),
        video_items: normalizedItems,
        product_ids: normalizedItems.map(i => i.product_id).filter(Boolean),
      };

      const { data: freshStore } = await supabase.from('stores').select('description').eq('id', store.id).maybeSingle();
      const desc = (() => { try { return JSON.parse(freshStore?.description || '{}'); } catch { return {}; } })();
      let currentSessions: VideoSession[] = desc.video_sessions || [];

      if (editingSession) {
        currentSessions = currentSessions.map((s: VideoSession) =>
          s.id === editingSession.id ? { ...s, ...payload, updated_at: new Date().toISOString() } : s
        );
      } else {
        currentSessions = [{
          id: 'vsn_' + Date.now(),
          store_id: store.id,
          ...payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, ...currentSessions];
      }

      const { error } = await supabase.from('stores').update({
        description: JSON.stringify({ ...desc, video_sessions: currentSessions }),
      }).eq('id', store.id);
      if (error) throw error;
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
      const { data: freshStore } = await supabase.from('stores').select('description').eq('id', store.id).maybeSingle();
      const desc = (() => { try { return JSON.parse(freshStore?.description || '{}'); } catch { return {}; } })();
      const updated = (desc.video_sessions || []).filter((s: VideoSession) => s.id !== id);
      await supabase.from('stores').update({
        description: JSON.stringify({ ...desc, video_sessions: updated }),
      }).eq('id', store.id);
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
          <p className="text-sm text-muted-foreground mt-1">Each video has its own tagged product. Up to 5 videos per reel.</p>
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
          <p className="text-muted-foreground text-sm mb-6">Add YouTube Shorts or Instagram Reels and tag a product to each video.</p>
          <button onClick={openCreate} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add First Reel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map(session => {
            // Normalise to video_items — support both old and new format
            const items: VideoItem[] = session.video_items?.length
              ? session.video_items
              : (session.video_urls?.length ? session.video_urls : [session.video_url].filter(Boolean))
                  .map((url: string, i: number) => ({ video_url: url, product_id: session.product_ids?.[i] || '' }));

            const idx = previewIdx[session.id] ?? 0;
            const activeItem = items[idx] || items[0];
            const activeProduct = products.find(p => p.id === activeItem?.product_id);

            return (
              <div key={session.id} className="bg-background border border-border rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all">
                {/* Video preview with carousel */}
                <div className="aspect-[9/16] max-h-72 bg-black relative overflow-hidden">
                  <iframe
                    key={activeItem?.video_url}
                    className="w-full h-full border-none"
                    src={activeItem?.video_url}
                    title={session.title}
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  {items.length > 1 && (
                    <>
                      <button
                        onClick={() => setPreviewIdx(p => ({ ...p, [session.id]: Math.max(0, (p[session.id] ?? 0) - 1) }))}
                        disabled={idx === 0}
                        className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center disabled:opacity-30 transition-colors"
                      ><ChevronLeft className="w-4 h-4" /></button>
                      <button
                        onClick={() => setPreviewIdx(p => ({ ...p, [session.id]: Math.min(items.length - 1, (p[session.id] ?? 0) + 1) }))}
                        disabled={idx === items.length - 1}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center disabled:opacity-30 transition-colors"
                      ><ChevronRight className="w-4 h-4" /></button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {items.map((_, i) => (
                          <button key={i} onClick={() => setPreviewIdx(p => ({ ...p, [session.id]: i }))}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white scale-125' : 'bg-white/50'}`}
                          />
                        ))}
                      </div>
                      <span className="absolute top-2 right-2 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {idx + 1}/{items.length}
                      </span>
                    </>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-bold text-sm truncate flex-1">{session.title}</p>
                      {items.length > 1 && (
                        <span className="shrink-0 text-[9px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">{items.length} videos</span>
                      )}
                    </div>
                    {/* Show product for the currently previewed video */}
                    {activeProduct ? (
                      <div className="flex items-center gap-1.5 bg-primary/5 border border-primary/15 rounded-lg px-2.5 py-1.5">
                        <Tag className="w-3 h-3 text-primary shrink-0" />
                        <span className="text-[11px] font-bold text-primary truncate">{activeProduct.name}</span>
                        {items.length > 1 && (
                          <span className="text-[9px] text-muted-foreground ml-auto shrink-0">Video {idx + 1}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">No product tagged for Video {idx + 1}</span>
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
          <div className="bg-background border border-border rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
              <h3 className="font-black text-lg">{editingSession ? 'Edit Reel' : 'New Shoppable Reel'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Title */}
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

              {/* Per-video items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Videos * <span className="normal-case font-normal text-muted-foreground/60">({form.video_items.length}/{MAX_VIDEOS})</span>
                  </label>
                </div>

                <div className="space-y-3">
                  {form.video_items.map((item, i) => (
                    <div key={i} className="border border-border rounded-xl p-3 space-y-2.5 bg-muted/20">
                      {/* Header row */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Video {i + 1}</span>
                        {form.video_items.length > 1 && (
                          <button
                            onClick={() => removeVideoSlot(i)}
                            className="p-1 text-muted-foreground hover:text-destructive hover:bg-red-50 rounded-md transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* URL input */}
                      <input
                        type="text"
                        value={item.video_url}
                        onChange={e => updateItem(i, 'video_url', e.target.value)}
                        placeholder="YouTube Shorts, Instagram Reel, or direct URL"
                        className="w-full border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background font-mono"
                      />
                      {item.video_url.trim() && <PlatformBadge url={item.video_url} />}

                      {/* Per-video product dropdown */}
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 mb-1">
                          <Tag className="w-3 h-3" /> Tag Product for Video {i + 1}
                        </label>
                        <select
                          value={item.product_id}
                          onChange={e => updateItem(i, 'product_id', e.target.value)}
                          className="w-full border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background"
                        >
                          <option value="">— No product —</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                {form.video_items.length < MAX_VIDEOS && (
                  <button
                    onClick={addVideoSlot}
                    className="mt-3 flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Another Video
                  </button>
                )}
                <p className="text-[10px] text-muted-foreground mt-2">YouTube Shorts/Watch/youtu.be and Instagram Reels are auto-converted to embed format.</p>
              </div>

              {message && <p className={`text-xs font-medium ${message.startsWith('Error') ? 'text-destructive' : 'text-green-600'}`}>{message}</p>}
            </div>

            <div className="flex gap-3 p-6 border-t border-border shrink-0">
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
