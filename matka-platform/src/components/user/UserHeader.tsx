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
        <header className="fixed top-0 left-0 right-0 bg-[#003366] text-white z-50 shadow-lg px-4 py-5 flex items-center justify-between" style={{ height: '70px' }}>
            <div className="flex items-center justify-between max-w-lg mx-auto w-full">
                <div className="flex items-center gap-2"> {/* Reduced gap for cohesion */}
                    <div className="relative w-10 h-10">
                        {/* Assuming the user will replace logo.png with their brand logo */}
                        <Image
                            src="/logo.png"
                            alt="All India Matka"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold leading-tight tracking-wide font-serif text-[#FFF8E7]">
                            All INDIA
                        </h1>
                        <p className="text-[10px] text-white/80 font-medium tracking-wider">
                            Bet More. Win Money.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/user/notifications" className="relative p-2 rounded-full hover:bg-white/10 transition-colors">
                        <Bell size={24} className="text-[#FFF8E7]" />
                        {hasNotifications && (
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#003366]"></span>
                        )}
                    </Link>

                    <div
                        className={`flex items-center gap-1.5 bg-black/20 border border-white/10 rounded-full px-3 py-1.5 transition-all duration-300 ${flash ? 'ring-2 ring-yellow-400/50 scale-105 bg-black/30' : ''
                            }`}
                    >
                        <Coins size={18} strokeWidth={2.5} className="text-yellow-400" /> {/* Increased size & weight */}
                        <span className="text-sm font-bold text-white">
                            ₹{displayBalance.toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}
