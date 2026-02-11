'use client';

import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Menu, LogOut, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SMHeaderProps {
    onMenuClick: () => void;
}

export function SMHeader({ onMenuClick }: SMHeaderProps) {
    const { user, logout } = useAuthStore();
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
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 shadow-sm px-4 lg:px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                    <Menu size={20} />
                </button>
                <div>
                    <h2 className="text-sm font-semibold text-gray-800">
                        Welcome, {user?.name || 'Super Master'}
                    </h2>
                    <p className="text-xs text-gray-500">{today}</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                    <Bell size={18} className="text-gray-600" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[#7C3AED] rounded-full" />
                </button>
                <Badge
                    className="text-xs text-white"
                    style={{ backgroundColor: '#7C3AED' }}
                >
                    Super Master
                </Badge>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-red-600"
                >
                    <LogOut size={16} className="mr-1" />
                    Logout
                </Button>
            </div>
        </header>
    );
}
