'use client';

// src/app/user/layout.tsx
// FIX: Replaced mounted state with _hasHydrated from authStore to eliminate navigation lag

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { UserHeader } from '@/components/user/UserHeader';
import { BottomNav } from '@/components/user/BottomNav';

export default function UserLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user, _hasHydrated } = useAuthStore();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (_hasHydrated && (!isAuthenticated || user?.role !== 'user')) {
            router.push('/login');
        }
    }, [_hasHydrated, isAuthenticated, user, router]);

    // Only show spinner on initial hydration (first load), not on every navigation
    if (!_hasHydrated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003366]" />
            </div>
        );
    }

    // After hydration, if not authenticated/wrong role, render nothing (redirect is in flight)
    if (!isAuthenticated || user?.role !== 'user') return null;

    return (
        <div className="min-h-screen bg-[#F5F7FA] max-w-lg mx-auto relative">
            <UserHeader />
            <main className="pb-20 pt-[70px]">{children}</main>
            <BottomNav />
        </div>
    );
}
