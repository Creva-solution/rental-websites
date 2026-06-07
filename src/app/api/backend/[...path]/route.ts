import { NextRequest, NextResponse } from 'next/server';

const RENDER_API = 'https://rentalwebsite-backend-vn40.onrender.com/api';

// ─── PHP generic-CRUD helper (support_tickets, support_messages, etc.) ────────
async function php(
  method: string,
  path: string,
  auth: string | null,
  body?: string,
): Promise<any> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (auth) headers['Authorization'] = auth;
  const res = await fetch(`${RENDER_API}${path}`, { method, headers, body, cache: 'no-store' });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

// ─── Support-tickets handler (runs in Next.js — no PHP custom handler needed) ─
async function handleSupportTickets(
  req: NextRequest,
  segments: string[],
  auth: string | null,
): Promise<NextResponse> {
  // segments: ['support-tickets', ticketId?, 'messages'?]
  const ticketId = segments[1] ?? null;
  const subAction = segments[2] ?? null;
  const qs = req.nextUrl.search;
  const method = req.method;

  let rawBody = '';
  if (method !== 'GET' && method !== 'HEAD') rawBody = await req.text();
  const body = rawBody ? (() => { try { return JSON.parse(rawBody); } catch { return {}; } })() : {};

  // GET /support-tickets?store_id=...   (list)
  if (!ticketId && method === 'GET') {
    const data = await php('GET', `/support_tickets${qs}`, auth);
    return NextResponse.json(Array.isArray(data) ? data : []);
  }

  // GET /support-tickets (no filters — superadmin view all)
  // handled above

  // POST /support-tickets  (create)
  if (!ticketId && method === 'POST') {
    const tktId = 'tkt_' + Date.now() + Math.random().toString(36).substring(2, 7);
    const ticketNum = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
    const ticket = {
      id: tktId,
      ticket_number: ticketNum,
      store_id: body.store_id ?? '',
      subject: body.subject ?? '',
      category: body.category ?? 'technical',
      description: body.description ?? '',
      priority: body.priority ?? 'medium',
      status: 'open',
      attachments: JSON.stringify(body.attachments ?? []),
    };
    const created = await php('POST', '/support_tickets', auth, JSON.stringify(ticket));
    // Notify superadmin
    php('POST', '/support_notifications', auth, JSON.stringify({
      id: 'notif_' + Date.now(),
      type: 'new_ticket',
      for_role: 'superadmin',
      store_id: body.store_id ?? '',
      ticket_id: tktId,
      title: 'New ticket: ' + (body.subject ?? ''),
      body: 'Category: ' + (body.category ?? ''),
      is_read: false,
    })).catch(() => {});
    return NextResponse.json(created ?? ticket, { status: 201 });
  }

  // GET /support-tickets/{id}  (ticket + messages)
  if (ticketId && !subAction && method === 'GET') {
    const [ticket, msgs] = await Promise.all([
      php('GET', `/support_tickets/${ticketId}`, auth),
      php('GET', `/support_messages?ticket_id=${ticketId}`, auth).catch(() => []),
    ]);
    const messages = Array.isArray(msgs) ? msgs : [];
    return NextResponse.json(ticket && typeof ticket === 'object' ? { ...ticket, messages } : { messages });
  }

  // PATCH /support-tickets/{id}  (update status/priority)
  if (ticketId && !subAction && (method === 'PATCH' || method === 'PUT')) {
    const updated = await php('PUT', `/support_tickets/${ticketId}`, auth, rawBody);
    return NextResponse.json(updated ?? {});
  }

  // POST /support-tickets/{id}/messages  (reply)
  if (ticketId && subAction === 'messages' && method === 'POST') {
    const msgId = 'msg_' + Date.now() + Math.random().toString(36).substring(2, 7);
    const message = {
      id: msgId,
      ticket_id: ticketId,
      sender_id: body.sender_id ?? '',
      sender_role: body.sender_role ?? 'owner',
      message: body.message ?? '',
      attachments: JSON.stringify(body.attachments ?? []),
    };
    const created = await php('POST', '/support_messages', auth, JSON.stringify(message));
    // If superadmin replied → update ticket status + notify owner
    if (body.sender_role === 'superadmin') {
      php('PUT', `/support_tickets/${ticketId}`, auth, JSON.stringify({ status: 'in_progress' })).catch(() => {});
      php('POST', '/support_notifications', auth, JSON.stringify({
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
    return NextResponse.json(created ?? message, { status: 201 });
  }

  // GET /support-tickets/{id}/messages
  if (ticketId && subAction === 'messages' && method === 'GET') {
    const msgs = await php('GET', `/support_messages?ticket_id=${ticketId}`, auth);
    return NextResponse.json(Array.isArray(msgs) ? msgs : []);
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

  if (!notifId && method === 'GET') {
    const data = await php('GET', `/support_notifications${qs}`, auth);
    return NextResponse.json(Array.isArray(data) ? data : []);
  }
  if (notifId === 'all' && method === 'DELETE') {
    const body = rawBody ? JSON.parse(rawBody) : {};
    const forRole = body.for_role ?? '';
    const data = await php('GET', `/support_notifications?for_role=${forRole}`, auth);
    if (Array.isArray(data)) {
      await Promise.all(data.map((n: any) =>
        php('PUT', `/support_notifications/${n.id}`, auth, JSON.stringify({ is_read: true })).catch(() => {}),
      ));
    }
    return NextResponse.json({ success: true });
  }
  if (notifId && method === 'PATCH') {
    const updated = await php('PUT', `/support_notifications/${notifId}`, auth, JSON.stringify({ is_read: true }));
    return NextResponse.json(updated ?? {});
  }
  return NextResponse.json({ error: 'Notification endpoint not found' }, { status: 404 });
}

// ─── Main proxy handler ───────────────────────────────────────────────────────
async function proxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const pathSegments = params.path ?? [];
  const auth = req.headers.get('authorization');

  // Intercept support-tickets — handled entirely in Next.js
  if (pathSegments[0] === 'support-tickets') {
    return handleSupportTickets(req, pathSegments, auth);
  }

  // Intercept notifications — handled in Next.js (maps to support_notifications generic CRUD)
  if (pathSegments[0] === 'notifications') {
    return handleNotifications(req, pathSegments, auth);
  }

  // All other routes: forward to Render PHP
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
