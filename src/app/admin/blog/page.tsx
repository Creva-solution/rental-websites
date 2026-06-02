'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, FileText, Trash2, Edit3, Sparkles, Upload } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  createdAt: string;
}

export default function BlogPage() {
  const [store, setStore] = useState<any>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New Post Form States
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
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

        // Fetch posts from description metadata
        try {
          if (storeData.description && storeData.description.startsWith('{')) {
            const parsed = JSON.parse(storeData.description);
            if (parsed.blogPosts && Array.isArray(parsed.blogPosts)) {
              setPosts(parsed.blogPosts);
            }
          }
        } catch (e) {}
      }
    } catch (err) {
      console.error("Failed to load blog posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const persistPosts = async (updatedPosts: BlogPost[]) => {
    setSaving(true);
    try {
      setPosts(updatedPosts);

      let currentDesc = {};
      try {
        if (store.description && store.description.startsWith('{')) {
          currentDesc = JSON.parse(store.description);
        }
      } catch (e) {}

      const updatedDesc = {
        ...currentDesc,
        blogPosts: updatedPosts
      };

      const { error } = await supabase
        .from('stores')
        .update({ description: JSON.stringify(updatedDesc) })
        .eq('id', store.id);

      if (error) throw error;
      setStore({ ...store, description: JSON.stringify(updatedDesc) });
    } catch (err: any) {
      console.error(err);
      alert("Failed to save article: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("Please fill in a title and write some content first!");
      return;
    }

    const newPost: BlogPost = {
      id: `post_${Date.now()}`,
      title: title.trim(),
      excerpt: excerpt.trim() || `${content.substring(0, 100).trim()}...`,
      content: content.trim(),
      coverImage: coverImage.trim() || 'https://images.unsplash.com/photo-1607006342411-92fc0a4173d2?auto=format&fit=crop&q=80&w=600',
      createdAt: new Date().toISOString()
    };

    const updated = [newPost, ...posts];
    await persistPosts(updated);

    // Reset Form fields
    setTitle('');
    setExcerpt('');
    setContent('');
    setCoverImage('');
    alert("🎉 Article published successfully!");
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;
    const updated = posts.filter(p => p.id !== id);
    await persistPosts(updated);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-border/40">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <Sparkles className="w-3.5 h-3.5" /> Content Engine
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-3">
            📰 Brand Blog & Articles
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Write engaging storytelling posts, tutorials, and organic ingredient secrets to build brand authority and customer trust.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Compose Post Card */}
        <div className="lg:col-span-1 bg-card text-card-foreground p-6 rounded-2xl border border-border/50 shadow-md space-y-4 h-fit">
          <div className="flex items-center gap-2 border-b pb-3">
            <Edit3 className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Compose Article</h3>
          </div>

          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Article Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Benefits of Cold Processed Soaps"
                className="w-full h-10 px-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none text-xs font-semibold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Cover Image Link</label>
              <input
                type="text"
                value={coverImage}
                onChange={e => setCoverImage(e.target.value)}
                placeholder="e.g. https://images.unsplash.com/..."
                className="w-full h-10 px-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Short Excerpt (Summary)</label>
              <input
                type="text"
                value={excerpt}
                onChange={e => setExcerpt(e.target.value)}
                placeholder="Brief summary of the article..."
                className="w-full h-10 px-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Article Body Content *</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write your article storytelling and details here..."
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
              Publish Article
            </button>
          </form>
        </div>

        {/* Right: Published list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card text-card-foreground rounded-2xl border border-border/50 shadow-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Published Articles
              </h3>
              <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-black font-mono">
                {posts.length} Posts
              </span>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-xs italic">
                No blog posts written yet. Storytelling is the secret of branding, write your first post today!
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="p-4 border border-border/60 bg-muted/20 rounded-2xl flex flex-col md:flex-row gap-4 items-start shadow-sm group transition-all hover:bg-muted/30 text-left">
                    {/* Cover thumbnail */}
                    {post.coverImage && (
                      <div className="w-full md:w-32 aspect-video md:aspect-square rounded-xl overflow-hidden bg-muted border border-border/40 shrink-0">
                        <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    )}
                    
                    <div className="flex-1 space-y-2 text-left min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">{post.title}</h4>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          disabled={saving}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                          title="Delete article"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                        Published on {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {post.excerpt}
                      </p>
                    </div>
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
