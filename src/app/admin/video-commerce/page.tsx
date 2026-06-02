'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Video, Trash2, Tag, Sparkles, AlertCircle, Play } from 'lucide-react';

interface Reel {
  id: string;
  title: string;
  videoUrl: string;
  productId: string;
}

export default function VideoCommercePage() {
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New Reel Form
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [productId, setProductId] = useState('');

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
        
        // Fetch products to link to reels
        const { data: prodData } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', storeData.id);
        if (prodData) setProducts(prodData);

        // Fetch reels from description
        try {
          if (storeData.description && storeData.description.startsWith('{')) {
            const parsed = JSON.parse(storeData.description);
            if (parsed.videoReels && Array.isArray(parsed.videoReels)) {
              setReels(parsed.videoReels);
            }
          }
        } catch (e) {}
      }
    } catch (err) {
      console.error("Failed to load Shoppable Video settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const persistReels = async (updatedReels: Reel[]) => {
    setSaving(true);
    try {
      setReels(updatedReels);

      let currentDesc = {};
      try {
        if (store.description && store.description.startsWith('{')) {
          currentDesc = JSON.parse(store.description);
        }
      } catch (e) {}

      const updatedDesc = {
        ...currentDesc,
        videoReels: updatedReels
      };

      const { error } = await supabase
        .from('stores')
        .update({ description: JSON.stringify(updatedDesc) })
        .eq('id', store.id);

      if (error) throw error;
      setStore({ ...store, description: JSON.stringify(updatedDesc) });
    } catch (err: any) {
      console.error(err);
      alert("Failed to save reel: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateReel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim() || !productId) {
      alert("Please fill in all fields to create a reels channel!");
      return;
    }

    // Normalizing video url (e.g. YouTube watch -> embed or Instagram Reels urls)
    let finalVideoUrl = videoUrl.trim();
    if (finalVideoUrl.includes('youtube.com/watch') || finalVideoUrl.includes('youtu.be/')) {
      // standard watch link conversion helper
      try {
        let videoId = '';
        if (finalVideoUrl.includes('youtu.be/')) {
          videoId = finalVideoUrl.split('youtu.be/')[1]?.split(/[?#]/)[0] || '';
        } else {
          const urlParams = new URLSearchParams(finalVideoUrl.split('?')[1] || '');
          videoId = urlParams.get('v') || '';
        }
        if (videoId) {
          finalVideoUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      } catch (e) {}
    } else if (finalVideoUrl.includes('youtube.com/shorts/')) {
      try {
        const videoId = finalVideoUrl.split('shorts/')[1]?.split(/[?#]/)[0] || '';
        if (videoId) {
          finalVideoUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      } catch (e) {}
    }

    const newReel: Reel = {
      id: `reel_${Date.now()}`,
      title: title.trim(),
      videoUrl: finalVideoUrl,
      productId
    };

    const updated = [...reels, newReel];
    await persistReels(updated);

    // Reset Form
    setTitle('');
    setVideoUrl('');
    setProductId('');
    alert("🎉 Shoppable reel video linked successfully!");
  };

  const handleDeleteReel = async (id: string) => {
    if (!confirm("Are you sure you want to remove this shoppable reel?")) return;
    const updated = reels.filter(r => r.id !== id);
    await persistReels(updated);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-border/40">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <Sparkles className="w-3.5 h-3.5" /> Video Commerce Center
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-3">
            🎥 Video Commerce (Shoppable Reels)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Display beautiful vertical product reels (YouTube Shorts, Reels, or direct videos) tagged with active catalog products.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Create Reels Card */}
        <div className="bg-card text-card-foreground p-6 rounded-2xl border border-border/50 shadow-md space-y-4 h-fit">
          <div className="flex items-center gap-2 border-b pb-3">
            <Video className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Link Shoppable Reel</h3>
          </div>

          <form onSubmit={handleCreateReel} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Video Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Lavender Soap Making Process"
                className="w-full h-10 px-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Video Embed / Shorts URL</label>
              <input
                type="text"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="e.g. https://youtube.com/shorts/..."
                className="w-full h-10 px-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Tag Product Shown In Video</label>
              <select
                value={productId}
                onChange={e => setProductId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none text-xs cursor-pointer"
                required
              >
                <option value="">-- Select Product to Tag --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest rounded-xl hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Publish Reel Channel
            </button>
          </form>
        </div>

        {/* Right: Reels Channels Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card text-card-foreground rounded-2xl border border-border/50 shadow-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                Active Shoppable Reels
              </h3>
              <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-black font-mono">
                {reels.length} Active Reels
              </span>
            </div>

            {reels.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border/60 rounded-xl bg-muted/20 flex flex-col items-center justify-center text-muted-foreground">
                <AlertCircle className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-semibold">No Shoppable Reels configured yet.</p>
                <p className="text-xs">Publish YouTube Shorts or Reels to make your store interactive!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {reels.map((reel) => {
                  const taggedProd = products.find(p => p.id === reel.productId);
                  return (
                    <div key={reel.id} className="bg-muted/10 border border-border/60 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                      {/* Video Widescreen Embed container */}
                      <div className="aspect-[9/16] max-h-[320px] bg-black relative flex items-center justify-center overflow-hidden border-b border-border/40">
                        <iframe
                          className="w-full h-full border-none"
                          src={reel.videoUrl}
                          title={reel.title}
                          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>

                      {/* Info & Untagging Controls */}
                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-1 text-left">
                          <h4 className="font-bold text-xs truncate text-foreground">{reel.title}</h4>
                          {taggedProd && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-wider mt-1.5 shadow-sm">
                              <Tag className="w-3 h-3" />
                              Tagged: {taggedProd.name} (₹{taggedProd.price})
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end pt-3 border-t border-border/40 mt-2">
                          <button
                            onClick={() => handleDeleteReel(reel.id)}
                            disabled={saving}
                            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 hover:text-red-600 px-3 py-1.5 border border-transparent hover:border-red-200 rounded-xl transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove Reel
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
