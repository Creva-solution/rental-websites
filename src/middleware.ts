import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  // Exclude Next.js internals, API, and static files
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Detect subdomain
  let subdomain = '';
  
  // 1. Localhost subdomains (e.g. shaj.localhost:3000)
  if (hostname.includes('.localhost:3000')) {
    subdomain = hostname.split('.localhost:3000')[0];
  } else if (hostname.includes('.localhost')) {
    subdomain = hostname.split('.localhost')[0];
  }
  // 2. Production subdomains (e.g. shaj.crevasolution.in)
  else if (hostname.includes('.crevasolution.in')) {
    subdomain = hostname.split('.crevasolution.in')[0];
  }

  // Rewrite to the storefront if there's a valid subdomain
  if (subdomain && subdomain !== 'www' && subdomain !== 'admin') {
    url.pathname = `/store/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};
