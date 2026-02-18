'use client';

// src/components/admin/Header.tsx
// Top header — breadcrumbs, user info, role badge, logout

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Menu, LogOut } from 'lucide-react';
import { ROLE_NAMES, PANEL_COLORS } from '@/lib/constants';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const roleColor = user?.role ? PANEL_COLORS[user.role] : '#2563EB';
    const roleName = user?.role ? ROLE_NAMES[user.role] : 'Unknown';

    return (
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shadow-sm">
            {/* Left: Mobile menu + Page title */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <Menu size={20} />
                </button>
                <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                        Welcome back, {user?.name || 'Admin'}
                    </h2>
                    <p className="text-xs text-slate-500 -mt-0.5">
                        {new Date().toLocaleDateString('en-IN', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </p>
                </div>
            </div>

            {/* Right: Notifications + Role + Logout */}
            <div className="flex items-center gap-3">
                {/* Notification bell */}
                <NotificationBell />

                {/* Role badge */}
                <Badge
                    className="hidden sm:inline-flex text-white text-xs font-semibold"
                    style={{ backgroundColor: roleColor }}
                >
                    {roleName}
                </Badge>

                {/* User ID */}
                <span className="hidden md:inline text-sm font-medium text-slate-600">
                    {user?.user_id}
                </span>

                {/* Logout */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                >
                    <LogOut size={16} className="mr-1" />
                    <span className="hidden sm:inline">Logout</span>
                </Button>
            </div>
        </header>
    );
}
