import { NextRequest, NextResponse } from 'next/server';

const RENDER_API = 'https://rentalwebsite-backend-vn40.onrender.com/api';

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
    const res = await fetch(`${RENDER_API}${path}`, {
      method,
      headers,
      body,
      cache: 'no-store',
    });
    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = text; }
    return { ok: res.ok, status: res.status, data };
  } catch (err: any) {
    return { ok: false, status: 502, data: { error: err.message } };
  }
}

// ─── Support-tickets handler ──────────────────────────────────────────────────
// Vercel's server-side fetch sends a CLEAN URL to Render (no /index.php/ prefix),
// so PHP's route parser works correctly with the hyphen-based support-tickets handler.
// Falls back to generic-CRUD approach (support_tickets with underscore) if needed.
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

  // Build the PHP path using HYPHENS — matches PHP's custom support-tickets handler
  let phpPath = '/support-tickets';
  if (ticketId) phpPath += '/' + ticketId;
  if (subAction) phpPath += '/' + subAction;
  if (qs) phpPath += qs;

  // Try the PHP custom handler first
  const result = await phpFetch(method, phpPath, auth, rawBody || undefined);

  // If PHP handled it fine (even 4xx that are real responses like "not found"), return as-is
  // Only fall back if the response looks like a routing/endpoint error
  const isRoutingError =
    !result.ok &&
    (result.status === 404 || result.status === 405) &&
    (typeof result.data?.error === 'string') &&
    (result.data.error.includes('Not Found') || result.data.error.includes('not found'));

  if (!isRoutingError) {
    return new NextResponse(
      typeof result.data === 'string' ? result.data : JSON.stringify(result.data),
      {
        status: result.status,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  // ── Fallback: PHP custom handler missing → use generic CRUD (support_tickets) ──
  // This path is used when Render hasn't yet deployed the custom support-tickets handler.

  const body = rawBody ? (() => { try { return JSON.parse(rawBody); } catch { return {}; } })() : {};

  // GET list
  if (!ticketId && method === 'GET') {
    const r = await phpFetch('GET', `/support_tickets${qs}`, auth);
    return NextResponse.json(Array.isArray(r.data) ? r.data : []);
  }

  // POST create
  if (!ticketId && method === 'POST') {
    const tktId = 'tkt_' + Date.now() + Math.random().toString(36).substring(2, 7);
    const ticket = {
      id: tktId,
      ticket_number: 'TKT-' + Math.floor(100000 + Math.random() * 900000),
      store_id: body.store_id ?? '',
      subject: body.subject ?? '',
      category: body.category ?? 'technical',
      description: body.description ?? '',
      priority: body.priority ?? 'medium',
      status: 'open',
      attachments: JSON.stringify(body.attachments ?? []),
    };
    const r = await phpFetch('POST', '/support_tickets', auth, JSON.stringify(ticket));
    // Fire-and-forget notification
    phpFetch('POST', '/support_notifications', auth, JSON.stringify({
      id: 'notif_' + Date.now(),
      type: 'new_ticket',
      for_role: 'superadmin',
      store_id: body.store_id ?? '',
      ticket_id: tktId,
      title: 'New ticket: ' + (body.subject ?? ''),
      body: 'Category: ' + (body.category ?? ''),
      is_read: false,
    })).catch(() => {});
    return NextResponse.json(r.ok ? r.data : ticket, { status: 201 });
  }

  // GET single ticket + messages
  if (ticketId && !subAction && method === 'GET') {
    const [tr, mr] = await Promise.all([
      phpFetch('GET', `/support_tickets/${ticketId}`, auth),
      phpFetch('GET', `/support_messages?ticket_id=${ticketId}`, auth),
    ]);
    const messages = Array.isArray(mr.data) ? mr.data : [];
    const ticket = tr.ok && tr.data ? tr.data : {};
    return NextResponse.json({ ...ticket, messages });
  }

  // PATCH / PUT
  if (ticketId && !subAction && (method === 'PATCH' || method === 'PUT')) {
    const r = await phpFetch('PUT', `/support_tickets/${ticketId}`, auth, rawBody || undefined);
    return NextResponse.json(r.data ?? {});
  }

  // POST message
  if (ticketId && subAction === 'messages' && method === 'POST') {
    const msgId = 'msg_' + Date.now() + Math.random().toString(36).substring(2, 7);
    const msg = {
      id: msgId,
      ticket_id: ticketId,
      sender_id: body.sender_id ?? '',
      sender_role: body.sender_role ?? 'owner',
      message: body.message ?? '',
      attachments: JSON.stringify(body.attachments ?? []),
    };
    const r = await phpFetch('POST', '/support_messages', auth, JSON.stringify(msg));
    if (body.sender_role === 'superadmin') {
      phpFetch('PUT', `/support_tickets/${ticketId}`, auth, JSON.stringify({ status: 'in_progress' })).catch(() => {});
      phpFetch('POST', '/support_notifications', auth, JSON.stringify({
        id: 'notif_' + Date.now(),
        type: 'new_reply',
        for_role: 'owner',
        store_id: body.store_id ?? '',
        ticket_id: ticketId,
        title: 'Support replied to your ticket',
        body: String(body.message ?? '').substring(0, 120),
        is_read: false,
      })).catch(() => {});
    }
    return NextResponse.json(r.ok ? r.data : msg, { status: 201 });
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

  // Try PHP custom notifications handler first
  let phpPath = '/notifications';
  if (notifId) phpPath += '/' + notifId;
  if (qs) phpPath += qs;

  const result = await phpFetch(method, phpPath, auth, rawBody || undefined);
  const isRoutingError =
    !result.ok &&
    typeof result.data?.error === 'string' &&
    result.data.error.includes('Not Found');

  if (!isRoutingError) {
    return new NextResponse(
      typeof result.data === 'string' ? result.data : JSON.stringify(result.data),
      { status: result.status, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Fallback via generic CRUD (support_notifications)
  if (!notifId && method === 'GET') {
    const r = await phpFetch('GET', `/support_notifications${qs}`, auth);
    return NextResponse.json(Array.isArray(r.data) ? r.data : []);
  }
  if (notifId === 'all' && method === 'DELETE') {
    const body = rawBody ? JSON.parse(rawBody) : {};
    const r = await phpFetch('GET', `/support_notifications?for_role=${body.for_role ?? ''}`, auth);
    if (Array.isArray(r.data)) {
      await Promise.all(r.data.map((n: any) =>
        phpFetch('PUT', `/support_notifications/${n.id}`, auth, JSON.stringify({ is_read: true })),
      ));
    }
    return NextResponse.json({ success: true });
  }
  if (notifId && method === 'PATCH') {
    const r = await phpFetch('PUT', `/support_notifications/${notifId}`, auth, JSON.stringify({ is_read: true }));
    return NextResponse.json(r.data ?? {});
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
