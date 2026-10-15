import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';
import { getSafeAuthRedirectPath } from '@/features/auth/lib/auth-redirect';
import { createRequestId, logServerEvent } from '@/lib/server-logger';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const requestId = createRequestId();

  if (!code) {
    logServerEvent('auth.callback', 'rejected', requestId);
    return NextResponse.redirect(new URL('/error', request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    logServerEvent('auth.callback', 'failure', requestId);
    return NextResponse.redirect(new URL('/error', request.url));
  }

  logServerEvent('auth.callback', 'success', requestId);
  const next = getSafeAuthRedirectPath(
    request.nextUrl.searchParams.get('next'),
    '/dashboard',
  );

  return NextResponse.redirect(new URL(next, request.url));
}
