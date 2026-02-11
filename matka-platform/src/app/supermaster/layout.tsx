'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { SMSidebar } from '@/components/supermaster/SMSidebar';
import { SMHeader } from '@/components/supermaster/SMHeader';

export default function SuperMasterLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user } = useAuthStore();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && (!isAuthenticated || user?.role !== 'supermaster')) {
            router.push('/login');
        }
    }, [mounted, isAuthenticated, user, router]);

    if (!mounted || !isAuthenticated || user?.role !== 'supermaster') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C3AED]" />
            </div>
        );
    }

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
