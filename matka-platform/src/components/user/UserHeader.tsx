'use client';

import { useSocketStore } from '@/store/socketStore';
import Image from 'next/image';
import { Coins, Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export function UserHeader() {
    const liveBalance = useSocketStore((s) => s.liveBalance);
    // Flash animation when balance changes
    const [flash, setFlash] = useState(false);
    const prevBalance = useRef(liveBalance);
    const [hasNotifications, setHasNotifications] = useState(false);

    useEffect(() => {
        if (liveBalance !== null && prevBalance.current !== null && liveBalance !== prevBalance.current) {
            setFlash(true);
            const timer = setTimeout(() => setFlash(false), 600);
            prevBalance.current = liveBalance;
            return () => clearTimeout(timer);
        }
        prevBalance.current = liveBalance;
    }, [liveBalance]);

    useEffect(() => {
        const checkNotifications = async () => {
            try {
                const res = await api.get<any[]>('/api/user/announcements');
                if (res.success && res.data && res.data.length > 0) {
                    setHasNotifications(true);
                }
            } catch (error) {
                console.error('Failed to fetch notifications', error);
            }
        };
        checkNotifications();
    }, []);

    const displayBalance = liveBalance !== null ? liveBalance : 0;

    return (
        <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-100 z-50 px-4 py-3 flex items-center justify-between" style={{ height: '80px' }}>
            <div className="flex items-center justify-between mx-auto w-full">
                <div className="relative w-72 h-[72px]">
                    <Image
                        src="/Logo.png"
                        alt="All India Matka"
                        fill
                        className="object-contain object-left"
                        priority
                        unoptimized
                    />
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/user/notifications" className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
                        <Bell size={24} className="text-slate-900" />
                        {hasNotifications && (
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
                        )}
                    </Link>

                    <div
                        className={`flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-full px-3 py-1.5 transition-all duration-300 ${flash ? 'ring-2 ring-yellow-400/50 scale-105 bg-yellow-50' : ''
                            }`}
                    >
                        <Coins size={18} strokeWidth={2.5} className="text-yellow-600" />
                        <span className="text-sm font-bold text-slate-900">
                            ₹{displayBalance.toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}
