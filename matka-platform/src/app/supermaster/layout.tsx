'use client';

// src/app/supermaster/layout.tsx
// FIX: Replaced mounted state with _hasHydrated from authStore to eliminate navigation lag

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { SMSidebar } from '@/components/supermaster/SMSidebar';
import { SMHeader } from '@/components/supermaster/SMHeader';

export default function SuperMasterLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user, _hasHydrated } = useAuthStore();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (_hasHydrated && (!isAuthenticated || user?.role !== 'supermaster')) {
            router.push('/login');
        }
    }, [_hasHydrated, isAuthenticated, user, router]);

    // Only show spinner on initial hydration (first load), not on every navigation
    if (!_hasHydrated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C3AED]" />
            </div>
        );
    }

    // After hydration, if not authenticated/wrong role, render nothing (redirect is in flight)
    if (!isAuthenticated || user?.role !== 'supermaster') return null;

    return (
        <div className="min-h-screen bg-[#F5F7FA]">
            <SMSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="lg:ml-[260px] flex flex-col min-h-screen">
                <SMHeader onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 p-4 lg:p-6">{children}</main>
            </div>
        </div>
    );
}
