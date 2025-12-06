import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API routes to pass through
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Allow the actual survey page
  if (pathname === '/2025/survey') {
    return NextResponse.next();
  }

  // Protect admin routes with cookie-based auth
  if (pathname.startsWith('/admin')) {
    // Allow the login page
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }
    
    // Check for admin auth cookie
    const adminAuth = request.cookies.get('admin_auth');
    if (adminAuth?.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg')
  ) {
    return NextResponse.next();
  }

  // Redirect everything else to /2025/survey
  return NextResponse.redirect(new URL('/2025/survey', request.url));
}

export const config = {
  // Match all paths except static files
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
