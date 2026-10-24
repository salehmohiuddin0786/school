import { NextResponse } from 'next/server';

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(request) {
  const token = request.cookies.get('sms_auth_token')?.value;
  const { pathname } = request.nextUrl;

  const payload = token ? decodeJwtPayload(token) : null;
  const isTokenValid = !!(payload && payload.exp && payload.exp * 1000 > Date.now());

  // If user is already logged in and visits /login, redirect to their role portal
  if (pathname === '/login' && isTokenValid) {
    const target = payload.role ? `/${payload.role}` : '/admin';
    return NextResponse.redirect(new URL(target, request.url));
  }

  const protectedPrefixes = ['/admin', '/teacher', '/student', '/owner'];
  const isProtected = protectedPrefixes.some(prefix => pathname.startsWith(prefix));

  // If unauthenticated, redirect to login
  if (isProtected) {
    if (!token || !isTokenValid) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      if (token && !isTokenValid) {
        response.cookies.delete('sms_auth_token');
      }
      return response;
    }

    // Role-based authorization enforcement
    const userRole = payload.role;
    if (pathname.startsWith('/admin') && userRole !== 'admin' && userRole !== 'owner') {
      return NextResponse.redirect(new URL(`/${userRole || 'student'}`, request.url));
    }
    if (pathname.startsWith('/owner') && userRole !== 'owner' && userRole !== 'admin') {
      return NextResponse.redirect(new URL(`/${userRole || 'student'}`, request.url));
    }
    if (pathname.startsWith('/teacher') && userRole !== 'teacher' && userRole !== 'admin') {
      return NextResponse.redirect(new URL(`/${userRole || 'student'}`, request.url));
    }
    if (pathname.startsWith('/student') && userRole !== 'student' && userRole !== 'admin') {
      return NextResponse.redirect(new URL(`/${userRole || 'teacher'}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/teacher/:path*', '/student/:path*', '/owner/:path*', '/login'],
};
