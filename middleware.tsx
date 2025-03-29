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
    '/contact',// Add other public routes if necessary
  ];

  // Construct the URL pathname
  const path = request.nextUrl.pathname;

  // Allow requests to public paths to pass through
  if (publicPaths.includes(path)) {
    return NextResponse.next();
  }

  // If no token, redirect to the login page
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.nextUrl.origin));
  }

  // Otherwise, continue with the request
  return NextResponse.next();
}

// Apply middleware to all routes except the specified public paths
export const config = {
  matcher: ['//:path*'], // Adjust based on your needs
};