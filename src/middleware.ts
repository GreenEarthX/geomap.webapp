import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only protect /plant-form/* routes
  if (request.nextUrl.pathname.startsWith('/plant-form')) {
    // Check for next-auth session cookie (default name)
    const sessionToken = request.cookies.get('next-auth.session-token')?.value;
    if (!sessionToken) {
      // Not authenticated, redirect to onboarding app authenticate
      const callbackUrl = encodeURIComponent(`http://localhost:3001${request.nextUrl.pathname}`);
      return NextResponse.redirect(`http://localhost:3000/auth/authenticate?callbackUrl=${callbackUrl}`);
    }
    // Optionally, you could verify the token with onboarding app API here
    // For minimal effort, just check presence of cookie
  }
  return NextResponse.next();
}
