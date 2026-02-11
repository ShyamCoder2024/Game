'use client';

// src/app/page.tsx
// Root page — redirect based on auth state

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function HomePage() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      const roleRoutes: Record<string, string> = {
        admin: '/admin',
        supermaster: '/supermaster',
        master: '/master',
        user: '/user',
      };
      router.replace(roleRoutes[user.role] || '/login');
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
