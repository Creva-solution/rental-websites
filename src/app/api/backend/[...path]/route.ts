import { NextRequest, NextResponse } from 'next/server';
import { pool, ensureSupportSchema } from '@/lib/renderDb';

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
    const res = await fetch(`${RENDER_API}${path}`, { method, headers, body, cache: 'no-store' });
    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = text; }
    return { ok: res.ok, status: res.status, data };
  } catch (err: any) {
    return { ok: false, status: 502, data: { error: err.message } };
  }
}

// Detect a PHP routing/endpoint-not-found error (vs a real business error like 404 ticket-not-found)
function isPhpRoutingError(r: { ok: boolean; status: number; data: any }): boolean {
  return (
    !r.ok &&
    (r.status === 404 || r.status === 405) &&
    typeof r.data?.error === 'string' &&
    (r.data.error.toLowerCase().includes('not found') ||
      r.data.error.toLowerCase().includes('endpoint'))
  );
}

// ─── Direct-DB helpers (Render PostgreSQL) ────────────────────────────────────

function rowToObj(row: any): any {
  return row;
}

// GET list from support_tickets
async function dbGetTickets(storeId: string | null): Promise<any[]> {
  await ensureSupportSchema();
  const client = await pool.connect();
  try {
    if (storeId) {
      const r = await client.query(
        'SELECT * FROM "support_tickets" WHERE store_id = $1 ORDER BY created_at DESC',
        [storeId],
      );
      return r.rows.map(rowToObj);
    }
    const r = await client.query('SELECT * FROM "support_tickets" ORDER BY created_at DESC');
    return r.rows.map(rowToObj);
  } finally {
    client.release();
  }
}

// GET single ticket + its messages
async function dbGetTicket(ticketId: string): Promise<any | null> {
  await ensureSupportSchema();
  const client = await pool.connect();
  try {
    const [tr, mr] = await Promise.all([
      client.query('SELECT * FROM "support_tickets" WHERE id = $1', [ticketId]),
      client.query('SELECT * FROM "support_messages" WHERE ticket_id = $1 ORDER BY created_at ASC', [ticketId]),
    ]);
    if (tr.rows.length === 0) return null;
    return { ...rowToObj(tr.rows[0]), messages: mr.rows.map(rowToObj) };
  } finally {
    client.release();
  }
}

