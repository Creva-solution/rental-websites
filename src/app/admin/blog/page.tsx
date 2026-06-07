'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, FileText, Trash2, Edit3, X, Check, Eye, EyeOff, Upload } from 'lucide-react';

interface BlogPost {
  id: string;
  store_id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  cover_image: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
}

const emptyForm = {
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  cover_image: '',
  status: 'draft' as 'draft' | 'published',
};

export default function BlogPage() {
  const [store, setStore] = useState<any>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [uploading, setUploading] = useState(false);
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
      const { data } = await supabase.from('blog_posts').select('*').eq('store_id', storeData.id).order('created_at', { ascending: false });
      setPosts(data || []);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingPost(null);
    setForm(emptyForm);
    setMessage('');
    setShowModal(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingPost(post);
    setForm({
      title: post.title,
      slug: post.slug,
      content: post.content || '',
      excerpt: post.excerpt || '',
      cover_image: post.cover_image || '',
      status: post.status,
    });
    setMessage('');
    setShowModal(true);
  };

  const handleTitleChange = (title: string) => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setForm(f => ({ ...f, title, slug }));
  };

  const uploadCover = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `blog-covers/${Math.random().toString(36).slice(2)}-${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage.from('assets').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(data.path);
      setForm(f => ({ ...f, cover_image: publicUrl }));
    } catch (e: any) {
      setMessage('Upload failed: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setMessage('Post title is required.'); return; }
    setSaving(true);
    setMessage('');
    try {
      if (editingPost) {
        const { error } = await supabase.from('blog_posts').update({
          title: form.title, slug: form.slug, content: form.content,
          excerpt: form.excerpt, cover_image: form.cover_image, status: form.status,
        }).eq('id', editingPost.id);
        if (error) throw error;
        setMessage('Post updated.');
      } else {
        const { error } = await supabase.from('blog_posts').insert([{ ...form, store_id: store.id }]);
        if (error) throw error;
        setMessage('Post created.');
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
    if (!confirm('Delete this post permanently?')) return;
    try {
      await supabase.from('blog_posts').delete().eq('id', id);
      await fetchData();
    } catch (e: any) {
      setMessage('Error: ' + e.message);
    }
  };

  const toggleStatus = async (post: BlogPost) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    await supabase.from('blog_posts').update({ status: newStatus }).eq('id', post.id);
    await fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Blog
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Write articles to attract customers and boost SEO.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </div>

      {message && !showModal && (
        <div className={`text-sm px-4 py-3 rounded-xl border font-medium ${message.startsWith('Error') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
          {message}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="bg-muted/30 border border-border rounded-2xl p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h3 className="font-bold text-lg mb-2">No blog posts yet</h3>
          <p className="text-muted-foreground text-sm mb-6">Start writing to grow your audience and improve SEO.</p>
          <button onClick={openCreate} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Write First Post
          </button>
        </div>
      ) : (
        <div className="bg-background border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {posts.map(post => (
            <div key={post.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
              {post.cover_image ? (
                <img src={post.cover_image} alt={post.title} className="w-16 h-12 rounded-xl object-cover border border-border flex-shrink-0" />
              ) : (
                <div className="w-16 h-12 rounded-xl bg-muted flex items-center justify-center border border-border flex-shrink-0">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{post.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {post.excerpt ? post.excerpt.substring(0, 80) + (post.excerpt.length > 80 ? '...' : '') : 'No excerpt'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1 font-mono">/{post.slug}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleStatus(post)}
                  className={`text-xs px-3 py-1 rounded-full font-bold border transition-colors flex items-center gap-1 ${
                    post.status === 'published'
                      ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                      : 'bg-muted text-muted-foreground border-border hover:bg-muted/60'
                  }`}
                >
                  {post.status === 'published' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {post.status === 'published' ? 'Published' : 'Draft'}
                </button>
                <button onClick={() => openEdit(post)} className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(post.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-red-50 rounded-lg transition-colors">
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
              <h3 className="font-black text-lg">{editingPost ? 'Edit Post' : 'New Blog Post'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Cover Image */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-2">Cover Image</label>
                {form.cover_image && <img src={form.cover_image} alt="" className="w-full h-36 object-cover rounded-xl border border-border mb-2" />}
                <label className="cursor-pointer block">
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadCover(e.target.files[0])} />
                  <span className="flex items-center gap-2 text-sm border border-dashed border-border rounded-xl px-4 py-3 text-muted-foreground hover:text-foreground hover:border-primary transition-colors font-medium justify-center">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? 'Uploading...' : form.cover_image ? 'Change cover image' : 'Upload cover image'}
                  </span>
                </label>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Your post title"
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background font-bold"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">URL Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background font-mono"
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">Excerpt</label>
                <textarea
                  value={form.excerpt}
                  onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                  placeholder="Short description shown in post listings..."
                  rows={2}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background resize-none"
                />
              </div>

              {/* Content */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">Content</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Write your blog post content here..."
                  rows={12}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background resize-none font-mono"
                />
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['draft', 'published'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, status: s }))}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all capitalize ${
                        form.status === s ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      {s === 'published' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {message && <p className={`text-xs font-medium ${message.startsWith('Error') ? 'text-destructive' : 'text-green-600'}`}>{message}</p>}
            </div>

            <div className="flex gap-3 p-6 border-t border-border flex-shrink-0">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-bold hover:bg-muted transition-colors">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? 'Saving...' : editingPost ? 'Update Post' : 'Create Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
