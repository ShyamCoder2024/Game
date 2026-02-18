'use client';

// src/app/master/layout.tsx
// FIX: Replaced mounted state with _hasHydrated from authStore to eliminate navigation lag

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { MasterSidebar } from '@/components/master/MasterSidebar';
import { MasterHeader } from '@/components/master/MasterHeader';

export default function MasterLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user, _hasHydrated } = useAuthStore();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (_hasHydrated && (!isAuthenticated || user?.role !== 'master')) {
            router.push('/login');
        }
    }, [_hasHydrated, isAuthenticated, user, router]);

    // Only show spinner on initial hydration (first load), not on every navigation
    if (!_hasHydrated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0891B2]" />
            </div>
        );
    }

    // After hydration, if not authenticated/wrong role, render nothing (redirect is in flight)
    if (!isAuthenticated || user?.role !== 'master') return null;

    return (
        <div className="min-h-screen bg-[#F5F7FA]">
            <MasterSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="lg:ml-[260px] flex flex-col min-h-screen">
                <MasterHeader onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 p-4 lg:p-6">{children}</main>
            </div>
        </div>
    );
}
