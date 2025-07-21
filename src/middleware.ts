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
    // Validate token format first
    if (!token || typeof token !== 'string' || token.trim() === '') {
      throw new Error('Token is empty or invalid');
    }

    // Use Web Crypto API instead of Node.js crypto for Edge Runtime compatibility
    const secret = process.env.GEOMAP_JWT_SECRET!;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Split the JWT token
    const parts = token.trim().split('.');
    if (parts.length !== 3) {
      throw new Error(`Invalid token format: expected 3 parts, got ${parts.length}. Token: ${token.substring(0, 50)}...`);
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    
    // Verify signature
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    
    const isValid = await crypto.subtle.verify('HMAC', key, signature, data);
    if (!isValid) {
      throw new Error('Invalid signature');
    }

    // Decode payload
    const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson) as AuthToken;

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      const error = new Error('Token expired');
      (error as any).name = 'TokenExpiredError';
      throw error;
    }

    // Verify issuer and audience
    if (payload.iss !== 'onboarding-app' || payload.aud !== 'geomap-app') {
      throw new Error('Invalid issuer or audience');
    }

    // Ensure it's an access token (or no type specified for backward compatibility)
    if (payload.type && payload.type !== 'access') {
      console.error('Token type rejection:', { tokenType: payload.type, expected: 'access' });
      throw new Error(`Invalid token type: expected 'access', got '${payload.type}'`);
    }

    return payload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    if ((error as any).name === 'TokenExpiredError') {
      throw error; // Re-throw to handle specifically
    }
    return null;
  }
}

export async function middleware(request: NextRequest) {
  // Prevent redirect loops - if we're coming from the onboarding app, don't redirect again
  const referer = request.headers.get('referer');
  if (referer && referer.includes(process.env.ONBOARDING_APP_URL || 'localhost:3000')) {
    console.log('Request from onboarding app, allowing through to prevent redirect loop');
    return NextResponse.next();
  }

  // Only protect modification routes
  const protectedPaths = [
    '/api/ccus',
    '/api/production', 
    '/api/storage',
    '/api/ports',
    '/api/plant-form',
    '/plant-form',
    '/port-form'
  ];

  const isProtectedPath = protectedPaths.some(path => {
    if (request.nextUrl.pathname.startsWith(path)) {
      // For API routes, protect POST, PUT, PATCH, DELETE
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
      }
      // For form pages, protect all access
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
  
  // Handle cases where token is the string "null" or "undefined"
  if (token === 'null' || token === 'undefined') {
    token = null;
  }
  
  console.log('Middleware token extraction debug:', {
    authHeader: request.headers.get('authorization'),
    cookie: request.cookies.get('geomap-auth-token')?.value,
    urlParam: request.nextUrl.searchParams.get('token'),
    finalToken: token,
    tokenLength: token?.length,
    tokenParts: token?.split('.').length,
    tokenPreview: token ? token.substring(0, 50) + '...' : null
  });
  
  if (!token) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    } else {
      // Redirect to onboarding app for authentication
      const redirectUrl = `${process.env.ONBOARDING_APP_URL}/auth/authenticate?redirect=${encodeURIComponent(request.url)}`;
      return NextResponse.redirect(redirectUrl);
    }
  }
  
  try {
    const payload = await verifyJWT(token);
    
    if (!payload || !payload.verified || !payload.permissions.includes('edit')) {
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      } else {
        // For insufficient permissions, redirect to authentication (not email verification)
        const redirectUrl = `${process.env.ONBOARDING_APP_URL}/auth/authenticate?redirect=${encodeURIComponent(request.url)}`;
        return NextResponse.redirect(redirectUrl);
      }
    }
    
    // Add user info to request headers for API routes
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.userId);
    response.headers.set('x-user-email', payload.email);
    response.headers.set('x-user-name', payload.name || '');
    
    return response;
  } catch (error) {
    console.error('Token verification failed:', error);
    
    if ((error as any).name === 'TokenExpiredError') {
      // Token expired - redirect to refresh or re-auth
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ 
          error: 'Token expired', 
          code: 'TOKEN_EXPIRED' 
        }, { status: 401 });
      } else {
        const redirectUrl = `${process.env.ONBOARDING_APP_URL}/auth/authenticate?redirect=${encodeURIComponent(request.url)}&reason=token_expired`;
        return NextResponse.redirect(redirectUrl);
      }
    }
    
    // For any other token error (including invalid format), redirect to authentication
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    } else {
      const redirectUrl = `${process.env.ONBOARDING_APP_URL}/auth/authenticate?redirect=${encodeURIComponent(request.url)}`;
      return NextResponse.redirect(redirectUrl);
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
    '/port-form/:path*'
  ]
};
