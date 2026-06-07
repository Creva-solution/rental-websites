import { NextRequest, NextResponse } from 'next/server';

const RENDER_API = 'https://rentalwebsite-backend-vn40.onrender.com/api';
const SUPABASE_URL = 'https://yovgvheilukjpysscmkv.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Forward a request to Render PHP and return parsed JSON (or raw text on failure)
async function phpFetch(
  method: string,
  path: string,
  auth: string | null,
  body?: string,
): Promise<{ ok: boolean; status: number; data: any }> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (auth) headers['Authorization'] = auth;
  try {
    const res = await fetch(`${RENDER_API}${path}`, { method, headers, body, cache: 'no-store' });
    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = text; }
    return { ok: res.ok, status: res.status, data };
  } catch (err: any) {
    return { ok: false, status: 502, data: { error: err.message } };
  }
}

// Call Supabase PostgREST directly (fallback when PHP routing is broken)
async function sbFetch(
  method: string,
  table: string,
  query: string,
  body?: string,
  prefer = 'return=representation',
): Promise<{ ok: boolean; status: number; data: any }> {
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Prefer: prefer,
  };
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
      method, headers, body, cache: 'no-store',
    });
    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = text; }
    return { ok: res.ok, status: res.status, data };
  } catch (err: any) {
    return { ok: false, status: 502, data: { error: err.message } };
  }
}

// Detect a PHP routing/endpoint-not-found error (vs a real business error)
function isPhpRoutingError(result: { ok: boolean; status: number; data: any }): boolean {
  return (
    !result.ok &&
    (result.status === 404 || result.status === 405) &&
    typeof result.data?.error === 'string' &&
    (result.data.error.toLowerCase().includes('not found') ||
      result.data.error.toLowerCase().includes('endpoint'))
  );
}

