import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  // Define paths that should bypass authentication
  const publicPaths = [
    '/login',
    '/signup',
    '/',
    '/about',
    '/catalogue',
    
    // Add other public routes if necessary
  ];

  // Construct the URL pathname
  const path = request.nextUrl.pathname;

  // Allow requests to public paths to pass through
  if (publicPaths.includes(path)) {
    return NextResponse.next();
  }

  // If no token, redirect to the login page
  if (!token) {
    console.log(`No token found for path: ${path}`); // Debug: Log missing tokens
    return NextResponse.redirect(new URL('/login', request.nextUrl.origin));
  }

  // Otherwise, continue with the request
  return NextResponse.next();
}

// Apply middleware to all routes except the specified public paths (fixed matcher)
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};