// POST create ticket (+ optional initial message)
async function dbCreateTicket(body: any): Promise<any> {
  await ensureSupportSchema();
  const tktId  = 'tkt_' + Date.now() + Math.random().toString(36).substring(2, 7);
  const tktNum = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO "support_tickets"
       (id, ticket_number, store_id, owner_id, owner_email, store_name, subject, category, priority, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'open')`,
      [tktId, tktNum,
       body.store_id ?? '', body.owner_id ?? '', body.owner_email ?? '',
       body.store_name ?? '', body.subject ?? '', body.category ?? 'other',
       body.priority ?? 'medium'],
    );
    if (body.message) {
      const msgId = 'msg_' + Date.now() + Math.random().toString(36).substring(2, 7);
      await client.query(
        `INSERT INTO "support_messages"
         (id, ticket_id, sender_id, sender_role, sender_name, message, attachments)
         VALUES ($1,$2,$3,'owner',$4,$5,$6)`,
        [msgId, tktId, body.owner_id ?? '',
         body.sender_name ?? body.store_name ?? '',
         body.message,
         JSON.stringify(body.attachments ?? [])],
      );
    }
    // Superadmin notification (fire-and-forget)
    const nId = 'notif_' + Date.now() + Math.random().toString(36).substring(2, 6);
    client.query(
      `INSERT INTO "support_notifications"
       (id, type, for_role, store_id, ticket_id, title, body)
       VALUES ($1,'new_ticket','superadmin',$2,$3,$4,$5)`,
      [nId, body.store_id ?? '', tktId,
       'New Support Ticket: ' + (body.subject ?? ''),
       'Store "' + (body.store_name ?? '') + '" submitted a ' + (body.category ?? '') + ' ticket.'],
    ).catch(() => {});
    const r = await client.query('SELECT * FROM "support_tickets" WHERE id = $1', [tktId]);
    return r.rows[0];
  } finally {
    client.release();
  }
}

// PATCH ticket (status, priority, etc.)
async function dbUpdateTicket(ticketId: string, updates: any): Promise<any> {
  await ensureSupportSchema();
  const allowed = ['status', 'priority', 'subject', 'category'];
  const sets: string[] = [];
  const vals: any[] = [];
  let i = 1;
  for (const k of allowed) {
    if (updates[k] !== undefined) { sets.push(`"${k}" = $${i++}`); vals.push(updates[k]); }
  }
  if (sets.length === 0) return updates;
  vals.push(ticketId);
  const client = await pool.connect();
  try {
    sets.push(`updated_at = NOW()`);
    await client.query(
      `UPDATE "support_tickets" SET ${sets.join(', ')} WHERE id = $${i}`,
      vals,
    );
    const r = await client.query('SELECT * FROM "support_tickets" WHERE id = $1', [ticketId]);
    return r.rows[0] ?? updates;
  } finally {
    client.release();
  }
}

// POST message to a ticket
async function dbAddMessage(ticketId: string, body: any): Promise<any> {
  await ensureSupportSchema();
  const msgId = 'msg_' + Date.now() + Math.random().toString(36).substring(2, 7);
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO "support_messages"
       (id, ticket_id, sender_id, sender_role, sender_name, message, attachments)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [msgId, ticketId,
       body.sender_id ?? '', body.sender_role ?? 'owner', body.sender_name ?? '',
       body.message ?? '', JSON.stringify(body.attachments ?? [])],
    );
    if (body.sender_role === 'superadmin') {
      await client.query(
        `UPDATE "support_tickets" SET status = 'in_progress', updated_at = NOW() WHERE id = $1`,
        [ticketId],
      );
      const nId = 'notif_' + Date.now() + Math.random().toString(36).substring(2, 6);
      client.query(
        `INSERT INTO "support_notifications"
         (id, type, for_role, store_id, ticket_id, title, body)
         VALUES ($1,'new_reply','owner',$2,$3,$4,$5)`,
        [nId, body.store_id ?? '', ticketId,
         'Support replied to your ticket',
         String(body.message ?? '').substring(0, 120)],
      ).catch(() => {});
    }
    const r = await client.query('SELECT * FROM "support_messages" WHERE id = $1', [msgId]);
    return r.rows[0] ?? { id: msgId, ticket_id: ticketId, message: body.message };
  } finally {
    client.release();
  }
}

// GET notifications
async function dbGetNotifications(forRole: string | null, storeId: string | null): Promise<any[]> {
  await ensureSupportSchema();
  const client = await pool.connect();
  try {
    const conditions: string[] = [];
    const vals: any[] = [];
    if (forRole) { conditions.push(`for_role = $${vals.length + 1}`); vals.push(forRole); }
    if (storeId) { conditions.push(`store_id = $${vals.length + 1}`); vals.push(storeId); }
    const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
    const r = await client.query(
      `SELECT * FROM "support_notifications"${where} ORDER BY created_at DESC LIMIT 50`,
      vals,
    );
    return r.rows.map(rowToObj);
  } finally {
    client.release();
  }
}

// Mark notifications read
async function dbMarkNotifsRead(notifId: string | null, forRole: string | null): Promise<void> {
  await ensureSupportSchema();
  const client = await pool.connect();
  try {
    if (notifId) {
      await client.query('UPDATE "support_notifications" SET is_read = TRUE WHERE id = $1', [notifId]);
    } else if (forRole) {
      await client.query('UPDATE "support_notifications" SET is_read = TRUE WHERE for_role = $1', [forRole]);
    }
  } finally {
    client.release();
  }
}

// ─── Support-tickets handler ──────────────────────────────────────────────────
async function handleSupportTickets(
  req: NextRequest,
  segments: string[],
  auth: string | null,
): Promise<NextResponse> {
  const ticketId  = segments[1] ?? null;
  const subAction = segments[2] ?? null;
  const qs        = req.nextUrl.search;
  const method    = req.method;

  let rawBody = '';
  if (method !== 'GET' && method !== 'HEAD') rawBody = await req.text();

  // ── Phase 1: try PHP (works once Render deploys new code) ─────────────────
  let phpPath = '/support-tickets';
  if (ticketId)  phpPath += '/' + ticketId;
  if (subAction) phpPath += '/' + subAction;
  if (qs)        phpPath += qs;

  const phpResult = await phpFetch(method, phpPath, auth, rawBody || undefined);
  if (!isPhpRoutingError(phpResult)) {
    return new NextResponse(
      typeof phpResult.data === 'string' ? phpResult.data : JSON.stringify(phpResult.data),
      { status: phpResult.status, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ── Phase 2: PHP routing failed → direct Render PostgreSQL ───────────────
  const body = rawBody ? (() => { try { return JSON.parse(rawBody); } catch { return {}; } })() : {};
  const qp   = new URLSearchParams(qs.replace(/^\?/, ''));

  try {
    // GET /support-tickets
    if (!ticketId && method === 'GET') {
      const rows = await dbGetTickets(qp.get('store_id'));
      return NextResponse.json(rows);
    }

    // POST /support-tickets
    if (!ticketId && method === 'POST') {
      const created = await dbCreateTicket(body);
      return NextResponse.json(created, { status: 201 });
    }

    // GET /support-tickets/:id
    if (ticketId && !subAction && method === 'GET') {
      const ticket = await dbGetTicket(ticketId);
      if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      return NextResponse.json(ticket);
    }

    // PATCH/PUT /support-tickets/:id
    if (ticketId && !subAction && (method === 'PATCH' || method === 'PUT')) {
      const updated = await dbUpdateTicket(ticketId, body);
      return NextResponse.json(updated);
    }

    // POST /support-tickets/:id/messages
    if (ticketId && subAction === 'messages' && method === 'POST') {
      const msg = await dbAddMessage(ticketId, body);
      return NextResponse.json(msg, { status: 201 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Database error: ' + err.message }, { status: 500 });
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
  const qs      = req.nextUrl.search;
  const method  = req.method;
  let rawBody = '';
  if (method !== 'GET' && method !== 'HEAD') rawBody = await req.text();

  // ── Phase 1: try PHP ──────────────────────────────────────────────────────
  let phpPath = '/notifications';
  if (notifId) phpPath += '/' + notifId;
  if (qs)      phpPath += qs;

  const phpResult = await phpFetch(method, phpPath, auth, rawBody || undefined);
  if (!isPhpRoutingError(phpResult)) {
    return new NextResponse(
      typeof phpResult.data === 'string' ? phpResult.data : JSON.stringify(phpResult.data),
      { status: phpResult.status, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ── Phase 2: direct Render PostgreSQL ────────────────────────────────────
  const qp = new URLSearchParams(qs.replace(/^\?/, ''));
  const body = rawBody ? (() => { try { return JSON.parse(rawBody); } catch { return {}; } })() : {};

  try {
    if (!notifId && method === 'GET') {
      const rows = await dbGetNotifications(qp.get('for_role'), qp.get('store_id'));
      return NextResponse.json(rows);
    }
    if (notifId && notifId !== 'all' && method === 'PATCH') {
      await dbMarkNotifsRead(notifId, null);
      return NextResponse.json({ success: true });
    }
    if (notifId === 'all' && method === 'DELETE') {
      const role = body.for_role ?? qp.get('for_role') ?? 'superadmin';
      await dbMarkNotifsRead(null, role);
      return NextResponse.json({ success: true });
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Database error: ' + err.message }, { status: 500 });
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
