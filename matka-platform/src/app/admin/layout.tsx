'use client';

// src/app/admin/layout.tsx
// Admin panel layout — Auth guard + Sidebar + Header + Content
// FIX: Replaced mounted state with _hasHydrated from authStore to eliminate navigation lag

import { useEffect } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Sidebar } from '@/components/admin/Sidebar';
import { Header } from '@/components/admin/Header';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, _hasHydrated } = useAuthStore();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (_hasHydrated && !isAuthenticated) {
            router.replace('/login');
        }
    }, [_hasHydrated, isAuthenticated, router]);

    // Only show spinner on initial hydration (first load), not on every navigation
    if (!_hasHydrated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // After hydration, if not authenticated, render nothing (redirect is in flight)
    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Sidebar */}
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden lg:ml-64">
                {/* Header */}
                <Header onMenuClick={() => setSidebarOpen(true)} />

                {/* Page content */}
                <main className="flex-1 overflow-auto p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
