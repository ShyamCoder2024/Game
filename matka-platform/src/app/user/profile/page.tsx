'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSocketStore } from '@/store/socketStore';
import { api } from '@/lib/api';
import { FileText, BookOpen, Target, BookMarked, Lock, LogOut, ChevronRight, User, Wallet } from 'lucide-react';
import { TrustBadge } from '@/components/ui/TrustBadge';

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
    const liveBalance = useSocketStore((s) => s.liveBalance);
    const setLiveWallet = useSocketStore((s) => s.setLiveWallet);
    const balance = liveBalance ?? 0;

    // Fetch actual balance on mount so it shows correctly even before any WebSocket push
    useEffect(() => {
        api.get<{ wallet_balance: number; exposure: number; available_balance: number }>('/api/user/statement')
            .then((res) => {
                if (res.success && res.data) {
                    setLiveWallet({
                        wallet_balance: res.data.wallet_balance,
                        exposure: res.data.exposure,
                    });
                }
            })
            .catch(() => { /* keep existing value */ });
    }, [setLiveWallet]);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="pb-24 min-h-screen bg-[#F5F7FA]">
            {/* Sticky Header */}
            <div className="sticky top-[70px] z-20 bg-[#F5F7FA]/95 backdrop-blur-md pb-2 pt-4 px-4 mb-4">
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-xl font-black text-[#003366] flex items-center gap-2 tracking-tight">
                            <span className="bg-[#E6F0FF] p-1.5 rounded-lg text-[#003366]">
                                <User size={20} />
                            </span>
                            Profile
                        </h1>
                        <p className="text-[10px] text-gray-400 font-bold tracking-wider uppercase mt-1 ml-1">
                            Manage Account
                        </p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-lg space-y-6">
                {/* User Card */}
                <div className="bg-gradient-to-br from-[#003366] to-[#001f3f] rounded-3xl p-6 text-white shadow-xl shadow-[#003366]/20 relative overflow-hidden">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#059669]/20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-2xl font-black shadow-inner">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight">{user?.name || 'Player'}</h2>
                                <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-2">Member ID: {user?.user_id || 'USR000'}</p>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Active Member
                                </div>
                            </div>
                        </div>

                        {/* Wallet Balance Section */}
                        <div className="text-right">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-2">
                                <Wallet size={20} className="text-emerald-300" />
                            </div>
                            <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Wallet Balance</p>
                            <p className="text-xl font-black text-white leading-tight">₹{balance.toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                </div>

                {/* Menu Items & Logout */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-50">
                        {menuItems.map((item, idx) => {
                            const Icon = item.icon;
                            // Custom colors for specific items
                            let colorClass = 'bg-blue-50 text-blue-600';

                            if (item.label === 'Statement') colorClass = 'bg-blue-50 text-blue-600';
                            else if (item.label === 'Ledger') colorClass = 'bg-orange-50 text-orange-600';
                            else if (item.label === 'Bet History') colorClass = 'bg-emerald-50 text-emerald-600';
                            else if (item.label === 'Rules') colorClass = 'bg-purple-50 text-purple-600';
                            else if (item.label === 'Change Password') colorClass = 'bg-indigo-50 text-indigo-600'; // Changed to Indigo to not clash with Red logout

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center gap-4 p-5 hover:bg-gray-50 transition-all group active:bg-gray-100"
                                >
                                    <div className={`w-10 h-10 rounded-2xl ${colorClass} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-800 group-hover:text-[#003366] transition-colors">
                                            {item.label}
                                        </p>
                                        <p className="text-[11px] text-gray-400 font-medium">
                                            {item.description}
                                        </p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all text-gray-300 group-hover:text-[#003366]">
                                        <ChevronRight size={16} />
                                    </div>
                                </Link>
                            );
                        })}

                        {/* Logout Integrated */}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-4 p-5 hover:bg-red-50 transition-all group active:bg-red-50/50"
                        >
                            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <LogOut size={20} />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-bold text-red-600">Logout</p>
                                <p className="text-[11px] text-red-400 font-medium">Sign out of your account</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-400 group-hover:text-red-600 transition-colors">
                                <ChevronRight size={16} />
                            </div>
                        </button>
                    </div>
                </div>

                <div className="text-center pb-8 space-y-3">
                    <TrustBadge className="mx-auto" />
                    <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                        Version 1.0.0 • Secure
                    </p>
                </div>
            </div>
        </div>
    );
}
