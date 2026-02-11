'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { MasterSidebar } from '@/components/master/MasterSidebar';
import { MasterHeader } from '@/components/master/MasterHeader';

export default function MasterLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user } = useAuthStore();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (mounted && (!isAuthenticated || user?.role !== 'master')) {
            router.push('/login');
        }
    }, [mounted, isAuthenticated, user, router]);

    if (!mounted || !isAuthenticated || user?.role !== 'master') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0891B2]" />
            </div>
        );
    }

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
