import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const path = request.nextUrl.pathname;

  // Define paths that should bypass authentication
  const publicPaths = [
    '/login',
    '/signup',
    '/',
    '/about',
    '/catalogue',
  ];

  // Check for public path matches
  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(publicPath + '/')
  );

  // Check if path matches public patterns (like catalogue with dynamic routes)
  const publicPatterns = [
    /^\/catalogue(\/.*)?$/,  // /catalogue and /catalogue/anything
    /^\/courses\/[^/]+$/,     // /courses/[courseId] - course detail page (if public)
  ];

  const matchesPublicPattern = publicPatterns.some(pattern => pattern.test(path));

  // Allow requests to public paths to pass through
  if (isPublicPath || matchesPublicPattern) {
    return NextResponse.next();
  }

  // Protected paths - require authentication
  const protectedPatterns = [
    /^\/modules(\/.*)?$/,              // /modules and all sub-routes
    /^\/courses\/[^/]+\/learn(\/.*)?$/, // /courses/[courseId]/learn
    /^\/dashboard(\/.*)?$/,            // /dashboard
    /^\/profile(\/.*)?$/,              // /profile
  ];

  const isProtectedPath = protectedPatterns.some(pattern => pattern.test(path));

  // If it's a protected path and no token, redirect to login
  if (isProtectedPath && !token) {
    const loginUrl = new URL('/login', request.nextUrl.origin);
    loginUrl.searchParams.set('redirect', path); // Remember where they wanted to go
    return NextResponse.redirect(loginUrl);
  }

  // For all other paths, check token
  if (!token && !isPublicPath && !matchesPublicPattern) {
    const loginUrl = new URL('/login', request.nextUrl.origin);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  // Continue with the request
  return NextResponse.next();
}

// Apply middleware to all routes except static files and API routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (png, jpg, jpeg, gif, svg, ico, webp)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)',
  ],
};