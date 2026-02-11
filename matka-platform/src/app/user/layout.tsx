'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { UserHeader } from '@/components/user/UserHeader';
import { BottomNav } from '@/components/user/BottomNav';

export default function UserLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user } = useAuthStore();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (mounted && (!isAuthenticated || user?.role !== 'user')) {
            router.push('/login');
        }
    }, [mounted, isAuthenticated, user, router]);

    if (!mounted || !isAuthenticated || user?.role !== 'user') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#059669]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F7FA] max-w-lg mx-auto relative">
            <UserHeader />
            <main className="pb-20 px-4 py-4">{children}</main>
            <BottomNav />
        </div>
    );
}
