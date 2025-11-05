'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if current page is login page
    if (pathname === '/login') {
      setIsLoading(false);
      setIsAuthenticated(true);
      return;
    }

    // Check for authentication tokens
    const checkAuth = () => {
      try {
        const participantToken = localStorage.getItem('participant_login_token');
        const adminToken = localStorage.getItem('admin_token');
        
        if (!participantToken && !adminToken) {
          // Not authenticated, redirect to login
          router.replace('/login');
          return;
        }
        
        // Authenticated
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check error:', error);
        router.replace('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#055F3C]"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Only render children if authenticated or on login page
  if (!isAuthenticated && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}
