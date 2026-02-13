'use client';

import { useAuthStore } from '@/store/authStore';
import { useSocketStore } from '@/store/socketStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Menu, LogOut, Bell, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SMHeaderProps {
    onMenuClick: () => void;
}

export function SMHeader({ onMenuClick }: SMHeaderProps) {
    const { user, logout } = useAuthStore();
    const liveBalance = useSocketStore((s) => s.liveBalance);
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const today = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm px-4 py-3 lg:px-6 lg:h-16 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center justify-between w-full lg:w-auto">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 -ml-2 hover:bg-gray-100 rounded-lg"
                    >
                        <Menu size={24} className="text-gray-700" />
                    </button>
                    <div>
                        <h2 className="text-sm font-bold text-gray-800 leading-tight">
                            {user?.name || 'Super Master'}
                        </h2>
                        <p className="text-[10px] text-gray-500 font-medium hidden sm:block">{today}</p>
                    </div>
                </div>

                {/* Mobile-only right section */}
                <div className="flex items-center gap-2 lg:hidden">
                    <div className="flex items-center gap-1.5 bg-[#7C3AED]/10 text-[#7C3AED] rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap">
                        <Wallet size={12} />
                        ₹{(liveBalance ?? 0).toLocaleString('en-IN')}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>

            {/* Desktop Action Section - Hidden on Mobile */}
            <div className="hidden lg:flex items-center gap-3">
                <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Bell size={18} className="text-gray-600" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[#7C3AED] rounded-full" />
                </button>
                <div className="flex items-center gap-1.5 bg-[#7C3AED]/10 text-[#7C3AED] rounded-full px-3 py-1 text-xs font-bold">
                    <Wallet size={14} />
                    ₹{(liveBalance ?? 0).toLocaleString('en-IN')}
                </div>
                <Badge
                    className="text-xs text-white px-3 py-0.5"
                    style={{ backgroundColor: '#7C3AED' }}
                >
                    Super Master
                </Badge>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                >
                    <LogOut size={16} className="mr-1.5" />
                    Logout
                </Button>
            </div>
        </header>
    );
}
