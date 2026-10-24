import { NextResponse } from 'next/server';
import { AUTH_COOKIE } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ status: 'success', message: 'Logged out successfully' });
  response.cookies.set(AUTH_COOKIE, '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  return response;
}
