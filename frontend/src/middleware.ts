import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('session-token')?.value;
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith('/login');

  // Se não tem token e tenta acessar área protegida → login
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se já tem token e acessa login → dashboard
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Rotas admin: verificação best-effort do cookie
  // A proteção real acontece no backend via @PreAuthorize
  // Aqui apenas garantimos que o cookie existe para rotas admin
  if (pathname.startsWith('/dashboard/admin') && !token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
