'use client';

// src/app/admin/layout.tsx
// Admin panel layout — Auth guard + Sidebar + Header + Content

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Sidebar } from '@/components/admin/Sidebar';
import { Header } from '@/components/admin/Header';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !isAuthenticated) {
            router.replace('/login');
        }
    }, [mounted, isAuthenticated, router]);

    // Show nothing while checking auth (prevents flash)
    if (!mounted || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-slate-50">
            {/* Sidebar */}
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
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
