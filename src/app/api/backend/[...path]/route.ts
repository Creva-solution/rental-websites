import { NextRequest, NextResponse } from 'next/server';

const RENDER_API = 'https://rentalwebsite-backend-vn40.onrender.com/api';

async function proxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const pathSegments = params.path ?? [];
  const targetUrl = `${RENDER_API}/${pathSegments.join('/')}${req.nextUrl.search}`;

  const forwardHeaders: Record<string, string> = {
    Accept: 'application/json',
  };
  const auth = req.headers.get('authorization');
  if (auth) forwardHeaders['Authorization'] = auth;
  const ct = req.headers.get('content-type');
  if (ct) forwardHeaders['Content-Type'] = ct;

  let body: string | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await req.text();
  }

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
