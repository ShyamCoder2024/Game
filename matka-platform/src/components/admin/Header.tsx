'use client';

// src/components/admin/Header.tsx
// Top header — breadcrumbs, user info, role badge, logout

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
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

    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-4 lg:px-6 shadow-sm transition-all duration-300">
            {/* Left: Mobile menu + Page title */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 rounded-xl transition-all"
                >
                    <Menu size={20} />
                </button>
                <div className="flex flex-col gap-0.5">
                    <h2 className="text-base font-bold text-slate-800 tracking-tight leading-tight">
                        Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{user?.name || 'Admin'}</span>
                    </h2>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                            {time.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <div className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 flex items-center gap-1.5">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                            </span>
                            <span className="text-[10px] font-bold font-mono text-blue-700 tracking-wide">
                                {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Notifications + Role + Logout */}
            <div className="flex items-center gap-3">
                {/* Notification bell */}
                <div className="hover:bg-slate-50 p-1.5 rounded-full transition-colors relative group">
                    {/* <div className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white z-10" /> */}
                    <NotificationBell />
                </div>

                <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

                {/* Role badge */}
                <Badge
                    className="hidden sm:inline-flex text-[10px] font-bold px-2.5 py-0.5 shadow-sm border border-transparent"
                    style={{ backgroundColor: `${roleColor}15`, color: roleColor, borderColor: `${roleColor}30` }}
                >
                    {roleName}
                </Badge>

                {/* User ID */}
                <span className="hidden md:inline-flex items-center justify-center bg-slate-50 border border-slate-200 text-xs font-mono font-medium text-slate-600 px-2 py-0.5 rounded-md">
                    {user?.user_id}
                </span>

                {/* Logout */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="ml-1 text-slate-400 hover:text-red-600 hover:bg-red-50/50 rounded-lg transition-all"
                >
                    <LogOut size={16} strokeWidth={2.5} />
                    <span className="hidden sm:inline ml-2 font-medium">Logout</span>
                </Button>
            </div>
        </header>
    );
}
