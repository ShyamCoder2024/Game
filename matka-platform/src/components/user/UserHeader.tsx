'use client';

import { useAuthStore } from '@/store/authStore';
import { Wallet, Coins } from 'lucide-react';

export function UserHeader() {
    const { user } = useAuthStore();

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
                    <div className="flex items-center gap-1 bg-white/15 rounded-full px-3 py-1.5">
                        <Coins size={14} />
                        <span className="text-sm font-bold">₹25,000</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-white/80">
                        <Wallet size={12} />
                        <span>₹5,000</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
