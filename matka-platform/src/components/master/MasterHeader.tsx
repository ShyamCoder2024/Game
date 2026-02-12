'use client';

import { useAuthStore } from '@/store/authStore';
import { useSocketStore } from '@/store/socketStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Menu, LogOut, Bell, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MasterHeaderProps {
    onMenuClick: () => void;
}

export function MasterHeader({ onMenuClick }: MasterHeaderProps) {
    const { user, logout } = useAuthStore();
    const liveBalance = useSocketStore((s) => s.liveBalance);
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const today = new Date().toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    return (
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 shadow-sm px-4 lg:px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
                    <Menu size={20} />
                </button>
                <div>
                    <h2 className="text-sm font-semibold text-gray-800">Welcome, {user?.name || 'Master'}</h2>
                    <p className="text-xs text-gray-500">{today}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                    <Bell size={18} className="text-gray-600" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[#0891B2] rounded-full" />
                </button>
                <div className="flex items-center gap-1.5 bg-[#0891B2]/10 text-[#0891B2] rounded-full px-3 py-1 text-xs font-bold">
                    <Wallet size={13} />
                    ₹{(liveBalance ?? 0).toLocaleString('en-IN')}
                </div>
                <Badge className="text-xs text-white" style={{ backgroundColor: '#0891B2' }}>Master</Badge>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-600 hover:text-red-600">
                    <LogOut size={16} className="mr-1" /> Logout
                </Button>
            </div>
        </header>
    );
}
