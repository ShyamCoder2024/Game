'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { FileText, BookOpen, Target, BookMarked, Lock, LogOut, ChevronRight, User } from 'lucide-react';

const menuItems = [
    { label: 'Statement', href: '/user/profile/statement', icon: FileText, description: 'Financial activity summary' },
    { label: 'Ledger', href: '/user/profile/ledger', icon: BookOpen, description: 'Detailed transaction log' },
    { label: 'Bet History', href: '/user/profile/bets', icon: Target, description: 'Won, lost & pending bets' },
    { label: 'Rules', href: '/user/profile/rules', icon: BookMarked, description: 'Game rules & guidelines' },
    { label: 'Change Password', href: '/user/profile/change-password', icon: Lock, description: 'Update your password' },
];

export default function UserProfilePage() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="space-y-4">
            {/* User Card */}
            <div className="bg-white rounded-2xl p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#059669] to-[#047857] flex items-center justify-center text-white text-xl font-bold">
                    {user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-800">{user?.name || 'Player'}</h2>
                    <p className="text-sm text-gray-500">{user?.user_id || 'USR000'}</p>
                </div>
                <div className="ml-auto">
                    <User size={20} className="text-gray-400" />
                </div>
            </div>

            {/* Menu Items */}
            <div className="bg-white rounded-2xl overflow-hidden divide-y divide-gray-100">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                                <Icon size={18} className="text-[#059669]" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                                <p className="text-xs text-gray-400">{item.description}</p>
                            </div>
                            <ChevronRight size={16} className="text-gray-300" />
                        </Link>
                    );
                })}
            </div>

            {/* Logout */}
            <button
                onClick={handleLogout}
                className="w-full bg-white rounded-2xl px-5 py-4 flex items-center gap-4 hover:bg-red-50 transition-colors"
            >
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                    <LogOut size={18} className="text-red-500" />
                </div>
                <span className="text-sm font-semibold text-red-600">Logout</span>
            </button>
        </div>
    );
}
