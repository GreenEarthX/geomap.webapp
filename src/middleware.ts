
import { NextRequest, NextResponse } from 'next/server';

interface AuthToken {
  userId: string;
  email: string;
  verified: boolean;
  permissions: string[];
  name?: string;
  exp?: number;
  type?: 'access' | 'refresh';
  iss?: string;
  aud?: string;
}

async function verifyJWT(token: string): Promise<AuthToken | null> {
  try {
    if (!token || typeof token !== 'string' || token.trim() === '') {
      throw new Error('Token is empty or invalid');
    }
    const secret = process.env.GEOMAP_JWT_SECRET!;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const parts = token.trim().split('.');
    if (parts.length !== 3) {
      throw new Error(`Invalid token format: expected 3 parts, got ${parts.length}. Token: ${token.substring(0, 50)}...`);
    }
    const [headerB64, payloadB64, signatureB64] = parts;
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify('HMAC', key, signature, data);
    if (!isValid) {
      throw new Error('Invalid signature');
    }
    const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson) as AuthToken;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      const error = new Error('Token expired');
      (error as any).name = 'TokenExpiredError';
      throw error;
    }
    if (payload.iss !== 'onboarding-app' || payload.aud !== 'geomap-app') {
      throw new Error('Invalid issuer or audience');
    }
    if (payload.type && payload.type !== 'access') {
      console.error('Token type rejection:', { tokenType: payload.type, expected: 'access' });
      throw new Error(`Invalid token type: expected 'access', got '${payload.type}'`);
    }
    return payload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    if ((error as any).name === 'TokenExpiredError') {
      throw error;
    }
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const referer = request.headers.get('referer');
  if (referer && referer.includes(process.env.ONBOARDING_APP_URL || 'localhost:3000')) {
    return NextResponse.next();
  }
  const protectedPaths = [
    '/api/ccus',
    '/api/production',
    '/api/storage',
    '/api/ports',
    '/api/plant-form',
    '/plant-form',
    '/port-form',
    '/admin/:path*'
  ];
  const isProtectedPath = protectedPaths.some(path => {
    if (request.nextUrl.pathname.startsWith(path)) {
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
      }
      return true;
    }
    return false;
  });
  if (!isProtectedPath) {
    return NextResponse.next();
  }
  let token = request.headers.get('authorization')?.replace('Bearer ', '') ||
    request.cookies.get('geomap-auth-token')?.value ||
    request.nextUrl.searchParams.get('token');
  if (token === 'null' || token === 'undefined') {
    token = null;
  }
  if (!token) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    } else {
      const onboardingUrl = process.env.ONBOARDING_APP_URL;
      const geomapUrl = process.env.GEOMAP_URL;
      if (!onboardingUrl || !onboardingUrl.startsWith('http')) {
        return NextResponse.next();
      }
      const currentPageUrl = geomapUrl
        ? `${geomapUrl}${request.nextUrl.pathname}${request.nextUrl.search}`
        : request.url;
      const authUrl = new URL('/auth/authenticate', onboardingUrl);
      authUrl.searchParams.set('redirect', currentPageUrl);
      return NextResponse.redirect(authUrl.toString());
    }
  }
  try {
    const payload = await verifyJWT(token);
    if (!payload || !payload.verified || !payload.permissions.includes('edit')) {
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      } else {
        const onboardingUrl = process.env.ONBOARDING_APP_URL;
        const geomapUrl = process.env.GEOMAP_URL;
        if (!onboardingUrl || !onboardingUrl.startsWith('http')) {
          return NextResponse.next();
        }
        const currentPageUrl = geomapUrl
          ? `${geomapUrl}${request.nextUrl.pathname}${request.nextUrl.search}`
          : request.url;
        const authUrl = new URL('/auth/authenticate', onboardingUrl);
        authUrl.searchParams.set('redirect', currentPageUrl);
        return NextResponse.redirect(authUrl.toString());
      }
    }
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (request.nextUrl.pathname.startsWith('/admin/')) {
      if (!adminEmails.includes(payload.email)) {
        if (request.nextUrl.pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Admin access restricted' }, { status: 403 });
        } else {
          const response = NextResponse.redirect(new URL('/', request.url));
          response.cookies.set('message', 'Nice try user :p', { path: '/', maxAge: 5 });
          return response;
        }
      } else {
        const response = NextResponse.next();
        response.headers.set('x-user-id', payload.userId);
        response.headers.set('x-user-email', payload.email);
        response.headers.set('x-user-name', payload.name || '');
        return response;
      }
    }
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.userId);
    response.headers.set('x-user-email', payload.email);
    response.headers.set('x-user-name', payload.name || '');
    return response;
  } catch (error) {
    if ((error as any).name === 'TokenExpiredError') {
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED' }, { status: 401 });
      } else {
        const onboardingUrl = process.env.ONBOARDING_APP_URL;
        const geomapUrl = process.env.GEOMAP_URL;
        if (!onboardingUrl || !onboardingUrl.startsWith('http')) {
          return NextResponse.next();
        }
        const currentPageUrl = geomapUrl
          ? `${geomapUrl}${request.nextUrl.pathname}${request.nextUrl.search}`
          : request.url;
        const authUrl = new URL('/auth/authenticate', onboardingUrl);
        authUrl.searchParams.set('redirect', currentPageUrl);
        authUrl.searchParams.set('reason', 'token_expired');
        return NextResponse.redirect(authUrl.toString());
      }
    }
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    } else {
      const onboardingUrl = process.env.ONBOARDING_APP_URL;
      const geomapUrl = process.env.GEOMAP_URL;
      if (!onboardingUrl || !onboardingUrl.startsWith('http')) {
        return NextResponse.next();
      }
      const currentPageUrl = geomapUrl
        ? `${geomapUrl}${request.nextUrl.pathname}${request.nextUrl.search}`
        : request.url;
      const authUrl = new URL('/auth/authenticate', onboardingUrl);
      authUrl.searchParams.set('redirect', currentPageUrl);
      return NextResponse.redirect(authUrl.toString());
    }
  }
}

export const config = {
  matcher: [
    '/api/ccus/:path*',
    '/api/production/:path*',
    '/api/storage/:path*',
    '/api/ports/:path*',
    '/api/plant-form/:path*',
    '/plant-form/:path*',
    '/port-form/:path*',
    '/admin/:path*'
  ]
};