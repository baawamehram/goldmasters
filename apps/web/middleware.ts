import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    const response = NextResponse.next();
    
    const origin = request.headers.get('origin') || '';
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:4000',
      process.env.CORS_ORIGIN,
      process.env.NEXT_PUBLIC_APP_URL,
    ].filter(Boolean);

    if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
