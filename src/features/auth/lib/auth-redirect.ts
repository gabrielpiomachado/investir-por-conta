const allowedAuthRedirectPaths = new Set([
  '/',
  '/dashboard',
  '/update-password',
]);

const authRedirectBase = 'https://auth-redirect.invalid';

export function getSafeAuthRedirectPath(
  next: string | null,
  fallback: string,
): string {
  if (
    !next ||
    !next.startsWith('/') ||
    next.startsWith('//') ||
    next.includes('\\')
  ) {
    return fallback;
  }

  try {
    const url = new URL(next, authRedirectBase);

    if (
      url.origin !== authRedirectBase ||
      !allowedAuthRedirectPaths.has(url.pathname)
    ) {
      return fallback;
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}
