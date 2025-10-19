import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const path = request.nextUrl.pathname;

  // Define public paths (exact matches)
  const publicPaths = [
    '/',
    '/login',
    '/signup',
    '/about',
    '/catalogue',
    '/courses', // Public course listing
  ];

  // Define public path patterns (regex-based)
  const publicPatterns = [
    /^\/courses\/[^\/]+\/enroll$/, // Allow /courses/:courseId/enroll
    /^\/courses\/[^\/]+$/, // Allow /courses/:courseId (course details)
    /^\/_next\/.*/, // Next.js internal routes
    /^\/static\/.*/, // Static assets
    /^\/api\/.*/, // API routes (handle auth separately in API routes)
    /^\/favicon\.ico$/, // Favicon
    /^\/.*\.(svg|png|jpg|jpeg|gif|webp|ico)$/, // Image files
  ];

  // Check if path is public (exact match)
  if (publicPaths.includes(path)) {
    return NextResponse.next();
  }

  // Check if path matches public patterns
  const isPublicPattern = publicPatterns.some(pattern => pattern.test(path));
  if (isPublicPattern) {
    return NextResponse.next();
  }

  // Protected routes - require authentication
  const protectedPatterns = [
    /^\/courses\/[^\/]+\/learn/, // Requires auth: /courses/:courseId/learn
    /^\/dashboard/, // Dashboard routes
    /^\/profile/, // Profile routes
    /^\/admin/, // Admin routes
  ];

  const isProtectedRoute = protectedPatterns.some(pattern => pattern.test(path));

  // If it's a protected route and no token, redirect to login
  if (isProtectedRoute && !token) {
    const url = new URL('/login', request.nextUrl.origin);
    // Add return URL so user can be redirected back after login
    url.searchParams.set('returnUrl', path);
    return NextResponse.redirect(url);
  }

  // Allow all other routes (or add more specific logic)
  return NextResponse.next();
}

// Apply middleware to relevant paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};