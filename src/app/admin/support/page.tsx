'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus, Search, Send, Paperclip, X, ChevronRight, Clock, CheckCircle2,
  AlertCircle, Circle, XCircle, Loader2, Upload, Image, FileText,
  Mic, Video, MessageSquare, Tag, Filter, RefreshCw, ArrowLeft
} from 'lucide-react';

const CATEGORIES = [
  { value: 'technical', label: 'Technical Issue' },
  { value: 'payment', label: 'Payment Issue' },
  { value: 'subscription', label: 'Subscription Issue' },
  { value: 'design', label: 'Store Design Issue' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'other', label: 'Other' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  open:                { label: 'Open',                 color: 'text-blue-600 bg-blue-50 border-blue-200',    icon: Circle },
  in_progress:         { label: 'In Progress',          color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Clock },
  waiting_for_customer:{ label: 'Waiting for You',     color: 'text-purple-600 bg-purple-50 border-purple-200', icon: AlertCircle },
  resolved:            { label: 'Resolved',             color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle2 },
  closed:              { label: 'Closed',               color: 'text-gray-500 bg-gray-100 border-gray-200',   icon: XCircle },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low:      { label: 'Low',      color: 'text-gray-600 bg-gray-100' },
  medium:   { label: 'Medium',   color: 'text-blue-600 bg-blue-50' },
  high:     { label: 'High',     color: 'text-orange-600 bg-orange-50' },
  critical: { label: 'Critical', color: 'text-red-600 bg-red-50' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
      <Icon className="w-2.5 h-2.5" /> {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

export default function AdminSupportPage() {
  const [store, setStore]     = useState<any>(null);
  const [user, setUser]       = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [reply, setReply] = useState('');
  const [attachments, setAttachments] = useState<{ name: string; url: string; type: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    subject: '', category: 'technical', message: '',
  });

  useEffect(() => { init(); }, []);
  useEffect(() => { if (selected) loadMessages(selected.id); }, [selected]);
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const init = async () => {
    setLoading(true);
    try {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return;
      setUser(u);
      const { data: s } = await supabase.from('stores').select('*').eq('owner_id', u.id).maybeSingle();
      setStore(s);
      await loadTickets(s?.id);
    } finally { setLoading(false); }
  };

  const loadTickets = async (storeId?: string) => {
    const id = storeId || store?.id;
    if (!id) return;
    const { data } = await supabase.from('support_tickets').select('*').eq('store_id', id);
    setTickets((data as any[]) || []);
  };

  const loadMessages = async (ticketId: string) => {
    const { data } = await supabase.from('support_messages').select('*').eq('ticket_id', ticketId);
    setMessages((data as any[]) || []);
  };

  const handleCreate = async () => {
    if (!form.subject.trim() || !form.message.trim()) return;
    setCreating(true);
    try {
      const { data } = await supabase.from('support_tickets').insert([{
        store_id: store.id,
        owner_id: user.id,
        owner_email: user.email,
        store_name: store.store_name,
        subject: form.subject.trim(),
        category: form.category,
        message: form.message.trim(),
        sender_name: store.store_name,
        attachments: [],
      }]).select().maybeSingle();
      setShowNew(false);
      setForm({ subject: '', category: 'technical', message: '' });
      await loadTickets();
      if (data) setSelected(data);
    } finally { setCreating(false); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const uploaded: { name: string; url: string; type: string }[] = [];
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>(res => { reader.onload = () => res(reader.result as string); reader.readAsDataURL(file); });
      try {
        const { data } = await supabase.storage.from('uploads').upload(`support/${Date.now()}_${file.name}`, dataUrl);
        if ((data as any)?.url) uploaded.push({ name: file.name, url: (data as any).url, type: file.type });
        else uploaded.push({ name: file.name, url: dataUrl, type: file.type });
      } catch {
        uploaded.push({ name: file.name, url: dataUrl, type: file.type });
      }
    }
    setAttachments(prev => [...prev, ...uploaded]);
    setUploading(false);
    e.target.value = '';
  };

  const handleSendReply = async () => {
    if (!reply.trim() && attachments.length === 0) return;
    if (!selected) return;
    setSending(true);
    try {
      await supabase.from('support_messages').insert([{
        ticket_id: selected.id,
        sender_id: user.id,
        sender_role: 'owner',
        sender_name: store.store_name,
        message: reply.trim(),
        attachments,
      }]);
      setReply('');
      setAttachments([]);
      await loadMessages(selected.id);
      await loadTickets();
    } finally { setSending(false); }
  };

  const filtered = tickets.filter(t => {
    const matchSearch = !search || t.subject?.toLowerCase().includes(search.toLowerCase()) || t.ticket_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">

      {/* ── Page Header ── */}
      <div className="px-6 py-5 border-b border-border bg-background flex items-start justify-between shrink-0">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit mb-2">
            <MessageSquare className="w-3.5 h-3.5" /> Support Center
          </span>
          <h2 className="text-2xl font-black tracking-tight">Help & Support</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Our team responds within <span className="font-bold text-foreground">24 hours</span>.</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      {/* ── Main Layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Ticket List Panel ── */}
        <div className={`w-full md:w-80 border-r border-border flex flex-col bg-background shrink-0 ${selected ? 'hidden md:flex' : 'flex'}`}>

          {/* Search + Filter */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search tickets…"
                className="w-full pl-8 pr-3 py-2 text-xs border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {['all', 'open', 'in_progress', 'resolved', 'closed'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-colors ${statusFilter === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:border-primary/50'}`}
                >
                  {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label || s}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No tickets yet</p>
                <p className="text-xs mt-1">Create your first support ticket.</p>
              </div>
            ) : filtered.map(t => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className={`w-full text-left px-4 py-3.5 hover:bg-muted/40 transition-colors ${selected?.id === t.id ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-[10px] font-black text-muted-foreground">{t.ticket_number}</span>
                  <StatusBadge status={t.status} />
                </div>
                <p className="text-xs font-bold text-foreground truncate">{t.subject}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[9px] text-muted-foreground">{CATEGORIES.find(c => c.value === t.category)?.label || t.category}</span>
                  <PriorityBadge priority={t.priority} />
                </div>
                <p className="text-[9px] text-muted-foreground mt-1">{new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </button>
            ))}
          </div>

          {/* Refresh */}
          <div className="p-3 border-t border-border">
            <button onClick={() => loadTickets()} className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>

        {/* ── Ticket Detail / Chat Panel ── */}
        <div className={`flex-1 flex flex-col bg-muted/10 ${selected ? 'flex' : 'hidden md:flex'}`}>
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <MessageSquare className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">Select a ticket to view conversation</p>
              <button onClick={() => setShowNew(true)} className="text-xs font-bold text-primary hover:underline">or create a new ticket</button>
            </div>
          ) : (
            <>
              {/* Ticket Header */}
              <div className="px-5 py-4 border-b border-border bg-background shrink-0">
                <div className="flex items-start gap-3">
                  <button className="md:hidden p-1.5 hover:bg-muted rounded-lg" onClick={() => setSelected(null)}>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black text-muted-foreground">{selected.ticket_number}</span>
                      <StatusBadge status={selected.status} />
                      <PriorityBadge priority={selected.priority} />
                    </div>
                    <h3 className="text-sm font-black mt-1 truncate">{selected.subject}</h3>
                    <p className="text-[10px] text-muted-foreground">{CATEGORIES.find(c => c.value === selected.category)?.label} · Opened {new Date(selected.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>

                {/* Response promise */}
                <div className="mt-3 flex items-center gap-2 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <Clock className="w-3 h-3 shrink-0" />
                  Our support team will review and respond within <strong>24 hours</strong>.
                </div>
              </div>

              {/* Message Thread */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {messages.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-8">No messages yet. Start the conversation below.</p>
                )}
                {messages.map(msg => {
                  const isOwner = msg.sender_role === 'owner';
                  const atts: any[] = (() => { try { return JSON.parse(msg.attachments || '[]'); } catch { return []; } })();
                  return (
                    <div key={msg.id} className={`flex ${isOwner ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isOwner ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-background border border-border rounded-tl-sm'}`}>
                        <p className={`text-[10px] font-bold mb-1 ${isOwner ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {isOwner ? 'You' : '🛡 Creva Support'}
                        </p>
                        {msg.message && <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.message}</p>}
                        {atts.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {atts.map((att: any, i: number) => (
                              <a key={i} href={att.url} target="_blank" rel="noopener noreferrer"
                                className={`flex items-center gap-1.5 text-[10px] font-bold underline ${isOwner ? 'text-primary-foreground/80' : 'text-primary'}`}>
                                {att.type?.startsWith('image') ? <Image className="w-3 h-3" /> : att.type?.startsWith('audio') ? <Mic className="w-3 h-3" /> : att.type?.startsWith('video') ? <Video className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                {att.name}
                              </a>
                            ))}
                          </div>
                        )}
                        <p className={`text-[9px] mt-1 ${isOwner ? 'text-primary-foreground/50' : 'text-muted-foreground'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={msgEndRef} />
              </div>

              {/* Reply Box */}
              {selected.status !== 'closed' && (
                <div className="px-5 py-4 border-t border-border bg-background shrink-0">
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {attachments.map((att, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-muted rounded-lg px-2 py-1 text-[10px] font-bold">
                          <FileText className="w-3 h-3" /> {att.name}
                          <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="ml-1 text-muted-foreground hover:text-destructive">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <textarea
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSendReply(); }}
                      placeholder="Type your message… (Ctrl+Enter to send)"
                      rows={3}
                      className="flex-1 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none bg-background"
                    />
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="w-9 h-9 flex items-center justify-center border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                        title="Attach file (image, voice, video, doc)"
                      >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={handleSendReply}
                        disabled={sending || (!reply.trim() && attachments.length === 0)}
                        className="w-9 h-9 flex items-center justify-center bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
                      >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-1.5">Attach screenshots, images, voice notes, screen recordings, or files.</p>
                  <input ref={fileRef} type="file" multiple accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt" className="hidden" onChange={handleUpload} />
                </div>
              )}
              {selected.status === 'closed' && (
                <div className="px-5 py-4 border-t border-border text-center text-xs text-muted-foreground bg-background">
                  This ticket is closed. <button onClick={() => setShowNew(true)} className="text-primary font-bold hover:underline">Open a new ticket</button> if you need more help.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── New Ticket Modal ── */}
      {showNew && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
              <div>
                <h3 className="font-black text-lg">Create Support Ticket</h3>
                <p className="text-xs text-muted-foreground mt-0.5">We respond within 24 hours.</p>
              </div>
              <button onClick={() => setShowNew(false)} className="p-1.5 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Subject */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">Subject *</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Brief description of your issue"
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">Category *</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setForm(f => ({ ...f, category: c.value }))}
                      className={`text-xs font-bold px-3 py-2 rounded-lg border text-left transition-colors ${form.category === c.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">Describe your issue *</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Describe the problem in detail. Include steps to reproduce, error messages, or any relevant information…"
                  rows={5}
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background resize-none"
                />
              </div>

              {/* Attachment types info */}
              <div className="bg-muted/40 rounded-xl p-3">
                <p className="text-[10px] font-bold text-muted-foreground mb-2">After creating the ticket you can attach:</p>
                <div className="flex flex-wrap gap-2">
                  {[['🖼', 'Screenshots'], ['🎙', 'Voice Notes'], ['📹', 'Screen Recordings'], ['📄', 'Documents']].map(([icon, label]) => (
                    <span key={label} className="text-[10px] font-bold bg-background border border-border rounded-full px-2 py-1">{icon} {label}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-border shrink-0">
              <button onClick={() => setShowNew(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-bold hover:bg-muted transition-colors">Cancel</button>
              <button
                onClick={handleCreate}
                disabled={creating || !form.subject.trim() || !form.message.trim()}
                className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creating ? 'Creating…' : 'Submit Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
