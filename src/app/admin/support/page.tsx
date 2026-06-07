'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus, Search, Send, X, Clock, CheckCircle2,
  AlertCircle, Circle, XCircle, Loader2, Image, FileText,
  Mic, MicOff, Video, MessageSquare, RefreshCw, ArrowLeft, Play, Bell, Square
} from 'lucide-react';

// ─── API helper — routes through Next.js proxy to avoid CORS ─────────────────
// /api/backend/* is served by the same Next.js origin (no browser CORS),
// then proxied server-side to rentalwebsite-backend-vn40.onrender.com
const API = '/api/backend';

async function apiCall(path: string, opts: RequestInit = {}) {
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('creva_token') || localStorage.getItem('mock_supabase_token'))
    : null;
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000); // 30s timeout
  try {
    const res = await fetch(`${API}${path}`, { ...opts, headers, signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (e: any) {
    clearTimeout(timer);
    if (e.name === 'AbortError') throw new Error('Request timed out. The server may be starting up — please try again in a moment.');
    throw e;
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'technical',    label: 'Technical Issue' },
  { value: 'payment',     label: 'Payment Issue' },
  { value: 'subscription',label: 'Subscription Issue' },
  { value: 'design',      label: 'Store Design Issue' },
  { value: 'feature',     label: 'Feature Request' },
  { value: 'other',       label: 'Other' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  open:                 { label: 'Open',            color: 'text-blue-600 bg-blue-50 border-blue-200',       icon: Circle },
  in_progress:          { label: 'In Progress',     color: 'text-amber-600 bg-amber-50 border-amber-200',    icon: Clock },
  waiting_for_customer: { label: 'Waiting for You', color: 'text-purple-600 bg-purple-50 border-purple-200', icon: AlertCircle },
  resolved:             { label: 'Resolved',        color: 'text-green-600 bg-green-50 border-green-200',    icon: CheckCircle2 },
  closed:               { label: 'Closed',          color: 'text-gray-500 bg-gray-100 border-gray-200',      icon: XCircle },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low:      { label: 'Low',      color: 'text-gray-600 bg-gray-100' },
  medium:   { label: 'Medium',   color: 'text-blue-600 bg-blue-50' },
  high:     { label: 'High',     color: 'text-orange-600 bg-orange-50' },
  critical: { label: 'Critical', color: 'text-red-600 bg-red-50' },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ATTACHMENT_TYPES = {
  screenshot: {
    label: 'Screenshots',
    accept: '.png,.jpg,.jpeg,.webp',
    mimes: ['image/png', 'image/jpeg', 'image/webp', 'image/jpg'] as string[],
    desc: 'PNG, JPG, JPEG, WEBP — max 10 MB',
    icon: Image,
    color: 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100',
  },
  voice: {
    label: 'Voice Notes',
    accept: '.mp3,.wav,.m4a,.ogg',
    mimes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aac'] as string[],
    desc: 'MP3, WAV, M4A, OGG — max 10 MB',
    icon: Mic,
    color: 'text-purple-700 border-purple-200 bg-purple-50 hover:bg-purple-100',
  },
  video: {
    label: 'Screen Recordings',
    accept: '.mp4,.webm,.mov',
    mimes: ['video/mp4', 'video/webm', 'video/quicktime'] as string[],
    desc: 'MP4, WEBM, MOV — max 10 MB',
    icon: Video,
    color: 'text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100',
  },
  doc: {
    label: 'Documents',
    accept: '.pdf,.doc,.docx,.txt',
    mimes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'] as string[],
    desc: 'PDF, DOC, DOCX, TXT — max 10 MB',
    icon: FileText,
    color: 'text-orange-700 border-orange-200 bg-orange-50 hover:bg-orange-100',
  },
} as const;

type AttachmentCategory = keyof typeof ATTACHMENT_TYPES;
interface Attachment { name: string; url: string; type: string }

// ─── Sub-components ───────────────────────────────────────────────────────────

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

/** Renders an attachment inline inside a message bubble */
function AttachmentRenderer({ att, isOwner }: { att: Attachment; isOwner: boolean }) {
  const linkCls = `flex items-center gap-1.5 text-[10px] font-bold underline mt-1.5 ${isOwner ? 'text-primary-foreground/80' : 'text-primary'}`;
  if (att.type?.startsWith('image/')) {
    return (
      <a href={att.url} target="_blank" rel="noopener noreferrer" className="mt-1.5 block">
        <img src={att.url} alt={att.name} className="max-w-full rounded-xl max-h-56 object-cover border border-white/15 shadow-sm" />
        <span className={`text-[9px] mt-0.5 block ${isOwner ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{att.name}</span>
      </a>
    );
  }
  if (att.type?.startsWith('audio/')) {
    return (
      <div className="mt-1.5">
        <p className={`text-[9px] mb-0.5 flex items-center gap-1 ${isOwner ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          <Mic className="w-3 h-3" /> {att.name}
        </p>
        <audio controls src={att.url} style={{ height: 32, maxWidth: 260 }} className="w-full" />
      </div>
    );
  }
  if (att.type?.startsWith('video/')) {
    return (
      <div className="mt-1.5">
        <video controls src={att.url} className="rounded-xl max-h-48 w-full max-w-xs border border-white/15" />
        <span className={`text-[9px] mt-0.5 block ${isOwner ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{att.name}</span>
      </div>
    );
  }
  return (
    <a href={att.url} target="_blank" rel="noopener noreferrer" className={linkCls}>
      <FileText className="w-3 h-3 shrink-0" /> {att.name}
    </a>
  );
}

/** Chip preview shown in the reply box before sending */
function AttachmentPreview({ att, onRemove }: { att: Attachment; onRemove: () => void }) {
  if (att.type?.startsWith('image/')) {
    return (
      <div className="relative group shrink-0">
        <img src={att.url} alt={att.name} className="h-16 w-16 object-cover rounded-lg border border-border shadow-sm" />
        <button onClick={onRemove} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
          <X className="w-3 h-3" />
        </button>
        <p className="text-[8px] text-center text-muted-foreground mt-0.5 truncate w-16">{att.name}</p>
      </div>
    );
  }
  if (att.type?.startsWith('audio/')) {
    return (
      <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 max-w-[240px] shrink-0">
        <Mic className="w-4 h-4 text-purple-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-purple-700 truncate">{att.name}</p>
          <audio controls src={att.url} style={{ height: 24 }} className="w-full mt-0.5" />
        </div>
        <button onClick={onRemove} className="text-purple-400 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
      </div>
    );
  }
  if (att.type?.startsWith('video/')) {
    return (
      <div className="relative group shrink-0">
        <video src={att.url} className="h-16 w-24 object-cover rounded-lg border border-border shadow-sm" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 rounded-lg pointer-events-none">
          <Play className="w-5 h-5 text-white drop-shadow" />
        </div>
        <button onClick={onRemove} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
          <X className="w-3 h-3" />
        </button>
        <p className="text-[8px] text-center text-muted-foreground mt-0.5 truncate w-24">{att.name}</p>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 max-w-[200px] shrink-0">
      <FileText className="w-4 h-4 text-orange-500 shrink-0" />
      <p className="text-[10px] font-bold text-orange-700 truncate flex-1">{att.name}</p>
      <button onClick={onRemove} className="text-orange-400 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

// ─── Voice Recorder Component ──────────────────────────────────────────────────
function VoiceRecorder({ onRecorded, disabled }: { onRecorded: (att: Attachment) => void; disabled?: boolean }) {
  const [state, setState] = useState<'idle' | 'recording' | 'preview'>('idle');
  const [secs, setSecs] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setState('preview');
      };
      mr.start();
      mediaRef.current = mr;
      setSecs(0);
      setState('recording');
      timerRef.current = setInterval(() => setSecs(s => s + 1), 1000);
    } catch (e) {
      alert('Microphone access denied. Please allow microphone in browser settings.');
    }
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRef.current?.stop();
    mediaRef.current = null;
  };

  const discard = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setSecs(0);
    setState('idle');
  };

  const attach = async () => {
    if (!audioUrl) return;
    const name = `voice_note_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.webm`;
    // Convert blob URL → base64 data URL so recipients can play it cross-browser
    try {
      const res = await fetch(audioUrl);
      const blob = await res.blob();
      const dataUrl = await new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      onRecorded({ name, url: dataUrl, type: 'audio/webm' });
    } catch {
      onRecorded({ name, url: audioUrl, type: 'audio/webm' });
    }
    URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setSecs(0);
    setState('idle');
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (state === 'idle') return (
    <button
      type="button"
      onClick={start}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full border transition-colors select-none cursor-pointer text-purple-700 border-purple-200 bg-purple-50 hover:bg-purple-100 disabled:opacity-50"
    >
      <Mic className="w-3.5 h-3.5" /> Voice Notes
    </button>
  );

  if (state === 'recording') return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-300 bg-red-50">
      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      <span className="text-[10px] font-bold text-red-700">{fmt(secs)}</span>
      <button
        type="button"
        onClick={stop}
        className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 hover:text-red-900 transition-colors"
      >
        <Square className="w-3 h-3 fill-current" /> Stop
      </button>
    </div>
  );

  return (
    <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 max-w-xs">
      <Mic className="w-4 h-4 text-purple-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-purple-700">{fmt(secs)} recorded</p>
        {audioUrl && <audio controls src={audioUrl} style={{ height: 24 }} className="w-full mt-0.5" />}
      </div>
      <button type="button" onClick={attach} className="text-[9px] font-black text-purple-700 bg-purple-200 hover:bg-purple-300 px-2 py-1 rounded-lg transition-colors shrink-0">Use</button>
      <button type="button" onClick={discard} className="text-purple-400 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminSupportPage() {
  const [store, setStore]           = useState<any>(null);
  const [user, setUser]             = useState<any>(null);
  const [tickets, setTickets]       = useState<any[]>([]);
  const [selected, setSelected]     = useState<any>(null);
  const [messages, setMessages]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [sending, setSending]       = useState(false);
  const [creating, setCreating]     = useState(false);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNew, setShowNew]       = useState(false);
  const [successTicket, setSuccessTicket] = useState<any>(null);
  const [reply, setReply]           = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  // New-ticket modal attachments
  const [newTicketAttachments, setNewTicketAttachments] = useState<Attachment[]>([]);
  const [newTicketUploading, setNewTicketUploading] = useState(false);
  const [newTicketUploadError, setNewTicketUploadError] = useState<string | null>(null);
  const [newTicketError, setNewTicketError] = useState<string | null>(null);

  const msgEndRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({ subject: '', category: 'technical', message: '' });

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
      if (s?.id) {
        await loadTickets(s.id);
        loadOwnerNotifications(s.id);
      }
    } finally { setLoading(false); }
  };

  const loadTickets = async (storeId?: string) => {
    const id = storeId || store?.id;
    if (!id) return;
    const data = await apiCall(`/support-tickets?store_id=${encodeURIComponent(id)}`).catch(() => []);
    setTickets(Array.isArray(data) ? data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : []);
  };

  const loadMessages = async (ticketId: string) => {
    const data = await apiCall(`/support-tickets/${ticketId}`).catch(() => ({ messages: [] }));
    setMessages(data.messages || []);
  };

  const loadOwnerNotifications = async (storeId: string) => {
    const data = await apiCall(`/notifications?for_role=owner&store_id=${encodeURIComponent(storeId)}`).catch(() => []);
    setNotifications(Array.isArray(data) ? data : []);
  };

  const markNotifRead = async (id: string) => {
    await apiCall(`/notifications/${id}`, { method: 'PATCH' }).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllNotifsRead = async () => {
    if (!store?.id) return;
    await apiCall('/notifications/all', { method: 'DELETE', body: JSON.stringify({ for_role: 'owner' }) }).catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleNewTicketUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: AttachmentCategory) => {
    const files = e.target.files;
    if (!files?.length) return;
    setNewTicketUploadError(null);
    setNewTicketUploading(true);
    const cfg = ATTACHMENT_TYPES[category];
    const uploaded: Attachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) { setNewTicketUploadError(`"${file.name}" exceeds 10 MB.`); continue; }
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const acceptedExts = cfg.accept.replace(/\./g, '').split(',');
      if (!cfg.mimes.includes(file.type) && !acceptedExts.includes(ext)) { setNewTicketUploadError(`"${file.name}" not allowed. Accepted: ${cfg.desc}`); continue; }
      const reader = new FileReader();
      const dataUrl = await new Promise<string>(res => { reader.onload = () => res(reader.result as string); reader.readAsDataURL(file); });
      uploaded.push({ name: file.name, url: dataUrl, type: file.type });
    }
    setNewTicketAttachments(prev => [...prev, ...uploaded]);
    setNewTicketUploading(false);
    e.target.value = '';
  };

  const handleCreate = async () => {
    if (!form.subject.trim() || !form.message.trim()) return;
    setCreating(true);
    setNewTicketError(null);
    try {
      const ticket = await apiCall('/support-tickets', {
        method: 'POST',
        body: JSON.stringify({
          store_id: store?.id,
          owner_id: user?.id,
          owner_email: user?.email,
          store_name: store?.store_name,
          subject: form.subject.trim(),
          category: form.category,
          message: form.message.trim(),
          sender_name: store?.store_name || user?.email,
          attachments: newTicketAttachments,
        }),
      });
      setShowNew(false);
      setForm({ subject: '', category: 'technical', message: '' });
      setNewTicketAttachments([]);
      setNewTicketUploadError(null);
      setSuccessTicket(ticket);
      await loadTickets();
    } catch (err: any) {
      console.error('Failed to create ticket:', err);
      setNewTicketError(err.message || 'Failed to submit ticket. Please try again.');
    } finally { setCreating(false); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: AttachmentCategory) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadError(null);
    setUploading(true);
    const cfg = ATTACHMENT_TYPES[category];
    const uploaded: Attachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`"${file.name}" exceeds the 10 MB limit.`);
        continue;
      }
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const acceptedExts = cfg.accept.replace(/\./g, '').split(',');
      if (!cfg.mimes.includes(file.type) && !acceptedExts.includes(ext)) {
        setUploadError(`"${file.name}" is not allowed. Accepted: ${cfg.desc}`);
        continue;
      }
      const reader = new FileReader();
      const dataUrl = await new Promise<string>(res => {
        reader.onload = () => res(reader.result as string);
        reader.readAsDataURL(file);
      });
      // Try backend storage upload; fall back to data URL so preview still shows
      try {
        const { data } = await supabase.storage.from('uploads').upload(`support/${Date.now()}_${file.name}`, dataUrl);
        uploaded.push({ name: file.name, url: (data as any)?.url || dataUrl, type: file.type });
      } catch {
        uploaded.push({ name: file.name, url: dataUrl, type: file.type });
      }
    }
    setAttachments(prev => [...prev, ...uploaded]);
    setUploading(false);
    e.target.value = '';
  };

  const removeAttachment = (i: number) =>
    setAttachments(prev => prev.filter((_, idx) => idx !== i));

  const handleSendReply = async () => {
    if (!reply.trim() && attachments.length === 0) return;
    if (!selected) return;
    setSending(true);
    try {
      await apiCall(`/support-tickets/${selected.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          sender_id: user.id,
          sender_role: 'owner',
          sender_name: store.store_name || user.email,
          message: reply.trim(),
          attachments,
        }),
      });
      setReply('');
      setAttachments([]);
      setUploadError(null);
      await loadMessages(selected.id);
      await loadTickets();
    } catch (err: any) {
      console.error('Failed to send reply:', err);
    } finally { setSending(false); }
  };

  const filtered = tickets.filter(t => {
    const matchSearch = !search ||
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.ticket_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-7 h-7 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">

      {/* Page Header */}
      <div className="px-6 py-5 border-b border-border bg-background flex items-start justify-between shrink-0">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit mb-2">
            <MessageSquare className="w-3.5 h-3.5" /> Support Center
          </span>
          <h2 className="text-2xl font-black tracking-tight">Help & Support</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Our team responds within <span className="font-bold text-foreground">24 hours</span>.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(v => !v)}
              className="relative p-2 border border-border rounded-xl hover:bg-muted transition-colors"
            >
              <Bell className="w-4 h-4 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-background border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <span className="text-xs font-black uppercase tracking-wider text-primary">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllNotifsRead} className="text-[10px] font-bold text-muted-foreground hover:text-foreground">Mark all read</button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-border">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-xs text-muted-foreground text-center">No notifications yet</p>
                  ) : notifications.map(n => (
                    <button
                      key={n.id}
                      onClick={() => markNotifRead(n.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}
                    >
                      <p className={`text-xs font-bold ${!n.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                      {n.body && <p className="text-[10px] text-muted-foreground mt-0.5">{n.body}</p>}
                      <p className="text-[9px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => { setShowNew(true); setNewTicketError(null); setNewTicketAttachments([]); setNewTicketUploadError(null); }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> New Ticket
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Ticket List Panel */}
        <div className={`w-full md:w-80 border-r border-border flex flex-col bg-background shrink-0 ${selected ? 'hidden md:flex' : 'flex'}`}>
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

          <div className="p-3 border-t border-border">
            <button onClick={() => loadTickets()} className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>

        {/* Ticket Detail / Chat Panel */}
        <div className={`flex-1 flex flex-col bg-muted/10 ${selected ? 'flex' : 'hidden md:flex'}`}>
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <MessageSquare className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">Select a ticket to view conversation</p>
              <button onClick={() => { setShowNew(true); setNewTicketError(null); setNewTicketAttachments([]); }} className="text-xs font-bold text-primary hover:underline">or create a new ticket</button>
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
                    <p className="text-[10px] text-muted-foreground">
                      {CATEGORIES.find(c => c.value === selected.category)?.label} · Opened {new Date(selected.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <Clock className="w-3 h-3 shrink-0" />
                  Our support team will review and respond within <strong className="ml-0.5">24 hours</strong>.
                </div>
              </div>

              {/* Message Thread */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {messages.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-8">No messages yet. Start the conversation below.</p>
                )}
                {messages.map(msg => {
                  const isOwner = msg.sender_role === 'owner';
                  const atts: Attachment[] = (() => { try { return JSON.parse(msg.attachments || '[]'); } catch { return []; } })();
                  return (
                    <div key={msg.id} className={`flex ${isOwner ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isOwner ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-background border border-border rounded-tl-sm'}`}>
                        <p className={`text-[10px] font-bold mb-1 ${isOwner ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {isOwner ? 'You' : '🛡 Creva Support'}
                        </p>
                        {msg.message && <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.message}</p>}
                        {atts.length > 0 && (
                          <div className="mt-1 space-y-2">
                            {atts.map((att, i) => <AttachmentRenderer key={i} att={att} isOwner={isOwner} />)}
                          </div>
                        )}
                        <p className={`text-[9px] mt-1.5 ${isOwner ? 'text-primary-foreground/50' : 'text-muted-foreground'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={msgEndRef} />
              </div>

              {/* Reply Box */}
              {selected.status !== 'closed' ? (
                <div className="px-5 py-4 border-t border-border bg-background shrink-0 space-y-3">

                  {/* Attachment buttons: file pickers for screenshot/video/doc, live recorder for voice */}
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(ATTACHMENT_TYPES) as [AttachmentCategory, (typeof ATTACHMENT_TYPES)[AttachmentCategory]][]).map(([key, cfg]) => {
                      if (key === 'voice') {
                        return (
                          <VoiceRecorder
                            key="voice"
                            disabled={uploading}
                            onRecorded={att => setAttachments(prev => [...prev, att])}
                          />
                        );
                      }
                      const Icon = cfg.icon;
                      return (
                        <label
                          key={key}
                          title={cfg.desc}
                          className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full border transition-colors select-none ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'} ${cfg.color}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {cfg.label}
                          <input
                            type="file"
                            multiple
                            accept={cfg.accept}
                            disabled={uploading}
                            style={{ display: 'none' }}
                            onChange={e => handleUpload(e, key)}
                          />
                        </label>
                      );
                    })}
                  </div>

                  {/* Upload error */}
                  {uploadError && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="flex-1">{uploadError}</span>
                      <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  )}

                  {/* Attachment previews */}
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-xl border border-border">
                      {attachments.map((att, i) => (
                        <AttachmentPreview key={i} att={att} onRemove={() => removeAttachment(i)} />
                      ))}
                    </div>
                  )}

                  {/* Text area + send button */}
                  <div className="flex gap-2 items-end">
                    <textarea
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSendReply(); }}
                      placeholder="Type your message… (Ctrl+Enter to send)"
                      rows={3}
                      className="flex-1 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none bg-background"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={sending || (!reply.trim() && attachments.length === 0)}
                      className="w-10 h-10 flex items-center justify-center bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[9px] text-muted-foreground">Max 10 MB per file · Ctrl+Enter to send</p>
                </div>
              ) : (
                <div className="px-5 py-4 border-t border-border text-center text-xs text-muted-foreground bg-background">
                  This ticket is closed.{' '}
                  <button onClick={() => setShowNew(true)} className="text-primary font-bold hover:underline">Open a new ticket</button>
                  {' '}if you need more help.
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

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">Describe your issue *</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Describe the problem in detail…"
                  rows={5}
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background resize-none"
                />
              </div>

              {/* Attachment buttons — file pickers + live voice recorder */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Attach files (optional)</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(ATTACHMENT_TYPES) as [AttachmentCategory, (typeof ATTACHMENT_TYPES)[AttachmentCategory]][]).map(([key, cfg]) => {
                    if (key === 'voice') {
                      return (
                        <VoiceRecorder
                          key="voice"
                          disabled={newTicketUploading || creating}
                          onRecorded={att => setNewTicketAttachments(prev => [...prev, att])}
                        />
                      );
                    }
                    const Icon = cfg.icon;
                    return (
                      <label
                        key={key}
                        title={cfg.desc}
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full border transition-colors select-none ${newTicketUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'} ${cfg.color}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                        <input
                          type="file"
                          multiple
                          accept={cfg.accept}
                          disabled={newTicketUploading}
                          style={{ display: 'none' }}
                          onChange={e => handleNewTicketUpload(e, key)}
                        />
                      </label>
                    );
                  })}
                  {newTicketUploading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground self-center" />}
                </div>

                {/* Upload error */}
                {newTicketUploadError && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="flex-1">{newTicketUploadError}</span>
                    <button onClick={() => setNewTicketUploadError(null)}><X className="w-3.5 h-3.5" /></button>
                  </div>
                )}

                {/* Previews */}
                {newTicketAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-xl border border-border">
                    {newTicketAttachments.map((att, i) => (
                      <AttachmentPreview key={i} att={att} onRemove={() => setNewTicketAttachments(prev => prev.filter((_, idx) => idx !== i))} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 pb-1 shrink-0">
              {newTicketError && (
                <div className="flex items-start gap-2 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="flex-1">{newTicketError}</span>
                  <button onClick={() => setNewTicketError(null)}><X className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
            <div className="flex gap-3 p-6 border-t border-border shrink-0">
              <button
                onClick={() => { setShowNew(false); setNewTicketError(null); setNewTicketAttachments([]); setNewTicketUploadError(null); }}
                className="flex-1 border border-border rounded-xl py-2.5 text-sm font-bold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !form.subject.trim() || !form.message.trim()}
                className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creating ? 'Submitting… (may take 30s on first request)' : 'Submit Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Success Confirmation Modal ── */}
      {successTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-md shadow-2xl p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-foreground">Support Request Submitted Successfully</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your support request has been submitted successfully. Our support team will review your issue and respond within 24 hours.
              </p>
              <div className="mt-3 text-xs font-mono text-primary bg-primary/10 rounded-lg px-3 py-1.5 inline-block">
                {successTicket.ticket_number}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSuccessTicket(null)}
                className="flex-1 border border-border rounded-xl py-2.5 text-sm font-bold hover:bg-muted transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => { setSelected(successTicket); setSuccessTicket(null); }}
                className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-bold hover:opacity-90 transition-opacity"
              >
                View Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