// ─── Support-tickets handler ──────────────────────────────────────────────────
// 1. Try PHP's custom support-tickets handler (hyphen URL).
// 2. If PHP returns a routing error (Render's PHP is on old code without the handler),
//    fall back to Supabase PostgREST which stores data persistently.
async function handleSupportTickets(
  req: NextRequest,
  segments: string[],
  auth: string | null,
): Promise<NextResponse> {
  const ticketId = segments[1] ?? null;
  const subAction = segments[2] ?? null;
  const qs = req.nextUrl.search;
  const method = req.method;

  let rawBody = '';
  if (method !== 'GET' && method !== 'HEAD') rawBody = await req.text();

  // ── Phase 1: try PHP ──────────────────────────────────────────────────────
  let phpPath = '/support-tickets';
  if (ticketId) phpPath += '/' + ticketId;
  if (subAction) phpPath += '/' + subAction;
  if (qs) phpPath += qs;

  const phpResult = await phpFetch(method, phpPath, auth, rawBody || undefined);
  if (!isPhpRoutingError(phpResult)) {
    // PHP handled it (success or real business error like 404 ticket-not-found) — pass through
    return new NextResponse(
      typeof phpResult.data === 'string' ? phpResult.data : JSON.stringify(phpResult.data),
      { status: phpResult.status, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ── Phase 2: PHP routing failed → use Supabase PostgREST ─────────────────
  const body = rawBody ? (() => { try { return JSON.parse(rawBody); } catch { return {}; } })() : {};
  const qp = new URLSearchParams(qs.replace(/^\?/, ''));

  // GET /support-tickets  (list, optionally filtered by store_id)
  if (!ticketId && method === 'GET') {
    const storeId = qp.get('store_id');
    const filter = storeId ? `?store_id=eq.${encodeURIComponent(storeId)}&order=created_at.desc` : '?order=created_at.desc';
    const r = await sbFetch('GET', 'support_tickets', filter);
    return NextResponse.json(Array.isArray(r.data) ? r.data : [], { status: r.ok ? 200 : r.status });
  }

  // POST /support-tickets  (create new ticket + initial message)
  if (!ticketId && method === 'POST') {
    const tktId = 'tkt_' + Date.now() + Math.random().toString(36).substring(2, 7);
    const tktNum = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
    const ticket = {
      id: tktId,
      ticket_number: tktNum,
      store_id: body.store_id ?? '',
      owner_id: body.owner_id ?? '',
      owner_email: body.owner_email ?? '',
      store_name: body.store_name ?? '',
      subject: body.subject ?? '',
      category: body.category ?? 'other',
      priority: body.priority ?? 'medium',
      status: 'open',
    };
    const tr = await sbFetch('POST', 'support_tickets', '', JSON.stringify(ticket));
    if (!tr.ok) {
      return NextResponse.json(
        { error: 'Failed to create ticket. Please run the Supabase setup SQL first.' },
        { status: 500 },
      );
    }
    // Insert the initial message if provided
    if (body.message) {
      const msgId = 'msg_' + Date.now() + Math.random().toString(36).substring(2, 7);
      sbFetch('POST', 'support_messages', '', JSON.stringify({
        id: msgId,
        ticket_id: tktId,
        sender_id: body.owner_id ?? '',
        sender_role: 'owner',
        sender_name: body.sender_name ?? body.store_name ?? '',
        message: body.message,
        attachments: JSON.stringify(body.attachments ?? []),
      })).catch(() => {});
    }
    // Create superadmin notification
    sbFetch('POST', 'support_notifications', '', JSON.stringify({
      id: 'notif_' + Date.now() + Math.random().toString(36).substring(2, 6),
      type: 'new_ticket',
      for_role: 'superadmin',
      store_id: body.store_id ?? '',
      ticket_id: tktId,
      title: 'New Support Ticket: ' + (body.subject ?? ''),
      body: 'Store "' + (body.store_name ?? '') + '" submitted a ' + (body.category ?? '') + ' ticket.',
      is_read: false,
    })).catch(() => {});
    const created = Array.isArray(tr.data) ? tr.data[0] : (tr.data ?? ticket);
    return NextResponse.json(created, { status: 201 });
  }

  // GET /support-tickets/:id  (single ticket with messages)
  if (ticketId && !subAction && method === 'GET') {
    const [tr, mr] = await Promise.all([
      sbFetch('GET', 'support_tickets', `?id=eq.${ticketId}`),
      sbFetch('GET', 'support_messages', `?ticket_id=eq.${ticketId}&order=created_at.asc`),
    ]);
    const ticketRow = Array.isArray(tr.data) ? tr.data[0] : null;
    const messages = Array.isArray(mr.data) ? mr.data : [];
    if (!ticketRow) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    return NextResponse.json({ ...ticketRow, messages });
  }

  // PATCH/PUT /support-tickets/:id  (update status/priority)
  if (ticketId && !subAction && (method === 'PATCH' || method === 'PUT')) {
    const r = await sbFetch('PATCH', 'support_tickets', `?id=eq.${ticketId}`, rawBody || undefined, 'return=representation');
    const updated = Array.isArray(r.data) ? r.data[0] : r.data;
    return NextResponse.json(updated ?? {});
  }

  // POST /support-tickets/:id/messages  (add a reply)
  if (ticketId && subAction === 'messages' && method === 'POST') {
    const msgId = 'msg_' + Date.now() + Math.random().toString(36).substring(2, 7);
    const msg = {
      id: msgId,
      ticket_id: ticketId,
      sender_id: body.sender_id ?? '',
      sender_role: body.sender_role ?? 'owner',
      sender_name: body.sender_name ?? '',
      message: body.message ?? '',
      attachments: JSON.stringify(body.attachments ?? []),
    };
    const r = await sbFetch('POST', 'support_messages', '', JSON.stringify(msg));
    if (body.sender_role === 'superadmin') {
      // Mark ticket in_progress and notify owner
      sbFetch('PATCH', 'support_tickets', `?id=eq.${ticketId}`,
        JSON.stringify({ status: 'in_progress' }), 'return=minimal').catch(() => {});
      sbFetch('POST', 'support_notifications', '', JSON.stringify({
        id: 'notif_' + Date.now() + Math.random().toString(36).substring(2, 6),
        type: 'new_reply',
        for_role: 'owner',
        store_id: body.store_id ?? '',
        ticket_id: ticketId,
        title: 'Support replied to your ticket',
        body: String(body.message ?? '').substring(0, 120),
        is_read: false,
      })).catch(() => {});
    }
    const created = Array.isArray(r.data) ? r.data[0] : (r.data ?? msg);
    return NextResponse.json(created, { status: 201 });
  }

  return NextResponse.json({ error: 'Support endpoint not found' }, { status: 404 });
}

// ─── Notifications handler ────────────────────────────────────────────────────
async function handleNotifications(
  req: NextRequest,
  segments: string[],
  auth: string | null,
): Promise<NextResponse> {
  const notifId = segments[1] ?? null;
  const qs = req.nextUrl.search;
  const method = req.method;
  let rawBody = '';
  if (method !== 'GET' && method !== 'HEAD') rawBody = await req.text();

  // ── Phase 1: try PHP ──────────────────────────────────────────────────────
  let phpPath = '/notifications';
  if (notifId) phpPath += '/' + notifId;
  if (qs) phpPath += qs;

  const phpResult = await phpFetch(method, phpPath, auth, rawBody || undefined);
  if (!isPhpRoutingError(phpResult)) {
    return new NextResponse(
      typeof phpResult.data === 'string' ? phpResult.data : JSON.stringify(phpResult.data),
      { status: phpResult.status, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ── Phase 2: Supabase fallback ────────────────────────────────────────────
  const qp = new URLSearchParams(qs.replace(/^\?/, ''));

  // GET /notifications
  if (!notifId && method === 'GET') {
    const filters: string[] = ['order=created_at.desc', 'limit=50'];
    const forRole = qp.get('for_role');
    const storeId = qp.get('store_id');
    if (forRole) filters.unshift(`for_role=eq.${encodeURIComponent(forRole)}`);
    if (storeId) filters.unshift(`store_id=eq.${encodeURIComponent(storeId)}`);
    const r = await sbFetch('GET', 'support_notifications', '?' + filters.join('&'));
    return NextResponse.json(Array.isArray(r.data) ? r.data : []);
  }

  // PATCH /notifications/:id  (mark single read)
  if (notifId && notifId !== 'all' && method === 'PATCH') {
    await sbFetch('PATCH', 'support_notifications', `?id=eq.${notifId}`,
      JSON.stringify({ is_read: true }), 'return=minimal');
    return NextResponse.json({ success: true });
  }

  // DELETE /notifications/all  (mark all read for a role)
  if (notifId === 'all' && method === 'DELETE') {
    const body = rawBody ? (() => { try { return JSON.parse(rawBody); } catch { return {}; } })() : {};
    const role = body.for_role ?? qp.get('for_role') ?? 'superadmin';
    await sbFetch('PATCH', 'support_notifications',
      `?for_role=eq.${encodeURIComponent(role)}`,
      JSON.stringify({ is_read: true }), 'return=minimal');
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Notification endpoint not found' }, { status: 404 });
}

// ─── Main proxy ───────────────────────────────────────────────────────────────
async function proxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const pathSegments = params.path ?? [];
  const auth = req.headers.get('authorization');

  if (pathSegments[0] === 'support-tickets') {
    return handleSupportTickets(req, pathSegments, auth);
  }
  if (pathSegments[0] === 'notifications') {
    return handleNotifications(req, pathSegments, auth);
  }

  // Generic passthrough for all other routes
  const targetUrl = `${RENDER_API}/${pathSegments.join('/')}${req.nextUrl.search}`;
  const forwardHeaders: Record<string, string> = { Accept: 'application/json' };
  if (auth) forwardHeaders['Authorization'] = auth;
  const ct = req.headers.get('content-type');
  if (ct) forwardHeaders['Content-Type'] = ct;

  let body: string | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') body = await req.text();

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
      cache: 'no-store',
    });
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Proxy error: ' + err.message }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
