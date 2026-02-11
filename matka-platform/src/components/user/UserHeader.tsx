'use client';

import { useAuthStore } from '@/store/authStore';
import { useSocketStore } from '@/store/socketStore';
import { Wallet, Coins } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function UserHeader() {
    const { user } = useAuthStore();
    const liveBalance = useSocketStore((s) => s.liveBalance);
    const liveExposure = useSocketStore((s) => s.liveExposure);

    // Flash animation when balance changes
    const [flash, setFlash] = useState(false);
    const prevBalance = useRef(liveBalance);

    useEffect(() => {
        if (liveBalance !== null && prevBalance.current !== null && liveBalance !== prevBalance.current) {
            setFlash(true);
            const timer = setTimeout(() => setFlash(false), 600);
            prevBalance.current = liveBalance;
            return () => clearTimeout(timer);
        }
        prevBalance.current = liveBalance;
    }, [liveBalance]);

    const displayBalance = liveBalance !== null ? liveBalance : 0;
    const displayExposure = liveExposure !== null ? liveExposure : 0;

    return (
        <header className="sticky top-0 z-30 bg-gradient-to-r from-[#059669] to-[#047857] text-white shadow-md">
            <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <p className="text-sm font-semibold">{user?.name || 'Player'}</p>
                        <p className="text-[10px] text-white/70">{user?.user_id || 'USR000'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div
                        className={`flex items-center gap-1 bg-white/15 rounded-full px-3 py-1.5 transition-all duration-300 ${flash ? 'ring-2 ring-white/60 scale-105' : ''
                            }`}
                    >
                        <Coins size={14} />
                        <span className="text-sm font-bold">
                            ₹{displayBalance.toLocaleString('en-IN')}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-white/80">
                        <Wallet size={12} />
                        <span>₹{displayExposure.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
