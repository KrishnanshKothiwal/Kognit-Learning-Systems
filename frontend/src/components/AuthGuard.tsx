// frontend/src/components/AuthGuard.tsx
'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react'; // For a loading spinner

interface AuthGuardProps {
  children: ReactNode;
  allowedUnauthenticatedPaths?: string[]; // New prop for paths accessible without login
}

export function AuthGuard({ children, allowedUnauthenticatedPaths = ['/', '/login', '/signup'] }: AuthGuardProps) {
  const { isLoggedIn, isLoadingAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoadingAuth) {
      // Still checking auth, do nothing yet
      return;
    }

    const isAuthRoute = allowedUnauthenticatedPaths.includes(pathname);

    if (isLoggedIn) {
      // If logged in and on a login/signup/root page, redirect to dashboard
      if (isAuthRoute && pathname !== '/') { // Don't redirect from root if already on dashboard in another tab
        router.replace('/dashboard');
      }
    } else {
      // If NOT logged in and on a protected route, redirect to login
      if (!isAuthRoute) {
        router.replace('/login');
      }
    }
  }, [isLoggedIn, isLoadingAuth, pathname, router, allowedUnauthenticatedPaths]);

  if (isLoadingAuth) {
    // Show a full-screen loader while authentication status is being determined
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
          <p className="text-lg text-slate-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Render children only if auth check is complete and no redirect happened for protected routes
  return <>{children}</>;
}